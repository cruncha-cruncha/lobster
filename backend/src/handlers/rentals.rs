use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::tool_classification::ToolClassification;
use crate::db_structs::{store, tool, user, tool_category, tool_classification};
use crate::queries::{stores, tool_categories, tool_classifications, tools};
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use axum_extra::extract::Query;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckInData {
    pub tool_ids: Vec<tool::Id>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckOutData {
    pub tool_ids: Vec<tool::Id>,
    pub user_code: Option<user::Code>,
    pub store_code: Option<store::Code>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RentalResponse {
    pub tool_ids: Vec<tool::Id>,
}

pub async fn check_in(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CheckInData>,
) -> Result<Json<RentalResponse>, (StatusCode, String)> {
    // payload needs: tool_ids
    // first, get the store id for every tool. then make sure the claims user is a tool manager of all those stores
    // then, update the status of the tools to Available (only if they are currently CheckedOut)
    // then, update the rental records (if they exist)
    // return a list of tool ids that were successfully checked in
    Ok(Json(RentalResponse {
        tool_ids: vec![],
    }))
}

pub async fn check_out(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CheckOutData>,
) -> Result<Json<RentalResponse>, (StatusCode, String)> {
    // payload needs: tool_ids, option user_code, option store_code
    // first, get the store id for every tool.
    // if user code is some, make sure the claims user is a tool manager of all those stores
    // if store code is some, make sure all the tools belong to that store
    // then, update the status of the tools to CheckedOut (only if they are currently Available)
    // then, create rental records for the tools
    // return a list of tool ids that were successfully checked out
    Ok(Json(RentalResponse {
        tool_ids: vec![],
    }))
}

pub async fn get_filtered(
    claims: Claims,
    // query
    State(state): State<Arc<AppState>>,
) -> Result<(), (StatusCode, String)> {
    // select by id, user_id, tool_id, store_id, start_date, end_date, open, overdue, order_by, page
    // sort by stat_date reverse by default? (approximately who is going to return the tool soonest)
    // return rental, store, tool, and user info?
    Err((StatusCode::INTERNAL_SERVER_ERROR, "Not implemented".to_string()))
}