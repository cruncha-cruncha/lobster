use serde::{Deserialize, Serialize};
use super::{post, user};

pub type PostUuid = post::Uuid;
pub type BuyerId = user::Id;
pub type CreatedAt = time::OffsetDateTime;
pub type ReviewedAt = Option<time::OffsetDateTime>;
pub type Price = Option<String>;
pub type Rating = Option<f32>;
pub type Review = Option<String>;
pub type Changes = serde_json::Value;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct Sale {
    pub post_uuid: PostUuid,
    pub buyer_id: BuyerId,
    pub created_at: CreatedAt,
    pub reviewed_at: ReviewedAt,
    pub price: Price,
    pub rating: Rating,
    pub review: Review,
    pub changes: Changes,
}
