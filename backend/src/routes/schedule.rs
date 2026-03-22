use actix_web::{HttpResponse, Responder, web};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{ScheduleDay, ScheduleDayInput};

pub async fn get_schedule(
    db: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let pvz_id = path.into_inner();

    match sqlx::query_as::<_, ScheduleDay>(
        r#"
        SELECT day_index, is_day_off, start_time, end_time
        FROM pvz_schedule
        WHERE pvz_id = $1
        ORDER BY day_index
        "#
    )
    .bind(pvz_id)
    .fetch_all(db.get_ref())
    .await {
        Ok(r) => HttpResponse::Ok().json(r),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn set_schedule(
    db: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<Vec<ScheduleDayInput>>,
) -> impl Responder {
    let pvz_id = path.into_inner();

    if body.len() != 7 {
        return HttpResponse::BadRequest().json(serde_json::json!({ "error": "schedule must contain exactly 7 days" }));
    }

    for day in body.iter() {
        if !(0..=6).contains(&day.day_index) {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": "day_index must be 0-6"
            }));
        }
    }

    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM pvz WHERE id = $1)"
    )
    .bind(pvz_id)
    .fetch_one(db.get_ref())
    .await
    .unwrap_or(false);

    if !exists {
        return HttpResponse::NotFound().json(serde_json::json!({ 
            "error": "pvz not found" 
        }));
    }

    for day in body.iter() {
        let result = sqlx::query(
            r#"
            INSERT INTO pvz_schedule (pvz_id, day_index, is_day_off, start_time, end_time)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (pvz_id, day_index)
            DO UPDATE SET is_day_off = EXCLUDED.is_day_off, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time
            "#
        )
        .bind(pvz_id)
        .bind(day.day_index)
        .bind(day.is_day_off)
        .bind(&day.start_time)
        .bind(&day.end_time)
        .execute(db.get_ref())
        .await;

        if let Err(e) = result {
            log::error!("DB error on day {}: {e}", day.day_index);
            return HttpResponse::InternalServerError().finish();
        }
    }

    HttpResponse::Ok().json(serde_json::json!({ 
        "ok": true 
    }))
}