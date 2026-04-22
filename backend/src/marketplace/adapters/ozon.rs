use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpOrderItem, MpProduct, SyncState};

pub struct OzonAdapter {
    client: Client,
    api_key: String,
    client_id: String,
}

impl OzonAdapter {
    pub fn new(client: Client, api_key: String, client_id: String) -> Self {
        Self { client, api_key, client_id }
    }
}

#[async_trait]
impl MarketplaceAdapter for OzonAdapter {
    fn marketplace(&self) -> Marketplace {
        Marketplace::Ozon
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    async fn fetch_orders(&self, state: &SyncState) -> Result<Vec<MpOrder>> {
        let since = state.last_orders_sync_at
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| "2024-01-01T00:00:00.000Z".to_string());
        let to = chrono::Utc::now().to_rfc3339();

        let resp = self.client
            .post("https://api-seller.ozon.ru/v3/posting/fbs/list")
            .header("Client-Id", &self.client_id)
            .header("Api-Key", &self.api_key)
            .json(&serde_json::json!({
                "dir": "ASC",
                "filter": {
                    "since": since,
                    "to": to
                },
                "limit": 100,
                "offset": 0
            }))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;

        let empty_postings = Vec::new();
        let postings = resp["result"]["postings"].as_array().unwrap_or(&empty_postings);
        let orders = postings.iter().map(|p| {
            let empty_items = Vec::new();
            let items = p["products"].as_array().unwrap_or(&empty_items);
            MpOrder {
                id: p["posting_number"].as_str().unwrap_or_default().to_string(),
                status: p["status"].as_str().unwrap_or("unknown").to_string(),
                created_at: p["created_at"]
                    .as_str()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or_else(|| chrono::Utc::now()),
                items: items.iter().map(|it| {
                    let article = it["offer_id"].as_str().unwrap_or_default().to_string();
                    let name = it["name"]
                        .as_str()
                        .or_else(|| it["offer_name"].as_str())
                        .unwrap_or(&article)
                        .to_string();
                    MpOrderItem {
                        article,
                        name,
                        qty: it["quantity"].as_i64().unwrap_or(0) as i32,
                        price: it["price"].as_i64().unwrap_or(0),
                    }
                }).collect(),
            }
        }).collect();

        Ok(orders)
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api-seller.ozon.ru/v2/products/stocks")
            .header("Client-Id", &self.client_id)
            .header("Api-Key", &self.api_key)
            .json(&serde_json::json!({
                "stocks": products.iter().map(|p| {
                    serde_json::json!({
                        "offer_id": p.article,
                        "stock": p.stock
                    })
                }).collect::<Vec<_>>()
            }))
            .send()
            .await?;
        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api-seller.ozon.ru/v1/product/import/prices")
            .header("Client-Id", &self.client_id)
            .header("Api-Key", &self.api_key)
            .json(&serde_json::json!({
                "prices": products.iter().map(|p| {
                    serde_json::json!({
                        "offer_id": p.article,
                        "price": p.price,
                        "old_price": "0",
                        "currency_code": "RUB",
                        "vat": "0.1"
                    })
                }).collect::<Vec<_>>()
            }))
            .send()
            .await?;
        Ok(())
    }
}
