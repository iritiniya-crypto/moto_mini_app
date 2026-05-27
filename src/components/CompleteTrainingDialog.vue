<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useBookingStore } from '../composables/useBookingStore'
import { useTrainingStore } from '../composables/useTrainingStore'
import { availableSkills } from '../mock/skills'
import type { BookingSlot, Student } from '../mock/types'

interface Props {
  open: boolean
  slot: BookingSlot | null
  student: Student | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'completed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { completeSlot } = useBookingStore()
const { createTrainingReport } = useTrainingStore()

const selectedSkills = ref<string[]>([])
const skillImprovements = ref<Record<string, string>>({})
const improved = ref('')
const nextFocus = ref('')
const levelUpdate = ref<string | null>(null)

const improvementOptions = [
  'Без изменений',
  'Немного лучше',
  'Заметно лучше',
  'Нужно повторить',
]
const levelOptions = ['Новичок', 'База', 'Уверенный старт', 'Город', 'Профи']

watch(
  () => [props.open, props.student],
  () => {
    if (props.open && props.student) {
      selectedSkills.value = []
      skillImprovements.value = {}
      improved.value = ''
      nextFocus.value = ''
      levelUpdate.value = props.student.level || null
    }
  },
  { immediate: true },
)

watch(selectedSkills, (skills) => {
  const nextImprovements: Record<string, string> = {}

  skills.forEach((skill) => {
    nextImprovements[skill] = skillImprovements.value[skill] || 'Без изменений'
  })

  skillImprovements.value = nextImprovements
})

const durationMinutes = computed(() => {
  if (!props.slot) return 0
  return parseInt(props.slot.duration) || 0
})

const dialogVisible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

function initializeSkillImprovements() {
  const improvements: Record<string, string> = {}
  selectedSkills.value.forEach((skill) => {
    if (!skillImprovements.value[skill]) {
      improvements[skill] = 'Без изменений'
    }
  })
  skillImprovements.value = { ...skillImprovements.value, ...improvements }
}

function saveReport() {
  if (!props.slot || !props.student) return

  initializeSkillImprovements()

  createTrainingReport({
    studentId: props.student.id,
    slotId: props.slot.id,
    date: props.slot.date,
    duration: props.slot.duration,
    location: props.slot.finalLocation || 'Не указано',
    trainedSkills: selectedSkills.value,
    improved: improved.value,
    nextFocus: nextFocus.value,
    skillUpdates: skillImprovements.value,
    levelUpdate: levelUpdate.value && levelUpdate.value !== props.student.level ? levelUpdate.value : undefined,
  })

  completeSlot(props.slot.id)

  emit('update:open', false)
  emit('completed')
}

const isFormValid = computed(() => {
  return selectedSkills.value.length > 0 && improved.value.trim() && nextFocus.value.trim()
})

function closeDialog() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Завершить тренировку"
    class="moto-dialog complete-training-dialog"
  >
    <div v-if="slot && student" class="form-stack">
      <div class="note-list">
        <div>
          <span>Ученик</span>
          <strong>{{ student.name }}</strong>
        </div>
        <div>
          <span>Дата и время</span>
          <strong>{{ slot.date }} · {{ slot.time }}</strong>
        </div>
        <div>
          <span>Длительность</span>
          <strong>{{ durationMinutes }} минут</strong>
        </div>
        <div>
          <span>Локация</span>
          <strong>{{ slot.finalLocation || 'Не указано' }}</strong>
        </div>
      </div>

      <section>
        <label class="field-label">Что тренировали</label>
        <div class="skill-check-grid">
          <label v-for="skill in availableSkills" :key="skill.id" class="skill-check-item">
            <input v-model="selectedSkills" type="checkbox" :value="skill.name" />
            <span>{{ skill.name }}</span>
          </label>
        </div>
      </section>

      <label>
        Что получилось
        <Textarea
          v-model="improved"
          rows="3"
          auto-resize
          placeholder="Например: стала ровнее скорость, меньше резких движений рулем"
        />
      </label>

      <label>
        На что обратить внимание
        <Textarea
          v-model="nextFocus"
          rows="3"
          auto-resize
          placeholder="Например: смотреть в выход, мягче работать газом, расслабить руки"
        />
      </label>

      <section v-if="selectedSkills.length > 0">
        <label class="field-label">Оценка прогресса навыков</label>
        <div class="skill-update-list">
          <label v-for="skill in selectedSkills" :key="skill" class="skill-update-row">
            <span>{{ skill }}</span>
            <Select v-model="skillImprovements[skill]" :options="improvementOptions" />
          </label>
        </div>
      </section>

      <label>
        Уровень ученика
        <Select v-model="levelUpdate" :options="levelOptions" />
      </label>

      <div class="dialog-actions">
        <Button label="Отмена" severity="secondary" @click="closeDialog" />
        <Button label="Сохранить отчет" icon="pi pi-check" :disabled="!isFormValid" @click="saveReport" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.field-label {
  display: block;
  margin-bottom: 10px;
  color: var(--dim);
  font-size: 0.86rem;
  font-weight: 800;
}

.skill-check-grid {
  display: grid;
  gap: 8px;
}

.skill-check-item,
.skill-update-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: rgba(255, 255, 255, 0.045);
}

.skill-check-item input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.skill-update-row {
  align-items: stretch;
  flex-direction: column;
}

.skill-update-list {
  display: grid;
  gap: 8px;
}

.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 4px;
}
</style>
