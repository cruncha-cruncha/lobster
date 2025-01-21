use super::tool;
use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type ToolId = tool::Id;
pub type PhotoKey = String;
pub type OriginalName = String;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ToolPhoto {
    pub id: Id,
    pub tool_id: Option<ToolId>,
    pub photo_key: PhotoKey,
    pub original_name: OriginalName,
}
