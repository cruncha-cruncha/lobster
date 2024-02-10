use super::signing::{PUBLIC_KEY, PRIVATE_KEY, ALGORITHM};
use crate::db_structs::user;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::Validation;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use time::Duration;

#[allow(dead_code)]
const HEADER: Lazy<jsonwebtoken::Header> = Lazy::new(|| jsonwebtoken::Header::new(ALGORITHM));

pub fn get_refresh_token(
    sub: &str,
    level: ClaimLevel,
) -> Result<String, (StatusCode, String)> {
    let now = time::OffsetDateTime::now_utc();
    let expiry = match now.checked_add(Duration::days(14)) {
        Some(expiry) => expiry,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to calculate expiry".to_string(),
            ))
        }
    };

    let claims = Claims {
        sub: sub.to_string(),
        level,
        is_access: true,
        exp: expiry.unix_timestamp(),
        iat: now.unix_timestamp(),
    };

    match jsonwebtoken::encode(&HEADER, &claims, &PRIVATE_KEY) {
        Ok(token) => Ok(token),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub fn get_access_token(
    sub: &str,
    level: ClaimLevel,
) -> Result<String, (StatusCode, String)> {
    let now = time::OffsetDateTime::now_utc();
    let expiry = match now.checked_add(Duration::minutes(20)) {
        Some(expiry) => expiry,
        None => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to calculate expiry".to_string(),
            ))
        }
    };

    let claims = Claims {
        sub: sub.to_string(),
        level,
        is_access: true,
        exp: expiry.unix_timestamp(),
        iat: now.unix_timestamp(),
    };

    match jsonwebtoken::encode(&HEADER, &claims, &PRIVATE_KEY) {
        Ok(token) => Ok(token),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum ClaimLevel {
    Admin = 3,
    Moderator = 2,
    User = 1,
    None = 0,
}

impl ClaimLevel {
    pub fn encode_numeric(&self) -> i32 {
        match self {
            ClaimLevel::Admin => 3,
            ClaimLevel::Moderator => 2,
            ClaimLevel::User => 1,
            ClaimLevel::None => 0,
        }
    }
}

impl Into<ClaimLevel> for i32 {
    fn into(self) -> ClaimLevel {
        match self {
            3 => ClaimLevel::Admin,
            2 => ClaimLevel::Moderator,
            1 => ClaimLevel::User,
            _ => ClaimLevel::None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub level: ClaimLevel,
    pub is_access: bool,
    pub exp: i64,
    pub iat: i64,
}

impl Claims {
    pub fn subject_as_user_id(&self) -> Option<user::Id> {
        self.sub.parse::<user::Id>().ok()
    }
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        use hyper::header::AUTHORIZATION;
        use jsonwebtoken::decode;

        let header_value = match parts.headers.get(AUTHORIZATION) {
            Some(val) => val,
            None => return Err((StatusCode::UNAUTHORIZED, "No auth header".to_string())),
        };

        let auth_string = match header_value.to_str().ok().and_then(|s| {
            if s.starts_with("Bearer ") {
                Some(s[7..].to_string())
            } else {
                None
            }
        }) {
            Some(s) => s,
            None => return Err((StatusCode::BAD_REQUEST, "Invalid auth header".to_string())),
        };

        let token_data =
            match decode::<Claims>(&auth_string, &PUBLIC_KEY, &Validation::new(ALGORITHM)) {
                Ok(data) => data,
                Err(e) => return Err((StatusCode::BAD_REQUEST, e.to_string())),
            };

        Ok(token_data.claims)
    }
}
