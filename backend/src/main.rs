mod db_structs;
mod auth;
mod user_level_handlers;

use axum::{
    routing, Router,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{env, error::Error, net::SocketAddr, sync::Arc};
use user_level_handlers::{account, comment, invitation, post, post_comments, profile, reply, auth as auth_handler};

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
        .route("/users", routing::post(auth_handler::login))
        .route("/tokens", routing::post(auth_handler::refresh))
        .route("/invitations", routing::post(invitation::post))
        .route("/accounts", routing::post(auth_handler::accept_invitation))
        .route(
            "/accounts/:user_id",
            routing::get(account::get)
                .patch(account::patch)
                .delete(account::delete),
        )
        .route("/profiles/:user_id", routing::get(profile::get))
        .route("/posts", routing::post(post::post))
        .route(
            "/posts/:post_uuid",
            routing::get(post::get)
                .patch(post::patch)
                .delete(post::delete),
        )
        .route(
            "/post-comments/:post_uuid",
            routing::get(post_comments::get),
        )
        .route("/comments", routing::post(comment::post))
        .route(
            "/comments/:comment_uuid",
            routing::patch(comment::patch).delete(comment::delete),
        )
        .route("/replies", routing::post(reply::post))
        .route(
            "/replies/:reply_uuid",
            routing::patch(reply::patch).delete(reply::delete),
        )
        .with_state(shared_state);

    axum::Server::bind(&hosting_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("server failed to start");

    Ok(())
}
