use crate::auth::claims::Claims;
use crate::db_structs::post;
use crate::AppState;
use axum::{
    extract::{Path, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn delete(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if !claims.is_admin() {
        return Err((StatusCode::FORBIDDEN, String::from("")));
    }

    match sqlx::query!(
        r#"
        DELETE
        FROM sales sale
        WHERE sale.post_uuid = $1
        "#,
        post_uuid,
    )
    .execute(&state.db)
    .await
    {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(StatusCode::OK)
}
