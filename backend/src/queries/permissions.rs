use crate::auth::claims::ClaimPermissions;
use crate::db_structs::library_permission;
use crate::db_structs::library_permission::LibraryPermission;
use crate::db_structs::user;
use crate::db_structs::vendor_permission;
use crate::db_structs::vendor_permission::VendorPermission;
use crate::queries::common;

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

pub async fn insert_library_permission(
    user_id: library_permission::UserId,
    role_id: library_permission::RoleId,
    status: library_permission::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<library_permission::Id, String> {
    sqlx::query!(
        r#"
        INSERT INTO main.library_permissions (user_id, role_id, status)
        VALUES ($1, $2, $3)
        RETURNING id;
        "#,
        user_id,
        role_id,
        status,
    )
    .fetch_one(db)
    .await
    .map(|row| row.id)
    .map_err(|e| e.to_string())
}

pub async fn insert_vendor_permission(
    user_id: vendor_permission::UserId,
    role_id: vendor_permission::RoleId,
    store_id: vendor_permission::StoreId,
    status: vendor_permission::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<vendor_permission::Id, String> {
    sqlx::query!(
        r#"
        INSERT INTO main.vendor_permissions (user_id, role_id, store_id, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        "#,
        user_id,
        role_id,
        store_id,
        status,
    )
    .fetch_one(db)
    .await
    .map(|row| row.id)
    .map_err(|e| e.to_string())
}

pub async fn update_library_permission_status(
    permission_id: library_permission::Id,
    status: library_permission::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.library_permissions
        SET status = $1
        WHERE id = $2;
        "#,
        status,
        permission_id,
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

pub async fn update_vendor_permission_status(
    permission_id: vendor_permission::Id,
    status: vendor_permission::Status,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.vendor_permissions
        SET status = $1
        WHERE id = $2;
        "#,
        status,
        permission_id,
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

pub async fn select_by_user(
    user_id: &user::Id,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<ClaimPermissions, String> {
    let vendor_query = sqlx::query_as!(
        VendorPermission,
        r#"
        SELECT *
        FROM main.vendor_permissions vp
        WHERE vp.user_id = $1;
        "#,
        user_id,
    )
    .fetch_all(db);

    let library_query = sqlx::query_as!(
        LibraryPermission,
        r#"
        SELECT *
        FROM main.library_permissions lp
        WHERE lp.user_id = $1;
        "#,
        user_id,
    )
    .fetch_all(db);

    let (vendor_permissions, library_permissions) =
        tokio::try_join!(vendor_query, library_query).map_err(|e| e.to_string())?;

    let permissions = ClaimPermissions {
        library: library_permissions.iter().map(|lp| lp.role_id).collect(),
        store: vendor_permissions
            .iter()
            .fold(Default::default(), |mut acc, vp| {
                acc.entry(vp.store_id)
                    .and_modify(|e| e.push(vp.role_id))
                    .or_insert(vec![vp.role_id]);
                acc
            }),
    };

    return Ok(permissions);
}
