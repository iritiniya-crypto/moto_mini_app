<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  action?: string
}>()
</script>

<template>
  <div class="section-header">
    <div>
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h2>{{ title }}</h2>
    </div>
    <span v-if="action" class="section-action">{{ action }}</span>
  </div>
</template>
