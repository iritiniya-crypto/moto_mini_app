<script setup lang="ts">
import type { Skill } from '../types/skill'

defineProps<{
  skill: Skill
}>()
</script>

<template>
  <Card class="skill-card">
    <template #content>
      <div class="skill-top">
        <strong>{{ skill.name }}</strong>
        <b>{{ skill.oldValue }}%</b>
      </div>
      <ProgressBar :value="skill.oldValue" :show-value="false" />
    </template>
  </Card>
</template>
