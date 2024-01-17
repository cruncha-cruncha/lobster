use crate::auth::claims::Claims;
use crate::db_structs::{post, comment, reply, user};
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetCommentData {
    pub uuid: comment::Uuid,
    pub post_uuid: comment::PostUuid,
    pub author_id: comment::AuthorId,
    pub poster_id: comment::PosterId,
    pub author_name: user::FirstName,
    pub content: comment::Content,
    pub created_at: comment::CreatedAt,
    pub updated_at: comment::UpdatedAt,
    pub deleted: comment::Deleted,
    pub changes: comment::Changes,
    pub unread_by_author: comment::UnreadByAuthor,
    pub unread_by_poster: comment::UnreadByPoster,
    pub replies: Option<Vec<reply::Reply>>,
}

pub async fn get(
    _claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<GetCommentData>>, (StatusCode, String)> {
    let comments = match sqlx::query_as!(
        GetCommentData,
        r#"
        SELECT
            comment.uuid,
            comment.post_uuid,
            comment_author.id AS author_id,
            comment_author.first_name AS author_name,
            comment.poster_id,
            comment.content,
            comment.created_at,
            comment.updated_at,
            comment.deleted,
            comment.changes,
            comment.unread_by_author,
            comment.unread_by_poster,
            COALESCE(NULLIF(ARRAY_AGG(reply.* ORDER BY reply.created_at ASC), '{NULL}'), '{}') AS "replies: Vec<reply::Reply>"
        FROM comments comment
        LEFT JOIN users comment_author ON comment_author.id = comment.author_id
        LEFT JOIN replies reply ON reply.comment_uuid = comment.uuid
        WHERE comment.post_uuid = $1
        GROUP BY comment.uuid, comment_author.id
        "#,
        post_uuid
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(comments))
}
