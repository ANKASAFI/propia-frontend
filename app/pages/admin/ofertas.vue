<script setup lang="ts">
const data = ref<any>(null)
async function load() { data.value = await api('/api/secondary') }
onMounted(load)
async function advance(id: string) { await api(`/api/admin/offers/${id}/advance`, { method: 'POST' }); await load() }
</script>
<template>
  <Shell v-if="data" active="ofertas" :crumbs="['Operaciones', 'Ofertas secundarias']" :show-currency="false">
    <div class="page-head"><div><h1>Ofertas secundarias</h1><p>Avanza la ventana, el retracto y la notaría. Al completar se transfiere la cuota y se liquida al vendedor.</p></div></div>
    <section class="card" style="overflow:hidden"><table class="t">
      <thead><tr><th>Inmueble</th><th>Vendedor</th><th class="r">Precio</th><th>Estado</th><th /></tr></thead>
      <tbody>
        <tr v-for="o in data.offers" :key="o.id">
          <td><div class="strong">{{ o.name }}</div><div class="muted" style="font-size:12px">{{ o.units }} unidad{{ o.units>1?'es':'' }} · {{ o.code }}</div></td>
          <td>{{ o.seller }}</td>
          <td class="r num">{{ money(o.price, o.currency) }}</td>
          <td><Badge :label="o.statusLabel" :cls="o.statusClass" /></td>
          <td class="r"><button v-if="['internal_window','buyer_found','retracto','notary'].includes(o.status)" class="btn primary sm" type="button" @click="advance(o.id)">Avanzar</button></td>
        </tr>
      </tbody>
    </table></section>
  </Shell>
</template>
