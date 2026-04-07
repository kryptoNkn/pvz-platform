use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;

use crate::marketplace::{MarketplaceService, MpProduct, SyncState};

pub async fn sync_orders(service: web::Data<Arc<MarketplaceService>>) -> impl Responder {
    let state = SyncState::default();
    match service.sync_orders_all(&state).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ok": true })),
        Err(e) => {
            log::error!("sync_orders error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn push_stocks(
    service: web::Data<Arc<MarketplaceService>>,
    body: web::Json<Vec<MpProduct>>,
) -> impl Responder {
    match service.push_stocks_all(&body).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ok": true })),
        Err(e) => {
            log::error!("push_stocks error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn push_prices(
    service: web::Data<Arc<MarketplaceService>>,
    body: web::Json<Vec<MpProduct>>,
) -> impl Responder {
    match service.push_prices_all(&body).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ok": true })),
        Err(e) => {
            log::error!("push_prices error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/marketplace")
            .route("/sync-orders", web::post().to(sync_orders))
            .route("/push-stocks", web::post().to(push_stocks))
            .route("/push-prices", web::post().to(push_prices))
    );
}
