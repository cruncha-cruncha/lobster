mod auth;
mod common;
mod usernames;
mod db_structs;
mod handlers;
mod queries;
mod rabbit;

use axum::{routing, Router};
use rabbit::communicator::Communicator;
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{env, error::Error, net::SocketAddr, sync::Arc};
#[cfg(feature = "cors")]
use tower_http::cors::CorsLayer;

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
    comm: Communicator,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().expect("Failed to read .env file");

    let (_rabbit_conn, comm) = match rabbit::communicator::init().await {
        Ok((conn, comm)) => (Some(conn), comm),
        Err(e) => {
            eprintln!("Failed to connect to rabbitMQ: {}", e);
            (None, Communicator::new(None))
        }
    };

    let pg_connection_string = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&pg_connection_string)
        .await
        .expect("Failed to create pool.");
    let shared_state = Arc::new(AppState {
        db: pool,
        comm: comm,
    });

    let hosting_addr_string = env::var("HOSTING_ADDR").expect("HOSTING_ADDR must be set");
    let hosting_addr = hosting_addr_string
        .parse::<SocketAddr>()
        .expect("HOSTING_ADDR must be a valid socket address");

    let app = Router::new()
        .route("/hello", routing::get(|| async { "hello, world" }))
        .route("/login", routing::post(handlers::auth::login))
        .route("/refresh", routing::post(handlers::auth::refresh))
        .route(
            "/statuses",
            routing::get(handlers::library::get_all_statuses),
        )
        .route("/roles", routing::get(handlers::library::get_role_options))
        .route(
            "/library",
            routing::get(handlers::library::get_info)
                .post(handlers::library::create_library)
                .patch(handlers::library::update_info),
        )
        .route("/users", routing::get(handlers::users::get_filtered))
        .route(
            "/users/:user_id",
            routing::patch(handlers::users::update).get(handlers::users::get_by_id),
        )
        .route(
            "/users/:user_id/status",
            routing::patch(handlers::users::update_status),
        )
        .route(
            "/users/:user_id/permissions",
            routing::get(handlers::permissions::get_by_user),
        )
        .route(
            "/stores",
            routing::get(handlers::stores::get_filtered).post(handlers::stores::create_new),
        )
        .route(
            "/stores/:store_id",
            routing::patch(handlers::stores::update_info).get(handlers::stores::get_by_id),
        )
        .route(
            "/stores/:store_id/status",
            routing::patch(handlers::stores::update_status),
        )
        .route(
            "/permissions",
            routing::post(handlers::permissions::add)
        )
        .route(
            "/permissions/:permission_id",
            routing::delete(handlers::permissions::delete)
        )
        .route(
            "/tool-categories",
            routing::get(handlers::tool_categories::get_filtered)
                .post(handlers::tool_categories::create_new),
        )
        .route(
            "/tool-categories/:tool_category_id",
            routing::patch(handlers::tool_categories::update)
                .get(handlers::tool_categories::get_by_id),
        );

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

    let listener = tokio::net::TcpListener::bind(&hosting_addr)
        .await
        .expect("listener failed to start");

    axum::serve(listener, app)
        .await
        .expect("server failed to start");

    Ok(())
}
