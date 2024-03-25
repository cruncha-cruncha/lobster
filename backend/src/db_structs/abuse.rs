use serde::{Deserialize, Serialize};
use super::user;

pub type Uuid = uuid::Uuid;
pub type ResourceUuid = Option<uuid::Uuid>;
pub type ResourceType = i32;
pub type OffenderId = user::Id;
pub type ReporterId = user::Id;
pub type Content = String;
pub type CreatedAt = time::OffsetDateTime;
pub type UpdatedAt = time::OffsetDateTime;
pub type Status = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Abuse {
    pub uuid: Uuid,
    pub resource_uuid: ResourceUuid,
    pub resource_type: ResourceType,
    pub offender_id: OffenderId,
    pub reporter_id: ReporterId,
    pub content: Content,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub status: Status,
}