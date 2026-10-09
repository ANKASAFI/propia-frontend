<script setup lang="ts">
const { toggleTheme, initTheme, me } = useSession()
const info = ref<{ email: string; devCode?: string }>({ email: '' })
const digits = ref(['', '', '', '', '', ''])
const error = ref('')
onMounted(() => {
  initTheme()
  try { info.value = JSON.parse(sessionStorage.getItem('propia-verify') || '{}') } catch { /* vacío */ }
})
async function submit() {
  error.value = ''
  try {
    const user = await api<any>('/api/auth/confirm', { method: 'POST', body: { email: info.value.email, code: digits.value.join('') } })
    me.value = await api('/api/auth/me')
    await navigateTo(homeFor(me.value?.user || user))
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <div class="public" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:var(--bg);position:relative">
    <div class="row" style="position:absolute;top:24px;left:32px;right:32px"><Logo :size="26" /><span class="grow" /><button class="icon-btn" type="button" @click="toggleTheme"><Icon name="moon" cls="moon" /><Icon name="sun" cls="sun" /></button></div>
    <section class="card" style="width:min(460px,calc(100% - 32px))">
      <form class="card-b" style="padding:32px;display:flex;flex-direction:column;gap:16px" @submit.prevent="submit">
        <span style="width:44px;height:44px;border-radius:50%;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center"><Icon name="mail" /></span>
        <div><h2 style="margin:0;color:var(--ink);font-size:22px;font-weight:600">Revisa tu correo</h2><p class="muted" style="margin:6px 0 0">Enviamos un código de 6 dígitos a <b class="ink">{{ info.email }}</b>.</p></div>
        <div class="otp">
          <input v-for="(_, i) in digits" :key="i" v-model="digits[i]" maxlength="1" inputmode="numeric" class="otp-box" :class="{ cur: digits[i] === '' && digits.slice(0, i).every(Boolean) }" />
        </div>
        <p v-if="info.devCode" class="hint">Entorno local: tu código es <b class="mono ink">{{ info.devCode }}</b>.</p>
        <p v-if="error" class="err">{{ error }}</p>
        <button class="btn primary block" style="height:42px">Confirmar correo</button>
        <div class="row" style="justify-content:space-between;font-size:12.5px"><span class="muted">El código no caduca en local.</span><NuxtLink to="/registro" style="color:var(--blue);font-weight:500;text-decoration:none">Usar otro correo</NuxtLink></div>
      </form>
    </section>
  </div>
</template>
<style scoped>
.otp-box { width: 46px; height: 52px; border: 1px solid var(--line-strong); border-radius: 8px; text-align: center; font: inherit; font-size: 20px; font-weight: 600; color: var(--ink); background: var(--surface); }
.otp-box.cur, .otp-box:focus { border-color: var(--blue); box-shadow: var(--focus); outline: none; }
</style>
