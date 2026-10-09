<script setup lang="ts">
const route = useRoute()
const p = ref<any>(null)
const tab = ref('resumen')
const units = ref(1)
const modal = ref(false)
const accept = ref(false)
const error = ref('')
const { me } = useSession()
const locked = computed(() => me.value?.user?.investorStatus !== 'enabled')
async function load() { p.value = await api(`/api/properties/${route.params.id}`) }
onMounted(load)
const tiles = computed(() => Array.from({ length: p.value?.unitsTotal || 0 }, (_, i) => i < (p.value?.mine || 0) ? 'me' : i < (p.value?.filled || 0) ? 'on' : ''))
async function send() {
  error.value = ''
  try {
    await api(`/api/properties/${p.value.id}/commitments`, { method: 'POST', body: { units: units.value } })
    modal.value = false
    accept.value = false
    await load()
  } catch (e: any) { error.value = e.message }
}
async function cancel() {
  await api(`/api/commitments/${p.value.pending.id}/cancel`, { method: 'POST' })
  await load()
}
</script>
<template>
  <Shell v-if="p" active="explorar" :crumbs="['Explorar', p.name]" :locked="locked">
    <div class="page-head">
      <div>
        <div class="row" style="gap:10px;flex-wrap:wrap"><h1>{{ p.name }}</h1><Badge :label="p.statusLabel" :cls="p.statusClass" /><span class="badge b-gray plain"><Icon name="pin" />{{ p.city }}</span></div>
        <p>{{ p.kind }} en {{ p.city.split(',')[0] }}<span v-if="p.occupancy">, con ocupación del {{ p.occupancy }}</span>.</p>
      </div>
    </div>
    <div class="split" style="display:grid;grid-template-columns:1fr 380px;gap:20px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
        <div class="kpis card" style="grid-template-columns:repeat(5,1fr);gap:0">
          <div v-for="(k, i) in [['Valor total', p.priceLabel], ['Precio por unidad', p.unitLabel], ['Renta anual est.', p.yieldPct + '%'], ['Gastos mensuales', money(p.monthlyExpenses, p.currency)], ['Valorización', p.valuationPct ? '+' + p.valuationPct + '% / año' : '—']]" :key="k[0]" class="kpi" :style="i ? 'border-left:1px solid var(--line);padding:14px 12px' : 'padding:14px 12px'">
            <div class="label">{{ k[0] }}</div><div class="value" style="font-size:16px">{{ k[1] }}</div>
          </div>
        </div>
        <section class="card">
          <div class="card-h"><h3>Unidades</h3><span class="sub">Cada cuadro es una cuota ideal</span>
            <div class="right" style="gap:14px;font-size:12px">
              <span class="row" style="gap:6px"><i style="width:10px;height:10px;border-radius:3px;background:var(--blue)" />Tuyas</span>
              <span class="row" style="gap:6px"><i style="width:10px;height:10px;border-radius:3px;background:var(--teal-solid)" />Comprometidas</span>
              <span class="row" style="gap:6px"><i style="width:10px;height:10px;border-radius:3px;background:var(--tile-empty)" />Disponibles</span>
            </div>
          </div>
          <div class="card-b">
            <div class="tiles" :style="{ gridTemplateColumns: `repeat(${Math.min(p.unitsTotal, 20)},1fr)` }"><i v-for="(c, i) in tiles" :key="i" :class="c" /></div>
            <div class="row" style="justify-content:space-between;margin-top:12px"><span class="muted num">{{ p.filled }} de {{ p.unitsTotal }} unidades comprometidas · {{ p.investors }} inversionistas</span><span class="ink num" style="font-weight:600">{{ Math.round(p.filled / p.unitsTotal * 100) }}%</span></div>
          </div>
        </section>
        <section class="card">
          <div class="card-h"><div class="seg"><button type="button" :class="{ on: tab==='resumen' }" @click="tab='resumen'">Resumen</button><button type="button" :class="{ on: tab==='gastos' }" @click="tab='gastos'">Gastos y riesgos</button><button type="button" :class="{ on: tab==='docs' }" @click="tab='docs'">Documentos</button></div></div>
          <div v-if="tab==='resumen'" class="card-b" style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
            <dl class="dl"><dt>Tipo</dt><dd>{{ p.kind }}</dd><dt>Ocupación</dt><dd>{{ p.occupancy || '—' }}</dd><dt>Contrato vigente</dt><dd>{{ p.contractUntil || '—' }}</dd><dt>Administración</dt><dd>PROPIA SAC</dd></dl>
            <dl class="dl"><dt>Gastos</dt><dd>Mantenimiento, arbitrios, seguro</dd><dt>Cierre de fondeo</dt><dd>{{ p.closeLabel }}</dd><dt>Notaría</dt><dd>{{ p.notary || '—' }}</dd><dt>Renta neta / mes</dt><dd>{{ money(p.netRent, p.currency) }}</dd></dl>
          </div>
          <div v-else-if="tab==='gastos'" class="card-b muted">La renta puede bajar si hay vacancia o suben los gastos. El valor de reventa no está garantizado. Vender una cuota en el secundario puede tomar más de un mes.</div>
          <div v-else class="card-b muted">La ficha técnica, el contrato de arrendamiento y la partida se publican aquí cuando Operaciones los carga.</div>
        </section>
      </div>
      <aside v-if="p.pending" class="card">
        <div class="card-h"><h3>Tu solicitud</h3><span class="right"><Badge label="Solicitud pendiente" cls="b-amber" icon="clock" /></span></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
          <dl class="dl"><dt>Unidades</dt><dd>{{ p.pending.units }}</dd><dt>Monto</dt><dd>{{ p.pending.label }}</dd><dt>Enviada</dt><dd>{{ p.pending.at }} · {{ p.pending.code }}</dd></dl>
          <div class="timeline">
            <div class="tl done"><span class="d"><Icon name="check" /></span><div><b>Solicitud enviada</b><span>Tu saldo sigue disponible</span></div></div>
            <div class="tl cur"><span class="d" /><div><b>Revisión del administrador</b><span>Normalmente el mismo día hábil</span></div></div>
            <div class="tl"><span class="d" /><div><b>Compromiso aprobado</b><span>Se bloquean el monto y la unidad</span></div></div>
          </div>
          <div class="alert warn"><Icon name="alert" /><span class="txt" style="font-size:12px">Si retiras o usas este saldo en otra propiedad antes de la aprobación, la solicitud puede no aprobarse.</span></div>
          <button class="btn danger block" type="button" @click="cancel">Cancelar solicitud</button>
        </div>
      </aside>
      <aside v-else-if="p.status === 'funding'" class="card">
        <div class="card-h"><h3>Comprometer unidades</h3><span class="right badge b-amber plain"><Icon name="clock" />{{ p.leftLabel }}</span></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Unidades</label>
            <div class="stepper"><button type="button" @click="units = Math.max(1, units - 1)">−</button><span class="num">{{ units }}</span><button type="button" @click="units = Math.min(p.unitsTotal - p.filled, units + 1)">+</button></div>
          </div>
          <dl class="dl"><dt>Monto</dt><dd>{{ money(units * p.unitPrice, p.currency, true) }}</dd><dt>Tras la aprobación</dt><dd>Saldo bloqueado</dd></dl>
          <button class="btn primary block" type="button" :disabled="locked" @click="modal = true">Solicitar compromiso</button>
          <span v-if="locked" class="hint">Habilita tu cuenta para invertir. Mientras, puedes explorar.</span>
        </div>
      </aside>
      <aside v-else class="card"><div class="card-b muted">Esta propiedad no está recibiendo compromisos nuevos. Si ya eres copropietario, la ves en Mi cartera.</div></aside>
    </div>
    <div v-if="modal" class="overlay" @click.self="modal = false">
      <div class="modal">
        <div class="card-h"><h3>Solicitar compromiso</h3><button class="naked muted" type="button" @click="modal = false"><Icon name="x" /></button></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:12px">
          <div class="row"><span class="thumb" :class="p.gradient" style="width:36px;height:36px"><Icon :name="p.icon" /></span><div class="grow"><b class="ink">{{ p.name }}</b><div class="muted" style="font-size:12px">{{ units }} unidad{{ units > 1 ? 'es' : '' }}</div></div></div>
          <dl class="dl"><dt>Monto solicitado</dt><dd>{{ money(units * p.unitPrice, p.currency, true) }}</dd></dl>
          <label class="check"><input v-model="accept" type="checkbox" /><span>Entiendo que un administrador aprueba esta solicitud. Hasta entonces mi saldo sigue disponible y las unidades no se reservan.</span></label>
          <p v-if="error" class="err">{{ error }}</p>
          <button class="btn block" :class="accept ? 'primary' : 'is-off'" :disabled="!accept" type="button" @click="send">Enviar solicitud</button>
        </div>
      </div>
    </div>
  </Shell>
</template>
