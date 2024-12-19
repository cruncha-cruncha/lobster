use crate::db_structs::store;
use crate::common;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub ids: Vec<store::Id>,
    pub statuses: Vec<store::Status>,
    pub names: Vec<store::Name>,
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
        FROM fixed.store_statuses ss;
        "#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<store::Store>, String> {
    sqlx::query_as!(
        store::Store,
        r#"
        SELECT *
        FROM main.stores ms
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) = 0 OR ms.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) = 0 OR ms.status = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::text[], 1) = 0 OR ms.name = ANY($3::text[]))
        ORDER BY ms.id
        OFFSET $4 LIMIT $5;
        "#,
        &params.ids,
        &params.statuses,
        &params.names,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    name: store::Name,
    status: store::Status,
    location: store::Location,
    hours: store::Hours,
    description: store::Description,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<store::Id, String> {
    sqlx::query!(
        r#"
        INSERT INTO main.stores (name, status, location, hours, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
        "#,
        name,
        status,
        location,
        hours,
        description,
    )
    .fetch_one(db)
    .await
    .map(|row| row.id)
    .map_err(|e| e.to_string())
}

pub async fn update(
    store_id: store::Id,
    name: Option<store::Name>,
    status: Option<store::Status>,
    location: Option<store::Location>,
    hours: Option<store::Hours>,
    description: Option<store::Description>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.stores ms
        SET name = COALESCE($2, ms.name), status = COALESCE($3, ms.status), location = COALESCE($4, ms.location), hours = COALESCE($5, ms.hours), description = COALESCE($6, ms.description)
        WHERE ms.id = $1
        "#,
        store_id,
        name,
        status,
        location,
        hours,
        description,
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}
