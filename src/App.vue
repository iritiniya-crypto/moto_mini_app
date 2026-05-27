<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppShell from './layouts/AppShell.vue'
import BookingView from './views/BookingView.vue'
import InstructorDashboard from './views/InstructorDashboard.vue'
import MyTrainingsView from './views/MyTrainingsView.vue'
import ProfileView from './views/ProfileView.vue'
import StudentDashboard from './views/StudentDashboard.vue'
import VideosView from './views/VideosView.vue'

type Role = 'student' | 'instructor'
type Tab = 'home' | 'lessons' | 'videos' | 'profile'

const activeRole = ref<Role>('student')
const activeTab = ref<Tab>('home')

watch(activeRole, (role) => {
  if (role === 'instructor' && activeTab.value === 'videos') {
    activeTab.value = 'home'
  }
})

const currentView = computed(() => {
  if (activeTab.value === 'home') {
    return activeRole.value === 'student' ? StudentDashboard : InstructorDashboard
  }

  if (activeTab.value === 'lessons') {
    return activeRole.value === 'student' ? MyTrainingsView : BookingView
  }

  if (activeTab.value === 'videos' && activeRole.value === 'student') {
    return VideosView
  }

  return ProfileView
})
</script>

<template>
  <AppShell v-model:role="activeRole" v-model:tab="activeTab">
    <component :is="currentView" :role="activeRole" />
  </AppShell>
</template>
