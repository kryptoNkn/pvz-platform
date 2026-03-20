use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rand::Rng;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SizeType {
    Small,
    Medium,
    Large,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum LocationType {
    Mall,
    Street,
    Residential,
    Office,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PvzStatus {
    Active,
    Overloaded,
    Closed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pvz {
    pub id: Uuid,
    pub name: String,
    pub address: String,
    pub size_type: SizeType,
    pub location_type: LocationType,
    pub status: PvzStatus,
    pub current_items: u32,
    pub max_capacity: u32,
    pub load_percent: u8,
    pub traffic: String,
    pub hours: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkloadStats {
    pub total_items: u32,
    pub acceptance: u32,
    pub delivery: u32,
    pub returns: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyFinance {
    pub month: String,
    pub revenue: u64,
    pub expenses: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialStats {
    pub total_revenue: u64,
    pub total_expenses: u64,
    pub net_profit: i64,
    pub avg_check: u32,
    pub transactions: u32,
    pub monthly: Vec<MonthlyFinance>,
}

pub struct AppState {
    pub workload_stats: WorkloadStats,
    pub financial_stats: FinancialStats,
}

impl AppState {
    pub fn new() -> Self {
        let mut rng = rand::thread_rng();
        AppState {
            workload_stats: generate_workload_stats(&mut rng),
            financial_stats: generate_financial_stats(&mut rng),
        }
    }
}

pub fn generate_workload_stats(rng: &mut impl Rng) -> WorkloadStats {
    let total_items: u32 = rng.gen_range(5_000..=30_000);
    let acceptance: u32 = rng.gen_range(500..=(total_items / 3));
    let delivery: u32 = rng.gen_range(500..=(total_items / 3));
    let returns: u32 = rng.gen_range(50..=(total_items / 10).max(51));
    WorkloadStats { total_items, acceptance, delivery, returns }
}

pub fn generate_financial_stats(rng: &mut impl Rng) -> FinancialStats {
    let transactions: u32 = rng.gen_range(5_000..=50_000);
    let avg_check: u32 = rng.gen_range(800..=3_000);
    let total_revenue: u64 = (transactions as u64) * (avg_check as u64);
    let expense_ratio: f64 = rng.gen_range(0.55..=0.80);
    let total_expenses: u64 = (total_revenue as f64 * expense_ratio) as u64;
    let net_profit: i64 = total_revenue as i64 - total_expenses as i64;

    const MONTHS: &[&str] = &["Окт", "Ноя", "Дек", "Янв", "Фев", "Мар"];
    let monthly: Vec<MonthlyFinance> = MONTHS.iter().map(|m| {
        let rev: u64 = rng.gen_range(1_000_000..=8_000_000);
        let exp: u64 = (rev as f64 * rng.gen_range(0.5..=0.8)) as u64;
        MonthlyFinance { month: m.to_string(), revenue: rev, expenses: exp }
    }).collect();

    FinancialStats { total_revenue, total_expenses, net_profit, avg_check, transactions, monthly }
}

fn generate_single(rng: &mut impl Rng, index: usize) -> Pvz {
    const CITIES: &[&str] = &[
        "Москва", "Санкт-Петербург", "Казань",
        "Екатеринбург", "Новосибирск", "Краснодар",
    ];
    const STREETS: &[&str] = &[
        "ул. Ленина", "пр. Мира", "ул. Пушкина",
        "ул. Гагарина", "пр. Победы", "ул. Советская",
    ];

    let size_type = match rng.gen_range(0u8..3) {
        0 => SizeType::Small,
        1 => SizeType::Medium,
        _ => SizeType::Large,
    };

    let max_capacity: u32 = match &size_type {
        SizeType::Small => rng.gen_range(50..=150),
        SizeType::Medium => rng.gen_range(151..=400),
        SizeType::Large => rng.gen_range(401..=1000),
    };

    let location_type = match rng.gen_range(0u8..4) {
        0 => LocationType::Mall,
        1 => LocationType::Street,
        2 => LocationType::Residential,
        _ => LocationType::Office,
    };

    let current_items: u32 = rng.gen_range(0..=max_capacity);
    let load_percent = ((current_items as f64 / max_capacity as f64) * 100.0).round() as u8;

    let status = if load_percent >= 90 {
        PvzStatus::Overloaded
    } else if rng.gen_bool(0.05) {
        PvzStatus::Closed
    } else {
        PvzStatus::Active
    };

    let traffic = match &status {
        PvzStatus::Closed => "-".to_string(),
        _ if load_percent >= 70 => "Высокий".to_string(),
        _ if load_percent >= 40 => "Средний".to_string(),
        _ => "Низкий".to_string(),
    };

    let hours = match &location_type {
        LocationType::Mall => "10:00 - 22:00".to_string(),
        LocationType::Street => "09:00 - 21:00".to_string(),
        LocationType::Residential => "09:00 - 20:00".to_string(),
        LocationType::Office => "08:00 - 19:00".to_string(),
    };

    let city = CITIES[rng.gen_range(0..CITIES.len())];
    let street = STREETS[rng.gen_range(0..STREETS.len())];
    let building: u16 = rng.gen_range(1..=200);

    Pvz {
        id: Uuid::new_v4(),
        name: format!("ПВЗ №{}", index + 1),
        address: format!("{}, {}, д.{}", city, street, building),
        size_type,
        location_type,
        status,
        current_items,
        max_capacity,
        load_percent,
        traffic,
        hours,
    }
}

pub fn generate_pvz_list() -> Vec<Pvz> {
    let mut rng = rand::thread_rng();
    (0..1).map(|i| generate_single(&mut rng, i)).collect()
}
