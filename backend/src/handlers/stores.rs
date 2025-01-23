use crate::auth::claims;
use crate::common;
use crate::db_structs::{permission, tool};
use crate::queries::{permissions, stores, tools};
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
    pub email_address: Option<store::EmailAddress>,
    pub phone_number: store::PhoneNumber,
    pub rental_information: Option<store::RentalInformation>,
    pub other_information: Option<store::OtherInformation>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettableStoreData {
    pub name: Option<store::Name>,
    pub location: Option<store::Location>,
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
    pub user_ids: Option<Vec<i32>>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilteredResponse {
    pub stores: Vec<store::Store>,
}

pub async fn create_new(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateStoreData>,
) -> Result<Json<store::Store>, common::ErrResponse> {
    let user_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => {
            return Err(common::ErrResponse::new(
                StatusCode::UNAUTHORIZED,
                "ERR_AUTH",
                "Token missing user id",
            ))
        }
    };

    let code = common::rnd_code_str("s-");
    let store = match stores::insert(
        payload.name,
        store::StoreStatus::Pending as i32,
        payload.location,
        payload.email_address,
        payload.phone_number,
        payload.rental_information,
        payload.other_information,
        code,
        &state.db,
    )
    .await
    {
        Ok(s) => s,
        Err(e) => {
            if e.contains("duplicate key value violates unique constraint \"stores_name_key\"") {
                return Err(common::ErrResponse::new(
                    StatusCode::CONFLICT,
                    "ERR_DUP",
                    &e,
                ));
            }

            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    match tokio::try_join!(
        permissions::insert(
            user_id,
            claims::Roles::StoreRep as i32,
            Some(store.id),
            permission::PermissionStatus::Active as i32,
            &state.db,
        ),
        permissions::insert(
            user_id,
            claims::Roles::ToolManager as i32,
            Some(store.id),
            permission::PermissionStatus::Active as i32,
            &state.db,
        ),
    ) {
        Ok(_) => (),
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ))
        }
    };

    let encoded = serde_json::to_vec(&store).unwrap_or_default();
    state.comm.send_message("stores", &encoded).await.ok();
    Ok(Json(store))
}

pub async fn update_info(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<SettableStoreData>,
) -> Result<Json<store::Store>, common::ErrResponse> {
    if !claims.is_store_manager(store_id) {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a store rep",
        ));
    }

    match stores::update(
        store_id,
        payload.name,
        None,
        payload.location,
        payload.email_address,
        payload.phone_number,
        payload.rental_information,
        payload.other_information,
        &state.db,
    )
    .await
    {
        Ok(s) => {
            if s.is_none() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Store not found",
                ));
            }
            let s = s.unwrap();
            let encoded = serde_json::to_vec(&s).unwrap_or_default();
            state.comm.send_message("stores", &encoded).await.ok();
            Ok(Json(s))
        }
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}

pub async fn update_status(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<common::StatusOnly>,
) -> Result<Json<store::Store>, common::ErrResponse> {
    if !claims.is_store_admin() {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not a store admin",
        ));
    }

    let updated_store = match stores::update(
        store_id,
        None,
        Some(payload.status),
        None,
        None,
        None,
        None,
        None,
        &state.db,
    )
    .await
    {
        Ok(s) => {
            if s.is_none() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Store not found",
                ));
            }
            s.unwrap()
        },
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    };

    if payload.status == store::StoreStatus::Active as i32 {
        return Ok(Json(updated_store));
    }

    let tools = match tools::select(
        tools::SelectParams {
            term: "".to_string(),
            statuses: vec![tool::ToolStatus::Available as i32],
            store_ids: vec![store_id],
            category_ids: vec![],
            match_all_categories: false,
            real_ids: vec![],
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
            ))
        }
    };

    for tool in &tools {
        match tools::update(
            tool.id,
            None,
            None,
            None,
            None,
            Some(tool::ToolStatus::Unknown as i32),
            &state.db,
        )
        .await
        {
            Ok(_) => (),
            Err(e) => {
                return Err(common::ErrResponse::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "ERR_DB",
                    &e,
                ))
            }
        }
    }

    Ok(Json(updated_store))
}

pub async fn get_by_id(
    claims: Claims,
    Path(store_id): Path<i32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<store::Store>, common::ErrResponse> {
    let mut store = match stores::select_by_ids(vec![store_id], &state.db).await {
        Ok(mut s) => {
            if s.is_empty() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Store not found",
                ));
            }
            s.remove(0)
        },
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::NOT_FOUND,
                "ERR_MIA",
                &e,
            ))
        }
    };

    let can_see_contact_info = !claims.is_none();
    if !can_see_contact_info {
        store.email_address = None;
        store.phone_number = "".to_string();
        store.location = "".to_string();
    }

    let can_see_code = claims.is_store_admin()
        || claims.is_store_manager(store_id)
        || claims.is_tool_manager(store_id);
    if !can_see_code {
        store.code = String::new();
    }

    Ok(Json(store))
}

pub async fn get_filtered(
    claims: Claims,
    Query(params): Query<FilterParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<FilteredResponse>, common::ErrResponse> {
    let (offset, limit) = common::calculate_offset_limit(params.page.unwrap_or_default());
    let can_see_contact_info = !claims.is_none();
    let can_see_code = claims.is_store_admin();

    if !can_see_contact_info {
        stores::select_no_contact(
            stores::SelectParams {
                ids: vec![],
                statuses: params.statuses.unwrap_or_default(),
                term: params.term.unwrap_or_default(),
                user_ids: params.user_ids.unwrap_or_default(),
                offset: offset,
                limit: limit,
            },
            &state.db,
        )
        .await
        .map(|stores| Json(FilteredResponse { stores }))
        .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))
    } else {
        stores::select(
            stores::SelectParams {
                ids: vec![],
                statuses: params.statuses.unwrap_or_default(),
                term: params.term.unwrap_or_default(),
                user_ids: params.user_ids.unwrap_or_default(),
                offset: offset,
                limit: limit,
            },
            &state.db,
        )
        .await
        .map(|mut stores| {
            if !can_see_code {
                stores.iter_mut().for_each(|s| s.code = String::new());
            }
            Json(FilteredResponse { stores })
        })
        .map_err(|e| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_DB", &e))
    }
}
