use lapin::{
    options::*, BasicProperties, Result, Channel, publisher_confirm::PublisherConfirm,
};

pub async fn send_post_changed_message(channel: &Channel, message: &[u8]) -> Result<PublisherConfirm> {
    send_message(channel, "posts", message).await
}

pub async fn send_message(channel: &Channel, queue: &str, message: &[u8]) -> Result<PublisherConfirm> {
    channel
        .basic_publish(
            "",
            queue,
            BasicPublishOptions::default(),
            message,
            BasicProperties::default(),
        ).await
}
