use serde::{Serialize, Deserialize};
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