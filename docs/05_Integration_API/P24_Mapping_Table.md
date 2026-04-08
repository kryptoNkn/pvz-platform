# П24. Таблица маппинга данных

| JSON (Frontend) | Rust (Struct) | БД (PostgreSQL) |
| --- | --- | --- |
| `full_name` | `UpdateProfile.full_name` | `users.username` |
| `phone` | `LoginUser.phone` | `users.email` (хранится номер телефона) |
| `role` | `User.role` | `users.role` |
| `pvz_id` | `OperationInput.pvz_id` | `operations.pvz_id` |
| `created_at` | `DateTime<Utc>` | `created_at` |
