use crate::common;
use crate::db_structs::{store, tool};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub term: String,
    pub statuses: Vec<tool::Status>,
    pub store_ids: Vec<store::Id>,
    pub category_ids: Vec<i32>,
    pub match_all_categories: bool,
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
    rental_hours: tool::RentalHours,
    short_description: tool::ShortDescription,
    long_description: Option<tool::LongDescription>,
    status: tool::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<tool::Tool, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        INSERT INTO main.tools (real_id, store_id, rental_hours, short_description, long_description, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
        "#,
        real_id,
        store_id,
        rental_hours,
        short_description,
        long_description,
        status,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update(
    tool_id: tool::Id,
    real_id: Option<tool::RealId>,
    rental_hours: Option<tool::RentalHours>,
    short_description: Option<tool::ShortDescription>,
    long_description: Option<tool::LongDescription>,
    status: Option<tool::Status>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<tool::Tool>, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        UPDATE main.tools
        SET
            real_id = COALESCE($2, real_id),
            rental_hours = COALESCE($3, rental_hours),
            short_description = COALESCE($4, short_description),
            long_description = COALESCE($5, long_description),
            status = COALESCE($6, status)
        WHERE id = $1
        RETURNING *;
        "#,
        tool_id,
        real_id,
        rental_hours,
        short_description,
        long_description,
        status,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<tool::Tool>, String> {
    let mut min_category_matches = 0;
    if !params.match_all_categories {
        // counterintuitive, but makes the query work
        min_category_matches = i32::try_from(params.category_ids.len()).unwrap_or(1);
    }

    sqlx::query_as!(
        tool::Tool,
        r#"
        SELECT mt.*
        FROM main.tools mt
        LEFT JOIN main.tool_classifications tc ON mt.id = tc.tool_id
        WHERE
            ($1::text = '' OR $1::text <% (mt.real_id || ' ' || mt.short_description || ' ' || COALESCE(mt.long_description, '')))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR mt.status = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::integer[], 1) IS NULL OR mt.store_id = ANY($3::integer[]))
            AND (ARRAY_LENGTH($4::text[], 1) IS NULL OR mt.real_id = ANY($4::text[]))
            AND (ARRAY_LENGTH($5::integer[], 1) IS NULL OR tc.category_id = ANY($5::integer[]))
        GROUP BY mt.id having count(*) >= COALESCE(NULLIF(ARRAY_LENGTH($5::integer[], 1), $6), 1)
        ORDER BY mt.id 
        OFFSET $7 LIMIT $8;
        "#,
        params.term, // 1
        &params.statuses,
        &params.store_ids,
        &params.real_ids, // 4
        &params.category_ids,
        min_category_matches,
        params.offset,
        params.limit, // 8
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_ids(
    tool_ids: Vec<tool::Id>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<tool::Tool>, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        SELECT *
        FROM main.tools
        WHERE id = ANY($1::integer[]);
        "#,
        &tool_ids,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_exact_real(
    real_id: tool::RealId,
    status: tool::Status,
    store_id: store::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<tool::Tool>, String> {
    sqlx::query_as!(
        tool::Tool,
        r#"
        SELECT *
        FROM main.tools
        WHERE real_id = $1 AND status = $2 AND store_id = $3;
        "#,
        real_id,
        status,
        store_id,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}
