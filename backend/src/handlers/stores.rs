use crate::common;
use crate::queries::stores;
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::store};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use axum_extra::extract::Query;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStoreData {
    pub name: store::Name,
    pub location: store::Location,
    pub hours: store::Location,
    pub contact: store::Contact,
    pub description: store::Contact,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettableStoreData {
    pub name: Option<store::Name>,
    pub location: Option<store::Location>,
    pub hours: Option<store::Location>,
    pub contact: Option<store::Contact>,
    pub description: Option<store::Contact>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub ids: Option<Vec<store::Id>>,
    pub statuses: Option<Vec<store::Status>>,
    pub name: Option<String>,
    pub page: Option<i64>,
}

pub async fn create_new(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateStoreData>,
) -> Result<Json<common::IdOnly>, (StatusCode, String)> {
    stores::insert(
        payload.name,
        3,
        payload.location,
        payload.hours,
        payload.contact,
        payload.description,
        &state.db,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    .map(|id| Json(common::IdOnly { id }))
}

pub async fn update_info(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableStoreData>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    match claims.permissions.store.get(&store_id) {
        Some(roles) => {
            if !roles.contains(&4) {
                return Err((StatusCode::UNAUTHORIZED, "Must be a store rep".to_string()));
            }
        }
        None => return Err((StatusCode::UNAUTHORIZED, "Must be a store rep".to_string())),
    }

    stores::update(
        store_id,
        payload.name,
        None,
        payload.location,
        payload.hours,
        payload.contact,
        payload.description,
        &state.db,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    .map(|_| Json(common::NoData {}))
}

pub async fn update_status(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<common::NoData>, (StatusCode, String)> {
    if !claims.is_store_admin() {
        return Err((
            StatusCode::UNAUTHORIZED,
            "Must be a store admin".to_string(),
        ));
    }

    stores::update(
        store_id,
        None,
        Some(payload.status),
        None,
        None,
        None,
        None,
        &state.db,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    .map(|_| Json(common::NoData {}))
}

pub async fn get_by_id(
    _claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<store::Store>, (StatusCode, String)> {
    let mut stores = match stores::select(
        stores::SelectParams {
            ids: vec![store_id],
            statuses: vec![],
            name: String::new(),
            offset: 0,
            limit: 1,
        },
        &state.db,
    )
    .await
    {
        Ok(s) => s,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if stores.len() < 1 {
        return Err((StatusCode::NOT_FOUND, "not found".to_string()));
    }

    Ok(Json(stores.remove(0)))
}

pub async fn get_filtered(
    _claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<store::Store>>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let stores = match stores::select(
        stores::SelectParams {
            ids: params.ids.unwrap_or_default(),
            statuses: params.statuses.unwrap_or_default(),
            name: params.name.unwrap_or_default(),
            offset: offset,
            limit: limit,
        },
        &state.db,
    )
    .await
    {
        Ok(s) => s,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(Json(stores))
}
