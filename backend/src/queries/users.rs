use crate::auth::encryption::encode_plain_email;
use crate::common;
use crate::db_structs::{permission, store, user};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub usernames: Vec<String>,
    pub emails: Vec<String>,
    pub store_ids: Vec<store::Id>,
    pub statuses: Vec<user::Status>,
    pub roles: Vec<permission::RoleId>,
    pub created_at: common::DateBetween,
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
        FROM fixed.user_statuses us;
        "#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<user::User>, String> {
    let emails = params
        .emails
        .iter()
        .map(|x| encode_plain_email(x).unwrap_or_default())
        .collect::<Vec<Vec<u8>>>();

    sqlx::query_as!(
        user::User,
        r#"
        SELECT usr.*
        FROM main.users usr
        LEFT JOIN main.permissions p ON usr.id = p.user_id
        WHERE
            (ARRAY_LENGTH($1::text[], 1) IS NULL OR usr.username = ANY($1::text[]))
            AND (ARRAY_LENGTH($2::bytea[], 1) IS NULL OR usr.email = ANY($2::bytea[]))
            AND (ARRAY_LENGTH($3::integer[], 1) IS NULL OR p.store_id = ANY($3::integer[]))
            AND (ARRAY_LENGTH($4::integer[], 1) IS NULL OR p.role_id = ANY($4::integer[]))
            AND (ARRAY_LENGTH($5::integer[], 1) IS NULL OR usr.status = ANY($5::integer[]))
            AND (COALESCE($6, '1970-01-01 00:00:00+00'::timestamp with time zone) <= usr.created_at AND usr.created_at < COALESCE($7, '9999-12-31 23:59:59+00'::timestamp with time zone))
        GROUP BY usr.id
        ORDER BY usr.created_at DESC
        OFFSET $8 LIMIT $9;
        "#,
        &params.usernames,
        &emails,
        &params.store_ids,
        &params.roles,
        &params.statuses,
        params.created_at.start,
        params.created_at.end,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn count(db: &sqlx::Pool<sqlx::Postgres>) -> Result<i64, String> {
    sqlx::query!(
        r#"
        SELECT COUNT(*) as count
        FROM main.users usr;
        "#,
    )
    .fetch_one(db)
    .await
    .map(|row| row.count.unwrap_or(0))
    .map_err(|e| e.to_string())
}

pub async fn select_by_email(
    email: &str,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<user::User>, String> {
    let encoded = encode_plain_email(email).ok_or("Failed to encode email")?;

    sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users mu
        WHERE mu.email = $1
        "#,
        encoded,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_id(
    id: user::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<user::User>, String> {
    sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users mu
        WHERE mu.id = $1
        "#,
        id,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    username: &str,
    status: i32,
    email: &str,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<user::Id, String> {
    let email = encode_plain_email(email).ok_or("Failed to encode email")?;

    sqlx::query!(
        r#"
        INSERT INTO main.users (username, status, email)
        VALUES ($1, $2, $3)
        RETURNING id;
        "#,
        username,
        status,
        &email,
    )
    .fetch_one(db)
    .await
    .map(|row| row.id)
    .map_err(|e| e.to_string())
}

pub async fn update(
    id: user::Id,
    username: Option<&str>,
    status: Option<i32>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.users usr
        SET username = COALESCE($1, usr.username), status = COALESCE($2, usr.status)
        WHERE id = $3;
        "#,
        username,
        status,
        id,
    )
    .execute(db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
