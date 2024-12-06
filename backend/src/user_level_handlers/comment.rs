use std::sync::Arc;

use crate::auth::claims::Claims;
use crate::rabbit::communicator::send_post_changed_message;
use crate::AppState;
use crate::{
    db_structs::{comment, helpers},
    rabbit::{post_change_msg::PostChangeMsg, post_with_comment_count::PostWithCommentCount},
};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};

const PAGE_SIZE: i64 = 20;

#[derive(Debug, Serialize, Deserialize)]
pub struct GetCommentData {
    pub uuid: comment::Uuid,
    pub post_uuid: comment::PostUuid,
    pub author_id: comment::AuthorId,
    pub poster_id: comment::PosterId,
    pub content: comment::Content,
    pub created_at: comment::CreatedAt,
    pub updated_at: comment::UpdatedAt,
    pub deleted: comment::Deleted,
    pub changes: comment::Changes,
    pub reply_count: Option<i64>,
}

pub async fn get(
    _claims: Claims,
    Path(comment_uuid): Path<comment::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentData>, (StatusCode, String)> {
    let comment = match sqlx::query_as!(
        GetCommentData,
        r#"
        SELECT
            comment.uuid,
            comment.post_uuid,
            comment.author_id,
            comment.poster_id,
            comment.content,
            comment.created_at,
            comment.updated_at,
            comment.deleted,
            comment.changes,
            COALESCE(COUNT(reply.uuid), 0)::INT AS "reply_count: i64"
        FROM comments comment
        LEFT JOIN replies reply ON reply.comment_uuid = comment.uuid
        WHERE comment.post_uuid = $1
        GROUP BY comment.uuid
        "#,
        comment_uuid
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => row,
        Err(_) => return Err((StatusCode::NOT_FOUND, String::from(""))),
    };

    match comment {
        Some(comment) => Ok(axum::Json(comment)),
        None => Err((StatusCode::NOT_FOUND, String::from(""))),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetPostCommentsData {
    comments: Vec<GetCommentData>,
}

pub async fn get_post_scoped(
    _claims: Claims,
    Path(post_uuid): Path<comment::PostUuid>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostCommentsData>, (StatusCode, String)> {
    let comments = match sqlx::query_as!(
        GetCommentData,
        r#"
        SELECT
            comment.uuid,
            comment.post_uuid,
            comment.author_id,
            comment.poster_id,
            comment.content,
            comment.created_at,
            comment.updated_at,
            comment.deleted,
            comment.changes,
            COALESCE(COUNT(reply.uuid), 0)::INT AS "reply_count: i64"
        FROM comments comment
        LEFT JOIN replies reply ON reply.comment_uuid = comment.uuid
        WHERE comment.post_uuid = $1
        GROUP BY comment.uuid
        ORDER BY comment.created_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        post_uuid,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(_) => return Err((StatusCode::NOT_FOUND, String::from(""))),
    };

    Ok(axum::Json(GetPostCommentsData { comments }))
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

    let post_info = match sqlx::query_as!(
        PostWithCommentCount,
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
        INSERT INTO comments (uuid, post_uuid, author_id, content, poster_id, created_at, updated_at, deleted, changes)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), FALSE, '[]'::JSONB)
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
            ))
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
    send_post_changed_message(&state.comm, &message).await.ok(); // ignore errors

    // TODO: send notification to the post author

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PutCommentData {
    pub content: comment::Content,
}

pub async fn patch(
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

    // TODO: send notification to the post author

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
        PostWithCommentCount,
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
    send_post_changed_message(&state.comm, &message).await.ok(); // ignore errors

    // TODO: send notification to the post author

    return Ok(StatusCode::NO_CONTENT);
}
