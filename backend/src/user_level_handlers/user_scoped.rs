// posts: all, active, draft, deleted, sold
// comments: all, open, hit, deleted, missed, lost 
// always sort most recent to oldest, and paginate to 20 at a time

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
pub struct GetUnreadData {
    pub comments: Option<Vec<comment::Comment>>,
    pub commenters: Option<Vec<user::FirstName>>,
    pub posts: Option<Vec<post::Post>>,
    pub offers: Option<Vec<comment::Comment>>,
    pub wants: Option<Vec<post::Post>>,
}

pub async fn get_posts(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    Path(offset): Path<i64>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetUnreadData>, (StatusCode, String)> {
    let row = match sqlx::query_as!(
        GetUnreadData,
        r#"
        SELECT *
        FROM posts post
        WHERE post.author_id = $1
        LIMIT 20
        OFFSET $2
        "#,
        user_id as i64,
        offset as i64
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}
