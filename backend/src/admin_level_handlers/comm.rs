use crate::{auth::claims::Claims, broadcast::comm::CommDiagnosticsData};
use crate::AppState;
use axum::{
    extract::State,
    http::StatusCode, Json,
};
use std::sync::Arc;

pub async fn get(
    claims: Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<CommDiagnosticsData>, (StatusCode, String)> {
    if !claims.is_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            String::from(""),
        ));
    }

    let data = state.p2p.get_diagnostics();
    Ok(Json(data))
}
