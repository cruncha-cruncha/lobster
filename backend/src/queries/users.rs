use crate::auth::encryption;
use crate::common;
use crate::db_structs::{permission, store, user};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub term: String,
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
    sqlx::query_as!(
        user::User,
        r#"
        SELECT usr.id, usr.username, usr.status, '' AS "email_address!: _", usr.created_at, '' AS "code!: _", usr.password, usr.salt
        FROM main.users usr
        LEFT JOIN main.permissions p ON usr.id = p.user_id AND p.status = 1
        WHERE
            ($1::text = '' OR $1::text <% usr.username)
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR p.store_id = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::integer[], 1) IS NULL OR p.role_id = ANY($3::integer[]))
            AND (ARRAY_LENGTH($4::integer[], 1) IS NULL OR usr.status = ANY($4::integer[]))
            AND (COALESCE($5, '1970-01-01 00:00:00+00'::timestamp with time zone) <= usr.created_at AND usr.created_at < COALESCE($6, '9999-12-31 23:59:59+00'::timestamp with time zone))
        GROUP BY usr.id
        ORDER BY usr.username
        OFFSET $7 LIMIT $8;          
        "#,
        params.term,
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

pub async fn select_with_email(
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<user::User>, String> {
    sqlx::query_as!(
        user::User,
        r#"
        SELECT usr.id, usr.username, usr.status, usr.email_address, usr.created_at, '' AS "code!: _", usr.password, usr.salt
        FROM main.users usr
        LEFT JOIN main.permissions p ON usr.id = p.user_id AND p.status = 1
        WHERE
            ($1::text = '' OR $1::text <% (usr.username || ' ' || usr.email_address))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR p.store_id = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::integer[], 1) IS NULL OR p.role_id = ANY($3::integer[]))
            AND (ARRAY_LENGTH($4::integer[], 1) IS NULL OR usr.status = ANY($4::integer[]))
            AND (COALESCE($5, '1970-01-01 00:00:00+00'::timestamp with time zone) <= usr.created_at AND usr.created_at < COALESCE($6, '9999-12-31 23:59:59+00'::timestamp with time zone))
        GROUP BY usr.id
        ORDER BY usr.username
        OFFSET $7 LIMIT $8;          
        "#,
        params.term,
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

pub async fn count(limit: i64, db: &sqlx::Pool<sqlx::Postgres>) -> Result<i64, String> {
    sqlx::query!(
        r#"
        SELECT COUNT(*) as count
        FROM main.users usr
        LIMIT $1;
        "#,
        limit,
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
    sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users mu
        WHERE mu.email_address = $1
        "#,
        email,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_ids(
    ids: Vec<user::Id>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<user::User>, String> {
    sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users mu
        WHERE mu.id = ANY($1::integer[])
        "#,
        &ids,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_code(
    code: user::Code,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<user::User>, String> {
    sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users mu
        WHERE mu.code = $1
        "#,
        code,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    username: &str,
    status: i32,
    email: &str,
    password: &str,
    code: &str,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<user::User, String> {
    let salt = encryption::generate_salt();
    let hashed_password = encryption::hash_password(password, &salt);

    sqlx::query_as!(
        user::User,
        r#"
        INSERT INTO main.users (username, status, email_address, salt, password, code)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
        "#,
        username,
        status,
        email,
        &salt,
        &hashed_password,
        code,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update(
    id: user::Id,
    username: Option<&str>,
    password: Option<&str>,
    status: Option<i32>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Option<user::User>, String> {
    let mut hashed_password = None;

    if password.is_some() {
        let mut existing_users = select_by_ids(vec![id], db).await?;
        if existing_users.is_empty() {
            return Ok(None);
        }

        let password = password.unwrap();
        let existing_user = existing_users.remove(0);
        hashed_password = Some(encryption::hash_password(&password, &existing_user.salt).to_vec());
    }

    sqlx::query_as!(
        user::User,
        r#"
        UPDATE main.users usr
        SET username = COALESCE(NULLIF($1, ''), usr.username), status = COALESCE($2, usr.status), password = COALESCE($3, usr.password)
        WHERE id = $4
        RETURNING *;
        "#,
        username,
        status,
        hashed_password.as_deref(),
        id,
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())
}
