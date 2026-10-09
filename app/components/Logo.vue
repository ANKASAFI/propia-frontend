<script setup lang="ts">
const props = withDefaults(defineProps<{ size?: number; onDark?: boolean }>(), { size: 28, onDark: false })
const houseW = computed(() => Math.round(props.size * 32 / 48.95))
const cornerW = computed(() => Math.round(props.size * 17.5 / 48.95))
const cornerH = computed(() => Math.round(props.size * 21.5 / 48.95))
const word = computed(() => Math.round(props.size * 0.62))
</script>
<template>
  <span class="logo" :class="{ 'on-dark': onDark }" :style="{ height: size + 'px' }" role="img" aria-label="PROPIA">
    <svg class="mark" :width="houseW" :height="size" viewBox="8 0 32 48.95" aria-hidden="true">
      <path d="M36 46.2 V16 L24 7 L12 16 V46.2 H24" stroke-width="5.5" />
    </svg>
    <span class="word" :style="{ fontSize: word + 'px' }">PROPIA</span>
    <svg class="mark" :width="cornerW" :height="cornerH" viewBox="1.25 1.25 17.5 21.5" aria-hidden="true">
      <path d="M16 4 V20 H4" stroke-width="5.5" />
    </svg>
  </span>
</template>
