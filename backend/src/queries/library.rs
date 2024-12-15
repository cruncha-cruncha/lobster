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
    .fetch_optional(db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err(e.to_string()),
    };

    if info.is_none() {
        return Err(String::from("no library information"));
    }

    Ok(info.unwrap())
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
