use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Email = Vec<u8>;
pub type Code = String;
pub type CreatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PasswordResetRequest {
    pub id: Id,
    pub email: Email,
    pub code: Code,
    pub created_at: CreatedAt,
}