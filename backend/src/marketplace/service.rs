use anyhow::Result;
use crate::marketplace::{MarketplaceAdapter, MpProduct, SyncState};

pub struct MarketplaceService {
    adapters: Vec<Box<dyn MarketplaceAdapter>>,
}

impl MarketplaceService {
    pub fn new(adapters: Vec<Box<dyn MarketplaceAdapter>>) -> Self {
        Self { adapters }
    }

    pub async fn sync_orders_all(&self, state: &SyncState) -> Result<()> {
        for adapter in &self.adapters {
            let _orders = adapter.fetch_orders(state).await?;
        }
        Ok(())
    }

    pub async fn push_stocks_all(&self, products: &[MpProduct]) -> Result<()> {
        for adapter in &self.adapters {
            adapter.update_stocks(products).await?;
        }
        Ok(())
    }

    pub async fn push_prices_all(&self, products: &[MpProduct]) -> Result<()> {
        for adapter in &self.adapters {
            adapter.update_prices(products).await?;
        }
        Ok(())
    }
}
