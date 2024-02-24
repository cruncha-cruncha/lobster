use crate::auth::claims::Claims;
use crate::db_structs::user;
use crate::{auth, AppState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
};
use std::sync::Arc;

pub async fn delete(
    _claims: Claims,
    Path(user_id): Path<user::Id>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    if _claims.level != auth::claims::ClaimLevel::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            String::from(""),
        ));
    }

    if _claims.subject_as_user_id().unwrap_or_default() == user_id {
        return Err((
            StatusCode::FORBIDDEN,
            String::from("Can't delete yourself"),
        ));
    }

    match sqlx::query!(
        r#"
        DELETE
        FROM users usr
        WHERE usr.id = $1
        "#,
        user_id as i64,
    )
    .execute(&state.db)
    .await
    {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    // don't delete their posts, comments, replies, etc.

    Ok(StatusCode::OK)
}
