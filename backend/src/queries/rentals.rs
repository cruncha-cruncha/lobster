use crate::common;
use crate::db_structs::rental;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub ids: Vec<rental::Id>,
    pub renter_ids: Vec<rental::RenterId>,
    pub tool_ids: Vec<rental::ToolId>,
    pub start_date: common::DateBetween,
    pub end_date: common::DateBetween,
    pub order_by: Option<OrderBy>,
    pub offset: i64,
    pub limit: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
pub enum OrderBy {
    StartDate = 1,
    EndDate = 2,
}

pub async fn insert(
    tool_id: rental::ToolId,
    renter_id: rental::RenterId,
    start_date: rental::StartDate,
    end_date: Option<rental::EndDate>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<rental::Rental, String> {
    sqlx::query_as!(
        rental::Rental,
        r#"
        INSERT INTO main.rentals (tool_id, renter_id, start_date, end_date)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        "#,
        tool_id,
        renter_id,
        start_date,
        end_date
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update(
    id: rental::Id,
    start_date: Option<rental::StartDate>,
    end_date: Option<rental::EndDate>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<rental::Rental, String> {
    sqlx::query_as!(
        rental::Rental,
        r#"
        UPDATE main.rentals mr
        SET
            start_date = COALESCE($2, mr.start_date),
            end_date = COALESCE($3, mr.end_date)
        WHERE id = $1
        RETURNING *;
        "#,
        id,
        start_date,
        end_date,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn clear_fields(
    id: rental::Id,
    end_date: bool,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<rental::Rental, String> {
    sqlx::query_as!(
        rental::Rental,
        r#"
        UPDATE main.rentals mr
        SET
            end_date = CASE WHEN $2 THEN NULL ELSE mr.end_date END
        WHERE id = $1
        RETURNING *;
        "#,
        id,
        end_date,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<rental::Rental>, String> {
    sqlx::query_as!(
        rental::Rental,
        r#"
        SELECT *
        FROM main.rentals mr
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) IS NULL OR mr.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR mr.renter_id = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::integer[], 1) IS NULL OR mr.tool_id = ANY($3::integer[]))
            AND (COALESCE($4, '1970-01-01 00:00:00+00'::timestamp with time zone) <= mr.start_date AND mr.start_date < COALESCE($5, '9999-12-31 23:59:59+00'::timestamp with time zone))
            AND (COALESCE($6, '1970-01-01 00:00:00+00'::timestamp with time zone) <= mr.end_date AND mr.end_date < COALESCE($7, '9999-12-31 23:59:59+00'::timestamp with time zone))
        ORDER BY COALESCE(
            CASE $8::integer
                WHEN 1 THEN mr.start_date
                WHEN 2 THEN mr.end_date
            END,
            mr.start_date
        ) DESC, mr.id
        OFFSET $9 LIMIT $10;
        "#,
        &params.ids,
        &params.renter_ids,
        &params.tool_ids,
        params.start_date.start,
        params.start_date.end,
        params.end_date.start,
        params.end_date.end,
        params.order_by.map(|x| x as i32),
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}
