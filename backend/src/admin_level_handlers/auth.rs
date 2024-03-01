use crate::auth::claims::Claims;
use crate::auth::claims;
use crate::db_structs::user;
use crate::AppState;
use axum::{
    extract::{Path, Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct Tokens {
    pub user_id: user::Id,
    pub claims_level: i32,
    pub access_token: String,
    pub refresh_token: Option<String>,
}

pub async fn login(
    claims: Claims,
    Path(user_id): Path<user::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    if !claims.is_admin() {
        return Err((StatusCode::UNAUTHORIZED, String::from("Not an admin")));
    }

    let user = match sqlx::query_as!(
        user::User,
        r#"
        SELECT * FROM users usr WHERE usr.id = $1;
        "#,
        user_id,
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if user.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            String::from("no user with this id"),
        ));
    }
    let user = user.unwrap();

    let access_token = match claims::make_access_token(&user.id.to_string(), user.claim_level) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    let refresh_token = match claims::make_refresh_token(&user.id.to_string(), user.claim_level) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(axum::Json(Tokens {
        user_id: user.id,
        claims_level: user.claim_level.encode_numeric(),
        access_token: access_token,
        refresh_token: Some(refresh_token),
    }))
}
