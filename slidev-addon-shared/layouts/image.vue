<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  image?: string
  scale?: number
  background?: string
  color?: string
}>(), {
  scale: 100
})

const imageStyle = computed(() => ({
  width: `${props.scale}%`,
  height: `${props.scale}%`
}))
</script>

<template>
  <div class="slidev-layout w-full h-full relative flex items-center justify-center p-8" :style="{ background: props.background, color: props.color }">
    <img
      v-if="image"
      :src="image"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain p-8"
      :style="imageStyle"
      alt=""
    />
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>
