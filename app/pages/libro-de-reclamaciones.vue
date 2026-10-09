<script setup lang="ts">
const { toggleTheme, initTheme } = useSession()
const form = reactive({ name: '', email: '', document: '', phone: '', address: '', kind: 'reclamo', service: '', amount: '', detail: '', request: '' })
const code = ref('')
const error = ref('')
onMounted(initTheme)
async function send() {
  error.value = ''
  try { code.value = (await api<any>('/api/complaints', { method: 'POST', body: form })).code }
  catch (e: any) { error.value = e.message }
}
</script>
<template>
  <div class="public" style="display:flex;flex-direction:column;background:var(--bg)">
    <header class="top"><Logo :size="24" /><span class="muted" style="font-weight:600">Libro de reclamaciones</span><span class="spacer" /><button class="icon-btn" type="button" @click="toggleTheme"><Icon name="moon" cls="moon" /><Icon name="sun" cls="sun" /></button><NuxtLink to="/login" class="btn secondary sm">Iniciar sesión</NuxtLink></header>
    <div class="content book-grid" style="display:grid;grid-template-columns:380px 1fr;gap:28px;overflow:auto">
      <div>
        <h1 style="margin:0 0 8px;font-size:26px;color:var(--ink);font-weight:600">Hoja de reclamación</h1>
        <p class="muted">Puedes presentarla sin tener cuenta. Te damos el número de hoja al enviarla.</p>
        <section class="card"><div class="card-b" style="display:flex;flex-direction:column;gap:8px">
          <b class="ink">PROPIA SAC</b>
          <div class="row" style="justify-content:space-between"><span class="muted">RUC</span><span class="mono">20601234567</span></div>
          <div class="row" style="justify-content:space-between"><span class="muted">Dirección</span><span>San Isidro, Lima</span></div>
          <div class="divider" />
          <div><b class="ink">Reclamo</b><div class="muted" style="font-size:12.5px">Disconformidad con el servicio.</div></div>
          <div><b class="ink">Queja</b><div class="muted" style="font-size:12.5px">Malestar con la atención, sin reclamar el servicio.</div></div>
        </div></section>
      </div>
      <section v-if="code" class="card"><div class="card-b"><h2 style="margin:0 0 8px;color:var(--ink)">Hoja registrada</h2><p>Tu número es <b class="mono">{{ code }}</b>. Guárdalo: con él damos seguimiento.</p></div></section>
      <form v-else class="card" style="align-self:start" @submit.prevent="send">
        <div class="card-h"><h3>Tus datos</h3><span class="sub">La hoja queda registrada al enviarla</span></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Nombre completo</label><div class="input"><input v-model="form.name" required /></div></div>
            <div class="field"><label>Documento</label><div class="input"><input v-model="form.document" /></div></div>
          </div>
          <div class="field"><label>Domicilio</label><div class="input"><input v-model="form.address" /></div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="field"><label>Teléfono</label><div class="input"><input v-model="form.phone" /></div></div>
            <div class="field"><label>Email</label><div class="input"><input v-model="form.email" type="email" required /></div></div>
          </div>
          <div class="field"><label>Servicio</label><div class="input"><input v-model="form.service" /></div></div>
          <div class="field"><label>Tipo</label><div class="seg"><button type="button" :class="{ on: form.kind==='reclamo' }" @click="form.kind='reclamo'">Reclamo</button><button type="button" :class="{ on: form.kind==='queja' }" @click="form.kind='queja'">Queja</button></div></div>
          <div class="field"><label>Detalle</label><div class="input area"><textarea v-model="form.detail" required /></div></div>
          <div class="field"><label>Pedido</label><div class="input"><input v-model="form.request" /></div></div>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary" style="align-self:flex-start;height:42px">Enviar hoja</button>
        </div>
      </form>
    </div>
  </div>
</template>
