use actix_web::{web, HttpRequest, HttpResponse, HttpMessage, Responder};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct NewOperationBody {
    pub pvz_id: Uuid,
    pub op_type: String,
    pub quantity: Option<i32>,
    pub note: Option<String>,
}

#[derive(Deserialize)]
pub struct ListQuery {
    pub pvz_id: Option<Uuid>,
    pub op_type: Option<String>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn add_operation(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<NewOperationBody>,
) -> impl Responder {
    if !["in", "out", "return"].contains(&body.op_type.as_str()) {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "op_type must be 'in', 'out', or 'return'"
        }));
    }

    let quantity = body.quantity.unwrap_or(1).max(1);
    let operator_id = req.extensions().get::<Uuid>().copied();

    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM pvz WHERE id = $1)")
        .bind(body.pvz_id)
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or(false);

    if !exists {
        return HttpResponse::NotFound().json(serde_json::json!({"error": "pvz not found"}));
    }

    let delta: i32 = match body.op_type.as_str() {
        "out" => -quantity,
        _     =>  quantity,
    };

    let row = match sqlx::query(
        "INSERT INTO operations (pvz_id, op_type, quantity, operator_id, note)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, pvz_id, op_type, quantity, note, created_at"
    )
    .bind(body.pvz_id)
    .bind(&body.op_type)
    .bind(quantity)
    .bind(operator_id)
    .bind(&body.note)
    .fetch_one(pool.get_ref())
    .await
    {
        Ok(r) => r,
        Err(e) => {
            log::error!("DB error inserting operation: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    if let Err(e) = sqlx::query(
        r#"
        UPDATE pvz
        SET current_items = GREATEST(0, current_items + $1),
            status = CASE
                WHEN status = 'closed' THEN 'closed'
                WHEN GREATEST(0, current_items + $1) * 100 / NULLIF(max_capacity, 0) >= 90 THEN 'overloaded'
                ELSE 'active'
            END
        WHERE id = $2
        "#
    )
    .bind(delta)
    .bind(body.pvz_id)
    .execute(pool.get_ref())
    .await
    {
        log::error!("DB error updating pvz items: {e}");
    }

    let id: Uuid = row.get("id");
    let pvz_id: Uuid = row.get("pvz_id");
    let op_type: String = row.get("op_type");
    let qty: i32 = row.get("quantity");
    let note: Option<String> = row.get("note");
    let created_at: DateTime<Utc> = row.get("created_at");

    HttpResponse::Ok().json(serde_json::json!({
        "id": id,
        "pvz_id": pvz_id,
        "op_type": op_type,
        "quantity": qty,
        "note": note,
        "created_at": created_at,
    }))
}

pub async fn list_operations(
    pool: web::Data<PgPool>,
    query: web::Query<ListQuery>,
) -> impl Responder {
    let limit = query.limit.unwrap_or(100).min(500);
    let offset = query.offset.unwrap_or(0);

    let date_from = query.date_from.as_deref()
        .and_then(|s| s.parse::<DateTime<Utc>>().ok());
    let date_to = query.date_to.as_deref()
        .and_then(|s| s.parse::<DateTime<Utc>>().ok());

    match sqlx::query(
        r#"
        SELECT o.id, o.pvz_id, p.name AS pvz_name, o.op_type, o.quantity, o.note, o.created_at
        FROM operations o
        JOIN pvz p ON p.id = o.pvz_id
        WHERE ($1::uuid IS NULL OR o.pvz_id = $1)
          AND ($2::text IS NULL OR o.op_type = $2)
          AND ($3::timestamptz IS NULL OR o.created_at >= $3)
          AND ($4::timestamptz IS NULL OR o.created_at <= $4)
        ORDER BY o.created_at DESC
        LIMIT $5 OFFSET $6
        "#
    )
    .bind(query.pvz_id)
    .bind(&query.op_type)
    .bind(date_from)
    .bind(date_to)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool.get_ref())
    .await
    {
        Ok(rows) => {
            let ops: Vec<_> = rows.iter().map(|r| {
                let id: Uuid = r.get("id");
                let pvz_id: Uuid = r.get("pvz_id");
                let pvz_name: String = r.get("pvz_name");
                let op_type: String = r.get("op_type");
                let quantity: i32 = r.get("quantity");
                let note: Option<String> = r.get("note");
                let created_at: DateTime<Utc> = r.get("created_at");
                serde_json::json!({
                    "id": id,
                    "pvz_id": pvz_id,
                    "pvz_name": pvz_name,
                    "op_type": op_type,
                    "quantity": quantity,
                    "note": note,
                    "created_at": created_at,
                })
            }).collect();
            HttpResponse::Ok().json(ops)
        }
        Err(e) => {
            log::error!("DB error listing operations: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn delete_operation(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> impl Responder {
    let id = path.into_inner();

    let op = sqlx::query("SELECT pvz_id, op_type, quantity FROM operations WHERE id = $1")
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await;

    match op {
        Ok(Some(row)) => {
            let pvz_id: Uuid = row.get("pvz_id");
            let op_type: String = row.get("op_type");
            let quantity: i32 = row.get("quantity");

            let revert_delta: i32 = match op_type.as_str() {
                "out" =>  quantity,
                _     => -quantity,
            };

            if let Err(e) = sqlx::query("DELETE FROM operations WHERE id = $1")
                .bind(id)
                .execute(pool.get_ref())
                .await
            {
                log::error!("DB error deleting operation: {e}");
                return HttpResponse::InternalServerError().finish();
            }

            if let Err(e) = sqlx::query(
                r#"
                UPDATE pvz
                SET current_items = GREATEST(0, current_items + $1),
                    status = CASE
                        WHEN status = 'closed' THEN 'closed'
                        WHEN GREATEST(0, current_items + $1) * 100 / NULLIF(max_capacity, 0) >= 90 THEN 'overloaded'
                        ELSE 'active'
                    END
                WHERE id = $2
                "#
            )
            .bind(revert_delta)
            .bind(pvz_id)
            .execute(pool.get_ref())
            .await
            {
                log::error!("DB error reverting pvz items: {e}");
            }

            HttpResponse::Ok().json(serde_json::json!({"deleted": true}))
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "not found"})),
        Err(e) => {
            log::error!("DB error: {e}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub fn init_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/v1/operations")
            .route("", web::get().to(list_operations))
            .route("", web::post().to(add_operation))
            .route("/{id}", web::delete().to(delete_operation))
    );
}
