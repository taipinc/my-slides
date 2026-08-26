<script setup lang="ts">
withDefaults(defineProps<{
  align?: 'left' | 'center' | 'right'
}>(), {
  align: 'left',
})
</script>

<template>
  <div class="slide-footer" :class="`slide-footer--${align}`">
    <slot />
  </div>
</template>

<style scoped>
.slide-footer {
  position: absolute;
  right: 3.5rem;
  bottom: 2rem;
  left: 3.5rem;
  z-index: 10;
  color: #000;
  font-size: 0.9rem;
  line-height: 1.4;
}

.slide-footer--left {
  text-align: left;
}

.slide-footer--center {
  text-align: center;
}

.slide-footer--right {
  text-align: right;
}
</style>
