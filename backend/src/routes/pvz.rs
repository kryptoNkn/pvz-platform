use actix_web::{web, HttpResponse, Responder};
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use serde::Deserialize;
use sqlx::{PgPool, Row};
use chrono::{DateTime, Utc};
use crate::pvz::{AppState, generate_workload_stats, generate_financial_stats};

fn compute_load_percent(current: i32, max: i32) -> u8 {
    if max <= 0 { return 0; }
    ((current as f64 / max as f64) * 100.0).round() as u8
}

fn compute_traffic(status: &str, load_percent: u8) -> &'static str {
    match status {
        "closed" => "-",
        _ if load_percent >= 70 => "Высокий",
        _ if load_percent >= 40 => "Средний",
        _ => "Низкий",
    }
}

fn row_to_json(r: &sqlx::postgres::PgRow) -> serde_json::Value {
    let id: Uuid = r.get("id");
    let name: String = r.get("name");
    let address: String = r.get("address");
    let size_type: String = r.get("size_type");
    let location_type: String = r.get("location_type");
    let status: String = r.get("status");
    let max_capacity: i32 = r.get("max_capacity");
    let current_items: i32 = r.get("current_items");
    let hours: String = r.get("hours");
    let marketplace: String = r.try_get("marketplace").unwrap_or_else(|_| "Ozon".to_string());

    let load_percent = compute_load_percent(current_items, max_capacity);
    let traffic = compute_traffic(&status, load_percent);

    serde_json::json!({
        "id": id,
        "name": name,
        "address": address,
        "size_type": size_type,
        "location_type": location_type,
        "status": status,
        "max_capacity": max_capacity,
        "current_items": current_items,
        "load_percent": load_percent,
        "traffic": traffic,
        "hours": hours,
        "marketplace": marketplace,
    })
}

pub async fn get_pvz_list(pool: web::Data<PgPool>) -> impl Responder {
    match sqlx::query(
        "SELECT id, name, address, size_type, location_type, status, max_capacity, current_items, hours, marketplace
         FROM pvz ORDER BY created_at"
    )
    .fetch_all(pool.get_ref())
    .await {
        Ok(rows) => {
            let list: Vec<_> = rows.iter().map(row_to_json).collect();
            HttpResponse::Ok().json(list)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_pvz_by_id(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();
    match sqlx::query(
        "SELECT id, name, address, size_type, location_type, status, max_capacity, current_items, hours, marketplace
         FROM pvz WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await {
        Ok(Some(r)) => HttpResponse::Ok().json(row_to_json(&r)),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_stats(
    pool: web::Data<PgPool>,
    state: web::Data<Arc<Mutex<AppState>>>,
) -> impl Responder {
    let counts = sqlx::query(
        "SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'active') as active,
            COUNT(*) FILTER (WHERE status = 'overloaded') as overloaded,
            COUNT(*) FILTER (WHERE status = 'closed') as closed
         FROM pvz"
    )
    .fetch_one(pool.get_ref())
    .await;

    let (total, active, overloaded, closed) = match counts {
        Ok(r) => {
            let total: i64 = r.get("total");
            let active: i64 = r.get("active");
            let overloaded: i64 = r.get("overloaded");
            let closed: i64 = r.get("closed");
            (total, active, overloaded, closed)
        }
        Err(e) => {
            log::error!("DB error: {e}");
            (0i64, 0i64, 0i64, 0i64)
        }
    };

    let op_counts = sqlx::query(
        "SELECT
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'in'), 0) AS acceptance,
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'out'), 0) AS delivery,
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'return'), 0) AS returns,
            COALESCE(SUM(quantity), 0) AS total_items
         FROM operations"
    )
    .fetch_one(pool.get_ref())
    .await;

    let (total_items, acceptance, delivery, returns) = match op_counts {
        Ok(r) => {
            let acceptance: i64 = r.get("acceptance");
            let delivery: i64 = r.get("delivery");
            let returns: i64 = r.get("returns");
            let total_items: i64 = r.get("total_items");
            (total_items, acceptance, delivery, returns)
        }
        Err(_) => {
            let s = state.lock().unwrap();
            (s.workload_stats.total_items as i64, s.workload_stats.acceptance as i64,
             s.workload_stats.delivery as i64, s.workload_stats.returns as i64)
        }
    };

    HttpResponse::Ok().json(serde_json::json!({
        "total": total,
        "active": active,
        "overloaded": overloaded,
        "closed": closed,
        "total_items": total_items,
        "acceptance": acceptance,
        "delivery": delivery,
        "returns": returns,
    }))
}

