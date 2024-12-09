use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type RealId = Option<String>;
pub type StoreId = i32;
pub type CategoryId = Option<i32>;
pub type DefaultRentalPeriod = Option<i32>;
pub type Description = String;
pub type Pictures = Vec<String>;
pub type Status = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Tool {
    pub id: Id,
    pub real_id: RealId,
    pub store_id: StoreId,
    pub category_id: CategoryId,
    pub default_rental_period: DefaultRentalPeriod,
    pub description: Description,
    pub pictures: Pictures,
    pub status: Status,
}