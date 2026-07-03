<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {TEST_USER_ID} from '@/api/client.ts'
import SectionHeader from '@/components/SectionHeader.vue'
import {useBookingStore} from '@/composables/useBookingStore.ts'
import type {BookingSlot} from '@/types/booking'
import { useUserStore } from '@/stores/userStore'
import dayjs from 'dayjs'

const props = defineProps<{
  role: 'student' | 'instructor'
}>()

const { addSlot, bookingManagementSlots, loadAllBookingSlots, removeSlot, requestSlot, updateSlot, availableSlots, slots } = useBookingStore()
const userStore = useUserStore()
const currentStudentId = userStore.profile?.apiId || TEST_USER_ID
const addOneSlotDialogOpen = ref(false)
const addDaySlotDialogOpen = ref(false)
const editingSlotId = ref<number | null>(null)
const durationOptions = ['30 мин', '60 мин', '90 мин', '120 мин']
const minSelectableDate = dayjs().startOf('day').toDate()
const tomorrowAtNine = dayjs().add(1, 'day').set('hour', 9).startOf('hour')
const tomorrowAt17 = dayjs().add(1, 'day').set('hour', 17).startOf('hour')
const oneSlotForm = ref({
  dateValue: new Date(),
  timeValue: '11:30',
  duration: '90 мин',
})
const daySlotForm = ref({
  dateValue: new Date(),
  timeStart: tomorrowAtNine.toDate(),
  timeEnd: tomorrowAt17.toDate(),
  duration: '60 мин',
})
const daySlotMessage = ref('')
const bookedSlotId = ref<number | null>(null)
const visibleSlots = computed(() =>
  props.role === 'instructor' ? bookingManagementSlots.value : availableSlots.value,
)

function durationText(duration: string) {
  return duration.replace('мин', 'минут')
}

function statusLabel(status: BookingSlot["status"]) {
  const labels = {
    available: 'Свободно',
    requested: 'Ожидает подтверждения',
    reschedule: 'Запрос на перенос',
    confirmed: 'Подтверждено',
    cancelled: 'Отменено',
    completed: 'Проведено',
  }

  return labels[status]
}

function statusSeverity(status: BookingSlot['status']) {
  if (status === 'confirmed' || status === 'completed') {
    return 'success'
  }

  if (status === 'requested' || status === 'reschedule') {
    return 'warn'
  }

  return 'secondary'
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(value).replace(' г.', '')
}

function parseSlotDate(value: string) {
  const monthMap: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  }
  const [day, month] = value.split(' ')

  return new Date(2026, monthMap[month] ?? 4, Number(day) || 1)
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
}

function dateWithTime(date: Date, time: Date) {
  return dayjs(date)
    .hour(time.getHours())
    .minute(time.getMinutes())
    .second(0)
    .millisecond(0)
}

function durationMinutes(value: string) {
  return Number.parseInt(value, 10) || 60
}

function openAddSlot() {
  editingSlotId.value = null
  oneSlotForm.value = {
    dateValue: new Date(),
    timeValue: '11:30',
    duration: '90 мин',
  }
  addOneSlotDialogOpen.value = true
}

function openAddDaySlot() {
  daySlotForm.value = {
    dateValue: tomorrowAtNine.toDate(),
    timeStart: tomorrowAtNine.toDate(),
    timeEnd: tomorrowAt17.toDate(),
    duration: '60 мин',
  }
  daySlotMessage.value = ''
  addDaySlotDialogOpen.value = true
}

function openEditSlot(slot: BookingSlot) {
  const dateValue = parseSlotDate(slot.date)
  editingSlotId.value = slot.id
  oneSlotForm.value = {
    dateValue,
    timeValue: slot.time,
    duration: slot.duration,
  }
  addOneSlotDialogOpen.value = true
}

async function saveSlot() {
  const currentSlot = editingSlotId.value ? slots.value.find((slot) => slot.id === editingSlotId.value) : null
  const [hours, minutes] = oneSlotForm.value.timeValue.split(':').map(Number)
  const slotDateTime = dayjs(oneSlotForm.value.dateValue)
    .hour(hours || 0)
    .minute(minutes || 0)
    .second(0)
    .millisecond(0)

  if (slotDateTime.isBefore(dayjs())) {
    return
  }

  const nextSlot = {
    date: formatDate(oneSlotForm.value.dateValue),
    time: oneSlotForm.value.timeValue,
    duration: oneSlotForm.value.duration,
    status: currentSlot?.status ?? 'available',
  }

  if (editingSlotId.value) {
    await updateSlot(editingSlotId.value, nextSlot)
  } else {
    await addSlot(nextSlot)
  }
  await loadAllBookingSlots()
  addOneSlotDialogOpen.value = false
}