#[derive(Deserialize)]
pub struct WorkloadByHourQuery {
    pub pvz_id: Option<Uuid>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
}

pub async fn workload_by_hour(
    pool: web::Data<PgPool>,
    query: web::Query<WorkloadByHourQuery>,
) -> impl Responder {
    let date_from = query.date_from.as_deref()
        .and_then(|s| s.parse::<DateTime<Utc>>().ok());
    let date_to = query.date_to.as_deref()
        .and_then(|s| s.parse::<DateTime<Utc>>().ok());

    let rows = match sqlx::query(
        r#"
        SELECT
            EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'UTC')::int AS hour,
            COALESCE(SUM(o.quantity) FILTER (WHERE o.op_type = 'in'),     0)::int AS acceptance,
            COALESCE(SUM(o.quantity) FILTER (WHERE o.op_type = 'out'),    0)::int AS delivery,
            COALESCE(SUM(o.quantity) FILTER (WHERE o.op_type = 'return'), 0)::int AS returns,
            COALESCE(SUM(o.quantity), 0)::int                                     AS total,
            COUNT(*)::int                                                          AS ops_count
        FROM operations o
        WHERE ($1::uuid IS NULL OR o.pvz_id = $1)
          AND ($2::timestamptz IS NULL OR o.created_at >= $2)
          AND ($3::timestamptz IS NULL OR o.created_at <= $3)
        GROUP BY hour
        ORDER BY hour
        "#
    )
    .bind(query.pvz_id)
    .bind(date_from)
    .bind(date_to)
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(r) => r,
        Err(e) => {
            log::error!("DB error workload_by_hour: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    let result: Vec<serde_json::Value> = rows.iter().map(|r| {
        let hour: i32 = r.get("hour");
        let acceptance: i32 = r.get("acceptance");
        let delivery: i32 = r.get("delivery");
        let returns: i32 = r.get("returns");
        let total: i32 = r.get("total");
        let ops_count: i32  = r.get("ops_count");
        serde_json::json!({
            "hour": hour,
            "acceptance": acceptance,
            "delivery": delivery,
            "returns": returns,
            "total": total,
            "ops_count": ops_count,
        })
    }).collect();

    HttpResponse::Ok().json(result)
}

