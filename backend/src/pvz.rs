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
}

pub struct AppState {
    pub pvz_list: Vec<Pvz>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            pvz_list: generate_pvz_list(),
        }
    }
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
    }
}

pub fn generate_pvz_list() -> Vec<Pvz> {
    let mut rng = rand::thread_rng();
    let count = rng.gen_range(100..=200);
    (0..count).map(|i| generate_single(&mut rng, i)).collect()
}