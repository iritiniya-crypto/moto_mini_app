<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from '../components/SectionHeader.vue'
import VideoCard from '../components/VideoCard.vue'
import { useTrainingStore } from '../composables/useTrainingStore'
import { students } from '../mock/students'

const { getStudentTrainingVideos } = useTrainingStore()
const videos = computed(() =>
  getStudentTrainingVideos(students[0].id).map((history) => ({
    id: history.id,
    title: history.videoTitle || history.theme,
    date: history.date,
    theme: history.theme,
    comment: history.videoComment || history.comment,
    telegramUrl: history.videoUrl || '',
  })),
)
</script>

<template>
  <section class="stack">
    <Card class="hero-card video-hero">
      <template #content>
        <Tag value="видео" />
        <h1>Видео-разборы</h1>
        <p>
          Инструктор загружает видео в закрытый Telegram-канал. Mini App хранит только ссылку.
        </p>
      </template>
    </Card>

    <section>
      <SectionHeader title="Архив видео" />
      <div v-if="videos.length > 0" class="stack tight">
        <VideoCard v-for="video in videos" :key="video.id" :video="video" compact />
      </div>
      <Card v-else class="settings-card">
        <template #content>
          <p class="text-gray-400">Видео появятся после того, как Никита прикрепит ссылку к тренировке.</p>
        </template>
      </Card>
    </section>
  </section>
</template>
