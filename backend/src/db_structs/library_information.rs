use serde::{Deserialize, Serialize};

pub type Uuid = uuid::Uuid;
pub type Name = String;
pub type MaximumRentalPeriod = i32;
pub type MaximumFuture = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryInformation {
    pub uuid: Uuid,
    pub name: Name,
    pub maximum_rental_period: MaximumRentalPeriod,
    pub maximum_future: MaximumFuture,
}