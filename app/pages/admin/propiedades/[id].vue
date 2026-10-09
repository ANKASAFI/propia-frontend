<script setup lang="ts">
const route = useRoute()
const p = ref<any>(null)
const status = ref('')
const note = ref('')
async function load() {
  p.value = await api(`/api/properties/${route.params.id}`)
  status.value = p.value.status
  note.value = p.value.note || ''
}
onMounted(load)
const flow = ['draft', 'funding', 'funded', 'notary', 'registered', 'operating', 'sale_vote', 'selling', 'sold', 'cancelled']
async function save() {
  p.value = await api(`/api/admin/properties/${route.params.id}`, { method: 'POST', body: { status: status.value, note: note.value } })
}
</script>
<template>
  <Shell v-if="p" active="propiedades" :crumbs="['Propiedades', p.name]" :show-currency="false">
    <div class="page-head"><div><div class="row" style="gap:10px"><h1>{{ p.name }}</h1><Badge :label="p.statusLabel" :cls="p.statusClass" /></div><p>{{ p.city }} · {{ p.kind }} · {{ p.filled }}/{{ p.unitsTotal }} unidades</p></div></div>
    <section class="card" style="max-width:640px"><div class="card-b" style="display:flex;flex-direction:column;gap:12px">
      <div class="field"><label>Estado</label><div class="input"><select v-model="status"><option v-for="s in flow" :key="s" :value="s">{{ s }}</option></select></div><span class="hint">Salir de fondeo rechaza las solicitudes pendientes. Llegar a inscrita u operación convierte los compromisos en cuotas. Cancelar devuelve el saldo comprometido.</span></div>
      <div class="field"><label>Nota interna</label><div class="input"><input v-model="note" /></div></div>
      <button class="btn primary" type="button" style="align-self:flex-start" @click="save">Guardar estado</button>
    </div></section>
  </Shell>
</template>
