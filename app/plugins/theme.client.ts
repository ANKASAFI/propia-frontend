export default defineNuxtPlugin(() => {
  const saved = localStorage.getItem('propia-theme')
  document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light'
})
