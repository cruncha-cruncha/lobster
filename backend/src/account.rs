use crate::db_structs::user::User;
use crate::{AppState, Claims};

use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn get(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<User>, (StatusCode, String)> {
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    let row = match sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id as i64)
        .fetch_one(&state.db)
        .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

pub async fn patch(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<User>,
) -> Result<Json<User>, (StatusCode, String)> {
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    if payload.name == "" {
        return Err((StatusCode::BAD_REQUEST, String::from("")));
    }

    let row =
        match sqlx::query_as::<_, User>("UPDATE users SET name = $2 WHERE id = $1 RETURNING *")
            .bind(user_id as i64)
            .bind(payload.name)
            .fetch_one(&state.db)
            .await
        {
            Ok(row) => row,
            Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
        };

    Ok(axum::Json(row))
}
