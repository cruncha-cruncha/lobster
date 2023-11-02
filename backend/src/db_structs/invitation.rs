use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Email = String;
pub type Code = String;
pub type UpdatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Invitation {
    pub id: Id,
    pub email: Email,
    pub code: Code,
    pub updated_at: UpdatedAt,
}