<script lang="ts" setup>
import {computed, ref} from 'vue'
import SectionHeader from '@/components/SectionHeader.vue'
import {
  gymkhanaPrograms,
  motorcyclePrograms,
  scooterPrograms,
  type TheoryCard,
  theoryCards,
  type TrainingProgram,
} from '@/constants/trainingContent.ts'

type VehicleMode = 'scooter' | 'motorcycle' | 'gymkhana'

const activeMode = ref<VehicleMode>('scooter')
const selectedProgram = ref<TrainingProgram | null>(null)
const selectedTheory = ref<TheoryCard | null>(null)
const paymentProgram = ref<TrainingProgram | null>(null)
const expandedPlanDay = ref<string | null>(null)

const programs = computed(() => {
  if (activeMode.value === 'scooter') {
    return scooterPrograms
  }

  if (activeMode.value === 'gymkhana') {
    return gymkhanaPrograms
  }

  return motorcyclePrograms
})
const activeModeLabel = computed(() => {
  const labels: Record<VehicleMode, string> = {
    scooter: 'скутер',
    motorcycle: 'мотоцикл',
    gymkhana: 'джимхана',
  }

  return labels[activeMode.value]
})

function openProgram(program: TrainingProgram) {
  selectedProgram.value = program
  expandedPlanDay.value = null
}

function openPayment(program: TrainingProgram) {
  paymentProgram.value = program
}

function togglePlanDay(day: string) {
  expandedPlanDay.value = expandedPlanDay.value === day ? null : day
}
</script>

