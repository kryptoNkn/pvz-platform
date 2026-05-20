# Схема базы данных

Ниже приведена актуальная ER-схема базы данных проекта по миграциям `backend/migrations`.

```mermaid
erDiagram
    users {
        uuid id PK
        varchar username
        varchar email UK
        text password_hash
        varchar role
        timestamptz created_at
        timestamptz updated_at
        varchar full_name
        varchar phone
        text avatar_path
        text company_name
        varchar inn
        varchar kpp
        varchar ogrn
        text bank_name
        varchar bik
        varchar bank_account
        varchar corr_account
        text legal_address
    }

    refresh_tokens {
        uuid jti PK
        uuid user_id FK
        timestamp expires_at
        boolean revoked
        timestamptz created_at
    }

    user_documents {
        uuid id PK
        uuid user_id FK
        text filename
        text file_path
        timestamptz uploaded_at
    }

    pvz {
        uuid id PK
        text name
        text address
        text size_type
        text location_type
        text status
        int max_capacity
        int current_items
        text hours
        timestamptz created_at
    }

    pvz_schedule {
        uuid id PK
        uuid pvz_id FK
        smallint day_index
        boolean is_day_off
        text start_time
        text end_time
    }

    operations {
        uuid id PK
        uuid pvz_id FK
        varchar op_type
        int quantity
        uuid operator_id FK
        text note
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        varchar title
        text body
        varchar type
        boolean is_read
        timestamptz created_at
    }

    marketplace_tokens {
        uuid id PK
        text marketplace
        text token
        text client_id
        text api_key
        timestamptz created_at
        timestamptz updated_at
    }

    products {
        uuid id PK
        text article UK
        text name
        bigint base_price
        timestamptz created_at
    }

    product_prices {
        uuid id PK
        uuid product_id FK
        text marketplace
        bigint price
        timestamptz updated_at
    }

    product_stocks {
        uuid id PK
        uuid product_id FK
        text marketplace
        int stock
        timestamptz updated_at
    }

    marketplace_orders {
        uuid id PK
        text marketplace
        text external_id UK
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    marketplace_order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        text name
        int quantity
        bigint price
    }

    users ||--o{ refresh_tokens : "1:N"
    users ||--o{ user_documents : "1:N"
    users ||--o{ notifications : "1:N"
    users ||--o{ operations : "1:N operator_id"
    pvz ||--o{ pvz_schedule : "1:N"
    pvz ||--o{ operations : "1:N"
    products ||--o{ product_prices : "1:N"
    products ||--o{ product_stocks : "1:N"
    marketplace_orders ||--o{ marketplace_order_items : "1:N"
    products ||--o{ marketplace_order_items : "1:N"
```

## Основные сущности

- `users` - пользователи системы и их профильные данные.
- `pvz` - пункты выдачи заказов.
- `operations` - журнал операций по ПВЗ.
- `pvz_schedule` - расписание работы ПВЗ по дням недели.
- `refresh_tokens` - токены обновления сессии.
- `notifications` - уведомления пользователям.
- `products`, `product_prices`, `product_stocks` - каталог товаров и данные по маркетплейсам.
- `marketplace_orders`, `marketplace_order_items` - заказы и строки заказов маркетплейса.

## Примечание

Схема построена по SQL-миграциям в `backend/migrations` и отражает текущую структуру БД проекта.

