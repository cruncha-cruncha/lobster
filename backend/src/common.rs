use crate::db_structs::user;
use axum::{
    extract::Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use rand::Rng;
use serde::{Deserialize, Serialize};

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

impl DateBetween {
    pub fn none() -> Self {
        Self {
            start: None,
            end: None,
        }
    }
}

pub struct ErrResponse {
    pub status: StatusCode,
    pub err_code: String,
    pub details: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrResponseJsonPart {
    err_code: String,
    details: String,
}

impl IntoResponse for ErrResponse {
    fn into_response(self) -> Response {
        let json_part = Json(ErrResponseJsonPart {
            err_code: self.err_code.clone(),
            details: self.details.clone(),
        });

        (self.status, json_part).into_response()
    }
}

impl ErrResponse {
    pub fn new(status: StatusCode, err_code: &str, details: &str) -> Self {
        Self {
            status,
            err_code: err_code.to_string(),
            details: details.to_string(),
        }
    }
}

pub fn rnd_code_str(pre: &str) -> String {
    const CHARSET: &[u8] = b"0123456789ACEFHJKLNPRTUWXY";
    let mut rng = rand::thread_rng();
    let one_char = || CHARSET[rng.gen_range(0..CHARSET.len())] as char;
    let random_str = std::iter::repeat_with(one_char).take(8).collect::<String>();
    format!("{}{}-{}", pre, &random_str[..4], &random_str[4..])
}
