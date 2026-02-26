use actix_web::{web, HttpRequest, HttpResponse, Responder, HttpMessage};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn profile(req: HttpRequest) -> impl Responder {
    let user_id = req.extensions().get::<Uuid>().cloned();

    match user_id {
        Some(id) => HttpResponse::Ok().json(serde_json::json!({
            "user_id": id,
            "message": "This is a protected profile endpoint"
        })),
        None => HttpResponse::Unauthorized().finish(),
    }
}

#[derive(serde::Deserialize)]
pub struct CheckUsernameQuery {
    pub username: String,
}

pub async fn check_username(
    db: web::Data<PgPool>,
    query: web::Query<CheckUsernameQuery>,
) -> impl Responder {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)"
    )
    .bind(&query.username)
    .fetch_one(db.get_ref())
    .await;

    match exists {
        Ok(taken) => HttpResponse::Ok().json(serde_json::json!({ "available": !taken })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/user")
            .route("/profile", web::get().to(profile))
    );
    cfg.service(
        web::scope("/users")
            .route("/check-username", web::get().to(check_username))
    );
}