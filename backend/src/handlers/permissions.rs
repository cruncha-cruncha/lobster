use crate::common;
use crate::queries::{permissions, stores};
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::permission};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewPermissionParams {
    pub user_id: permission::UserId,
    pub role_id: permission::RoleId,
    pub store_id: Option<permission::StoreId>,
    pub status: permission::Status,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]

pub struct UserPermissions {
    pub library: Vec<i32>,
    pub store: Vec<StorePermissionInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorePermissionInfo {
    pub store_id: i32,
    pub store_name: String,
    pub roles: Vec<i32>,
}

pub async fn add(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(data): Json<NewPermissionParams>,
) -> Result<Json<permission::Permission>, (StatusCode, String)> {
    if !claims.is_user_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            "You must be a user admin to update permissions".to_string(),
        ));
    }

    match permissions::insert(
        data.user_id,
        data.role_id,
        data.store_id,
        data.status,
        &state.db,
    )
    .await
    {
        Ok(p) => Ok(Json(p)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn delete(
    claims: Claims,
    Path(permission_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if !claims.is_user_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            "You must be a user admin to update permissions".to_string(),
        ));
    }

    let status = crate::db_structs::permission::PermissionStatus::Revoked as i32;
    match permissions::update_status(permission_id, status, &state.db).await {
        Ok(_) => Ok(Json(common::NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn get_by_user(
    _claims: Claims,
    Path(user_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<UserPermissions>, (StatusCode, String)> {
    let claim_permissions = match permissions::select_by_user(&user_id, true, &state.db).await {
        Ok(p) => p,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    let store_info = match stores::select(
        stores::SelectParams {
            ids: claim_permissions.store.keys().map(|k| *k).collect(),
            statuses: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1000,
        },
        &state.db,
    )
    .await
    {
        Ok(s) => s,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    let out = UserPermissions {
        library: claim_permissions.library,
        store: claim_permissions
            .store
            .keys()
            .map(|k| {
                let store = store_info.iter().find(|s| s.id == *k).unwrap();
                StorePermissionInfo {
                    store_id: store.id,
                    store_name: store.name.clone(),
                    roles: claim_permissions.store.get(k).unwrap().clone(),
                }
            })
            .collect(),
    };

    return Ok(Json(out));
}
