<script setup lang="ts">
const route = useRoute()
const filter = ref('todas')
const props = ref<any[]>([])
const error = ref('')
const { me, currency } = useSession()
const locked = computed(() => me.value?.user?.investorStatus !== 'enabled')
async function load() {
  try { props.value = await api('/api/properties') } catch (e: any) { error.value = e.message }
}
onMounted(load)
const q = computed(() => String(route.query.q || '').toLowerCase())
const inCurrency = computed(() => props.value.filter((p) => (p.currency || 'USD') === currency.value))
const visible = computed(() => inCurrency.value.filter((p) => {
  if (q.value && !`${p.name} ${p.city} ${p.kind}`.toLowerCase().includes(q.value)) return false
  if (filter.value === 'funding') return p.status === 'funding'
  if (filter.value === 'operating') return p.status === 'operating'
  return !['draft', 'cancelled'].includes(p.status)
}))
const cards = computed(() => visible.value.filter((p) => p.status === 'funding').slice(0, 3))
const total = computed(() => visible.value.reduce((s, p) => s + Number(p.price), 0))
</script>
<template>
  <Shell active="explorar" :crumbs="['Inversionista', 'Explorar']" :locked="locked">
    <div class="page-head">
      <div><h1>Explorar propiedades</h1><p>{{ currency === 'PEN' ? 'Inmuebles en soles. PROPIA no convierte: cada inmueble está en una sola moneda.' : 'Inmuebles en dólares. Cada unidad es una cuota ideal inscrita en SUNARP.' }}</p></div>
      <div class="actions">
        <div class="seg">
          <button type="button" :class="{ on: filter === 'todas' }" @click="filter = 'todas'">Todas</button>
          <button type="button" :class="{ on: filter === 'funding' }" @click="filter = 'funding'">En fondeo</button>
          <button type="button" :class="{ on: filter === 'operating' }" @click="filter = 'operating'">En operación</button>
        </div>
      </div>
    </div>
    <div v-if="error" class="alert bad"><Icon name="alert" /><span class="txt">{{ error }}</span></div>
    <div v-if="!props.length && !error" class="kpis" style="grid-template-columns:repeat(3,1fr)"><div v-for="n in 3" :key="n" class="card" style="height:220px" /></div>
    <div v-if="props.length && !visible.length" class="alert info"><Icon name="info" /><span class="txt">No hay inmuebles en {{ currency === 'PEN' ? 'soles' : 'dólares' }} con este filtro. Cambia la moneda arriba para ver el otro catálogo.</span></div>
    <div class="split" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <NuxtLink v-for="p in cards" :key="p.id" :to="`/explorar/${p.id}`" class="card" style="overflow:hidden;text-decoration:none;color:inherit">
        <div class="thumb" :class="p.gradient" style="height:120px;border-radius:0">
          <Icon :name="p.icon" />
          <span class="badge" :class="p.statusClass" style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);color:#0A2148">{{ p.statusLabel }}</span>
          <span class="mono" style="position:absolute;bottom:10px;right:12px;font-size:11px;color:rgba(255,255,255,.85)">{{ p.status === 'operating' ? 'En operación' : `Cierra ${p.closeLabel}` }}</span>
        </div>
        <div class="card-b">
          <div class="row"><b class="ink" style="font-size:15px">{{ p.name }}</b><span class="spacer grow" /><span class="up num">{{ p.yieldPct }}%</span></div>
          <div class="row muted" style="gap:6px;margin-top:2px;font-size:12.5px"><Icon name="pin" />{{ p.city }} · {{ p.kind }}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:14px 0">
            <div><div class="muted" style="font-size:11.5px">Valor total</div><div class="ink num" style="font-weight:600">{{ p.priceLabel }}</div></div>
            <div><div class="muted" style="font-size:11.5px">Por unidad</div><div class="ink num" style="font-weight:600">{{ p.unitLabel }}</div></div>
            <div><div class="muted" style="font-size:11.5px">Inversionistas</div><div class="ink num" style="font-weight:600">{{ p.investors }}</div></div>
          </div>
          <div class="progress"><i :style="{ width: (p.filled / p.unitsTotal * 100) + '%' }" /></div>
          <div class="row" style="justify-content:space-between;margin-top:8px;font-size:12px"><span class="muted num">{{ p.filled }} de {{ p.unitsTotal }} unidades</span><span class="ink num" style="font-weight:600">{{ Math.round(p.filled / p.unitsTotal * 100) }}%</span></div>
        </div>
      </NuxtLink>
    </div>
    <section class="card" style="overflow:hidden">
      <div class="card-h"><h3>Todas las propiedades</h3><span class="sub">{{ visible.length }} inmuebles · {{ money(total, currency) }} en valor</span></div>
      <table class="t">
        <thead><tr><th>Inmueble</th><th>Estado</th><th class="r">Valor</th><th class="r">Por unidad</th><th>Fondeo</th><th class="r">Renta anual est.</th><th>Cierre</th><th /></tr></thead>
        <tbody>
          <tr v-for="p in visible" :key="p.id">
            <td><div class="row"><span class="thumb" :class="p.gradient" style="width:34px;height:34px"><Icon :name="p.icon" /></span><div><div class="strong">{{ p.name }}</div><div class="muted" style="font-size:12px">{{ p.city }}</div></div></div></td>
            <td><Badge :label="p.statusLabel" :cls="p.statusClass" /></td>
            <td class="r num strong">{{ p.priceLabel }}</td>
            <td class="r num">{{ p.unitLabel }}</td>
            <td style="width:180px"><div class="row"><div class="progress grow"><i :style="{ width: (p.filled / p.unitsTotal * 100) + '%' }" /></div><span class="num muted" style="font-size:12px;width:46px;text-align:right">{{ p.filled }}/{{ p.unitsTotal }}</span></div></td>
            <td class="r num up">{{ p.yieldPct }}%</td>
            <td class="muted">{{ p.closeLabel }}</td>
            <td class="r"><NuxtLink :to="`/explorar/${p.id}`" class="btn secondary sm">Ver</NuxtLink></td>
          </tr>
        </tbody>
      </table>
    </section>
  </Shell>
</template>
