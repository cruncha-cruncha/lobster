use crate::auth::claims::Claims;
use crate::db_structs::user;
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct BanUserData {
    pub banned_until: Option<time::OffsetDateTime>,
}

pub async fn ban(
    claims: Claims,
    Path(user_id): Path<user::Id>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<BanUserData>,
) -> Result<Json<user::User>, (StatusCode, String)> {
    if !claims.is_moderator() {
        return Err((StatusCode::UNAUTHORIZED, String::from("Not an admin")));
    }

    let row = match sqlx::query_as!(
        user::User,
        r#"
        UPDATE users
        SET banned_until = $2::TIMESTAMPTZ,
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $3::TEXT,
                'when', NOW(),
                'banned_until', banned_until
            )) 
        WHERE id = $1
        RETURNING *;
        "#,
        user_id,
        payload.banned_until,
        claims.sub
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(axum::Json(row))
}
