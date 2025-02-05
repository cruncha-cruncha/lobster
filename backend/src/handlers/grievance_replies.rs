use crate::auth::claims::Claims;
use crate::common;
use crate::db_structs::{grievance, grievance_reply};
use crate::queries::{grievance_replies, grievances, users};
use crate::AppState;
use axum::extract::{Path, Query};
use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectParams {
    pub order_asc: Option<bool>,
    pub page: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGrievanceReplyData {
    pub text: grievance_reply::Text,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrievanceReplyResponse {
    pub grievance_replies: Vec<grievance_replies::GrievanceReplyWithNames>,
}

pub async fn create_new(
    claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateGrievanceReplyData>,
) -> Result<Json<grievance_replies::GrievanceReplyWithNames>, common::ErrResponse> {
    let author_id = match claims.subject_as_user_id() {
        Some(id) => id,
        None => {
            return Err(common::ErrResponse::new(
                StatusCode::UNAUTHORIZED,
                "ERR_AUTH",
                "Invalid user id in claims",
            ))
        }
    };

    let mut allowed = claims.is_user_admin();
    if !allowed {
        let grievance = match grievances::select_by_id(grievance_id, &state.db).await {
            Ok(grievance) => {
                if let Some(grievance) = grievance {
                    grievance
                } else {
                    return Err(common::ErrResponse::new(
                        StatusCode::NOT_FOUND,
                        "ERR_MIA",
                        "Grievance not found",
                    ));
                }
            }
            Err(e) => {
                return Err(common::ErrResponse::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "ERR_DB",
                    &e,
                ))
            }
        };

        allowed = grievance.author.map_or(0, |a| a.id) == author_id
            || grievance.accused.map_or(0, |a| a.id) == author_id;
    }
    if !allowed {
        return Err(common::ErrResponse::new(
            StatusCode::FORBIDDEN,
            "ERR_AUTH",
            "User is not author, accused, or user admin",
        ));
    }

    let user = match users::select_by_ids(vec![author_id], &state.db).await {
        Ok(mut u) => {
            if u.is_empty() {
                return Err(common::ErrResponse::new(
                    StatusCode::NOT_FOUND,
                    "ERR_MIA",
                    "Author not found",
                ));
            }
            u.remove(0)
        }
        Err(e) => {
            return Err(common::ErrResponse::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "ERR_DB",
                &e,
            ))
        }
    };

    let new_reply =
        match grievance_replies::insert(grievance_id, author_id, payload.text, &state.db).await {
            Ok(gr) => gr,
            Err(e) => {
                return Err(common::ErrResponse::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "ERR_DB",
                    &e,
                ));
            }
        };

    let reply = grievance_replies::GrievanceReplyWithNames {
        id: new_reply.id,
        grievance_id: new_reply.grievance_id,
        author: Some(common::UserWithName {
            id: new_reply.author_id,
            username: user.username,
        }),
        text: new_reply.text,
        created_at: new_reply.created_at,
    };

    Ok(Json(reply))
}

pub async fn get_by_grievance_id(
    claims: Claims,
    Path(grievance_id): Path<grievance::Id>,
    Query(params): Query<SelectParams>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<GrievanceReplyResponse>, common::ErrResponse> {
    if claims.is_none() {
        return Err(common::ErrResponse::new(
            StatusCode::UNAUTHORIZED,
            "ERR_AUTH",
            "User is not logged in",
        ));
    }

    let (mut offset, mut limit) = common::calculate_offset_limit(params.page.unwrap_or_default());
    if params.page.is_none() {
        offset = 0;
        limit = 1000;
    }

    match grievance_replies::select(
        grievance_replies::SelectParams {
            grievance_id,
            order_asc: params.order_asc.unwrap_or_default(),
            offset,
            limit,
        },
        &state.db,
    )
    .await
    {
        Ok(grievance_replies) => Ok(Json(GrievanceReplyResponse { grievance_replies })),
        Err(e) => Err(common::ErrResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "ERR_DB",
            &e,
        )),
    }
}
