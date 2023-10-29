mod db_structs;
mod account;

use std::{env, error::Error, net::SocketAddr, sync::Arc};
use sqlx::{postgres::PgPoolOptions, PgPool};
use serde::{Deserialize, Serialize};
use pem::Pem;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    routing::get,
    Router,
};

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().expect("Failed to read .env file");

    let pg_connection_string =
        env::var("PG_CONNECTION_STRING").expect("PG_CONNECTION_STRING must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&pg_connection_string)
        .await
        .expect("Failed to create pool.");
    let shared_state = Arc::new(AppState { db: pool });

    let hosting_addr_string = env::var("HOSTING_ADDR").expect("HOSTING_ADDR must be set");
    let hosting_addr = hosting_addr_string
        .parse::<SocketAddr>()
        .expect("HOSTING_ADDR must be a valid socket address");

    let app = Router::new()
        .route("/account/:user_id", get(account::get).patch(account::patch))
        .with_state(shared_state);
        
    axum::Server::bind(&hosting_addr)
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    iss: String,
    sub: String,
    email: String,
    aud: String,
    exp: usize,
    nbf: usize,
    iat: usize,
}

fn get_jwt_public_key_pem() -> Option<Pem> {
    // TODO: read from file
    None
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        use hyper::header::AUTHORIZATION;
        use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};

        let header_value = match parts.headers.get(AUTHORIZATION) {
            Some(val) => val,
            None => return Err((StatusCode::UNAUTHORIZED, "No auth header".to_string())),
        };

        let auth_string = match header_value.to_str().ok().and_then(|s| {
            if s.starts_with("Bearer ") {
                Some(s[7..].to_string())
            } else {
                None
            }
        }) {
            Some(s) => s,
            None => return Err((StatusCode::BAD_REQUEST, "Invalid auth header".to_string())),
        };

        let key = match get_jwt_public_key_pem() {
            Some(key) => key,
            None => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "No private key".to_string(),
                ))
            }
        };

        let token_data = match decode::<Claims>(
            &auth_string,
            &DecodingKey::from_secret(key.contents()),
            &Validation::new(Algorithm::RS256),
        ) {
            Ok(data) => data,
            Err(e) => return Err((StatusCode::BAD_REQUEST, e.to_string())),
        };

        Ok(token_data.claims)
    }
}