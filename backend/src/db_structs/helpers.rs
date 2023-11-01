use serde::{Deserialize, Serialize};

use super::user;

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct AuthorId {
    pub author_id: user::Id
}

#[derive(Debug, sqlx::FromRow, Serialize, Deserialize)]
pub struct RowsReturned {
    pub count: Option<i64>,
}