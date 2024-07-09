use crate::db_structs::post;
use crate::rabbit::post_change_msg::PostChangeMsg;
use crate::AppState;
use crate::{auth::claims::Claims, rabbit::communicator::send_post_changed_message};
use axum::{
    extract::{Path, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn touch(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if !claims.is_moderator() {
        return Err((StatusCode::FORBIDDEN, String::from("")));
    }

    let row = match sqlx::query_as!(
        post::Post,
        r#"
        SELECT *
        FROM posts post
        WHERE post.uuid = $1
        "#,
        post_uuid,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    let comment_count = match sqlx::query!(
        r#"
        SELECT uuid
        FROM comments comment
        WHERE comment.post_uuid = $1
        "#,
        post_uuid,
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(q) => q.len(),
        Err(e) => {
            eprintln!("ERROR admin_touch_post_count_comments, {}", e);
            0
        }
    };

    let mut message = PostChangeMsg::update(&row, comment_count as i32);
    if row.draft || row.deleted {
        message = PostChangeMsg::remove(&post_uuid);
    }

    send_post_changed_message(&state.comm, &message).await.ok(); // ignore errors

    Ok(StatusCode::OK)
}
