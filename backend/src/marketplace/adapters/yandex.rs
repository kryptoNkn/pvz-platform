use crate::marketplace::{Marketplace, MarketplaceAdapter, MpOrder, MpProduct, SyncState};
use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;

pub struct YandexAdapter {
    client: Client,
    token: String,
    business_id: String,
}

impl YandexAdapter {
    pub fn new(client: Client, token: String, business_id: String) -> Self {
        Self {
            client,
            token,
            business_id,
        }
    }
}

#[async_trait]
impl MarketplaceAdapter for YandexAdapter {
    fn marketplace(&self) -> Marketplace {
        Marketplace::YandexMarket
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let _resp = self
            .client
            .post(format!(
                "https://api.partner.market.yandex.ru/v1/businesses/{}/orders",
                self.business_id
            ))
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&serde_json::json!({
                "fromDate": "2026-01-01",
                "toDate": "2026-01-01"
            }))
            .send()
            .await?;

        Ok(vec![])
    }

    async fn update_stocks(&self, _products: &[MpProduct]) -> Result<()> {
        Ok(())
    }

    async fn update_prices(&self, _products: &[MpProduct]) -> Result<()> {
        Ok(())
    }
}
