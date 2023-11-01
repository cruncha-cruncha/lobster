mod db_structs;
mod user_level_handlers;

use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    routing, Router,
};
use db_structs::user;
use pem::Pem;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{env, error::Error, net::SocketAddr, sync::Arc};
use user_level_handlers::{account, comment, invitation, post, post_comments, profile, reply};

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().expect("Failed to read .env file");

    let pg_connection_string = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
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
        .route("/invitation", routing::post(invitation::post))
        .route("/account", routing::post(account::post))
        .route(
            "/account/:user_id",
            routing::get(account::get)
                .patch(account::patch)
                .delete(account::delete),
        )
        .route("/profile/:user_id", routing::get(profile::get))
        .route("/post", routing::post(post::post))
        .route(
            "/post/:post_uuid",
            routing::get(post::get)
                .patch(post::patch)
                .delete(post::delete),
        )
        .route(
            "/post-comments/:post_uuid",
            routing::get(post_comments::get),
        )
        .route("/comment", routing::post(comment::post))
        .route(
            "/comment/:comment_uuid",
            routing::patch(comment::patch).delete(comment::delete),
        )
        .route("/reply", routing::post(reply::post))
        .route(
            "/reply/:reply_uuid",
            routing::patch(reply::patch).delete(reply::delete),
        )
        .with_state(shared_state);

    axum::Server::bind(&hosting_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();

    Ok(())
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum ClaimLevel {
    Admin,
    Moderator,
    User,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    iss: String,
    sub: String,
    email: String,
    level: ClaimLevel,
    aud: String,
    exp: usize,
    nbf: usize,
    iat: usize,
}

fn get_jwt_public_key_pem() -> Option<Pem> {
    // TODO: read from file
    None
}

impl Claims {
    pub fn subject_as_user_id(&self) -> Option<user::Id> {
        self.sub.parse::<user::Id>().ok()
    }
}

#[cfg(not(feature = "ignoreAuth"))]
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

#[cfg(feature = "ignoreAuth")]
#[axum::async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(_parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        Ok(Claims {
            iss: String::from(""),
            sub: String::from(""),
            email: String::from(""),
            level: ClaimLevel::Admin,
            aud: String::from(""),
            exp: 0,
            nbf: 0,
            iat: 0,
        })
    }
}
