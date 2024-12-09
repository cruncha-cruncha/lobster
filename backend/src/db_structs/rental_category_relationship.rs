use serde::{Deserialize, Serialize};

pub type ParentId = i32;
pub type ChildId = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct RentalCategoryRelationship {
    pub parent_id: ParentId,
    pub child_id: ChildId,
}