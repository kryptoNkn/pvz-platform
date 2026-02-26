mod models;
mod routes;
mod utils;
mod middleware;

use std::env;
use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use sqlx::PgPool;
use crate::middleware::auth::Auth;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await.expect("Failed to connect to DB");

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .wrap(Auth)
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::JsonConfig::default().limit(4096))
            .route("/", web::get().to(|| async { "Home page" }))
            .configure(routes::auth::init_routes)
            .configure(routes::user::init_routes)
    })
        .bind("0.0.0.0:8080")?
        .run()
        .await
}
