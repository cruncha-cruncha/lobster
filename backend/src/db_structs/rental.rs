use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type ToolId = i32;
pub type RenterId = i32;
pub type CreatedAt = time::OffsetDateTime;
pub type StartDate = time::OffsetDateTime;
pub type EndDate = time::OffsetDateTime;
pub type PickupDate = Option<time::OffsetDateTime>;
pub type ReturnDate = Option<time::OffsetDateTime>;
pub type Status = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Rental {
    pub id: Id,
    pub tool_id: ToolId,
    pub renter_id: RenterId,
    pub created_at: CreatedAt,
    pub start_date: StartDate,
    pub end_date: EndDate,
    pub pickup_date: PickupDate,
    pub return_date: ReturnDate,
    pub status: Status,
}