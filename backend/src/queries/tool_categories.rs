use crate::db_structs::tool_category;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SelectParams {
    pub ids: Vec<tool_category::Id>,
    pub term: String,
    pub offset: i64,
    pub limit: i64,
}

pub async fn insert(
    name: tool_category::Name,
    synonyms: tool_category::Synonyms,
    description: Option<tool_category::Description>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<tool_category::ToolCategory, String> {
    sqlx::query_as!(
        tool_category::ToolCategory,
        r#"
        INSERT INTO main.tool_categories (name, synonyms, description)
        VALUES ($1, $2, $3)
        RETURNING *;
        "#,
        name,
        &synonyms,
        description,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn update(
    id: tool_category::Id,
    name: Option<tool_category::Name>,
    synonyms: Option<tool_category::Synonyms>,
    description: Option<tool_category::Description>,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<tool_category::ToolCategory, String> {
    sqlx::query_as!(
        tool_category::ToolCategory,
        r#"
        UPDATE main.tool_categories
        SET name = COALESCE($2, name),
            synonyms = COALESCE($3, synonyms),
            description = COALESCE($4, description)
        WHERE id = $1
        RETURNING *;
        "#,
        id,
        name,
        synonyms.as_deref(),
        description,
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())
}

pub async fn select (
    params: SelectParams,
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Vec<tool_category::ToolCategory>, String> {
    sqlx::query_as!(
        tool_category::ToolCategory,
        r#"
        SELECT *
        FROM main.tool_categories tc
        WHERE
            (ARRAY_LENGTH($1::integer[], 1) IS NULL OR tc.id = ANY($1::integer[]))
            AND ($2::text = '' OR $2::text <% (tc.name || ' ' || COALESCE(tc.description, '') || ' ' || ARRAY_TO_STRING(tc.synonyms, ' ')))
        ORDER BY tc.id
        OFFSET $3 LIMIT $4;
        "#,
        &params.ids,
        params.term,
        params.offset,
        params.limit,
    )
    .fetch_all(db)
    .await
    .map_err(|e| e.to_string())
}