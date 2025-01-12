use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::tool_classification::ToolClassification;
use crate::db_structs::{store, tool, tool_category, tool_classification};
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
pub struct NewToolData {
    pub real_id: Option<tool::RealId>,
    pub store_id: store::Id,
    pub category_ids: Vec<tool_category::Id>,
    pub rental_hours: tool::RentalHours,
    pub description: tool::Description,
    pub pictures: tool::Pictures,
    pub status: Option<tool::Status>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateToolData {
    pub real_id: Option<tool::RealId>,
    pub category_ids: Option<Vec<tool_category::Id>>,
    pub rental_hours: Option<tool::RentalHours>,
    pub description: Option<tool::Description>,
    pub pictures: Option<tool::Pictures>,
    pub status: Option<tool::Status>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub term: Option<String>,
    pub store_ids: Option<Vec<store::Id>>,
    pub statuses: Option<Vec<tool::Status>>,
    pub categories: Option<Vec<tool_category::Id>>,
    pub match_all_categories: Option<bool>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolWithText {
    pub id: tool::Id,
    pub real_id: tool::RealId,
    pub store_id: tool::StoreId,
    pub store_name: store::Name,
    pub rental_hours: tool::RentalHours,
    pub description: tool::Description,
    pub pictures: tool::Pictures,
    pub status: tool::Status,
    pub categories: Vec<tool_category::ToolCategory>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolWithClassifications {
    pub id: tool::Id,
    pub real_id: tool::RealId,
    pub store_id: tool::StoreId,
    pub rental_hours: tool::RentalHours,
    pub description: tool::Description,
    pub pictures: tool::Pictures,
    pub status: tool::Status,
    pub classifications: Vec<tool_classification::CategoryId>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolSearchResponse {
    pub tools: Vec<ToolWithClassifications>,
    pub stores: Vec<store::Store>,
    pub categories: Vec<tool_category::ToolCategory>,
}

pub async fn create_new(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<NewToolData>,
) -> Result<Json<ToolWithText>, (StatusCode, String)> {
    if !claims.is_tool_manager(payload.store_id) {
        return Err((
            StatusCode::FORBIDDEN,
            "User is not a tool manager of this store".to_string(),
        ));
    }

    let tool = match tools::insert(
        payload.real_id.unwrap_or(common::rnd_code_str("t-")),
        payload.store_id,
        payload.rental_hours,
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

    let store_name = match stores::select(
        stores::SelectParams {
            ids: vec![payload.store_id],
            statuses: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(s) => s[0].name.clone(),
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let categories = match tool_categories::select(
        tool_categories::SelectParams {
            ids: payload.category_ids,
            tool_ids: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1000,
        },
        &state.db,
    )
    .await
    {
        Ok(c) => c,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let encoded = serde_json::to_vec(&tool).unwrap_or_default();
    state.comm.send_message("tools", &encoded).await.ok();
    Ok(Json(ToolWithText {
        id: tool.id,
        real_id: tool.real_id,
        store_id: tool.store_id,
        store_name,
        rental_hours: tool.rental_hours,
        description: tool.description,
        pictures: tool.pictures,
        status: tool.status,
        categories,
    }))
}

pub async fn update(
    claims: Claims,
    Path(tool_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UpdateToolData>,
) -> Result<Json<ToolWithText>, (StatusCode, String)> {
    // all the sql statements in this handler should be inside a transaction, but I'm ignoring that for now
    match tools::select(
        tools::SelectParams {
            ids: vec![tool_id],
            term: "".to_string(),
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
        payload.rental_hours,
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

        let new_categories = payload.category_ids.as_deref().unwrap_or_default();

        let mut to_add: Vec<tool_classification::ToolClassification> = vec![];
        for category_id in new_categories {
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

    let store_name = match stores::select(
        stores::SelectParams {
            ids: vec![tool.store_id],
            statuses: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(s) => s[0].name.clone(),
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let categories = match tool_categories::select(
        tool_categories::SelectParams {
            ids: vec![],
            tool_ids: vec![tool_id],
            term: "".to_string(),
            offset: 0,
            limit: 1000,
        },
        &state.db,
    )
    .await
    {
        Ok(c) => c,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let encoded = serde_json::to_vec(&tool).unwrap_or_default();
    state.comm.send_message("tools", &encoded).await.ok();
    Ok(Json(ToolWithText {
        id: tool.id,
        real_id: tool.real_id,
        store_id: tool.store_id,
        store_name,
        rental_hours: tool.rental_hours,
        description: tool.description,
        pictures: tool.pictures,
        status: tool.status,
        categories,
    }))
}

pub async fn get_by_id(
    _claims: Claims,
    Path(tool_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<ToolWithText>, (StatusCode, String)> {
    let mut tools = match tools::select(
        tools::SelectParams {
            ids: vec![tool_id],
            term: "".to_string(),
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
    let tool = tools.pop().unwrap();

    let store_name = match stores::select(
        stores::SelectParams {
            ids: vec![tool.store_id],
            statuses: vec![],
            term: "".to_string(),
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(s) => s[0].name.clone(),
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let categories = match tool_categories::select(
        tool_categories::SelectParams {
            ids: vec![],
            tool_ids: vec![tool.id],
            term: "".to_string(),
            offset: 0,
            limit: 1000,
        },
        &state.db,
    )
    .await
    {
        Ok(c) => c,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    Ok(Json(ToolWithText {
        id: tool.id,
        real_id: tool.real_id,
        store_id: tool.store_id,
        store_name,
        rental_hours: tool.rental_hours,
        description: tool.description,
        pictures: tool.pictures,
        status: tool.status,
        categories,
    }))
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
            term: params.term.unwrap_or_default(),
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

    let tool_ids = tools.iter().map(|t| t.id).collect::<Vec<tool::Id>>();
    let mut store_ids = tools.iter().map(|t| t.store_id).collect::<Vec<store::Id>>();
    store_ids.dedup(); // better than nothing

    let mut classifications: Vec<ToolClassification> = vec![];
    if !tool_ids.is_empty() {
        classifications = match tool_classifications::select(tool_ids.clone(), vec![], &state.db).await {
            Ok(c) => c,
            Err(e) => {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
            }
        };
    }

    let mut stores: Vec<store::Store> = vec![];
    if !store_ids.is_empty() {
        stores = match stores::select(
            stores::SelectParams {
                ids: store_ids,
                statuses: vec![],
                term: "".to_string(),
                offset: 0,
                limit: 1000,
            },
            &state.db,
        )
        .await
        {
            Ok(s) => s,
            Err(e) => {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
            }
        };
    }

    let tools_with_classifications = tools
        .iter()
        .map(|t| {
            let classifications = classifications
                .iter()
                .filter(|c| c.tool_id == t.id)
                .map(|c| c.category_id)
                .collect();

            ToolWithClassifications {
                id: t.id,
                real_id: t.real_id.clone(),
                store_id: t.store_id,
                rental_hours: t.rental_hours,
                description: t.description.clone(),
                pictures: t.pictures.clone(),
                status: t.status,
                classifications,
            }
        })
        .collect();

    let mut categories: Vec<tool_category::ToolCategory> = vec![];
    if !tool_ids.is_empty() {
        categories = match tool_categories::select(
            tool_categories::SelectParams {
                ids: vec![],
                tool_ids: tool_ids,
                term: "".to_string(),
                offset: 0,
                limit: 1000,
            },
            &state.db,
        )
        .await
        {
            Ok(c) => c,
            Err(e) => {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
            }
        };
    }

    Ok(Json(ToolSearchResponse {
        tools: tools_with_classifications,
        stores,
        categories,
    }))
}
