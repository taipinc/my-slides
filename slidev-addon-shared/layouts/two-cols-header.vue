<script setup lang="ts">
const props = defineProps<{
  class?: string
  layoutClass?: string
}>()
</script>

<template>
  <div
    class="slidev-layout two-cols-header w-full h-full grid grid-cols-2 gap-x-8"
    :class="props.layoutClass"
  >
    <div class="shared-title col-span-2">
      <slot name="title" />
    </div>
    <div class="col-left min-w-0 min-h-0" :class="props.class">
      <slot />
      <slot name="left" />
    </div>
    <div class="col-right min-w-0 min-h-0" :class="props.class">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.two-cols-header {
  grid-template-rows: auto minmax(0, 1fr);
}

.col-left :deep(li + li),
.col-right :deep(li + li) {
  margin-top: 1rem;
}
</style>
