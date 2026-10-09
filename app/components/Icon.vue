<script setup lang="ts">
import { P } from '~/utils/icons'
const props = defineProps<{ name: string; cls?: string }>()
</script>
<template>
  <svg class="i" :class="cls" viewBox="0 0 24 24" v-html="P[name] || P.info" />
</template>
