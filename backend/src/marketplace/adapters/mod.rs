use crate::marketplace::{Marketplace, MpOrder, MpProduct, SyncState};
use anyhow::Result;
use async_trait::async_trait;
use std::any::Any;

#[async_trait]
pub trait MarketplaceAdapter: Send + Sync {
    fn marketplace(&self) -> Marketplace;
    fn as_any(&self) -> &dyn Any;

    async fn fetch_orders(&self, state: &SyncState) -> Result<Vec<MpOrder>>;
    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()>;
    async fn update_prices(&self, products: &[MpProduct]) -> Result<()>;
}

pub mod avito;
pub mod mock;
pub mod ozon;
pub mod wb;
pub mod yandex;

pub use avito::AvitoAdapter;
pub use mock::MockAdapter;
pub use ozon::OzonAdapter;
pub use wb::WbAdapter;
pub use yandex::YandexAdapter;
