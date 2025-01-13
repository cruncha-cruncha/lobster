use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::{rental, store, tool, user};
use crate::queries::{rentals, stores, tools, users};
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
pub struct FilterParams {
    pub renter_ids: Option<Vec<rental::RenterId>>,
    pub tool_ids: Option<Vec<rental::ToolId>>,
    pub store_ids: Option<Vec<tool::StoreId>>,
    pub start_date: Option<common::DateBetween>,
    pub end_date: Option<common::DateBetween>,
    pub open: Option<bool>,
    pub overdue: Option<bool>,
    pub order_by: Option<rentals::OrderBy>,
    pub order_asc: Option<bool>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettableRentalData {
    pub end_date: Option<rental::EndDate>,
    pub no_end_date: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilteredResponse {
    pub rentals: Vec<rental::Rental>,
}

pub async fn check_in(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CheckInData>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if payload.tool_ids.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No tools to check in".to_string()));
    }

    let tools = match tools::select(
        tools::SelectParams {
            ids: payload.tool_ids.clone(),
            term: "".to_string(),
            statuses: vec![],
            store_ids: vec![],
            category_ids: vec![],
            match_all_categories: false,
            real_ids: vec![],
            offset: 0,
            limit: payload.tool_ids.len() as i64,
        },
        &state.db,
    )
    .await
    {
        Ok(tools) => tools,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    if tools.len() != payload.tool_ids.len() {
        return Err((StatusCode::NOT_FOUND, "Some tools not found".to_string()));
    }

    for tool in &tools {
        if !claims.is_tool_manager(tool.store_id) {
            return Err((
                StatusCode::FORBIDDEN,
                "User is not a tool manager of all the stores".to_string(),
            ));
        }
    }

    for tool in &tools {
        if tool.status != tool::ToolStatus::Rented as i32 {
            continue;
        }

        match tools::update(
            tool.id,
            None,
            None,
            None,
            None,
            Some(tool::ToolStatus::Available as i32),
            &state.db,
        )
        .await
        {
            Ok(_) => {}
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    }

    let rentals = match rentals::select(
        rentals::SelectParams {
            renter_ids: vec![],
            tool_ids: payload.tool_ids.clone(),
            store_ids: vec![],
            start_date: common::DateBetween::none(),
            end_date: common::DateBetween::none(),
            open: true,
            overdue: None,
            order_by: rentals::OrderBy::StartDate,
            order_asc: false,
            offset: 0,
            limit: payload.tool_ids.len() as i64,
        },
        &state.db,
    )
    .await
    {
        Ok(rentals) => rentals,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    let now = time::OffsetDateTime::now_utc();
    for rental in &rentals {
        match rentals::update(rental.id, None, Some(now), &state.db).await {
            Ok(_) => {}
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    }

    Ok(Json(common::NoData {}))
}

pub async fn check_out(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CheckOutData>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if payload.tool_ids.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "No tools to check out".to_string()));
    }

    if payload.user_code.is_none() && payload.store_code.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Either user code or store code must be provided".to_string(),
        ));
    }

    if payload.user_code.is_some() && payload.store_code.is_some() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Both user code and store code cannot be provided".to_string(),
        ));
    }

    let tools = match tools::select(
        tools::SelectParams {
            ids: payload.tool_ids.clone(),
            term: "".to_string(),
            statuses: vec![],
            store_ids: vec![],
            category_ids: vec![],
            match_all_categories: false,
            real_ids: vec![],
            offset: 0,
            limit: payload.tool_ids.len() as i64,
        },
        &state.db,
    )
    .await
    {
        Ok(tools) => tools,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    if tools.len() != payload.tool_ids.len() {
        return Err((StatusCode::NOT_FOUND, "Some tools not found".to_string()));
    }

    if payload.user_code.is_some() {
        for tool in &tools {
            if !claims.is_tool_manager(tool.store_id) {
                return Err((
                    StatusCode::FORBIDDEN,
                    "User is not a tool manager of all the stores".to_string(),
                ));
            }
        }
    }

    if payload.store_code.is_some() {
        let code = payload.store_code.unwrap();
        let store = match stores::select_by_code(code, &state.db).await {
            Ok(s) => s,
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        };

        for tool in &tools {
            if tool.store_id != store.id {
                return Err((
                    StatusCode::FORBIDDEN,
                    "Some tools do not belong to the store".to_string(),
                ));
            }
        }
    }

    for tool in &tools {
        match tools::update(
            tool.id,
            None,
            None,
            None,
            None,
            Some(tool::ToolStatus::Rented as i32),
            &state.db,
        )
        .await
        {
            Ok(_) => {}
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    }

    let mut renter_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "No user id found in claims".to_string(),
            ))
        }
    };
    if payload.user_code.is_some() {
        let code = payload.user_code.unwrap();
        let user = match users::select_by_code(code, &state.db).await {
            Ok(u) => u,
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        };
        renter_id = user.id;
    }

    let now = time::OffsetDateTime::now_utc();
    for tool in &tools {
        match rentals::insert(tool.id, renter_id, now, None, &state.db).await {
            Ok(_) => {}
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    }

    Ok(Json(common::NoData {}))
}

pub async fn get_filtered(
    _claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<FilteredResponse>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let rentals = match rentals::select(
        rentals::SelectParams {
            renter_ids: params.renter_ids.unwrap_or_default(),
            tool_ids: params.tool_ids.unwrap_or_default(),
            store_ids: params.store_ids.unwrap_or_default(),
            start_date: params.start_date.unwrap_or_default(),
            end_date: params.end_date.unwrap_or_default(),
            open: params.open.unwrap_or_default(),
            overdue: params.overdue,
            order_by: params.order_by.unwrap_or(rentals::OrderBy::StartDate),
            order_asc: params.order_asc.unwrap_or_default(),
            offset,
            limit,
        },
        &state.db,
    )
    .await
    {
        Ok(r) => r,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    };

    Ok(Json(FilteredResponse { rentals }))
}

pub async fn get_by_id(
    _claims: Claims,
    Path(rental_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<rental::Rental>, (StatusCode, String)> {
    rentals::select_by_id(rental_id, &state.db)
        .await
        .map(|r| Json(r))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn update(
    _claims: Claims,
    Path(rental_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableRentalData>,
) -> Result<Json<rental::Rental>, (StatusCode, String)> {
    if payload.no_end_date.is_some() && payload.end_date.is_some() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Both end date and no end date cannot be provided".to_string(),
        ));
    }

    if payload.no_end_date.is_some() && payload.no_end_date.unwrap() {
        match rentals::clear_fields(rental_id, true, &state.db).await {
            Ok(_) => {}
            Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        }
    }

    rentals::update(rental_id, None, payload.end_date, &state.db)
        .await
        .map(|r| Json(r))
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}
