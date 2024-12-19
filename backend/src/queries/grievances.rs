use crate::common;
use crate::db_structs::{grievance, user};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
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
    pub ids: Vec<grievance::Id>,
    pub statuses: Vec<grievance::Status>,
    pub author_ids: Vec<user::Id>,
    pub accused_ids: Vec<user::Id>,
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
) -> Result<grievance::Id, String> {
    sqlx::query!(
        r#"
        INSERT INTO main.grievances (author_id, accused_id, title, description, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
        "#,
        author_id,
        accused_id,
        title,
        description,
        status,
    )
    .fetch_one(db)
    .await
    .map(|row| row.id)
    .map_err(|e| e.to_string())
}

pub async fn update_status(
    grievance_id: grievance::Id,
    status: grievance::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.grievances
        SET status = $2
        WHERE id = $1;
        "#,
        grievance_id,
        status,
    )
    .execute(db)
    .await
    .map(|_| ())
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
                (ARRAY_LENGTH($1::integer[], 1) = 0 OR g.id = ANY($1::integer[]))
                AND (ARRAY_LENGTH($2::integer[], 1) = 0 OR g.status = ANY($2::integer[]))
                AND (ARRAY_LENGTH($3::integer[], 1) = 0 OR g.author_id = ANY($3::integer[]))
                AND (ARRAY_LENGTH($4::integer[], 1) = 0 OR g.accused_id = ANY($4::integer[]))
            ORDER BY g.created_at DESC
            OFFSET $5 LIMIT $6;
            "#,
        &params.ids,
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
