use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::{store, tool};
use crate::queries::tools;
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
pub struct NewToolData {
    pub real_id: Option<tool::RealId>,
    pub store_id: store::Id,
    pub category_id: tool::CategoryId,
    pub default_rental_period: Option<tool::DefaultRentalPeriod>,
    pub description: Option<tool::Description>,
    pub pictures: tool::Pictures,
    pub status: Option<tool::Status>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateToolData {
    pub real_id: Option<tool::RealId>,
    pub category_id: Option<tool::CategoryId>,
    pub default_rental_period: Option<tool::DefaultRentalPeriod>,
    pub description: Option<tool::Description>,
    pub pictures: Option<tool::Pictures>,
    pub status: Option<tool::Status>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub store_ids: Option<Vec<store::Id>>,
    pub statuses: Option<Vec<tool::Status>>,
    pub categories: Option<Vec<tool::CategoryId>>,
    pub page: Option<i64>,
}

pub async fn create_new(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<NewToolData>,
) -> Result<Json<tool::Tool>, (StatusCode, String)> {
    if !claims.is_tool_manager(payload.store_id) {
        return Err((
            StatusCode::FORBIDDEN,
            "User is not a tool manager of this store".to_string(),
        ));
    }

    let tool = match tools::insert(
        payload.real_id.unwrap_or(common::rnd_code_str("t-")),
        payload.store_id,
        payload.category_id,
        payload.default_rental_period,
        payload.description,
        payload.pictures,
        payload.status.unwrap_or(tool::ToolStatus::Available as i32),
        &state.db,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let encoded = serde_json::to_vec(&tool).unwrap_or_default();
    state.comm.send_message("tools", &encoded).await.ok();
    Ok(Json(tool))
}

pub async fn update(
    claims: Claims,
    Path(tool_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateToolData>,
) -> Result<Json<tool::Tool>, (StatusCode, String)> {
    match tools::select(
        tools::SelectParams {
            ids: vec![tool_id],
            statuses: vec![],
            store_ids: vec![],
            category_ids: vec![],
            real_ids: vec![],
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(tools) => {
            if tools.is_empty() {
                return Err((StatusCode::NOT_FOUND, "Tool not found".to_string()));
            } else if !claims.is_tool_manager(tools[0].store_id) {
                return Err((
                    StatusCode::FORBIDDEN,
                    "User is not a tool manager of this store".to_string(),
                ));
            }
        }
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    }

    let tool = match tools::update(
        tool_id,
        payload.real_id,
        None,
        payload.category_id,
        payload.default_rental_period,
        payload.description,
        payload.pictures,
        payload.status,
        &state.db,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let encoded = serde_json::to_vec(&tool).unwrap_or_default();
    state.comm.send_message("tools", &encoded).await.ok();
    Ok(Json(tool))
}

pub async fn get_by_id(
    _claims: Claims,
    Path(tool_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<tool::Tool>, (StatusCode, String)> {
    let mut tools = match tools::select(
        tools::SelectParams {
            ids: vec![tool_id],
            statuses: vec![],
            store_ids: vec![],
            category_ids: vec![],
            real_ids: vec![],
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(tools) => tools,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    if tools.is_empty() {
        return Err((StatusCode::NOT_FOUND, "Tool not found".to_string()));
    }

    Ok(Json(tools.pop().unwrap()))
}

pub async fn get_filtered(
    _claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<tool::Tool>>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let tools = match tools::select(
        tools::SelectParams {
            ids: vec![],
            statuses: params.statuses.unwrap_or_default(),
            store_ids: params.store_ids.unwrap_or_default(),
            category_ids: params.categories.unwrap_or_default(),
            real_ids: vec![],
            offset,
            limit,
        },
        &state.db,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    Ok(Json(tools))
}
