<script lang="ts" setup>
import {computed, onMounted} from 'vue'
import {storeToRefs} from 'pinia'
import SectionHeader from '../components/SectionHeader.vue'
import VideoCard from '../components/VideoCard.vue'
import {useUserStore} from '../stores/userStore'
import {TEST_USER_ID} from "@/api/client.ts";

const currentStudentId = TEST_USER_ID
const userStore = useUserStore()
const { profile } = storeToRefs(userStore)
const videos = computed(() =>
  (profile.value?.trainingHistory?.filter((history) => history.videoUrl)
))

onMounted(() => {
  userStore.loadProfile(currentStudentId)
})
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
