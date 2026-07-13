<script setup lang="ts">
import {useAuthStore} from "@/stores/authStore.ts";

type Tab = 'home' | 'lessons' | 'videos' | 'profile'

const tab = defineModel<Tab>('tab', { required: true })
const authStore = useAuthStore()

const studentTabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'home', label: 'Главная', icon: 'pi pi-home' },
  { id: 'lessons', label: 'Запись', icon: 'pi pi-calendar' },
  { id: 'videos', label: 'Видео', icon: 'pi pi-video' },
  { id: 'profile', label: 'Профиль', icon: 'pi pi-user' },
]

const instructorTabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'home', label: 'Главная', icon: 'pi pi-home' },
  { id: 'lessons', label: 'Запись', icon: 'pi pi-calendar' },
  { id: 'profile', label: 'Профиль', icon: 'pi pi-user' },
]
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <strong>Мото-дневник</strong>
        {{ authStore.activeRole }}
      </div>

      <div class="role-switch" aria-label="Переключатель ролей" v-if="authStore.isRoot">
        <button :class="{ active: authStore.activeRole === 'student' }" type="button" @click="authStore.activeRole = 'student'">
          Ученик
        </button>
        <button :class="{ active: authStore.isInstructor }" type="button" @click="authStore.activeRole = 'instructor'">
          Инструктор
        </button>
      </div>
    </header>

    <main class="screen">
      <slot />
    </main>

    <nav :class="['bottom-nav', { 'instructor-nav': authStore.activeRole === 'instructor' }]" aria-label="Основная навигация">
      <button
        v-for="item in authStore.activeRole === 'student' ? studentTabs : instructorTabs"
        :key="item.id"
        :class="{ active: tab === item.id }"
        type="button"
        @click="tab = item.id"
      >
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </div>
</template>
