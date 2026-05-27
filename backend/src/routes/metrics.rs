use actix_web::web::ServiceConfig;
use actix_web::{HttpResponse, Responder, get};
use prometheus::{Encoder, TextEncoder};

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
