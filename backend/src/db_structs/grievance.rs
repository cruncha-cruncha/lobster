use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type AuthorId = i32;
pub type AccusedId = i32;
pub type Title = String;
pub type Description = String;
pub type CreatedAt = time::OffsetDateTime;
pub type Status = i32;

pub enum GrievanceStatus {
    Pending = 1,
    Innocent = 2,
    Guilty = 3,
    Banned = 4,
    Warned = 5,
    Cautioned = 6,
    Cheeky = 7,
    Insulting = 8,
    TimeServed = 9,
    Forgiven = 10,
    WronglyConvicted = 11,
    Libelled = 12,
    AtLarge = 13,
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Grievance {
    pub id: Id,
    pub author_id: AuthorId,
    pub accused_id: AccusedId,
    pub title: Title,
    pub description: Description,
    pub created_at: CreatedAt,
    pub status: Status,
}