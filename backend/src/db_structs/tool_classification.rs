use serde::{Deserialize, Serialize};

pub type ToolId = i32;
pub type CategoryId = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize, Clone, sqlx::Type)]
#[serde(rename_all = "camelCase")]
pub struct ToolClassification {
    pub tool_id: ToolId,
    pub category_id: CategoryId,
}