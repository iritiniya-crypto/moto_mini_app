<script setup lang="ts">
type Role = 'student' | 'instructor'
type Tab = 'home' | 'lessons' | 'videos' | 'profile'

const role = defineModel<Role>('role', { required: true })
const tab = defineModel<Tab>('tab', { required: true })

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
      </div>

      <div class="role-switch" aria-label="Переключатель ролей">
        <button :class="{ active: role === 'student' }" type="button" @click="role = 'student'">
          Ученик
        </button>
        <button :class="{ active: role === 'instructor' }" type="button" @click="role = 'instructor'">
          Инструктор
        </button>
      </div>
    </header>

    <main class="screen">
      <slot />
    </main>

    <nav :class="['bottom-nav', { 'instructor-nav': role === 'instructor' }]" aria-label="Основная навигация">
      <button
        v-for="item in role === 'student' ? studentTabs : instructorTabs"
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
