use crate::db_structs::invitation;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::auth::{
    encryption::encode_plain_email,
    claims,
};

pub fn generate_code() -> invitation::Code {
    format!("invite-{}", uuid::Uuid::new_v4())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostInvitationData {
    pub email: String,
}

pub async fn post(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostInvitationData>,
) -> Result<StatusCode, (StatusCode, String)> {
    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => return Err((StatusCode::INTERNAL_SERVER_ERROR, String::from("auth_encode_plain_email"))),
    };

    match sqlx::query!(
        r#"
        SELECT * FROM users WHERE email = $1
        "#,
        email
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => {
            if row.is_some() {
                return Err((
                    StatusCode::BAD_REQUEST,
                    "User with this email already exists".to_string(),
                ));
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let invite_code = generate_code();

    match sqlx::query!(
        r#"
        INSERT INTO invitations (email, code, claim_level, updated_at)
        VALUES($1,$2,$3,NOW()) 
        ON CONFLICT (email) 
        DO UPDATE SET updated_at = NOW()
        RETURNING *;
        "#,
        email,
        invite_code,
        claims::ClaimLevel::User.encode_numeric(),
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(_) => {},
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(StatusCode::OK)
}
