use crate::common;
use crate::db_structs::{grievance, user};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GrievanceWithNames {
    pub id: grievance::Id,
    pub author: Option<common::UserWithName>,
    pub accused: Option<common::UserWithName>,
    pub title: grievance::Title,
    pub description: grievance::Description,
    pub created_at: grievance::CreatedAt,
    pub status: grievance::Status,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub author_ids: Vec<grievance::AuthorId>,
    pub accused_ids: Vec<grievance::AccusedId>,
    pub statuses: Vec<grievance::Status>,
    pub offset: i64,
    pub limit: i64,
}

pub async fn select_statuses(
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<common::Status>, String> {
    sqlx::query_as!(
        common::Status,
        r#"
        SELECT *
        FROM fixed.grievance_statuses gs;
        "#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    author_id: user::Id,
    accused_id: user::Id,
    title: grievance::Title,
    description: grievance::Description,
    status: grievance::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<grievance::Grievance, String> {
    sqlx::query_as!(
        grievance::Grievance,
        r#"
        INSERT INTO main.grievances (author_id, accused_id, title, description, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
        "#,
        author_id,
        accused_id,
        title,
        description,
        status,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update_status(
    grievance_id: grievance::Id,
    status: grievance::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<grievance::Grievance, String> {
    sqlx::query_as!(
        grievance::Grievance,
        r#"
        UPDATE main.grievances
        SET status = $2
        WHERE id = $1
        RETURNING *;
        "#,
        grievance_id,
        status,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<GrievanceWithNames>, String> {
    sqlx::query_as!(
        GrievanceWithNames,
        r#"
            SELECT 
                g.id,
                g.title,
                g.description,
                g.created_at,
                g.status,
                (u1.id, u1.username) as "author: common::UserWithName",
                (u2.id, u2.username) as "accused: common::UserWithName"
            FROM main.grievances g
            LEFT JOIN main.users u1 ON g.author_id = u1.id
            LEFT JOIN main.users u2 ON g.accused_id = u2.id
            WHERE
                (ARRAY_LENGTH($1::integer[], 1) IS NULL OR g.status = ANY($1::integer[]))
                AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR g.author_id = ANY($2::integer[]))
                AND (ARRAY_LENGTH($3::integer[], 1) IS NULL OR g.accused_id = ANY($3::integer[]))
            ORDER BY g.created_at DESC
            OFFSET $4 LIMIT $5;
            "#,
        &params.statuses,
        &params.author_ids,
        &params.accused_ids,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_id(
    grievance_id: grievance::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<GrievanceWithNames, String> {
    sqlx::query_as!(
        GrievanceWithNames,
        r#"
        SELECT 
            g.id,
            g.title,
            g.description,
            g.created_at,
            g.status,
            (u1.id, u1.username) as "author: common::UserWithName",
            (u2.id, u2.username) as "accused: common::UserWithName"
        FROM main.grievances g
        LEFT JOIN main.users u1 ON g.author_id = u1.id
        LEFT JOIN main.users u2 ON g.accused_id = u2.id
        WHERE g.id = $1;
        "#,
        grievance_id,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}
