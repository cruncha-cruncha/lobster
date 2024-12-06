use crate::auth::claims::Claims;
use crate::db_structs::{post, sale, user};
use crate::rabbit::communicator::send_post_changed_message;
use crate::rabbit::post_change_msg::PostChangeMsg;
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PostSaleData {
    pub post_uuid: post::Uuid,
    pub buyer_id: user::Id,
}

pub async fn post(
    claims: Claims,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostSaleData>,
) -> Result<Json<sale::Sale>, (StatusCode, String)> {
    let caller_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    match sqlx::query!(
        r#"
        UPDATE posts
        SET sold = true
        WHERE uuid = $1
        AND author_id = $2
        AND sold = false
        "#,
        payload.post_uuid,
        caller_id,
    )
    .execute(&state.db)
    .await
    {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let row = match sqlx::query_as!(
        sale::Sale,
        r#"
        INSERT INTO sales (post_uuid, buyer_id, changes)
        VALUES ($1, $2, '[]'::JSONB)
        RETURNING *
        "#,
        payload.post_uuid,
        payload.buyer_id,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::BAD_REQUEST, e.to_string())),
    };

    let message = PostChangeMsg::remove(&payload.post_uuid);
    send_post_changed_message(&state.comm, &message).await.ok(); // ignore errors

    // TODO: send notifications to commenters

    return Ok(axum::Json(row));
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PatchSaleData {
    pub buyer_id: user::Id,
}

pub async fn patch(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchSaleData>,
) -> Result<Json<sale::Sale>, (StatusCode, String)> {
    let caller_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let original_sale = match sqlx::query_as!(
        sale::Sale,
        r#"
        SELECT * FROM sales
        WHERE post_uuid = $1
        "#,
        post_uuid,
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => {
            if row.is_none() {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
            row.unwrap()
        }
        Err(_) => return Err((StatusCode::INTERNAL_SERVER_ERROR, String::from(""))),
    };

    if original_sale.reviewed_at.is_some() {
        return Err((StatusCode::BAD_REQUEST, String::from("")));
    }

    match sqlx::query!(
        r#"
        SELECT * FROM posts
        WHERE uuid = $1
        AND author_id = $2
        "#,
        original_sale.post_uuid,
        caller_id,
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => {
            if row.is_none() {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(_) => return Err((StatusCode::INTERNAL_SERVER_ERROR, String::from(""))),
    };

    let sale = match sqlx::query_as!(
        sale::Sale,
        r#"
        UPDATE sales sale
        SET buyer_id = $1,
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'buyer_id', sale.buyer_id
            )) 
        WHERE post_uuid = $2
        RETURNING *
        "#,
        payload.buyer_id,
        post_uuid,
        claims.sub,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    // TODO: send notification to buyer(s)

    return Ok(axum::Json(sale));
}

pub async fn get(
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<sale::Sale>, (StatusCode, String)> {
    match sqlx::query_as!(
        sale::Sale,
        r#"
        SELECT * FROM sales
        WHERE post_uuid = $1
        "#,
        post_uuid,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => Ok(axum::Json(row)),
        Err(_) => Err((StatusCode::NOT_FOUND, String::from(""))),
    }
}
