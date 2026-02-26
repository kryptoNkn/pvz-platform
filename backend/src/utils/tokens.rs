use std::env;
use jsonwebtoken::{EncodingKey, encode, Header, errors::Error as JwtError};
use uuid::Uuid;
use crate::utils::jwt::{AccessClaims, RefreshClaims, access_exp, refresh_exp};

pub fn get_jwt_secret() -> Vec<u8> {
    env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set in .env")
        .into_bytes()
}

pub fn generate_access_token(user_id: Uuid) -> Result<String, JwtError> {
    let claims = AccessClaims {
        sub: user_id,
        exp: access_exp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&get_jwt_secret()),
    )
}

pub fn generate_refresh_token(user_id: Uuid) -> Result<(Uuid, String), JwtError> {
    let jti = Uuid::new_v4();
    let claims = RefreshClaims {
        sub: user_id,
        jti,
        exp: refresh_exp(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(&get_jwt_secret()),
    )?;

    Ok((jti, token))
}