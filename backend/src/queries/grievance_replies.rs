use crate::{common, db_structs::grievance_reply};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub grievance_id: grievance_reply::GrievanceId,
    pub order_asc: bool,
    pub offset: i64,
    pub limit: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GrievanceReplyWithNames {
    pub id: grievance_reply::Id,
    pub grievance_id: grievance_reply::GrievanceId,
    pub author: Option<common::UserWithName>,
    pub text: grievance_reply::Text,
    pub created_at: grievance_reply::CreatedAt,
}

pub async fn insert(
    grievance_id: grievance_reply::GrievanceId,
    author_id: grievance_reply::AuthorId,
    text: grievance_reply::Text,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<grievance_reply::GrievanceReply, String> {
    sqlx::query_as!(
        grievance_reply::GrievanceReply,
        r#"
        INSERT INTO main.grievance_replies (grievance_id, author_id, text)
        VALUES ($1, $2, $3)
        RETURNING *;
        "#,
        grievance_id,
        author_id,
        text,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<GrievanceReplyWithNames>, String> {
    sqlx::query_as!(
        GrievanceReplyWithNames,
        r#"
        SELECT
            gr.id,
            gr.grievance_id,
            gr.text,
            gr.created_at,
            (u.id, u.username) as "author: common::UserWithName"
        FROM main.grievance_replies gr
        LEFT JOIN main.users u ON gr.author_id = u.id
        WHERE gr.grievance_id = $1
        ORDER BY (CASE $2::bool WHEN TRUE THEN gr.created_at WHEN FALSE THEN NULL END) ASC, (CASE $2::bool WHEN TRUE THEN NULL WHEN FALSE THEN gr.created_at END) DESC, gr.id
        OFFSET $3 LIMIT $4;
        "#,
        params.grievance_id,
        params.order_asc,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}
