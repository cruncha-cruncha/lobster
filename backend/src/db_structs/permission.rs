use super::store;
use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type UserId = i32;
pub type RoleId = i32;
pub type StoreId = store::Id;
pub type Status = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Permission {
    pub id: Id,
    pub user_id: UserId,
    pub role_id: RoleId,
    pub store_id: Option<StoreId>,
    pub status: Status,
}
