use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub full_name: String,
    pub phone: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterUser {
    pub full_name: String,
    pub phone: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginUser {
    pub phone: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProfile {
    pub full_name: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ScheduleDay {
    pub day_index: i16,
    pub is_day_off: bool,
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, Deserialize)]
pub struct ScheduleDayInput {
    pub day_index: i16,
    pub is_day_off: bool,
    pub start_time: String,
    pub end_time: String,
}
