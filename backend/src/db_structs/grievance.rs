use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type AuthorId = i32;
pub type AccusedId = i32;
pub type Title = String;
pub type Description = String;
pub type CreatedAt = time::OffsetDateTime;
pub type Status = i32;

pub enum GrievanceStatus {
    Open = 1,
    Investigating = 2,
    Evidencial = 3,
    Spurious = 4,
    Petty = 5,
    Uncouth = 6,
    Cautionary = 7,
    Consequential = 8,
    Bourgeois = 9,
    Eggregious = 10,
    Bannable = 11,
    Outrageous = 12,
    Horrific = 13,
    Shocking = 14,
    Reprehensible = 15,
    Unforgivable = 16,
    Forgiven = 17,
    JusticeServed = 18,
    Resolved = 19,
    Warning = 20,
    NoAction = 21,
    Closed = 22,
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