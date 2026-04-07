use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpProduct, SyncState};

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

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let _resp = self.client
            .post("https://api.ozon.ru/endpoint/orders")
            .header("Client-Id", &self.client_id)
            .header("Api-Key", &self.api_key)
            .json(&serde_json::json!({ "since": _state.last_orders_sync_at }))
            .send()
            .await?;

        Ok(vec![])
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api.ozon.ru/endpoint/stocks")
            .header("Client-Id", &self.client_id)
            .header("Api-Key", &self.api_key)
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;

        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api.ozon.ru/endpoint/prices")
            .header("Client-Id", &self.client_id)
            .header("Api-Key", &self.api_key)
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;

        Ok(())
    }
}
