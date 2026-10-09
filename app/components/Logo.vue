<script setup lang="ts">
withDefaults(defineProps<{ size?: number; onDark?: boolean }>(), { size: 48, onDark: false })
</script>
<template>
  <svg class="logo" :class="{ 'on-dark': onDark }" :height="size" :width="Math.round(size * 512 / 200)" viewBox="0 0 512 200" role="img" aria-label="PROPIA">
    <path class="mark" d="M128 92 L128 64 L76 22 L22.5 70 L22.5 140 L78 140" stroke-width="22" />
    <text class="word" x="80" y="151">PROPIA</text>
    <path class="mark corner" d="M490 150 L490 177 L458 177" stroke-width="20" />
  </svg>
</template>
