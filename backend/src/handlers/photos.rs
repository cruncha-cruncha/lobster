use crate::{auth::claims::Claims, common};
use axum::extract::Path;
use axum::response::{IntoResponse, Response};
use axum::{extract::Json, http::header, http::StatusCode};
use axum_extra::extract::Multipart;
use image::ImageReader;
use serde::{Deserialize, Serialize};
use tokio::fs;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadResponseData {
    pub file_name: String,
}

fn format_path(file_key: &str) -> String {
    format!("./home/photos/{}.jpeg", file_key)
}

fn format_thumb_path(file_key: &str) -> String {
    format!("./home/photos/thumbs/{}.jpeg", file_key)
}

pub async fn upload(
    claims: Claims,
    mut multipart: Multipart,
) -> Result<Json<UploadResponseData>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "No claims found",
        ));
    };

    let mut file_data = None;
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        if name != "file" {
            continue;
        }

        file_data = match field.bytes().await {
            Ok(b) => Some(b),
            Err(e) => {
                return Err(common::ErrResponse::new(
                    StatusCode::BAD_REQUEST,
                    "ERR_REQ",
                    &e.to_string(),
                ));
            }
        };

        break;
    }

    if file_data.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_BAD_REQUEST",
            "No files found",
        ));
    }
    let file_data = file_data.unwrap();

    let new_file_key = Uuid::new_v4();
    let mut path = format_path(&new_file_key.to_string());

    let make_image_error =
        |e: &str| common::ErrResponse::new(StatusCode::BAD_REQUEST, "ERR_REQ", e);

    let img = ImageReader::new(std::io::Cursor::new(file_data))
        .with_guessed_format()
        .map_err(|e| make_image_error(&e.to_string()))?
        .decode()
        .map_err(|e| make_image_error(&e.to_string()))?
        .resize(1024, 1024, image::imageops::FilterType::Triangle);

    img.save(&path)
        .map_err(|e| make_image_error(&e.to_string()))?;

    path = format_thumb_path(&new_file_key.to_string());
    let thumb_img = img.thumbnail(128, 128);
    thumb_img
        .save(&path)
        .map_err(|e| make_image_error(&e.to_string()))?;

    Ok(Json(UploadResponseData {
        file_name: new_file_key.to_string(),
    }))
}

pub async fn delete(
    claims: Claims,
    Path(file_key): Path<String>,
) -> Result<(), common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "No claims found",
        ));
    };

    let path = format_path(&file_key);
    match fs::remove_file(&path).await {
        Ok(stream) => stream,
        Err(e) => {
            eprintln!("Failed to read file: {}", &path);
            return Err(common::ErrResponse::new(
                StatusCode::NOT_FOUND,
                "ERR_MIA",
                &e.to_string(),
            ));
        }
    };

    Ok(())
}

pub async fn get(
    claims: Claims,
    Path(file_key): Path<String>,
) -> Result<Response, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "No claims found",
        ));
    };

    let path = format_path(&file_key);
    let data = match fs::read(&path).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Failed to read file: {}", &path);
            return Err(common::ErrResponse::new(
                StatusCode::NOT_FOUND,
                "ERR_MIA",
                &e.to_string(),
            ));
        }
    };

    let attachment_header = format!("attachment; filename=\"{}.jpg\"", file_key);
    let headers = [
        (header::CONTENT_TYPE, "image/jpeg"),
        (header::CONTENT_DISPOSITION, attachment_header.as_str()),
    ];

    Ok((headers, data).into_response())
}

pub async fn get_thumbnail(
    claims: Claims,
    Path(file_key): Path<String>,
) -> Result<Response, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "No claims found",
        ));
    };

    let path = format_thumb_path(&file_key);
    let data = match fs::read(&path).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("Failed to read file: {}", &path);
            return Err(common::ErrResponse::new(
                StatusCode::NOT_FOUND,
                "ERR_MIA",
                &e.to_string(),
            ));
        }
    };

    let attachment_header = format!("attachment; filename=\"{}.jpg\"", file_key);
    let headers = [
        (header::CONTENT_TYPE, "image/jpeg"),
        (header::CONTENT_DISPOSITION, attachment_header.as_str()),
    ];

    Ok((headers, data).into_response())
}
