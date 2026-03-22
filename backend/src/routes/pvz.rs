use actix_web::{web, HttpResponse, Responder};
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use serde::Deserialize;
use sqlx::{PgPool, Row};
use crate::pvz::{AppState, generate_workload_stats, generate_financial_stats};

fn compute_load_percent(current: i32, max: i32) -> u8 {
    if max <= 0 { return 0; }
    ((current as f64 / max as f64) * 100.0).round() as u8
}

fn compute_traffic(status: &str, load_percent: u8) -> &'static str {
    match status {
        "closed" => "-",
        _ if load_percent >= 70 => "Высокий",
        _ if load_percent >= 40 => "Средний",
        _ => "Низкий",
    }
}

fn row_to_json(r: &sqlx::postgres::PgRow) -> serde_json::Value {
    let id: Uuid = r.get("id");
    let name: String = r.get("name");
    let address: String = r.get("address");
    let size_type: String = r.get("size_type");
    let location_type: String = r.get("location_type");
    let status: String = r.get("status");
    let max_capacity: i32 = r.get("max_capacity");
    let current_items: i32 = r.get("current_items");
    let hours: String = r.get("hours");

    let load_percent = compute_load_percent(current_items, max_capacity);
    let traffic = compute_traffic(&status, load_percent);

    serde_json::json!({
        "id": id,
        "name": name,
        "address": address,
        "size_type": size_type,
        "location_type": location_type,
        "status": status,
        "max_capacity": max_capacity,
        "current_items": current_items,
        "load_percent": load_percent,
        "traffic": traffic,
        "hours": hours,
    })
}

