use super::user;
use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type ToolId = i32;
pub type RenterId = user::Id;
pub type StartDate = time::OffsetDateTime;
pub type EndDate = time::OffsetDateTime;
#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rental {
    pub id: Id,
    pub tool_id: ToolId,
    pub renter_id: RenterId,
    pub start_date: StartDate,
    pub end_date: Option<EndDate>,
}
