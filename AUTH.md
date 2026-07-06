# Telegram Mini App Authentication

## Overview

Приложение использует **Telegram Mini App SDK** для авторизации пользователей через `initData`. При первом запуске:
1. Получаются данные пользователя из Telegram
2. Отправляются на backend `/auth/telegram`
3. Backend создает студента с uuid если его еще нет
4. Возвращается JWT токен для всех последующих запросов

## Setup

### Environment Variables

```env
VITE_APP_BASE_URL=http://localhost:3000/api
VITE_APP_TEST_USER_ID=<test-student-uuid>
VITE_APP_TEST_INSTRUCTOR_ID=<test-instructor-uuid>
```

### Initialization

В `main.ts` уже подключены:
- `WebApp.ready()` - сигнализирует Telegram что приложение готово
- `WebApp.expand()` - разворачивает Mini App на весь экран

### Stores

**useAuthStore** - управляет авторизацией:

```typescript
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Авторизация
await authStore.loginWithTelegram(WebApp.initData)

// Проверка авторизации
if (authStore.isAuthenticated) {
  console.log('Logged in as:', authStore.user?.displayName)
}

// Выход
authStore.clearAuth()
```

## How It Works

### Frontend Flow

1. **App.vue** `onMounted`:
   - Проверяет есть ли уже сохраненный токен в `localStorage`
   - Если токена нет - получает `WebApp.initData` и вызывает авторизацию
   - Сохраняет `token` в `localStorage` и в API client headers

2. **API Client** (`src/api/client.ts`):
   - Функция `setAuthToken()` добавляет `Authorization: Bearer <token>` к каждому запросу
   - При успешной авторизации токен автоматически отправляется со всеми последующими запросами

3. **User Store** (`src/stores/userStore.ts`):
   - Загружает профиль студента используя `studentId` из `authStore`

### Backend Flow

1. **POST /api/auth/telegram**:
   - Парсит `initData` из request body
   - Извлекает `telegramId` пользователя
   - Ищет существующего User по `telegramId`

2. **Если User существует**:
   - Генерирует JWT токен
   - Возвращает token и studentId

3. **Если User новый (первый вход)**:
   - Создает User с `telegramId`, `telegramUsername`, `displayName`
   - Создает Student с `uuid` и назначает на инструктора по умолчанию
   - Генерирует JWT токен
   - Возвращает token и studentId

## Dev Mode

Для локального тестирования можно отключить Telegram авторизацию:

```env
# backend/.env
DEV_AUTH_ENABLED=true
DEV_AUTH_ROLE=STUDENT
```

В этом режиме:
- `DevAuthMiddleware` автоматически добавляет пользователя в `req.user`
- JWT токен не требуется
- Можно тестировать frontend без Telegram SDK

## Error Handling

При ошибке авторизации App.vue показывает сообщение об ошибке:

```vue
<div v-if="initError" class="error-container">
  <p>Ошибка авторизации: {{ initError }}</p>
</div>
```

Обычные ошибки:
- `"initData is required"` - приложение запущено не из Telegram
- `"Invalid telegram init data format"` - некорректные данные от Telegram
- Сетевые ошибки - backend недоступен

## Token Persistence

- Токен сохраняется в `localStorage` как `auth_token`
- `studentId` сохраняется в `localStorage` как `student_id`
- При перезагрузке страницы токен автоматически восстанавливается
- При выходе - `clearAuth()` очищает localStorage и headers

## Production Deployment

Для production:

1. Убедитесь что `DEV_AUTH_ENABLED=false` на backend
2. Установите `JWT_SECRET` в .env backend (генерируется при деплое)
3. Frontend получит `VITE_APP_BASE_URL` из переменных окружения при сборке
4. Все запросы автоматически будут отправлять JWT токен в Authorization header
