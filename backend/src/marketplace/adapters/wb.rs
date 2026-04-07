use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpProduct, SyncState};

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

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let _resp = self.client
            .get("https://suppliers-api.wildberries.ru/endpoint/orders")
            .header("Authorization", &self.token)
            .send()
            .await?;
        Ok(vec![])
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://suppliers-api.wildberries.ru/endpoint/stocks")
            .header("Authorization", &self.token)
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;
        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://suppliers-api.wildberries.ru/endpoint/prices")
            .header("Authorization", &self.token)
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;
        Ok(())
    }
}
