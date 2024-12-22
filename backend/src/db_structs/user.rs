use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Username = String;
pub type Status = i32;
pub type Email = String;
pub type CreatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Id,
    pub username: Username,
    pub status: Status,
    pub email: Email,
    pub created_at: CreatedAt,
}