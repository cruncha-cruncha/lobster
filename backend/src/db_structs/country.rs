use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Short = String;
pub type Name = String;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Country {
    pub id: Id,
    pub short: Short,
    pub name: Name,
}