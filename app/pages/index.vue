<script setup lang="ts">
const { theme, toggleTheme, initTheme } = useSession()
onMounted(initTheme)
definePageMeta({ layout: false })
</script>
<template>
  <div class="public" style="display:flex;flex-direction:column;background:var(--bg)">
    <header class="top">
      <Logo :size="26" />
      <span class="spacer" />
      <NuxtLink to="/#como" class="muted" style="font-weight:500;text-decoration:none">Cómo funciona</NuxtLink>
      <NuxtLink to="/#riesgos" class="muted" style="font-weight:500;text-decoration:none">Riesgos</NuxtLink>
      <button class="icon-btn" type="button" title="Cambiar tema" @click="toggleTheme"><Icon name="moon" cls="moon" /><Icon name="sun" cls="sun" /></button>
      <NuxtLink to="/login" class="btn secondary sm">Iniciar sesión</NuxtLink>
      <NuxtLink to="/registro" class="btn primary sm">Crear cuenta</NuxtLink>
    </header>
    <section class="hero-grid" style="background:linear-gradient(160deg,#0A2148 0%,#0B2B5C 55%,#0E4D63 100%);color:#C9D5EA;padding:52px 64px;display:grid;grid-template-columns:1fr 440px;gap:56px;align-items:center">
      <div>
        <span class="badge plain" style="background:rgba(31,184,154,.16);color:#5EE0C2">Copropiedad inscrita en SUNARP</span>
        <h1 style="color:#fff;font-size:40px;line-height:1.12;font-weight:600;letter-spacing:-.02em;margin:18px 0 16px;max-width:600px">Sé dueño de una parte de inmuebles que ya generan renta.</h1>
        <p style="margin:0;max-width:540px;font-size:15px;line-height:1.6">Compras cuotas ideales desde US$ 13,000, quedas inscrito como copropietario y recibes tu parte de la renta cada mes en tu wallet.</p>
        <div class="row" style="gap:12px;margin-top:28px">
          <NuxtLink to="/registro" class="btn" style="background:#fff;color:#0A2148;height:42px;padding:0 18px">Crear cuenta</NuxtLink>
          <a href="#como" class="btn" style="border-color:rgba(255,255,255,.3);color:#fff;height:42px;padding:0 18px">Cómo funciona</a>
        </div>
        <div class="row" style="gap:40px;margin-top:34px;flex-wrap:wrap">
          <div><div class="num" style="color:#fff;font-size:22px;font-weight:600">US$ 4.0 M</div><div style="font-size:12px">Bajo administración</div></div>
          <div><div class="num" style="color:#fff;font-size:22px;font-weight:600">143</div><div style="font-size:12px">Copropietarios</div></div>
          <div><div class="num" style="color:#fff;font-size:22px;font-weight:600">9.6%</div><div style="font-size:12px">Renta anual promedio</div></div>
        </div>
      </div>
      <div style="border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.05);overflow:hidden">
        <div class="thumb g1" style="height:150px;border-radius:0"><Icon name="building" /><span class="badge plain" style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,.92);color:#0A2148">En fondeo</span></div>
        <div style="padding:18px 20px">
          <div class="row"><b style="color:#fff;font-size:16px">Edificio Alba</b><span class="grow" /><span class="num" style="color:#5EE0C2;font-weight:600">9.8%</span></div>
          <div style="font-size:12.5px;margin:2px 0 14px">San Isidro · Residencial · cierra 31 oct</div>
          <div class="tiles" style="grid-template-columns:repeat(20,1fr);gap:4px"><i v-for="k in 20" :key="k" :style="{ background: k <= 14 ? '#1FB89A' : 'rgba(255,255,255,.14)' }" /></div>
          <div class="row" style="justify-content:space-between;margin-top:10px;font-size:12.5px"><span>14 de 20 unidades</span><span class="num" style="color:#fff;font-weight:600">US$ 24,000 por unidad</span></div>
        </div>
      </div>
    </section>
    <section id="como" style="padding:32px 64px 20px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px" class="split">
      <div v-for="s in [
        ['user','1. Crea tu cuenta','Con tu correo. Entras al instante y ves las propiedades.'],
        ['shield','2. Habilítate','Tus datos, la firma del poder en DocuSign y una revisión de cumplimiento.'],
        ['wallet','3. Carga y solicita','Transfiere a PROPIA y solicita las unidades. Un administrador aprueba.'],
        ['trend','4. Cobra cada mes','La renta neta llega a tu wallet. Puedes retirarla o reinvertir.'],
      ]" :key="s[1]" class="card card-b">
        <span style="width:34px;height:34px;border-radius:8px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center"><Icon :name="s[0]" /></span>
        <b class="ink" style="display:block;margin:12px 0 4px;font-size:14px">{{ s[1] }}</b>
        <span class="muted" style="font-size:12.5px">{{ s[2] }}</span>
      </div>
    </section>
    <section id="riesgos" style="padding:8px 64px 28px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px" class="split">
      <div v-for="s in [
        ['landmark','Tu nombre en la partida','Cada copropietario queda inscrito en SUNARP con su cuota ideal.'],
        ['receipt','Cada sol con su asiento','Saldos y repartos salen de un libro mayor que se concilia con el banco todos los días.'],
        ['alert','Riesgos, sin letra chica','La renta y el valor pueden bajar. Vender una cuota puede tomar más de un mes.'],
      ]" :key="s[1]" class="row" style="align-items:flex-start;gap:12px;padding:6px 0">
        <span class="muted"><Icon :name="s[0]" /></span>
        <div><b class="ink">{{ s[1] }}</b><div class="muted" style="font-size:12.5px">{{ s[2] }}</div></div>
      </div>
    </section>
    <footer class="row muted" style="margin-top:auto;padding:16px 64px;border-top:1px solid var(--line);background:var(--surface);font-size:12px;gap:18px;flex-wrap:wrap">
      <span>PROPIA SAC · RUC 20601234567 · San Isidro, Lima</span>
      <span class="grow" />
      <span>Términos</span><span>Privacidad</span>
      <NuxtLink to="/libro-de-reclamaciones" class="row muted" style="gap:6px;text-decoration:none"><Icon name="file" />Libro de reclamaciones</NuxtLink>
    </footer>
  </div>
</template>
