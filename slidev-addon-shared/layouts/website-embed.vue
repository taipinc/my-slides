<script setup lang="ts">
import { useIsSlideActive } from '@slidev/client'

defineProps<{
  url?: string
}>()

const isActive = useIsSlideActive()
</script>

<template>
  <div class="slidev-layout website-embed w-full h-full flex flex-col items-start pt-[5%] px-[5%] pb-[2.5%] gap-4 overflow-hidden">
    <iframe
      v-if="url && isActive"
      :src="url"
      class="max-w-full min-h-0 flex-1 w-full"
      frameborder="0"
    />

    <div class="text-sm flex-shrink-0 [&>p]:m-0">
      <slot />
    </div>
  </div>
</template>
