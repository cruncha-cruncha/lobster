use crate::auth::claims::Claims;
use crate::db_structs::reply;
use crate::{auth, AppState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn delete(
    _claims: Claims,
    Path(reply_uuid): Path<reply::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if _claims.level != auth::claims::ClaimLevel::Admin {
        return Err((StatusCode::FORBIDDEN, String::from("")));
    }

    match sqlx::query!(
        r#"
        DELETE
        FROM replies reply
        WHERE reply.uuid = $1
        "#,
        reply_uuid,
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
