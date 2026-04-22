use once_cell::sync::Lazy;
use serde::Deserialize;

use crate::marketplace::Marketplace;

#[derive(Debug, Clone, Deserialize)]
pub struct CatalogProduct {
    pub article: String,
    pub name: String,
    pub base_price: i64,
    pub category: String,
}

static PRODUCT_CATALOG: Lazy<Vec<CatalogProduct>> = Lazy::new(|| {
    serde_json::from_str(include_str!("products_catalog.json"))
        .expect("failed to parse products catalog json")
});

pub fn all_products() -> &'static [CatalogProduct] {
    PRODUCT_CATALOG.as_slice()
}

pub fn products_for_marketplace(
    marketplace: Marketplace,
    seed: usize,
    count: usize,
) -> Vec<CatalogProduct> {
    let catalog = all_products();
    if catalog.is_empty() || count == 0 {
        return Vec::new();
    }

    let mp_offset = match marketplace {
        Marketplace::Ozon => 0,
        Marketplace::Wildberries => 3,
        Marketplace::YandexMarket => 6,
        Marketplace::Avito => 9,
    };

    let start = (seed + mp_offset) % catalog.len();
    (0..count)
        .map(|i| catalog[(start + i) % catalog.len()].clone())
        .collect()
}
