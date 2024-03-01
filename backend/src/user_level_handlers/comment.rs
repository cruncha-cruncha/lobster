use std::sync::Arc;

use crate::auth::claims::Claims;
use crate::AppState;
use crate::{
    db_structs::{comment, helpers},
    rabbit::{
        helpers::{send_post_changed_message, PostWithInfo},
        post_change_msg::PostChangeMsg,
    },
};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};

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

    let post_info = match sqlx::query_as!(
        PostWithInfo,
        r#"
        SELECT
            post.*,
            COALESCE(COUNT(comment.uuid), 0)::INT AS comment_count
        FROM posts post
        LEFT JOIN comments comment ON comment.post_uuid = post.uuid
        WHERE post.uuid = $1
        AND post.deleted IS NOT TRUE
        AND NOT EXISTS(
            SELECT * FROM sales sale
            WHERE sale.post_uuid = post.uuid)
        GROUP BY post.uuid
        "#,
        payload.post_uuid,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(_) => return Err((StatusCode::NOT_FOUND, String::from(""))),
    };

    let row = match sqlx::query_as!(
        comment::Comment,
        r#"
        INSERT INTO comments (uuid, post_uuid, author_id, content, poster_id, created_at, updated_at, deleted, changes, unread_by_author, unread_by_poster)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), FALSE, '[]'::JSONB, '[]'::JSONB, '["new-comment"]'::JSONB)
        ON CONFLICT (author_id, post_uuid)
        DO UPDATE SET
            content = $4,
            updated_at = NOW(),
            deleted = FALSE,
            changes = comments.changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'content', comments.content,
                'deleted', comments.deleted
            )),
            unread_by_poster = COALESCE(comments.unread_by_poster, '[]'::JSONB) || '["new-comment"]'::JSONB
        RETURNING *;
        "#,
        uuid::Uuid::new_v4(),
        payload.post_uuid,
        author_id,
        payload.content,
        post_info.author_id,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let comment_count = post_info.comment_count.unwrap_or_default() + 1;
    let message = PostChangeMsg::update(&post_info.into(), comment_count);
    send_post_changed_message(&state.chan, &message.encode())
        .await
        .ok(); // ignore errors

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PutCommentData {
    pub content: comment::Content,
}

pub async fn put(
    claims: Claims,
    Path(comment_uuid): Path<comment::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PutCommentData>,
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
            unread_by_poster = COALESCE(comment.unread_by_poster, '[]'::JSONB) || '["comment-edited"]'::JSONB,
            updated_at = NOW(),
            changes = comment.changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'content', comment.content
            ))
        FROM posts post
        WHERE comment.uuid = $1
        AND (comment.author_id = $2 OR $5)
        AND post.uuid = comment.post_uuid
        AND post.deleted IS NOT TRUE
        AND NOT EXISTS(
            SELECT * FROM sales sale
            WHERE sale.post_uuid = post.uuid)
        RETURNING comment.*
        "#,
        comment_uuid,
        author_id,
        claims.sub,
        payload.content,
        claims.is_moderator(),
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

    let post_info = match sqlx::query_as!(
        PostWithInfo,
        r#"
        SELECT
            post.*,
            COALESCE(COUNT(other_comment.uuid), 0)::INT AS comment_count
        FROM comments comment
        JOIN posts post ON post.uuid = comment.post_uuid
        LEFT JOIN comments other_comment ON other_comment.post_uuid = post.uuid
        WHERE comment.uuid = $1
        AND post.deleted IS NOT TRUE
        AND NOT EXISTS(
            SELECT * FROM sales sale
            WHERE sale.post_uuid = post.uuid)
        GROUP BY post.uuid
        "#,
        comment_uuid,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(_) => return Err((StatusCode::NOT_FOUND, String::from(""))),
    };

    match sqlx::query_as!(
        helpers::RowsReturned,
        r#"
        WITH updated AS (
            UPDATE comments comment SET
                deleted = true,
                updated_at = NOW(),
                unread_by_poster = COALESCE(unread_by_poster, '[]'::JSONB) || '["comment-deleted"]'::JSONB,
                changes = comment.changes || jsonb_build_array(jsonb_build_object(
                    'who', $3::TEXT,
                    'when', NOW(),
                    'deleted', comment.deleted
                )) 
            WHERE comment.uuid = $1
            AND (comment.author_id = $2 OR $4)
            RETURNING comment.uuid)
        SELECT COUNT(*) as count
        FROM updated;
        "#,
        comment_uuid,
        subject_id,
        claims.sub,
        claims.is_moderator(),
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

    let comment_count = post_info.comment_count.unwrap_or_default() - 1;
    let message = PostChangeMsg::update(&post_info.into(), comment_count);
    send_post_changed_message(&state.chan, &message.encode())
        .await
        .ok(); // ignore errors

    return Ok(StatusCode::NO_CONTENT);
}
