use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;
pub type Symbol = String;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Currency {
    pub id: Id,
    pub name: Name,
    pub symbol: Symbol,
}