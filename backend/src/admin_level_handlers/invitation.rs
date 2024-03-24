use crate::auth::claims::Claims;
use crate::auth::encryption::encode_plain_email;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

use serde::{Deserialize, Serialize};

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct ReadInvitationCodeData {
    pub email: String,
}

pub async fn delete(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ReadInvitationCodeData>,
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
        DELETE FROM invitations WHERE email = $1
        "#,
        email
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

    Ok(StatusCode::OK)
}
