# П24. Таблица маппинга данных

| Бизнес-сущность | Поле в БД (PostgreSQL) | Тип данных (Rust/SQL) | Элемент интерфейса (React) | Описание / Правила |
| :--- | :--- | :--- | :--- | :--- |
| **Идентификатор ПВЗ** | `pvz.id` | `Uuid` / `UUID` | `pvzId` (Select/Label) | Уникальный ключ точки. |
| **Адрес точки** | `pvz.address` | `String` / `VARCHAR` | `addressInput` | Физическое расположение ПВЗ. |
| **Лимит нагрузки** | `pvz.capacity_limit` | `i32` / `INTEGER` | `limitField` | Макс. кол-во операций в час. |
| **Тип операции** | `operations.type` | `Enum` / `VARCHAR` | `operationTypeBadge` | Значения: `in`, `out`, `return`. |
| **Время события** | `operations.created_at` | `DateTime` / `TIMESTAMPTZ` | `timestampCell` | Авто-генерация при создании. |
| **Роль пользователя** | `users.role` | `Enum` / `VARCHAR` | `userRoleTag` | Доступ: `owner`, `admin`, `operator`. |
| **Коэффициент загрузки** | *Вычисляемое поле* | `f64` / `FLOAT` | `LoadProgressBar` | Формула: `(ops / limit) * 100`. |
| **Статус перегрузки** | *Вычисляемое поле* | `bool` / `BOOLEAN` | `statusIndicator` | `true`, если нагрузка > 100%. |

---

## Логика преобразования (Transformations)

В процессе маппинга данных между слоями системы происходят следующие преобразования:

1.  **Database → Backend (ORM/SQLx):**
    * Преобразование SQL-типов в структуры Rust (например, `TIMESTAMPTZ` в `Chrono::DateTime`).
    * Валидация данных через `Result` и `Option`.
2.  **Backend → Frontend (JSON API):**
    * Сериализация структур в JSON формат.
    * Маскирование чувствительных данных (например, поле `password_hash` никогда не передается на фронтенд).
3.  **Frontend → UI (Display):**
    * Форматирование даты в локальный вид (например, `2026-04-22` -> `22.04.2026`).
    * Маппинг числового значения загрузки в цветовой код (0-80% — зеленый, 80-100% — желтый, >100% — красный).
