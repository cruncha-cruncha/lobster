use serde::{Deserialize, Serialize};
use super::user;

pub type Uuid = uuid::Uuid;
pub type PostUuid = uuid::Uuid;
pub type AuthorId = user::Id;
pub type Content = String;
pub type CreatedAt = time::OffsetDateTime;
pub type UpdatedAt = time::OffsetDateTime;
pub type Deleted = bool;
pub type Changes = serde_json::Value;
pub type ViewedByAuthor = bool;
pub type ViewedByPoster = bool;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Comment {
    pub uuid: Uuid,
    pub post_uuid: PostUuid,
    pub author_id: AuthorId,
    pub content: Content,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub deleted: Deleted,
    pub changes: Changes,
    pub viewed_by_author: ViewedByAuthor,
    pub viewed_by_poster: ViewedByPoster,
}