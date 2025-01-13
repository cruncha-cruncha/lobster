use crate::common;
use crate::db_structs::store;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub ids: Vec<store::Id>,
    pub statuses: Vec<store::Status>,
    pub term: String,
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
            (ARRAY_LENGTH($1::integer[], 1) IS NULL OR ms.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR ms.status = ANY($2::integer[]))
            AND ($3::text = '' OR $3::text <% (ms.name || ' ' || ms.location || ' ' || COALESCE(ms.email_address, '') || ' ' || ms.phone_number))
        ORDER BY ms.id
        OFFSET $4 LIMIT $5;
        "#,
        &params.ids,
        &params.statuses,
        params.term,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_code(
    code: store::Code,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<store::Store, String> {
    sqlx::query_as!(
        store::Store,
        r#"
        SELECT *
        FROM main.stores ms
        WHERE ms.code = $1;
        "#,
        code,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    name: store::Name,
    status: store::Status,
    location: store::Location,
    email_address: Option<store::EmailAddress>,
    phone_number: store::PhoneNumber,
    rental_information: Option<store::RentalInformation>,
    other_information: Option<store::OtherInformation>,
    code: store::Code,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<store::Store, String> {
    sqlx::query_as!(
        store::Store,
        r#"
        INSERT INTO main.stores (name, status, location, email_address, phone_number, rental_information, other_information, code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
        "#,
        name,
        status,
        location,
        email_address,
        phone_number,
        rental_information,
        other_information,
        code,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update(
    store_id: store::Id,
    name: Option<store::Name>,
    status: Option<store::Status>,
    location: Option<store::Location>,
    email_address: Option<store::EmailAddress>,
    phone_number: Option<store::PhoneNumber>,
    rental_information: Option<store::RentalInformation>,
    other_information: Option<store::OtherInformation>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<store::Store, String> {
    sqlx::query_as!(
        store::Store,
        r#"
        UPDATE main.stores ms
        SET
            name = COALESCE($2, ms.name),
            status = COALESCE($3, ms.status),
            location = COALESCE($4, ms.location),
            email_address = COALESCE($5, ms.email_address),
            phone_number = COALESCE($6, ms.phone_number),
            rental_information = COALESCE($7, ms.rental_information),
            other_information = COALESCE($8, ms.other_information)
        WHERE ms.id = $1
        RETURNING *;
        "#,
        store_id,
        name,
        status,
        location,
        email_address,
        phone_number,
        rental_information,
        other_information,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}
