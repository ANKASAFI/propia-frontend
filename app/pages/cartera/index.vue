<script setup lang="ts">
const data = ref<any>(null)
const { currency } = useSession()
const months = ['nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct']
async function load() { data.value = await api(`/api/portfolio?currency=${currency.value}`) }
onMounted(load)
watch(currency, load)
const maxBar = 600
</script>
<template>
  <Shell v-if="data" active="cartera" :crumbs="['Inversionista', 'Mi cartera']">
    <div class="page-head">
      <div><h1>Mi cartera</h1><p>Puedes vender tu cuota cuando ya está inscrita. El inmueble sigue en copropiedad.</p></div>
    </div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
      <div class="card kpi"><div class="label">Invertido</div><div class="value">{{ money(data.invested, currency) }}</div><div class="foot">{{ data.countProps }} inmuebles · {{ data.countUnits }} unidades</div></div>
      <div class="card kpi"><div class="label">Valorización estimada</div><div class="value">{{ money(data.valuation, currency) }}</div><div class="foot"><span class="up"><Icon name="trend" /> {{ data.invested ? ((data.valuation - data.invested) / data.invested * 100).toFixed(1) : 0 }}%</span> desde la compra</div></div>
      <div class="card kpi"><div class="label">Renta acumulada</div><div class="value">{{ money(data.rentAccumulated, currency) }}</div><div class="foot">Neto de gastos</div></div>
      <div class="card kpi"><div class="label">Próximo pago</div><div class="value">{{ data.next ? money(data.next.amount, currency) : '—' }}</div><div class="foot">{{ data.next ? data.next.when + ' · ' + data.next.name : 'Sin renta prevista' }}</div></div>
    </div>
    <section class="card" style="overflow:hidden">
      <div class="card-h"><h3>Posiciones</h3></div>
      <table class="t">
        <thead><tr><th>Inmueble</th><th>Estado</th><th class="r">Unidades</th><th class="r">Invertido</th><th class="r">Valorización</th><th class="r">Renta / mes</th><th class="r">Rentab.</th><th /></tr></thead>
        <tbody>
          <tr v-if="!data.positions.length"><td colspan="8" class="muted" style="padding:28px">No tienes cuotas en {{ currency === 'PEN' ? 'soles' : 'dólares' }}.</td></tr>
          <tr v-for="p in data.positions" :key="p.id">
            <td><div class="row"><span class="thumb" :class="p.gradient" style="width:34px;height:34px"><Icon :name="p.icon" /></span><div><div class="strong">{{ p.name }}</div><div class="muted" style="font-size:12px">{{ p.city }}</div></div></div></td>
            <td><Badge :label="p.statusLabel" :cls="p.statusClass" /></td>
            <td class="r num">{{ p.units }}</td>
            <td class="r num strong">{{ money(p.amount, p.currency) }}</td>
            <td class="r num" :class="{ muted: !p.valuation }">{{ p.valuation ? money(p.valuation, p.currency) : '—' }}</td>
            <td class="r num" :class="p.monthly ? 'up' : 'muted'">{{ p.monthly ? money(p.monthly, p.currency) : '—' }}</td>
            <td class="r num" :class="p.commitmentStatus === 'owned' ? 'up' : 'muted'">{{ p.yieldPct }}%</td>
            <td class="r">
              <NuxtLink v-if="p.canSell" :to="`/secundario?vender=${p.propertyId}`" class="btn secondary sm">Vender</NuxtLink>
              <NuxtLink v-else-if="p.commitmentStatus === 'pending_approval'" :to="`/explorar/${p.propertyId}`" class="btn danger sm">Cancelar</NuxtLink>
              <span v-else class="btn secondary sm" style="opacity:.45">Vender</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="card">
      <div class="card-h"><h3>Renta recibida</h3><span class="sub">Últimos 12 meses · neto de gastos</span></div>
      <div class="card-b">
        <svg viewBox="0 0 640 148" width="100%" height="148" role="img" aria-label="Renta mensual">
          <line v-for="k in 4" :key="'l'+k" x1="36" x2="640" :y1="8 + (k - 1) * 36" :y2="8 + (k - 1) * 36" stroke="var(--line)" />
          <rect v-for="(v, k) in data.bars" :key="k" :x="48 + k * 49" :y="128 - v / maxBar * 112" width="30" :height="v / maxBar * 112" rx="4" :fill="k === 11 ? 'var(--teal-solid)' : 'color-mix(in srgb, var(--teal-solid) 45%, transparent)'" />
          <text v-for="(m, k) in months" :key="m" :x="63 + k * 49" y="144" text-anchor="middle" fill="var(--subtle)" font-size="11" font-family="Inter">{{ m }}</text>
        </svg>
      </div>
    </section>
  </Shell>
</template>
