use super::signing::{ALGORITHM, PRIVATE_KEY, PUBLIC_KEY};
use crate::db_structs::user;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::Validation;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
) -> Result<String, String> {
    let now = time::OffsetDateTime::now_utc();
    let expiry = match now.checked_add(exp) {
        Some(expiry) => expiry,
        None => return Err("Failed to calculate expiry".to_string()),
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
        Err(e) => Err(e.to_string()),
    }
}

pub fn make_refresh_token(sub: &str) -> Result<String, String> {
    make_token(
        sub,
        REFRESH_EXPIRY_DURATION,
        ClaimPurpose::Refresh,
        &ClaimPermissions {
            library: vec![],
            store: HashMap::new(),
        },
    )
}

pub fn make_access_token(sub: &str, permissions: &ClaimPermissions) -> Result<String, String> {
    make_token(
        sub,
        ACCESS_EXPIRY_DURATION,
        ClaimPurpose::Access,
        permissions,
    )
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

#[derive(Debug, Serialize, Deserialize, PartialEq, Copy, Clone)]
pub enum Roles {
    LibraryAdmin = 1,
    UserAdmin = 2,
    StoreAdmin = 3,
    StoreRep = 4,
    ToolManager = 5,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClaimPermissions {
    pub library: Vec<i32>,
    pub store: HashMap<i32, Vec<i32>>, // key = store_id, val = Vec<role_id>
}

// assumes that 1 = 'library_admin', 2 = 'user_admin', 3 = 'store_admin', 4 = 'store_manager', and 5 = 'tool_manager'
// in the fixed.roles database table
impl Claims {
    pub fn none() -> Self {
        Claims {
            sub: "".to_string(),
            purpose: ClaimPurpose::None,
            permissions: ClaimPermissions {
                library: vec![],
                store: HashMap::new(),
            },
            exp: 0,
            iat: 0,
        }
    }

    pub fn is_none(&self) -> bool {
        self.purpose == ClaimPurpose::None
    }

    pub fn subject_as_user_id(&self) -> Option<user::Id> {
        self.sub.parse::<user::Id>().ok()
    }

    pub fn is_library_admin(&self) -> bool {
        let num = Roles::LibraryAdmin as i32;
        self.permissions.library.contains(&num)
    }

    pub fn is_user_admin(&self) -> bool {
        let num = Roles::UserAdmin as i32;
        self.permissions.library.contains(&num)
    }

    pub fn is_store_admin(&self) -> bool {
        let num = Roles::StoreAdmin as i32;
        self.permissions.library.contains(&num)
    }

    pub fn is_store_manager(&self, store_id: i32) -> bool {
        let num = Roles::StoreRep as i32;
        self.permissions
            .store
            .get(&store_id)
            .map_or(false, |perms| perms.contains(&num))
    }

    pub fn is_tool_manager(&self, store_id: i32) -> bool {
        let num = Roles::ToolManager as i32;
        self.permissions
            .store
            .get(&store_id)
            .map_or(false, |perms| perms.contains(&num))
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
            None => return Ok(Claims::none()),
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