pub async fn get_finance(
    pool: web::Data<PgPool>,
    state: web::Data<Arc<Mutex<AppState>>>,
) -> impl Responder {
    let commission_map: std::collections::HashMap<&str, i64> = [
        ("Ozon", 84i64),
        ("WB", 57i64),
        ("Яндекс Маркет", 120i64),
        ("Авито", 35i64),
    ].into_iter().collect();
    let default_commission: i64 = 70;
    let acceptance_fee: i64 = 20;
    let return_fee: i64 = 10;
    let expense_ratio: f64 = 0.65;

    let breakdown_rows = sqlx::query(
        r#"
        SELECT
            COALESCE(p.marketplace, 'Ozon') AS marketplace,
            COALESCE(SUM(o.quantity) FILTER (WHERE o.op_type = 'out'), 0)::bigint AS delivery_qty,
            COALESCE(COUNT(o.id)     FILTER (WHERE o.op_type = 'out'), 0)::bigint AS delivery_ops
        FROM operations o
        JOIN pvz p ON p.id = o.pvz_id
        GROUP BY p.marketplace
        "#
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_default();

    let mut breakdown = Vec::new();
    let mut total_delivery_qty: i64 = 0;
    let mut total_delivery_ops: i64 = 0;
    let mut total_delivery_revenue: i64 = 0;

    for row in &breakdown_rows {
        let marketplace: String = row.get("marketplace");
        let delivery_qty: i64  = row.get("delivery_qty");
        let delivery_ops: i64  = row.get("delivery_ops");
        let commission = *commission_map.get(marketplace.as_str()).unwrap_or(&default_commission);
        let revenue = delivery_qty * commission;
        total_delivery_qty     += delivery_qty;
        total_delivery_ops     += delivery_ops;
        total_delivery_revenue += revenue;
        breakdown.push(serde_json::json!({
            "marketplace":    marketplace,
            "items_delivered": delivery_qty,
            "avg_commission": commission,
            "revenue":        revenue,
        }));
    }

    let totals = sqlx::query(
        r#"
        SELECT
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'in'),     0)::bigint AS acceptance_qty,
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'return'), 0)::bigint AS returns_qty,
            COALESCE(COUNT(*)      FILTER (WHERE op_type = 'in'),     0)::bigint AS acceptance_ops,
            COALESCE(COUNT(*)      FILTER (WHERE op_type = 'return'), 0)::bigint AS returns_ops
        FROM operations
        "#
    )
    .fetch_one(pool.get_ref())
    .await;

    let (acceptance_qty, returns_qty, acceptance_ops, returns_ops) = match totals {
        Ok(r) => (
            r.get::<i64, _>("acceptance_qty"),
            r.get::<i64, _>("returns_qty"),
            r.get::<i64, _>("acceptance_ops"),
            r.get::<i64, _>("returns_ops"),
        ),
        Err(_) => {
            let s = state.lock().unwrap();
            (s.workload_stats.acceptance as i64, s.workload_stats.returns as i64, 0i64, 0i64)
        }
    };

    let acceptance_revenue = acceptance_qty * acceptance_fee;
    let returns_revenue = returns_qty    * return_fee;
    let total_revenue = total_delivery_revenue + acceptance_revenue + returns_revenue;
    let total_expenses = (total_revenue as f64 * expense_ratio) as i64;
    let net_profit = total_revenue - total_expenses;
    let transactions = total_delivery_ops + acceptance_ops + returns_ops;
    let avg_check = if transactions > 0 { total_revenue / transactions } else { 0 };

    let weighted_commission = if total_delivery_qty > 0 {
        total_delivery_revenue / total_delivery_qty
    } else {
        default_commission
    };

    let month_rows = sqlx::query(
        r#"
        SELECT
            date_trunc('month', created_at AT TIME ZONE 'UTC') AS month_start,
            EXTRACT(MONTH FROM created_at AT TIME ZONE 'UTC')::int AS month_num,
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'out'),    0)::bigint AS delivery_qty,
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'in'),     0)::bigint AS acceptance_qty,
            COALESCE(SUM(quantity) FILTER (WHERE op_type = 'return'), 0)::bigint AS returns_qty
        FROM operations
        GROUP BY month_start, month_num
        ORDER BY month_start DESC
        LIMIT 6
        "#
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_default();

    const MONTHS_RU: &[&str] = &[
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
    ];

    let mut monthly: Vec<serde_json::Value> = if month_rows.is_empty() {
        use chrono::{Datelike, Utc};
        let now = Utc::now();
        (0..6).rev().map(|i| {
            let offset = i as i32;
            let mut m = now.month() as i32 - offset;
            while m <= 0 { m += 12; }
            serde_json::json!({ "month": MONTHS_RU[(m - 1) as usize], "revenue": 0, "expenses": 0 })
        }).collect()
    } else {
        let mut rows: Vec<serde_json::Value> = month_rows.iter().map(|r| {
            let month_num: i32 = r.get("month_num");
            let delivery_qty:   i64 = r.get("delivery_qty");
            let acceptance_qty: i64 = r.get("acceptance_qty");
            let returns_qty:    i64 = r.get("returns_qty");
            let rev = delivery_qty   * weighted_commission
                    + acceptance_qty * acceptance_fee
                    + returns_qty    * return_fee;
            let exp = (rev as f64 * expense_ratio) as i64;
            serde_json::json!({
                "month": MONTHS_RU[(month_num - 1).clamp(0, 11) as usize],
                "revenue": rev,
                "expenses": exp,
            })
        }).collect();
        rows.reverse();
        rows
    };

    monthly.truncate(6);

    if total_revenue == 0 {
        let s = state.lock().unwrap();
        let fs = &s.financial_stats;

        let d = fs.transactions as i64;
        let mp_shares: &[(&str, i64, i64)] = &[
            ("Ozon", 84, (d * 45 / 100).max(1)),
            ("WB", 57, (d * 35 / 100).max(1)),
            ("Яндекс Маркет", 120, (d * 13 / 100).max(1)),
            ("Авито", 35, (d * 7  / 100).max(1)),
        ];
        let demo_breakdown: Vec<serde_json::Value> = mp_shares.iter().map(|(name, comm, qty)| {
            serde_json::json!({
                "marketplace": name,
                "items_delivered": qty,
                "avg_commission": comm,
                "revenue": qty * comm,
            })
        }).collect();

        let demo_monthly: Vec<serde_json::Value> = fs.monthly.iter().map(|m| {
            serde_json::json!({
                "month":    m.month,
                "revenue":  m.revenue,
                "expenses": m.expenses,
            })
        }).collect();

        let accept_cnt = (fs.transactions as f64 * 1.25) as i64;
        let ret_cnt    = (fs.transactions as f64 * 0.07) as i64;

        return HttpResponse::Ok().json(serde_json::json!({
            "total_revenue": fs.total_revenue,
            "total_expenses": fs.total_expenses,
            "net_profit": fs.net_profit,
            "avg_check": fs.avg_check,
            "transactions": fs.transactions,
            "delivery_count": fs.transactions,
            "acceptance_count": accept_cnt,
            "returns_count": ret_cnt,
            "monthly": demo_monthly,
            "breakdown": demo_breakdown,
        }));
    }

    HttpResponse::Ok().json(serde_json::json!({
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "avg_check": avg_check,
        "transactions": transactions,
        "delivery_count": total_delivery_qty,
        "acceptance_count": acceptance_qty,
        "returns_count": returns_qty,
        "monthly": monthly,
        "breakdown": breakdown,
    }))
}

