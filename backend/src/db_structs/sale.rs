use serde::{Deserialize, Serialize};
use super::{post, user};

pub type Uuid = uuid::Uuid;
pub type PostUuid = post::Uuid;
pub type BuyerId = user::Id;
pub type CreatedAt = time::OffsetDateTime;
pub type ReviewedAt = time::OffsetDateTime;
pub type Price = String;
pub type Rating = i32;
pub type Review = String;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Sale {
    pub uuid: Uuid,
    pub post_uuid: PostUuid,
    pub buyer_id: BuyerId,
    pub created_at: CreatedAt,
    pub reviewed_at: ReviewedAt,
    pub price: Price,
    pub rating: Rating,
    pub review: Review,
}
