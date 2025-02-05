use crate::db_structs::user;
use axum::{
    extract::Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use rand::Rng;
use serde::{Deserialize, Serialize};

pub const PAGE_SIZE: i64 = 20;
pub const MAX_GRIEVANCE_TITLE_LENGTH: usize = 250;
pub const MAX_GRIEVANCE_DESCRIPTION_LENGTH: usize = 5000;
pub const MAX_GRIEVANCE_REPLY_TEXT_LENGTH: usize = 5000;
pub const MAX_LIBRARY_NAME_LENGTH: usize = 400;
pub const MAX_TOOL_RENTAL_CHECK_IN_COUNT: usize = 200;
pub const MAX_TOOL_RENTAL_CHECK_OUT_COUNT: usize = 200;
pub const MAX_STORE_TITLE_LENGTH: usize = 250;
pub const MAX_STORE_LOCATION_LENGTH: usize = 250;
pub const MAX_STORE_EMAIL_LENGTH: usize = 400;
pub const MAX_STORE_PHONE_LENGTH: usize = 20;
pub const MAX_STORE_RENTAL_INFO_LENGTH: usize = 5000;
pub const MAX_STORE_OTHER_INFO_LENGTH: usize = 5000;
pub const MAX_TOOL_CATEGORY_NAME_LENGTH: usize = 250;
pub const MAX_TOOL_CATEGORY_DESCRIPTION_LENGTH: usize = 1000;
pub const MAX_TOOL_CATEGORY_SYNONYMS_LENGTH: usize = 400;
pub const MAX_TOOL_SHORT_DESCRIPTION_LENGTH: usize = 80;
pub const MAX_TOOL_LONG_DESCRIPTION_LENGTH: usize = 1000;
pub const MAX_TOOL_REAL_ID_LENGTH: usize = 120;
pub const MAX_TOOL_CATEGORIES_LENGTH: i32 = 50;
pub const MAX_TOOL_PHOTOS_LENGTH: i32 = 50;
pub const MAX_USERNAME_LENGTH: usize = 64;

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
    status: u16,
    err_code: String,
    details: String,
}

impl IntoResponse for ErrResponse {
    fn into_response(self) -> Response {
        let json_part = Json(ErrResponseJsonPart {
            status: self.status.as_u16(),
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

pub fn none_or_verify_payload_text_length (text: Option<&str>, min: usize, max: usize) -> Result<(), ErrResponse> {
    if let Some(text) = text {
        verify_payload_text_length(text, min, max)
    } else {
        Ok(())
    }
}

pub fn verify_payload_text_length (text: &str, min: usize, max: usize) -> Result<(), ErrResponse> {
    if text.len() < min {
        return Err(ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_REQ",
            &format!("Text is too short, min length is {}", min),
        ));
    }

    if text.len() > max {
        return Err(ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_REQ",
            &format!("Text is too long, max length is {}", max),
        ));
    }

    Ok(())
}

pub fn none_or_verify_payload_integer_range (int: Option<i32>, min: i32, max: i32) -> Result<(), ErrResponse> {
    if let Some(int) = int {
        verify_payload_integer_range(int, min, max)
    } else {
        Ok(())
    }
}

pub fn verify_payload_integer_range (int: i32, min: i32, max: i32) -> Result<(), ErrResponse> {
    if int < min {
        return Err(ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_REQ",
            &format!("Integer is too small, min value is {}", min),
        ));
    }

    if int > max {
        return Err(ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_REQ",
            &format!("Integer is too large, max value is {}", max),
        ));
    }

    Ok(())
}
