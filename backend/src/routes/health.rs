use actix_web::{get, web, HttpResponse, Responder};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
struct ReadinessResponse {
    status: &'static str,
    db: &'static str,
}

#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().json(HealthResponse { status: "ok" })
}

#[get("/ready")]
async fn ready(pool: web::Data<PgPool>) -> impl Responder {
    let db_ok = sqlx::query("SELECT 1")
        .fetch_one(pool.get_ref())
        .await
        .is_ok();

    if db_ok {
        HttpResponse::Ok().json(ReadinessResponse {
            status: "ok",
            db: "ok",
        })
    } else {
        HttpResponse::ServiceUnavailable().json(ReadinessResponse {
            status: "degraded",
            db: "down",
        })
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(health);
    cfg.service(ready);
}