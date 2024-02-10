mod auth;
mod rabbit;
mod db_structs;
mod user_level_handlers;
mod test_level_handlers;

use axum::{routing, Router};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::{env, error::Error, net::SocketAddr, sync::Arc};
#[cfg(feature = "cors")]
use tower_http::cors::CorsLayer;
use user_level_handlers::{
    account, auth as auth_handler, comment, countries, currencies, invitation, languages,
    password_reset, post, post_comments, profile, reply,
};

#[derive(Clone)]
pub struct AppState {
    db: PgPool,
    chan: lapin::Channel,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenvy::dotenv().expect("Failed to read .env file");

    let (_rabbit_conn, rabbit_chan) = rabbit::setup::setup().await.expect("Failed to connect to rabbitMQ");

    let pg_connection_string = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&pg_connection_string)
        .await
        .expect("Failed to create pool.");
    let shared_state = Arc::new(AppState { db: pool, chan: rabbit_chan });

    let hosting_addr_string = env::var("HOSTING_ADDR").expect("HOSTING_ADDR must be set");
    let hosting_addr = hosting_addr_string
        .parse::<SocketAddr>()
        .expect("HOSTING_ADDR must be a valid socket address");

    let app = Router::new()
        .route("/users", routing::post(auth_handler::login))
        .route("/tokens", routing::post(auth_handler::refresh))
        .route("/invitations", routing::post(invitation::post))
        .route(
            "/invitations/:code",
            routing::post(auth_handler::accept_invitation),
        )
        .route("/password-resets", routing::post(password_reset::post))
        .route(
            "/password-resets/:code",
            routing::post(auth_handler::reset_password),
        )
        .route(
            "/accounts/:user_id",
            routing::get(account::get)
                .patch(account::patch)
                .delete(account::delete),
        )
        .route("/profiles/:user_id", routing::get(profile::get))
        .route(
            "/profiles/:user_id/historical-data",
            routing::get(profile::get_history),
        )
        .route(
            "/unread-activity/:user_id",
            routing::get(profile::get_unread),
        )
        .route("/posts", routing::post(post::post))
        .route(
            "/posts/:post_uuid",
            routing::get(post::get)
                .patch(post::patch)
                .delete(post::delete),
        )
        .route(
            "/posts/:post_uuid/comments",
            routing::get(post_comments::get),
        )
        .route("/comments", routing::post(comment::post))
        .route(
            "/comments/:comment_uuid",
            routing::put(comment::put).delete(comment::delete),
        )
        .route("/replies", routing::post(reply::post))
        .route(
            "/replies/:reply_uuid",
            routing::put(reply::put)
                .delete(reply::delete)
                .patch(reply::patch),
        )
        .route("/currencies", routing::get(currencies::get))
        .route("/languages", routing::get(languages::get))
        .route("/countries", routing::get(countries::get))
        .route("/read-invitation", routing::post(test_level_handlers::invitation::read_invitation_code))
        .route("/read-reset-password", routing::post(test_level_handlers::password_reset::read_reset_password_code));

    #[cfg(feature = "cors")]
    let app = app.layer(
        CorsLayer::new()
            .allow_methods([
                hyper::Method::GET,
                hyper::Method::POST,
                hyper::Method::PATCH,
                hyper::Method::PUT,
                hyper::Method::DELETE,
            ])
            .allow_headers(vec![
                hyper::header::AUTHORIZATION,
                hyper::header::CONTENT_TYPE,
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
