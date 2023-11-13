use crate::db_structs::country::Country;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn get(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Country>>, (StatusCode, String)> {
    let countries = match sqlx::query_as!(
        Country,
        r#"
        SELECT *
        FROM countries
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(countries))
}
