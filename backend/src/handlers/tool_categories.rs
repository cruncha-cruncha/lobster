use crate::common;
use crate::db_structs::tool_category;
use crate::queries::tool_categories;
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::tool_classification};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use axum_extra::extract::Query;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewToolCategoryData {
    pub name: tool_category::Name,
    pub synonyms: Option<tool_category::Synonyms>,
    pub description: Option<tool_category::Description>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateToolCategoryData {
    pub name: Option<tool_category::Name>,
    pub synonyms: Option<tool_category::Synonyms>,
    pub description: Option<tool_category::Description>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub ids: Option<Vec<tool_category::Id>>,
    pub tool_ids: Option<Vec<tool_classification::ToolId>>,
    pub term: Option<String>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResponse {
    pub categories: Vec<tool_category::ToolCategory>,
}

pub async fn create_new(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<NewToolCategoryData>,
) -> Result<Json<tool_category::ToolCategory>, common::ErrResponse> {
    if !claims.is_library_admin() {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a library admin",
        ));
    }

    common::verify_payload_text_length(&payload.name, 1, common::MAX_TOOL_CATEGORY_NAME_LENGTH)?;
    common::none_or_verify_payload_text_length(payload.description.as_deref(), 1, common::MAX_TOOL_CATEGORY_DESCRIPTION_LENGTH)?;
    if payload.synonyms.is_some() {
        if payload.synonyms.as_deref().unwrap_or_default().len() > common::MAX_TOOL_CATEGORY_SYNONYMS_LENGTH{
            return Err(common::ErrResponse::new(
                StatusCode::BAD_REQUEST,
                "ERR_REQ",
                "Too many synonyms",
            ));
        }

        for synonym in payload.synonyms.as_ref().unwrap() {
            common::verify_payload_text_length(synonym, 1, common::MAX_TOOL_CATEGORY_NAME_LENGTH)?;
        }
    }

    let tool_category = match tool_categories::insert(
        payload.name,
        payload.synonyms.unwrap_or_default(),
        payload.description,
        &state.db,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => { 
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    Ok(Json(tool_category))
}

pub async fn update(
    claims: Claims,
    Path(tool_category_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateToolCategoryData>,
) -> Result<Json<tool_category::ToolCategory>, common::ErrResponse> {
    if !claims.is_library_admin() {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a library admin",
        ));
    }

    // TODO: verify

    let tool_category = match tool_categories::update(
        tool_category_id,
        payload.name,
        payload.synonyms,
        payload.description,
        &state.db,
    )
    .await
    {
        Ok(t) => {
            if t.is_none() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Tool category does not exists",
                ));
            }
            t.unwrap()
        }
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    Ok(Json(tool_category))
}

pub async fn get_by_id(
    Path(tool_category_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<tool_category::ToolCategory>, common::ErrResponse> {
    let mut tool_categories = match tool_categories::select(
        tool_categories::SelectParams {
            ids: vec![tool_category_id],
            tool_ids: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(tool_categories) => tool_categories,
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    if tool_categories.is_empty() {
        return Err(common::ErrResponse::new(
            StatusCode::NOT_FOUND,
            "ERR_MIA",
            "Tool category does not exists",
        ));
    }

    Ok(Json(tool_categories.remove(0)))
}

pub async fn get_all(
    State(state): State<Arc<AppState>>,
) -> Result<Json<SearchResponse>, common::ErrResponse> {
    let tool_categories = match tool_categories::select(
        tool_categories::SelectParams {
            ids: vec![],
            tool_ids: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1000,
        },
        &state.db,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    Ok(Json(SearchResponse {
        categories: tool_categories,
    }))
}

pub async fn get_filtered(
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<SearchResponse>, common::ErrResponse> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let tool_categories = match tool_categories::select(
        tool_categories::SelectParams {
            ids: params.ids.unwrap_or_default(),
            tool_ids: params.tool_ids.unwrap_or_default(),
            term: params.term.unwrap_or_default(),
            offset,
            limit,
        },
        &state.db,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    Ok(Json(SearchResponse {
        categories: tool_categories,
    }))
}
