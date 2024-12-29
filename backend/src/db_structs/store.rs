use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type Name = String;
pub type Status = i32;
pub type EmailAddress = String;
pub type PhoneNumber = String;
pub type RentalInformation = String;
pub type OtherInformation = String;
pub type Code = String;
pub type CreatedAt = time::OffsetDateTime;

pub enum StoreStatus {
    Active = 1,
    Pending = 2,
    Closed = 3,
    Banned = 4,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Store {
    pub id: Id,
    pub name: Name,
    pub status: Status,
    pub email_address: Option<EmailAddress>,
    pub phone_number: Option<PhoneNumber>,
    pub rental_information: Option<RentalInformation>,
    pub other_information: Option<OtherInformation>,
    pub code: Code,
    pub created_at: CreatedAt,
}
