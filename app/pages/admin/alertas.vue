<script setup lang="ts">
const rows = ref<any[]>([])
async function load() { rows.value = await api('/api/admin/alerts') }
onMounted(load)
async function ack(id: string) { await api(`/api/admin/alerts/${id}/ack`, { method: 'POST' }); await load() }
</script>
<template>
  <Shell active="alertas" :crumbs="['Cumplimiento', 'Alertas']" :show-currency="false">
    <div class="page-head"><div><h1>Alertas</h1><p>Señales para revisar. Cerrarlas no borra el hecho: queda en el registro.</p></div></div>
    <section class="card" style="overflow:hidden"><table class="t">
      <thead><tr><th>Alerta</th><th>Severidad</th><th>Antigüedad</th><th /></tr></thead>
      <tbody>
        <tr v-for="a in rows" :key="a.id">
          <td><div class="strong">{{ a.title }}</div><div class="muted" style="font-size:12px">{{ a.detail }}</div></td>
          <td><Badge :label="a.severity" :cls="a.severity==='alta' ? 'b-red' : 'b-amber'" /></td>
          <td class="num muted">{{ a.age }}</td>
          <td class="r"><button v-if="a.status==='open'" class="btn secondary sm" type="button" @click="ack(a.id)">Cerrar</button><span v-else class="muted">Cerrada</span></td>
        </tr>
      </tbody>
    </table></section>
  </Shell>
</template>
