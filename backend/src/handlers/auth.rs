use crate::auth::encryption;
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
    pub password: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginData>,
) -> Result<Json<Tokens>, common::ErrResponse> {
    let user_id = match users::select_by_email(&payload.email, &state.db).await {
        Ok(u) => {
            if u.is_none() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "User not found",
                ));
            }

            let u = u.unwrap();
            if u.status != user::UserStatus::Active as i32 {
                return Err(common::ErrResponse::new(
                    StatusCode::FORBIDDEN,
                    "ERR_AUTH",
                    "User is not active",
                ));
            }

            let hashed_password = encryption::hash_password(&payload.password, &u.salt);
            if hashed_password != &u.password[..] {
                return Err(common::ErrResponse::new(
                    StatusCode::UNAUTHORIZED,
                    "ERR_AUTH",
                    "Invalid password",
                ));
            }

            u.id
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

pub async fn sign_up(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginData>,
) -> Result<Json<super::users::SafeUser>, common::ErrResponse> {
    if payload.password.len() < encryption::MIN_PASSWORD_LENGTH {
        return Err(common::ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_REQ",
            "Password is too short",
        ));
    }

    let username = crate::usernames::rnd_username();

    let lim = 5;
    let mut count = 0;
    let mut code = crate::common::rnd_code_str("");
    while (users::select_by_code(code.clone(), &state.db).await)
        .ok()
        .flatten()
        .is_some()
    {
        count += 1;
        if count >= lim {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_LOGIN",
                "Could not generate a unique code",
            ));
        }
        code = crate::common::rnd_code_str("");
    }

    match users::insert(
        &username,
        user::UserStatus::Pending as i32,
        &payload.email,
        &payload.password,
        &code,
        &state.db,
    )
    .await
    {
        Ok(mut new_user) => {
            let id = new_user.id;
            match users::count(2, &state.db).await {
                Ok(count) => {
                    if count <= 1 {
                        new_user = match users::update(
                            id,
                            None,
                            None,
                            Some(user::UserStatus::Active as i32),
                            &state.db,
                        )
                        .await
                        {
                            Ok(u) => u.unwrap(),
                            Err(e) => {
                                return Err(common::ErrResponse::new(
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    "ERR_DB",
                                    &e,
                                ))
                            }
                        };
                        permissions::insert(id, 1, None, 1, &state.db).await.ok();
                        permissions::insert(id, 2, None, 1, &state.db).await.ok();
                        permissions::insert(id, 3, None, 1, &state.db).await.ok();
                    }
                }
                Err(_) => (),
            }

            let encoded = serde_json::to_vec(&new_user).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();

            Ok(Json(super::users::SafeUser {
                id: new_user.id,
                username: new_user.username,
                status: new_user.status,
                code: new_user.code,
                email_address: new_user.email_address,
                created_at: new_user.created_at,
            }))
        }
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ))
        }
    }
}
