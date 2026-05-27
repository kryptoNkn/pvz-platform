use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;
use sqlx::PgPool;

use crate::marketplace::{
    Marketplace, MarketplaceAdapter, MpOrder, MpOrderItem, MpProduct, SyncState,
};

pub struct WbAdapter {
    client: Client,
    token: String,
}

impl WbAdapter {
    pub fn new(client: Client, token: String) -> Self {
        Self { client, token }
    }
}

#[async_trait]
impl MarketplaceAdapter for WbAdapter {
    fn marketplace(&self) -> Marketplace {
        Marketplace::Wildberries
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let resp = self
            .client
            .get("https://marketplace-api.wildberries.ru/api/v3/dbw/orders/new")
            .header("Authorization", &self.token)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;

        let orders = resp["orders"]
            .as_array()
            .unwrap_or(&vec![])
            .iter()
            .map(|o| {
                let article = o["article"].as_str().unwrap_or_default().to_string();
                let price = o["price"].as_i64().unwrap_or(0);
                let status = o["supplierStatus"].as_str().unwrap_or("new").to_string();
                let created_at = o["createdAt"]
                    .as_str()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or_else(|| chrono::Utc::now());

                let items = if article.is_empty() {
                    vec![]
                } else {
                    vec![MpOrderItem {
                        article,
                        name: o["name"].as_str().unwrap_or("WB product").to_string(),
                        qty: 1,
                        price,
                    }]
                };

                MpOrder {
                    id: o["id"].as_i64().map(|v| v.to_string()).unwrap_or_default(),
                    status,
                    created_at,
                    items,
                }
            })
            .collect();

        Ok(orders)
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let warehouse_id = 123;
        let _resp = self
            .client
            .put(format!(
                "https://marketplace-api.wildberries.ru/api/v3/stocks/{}",
                warehouse_id
            ))
            .header("Authorization", &self.token)
            .json(&serde_json::json!({
                "stocks": products.iter().map(|p| {
                    serde_json::json!({
                        "chrtId": p.article,
                        "amount": p.stock
                    })
                }).collect::<Vec<_>>()
            }))
            .send()
            .await?;
        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self
            .client
            .post("https://discounts-prices-api.wildberries.ru/api/v2/upload/task")
            .header("Authorization", &self.token)
            .json(&serde_json::json!({
                "data": products.iter().map(|p| {
                    serde_json::json!({
                        "nmID": p.article,
                        "price": p.price,
                        "discount": 0
                    })
                }).collect::<Vec<_>>()
            }))
            .send()
            .await?;
        Ok(())
    }
}

impl WbAdapter {
    pub async fn sync_cards(&self, pool: &PgPool) -> Result<()> {
        let mut cursor_updated_at: Option<String> = None;
        let mut cursor_nm_id: Option<i64> = None;
        let limit: i64 = 100;

        loop {
            let cursor = if let (Some(updated_at), Some(nm_id)) = (&cursor_updated_at, cursor_nm_id)
            {
                serde_json::json!({
                    "limit": limit,
                    "updatedAt": updated_at,
                    "nmID": nm_id
                })
            } else {
                serde_json::json!({ "limit": limit })
            };

            let resp = self
                .client
                .post("https://content-api.wildberries.ru/content/v2/get/cards/list")
                .header("Authorization", &self.token)
                .json(&serde_json::json!({
                    "settings": {
                        "cursor": cursor,
                        "filter": { "withPhoto": -1 }
                    }
                }))
                .send()
                .await?
                .json::<serde_json::Value>()
                .await?;

            let cards = resp["cards"].as_array().cloned().unwrap_or_default();
            for card in cards {
                let vendor_code = card["vendorCode"].as_str().unwrap_or_default();
                if vendor_code.is_empty() {
                    continue;
                }

                let nm_id = card["nmID"].as_i64();
                let chrt_id = card["sizes"]
                    .as_array()
                    .and_then(|sizes| sizes.get(0))
                    .and_then(|s| s["chrtID"].as_i64());
                let title = card["title"].as_str().unwrap_or("WB product");

                sqlx::query(
                    r#"
                    INSERT INTO products (article, name, base_price, wb_nm_id, wb_chrt_id)
                    VALUES ($1, $2, 0, $3, $4)
                    ON CONFLICT (article)
                    DO UPDATE SET
                        name = EXCLUDED.name,
                        wb_nm_id = EXCLUDED.wb_nm_id,
                        wb_chrt_id = EXCLUDED.wb_chrt_id
                    "#,
                )
                .bind(vendor_code)
                .bind(title)
                .bind(nm_id)
                .bind(chrt_id)
                .execute(pool)
                .await?;
            }

            let total = resp["cursor"]["total"].as_i64().unwrap_or(0);
            if total < limit {
                break;
            }
            cursor_updated_at = resp["cursor"]["updatedAt"].as_str().map(|s| s.to_string());
            cursor_nm_id = resp["cursor"]["nmID"].as_i64();
            if cursor_updated_at.is_none() || cursor_nm_id.is_none() {
                break;
            }
        }

        Ok(())
    }
}
