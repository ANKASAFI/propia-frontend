<script setup lang="ts">
const rows = ref<any[]>([])
const selected = ref<any>(null)
const response = ref('')
async function load() { rows.value = await api('/api/admin/complaints'); selected.value = rows.value.find((r) => r.status==='open') || rows.value[0] }
onMounted(load)
async function send() {
  await api(`/api/admin/complaints/${selected.value.id}`, { method: 'POST', body: { response: response.value } })
  response.value = ''
  await load()
}
</script>
<template>
  <Shell active="reclamaciones" :crumbs="['Administración', 'Reclamaciones']" :show-currency="false">
    <div class="page-head"><div><h1>Libro de reclamaciones</h1><p>Responde dentro del plazo. La persona guarda el número de hoja.</p></div></div>
    <div class="split" style="display:grid;grid-template-columns:1fr 420px;gap:20px;align-items:start">
      <section class="card" style="overflow:hidden"><table class="t">
        <thead><tr><th>Hoja</th><th>Persona</th><th>Tipo</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" :class="{ sel: selected?.id===r.id }" style="cursor:pointer" @click="selected = r">
            <td class="mono">{{ r.code }}</td><td><div class="strong">{{ r.name }}</div><div class="muted" style="font-size:12px">{{ r.email }}</div></td><td>{{ r.kind }}</td><td><Badge :label="r.status==='open' ? 'Abierta' : 'Respondida'" :cls="r.status==='open' ? 'b-amber' : 'b-teal'" /></td>
          </tr>
        </tbody>
      </table></section>
      <aside v-if="selected" class="card"><div class="card-h"><h3>{{ selected.code }}</h3></div>
        <form class="card-b" style="display:flex;flex-direction:column;gap:10px" @submit.prevent="send">
          <p style="margin:0">{{ selected.detail }}</p>
          <p v-if="selected.request" class="muted" style="margin:0">Pedido: {{ selected.request }}</p>
          <p v-if="selected.response" class="muted">Respuesta: {{ selected.response }}</p>
          <div v-if="selected.status==='open'" class="field"><label>Respuesta</label><div class="input area"><textarea v-model="response" required /></div></div>
          <button v-if="selected.status==='open'" class="btn primary">Enviar respuesta</button>
        </form>
      </aside>
    </div>
  </Shell>
</template>
