use crate::auth::encryption::encode_plain_email;
use crate::db_structs::{permission, store, user};
use crate::queries::common;
use serde::{Deserialize, Serialize};
use std::vec;

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub ids: Vec<user::Id>,
    pub statuses: Vec<user::Status>,
    pub usernames: Vec<String>,
    pub emails: Vec<String>,
    pub created_at: common::DateBetween,
    pub offset: i64,
    pub limit: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreUser {
    pub user: user::Id,
    pub permissions: Vec<permission::RoleId>,
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
        SELECT *
        FROM main.users usr
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) IS NULL OR usr.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR usr.status = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::bytea[], 1) IS NULL OR usr.email = ANY($3::bytea[]))
            AND (COALESCE($4, '1970-01-01 00:00:00+00'::timestamp with time zone) <= usr.created_at AND usr.created_at < COALESCE($5, '9999-12-31 23:59:59+00'::timestamp with time zone))
        ORDER BY usr.created_at DESC
        OFFSET $6 LIMIT $7;
        "#,
        &params.ids,
        &params.statuses,
        &emails,
        params.created_at.start,
        params.created_at.end,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn count(params: SelectParams, db: &sqlx::Pool<sqlx::Postgres>) -> Result<i64, String> {
    let emails = params
        .emails
        .iter()
        .map(|x| encode_plain_email(x).unwrap_or_default())
        .collect::<Vec<Vec<u8>>>();

    sqlx::query!(
        r#"
        SELECT COUNT(*) as count
        FROM main.users usr
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) = 0 OR usr.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) = 0 OR usr.status = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::bytea[], 1) = 0 OR usr.email = ANY($3::bytea[]))
            AND (COALESCE($4, '1970-01-01 00:00:00+00'::timestamp with time zone) <= usr.created_at AND usr.created_at < COALESCE($5, '9999-12-31 23:59:59+00'::timestamp with time zone))
        OFFSET $6 LIMIT $7;
        "#,
        &params.ids,
        &params.statuses,
        &emails,
        params.created_at.start,
        params.created_at.end,
        params.offset,
        params.limit,
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
    match select(
        SelectParams {
            ids: vec![],
            statuses: vec![],
            usernames: vec![],
            emails: vec![String::from(email)],
            created_at: common::DateBetween {
                start: None,
                end: None,
            },
            offset: 0,
            limit: 1,
        },
        db,
    )
    .await
    {
        Ok(mut users) => {
            if users.len() == 0 {
                Ok(None)
            } else {
                Ok(Some(users.remove(0)))
            }
        }
        Err(e) => Err(e),
    }
}

pub async fn select_by_id(
    id: user::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<user::User>, String> {
    match select(
        SelectParams {
            ids: vec![id],
            statuses: vec![],
            usernames: vec![],
            emails: vec![],
            created_at: common::DateBetween {
                start: None,
                end: None,
            },
            offset: 0,
            limit: 1,
        },
        db,
    )
    .await
    {
        Ok(mut users) => {
            if users.len() == 0 {
                Ok(None)
            } else {
                Ok(Some(users.remove(0)))
            }
        }
        Err(e) => Err(e),
    }
}

pub async fn select_by_store(
    store_id: store::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<StoreUser>, String> {
    sqlx::query_as!(
        StoreUser,
        r#"
        SELECT
            mu.id as user,
            ARRAY_AGG(p.role_id) as "permissions!: _"
        FROM main.users mu
        JOIN main.permissions p ON mu.id = p.user_id
        WHERE p.store_id = $1
        GROUP BY mu.id;
        "#,
        store_id,
    )
    .fetch_all(db)
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
