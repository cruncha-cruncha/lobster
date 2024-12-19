use crate::db_structs::user;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoData {}

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
