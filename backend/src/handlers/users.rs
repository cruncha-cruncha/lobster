use crate::common;
use crate::db_structs::{store, user};
use crate::queries::users::{self, SelectParams};
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::permission};
use axum::extract::Path;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
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
    pub usernames: Option<Vec<String>>,
    pub emails: Option<Vec<String>>,
    pub store_ids: Option<Vec<store::Id>>,
    pub statuses: Option<Vec<user::Status>>,
    pub roles: Option<Vec<permission::RoleId>>,
    pub created_at: Option<common::DateBetween>,
    pub offset: i64,
    pub limit: i64,
}

// filter users by: username, email, store id, role, status, created_at

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
) -> Result<Json<user::User>, (StatusCode, String)> {
    if !claims.is_user_admin() && claims.subject_as_user_id().unwrap_or(-1) != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            "You must be a user admin to get other users".to_string(),
        ));
    }

    match users::select_by_id(user_id, &state.db).await {
        Ok(user) => match user {
            Some(u) => Ok(Json(u)),
            None => Err((StatusCode::NOT_FOUND, "User not found".to_string())),
        },
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn get_filtered(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(data): Json<FilterParams>,
) -> Result<Json<Vec<user::User>>, (StatusCode, String)> {
    let users = match users::select(
        SelectParams {
            usernames: data.usernames.unwrap_or_default(),
            emails: data.emails.unwrap_or_default(),
            store_ids: data.store_ids.unwrap_or_default(),
            statuses: data.statuses.unwrap_or_default(),
            roles: data.roles.unwrap_or_default(),
            created_at: data.created_at.unwrap_or_default(),
            offset: data.offset,
            limit: data.limit,
        },
        &state.db,
    )
    .await
    {
        Ok(users) => users,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(users))
}
