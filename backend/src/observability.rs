use once_cell::sync::Lazy;
use prometheus::{
    register_counter_vec, register_histogram_vec, register_int_gauge, CounterVec, HistogramVec,
    IntGauge,
};
use std::time::Instant;

pub static SYNC_ORDERS_TOTAL: Lazy<CounterVec> = Lazy::new(|| {
    register_counter_vec!(
        "marketplace_sync_orders_total",
        "Total number of orders processed during sync, labeled by marketplace and status",
        &["marketplace", "status"]
    )
    .expect("failed to register marketplace_sync_orders_total")
});

pub static SYNC_ERRORS_TOTAL: Lazy<CounterVec> = Lazy::new(|| {
    register_counter_vec!(
        "marketplace_sync_errors_total",
        "Total number of sync errors, labeled by marketplace and stage",
        &["marketplace", "stage"]
    )
    .expect("failed to register marketplace_sync_errors_total")
});

pub static SYNC_DURATION_SECONDS: Lazy<HistogramVec> = Lazy::new(|| {
    register_histogram_vec!(
        "marketplace_sync_duration_seconds",
        "Sync duration in seconds, labeled by marketplace and operation",
        &["marketplace", "operation"]
    )
    .expect("failed to register marketplace_sync_duration_seconds")
});

pub static HTTP_REQUESTS_IN_FLIGHT: Lazy<IntGauge> = Lazy::new(|| {
    register_int_gauge!(
        "http_requests_in_flight",
        "Number of HTTP requests currently in flight"
    )
    .expect("failed to register http_requests_in_flight")
});

pub static SYNC_LAST_SUCCESS_TS: Lazy<IntGauge> = Lazy::new(|| {
    register_int_gauge!(
        "marketplace_sync_last_success_timestamp",
        "Unix timestamp of the last successful marketplace sync"
    )
    .expect("failed to register marketplace_sync_last_success_timestamp")
});

pub struct SyncTimer {
    started_at: Instant,
    marketplace: &'static str,
    operation: &'static str,
}

impl SyncTimer {
    pub fn start(marketplace: &'static str, operation: &'static str) -> Self {
        Self {
            started_at: Instant::now(),
            marketplace,
            operation,
        }
    }

    pub fn observe_success(self) {
        let elapsed = self.started_at.elapsed().as_secs_f64();
        SYNC_DURATION_SECONDS
            .with_label_values(&[self.marketplace, self.operation])
            .observe(elapsed);
        SYNC_LAST_SUCCESS_TS.set(chrono::Utc::now().timestamp());
    }

    pub fn observe_error(self) {
        let elapsed = self.started_at.elapsed().as_secs_f64();
        SYNC_DURATION_SECONDS
            .with_label_values(&[self.marketplace, self.operation])
            .observe(elapsed);
    }
}
