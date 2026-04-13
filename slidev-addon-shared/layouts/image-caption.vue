<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  image?: string
  scale?: number
  border?: boolean
  background?: string
  color?: string
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

// Lightbox state
const lightboxOpen = ref(false)
const zoomed = ref(false)
const panX = ref(0)
const panY = ref(0)

function openLightbox() {
  if (isVideo.value) return
  lightboxOpen.value = true
  zoomed.value = false
}

function closeLightbox() {
  lightboxOpen.value = false
  zoomed.value = false
}

function toggleZoom(e: MouseEvent) {
  e.stopPropagation()
  if (!zoomed.value) {
    zoomed.value = true
    updatePan(e)
  } else {
    zoomed.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
}

watch(lightboxOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', onKeydown)
  } else {
    window.removeEventListener('keydown', onKeydown)
  }
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function updatePan(e: MouseEvent) {
  if (!zoomed.value) return
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  // 0-1 normalized position within the container
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  // Map to -50..50 range for translate
  panX.value = (0.5 - x) * 100
  panY.value = (0.5 - y) * 100
}
</script>

<template>
  <div class="slidev-layout image-caption w-full h-full flex flex-col items-center pt-[5%] px-[5%] pb-[2.5%] gap-4 overflow-hidden" :style="{ background, color }">
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
        class="object-contain cursor-zoom-in"
        :class="{ 'border border-black/50': border }"
        :style="imageStyle"
        alt="Slide Image"
        @click="openLightbox"
      />
    </div>

    <div class="text-sm flex-shrink-0 self-start text-left [&>p]:m-0">
      <slot />
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div
          v-if="lightboxOpen"
          class="lightbox-overlay"
          :class="{ 'lightbox-overlay-zoomed': zoomed }"
          @click="closeLightbox"
        >
          <button
            class="lightbox-close"
            @click.stop="closeLightbox"
          >
            &times;
          </button>
          <div
            class="lightbox-container"
            :class="{ 'lightbox-zoomed': zoomed }"
            @mousemove="updatePan"
          >
            <img
              :src="image"
              class="lightbox-img"
              :style="zoomed ? {
                transform: `translate(${panX}%, ${panY}%) scale(1)`,
                maxWidth: 'none',
                maxHeight: 'none',
                width: 'auto',
                height: 'auto',
              } : {}"
              alt="Slide Image"
              @click.stop="toggleZoom"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5%;
}
.lightbox-overlay.lightbox-overlay-zoomed {
  padding: 0;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 24px;
  z-index: 10000;
  background: none;
  border: none;
  color: white;
  font-size: 2.5rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.lightbox-close:hover {
  opacity: 1;
}

.lightbox-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.05s linear;
  cursor: zoom-in;
}
.lightbox-zoomed .lightbox-img {
  cursor: move;
}

/* Transition */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
