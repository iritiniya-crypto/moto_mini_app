<script setup lang="ts">
import SectionHeader from '../components/SectionHeader.vue'
import VideoCard from '../components/VideoCard.vue'
import { videos } from '../mock/videos'
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
      <div class="stack tight">
        <VideoCard v-for="video in videos" :key="video.id" :video="video" compact />
      </div>
    </section>
  </section>
</template>
