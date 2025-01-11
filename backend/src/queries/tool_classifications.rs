use crate::db_structs::tool_classification;

pub async fn insert(
    data: Vec<tool_classification::ToolClassification>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    if data.is_empty() {
        return Ok(());
    }

    sqlx::query!(
        r#"
        INSERT INTO main.tool_classifications (tool_id, category_id)
        SELECT * FROM UNNEST($1::integer[], $2::integer[]);
        "#,
        &data.iter().map(|d| d.tool_id).collect::<Vec<i32>>(),
        &data.iter().map(|d| d.category_id).collect::<Vec<i32>>(),
    )
    .execute(db)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

pub async fn delete (
    data: Vec<tool_classification::ToolClassification>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<(), String> {
    if data.is_empty() {
        return Ok(());
    }
    
    match sqlx::query!(
        r#"
        DELETE FROM main.tool_classifications tc
        USING UNNEST($1::integer[], $2::integer[]) AS t(tool_id, category_id)
        WHERE tc.tool_id = t.tool_id AND tc.category_id = t.category_id;
        "#,
        &data.iter().map(|d| d.tool_id).collect::<Vec<i32>>(),
        &data.iter().map(|d| d.category_id).collect::<Vec<i32>>(),
    )
    .execute(db)
    .await {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err("No rows affected".to_string());
            }
            Ok(())
        },
        Err(e) => Err(e.to_string()),
    }
}

pub async fn select (
    tool_ids: Vec<tool_classification::ToolId>,
    category_ids: Vec<tool_classification::CategoryId>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<tool_classification::ToolClassification>, String> {
    sqlx::query_as!(
        tool_classification::ToolClassification,
        r#"
        SELECT * FROM main.tool_classifications tc
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) IS NULL OR tc.tool_id = ANY($1::integer[]))
            AND (ARRAY_LENGTH($2::integer[], 1) IS NULL OR tc.category_id = ANY($2::integer[]))
        "#,
        &tool_ids,
        &category_ids
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}