async function saveDaySlots() {
  daySlotMessage.value = ''

  const start = dateWithTime(daySlotForm.value.dateValue, daySlotForm.value.timeStart)
  const end = dateWithTime(daySlotForm.value.dateValue, daySlotForm.value.timeEnd)
  const stepMinutes = durationMinutes(daySlotForm.value.duration)

  if (!end.isAfter(start)) {
    daySlotMessage.value = 'Время окончания должно быть позже времени начала.'
    return
  }

  const slotsToCreate: Omit<BookingSlot, 'id'>[] = []
  let cursor = start

  while (cursor.add(stepMinutes, 'minute').valueOf() <= end.valueOf()) {
    if (!cursor.isBefore(dayjs())) {
      slotsToCreate.push({
        date: formatDate(cursor.toDate()),
        time: formatTime(cursor.toDate()),
        duration: daySlotForm.value.duration,
        status: 'available',
      })
    }

    cursor = cursor.add(stepMinutes, 'minute')
  }

  if (slotsToCreate.length === 0) {
    daySlotMessage.value = 'В выбранном диапазоне нет будущих слотов.'
    return
  }

  await Promise.all(slotsToCreate.map((slot) => addSlot(slot)))
  await loadAllBookingSlots()
  addDaySlotDialogOpen.value = false
}

async function bookSlot(slot: BookingSlot) {
  await requestSlot(slot.id, 'Не знаю / нужна консультация', '', 'requested', currentStudentId)
  await loadAllBookingSlots()
  bookedSlotId.value = slot.id
}

async function deleteSlot(id: number) {
  await removeSlot(id)
  await loadAllBookingSlots()
}

onMounted(() => {
  loadAllBookingSlots()
})
</script>

<template>
  <section class="stack">
    <Card class="hero-card booking">
      <template #content>
        <h1>{{ props.role === 'instructor' ? 'Доступное время' : 'Выбор тренировки' }}</h1>
        <p>
          {{
            props.role === 'instructor'
              ? 'Управляйте доступным временем для записи учеников.'
              : 'Выберите подходящее время тренировки. После подтверждения инструктором вам придет уведомление в чат.'
          }}
        </p>
        <Button
          v-if="props.role === 'instructor'"
          icon="pi pi-plus"
          label="Добавить слот"
          style="margin-bottom: 1rem"
          @click="openAddSlot"
        />
        <br />
        <Button
          v-if="props.role === 'instructor'"
          icon="pi pi-plus"
          label="Добавить слоты на день"
          @click="openAddDaySlot"
        />
      </template>
    </Card>

    <section>
      <SectionHeader :title="props.role === 'instructor' ? 'Слоты для записи' : 'Свободное время'" />
      <div class="slot-grid">
        <Card v-for="slot in visibleSlots" :key="slot.id" :class="['slot-card', slot.status]">
          <template #content>
            <div class="slot-top">
              <div>
                <span>{{ slot.date }}</span>
                <strong>{{ slot.time }}</strong>
              </div>
              <Tag :severity="statusSeverity(slot.status)" :value="statusLabel(slot.status)" />
            </div>
            <p>{{ durationText(slot.duration) }}</p>

            <div v-if="props.role === 'instructor' && slot.status === 'available'" class="slot-actions">
              <Button label="Редактировать" size="small" @click="openEditSlot(slot)" />
              <Button icon="pi pi-trash" label="Удалить" severity="secondary" size="small" @click="deleteSlot(slot.id)" />
            </div>

            <Button
              v-else-if="slot.status === 'available'"
              icon="pi pi-send"
              label="Забронировать время"
              size="small"
              @click="bookSlot(slot)"
            />
          </template>
        </Card>
      </div>
      <p v-if="visibleSlots.length === 0" class="status-message">
        {{ props.role === 'instructor' ? 'Свободных слотов и новых заявок пока нет.' : 'Сейчас нет свободного времени для записи.' }}
      </p>
    </section>

    <Card v-if="props.role === 'student' && bookedSlotId" class="flow-card">
      <template #content>
        <SectionHeader title="Статус записи" />
        <p class="status-message">
          Мы отправили запрос Никите. После подтверждения вы получите уведомление в Telegram.
        </p>
      </template>
    </Card>

    <Dialog v-model:visible="addOneSlotDialogOpen" class="moto-dialog" header="Слот для записи" modal
    :draggable="false">
      <div class="form-stack">
        <label>
          Дата
          <DatePicker v-model="oneSlotForm.dateValue" :minDate="minSelectableDate" date-format="dd.mm.yy" show-icon />
        </label>
        <label>
          Время
          <InputText v-model="oneSlotForm.timeValue" step="900" type="time" />
        </label>
        <label>
          Длительность
          <Select v-model="oneSlotForm.duration" :options="durationOptions" />
        </label>
        <Button icon="pi pi-check" label="Сохранить слот" @click="saveSlot" />
      </div>
    </Dialog>

    <Dialog v-model:visible="addDaySlotDialogOpen" class="moto-dialog" header="Добавить слоты на день" modal
    :draggable="false">
      <div class="form-stack">
        <label>
          Дата
          <DatePicker v-model="daySlotForm.dateValue" :minDate="minSelectableDate" date-format="dd.mm.yy" show-icon />
        </label>
        <label>
          Время начала
          <DatePicker v-model="daySlotForm.timeStart" hour-format="24" time-only />
        </label>
        <label>
          Время окончания
          <DatePicker v-model="daySlotForm.timeEnd" hour-format="24" time-only />
        </label>
        <label>
          Длительность
          <Select v-model="daySlotForm.duration" :options="durationOptions" />
        </label>
        <p v-if="daySlotMessage" class="status-message">{{ daySlotMessage }}</p>
        <Button icon="pi pi-check" label="Сохранить слоты" @click="saveDaySlots" />
      </div>
    </Dialog>
  </section>
</template>
