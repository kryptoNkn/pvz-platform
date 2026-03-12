use actix_web::{web, HttpResponse, Responder};
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use crate::pvz::{AppState, PvzStatus, generate_pvz_list};

pub async fn get_pvz_list(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let state = state.lock().unwrap();
    HttpResponse::Ok().json(&state.pvz_list)
}

pub async fn get_pvz_by_id(
    state: web::Data<Arc<Mutex<AppState>>>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();
    let state = state.lock().unwrap();
    match state.pvz_list.iter().find(|p| p.id == id) {
        Some(pvz) => HttpResponse::Ok().json(pvz),
        None => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
    }
}

pub async fn get_stats(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let state = state.lock().unwrap();
    let list = &state.pvz_list;
    HttpResponse::Ok().json(serde_json::json!({
        "total": list.len(),
        "active": list.iter().filter(|p| p.status == PvzStatus::Active).count(),
        "overloaded": list.iter().filter(|p| p.status == PvzStatus::Overloaded).count(),
        "closed": list.iter().filter(|p| p.status == PvzStatus::Closed).count(),
    }))
}

pub async fn regenerate(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let mut state = state.lock().unwrap();
    state.pvz_list = generate_pvz_list();
    HttpResponse::Ok().json(serde_json::json!({ "count": state.pvz_list.len() }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/v1")
            .route("/stats", web::get().to(get_stats))
            .route("/pvz", web::get().to(get_pvz_list))
            .route("/pvz/regenerate", web::post().to(regenerate))
            .route("/pvz/{id}", web::get().to(get_pvz_by_id)),
    );
}
