use lapin::{options::*, publisher_confirm::PublisherConfirm, BasicProperties, Channel, Result};
use serde::{Deserialize, Serialize};

use crate::db_structs::post;

use super::post_change_msg::CommentCount;

pub async fn send_post_changed_message(
    channel: &Channel,
    message: &[u8],
) -> Result<PublisherConfirm> {
    channel
        .basic_publish(
            "post-changed",
            "",
            BasicPublishOptions::default(),
            message,
            BasicProperties::default(),
        )
        .await
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct PostWithInfo {
    pub uuid: post::Uuid,
    pub author_id: post::AuthorId,
    pub title: post::Title,
    pub images: post::Images,
    pub content: post::Content,
    pub price: post::Price,
    pub currency: post::Currency,
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

impl Into<post::Post> for PostWithInfo {
    fn into(self) -> post::Post {
        post::Post {
            uuid: self.uuid,
            author_id: self.author_id,
            title: self.title,
            images: self.images,
            content: self.content,
            price: self.price,
            currency: self.currency,
            latitude: self.latitude,
            longitude: self.longitude,
            created_at: self.created_at,
            updated_at: self.updated_at,
            deleted: self.deleted,
            draft: self.draft,
            sold: self.sold,
            changes: self.changes,
        }
    }
}
