use crate::db_structs::{helpers, user, invitation};
use crate::{AppState, Claims};
use axum::{
    extract::{Json, Path, State, ConnectInfo},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::net::SocketAddr;
use std::str::FromStr;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct GetUserData {
    pub id: user::Id,
    pub name: user::Name,
    pub email: user::Email,
    pub banned_until: user::BannedUntil,
    pub created_at: user::CreatedAt,
    pub updated_at: user::UpdatedAt,
    pub language: user::Language,
    pub country: user::Country,
    pub latitude: user::Latitude,
    pub longitude: user::Longitude,
    pub near: user::Near,
    pub changes: serde_json::Value,
}

pub async fn get(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetUserData>, (StatusCode, String)> {
    #[cfg(not(feature = "ignoreAuth"))]
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    // struct used in query_as must be a subset of columns returned from SELECT
    let row = match sqlx::query_as!(GetUserData, r#"
        SELECT
            usr.id,
            usr.name,
            usr.email,
            usr.banned_until,
            usr.created_at,
            usr.updated_at,
            usr.language,
            usr.country,
            usr.latitude,
            usr.longitude,
            usr.near,
            usr.changes
        FROM users usr
        WHERE usr.id = $1
        "#, user_id as i64)
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PatchUserData {
    pub name: user::Name,
    pub language: user::Language,
    pub country: user::Country,
    pub latitude: user::Latitude,
    pub longitude: user::Longitude,
    pub near: user::Near,
}

pub async fn patch(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PatchUserData>, // json data being sent must be a superset of struct
) -> Result<Json<GetUserData>, (StatusCode, String)> {
    #[cfg(not(feature = "ignoreAuth"))]
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    if payload.name == "" || payload.language == 0 {
        return Err((StatusCode::BAD_REQUEST, String::from("")));
    }

    let row = match sqlx::query_as!(GetUserData, r#"
        UPDATE users usr
        SET
            name = $3,
            language = $4,
            country = $5,
            latitude = $6,
            longitude = $7,
            near = $8,
            updated_at = NOW(),
            changes = changes || jsonb_build_array(jsonb_build_object(
                'who', $2::TEXT,
                'when', NOW(),
                'name', usr.name,
                'language', usr.language,
                'country', usr.country,
                'latitude', usr.latitude,
                'longitude', usr.longitude,
                'near', usr.near
            ))
        WHERE usr.id = $1
        RETURNING
            usr.id,
            usr.name,
            usr.email,
            usr.banned_until,
            usr.created_at,
            usr.updated_at,
            usr.language,
            usr.country,
            usr.latitude,
            usr.longitude,
            usr.near,
            usr.changes
        "#, user_id as i64, claims.sub, payload.name, payload.language, payload.country, payload.latitude, payload.longitude, payload.near)
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    };

    Ok(axum::Json(row))
}

pub async fn delete(
    claims: Claims,
    Path(user_id): Path<u32>,
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, String)> {
    #[cfg(not(feature = "ignoreAuth"))]
    if claims.sub != user_id.to_string() {
        return Err((StatusCode::UNAUTHORIZED, String::from("")));
    }

    match sqlx::query_as!(
        helpers::RowsReturned,
        r#"
        WITH deleted AS (DELETE FROM users usr WHERE usr.id = $1 RETURNING *)
        SELECT COUNT(*) as count
        FROM deleted;
        "#,
        user_id as i64
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(row) => {
            if row.count == None || row.count == Some(0) {
                return Err((StatusCode::NOT_FOUND, String::from("")));
            }
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PostAccountData {
    pub code: invitation::Code,
    pub name: user::Name,
    pub email: user::Email,
    pub password: user::Password,
    pub language: user::Language,
}

pub async fn post(
    ConnectInfo(sock): ConnectInfo<SocketAddr>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PostAccountData>,
) -> Result<StatusCode, (StatusCode, String)> {
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

    let ip_addr = sqlx::types::ipnetwork::IpNetwork::from_str(&sock.ip().to_string()).ok();

    match sqlx::query!(
        r#"
        INSERT INTO users (name, ip_address, email, salt, password, created_at, updated_at, language)
        VALUES($1,$2,$3,$4,$5,NOW(),NOW(),$6) 
        RETURNING id;
        "#,
        payload.name,
        ip_addr,
        payload.email,
        b"",
        payload.password,
        payload.language
    ).fetch_one(&state.db).await {
        Ok(_) => {},
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    match sqlx::query!(
        r#"
        DELETE FROM invitations WHERE id = $1
        "#,
        invitation.id
    ).execute(&state.db).await {
        Ok(_) => {},
        Err(e) => { println!("ERROR user_accept_invitation_delete_old {}", e); },
    };

    Ok(StatusCode::OK)
}