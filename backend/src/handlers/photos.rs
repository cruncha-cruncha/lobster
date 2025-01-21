use crate::queries::tool_photos;
use crate::AppState;
use crate::{auth::claims::Claims, common};
use axum::extract::{Path, State};
use axum::response::{IntoResponse, Response};
use axum::{extract::Json, http::header, http::StatusCode};
use axum_extra::extract::Multipart;
use image::ImageReader;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::fs;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadResponseData {
    pub key: String,
}

fn format_path(file_key: &str) -> String {
    format!("./home/photos/{}.jpeg", file_key)
}

fn format_thumb_path(file_key: &str) -> String {
    format!("./home/photos/thumbs/{}.jpeg", file_key)
}

pub async fn upload(
    claims: Claims,
    State(state): State<Arc<AppState>>,
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
    let mut original_name = None;
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();

        match name.as_str() {
            "name" => {
                original_name = match field.text().await {
                    Ok(t) => Some(t),
                    Err(_) => None,
                };
            }
            "file" => {
                file_data = match field.bytes().await {
                    Ok(b) => Some(b),
                    Err(e) => {
                        return Err(common::ErrResponse::new(
                            StatusCode::INTERNAL_SERVER_ERROR,
                            "ERR_LOGIC",
                            &e.to_string(),
                        ));
                    }
                };
            }
            _ => (),
        }
    }

    if file_data.is_none() || original_name.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_REQ",
            "No files found",
        ));
    }
    let original_name = original_name.unwrap();
    let file_data = file_data.unwrap();

    let new_file_key = Uuid::new_v4();
    let path = format_path(&new_file_key.to_string());

    let make_image_error =
        |e: &str| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_LOGIC", e);

    let img = ImageReader::new(std::io::Cursor::new(file_data))
        .with_guessed_format()
        .map_err(|e| make_image_error(&e.to_string()))?;
    let img = img.decode().map_err(|e| make_image_error(&e.to_string()))?;
    let img = img.resize(1024, 1024, image::imageops::FilterType::Triangle);

    img.save(&path)
        .map_err(|e| make_image_error(&e.to_string()))?;

    let path = format_thumb_path(&new_file_key.to_string());
    let thumb_img = img.thumbnail(128, 128);
    thumb_img
        .save(&path)
        .map_err(|e| make_image_error(&e.to_string()))?;

    match tool_photos::insert(
        vec![tool_photos::InsertData {
            tool_id: None,
            photo_key: new_file_key.to_string(),
            original_name,
        }],
        &state.db,
    )
    .await
    {
        Ok(_) => (),
        Err(e) => {
            eprintln!("Failed to insert photo: {}", &e);
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ));
        }
    }

    Ok(Json(UploadResponseData {
        key: new_file_key.to_string(),
    }))
}

pub async fn delete(
    claims: Claims,
    Path(file_key): Path<String>,
) -> Result<Json<common::NoData>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "No claims found",
        ));
    };

    let make_image_error =
        |e: &str| common::ErrResponse::new(StatusCode::INTERNAL_SERVER_ERROR, "ERR_LOGIC", e);

    let path = format_thumb_path(&file_key);
    fs::remove_file(&path)
        .await
        .map_err(|e| make_image_error(&e.to_string()))?;

    let path = format_path(&file_key);
    fs::remove_file(&path)
        .await
        .map_err(|e| make_image_error(&e.to_string()))?;

    Ok(Json(common::NoData {}))
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
