use crate::db_structs::{helpers, user};
use crate::auth::claims::Claims;
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::auth::encryption::decode_email;
#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetUserData {
    pub id: user::Id,
    pub name: user::FirstName,
    pub email: String,
    pub banned_until: user::BannedUntil,
    pub created_at: user::CreatedAt,
    pub updated_at: user::UpdatedAt,
    pub language: user::Language,
    pub country: user::Country,
    pub latitude: user::Latitude,
    pub longitude: user::Longitude,
    pub near: user::Near,
    pub changes: serde_json::Value,
}

pub async fn get(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetUserData>, (StatusCode, String)> {
    #[cfg(not(feature = "ignoreAuth"))]
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
        banned_until: row.banned_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
        language: row.language,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        near: row.near,
        changes: row.changes,
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchUserData {
    pub name: user::FirstName,
    pub language: user::Language,
    pub country: user::Country,
    pub latitude: user::Latitude,
    pub longitude: user::Longitude,
    pub near: user::Near,
}

pub async fn patch(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchUserData>, // json data being sent must be a superset of struct
) -> Result<Json<GetUserData>, (StatusCode, String)> {
    #[cfg(not(feature = "ignoreAuth"))]
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
            latitude = $6,
            longitude = $7,
            near = $8,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $2::TEXT,
                'when', NOW(),
                'name', usr.first_name,
                'language', usr.language,
                'country', usr.country,
                'latitude', usr.latitude,
                'longitude', usr.longitude,
                'near', usr.near
            ))
        WHERE usr.id = $1
        RETURNING *
        "#,
        user_id as i64,
        claims.sub,
        payload.name,
        payload.language,
        payload.country,
        payload.latitude,
        payload.longitude,
        payload.near
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
        banned_until: row.banned_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
        language: row.language,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        near: row.near,
        changes: row.changes,
    }))
}

pub async fn delete(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    #[cfg(not(feature = "ignoreAuth"))]
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    match sqlx::query_as!(
        helpers::RowsReturned,
        r#"
        WITH deleted AS (DELETE FROM users usr WHERE usr.id = $1 RETURNING *)
        SELECT COUNT(*) as count
        FROM deleted;
        "#,
        user_id as i64
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => {
            if row.count == None || row.count == Some(0) {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(StatusCode::NO_CONTENT)
}
