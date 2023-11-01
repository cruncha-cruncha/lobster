// patch -> need a comment_uuid from the path
// delete -> need a comment_uuid from the path

use serde::{Deserialize, Serialize};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use std::sync::Arc;
use crate::db_structs::{comment, user, helpers};
use crate::{AppState, Claims};
use super::reply;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetCommentData {
    pub uuid: comment::Uuid,
    pub post_uuid: comment::PostUuid,
    pub author_id: comment::AuthorId,
    pub author_name: user::Name,
    pub content: comment::Content,
    pub created_at: comment::CreatedAt,
    pub updated_at: comment::UpdatedAt,
    pub deleted: comment::Deleted,
    pub changes: comment::Changes,
    pub viewed_by_author: comment::ViewedByAuthor,
    pub viewed_by_poster: comment::ViewedByPoster,
    pub replies: Option<Vec<reply::GetReplyData>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostCommentData {
    pub post_uuid: comment::PostUuid,
    pub content: comment::Content,
}

pub async fn post(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostCommentData>,
) -> Result<Json<comment::Comment>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        comment::Comment,
        r#"
        INSERT INTO comments (uuid, post_uuid, author_id, content, created_at, updated_at, deleted, changes, viewed_by_author, viewed_by_poster)
        VALUES ($1, $2, $3, $4, NOW(), NOW(), FALSE, '[]'::JSONB, TRUE, FALSE)
        RETURNING *
        "#,
        uuid::Uuid::new_v4(),
        payload.post_uuid,
        author_id,
        payload.content,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchCommentData {
    pub content: comment::Content,
}

pub async fn patch(
    claims: Claims,
    Path(comment_uuid): Path<comment::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchCommentData>,
) -> Result<Json<comment::Comment>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        comment::Comment,
        r#"
        UPDATE comments comment
        SET
            content = $4,
            viewed_by_poster = FALSE,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'content', comment.content,
                'deleted', comment.deleted
            ))
        WHERE uuid = $1 AND author_id = $2
        RETURNING *
        "#,
        comment_uuid,
        author_id,
        claims.sub,
        payload.content,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

pub async fn delete(
    claims: Claims,
    Path(comment_uuid): Path<comment::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    let subject_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    match sqlx::query_as!(
        helpers::RowsReturned,
        r#"
        WITH post AS (
            SELECT post.author_id
            FROM comments comment
            LEFT JOIN posts post ON post.uuid = comment.post_uuid
            WHERE comment.uuid = $1
        ), updated AS (
            UPDATE comments comment SET
                deleted = true,
                updated_at = NOW(),
                viewed_by_author = CASE WHEN comment.author_id = $2 THEN viewed_by_author ELSE FALSE END,
                viewed_by_poster = CASE WHEN comment.author_id = $2 THEN FALSE ELSE viewed_by_poster END,
                changes = changes || jsonb_build_array(jsonb_build_object(
                    'who', $3::TEXT,
                    'when', NOW(),
                    'content', comment.content,
                    'deleted', comment.deleted
                )) 
            WHERE comment.uuid = $1
            AND (comment.author_id = $2 OR (SELECT post.author_id FROM post) = $2)
            RETURNING *)
        SELECT COUNT(*) as count
        FROM updated;
        "#,
        comment_uuid,
        subject_id,
        claims.sub,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => {
            if row.count == None || row.count == Some(0) {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    return Ok(StatusCode::NO_CONTENT);
}