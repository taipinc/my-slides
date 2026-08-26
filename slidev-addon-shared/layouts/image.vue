<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  image?: string
  scale?: number
  background?: string
  color?: string
  padding?: 'normal' | 'minimal'
}>(), {
  scale: 100
})

const imageStyle = computed(() => ({
  width: `${props.scale}%`,
  height: `${props.scale}%`
}))
</script>

<template>
  <div
    class="slidev-layout image w-full h-full flex flex-col items-start p-8 gap-4 overflow-hidden"
    :style="{
      background: props.background,
      color: props.color,
      padding: props.padding === 'minimal' ? '1rem 1rem 0.75rem' : undefined,
      gap: props.padding === 'minimal' ? '0.75rem' : undefined,
    }"
  >
    <div
      class="flex-1 min-h-0 w-full flex items-center justify-center"
      :style="{ padding: props.padding === 'minimal' ? 0 : '2rem' }"
    >
      <img
        v-if="image"
        :src="image"
        class="object-contain"
        :style="imageStyle"
        alt=""
      />
    </div>

    <div class="text-sm leading-[1.4] flex-shrink-0 self-start text-left [&>p]:m-0">
      <slot />
    </div>
  </div>
</template>
