use crate::queries::user;
use crate::AppState;
use crate::{auth::claims, queries::permissions};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct Tokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostLoginData {
    pub email: String,
}

// TODO: this is a STUB, need to use OAuth2 to login
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostLoginData>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let user = user::select_by_email(&payload.email, &state.db)
        .await
        .map_err(|e| (StatusCode::FORBIDDEN, e.to_string()))?;

    // if user banned then...

    let permissions = permissions::select_by_user(&user.id, &state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let access_token = match claims::make_access_token(&user.id.to_string(), &permissions) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    let refresh_token = match claims::make_refresh_token(&user.id.to_string()) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(axum::Json(Tokens {
        access_token: access_token,
        refresh_token: Some(refresh_token),
    }))
}

pub async fn refresh(
    claims: claims::Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let user_id = match claims.subject_as_user_id() {
        Some(user_id) => user_id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let user = user::select(&user_id, &state.db)
        .await
        .map_err(|e| (StatusCode::FORBIDDEN, e.to_string()))?;

    // TODO: if user is banned...

    let permissions = permissions::select_by_user(&user_id, &state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let access_token = match claims::make_access_token(&user.id.to_string(), &permissions) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(axum::Json(Tokens {
        access_token: access_token,
        refresh_token: None,
    }))
}
