# Moto Mini App — Frontend Integration

Последнее обновление: 19 июня 2026.

Этот документ описывает текущую интеграцию Vue frontend с backend API. Для бизнес-правил и общей карты проекта см. `agent.md`. Для DTO и endpoint contracts см. `API.md`.

## Base URL

Axios client:

```ts
src/api/client.ts
```

Base URL выбирается так:

1. `VITE_APP_BASE_URL`
2. `VITE_API_BASE_URL`
3. `http://127.0.0.1:3001/api`

Все paths в `src/types/api.ts` хранятся без `/api`, потому что prefix уже находится в `baseURL`.

Не делать:

- `/students` без `/api`;
- `/api/api/students`;
- raw axios/fetch внутри views.

## Main frontend layers

```text
src/types/*       # frontend/API types and API_ENDPOINTS
src/api/*         # axios wrappers and normalizers
src/stores/*      # Pinia stores for user/students
src/composables/* # booking/training workflow stores
src/views/*       # UI only, no raw REST calls
```

## API services

Current wrappers:

- `src/api/health.ts`
- `src/api/students.ts`
- `src/api/studentProfile.ts`
- `src/api/instructors.ts`
- `src/api/skills.ts`
- `src/api/packages.ts`
- `src/api/bookingSlots.ts`
- `src/api/trainingReports.ts`
- `src/api/trainingHistory.ts`
- `src/api/videos.ts`

Normalizers:

- `src/api/normalizers.ts`
- Convert backend ISO dates to current UI date/time strings.
- Convert backend UUID ids to stable numeric UI ids where existing UI still expects numbers.
- Preserve `apiId` for write actions.
- Preserve `previousStartsAt`/`previousDurationMinutes` as `previousDate`/`previousTime`/`previousDuration`.

## Stores and composables

### `useUserStore`

File:

```text
src/stores/userStore.ts
```

Responsibilities:

- backend health;
- current student profile;
- instructor profile;
- students list;
- skills dictionary.

Uses:

- `GET /health`
- `GET /students`
- `GET /students/:id/profile`
- `GET /instructors/:id/profile`
- `GET /skills`

### `useStudentsStore`

File:

```text
src/stores/studentsStore.ts
```

Responsibilities:

- instructor student list;
- create/update student;
- load/save active package;
- load/save student skills.

Uses:

- `GET /students`
- `POST /students`
- `PATCH /students/:studentId`
- `GET /students/:studentId/package`
- `PUT /students/:studentId/package`
- `GET /students/:studentId/skills`
- `PUT /students/:studentId/skills`

### `useBookingStore`

File:

```text
src/composables/useBookingStore.ts
```

Responsibilities:

- all/student booking slots;
- instructor calendar;
- create/update/delete available slots;
- request/confirm/decline/reschedule/cancel actions.

Uses:

- `GET /booking-slots`
- `GET /booking-slots?studentId=<uuid>`
- `POST /booking-slots`
- `PATCH /booking-slots/:slotId`
- `DELETE /booking-slots/:slotId`
- `POST /booking-slots/:slotId/request`
- `POST /booking-slots/:slotId/confirm`
- `POST /booking-slots/:slotId/decline`
- `POST /booking-slots/:slotId/reschedule`
- `POST /booking-slots/:slotId/cancel`
- `GET /instructor/calendar`

Important:

- `bookingManagementSlots` returns only `available` + `requested`.
- `availableSlots` returns only `available`.
- `requestedSlots` returns only `requested`.
- `rescheduleSlots` returns only `reschedule`.
- active student slots are `requested`, `reschedule`, `confirmed`.
- instructor calendar merge keeps `available` slots from booking-slots and busy events from calendar.

### `useTrainingStore`

File:

```text
src/composables/useTrainingStore.ts
```

Responsibilities:

- create training reports;
- read/update history in loaded profile;
- add manual training history;
- add training videos;
- update student package and skills through API wrappers.

Uses:

- `POST /training-reports`
- `POST /students/:studentId/training-history/manual`
- `POST /training-history/:historyId/videos`
- package/skills endpoints through wrappers.

## Booking flow in frontend

### Available slots

Student:

- shown in `src/views/student/MyTrainingsView.vue`;
- button: “Забронировать время”;
- request action: `requestSlot`.

Instructor:

- shown in `src/views/instructor/BookingView.vue`;
- can create/edit/delete only available slots.

### Requested

Student:

- visible in “Ближайшая тренировка” / “Мои тренировки” as waiting.

Instructor:

- visible only in “Новые запросы на запись”.

Action:

- confirm through `confirmSlot`;
- decline through `declineSlot`.

### Reschedule

Student UX:

- button “Перенести” only on `confirmed`;
- local mode scrolls to available slots;
- banner shows:
  - “Выберите новое время”
  - “Перенос тренировки <date> • <time>”
  - “Отменить перенос”
- canceling this mode is local-only and must not call backend.

Backend action:

```http
POST /api/booking-slots/:slotId/reschedule
```

Instructor:

- visible only in “Запросы на перенос”;
- text format: `<old date/time> → <new date/time>`;
- confirm uses the same `POST /confirm` endpoint;
- decline uses `POST /decline`.

After confirmed reschedule:

- old window becomes `available`;
- new training is `confirmed`;
- student sees only new confirmed training;
- other students can book old window.

`useBookingStore` accepts both single-slot and multi-slot response shapes for this flow.

### Cancel by student

Frontend action:

```ts
cancelSlot(slot.id)
```

Endpoint:

```http
POST /api/booking-slots/:slotId/cancel
```

Allowed frontend statuses:

- `requested`
- `reschedule`
- `confirmed`

After success:

- same slot becomes `available`;
- student fields are cleared;
- active training disappears from student UI;
- slot appears again in available slots.

Do not use `cancelled` for student cancel final state.

## Reports

Report dialog lives in:

```text
src/components/CompleteTrainingDialog.vue
```

Payload:

```ts
{
  slotId: string
  studentId: string
  trainedSkills: string[]
  improved: string
  nextFocus: string
  levelUpdate?: StudentLevel
}
```

UI fields:

- what was trained;
- what improved;
- what to focus on;
- level update.

Do not send:

- `notes`;
- `comment`;
- old “Комментарий для ученика”.

After save:

- backend creates report;
- backend creates training history;
- backend marks slot `completed`;
- frontend refreshes calendar/history/profile as needed.

## Manual training history

Manual history is for already completed lessons of an existing student.

Endpoint:

```http
POST /api/students/:studentId/training-history/manual
```

It must not:

- create a booking slot;
- appear in available slots;
- appear as upcoming training.

Videos are attached through:

```http
POST /api/training-history/:historyId/videos
```

## Student profile

Profile is loaded through:

```http
GET /api/students/:id/profile
```

Frontend source:

```text
src/stores/userStore.ts
src/api/studentProfile.ts
```

Profile displays:

- active package;
- skills with name + percent only;
- history;
- videos;
- active/upcoming booking data when present.

No “Заметки инструктора” block should be reintroduced.

## Instructor calendar

View:

```text
src/views/instructor/InstructorDashboard.vue
```

Filters:

- all;
- available;
- requested;
- reschedule;
- confirmed;
- completed.

“Сегодня” remains a short focus block and shows only current-day:

- `requested`;
- `reschedule`;
- `confirmed`.

It does not show:

- `available`;
- `completed`;
- `cancelled`.

## Validation before finishing frontend tasks

Required:

```bash
npm run build
```

For UI changes:

```bash
npm run dev
```

Then smoke-check in browser. If API requests changed, check Network for no 400/404.
