use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;
pub type IpAddress = Option<sqlx::types::ipnetwork::IpNetwork>;
pub type Email = String;
pub type Salt = Vec<u8>;
pub type Password = String;
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
    pub name: Name,
    pub ip_address: IpAddress,
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