use async_trait::async_trait;
use anyhow::Result;
use chrono::Utc;
use rand::Rng;

use crate::marketplace::{MarketplaceAdapter, Marketplace, MpOrder, MpOrderItem, MpProduct, SyncState};
use crate::marketplace::catalog::products_for_marketplace;

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
        let mut rng = rand::thread_rng();
        let seed = now.timestamp_millis().unsigned_abs() as usize;
        let order_count = rng.gen_range(2..=3);

        let mut orders = Vec::with_capacity(order_count);
        let catalog = products_for_marketplace(self.marketplace, seed, 12);

        for order_idx in 0..order_count {
            let item_count = rng.gen_range(2..=4).min(catalog.len().max(1));
            let start = (seed + order_idx * 5) % catalog.len().max(1);
            let mut selected = Vec::with_capacity(item_count);

            for i in 0..item_count {
                if let Some(product) = catalog.get((start + i) % catalog.len().max(1)).cloned() {
                    selected.push(product);
                }
            }

            if selected.is_empty() {
                continue;
            }

            orders.push(MpOrder {
                id: format!("{prefix}-MOCK-{}-{order_idx}", now.timestamp_millis()),
                status: status.clone(),
                created_at: now - chrono::Duration::minutes(order_idx as i64 * 6),
                items: selected
                    .into_iter()
                    .map(|product| MpOrderItem {
                        article: product.article,
                        name: product.name,
                        qty: rng.gen_range(1..=2),
                        price: product.base_price,
                    })
                    .collect(),
            });
        }

        if orders.is_empty() {
            Ok(vec![])
        } else {
            Ok(orders)
        }
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
