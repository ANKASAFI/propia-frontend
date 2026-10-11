<script setup lang="ts">
defineProps<{ error: { statusCode?: number; message?: string } }>()
</script>
<template>
  <div class="public" style="height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg)">
    <section style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px">
      <Badge label="Error 404" cls="b-gray" icon="search" />
      <h2 style="margin:0;color:var(--ink)">No encontramos esta página</h2>
      <p class="muted" style="margin:0">El enlace puede estar mal escrito o la página ya no existe.</p>
      <NuxtLink to="/" class="btn primary">Ir al inicio</NuxtLink>
    </section>
  </div>
</template>
