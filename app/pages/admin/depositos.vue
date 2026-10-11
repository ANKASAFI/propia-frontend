<script setup lang="ts">
const status = ref('pending')
const data = ref<any>({ rows: [] })
const selected = ref<any>(null)
const reason = ref('No coincide con el extracto')
async function load() {
  data.value = await api(`/api/admin/deposits?status=${status.value}`)
  selected.value = data.value.rows[0] || null
}
watch(status, load)
onMounted(load)
async function decide(approve: boolean) {
  if (!selected.value) return
  await api(`/api/admin/deposits/${selected.value.id}/${approve ? 'approve' : 'reject'}`, { method: 'POST', body: { reason: reason.value } })
  await load()
}
</script>
<template>
  <Shell active="depositos" :crumbs="['Tesorería', 'Depósitos por validar']">
    <div class="page-head">
      <div><h1>Depósitos por validar</h1><p>Compara la constancia con el extracto bancario antes de acreditar la wallet.</p></div>
      <div class="actions"><div class="seg"><button type="button" :class="{ on: status==='pending' }" @click="status='pending'">Pendientes</button><button type="button" :class="{ on: status==='approved' }" @click="status='approved'">Aprobados</button><button type="button" :class="{ on: status==='rejected' }" @click="status='rejected'">Rechazados</button></div></div>
    </div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="card kpi"><div class="label">Pendientes</div><div class="value">{{ data.pending }}</div></div>
      <div class="card kpi"><div class="label">Monto pendiente USD</div><div class="value">{{ money(data.pendingUsd || 0) }}</div></div>
      <div class="card kpi"><div class="label">Monto pendiente PEN</div><div class="value">{{ money(data.pendingPen || 0, 'PEN') }}</div></div>
    </div>
    <div class="split" style="display:grid;grid-template-columns:1fr 440px;gap:20px;align-items:start">
      <section class="card" style="overflow:hidden">
        <table class="t">
          <thead><tr><th>Inversionista</th><th>Banco</th><th class="r">Monto</th><th>N.º operación</th><th>Enviado</th></tr></thead>
          <tbody>
            <tr v-for="d in data.rows" :key="d.id" :class="{ sel: selected?.id === d.id }" style="cursor:pointer" @click="selected = d">
              <td><div class="strong">{{ d.investor }}</div><div class="muted mono" style="font-size:11.5px">{{ d.document }}</div></td>
              <td>{{ d.originBank }}</td>
              <td class="r num strong">{{ d.money }}</td>
              <td><div class="mono muted">{{ d.operationNumber }}</div><div v-if="d.duplicate" style="margin-top:4px"><Badge label="N.º repetido" cls="b-amber" icon="alert" /></div></td>
              <td class="muted">{{ d.at }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <aside v-if="selected" class="card">
        <div class="card-h"><h3>{{ selected.code }}</h3><span class="sub">{{ selected.investor }}</span></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:8px">
          <div class="voucher">
            <div class="vh"><b>{{ selected.originBank || 'Banco' }}</b><span>Constancia</span></div>
            <div class="vr"><span>N.º de operación</span><span>{{ selected.operationNumber }}</span></div>
            <div class="vr"><span>Archivo</span><span>{{ selected.fileName }}</span></div>
            <div class="vr"><span>Monto</span><span class="amt">{{ selected.money }}</span></div>
          </div>
          <dl class="dl"><dt>Cuenta de origen</dt><dd>{{ selected.originAccount || '—' }}</dd><dt>Titular</dt><dd>{{ selected.investor }}</dd><dt>N.º de operación</dt><dd :class="selected.duplicate ? 'down' : 'up'">{{ selected.duplicate ? 'Repetido' : 'Sin coincidencias' }}</dd></dl>
          <div v-if="selected.status === 'pending'" class="field"><label>Motivo (solo si rechazas)</label><div class="input"><input v-model="reason" /></div></div>
          <div v-if="selected.status === 'pending'" class="row" style="gap:10px"><button class="btn danger grow" type="button" @click="decide(false)"><Icon name="x" />Rechazar</button><button class="btn success grow" type="button" @click="decide(true)"><Icon name="check" />Aprobar y acreditar</button></div>
          <Badge v-else :label="selected.status === 'approved' ? 'Aprobado' : 'Rechazado'" :cls="selected.status === 'approved' ? 'b-teal' : 'b-red'" />
        </div>
      </aside>
    </div>
  </Shell>
</template>
