<script setup lang="ts">
withDefaults(defineProps<{ size?: number; onDark?: boolean }>(), { size: 48, onDark: false })
</script>
<template>
  <svg class="logo" :class="{ 'on-dark': onDark }" :height="size" :width="Math.round(size * 1260 / 510)" viewBox="0 0 1260 510" role="img" aria-label="PROPIA">
    <path class="mark" d="M312 219 L312 179 L183 78 L53 178 L53 367 L157 367" stroke-width="54" />
    <text class="word" x="194" y="390" letter-spacing="7">PROPIA</text>
    <path class="mark" d="M1203 394 L1203 457 L1130 457" stroke-width="50" />
  </svg>
</template>
