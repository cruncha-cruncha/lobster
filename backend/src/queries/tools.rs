use crate::common;
use crate::db_structs::{store, tool};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub ids: Vec<tool::Id>,
    pub statuses: Vec<tool::Status>,
    pub store_ids: Vec<store::Id>,
    pub category_ids: Vec<i32>,
    pub real_ids: Vec<tool::RealId>,
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
        FROM fixed.tool_statuses ts;
        "#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    real_id: tool::RealId,
    store_id: store::Id,
    category_id: tool::CategoryId,
    default_rental_period: tool::DefaultRentalPeriod,
    description: tool::Description,
    pictures: tool::Pictures,
    status: tool::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<tool::Tool, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        INSERT INTO main.tools (real_id, store_id, category_id, default_rental_period, description, pictures, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        "#,
        real_id,
        store_id,
        category_id,
        default_rental_period,
        description,
        &pictures,
        status,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update(
    tool_id: tool::Id,
    real_id: Option<tool::RealId>,
    store_id: Option<tool::StoreId>,
    category_id: Option<tool::CategoryId>,
    default_rental_period: Option<tool::DefaultRentalPeriod>,
    description: Option<tool::Description>,
    pictures: Option<tool::Pictures>,
    status: Option<tool::Status>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<tool::Tool, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        UPDATE main.tools
        SET real_id = COALESCE($2, real_id), store_id = COALESCE($3, store_id), category_id = COALESCE($4, category_id), default_rental_period = COALESCE($5, default_rental_period), description = COALESCE($6, description), pictures = COALESCE($7, pictures), status = COALESCE($8, status)
        WHERE id = $1
        RETURNING *;
        "#,
        tool_id,
        real_id,
        store_id,
        category_id,
        default_rental_period,
        description,
        pictures.as_deref(),
        status,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn clear_fields(
    tool_id: tool::Id,
    real_id: bool,
    category_id: bool,
    default_rental_period: bool,
    description: bool,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<tool::Tool, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        UPDATE main.tools mt
        SET 
            real_id = CASE WHEN $2 THEN NULL ELSE mt.real_id END,
            category_id = CASE WHEN $3 THEN NULL ELSE mt.category_id END,
            default_rental_period = CASE WHEN $4 THEN NULL ELSE mt.default_rental_period END,
            description = CASE WHEN $5 THEN NULL ELSE mt.description END
        WHERE id = $1
        RETURNING *;
        "#,
        tool_id,
        real_id,
        category_id,
        default_rental_period,
        description,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<tool::Tool>, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        SELECT *
        FROM main.tools mt
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) = 0 OR mt.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) = 0 OR mt.status = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::integer[], 1) = 0 OR mt.store_id = ANY($3::integer[]))
            AND (ARRAY_LENGTH($4::integer[], 1) = 0 OR mt.category_id = ANY($4::integer[]))
            AND (ARRAY_LENGTH($5::text[], 1) = 0 OR mt.real_id = ANY($5::text[]))
        ORDER BY mt.id
        OFFSET $6 LIMIT $7;
        "#,
        &params.ids,
        &params.statuses,
        &params.store_ids,
        &params.category_ids,
        &params.real_ids,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}