pub async fn get_pvz_list(pool: web::Data<PgPool>) -> impl Responder {
    match sqlx::query(
        "SELECT id, name, address, size_type, location_type, status, max_capacity, current_items, hours
         FROM pvz ORDER BY created_at"
    )
    .fetch_all(pool.get_ref())
    .await {
        Ok(rows) => {
            let list: Vec<_> = rows.iter().map(row_to_json).collect();
            HttpResponse::Ok().json(list)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_pvz_by_id(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();
    match sqlx::query(
        "SELECT id, name, address, size_type, location_type, status, max_capacity, current_items, hours
         FROM pvz WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await {
        Ok(Some(r)) => HttpResponse::Ok().json(row_to_json(&r)),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_stats(
    pool: web::Data<PgPool>,
    state: web::Data<Arc<Mutex<AppState>>>,
) -> impl Responder {
    let counts = sqlx::query(
        "SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'active') as active,
            COUNT(*) FILTER (WHERE status = 'overloaded') as overloaded,
            COUNT(*) FILTER (WHERE status = 'closed') as closed
         FROM pvz"
    )
    .fetch_one(pool.get_ref())
    .await;

    let (total, active, overloaded, closed) = match counts {
        Ok(r) => {
            let total: i64 = r.get("total");
            let active: i64 = r.get("active");
            let overloaded: i64 = r.get("overloaded");
            let closed: i64 = r.get("closed");
            (total, active, overloaded, closed)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            (0i64, 0i64, 0i64, 0i64)
        }
    };

    let (total_items, acceptance, delivery, returns) = {
        let s = state.lock().unwrap();
        (s.workload_stats.total_items, s.workload_stats.acceptance,
         s.workload_stats.delivery, s.workload_stats.returns)
    };

    HttpResponse::Ok().json(serde_json::json!({
        "total": total,
        "active": active,
        "overloaded": overloaded,
        "closed": closed,
        "total_items": total_items,
        "acceptance": acceptance,
        "delivery": delivery,
        "returns": returns,
    }))
}

pub async fn get_finance(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let state = state.lock().unwrap();
    HttpResponse::Ok().json(&state.financial_stats)
}

#[derive(Deserialize)]
pub struct NewPvzBody {
    pub address: String,
    pub max_capacity: u32,
    pub location_type: Option<String>,
}

pub async fn add_pvz(
    pool: web::Data<PgPool>,
    body: web::Json<NewPvzBody>,
) -> impl Responder {
    let max_capacity = body.max_capacity.max(1) as i32;
    let location_type = body.location_type.clone()
        .filter(|s| ["mall", "street", "residential", "office"].contains(&s.as_str()))
        .unwrap_or_else(|| "street".to_string());

    let size_type = if max_capacity <= 150 { "small" }
                   else if max_capacity <= 400 { "medium" }
                   else { "large" };

    let hours = match location_type.as_str() {
        "mall"        => "10:00 - 22:00",
        "residential" => "09:00 - 20:00",
        "office"      => "08:00 - 19:00",
        _             => "09:00 - 21:00",
    };

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pvz")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or(0);
    let name = format!("ПВЗ №{}", count + 1);

    match sqlx::query(
        "INSERT INTO pvz (name, address, size_type, location_type, status, max_capacity, current_items, hours)
         VALUES ($1, $2, $3, $4, 'active', $5, 0, $6)
         RETURNING id, name, address, size_type, location_type, status, max_capacity, current_items, hours"
    )
    .bind(&name)
    .bind(&body.address)
    .bind(size_type)
    .bind(&location_type)
    .bind(max_capacity)
    .bind(hours)
    .fetch_one(pool.get_ref())
    .await {
        Ok(r) => HttpResponse::Ok().json(row_to_json(&r)),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Deserialize)]
pub struct UpdatePvzBody {
    pub address: Option<String>,
    pub max_capacity: Option<u32>,
    pub location_type: Option<String>,
    pub status: Option<String>,
    pub hours: Option<String>,
}

pub async fn update_pvz(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdatePvzBody>,
) -> impl Responder {
    let id = path.into_inner();

    let existing = sqlx::query(
        "SELECT address, location_type, status, max_capacity, hours FROM pvz WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await;

    match existing {
        Ok(Some(row)) => {
            let cur_address: String = row.get("address");
            let cur_location_type: String = row.get("location_type");
            let cur_status: String = row.get("status");
            let cur_max_capacity: i32 = row.get("max_capacity");
            let cur_hours: String = row.get("hours");

            let address = body.address.clone().unwrap_or(cur_address);
            let max_capacity = body.max_capacity.map(|v| v as i32).unwrap_or(cur_max_capacity);
            let location_type = body.location_type.clone()
                .filter(|s| ["mall", "street", "residential", "office"].contains(&s.as_str()))
                .unwrap_or(cur_location_type);
            let status = body.status.clone()
                .filter(|s| ["active", "overloaded", "closed"].contains(&s.as_str()))
                .unwrap_or(cur_status);
            let hours = body.hours.clone().unwrap_or(cur_hours);
            let size_type = if max_capacity <= 150 { "small" }
                           else if max_capacity <= 400 { "medium" }
                           else { "large" };

            match sqlx::query(
                "UPDATE pvz
                 SET address = $1, max_capacity = $2, location_type = $3,
                     status = $4, size_type = $5, hours = $6
                 WHERE id = $7
                 RETURNING id, name, address, size_type, location_type, status, max_capacity, current_items, hours"
            )
            .bind(&address)
            .bind(max_capacity)
            .bind(&location_type)
            .bind(&status)
            .bind(size_type)
            .bind(&hours)
            .bind(id)
            .fetch_one(pool.get_ref())
            .await {
                Ok(r) => HttpResponse::Ok().json(row_to_json(&r)),
                Err(e) => {
                    log::error!("DB error: {e}");
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn delete_pvz(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();
    match sqlx::query("DELETE FROM pvz WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await {
        Ok(r) if r.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({ "deleted": true }))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn regenerate(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let mut state = state.lock().unwrap();
    let mut rng = rand::thread_rng();
    state.workload_stats = generate_workload_stats(&mut rng);
    state.financial_stats = generate_financial_stats(&mut rng);
    HttpResponse::Ok().json(serde_json::json!({ "ok": true }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/v1")
            .route("/stats", web::get().to(get_stats))
            .route("/finance", web::get().to(get_finance))
            .route("/pvz", web::get().to(get_pvz_list))
            .route("/pvz", web::post().to(add_pvz))
            .route("/pvz/regenerate", web::post().to(regenerate))
            .route("/pvz/{id}", web::get().to(get_pvz_by_id))
            .route("/pvz/{id}", web::put().to(update_pvz))
            .route("/pvz/{id}", web::delete().to(delete_pvz))
            .route("/pvz/{id}/schedule", web::get().to(super::schedule::get_schedule))
            .route("/pvz/{id}/schedule", web::put().to(super::schedule::set_schedule))
    );
}
