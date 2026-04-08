use anyhow::Result;
use sqlx::{PgPool, Row, Postgres, Transaction};
use crate::marketplace::{MarketplaceAdapter, MpProduct, MpOrder, Marketplace, SyncState};
use crate::marketplace::adapters::WbAdapter;

pub struct MarketplaceService {
    adapters: Vec<Box<dyn MarketplaceAdapter>>,
}

impl MarketplaceService {
    pub fn new(adapters: Vec<Box<dyn MarketplaceAdapter>>) -> Self {
        Self { adapters }
    }

    pub async fn sync_orders_all(&self, pool: &PgPool, state: &SyncState) -> Result<()> {
        for adapter in &self.adapters {
            let orders = adapter.fetch_orders(state).await?;
            let mp = adapter.marketplace();
            self.save_orders(pool, mp, &orders).await?;
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

    fn wb_adapter(&self) -> Option<&WbAdapter> {
        self.adapters
            .iter()
            .find_map(|a| a.as_any().downcast_ref::<WbAdapter>())
    }

    pub async fn wb_sync_cards(&self, pool: &PgPool) -> Result<()> {
        if let Some(wb) = self.wb_adapter() {
            wb.sync_cards(pool).await?;
        }
        Ok(())
    }

    pub async fn wb_push_prices_from_db(&self, pool: &PgPool) -> Result<()> {
        let wb = match self.wb_adapter() {
            Some(v) => v,
            None => return Ok(()),
        };

        let rows = sqlx::query(
            r#"
            SELECT wb_nm_id, name, base_price
            FROM products
            WHERE wb_nm_id IS NOT NULL
            "#
        )
        .fetch_all(pool)
        .await?;

        let products: Vec<MpProduct> = rows.iter().filter_map(|r| {
            let nm_id: i64 = r.get("wb_nm_id");
            let name: String = r.get("name");
            let price: i64 = r.get("base_price");
            Some(MpProduct {
                article: nm_id.to_string(),
                name,
                price,
                stock: 0,
            })
        }).collect();

        if !products.is_empty() {
            wb.update_prices(&products).await?;
        }
        Ok(())
    }

    pub async fn wb_push_stocks_from_db(&self, pool: &PgPool) -> Result<()> {
        let wb = match self.wb_adapter() {
            Some(v) => v,
            None => return Ok(()),
        };

        let rows = sqlx::query(
            r#"
            SELECT p.wb_chrt_id, p.name, ps.stock
            FROM products p
            JOIN product_stocks ps ON ps.product_id = p.id
            WHERE ps.marketplace = 'WB' AND p.wb_chrt_id IS NOT NULL
            "#
        )
        .fetch_all(pool)
        .await?;

        let products: Vec<MpProduct> = rows.iter().filter_map(|r| {
            let chrt_id: i64 = r.get("wb_chrt_id");
            let name: String = r.get("name");
            let stock: i32 = r.get("stock");
            Some(MpProduct {
                article: chrt_id.to_string(),
                name,
                price: 0,
                stock,
            })
        }).collect();

        if !products.is_empty() {
            wb.update_stocks(&products).await?;
        }
        Ok(())
    }

    async fn save_orders(
        &self,
        pool: &PgPool,
        marketplace: Marketplace,
        orders: &[MpOrder],
    ) -> Result<()> {
        let mut tx: Transaction<Postgres> = pool.begin().await?;
        let mp_str = marketplace_to_str(marketplace);

        for o in orders {
            let order_id: uuid::Uuid = sqlx::query_scalar(
                r#"
                INSERT INTO marketplace_orders (marketplace, external_id, status, created_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (marketplace, external_id)
                DO UPDATE SET
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING id
                "#
            )
            .bind(mp_str)
            .bind(&o.id)
            .bind(&o.status)
            .bind(o.created_at)
            .fetch_one(&mut *tx)
            .await?;

            for item in &o.items {
                let product_id: uuid::Uuid = sqlx::query_scalar(
                    r#"
                    INSERT INTO products (article, name, base_price)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (article)
                    DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                    "#
                )
                .bind(&item.article)
                .bind(&item.article)
                .bind(item.price)
                .fetch_one(&mut *tx)
                .await?;

                sqlx::query(
                    r#"
                    INSERT INTO marketplace_order_items (order_id, product_id, quantity, price)
                    VALUES ($1, $2, $3, $4)
                    "#
                )
                .bind(order_id)
                .bind(product_id)
                .bind(item.qty)
                .bind(item.price)
                .execute(&mut *tx)
                .await?;
            }
        }

        tx.commit().await?;
        Ok(())
    }
}

fn marketplace_to_str(mp: Marketplace) -> &'static str {
    match mp {
        Marketplace::Ozon => "Ozon",
        Marketplace::Wildberries => "WB",
        Marketplace::YandexMarket => "Яндекс Маркет",
        Marketplace::Avito => "Авито",
    }
}
