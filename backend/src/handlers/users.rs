use crate::common;
use crate::db_structs::{store, user};
use crate::queries::permissions;
use crate::queries::users::{self, SelectParams};
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::permission};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use axum_extra::extract::Query;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUsername {
    pub username: user::Username,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub term: Option<String>,
    pub store_ids: Option<Vec<store::Id>>,
    pub statuses: Option<Vec<user::Status>>,
    pub roles: Option<Vec<permission::RoleId>>,
    pub created_at: Option<common::DateBetween>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilteredResponse {
    pub users: Vec<user::User>,
}

pub async fn update(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(data): Json<UpdateUsername>,
) -> Result<Json<user::User>, common::ErrResponse> {
    if claims.subject_as_user_id().unwrap_or(-1) != user_id {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "You cannot update someone else's username",
        ));
    }

    match users::update(user_id, Some(&data.username), None, &state.db).await {
        Ok(u) => {
            if u.is_none() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Could not find any user with that id",
                ));
            }
            let u = u.unwrap();
            let encoded = serde_json::to_vec(&u).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();
            Ok(Json(u))
        }
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<user::User>, common::ErrResponse> {
    if !claims.is_user_admin() {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a user admin",
        ));
    }

    let claims_user_id = claims.subject_as_user_id().unwrap_or_default();

    let can_see_code = claims.is_user_admin() || claims_user_id == user_id;

    match users::update(user_id, None, Some(payload.status), &state.db).await {
        Ok(u) => {
            if u.is_none() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Could not find any user with that id",
                ));
            }
            let mut u = u.unwrap();
            let encoded = serde_json::to_vec(&u).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();
            if !can_see_code {
                u.code = String::new();
            }
            Ok(Json(u))
        }
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}

pub async fn get_by_id(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<user::User>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "User is not logged in",
        ));
    }

    let claims_user_id = claims.subject_as_user_id().unwrap_or_default();

    let can_see_email =
        claims.is_user_admin() || claims.is_store_admin() || claims_user_id == user_id;

    let can_see_code = claims.is_user_admin() || claims_user_id == user_id;

    match users::select_by_id(user_id, &state.db).await {
        Ok(user) => match user {
            Some(mut u) => {
                if !can_see_email {
                    u.email_address = String::new();
                }
                if !can_see_code {
                    u.code = String::new();
                }

                Ok(Json(u))
            }
            None => Err(common::ErrResponse::new(
                StatusCode::NOT_FOUND,
                "ERR_MIA",
                "Could not find any user with that id",
            )),
        },
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}

pub async fn get_filtered(
    claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<FilteredResponse>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "User is not logged in",
        ));
    }

    let can_see_emails = claims.is_user_admin() || claims.is_store_admin();
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());
    let params = SelectParams {
        term: params.term.unwrap_or_default(),
        store_ids: params.store_ids.unwrap_or_default(),
        statuses: params.statuses.unwrap_or_default(),
        roles: params.roles.unwrap_or_default(),
        created_at: params.created_at.unwrap_or_default(),
        offset: offset,
        limit: limit,
    };

    if can_see_emails {
        users::select_with_email(params, &state.db)
            .await
            .map(|users| Json(FilteredResponse { users }))
            .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))
    } else {
        users::select(params, &state.db)
            .await
            .map(|users| Json(FilteredResponse { users }))
            .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))
    }
}

pub async fn create_new_user(
    // this endpoint is only used internally, claim checks are performed in the caller
    email_address: String,
    State(state): State<Arc<AppState>>,
) -> Result<Json<user::User>, common::ErrResponse> {
    let username = crate::usernames::rnd_username();

    let mut code = crate::common::rnd_code_str("");
    while (users::select_by_code(code.clone(), &state.db).await).is_ok() {
        code = crate::common::rnd_code_str("");
    }

    match users::insert(&username, 1, &email_address, &code, &state.db).await {
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

            Ok(Json(new_user))
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
