use actix_multipart::Multipart;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use futures_util::TryStreamExt;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use serde::Deserialize;
use std::fs;
use std::io::Write;
use crate::models::UpdateProfile;
use crate::utils::password::{hash_password, verify_password};

pub async fn profile(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let row = sqlx::query(
        "SELECT username, email, role, avatar_path, created_at FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(db.get_ref())
    .await;

    match row {
        Ok(Some(r)) => {
            let full_name: String = r.get("username");
            let phone: String = r.get("email");
            let role: String = r.get("role");
            let avatar_path: Option<String> = r.get("avatar_path");
            let created_at: chrono::DateTime<chrono::Utc> = r.get("created_at");
            HttpResponse::Ok().json(serde_json::json!({
                "full_name": full_name,
                "phone": phone,
                "role": role,
                "avatar_url": avatar_path,
                "created_at": created_at.format("%Y-%m-%dT%H:%M:%S").to_string(),
            }))
        }
        Ok(None) => HttpResponse::NotFound().finish(),
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

    let result = sqlx::query("UPDATE users SET username = $1 WHERE id = $2")
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

pub async fn upload_avatar(
    req: HttpRequest,
    mut payload: Multipart,
    db: web::Data<PgPool>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    const MAX_SIZE: usize = 5 * 1024 * 1024;

    while let Ok(Some(mut field)) = payload.try_next().await {
        let ct = field.content_type()
            .map(|m| m.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());
        if !ct.starts_with("image/") && ct != "application/octet-stream" {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Только изображения"}));
        }

        let ext = match ct.as_str() {
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/gif" => "gif",
            "image/webp" => "webp",
            _ => "jpg",
        };

        let uploads_dir = "uploads/avatars";
        if let Err(e) = fs::create_dir_all(uploads_dir) {
            log::error!("Failed to create uploads dir: {e}");
            return HttpResponse::InternalServerError().finish();
        }

        for old_ext in &["jpg", "png", "gif", "webp"] {
            let _ = fs::remove_file(format!("{}/{}.{}", uploads_dir, user_id, old_ext));
        }

        let filename = format!("{}.{}", user_id, ext);
        let filepath = format!("{}/{}", uploads_dir, filename);

        let mut file = match fs::File::create(&filepath) {
            Ok(f) => f,
            Err(e) => {
                log::error!("Failed to create file: {e}");
                return HttpResponse::InternalServerError().finish();
            }
        };

        let mut total = 0usize;
        while let Ok(Some(chunk)) = field.try_next().await {
            total += chunk.len();
            if total > MAX_SIZE {
                let _ = fs::remove_file(&filepath);
                return HttpResponse::PayloadTooLarge()
                    .json(serde_json::json!({"error": "Файл слишком большой (макс. 5 МБ)"}));
            }
            if let Err(e) = file.write_all(&chunk) {
                log::error!("Write error: {e}");
                return HttpResponse::InternalServerError().finish();
            }
        }

        let avatar_url = format!("/uploads/avatars/{}", filename);
        let result = sqlx::query("UPDATE users SET avatar_path = $1 WHERE id = $2")
            .bind(&avatar_url)
            .bind(user_id)
            .execute(db.get_ref())
            .await;

        return match result {
            Ok(_) => HttpResponse::Ok().json(serde_json::json!({"avatar_url": avatar_url})),
            Err(e) => {
                log::error!("DB error: {e}");
                HttpResponse::InternalServerError().finish()
            }
        };
    }

    HttpResponse::BadRequest().json(serde_json::json!({"error": "Файл не предоставлен"}))
}

#[derive(Deserialize)]
pub struct ChangePasswordBody {
    pub current_password: String,
    pub new_password: String,
}

pub async fn change_password(
    req: HttpRequest,
    db: web::Data<PgPool>,
    body: web::Json<ChangePasswordBody>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let row = sqlx::query("SELECT password_hash FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(db.get_ref())
        .await;

    let hash: String = match row {
        Ok(Some(r)) => r.get("password_hash"),
        _ => return HttpResponse::Unauthorized().finish(),
    };

    if !verify_password(&hash, &body.current_password) {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Неверный текущий пароль"}));
    }

    if body.new_password.len() < 8 {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "Пароль должен быть не менее 8 символов"}));
    }

    let new_hash = match hash_password(&body.new_password) {
        Ok(h) => h,
        Err(e) => {
            log::error!("Hash error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let result = sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
        .bind(&new_hash)
        .bind(user_id)
        .execute(db.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "Пароль изменён"})),
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

pub async fn get_users(
    req: HttpRequest,
    db: web::Data<PgPool>,
) -> impl Responder {
    let requester_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let row = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(requester_id)
        .fetch_optional(db.get_ref())
        .await;

    let requester_role: String = match row {
        Ok(Some(r)) => r.get("role"),
        _ => return HttpResponse::Unauthorized().finish(),
    };

    if requester_role != "owner" && requester_role != "admin" {
        return HttpResponse::Forbidden().finish();
    }

    let rows = sqlx::query(
        "SELECT id, username, role FROM users WHERE id != $1 ORDER BY created_at DESC"
    )
    .bind(requester_id)
    .fetch_all(db.get_ref())
    .await;

    match rows {
        Ok(users) => {
            let list: Vec<serde_json::Value> = users.iter().map(|r| {
                let id: Uuid = r.get("id");
                let full_name: String = r.get("username");
                let role: String = r.get("role");
                serde_json::json!({ "id": id, "full_name": full_name, "role": role })
            }).collect();
            HttpResponse::Ok().json(list)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Deserialize)]
pub struct AssignRoleBody {
    pub role: String,
}

pub async fn assign_role(
    req: HttpRequest,
    db: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<AssignRoleBody>,
) -> impl Responder {
    let requester_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let target_id = path.into_inner();

    let row = sqlx::query("SELECT role FROM users WHERE id = $1")
        .bind(requester_id)
        .fetch_optional(db.get_ref())
        .await;

    let requester_role: String = match row {
        Ok(Some(r)) => r.get("role"),
        _ => return HttpResponse::Unauthorized().finish(),
    };

    let allowed = match requester_role.as_str() {
        "owner" => matches!(body.role.as_str(), "operator" | "admin"),
        "admin" => matches!(body.role.as_str(), "operator"),
        _ => false,
    };

    if !allowed {
        return HttpResponse::Forbidden().json(
            serde_json::json!({ "error": "Insufficient permissions" })
        );
    }

    let result = sqlx::query("UPDATE users SET role = $1 WHERE id = $2")
        .bind(&body.role)
        .bind(target_id)
        .execute(db.get_ref())
        .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "message": "Role assigned" })),
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
            .route("/avatar", web::post().to(upload_avatar))
            .route("/password", web::put().to(change_password))
    );
    cfg.service(
        web::scope("/users")
            .route("/check-username", web::get().to(check_username))
            .route("", web::get().to(get_users))
            .route("/{id}/role", web::put().to(assign_role))
    );
}
