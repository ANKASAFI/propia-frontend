<script setup lang="ts">
const { toggleTheme, initTheme } = useSession()
const step = ref(1)
const email = ref('')
const code = ref('')
const password = ref('')
const again = ref('')
const devCode = ref('')
const error = ref('')
onMounted(initTheme)
async function send() {
  error.value = ''
  const res = await api<any>('/api/auth/forgot', { method: 'POST', body: { email: email.value } })
  devCode.value = res.devCode || ''
  step.value = 2
}
async function change() {
  error.value = ''
  if (password.value !== again.value) { error.value = 'Las contraseñas no coinciden.'; return }
  try {
    await api('/api/auth/reset', { method: 'POST', body: { email: email.value, code: code.value, password: password.value } })
    step.value = 3
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <div class="public" style="display:flex;flex-direction:column;background:var(--bg);padding:24px 32px">
    <div class="row"><Logo :size="26" /><span class="grow" /><NuxtLink to="/login" class="btn secondary sm">Volver a iniciar sesión</NuxtLink><button class="icon-btn" type="button" @click="toggleTheme"><Icon name="moon" cls="moon" /><Icon name="sun" cls="sun" /></button></div>
    <div style="margin:auto;width:min(400px,100%)">
      <section class="card"><div class="card-b" style="padding:24px;display:flex;flex-direction:column;gap:14px">
        <span class="badge b-gray plain" style="align-self:flex-start">Paso {{ step }} de 3</span>
        <template v-if="step === 1">
          <h2 style="margin:0;color:var(--ink);font-size:19px;font-weight:600">Recupera tu contraseña</h2>
          <p class="muted" style="margin:0">Escribe el correo de tu cuenta. Si existe, te llega un código.</p>
          <form class="field" @submit.prevent="send"><label>Correo electrónico</label><div class="input focus"><Icon name="mail" /><input v-model="email" type="email" required /></div><button class="btn primary block" style="margin-top:16px">Enviar código</button></form>
        </template>
        <form v-else-if="step === 2" style="display:flex;flex-direction:column;gap:14px" @submit.prevent="change">
          <h2 style="margin:0;color:var(--ink);font-size:19px;font-weight:600">Código y contraseña nueva</h2>
          <p v-if="devCode" class="hint">Entorno local: tu código es <b class="mono ink">{{ devCode }}</b>.</p>
          <div class="field"><label>Código</label><div class="input"><input v-model="code" inputmode="numeric" maxlength="6" required /></div></div>
          <div class="field"><label>Contraseña nueva</label><div class="input"><Icon name="lock" /><input v-model="password" type="password" required /></div><span class="hint">12 caracteres, mayúscula, número y símbolo.</span></div>
          <div class="field"><label>Repítela</label><div class="input"><Icon name="lock" /><input v-model="again" type="password" required /></div></div>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary block">Cambiar contraseña</button>
        </form>
        <template v-else>
          <h2 style="margin:0;color:var(--ink);font-size:19px;font-weight:600">Listo</h2>
          <span style="width:44px;height:44px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center"><Icon name="check" /></span>
          <p class="muted" style="margin:0">Tu contraseña cambió. Entra de nuevo con la nueva.</p>
          <NuxtLink to="/login" class="btn primary block">Iniciar sesión</NuxtLink>
        </template>
      </div></section>
    </div>
  </div>
</template>
