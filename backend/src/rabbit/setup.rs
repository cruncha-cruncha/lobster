use std::env;

use lapin::{
    options::*, types::FieldTable, Channel, Connection, ConnectionProperties, ExchangeKind, Result,
};

use super::{helpers::send_post_changed_message, post_change_msg::PostChangeMsg};

pub async fn setup() -> Result<(Connection, Channel)> {
    let addr = env::var("RABBIT_URL").expect("RABBIT_URL must be set");

    let conn = Connection::connect(&addr, ConnectionProperties::default()).await?;

    let channel = conn.create_channel().await?;

    channel
        .exchange_declare(
            "post-changed",
            ExchangeKind::Fanout,
            ExchangeDeclareOptions::default(),
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

    let message = PostChangeMsg::hello();
    send_post_changed_message(&channel, &message.encode()).await?;

    // Have to pass conn as well, even if it's never used.
    // Otherwise it'll be closed when it goes out of scope, the channel gets closed with it.
    return Ok((conn, channel));
}
