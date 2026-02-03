<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  image?: string
  class?: string
  align?: 'top' | 'center' | 'bottom'
  width?: number
  border?: boolean
}>(), {
  width: 50,
  border: false
})

const alignmentClass = computed(() => {
  switch (props.align) {
    case 'top':
      return 'items-start'
    case 'bottom':
      return 'items-end'
    case 'center':
    default:
      return 'items-center'
  }
})

const gridStyle = computed(() => {
  const imageWidth = props.width
  const textWidth = 100 - imageWidth
  return {
    gridTemplateColumns: `${textWidth}% ${imageWidth}%`
  }
})
</script>

<template>
  <div class="grid w-full h-full gap-4" :style="gridStyle">
    <div class="slidev-layout default pr-8" :class="$props.class">
      <slot />
    </div>
    <div class="w-full h-full flex justify-center p-8 overflow-hidden" :class="alignmentClass">
      <img
        v-if="image"
        :src="image"
        class="max-w-full max-h-full object-contain"
        :class="{ 'border border-black/50': border }"
        alt=""
      />
    </div>
  </div>
</template>
