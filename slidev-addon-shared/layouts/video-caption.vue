<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIsSlideActive } from '@slidev/client'

const props = defineProps<{
  video?: string
  start?: number
  background?: string
  color?: string
  padding?: 'normal' | 'minimal'
}>()

const iframeRef = ref<HTMLIFrameElement>()
const isActive = useIsSlideActive()

const isYoutube = computed(() => {
  if (!props.video) return false
  return /(?:youtube\.com|youtu\.be)/.test(props.video)
})

const isVimeo = computed(() => {
  if (!props.video) return false
  return /vimeo\.com/.test(props.video)
})

const embedUrl = computed(() => {
  if (!props.video) return ''

  const url = props.video
  const startTime = props.start || 0

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    const baseUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}?enablejsapi=1`
    return startTime > 0 ? `${baseUrl}&start=${startTime}` : baseUrl
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    const baseUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return startTime > 0 ? `${baseUrl}#t=${startTime}s` : baseUrl
  }

  // Return as-is if already an embed URL or other format
  return url
})

watch(isActive, (active) => {
  if (!active && iframeRef.value?.contentWindow) {
    if (isYoutube.value) {
      iframeRef.value.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      )
    } else if (isVimeo.value) {
      iframeRef.value.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*')
    }
  }
})
</script>

<template>
  <div
    class="slidev-layout video-caption w-full h-full flex flex-col items-start pt-[5%] px-[5%] pb-[2.5%] gap-4 overflow-hidden"
    :style="{
      background: props.background,
      color: props.color,
      padding: props.padding === 'minimal' ? '1rem 1rem 0.75rem' : undefined,
      gap: props.padding === 'minimal' ? '0.75rem' : undefined,
    }"
  >
    <iframe
      v-if="video && isActive"
      ref="iframeRef"
      :src="embedUrl"
      class="max-w-full min-h-0 flex-1 w-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />

    <div class="text-sm leading-[1.4] flex-shrink-0 [&>p]:m-0">
      <slot />
    </div>
  </div>
</template>
