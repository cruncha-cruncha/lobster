use serde::{Deserialize, Serialize};

use crate::auth::claims;

pub type Id = i32;
pub type ClaimLevel = claims::ClaimLevel;
pub type FirstName = String;
pub type Email = Vec<u8>;
pub type Salt = Vec<u8>;
pub type Password = Vec<u8>;
pub type CreatedAt = time::OffsetDateTime;
pub type UpdatedAt = time::OffsetDateTime;
pub type BannedUntil = Option<time::OffsetDateTime>;
pub type Language = i32;
pub type Country = Option<i32>;
pub type Latitude = Option<f32>;
pub type Longitude = Option<f32>;
pub type Near = Option<String>;
pub type Changes = serde_json::Value;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Id,
    pub claim_level: ClaimLevel,
    pub first_name: FirstName,
    pub email: Email,
    pub salt: Salt,
    pub password: Password,
    pub banned_until: BannedUntil,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub language: Language,
    pub country: Country,
    pub latitude: Latitude,
    pub longitude: Longitude,
    pub near: Near,
    pub changes: Changes,
}