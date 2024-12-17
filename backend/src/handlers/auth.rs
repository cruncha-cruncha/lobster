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
pub struct LoginData {
    pub email: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginData>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let user_id = match user::select_by_email(&payload.email, &state.db).await {
        Ok(u) => {
            if u.is_some() {
                u.unwrap().id
            } else {
                match user::insert("", 1, &payload.email, &state.db).await {
                    Ok(id) => {
                        // TODO: if this is the only user, give them all the permissions
                        // TODO: if any future_permissions associated with this email, make them into full permissions
                        id
                    }
                    Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
                }
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    // if user banned then...

    let permissions = permissions::select_by_user(&user_id, &state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let access_token = match claims::make_access_token(&user_id.to_string(), &permissions) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    let refresh_token = match claims::make_refresh_token(&user_id.to_string()) {
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

    let user = match user::select(&user_id, &state.db).await {
        Ok(u) => {
            if u.is_none() {
                return Err((StatusCode::NOT_FOUND, String::from("no user found")));
            }
            u.unwrap()
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    // TODO: if user is banned...

    let permissions = permissions::select_by_user(&user_id, &state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    let access_token = match claims::make_access_token(&user.id.to_string(), &permissions) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(axum::Json(Tokens {
        access_token: access_token,
        refresh_token: None,
    }))
}
