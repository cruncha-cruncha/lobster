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

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilteredResponse {
    pub users: Vec<UserWithPlainEmail>,
}

pub async fn update(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(data): Json<UpdateUsername>,
) -> Result<Json<UserWithPlainEmail>, (StatusCode, String)> {
    if claims.subject_as_user_id().unwrap_or(-1) != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            "You can only update your own username".to_string(),
        ));
    }

    match users::update(user_id, Some(&data.username), None, &state.db).await {
        Ok(u) => {
            let mut plain_user = UserWithPlainEmail::from(u);
            let encoded = serde_json::to_vec(&plain_user).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();
            plain_user.email = String::new();
            Ok(Json(plain_user))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<UserWithPlainEmail>, (StatusCode, String)> {
    if !claims.is_user_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            "You must be a user admin to update user statuses".to_string(),
        ));
    }

    match users::update(user_id, None, Some(payload.status), &state.db).await {
        Ok(u) => {
            let mut plain_user = UserWithPlainEmail::from(u);
            let encoded = serde_json::to_vec(&plain_user).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();
            plain_user.email = String::new();
            Ok(Json(plain_user))
        }
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

                let mut plain_user = UserWithPlainEmail::from(u);
                plain_user.email = plain_email;

                Ok(Json(plain_user))
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
) -> Result<Json<FilteredResponse>, (StatusCode, String)> {
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
            .map(|u| UserWithPlainEmail::from(u))
            .collect();
    }

    Ok(Json(FilteredResponse { users: plain_users }))
}

impl From<crate::db_structs::user::User> for UserWithPlainEmail {
    fn from(u: crate::db_structs::user::User) -> Self {
        UserWithPlainEmail {
            id: u.id,
            username: u.username,
            status: u.status,
            email: decode_email(&u.email).unwrap_or_default(),
            created_at: u.created_at,
        }
    }
}
