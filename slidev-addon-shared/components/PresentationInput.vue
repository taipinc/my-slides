<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  label?: string
  placeholder?: string
  rows?: number
}>(), {
  label: 'Student responses',
  placeholder: '',
  rows: 8,
})

const response = ref('')

function releaseFocus(event: KeyboardEvent) {
  if (event.key === 'Escape')
    (event.target as HTMLTextAreaElement).blur()
}
</script>

<template>
  <textarea
    v-model="response"
    class="presentation-input"
    :aria-label="label"
    :placeholder="placeholder"
    :rows="rows"
    @click.stop
    @dblclick.stop
    @pointerdown.stop
    @keydown.stop="releaseFocus"
    @keyup.stop
  />
</template>

<style scoped>
.presentation-input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-height: 100%;
  padding: 1rem 1.25rem;
  border: 1px solid color-mix(in srgb, currentColor 50%, transparent);
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1.5;
  text-align: left;
  resize: none;
  overflow-y: auto;
}

.presentation-input::placeholder {
  color: inherit;
  opacity: 0.4;
}

.presentation-input:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 3px;
}
</style>
