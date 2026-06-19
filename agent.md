# Moto Mini App — актуальная карта проекта

Последнее обновление: 19 июня 2026.

Этот файл — рабочий source of truth для будущих задач. Если старые обсуждения или комментарии противоречат этому документу, ориентироваться на этот файл, `API.md` и текущий код.

## Продукт

Telegram Mini App для мотошколы Никиты.

Роли:

- `student` — ученик: профиль, запись, мои тренировки, видео.
- `instructor` — Никита: ученики, слоты, заявки, переносы, календарь, отчеты.
- `admin` зарезервирован в backend/user model, но во frontend UI сейчас не используется.

## Стек

Frontend:

- Vue 3 Composition API.
- TypeScript.
- Vite.
- Pinia.
- Axios.
- PrimeVue + PrimeIcons.
- Telegram Mini App SDK через `@twa-dev/sdk`.

Backend:

- NestJS.
- Prisma.
- PostgreSQL.
- API prefix: `/api`.
- Dev backend по умолчанию: `http://127.0.0.1:3001/api`.
- Auth пока dev/mock: `VITE_APP_TEST_USER_ID`, `VITE_APP_TEST_INSTRUCTOR_ID`.

## Текущая структура frontend

```text
src/
├── api/                         # axios API wrappers + normalizers
│   ├── bookingSlots.ts
│   ├── client.ts
│   ├── health.ts
│   ├── instructors.ts
│   ├── normalizers.ts
│   ├── packages.ts
│   ├── skills.ts
│   ├── studentProfile.ts
│   ├── students.ts
│   ├── trainingHistory.ts
│   ├── trainingReports.ts
│   └── videos.ts
├── components/
│   ├── CompleteTrainingDialog.vue
│   ├── LessonCard.vue
│   ├── MetricCard.vue
│   ├── SectionHeader.vue
│   ├── SkillProgress.vue
│   └── VideoCard.vue
├── composables/
│   ├── useBookingStore.ts       # booking slots/calendar actions
│   └── useTrainingStore.ts      # reports/history/videos/packages helpers
├── constants/
│   ├── locations.ts
│   └── trainingContent.ts
├── dictionary/
│   └── durationOptions.ts
├── layouts/
│   └── AppShell.vue
├── stores/
│   ├── studentsStore.ts         # instructor student list/edit/package/skills
│   └── userStore.ts             # current student/instructor profile, health, skills
├── types/
│   ├── api.ts
│   ├── booking.ts
│   ├── instructor.ts
│   ├── package.ts
│   ├── skill.ts
│   ├── student.ts
│   ├── training.ts
│   └── user.ts
├── views/
│   ├── VideosView.vue
│   ├── instructor/
│   │   ├── BookingView.vue
│   │   ├── InstructorDashboard.vue
│   │   └── InstructorProfileView.vue
│   └── student/
│       ├── MyTrainingsView.vue
│       ├── StudentDashboard.vue
│       └── StudentProfileView.vue
├── App.vue
├── main.ts
└── style.css
```

## API layer

Базовый URL берется из:

1. `VITE_APP_BASE_URL`
2. `VITE_API_BASE_URL`
3. fallback `http://127.0.0.1:3001/api`

Все frontend API calls должны идти через `src/api/*` и `API_ENDPOINTS` из `src/types/api.ts`.

Важно:

- Не делать запросы на `/students` без `/api`.
- Не делать `/api/api/...`.
- Payload должен соответствовать DTO из `API.md`.
- Не отправлять поля, которых нет в DTO.
- Для report использовать `trainedSkills`, `improved`, `nextFocus`, `levelUpdate`.
- Не возвращать старые `notes/comment` поля в report DTO.

## Booking statuses

Единственный актуальный набор статусов:

```ts
type BookingSlotStatus =
  | 'available'
  | 'requested'
  | 'reschedule'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
```

Не использовать старые статусы:

- `unavailable`
- `rescheduleRequested`
- `rescheduled`
- `next`

## Booking flow

### `available`

Свободный слот.

Показывается:

- ученикам как доступное время;
- Никите в слотах для записи;
- в календаре Никиты как свободное окно.

