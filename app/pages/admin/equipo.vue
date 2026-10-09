<script setup lang="ts">
const rows = ref<any[]>([])
const form = reactive({ firstName: '', lastName: '', email: '', role: 'operaciones' })
const created = ref<any>(null)
const error = ref('')
async function load() { rows.value = await api('/api/admin/team') }
onMounted(load)
async function invite() {
  error.value = ''
  try { created.value = await api('/api/admin/team', { method: 'POST', body: form }); await load() }
  catch (e: any) { error.value = e.message }
}
</script>
<template>
  <Shell active="equipo" :crumbs="['Administración', 'Equipo']" :show-currency="false">
    <div class="page-head"><div><h1>Equipo</h1><p>Cada persona entra con un solo rol. La contraseña de un invitado se muestra una vez: no hay pantalla aparte para elegirla.</p></div></div>
    <div class="split" style="display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start">
      <section class="card" style="overflow:hidden"><table class="t">
        <thead><tr><th>Persona</th><th>Rol</th><th>Correo</th></tr></thead>
        <tbody><tr v-for="r in rows" :key="r.id"><td class="strong">{{ r.name }}</td><td>{{ r.roleLabel }}</td><td class="muted">{{ r.email }}</td></tr></tbody>
      </table></section>
      <form class="card" @submit.prevent="invite">
        <div class="card-h"><h3>Invitar</h3></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
          <div class="field"><label>Nombre</label><div class="input"><input v-model="form.firstName" required /></div></div>
          <div class="field"><label>Apellidos</label><div class="input"><input v-model="form.lastName" required /></div></div>
          <div class="field"><label>Correo</label><div class="input"><input v-model="form.email" type="email" required /></div></div>
          <div class="field"><label>Rol</label><div class="input"><select v-model="form.role"><option value="tesoreria">Tesorería</option><option value="operaciones">Operaciones</option><option value="cumplimiento">Cumplimiento</option><option value="admin">Admin</option></select></div></div>
          <p v-if="error" class="err">{{ error }}</p>
          <div v-if="created" class="alert info"><Icon name="info" /><span class="txt">Entra con <b>{{ created.email }}</b> y la clave <b class="mono">{{ created.password }}</b>.</span></div>
          <button class="btn primary">Crear acceso</button>
        </div>
      </form>
    </div>
  </Shell>
</template>
