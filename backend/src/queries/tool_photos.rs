use crate::db_structs::{tool_classification, tool_photo};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct InsertData {
    pub tool_id: Option<tool_photo::ToolId>,
    pub photo_key: tool_photo::PhotoKey,
    pub original_name: tool_photo::OriginalName,
}

pub async fn insert(data: Vec<InsertData>, db: &sqlx::Pool<sqlx::Postgres>) -> Result<(), String> {
    if data.is_empty() {
        return Ok(());
    }

    sqlx::query!(
        r#"
        INSERT INTO main.tool_photos (tool_id, photo_key, original_name)
        SELECT * FROM UNNEST($1::integer[], $2::text[], $3::text[]);
        "#,
        &data.iter().map(|d| d.tool_id).collect::<Vec<Option<i32>>>() as _,
        &data
            .iter()
            .map(|d| d.photo_key.clone())
            .collect::<Vec<String>>(),
        &data
            .iter()
            .map(|d| d.original_name.clone())
            .collect::<Vec<String>>(),
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

pub async fn update_tool_id(
    id: tool_photo::Id,
    tool_id: Option<tool_photo::ToolId>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query!(
        r#"
        UPDATE main.tool_photos tp
        SET tool_id = $2
        WHERE tp.id = $1;
        "#,
        id,
        tool_id,
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

pub async fn delete(
    ids: Vec<tool_photo::Id>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<u64, String> {
    if ids.is_empty() {
        return Ok(0);
    }

    match sqlx::query!(
        r#"
        DELETE FROM main.tool_photos tp
        WHERE tp.id = ANY($1::integer[]);
        "#,
        &ids,
    )
    .execute(db)
    .await
    {
        Ok(res) => Ok(res.rows_affected()),
        Err(e) => Err(e.to_string()),
    }
}

pub async fn select(
    ids: Vec<tool_photo::Id>,
    tool_ids: Vec<tool_classification::ToolId>,
    photo_keys: Vec<tool_photo::PhotoKey>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<tool_photo::ToolPhoto>, String> {
    sqlx::query_as!(
        tool_photo::ToolPhoto,
        r#"
        SELECT * FROM main.tool_photos tp
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) IS NULL OR tp.id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR tp.tool_id = ANY($2::integer[]))
            AND (ARRAY_LENGTH($3::text[], 1) IS NULL OR tp.photo_key = ANY($3::text[]))
        LIMIT 600;
        "#,
        &ids,
        &tool_ids,
        &photo_keys,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}
