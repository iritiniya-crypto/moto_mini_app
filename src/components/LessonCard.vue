<script setup lang="ts">
import type { Lesson } from '../mock/types'

defineProps<{
  lesson: Lesson
}>()
</script>

<template>
  <Card class="lesson-card">
    <template #content>
      <div class="lesson-head">
        <div>
          <span>{{ lesson.date }} · {{ lesson.duration }}</span>
          <h3>{{ lesson.theme }}</h3>
        </div>
        <Tag value="завершено" severity="success" />
      </div>

      <div class="topic-row">
        <Tag v-for="topic in lesson.topics" :key="topic" :value="topic" />
      </div>

      <p>{{ lesson.comment }}</p>
    </template>
  </Card>
</template>
