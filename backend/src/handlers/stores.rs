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
    pub email_address: store::EmailAddress,
    pub phone_number: store::PhoneNumber,
    pub rental_information: store::RentalInformation,
    pub other_information: store::OtherInformation,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettableStoreData {
    pub name: Option<store::Name>,
    pub email_address: Option<store::EmailAddress>,
    pub phone_number: Option<store::PhoneNumber>,
    pub rental_information: Option<store::RentalInformation>,
    pub other_information: Option<store::OtherInformation>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterParams {
    pub statuses: Option<Vec<store::Status>>,
    pub term: Option<String>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilteredResponse {
    pub stores: Vec<store::Store>,
}

pub async fn create_new(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateStoreData>,
) -> Result<Json<store::Store>, (StatusCode, String)> {
    let code = common::rnd_code_str("s-");
    match stores::insert(
        payload.name,
        store::StoreStatus::Pending as i32,
        payload.email_address,
        payload.phone_number,
        payload.rental_information,
        payload.other_information,
        code,
        &state.db,
    )
    .await
    {
        Ok(s) => {
            let encoded = serde_json::to_vec(&s).unwrap_or_default();
            state.comm.send_message("stores", &encoded).await.ok();
            Ok(Json(s))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn update_info(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableStoreData>,
) -> Result<Json<store::Store>, (StatusCode, String)> {
    match claims.permissions.store.get(&store_id) {
        Some(roles) => {
            if !roles.contains(&4) {
                return Err((StatusCode::UNAUTHORIZED, "Must be a store rep".to_string()));
            }
        }
        None => return Err((StatusCode::UNAUTHORIZED, "Must be a store rep".to_string())),
    }

    match stores::update(
        store_id,
        payload.name,
        None,
        payload.email_address,
        payload.phone_number,
        payload.rental_information,
        payload.other_information,
        &state.db,
    )
    .await
    {
        Ok(s) => {
            let encoded = serde_json::to_vec(&s).unwrap_or_default();
            state.comm.send_message("stores", &encoded).await.ok();
            Ok(Json(s))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<store::Store>, (StatusCode, String)> {
    if !claims.is_store_admin() {
        return Err((
            StatusCode::UNAUTHORIZED,
            "Must be a store admin".to_string(),
        ));
    }

    match stores::update(
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
    {
        Ok(s) => {
            let encoded = serde_json::to_vec(&s).unwrap_or_default();
            state.comm.send_message("stores", &encoded).await.ok();
            Ok(Json(s))
        }
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
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
            term: String::new(),
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
) -> Result<Json<FilteredResponse>, (StatusCode, String)> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());

    let stores = match stores::select(
        stores::SelectParams {
            ids: vec![],
            statuses: params.statuses.unwrap_or_default(),
            term: params.term.unwrap_or_default(),
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

    Ok(Json(FilteredResponse { stores }))
}
