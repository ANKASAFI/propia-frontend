export function money(n: number, currency = 'USD', cents = false) {
  const cur = currency === 'PEN' ? 'S/' : 'US$'
  const neg = Number(n) < 0
  const abs = Math.abs(Number(n) || 0)
  const s = (cents ? abs.toFixed(2) : String(Math.round(abs))).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${neg ? '−' : ''}${cur} ${s}`
}

export function homeFor(me: { role: string; investorStatus: string } | null) {
  if (!me) return '/login'
  if (me.role === 'tesoreria') return '/admin/depositos'
  if (me.role === 'operaciones') return '/admin/propiedades'
  if (me.role === 'cumplimiento') return '/admin/plaft'
  if (me.role === 'admin') return '/admin'
  if (me.investorStatus !== 'enabled') return '/onboarding'
  return '/explorar'
}
