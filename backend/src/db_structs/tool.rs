use super::store;
use serde::{Deserialize, Serialize};

pub const SHORT_DESCRIPTION_CHAR_LIMIT: usize = 80;

pub type Id = i32;
pub type RealId = String;
pub type StoreId = store::Id;
pub type RentalHours = i32;
pub type ShortDescription = String;
pub type LongDescription = String;
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
    pub rental_hours: RentalHours,
    pub short_description: ShortDescription,
    pub long_description: Option<LongDescription>,
    pub pictures: Pictures,
    pub status: Status,
}