<template>
  <section class="stack">
    <Card class="hero-card student-home-hero">
      <template #content>
        <Tag value="Нячанг" />
        <h1>Уверенное вождение за 3 дня</h1>
        <p>Практическое обучение вождения скутера и мотоцикла в Нячанге.</p>

        <div aria-label="Тип техники" class="vehicle-switch">
          <button :class="{ active: activeMode === 'scooter' }" type="button" @click="activeMode = 'scooter'">
            Скутер
          </button>
          <button :class="{ active: activeMode === 'motorcycle' }" type="button" @click="activeMode = 'motorcycle'">
            Мотоцикл
          </button>
          <button :class="{ active: activeMode === 'gymkhana' }" type="button" @click="activeMode = 'gymkhana'">
            Джимхана
          </button>
        </div>
      </template>
    </Card>

    <section>
      <SectionHeader :action="activeModeLabel" title="Программы тренировок" />
      <div class="stack tight">
        <Card v-for="program in programs" :key="program.id" class="program-card">
          <template #content>
            <div class="program-top">
              <div>
                <Tag :value="program.duration"/>
                <h3>{{ program.title }}</h3>
                <span>{{ program.subtitle }}</span>
              </div>
            </div>

            <p>{{ program.description }}</p>

            <div class="price-list">
              <strong v-for="price in program.prices" :key="price">{{ price }}</strong>
            </div>

            <Button icon="pi pi-angle-right" label="Подробнее" size="small" @click="openProgram(program)" />
            <Button
              icon="pi pi-qrcode"
              label="Приобрести пакет тренировок"
              severity="secondary"
              size="small"
              @click="openPayment(program)"
            />
          </template>
        </Card>
      </div>
    </section>

    <section>
      <SectionHeader title="Теория и схемы" />
      <div class="theory-grid">
        <Card
          v-for="card in theoryCards"
          :key="card.title"
          class="theory-card compact-theory-card clickable-card"
          role="button"
          tabindex="0"
          @click="selectedTheory = card"
          @keydown.enter="selectedTheory = card"
        >
          <template #content>
            <div class="theory-card-head">
              <i class="pi pi-compass" />
              <i class="pi pi-angle-right" />
            </div>
            <h3>{{ card.title }}</h3>
            <p>{{ card.why }}</p>
          </template>
        </Card>
      </div>
    </section>

    <Dialog
      :visible="Boolean(selectedProgram)"
      class="moto-dialog"
      header="Программа тренировок"
      modal
      @update:visible="selectedProgram = null"
    >
      <div v-if="selectedProgram" class="form-stack">
        <div>
          <Tag :value="selectedProgram.duration"/>
          <h2>{{ selectedProgram.title }}</h2>
          <p>{{ selectedProgram.subtitle }}</p>
        </div>

        <p>{{ selectedProgram.description }}</p>

        <section>
          <SectionHeader title="План" />
          <div class="plan-accordion">
            <button
              v-for="day in selectedProgram.plan"
              :key="day.day"
              :class="['plan-day-card', { active: expandedPlanDay === day.day }]"
              type="button"
              @click="togglePlanDay(day.day)"
            >
              <span>{{ day.day }} — {{ day.duration }} · {{ day.format }}</span>
              <i :class="expandedPlanDay === day.day ? 'pi pi-angle-up' : 'pi pi-angle-down'" />

              <div v-if="expandedPlanDay === day.day" class="plan-day-details">
                <div>
                  <small>Что изучаем</small>
                  <div class="topic-row">
                    <Tag v-for="item in day.learning" :key="item" :value="item" />
                  </div>
                </div>

                <div v-if="day.important">
                  <small>Что важно</small>
                  <strong>{{ day.important }}</strong>
                </div>

              </div>
            </button>
          </div>

          <div class="soft-note">
            План может меняться в зависимости от вашего уровня, прогресса и скорости освоения навыков.
          </div>
        </section>

        <section v-if="selectedProgram.outcomes">
          <SectionHeader title="За время курса вы" />
          <div class="note-list">
            <div v-for="item in selectedProgram.outcomes" :key="item">
              <strong>{{ item }}</strong>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title="Стоимость" />
          <div class="note-list">
            <div v-for="price in selectedProgram.prices" :key="price">
              <strong>{{ price }}</strong>
            </div>
          </div>
          <Button
            class="payment-action"
            icon="pi pi-qrcode"
            label="Приобрести пакет тренировок"
            severity="secondary"
            @click="openPayment(selectedProgram)"
          />
        </section>

        <p v-if="selectedProgram.note" class="status-message">{{ selectedProgram.note }}</p>
      </div>
    </Dialog>

    <Dialog
      :visible="Boolean(paymentProgram)"
      class="moto-dialog payment-dialog"
      header="Предоплата по QR"
      modal
      @update:visible="paymentProgram = null"
    >
      <div v-if="paymentProgram" class="payment-dialog-content">
        <div>
          <Tag :value="paymentProgram.duration" />
          <h2>{{ paymentProgram.title }}</h2>
          <p>Отсканируйте QR-код для предоплаты пакета тренировок.</p>
        </div>

        <div class="payment-qr-card">
          <img alt="QR для предоплаты пакета тренировок" src="/payment-qr.svg" />
        </div>

        <div class="soft-note">
          После оплаты напишите Никите в Telegram, чтобы он отметил пакет в карточке ученика.
        </div>
      </div>
    </Dialog>

    <Dialog
      :visible="Boolean(selectedTheory)"
      class="moto-dialog"
      header="Теория и схема"
      modal
      @update:visible="selectedTheory = null"
    >
      <div v-if="selectedTheory" class="form-stack">
        <div>
          <h2>{{ selectedTheory.title }}</h2>
          <p>{{ selectedTheory.description }}</p>
        </div>

        <div v-if="selectedTheory.scheme === 'eight'" class="real-scheme-card">
          <img alt="Схема упражнения Восьмерка" src="../../../public/eight-scheme.png" />
        </div>

        <div v-else-if="selectedTheory.scheme === 'oval'" class="real-scheme-card">
          <img alt="Схема упражнения Овал" src="../../../public/oval-scheme.png" />
        </div>

        <div v-else-if="selectedTheory.scheme === 'snake'" class="real-scheme-card">
          <img alt="Схема упражнения Змейка" src="../../../public/snake-sheme.png" />
        </div>

        <div v-else :class="['exercise-scheme', `scheme-${selectedTheory.scheme}`]" aria-hidden="true">
          <span class="dot start" />
          <span class="dot finish" />
          <span class="path path-a" />
          <span class="path path-b" />
          <span class="cone cone-a" />
          <span class="cone cone-b" />
          <span class="arrow" />
        </div>

        <div class="note-list">
          <div>
            <span>Зачем нужно</span>
            <strong>{{ selectedTheory.why }}</strong>
          </div>
          <div>
            <span>Частые ошибки</span>
            <strong>{{ selectedTheory.mistakes }}</strong>
          </div>
          <div>
            <span>Что тренируем</span>
            <strong>{{ selectedTheory.training }}</strong>
          </div>
        </div>
      </div>
    </Dialog>
  </section>
</template>
