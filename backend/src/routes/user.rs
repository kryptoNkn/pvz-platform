use actix_multipart::Multipart;
use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};
use futures_util::TryStreamExt;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::utils::roles::Role;
use crate::{
    models::UpdateProfile,
    utils::password::{hash_password, verify_password},
};
use serde::Deserialize;
use std::path::Path;
use std::{fs, io::Write};

pub async fn profile(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let row = sqlx::query(
        "SELECT username, email, role, avatar_path, created_at,\n                company_name, inn, kpp, ogrn, bank_name, bik, bank_account, corr_account, legal_address\n         FROM users WHERE id = $1"
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
            let company_name: Option<String> = r.get("company_name");
            let inn: Option<String> = r.get("inn");
            let kpp: Option<String> = r.get("kpp");
            let ogrn: Option<String> = r.get("ogrn");
            let bank_name: Option<String> = r.get("bank_name");
            let bik: Option<String> = r.get("bik");
            let bank_account: Option<String> = r.get("bank_account");
            let corr_account: Option<String> = r.get("corr_account");
            let legal_address: Option<String> = r.get("legal_address");
            HttpResponse::Ok().json(serde_json::json!({
                "full_name": full_name,
                "phone": phone,
                "role": role,
                "avatar_url": avatar_path,
                "created_at": created_at.format("%Y-%m-%dT%H:%M:%S").to_string(),
                "company_name": company_name,
                "inn": inn,
                "kpp": kpp,
                "ogrn": ogrn,
                "bank_name": bank_name,
                "bik": bik,
                "bank_account": bank_account,
                "corr_account": corr_account,
                "legal_address": legal_address,
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

#[derive(Deserialize)]
pub struct UpdateRequisites {
    pub company_name: String,
    pub inn: String,
    pub kpp: String,
    pub ogrn: String,
    pub bank_name: String,
    pub bik: String,
    pub bank_account: String,
    pub corr_account: String,
    pub legal_address: String,
}

pub async fn update_requisites(
    req: HttpRequest,
    db: web::Data<PgPool>,
    body: web::Json<UpdateRequisites>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let result = sqlx::query(
        "UPDATE users SET company_name = $1, inn = $2, kpp = $3, ogrn = $4,\n                bank_name = $5, bik = $6, bank_account = $7, corr_account = $8, legal_address = $9\n         WHERE id = $10"
    )
    .bind(&body.company_name)
    .bind(&body.inn)
    .bind(&body.kpp)
    .bind(&body.ogrn)
    .bind(&body.bank_name)
    .bind(&body.bik)
    .bind(&body.bank_account)
    .bind(&body.corr_account)
    .bind(&body.legal_address)
    .bind(user_id)
    .execute(db.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({ "message": "Requisites updated" })),
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
        let ct = field
            .content_type()
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

        let avatar_url = format!("/api/uploads/avatars/{}", filename);
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

pub async fn list_documents(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let rows = sqlx::query(
        "SELECT id, filename, file_path, uploaded_at\n         FROM user_documents\n         WHERE user_id = $1\n         ORDER BY uploaded_at DESC"
    )
    .bind(user_id)
    .fetch_all(db.get_ref())
    .await;

    match rows {
        Ok(list) => {
            let docs: Vec<serde_json::Value> = list
                .iter()
                .map(|r| {
                    let id: Uuid = r.get("id");
                    let filename: String = r.get("filename");
                    let file_path: String = r.get("file_path");
                    let uploaded_at: chrono::DateTime<chrono::Utc> = r.get("uploaded_at");
                    serde_json::json!({
                        "id": id,
                        "filename": filename,
                        "url": file_path,
                        "uploaded_at": uploaded_at.format("%Y-%m-%dT%H:%M:%S").to_string(),
                    })
                })
                .collect();
            HttpResponse::Ok().json(docs)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn upload_document(
    req: HttpRequest,
    mut payload: Multipart,
    db: web::Data<PgPool>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    const MAX_SIZE: usize = 10 * 1024 * 1024;

    while let Ok(Some(mut field)) = payload.try_next().await {
        let ct = field
            .content_type()
            .map(|m| m.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        if !(ct.starts_with("image/")
            || ct == "application/pdf"
            || ct == "application/octet-stream")
        {
            return HttpResponse::BadRequest()
                .json(serde_json::json!({"error": "Неподдерживаемый тип файла"}));
        }

        let original_name = field
            .content_disposition()
            .get_filename()
            .map(|s| s.to_string())
            .unwrap_or_else(|| "document".to_string());

        let ext = Path::new(&original_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin");

        let uploads_dir = format!("uploads/docs/{}", user_id);
        if let Err(e) = fs::create_dir_all(&uploads_dir) {
            log::error!("Failed to create uploads dir: {e}");
            return HttpResponse::InternalServerError().finish();
        }

        let doc_id = Uuid::new_v4();
        let stored_name = format!("{}.{}", doc_id, ext);
        let filepath = format!("{}/{}", uploads_dir, stored_name);

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
                    .json(serde_json::json!({"error": "Файл слишком большой (макс. 10 МБ)"}));
            }
            if let Err(e) = file.write_all(&chunk) {
                log::error!("Write error: {e}");
                return HttpResponse::InternalServerError().finish();
            }
        }

        let file_url = format!("/api/uploads/docs/{}/{}", user_id, stored_name);
        let result = sqlx::query(
            "INSERT INTO user_documents (id, user_id, filename, file_path)\n             VALUES ($1, $2, $3, $4)"
        )
        .bind(doc_id)
        .bind(user_id)
        .bind(&original_name)
        .bind(&file_url)
        .execute(db.get_ref())
        .await;

        return match result {
            Ok(_) => HttpResponse::Ok().json(serde_json::json!({
                "id": doc_id,
                "filename": original_name,
                "url": file_url
            })),
            Err(e) => {
                log::error!("DB error: {e}");
                HttpResponse::InternalServerError().finish()
            }
        };
    }

    HttpResponse::BadRequest().json(serde_json::json!({"error": "Файл не предоставлен"}))
}

pub async fn delete_document(
    req: HttpRequest,
    db: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let user_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let doc_id = path.into_inner();
    let row = sqlx::query("SELECT file_path FROM user_documents WHERE id = $1 AND user_id = $2")
        .bind(doc_id)
        .bind(user_id)
        .fetch_optional(db.get_ref())
        .await;

    let file_path: String = match row {
        Ok(Some(r)) => r.get("file_path"),
        Ok(None) => return HttpResponse::NotFound().finish(),
        Err(e) => {
            log::error!("DB error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let result = sqlx::query("DELETE FROM user_documents WHERE id = $1 AND user_id = $2")
        .bind(doc_id)
        .bind(user_id)
        .execute(db.get_ref())
        .await;

    match result {
        Ok(_) => {
            if let Some(rel) = file_path.strip_prefix("/api/uploads/") {
                let local_path = format!("uploads/{}", rel);
                let _ = fs::remove_file(local_path);
            }
            HttpResponse::Ok().json(serde_json::json!({ "message": "Document deleted" }))
        }
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
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
    let exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)")
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

pub async fn get_users(req: HttpRequest, db: web::Data<PgPool>) -> impl Responder {
    let requester_id = match req.extensions().get::<Uuid>().cloned() {
        Some(id) => id,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let requester_role = match req.extensions().get::<Role>().copied() {
        Some(role) => role,
        None => return HttpResponse::Unauthorized().finish(),
    };

    if !requester_role.can_manage_users() {
        return HttpResponse::Forbidden().finish();
    }

    let rows =
        sqlx::query("SELECT id, username, role FROM users WHERE id != $1 ORDER BY created_at DESC")
            .bind(requester_id)
            .fetch_all(db.get_ref())
            .await;

    match rows {
        Ok(users) => {
            let list: Vec<serde_json::Value> = users
                .iter()
                .map(|r| {
                    let id: Uuid = r.get("id");
                    let full_name: String = r.get("username");
                    let role: String = r.get("role");
                    serde_json::json!({ "id": id, "full_name": full_name, "role": role })
                })
                .collect();
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
    let target_id = path.into_inner();

    let requester_role = match req.extensions().get::<Role>().copied() {
        Some(role) => role,
        None => return HttpResponse::Unauthorized().finish(),
    };

    let target_role = match Role::from_db(&body.role) {
        Some(role) => role,
        None => {
            return HttpResponse::BadRequest().json(serde_json::json!({ "error": "Invalid role" }));
        }
    };

    let allowed = requester_role.can_edit_role(target_role);

    if !allowed {
        return HttpResponse::Forbidden()
            .json(serde_json::json!({ "error": "Insufficient permissions" }));
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
            .route("/requisites", web::put().to(update_requisites))
            .route("/avatar", web::post().to(upload_avatar))
            .route("/password", web::put().to(change_password))
            .route("/documents", web::get().to(list_documents))
            .route("/documents", web::post().to(upload_document))
            .route("/documents/{id}", web::delete().to(delete_document)),
    );
    cfg.service(
        web::scope("/users")
            .route("/check-username", web::get().to(check_username))
            .route("", web::get().to(get_users))
            .route("/{id}/role", web::put().to(assign_role)),
    );
}
