use crate::auth::encryption::decode_email;
use crate::common;
use crate::db_structs::{store, user};
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
pub struct UserWithPlainEmail {
    pub id: user::Id,
    pub username: user::Username,
    pub status: user::Status,
    pub email: String,
    pub created_at: user::CreatedAt,
}

pub async fn get_statuses(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<common::Status>>, (StatusCode, String)> {
    let roles = match users::select_statuses(&state.db).await {
        Ok(roles) => roles,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(roles))
}

pub async fn update(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(data): Json<UpdateUsername>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if claims.subject_as_user_id().unwrap_or(-1) != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            "You can only update your own username".to_string(),
        ));
    }

    match users::update(user_id, Some(&data.username), None, &state.db).await {
        Ok(_) => Ok(Json(common::NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(user_id): Path<i32>,
    Path(status): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if !claims.is_user_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            "You must be a user admin to update user statuses".to_string(),
        ));
    }

    match users::update(user_id, None, Some(status), &state.db).await {
        Ok(_) => Ok(Json(common::NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn get_by_id(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<UserWithPlainEmail>, (StatusCode, String)> {
    let can_see_email = claims.is_user_admin()
        || claims.is_store_admin()
        || claims.subject_as_user_id().unwrap_or(-1) == user_id;

    match users::select_by_id(user_id, &state.db).await {
        Ok(user) => match user {
            Some(u) => {
                let mut plain_email = String::new();
                if can_see_email {
                    plain_email = decode_email(&u.email).ok_or((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "Failed to decode email".to_string(),
                    ))?;
                }

                Ok(Json(UserWithPlainEmail {
                    id: u.id,
                    username: u.username,
                    status: u.status,
                    email: plain_email,
                    created_at: u.created_at,
                }))
            }
            None => Err((StatusCode::NOT_FOUND, "User not found".to_string())),
        },
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn get_filtered(
    claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<UserWithPlainEmail>>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let users = match users::select(
        SelectParams {
            term: params.term.unwrap_or_default(),
            store_ids: params.store_ids.unwrap_or_default(),
            statuses: params.statuses.unwrap_or_default(),
            roles: params.roles.unwrap_or_default(),
            created_at: params.created_at.unwrap_or_default(),
            offset: offset,
            limit: limit,
        },
        &state.db,
    )
    .await
    {
        Ok(users) => users,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    let plain_users: Vec<UserWithPlainEmail>;
    if claims.is_user_admin() || claims.is_store_admin() {
        plain_users = users
            .into_iter()
            .map(|u| UserWithPlainEmail {
                id: u.id,
                username: u.username,
                status: u.status,
                email: decode_email(&u.email).unwrap_or_default(),
                created_at: u.created_at,
            })
            .collect();
    } else {
        plain_users = users
            .into_iter()
            .map(|u| UserWithPlainEmail {
                id: u.id,
                username: u.username,
                status: u.status,
                email: String::new(),
                created_at: u.created_at,
            })
            .collect();
    }

    Ok(Json(plain_users))
}
