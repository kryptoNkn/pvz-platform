use actix_web::web;
use sqlx::PgPool;
use sqlx::Row;
use uuid::Uuid;
use chrono::{NaiveDateTime, Utc};
use jsonwebtoken::{decode, DecodingKey, Validation};
use crate::utils::jwt::RefreshClaims;
use crate::utils::tokens::{
    generate_access_token,
    generate_refresh_token,
    get_jwt_secret,
};

pub async fn save_refresh_token(
    db: web::Data<PgPool>,
    jti: Uuid,
    user_id: Uuid,
    expires_at: NaiveDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (jti, user_id, expires_at)
        VALUES ($1, $2, $3)
        "#
    )
        .bind(jti)
        .bind(user_id)
        .bind(expires_at)
        .execute(db.get_ref())
        .await?;

    Ok(())
}

pub async fn validate_refresh_token(
    db: web::Data<PgPool>,
    jti: Uuid,
) -> Result<Uuid, sqlx::Error> {
    let record = sqlx::query(
        r#"
        SELECT user_id
        FROM refresh_tokens
        WHERE jti = $1
          AND revoked = FALSE
          AND expires_at > NOW()
        "#
    )
        .bind(jti)
        .fetch_optional(db.get_ref())
        .await?;

    let record = record.ok_or(sqlx::Error::RowNotFound)?;
    let user_id: Uuid = record.get("user_id");

    Ok(user_id)
}

pub async fn revoke_refresh_token(
    db: web::Data<PgPool>,
    jti: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE refresh_tokens
        SET revoked = TRUE
        WHERE jti = $1
        "#
    )
        .bind(jti)
        .execute(db.get_ref())
        .await?;

    Ok(())
}

pub fn decode_refresh_token(
    token: &str,
    secret: &[u8],
) -> Result<RefreshClaims, jsonwebtoken::errors::Error> {
    let data = decode::<RefreshClaims>(
        token,
        &DecodingKey::from_secret(secret),
        &Validation::default(),
    )?;

    Ok(data.claims)
}

pub async fn rotate_refresh_token(
    db: web::Data<PgPool>,
    refresh_token: &str,
) -> Result<(String, String), ()> {
    let claims = decode_refresh_token(
        refresh_token,
        &get_jwt_secret(),
    )
        .map_err(|_| ())?;

    let user_id = validate_refresh_token(
        db.clone(),
        claims.jti,
    )
        .await
        .map_err(|_| ())?;

    revoke_refresh_token(
        db.clone(),
        claims.jti,
    )
        .await
        .map_err(|_| ())?;

    let access_token = generate_access_token(user_id).map_err(|_| ())?;
    let (new_jti, new_refresh_token) = generate_refresh_token(user_id).map_err(|_| ())?;

    save_refresh_token(
        db,
        new_jti,
        user_id,
        Utc::now().naive_utc() + chrono::Duration::days(30),
    )
        .await
        .map_err(|_| ())?;

    Ok((access_token, new_refresh_token))
}

pub async fn logout(
    db: web::Data<PgPool>,
    refresh_token: &str,
) -> Result<(), ()> {
    let claims = decode_refresh_token(
        refresh_token,
        &get_jwt_secret(),
    )
        .map_err(|_| ())?;

    revoke_refresh_token(db, claims.jti).await.map_err(|_| ())?;

    Ok(())
}