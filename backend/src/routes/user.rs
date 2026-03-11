use actix_web::{web, HttpRequest, HttpResponse, Responder, HttpMessage};
use sqlx::{PgPool, Row};
use uuid::Uuid;
use crate::models::UpdateProfile;

pub async fn profile(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let row = sqlx::query(
        "SELECT username, email, role FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(db.get_ref())
    .await;

    match row {
        Ok(Some(r)) => {
            let full_name: String = r.get("username");
            let phone: String = r.get("email");
            let role: String = r.get("role");
            HttpResponse::Ok().json(serde_json::json!({
                "full_name": full_name,
                "phone": phone,
                "role": role,
            }))
        }
        Ok(None) => HttpResponse::NotFound().finish(),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
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

pub async fn update_profile(
    req: HttpRequest,
    db: web::Data<PgPool>,
    body: web::Json<UpdateProfile>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let result = sqlx::query("UPDATE users SET full_name = $1 WHERE id = $2")
        .bind(&body.full_name)
        .bind(user_id)
        .execute(db.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "message": "Profile updated" })),
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
            .route("/profile", web::put().to(update_profile))
    );
    cfg.service(
        web::scope("/users")
            .route("/check-username", web::get().to(check_username))
    );
}