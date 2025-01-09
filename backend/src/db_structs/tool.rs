use super::store;
use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type RealId = String;
pub type StoreId = store::Id;
pub type CategoryId = i32;
pub type DefaultRentalPeriod = i32;
pub type Description = String;
pub type Pictures = Vec<String>;
pub type Status = i32;

pub enum ToolStatus {
    Available = 1,
    Rented = 2,
    Maintenance = 3,
    Broken = 4,
    Lost = 5,
    Stolen = 6,
    Retired = 7,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tool {
    pub id: Id,
    pub real_id: RealId,
    pub store_id: StoreId,
    pub category_id: CategoryId,
    pub default_rental_period: Option<DefaultRentalPeriod>,
    pub description: Option<Description>,
    pub pictures: Pictures,
    pub status: Status,
}
