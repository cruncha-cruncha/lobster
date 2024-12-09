use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type AuthorId = i32;
pub type AccusedId = i32;
pub type Title = String;
pub type Description = String;
pub type CreatedAt = time::OffsetDateTime;
pub type Status = i32;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Grievance {
    pub id: Id,
    pub author_id: AuthorId,
    pub accused_id: AccusedId,
    pub title: Title,
    pub description: Description,
    pub created_at: CreatedAt,
    pub status: Status,
}