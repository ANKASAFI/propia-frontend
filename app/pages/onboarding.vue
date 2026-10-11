<script setup lang="ts">
const { me, refresh } = useSession()
const user = computed(() => me.value?.user)
const step = ref(0)
const error = ref('')
const form = reactive<any>({})
watch(user, (u) => {
  if (!u) return
  Object.assign(form, u)
  step.value = u.investorStatus === 'signing' ? 3 : u.investorStatus === 'review' || u.investorStatus === 'observed' || u.investorStatus === 'rejected' ? 4 : Math.min(u.onboardingStep || 0, 2)
}, { immediate: true })

const steps = [
  ['Perfil', 'Datos y documento'],
  ['Estado civil', 'Régimen patrimonial'],
  ['Origen de fondos', 'Declaración'],
  ['Poder y declaración', 'Dos firmas, un documento'],
]
async function save(next: number) {
  error.value = ''
  try {
    const saved = await api('/api/profile', { method: 'POST', body: { ...form, step: next } })
    me.value = { ...me.value, user: saved }
    step.value = next >= 3 ? 3 : next
  } catch (e: any) { error.value = e.message }
}
async function sign() {
  error.value = ''
  try {
    const res = await api<any>('/api/signature', { method: 'POST' })
    await navigateTo(`/firmar/${res.signToken}`)
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <Shell v-if="user" active="perfil" :crumbs="['Inversionista', 'Habilitación de cuenta']" :show-currency="false" locked>
    <div v-if="user.investorStatus === 'signing' && user.holderSigned && user.needsSpouse && !user.spouseSigned" class="alert warn">
      <Icon name="pen" />
      <span class="txt"><b>Falta la firma de tu cónyuge.</b> El documento quedó listo para <span class="mono">{{ user.spouseEmail }}</span>.</span>
      <NuxtLink v-if="user.spouseToken" :to="`/firmar/${user.spouseToken}`" class="act btn secondary sm">Firmar como cónyuge (local)</NuxtLink>
    </div>
    <div v-if="user.investorStatus === 'review'" class="alert info"><Icon name="shield" /><span class="txt"><b>Estamos revisando tu perfil.</b> Cumplimiento lo ve, normalmente en 1 o 2 días hábiles. Puedes explorar mientras tanto.</span><NuxtLink to="/explorar" class="act btn secondary sm">Explorar</NuxtLink></div>
    <div v-if="user.investorStatus === 'observed'" class="alert warn"><Icon name="alert" /><span class="txt"><b>Necesitamos un documento.</b> {{ user.plaftAsk }}</span></div>
    <div v-if="user.investorStatus === 'rejected'" class="alert bad"><Icon name="x" /><span class="txt"><b>No pudimos habilitarte.</b> {{ user.plaftNote }} Tu cuenta sigue activa para ver propiedades.</span></div>
    <div class="card card-b">
      <div class="steps">
        <div v-for="(s, i) in steps" :key="s[0]" class="step" :class="{ done: i < step || (i === 3 && user.holderSigned), cur: i === step && !(i === 3 && user.holderSigned) }" :style="i === 3 ? 'flex:none' : ''">
          <span class="n"><Icon v-if="i < step || (i === 3 && user.holderSigned)" name="check" /><template v-else>{{ i + 1 }}</template></span>
          <div><div class="lbl">{{ s[0] }}</div><div class="s">{{ s[1] }}</div></div>
          <span v-if="i < 3" class="bar" />
        </div>
      </div>
    </div>
    <p v-if="error" class="err">{{ error }}</p>
    <form v-if="step === 0" class="split" style="display:grid;grid-template-columns:1fr 320px;gap:20px" @submit.prevent="save(1)">
      <section class="card"><div class="card-b" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="field"><label>Nombres</label><div class="input"><input v-model="form.firstName" required /></div></div>
        <div class="field"><label>Apellidos</label><div class="input"><input v-model="form.lastName" required /></div></div>
        <div class="field"><label>Tipo de documento</label><div class="input"><select v-model="form.documentType"><option>DNI</option><option>CE</option><option>Pasaporte</option></select></div></div>
        <div class="field"><label>Número</label><div class="input"><input v-model="form.documentNumber" required /></div></div>
        <div class="field"><label>Fecha de nacimiento</label><div class="input"><input v-model="form.birthDate" type="date" required /></div><span class="hint">Debes ser mayor de 18 años.</span></div>
        <div class="field"><label>Celular</label><div class="input"><input v-model="form.phone" /></div></div>
        <div class="field"><label>Dirección</label><div class="input"><input v-model="form.address" /></div></div>
        <div class="field"><label>Distrito</label><div class="input"><input v-model="form.district" /></div></div>
        <div class="field"><label>¿Vives en el Perú?</label><div class="seg"><button type="button" :class="{ on: form.isDomiciled }" @click="form.isDomiciled = true">Sí, soy domiciliado</button><button type="button" :class="{ on: form.isDomiciled === false }" @click="form.isDomiciled = false">No</button></div></div>
        <div class="field"><label>Nacionalidad</label><div class="input"><input v-model="form.nationality" /></div></div>
        <div class="row" style="grid-column:1/-1;justify-content:flex-end"><button class="btn primary">Continuar</button></div>
      </div></section>
      <aside class="card"><div class="card-b"><b class="ink">Por qué pedimos esto</b><p class="muted">Tu nombre y documento van en el poder y en la partida registral.</p></div></aside>
    </form>
    <form v-else-if="step === 1" class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:20px" @submit.prevent="save(2)">
      <section class="card"><div class="card-h"><h3>Tu estado civil</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:8px">
        <label v-for="o in [['soltero','Soltero o soltera'],['casado','Casado o casada'],['conviviente','Conviviente']]" :key="o[0]" class="check"><input v-model="form.maritalStatus" type="radio" :value="o[0]" /><span>{{ o[1] }}</span></label>
        <template v-if="form.maritalStatus === 'casado'">
          <div class="divider" />
          <label class="check"><input v-model="form.propertyRegime" type="radio" value="separacion" /><span>Separación de patrimonios</span></label>
          <label class="check"><input v-model="form.propertyRegime" type="radio" value="gananciales" /><span>Sociedad de gananciales. Tu cónyuge firma el mismo documento.</span></label>
        </template>
      </div></section>
      <section class="card"><div class="card-h"><h3>Tu cónyuge</h3><span class="sub">Solo si hay gananciales o unión de hecho</span></div><div class="card-b" style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>Nombre completo</label><div class="input"><input v-model="form.spouseName" /></div></div>
        <div class="field"><label>Correo electrónico</label><div class="input"><input v-model="form.spouseEmail" type="email" /></div></div>
        <div class="row" style="justify-content:space-between"><button class="btn ghost" type="button" @click="step = 0">Atrás</button><button class="btn primary">Continuar</button></div>
      </div></section>
    </form>
    <form v-else-if="step === 2" class="split" style="display:grid;grid-template-columns:1fr 1fr;gap:20px" @submit.prevent="save(3)">
      <section class="card"><div class="card-h"><h3>¿De dónde viene el dinero?</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:8px">
        <label v-for="o in [['sueldo','Sueldo como dependiente'],['negocio','Negocio propio'],['herencia','Herencia'],['ahorros','Ahorros o inversiones'],['otro','Otro']]" :key="o[0]" class="check"><input v-model="form.fundsOrigin" type="radio" :value="o[0]" /><span>{{ o[1] }}</span></label>
        <div v-if="form.fundsOrigin === 'otro'" class="field"><label>Descríbelo</label><div class="input"><input v-model="form.fundsDetail" /></div></div>
      </div></section>
      <section class="card"><div class="card-h"><h3>Declaraciones</h3></div><div class="card-b" style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>¿Eres persona expuesta políticamente (PEP)?</label><div class="seg"><button type="button" :class="{ on: form.pep }" @click="form.pep = true">Sí</button><button type="button" :class="{ on: !form.pep }" @click="form.pep = false">No</button></div></div>
        <div v-if="form.pep" class="field"><label>Cargo y entidad</label><div class="input"><input v-model="form.pepDetail" /></div></div>
        <div class="field"><label>¿Inviertes con tu propio dinero?</label><div class="seg"><button type="button" :class="{ on: form.beneficialOwner }" @click="form.beneficialOwner = true">Sí, soy el beneficiario final</button><button type="button" :class="{ on: !form.beneficialOwner }" @click="form.beneficialOwner = false">No</button></div></div>
        <label class="check"><input v-model="form.fundsDeclared" type="checkbox" /><span>Declaro que el dinero tiene origen lícito y que la información es verdadera.</span></label>
        <div class="row" style="justify-content:space-between"><button class="btn ghost" type="button" @click="step = 1">Atrás</button><button class="btn primary" :disabled="!form.fundsDeclared">Continuar a la firma</button></div>
      </div></section>
    </form>
    <section v-else class="card" style="max-width:720px">
      <div class="card-h"><h3>Poder y declaración jurada</h3><span class="sub">{{ user.envelopeId || 'Un documento · DocuSign' }}</span></div>
      <div class="card-b" style="display:flex;flex-direction:column;gap:14px">
        <p class="muted" style="margin:0">Un solo PDF. Firmas el poder especial marco y la declaración jurada. El poder autoriza a PROPIA SAC a comprar, administrar y vender tus cuotas. En este entorno local confirmas la firma aquí; en producción se abre DocuSign.</p>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <Badge :label="user.holderSigned ? 'Poder y declaración · firmados' : 'Pendiente de tu firma'" :cls="user.holderSigned ? 'b-teal' : 'b-amber'" :icon="user.holderSigned ? 'check' : 'clock'" />
          <Badge v-if="user.needsSpouse" :label="user.spouseSigned ? 'Cónyuge · firmó' : 'Cónyuge · esperando'" :cls="user.spouseSigned ? 'b-teal' : 'b-amber'" />
        </div>
        <button v-if="!user.holderSigned" class="btn primary" type="button" style="align-self:flex-start" @click="sign">Firmar en DocuSign</button>
        <NuxtLink v-if="user.investorStatus === 'observed'" to="/perfil" class="btn secondary" style="align-self:flex-start">Subir sustento desde el perfil</NuxtLink>
      </div>
    </section>
    <form v-if="user.investorStatus === 'observed'" class="card" style="max-width:720px" @submit.prevent="save(4)">
      <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
        <div class="field"><label>Nombre del sustento</label><div class="input"><input v-model="form.plaftFile" placeholder="contrato.pdf" required /></div></div>
        <button class="btn primary" style="align-self:flex-start">Enviar sustento</button>
      </div>
    </form>
  </Shell>
</template>
