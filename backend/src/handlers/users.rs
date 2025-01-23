use crate::auth::encryption;
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
pub struct UpdateUserData {
    pub username: Option<user::Username>,
    pub old_password: Option<String>,
    pub new_password: Option<String>,
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
    pub users: Vec<UserWithPermissions>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafeUser {
    pub id: user::Id,
    pub username: user::Username,
    pub status: user::Status,
    pub code: user::Code,
    pub email_address: user::EmailAddress,
    pub created_at: user::CreatedAt,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserWithPermissions {
    pub id: user::Id,
    pub username: user::Username,
    pub status: user::Status,
    pub code: user::Code,
    pub email_address: user::EmailAddress,
    pub created_at: user::CreatedAt,
    pub permissions: Vec<UserPermission>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPermission {
    pub id: permission::Id,
    pub role_id: permission::RoleId,
    pub store_id: Option<permission::StoreId>,
}

pub async fn update(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateUserData>,
) -> Result<Json<SafeUser>, common::ErrResponse> {
    if claims.subject_as_user_id().unwrap_or(-1) != user_id {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "You cannot update someone else's username",
        ));
    }

    if payload.new_password.is_some() {
        if payload.old_password.is_none() {
            return Err(common::ErrResponse::new(
                StatusCode::BAD_REQUEST,
                "ERR_BAD_REQUEST",
                "You must provide the old password to change it",
            ));
        }

        if payload.new_password.as_ref().unwrap().len() < encryption::MIN_PASSWORD_LENGTH {
            return Err(common::ErrResponse::new(
                StatusCode::BAD_REQUEST,
                "ERR_REQ",
                "Password is too short",
            ));
        }

        let user = match users::select_by_ids(vec![user_id], &state.db).await {
            Ok(mut users) => {
                if users.is_empty() {
                    return Err(common::ErrResponse::new(
                        StatusCode::NOT_FOUND,
                        "ERR_MIA",
                        "Could not find any user with that id",
                    ));
                }
                users.remove(0)
            }
            Err(e) => {
                return Err(common::ErrResponse::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "ERR_DB",
                    &e,
                ))
            }
        };

        let old_hashed_password =
            encryption::hash_password(&payload.old_password.unwrap(), &user.salt);
        if user.password != &old_hashed_password[..] {
            return Err(common::ErrResponse::new(
                StatusCode::BAD_REQUEST,
                "ERR_REQ",
                "Old password is incorrect",
            ));
        }
    }

    match users::update(
        user_id,
        payload.username.as_deref(),
        payload.new_password.as_deref(),
        None,
        &state.db,
    )
    .await
    {
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
            Ok(Json(SafeUser {
                id: u.id,
                username: u.username,
                status: u.status,
                code: u.code,
                email_address: u.email_address,
                created_at: u.created_at,
            }))
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
) -> Result<Json<SafeUser>, common::ErrResponse> {
    if !claims.is_user_admin() {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a user admin",
        ));
    }

    let claims_user_id = claims.subject_as_user_id().unwrap_or_default();

    let can_see_code = claims.is_user_admin() || claims_user_id == user_id;

    match users::update(user_id, None, None, Some(payload.status), &state.db).await {
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
            Ok(Json(SafeUser {
                id: u.id,
                username: u.username,
                status: u.status,
                code: u.code,
                email_address: u.email_address,
                created_at: u.created_at,
            }))
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
) -> Result<Json<SafeUser>, common::ErrResponse> {
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

    match users::select_by_ids(vec![user_id], &state.db).await {
        Ok(mut users) => {
            if users.is_empty() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Could not find any user with that id",
                ));
            }
            let mut u = users.remove(0);
            if !can_see_email {
                u.email_address = String::new();
            }
            if !can_see_code {
                u.code = String::new();
            }

            Ok(Json(SafeUser {
                id: u.id,
                username: u.username,
                status: u.status,
                code: u.code,
                email_address: u.email_address,
                created_at: u.created_at,
            }))
        }
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

    let users: Vec<user::User>;
    if can_see_emails {
        users = users::select_with_email(params, &state.db)
            .await
            .map_err(|e| {
                common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e)
            })?;
    } else {
        users = users::select(params, &state.db).await.map_err(|e| {
            common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e)
        })?;
    }

    let permissions = permissions::select(
        permissions::SelectParams {
            ids: vec![],
            user_ids: users.iter().map(|u| u.id).collect(),
            role_ids: vec![],
            store_ids: vec![],
            statuses: vec![permission::PermissionStatus::Active as i32],
        },
        &state.db,
    )
    .await
    .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))?;

    let users_with_permissions = users
        .iter()
        .map(|u| {
            let user_permissions = permissions
                .iter()
                .filter(|p| p.user_id == u.id)
                .map(|p| UserPermission {
                    id: p.id,
                    role_id: p.role_id,
                    store_id: p.store_id,
                })
                .collect();

            UserWithPermissions {
                id: u.id,
                username: u.username.clone(),
                status: u.status,
                code: u.code.clone(),
                email_address: u.email_address.clone(),
                created_at: u.created_at,
                permissions: user_permissions,
            }
        })
        .collect();

    Ok(Json(FilteredResponse {
        users: users_with_permissions,
    }))
}
