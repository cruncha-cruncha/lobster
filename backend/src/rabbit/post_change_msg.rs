use core::panic;

use serde::{Deserialize, Serialize};

use crate::db_structs::post;


pub enum Action {
    Hello = 1,
    Create = 2,
    Update = 3,
    Remove = 4,
}

impl Action {
    pub fn encode_numeric(&self) -> i32 {
        match self {
            Action::Hello => 1,
            Action::Create => 2,
            Action::Update => 3,
            Action::Remove => 4,
        }
    }
}

impl Into<Action> for i32 {
    fn into(self) -> Action {
        match self {
            1 => Action::Hello,
            2 => Action::Create,
            3 => Action::Update,
            4 => Action::Remove,
            _ => panic!("Invalid action"),
        }
    }
}

pub type Uuid = post::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Info {
    pub author_id: AuthorId,
    pub title: Title,
    pub content: Content,
    pub price: Price,
    pub currency: Currency,
    pub latitude: Latitude,
    pub longitude: Longitude,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
}

pub type AuthorId = post::AuthorId;
pub type Title = post::Title;
pub type Content = post::Content;
pub type Price = post::Price;
pub type Currency = post::Currency;
pub type Latitude = post::Latitude;
pub type Longitude = post::Longitude;
pub type CreatedAt = post::CreatedAt;
pub type UpdatedAt = post::UpdatedAt;

#[derive(Debug, Serialize, Deserialize)]
pub struct PostChangeMsg {
    pub action: i32,
    pub uuid: Uuid,
    pub info: Option<Info>,
}

impl PostChangeMsg {
    fn from_post(action: Action, post: &post::Post) -> Self {
        Self {
            action: action.encode_numeric(),
            uuid: post.uuid.clone(),
            info: Some(Info {
                author_id: post.author_id,
                title: post.title.clone(),
                content: post.content.clone(),
                price: post.price,
                currency: post.currency,
                latitude: post.latitude,
                longitude: post.longitude,
                created_at: post.created_at.clone(),
                updated_at: post.updated_at.clone(),
            }),
        }
    }

    pub fn hello() -> Self {
        Self {
            action: Action::Hello.encode_numeric(),
            uuid: Uuid::new_v4(),
            info: None,
        }
    }

    pub fn create(post: &post::Post) -> Self {
        Self::from_post(Action::Create, post)
    }

    pub fn update(post: &post::Post) -> Self {
        Self::from_post(Action::Update, post)
    }

    pub fn remove(uuid: &Uuid) -> Self {
        Self {
            action: Action::Remove.encode_numeric(),
            uuid: uuid.clone(),
            info: None,
        }
    }

    pub fn encode(&self) -> Vec<u8> {
        serde_json::to_vec(self).unwrap_or_default()
    }
}