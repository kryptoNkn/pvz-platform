mod models;
mod routes;
mod utils;
mod middleware;
mod pvz;

use std::{env, sync::{Arc, Mutex}};
use actix_cors::Cors;
use actix_files::Files;
use actix_web::{web, App, HttpServer};
use sqlx::PgPool;
use crate::middleware::auth::Auth;
use crate::pvz::AppState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await.expect("Failed to connect to DB");

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS operations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pvz_id UUID NOT NULL REFERENCES pvz(id) ON DELETE CASCADE,
            op_type VARCHAR(10) NOT NULL CHECK (op_type IN ('in', 'out', 'return')),
            quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
            operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
            note TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )"
    )
    .execute(&pool)
    .await
    .expect("Failed to create operations table");

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_operations_pvz_id     ON operations(pvz_id)")
        .execute(&pool).await.ok();
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_operations_op_type    ON operations(op_type)")
        .execute(&pool).await.ok();
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations(created_at DESC)")
        .execute(&pool).await.ok();

    sqlx::query(
        "ALTER TABLE pvz ADD COLUMN IF NOT EXISTS marketplace TEXT NOT NULL DEFAULT 'Ozon'"
    )
    .execute(&pool)
    .await
    .ok();

    let app_state = Arc::new(Mutex::new(AppState::new()));

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::permissive())
            .wrap(Auth)
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(app_state.clone()))
            .app_data(web::JsonConfig::default().limit(4096))
            .service(
                web::scope("/api")
                    .service(Files::new("/uploads", "uploads").use_last_modified(true))
                    .configure(routes::auth::init_routes)
                    .configure(routes::user::init_routes)
                    .configure(routes::pvz::init_routes)
                    .configure(routes::notifications::init_routes)
                    .configure(routes::operations::init_routes)
            )
    })
        .bind("0.0.0.0:8080")?
        .run()
        .await
}
