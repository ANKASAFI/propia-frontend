<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: number; onDark?: boolean }>(), { size: 28, onDark: false })
const houseW = computed(() => Math.round(props.size * 0.92))
const corner = computed(() => Math.round(props.size * 0.34))
const word = computed(() => Math.round(props.size * 0.62))
</script>
<template>
  <span class="logo" :class="{ 'on-dark': onDark }" :style="{ height: size + 'px' }" role="img" aria-label="PROPIA">
    <svg class="mark" :width="houseW" :height="size" viewBox="0 0 46 48" aria-hidden="true">
      <path d="M36 20 V13 L22 2 L8 15 V46 H26" stroke-width="7" />
    </svg>
    <span class="word" :style="{ fontSize: word + 'px' }">PROPIA</span>
    <svg class="mark" :width="corner" :height="corner" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13 2 V14 H2" stroke-width="5" />
    </svg>
  </span>
</template>
