<script lang="ts" setup>
import type {TrainingHistory} from '@/types/training'

defineProps<{
  lesson: TrainingHistory
}>()
</script>

<template>
  <Card class="lesson-card">
    <template #content>
      <div class="lesson-head">
        <div>
          <span>{{ lesson.date }} · {{ lesson.duration }}</span>
          <small v-if="lesson.location">Локация: {{ lesson.location }}</small>
        </div>
        <Tag severity="success" value="завершено" />
      </div>

      <div class="note-list lesson-report">
        <div>
          <span>Что тренировали</span>
          <strong>{{ lesson.topics.join(', ') || lesson.theme }}</strong>
        </div>
        <div v-if="lesson.improved">
          <span>Что получилось</span>
          <strong>{{ lesson.improved }}</strong>
        </div>
        <div v-if="lesson.nextFocus">
          <span>На что обратить внимание</span>
          <strong>{{ lesson.nextFocus }}</strong>
        </div>
      </div>

      <a
        v-if="lesson.videoUrl"
        :href="lesson.videoUrl"
        class="location-link"
        rel="noreferrer"
        target="_blank"
      >
        Открыть видео в Telegram
      </a>
    </template>
  </Card>
</template>
