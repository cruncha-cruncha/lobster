use std::sync::Arc;

use crate::db_structs::{abuse, abuse_comment, abuse_status};
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::resource_type};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};

const PAGE_SIZE: i64 = 20;

pub async fn get_status_options(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<abuse_status::AbuseStatus>>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        abuse_status::AbuseStatus,
        r#"
        SELECT * FROM abuse_status;
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(rows))
}

pub async fn get_resource_options(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<resource_type::ResourceType>>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        resource_type::ResourceType,
        r#"
        SELECT * FROM resource_types;
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(rows))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetAbuseData {
    pub uuid: abuse::Uuid,
    pub resource_uuid: abuse::ResourceUuid,
    pub resource_type: abuse::ResourceType,
    pub offender_id: abuse::OffenderId,
    pub reporter_id: abuse::ReporterId,
    pub content: abuse::Content,
    pub created_at: abuse::CreatedAt,
    pub updated_at: abuse::UpdatedAt,
    pub status: abuse::Status,
    pub comment_count: Option<i64>,
}

pub async fn get(
    _claims: Claims,
    Path(abuse_uuid): Path<abuse::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetAbuseData>, (StatusCode, String)> {
    let row = match sqlx::query_as!(
        GetAbuseData,
        r#"
        SELECT abuse.*, COUNT(comment) AS comment_count
        FROM abuses abuse
        LEFT JOIN abuse_comments comment ON abuse.uuid = comment.abuse_uuid
        WHERE abuse.uuid = $1
        GROUP BY abuse.uuid;
        "#,
        abuse_uuid
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    match row {
        Some(row) => Ok(axum::Json(row)),
        None => Err((StatusCode::NOT_FOUND, String::from(""))),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetAbuseCommentsData {
    pub comments: Vec<abuse_comment::AbuseComment>,
}

pub async fn get_comments(
    _claims: Claims,
    Path(abuse_uuid): Path<abuse::Uuid>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<abuse_comment::AbuseComment>>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        abuse_comment::AbuseComment,
        r#"
        SELECT * FROM abuse_comments
        WHERE abuse_uuid = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3   
        "#,
        abuse_uuid,
        PAGE_SIZE,
        page * PAGE_SIZE,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(rows))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetAbusesData {
    pub abuses: Vec<GetAbuseData>,
}

pub async fn get_reported_by(
    _claims: Claims,
    Path(user_id): Path<abuse::ReporterId>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetAbusesData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        GetAbuseData,
        r#"
        SELECT abuse.*, COUNT(comment) AS comment_count
        FROM abuses abuse
        LEFT JOIN abuse_comments comment ON abuse.uuid = comment.abuse_uuid
        WHERE abuse.reporter_id = $1
        GROUP BY abuse.uuid
        ORDER BY abuse.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetAbusesData { abuses: rows }))
}

pub async fn get_offended_by(
    _claims: Claims,
    Path(user_id): Path<abuse::OffenderId>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetAbusesData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        GetAbuseData,
        r#"
        SELECT abuse.*, COUNT(comment) AS comment_count
        FROM abuses abuse
        LEFT JOIN abuse_comments comment ON abuse.uuid = comment.abuse_uuid
        WHERE abuse.offender_id = $1
        GROUP BY abuse.uuid
        ORDER BY abuse.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetAbusesData { abuses: rows }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchAbuseData {
    pub content: String,
}

pub async fn comment(
    claims: Claims,
    Path(abuse_uuid): Path<abuse::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchAbuseData>,
) -> Result<Json<abuse_comment::AbuseComment>, (StatusCode, String)> {
    if payload.content.is_empty() {
        return Err((StatusCode::BAD_REQUEST, String::from("")));
    }

    let user_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        abuse_comment::AbuseComment,
        r#"
        INSERT INTO abuse_comments (uuid, abuse_uuid, author_id, content, created_at)
        SELECT $1, $2, $3, $4, NOW()
        FROM abuses
        WHERE uuid = $2
        AND (offender_id = $3 OR reporter_id = $3)
        RETURNING *;
        "#,
        uuid::Uuid::new_v4(),
        abuse_uuid,
        user_id,
        payload.content
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostAbuseData {
    pub resource_uuid: abuse::ResourceUuid,
    pub resource_type: abuse::ResourceType,
    pub offender_id: abuse::OffenderId,
    pub content: abuse::Content,
}

pub async fn post(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostAbuseData>,
) -> Result<Json<abuse::Abuse>, (StatusCode, String)> {
    let reporter_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        abuse::Abuse,
        r#"
        INSERT INTO abuses (uuid, resource_uuid, resource_type, offender_id, reporter_id, content, status)
        VALUES ($1, $2, $3, $4, $5, $6, 1)
        RETURNING *;
        "#,
        uuid::Uuid::new_v4(),
        payload.resource_uuid,
        payload.resource_type,
        payload.offender_id,
        reporter_id,
        payload.content,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(row))
}
