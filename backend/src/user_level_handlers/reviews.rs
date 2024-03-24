use crate::auth::claims::Claims;
use crate::db_structs::{post, sale};
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PostReviewData {
    pub price: Option<String>,
    pub rating: Option<f32>,
    pub review: String,
}

pub async fn make(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostReviewData>,
) -> Result<Json<sale::Sale>, (StatusCode, String)> {
    let caller_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    match sqlx::query!(
        r#"
        SELECT * FROM sales
        WHERE post_uuid = $1 AND buyer_id = $2
        "#,
        post_uuid,
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
    }

    let row = match sqlx::query_as!(
        sale::Sale,
        r#"
        UPDATE sales sale
        SET price = $1,
            rating = $2,
            review = $3,
            reviewed_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $5::TEXT,
                'when', NOW(),
                'price', sale.price,
                'rating', sale.rating,
                'review', sale.review,
                'reviewed_at', sale.reviewed_at
            ))
        WHERE post_uuid = $4
        RETURNING *
        "#,
        payload.price,
        payload.rating,
        payload.review,
        post_uuid,
        claims.sub,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(_) => return Err((StatusCode::INTERNAL_SERVER_ERROR, String::from(""))),
    };

    Ok(Json(row))
}

pub async fn remove(
    claims: Claims,
    Path(post_uuid): Path<post::Uuid>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    let caller_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    match sqlx::query!(
        r#"
        UPDATE sales sale
        SET price = NULL,
            rating = NULL,
            review = NULL,
            reviewed_at = NULL,
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $2::TEXT,
                'when', NOW(),
                'price', sale.price,
                'rating', sale.rating,
                'review', sale.review,
                'reviewed_at', sale.reviewed_at
            ))
        WHERE post_uuid = $1
        AND buyer_id = $3
        "#,
        post_uuid,
        claims.sub,
        caller_id,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(_) => Err((StatusCode::NOT_FOUND, String::from(""))),
    }
}