<script setup lang="ts">
const { toggleTheme, initTheme, me, refresh } = useSession()
const email = ref('joel.villanueva@email.com')
const password = ref('')
const show = ref(false)
const error = ref('')
const busy = ref(false)
onMounted(initTheme)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    me.value = await api('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await navigateTo(homeFor(me.value.user))
  } catch (e: any) {
    error.value = e.message
  } finally { busy.value = false }
}
</script>
<template>
  <div class="auth-grid" style="display:grid;grid-template-columns:640px 1fr;height:100%">
    <section class="auth-brand" style="background:linear-gradient(160deg,#0A2148 0%,#0B2B5C 55%,#0E4D63 100%);color:#C9D5EA;padding:44px 56px;display:flex;flex-direction:column">
      <Logo :size="30" on-dark />
      <div style="margin-top:auto">
        <span class="badge plain" style="background:rgba(31,184,154,.16);color:#5EE0C2">Copropiedad inscrita en SUNARP</span>
        <h1 style="color:#fff;font-size:34px;line-height:1.18;font-weight:600;letter-spacing:-.02em;margin:18px 0 14px;max-width:470px">Inversión inmobiliaria fraccionada, con respaldo registral.</h1>
        <p style="margin:0;max-width:440px;font-size:14.5px;line-height:1.6">Adquiere cuotas ideales de inmuebles seleccionados, recibe tu renta cada mes y gestiona tu patrimonio desde un solo lugar.</p>
        <div style="margin-top:36px;padding:22px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.04);max-width:470px">
          <div class="row" style="justify-content:space-between;margin-bottom:14px;font-size:12.5px"><span class="mono">Edificio Alba · San Isidro</span><span class="mono" style="color:#5EE0C2">14 / 20 unidades</span></div>
          <div class="tiles" style="grid-template-columns:repeat(20,1fr);gap:5px"><i v-for="k in 20" :key="k" :style="{ background: k <= 14 ? '#1FB89A' : 'rgba(255,255,255,.14)' }" /></div>
        </div>
      </div>
      <div class="row" style="gap:36px;margin-top:40px">
        <div><div class="num" style="color:#fff;font-size:20px;font-weight:600">9.8%</div><div style="font-size:12px">Renta anual est.</div></div>
        <div><div class="num" style="color:#fff;font-size:20px;font-weight:600">US$ 13k</div><div style="font-size:12px">Ticket desde</div></div>
        <div><div class="num" style="color:#fff;font-size:20px;font-weight:600">Mensual</div><div style="font-size:12px">Renta a tu wallet</div></div>
      </div>
      <div style="margin-top:36px;font-size:11.5px;opacity:.7">PROPIA SAC · RUC 20601234567 · Lima, Perú</div>
    </section>
    <section style="display:flex;flex-direction:column;padding:28px 40px;background:var(--bg)">
      <div class="row" style="justify-content:flex-end;gap:10px">
        <span class="muted">¿No tienes cuenta?</span>
        <NuxtLink to="/registro" class="btn secondary sm">Crear cuenta</NuxtLink>
        <button class="icon-btn" type="button" @click="toggleTheme"><Icon name="moon" cls="moon" /><Icon name="sun" cls="sun" /></button>
      </div>
      <form style="margin:auto;width:min(400px,100%)" @submit.prevent="submit">
        <h2 style="margin:0;color:var(--ink);font-size:24px;font-weight:600;letter-spacing:-.01em">Iniciar sesión</h2>
        <p class="muted" style="margin:6px 0 28px">Accede a tu cartera, tu wallet y tus movimientos.</p>
        <div class="field" style="margin-bottom:16px">
          <label>Correo electrónico</label>
          <div class="input focus"><Icon name="mail" /><input v-model="email" type="email" autocomplete="username" required /></div>
        </div>
        <div class="field">
          <div class="row" style="justify-content:space-between"><label>Contraseña</label><NuxtLink to="/recuperar" style="color:var(--blue);font-size:12.5px;font-weight:500;text-decoration:none">¿Olvidaste tu contraseña?</NuxtLink></div>
          <div class="input"><Icon name="lock" /><input v-model="password" :type="show ? 'text' : 'password'" autocomplete="current-password" required /><button type="button" class="naked muted" style="margin-left:auto" @click="show = !show"><Icon name="eye" /></button></div>
        </div>
        <p v-if="error" class="err" style="margin:12px 0 0">{{ error }}</p>
        <button class="btn primary block" style="height:42px;margin-top:24px" :disabled="busy">Continuar</button>
        <div class="row" style="margin-top:22px;gap:10px;color:var(--muted);font-size:12.5px"><Icon name="shield" /><span>Sesión cifrada. Nunca te pediremos tu contraseña por correo.</span></div>
      </form>
      <div class="row muted" style="justify-content:center;gap:18px;font-size:12px">
        <span>Términos</span><span>Privacidad</span>
        <NuxtLink to="/libro-de-reclamaciones" class="row muted" style="gap:6px;text-decoration:none"><Icon name="file" />Libro de reclamaciones</NuxtLink>
      </div>
    </section>
  </div>
</template>
