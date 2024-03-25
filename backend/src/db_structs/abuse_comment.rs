use serde::{Deserialize, Serialize};

use super::{abuse, user};

pub type Uuid = uuid::Uuid;
pub type AbuseUuid = abuse::Uuid;
pub type AuthorId = user::Id;
pub type Content = String;
pub type CreatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct AbuseComment {
    pub uuid: Uuid,
    pub abuse_uuid: AbuseUuid,
    pub author_id: AuthorId,
    pub content: Content,
    pub created_at: CreatedAt,
}