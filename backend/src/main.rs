mod marketplace;
mod middleware;
mod models;
mod observability;
mod pvz;
mod routes;
mod utils;

use crate::marketplace::MarketplaceService;
use crate::marketplace::adapters::{
    AvitoAdapter, MockAdapter, OzonAdapter, WbAdapter, YandexAdapter,
};
use crate::middleware::auth::Auth;
use crate::middleware::request_id::RequestId;
use crate::middleware::request_metrics::RequestMetrics;
use crate::pvz::AppState;
use actix_cors::Cors;
use actix_files::Files;
use actix_web::{App, HttpServer, web};
use reqwest::Client;
use sqlx::PgPool;
use std::time::Duration;
use std::{
    env,
    sync::{Arc, Mutex},
};
use tracing_actix_web::TracingLogger;
use tracing_subscriber::EnvFilter;

fn require_env(name: &str) -> String {
    env::var(name).unwrap_or_else(|_| panic!("Missing required env var: {name}"))
}

fn mock_marketplace_service() -> MarketplaceService {
    MarketplaceService::new(vec![
        Box::new(MockAdapter::new(crate::marketplace::Marketplace::Ozon)),
        Box::new(MockAdapter::new(
            crate::marketplace::Marketplace::Wildberries,
        )),
        Box::new(MockAdapter::new(
            crate::marketplace::Marketplace::YandexMarket,
        )),
        Box::new(MockAdapter::new(crate::marketplace::Marketplace::Avito)),
    ])
}

fn marketplace_service(http_client: &Client) -> MarketplaceService {
    let mock_mode = env::var("MP_MOCK_MODE")
        .ok()
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    if mock_mode {
        tracing::info!("marketplace mock mode enabled");
        return mock_marketplace_service();
    }

    let missing_envs = [
        ("OZON_API_KEY", env::var("OZON_API_KEY").ok()),
        ("OZON_CLIENT_ID", env::var("OZON_CLIENT_ID").ok()),
        ("WB_TOKEN", env::var("WB_TOKEN").ok()),
        ("YM_TOKEN", env::var("YM_TOKEN").ok()),
        ("YM_BUSINESS_ID", env::var("YM_BUSINESS_ID").ok()),
        ("AVITO_ACCESS_TOKEN", env::var("AVITO_ACCESS_TOKEN").ok()),
    ]
    .into_iter()
    .filter_map(|(name, value)| value.is_none().then_some(name))
    .collect::<Vec<_>>();

    if !missing_envs.is_empty() {
        tracing::warn!(
            missing_envs = ?missing_envs,
            "marketplace credentials are missing; falling back to mock adapters"
        );
        return mock_marketplace_service();
    }

    let ozon_api_key = require_env("OZON_API_KEY");
    let ozon_client_id = require_env("OZON_CLIENT_ID");
    let wb_token = require_env("WB_TOKEN");
    let ym_token = require_env("YM_TOKEN");
    let ym_business_id = require_env("YM_BUSINESS_ID");
    let avito_access_token = require_env("AVITO_ACCESS_TOKEN");

    MarketplaceService::new(vec![
        Box::new(OzonAdapter::new(
            http_client.clone(),
            ozon_api_key,
            ozon_client_id,
        )),
        Box::new(WbAdapter::new(http_client.clone(), wb_token)),
        Box::new(YandexAdapter::new(
            http_client.clone(),
            ym_token,
            ym_business_id,
        )),
        Box::new(AvitoAdapter::new(http_client.clone(), avito_access_token)),
    ])
}

async fn seed_test_accounts(pool: &PgPool) {
    let _ = sqlx::query(
        r#"
        INSERT INTO users (id, username, email, password_hash, role)
        VALUES
            (
                '11111111-1111-1111-1111-111111111111',
                'Operator Test',
                '90000000001',
                '$argon2id$v=19$m=4096,t=3,p=1$hawjkAuZOR9+s12QtlQvuA$rMixsE7Q37THJ+udIWi/D3HZZJkfw8nGsn1RKDBSJdo',
                'operator'
            ),
            (
                '22222222-2222-2222-2222-222222222222',
                'Admin Test',
                '90000000002',
                '$argon2id$v=19$m=4096,t=3,p=1$EPlaDY0bgUWqwOKgB+3BvQ$Wz4NgLLsJgZrSYA9GgKqrg4TrPfmDg2xmn8ZjiFTUKE',
                'admin'
            ),
            (
                '33333333-3333-3333-3333-333333333333',
                'Owner Test',
                '90000000003',
                '$argon2id$v=19$m=4096,t=3,p=1$ZqpZsOXdWDHWGJV+scRlXA$teIc/slDbax3GC0vv4NUzH6FSfjhxbGFrYX01Nq2RNo',
                'owner'
            )
        ON CONFLICT (email) DO NOTHING
        "#
    )
    .execute(pool)
    .await;
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn,reqwest=warn"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .json()
        .init();

    let database_url = require_env("DATABASE_URL");
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to DB");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");

    seed_test_accounts(&pool).await;

    let app_state = Arc::new(Mutex::new(AppState::new()));
    let http_client = Client::new();

    let mp_service = marketplace_service(&http_client);

    let mp_service = std::sync::Arc::new(mp_service);

    let pool_for_worker = pool.clone();
    let mp_for_worker = mp_service.clone();
    let sync_interval_secs: u64 = env::var("MP_SYNC_INTERVAL_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(300);
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(sync_interval_secs));
        loop {
            interval.tick().await;
            let state = crate::marketplace::SyncState::default();
            if let Err(e) = mp_for_worker
                .sync_orders_all(&pool_for_worker, &state)
                .await
            {
                tracing::error!(error = %e, "marketplace worker sync_orders error");
            }
        }
    });

    HttpServer::new(move || {
        App::new()
            .wrap(TracingLogger::default())
            .wrap(RequestMetrics)
            .wrap(RequestId)
            .wrap(Cors::permissive())
            .wrap(Auth)
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(app_state.clone()))
            .app_data(web::Data::new(mp_service.clone()))
            .app_data(web::JsonConfig::default().limit(4096))
            .service(
                web::scope("/api")
                    .service(Files::new("/uploads", "uploads").use_last_modified(true))
                    .configure(routes::auth::init_routes)
                    .configure(routes::user::init_routes)
                    .configure(routes::pvz::init_routes)
                    .configure(routes::notifications::init_routes)
                    .configure(routes::marketplace::init_routes)
                    .configure(routes::operations::init_routes)
                    .configure(routes::health::init_routes)
                    .configure(routes::metrics::init_routes),
            )
    })
    .bind(format!(
        "0.0.0.0:{}",
        env::var("PORT")
            .ok()
            .and_then(|v| v.parse::<u16>().ok())
            .unwrap_or(8080)
    ))?
    .run()
    .await
}
