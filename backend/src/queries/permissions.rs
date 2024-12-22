use crate::auth::claims::ClaimPermissions;
use crate::common;
use crate::db_structs::permission;
use crate::db_structs::user;

pub async fn select_statuses(
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<common::Status>, String> {
    sqlx::query_as!(
        common::Status,
        r#"
        SELECT *
        FROM fixed.permission_statuses ps;
        "#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn insert(
    user_id: permission::UserId,
    role_id: permission::RoleId,
    store_id: Option<permission::StoreId>,
    status: permission::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<permission::Permission, String> {
    sqlx::query_as!(
        permission::Permission,
        r#"
        INSERT INTO main.permissions (user_id, role_id, store_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        "#,
        user_id,
        role_id,
        store_id,
        status,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update_status(
    permission_id: permission::Id,
    status: permission::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<permission::Permission, String> {
    sqlx::query_as!(
        permission::Permission,
        r#"
        UPDATE main.permissions
        SET status = $1
        WHERE id = $2
        RETURNING *;
        "#,
        status,
        permission_id,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select_by_user(
    user_id: &user::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<ClaimPermissions, String> {
    let permissions = match sqlx::query_as!(
        permission::Permission,
        r#"
        SELECT *
        FROM main.permissions p
        WHERE p.user_id = $1;
        "#,
        user_id,
    )
    .fetch_all(db)
    .await
    {
        Ok(permissions) => permissions,
        Err(e) => return Err(e.to_string()),
    };

    let permissions = ClaimPermissions {
        library: permissions
            .iter()
            .filter(|p| p.store_id.is_none())
            .map(|lp| lp.role_id)
            .collect(),
        store: permissions.iter().filter(|p| p.store_id.is_some()).fold(
            Default::default(),
            |mut acc, vp| {
                acc.entry(vp.store_id.unwrap())
                    .and_modify(|e| e.push(vp.role_id))
                    .or_insert(vec![vp.role_id]);
                acc
            },
        ),
    };

    return Ok(permissions);
}
