use serde::{Deserialize, Serialize};
use super::user;

pub type Uuid = uuid::Uuid;
pub type CommentUuid = uuid::Uuid;
pub type AuthorId = user::Id;
pub type Content = String;
pub type CreatedAt = time::OffsetDateTime;
pub type UpdatedAt = time::OffsetDateTime;
pub type Deleted = bool;
pub type Changes = serde_json::Value;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Reply {
    pub uuid: Uuid,
    pub comment_uuid: CommentUuid,
    pub author_id: AuthorId,
    pub content: Content,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub deleted: Deleted,
    pub changes: Changes,
}