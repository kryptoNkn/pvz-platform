use actix_web::{get, HttpResponse, Responder};
use prometheus::{Encoder, TextEncoder};
use actix_web::web::ServiceConfig;

#[get("/metrics")]
async fn metrics() -> impl Responder {
    let mut buffer = Vec::new();
    let encoder = TextEncoder::new();
    let families = prometheus::gather();

    if encoder.encode(&families, &mut buffer).is_err() {
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Ok()
        .content_type(encoder.format_type())
        .body(buffer)
}

pub fn init_routes(cfg: &mut ServiceConfig) {
    cfg.service(metrics);
}
