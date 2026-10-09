<script setup lang="ts">
const route = useRoute()
const info = ref<any>(null)
const error = ref('')
const done = ref(false)
onMounted(async () => { info.value = await api(`/api/sign/${route.params.token}`) })
async function confirm() {
  error.value = ''
  try {
    await api(`/api/sign/${route.params.token}`, { method: 'POST', body: { who: info.value.who } })
    done.value = true
  } catch (e: any) { error.value = e.message }
}
</script>
<template>
  <div class="public" style="display:flex;align-items:center;justify-content:center;background:var(--bg)">
    <section v-if="info" class="card" style="width:min(520px,calc(100% - 32px))">
      <div class="card-b" style="padding:28px;display:flex;flex-direction:column;gap:14px">
        <Logo :size="26" />
        <h2 style="margin:0;color:var(--ink);font-size:22px">{{ info.done || done ? 'Firma registrada' : 'Confirmar firma' }}</h2>
        <p class="muted" style="margin:0">{{ info.name }} · sobre {{ info.envelopeId }}. En producción esta pantalla es DocuSign, con verificación de identidad. Aquí confirmas la misma firma para el entorno local.</p>
        <p v-if="error" class="err">{{ error }}</p>
        <button v-if="!info.done && !done" class="btn primary" type="button" @click="confirm">Firmar poder y declaración jurada</button>
        <NuxtLink v-else to="/onboarding" class="btn primary">Volver a la habilitación</NuxtLink>
      </div>
    </section>
  </div>
</template>
