use crate::auth::claims::Claims;
use crate::db_structs::{comment, post, user};
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

const PAGE_SIZE: i64 = 20;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetPostsData {
    posts: Vec<post::Post>,
}

pub async fn get_all_posts(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        post::Post,
        r#"
        SELECT *
        FROM posts post
        WHERE post.author_id = $1
        ORDER BY post.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE 
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetPostsData { posts: rows }))
}

pub async fn get_active_posts(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        post::Post,
        r#"
        SELECT *
        FROM posts post
        WHERE post.author_id = $1
        AND post.deleted = false
        AND post.draft = false
        AND post.sold = false
        ORDER BY post.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetPostsData { posts: rows }))
}

pub async fn get_draft_posts(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        post::Post,
        r#"
        SELECT *
        FROM posts post
        WHERE post.author_id = $1
        AND post.deleted = false
        AND post.draft = true
        AND post.sold = false
        ORDER BY post.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetPostsData { posts: rows }))
}

pub async fn get_deleted_posts(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        post::Post,
        r#"
        SELECT *
        FROM posts post
        WHERE post.author_id = $1
        AND post.deleted = true
        AND post.draft = false
        AND post.sold = false
        ORDER BY post.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetPostsData { posts: rows }))
}

pub async fn get_sold_posts(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetPostsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        post::Post,
        r#"
        SELECT *
        FROM posts post
        WHERE post.author_id = $1
        AND post.deleted = false
        AND post.draft = false
        AND post.sold = true
        ORDER BY post.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE 
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetPostsData { posts: rows }))
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetCommentsData {
    comments: Vec<comment::Comment>,
}

pub async fn get_all_comments(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        comment::Comment,
        r#"
        SELECT *
        FROM comments comment
        WHERE comment.author_id = $1
        ORDER BY comment.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetCommentsData { comments: rows }))
}

pub async fn get_open_comments(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        comment::Comment,
        r#"
        SELECT comment.*
        FROM comments comment
        JOIN posts post ON comment.post_uuid = post.uuid
        WHERE comment.author_id = $1
        AND comment.deleted = false
        AND post.deleted = false
        AND post.sold = false
        ORDER BY comment.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetCommentsData { comments: rows }))
}

pub async fn get_hit_comments(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        comment::Comment,
        r#"
        SELECT comment.*
        FROM comments comment
        JOIN sales sale ON comment.post_uuid = sale.post_uuid
        WHERE sale.buyer_id = $1
        ORDER BY comment.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetCommentsData { comments: rows }))
}

pub async fn get_deleted_comments(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        comment::Comment,
        r#"
        SELECT *
        FROM comments comment
        WHERE comment.author_id = $1
        AND comment.deleted = true
        ORDER BY comment.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetCommentsData { comments: rows }))
}

pub async fn get_missed_comments(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        comment::Comment,
        r#"
        SELECT comment.*
        FROM comments comment
        JOIN sales sale ON comment.post_uuid = sale.post_uuid
        WHERE comment.author_id = $1
        AND comment.deleted = false
        AND sale.buyer_id <> $1
        ORDER BY comment.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetCommentsData { comments: rows }))
}

pub async fn get_lost_comments(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(page): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetCommentsData>, (StatusCode, String)> {
    let rows = match sqlx::query_as!(
        comment::Comment,
        r#"
        SELECT comment.*
        FROM comments comment
        JOIN posts post ON comment.post_uuid = post.uuid
        WHERE comment.author_id = $1
        AND comment.deleted = false
        AND post.deleted = true
        ORDER BY comment.updated_at DESC
        LIMIT $2
        OFFSET $3
        "#,
        user_id as i64,
        PAGE_SIZE,
        page * PAGE_SIZE
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(GetCommentsData { comments: rows }))
}
