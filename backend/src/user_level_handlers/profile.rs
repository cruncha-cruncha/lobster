use crate::db_structs::{comment, post, reply, sale, user};
use crate::AppState;
use crate::auth::claims::Claims;
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
    pub country: user::Country,
    pub latitude: user::Latitude,
    pub longitude: user::Longitude,
    pub near: user::Near,
    pub banned_until: user::BannedUntil,
    pub changes: user::Changes,
    pub posts: Option<Vec<post::Post>>,
    pub sold: Option<Vec<sale::Sale>>,
    pub bought: Option<Vec<sale::Sale>>,
    pub comments: Option<Vec<comment::Comment>>,
    pub replies: Option<Vec<reply::Reply>>,
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
            usr.country,
            usr.latitude,
            usr.longitude,
            usr.near,
            usr.banned_until,
            usr.changes,
            ARRAY_AGG(post) AS "posts: Vec<post::Post>",
            COALESCE(NULLIF(ARRAY_AGG(sold), '{NULL}'), '{}') AS "sold: Vec<sale::Sale>",
            COALESCE(NULLIF(ARRAY_AGG(bought), '{NULL}'), '{}') AS "bought: Vec<sale::Sale>",
            COALESCE(NULLIF(ARRAY_AGG(comment), '{NULL}'), '{}') AS "comments: Vec<comment::Comment>",
            COALESCE(NULLIF(ARRAY_AGG(reply), '{NULL}'), '{}') AS "replies: Vec<reply::Reply>"
        FROM users usr
        LEFT JOIN posts post ON post.author_id = usr.id
        LEFT JOIN sales sold ON sold.post_uuid = post.uuid
        LEFT JOIN sales bought ON bought.buyer_id = usr.id
        LEFT JOIN comments comment ON comment.author_id = usr.id
        LEFT JOIN replies reply ON reply.author_id = usr.id
        WHERE usr.id = $1
        GROUP BY usr.id
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
