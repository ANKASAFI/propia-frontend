<script setup lang="ts">
const props = withDefaults(defineProps<{
  active: string
  crumbs: string[]
  showCurrency?: boolean
  locked?: boolean
}>(), { showCurrency: true, locked: false })

const { me, currency, theme, toggleTheme, initTheme, refresh } = useSession()
const notes = ref<any[]>([])
const openNotes = ref(false)
const q = ref('')
const router = useRouter()

const user = computed(() => me.value?.user)
const counts = computed(() => me.value?.counts || {})

const investorNav = [
  { id: 'explorar', label: 'Explorar', icon: 'compass', to: '/explorar' },
  { id: 'secundario', label: 'Secundario', icon: 'repeat', to: '/secundario' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet', to: '/wallet', lock: true },
  { id: 'cartera', label: 'Mi cartera', icon: 'briefcase', to: '/cartera', lock: true },
  { id: 'perfil', label: 'Perfil', icon: 'user', to: '/perfil' },
]
const back = [
  { g: 'Tesorería', role: 'tesoreria', items: [
    { id: 'depositos', label: 'Depósitos', icon: 'inbox', to: '/admin/depositos', count: 'depositos' },
    { id: 'retiros', label: 'Retiros', icon: 'out', to: '/admin/retiros', count: 'retiros' },
    { id: 'pagos', label: 'Pagos y conciliación', icon: 'receipt', to: '/admin/pagos' },
  ] },
  { g: 'Operaciones', role: 'operaciones', items: [
    { id: 'propiedades', label: 'Propiedades', icon: 'building', to: '/admin/propiedades' },
    { id: 'rentas', label: 'Rentas y gastos', icon: 'chart', to: '/admin/rentas' },
    { id: 'ofertas', label: 'Ofertas secundarias', icon: 'repeat', to: '/admin/ofertas', count: 'ofertas' },
    { id: 'inversionistas', label: 'Inversionistas', icon: 'users', to: '/admin/inversionistas' },
  ] },
  { g: 'Cumplimiento', role: 'cumplimiento', items: [
    { id: 'plaft', label: 'Evaluación PLAFT', icon: 'shield', to: '/admin/plaft', count: 'plaft' },
    { id: 'alertas', label: 'Alertas', icon: 'alert', to: '/admin/alertas', count: 'alertas' },
  ] },
  { g: 'Administración', role: 'admin', items: [
    { id: 'tablero', label: 'Pendientes', icon: 'inbox', to: '/admin', count: 'tablero' },
    { id: 'equipo', label: 'Equipo', icon: 'user', to: '/admin/equipo' },
    { id: 'reclamaciones', label: 'Reclamaciones', icon: 'file', to: '/admin/reclamaciones', count: 'reclamaciones' },
    { id: 'config', label: 'Configuración', icon: 'sliders', to: '/admin/configuracion' },
  ] },
]

const groups = computed(() => {
  if (!user.value || user.value.role === 'investor') return [{ g: null, items: investorNav }]
  return back.filter((g) => user.value.role === 'admin' || g.role === user.value.role)
})

onMounted(async () => {
  initTheme()
  try { notes.value = await api('/api/notifications') } catch { notes.value = [] }
})

const unread = computed(() => notes.value.filter((n) => !n.read).length)

async function markRead() {
  await api('/api/notifications/read', { method: 'POST' })
  notes.value = notes.value.map((n) => ({ ...n, read: true }))
  if (me.value) me.value.unread = 0
}

async function logout() {
  await api('/api/auth/logout', { method: 'POST' })
  me.value = null
  await navigateTo('/login')
}

function search() {
  if (!q.value.trim()) return
  navigateTo({ path: '/explorar', query: { q: q.value.trim() } })
}

function setCur(c: string) {
  currency.value = c
}
</script>

<template>
  <div class="app">
    <aside class="side">
      <div class="brand">
        <Logo :size="26" on-dark />
        <span v-if="user?.role !== 'investor'" class="env">Backoffice</span>
      </div>
      <nav>
        <template v-for="grp in groups" :key="grp.g || 'inv'">
          <div v-if="grp.g" class="group">{{ grp.g }}</div>
          <NuxtLink
            v-for="item in grp.items"
            :key="item.id"
            class="item"
            :class="{ active: active === item.id, locked: locked && item.lock }"
            :to="locked && item.lock ? '/onboarding' : item.to"
          >
            <Icon :name="item.icon" />
            <span>{{ item.label }}</span>
            <span v-if="locked && item.lock" class="lock"><Icon name="lock" /></span>
            <span v-else-if="item.count && counts[item.count]" class="count">{{ counts[item.count] }}</span>
          </NuxtLink>
        </template>
      </nav>
      <div class="foot">
        <span class="avatar">{{ user?.initials }}</span>
        <span class="who grow"><b>{{ user?.name }}</b><span>{{ user?.roleLabel }}</span></span>
        <button class="naked" style="color:inherit" title="Cerrar sesión" @click="logout"><Icon name="logout" /></button>
      </div>
    </aside>
    <section class="main">
      <header class="top">
        <div class="crumbs">
          <template v-for="(c, k) in crumbs" :key="c">
            <Icon v-if="k" name="right" />
            <b v-if="k === crumbs.length - 1">{{ c }}</b>
            <span v-else>{{ c }}</span>
          </template>
        </div>
        <span class="spacer" />
        <form class="search" @submit.prevent="search">
          <Icon name="search" />
          <input v-model="q" placeholder="Buscar…" aria-label="Buscar" />
          <kbd>⌘K</kbd>
        </form>
        <div v-if="showCurrency" class="seg">
          <button type="button" :class="{ on: currency === 'USD' }" @click="setCur('USD')">USD</button>
          <button type="button" :class="{ on: currency === 'PEN' }" @click="setCur('PEN')">PEN</button>
        </div>
        <button class="icon-btn" type="button" title="Cambiar tema" @click="toggleTheme">
          <Icon name="moon" cls="moon" />
          <Icon name="sun" cls="sun" />
        </button>
        <button class="icon-btn" type="button" title="Notificaciones" @click="openNotes = !openNotes">
          <Icon name="bell" />
          <span v-if="unread" class="n">{{ unread }}</span>
        </button>
      </header>
      <div class="content">
        <slot />
      </div>
      <aside v-if="openNotes" class="drawer">
        <div class="card-h">
          <h3>Notificaciones</h3>
          <span class="sub">{{ unread }} sin leer</span>
          <div class="right"><button class="btn ghost sm" type="button" @click="markRead">Marcar leídas</button></div>
        </div>
        <div v-for="n in notes" :key="n.id" class="note" :class="{ unread: !n.read }">
          <div class="grow"><b>{{ n.title }}</b><span>{{ n.body }}</span></div>
          <span class="muted" style="font-size:11.5px">{{ n.at }}</span>
        </div>
        <div v-if="!notes.length" class="card-b muted">No tienes notificaciones.</div>
      </aside>
      <nav v-if="user?.role === 'investor'" class="m-nav">
        <NuxtLink v-for="item in investorNav" :key="item.id" :to="locked && item.lock ? '/onboarding' : item.to" :class="{ on: active === item.id }">
          <Icon :name="locked && item.lock ? 'lock' : item.icon" />{{ item.label.split(' ')[0] }}
        </NuxtLink>
      </nav>
    </section>
  </div>
</template>
