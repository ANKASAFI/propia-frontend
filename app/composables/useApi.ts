export async function api<T = any>(url: string, opts: any = {}): Promise<T> {
  try {
    return await $fetch<T>(url, { credentials: 'include', ...opts })
  } catch (e: any) {
    const raw = e?.data?.message || e?.statusMessage || 'No se pudo completar'
    const message = Array.isArray(raw) ? raw.join(' ') : String(raw)
    const err = new Error(message) as Error & { status?: number }
    err.status = e?.statusCode || e?.status
    throw err
  }
}

export function useSession() {
  const me = useState<any>('me', () => null)
  const loaded = useState('me-loaded', () => false)
  const currency = useState<'USD' | 'PEN'>('currency', () => 'USD')
  const theme = useState('theme', () => 'light')

  function setCurrency(c: 'USD' | 'PEN') {
    currency.value = c
    localStorage.setItem('propia-currency', c)
  }

  function initCurrency() {
    const saved = localStorage.getItem('propia-currency')
    if (saved === 'USD' || saved === 'PEN') currency.value = saved
  }

  async function refresh() {
    try {
      me.value = await api('/api/auth/me')
    } catch {
      me.value = null
    }
    loaded.value = true
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    localStorage.setItem('propia-theme', theme.value)
  }

  function initTheme() {
    theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  }

  return { me, loaded, currency, theme, refresh, toggleTheme, initTheme, setCurrency, initCurrency }
}
