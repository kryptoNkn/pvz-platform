use async_trait::async_trait;
use anyhow::Result;
use std::any::Any;
use crate::marketplace::{Marketplace, MpOrder, MpProduct, SyncState};

#[async_trait]
pub trait MarketplaceAdapter: Send + Sync  {
    fn marketplace(&self) -> Marketplace;
    fn as_any(&self) -> &dyn Any;

    async fn fetch_orders(&self, state: &SyncState) -> Result<Vec<MpOrder>>;
    async fn update_stocks(&self, products: &[MpProduct]) -> Result<()>;
    async fn update_prices(&self, products: &[MpProduct]) -> Result<()>;
}

pub mod ozon;
pub mod wb;
pub mod yandex;
pub mod avito;
pub mod mock;

pub use ozon::OzonAdapter;
pub use wb::WbAdapter;
pub use yandex::YandexAdapter;
pub use avito::AvitoAdapter;
pub use mock::MockAdapter;
