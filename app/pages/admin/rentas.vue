<script setup lang="ts">
const props = ref<any[]>([])
const runs = ref<any[]>([])
const form = reactive({ propertyId: '', period: '2026-10', gross: '', expenses: '' })
const error = ref('')
async function load() {
  props.value = (await api<any[]>('/api/properties')).filter((p) => ['operating', 'sale_vote', 'selling'].includes(p.status))
  runs.value = await api('/api/admin/rents')
  if (!form.propertyId && props.value[0]) form.propertyId = props.value[0].id
}
onMounted(load)
async function send() {
  error.value = ''
  try {
    await api('/api/admin/rents', { method: 'POST', body: { ...form, gross: Number(form.gross), expenses: Number(form.expenses) } })
    await load()
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <Shell active="rentas" :crumbs="['Operaciones', 'Rentas y gastos']" :show-currency="false">
    <div class="page-head"><div><h1>Rentas y gastos</h1><p>La renta neta se reparte según las cuotas inscritas y entra a cada wallet.</p></div></div>
    <div class="split" style="display:grid;grid-template-columns:380px 1fr;gap:20px;align-items:start">
      <form class="card" @submit.prevent="send">
        <div class="card-h"><h3>Registrar un mes</h3></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
          <div class="field"><label>Propiedad</label><div class="input"><select v-model="form.propertyId"><option v-for="p in props" :key="p.id" :value="p.id">{{ p.name }}</option></select></div></div>
          <div class="field"><label>Periodo</label><div class="input"><input v-model="form.period" placeholder="2026-10" required /></div></div>
          <div class="field"><label>Renta bruta</label><div class="input"><input v-model="form.gross" required /></div></div>
          <div class="field"><label>Gastos</label><div class="input"><input v-model="form.expenses" required /></div></div>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary">Distribuir</button>
        </div>
      </form>
      <section class="card" style="overflow:hidden"><table class="t">
        <thead><tr><th>Periodo</th><th>Inmueble</th><th class="r">Bruta</th><th class="r">Gastos</th><th class="r">Neta</th></tr></thead>
        <tbody>
          <tr v-if="!runs.length"><td colspan="5" class="muted">Aún no hay repartos.</td></tr>
          <tr v-for="r in runs" :key="r.id"><td class="mono">{{ r.period }}</td><td class="strong">{{ r.property }}</td><td class="r num">{{ money(r.gross) }}</td><td class="r num">{{ money(r.expenses) }}</td><td class="r num up">{{ money(r.net) }}</td></tr>
        </tbody>
      </table></section>
    </div>
  </Shell>
</template>
