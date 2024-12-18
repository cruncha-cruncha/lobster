// mod admin_level_handlers;
mod auth;
mod db_structs;
// mod moderator_level_handlers;
mod rabbit;
// mod user_level_handlers;
mod handlers;
mod queries;

use axum::{routing, Router};
use rabbit::communicator::Communicator;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{env, error::Error, net::SocketAddr, sync::Arc};
#[cfg(feature = "cors")]
use tower_http::cors::CorsLayer;

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
    comm: Option<Communicator>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().expect("Failed to read .env file");

    // let (_rabbit_conn, communicator) = rabbit::communicator::init()
    //     .await
    //     .expect("Failed to connect to rabbitMQ");

    let pg_connection_string = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&pg_connection_string)
        .await
        .expect("Failed to create pool.");
    let shared_state = Arc::new(AppState {
        db: pool,
        comm: None,
    });

    let hosting_addr_string = env::var("HOSTING_ADDR").expect("HOSTING_ADDR must be set");
    let hosting_addr = hosting_addr_string
        .parse::<SocketAddr>()
        .expect("HOSTING_ADDR must be a valid socket address");

    let app = Router::new()
        .route("/hello", routing::get(|| async { "hello, world" }))
        .route(
            "/library",
            routing::get(handlers::library::get_info).post(handlers::library::create_library),
        )
        .route("/login", routing::post(handlers::auth::login))
        .route("/refresh", routing::post(handlers::auth::refresh));

    #[cfg(feature = "cors")]
    let app = app.layer(
        CorsLayer::new()
            .allow_methods([
                axum::http::Method::GET,
                axum::http::Method::POST,
                axum::http::Method::PATCH,
                axum::http::Method::PUT,
                axum::http::Method::DELETE,
            ])
            .allow_headers(vec![
                axum::http::header::AUTHORIZATION,
                axum::http::header::CONTENT_TYPE,
            ])
            .allow_origin(tower_http::cors::Any),
    );

    let app = app.with_state(shared_state);

    axum::Server::bind(&hosting_addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .expect("server failed to start");

    Ok(())
}
