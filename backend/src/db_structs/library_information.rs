use serde::{Deserialize, Serialize};

pub type Uuid = uuid::Uuid;
pub type Name = String;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInformation {
    pub uuid: Uuid,
    pub name: Name,
}