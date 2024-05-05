use serde::{Deserialize, Serialize};

use crate::db_structs::post;

use super::post_change_msg::CommentCount;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PostWithCommentCount {
    pub uuid: post::Uuid,
    pub author_id: post::AuthorId,
    pub title: post::Title,
    pub images: post::Images,
    pub content: post::Content,
    pub price: post::Price,
    pub currency: post::Currency,
    pub country: post::Country,
    pub latitude: post::Latitude,
    pub longitude: post::Longitude,
    pub created_at: post::CreatedAt,
    pub updated_at: post::UpdatedAt,
    pub deleted: post::Deleted,
    pub draft: post::Draft,
    pub sold: post::Sold,
    pub changes: post::Changes,
    pub comment_count: CommentCount,
}
