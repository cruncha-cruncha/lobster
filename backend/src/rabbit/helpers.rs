use lapin::{
    options::*, BasicProperties, Result, Channel, publisher_confirm::PublisherConfirm,
};

pub async fn send_post_changed_message(channel: &Channel, message: &[u8]) -> Result<PublisherConfirm> {
    channel
        .basic_publish(
            "post-changed",
            "search-ingest",
            BasicPublishOptions::default(),
            message,
            BasicProperties::default(),
        ).await
}
