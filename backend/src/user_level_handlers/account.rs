use crate::auth::claims::Claims;
use crate::auth::encryption::decode_email;
use crate::db_structs::user;
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetUserData {
    pub id: user::Id,
    pub name: user::FirstName,
    pub email: String,
    pub language: user::Language,
    pub country: user::Country,
    pub banned_until: Option<time::OffsetDateTime>,
}

pub async fn get(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetUserData>, (StatusCode, String)> {
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    // struct used in query_as must be a subset of columns returned from SELECT
    let row = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM users usr
        WHERE usr.id = $1
        "#,
        user_id as i64
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(GetUserData {
        id: row.id,
        name: row.first_name,
        email: decode_email(&row.email).unwrap_or_default(),
        language: row.language,
        country: row.country,
        banned_until: row.banned_until,
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetMultipleData {
    pub ids: Vec<user::Id>,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetMultipleResponse {
    pub people: Vec<GetUserData>,
}

pub async fn get_multiple(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<GetMultipleData>,
) -> Result<Json<GetMultipleResponse>, (StatusCode, String)> {
    if payload.ids.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            String::from("Not enough ids. Min 1."),
        ));
    } else if payload.ids.len() > 128 {
        return Err((
            StatusCode::BAD_REQUEST,
            String::from("Too many ids. Max 128."),
        ));
    }

    let users = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM users usr
        WHERE usr.id = ANY($1)
        "#,
        &payload.ids,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(_) => return Err((StatusCode::NOT_FOUND, String::from(""))),
    };

    let mut people: Vec<GetUserData> = Vec::with_capacity(users.len());
    for user in users {
        people.push(GetUserData {
            id: user.id,
            name: user.first_name,
            email: decode_email(&user.email).unwrap_or_default(),
            language: user.language,
            country: user.country,
            banned_until: user.banned_until,
        });
    }

    Ok(axum::Json(GetMultipleResponse { people }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchUserData {
    pub name: user::FirstName,
    pub language: user::Language,
    pub country: user::Country,
}

pub async fn patch(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchUserData>, // json data being sent must be a superset of struct
) -> Result<Json<GetUserData>, (StatusCode, String)> {
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    if payload.name == "" || payload.language == 0 {
        return Err((StatusCode::BAD_REQUEST, String::from("")));
    }

    let row = match sqlx::query_as!(
        user::User,
        r#"
        UPDATE users usr
        SET
            first_name = $3,
            language = $4,
            country = $5,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $2::TEXT,
                'when', NOW(),
                'name', usr.first_name,
                'language', usr.language,
                'country', usr.country
            ))
        WHERE usr.id = $1
        RETURNING *
        "#,
        user_id as i64,
        claims.sub,
        payload.name,
        payload.language,
        payload.country,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(GetUserData {
        id: row.id,
        name: row.first_name,
        email: decode_email(&row.email).unwrap_or_default(),
        language: row.language,
        country: row.country,
        banned_until: row.banned_until,
    }))
}

pub async fn delete(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    // TODO: delete all user's posts, comments, replies, etc.

    match sqlx::query!(
        r#"
        DELETE
        FROM users usr
        WHERE usr.id = $1;
        "#,
        user_id as i64
    )
    .execute(&state.db)
    .await
    {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(StatusCode::NO_CONTENT)
}
