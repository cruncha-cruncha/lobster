use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Username = String;
pub type Status = i32;
pub type Code = String;
pub type EmailAddress = String;
pub type CreatedAt = time::OffsetDateTime;

pub enum UserStatus {
    Active = 1,
    Pending = 2,
    Banned = 3,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Id,
    pub username: Username,
    pub status: Status,
    pub code: Code,
    pub email_address: EmailAddress,
    pub created_at: CreatedAt,
}
