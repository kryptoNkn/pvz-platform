use actix_web::{web, HttpResponse, Responder};
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use rand::Rng;
use serde::Deserialize;
use crate::pvz::{AppState, Pvz, PvzStatus, SizeType, LocationType, generate_pvz_list, generate_workload_stats, generate_financial_stats};

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
    let ws = &state.workload_stats;
    HttpResponse::Ok().json(serde_json::json!({
        "total": list.len(),
        "active": list.iter().filter(|p| p.status == PvzStatus::Active).count(),
        "overloaded": list.iter().filter(|p| p.status == PvzStatus::Overloaded).count(),
        "closed": list.iter().filter(|p| p.status == PvzStatus::Closed).count(),
        "total_items": ws.total_items,
        "acceptance": ws.acceptance,
        "delivery": ws.delivery,
        "returns": ws.returns,
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
}

pub async fn add_pvz(
    state: web::Data<Arc<Mutex<AppState>>>,
    body: web::Json<NewPvzBody>,
) -> impl Responder {
    let mut state = state.lock().unwrap();
    let index = state.pvz_list.len();
    let max_capacity = body.max_capacity.max(1);

    let size_type = if max_capacity <= 150 {
        SizeType::Small
    } else if max_capacity <= 400 {
        SizeType::Medium
    } else {
        SizeType::Large
    };

    let pvz = Pvz {
        id: Uuid::new_v4(),
        name: format!("ПВЗ №{}", index + 1),
        address: body.address.clone(),
        size_type,
        location_type: LocationType::Street,
        status: PvzStatus::Active,
        current_items: 0,
        max_capacity,
        load_percent: 0,
        traffic: "Низкий".to_string(),
        hours: "09:00 - 21:00".to_string(),
    };

    state.pvz_list.push(pvz.clone());
    HttpResponse::Ok().json(pvz)
}

pub async fn regenerate(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let mut state = state.lock().unwrap();
    let mut rng = rand::thread_rng();
    state.pvz_list = generate_pvz_list();
    state.workload_stats = generate_workload_stats(&mut rng);
    state.financial_stats = generate_financial_stats(&mut rng);
    HttpResponse::Ok().json(serde_json::json!({ "count": state.pvz_list.len() }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/v1")
            .route("/stats", web::get().to(get_stats))
            .route("/finance", web::get().to(get_finance))
            .route("/pvz", web::get().to(get_pvz_list))
            .route("/pvz", web::post().to(add_pvz))
            .route("/pvz/regenerate", web::post().to(regenerate))
            .route("/pvz/{id}", web::get().to(get_pvz_by_id)),
    );
}
