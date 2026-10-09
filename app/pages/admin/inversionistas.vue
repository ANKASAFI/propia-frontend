<script setup lang="ts">
const rows = ref<any[]>([])
const q = ref('')
onMounted(async () => { rows.value = await api('/api/admin/investors') })
const shown = computed(() => rows.value.filter((r) => `${r.name} ${r.email} ${r.documentNumber || ''}`.toLowerCase().includes(q.value.toLowerCase())))
</script>
<template>
  <Shell active="inversionistas" :crumbs="['Operaciones', 'Inversionistas']" :show-currency="false">
    <div class="page-head"><div><h1>Inversionistas</h1><p>{{ rows.length }} personas con cuenta.</p></div>
      <div class="actions"><div class="search" style="width:260px"><Icon name="search" /><input v-model="q" placeholder="Buscar…" /></div></div>
    </div>
    <section class="card" style="overflow:hidden"><table class="t">
      <thead><tr><th>Persona</th><th>Documento</th><th>Estado</th><th>Cuenta</th></tr></thead>
      <tbody>
        <tr v-for="r in shown" :key="r.id">
          <td><div class="strong">{{ r.name }}</div><div class="muted" style="font-size:12px">{{ r.email }}</div></td>
          <td class="mono muted">{{ r.documentType }} {{ r.documentNumber }}</td>
          <td><Badge :label="r.investorLabel" :cls="r.investorClass" /></td>
          <td class="muted">{{ r.userStatus }}</td>
        </tr>
      </tbody>
    </table></section>
  </Shell>
</template>
