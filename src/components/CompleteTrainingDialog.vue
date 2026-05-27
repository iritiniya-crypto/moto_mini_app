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
const instructorComment = ref('')
const levelUpdate = ref<string | null>(null)

const improvementOptions = [
  'Без изменений',
  'Немного лучше',
  'Заметно лучше',
  'Нужно повторить',
]

watch(
  () => [props.open, props.student],
  () => {
    if (props.open && props.student) {
      selectedSkills.value = []
      skillImprovements.value = {}
      improved.value = ''
      nextFocus.value = ''
      instructorComment.value = ''
      levelUpdate.value = props.student.level || null
    }
  },
  { immediate: true },
)

const durationMinutes = computed(() => {
  if (!props.slot) return 0
  return parseInt(props.slot.duration) || 0
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
    instructorComment: instructorComment.value,
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
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
    <div class="w-full sm:w-full max-w-2xl bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-white">Завершить тренировку</h2>
        <button
          @click="() => emit('update:open', false)"
          class="text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>

      <div class="space-y-6">
        <!-- Ученик -->
        <div>
          <label class="block text-sm text-gray-300 mb-2">Ученик</label>
          <div class="text-white font-medium">{{ student?.name }}</div>
        </div>

        <!-- Дата и время -->
        <div>
          <label class="block text-sm text-gray-300 mb-2">Дата и время</label>
          <div class="text-white">{{ slot?.date }} · {{ slot?.time }} · {{ durationMinutes }} минут</div>
        </div>

        <!-- Что тренировали -->
        <div>
          <label class="block text-sm text-gray-300 mb-3">Что тренировали</label>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div v-for="skill in availableSkills" :key="skill.id" class="flex items-center">
              <input
                :id="`skill-${skill.id}`"
                v-model="selectedSkills"
                type="checkbox"
                :value="skill.name"
                class="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 cursor-pointer"
              />
              <label :for="`skill-${skill.id}`" class="ml-3 text-white cursor-pointer">{{ skill.name }}</label>
            </div>
          </div>
        </div>

        <!-- Что получилось -->
        <div>
          <label for="improved" class="block text-sm text-gray-300 mb-2">Что получилось</label>
          <textarea
            id="improved"
            v-model="improved"
            placeholder="Например: стала ровнее скорость, меньше резких движений рулем"
            class="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            rows="3"
          />
        </div>

        <!-- Что тренировать дальше -->
        <div>
          <label for="nextFocus" class="block text-sm text-gray-300 mb-2">Что тренировать дальше</label>
          <textarea
            id="nextFocus"
            v-model="nextFocus"
            placeholder="Например: смотреть в выход, мягче работать газом, расслабить руки"
            class="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            rows="3"
          />
        </div>

        <!-- Комментарий Никиты -->
        <div>
          <label for="comment" class="block text-sm text-gray-300 mb-2">Комментарий для ученика</label>
          <textarea
            id="comment"
            v-model="instructorComment"
            placeholder="Короткий комментарий после занятия"
            class="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            rows="2"
          />
        </div>

        <!-- Обновить навыки -->
        <div v-if="selectedSkills.length > 0">
          <label class="block text-sm text-gray-300 mb-3">Оценка прогресса навыков</label>
          <div class="space-y-3">
            <div v-for="skill in selectedSkills" :key="skill" class="flex items-center gap-3">
              <span class="text-white text-sm font-medium flex-1">{{ skill }}</span>
              <select
                v-model="skillImprovements[skill]"
                class="px-3 py-1 rounded bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option v-for="option in improvementOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Уровень ученика -->
        <div>
          <label for="level" class="block text-sm text-gray-300 mb-2">Уровень ученика</label>
          <select
            id="level"
            v-model="levelUpdate"
            class="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="Новичок">Новичок</option>
            <option value="База">База</option>
            <option value="Уверенный старт">Уверенный старт</option>
            <option value="Город">Город</option>
            <option value="Профи">Профи</option>
          </select>
        </div>

        <!-- Кнопки -->
        <div class="flex gap-3 pt-4">
          <button
            @click="() => emit('update:open', false)"
            class="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
          >
            Отмена
          </button>
          <button
            @click="saveReport"
            :disabled="!isFormValid"
            :class="[
              'flex-1 px-4 py-2 rounded font-medium transition',
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed',
            ]"
          >
            Сохранить отчет
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for dark theme */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
