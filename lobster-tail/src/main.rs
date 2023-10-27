//use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder, Result};
use sqlx::postgres::PgPoolOptions;

// #[get("/")]
// async fn hello() -> impl Responder {
//     HttpResponse::Ok().body("Hello world!")
// }

// #[get("/users/{user_id}/{friend}")] // <- define path parameters
// async fn echo(path: web::Path<(u32, String)>) -> Result<String> {
//     let (user_id, friend) = path.into_inner();
//     Ok(format!("Welcome {}, user_id {}!", friend, user_id))
// }

#[actix_web::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://wilder:TheFaultInOur”DDL”@localhost/wilder").await?;

    let row: (i64,) = sqlx::query_as("SELECT $1")
        .bind(150_i64)
        .fetch_one(&pool).await?;

    assert_eq!(row.0, 150);

    Ok(())

    // HttpServer::new(|| {
    //     App::new()
    //         .service(hello)
    //         .service(echo)
    // })
    // .bind(("127.0.0.1", 8080))?
    // .run()
    // .await
}