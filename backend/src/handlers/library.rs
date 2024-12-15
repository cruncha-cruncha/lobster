use serde::{Deserialize, Serialize};

use crate::{db_structs::library_information, queries::common};

use crate::auth::claims::Claims;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

const PAGE_SIZE: i64 = 20;

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

pub async fn get_role_options(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<common::Status>>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}

pub async fn get_info(
    State(state): State<Arc<AppState>>,
) -> Result<Json<PublicLibraryInfo>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}

pub async fn set_info(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableLibraryInfo>,
) -> Result<Json<PublicLibraryInfo>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}
