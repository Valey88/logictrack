# LogiTrack TMS Backend

Современный бекенд для системы управления транспортом (TMS) на базе FastAPI.

## Технологии

- **FastAPI** - современный веб-фреймворк для Python
- **PostgreSQL** - реляционная БД с поддержкой геоданных
- **PostGIS** - расширение PostgreSQL для работы с геопространственными данными
- **SQLAlchemy** - ORM для работы с БД
- **GeoAlchemy2** - поддержка геоданных в SQLAlchemy
- **JWT** - аутентификация через токены
- **WebSocket** - real-time обновления GPS координат

## Структура проекта

```
backend/
├── app/
│   ├── api/              # API эндпоинты
│   │   ├── auth.py       # Аутентификация
│   │   ├── vehicles.py   # Управление транспортом
│   │   ├── orders.py     # Управление заказами
│   │   ├── fuel.py       # Учет топлива и аналитика
│   │   ├── maintenance.py # ТО и ремонты
│   │   ├── dashboard.py  # Статистика дашборда
│   │   └── tracking.py   # GPS трекинг и WebSocket
│   ├── core/             # Ядро приложения
│   │   ├── config.py     # Конфигурация
│   │   ├── database.py   # Подключение к БД
│   │   └── security.py   # JWT и безопасность
│   ├── models.py         # SQLAlchemy модели
│   └── schemas.py        # Pydantic схемы
├── main.py               # Точка входа
├── init_db.py            # Инициализация БД
└── requirements.txt      # Зависимости
```

## Установка и запуск

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Настройка PostgreSQL с PostGIS

Убедитесь, что у вас установлен PostgreSQL с расширением PostGIS:

```sql
CREATE DATABASE logitrack_tms;
\c logitrack_tms
CREATE EXTENSION postgis;
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/logitrack_tms
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Инициализация базы данных

```bash
python init_db.py
```

Это создаст все таблицы и создаст начального администратора:

- Email: `admin@logitrack.com`
- Password: `admin123`

⚠️ **Важно**: Измените пароль администратора в продакшене!

### 5. Запуск сервера

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Или через Python:

```bash
python main.py
```

Сервер будет доступен по адресу: `http://localhost:8000`

## API Документация

После запуска сервера доступна автоматическая документация:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Основные эндпоинты

### Аутентификация

- `POST /api/v1/auth/login` - Вход (получение JWT токена)
- `POST /api/v1/auth/register` - Регистрация
- `GET /api/v1/auth/me` - Текущий пользователь

### Транспорт

- `GET /api/v1/vehicles` - Список транспорта
- `POST /api/v1/vehicles` - Создать транспорт
- `GET /api/v1/vehicles/{id}` - Получить транспорт
- `PATCH /api/v1/vehicles/{id}` - Обновить транспорт
- `DELETE /api/v1/vehicles/{id}` - Удалить транспорт

### Заказы

- `GET /api/v1/orders` - Список заказов
- `POST /api/v1/orders` - Создать заказ
- `PATCH /api/v1/orders/{id}` - Обновить заказ (статус, назначение транспорта)

### Топливо

- `GET /api/v1/fuel` - Список записей о заправках
- `POST /api/v1/fuel` - Создать запись о заправке
- `GET /api/v1/fuel/analytics/overconsumption` - Аналитика перерасхода

### ТО и ремонты

- `GET /api/v1/maintenance` - Список записей ТО
- `POST /api/v1/maintenance` - Создать запись ТО

### Дашборд

- `GET /api/v1/dashboard/stats` - Статистика для дашборда

### GPS Трекинг

- `WebSocket /api/v1/tracking/ws` - WebSocket для real-time обновлений
- `POST /api/v1/tracking/points` - Создать точку трекинга (для GPS устройств)
- `GET /api/v1/tracking/vehicles/{id}/history` - История трекинга транспорта

## Роли пользователей

- **ADMIN** - Полный доступ ко всем функциям
- **DISPATCHER** - Управление транспортом и заказами
- **DRIVER** - Доступ к мобильному приложению водителя
- **CLIENT** - Доступ к клиентскому порталу

## WebSocket для real-time tracking

Подключение к WebSocket:

```javascript
const ws = new WebSocket("ws://localhost:8000/api/v1/tracking/ws");

// Подписка на обновления конкретного транспорта
ws.send(
  JSON.stringify({
    type: "subscribe",
    vehicle_id: 1,
  })
);

// Получение обновлений
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "vehicle_update") {
    console.log("Vehicle update:", data.data);
  }
};
```

## Особенности реализации

1. **Геоданные**: Используется PostGIS для хранения координат и выполнения пространственных запросов
2. **Real-time**: WebSocket для обновления позиций транспорта в реальном времени
3. **Аналитика топлива**: Автоматический расчет перерасхода на основе норм расхода
4. **Безопасность**: JWT токены, хеширование паролей, проверка ролей

## Разработка

Для разработки рекомендуется использовать виртуальное окружение:

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

## Docker

Для запуска через Docker используйте `docker-compose.yml`:

```bash
docker-compose up -d
```

Это запустит PostgreSQL с PostGIS и настроит подключение.

## Лицензия

MIT
