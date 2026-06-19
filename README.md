# Moto Mini App

Telegram Mini App для мотошколы Никиты: запись на тренировки, переносы, отмены, календарь инструктора, профили учеников, пакеты, навыки, отчеты, история и видео.

## Документация

- `agent.md` — актуальная карта frontend-функционала, структуры проекта и правил безопасной работы.
- `API.md` — backend endpoints, DTO, статусы и бизнес-правила.
- `FRONTEND_INTEGRATION.md` — как frontend подключен к backend и какие stores/services использовать.

Перед новой задачей сначала читать `agent.md` и `API.md`.

## Стек

- Vue 3 + TypeScript + Vite.
- Pinia.
- Axios.
- PrimeVue + PrimeIcons.
- Telegram Mini App SDK.
- Backend: NestJS + Prisma + PostgreSQL.

## Запуск frontend

```bash
npm install
npm run dev
```

Production/build check:

```bash
npm run build
```

`npm run build` запускает тесты, type-check и Vite build.

## Окружение

Frontend API base URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:3001/api
VITE_APP_TEST_USER_ID=<student-uuid>
VITE_APP_TEST_INSTRUCTOR_ID=<instructor-uuid>
```

Backend routes имеют prefix `/api`.

## Главные правила

- Не переписывать booking/reschedule/cancel flow без прямого запроса.
- Не менять статусы, Prisma schema или backend endpoints без прямого запроса.
- Не трогать unrelated files.
- Сохранять dark premium UI.
- Для frontend изменений проверять `npm run build` и `npm run dev` smoke-check.
