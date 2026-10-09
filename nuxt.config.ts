export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2026-10-09',
  css: ['~/assets/propia.css'],
  devServer: { port: 3001, host: '0.0.0.0' },
  app: {
    head: {
      title: 'PROPIA',
      htmlAttrs: { lang: 'es' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap' },
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
  nitro: {
    devProxy: {
      '/api': { target: 'http://127.0.0.1:3000/api', changeOrigin: true },
    },
  },
  routeRules: {
    '/api/**': { proxy: 'http://127.0.0.1:3000/api/**' },
  },
})
