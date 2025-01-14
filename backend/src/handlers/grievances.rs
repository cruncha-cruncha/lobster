use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::{grievance, user};
use crate::queries::grievances::{self, GrievanceWithNames};
use crate::AppState;
use axum::extract::{Path, Query};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub author_ids: Option<Vec<grievance::AuthorId>>,
    pub accused_ids: Option<Vec<grievance::AccusedId>>,
    pub statuses: Option<Vec<grievance::Status>>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrievancesResponse {
    pub grievances: Vec<GrievanceWithNames>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGrievanceData {
    pub title: grievance::Title,
    pub description: grievance::Description,
    pub accused_id: user::Id,
}

pub async fn create_new(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateGrievanceData>,
) -> Result<Json<grievance::Grievance>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::UNAUTHORIZED, String::from(""))),
    };

    match grievances::insert(
        author_id,
        payload.accused_id,
        payload.title,
        payload.description,
        grievance::GrievanceStatus::Open as i32,
        &state.db,
    )
    .await
    {
        Ok(grievance) => Ok(Json(grievance)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<grievance::Grievance>, (StatusCode, String)> {
    if !claims.is_user_admin() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    match grievances::update_status(grievance_id, payload.status, &state.db).await {
        Ok(g) => Ok(Json(g)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

pub async fn get_filtered(
    _claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievancesResponse>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());
    grievances::select(
        grievances::SelectParams {
            author_ids: params.author_ids.unwrap_or_default(),
            accused_ids: params.accused_ids.unwrap_or_default(),
            statuses: params.statuses.unwrap_or_default(),
            offset,
            limit,
        },
        &state.db,
    )
    .await
    .map(|grievances| Json(GrievancesResponse { grievances }))
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn get_by_id(
    claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievanceWithNames>, (StatusCode, String)> {
    if claims.is_none() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    match grievances::select_by_id(grievance_id, &state.db).await {
        Ok(grievance) => Ok(Json(grievance)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
