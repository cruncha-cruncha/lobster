use super::grievance;
use serde::{Deserialize, Serialize};

pub type Id = i32;
pub type GrievanceId = grievance::Id;
pub type AuthorId = i32;
pub type Text = String;
pub type CreatedAt = time::OffsetDateTime;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrievanceReply {
    pub id: Id,
    pub grievance_id: GrievanceId,
    pub author_id: AuthorId,
    pub text: Text,
    pub created_at: CreatedAt,
}
