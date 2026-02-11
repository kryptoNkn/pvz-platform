# PVZ Platform

Учебный проект: Пункты выдачи маркетплейсов (Points of Service)

## Требования

### Backend
- **Go** версия 1.25.6 или выше
- **Git** для клонирования репозитория

### Frontend
- **Node.js** версия 18.x или выше
- **npm** версия 9.x или выше (или yarn/pnpm)
- **Git** для клонирования репозитория

## Установка и запуск

### Backend

#### 1. Установка зависимостей
```bash
cd backend
go mod download
go mod tidy
```

#### 2. Запуск сервера
```bash
go run cmd/server/main.go
```

Сервер запустится на `http://localhost:8080`

#### Проверка работы
```bash
curl http://localhost:8080/health
```

Ожидаемый результат:
```json
{
  "status": "ok"
}
```

### Frontend

#### 1. Установка зависимостей
```bash
cd frontend
npm install
```

Используемые зависимости:
- **React** 19.2.0 - библиотека для построения UI
- **Vite** 7.3.1 - build tool и dev сервер
- **TypeScript** 5.9.3 - статическая типизация
- **Sass** 1.97.3 - препроцессор CSS
- **Axios** 1.13.5 - HTTP клиент
- **ESLint** 9.39.1 - линтер кода

#### 2. Запуск в режиме разработки
```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

#### 3. Сборка для продакшена
```bash
npm run build
```

Собранные файлы будут в папке `dist/`

#### 4. Предпросмотр собранного приложения
```bash
npm run preview
```

#### 5. Проверка кода линтером
```bash
npm run lint
```

## Структура проекта

```
pvz-platform/
├── backend/                 # Go приложение
│   ├── cmd/
│   │   └── server/         # Entry point приложения
│   │       └── main.go
│   ├── internal/           # Внутренние пакеты
│   │   ├── config/         # Конфигурация
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/     # Middleware
│   │   ├── models/         # Структуры данных
│   │   ├── repository/     # Работа с БД
│   │   ├── routes/         # Роуты
│   │   └── services/       # Бизнес логика
│   └── go.mod             # Go модули
│
└── frontend/              # React приложение
    ├── src/
    │   ├── components/     # React компоненты
    │   ├── pages/         # Страницы приложения
    │   ├── api/           # API интеграция (Axios)
    │   ├── types/         # TypeScript типы
    │   ├── assets/        # Изображения, иконки
    │   ├── App.tsx        # Главный компонент
    │   ├── App.module.scss # Стили приложения
    │   ├── main.tsx       # Entry point
    │   └── index.css      # Глобальные стили
    ├── public/            # Статические файлы
    ├── package.json       # Зависимости NPM
    ├── vite.config.ts     # Конфиг Vite
    ├── tsconfig.json      # Конфиг TypeScript
    └── eslint.config.js   # Конфиг ESLint
```

## Стек технологий

| Компонент | Технология | Версия |
|-----------|-----------|--------|
| **Backend** | Go + Echo | 1.25.6 / 4.15.0 |
| **Frontend** | React | 19.2.0 |
| **Build Tool** | Vite | 7.3.1 |
| **Язык (Frontend)** | TypeScript | 5.9.3 |
| **Стили** | Sass | 1.97.3 |
| **HTTP Клиент** | Axios | 1.13.5 |
| **Линтер** | ESLint | 9.39.1 |

## Разработка

### Быстрый старт обоих приложений

1. **Терминал 1 - Backend:**
```bash
cd backend
go run cmd/server/main.go
```

2. **Терминал 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Откройте в браузере `http://localhost:5173`

### Структура коммитов

При разработке следует разделять коммиты для backend и frontend:
- `[backend] описание изменений`
- `[frontend] описание изменений`

## Решение проблем

### Frontend не видит backend
Убедитесь, что:
1. Backend сервер запущен на `http://localhost:8080`
2. Нет CORS проблем (настроить в backend при необходимости)
3. Axios клиент правильно сконфигурирован (см. `frontend/src/api/axios.ts`)

### Горячая перезагрузка не работает
```bash
cd frontend
npm install
npm run dev
```

### Ошибки TypeScript
```bash
cd frontend
npx tsc --noEmit  # Проверить ошибки
npm run build     # Полная сборка
```

## Примечания

- Frontend использует **CSS Modules** с Sass для стилизации
- Backend построен на **Echo** фреймворке
- API интеграция осуществляется через **Axios**
