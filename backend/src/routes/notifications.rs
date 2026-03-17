use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use sqlx::{PgPool, Row};
use uuid::Uuid;

pub async fn get_notifications(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let rows = sqlx::query(
        "SELECT id, title, body, type, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50"
    )
    .bind(user_id)
    .fetch_all(db.get_ref())
    .await;

    match rows {
        Ok(rows) => {
            let list: Vec<serde_json::Value> = rows.iter().map(|r| {
                let id: Uuid = r.get("id");
                let title: String = r.get("title");
                let body: String = r.get("body");
                let notif_type: String = r.get("type");
                let is_read: bool = r.get("is_read");
                let created_at: chrono::DateTime<chrono::Utc> = r.get("created_at");
                serde_json::json!({
                    "id": id,
                    "title": title,
                    "body": body,
                    "type": notif_type,
                    "is_read": is_read,
                    "created_at": created_at.format("%Y-%m-%dT%H:%M:%S").to_string(),
                })
            }).collect();
            HttpResponse::Ok().json(list)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_unread_count(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let count: Result<i64, _> = sqlx::query_scalar(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false"
    )
    .bind(user_id)
    .fetch_one(db.get_ref())
    .await;

    match count {
        Ok(n) => HttpResponse::Ok().json(serde_json::json!({ "count": n })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn mark_read(
    req: HttpRequest,
    db: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let notif_id = path.into_inner();

    let result = sqlx::query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2"
    )
    .bind(notif_id)
    .bind(user_id)
    .execute(db.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ok": true })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn mark_all_read(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let result = sqlx::query(
        "UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false"
    )
    .bind(user_id)
    .execute(db.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "ok": true })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/notifications")
            .route("", web::get().to(get_notifications))
            .route("/unread-count", web::get().to(get_unread_count))
            .route("/read-all", web::put().to(mark_all_read))
            .route("/{id}/read", web::put().to(mark_read))
    );
}
