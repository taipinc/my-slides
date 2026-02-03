<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  image?: string
  scale?: number
  border?: boolean
}>(), {
  scale: 100,
  border: false
})

const imageStyle = computed(() => ({
  width: `${props.scale}%`,
  height: `${props.scale}%`
}))

const isVideo = computed(() => {
  if (!props.image) return false
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']
  return videoExtensions.some(ext => props.image!.toLowerCase().endsWith(ext))
})
</script>

<template>
  <div class="slidev-layout image-caption w-full h-full flex flex-col items-center pt-[5%] px-[5%] pb-[2.5%] gap-4 overflow-hidden">
    <div class="flex-1 min-h-0 w-full flex items-center justify-center">
      <video
        v-if="image && isVideo"
        :src="image"
        class="object-contain"
        :class="{ 'border border-black/50': border }"
        :style="imageStyle"
        controls
        autoplay
        loop
        muted
      />
      <img
        v-else-if="image"
        :src="image"
        class="object-contain"
        :class="{ 'border border-black/50': border }"
        :style="imageStyle"
        alt="Slide Image"
      />
    </div>

    <div class="text-sm flex-shrink-0 self-start text-left [&>p]:m-0">
      <slot />
    </div>
  </div>
</template>