#[derive(Deserialize)]
pub struct NewPvzBody {
    pub address: String,
    pub max_capacity: u32,
    pub location_type: Option<String>,
    pub marketplace: Option<String>,
}

pub async fn add_pvz(
    pool: web::Data<PgPool>,
    body: web::Json<NewPvzBody>,
) -> impl Responder {
    let max_capacity = body.max_capacity.max(1) as i32;
    let location_type = body.location_type.clone()
        .filter(|s| ["mall", "street", "residential", "office"].contains(&s.as_str()))
        .unwrap_or_else(|| "street".to_string());

    let size_type = if max_capacity <= 150 { "small" }
                   else if max_capacity <= 400 { "medium" }
                   else { "large" };

    let hours = match location_type.as_str() {
        "mall" => "10:00 - 22:00",
        "residential" => "09:00 - 20:00",
        "office" => "08:00 - 19:00",
        _ => "09:00 - 21:00",
    };

    let marketplace = body.marketplace.clone()
        .filter(|s| ["Ozon", "WB", "Яндекс Маркет", "Авито"].contains(&s.as_str()))
        .unwrap_or_else(|| "Ozon".to_string());

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM pvz")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or(0);
    let name = format!("ПВЗ №{}", count + 1);

    match sqlx::query(
        "INSERT INTO pvz (name, address, size_type, location_type, status, max_capacity, current_items, hours, marketplace)
         VALUES ($1, $2, $3, $4, 'active', $5, 0, $6, $7)
         RETURNING id, name, address, size_type, location_type, status, max_capacity, current_items, hours, marketplace"
    )
    .bind(&name)
    .bind(&body.address)
    .bind(size_type)
    .bind(&location_type)
    .bind(max_capacity)
    .bind(hours)
    .bind(&marketplace)
    .fetch_one(pool.get_ref())
    .await {
        Ok(r) => HttpResponse::Ok().json(row_to_json(&r)),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Deserialize)]
