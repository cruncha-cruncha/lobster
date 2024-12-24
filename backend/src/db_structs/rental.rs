use super::user;
use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type ToolId = i32;
pub type RenterId = user::Id;
pub type CreatedAt = time::OffsetDateTime;
pub type StartDate = time::OffsetDateTime;
pub type EndDate = time::OffsetDateTime;
pub type PickupDate = time::OffsetDateTime;
pub type ReturnDate = time::OffsetDateTime;
pub type Status = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rental {
    pub id: Id,
    pub tool_id: ToolId,
    pub renter_id: RenterId,
    pub created_at: CreatedAt,
    pub start_date: StartDate,
    pub end_date: Option<EndDate>,
    pub pickup_date: Option<PickupDate>,
    pub return_date: Option<ReturnDate>,
    pub status: Status,
}
