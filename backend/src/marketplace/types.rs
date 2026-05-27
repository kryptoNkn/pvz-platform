use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MpProduct {
    pub article: String,
    pub name: String,
    pub price: i64,
    pub stock: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MpOrder {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub status: String,
    pub items: Vec<MpOrderItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MpOrderItem {
    pub article: String,
    pub name: String,
    pub qty: i32,
    pub price: i64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Marketplace {
    Ozon,
    Wildberries,
    YandexMarket,
    Avito,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SyncState {
    pub last_orders_sync_at: Option<DateTime<Utc>>,
    pub last_stock_sync_at: Option<DateTime<Utc>>,
}
