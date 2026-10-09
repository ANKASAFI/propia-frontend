<script setup lang="ts">
const { toggleTheme, initTheme } = useSession()
const email = ref('')
const password = ref('')
const terms = ref(false)
const privacy = ref(false)
const error = ref('')
const busy = ref(false)
onMounted(initTheme)
const rules = computed(() => [
  [password.value.length >= 12, '12 caracteres o más'],
  [/[A-Z]/.test(password.value), 'Una mayúscula'],
  [/\d/.test(password.value), 'Un número'],
  [/[^A-Za-z0-9]/.test(password.value), 'Un símbolo'],
])
const ready = computed(() => rules.value.every((r) => r[0]) && terms.value && privacy.value && email.value.includes('@'))

async function submit() {
  error.value = ''
  busy.value = true
  try {
    const res = await api<any>('/api/auth/signup', { method: 'POST', body: { email: email.value, password: password.value, terms: terms.value, privacy: privacy.value } })
    sessionStorage.setItem('propia-verify', JSON.stringify({ email: res.email, devCode: res.devCode }))
    await navigateTo('/verificar')
  } catch (e: any) { error.value = e.message } finally { busy.value = false }
}
</script>
<template>
  <div class="auth-grid" style="display:grid;grid-template-columns:640px 1fr;height:100%">
    <section class="auth-brand" style="background:linear-gradient(160deg,#0A2148 0%,#0B2B5C 55%,#0E4D63 100%);color:#C9D5EA;padding:44px 56px;display:flex;flex-direction:column">
      <Logo :size="30" on-dark />
      <div style="margin-top:auto;max-width:460px">
        <h1 style="color:#fff;font-size:32px;line-height:1.2;font-weight:600;margin:0 0 12px">Crea tu cuenta en un minuto.</h1>
        <p style="margin:0 0 22px;font-size:14.5px">Con la cuenta ves las propiedades y el mercado secundario. Para invertir completas tu habilitación.</p>
        <div v-for="s in [['Ten a mano tu documento','DNI, carné de extranjería o pasaporte'],['Una cuenta bancaria a tu nombre','Desde ahí cargas saldo y a ahí retiras'],['Unos 10 minutos para habilitarte','Datos, firma en DocuSign y revisión de cumplimiento']]" :key="s[0]" style="margin-bottom:14px">
          <b style="color:#fff">{{ s[0] }}</b><div style="font-size:13px">{{ s[1] }}</div>
        </div>
      </div>
      <div style="margin-top:28px;font-size:11.5px;opacity:.7">PROPIA SAC · RUC 20601234567 · Lima, Perú</div>
    </section>
    <section style="display:flex;flex-direction:column;padding:28px 40px;background:var(--surface)">
      <div class="row" style="justify-content:flex-end;gap:10px">
        <span class="muted">¿Ya tienes cuenta?</span>
        <NuxtLink to="/login" class="btn secondary sm">Iniciar sesión</NuxtLink>
        <button class="icon-btn" type="button" @click="toggleTheme"><Icon name="moon" cls="moon" /><Icon name="sun" cls="sun" /></button>
      </div>
      <form style="margin:auto;width:min(400px,100%);display:flex;flex-direction:column;gap:14px" @submit.prevent="submit">
        <div><h2 style="margin:0;color:var(--ink);font-size:24px;font-weight:600">Crear cuenta</h2><p class="muted" style="margin:6px 0 0">Te enviaremos un código para confirmar tu correo.</p></div>
        <div class="field"><label>Correo electrónico</label><div class="input"><Icon name="mail" /><input v-model="email" type="email" required /></div></div>
        <div class="field"><label>Contraseña</label>
          <div class="input" :class="{ focus: password }"><Icon name="lock" /><input v-model="password" type="password" required /></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px">
            <span v-for="r in rules" :key="r[1]" class="row" :style="{ gap: '6px', color: r[0] ? 'var(--teal)' : 'var(--muted)' }"><Icon :name="r[0] ? 'check' : 'x'" />{{ r[1] }}</span>
          </div>
        </div>
        <label class="check"><input v-model="terms" type="checkbox" /><span>Acepto los <b class="ink">términos y condiciones</b>.</span></label>
        <label class="check"><input v-model="privacy" type="checkbox" /><span>Acepto la <b class="ink">política de privacidad</b> y el tratamiento de mis datos.</span></label>
        <p v-if="error" class="err">{{ error }}</p>
        <button class="btn block" :class="ready ? 'primary' : 'is-off'" style="height:42px" :disabled="!ready || busy">Crear cuenta</button>
        <span v-if="!terms || !privacy" class="hint" style="text-align:center">Acepta los dos documentos para continuar.</span>
      </form>
    </section>
  </div>
</template>
