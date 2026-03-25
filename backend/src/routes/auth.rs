use actix_web::{web, HttpResponse, Responder};
use chrono::Utc;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use crate::models::{LoginUser, RegisterUser};
use crate::utils::{
    errors::validation_error_to_response,
    password::{hash_password, verify_password},
    refresh_tokens::{save_refresh_token},
    tokens::{generate_access_token, generate_refresh_token, get_jwt_secret},
    validation::{validate_login_input, validate_register_input},
    cookies::{access_cookie, refresh_cookie},
};

pub async fn register_user(
    db: web::Data<PgPool>,
    new_user: web::Json<RegisterUser>,
) -> impl Responder {
    let user = new_user.into_inner();

    if let Err(errors) = validate_register_input(&user) {
        return validation_error_to_response(errors);
    }

    let password_hash = match hash_password(&user.password) {
        Ok(hash) => hash,
        Err(e) => {
            log::error!("Hash error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let user_id = Uuid::new_v4();
    let role = "operator".to_string();

    let result = sqlx::query(
        r#"
        INSERT INTO users (id, username, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        "#
    )
    .bind(user_id)
    .bind(&user.full_name)
    .bind(&user.phone)
    .bind(&password_hash)
    .bind(&role)
    .execute(db.get_ref())
    .await;

    match result {
        Ok(_) => {
            // генерация токенов
            let access_token = match generate_access_token(user_id) {
                Ok(token) => token,
                Err(e) => {
                    log::error!("Access token error: {e}");
                    return HttpResponse::InternalServerError().finish();
                }
            };

            let (jti, refresh_token) = match generate_refresh_token(user_id) {
                Ok(data) => data,
                Err(e) => {
                    log::error!("Refresh token error: {e}");
                    return HttpResponse::InternalServerError().finish();
                }
            };

            if let Err(e) = save_refresh_token(
                db.clone(),
                jti,
                user_id,
                Utc::now().naive_utc() + chrono::Duration::days(30),
            ).await
            {
                log::error!("Saving refresh token failed: {e}");
                return HttpResponse::InternalServerError().finish();
            }

            HttpResponse::Ok()
                .cookie(access_cookie(access_token.clone()))
                .cookie(refresh_cookie(refresh_token.clone()))
                .json(serde_json::json!({
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }))
        },
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn login_user(
    db: web::Data<PgPool>,
    user: web::Json<LoginUser>,
) -> impl Responder {
    let user = user.into_inner();

    if let Err(errors) = validate_login_input(&user) {
        return validation_error_to_response(errors);
    }

    let db_user = match sqlx::query(
        r#"
        SELECT id, password_hash, role
        FROM users
        WHERE email = regexp_replace($1, '[^0-9]', '', 'g')
        "#
    )
    .bind(&user.phone)
    .fetch_optional(db.get_ref())
    .await
    {
        Ok(Some(user_row)) => user_row,
        Ok(None) => return HttpResponse::Unauthorized().body("Invalid credentials"),
        Err(e) => {
            log::error!("DB error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let user_id: Uuid = db_user.get("id");
    let password_hash: String = db_user.get("password_hash");

    if !verify_password(&password_hash, &user.password) {
        return HttpResponse::Unauthorized().body("Invalid credentials");
    }

    let access_token = match generate_access_token(user_id) {
        Ok(token) => token,
        Err(e) => {
            log::error!("Access token error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let (jti, refresh_token) = match generate_refresh_token(user_id) {
        Ok(data) => data,
        Err(e) => {
            log::error!("Refresh token error: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    if let Err(e) = save_refresh_token(
        db.clone(),
        jti,
        user_id,
        Utc::now().naive_utc() + chrono::Duration::days(30),
    ).await
    {
        log::error!("Saving refresh token failed: {e}");
        return HttpResponse::InternalServerError().finish();
    }

    HttpResponse::Ok()
        .cookie(access_cookie(access_token.clone()))
        .cookie(refresh_cookie(refresh_token.clone()))
        .json(serde_json::json!({
            "access_token": access_token,
            "refresh_token": refresh_token
        }))
}

#[derive(serde::Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

pub async fn refresh_token(
    db: web::Data<PgPool>,
    body: web::Json<RefreshRequest>,
) -> impl Responder {
    let claims = match crate::utils::refresh_tokens::decode_refresh_token(
        &body.refresh_token,
        &get_jwt_secret(),
    ) {
        Ok(c) => c,
        Err(_) => return HttpResponse::Unauthorized().finish(),
    };

    if let Err(_) = crate::utils::refresh_tokens::validate_refresh_token(db.clone(), claims.jti).await {
        return HttpResponse::Unauthorized().finish();
    }

    let access_token = generate_access_token(claims.sub).unwrap();
    let (jti, refresh_token) = generate_refresh_token(claims.sub).unwrap();

    crate::utils::refresh_tokens::save_refresh_token(
        db.clone(),
        jti,
        claims.sub,
        Utc::now().naive_utc() + chrono::Duration::days(30)
    ).await.unwrap();

    HttpResponse::Ok()
        .cookie(access_cookie(access_token.clone()))
        .cookie(refresh_cookie(refresh_token.clone()))
        .json(serde_json::json!({
            "access_token": access_token,
            "refresh_token": refresh_token
        }))
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/register", web::post().to(register_user))
            .route("/login", web::post().to(login_user))
            .route("/refresh", web::post().to(refresh_token))
    );
}