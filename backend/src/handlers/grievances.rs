use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::{grievance, store, user};
use crate::queries::grievances::{select_statuses, GrievanceWithNames};
use crate::AppState;
use axum::extract::{Path, Query};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// get possible statuses for a grievance
// check how many grievances any user has received
// check how many grievances anyone related to a store has received
// get grievances for any user
// get grievances for any user related to a store
// as a user admin, update the status of a grievance

// /grievances
// /grievances/statuses
// /grievances/users?page=_p&asAuthor=true&asAccused=true&userId=_u
// /grievances/store/:store_id?page=_p&asAuthor=true&asAccused=true
// /grievances/:id

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Params {
    pub page: i32,
    pub as_author: Option<bool>,
    pub as_accused: Option<bool>,
    pub user_id: Vec<user::Id>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GrievancesResponse {
    pub page_size: i32,
    pub grievances: Vec<GrievanceWithNames>,
}

pub async fn create(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievanceWithNames>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}

pub async fn update_status(
    _claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<()>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}

pub async fn by_user_ids(
    _claims: Claims,
    Query(params): Query<Params>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievancesResponse>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}

pub async fn by_store_id(
    _claims: Claims,
    Path(store_id): Path<store::Id>,
    Query(params): Query<Params>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievancesResponse>, (StatusCode, String)> {
    Err((StatusCode::NOT_IMPLEMENTED, String::from("")))
}
