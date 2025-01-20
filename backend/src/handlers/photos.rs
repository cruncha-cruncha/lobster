use crate::AppState;
use crate::{auth::claims::Claims, common};
use axum::extract::Path;
use axum::response::{IntoResponse, Response};
use axum::{
    extract::{Json, State},
    http::header,
    http::StatusCode,
};
use axum_extra::extract::Multipart;
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
    format!("./home/photos/{}.jpg", file_key)
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

    let mut data = None;
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        if name != "file" {
            continue;
        }

        data = Some(field.bytes().await.unwrap_or_default());
        break;
    }

    if data.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::BAD_REQUEST,
            "ERR_BAD_REQUEST",
            "No files found",
        ));
    }

    let data = data.unwrap();

    let new_file_key = Uuid::new_v4();
    let path = format_path(&new_file_key.to_string());
    println!("Writing to: {}", path);
    match fs::write(path, &data).await {
        Ok(_) => {}
        Err(e) => {
            eprintln!("Failed to write file: {}", e);
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_INTERNAL",
                "Failed to write file",
            ));
        }
    };

    Ok(Json(UploadResponseData {
        key: new_file_key.to_string(),
    }))
}

pub async fn delete(
    claims: Claims,
    Path(file_key): Path<String>,
    State(state): State<Arc<AppState>>,
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
    State(state): State<Arc<AppState>>,
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

    let attachment_header = format!("attachment; filename=\"{}.jpg\"", file_key);
    let headers = [
        (header::CONTENT_TYPE, "image/jpeg"),
        (header::CONTENT_DISPOSITION, attachment_header.as_str()),
    ];

    Ok((headers, data).into_response())
}
