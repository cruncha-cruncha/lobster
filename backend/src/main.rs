mod admin_level_handlers;
mod auth;
mod db_structs;
mod moderator_level_handlers;
mod rabbit;
mod user_level_handlers;

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

    let (_rabbit_conn, communicator) = rabbit::communicator::init()
        .await
        .expect("Failed to connect to rabbitMQ");

    let pg_connection_string = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&pg_connection_string)
        .await
        .expect("Failed to create pool.");
    let shared_state = Arc::new(AppState {
        db: pool,
        comm: communicator,
    });

    let hosting_addr_string = env::var("HOSTING_ADDR").expect("HOSTING_ADDR must be set");
    let hosting_addr = hosting_addr_string
        .parse::<SocketAddr>()
        .expect("HOSTING_ADDR must be a valid socket address");

    let app = Router::new()
        .route("/hello", routing::get(|| async { "hello, world" }))
        .route("/users", routing::post(user_level_handlers::auth::login))
        .route("/tokens", routing::post(user_level_handlers::auth::refresh))
        .route(
            "/invitations",
            routing::post(user_level_handlers::invitation::post),
        )
        .route(
            "/invitations/:code",
            routing::post(user_level_handlers::auth::accept_invitation),
        )
        .route(
            "/password-resets",
            routing::post(user_level_handlers::password_reset::post),
        )
        .route(
            "/password-resets/:code",
            routing::post(user_level_handlers::auth::reset_password),
        )
        .route(
            "/accounts",
            routing::post(user_level_handlers::account::get_multiple)
                .delete(user_level_handlers::account::delete),
        )
        .route(
            "/accounts/:user_id",
            routing::get(user_level_handlers::account::get)
                .patch(user_level_handlers::account::patch),
        )
        .route(
            "/profiles/:user_id",
            routing::get(user_level_handlers::profile::get),
        )
        .route(
            "/profiles/:user_id/historical-data",
            routing::get(user_level_handlers::profile::get_history),
        )
        .route(
            "/users/:user_id/all-posts/:page",
            routing::get(user_level_handlers::user_scoped::get_all_posts),
        )
        .route(
            "/users/:user_id/active-posts/:page",
            routing::get(user_level_handlers::user_scoped::get_active_posts),
        )
        .route(
            "/users/:user_id/sold-posts/:page",
            routing::get(user_level_handlers::user_scoped::get_sold_posts),
        )
        .route(
            "/users/:user_id/deleted-posts/:page",
            routing::get(user_level_handlers::user_scoped::get_deleted_posts),
        )
        .route(
            "/users/:user_id/draft-posts/:page",
            routing::get(user_level_handlers::user_scoped::get_draft_posts),
        )
        .route(
            "/users/:user_id/all-comments/:page",
            routing::get(user_level_handlers::user_scoped::get_all_comments),
        )
        .route(
            "/users/:user_id/open-comments/:page",
            routing::get(user_level_handlers::user_scoped::get_open_comments),
        )
        .route(
            "/users/:user_id/hit-comments/:page",
            routing::get(user_level_handlers::user_scoped::get_hit_comments),
        )
        .route(
            "/users/:user_id/missed-comments/:page",
            routing::get(user_level_handlers::user_scoped::get_missed_comments),
        )
        .route(
            "/users/:user_id/lost-comments/:page",
            routing::get(user_level_handlers::user_scoped::get_lost_comments),
        )
        .route(
            "/users/:user_id/deleted-comments/:page",
            routing::get(user_level_handlers::user_scoped::get_deleted_comments),
        )
        .route(
            "/users/:user_id/abuse_reports/:page",
            routing::get(user_level_handlers::abuse::get_reported_by),
        )
        .route(
            "/users/:user_id/abuse_offences/:page",
            routing::get(user_level_handlers::abuse::get_offended_by),
        )
        .route(
            "/unread-activity/:user_id",
            routing::get(user_level_handlers::profile::get_unread),
        )
        .route("/abuses", routing::post(user_level_handlers::abuse::post))
        .route(
            "/abuses/:abuse_uuid",
            routing::get(user_level_handlers::abuse::get)
                .patch(user_level_handlers::abuse::comment),
        )
        .route(
            "/abuses/:abuse_uuid/comments/:page",
            routing::get(user_level_handlers::abuse::get_comments),
        )
        .route("/posts", routing::post(user_level_handlers::post::post))
        .route(
            "/posts/:post_uuid",
            routing::get(user_level_handlers::post::get)
                .patch(user_level_handlers::post::patch)
                .delete(user_level_handlers::post::delete),
        )
        .route(
            "/posts/:post_uuid/comments/:page",
            routing::get(user_level_handlers::comment::get_post_scoped),
        )
        .route(
            "/comments",
            routing::post(user_level_handlers::comment::post),
        )
        .route(
            "/comments/:comment_uuid",
            routing::get(user_level_handlers::comment::get)
                .patch(user_level_handlers::comment::patch)
                .delete(user_level_handlers::comment::delete),
        )
        .route(
            "/comments/:comment_uuid/replies/:page",
            routing::get(user_level_handlers::reply::get_comment_scoped),
        )
        .route("/replies", routing::post(user_level_handlers::reply::post))
        .route(
            "/replies/:reply_uuid",
            routing::get(user_level_handlers::reply::get)
                .patch(user_level_handlers::reply::patch)
                .delete(user_level_handlers::reply::delete),
        )
        .route(
            "/currencies",
            routing::get(user_level_handlers::currencies::get),
        )
        .route(
            "/languages",
            routing::get(user_level_handlers::languages::get),
        )
        .route(
            "/countries",
            routing::get(user_level_handlers::countries::get),
        )
        .route(
            "/resource-options",
            routing::get(user_level_handlers::abuse::get_resource_options),
        )
        .route(
            "/abuse-statuses",
            routing::get(user_level_handlers::abuse::get_status_options),
        )
        .route("/sales", routing::post(user_level_handlers::sale::post))
        .route(
            "/sales/:post_uuid",
            routing::get(user_level_handlers::sale::get).patch(user_level_handlers::sale::patch),
        )
        .route(
            "/reviews/:post_uuid",
            routing::post(user_level_handlers::reviews::make)
                .patch(user_level_handlers::reviews::make)
                .delete(user_level_handlers::reviews::remove),
        )
        .route(
            "/admin/abuse/:abuse_uuid",
            routing::patch(moderator_level_handlers::abuse::comment),
        )
        .route(
            "/admin/invitation",
            routing::post(moderator_level_handlers::invitation::read_code)
                .delete(admin_level_handlers::invitation::delete),
        )
        .route(
            "/admin/reset-password",
            routing::post(moderator_level_handlers::password_reset::read_code)
                .delete(admin_level_handlers::password_reset::delete),
        )
        .route(
            "/admin/users/:user_id",
            routing::delete(admin_level_handlers::user::delete)
                .post(admin_level_handlers::auth::login),
        )
        .route(
            "/admin/users/:user_id/ban",
            routing::post(moderator_level_handlers::user::ban),
        )
        .route(
            "/admin/posts/:post_uuid",
            routing::delete(admin_level_handlers::post::delete)
                .patch(moderator_level_handlers::post::touch),
        )
        .route(
            "/admin/sales/:post_uuid",
            routing::delete(admin_level_handlers::sale::delete),
        )
        .route(
            "/admin/comments/:comment_uuid",
            routing::delete(admin_level_handlers::comment::delete),
        )
        .route(
            "/admin/replies/:reply_uuid",
            routing::delete(admin_level_handlers::reply::delete),
        );

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
