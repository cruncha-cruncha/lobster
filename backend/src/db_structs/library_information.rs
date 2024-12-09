use serde::{Deserialize, Serialize};

pub type Uuid = uuid::Uuid;
pub type Salt = Vec<u8>;
pub type Name = String;
pub type MaximumRentalPeriod = i32;
pub type MaximumFuture = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct LibraryInformation {
    pub uuid: Uuid,
    pub salt: Salt,
    pub name: Name,
    pub maximum_rental_period: MaximumRentalPeriod,
    pub maximum_future: MaximumFuture,
}