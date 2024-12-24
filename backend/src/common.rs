use crate::db_structs::user;

pub const PAGE_SIZE: i64 = 20;

pub fn calculate_offset_limit(page: i64) -> (i64, i64) {
    let page = page.max(1);
    let offset = (page - 1) * PAGE_SIZE;
    (offset, PAGE_SIZE)
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoData {}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdOnly {
    pub id: i32,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatusOnly {  
    pub status: i32,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow, sqlx::Type)]
pub struct Status {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow, sqlx::Type)]
pub struct UserWithName {
    pub id: user::Id,
    pub username: user::Username,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow, sqlx::Type, Default)]
pub struct DateBetween {
    pub start: Option<time::OffsetDateTime>,
    pub end: Option<time::OffsetDateTime>,
}
