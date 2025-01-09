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
            AND ($3::text = '' OR $3::text <% (ms.name || ' ' || COALESCE(ms.email_address, '') || ' ' || COALESCE(ms.phone_number, '')))
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

pub async fn insert(
    name: store::Name,
    status: store::Status,
    email_address: store::EmailAddress,
    phone_number: store::PhoneNumber,
    rental_information: store::RentalInformation,
    other_information: store::OtherInformation,
    code: store::Code,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<store::Store, String> {
    sqlx::query_as!(
        store::Store,
        r#"
        INSERT INTO main.stores (name, status, email_address, phone_number, rental_information, other_information, code)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
        "#,
        name,
        status,
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
            email_address = COALESCE($4, ms.email_address),
            phone_number = COALESCE($5, ms.phone_number),
            rental_information = COALESCE($6, ms.rental_information),
            other_information = COALESCE($7, ms.other_information)
        WHERE ms.id = $1
        RETURNING *;
        "#,
        store_id,
        name,
        status,
        email_address,
        phone_number,
        rental_information,
        other_information,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}
