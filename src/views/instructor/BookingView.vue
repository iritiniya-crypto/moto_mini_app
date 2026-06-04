<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {TEST_USER_ID} from '@/api/client.ts'
import SectionHeader from '@/components/SectionHeader.vue'
import {useBookingStore} from '@/composables/useBookingStore.ts'
import type {BookingSlot} from '@/types/booking'

const props = defineProps<{
  role: 'student' | 'instructor'
}>()

const { addSlot, bookingManagementSlots, loadAllBookingSlots, removeSlot, requestSlot, updateSlot, availableSlots, slots } = useBookingStore()
const currentStudentId = TEST_USER_ID
const slotDialogOpen = ref(false)
const editingSlotId = ref<number | null>(null)
const durationOptions = ['30 мин', '60 мин', '90 мин', '120 мин']
const defaultSlotTime = () => {
  const date = new Date()
  date.setHours(17, 30, 0, 0)
  return date
}
const slotForm = ref({
  dateValue: new Date(),
  timeValue: defaultSlotTime(),
  duration: '90 мин',
})
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

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value)
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

function parseSlotTime(value: string, date = new Date(2026, 5, 3)) {
  const [hours, minutes] = value.split(':').map(Number)

  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours || 12, minutes || 0)
}

function openAddSlot() {
  editingSlotId.value = null
  slotForm.value = {
    dateValue: new Date(),
    timeValue: defaultSlotTime(),
    duration: '90 мин',
  }
  slotDialogOpen.value = true
}

function openEditSlot(slot: BookingSlot) {
  const dateValue = parseSlotDate(slot.date)
  editingSlotId.value = slot.id
  slotForm.value = {
    dateValue,
    timeValue: parseSlotTime(slot.time, dateValue),
    duration: slot.duration,
  }
  slotDialogOpen.value = true
}

async function saveSlot() {
  const currentSlot = editingSlotId.value ? slots.value.find((slot) => slot.id === editingSlotId.value) : null
  const nextSlot = {
    date: formatDate(slotForm.value.dateValue),
    time: formatTime(slotForm.value.timeValue),
    duration: slotForm.value.duration,
    status: currentSlot?.status ?? 'available',
  }

  if (editingSlotId.value) {
    await updateSlot(editingSlotId.value, nextSlot)
  } else {
    await addSlot(nextSlot)
  }
  await loadAllBookingSlots()
  slotDialogOpen.value = false
}

async function bookSlot(slot: BookingSlot) {
  await requestSlot(slot.id, currentStudentId, 'Не знаю / нужна консультация', '', 'requested', TEST_USER_ID)
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
          @click="openAddSlot"
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

    <Dialog v-model:visible="slotDialogOpen" class="moto-dialog" header="Слот для записи" modal>
      <div class="form-stack">
        <label>
          Дата
          <DatePicker v-model="slotForm.dateValue" date-format="dd.mm.yy" show-icon />
        </label>
        <label>
          Время
          <DatePicker v-model="slotForm.timeValue" hour-format="24" show-icon time-only />
        </label>
        <label>
          Длительность
          <Select v-model="slotForm.duration" :options="durationOptions" />
        </label>
        <Button icon="pi pi-check" label="Сохранить слот" @click="saveSlot" />
      </div>
    </Dialog>
  </section>
</template>
