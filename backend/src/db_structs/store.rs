use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;
pub type Status = i32;
pub type Location = String;
pub type Hours = String;
pub type Contact = String;
pub type Description = String;
pub type CreatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Store {
    pub id: Id,
    pub name: Name,
    pub status: Status,
    pub location: Location,
    pub hours: Hours,
    pub contact: Contact,
    pub description: Description,
    pub created_at: CreatedAt,
}