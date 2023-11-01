use serde::{Deserialize, Serialize};
use super::user;

pub type PostUuid = uuid::Uuid;
pub type BuyerId = user::Id;
pub type CreatedAt = time::OffsetDateTime;
pub type ReviewedAt = time::OffsetDateTime;
pub type Price = String;
pub type Rating = i32;
pub type Review = String;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Sale {
    pub post_uuid: PostUuid,
    pub buyer_id: BuyerId,
    pub created_at: CreatedAt,
    pub reviewed_at: ReviewedAt,
    pub price: Price,
    pub rating: Rating,
    pub review: Review,
}
