use serde::{Deserialize, Serialize};

use super::user;

pub type Uuid = uuid::Uuid;
pub type AuthorId = user::Id;
pub type Title = String;
pub type Images = Vec<String>;
pub type Content = String;
pub type Price = f32;
pub type Currency = i32;
pub type Latitude = f32;
pub type Longitude = f32;
pub type CreatedAt = time::OffsetDateTime;
pub type UpdatedAt = time::OffsetDateTime;
pub type Deleted = bool;
pub type Draft = bool;
pub type Changes = serde_json::Value;

#[derive(Debug, sqlx::FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Post {
    pub uuid: Uuid,
    pub author_id: AuthorId,
    pub title: Title,
    pub images: Images,
    pub content: Content,
    pub price: Price,
    pub currency: Currency,
    pub latitude: Latitude,
    pub longitude: Longitude,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub deleted: Deleted,
    pub draft: Draft,
    pub changes: Changes,
}