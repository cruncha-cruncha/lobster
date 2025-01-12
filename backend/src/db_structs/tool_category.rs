use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;
pub type Synonyms = Vec<String>;
pub type Description = String;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCategory {
    pub id: Id,
    pub name: Name,
    pub synonyms: Synonyms,
    pub description: Option<Description>,
}
