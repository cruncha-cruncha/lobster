use crate::auth::claims::Claims;
use crate::queries::common;
use crate::queries::stores::select_statuses;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

// get possible statuses for a store
// create a new store
// edit store information
// edit store status

pub async fn get_statuses(
    _claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<common::Status>>, (StatusCode, String)> {
    let statuses = select_statuses(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok(Json(statuses))
}
