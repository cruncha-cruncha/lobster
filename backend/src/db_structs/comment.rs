use serde::{Deserialize, Serialize};
use super::user;

pub type Uuid = uuid::Uuid;
pub type PostUuid = uuid::Uuid;
pub type AuthorId = user::Id;
pub type PosterId = user::Id;
pub type Content = String;
pub type CreatedAt = time::OffsetDateTime;
pub type UpdatedAt = time::OffsetDateTime;
pub type Deleted = bool;
pub type Changes = serde_json::Value;
pub type UnreadByAuthor = serde_json::Value;
pub type UnreadByPoster = serde_json::Value;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Comment {
    pub uuid: Uuid,
    pub post_uuid: PostUuid,
    pub author_id: AuthorId,
    pub poster_id: PosterId,
    pub content: Content,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub deleted: Deleted,
    pub changes: Changes,
    pub unread_by_author: UnreadByAuthor,
    pub unread_by_poster: UnreadByPoster,
}