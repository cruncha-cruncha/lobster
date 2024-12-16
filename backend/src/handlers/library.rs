use serde::{Deserialize, Serialize};

use crate::auth::encryption::generate_salt;
use crate::queries::library;
use crate::{db_structs::library_information, queries::common};

use crate::auth::claims::Claims;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct PublicLibraryInfo {
    pub uuid: library_information::Uuid,
    pub name: library_information::Name,
    pub maximum_rental_period: library_information::MaximumRentalPeriod,
    pub maximum_future: library_information::MaximumFuture,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettableLibraryInfo {
    pub name: Option<library_information::Name>,
    pub maximum_rental_period: Option<library_information::MaximumRentalPeriod>,
    pub maximum_future: Option<library_information::MaximumFuture>,
}

#[derive(Debug, Serialize, Deserialize)]
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
        Ok(info) => info,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(PublicLibraryInfo {
        uuid: info.uuid,
        name: info.name,
        maximum_rental_period: info.maximum_rental_period,
        maximum_future: info.maximum_future,
    }))
}

pub async fn update_info(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableLibraryInfo>,
) -> Result<Json<PublicLibraryInfo>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}

pub async fn create_library(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateLibraryInfo>,
) -> Result<(), (StatusCode, String)> {
    match library::select_information(&state.db).await {
        Ok(_) => return Err((StatusCode::BAD_REQUEST, String::from("Library already exists"))),
        Err(_) => (),
    };

    let salt = generate_salt();
    let maximum_rental_period = 336;
    let maximum_future = 60;

    match library::insert_information(&payload.name, &salt, maximum_rental_period, maximum_future, &state.db).await {
        Ok(_) => Ok(()),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
