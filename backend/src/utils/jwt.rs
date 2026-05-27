use chrono::Duration;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub: Uuid,
    pub exp: usize,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshClaims {
    pub sub: Uuid,
    pub exp: usize,
    pub jti: Uuid,
}

pub fn access_exp() -> usize {
    (Utc::now() + Duration::minutes(15)).timestamp() as usize
}

pub fn refresh_exp() -> usize {
    (Utc::now() + Duration::days(30)).timestamp() as usize
}
