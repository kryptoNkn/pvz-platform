mod models;
mod routes;
mod utils;
mod middleware;
mod pvz;

use std::env;
use std::sync::{Arc, Mutex};
use actix_cors::Cors;
use actix_files::Files;
use actix_web::{web, App, HttpServer};
use sqlx::PgPool;
use crate::middleware::auth::Auth;
use crate::pvz::AppState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    std::fs::create_dir_all("uploads/avatars").ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await.expect("Failed to connect to DB");
    let app_state = Arc::new(Mutex::new(AppState::new()));

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .wrap(Auth)
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(app_state.clone()))
            .app_data(web::JsonConfig::default().limit(4096))
            .service(Files::new("/uploads", "uploads").use_last_modified(true))
            .route("/", web::get().to(|| async { "Home page" }))
            .configure(routes::auth::init_routes)
            .configure(routes::user::init_routes)
            .configure(routes::pvz::init_routes)
            .configure(routes::notifications::init_routes)
    })
        .bind("0.0.0.0:8080")?
        .run()
        .await
}
