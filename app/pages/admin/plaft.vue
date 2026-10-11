<script setup lang="ts">
const rows = ref<any[]>([])
const selected = ref<any>(null)
const note = ref('')
const filter = ref('review')
async function load() {
  rows.value = await api(`/api/admin/plaft?status=${filter.value}`)
  selected.value = rows.value[0] || null
}
watch(filter, load); onMounted(load)
async function act(action: string) {
  if (!selected.value) return
  await api(`/api/admin/plaft/${selected.value.id}`, { method: 'POST', body: { action, note: note.value } })
  note.value = ''
  await load()
}
</script>
<template>
  <Shell active="plaft" :crumbs="['Cumplimiento', 'Evaluación PLAFT']" :show-currency="false">
    <div class="page-head">
      <div><h1>Evaluación PLAFT</h1><p>Revisas listas y origen de fondos antes de habilitar la cuenta para invertir.</p></div>
      <div class="actions"><div class="seg"><button type="button" :class="{ on: filter==='review' }" @click="filter='review'">En evaluación</button><button type="button" :class="{ on: filter==='observed' }" @click="filter='observed'">Observados</button><button type="button" :class="{ on: filter==='resolved' }" @click="filter='resolved'">Resueltos</button></div></div>
    </div>
    <div class="split" style="display:grid;grid-template-columns:1fr 460px;gap:20px;align-items:start">
      <section class="card" style="overflow:hidden"><table class="t">
        <thead><tr><th>Persona</th><th>Riesgo</th><th>Motivo</th><th>Espera</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" :class="{ sel: selected?.id===r.id }" style="cursor:pointer" @click="selected = r">
            <td><div class="strong">{{ r.name }}</div><div class="muted mono" style="font-size:11.5px">{{ r.documentType }} {{ r.documentNumber }}</div></td>
            <td><Badge :label="r.risk" :cls="r.riskClass" /></td>
            <td class="muted">{{ r.fundsLabel }}</td>
            <td class="num muted">{{ r.age }}</td>
          </tr>
        </tbody>
      </table></section>
      <aside v-if="selected" class="card">
        <div class="card-h"><h3>{{ selected.name }}</h3><span class="right"><Badge :label="selected.risk" :cls="selected.riskClass" /></span></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
          <dl class="dl">
            <dt>Documento</dt><dd>{{ selected.documentType }} {{ selected.documentNumber }}</dd>
            <dt>Domiciliado</dt><dd>{{ selected.isDomiciled ? 'Sí' : 'No' }}</dd>
            <dt>Origen de fondos</dt><dd>{{ selected.fundsLabel || '—' }}</dd>
            <dt>PEP</dt><dd>{{ selected.pep ? 'Sí' : 'No' }}</dd>
            <dt>Beneficiario final</dt><dd>{{ selected.beneficialOwner ? 'Él mismo' : 'Otro' }}</dd>
          </dl>
          <div v-if="selected.plaftFile" class="row" style="font-size:12.5px"><Icon name="file" /><span class="grow ink">{{ selected.plaftFile }}</span><Badge label="Recibido" cls="b-teal" icon="check" /></div>
          <div class="row" style="justify-content:space-between"><span class="muted">Lista ONU</span><Badge :label="selected.listOnu ? 'Revisada' : 'Pendiente'" :cls="selected.listOnu ? 'b-teal' : 'b-amber'" /></div>
          <div class="row" style="justify-content:space-between"><span class="muted">Lista OFAC</span><Badge :label="selected.listOfac ? 'Revisada' : 'Pendiente'" :cls="selected.listOfac ? 'b-teal' : 'b-amber'" /></div>
          <div v-if="filter !== 'resolved'" class="field"><label>Comentario</label><div class="input"><input v-model="note" placeholder="Qué revisaste y por qué" /></div></div>
          <div v-if="filter !== 'resolved'" class="row" style="gap:8px">
            <button class="btn danger sm grow" type="button" @click="act('reject')"><Icon name="x" />Rechazar</button>
            <button class="btn secondary sm grow" type="button" @click="act('observe')">Observar</button>
            <button class="btn success sm grow" type="button" @click="act('approve')"><Icon name="check" />Aprobar</button>
          </div>
          <div class="muted" style="font-size:12px">Alto: PEP, origen “Otro”, CE o pasaporte. Medio: herencia o negocio propio. El resto es bajo.</div>
        </div>
      </aside>
    </div>
  </Shell>
</template>
