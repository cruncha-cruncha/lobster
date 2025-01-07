use crate::queries::users;
use crate::AppState;
use crate::{auth::claims, queries::permissions};
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
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let user_id = match users::select_by_email(&payload.email, &state.db).await {
        Ok(u) => {
            if u.is_some() {
                u.unwrap().id
            } else {
                let username = crate::usernames::rnd_username();
                let code = crate::common::rnd_code_str("");
                match users::insert(&username, 1, &payload.email, &code, &state.db).await {
                    Ok(new_user) => {
                        let id = new_user.id;
                        match users::count(&state.db).await {
                            Ok(count) => {
                                if count <= 1 {
                                    permissions::insert(id, 1, None, 1, &state.db).await.ok();
                                    permissions::insert(id, 2, None, 1, &state.db).await.ok();
                                    permissions::insert(id, 3, None, 1, &state.db).await.ok();
                                }
                            }
                            Err(_) => (),
                        }

                        let encoded = serde_json::to_vec(&new_user).unwrap_or_default();
                        state.comm.send_message("users", &encoded).await.ok();

                        id
                    }
                    Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
                }
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    // if user banned then...

    let permissions = permissions::select_for_claims(&user_id, &state.db)
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

    let user = match users::select_by_id(user_id, &state.db).await {
        Ok(u) => {
            if u.is_none() {
                return Err((StatusCode::NOT_FOUND, String::from("no user found")));
            }
            u.unwrap()
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    // TODO: if user is banned...

    let permissions = permissions::select_for_claims(&user_id, &state.db)
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
