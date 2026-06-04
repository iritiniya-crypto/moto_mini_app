<script setup lang="ts">
import type { Video } from '../types/training'

defineProps<{
  video: Video
  compact?: boolean
}>()
</script>

<template>
  <Card :class="['video-card', { compact }]">
    <template #content>
      <div class="video-preview">
        <i class="pi pi-play" />
        <span>закрытый Telegram-канал</span>
      </div>
      <div class="video-info">
        <Tag value="ссылка на Telegram" />
        <h3>{{ video.title }}</h3>
        <span>{{ video.date }} · {{ video.theme }}</span>
        <p>{{ video.comment }}</p>
        <small>{{ video.telegramUrl }}</small>
        <a class="location-link" :href="video.telegramUrl" target="_blank" rel="noreferrer">
          Открыть видео в Telegram
        </a>
      </div>
    </template>
  </Card>
</template>
