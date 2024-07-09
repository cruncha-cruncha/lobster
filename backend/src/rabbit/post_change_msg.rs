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
    pub uuid: Uuid,
    pub author_id: AuthorId,
    pub title: Title,
    pub content: Content,
    pub images: Images,
    pub price: Price,
    pub currency: Currency,
    pub country: Country,
    pub location: Location,
    pub created_at: CreatedAt,
    pub updated_at: UpdatedAt,
    pub comment_count: CommentCount,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    pub lat: Latitude,
    pub lon: Longitude,
}

pub type AuthorId = post::AuthorId;
pub type Title = post::Title;
pub type Content = post::Content;
pub type Images = post::Images;
pub type Price = post::Price;
pub type Currency = post::Currency;
pub type Country = post::Country;
pub type Latitude = post::Latitude;
pub type Longitude = post::Longitude;
pub type CreatedAt = i64;
pub type UpdatedAt = i64;
pub type CommentCount = Option<i32>;

#[derive(Debug, Serialize, Deserialize)]
pub struct PostChangeMsg {
    pub action: i32,
    pub uuid: Uuid,
    pub info: Option<Info>,
}

impl PostChangeMsg {
    fn from_post(action: Action, post: &post::Post, comment_count: i32) -> Self {
        Self {
            action: action.encode_numeric(),
            uuid: post.uuid.clone(),
            info: Some(Info {
                uuid: post.uuid.clone(),
                author_id: post.author_id,
                title: post.title.clone(),
                content: post.content.clone(),
                images: post.images.clone(),
                price: post.price,
                currency: post.currency,
                country: post.country,
                location: Location {
                    lat: post.latitude,
                    lon: post.longitude,
                },
                created_at: post.created_at.unix_timestamp(),
                updated_at: post.updated_at.unix_timestamp(),
                comment_count: Some(comment_count),
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

    pub fn create(post: &post::Post, comment_count: i32) -> Self {
        Self::from_post(Action::Create, post, comment_count)
    }

    pub fn update(post: &post::Post, comment_count: i32) -> Self {
        Self::from_post(Action::Update, post, comment_count)
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
