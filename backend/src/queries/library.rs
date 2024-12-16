use super::common;
use crate::db_structs::library_information::LibraryInformation;

pub async fn select_roles(db: &sqlx::Pool<sqlx::Postgres>) -> Result<Vec<common::Status>, String> {
    sqlx::query_as!(
        common::Status,
        r#"
        SELECT *
        FROM fixed.roles r;
        "#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_information(
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<LibraryInformation, String> {
    let info = match sqlx::query_as!(
        LibraryInformation,
        r#"
        SELECT *
        FROM main.library_information li
        LIMIT 1;
        "#,
    )
    .fetch_one(db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err(e.to_string()),
    };

    Ok(info)
}

pub async fn update_information(
    name: Option<String>,
    maximum_rental_period: Option<i32>,
    maximum_future: Option<i32>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.library_information li
        SET
            name = COALESCE($1, li.name),
            maximum_rental_period = COALESCE($2, li.maximum_rental_period),
            maximum_future = COALESCE($3, li.maximum_future);
        "#,
        name,
        maximum_rental_period,
        maximum_future,
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

pub async fn insert_information(
    name: &str,
    salt: &[u8; 32],
    maximum_rental_period: i32,
    maximum_future: i32,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        INSERT INTO main.library_information (name, salt, maximum_rental_period, maximum_future)
        VALUES ($1, $2, $3, $4);
        "#,
        name,
        salt,
        maximum_rental_period,
        maximum_future,
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}
