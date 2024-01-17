use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Email = Vec<u8>;
pub type ClaimLevel = i32;
pub type Code = String;
pub type UpdatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Invitation {
    pub id: Id,
    pub email: Email,
    pub claim_level: ClaimLevel,
    pub code: Code,
    pub updated_at: UpdatedAt,
}