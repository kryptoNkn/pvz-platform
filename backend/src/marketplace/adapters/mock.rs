use async_trait::async_trait;
use anyhow::Result;
use chrono::Utc;
use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpOrderItem, MpProduct, SyncState};

pub struct MockAdapter {
    marketplace: Marketplace,
}

impl MockAdapter {
    pub fn new(marketplace: Marketplace) -> Self {
        Self { marketplace }
    }

    fn status_for(&self) -> &'static str {
        match self.marketplace {
            Marketplace::Ozon => "awaiting_packaging",
            Marketplace::Wildberries => "new",
            Marketplace::YandexMarket => "PROCESSING",
            Marketplace::Avito => "created",
        }
    }

    fn prefix_for(&self) -> &'static str {
        match self.marketplace {
            Marketplace::Ozon => "OZ",
            Marketplace::Wildberries => "WB",
            Marketplace::YandexMarket => "YM",
            Marketplace::Avito => "AV",
        }
    }
}

#[async_trait]
impl MarketplaceAdapter for MockAdapter {
    fn marketplace(&self) -> Marketplace {
        self.marketplace
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    async fn fetch_orders(&self, _state: &SyncState) -> Result<Vec<MpOrder>> {
        let now = Utc::now();
        let prefix = self.prefix_for();
        let status = self.status_for().to_string();

        Ok(vec![MpOrder {
            id: format!("{prefix}-MOCK-{}", now.timestamp()),
            status,
            created_at: now,
            items: vec![MpOrderItem {
                article: format!("{prefix}-SKU-001"),
                qty: 1,
                price: 1000,
            }],
        }])
    }

    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()> {
        let prefix = self.prefix_for();
        log::info!("[MOCK {prefix}] update_stocks: {} items", products.len());
        Ok(())
    }

    async fn update_prices(&self, products: &[MpProduct]) -> Result<()> {
        let prefix = self.prefix_for();
        log::info!("[MOCK {prefix}] update_prices: {} items", products.len());
        Ok(())
    }
}
