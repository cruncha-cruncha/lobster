use crate::db_structs::library_information;
use crate::queries::library;
use crate::AppState;
use crate::{auth::claims::Claims, common};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettableLibraryInfo {
    pub name: Option<library_information::Name>,
    pub maximum_rental_hours: Option<library_information::MaximumRentalHours>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLibraryInfo {
    pub name: library_information::Name,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllStatuses {
    pub stores: Vec<common::Status>,
    pub users: Vec<common::Status>,
    pub tools: Vec<common::Status>,
    pub grievances: Vec<common::Status>,
    pub permissions: Vec<common::Status>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleOptions {
    pub roles: Vec<common::Status>,
}

pub async fn get_role_options(
    State(state): State<Arc<AppState>>,
) -> Result<Json<RoleOptions>, (StatusCode, String)> {
    let roles = match library::select_roles(&state.db).await {
        Ok(roles) => roles,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(RoleOptions { roles }))
}

pub async fn get_all_statuses(
    State(state): State<Arc<AppState>>,
) -> Result<Json<AllStatuses>, (StatusCode, String)> { 
    let store_future = crate::queries::stores::select_statuses(&state.db);
    let user_future = crate::queries::users::select_statuses(&state.db);
    let tool_future = crate::queries::tools::select_statuses(&state.db);
    let grievance_future = crate::queries::grievances::select_statuses(&state.db);
    let permission_future = crate::queries::permissions::select_statuses(&state.db);

    let (
        store_statuses,
        user_statuses,
        tool_statuses,
        grievance_statuses,
        permission_statuses,
    ) = match tokio::try_join!(
        store_future,
        user_future,
        tool_future,
        grievance_future,
        permission_future,
    ) {
        Ok(res) => res,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(Json(AllStatuses {
        stores: store_statuses,
        users: user_statuses,
        tools: tool_statuses,
        grievances: grievance_statuses,
        permissions: permission_statuses,
    }))
}

pub async fn get_info(
    State(state): State<Arc<AppState>>,
) -> Result<Json<library_information::LibraryInformation>, (StatusCode, String)> {
    let info = match library::select_information(&state.db).await {
        Ok(info) => {
            if info.is_none() {
                return Err((
                    StatusCode::NOT_FOUND,
                    String::from("Library information not found"),
                ));
            }
            info.unwrap()
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(info))
}

pub async fn update_info(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableLibraryInfo>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if !claims.is_library_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            String::from("Insufficient permissions"),
        ));
    }

    match library::update_information(
        payload.name,
        payload.maximum_rental_hours,
        &state.db,
    )
    .await
    {
        Ok(_) => Ok(Json(common::NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn create_library(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateLibraryInfo>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    match library::select_information(&state.db).await {
        Ok(info) => {
            if info.is_some() {
                return Err((
                    StatusCode::BAD_REQUEST,
                    String::from("Library already exists"),
                ));
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    let maximum_rental_hours = 336;

    match library::insert_information(
        &payload.name,
        maximum_rental_hours,
        &state.db,
    )
    .await
    {
        Ok(_) => Ok(Json(common::NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
