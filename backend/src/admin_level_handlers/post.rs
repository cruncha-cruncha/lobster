use crate::auth::claims::Claims;
use crate::db_structs::post;
use crate::broadcast::post_change_msg::PostChangeMsg;
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

    let message = PostChangeMsg::remove(&post_uuid);
    state.p2p.send_post_changed_message(&message);

    match sqlx::query!(
        r#"
        DELETE
        FROM posts post
        WHERE post.uuid = $1
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

    // don't delete the comments, replies, etc.

    Ok(StatusCode::OK)
}
