<template>
  <div class="public" style="display:flex;align-items:center;justify-content:center;background:var(--bg)">
    <section style="padding:36px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;max-width:480px">
      <Badge label="Error 403" cls="b-gray" icon="shield" />
      <span style="width:52px;height:52px;border-radius:50%;background:var(--surface-2);color:var(--muted);display:grid;place-items:center"><Icon name="shield" /></span>
      <h2 style="margin:0;color:var(--ink);font-size:20px">Esta sección no es para tu rol</h2>
      <p class="muted" style="margin:0">Si crees que necesitas acceso, pídeselo a un administrador.</p>
      <NuxtLink to="/" class="btn primary">Ir al inicio</NuxtLink>
    </section>
  </div>
</template>
