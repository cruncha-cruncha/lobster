use crate::db_structs::currency::Currency;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn get(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Currency>>, (StatusCode, String)> {
    let currencies = match sqlx::query_as!(
        Currency,
        r#"
        SELECT *
        FROM currencies
        WHERE symbol <> ''
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(currencies))
}
