<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  width?: number
}>()

const contentStyle = computed(() => props.width === undefined
  ? undefined
  : {
      width: `${Math.min(100, Math.max(1, props.width))}%`,
    })
</script>

<template>
  <div class="slidev-layout center h-full flex items-center justify-center">
    <div class="my-auto" :style="contentStyle">
      <slot />
    </div>
  </div>
</template>
