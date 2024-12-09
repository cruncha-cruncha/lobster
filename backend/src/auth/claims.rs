use std::collections::HashMap;

use super::signing::{ALGORITHM, PRIVATE_KEY, PUBLIC_KEY};
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

const REFRESH_EXPIRY_DURATION: Duration = Duration::days(14);
const ACCESS_EXPIRY_DURATION: Duration = Duration::minutes(20);

fn make_token(
    sub: &str,
    exp: Duration,
    purpose: ClaimPurpose,
    permissions: &ClaimPermissions,
) -> Result<String, (StatusCode, String)> {
    let now = time::OffsetDateTime::now_utc();
    let expiry = match now.checked_add(exp) {
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
        purpose: purpose,
        permissions: permissions.clone(),
        exp: expiry.unix_timestamp(),
        iat: now.unix_timestamp(),
    };

    match jsonwebtoken::encode(&HEADER, &claims, &PRIVATE_KEY) {
        Ok(token) => Ok(token),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub fn make_refresh_token(sub: &str, permissions: &ClaimPermissions) -> Result<String, (StatusCode, String)> {
    make_token(sub, REFRESH_EXPIRY_DURATION, ClaimPurpose::Refresh, permissions)
}

pub fn make_access_token(sub: &str, permissions: &ClaimPermissions) -> Result<String, (StatusCode, String)> {
    make_token(sub, ACCESS_EXPIRY_DURATION, ClaimPurpose::Access, permissions)
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Copy, Clone)]
pub enum ClaimPurpose {
    Refresh = 2,
    Access = 1,
    None = 0,
}

impl ClaimPurpose {
    pub fn encode_numeric(&self) -> i32 {
        match self {
            ClaimPurpose::Refresh => 2,
            ClaimPurpose::Access => 1,
            ClaimPurpose::None => 0,
        }
    }
}

impl Into<ClaimPurpose> for i32 {
    fn into(self) -> ClaimPurpose {
        match self {
            2 => ClaimPurpose::Refresh,
            1 => ClaimPurpose::Access,
            _ => ClaimPurpose::None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub purpose: ClaimPurpose,
    pub permissions: ClaimPermissions,
    pub exp: i64,
    pub iat: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClaimPermissions {
    pub library: Vec<i64>,
    pub store: HashMap<i64, Vec<i64>>,
}

// assumes that 1 = 'library_admin', 2 = 'user_admin', 3 = 'store_admin', 4 = 'store_rep', and 5 = 'tool_manager'
// in the fixed.roles database table
impl Claims {
    pub fn subject_as_user_id(&self) -> Option<user::Id> {
        self.sub.parse::<user::Id>().ok()
    }

    pub fn is_library_admin(&self) -> bool {
        self.permissions.library.contains(&1)
    }

    pub fn is_user_admin(&self) -> bool {
        self.permissions.library.contains(&2)
    }

    pub fn is_store_admin(&self) -> bool {
        self.permissions.library.contains(&3)
    }

    pub fn is_store_rep(&self, store_id: i64) -> bool {
        self.permissions.store.get(&store_id).map_or(false, |perms| perms.contains(&4))
    }

    pub fn is_tool_manager(&self, store_id: i64) -> bool {
        self.permissions.store.get(&store_id).map_or(false, |perms| perms.contains(&5))
    }
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        use axum::http::header::AUTHORIZATION;
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
