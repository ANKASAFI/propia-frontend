import { homeFor } from '~/utils/format'

const PUBLIC = new Set(['/', '/login', '/registro', '/verificar', '/recuperar', '/libro-de-reclamaciones', '/sin-acceso'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { me, loaded, refresh } = useSession()
  if (!loaded.value) await refresh()
  const user = me.value?.user
  const open = PUBLIC.has(to.path) || to.path.startsWith('/firmar')
  if (!user && !open) return navigateTo('/login')
  if (user && (to.path === '/login' || to.path === '/registro')) return navigateTo(homeFor(user))
  if (!user) return
  const staff = user.role !== 'investor'
  if (staff && !to.path.startsWith('/admin') && to.path !== '/sin-acceso') return navigateTo(homeFor(user))
  if (!staff && to.path.startsWith('/admin')) return navigateTo('/sin-acceso')
  if (!staff && user.investorStatus !== 'enabled' && ['/wallet', '/cartera'].some((p) => to.path === p || to.path.startsWith(`${p}/`))) {
    return navigateTo('/onboarding')
  }
  const area: Record<string, string[]> = {
    '/admin/depositos': ['tesoreria', 'admin'],
    '/admin/retiros': ['tesoreria', 'admin'],
    '/admin/pagos': ['tesoreria', 'admin'],
    '/admin/propiedades': ['operaciones', 'admin'],
    '/admin/rentas': ['operaciones', 'admin'],
    '/admin/ofertas': ['operaciones', 'admin'],
    '/admin/inversionistas': ['operaciones', 'admin'],
    '/admin/plaft': ['cumplimiento', 'admin'],
    '/admin/alertas': ['cumplimiento', 'admin'],
    '/admin/equipo': ['admin'],
    '/admin/reclamaciones': ['admin'],
    '/admin/configuracion': ['admin', 'cumplimiento'],
    '/admin': ['admin'],
  }
  if (to.path.startsWith('/admin')) {
    const key = Object.keys(area).sort((a, b) => b.length - a.length).find((k) => to.path === k || (k !== '/admin' && to.path.startsWith(`${k}/`)))
    const roles = key ? area[key] : ['admin']
    if (!roles.includes(user.role)) return navigateTo('/sin-acceso')
  }
})
