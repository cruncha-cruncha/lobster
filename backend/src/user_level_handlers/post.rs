use crate::db_structs::{comment, helpers, post, user};
use crate::{AppState, Claims};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetPostData {
    pub uuid: post::Uuid,
    pub author_id: post::AuthorId,
    pub author_name: user::Name,
    pub title: post::Title,
    pub images: post::Images,
    pub content: post::Content,
    pub price: post::Price,
    pub currency: post::Currency,
    pub latitude: post::Latitude,
    pub longitude: post::Longitude,
    pub created_at: post::CreatedAt,
    pub updated_at: post::UpdatedAt,
    pub deleted: post::Deleted,
    pub draft: post::Draft,
    pub changes: post::Changes,
    pub comments: Option<Vec<comment::Comment>>,
}

pub async fn get(
    _claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostData>, (StatusCode, String)> {
    let row = match sqlx::query_as!(
        GetPostData,
        r#"
        SELECT
            post.uuid,
            post.author_id,
            usr.name AS author_name,
            post.title,
            post.images,
            post.content,
            post.price,
            post.currency,
            post.latitude,
            post.longitude,
            post.created_at,
            post.updated_at,
            post.deleted,
            post.draft,
            post.changes,
            COALESCE(NULLIF(ARRAY_AGG(comment), '{NULL}'), '{}') AS "comments: Vec<comment::Comment>"
        FROM posts post
        JOIN users usr ON usr.id = post.author_id
        LEFT JOIN comments comment ON comment.post_uuid = post.uuid
        WHERE post.uuid = $1
        GROUP BY post.uuid, usr.name
        "#,
        post_uuid
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostPostData {
    pub title: post::Title,
    pub images: post::Images,
    pub content: post::Content,
    pub price: post::Price,
    pub currency: post::Currency,
    pub latitude: post::Latitude,
    pub longitude: post::Longitude,
    pub draft: post::Draft,
}

pub async fn post(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostPostData>,
) -> Result<Json<post::Post>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        post::Post,
        r#"
        INSERT INTO posts (
            uuid,
            author_id,
            title,
            images,
            content,
            price,
            currency,
            latitude,
            longitude,
            draft,
            created_at,
            updated_at,
            deleted,
            changes
        ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            NOW(),
            NOW(),
            false,
            '[]'::JSONB
        ) RETURNING *
        "#,
        uuid::Uuid::new_v4(),
        author_id,
        payload.title,
        &payload.images,
        payload.content,
        payload.price,
        payload.currency,
        payload.latitude,
        payload.longitude,
        payload.draft,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(row))
}

pub async fn delete(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    match sqlx::query_as!(
        helpers::RowsReturned,
        r#"
        WITH updated AS (
            UPDATE posts post SET
                deleted = true,
                updated_at = NOW(),
                changes = changes || jsonb_build_array(jsonb_build_object(
                    'who', $3::TEXT,
                    'when', NOW(),
                    'title', post.title,
                    'images', post.images,
                    'content', post.content,
                    'price', post.price,
                    'currency', post.currency,
                    'latitude', post.latitude,
                    'longitude', post.longitude,
                    'draft', post.draft,
                    'deleted', post.deleted
                )) 
            WHERE post.uuid = $1
            AND post.author_id = $2
            RETURNING *)
        SELECT COUNT(*) as count
        FROM updated;
        "#,
        post_uuid,
        author_id,
        claims.sub,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => {
            if row.count == None || row.count == Some(0) {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    match sqlx::query!(
        r#"
        UPDATE comments comment SET
            viewed_by_author = FALSE
        WHERE comment.post_uuid = $1
        "#,
        post_uuid,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { println!("ERROR user_delete_post_update_comments_viewed, {}", e); },
    }

    return Ok(StatusCode::NO_CONTENT);
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchPostData {
    pub title: post::Title,
    pub images: post::Images,
    pub content: post::Content,
    pub price: post::Price,
    pub currency: post::Currency,
    pub latitude: post::Latitude,
    pub longitude: post::Longitude,
    pub draft: post::Draft,
}

pub async fn patch(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchPostData>,
) -> Result<Json<post::Post>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        post::Post,
        r#"
        UPDATE posts post
        SET
            title = $4,
            images = $5,
            content = $6,
            price = $7,
            currency = $8,
            latitude = $9,
            longitude = $10,
            draft = $11,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'title', post.title,
                'images', post.images,
                'content', post.content,
                'price', post.price,
                'currency', post.currency,
                'latitude', post.latitude,
                'longitude', post.longitude,
                'draft', post.draft,
                'deleted', post.deleted
            )) 
        WHERE post.uuid = $1 AND post.author_id = $2
        RETURNING *
        "#,
        post_uuid,
        author_id,
        claims.sub,
        payload.title,
        &payload.images,
        payload.content,
        payload.price,
        payload.currency,
        payload.latitude,
        payload.longitude,
        payload.draft,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    match sqlx::query!(
        r#"
        UPDATE comments comment SET
            viewed_by_author = FALSE
        WHERE comment.post_uuid = $1
        "#,
        post_uuid,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { println!("ERROR user_patch_post_update_comments_viewed, {}", e); },
    }

    Ok(axum::Json(row))
}
