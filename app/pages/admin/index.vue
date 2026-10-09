<script setup lang="ts">
const items = ref<any[]>([])
const error = ref('')
async function load() { items.value = await api('/api/admin/tasks') }
onMounted(load)
async function approve(id: string) { await api(`/api/admin/commitments/${id}/approve`, { method: 'POST' }); await load() }
async function reject(id: string) { await api(`/api/admin/commitments/${id}/reject`, { method: 'POST', body: { reason: 'Rechazada desde pendientes' } }); await load() }
const old = computed(() => items.value.filter((i) => /día/.test(i.age)).length)
</script>
<template>
  <Shell active="tablero" :crumbs="['Administración', 'Pendientes']" :show-currency="false">
    <div class="page-head"><div><h1>Pendientes</h1><p>Lo que espera una decisión, con el tiempo que lleva abierto.</p></div></div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="card kpi"><div class="label">Abiertos</div><div class="value">{{ items.length }}</div><div class="foot">{{ old }} llevan más de un día</div></div>
      <div class="card kpi"><div class="label">Compromisos</div><div class="value">{{ items.filter(i => i.kind==='commitment').length }}</div><div class="foot">Esperan tu aprobación</div></div>
      <div class="card kpi"><div class="label">PLAFT</div><div class="value">{{ items.filter(i => i.kind==='plaft').length }}</div><div class="foot">En evaluación</div></div>
      <div class="card kpi"><div class="label">Reclamaciones</div><div class="value">{{ items.filter(i => i.kind==='complaint').length }}</div><div class="foot">Libro abierto</div></div>
    </div>
    <p v-if="error" class="err">{{ error }}</p>
    <section class="card" style="overflow:hidden">
      <table class="t">
        <thead><tr><th>Tarea</th><th>Origen</th><th>Antigüedad</th><th /></tr></thead>
        <tbody>
          <tr v-for="t in items" :key="t.kind + t.id">
            <td><div class="strong">{{ t.title }}</div><div class="muted" style="font-size:12px">{{ t.detail }}</div></td>
            <td class="muted">{{ t.origin }}</td>
            <td class="num">{{ t.age }}</td>
            <td class="r">
              <span v-if="t.kind==='commitment'" class="row" style="justify-content:flex-end">
                <button class="btn danger sm" type="button" @click="reject(t.id)">Rechazar</button>
                <button class="btn success sm" type="button" @click="approve(t.id)"><Icon name="check" />Aprobar</button>
              </span>
              <NuxtLink v-else-if="t.kind==='plaft'" to="/admin/plaft" class="btn secondary sm">Ver ficha</NuxtLink>
              <NuxtLink v-else to="/admin/reclamaciones" class="btn secondary sm">Responder</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </Shell>
</template>
