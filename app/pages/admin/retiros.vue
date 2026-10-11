<script setup lang="ts">
const rows = ref<any[]>([])
const status = ref('pending')
async function load() { rows.value = (await api<any>(`/api/admin/withdrawals?status=${status.value}`)).rows }
watch(status, load); onMounted(load)
async function act(id: string, action: string) { await api(`/api/admin/withdrawals/${id}/${action}`, { method: 'POST', body: {} }); await load() }
</script>
<template>
  <Shell active="retiros" :crumbs="['Tesorería', 'Retiros']">
    <div class="page-head"><div><h1>Retiros</h1><p>Aprueba el pago y luego márcalo como pagado cuando salga del banco.</p></div>
      <div class="actions"><div class="seg"><button type="button" :class="{ on: status==='pending' }" @click="status='pending'">Pendientes</button><button type="button" :class="{ on: status==='approved' }" @click="status='approved'">Aprobados</button><button type="button" :class="{ on: status==='paid' }" @click="status='paid'">Pagados</button></div></div>
    </div>
    <section class="card" style="overflow:hidden"><table class="t">
      <thead><tr><th>Código</th><th>Inversionista</th><th>Cuenta</th><th class="r">Monto</th><th>Estado</th><th /></tr></thead>
      <tbody>
        <tr v-for="r in rows" :key="r.id">
          <td class="mono">{{ r.code }}</td><td class="strong">{{ r.investor }}</td><td>{{ r.account }}</td><td class="r num strong">{{ r.money }}</td><td class="muted">{{ r.at }}</td>
          <td class="r"><span class="row" style="justify-content:flex-end">
            <button v-if="r.status==='pending'" class="btn danger sm" type="button" @click="act(r.id,'reject')">Rechazar</button>
            <button v-if="r.status==='pending'" class="btn success sm" type="button" @click="act(r.id,'approve')">Aprobar</button>
            <button v-if="r.status==='approved'" class="btn primary sm" type="button" @click="act(r.id,'pay')">Marcar pagado</button>
          </span></td>
        </tr>
      </tbody>
    </table></section>
  </Shell>
</template>
