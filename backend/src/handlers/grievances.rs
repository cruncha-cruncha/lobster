use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::{grievance, user};
use crate::queries::grievances::{self, GrievanceWithNames};
use crate::AppState;
use axum::extract::Path;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use axum_extra::extract::Query;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub author_ids: Option<Vec<grievance::AuthorId>>,
    pub accused_ids: Option<Vec<grievance::AccusedId>>,
    pub statuses: Option<Vec<grievance::Status>>, // Option<Vec<tool::Status>>,
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
) -> Result<Json<grievance::Grievance>, common::ErrResponse> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => {
            return Err(common::ErrResponse::new(
                StatusCode::UNAUTHORIZED,
                "ERR_AUTH",
                "Invalid user id in claims",
            ))
        }
    };

    match grievances::insert(
        author_id,
        payload.accused_id,
        payload.title,
        payload.description,
        grievance::GrievanceStatus::Pending as i32,
        &state.db,
    )
    .await
    {
        Ok(grievance) => Ok(Json(grievance)),
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<grievance::Grievance>, common::ErrResponse> {
    if !claims.is_user_admin() {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a user admin",
        ));
    }

    match grievances::update_status(grievance_id, payload.status, &state.db).await {
        Ok(g) => {
            if g.is_some() {
                Ok(Json(g.unwrap()))
            } else {
                Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Could not find any grievance with that id",
                ))
            }
        }
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}

pub async fn get_filtered(
    claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievancesResponse>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "User is not logged in",
        ));
    }

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
    .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))
}

pub async fn get_by_id(
    claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievanceWithNames>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "User is not logged in",
        ));
    }

    match grievances::select_by_id(grievance_id, &state.db).await {
        Ok(grievance) => {
            if grievance.is_some() {
                Ok(Json(grievance.unwrap()))
            } else {
                Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Could not find any grievance with that id",
                ))
            }
        }
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}
