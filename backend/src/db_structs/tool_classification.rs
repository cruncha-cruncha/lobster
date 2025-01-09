use super::{tool, tool_category};
use serde::{Deserialize, Serialize};

pub type ToolId = tool::Id;
pub type CategoryId = tool_category::Id;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Clone, sqlx::Type)]
#[serde(rename_all = "camelCase")]
pub struct ToolClassification {
    pub tool_id: ToolId,
    pub category_id: CategoryId,
}
