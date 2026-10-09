<script setup lang="ts">
const props = ref<any[]>([])
onMounted(async () => { props.value = await api('/api/properties') })
const cols = [
  ['draft', 'Borrador', 'b-gray'],
  ['funding', 'En fondeo', 'b-blue'],
  ['funded', 'Fondeada', 'b-teal'],
  ['notary', 'En notaría', 'b-amber'],
  ['operating', 'En operación', 'b-teal'],
  ['sale', 'Venta total', 'b-blue'],
  ['cancelled', 'Cancelada', 'b-red'],
]
function inCol(p: any, key: string) {
  if (key === 'sale') return ['sale_vote', 'selling', 'sold'].includes(p.status)
  if (key === 'notary') return ['notary', 'registered'].includes(p.status)
  return p.status === key
}
const vote = computed(() => props.value.find((p) => p.status === 'sale_vote'))
const value = computed(() => props.value.filter((p) => !['draft', 'cancelled'].includes(p.status)).reduce((s, p) => s + Number(p.price), 0))
</script>
<template>
  <Shell active="propiedades" :crumbs="['Operaciones', 'Propiedades']" :show-currency="false">
    <div class="page-head">
      <div><h1>Propiedades</h1><p>Del alta al reparto de renta. Notaría y SUNARP se avanzan aquí.</p></div>
      <div class="actions"><NuxtLink to="/admin/propiedades/nueva" class="btn primary"><Icon name="plus" />Nueva propiedad</NuxtLink></div>
    </div>
    <div v-if="vote" class="card" style="padding:12px 16px;display:flex;align-items:center;gap:16px">
      <Badge label="En votación" cls="b-amber" icon="users" />
      <div class="grow"><b class="ink">{{ vote.name }} · venta total</b><div class="progress" style="margin-top:8px"><i :style="{ width: (vote.voteYes / vote.unitsTotal * 100) + '%' }" /></div></div>
      <span class="num ink" style="font-weight:600">{{ money(vote.salePrice) }}</span>
    </div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="card kpi"><div class="label">Valor bajo administración</div><div class="value">{{ money(value) }}</div><div class="foot">{{ props.length }} inmuebles</div></div>
      <div class="card kpi"><div class="label">En fondeo</div><div class="value">{{ props.filter(p => p.status==='funding').length }}</div></div>
      <div class="card kpi"><div class="label">En operación</div><div class="value">{{ props.filter(p => p.status==='operating').length }}</div></div>
    </div>
    <div class="kanban" style="grid-template-columns:repeat(7,minmax(160px,1fr));overflow:auto">
      <div v-for="c in cols" :key="c[0]" class="col">
        <div class="col-h"><span class="badge" :class="c[2]">{{ c[1] }}</span><span class="c">{{ props.filter(p => inCol(p, c[0])).length }}</span></div>
        <NuxtLink v-for="p in props.filter(x => inCol(x, c[0]))" :key="p.id" :to="`/admin/propiedades/${p.id}`" class="kcard" style="text-decoration:none;color:inherit">
          <div><b>{{ p.name }}</b><div class="muted" style="font-size:12px">{{ p.city }}</div></div>
          <div class="progress"><i :style="{ width: (p.filled / p.unitsTotal * 100) + '%' }" /></div>
          <div class="meta"><span class="num">{{ p.filled }}/{{ p.unitsTotal }}</span><span class="num ink" style="font-weight:600">{{ p.priceLabel }}</span></div>
          <div class="muted" style="font-size:11.5px">{{ p.note || p.closeLabel }}</div>
        </NuxtLink>
      </div>
    </div>
  </Shell>
</template>
