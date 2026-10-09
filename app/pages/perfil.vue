<script setup lang="ts">
const { me, refresh } = useSession()
const user = computed(() => me.value?.user)
const accounts = ref<any[]>([])
const modal = ref('')
const error = ref('')
const password = ref('')
const account = reactive({ bank: 'BCP', accountType: 'Ahorros', currency: 'USD', accountNumber: '', cci: '' })
const file = ref('')
onMounted(async () => { accounts.value = await api('/api/payout-accounts') })
async function addAccount() {
  error.value = ''
  try {
    await api('/api/payout-accounts', { method: 'POST', body: account })
    accounts.value = await api('/api/payout-accounts')
    modal.value = ''
  } catch (e: any) { error.value = e.message }
}
async function changePass() {
  error.value = ''
  try { await api('/api/password', { method: 'POST', body: { password: password.value } }); modal.value = ''; password.value = '' }
  catch (e: any) { error.value = e.message }
}
async function sustento() {
  await api('/api/profile', { method: 'POST', body: { plaftFile: file.value, step: 4 } })
  await refresh()
  modal.value = ''
}
const civil: Record<string, string> = { soltero: 'Soltero', casado: 'Casado', conviviente: 'Conviviente' }
</script>
<template>
  <Shell v-if="user" active="perfil" :crumbs="['Inversionista', 'Perfil']" :show-currency="false" :locked="user.investorStatus !== 'enabled'">
    <div class="page-head"><div class="row" style="gap:10px"><h1>Perfil</h1><Badge :label="user.investorLabel" :cls="user.investorClass" /></div><p>Tus datos, tu acceso y tus cuentas para retirar.</p></div>
    <div class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:16px">
        <section class="card"><div class="card-h"><h3>Datos personales</h3><div class="right"><NuxtLink to="/onboarding" class="btn secondary sm"><Icon name="pen" />Editar</NuxtLink></div></div>
          <div class="card-b"><dl class="dl">
            <dt>Nombre</dt><dd>{{ user.name }}</dd>
            <dt>Documento</dt><dd>{{ user.documentType }} {{ user.documentNumber }}</dd>
            <dt>Nacimiento</dt><dd>{{ user.birthDate || '—' }}</dd>
            <dt>Celular</dt><dd>{{ user.phone || '—' }}</dd>
            <dt>Domiciliado</dt><dd>{{ user.isDomiciled ? 'Sí' : 'No' }}</dd>
            <dt>Estado civil</dt><dd>{{ civil[user.maritalStatus] || '—' }} <template v-if="user.propertyRegime">· {{ user.propertyRegime }}</template></dd>
          </dl></div>
        </section>
        <section class="card"><div class="card-h"><h3>Acceso</h3></div>
          <div class="row" style="padding:12px 18px;border-bottom:1px solid var(--line)"><div class="grow"><b class="ink">Correo</b><div class="muted" style="font-size:12.5px">{{ user.email }}</div></div></div>
          <div class="row" style="padding:12px 18px"><div class="grow"><b class="ink">Contraseña</b><div class="muted" style="font-size:12.5px">Puedes cambiarla cuando quieras.</div></div><button class="btn secondary sm" type="button" @click="modal = 'pass'">Cambiar</button></div>
        </section>
        <section class="card"><div class="card-h"><h3>Cuentas para retiros</h3><div class="right"><button class="btn secondary sm" type="button" @click="modal = 'account'"><Icon name="plus" />Agregar</button></div></div>
          <div v-if="!accounts.length" class="card-b muted">Todavía no registras una cuenta a tu nombre.</div>
          <div v-for="(a, i) in accounts" :key="a.id" class="row" :style="{ padding: '12px 18px', borderBottom: i < accounts.length - 1 ? '1px solid var(--line)' : '' }">
            <span class="muted"><Icon name="landmark" /></span>
            <div class="grow"><b class="ink">{{ a.label }}</b><div class="muted" style="font-size:12.5px">{{ a.holder }}</div></div>
            <Badge v-if="a.ready" label="Habilitado" cls="b-teal" icon="check" />
            <span v-else class="badge b-amber has-ico"><Icon name="clock" />En espera 24 h</span>
          </div>
        </section>
      </div>
      <section v-if="user.investorStatus === 'observed'" class="card">
        <div class="card-h"><h3>Sustento pedido</h3></div>
        <form class="card-b" style="display:flex;flex-direction:column;gap:10px" @submit.prevent="sustento">
          <p class="muted" style="margin:0">{{ user.plaftAsk }}</p>
          <div class="field"><label>Archivo</label><div class="input"><input v-model="file" placeholder="contrato.pdf" required /></div></div>
          <button class="btn primary" style="align-self:flex-start">Enviar sustento</button>
        </form>
      </section>
    </div>
    <div v-if="modal" class="overlay" @click.self="modal = ''">
      <form v-if="modal === 'account'" class="modal" @submit.prevent="addAccount">
        <div class="card-h"><h3>Agregar cuenta para retiros</h3><button class="naked" type="button" @click="modal = ''"><Icon name="x" /></button></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="field"><label>Banco</label><div class="input"><input v-model="account.bank" required /></div></div>
            <div class="field"><label>Moneda</label><div class="seg"><button type="button" :class="{ on: account.currency==='USD' }" @click="account.currency='USD'">USD</button><button type="button" :class="{ on: account.currency==='PEN' }" @click="account.currency='PEN'">PEN</button></div></div>
          </div>
          <div class="field"><label>Número de cuenta</label><div class="input"><input v-model="account.accountNumber" required /></div></div>
          <div class="field"><label>CCI</label><div class="input"><input v-model="account.cci" required /></div></div>
          <div class="alert info"><Icon name="info" /><span class="txt" style="font-size:12.5px">Podrás retirar a esta cuenta 24 horas después de agregarla. El titular queda con tu nombre.</span></div>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary block">Guardar cuenta</button>
        </div>
      </form>
      <form v-else class="modal" @submit.prevent="changePass">
        <div class="card-h"><h3>Cambiar contraseña</h3><button class="naked" type="button" @click="modal = ''"><Icon name="x" /></button></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
          <div class="field"><label>Contraseña nueva</label><div class="input"><input v-model="password" type="password" required /></div><span class="hint">12 caracteres, mayúscula, número y símbolo.</span></div>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary block">Guardar</button>
        </div>
      </form>
    </div>
  </Shell>
</template>
