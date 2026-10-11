<script setup lang="ts">
const form = reactive<Record<string, string>>({})
const saved = ref(false)
onMounted(async () => Object.assign(form, await api('/api/admin/settings')))
async function save() {
  await api('/api/admin/settings', { method: 'POST', body: form })
  saved.value = true
}
const fields = [
  ['secondary_window_days', 'Días de ventana interna'],
  ['retracto_days', 'Días de retracto'],
  ['commission_pct', 'Comisión del secundario %'],
  ['closing_cost_usd', 'Costo de cierre estimado USD'],
  ['closing_cost_pen', 'Costo de cierre estimado PEN'],
  ['double_approval_usd', 'Umbral de doble aprobación USD (vacío = no aplica)'],
]
</script>
<template>
  <Shell active="config" :crumbs="['Administración', 'Configuración']" :show-currency="false">
    <div class="page-head"><div><h1>Configuración</h1><p>Plazos del secundario, comisión y el costo estimado de cierre. Cumplimiento puede ajustar la comisión; el resto lo guarda un admin.</p></div></div>
    <form class="card" style="max-width:560px" @submit.prevent="save">
      <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
        <div v-for="f in fields" :key="f[0]" class="field"><label>{{ f[1] }}</label><div class="input"><input v-model="form[f[0]]" /></div></div>
        <div class="row"><button class="btn primary">Guardar</button><span v-if="saved" class="up">Guardado</span></div>
      </div>
    </form>
  </Shell>
</template>
