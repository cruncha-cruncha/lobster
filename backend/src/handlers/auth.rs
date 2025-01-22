use crate::db_structs::user;
use crate::queries::users;
use crate::{auth::claims, queries::permissions};
use crate::{common, AppState};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginData {
    pub email: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginData>,
) -> Result<Json<Tokens>, common::ErrResponse> {
    let user_id = match users::select_by_email(&payload.email, &state.db).await {
        Ok(u) => {
            if u.is_some() {
                if u.as_ref().unwrap().status != user::UserStatus::Active as i32 {
                    return Err(common::ErrResponse::new(
                        StatusCode::FORBIDDEN,
                        "ERR_AUTH",
                        "User is not active",
                    ));
                }

                u.unwrap().id
            } else {
                let new_user = super::users::create_new_user(
                    payload.email,
                    axum::extract::State(state.clone()),
                )
                .await?;
                new_user.id
            }
        }
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ))
        }
    };

    let permissions = permissions::select_for_claims(&user_id, &state.db)
        .await
        .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))?;

    let access_token = match claims::make_access_token(&user_id.to_string(), &permissions) {
        Ok(token) => token,
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_LOGIC",
                &e,
            ))
        }
    };

    let refresh_token = match claims::make_refresh_token(&user_id.to_string()) {
        Ok(token) => token,
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_LOGIC",
                &e,
            ))
        }
    };

    Ok(axum::Json(Tokens {
        access_token: access_token,
        refresh_token: Some(refresh_token),
    }))
}

pub async fn refresh(
    claims: claims::Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Tokens>, common::ErrResponse> {
    let user_id = match claims.subject_as_user_id() {
        Some(user_id) => user_id,
        None => {
            return Err(common::ErrResponse::new(
                StatusCode::UNAUTHORIZED,
                "ERR_AUTH",
                "Invalid user id in claims",
            ))
        }
    };

    let user = match users::select_by_ids(vec![user_id], &state.db).await {
        Ok(mut u) => {
            if u.is_empty() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "User no longer exists",
                ));
            }

            let u = u.remove(0);
            if u.status != user::UserStatus::Active as i32 {
                return Err(common::ErrResponse::new(
                    StatusCode::FORBIDDEN,
                    "ERR_AUTH",
                    "User is not active",
                ));
            }

            u
        }
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ))
        }
    };

    let permissions = permissions::select_for_claims(&user_id, &state.db)
        .await
        .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))?;

    let access_token = match claims::make_access_token(&user.id.to_string(), &permissions) {
        Ok(token) => token,
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_LOGIC",
                &e,
            ))
        }
    };

    Ok(axum::Json(Tokens {
        access_token: access_token,
        refresh_token: None,
    }))
}
