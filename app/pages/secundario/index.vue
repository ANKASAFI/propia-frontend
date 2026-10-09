<script setup lang="ts">
const route = useRoute()
const data = ref<any>(null)
const positions = ref<any[]>([])
const error = ref('')
const sell = reactive({ propertyId: '', units: 1, price: '' })
const { me } = useSession()
const locked = computed(() => me.value?.user?.investorStatus !== 'enabled')
async function load() { data.value = await api('/api/secondary') }
onMounted(async () => {
  await load()
  try {
    const portfolio = await api<any>('/api/portfolio')
    positions.value = portfolio.positions.filter((p: any) => p.canSell || p.commitmentStatus === 'owned')
  } catch { positions.value = [] }
  if (route.query.vender) sell.propertyId = String(route.query.vender)
  else if (positions.value[0]) sell.propertyId = positions.value[0].propertyId
})
const mine = computed(() => data.value?.offers.find((o: any) => o.mine && !['cancelled', 'completed'].includes(o.status)))
const list = computed(() => data.value?.offers.filter((o: any) => o.status !== 'cancelled') || [])
async function act(path: string) {
  error.value = ''
  try { await api(path, { method: 'POST' }); await load() } catch (e: any) { error.value = e.message }
}
async function create() {
  error.value = ''
  try {
    await api('/api/secondary', { method: 'POST', body: { propertyId: sell.propertyId, units: Number(sell.units), price: Number(sell.price) } })
    sell.price = ''
    await load()
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <Shell v-if="data" active="secundario" :crumbs="['Inversionista', 'Mercado secundario']" :locked="locked">
    <div class="page-head">
      <div><h1>Mercado secundario</h1><p>Cuotas que otros copropietarios ponen a la venta. El precio lo fija el vendedor.</p></div>
    </div>
    <div class="alert info"><Icon name="info" /><span class="txt">Durante los primeros <b>7 días</b> solo pueden comprar los copropietarios del mismo inmueble. Después, la oferta se abre a toda la comunidad y queda sujeta a <b>30 días de retracto</b>.</span></div>
    <p v-if="error" class="err">{{ error }}</p>
    <div class="split" style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">
      <section class="card" style="overflow:hidden">
        <div class="card-h"><h3>Ofertas disponibles</h3><span class="sub">{{ list.length }} ofertas</span></div>
        <table class="t">
          <thead><tr><th>Inmueble</th><th class="r">Precio pedido</th><th class="r">vs. referencia</th><th>Estado</th><th /></tr></thead>
          <tbody>
            <tr v-for="o in list" :key="o.id" :class="{ sel: o.mine }">
              <td><div class="row"><span class="thumb" :class="o.gradient" style="width:34px;height:34px"><Icon :name="o.icon || 'building'" /></span><div><div class="strong">{{ o.name }}</div><div class="muted" style="font-size:12px">{{ o.city }} · {{ o.units }} unidad{{ o.units > 1 ? 'es' : '' }}</div></div></div></td>
              <td class="r num strong">{{ money(o.price, o.currency) }}</td>
              <td class="r num" :class="o.delta < 0 ? 'up' : 'ink'">{{ o.delta >= 0 ? '+' : '−' }}{{ Math.abs(o.delta * 100).toFixed(1) }}%</td>
              <td><Badge :label="o.statusLabel" :cls="o.statusClass" /></td>
              <td class="r">
                <button v-if="!o.mine && ['open','internal_window'].includes(o.status)" class="btn primary sm" type="button" :disabled="locked" @click="act(`/api/secondary/${o.id}/buy`)">Comprar</button>
                <button v-else-if="!o.mine && o.status === 'retracto'" class="btn secondary sm" type="button" @click="act(`/api/secondary/${o.id}/retracto`)">Retracto</button>
                <button v-else-if="o.mine" class="btn secondary sm" type="button" @click="act(`/api/secondary/${o.id}/cancel`)">Cancelar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <div style="display:flex;flex-direction:column;gap:16px">
        <aside v-if="mine" class="card">
          <div class="card-h"><h3>Mi oferta de venta</h3><span class="right"><Badge :label="mine.statusLabel" :cls="mine.statusClass" /></span></div>
          <div class="card-b">
            <div class="row" style="margin-bottom:14px"><span class="thumb" :class="mine.gradient" style="width:40px;height:40px"><Icon :name="mine.icon || 'building'" /></span><div><b class="ink">{{ mine.name }}</b><div class="muted" style="font-size:12px">{{ mine.units }} unidad · {{ mine.code }}</div></div></div>
            <dl class="dl">
              <dt>Precio de venta</dt><dd>{{ money(mine.price) }}</dd>
              <dt>Comisión PROPIA ({{ data.commissionPct }}%)</dt><dd class="muted">− {{ money(mine.commission) }}</dd>
              <dt><b class="ink">Recibirías (neto)</b></dt><dd style="font-size:15px;font-weight:600">{{ money(mine.net) }}</dd>
            </dl>
            <div class="divider" />
            <div class="timeline">
              <div class="tl done"><span class="d"><Icon name="check" /></span><div><b>Publicada</b><span>{{ mine.createdAt }}</span></div></div>
              <div class="tl" :class="{ done: mine.status !== 'internal_window', cur: mine.status === 'internal_window' }"><span class="d"><Icon v-if="mine.status !== 'internal_window'" name="check" /></span><div><b>Ventana interna</b><span>{{ mine.windowEnds || '7 días' }}</span></div></div>
              <div class="tl" :class="{ cur: ['buyer_found','retracto'].includes(mine.status), done: ['notary','completed'].includes(mine.status) }"><span class="d" /><div><b>{{ mine.buyer ? 'Comprador: ' + mine.buyer : 'Comprador' }}</b><span>{{ mine.retractoEnds ? 'Retracto hasta ' + mine.retractoEnds : 'Pendiente' }}</span></div></div>
            </div>
            <button class="btn danger block" type="button" style="margin-top:12px" @click="act(`/api/secondary/${mine.id}/cancel`)">Cancelar oferta</button>
          </div>
        </aside>
        <aside class="card">
          <div class="card-h"><h3>Vender una cuota</h3></div>
          <form class="card-b" style="display:flex;flex-direction:column;gap:10px" @submit.prevent="create">
            <div class="field"><label>Propiedad</label><div class="input"><select v-model="sell.propertyId" required><option v-for="p in positions" :key="p.propertyId" :value="p.propertyId">{{ p.name }} · {{ p.units }} unidades</option></select></div></div>
            <div style="display:grid;grid-template-columns:90px 1fr;gap:10px">
              <div class="field"><label>Unidades</label><div class="input"><input v-model.number="sell.units" type="number" min="1" /></div></div>
              <div class="field"><label>Precio total</label><div class="input"><input v-model="sell.price" inputmode="decimal" required /></div></div>
            </div>
            <button class="btn primary block" :disabled="locked">Publicar oferta</button>
            <span class="hint">Solo si la cuota está inscrita y el inmueble no está en votación.</span>
          </form>
        </aside>
      </div>
    </div>
  </Shell>
</template>
