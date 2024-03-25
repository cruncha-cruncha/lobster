use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct AbuseStatus {
    pub id: Id,
    pub name: Name,
}