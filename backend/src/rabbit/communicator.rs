use std::env;

use lapin::{
    options::*, publisher_confirm::PublisherConfirm, types::FieldTable, BasicProperties, Channel,
    Connection, ConnectionProperties, ExchangeKind,
};

#[derive(Debug, Clone)]
pub struct Communicator {
    channel: Option<Channel>,
}

pub async fn init() -> Result<(Connection, Communicator), String> {
    let addr = env::var("RABBIT_URL").map_err(|e| e.to_string())?;

    let connection = Connection::connect(&addr, ConnectionProperties::default())
        .await
        .map_err(|e| e.to_string())?;

    let channel = connection
        .create_channel()
        .await
        .map_err(|e| e.to_string())?;

    let communicator = Communicator::new(Some(channel));

    communicator.declare_queue("stores").await?;
    communicator.declare_queue("users").await?;

    // Have to pass conn as well, even if it's never used.
    // Otherwise it'll be closed when it goes out of scope, and the channel gets closed with it.
    return Ok((connection, communicator));
}

impl Communicator {
    pub fn new(channel: Option<Channel>) -> Self {
        Communicator { channel }
    }

    // RabbitMQ 'queues' are distinct from 'exchanges', but I'm calling this declare_queue because it's more generic
    pub async fn declare_queue(&self, queue: &str) -> Result<(), String> {
        let chan = match self.channel {
            Some(ref c) => c,
            None => return Err("Channel not initialized".to_string()),
        };

        chan.exchange_declare(
            queue,
            ExchangeKind::Fanout,
            ExchangeDeclareOptions {
                passive: false,
                durable: true,
                auto_delete: true,
                internal: false,
                nowait: false,
            },
            FieldTable::default(),
        )
        .await
        .map_err(|e| e.to_string())
    }

    pub async fn send_message(
        &self,
        queue: &str,
        payload: &[u8],
    ) -> Result<PublisherConfirm, String> {
        let chan = match self.channel {
            Some(ref c) => c,
            None => return Err("Channel not initialized".to_string()),
        };

        chan.basic_publish(
            queue,
            "",
            BasicPublishOptions::default(),
            payload,
            BasicProperties::default(),
        )
        .await
        .map_err(|e| e.to_string())
    }
}
