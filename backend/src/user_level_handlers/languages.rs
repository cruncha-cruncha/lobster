use crate::db_structs::language::Language;
use crate::AppState;
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn get(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Language>>, (StatusCode, String)> {
    let languages = match sqlx::query_as!(
        Language,
        r#"
        SELECT *
        FROM languages
        "#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(languages))
}
