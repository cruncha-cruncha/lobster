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

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tool {
    pub id: Id,
    pub real_id: Option<RealId>,
    pub store_id: StoreId,
    pub category_id: Option<CategoryId>,
    pub default_rental_period: Option<DefaultRentalPeriod>,
    pub description: Option<Description>,
    pub pictures: Pictures,
    pub status: Status,
}
