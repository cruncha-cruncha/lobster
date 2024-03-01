use crate::auth::claims::Claims;
use crate::auth::encryption::encode_plain_email;
use crate::db_structs::recovery_request;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadResetPasswordCodeData {
    pub email: String,
}

pub async fn read_code(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ReadResetPasswordCodeData>,
) -> Result<String, (StatusCode, String)> {
    if !claims.is_admin() {
        return Err((StatusCode::UNAUTHORIZED, String::from("Not an admin")));
    }

    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                String::from("auth_encode_plain_email"),
            ))
        }
    };

    let recovery_request = match sqlx::query_as!(
        recovery_request::RecoveryRequest,
        r#"
        SELECT * FROM recovery_requests WHERE email = $1
        "#,
        email
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if recovery_request.is_none() {
        return Err((StatusCode::NOT_FOUND, String::from("can't find code")));
    }
    let recovery_request = recovery_request.unwrap();

    Ok(recovery_request.code)
}

pub async fn delete(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ReadResetPasswordCodeData>,
) -> Result<StatusCode, (StatusCode, String)> {
    if !claims.is_admin() {
        return Err((StatusCode::UNAUTHORIZED, String::from("Not an admin")));
    }

    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                String::from("auth_encode_plain_email"),
            ))
        }
    };

    match sqlx::query!(
        r#"
        DELETE FROM recovery_requests WHERE email = $1
        "#,
        email,
    )
    .execute(&state.db)
    .await
    {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(StatusCode::OK)
}
