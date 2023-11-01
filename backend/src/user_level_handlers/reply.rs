use serde::{Serialize, Deserialize};

use crate::db_structs::{
    post,
    comment,
    reply,
    user,
};

use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use std::sync::Arc;
use crate::{AppState, Claims};

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct GetReplyData {
    pub uuid: reply::Uuid,
    pub comment_uuid: reply::CommentUuid,
    pub author_id: reply::AuthorId,
    pub author_name: user::Name,
    pub content: reply::Content,
    pub created_at: reply::CreatedAt,
    pub updated_at: reply::UpdatedAt,
    pub deleted: reply::Deleted,
    pub changes: reply::Changes,
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
            viewed_by_author = CASE WHEN $2 THEN viewed_by_author ELSE FALSE END,
            viewed_by_poster = CASE WHEN $2 THEN FALSE ELSE viewed_by_poster END
        WHERE comment.uuid = $1
        "#,
        payload.comment_uuid,
        author_id == auth.commenter_id,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { println!("ERROR user_create_reply_update_comment_viewed, {}", e); },
    }

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchReplyData {
    pub content: comment::Content,
}

pub async fn patch(
    claims: Claims,
    Path(reply_uuid): Path<reply::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchReplyData>,
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
                'content', reply.content,
                'deleted', reply.deleted
            ))
        WHERE uuid = $1 AND author_id = $2
        RETURNING *
        "#,
        reply_uuid,
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

    match sqlx::query!(
        r#"
        UPDATE comments comment SET
            viewed_by_author = CASE WHEN comment.author_id = $2 THEN viewed_by_author ELSE FALSE END,
            viewed_by_poster = CASE WHEN comment.author_id = $2 THEN FALSE ELSE viewed_by_poster END
        FROM replies reply
        WHERE reply.uuid = $1
        AND comment.uuid = reply.comment_uuid
        "#,
        reply_uuid,
        author_id,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { println!("ERROR user_update_reply_update_comment_viewed, {}", e); },
    }

    Ok(axum::Json(row))
}

pub async fn delete(
    claims: Claims,
    Path(reply_uuid): Path<comment::Uuid>,
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
                'content', reply.content,
                'deleted', reply.deleted
            ))
        WHERE uuid = $1 AND author_id = $2
        RETURNING *
        "#,
        reply_uuid,
        user_id,
        claims.sub,
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
            viewed_by_author = CASE WHEN comment.author_id = $2 THEN viewed_by_author ELSE FALSE END,
            viewed_by_poster = CASE WHEN comment.author_id = $2 THEN FALSE ELSE viewed_by_poster END
        FROM replies reply
        WHERE reply.uuid = $1
        AND comment.uuid = reply.comment_uuid
        "#,
        reply_uuid,
        user_id,
    ).fetch_all(&state.db).await {
        Ok(_) => {},
        Err(e) => { println!("ERROR user_delete_reply_update_comment_viewed, {}", e); },
    }

    return Ok(StatusCode::NO_CONTENT);
}