pub struct UpdatePvzBody {
    pub address: Option<String>,
    pub max_capacity: Option<u32>,
    pub location_type: Option<String>,
    pub status: Option<String>,
    pub hours: Option<String>,
    pub marketplace: Option<String>,
}

pub async fn update_pvz(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdatePvzBody>,
) -> impl Responder {
    let id = path.into_inner();

    let existing = sqlx::query(
        "SELECT address, location_type, status, max_capacity, hours, marketplace FROM pvz WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool.get_ref())
    .await;

    match existing {
        Ok(Some(row)) => {
            let cur_address: String = row.get("address");
            let cur_location_type: String = row.get("location_type");
            let cur_status: String = row.get("status");
            let cur_max_capacity: i32 = row.get("max_capacity");
            let cur_hours: String = row.get("hours");
            let cur_marketplace: String = row.try_get("marketplace").unwrap_or_else(|_| "Ozon".to_string());

            let address = body.address.clone().unwrap_or(cur_address);
            let max_capacity = body.max_capacity.map(|v| v as i32).unwrap_or(cur_max_capacity);
            let location_type = body.location_type.clone()
                .filter(|s| ["mall", "street", "residential", "office"].contains(&s.as_str()))
                .unwrap_or(cur_location_type);
            let status = body.status.clone()
                .filter(|s| ["active", "overloaded", "closed"].contains(&s.as_str()))
                .unwrap_or(cur_status);
            let hours = body.hours.clone().unwrap_or(cur_hours);
            let marketplace = body.marketplace.clone()
                .filter(|s| ["Ozon", "WB", "Яндекс Маркет", "Авито"].contains(&s.as_str()))
                .unwrap_or(cur_marketplace);
            let size_type = if max_capacity <= 150 { "small" }
                           else if max_capacity <= 400 { "medium" }
                           else { "large" };

            match sqlx::query(
                "UPDATE pvz
                 SET address = $1, max_capacity = $2, location_type = $3,
                     status = $4, size_type = $5, hours = $6, marketplace = $7
                 WHERE id = $8
                 RETURNING id, name, address, size_type, location_type, status, max_capacity, current_items, hours, marketplace"
            )
            .bind(&address)
            .bind(max_capacity)
            .bind(&location_type)
            .bind(&status)
            .bind(size_type)
            .bind(&hours)
            .bind(&marketplace)
            .bind(id)
            .fetch_one(pool.get_ref())
            .await {
                Ok(r) => HttpResponse::Ok().json(row_to_json(&r)),
                Err(e) => {
                    log::error!("DB error: {e}");
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn delete_pvz(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();
    match sqlx::query("DELETE FROM pvz WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await {
        Ok(r) if r.rows_affected() > 0 => {
            HttpResponse::Ok().json(serde_json::json!({ "deleted": true }))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({ "error": "not found" })),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn regenerate(state: web::Data<Arc<Mutex<AppState>>>) -> impl Responder {
    let mut state = state.lock().unwrap();
    let mut rng = rand::thread_rng();
    state.workload_stats = generate_workload_stats(&mut rng);
    state.financial_stats = generate_financial_stats(&mut rng);
    HttpResponse::Ok().json(serde_json::json!({ "ok": true }))
}

pub async fn get_marketplace_items(
    pool: web::Data<PgPool>,
    state: web::Data<Arc<Mutex<AppState>>>,
) -> impl Responder {
    struct MpConfig {
        name: &'static str,
        commission_percent: f64,
        avg_price: u32,
        avg_storage_days: u32,
        share_pct: u32,
        delivery_pct: u32,
    }
    let configs = [
        MpConfig { name: "Ozon", commission_percent: 3.5, avg_price: 2400, avg_storage_days: 3, share_pct: 45, delivery_pct: 40 },
        MpConfig { name: "WB", commission_percent: 2.8, avg_price: 2050, avg_storage_days: 4, share_pct: 35, delivery_pct: 38 },
        MpConfig { name: "Яндекс Маркет", commission_percent: 4.0, avg_price: 3000, avg_storage_days: 2, share_pct: 13, delivery_pct: 15 },
        MpConfig { name: "Авито", commission_percent: 2.0, avg_price: 1750, avg_storage_days: 3, share_pct: 7,  delivery_pct: 7  },
    ];

    let rows = sqlx::query(
        r#"
        SELECT
            p.marketplace,
            COALESCE(SUM(p.current_items), 0)::bigint AS items_count,
            COALESCE(COUNT(o.id) FILTER (
                WHERE o.op_type = 'out'
                  AND o.created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
            ), 0)::bigint AS pending_today
        FROM pvz p
        LEFT JOIN operations o ON o.pvz_id = p.id
        WHERE p.status != 'closed'
        GROUP BY p.marketplace
        "#
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_default();

    let db_data: std::collections::HashMap<String, (i64, i64)> = rows.iter().map(|r| {
        let mp: String  = r.get("marketplace");
        let items: i64  = r.get("items_count");
        let pending: i64 = r.get("pending_today");
        (mp, (items, pending))
    }).collect();

    let total_db_items: i64 = db_data.values().map(|(i, _)| i).sum();

    let (fallback_total, fallback_delivery) = if total_db_items == 0 {
        let s = state.lock().unwrap();
        (s.workload_stats.total_items as i64, s.workload_stats.delivery as i64)
    } else {
        (0, 0)
    };

    let items: Vec<serde_json::Value> = configs.iter().map(|cfg| {
        let (items_count, pending_today) = if total_db_items > 0 {
            db_data.get(cfg.name).copied().unwrap_or((0, 0))
        } else {
            let ic = (fallback_total * cfg.share_pct as i64 / 100).max(1);
            let pt = (fallback_delivery * cfg.delivery_pct as i64 / 100).max(0);
            (ic, pt)
        };
        serde_json::json!({
            "marketplace": cfg.name,
            "items_count": items_count,
            "commission_percent": cfg.commission_percent,
            "avg_price": cfg.avg_price,
            "avg_storage_days": cfg.avg_storage_days,
            "pending_today": pending_today,
        })
    }).collect();

    HttpResponse::Ok().json(items)
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/v1")
            .route("/stats", web::get().to(get_stats))
            .route("/stats/workload-by-hour", web::get().to(workload_by_hour))
            .route("/finance", web::get().to(get_finance))
            .route("/marketplace-items", web::get().to(get_marketplace_items))
            .route("/pvz", web::get().to(get_pvz_list))
            .route("/pvz", web::post().to(add_pvz))
            .route("/pvz/regenerate", web::post().to(regenerate))
            .route("/pvz/{id}", web::get().to(get_pvz_by_id))
            .route("/pvz/{id}", web::put().to(update_pvz))
            .route("/pvz/{id}", web::delete().to(delete_pvz))
            .route("/pvz/{id}/schedule", web::get().to(super::schedule::get_schedule))
            .route("/pvz/{id}/schedule", web::put().to(super::schedule::set_schedule))
            .route("/operations", web::get().to(super::operations::list_operations))
            .route("/operations", web::post().to(super::operations::add_operation))
            .route("/operations/{id}", web::delete().to(super::operations::delete_operation))
    );
}
