# API Server для мобильного приложения

Простой Express сервер для подключения к Neon PostgreSQL базе данных.

## Запуск

```bash
cd api-server
npm install
npm run dev
```

Сервер запустится на `http://0.0.0.0:3001` и будет доступен по IP адресу `http://192.168.0.20:3001`.

## Эндпоинты

- `GET /api/test-db` - проверка подключения к БД
- `GET /api/expenses` - получить все расходы
- `POST /api/expenses` - создать расход
- `DELETE /api/expenses/:id` - удалить расход
- `GET /api/categories` - получить категории
- `POST /api/categories` - создать категорию
- `GET /api/leaderboard` - получить лидерборд
- `GET /api/posts` - получить посты
- `POST /api/posts` - создать пост
- `GET /api/profile` - получить профиль
- `PUT /api/profile` - обновить профиль

## Примечание

Для тестирования используется первый пользователь из базы данных. В продакшене нужно добавить авторизацию.

