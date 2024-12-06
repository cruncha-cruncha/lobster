use crate::auth::claims::Claims;
use crate::db_structs::{comment, post, user};
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct GetProfileData {
    pub id: user::Id,
    pub name: user::FirstName,
    pub language: user::Language,
    pub country: String,
    pub banned_until: user::BannedUntil,
    pub changes: user::Changes,
    pub all_posts: Option<i64>,
    pub deleted_posts: Option<i64>,
    pub draft_posts: Option<i64>,
    pub sold_posts: Option<i64>,
    pub all_comments: Option<i64>,
    pub deleted_comments: Option<i64>,
    pub lost_comments: Option<i64>,
    pub active_comments: Option<i64>,
    pub missed_comments: Option<i64>,
    pub bought_comments: Option<i64>,
}

pub async fn get(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetProfileData>, (StatusCode, String)> {
    let row = match sqlx::query_as!(
        GetProfileData,
        r#"
        SELECT
            usr.id,
            usr.first_name AS name,
            usr.language,
            country.name AS country,
            usr.banned_until,
            usr.changes,
            COALESCE(COUNT(post), 0) AS all_posts,
            COALESCE(COUNT(post) FILTER (WHERE post.deleted), 0) AS deleted_posts,
            COALESCE(COUNT(post) FILTER (WHERE post.deleted IS NOT TRUE AND post.draft), 0) AS draft_posts,
            COALESCE(COUNT(post) FILTER (WHERE post.sold), 0) AS sold_posts,
            COALESCE(COUNT(comment), 0) AS all_comments,
            COALESCE(COUNT(comment) FILTER (WHERE comment.deleted), 0) AS deleted_comments,
            COALESCE(COUNT(comment) FILTER (WHERE comment.deleted IS NOT TRUE AND want.deleted IS TRUE), 0) AS lost_comments,
            COALESCE(COUNT(comment) FILTER (WHERE comment.deleted IS NOT TRUE AND want.deleted IS NOT TRUE AND want.sold IS NOT TRUE), 0) AS active_comments,
            COALESCE(COUNT(comment) FILTER (WHERE comment.deleted IS NOT TRUE AND sale.buyer_id <> $1), 0) AS missed_comments,
            COALESCE(COUNT(comment) FILTER (WHERE sale.buyer_id = $1), 0) AS bought_comments
        FROM users usr
        LEFT JOIN countries country ON country.id = usr.country
        -- as a seller
        LEFT JOIN posts post ON post.author_id = usr.id
        -- as a buyer
        LEFT JOIN comments comment ON comment.author_id = usr.id
        LEFT JOIN posts want ON want.uuid = comment.post_uuid
        LEFT JOIN sales sale ON sale.post_uuid = want.uuid
        WHERE usr.id = $1
        GROUP BY usr.id, country.name
        "#,
        user_id as i64
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetProfileHistoricalData {
    pub oldest_post_uuid: Option<post::Uuid>,
    pub oldest_post_date: Option<post::CreatedAt>,
    pub newest_post_uuid: Option<post::Uuid>,
    pub newest_post_date: Option<post::CreatedAt>,
    pub oldest_comment_uuid: Option<comment::Uuid>,
    pub oldest_comment_date: Option<comment::CreatedAt>,
    pub newest_comment_uuid: Option<comment::Uuid>,
    pub newest_comment_date: Option<comment::CreatedAt>,
}

pub async fn get_history(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetProfileHistoricalData>, (StatusCode, String)> {
    let row = match sqlx::query_as!(
        GetProfileHistoricalData,
        r#"
        WITH oldest_post AS (
            SELECT
                post.uuid,
                post.created_at
            FROM posts post
            WHERE post.author_id = $1
            AND post.deleted IS NOT TRUE
            ORDER BY post.created_at ASC
            LIMIT 1
        ), newest_post AS (
            SELECT
                post.uuid,
                post.created_at
            FROM posts post
            WHERE post.author_id = $1
            AND post.deleted IS NOT TRUE
            ORDER BY post.created_at DESC
            LIMIT 1
        ), oldest_comment AS (
            SELECT
                comment.uuid,
                comment.created_at
            FROM comments comment
            WHERE comment.author_id = $1
            AND comment.deleted IS NOT TRUE
            ORDER BY comment.created_at ASC
            LIMIT 1
        ), newest_comment AS (
            SELECT
                comment.uuid,
                comment.created_at
            FROM comments comment
            WHERE comment.author_id = $1
            AND comment.deleted IS NOT TRUE
            ORDER BY comment.created_at DESC
            LIMIT 1
        )
        SELECT 
            oldest_post.uuid AS "oldest_post_uuid: Option<post::Uuid>",
            oldest_post.created_at AS "oldest_post_date: Option<post::CreatedAt>",
            newest_post.uuid AS "newest_post_uuid: Option<post::Uuid>",
            newest_post.created_at AS "newest_post_date: Option<post::CreatedAt>",
            oldest_comment.uuid AS "oldest_comment_uuid: Option<comment::Uuid>",
            oldest_comment.created_at AS "oldest_comment_date: Option<comment::CreatedAt>",
            newest_comment.uuid AS "newest_comment_uuid: Option<comment::Uuid>",
            newest_comment.created_at AS "newest_comment_date: Option<comment::CreatedAt>"
        FROM users usr
        LEFT JOIN oldest_post ON true
        LEFT JOIN newest_post ON true
        LEFT JOIN oldest_comment ON true
        LEFT JOIN newest_comment ON true
        WHERE usr.id = $1
        "#,
        user_id as i64
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}
