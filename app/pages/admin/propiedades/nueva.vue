<script setup lang="ts">
const form = reactive({ name: '', city: '', kind: 'Residencial', currency: 'USD', price: '', unitsTotal: 20, yieldPct: '', closeDate: '', monthlyRent: '', monthlyExpenses: '', notary: 'Notaría Paino · Lima', status: 'draft' })
const error = ref('')
async function save() {
  error.value = ''
  try {
    const price = Number(form.price)
    const unitsTotal = Number(form.unitsTotal)
    const row = await api<any>('/api/admin/properties', { method: 'POST', body: { ...form, price, unitsTotal, unitPrice: price / unitsTotal, yieldPct: Number(form.yieldPct), monthlyRent: Number(form.monthlyRent || 0), monthlyExpenses: Number(form.monthlyExpenses || 0) } })
    await navigateTo(`/admin/propiedades/${row.id}`)
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <Shell active="propiedades" :crumbs="['Operaciones', 'Nueva propiedad']" :show-currency="false">
    <div class="page-head"><div><h1>Nueva propiedad</h1><p>Queda en borrador hasta que la pases a fondeo.</p></div></div>
    <form class="card" style="max-width:760px" @submit.prevent="save">
      <div class="card-b" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Nombre</label><div class="input"><input v-model="form.name" required /></div></div>
        <div class="field"><label>Ciudad</label><div class="input"><input v-model="form.city" required /></div></div>
        <div class="field"><label>Tipo</label><div class="input"><input v-model="form.kind" /></div></div>
        <div class="field"><label>Moneda</label><div class="seg"><button type="button" :class="{ on: form.currency==='USD' }" @click="form.currency='USD'">USD</button><button type="button" :class="{ on: form.currency==='PEN' }" @click="form.currency='PEN'">PEN</button></div></div>
        <div class="field"><label>Valor total</label><div class="input"><input v-model="form.price" required /></div></div>
        <div class="field"><label>Unidades</label><div class="input"><input v-model="form.unitsTotal" type="number" min="1" /></div></div>
        <div class="field"><label>Renta anual estimada %</label><div class="input"><input v-model="form.yieldPct" /></div></div>
        <div class="field"><label>Cierre de fondeo</label><div class="input"><input v-model="form.closeDate" type="date" /></div></div>
        <div class="field"><label>Renta bruta mensual</label><div class="input"><input v-model="form.monthlyRent" /></div></div>
        <div class="field"><label>Gastos mensuales</label><div class="input"><input v-model="form.monthlyExpenses" /></div></div>
        <div class="field" style="grid-column:1/-1"><label>Notaría</label><div class="input"><input v-model="form.notary" /></div></div>
        <p v-if="error" class="err" style="grid-column:1/-1">{{ error }}</p>
        <div style="grid-column:1/-1"><button class="btn primary">Crear borrador</button></div>
      </div>
    </form>
  </Shell>
</template>
