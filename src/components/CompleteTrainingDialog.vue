<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import {useBookingStore} from '@/composables/useBookingStore'
import {useTrainingStore} from '@/composables/useTrainingStore'
import {useUserStore} from '@/stores/userStore'
import type {BookingSlot, Skill} from '@/types'
import type {Student} from '@/types/student'

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

const { completeSlot, loadInstructorCalendar } = useBookingStore()
const { createTrainingReport } = useTrainingStore()
const userStore = useUserStore()

const selectedSkills = ref<Skill[]>([])
const skillImprovements = ref<Record<string, string>>({})
const improved = ref('')
const nextFocus = ref('')
const levelUpdate = ref<string | null>(null)
const isSaving = ref(false)

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
      isSaving.value = false
    }
  },
  { immediate: true },
)

watch(selectedSkills, (skills) => {
  const nextImprovements: Record<number, string> = {}

  skills.forEach((skill) => {
    nextImprovements[skill.id] = skillImprovements.value[skill.id] || 'Без изменений'
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

const availableSkills = computed(() => {
  if (props.student?.skills?.length) {
    return props.student.skills
  }

  return userStore.skills
})

function initializeSkillImprovements() {
  const improvements: Record<string, string> = {}
  selectedSkills.value.forEach((skill) => {
    if (!skillImprovements.value[skill.id]) {
      improvements[skill.id] = 'Без изменений'
    }
  })
  skillImprovements.value = { ...skillImprovements.value, ...improvements }
}

async function saveReport() {
  if (!props.slot || !props.student || !isFormValid.value || isSaving.value) return

  isSaving.value = true

  initializeSkillImprovements()

  try {
    const report = await createTrainingReport(
      {
        studentId: props.student.id,
        slotId: props.slot.id,
        date: props.slot.date,
        duration: props.slot.duration,
        location: props.slot.finalLocation || 'Не указано',
        trainedSkills: selectedSkills.value.map((s) => s.name),
        improved: improved.value.trim(),
        nextFocus: nextFocus.value.trim(),
        skillUpdates: { ...skillImprovements.value },
        levelUpdate: levelUpdate.value && levelUpdate.value !== props.student.level ? levelUpdate.value : undefined,
      },
      {
        slotApiId: props.slot.apiId,
        studentApiId: props.student.apiId,
      },
    )

    if (!report) {
      throw new Error('Не удалось сохранить отчет: ученик не найден')
    }

    const completedSlot = completeSlot(props.slot.id)
    if (!completedSlot) {
      throw new Error('Не удалось завершить тренировку: слот не найден')
    }

    await loadInstructorCalendar()

    emit('update:open', false)
    emit('completed')
  } catch (error) {
    console.error(error)
    isSaving.value = false
  }
}

const isFormValid = computed(() => {
  return selectedSkills.value.length > 0
})

function closeDialog() {
  emit('update:open', false)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && userStore.skills.length === 0) {
      userStore.loadSkills()
    }
  },
)
</script>

<template>
  <Dialog
    v-if="open"
    v-model:visible="dialogVisible"
    :draggable="false"
    class="moto-dialog complete-training-dialog"
    header="Завершить тренировку"
    modal
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
            <input v-model="selectedSkills" :value="skill" type="checkbox" />
            <span>{{ skill.name }}</span>
          </label>
        </div>
      </section>

      <label>
        Что получилось
        <Textarea
          v-model="improved"
          auto-resize
          placeholder="Например: стала ровнее скорость, меньше резких движений рулем"
          rows="3"
        />
      </label>

      <label>
        На что обратить внимание
        <Textarea
          v-model="nextFocus"
          auto-resize
          placeholder="Например: смотреть в выход, мягче работать газом, расслабить руки"
          rows="3"
        />
      </label>

      <section v-if="selectedSkills.length > 0">
        <label class="field-label">Оценка прогресса навыков</label>
        <div class="skill-update-list">
          <label v-for="skill in selectedSkills" :key="skill.id" class="skill-edit-row skill-percent-row">
            <span>{{ skill.name }}</span>
            <strong>{{ skill.oldValue }}%</strong>
            <input
                v-model="skill.newValue"
                class="skill-percent-input"
                max="100"
                min="0"
                type="number"
            />
            <Button icon="pi pi-trash" severity="secondary" size="small" @click="" />
          </label>
        </div>
      </section>

      <label>
        Уровень ученика
        <Select v-model="levelUpdate" :options="levelOptions" />
      </label>

      <div class="dialog-actions">
        <Button label="Отмена" severity="secondary" @click="closeDialog" />
        <Button :disabled="!isFormValid || isSaving" icon="pi pi-check" label="Сохранить отчет" @click="saveReport" />
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
