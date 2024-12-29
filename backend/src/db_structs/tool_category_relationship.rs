use serde::{Deserialize, Serialize};

pub type ParentId = i32;
pub type ChildId = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCategoryRelationship {
    pub parent_id: ParentId,
    pub child_id: ChildId,
}