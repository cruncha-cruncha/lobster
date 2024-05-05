use crate::auth::claims::Claims;
use crate::broadcast::post_change_msg::Action;
use crate::broadcast::post_change_msg::PostChangeMsg;
use crate::db_structs::comment;
use crate::broadcast;
use crate::AppState;
use axum::{
    extract::{Path, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn delete(
    claims: Claims,
    Path(comment_uuid): Path<comment::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if !claims.is_admin() {
        return Err((StatusCode::FORBIDDEN, String::from("")));
    }

    let post = match sqlx::query_as!(
        broadcast::post_with_comment_count::PostWithCommentCount,
        r#"
        SELECT
            post.*,
            COALESCE(COUNT(other_comment.uuid), 0)::INT AS comment_count
        FROM comments comment
        JOIN posts post ON post.uuid = comment.post_uuid
        LEFT JOIN comments other_comment ON other_comment.post_uuid = post.uuid
        WHERE comment.uuid = $1
        GROUP BY post.uuid
        "#,
        comment_uuid,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => Some(row),
        Err(_) => None, // ignore errors
    };

    if post.is_some() {
        let message = PostChangeMsg::from_pwcc(Action::Update, &post.unwrap());
        state.p2p.send_post_changed_message(&message);
    }

    match sqlx::query!(
        r#"
        DELETE
        FROM comments comment
        WHERE comment.uuid = $1
        "#,
        comment_uuid,
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

    // don't delete the replies

    Ok(StatusCode::OK)
}
