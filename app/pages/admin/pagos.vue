<script setup lang="ts">
const rows = ref<any[]>([])
onMounted(async () => { rows.value = (await api<any>('/api/admin/withdrawals?status=approved')).rows })
async function pay(id: string) {
  await api(`/api/admin/withdrawals/${id}/pay`, { method: 'POST' })
  rows.value = (await api<any>('/api/admin/withdrawals?status=approved')).rows
}
</script>
<template>
  <Shell active="pagos" :crumbs="['Tesorería', 'Pagos y conciliación']">
    <div class="page-head"><div><h1>Pagos y conciliación</h1><p>Retiros ya aprobados, listos para salir de la cuenta de PROPIA.</p></div></div>
    <section class="card" style="overflow:hidden"><table class="t">
      <thead><tr><th>Código</th><th>Inversionista</th><th>Destino</th><th class="r">Monto</th><th /></tr></thead>
      <tbody>
        <tr v-if="!rows.length"><td colspan="5" class="muted">No hay pagos por conciliar.</td></tr>
        <tr v-for="r in rows" :key="r.id"><td class="mono">{{ r.code }}</td><td class="strong">{{ r.investor }}</td><td>{{ r.account }}</td><td class="r num">{{ r.money }}</td><td class="r"><button class="btn success sm" type="button" @click="pay(r.id)">Conciliar y pagar</button></td></tr>
      </tbody>
    </table></section>
  </Shell>
</template>
