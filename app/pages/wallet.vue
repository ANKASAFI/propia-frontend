<script setup lang="ts">
const { currency } = useSession()
const w = ref<any>(null)
const rows = ref<any[]>([])
const accounts = ref<any[]>([])
const filter = ref('todos')
const error = ref('')
const fileName = ref('')
const form = reactive({ amount: '', operationNumber: '', originBank: 'BCP', originAccount: '' })
const modal = ref<any>(null)
const code = ref('')
const draw = reactive({ amount: '', accountId: '' })

async function load() {
  w.value = await api(`/api/wallet?currency=${currency.value}`)
  rows.value = await api(`/api/movements?currency=${currency.value}`)
  accounts.value = await api('/api/payout-accounts')
  if (!draw.accountId && accounts.value[0]) draw.accountId = accounts.value.find((a) => a.currency === currency.value && a.ready)?.id || ''
}
watch(currency, load)
onMounted(load)
const shown = computed(() => rows.value.filter((r) => filter.value === 'todos' || (filter.value === 'in' ? r.amount > 0 : r.amount < 0)))

async function deposit() {
  error.value = ''
  try {
    await api('/api/deposits', { method: 'POST', body: { ...form, amount: Number(form.amount), currency: currency.value, fileName: fileName.value } })
    form.amount = ''; form.operationNumber = ''
    await load()
  } catch (e: any) { error.value = e.message }
}
async function askWithdraw() {
  error.value = ''
  try {
    modal.value = await api('/api/withdrawals', { method: 'POST', body: { amount: Number(draw.amount), currency: currency.value, payoutAccountId: draw.accountId } })
  } catch (e: any) { error.value = e.message }
}
async function confirm() {
  error.value = ''
  try {
    await api(`/api/withdrawals/${modal.value.id}/confirm`, { method: 'POST', body: { code: code.value } })
    modal.value = null
    code.value = ''
    draw.amount = ''
    await load()
  } catch (e: any) { error.value = e.message }
}
function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  fileName.value = f?.name || ''
}
</script>
<template>
  <Shell v-if="w" active="wallet" :crumbs="['Inversionista', 'Wallet']">
    <div class="page-head">
      <div><h1>Wallet</h1><p>Saldos separados por moneda, sin conversión.</p></div>
      <div class="actions">
        <button class="btn secondary" type="button" @click="draw.amount = ''"><Icon name="out" />Retirar</button>
      </div>
    </div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="card kpi"><div class="label">Saldo total</div><div class="value" style="font-size:28px">{{ money(w.total, w.currency) }}</div><div class="foot">Disponible + comprometido + en retiro</div></div>
      <div class="card kpi"><div class="label">Disponible</div><div class="value">{{ money(w.available, w.currency) }}</div><div class="foot">{{ w.pendingSum ? money(w.pendingSum, w.currency) + ' en una solicitud pendiente' : 'Listo para usar' }}</div></div>
      <div class="card kpi"><div class="label">Comprometido</div><div class="value">{{ money(w.committed, w.currency) }}</div><div class="foot">Propiedades en fondeo</div></div>
      <div class="card kpi"><div class="label">En retiro</div><div class="value">{{ money(w.withdrawing, w.currency) }}</div><div class="foot">Por pagar</div></div>
    </div>
    <div class="settled"><Icon name="receipt" /><span>Liquidado</span><b class="num">{{ money(w.settled, w.currency) }}</b><span class="grow">Lo cobrado por ventas. No suma al saldo.</span><span class="mono" style="font-size:11.5px">{{ w.currency }}</span></div>
    <div v-if="w.pendingDeposit" class="alert warn"><Icon name="clock" /><span class="txt"><b>Depósito de {{ money(w.pendingDeposit.amount, w.currency) }} en revisión.</b> Tesorería valida tu constancia ({{ w.pendingDeposit.originBank }} · operación {{ w.pendingDeposit.operationNumber }}). {{ w.pendingDeposit.at }}.</span></div>
    <div class="split" style="display:grid;grid-template-columns:1fr 400px;gap:20px;align-items:start">
      <section class="card" style="overflow:hidden">
        <div class="card-h"><h3>Movimientos</h3><div class="right"><div class="seg"><button type="button" :class="{ on: filter==='todos' }" @click="filter='todos'">Todos</button><button type="button" :class="{ on: filter==='in' }" @click="filter='in'">Entradas</button><button type="button" :class="{ on: filter==='out' }" @click="filter='out'">Salidas</button></div></div></div>
        <table class="t">
          <thead><tr><th>Fecha</th><th>Concepto</th><th>Referencia</th><th class="r">Monto</th></tr></thead>
          <tbody>
            <tr v-for="r in shown" :key="r.id"><td class="muted">{{ r.at }}</td><td class="strong">{{ r.concept }}</td><td class="mono muted" style="font-size:12px">{{ r.reference }}</td><td class="r num" :class="r.amount >= 0 ? 'up' : 'ink'">{{ r.amount >= 0 ? '+' : '' }}{{ money(r.amount, w.currency, true) }}</td></tr>
            <tr v-if="!shown.length"><td colspan="4" class="muted">Sin movimientos en esta moneda.</td></tr>
          </tbody>
        </table>
      </section>
      <div style="display:flex;flex-direction:column;gap:16px">
        <aside class="card">
          <div class="card-h"><h3>Cargar saldo</h3><span class="sub">1. Transfiere · 2. Registra</span></div>
          <form class="card-b" style="display:flex;flex-direction:column;gap:10px" @submit.prevent="deposit">
            <div style="border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:12px;display:flex;flex-direction:column;gap:3px">
              <div class="row" style="justify-content:space-between"><span class="muted">Banco</span><span class="ink">{{ w.banks.bank }}</span></div>
              <div class="row" style="justify-content:space-between"><span class="muted">Cuenta</span><span class="mono ink">{{ w.banks.account }}</span></div>
              <div class="row" style="justify-content:space-between"><span class="muted">CCI</span><span class="mono ink">{{ w.banks.cci }}</span></div>
              <div class="row" style="justify-content:space-between"><span class="muted">Titular</span><span class="ink">{{ w.banks.holder }} · RUC {{ w.banks.ruc }}</span></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="field"><label>Monto</label><div class="input"><input v-model="form.amount" inputmode="decimal" required /></div></div>
              <div class="field"><label>N.º de operación</label><div class="input"><input v-model="form.operationNumber" required /></div></div>
            </div>
            <div class="field"><label>Banco de origen</label><div class="input"><input v-model="form.originBank" /></div></div>
            <div class="field"><label>Cuenta de origen</label><div class="input"><input v-model="form.originAccount" placeholder="A tu nombre" /></div></div>
            <label class="drop" style="padding:10px;cursor:pointer"><Icon name="upload" /> <b>{{ fileName || 'Sube tu constancia' }}</b><input type="file" accept=".pdf,.png,.jpg,.jpeg" style="display:none" @change="onFile" /></label>
            <p v-if="error && !modal" class="err">{{ error }}</p>
            <button class="btn primary block">Enviar para validación</button>
            <span class="hint">Solo desde cuentas a tu nombre. Un número de operación repetido se marca para tesorería.</span>
          </form>
        </aside>
        <aside class="card">
          <div class="card-h"><h3>Retirar</h3></div>
          <form class="card-b" style="display:flex;flex-direction:column;gap:10px" @submit.prevent="askWithdraw">
            <div class="field"><label>Monto</label><div class="input"><input v-model="draw.amount" inputmode="decimal" required /></div><span class="hint">Disponible: {{ money(w.available, w.currency, true) }}</span></div>
            <div class="field"><label>Cuenta destino</label><div class="input"><select v-model="draw.accountId" required><option value="" disabled>Elige una cuenta</option><option v-for="a in accounts.filter(a => a.currency === currency)" :key="a.id" :value="a.id" :disabled="!a.ready">{{ a.label }}{{ a.ready ? '' : ' · en espera' }}</option></select></div></div>
            <button class="btn secondary block">Pedir código</button>
          </form>
        </aside>
      </div>
    </div>
    <div v-if="modal" class="overlay" @click.self="modal = null">
      <form class="modal" @submit.prevent="confirm">
        <div class="card-h"><h3>Confirma con el código</h3><button class="naked muted" type="button" @click="modal = null"><Icon name="x" /></button></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
          <p class="muted" style="margin:0">En local el código es <b class="mono ink">{{ modal.devCode }}</b>. En producción llega a tu correo.</p>
          <dl class="dl"><dt>Retiro</dt><dd>{{ money(Number(draw.amount), currency, true) }}</dd><dt>Destino</dt><dd>{{ modal.account }}</dd></dl>
          <div class="field"><label>Código de 6 dígitos</label><div class="input focus"><input v-model="code" maxlength="6" inputmode="numeric" required /></div></div>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn primary block">Confirmar retiro</button>
        </div>
      </form>
    </div>
  </Shell>
</template>
