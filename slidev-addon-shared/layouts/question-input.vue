<script setup lang="ts">
import PresentationInput from '../components/PresentationInput.vue'

withDefaults(defineProps<{
  label?: string
  placeholder?: string
}>(), {
  label: 'Student responses',
  placeholder: '',
})
</script>

<template>
  <div class="slidev-layout question-input">
    <div class="question">
      <slot />
    </div>
    <PresentationInput class="response" :label="label" :placeholder="placeholder" />
  </div>
</template>

<style scoped>
.question-input {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: 100%;
  text-align: left;
}

.question {
  flex-shrink: 0;
  text-align: left;
}

.question :deep(h1:last-child),
.question :deep(p:last-child) {
  margin-bottom: 0;
}

.response {
  flex: 1;
  min-height: 0;
}
</style>
