use crate::auth::claims;
use crate::auth::encryption::{encode_plain_email, generate_salt, hash_password};
use crate::db_structs::{invitation, recovery_request, user};
use crate::AppState;
use axum::{
    extract::{Json, Path, State},
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

#[derive(Debug, Serialize, Deserialize)]
pub struct PostLoginData {
    pub email: String,
    pub password: String,
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostLoginData>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                String::from("auth_encode_plain_email"),
            ))
        }
    };

    let user = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM users usr
        WHERE email = $1;
        "#,
        email,
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
            String::from("no user with this email"),
        ));
    }
    let user = user.unwrap();

    let password = hash_password(&payload.password, &user.salt);

    match sqlx::query!(
        r#"
        SELECT usr.id
        FROM users usr
        WHERE usr.email = $1
        AND usr.password = $2;
        "#,
        email,
        &password,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(_) => {}
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    match user.banned_until {
        Some(banned_until) => {
            if banned_until > time::OffsetDateTime::now_utc() {
                return Err((StatusCode::FORBIDDEN, banned_until.to_string()));
            }
        }
        None => {}
    }

    let access_token =
        match claims::make_access_token(&user.id.to_string(), user.claim_level) {
            Ok(token) => token,
            Err((status, message)) => return Err((status, message)),
        };

    let refresh_token =
        match claims::make_refresh_token(&user.id.to_string(), user.claim_level) {
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

pub async fn refresh(
    claims: claims::Claims,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let user_id = match claims.subject_as_user_id() {
        Some(user_id) => user_id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    // TODO: check if user is banned?

    let user = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM users usr
        WHERE id = $1;
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
            StatusCode::BAD_REQUEST,
            String::from("no user with this id"),
        ));
    }
    let user = user.unwrap();

    match user.banned_until {
        Some(banned_until) => {
            if banned_until > time::OffsetDateTime::now_utc() {
                return Err((StatusCode::FORBIDDEN, banned_until.to_string()));
            }
        }
        None => {}
    }

    let access_token =
        match claims::make_access_token(&user.id.to_string(), claims::ClaimLevel::User) {
            Ok(token) => token,
            Err((status, message)) => return Err((status, message)),
        };

    Ok(axum::Json(Tokens {
        user_id: user.id,
        claims_level: claims::ClaimLevel::User.encode_numeric(),
        access_token: access_token,
        refresh_token: None,
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostAcceptInvitationData {
    pub name: user::FirstName,
    pub email: String,
    pub password: String,
    pub language: user::Language,
    pub country: user::Country,
}

pub async fn accept_invitation(
    Path(code): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostAcceptInvitationData>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                String::from("auth_encode_plain_email"),
            ))
        }
    };

    let invitation = match sqlx::query_as!(
        invitation::Invitation,
        r#"
        SELECT * FROM invitations WHERE email = $1 AND code = $2
        "#,
        email,
        code
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(invitation) => invitation,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if invitation.is_none() {
        return Err((StatusCode::NOT_FOUND, String::from("can't find code")));
    }
    let invitation = invitation.unwrap();

    let salt = generate_salt();
    let password = hash_password(&payload.password, &salt);

    let user = match sqlx::query_as!(
        user::User,
        r#"
        INSERT INTO users (claim_level, first_name, email, salt, password, created_at, updated_at, language, country, changes)
        VALUES($1,$2,$3,$4,$5,NOW(),NOW(),$6,$7,'[]'::JSONB) 
        RETURNING *;
        "#,
        invitation.claim_level,
        payload.name,
        email,
        &salt,
        &password,
        payload.language,
        payload.country,
    ).fetch_optional(&state.db).await {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if user.is_none() {
        return Err((StatusCode::BAD_REQUEST, String::from("user already exists")));
    }
    let user = user.unwrap();

    match sqlx::query!(
        r#"
        DELETE
        FROM invitations
        WHERE id = $1
        "#,
        invitation.id
    )
    .execute(&state.db)
    .await
    {
        Ok(_) => {}
        Err(e) => {
            eprintln!("ERROR user_accept_invitation_delete_old {}", e);
        }
    };

    let access_token =
        match claims::make_access_token(&user.id.to_string(), claims::ClaimLevel::User) {
            Ok(token) => token,
            Err((status, message)) => return Err((status, message)),
        };

    let refresh_token =
        match claims::make_refresh_token(&user.id.to_string(), claims::ClaimLevel::User) {
            Ok(token) => token,
            Err((status, message)) => return Err((status, message)),
        };

    Ok(axum::Json(Tokens {
        user_id: user.id,
        claims_level: claims::ClaimLevel::User.encode_numeric(),
        access_token: access_token,
        refresh_token: Some(refresh_token),
    }))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostResetPasswordData {
    pub email: String,
    pub password: String,
}

pub async fn reset_password(
    Path(code): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostResetPasswordData>,
) -> Result<StatusCode, (StatusCode, String)> {
    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                String::from("auth_encode_plain_email"),
            ))
        }
    };

    let recovery_request = match sqlx::query_as!(
        recovery_request::RecoveryRequest,
        r#"
        SELECT * FROM recovery_requests WHERE email = $1 AND code = $2
        "#,
        email,
        code
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if recovery_request.is_none() {
        return Err((StatusCode::NOT_FOUND, String::from("can't find code")));
    }
    let recovery_request = recovery_request.unwrap();

    let new_salt = generate_salt();
    let password = hash_password(&payload.password, &new_salt);

    let user = match sqlx::query_as!(
        user::User,
        r#"
        UPDATE users usr
        SET 
            password = $2,
            salt = $3
        WHERE usr.email = $1
        RETURNING *
        "#,
        email,
        &password,
        &new_salt,
    )
    .fetch_optional(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    if user.is_none() {
        return Err((StatusCode::BAD_REQUEST, String::from("user doesn't exist")));
    }

    match sqlx::query!(
        r#"
        DELETE FROM recovery_requests WHERE id = $1
        "#,
        recovery_request.id
    )
    .execute(&state.db)
    .await
    {
        Ok(_) => {}
        Err(e) => {
            eprintln!("ERROR user_reset_password_delete_old {}", e);
        }
    };

    Ok(StatusCode::OK)
}
