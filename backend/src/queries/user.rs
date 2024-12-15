use super::library::select_information;
use crate::auth::encryption::hash_email;
use crate::db_structs::{store, user, vendor_permission};
use crate::queries::common;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreUser {
    pub user: user::Id,
    pub permissions: Vec<vendor_permission::RoleId>,
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
    user_id: &user::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<user::User, String> {
    sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users usr
        WHERE usr.id = $1;
        "#,
        &user_id,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_email(
    plain_email: &str,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<user::User, String> {
    let library_information = select_information(db).await?;

    let email = hash_email(&plain_email, &library_information.salt);

    let user = match sqlx::query_as!(
        user::User,
        r#"
        SELECT *
        FROM main.users usr
        WHERE email = $1;
        "#,
        &email,
    )
    .fetch_one(db)
    .await
    {
        Ok(row) => row,
        Err(e) => return Err(e.to_string()),
    };

    Ok(user)
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
            ARRAY_AGG(vp.role_id) as "permissions!: _"
        FROM main.users mu
        JOIN main.vendor_permissions vp ON mu.id = vp.user_id
        WHERE vp.store_id = $1
        GROUP BY mu.id;
        "#,
        store_id,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}
