<script setup lang="ts">
import type { Skill } from '../mock/types'

defineProps<{
  skill: Skill
}>()
</script>

<template>
  <Card class="skill-card">
    <template #content>
      <div class="skill-top">
        <strong>{{ skill.name }}</strong>
        <b>{{ skill.value }}%</b>
      </div>
      <ProgressBar :value="skill.value" :show-value="false" />
    </template>
  </Card>
</template>
