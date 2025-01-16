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
pub struct FilteredResponse {
    pub users: Vec<user::User>,
}

pub async fn update(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(data): Json<UpdateUsername>,
) -> Result<Json<user::User>, (StatusCode, String)> {
    if claims.subject_as_user_id().unwrap_or(-1) != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            "You can only update your own username".to_string(),
        ));
    }

    match users::update(user_id, Some(&data.username), None, &state.db).await {
        Ok(u) => {
            let encoded = serde_json::to_vec(&u).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();
            Ok(Json(u))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<user::User>, (StatusCode, String)> {
    if !claims.is_user_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            "You must be a user admin to update user statuses".to_string(),
        ));
    }

    let claims_user_id = claims.subject_as_user_id().unwrap_or_default();

    let can_see_code = claims_user_id == user_id;

    match users::update(user_id, None, Some(payload.status), &state.db).await {
        Ok(mut u) => {
            let encoded = serde_json::to_vec(&u).unwrap_or_default();
            state.comm.send_message("users", &encoded).await.ok();
            if !can_see_code {
                u.code = String::new();
            }
            Ok(Json(u))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn get_by_id(
    claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<user::User>, (StatusCode, String)> {
    if claims.is_none() {
        return Err((
            StatusCode::UNAUTHORIZED,
            "You must be logged in".to_string(),
        ));
    }

    let claims_user_id = claims.subject_as_user_id().unwrap_or_default();

    let can_see_email =
        claims.is_user_admin() || claims.is_store_admin() || claims_user_id == user_id;

    let can_see_code = claims_user_id == user_id;

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
    if claims.is_none() {
        return Err((
            StatusCode::UNAUTHORIZED,
            "You must be logged in".to_string(),
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
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
    } else {
        users::select(params, &state.db)
            .await
            .map(|users| Json(FilteredResponse { users }))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
    }
}
