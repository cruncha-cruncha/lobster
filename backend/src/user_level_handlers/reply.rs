use serde::{Serialize, Deserialize};

use crate::db_structs::{
    post,
    comment,
    reply,
};

use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use std::sync::Arc;
use crate::AppState;
use crate::auth::claims::Claims;

const PAGE_SIZE: i64 = 20;

pub async fn get(
    _claims: Claims,
    Path(reply_uuid): Path<reply::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<reply::Reply>, (StatusCode, String)> {
    let row = match sqlx::query_as!(
        reply::Reply,
        r#"
        SELECT *
        FROM replies reply
        WHERE reply.uuid = $1
        "#,
        reply_uuid,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

pub async fn get_comment_scoped(
    _claims: Claims,
    Path(comment_uuid): Path<comment::Uuid>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<reply::Reply>>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        reply::Reply,
        r#"
        SELECT *
        FROM replies reply
        WHERE reply.comment_uuid = $1
        AND reply.deleted = false
        ORDER BY reply.created_at ASC
        LIMIT $2
        OFFSET $3
        "#,
        comment_uuid,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(rows))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostReplyData {
    pub comment_uuid: reply::CommentUuid,
    pub content: reply::Content,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReplyAuthorization {
    pub poster_id: post::AuthorId,
    pub commenter_id: comment::AuthorId,    
}

pub async fn post(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostReplyData>,
) -> Result<Json<reply::Reply>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let auth = match sqlx::query_as!(
        ReplyAuthorization,
        r#"
        SELECT 
            comment.author_id AS commenter_id,
            post.author_id AS poster_id
        FROM comments comment
        LEFT JOIN posts post ON post.uuid = comment.post_uuid
        WHERE comment.uuid = $1
        "#,
        payload.comment_uuid,
    ).fetch_one(&state.db).await {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    if author_id != auth.commenter_id && author_id != auth.poster_id {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    let row = match sqlx::query_as!(
        reply::Reply,
        r#"
        INSERT INTO replies (uuid, comment_uuid, author_id, content, created_at, updated_at, deleted, changes)
        VALUES ($1, $2, $3, $4, NOW(), NOW(), FALSE, '[]'::JSONB)
        RETURNING *
        "#,
        uuid::Uuid::new_v4(),
        payload.comment_uuid,
        author_id,
        payload.content,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    match sqlx::query!(
        r#"
        UPDATE comments comment SET
            unread_by_author = CASE WHEN $2 THEN unread_by_author ELSE COALESCE(unread_by_author, '[]'::JSONB) || '["new-reply"]'::JSONB END,
            unread_by_poster = CASE WHEN $2 THEN COALESCE(unread_by_poster, '[]'::JSONB) || '["new-reply"]'::JSONB ELSE unread_by_poster END
        WHERE comment.uuid = $1
        "#,
        payload.comment_uuid,
        author_id == auth.commenter_id,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { eprintln!("ERROR user_create_reply_update_comment_viewed, {}", e); },
    }

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PutReplyData {
    pub content: reply::Content,
}

pub async fn patch(
    claims: Claims,
    Path(reply_uuid): Path<reply::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PutReplyData>,
) -> Result<Json<reply::Reply>, (StatusCode, String)> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let row = match sqlx::query_as!(
        reply::Reply,
        r#"
        UPDATE replies reply
        SET
            content = $4,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'content', reply.content
            ))
        WHERE uuid = $1
        AND (author_id = $2 OR $5)
        RETURNING *
        "#,
        reply_uuid,
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

    match sqlx::query!(
        r#"
        UPDATE comments comment SET
            unread_by_author = CASE WHEN comment.author_id = $2 THEN unread_by_author ELSE COALESCE(unread_by_author, '[]'::JSONB) || '["reply-edited"]'::JSONB END,
            unread_by_poster = CASE WHEN comment.author_id = $2 THEN COALESCE(unread_by_poster, '[]'::JSONB) || '["reply-edited"]'::JSONB ELSE unread_by_poster END
        FROM replies reply
        WHERE reply.uuid = $1
        AND comment.uuid = reply.comment_uuid
        "#,
        reply_uuid,
        author_id,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { eprintln!("ERROR user_update_reply_update_comment_viewed, {}", e); },
    }

    Ok(axum::Json(row))
}

pub async fn delete(
    claims: Claims,
    Path(reply_uuid): Path<reply::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    let user_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    match sqlx::query_as!(
        reply::Reply,
        r#"
        UPDATE replies reply
        SET
            deleted = true,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'deleted', reply.deleted
            ))
        WHERE uuid = $1
        AND (author_id = $2 OR $4)
        RETURNING *
        "#,
        reply_uuid,
        user_id,
        claims.sub,
        claims.is_moderator(),
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    match sqlx::query!(
        r#"
        UPDATE comments comment SET
            unread_by_author = CASE WHEN comment.author_id = $2 THEN unread_by_author ELSE COALESCE(unread_by_author, '[]'::JSONB) || '["reply-deleted"]'::JSONB END,
            unread_by_poster = CASE WHEN comment.author_id = $2 THEN COALESCE(unread_by_poster, '[]'::JSONB) || '["reply-deleted"]'::JSONB ELSE unread_by_poster END
        FROM replies reply
        WHERE reply.uuid = $1
        AND comment.uuid = reply.comment_uuid
        "#,
        reply_uuid,
        user_id,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { eprintln!("ERROR user_delete_reply_update_comment_viewed, {}", e); },
    }

    return Ok(StatusCode::NO_CONTENT);
}