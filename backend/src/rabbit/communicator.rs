use std::env;

use super::post_change_msg::PostChangeMsg;

use lapin::{
    options::*, publisher_confirm::PublisherConfirm, types::FieldTable, BasicProperties, Channel,
    Connection, ConnectionProperties, ExchangeKind,
};

#[derive(Debug, Clone)]
pub struct Communicator {
    channel: Channel,
}

pub async fn init() -> Result<(Connection, Communicator), lapin::Error> {
    let addr = env::var("RABBIT_URL").expect("RABBIT_URL must be set");

    let conn = Connection::connect(&addr, ConnectionProperties::default()).await?;

    let channel = conn.create_channel().await?;

    channel
        .exchange_declare(
            "post-changed",
            ExchangeKind::Fanout,
            ExchangeDeclareOptions {
                passive: false,
                durable: true,
                auto_delete: false,
                internal: false,
                nowait: false,
            },
            FieldTable::default(),
        )
        .await?;

    /*
    Things to think about:
    - do we want a shared pool of channels, or just use the same one? How do we access it?
    - do we want to use rabbitMQ to send off unread notifications too, so a different service can handle the websockets?
    - what events do we need to send for search?
        - post created
        - post edited
        - post sold
        - post deleted
        - post published -> draft
        - post draft -> published
        - when a user is banned
        - when a user is unbanned
    */

    let communicator = Communicator { channel };

    let message = PostChangeMsg::hello();
    send_post_changed_message(&communicator, &message).await?;

    // Have to pass conn as well, even if it's never used.
    // Otherwise it'll be closed when it goes out of scope, and the channel gets closed with it.
    return Ok((conn, communicator));
}

pub async fn send_post_changed_message(
    communicator: &Communicator,
    message: &PostChangeMsg,
) -> Result<PublisherConfirm, lapin::Error> {
    communicator
        .channel
        .basic_publish(
            "post-changed",
            "",
            BasicPublishOptions::default(),
            &message.encode(),
            BasicProperties::default(),
        )
        .await
}