Можно:

- редактировать;
- удалить;
- запросить учеником.

### `requested`

Ученик отправил заявку.

Показывается:

- Никите в “Новые запросы на запись”;
- ученику в “Ближайшая тренировка” / “Мои тренировки” как ожидание подтверждения.

Не показывается как свободный слот другим ученикам.

### `reschedule`

Ученик запросил перенос confirmed-тренировки.

Показывается:

- Никите в “Запросы на перенос”;
- ученику как ожидание переноса;
- в календаре Никиты как `запрос на перенос`.

Не должен попадать в “Новые запросы на запись”.

UI показывает компактно:

```text
17 мая 17:30 → 18 мая 09:00
```

### `confirmed`

Никита подтвердил заявку или перенос.

Показывается:

- ученику в “Ближайшая тренировка” и “Мои тренировки”;
- Никите в “Сегодня”, если дата сегодня;
- Никите в календаре.

Не показывается как свободный слот.

### `completed`

Тренировка проведена.

Показывается:

- в истории тренировок;
- в отчетах;
- во вкладке видео, если есть видео.

Не показывается:

- в свободных слотах;
- в “Сегодня”;
- в активных тренировках ученика.

### `cancelled`

Используется для instructor decline (`requested/reschedule -> cancelled`).

Для ученической отмены не использовать как финальное UI-состояние: cancel возвращает тот же слот в `available`.

## Student cancel flow

Endpoint:

```http
POST /api/booking-slots/:slotId/cancel
```

Allowed statuses:

- `requested`
- `reschedule`
- `confirmed`

После cancel:

- тот же `BookingSlot` становится `available`;
- `studentId`, requester, comments, final location, previous time fields очищаются;
- новый слот не создается;
- слот снова доступен ученикам;
- у ученика тренировка исчезает из “Ближайшая тренировка” и “Мои тренировки”;
- у Никиты исчезает из “Сегодня”, “Новые запросы”, “Запросы на перенос” и занятой части календаря.

Текст предупреждения в UI:

```text
Если отмена происходит в день тренировки, занятие считается проведенным и может быть списано из пакета.
```

## Reschedule flow

Не переписывать без прямого запроса.

Текущая frontend-логика:

1. Ученик нажимает “Перенести” у `confirmed` тренировки.
2. `MyTrainingsView` включает локальный режим переноса.
3. Экран плавно скроллится к существующей секции свободных слотов.
4. Над слотами показывается плашка:
   - “Выберите новое время”
   - “Перенос тренировки <дата> • <время>”
   - “Отменить перенос”
5. Кнопки available-слотов меняются на “Выбрать новое время”.
6. “Отменить перенос” сбрасывает только local UI state и не вызывает backend.
7. Выбор нового времени вызывает `POST /booking-slots/:slotId/reschedule`.
8. Никита видит запрос в “Запросы на перенос”.
9. `POST /booking-slots/:slotId/confirm` подтверждает перенос.

После подтвержденного переноса backend/current data model может вернуть несколько измененных слотов. Frontend `useBookingStore` умеет upsertить:

- single slot response;
- `slot`;
- `oldSlot` / `previousSlot` / `availableSlot`;
- `newSlot` / `targetSlot` / `confirmedSlot`;
- `slots` / `bookingSlots` / `updatedSlots`.

Ожидаемое состояние после подтверждения переноса:

- старое окно снова `available`;
- новая тренировка `confirmed`;
- у ученика видна только новая confirmed-тренировка;
- старое время доступно другим ученикам.

## Instructor dashboard

`src/views/instructor/InstructorDashboard.vue`

Содержит:

- “Сегодня” — только текущий день и статусы `requested`, `reschedule`, `confirmed`.
- “Новые запросы на запись” — только `requested`.
- “Запросы на перенос” — только `reschedule`.
- “Календарь” agenda-view с фильтрами:
  - Все
  - Свободно
  - Ожидают
  - Переносы
  - Подтверждено
  - Проведено

Отдельного блока “Подтвержденные тренировки” на главной нет.

## Student trainings

`src/views/student/MyTrainingsView.vue`

Показывает:

