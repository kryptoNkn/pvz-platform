use std::sync::Arc;

use crate::marketplace::{MarketplaceService, MpProduct, SyncState};
use crate::utils::roles::Role;
use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use std::collections::HashMap;
use uuid::Uuid;

fn require_marketplace_access(req: &HttpRequest) -> Result<Role, HttpResponse> {
    let role = req
        .extensions()
        .get::<Role>()
        .copied()
        .ok_or_else(|| HttpResponse::Unauthorized().finish())?;

    if role.can_manage_marketplace() {
        Ok(role)
    } else {
        Err(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Insufficient permissions"
        })))
    }
}

pub async fn sync_orders(
    req: HttpRequest,
    service: web::Data<Arc<MarketplaceService>>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    if let Err(resp) = require_marketplace_access(&req) {
        return resp;
    }
    let state = SyncState::default();
    match service.sync_orders_all(pool.get_ref(), &state).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(e) => {
            log::error!("sync_orders error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn push_prices(
    req: HttpRequest,
    service: web::Data<Arc<MarketplaceService>>,
    body: web::Json<Vec<MpProduct>>,
) -> impl Responder {
    if let Err(resp) = require_marketplace_access(&req) {
        return resp;
    }
    match service.push_prices_all(&body).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(e) => {
            log::error!("push_prices error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn push_stocks(
    req: HttpRequest,
    service: web::Data<Arc<MarketplaceService>>,
    body: web::Json<Vec<MpProduct>>,
) -> impl Responder {
    if let Err(resp) = require_marketplace_access(&req) {
        return resp;
    }
    match service.push_stocks_all(&body).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(e) => {
            log::error!("push_stocks error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn wb_sync_cards(
    req: HttpRequest,
    service: web::Data<Arc<MarketplaceService>>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    if let Err(resp) = require_marketplace_access(&req) {
        return resp;
    }
    match service.wb_sync_cards(pool.get_ref()).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(e) => {
            log::error!("wb_sync_cards error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn wb_push_prices(
    req: HttpRequest,
    service: web::Data<Arc<MarketplaceService>>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    if let Err(resp) = require_marketplace_access(&req) {
        return resp;
    }
    match service.wb_push_prices_from_db(pool.get_ref()).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(e) => {
            log::error!("wb_push_prices error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn wb_push_stocks(
    req: HttpRequest,
    service: web::Data<Arc<MarketplaceService>>,
    pool: web::Data<PgPool>,
) -> impl Responder {
    if let Err(resp) = require_marketplace_access(&req) {
        return resp;
    }
    match service.wb_push_stocks_from_db(pool.get_ref()).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"ok": true})),
        Err(e) => {
            log::error!("wb_push_stocks error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn list_orders(pool: web::Data<PgPool>) -> impl Responder {
    #[derive(Clone)]
    struct Row {
        order_id: Uuid,
        marketplace: String,
        external_id: String,
        status: String,
        created_at: DateTime<Utc>,
        item_name: Option<String>,
        article: Option<String>,
        quantity: Option<i32>,
        price: Option<i64>,
    }

    let rows = match sqlx::query(
        r#"
        SELECT
            mo.id AS order_id,
            mo.marketplace,
            mo.external_id,
            mo.status,
            mo.created_at,
            COALESCE(p.name, p.article) AS item_name,
            p.article,
            moi.quantity,
            moi.price
        FROM marketplace_orders mo
        LEFT JOIN marketplace_order_items moi ON moi.order_id = mo.id
        LEFT JOIN products p ON p.id = moi.product_id
        ORDER BY mo.created_at DESC
        LIMIT 50
        "#,
    )
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(r) => r,
        Err(e) => {
            log::error!("list_orders error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let mut map: HashMap<Uuid, serde_json::Value> = HashMap::new();
    for r in rows {
        let row = Row {
            order_id: r.get("order_id"),
            marketplace: r.get("marketplace"),
            external_id: r.get("external_id"),
            status: r.get("status"),
            created_at: r.get("created_at"),
            item_name: r.try_get("item_name").ok(),
            article: r.try_get("article").ok(),
            quantity: r.try_get("quantity").ok(),
            price: r.try_get("price").ok(),
        };

        let entry = map.entry(row.order_id).or_insert_with(|| {
            serde_json::json!({
                "id": row.order_id,
                "marketplace": row.marketplace,
                "external_id": row.external_id,
                "status": row.status,
                "created_at": row.created_at,
                "items": [],
            })
        });

        if let (Some(name), Some(article), Some(quantity), Some(price)) =
            (row.item_name, row.article, row.quantity, row.price)
        {
            if let Some(items) = entry.get_mut("items").and_then(|v| v.as_array_mut()) {
                items.push(serde_json::json!({
                    "name": name,
                    "article": article,
                    "quantity": quantity,
                    "price": price
                }));
            }
        }
    }

    let mut list: Vec<serde_json::Value> = map.into_values().collect();
    list.sort_by(|a, b| {
        let ad = a.get("created_at").and_then(|v| v.as_str()).unwrap_or("");
        let bd = b.get("created_at").and_then(|v| v.as_str()).unwrap_or("");
        bd.cmp(ad)
    });

    HttpResponse::Ok().json(list)
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/marketplace")
            .route("/sync-orders", web::post().to(sync_orders))
            .route("/push-stocks", web::post().to(push_stocks))
            .route("/push-prices", web::post().to(push_prices))
            .route("/wb/sync-cards", web::post().to(wb_sync_cards))
            .route("/wb/push-prices", web::post().to(wb_push_prices))
            .route("/wb/push-stocks", web::post().to(wb_push_stocks))
            .route("/orders", web::get().to(list_orders)),
    );
}
