# ПВЗ Master — Платформа управления пунктами выдачи заказов

Веб-приложение для управления ПВЗ: аутентификация, профиль, аналитика и финансы.

---

## Содержание

- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [База данных](#база-данных)
- [API](#api)
- [Аутентификация](#аутентификация)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Безопасность](#безопасность)

---

## Технологический стек

### Backend
| Технология | Версия | Назначение |
|---|---|---|
| Rust | Edition 2024 | Язык программирования |
| Actix-web | 4 | HTTP-фреймворк |
| Tokio | async | Асинхронный рантайм |
| SQLx | 0.7 | Работа с PostgreSQL |
| argon2 | 0.4 | Хеширование паролей |
| jsonwebtoken | 8 | JWT токены |
| lettre | 0.11 | Email |
| uuid | 1 | Генерация UUID |
| chrono | 0.4 | Дата и время |

### Frontend
| Технология | Версия | Назначение |
|---|---|---|
| React | 19.2.0 | UI-фреймворк |
| TypeScript | 5.9.3 | Типизация |
| Vite | 7.3.1 | Сборщик |
| SCSS (Sass) | — | Стилизация |
| Lucide React | 0.576.0 | Иконки |

### Инфраструктура
- **База данных:** PostgreSQL
- **Аутентификация:** JWT (access + refresh токены)
- **Хранение токенов:** HTTP-only cookies

---

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   React SPA (Vite, TypeScript)                          │
│   ├── LoginForm / RegisterForm                          │
│   ├── ProfilePage                                       │
│   └── Sidebar / Topbar                                  │
└──────────────────┬──────────────────────────────────────┘
                   │  /api/* → proxy → :8080
                   ▼
┌─────────────────────────────────────────────────────────┐
│               Backend (Rust / Actix-web)                │
│                                                         │
│   Auth Middleware (JWT validation)                      │
│   ├── routes/auth.rs   → /auth/*                        │
│   ├── routes/user.rs   → /user/*                        │
│   └── utils/                                            │
│       ├── jwt.rs        — Claims, декодирование          │
│       ├── tokens.rs     — Генерация токенов             │
│       ├── password.rs   — Argon2 хеш/верификация        │
│       ├── refresh_tokens.rs — Ротация refresh токенов   │
│       ├── cookies.rs    — Настройка HTTP-only cookies   │
│       ├── validation.rs — Валидация входных данных      │
│       └── errors.rs     — HTTP ответы об ошибках        │
└──────────────────┬──────────────────────────────────────┘
                   │  SQLx (async)
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                           │
│   ├── users                                             │
│   └── refresh_tokens                                    │
└─────────────────────────────────────────────────────────┘
```

### Поток запроса

1. Браузер отправляет запрос на Vite dev server (`:5173`)
2. Vite проксирует `/api/*` на backend (`:8080`), убирая префикс `/api`
3. Auth Middleware проверяет JWT для защищённых маршрутов
4. Handler обрабатывает запрос, обращается к БД через SQLx
5. Ответ возвращается с токенами в HTTP-only cookies и JSON body

---

## Структура проекта

```
pvz-platform/
├── backend/
│   ├── src/
│   │   ├── main.rs               # Точка входа, настройка сервера
│   │   ├── models.rs             # Структуры данных (User, RegisterUser, LoginUser)
│   │   ├── db.rs                 # Пул соединений PostgreSQL
│   │   ├── middleware/
│   │   │   └── auth.rs           # JWT middleware для защищённых маршрутов
│   │   ├── routes/
│   │   │   ├── auth.rs           # POST /auth/register, /auth/login, /auth/refresh
│   │   │   └── user.rs           # GET /user/profile, /users/check-username
│   │   └── utils/
│   │       ├── jwt.rs            # AccessClaims, RefreshClaims
│   │       ├── tokens.rs         # generate_access_token, generate_refresh_token
│   │       ├── password.rs       # hash_password, verify_password
│   │       ├── refresh_tokens.rs # save, validate, revoke, rotate
│   │       ├── cookies.rs        # access_cookie, refresh_cookie
│   │       ├── validation.rs     # Валидация ФИО, телефона, пароля
│   │       └── errors.rs         # HTTP ошибки
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_add_user_roles.sql
│   │   └── 003_create_refresh_tokens.sql
│   ├── Cargo.toml
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── main.tsx              # React DOM точка входа
    │   ├── App.tsx               # Главный компонент, переключение видов
    │   ├── index.css             # Глобальные стили
    │   ├── components/
    │   │   ├── AuthForms/
    │   │   │   ├── LoginForm.tsx
    │   │   │   ├── RegisterForm.tsx
    │   │   │   ├── Icons.tsx     # SVG иконки
    │   │   │   └── AuthForms.module.scss
    │   │   ├── Sidebar.tsx       # Боковое меню навигации
    │   │   └── Topbar.tsx        # Верхняя панель
    │   └── pages/
    │       └── ProfilePage.tsx   # Страница профиля / дашборд
    ├── public/
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## База данных

### Таблица `users`

```sql
CREATE TABLE users (
    id           UUID PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL,
    email        VARCHAR(255) UNIQUE NOT NULL,  -- хранится номер телефона
    password_hash TEXT        NOT NULL,
    role         VARCHAR(20)  DEFAULT 'user',
    created_at   TIMESTAMP    DEFAULT NOW(),
    updated_at   TIMESTAMP    DEFAULT NOW()
);
```

| Поле | Тип | Описание |
|---|---|---|
| `id` | UUID | Первичный ключ |
| `username` | VARCHAR(50) | Имя пользователя |
| `email` | VARCHAR(255) | Уникальный идентификатор (телефон) |
| `password_hash` | TEXT | Argon2-хеш пароля |
| `role` | VARCHAR(20) | Роль пользователя (`user`, `admin`, ...) |
| `created_at` | TIMESTAMP | Время создания аккаунта |
| `updated_at` | TIMESTAMP | Время последнего обновления |

### Таблица `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    jti        UUID PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked    BOOLEAN   DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

| Поле | Тип | Описание |
|---|---|---|
| `jti` | UUID | Уникальный идентификатор токена |
| `user_id` | UUID | Внешний ключ на `users.id` |
| `expires_at` | TIMESTAMP | Время истечения токена |
| `revoked` | BOOLEAN | Отозван ли токен |
| `created_at` | TIMESTAMP | Время создания токена |

---

## API

### Аутентификация

#### `POST /auth/register` — Регистрация

**Body:**
```json
{
  "full_name": "Иванов Иван Иванович",
  "phone": "+79001234567",
  "password": "SecurePass123"
}
```

**Валидация:**
- `full_name` — 5–100 символов, ровно 3 слова, только буквы
- `phone` — российский формат: `+7`, `7` или `8` + 10 цифр
- `password` — минимум 8 символов, заглавная буква, строчная буква, цифра

**Ответ `200 OK`:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```
+ HTTP-only cookies: `access_token` (15 мин), `refresh_token` (30 дней)

---

#### `POST /auth/login` — Вход

**Body:**
```json
{
  "phone": "+79001234567",
  "password": "SecurePass123"
}
```

**Ответ `200 OK`:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```
+ HTTP-only cookies

---

#### `POST /auth/refresh` — Обновление токена

**Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Ответ `200 OK`:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```
Старый refresh_token отзывается, выдаётся новая пара токенов.

---

### Пользователи

#### `GET /user/profile` — Профиль (защищённый)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Ответ `200 OK`:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "This is a protected profile endpoint"
}
```

---

#### `GET /users/check-username` — Проверка занятости username (публичный)

---

#### `GET /` — Health check (публичный)

---

### Коды ответов

| Код | Описание |
|---|---|
| `200` | Успех |
| `400` | Ошибка валидации / неверные данные |
| `401` | Не авторизован / невалидный токен |
| `500` | Внутренняя ошибка сервера |

---

## Аутентификация

### Схема JWT

**Access Token** (15 минут):
```json
{
  "sub": "<user_id>",
  "exp": <unix_timestamp>
}
```

**Refresh Token** (30 дней):
```json
{
  "sub": "<user_id>",
  "jti": "<uuid>",
  "exp": <unix_timestamp>
}
```

### Жизненный цикл токенов

```
Регистрация / Вход
       │
       ▼
  Генерация пары токенов
  ├── access_token  (15 мин, JWT)
  └── refresh_token (30 дней, JWT + jti в БД)
       │
       ▼
  Доступ к защищённым маршрутам
  └── Authorization: Bearer <access_token>
       │
  access_token истёк?
       │ да
       ▼
  POST /auth/refresh
  ├── Проверка jti в БД (не отозван, не истёк)
  ├── Отзыв старого refresh_token
  └── Выдача новой пары токенов
       │
  Выход
  └── Отзыв refresh_token (revoked = true)
```

### Auth Middleware

Middleware проверяет `Authorization: Bearer <token>` для всех маршрутов, кроме публичных:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /users/check-username`
- `GET /`

При успешной валидации `user_id` добавляется в расширения запроса и доступен в handlers.

---

## Быстрый старт

### Требования

- Rust (stable)
- Node.js 18+
- PostgreSQL 14+

### 1. Клонирование и настройка окружения

```bash
git clone <repo-url>
cd pvz-platform
```

### 2. База данных

```bash
# Создать БД
createdb pvzbd

# Применить миграции
cd backend
sqlx migrate run --database-url "postgres://postgres:password@localhost:5432/pvzbd"
```

### 3. Backend

```bash
cd backend
cargo run
# Сервер запустится на http://0.0.0.0:8080
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Dev-сервер на http://localhost:5173
# Запросы /api/* проксируются на :8080
```

### Сборка для продакшена

```bash
# Backend
cd backend
cargo build --release
# Бинарник: backend/target/release/backend

# Frontend
cd frontend
npm run build
# Артефакты: frontend/dist/
```

### Реализовано

| Механизм | Описание |
|---|---|
| Argon2 | Хеширование паролей с солью |
| JWT | Короткоживущие access токены (15 мин) |
| Refresh Token Rotation | Каждый refresh выдаёт новый токен, старый отзывается |
| HTTP-only Cookies | Токены недоступны через `document.cookie` |
| Secure + SameSite=Lax | Защита cookies от CSRF и передачи по HTTP |
| Input Validation | Валидация телефона, ФИО, пароля на backend |
| Auth Middleware | Все защищённые маршруты проверяют JWT |

