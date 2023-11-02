use super::{comment, reply};
use crate::db_structs::post;
use crate::AppState;
use crate::auth::claims::Claims;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct GetPostCommentsData {
    pub comments: Vec<comment::GetCommentData>,
}

pub async fn get(
    _claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostCommentsData>, (StatusCode, String)> {
    let mut out: Vec<comment::GetCommentData> = Vec::new();

    match sqlx::query_as!(
        comment::GetCommentData,
        r#"
        SELECT
                comment.uuid,
                comment.post_uuid,
                comment_author.id AS author_id,
                comment_author.first_name AS author_name,
                comment.content,
                comment.created_at,
                comment.updated_at,
                comment.deleted,
                comment.changes,
                comment.viewed_by_author,
                comment.viewed_by_poster,
                COALESCE(NULLIF(ARRAY_AGG((
                    reply.uuid,
                    reply.comment_uuid,
                    reply_author.id,
                    reply_author.first_name,
                    reply.content,
                    reply.created_at,
                    reply.updated_at,
                    reply.deleted,
                    reply.changes
                )), '{NULL}'), '{}') AS "replies: Vec<reply::GetReplyData>"
        FROM posts post
        LEFT JOIN comments comment ON comment.post_uuid = post.uuid
        LEFT JOIN users comment_author ON comment_author.id = comment.author_id
        LEFT JOIN replies reply ON reply.comment_uuid = comment.uuid
        LEFT JOIN users reply_author ON reply_author.id = reply.author_id
        WHERE post.uuid = $1
        GROUP BY comment.uuid, comment_author.id
        "#,
        post_uuid
    )
    .fetch(&state.db)
    .try_for_each(|row| {
        out.push(row);
        futures::future::ready(Ok(()))
    })
    .await
    {
        Ok(_) => {}
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetPostCommentsData { comments: out }))
}
