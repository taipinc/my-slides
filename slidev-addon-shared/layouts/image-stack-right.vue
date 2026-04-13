<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  image1?: string
  image2?: string
  image3?: string
  class?: string
  background?: string
  color?: string
}>()

const images = computed(() => {
  return [props.image1, props.image2, props.image3].filter(Boolean)
})
</script>

<template>
  <div class="grid grid-cols-2 w-full h-full gap-4" :style="{ background: props.background, color: props.color }">
    <div class="slidev-layout default pr-8" :class="props.class">
      <slot />
    </div>
    <div class="flex flex-col gap-4 p-4 justify-center items-end h-full overflow-hidden">
      <img
        v-for="(image, index) in images"
        :key="index"
        :src="image"
        class="object-contain max-w-full"
        :style="{ flex: '1 1 0', minHeight: '0' }"
        alt=""
      />
    </div>
  </div>
</template>
