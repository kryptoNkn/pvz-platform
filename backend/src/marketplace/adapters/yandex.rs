use async_trait::async_trait;
use anyhow::Result;
use reqwest::Client;
use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpProduct, SyncState};

pub struct YandexAdapter {
    client: Client,
    token: String,
}

impl YandexAdapter {
    pub fn new(client: Client, token: String) -> Self {
        Self { client, token }
    }
}

#[async_trait]
impl MarketplaceAdapter for YandexAdapter {
    fn marketplace(&self) -> Marketplace {
        Marketplace::YandexMarket
    }

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let _resp = self.client
            .get("https://api.partner.market.yandex.ru/endpoint/orders")
            .header("Authorization", format!("Bearer {}", self.token))
            .send()
            .await?;
        Ok(vec![])
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api.partner.market.yandex.ru/endpoint/stocks")
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;
        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let _resp = self.client
            .post("https://api.partner.market.yandex.ru/endpoint/prices")
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&serde_json::json!({ "items": products }))
            .send()
            .await?;
        Ok(())
    }
}
