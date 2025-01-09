use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::tool_classification::ToolClassification;
use crate::db_structs::{store, tool, tool_category, tool_classification};
use crate::queries::{tool_classifications, tools};
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
    pub category_ids: Vec<tool_category::Id>,
    pub default_rental_period: Option<tool::DefaultRentalPeriod>,
    pub description: Option<tool::Description>,
    pub pictures: tool::Pictures,
    pub status: Option<tool::Status>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateToolData {
    pub real_id: Option<tool::RealId>,
    pub category_ids: Option<Vec<tool_category::Id>>,
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
    pub categories: Option<Vec<tool_category::Id>>,
    pub match_all_categories: Option<bool>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolSearchResponse {
    pub tools: Vec<tool::Tool>,
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

    let new_classifications: Vec<ToolClassification> = payload
        .category_ids
        .iter()
        .map(|c| ToolClassification {
            tool_id: tool.id,
            category_id: *c,
        })
        .collect();

    match tool_classifications::insert(new_classifications, &state.db).await {
        Ok(_) => {}
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e));
        }
    }

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
            match_all_categories: false,
            real_ids: vec![],
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(mut tools) => {
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

    if payload.category_ids.is_some() {
        let existing_categories =
            match tool_classifications::select(vec![tool_id], vec![], &state.db).await {
                Ok(c) => c,
                Err(e) => {
                    return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
                }
            };

        let new_categories = payload.category_ids.unwrap();

        let mut to_add: Vec<tool_classification::ToolClassification> = vec![];
        for category_id in &new_categories {
            if !existing_categories
                .iter()
                .any(|c| c.category_id == *category_id)
            {
                to_add.push(ToolClassification {
                    tool_id,
                    category_id: *category_id,
                });
            }
        }

        let mut to_remove: Vec<tool_classification::ToolClassification> = vec![];
        for category in &existing_categories {
            if !new_categories.contains(&category.category_id) {
                to_remove.push(category.clone());
            }
        }

        match tool_classifications::insert(to_add, &state.db).await {
            Ok(_) => {}
            Err(e) => {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, e));
            }
        }

        match tool_classifications::delete(to_remove, &state.db).await {
            Ok(_) => {}
            Err(e) => {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, e));
            }
        }
    }

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
            match_all_categories: false,
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
) -> Result<Json<ToolSearchResponse>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let tools = match tools::select(
        tools::SelectParams {
            ids: vec![],
            category_ids: params.categories.unwrap_or_default(),
            match_all_categories: params.match_all_categories.unwrap_or_default(),
            statuses: params.statuses.unwrap_or_default(),
            store_ids: params.store_ids.unwrap_or_default(),
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

    Ok(Json(ToolSearchResponse { tools }))
}
