use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;

use crate::marketplace::{Marketplace, MarketplaceAdapter, MpOrder, MpProduct, SyncState};

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

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        Ok(vec![])
    }

    async fn update_stocks(&self, _products: &[MpProduct]) -> Result<()> {
        Ok(())
    }

    async fn update_prices(&self, _products: &[MpProduct]) -> Result<()> {
        Ok(())
    }
}