- “Ближайшая тренировка” — ближайшая активная тренировка ученика;
- “Мои тренировки” — все активные тренировки ученика со статусами `requested`, `reschedule`, `confirmed`;
- “Свободное время” — только `available`;
- кнопка “Перенести” только у `confirmed`;
- кнопка “Отменить” у активных тренировок.

## Reports and history

Отчет после тренировки содержит только:

- что тренировали (`trainedSkills`);
- что получилось (`improved`);
- на что обратить внимание (`nextFocus`);
- уровень ученика (`levelUpdate`, optional).

Не использовать:

- “Комментарий для ученика”;
- “Заметки инструктора”;
- генерацию hero notes из отчета.

После сохранения отчета:

- backend создает report;
- backend создает training history;
- slot становится `completed`;
- история и календарь обновляются из API.

История тренировок показывает:

- дата;
- длительность;
- локация, если есть;
- что тренировали;
- что получилось;
- на что обратить внимание;
- видео, если есть.

Не дублировать навыки отдельными тегами, если они уже перечислены как текст.

## Skills progress

В “Прогрессе навыков” показывать только:

- название навыка;
- процент.

Не показывать старые mock descriptions/notes под навыками.

## Training packages

Пакет тренировок — ручной учет текущего активного пакета.

Поля:

- `totalTrainings`;
- `completedTrainings`;
- `paymentStatus`;
- `startedAt`;
- `endedAt`;
- `isActive`.

Важно:

- отчет после тренировки не увеличивает пакет автоматически;
- история тренировок отдельно;
- общий счетчик проведенных тренировок считается из history/profile, не из ручного пакета.

## Manual training history

Ручное добавление тренировки существующему ученику:

```http
POST /api/students/:studentId/training-history/manual
```

Это уже проведенная тренировка:

- не создает booking slot;
- не попадает в расписание;
- добавляется в историю;
- видео добавляется отдельно через training history video endpoint, если указано.

## Videos

Видео привязано к конкретной training history:

```http
POST /api/training-history/:historyId/videos
```

Во frontend видео показывается из profile/history response.

## Stores

`useBookingStore`:

- хранит slots;
- загружает all slots, student slots и instructor calendar;
- делает booking write actions;
- не должен глобально переписываться без прямого запроса;
- при backend error показывает ошибку и не должен silently mutate confirmed backend state.

`useTrainingStore`:

- сохраняет reports/history/videos/packages через API wrappers;
- после write action перезагружает profile/history там, где нужно.

`useUserStore`:

- health;
- current student profile;
- instructor profile;
- students list;
- skills dictionary.

`useStudentsStore`:

- instructor student list;
- create/update student;
- package;
- skills.

## UI rules

- Сохранять текущий dark premium стиль.
- Не делать landing вместо рабочего экрана.
- Не добавлять большие визуальные рефакторы без прямого запроса.
- PrimeVue components использовать в существующем стиле.
- Mobile-first.
- Проверять, что текст не вылезает из кнопок/карточек.

## Safety rules for future work

Проект считается стабильным.

Нельзя без прямого запроса:

- менять backend endpoints;
- менять Prisma schema;
- менять модель статусов;
- переписывать booking/reschedule/cancel flow;
- глобально переписывать stores;
- удалять fallback/dev guards;
- менять визуальный стиль;
- трогать unrelated files;
- объединять несколько задач в одну.

Перед изменениями:

1. Прочитать `agent.md` и `API.md`.
2. Найти текущую рабочую логику.
3. Кратко описать, что будет изменено.
4. Менять минимальный набор файлов.
5. Проверять build/dev smoke-check, если задача frontend.

Проверки:

- Frontend: `npm run build`.
- Frontend UI: `npm run dev` + browser smoke-check.
- Backend: `npx prisma migrate status` и `npm run build`.
- API changes: Network без 400/404.

## Current known recent changes

- Instructor `BookingView` DatePicker ограничивает выбор прошлыми датами/временем через `minDate`.
- Student cancel warning text: “занятие считается проведенным…”.
- Student reschedule UX: автоскролл к слотам, плашка режима переноса, local-only cancel move mode.
