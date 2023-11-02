use crate::db_structs::invitation;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::auth::encryption::encode_plain_email;

pub fn generate_code() -> invitation::Code {
    format!("invite-{}", uuid::Uuid::new_v4())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostInvitationData {
    pub email: invitation::Email,
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

    match sqlx::query!(
        r#"
        INSERT INTO invitations (email, code, updated_at)
        VALUES($1,$2,NOW()) 
        ON CONFLICT (email) 
        DO UPDATE SET updated_at = NOW()
        RETURNING *;
        "#,
        payload.email,
        generate_code(),
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(_) => {},
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    // TODO: send email with invitation code

    Ok(StatusCode::OK)
}
