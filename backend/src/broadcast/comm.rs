use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::net::UdpSocket;
use std::sync::{Mutex, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

use super::post_change_msg::PostChangeMsg;

pub enum Meaning {
    HasData = 1,
    CaptainAck = 2,
    ConsumerAck = 3,
}

impl Meaning {
    pub fn encode_numeric(&self) -> i32 {
        match self {
            Meaning::HasData => 1,
            Meaning::CaptainAck => 2,
            Meaning::ConsumerAck => 3,
        }
    }
}

impl Into<Meaning> for i32 {
    fn into(self) -> Meaning {
        match self {
            1 => Meaning::HasData,
            2 => Meaning::CaptainAck,
            3 => Meaning::ConsumerAck,
            _ => panic!("Invalid meaning"),
        }
    }
}

// TODO: secure with TOTP?

#[derive(Debug, Default, Serialize, Deserialize)]
struct SyncMessage {
    meaning: i32,
    captains: Vec<String>,
    consumers: Vec<String>,
}

pub struct ZeroConfControl {
    last_sync: Mutex<u128>,
    socket: RwLock<UdpSocket>,
    captains: RwLock<HashMap<String, i32>>,
    consumers: RwLock<HashMap<String, i32>>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct CommDiagnosticsData {
    pub last_sync: u128,
    pub socket: String,
    pub captains: Vec<String>,
    pub consumers: Vec<String>,
}

impl ZeroConfControl {
    pub fn setup() -> ZeroConfControl {
        let captains = match env::var("BOOTSTRAP_P2P_CAPTAIN") {
            Ok(captain) => {
                let mut out = HashMap::new();
                out.insert(captain, 0);
                out
            }
            Err(_) => HashMap::new(),
        };

        let listen_addr = env::var("P2P_LISTEN_ADDR").expect("P2P_LISTEN_ADDR must be set");
        let socket = UdpSocket::bind(&listen_addr)
            .expect(&format!("Failed to bind to address {}", &listen_addr));
        socket
            .set_write_timeout(Some(std::time::Duration::from_millis(100)))
            .expect("Failed to set write timeout");
        socket
            .set_read_timeout(None)
            .expect("Failed to set read timeout");

        println!("Listening on {}", listen_addr);

        ZeroConfControl {
            last_sync: Mutex::new(0),
            socket: RwLock::new(socket),
            captains: RwLock::new(captains),
            consumers: RwLock::new(HashMap::new()),
        }
    }

    pub fn get_diagnostics(&self) -> CommDiagnosticsData {
        CommDiagnosticsData {
            last_sync: *self.last_sync.lock().unwrap(),
            socket: self
                .socket
                .read()
                .unwrap()
                .local_addr()
                .unwrap()
                .to_string(),
            captains: self.captains.read().unwrap().keys().cloned().collect(),
            consumers: self.consumers.read().unwrap().keys().cloned().collect(),
        }
    }

    fn encode(&self) -> Vec<u8> {
        let data = SyncMessage {
            meaning: Meaning::HasData.encode_numeric(),
            captains: self
                .captains
                .read()
                .unwrap()
                .keys()
                .map(|x| x.into())
                .collect(),
            consumers: self
                .consumers
                .read()
                .unwrap()
                .keys()
                .map(|x| x.into())
                .collect(),
        };

        serde_json::to_vec(&data).unwrap_or_default()
    }

    fn ack() -> Vec<u8> {
        let data = SyncMessage {
            meaning: Meaning::CaptainAck.encode_numeric(),
            captains: vec![],
            consumers: vec![],
        };

        serde_json::to_vec(&data).unwrap_or_default()
    }

    fn decode(buf: &[u8]) -> SyncMessage {
        serde_json::from_slice(buf).unwrap_or_default()
    }

    pub fn send_post_changed_message(&self, msg: &PostChangeMsg) {
        self.send_sync_messages();

        let buf = msg.encode();

        let mut consumers = self.consumers.write().unwrap();
        if consumers.is_empty() {
            return;
        }

        let key: String;
        let attempts: i32;
        {
            let keys: Vec<&String> = consumers.keys().collect();
            let rand_consumer = keys[rand::thread_rng().gen_range(0..keys.len())];
            attempts = consumers.get(rand_consumer).unwrap().clone();
            key = rand_consumer.clone();
        }

        self.socket
            .read()
            .unwrap()
            .send_to(&buf, &key)
            .or_else(|err| {
                eprint!("Failed to send message to consumer {}: {}", &key, err);
                Err(err)
            })
            .ok();

        consumers.insert(key, attempts + 30);
    }

    fn send_sync_messages(&self) {
        let now = get_unix_timestamp();

        let mut last_sync = self.last_sync.lock().unwrap();
        let t0 = {
            let mut rng = rand::thread_rng();
            let flutter = rng.gen_range(-1.0..1.0) * 1000.0;
            *last_sync + 60000 + flutter as u128
        };

        if t0 < now {
            *last_sync = now;
            drop(last_sync);

            let buf = self.encode();
            let mut captains = self.captains.write().unwrap();
            captains.retain(|name, attempts| {
                if *attempts > 120 {
                    println!("Removing captain {} with too many attempts ({})", name, attempts);
                    return false;
                } else if *attempts < 0 {
                    *attempts = 0;
                } else {
                    *attempts -= 1;
                }

                return true;            
            });
            for (captain, attempts) in captains.iter_mut() {
                *attempts += 30;
                self.socket
                    .read()
                    .unwrap()
                    .send_to(&buf, &captain)
                    .or_else(|err| {
                        eprint!("Failed to send message to captain {}: {}", &captain, err);
                        Err(err)
                    })
                    .ok();
            }
            drop(captains);

            let mut consumers = self.consumers.write().unwrap();
            consumers.retain(|name, attempts| {
                if *attempts > 120 {
                    println!("Removing consumer {} with too many attempts ({})", name, attempts);
                    return false;
                } else if *attempts < 0 {
                    *attempts = 0;
                } else {
                    *attempts -= 1;
                }

                return true;            
            });
        } else {
            drop(last_sync);
        }
    }
}

pub fn handle_sync_messages(control: &ZeroConfControl) {
    loop {
        let mut buf = [0; 4096]; // TODO: is this big enough?
        let (amt, src) = control.socket.read().unwrap().recv_from(&mut buf).unwrap();
        let buf = &buf[..amt];
        let message = ZeroConfControl::decode(buf);

        if message.meaning == Meaning::HasData.encode_numeric() {
            println!("Sync message with data from {}", src);
            let ack = ZeroConfControl::ack();
            control
                .socket
                .read()
                .unwrap()
                .send_to(&ack, &src)
                .or_else(|err| {
                    eprint!("Failed to send ack to {}: {}", &src, err);
                    Err(err)
                })
                .ok();

            let mut captains = control.captains.write().unwrap();
            for captain in message.captains {
                match captains.get(&captain) {
                    Some(_) => {}
                    None => {
                        println!("Adding captain {}", &captain);
                        captains.insert(captain, 0);
                    }
                }
            }
            drop(captains);

            let mut consumers = control.consumers.write().unwrap();
            for consumer in message.consumers {
                match consumers.get(&consumer) {
                    Some(_) => {}
                    None => {
                        println!("Adding consumer {}", &consumer);
                        consumers.insert(consumer, 0);
                    }
                }
            }
        } else if message.meaning == Meaning::CaptainAck.encode_numeric() {
            println!("Captain ack from {}", src);
            let key = src.to_string();
            let mut captains = control.captains.write().unwrap();
            captains
                .entry(key)
                .and_modify(|attempts| *attempts -= 30)
                .or_insert(0);
        } else if message.meaning == Meaning::ConsumerAck.encode_numeric() {
            println!("Consumer ack from {}", src);
            let key = src.to_string();
            let mut consumers = control.consumers.write().unwrap();
            consumers
                .entry(key)
                .and_modify(|attempts| *attempts -= 30)
                .or_insert(0);
        }
    }
}

fn get_unix_timestamp() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(std::time::Duration::new(0, 0))
        .as_millis()
}
