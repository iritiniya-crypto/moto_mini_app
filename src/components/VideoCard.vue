<script setup lang="ts">
import type { Video } from '../mock/types'

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
        <Button label="Смотреть в Telegram" icon="pi pi-external-link" size="small" />
      </div>
    </template>
  </Card>
</template>
