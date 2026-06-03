<script lang="ts" setup>
import {computed, ref, watch} from 'vue'
import AppShell from './layouts/AppShell.vue'
import BookingView from './views/instructor/BookingView.vue'
import InstructorDashboard from './views/instructor/InstructorDashboard.vue'
import MyTrainingsView from './views/student/MyTrainingsView.vue'
import StudentProfileView from './views/student/StudentProfileView.vue'
import StudentDashboard from './views/student/StudentDashboard.vue'
import VideosView from './views/VideosView.vue'
import InstructorProfileView from "./views/instructor/InstructorProfileView.vue";

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

  if (activeTab.value === 'profile' && activeRole.value === 'student') {
    return StudentProfileView
  }

  return InstructorProfileView
})
</script>

<template>
  <AppShell v-model:role="activeRole" v-model:tab="activeTab">
    <component :is="currentView" :role="activeRole" />
  </AppShell>
</template>
