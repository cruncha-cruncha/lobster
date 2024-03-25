use std::sync::Arc;

use crate::db_structs::abuse;
use crate::AppState;
use crate::{auth::claims::Claims, db_structs::abuse_comment};
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchAbuseData {
    pub status: abuse::Status,
    pub comment: String,
}

pub async fn comment(
    claims: Claims,
    Path(abuse_uuid): Path<abuse::Uuid>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchAbuseData>,
) -> Result<Json<abuse_comment::AbuseComment>, (StatusCode, String)> {
    if payload.comment.is_empty() {
        return Err((StatusCode::BAD_REQUEST, String::from("")));
    }

    let user_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let _abuse = match sqlx::query_as!(
        abuse::Abuse,
        r#"
        UPDATE abuses
        SET status = $2,
            updated_at = NOW()
        WHERE uuid = $1
        RETURNING *;
        "#,
        abuse_uuid,
        payload.status,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let comment = match sqlx::query_as!(
        abuse_comment::AbuseComment,
        r#"
        INSERT INTO abuse_comments (uuid, abuse_uuid, author_id, content, created_at)
        SELECT $1, $2, $3, $4, NOW()
        FROM abuses
        WHERE uuid = $2
        RETURNING *;
        "#,
        uuid::Uuid::new_v4(),
        abuse_uuid,
        user_id,
        payload.comment
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(comment))
}
