use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpProduct, SyncState};

pub struct AvitoAdapter {
    client: Client,
    token: String,
}

impl AvitoAdapter {
    pub fn new(client: Client, token: String) -> Self {
        Self { client, token }
    }
}

#[async_trait]
impl MarketplaceAdapter for AvitoAdapter {
    fn marketplace(&self) -> Marketplace {
        Marketplace::Avito
    }

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let _resp = self.client
            .get("https://api.avito.ru/endpoint/orders")
            .header("Authorization", format!("Bearer {}", self.token))
            .send()
            .await?;
        Ok(vec![])
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api.avito.ru/endpoint/stocks")
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;
        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api.avito.ru/endpoint/prices")
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;
        Ok(())
    }
}
