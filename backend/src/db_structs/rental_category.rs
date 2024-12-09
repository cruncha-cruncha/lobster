use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;
pub type Synonyms = Vec<String>;
pub type Description = Option<String>;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct RentalCategory {
    pub id: Id,
    pub name: Name,
    pub synonyms: Synonyms,
    pub description: Description,
}