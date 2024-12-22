use crate::common;
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
) -> Result<Option<LibraryInformation>, String> {
    let info = match sqlx::query_as!(
        LibraryInformation,
        r#"
        SELECT *
        FROM main.library_information li
        LIMIT 1;
        "#,
    )
    .fetch_optional(db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err(e.to_string()),
    };

    Ok(info)
}

pub async fn update_information(
    name: Option<String>,
    max_rental_period: Option<i32>,
    max_future: Option<i32>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<LibraryInformation, String> {
    sqlx::query_as!(
        LibraryInformation,
        r#"
        UPDATE main.library_information li
        SET
            name = COALESCE($1, li.name),
            maximum_rental_period = COALESCE($2, li.maximum_rental_period),
            maximum_future = COALESCE($3, li.maximum_future)
        RETURNING *;
        "#,
        name,
        max_rental_period,
        max_future,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert_information(
    name: &str,
    max_rental_period: i32,
    max_future: i32,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<LibraryInformation, String> {
    sqlx::query_as!(
        LibraryInformation,
        r#"
        INSERT INTO main.library_information (name, maximum_rental_period, maximum_future)
        VALUES ($1, $2, $3)
        RETURNING *;
        "#,
        name,
        max_rental_period,
        max_future,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}
