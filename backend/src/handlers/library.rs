use serde::{Deserialize, Serialize};

use crate::auth::encryption::generate_salt;
use crate::queries::library;
use crate::{db_structs::library_information, queries::common};

use super::common::NoData;
use crate::auth::claims::Claims;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicLibraryInfo {
    pub uuid: library_information::Uuid,
    pub name: library_information::Name,
    pub max_rental_period: library_information::MaximumRentalPeriod,
    pub max_future: library_information::MaximumFuture,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettableLibraryInfo {
    pub name: Option<library_information::Name>,
    pub max_rental_period: Option<library_information::MaximumRentalPeriod>,
    pub max_future: Option<library_information::MaximumFuture>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLibraryInfo {
    pub name: library_information::Name,
}

pub async fn get_role_options(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<common::Status>>, (StatusCode, String)> {
    let roles = match library::select_roles(&state.db).await {
        Ok(roles) => roles,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(roles))
}

pub async fn get_info(
    State(state): State<Arc<AppState>>,
) -> Result<Json<PublicLibraryInfo>, (StatusCode, String)> {
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

    Ok(Json(PublicLibraryInfo {
        uuid: info.uuid,
        name: info.name,
        max_rental_period: info.maximum_rental_period,
        max_future: info.maximum_future,
    }))
}

pub async fn update_info(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableLibraryInfo>,
) -> Result<Json<NoData>, (StatusCode, String)> {
    if !claims.is_library_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            String::from("Insufficient permissions"),
        ));
    }

    match library::update_information(
        payload.name,
        payload.max_rental_period,
        payload.max_future,
        &state.db,
    )
    .await
    {
        Ok(_) => Ok(Json(NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn create_library(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateLibraryInfo>,
) -> Result<Json<NoData>, (StatusCode, String)> {
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

    let salt = generate_salt();
    let maximum_rental_period = 336;
    let maximum_future = 60;

    match library::insert_information(
        &payload.name,
        &salt,
        maximum_rental_period,
        maximum_future,
        &state.db,
    )
    .await
    {
        Ok(_) => Ok(Json(NoData {})),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
