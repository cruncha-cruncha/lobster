use crate::queries::{permissions, stores};
use crate::AppState;
use crate::{auth, common};
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
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]

pub struct UserPermissions {
    pub library: Vec<LibraryPermissionInfo>,
    pub store: Vec<StorePermissionInfo>,
    pub store_names: Vec<StoreNamePermissionInfo>, // this should be a hashmap, but json typedef validator doesn't like those
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryPermissionInfo {
    pub id: i32,
    pub role: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorePermissionInfo {
    pub id: i32,
    pub store_id: i32,
    pub role: i32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreNamePermissionInfo {
    pub store_id: i32,
    pub store_name: String,
}

fn can_modify(claims: &Claims, role_id: i32, user_id: i32, store_id: Option<i32>) -> bool {
    if claims.is_library_admin()
        && (role_id == auth::claims::Roles::LibraryAdmin as i32
            || role_id == auth::claims::Roles::UserAdmin as i32
            || role_id == auth::claims::Roles::StoreAdmin as i32)
        && user_id != claims.subject_as_user_id().unwrap_or_default()
    {
        return true;
    } else if claims.is_store_admin()
        && (role_id == auth::claims::Roles::StoreRep as i32
            || role_id == auth::claims::Roles::ToolManager as i32)
    {
        return true;
    } else if claims.is_store_rep(store_id.unwrap_or_default())
        && (role_id == auth::claims::Roles::StoreRep as i32
            || role_id == auth::claims::Roles::ToolManager as i32)
        && user_id != claims.subject_as_user_id().unwrap_or_default()
    {
        return true;
    }

    return false;
}

pub async fn add(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(data): Json<NewPermissionParams>,
) -> Result<Json<permission::Permission>, (StatusCode, String)> {
    if !can_modify(&claims, data.role_id, data.user_id, data.store_id) {
        return Err((
            StatusCode::FORBIDDEN,
            "You do not have permission to assign this role".to_string(),
        ));
    }

    let mut store_ids = vec![];
    if let Some(store_id) = data.store_id {
        store_ids.push(store_id);
    }
    let mut permissions = match permissions::select(
        permissions::SelectParams {
            ids: vec![],
            user_ids: vec![data.user_id],
            role_ids: vec![data.role_id],
            store_ids: store_ids,
            statuses: vec![],
        },
        &state.db,
    )
    .await
    {
        Ok(p) => p,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    if permissions.len() > 0 && permissions[0].status == permission::PermissionStatus::Active as i32
    {
        return Ok(Json(permissions.pop().unwrap()));
    }

    if permissions.len() > 0 {
        match permissions::update_status(permissions[0].id, permission::PermissionStatus::Active as i32, &state.db).await {
            Ok(_) => Ok(Json(permissions.pop().unwrap())),
            Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    } else {
        match permissions::insert(
            data.user_id,
            data.role_id,
            data.store_id,
            permission::PermissionStatus::Active as i32,
            &state.db,
        )
        .await
        {
            Ok(p) => Ok(Json(p)),
            Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    }
}

pub async fn delete(
    claims: Claims,
    Path(permission_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    let err_resp = Err((
        StatusCode::FORBIDDEN,
        "You do not have permission to modify this role".to_string(),
    ));

    let permissions = match permissions::select(
        permissions::SelectParams {
            ids: vec![permission_id],
            user_ids: vec![],
            role_ids: vec![],
            store_ids: vec![],
            statuses: vec![],
        },
        &state.db,
    )
    .await
    {
        Ok(p) => p,
        Err(_) => {
            return err_resp;
        }
    };

    if permissions.is_empty() {
        return err_resp;
    }
    let permission = &permissions[0];
    if !can_modify(
        &claims,
        permission.role_id,
        permission.user_id,
        permission.store_id,
    ) {
        return err_resp;
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
    let permissions = match permissions::select(
        permissions::SelectParams {
            ids: vec![],
            user_ids: vec![user_id],
            role_ids: vec![],
            store_ids: vec![],
            statuses: vec![permission::PermissionStatus::Active as i32],
        },
        &state.db,
    )
    .await
    {
        Ok(p) => p,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    let library_permissions = permissions
        .iter()
        .filter(|p| p.store_id.is_none())
        .collect::<Vec<_>>();
    let store_permissions = permissions
        .iter()
        .filter(|p| p.store_id.is_some())
        .collect::<Vec<_>>();

    let mut store_ids = store_permissions
        .iter()
        .map(|p| p.store_id.unwrap_or_default())
        .collect::<Vec<i32>>();
    store_ids.dedup();
    let store_info = match stores::select(
        stores::SelectParams {
            ids: store_ids,
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
        library: library_permissions
            .iter()
            .map(|p| LibraryPermissionInfo {
                id: p.id,
                role: p.role_id,
            })
            .collect(),
        store: store_permissions
            .iter()
            .map(|p| StorePermissionInfo {
                id: p.id,
                store_id: p.store_id.unwrap_or_default(),
                role: p.role_id,
            })
            .collect(),
        store_names: store_info
            .iter()
            .map(|s| StoreNamePermissionInfo {
                store_id: s.id,
                store_name: s.name.clone(),
            })
            .collect(),
    };

    return Ok(Json(out));
}
