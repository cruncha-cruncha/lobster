use crate::db_structs::{user, invitation};
use crate::auth::claims;
use crate::AppState;
use axum::{
    extract::{ConnectInfo, Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use crate::auth::encryption::{
    hash_password,
    generate_salt,
    encode_plain_email,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct Tokens {
    pub access: String,
    pub refresh: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostLoginData {
    pub email: user::Email,
    pub password: String,
}

pub async fn login(
    ConnectInfo(_sock): ConnectInfo<SocketAddr>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostLoginData>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let user = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM users usr
        WHERE email = $1;
        "#,
        payload.email,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let password = hash_password(&payload.password, &user.salt);

    match sqlx::query!(
        r#"
        SELECT usr.id
        FROM users usr
        WHERE usr.email = $1
        AND usr.password = $2;
        "#,
        payload.email,
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

    let access_token = match claims::get_access_token(
        &user.id.to_string(),
        claims::ClaimLevel::User,
    ) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    let refresh_token = match claims::get_refresh_token(
        &user.id.to_string(),
        claims::ClaimLevel::User,
    ) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(axum::Json(Tokens {
        access: access_token,
        refresh: refresh_token,
    }))
}

pub async fn refresh(
    ConnectInfo(_sock): ConnectInfo<SocketAddr>,
    claims: claims::Claims,
    State(state): State<Arc<AppState>>,
) -> Result<String, (StatusCode, String)> {
    let user_id = match claims.subject_as_user_id() {
        Some(user_id) => user_id,
        None => return Err((StatusCode::BAD_REQUEST, String::from(""))),
    };

    let user = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM users usr
        WHERE id = $1;
        "#,
        user_id,
    ).fetch_one(&state.db).await {
        Ok(row) => row,
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

    let access_token = match claims::get_access_token(
        &user.id.to_string(),
        claims::ClaimLevel::User,
    ) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(access_token)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostAcceptInvitationData {
    pub code: invitation::Code,
    pub name: user::FirstName,
    pub email: String,
    pub password: String,
    pub language: user::Language,
}

pub async fn accept_invitation(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostAcceptInvitationData>,
) -> Result<Json<Tokens>, (StatusCode, String)> {
    let invitation = match sqlx::query_as!(
        invitation::Invitation,
        r#"
        SELECT * FROM invitations WHERE email = $1 AND code = $2
        "#,
        payload.email,
        payload.code
    ).fetch_one(&state.db).await {
        Ok(invitation) => invitation,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let salt = generate_salt();
    let password = hash_password(&payload.password, &salt);
    let email = match encode_plain_email(&payload.email) {
        Some(email) => email,
        None => return Err((StatusCode::INTERNAL_SERVER_ERROR, String::from("auth_encode_plain_email"))),
    };

    let user = match sqlx::query_as!(
        user::User,
        r#"
        INSERT INTO users (claim_level, first_name, email, salt, password, created_at, updated_at, language, changes)
        VALUES($1,$2,$3,$4,$5,NOW(),NOW(),$6,'[]'::JSONB) 
        RETURNING *;
        "#,
        claims::ClaimLevel::User.pg_encode(),
        payload.name,
        email,
        &salt,
        &password,
        payload.language
    ).fetch_one(&state.db).await {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    match sqlx::query!(
        r#"
        DELETE FROM invitations WHERE id = $1
        "#,
        invitation.id
    ).execute(&state.db).await {
        Ok(_) => {},
        Err(e) => { eprintln!("ERROR user_accept_invitation_delete_old {}", e); },
    };

    let access_token = match claims::get_access_token(
        &user.id.to_string(),
        claims::ClaimLevel::User,
    ) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    let refresh_token = match claims::get_refresh_token(
        &user.id.to_string(),
        claims::ClaimLevel::User,
    ) {
        Ok(token) => token,
        Err((status, message)) => return Err((status, message)),
    };

    Ok(axum::Json(Tokens {
        access: access_token,
        refresh: refresh_token,
    }))
}
