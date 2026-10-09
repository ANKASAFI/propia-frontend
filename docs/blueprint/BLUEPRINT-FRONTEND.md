# BLUEPRINT FRONTEND v2 — Nuxt 4 (SPA estática) + PrimeVue + Tailwind, mismo origen que la API

**Plantilla de arranque del cliente. Una sola build se promociona de dev a qa a prod. JavaScript no ve ningún token.**

> **Versión 2.0 — 2026-10-08.** Reemplaza a la v1. La v1 queda en el historial de git como referencia del sistema visual y **no se usa para implementar** autenticación, llamadas HTTP, configuración de entorno ni despliegue. Cuando las dos no coinciden, manda esta.
>
> El núcleo nuevo (configuración, cliente HTTP, middleware, tests y el build estático) se compiló y se ejecutó antes de transcribirlo: Node 24.21, pnpm 12.10.1, Nuxt 4.6.0, Vue 3.5, PrimeVue 4.5, Tailwind 3.4. `pnpm test` (3 tests), `pnpm typecheck` y `pnpm generate` terminaron bien, y el dev server en `127.0.0.1:4200` hizo de proxy de `GET /api/health` hacia el backend en el puerto 3000 (200, con `x-request-id`). El HTML generado lleva `apiBase: "/api"`, sin ningún host incrustado. Lo que no se pudo hacer sin la cuenta AWS (el primer `s3 sync` real) está en el checklist.
>
> **Versión 2.1 — 2026-10-08.** Añade los controles de prioridad 0, todos sin coste o dentro de una capa gratuita: CSP con `script-src` por hashes, escrita por el build (5.1), tipos generados desde el OpenAPI del backend (11.9), errores del navegador en Sentry con el `requestId` de cada llamada (11.10), `Idempotency-Key` en los `POST` (10.4), y Actions por SHA con auditoría de workflows, SBOM y procedencia firmada (16). Ese código **no se ejecutó** al escribirlo: va marcado 🆕 **V2.1** y su verificación está en el checklist (20).
>
> **Versión 2.2 — 2026-10-08.** Aplica las decisiones de producto del ADR-13 del backend: textos por clave, avisos dentro de la app y tableros. Va marcado 🆕 **V2.2** y no se ejecutó.
>
> **Versión 2.3 — 2026-10-09.** Pantallas de PROPIA a partir del prototipo `propia_desktop` (9.6): identidad visual, rutas del inversionista y del backoffice por rol. Diseño, marcado 🆕 **V2.3**, sin ejecutar.
>
> **Versión 2.4 — 2026-10-09.** Canvas de diseño final en `docs/design/propia-canvas.html`, con estilo empresarial y modo oscuro desde el inicio (9.6). Marcado 🆕 **V2.4**.

---
## 0. Propósito y cómo usar este documento

### 0.1 Qué es esto

El cliente de la aplicación: un SPA Nuxt que se genera a HTML/JS/CSS estáticos, se sube al bucket que crea el backend y se sirve por el mismo CloudFront que enruta `/api/*` a la API. No hay servidor Node en producción.

El sistema visual (tokens, layouts, componentes, gráficos, formularios) viene del original y está en las secciones 7, 8, 9 y 12 a 15. La sesión, el cliente HTTP y el despliegue son nuevos y tienen que coincidir con el blueprint del backend v2. Si este documento y el del backend discrepan en una ruta, una cookie o un status, manda el OpenAPI que publica el backend (`openapi.json`); este documento se escribió contra ese contrato el 2026-10-08.

### 0.2 Quién lee esto

Un agente que implementa el repositorio `<app-frontend>` y que no tiene el repositorio original. El código de las secciones 4, 5, 10 y 11 se copia. El de las secciones visuales se copia también, sustituyendo marcadores, y se ignoran las frases marcadas en el recuadro del inicio de cada una.

### 0.3 Etiquetas

| Etiqueta | Qué hacer |
|---|---|
| 🟩 **NÚCLEO** | Copiar, sustituyendo marcadores |
| 🆕 **V2** | Copiar igual. La etiqueta solo dice que no estaba así en el original |
| 🆕 **V2.1** | Copiar igual. Escrito contra el código verificado pero sin ejecutar: la primera implementación corre el checklist de la sección 20 |
| 🆕 **V2.2** | Decisión de producto del 2026-10-08 | Copiar igual. Si choca con un bloque anterior, manda V2.2 |
| 🆕 **V2.3** | Pantallas de PROPIA (9.6) | Diseño. Se construye con las secciones 8, 12 y 14. Si choca con un bloque anterior, manda V2.3 |
| 🆕 **V2.4** | Canvas final y modo oscuro (9.6) | La referencia visual es `docs/design/propia-canvas.html`. Si choca con un bloque anterior, manda V2.4 |
| 🟦 **EJEMPLO DE DOMINIO** | No copiar el contenido de negocio. Copiar la forma |
| 🟥 **DEUDA — NO REPLICAR** | No copiar. La sección 18 dice qué hacer en su lugar |

### 0.4 Orden

1. Secciones 0 a 3, y el registro de decisiones del backend (allí está el porqué del origen único y de las cookies).
2. Secciones 4, 5, 10 y 11, que son el contrato.
3. Sistema visual (7, 8, 12–15) para construir pantallas.
4. Plan de la sección 19 y checklist de la 20.

### 0.5 Reglas que no se negocian

- Ningún token en JavaScript, ni en `localStorage`, ni en una cookie que el script pueda leer, ni en `Authorization`.
- `runtimeConfig.public.apiBase` es `'/api'`. No se hornea el host del stage en el build.
- Toda llamada autenticada pasa por `useApi()` (sección 10). `useFetch` y `$fetch` sueltos no llevan el reintento de refresh.
- Un 401 refresca una vez y reintenta. Un 403 no cierra la sesión por "token caducado". Un 503 no manda al login como si la sesión hubiera muerto.
- `ssr: false` y `nitro.preset: 'static'`. El comando de release es `pnpm generate`, no `pnpm build`.
- Node 24, el mismo que el backend.

### 0.6 Qué cambió respecto a la v1

| Área | v1 | v2 |
|---|---|---|
| Sesión | Cookies legibles (`auth_token`, `auth_refresh_token`, email) y `Authorization: Bearer` | Cookies `httpOnly` que pone el backend. El cliente no las lee |
| Refresh | `POST /auth/refresh` con `{ email, refreshToken }` en el body | `POST /api/auth/refresh` sin body. Una sola promesa en vuelo |
| Perfil | `GET /auth/profile`, y se mezclaba con claims del ID token | `GET /api/auth/me`. La fila del backend es la única fuente |
| API URL | `NUXT_PUBLIC_API_BASE_URL` absoluta, un build por stage | `'/api'` relativo. Un build, tres stages |
| Local | El navegador llamaba al puerto 3000 y hacía falta CORS | Nuxt en el 4200 hace de proxy de `/api`. Sin CORS |
| MFA | No había flujo de reto | `status: "challenge"` y las rutas `/auth/challenge` y `/auth/challenge/mfa-setup` |
| Tests | Un test suelto con el runner de Node | Vitest. `pnpm test` |
| Node | El original no lo fijaba; el blueprint v1 asumía 22 | Node 24 (`.nvmrc`, `engines`) |
| Deploy | `nuxt generate` por stage, con la URL incrustada | El artefacto de `verify` se sincroniza al bucket del stage. El rol OIDC lo crea el stack `ci` del backend |

---
## Índice

- [0. Propósito y cómo usar este documento](#0-propósito-y-cómo-usar-este-documento)
- [1. Tabla de marcadores y convención de nombres](#1-tabla-de-marcadores-y-convención-de-nombres)
- [2. Resumen de arquitectura](#2-resumen-de-arquitectura)
- [3. Prerrequisitos](#3-prerrequisitos)
- [4. `package.json` completo](#4-packagejson-completo)
- [5. `nuxt.config.ts` completo](#5-nuxtconfigts-completo)
- [6. Estructura de carpetas](#6-estructura-de-carpetas)
- [7. Design system completo](#7-design-system-completo)
- [8. Layouts y shell de aplicación](#8-layouts-y-shell-de-aplicación)
- [9. Routing](#9-routing)
- [10. Autenticación en el cliente, end to end](#10-autenticación-en-el-cliente-end-to-end)
- [11. Capa de datos](#11-capa-de-datos)
- [12. Componentes](#12-componentes)
- [13. Gráficos con ECharts](#13-gráficos-con-echarts)
- [14. Formularios y validación](#14-formularios-y-validación)
- [15. Accesibilidad y responsive](#15-accesibilidad-y-responsive)
- [16. Build y despliegue](#16-build-y-despliegue)
- [17. Entorno de desarrollo local y Cursor Cloud](#17-entorno-de-desarrollo-local-y-cursor-cloud)
- [18. Correcciones obligatorias respecto al original](#18-correcciones-obligatorias-respecto-al-original)
- [19. Plan de implementación ordenado](#19-plan-de-implementación-ordenado)
- [20. Checklist final de aceptación](#20-checklist-final-de-aceptación)
- [21. Errores conocidos y cómo evitarlos](#21-errores-conocidos-y-cómo-evitarlos)
- [Anexo A — Puntos abiertos](#anexo-a--puntos-abiertos)

---
## 1. Tabla de marcadores y convención de nombres

Los marcadores de plataforma son los mismos que en el backend y se sustituyen con los mismos valores. Aquí solo se añaden los que son del cliente.

| Marcador | Qué es | Valor propuesto |
|---|---|---|
| `<org>`, `<app-short>`, `<app_snake>`, `<app>`, `<app-frontend>`, `<GITHUB_ORG>`, `<stage>`, `<ACCOUNT_NONPROD>`, `<ACCOUNT_PROD>`, `<REGION>`, `<DOMINIO_BASE>`, `<ROL_A>`, `<ROL_B>`, `<ROL_C>`, `<ROL_D>`, `<ROL_E>` | Los de la sección 1 del backend | Los mismos: `Inversionista`, `Admin`, `Tesoreria`, `Operaciones`, `Cumplimiento` (🆕 V2.4) |
| `<prefijo>` | Namespace de los tokens CSS (`--<prefijo>-bg`) y de las clases propias (`. <prefijo>-card` se escribe `.<prefijo>-card`) | `propia` si no se elige otro. 2 a 5 letras, minúsculas |
| `<descripción corta de la app>` | `<title>` del documento | `PROPIA · Copropiedad inmobiliaria` |

`<AUTOR>` del `package.json` es `<org>`, igual que en el backend.

No existe `NUXT_PUBLIC_API_BASE_URL`. Si aparece en un archivo nuevo, es un error: vuelve a incrustar el host en el build.

---
## 2. Resumen de arquitectura

🆕 **V2.**

```
Navegador
   │  https://<DOMINIO_APP>     (local: http://127.0.0.1:4200)
   ▼
CloudFront                      (local: el dev server de Nuxt)
   │
   ├─ /*        → bucket S3 del SPA (OAC). Sin extensión → /index.html
   │
   └─ /api/*    → API Gateway → Lambda
                  CloudFront inyecta x-origin-verify y no la deja pasar desde el navegador
```

El navegador hace `fetch('/api/auth/login', { credentials: 'include' })`. La respuesta trae `Set-Cookie`. La siguiente llamada a `/api/proyectos` adjunta la cookie sola, porque es el mismo origen y `SameSite=Strict` lo permite. No hay preflight de CORS.

En local el proxy de Vite reenvía `/api` a `http://127.0.0.1:3000` y el navegador sigue creyendo que habla con el 4200. Por eso las cookies de local (sin prefijo `__Host-`, porque el origen es HTTP) se guardan para `127.0.0.1` y no para el puerto 3000.

### 2.1 Por qué el build es estático y no hay SSR

No hay HTML por usuario. La sesión está en una cookie que el servidor de Nuxt no necesita leer para pintar, porque no pinta datos en el servidor. `ssr: false` evita toda la clase de bugs de hidratación y deja un directorio `.output/public` que S3 sabe servir. El precio es que el primer JS tiene que descargarse antes de pintar; el shell de la sección 8 es pequeño a propósito, y CloudFront cachea los assets con hash un año.

### 2.2 Lo que el cliente no decide

WAF, cabeceras de seguridad del documento (HSTS, `frame-ancestors`, `Permissions-Policy`), el certificado y el enrutado los pone el stack `web` del backend.

🆕 **V2.1.** La CSP va en dos mitades y el navegador aplica las dos:

| Mitad | Quién la escribe | Qué lleva |
|---|---|---|
| Cabecera `Content-Security-Policy` | CloudFront (stack `web` del backend) | `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. Lo que una `<meta>` no puede expresar o no debe depender del build |
| `<meta http-equiv="Content-Security-Policy">` | `scripts/csp.mjs`, al final de `pnpm generate` (5.1) | `default-src 'self'`, `script-src 'self'` con el sha256 de cada script en línea del HTML, `connect-src` con el host de Sentry, y el resto |

La meta la escribe el cliente porque los hashes cambian en cada build (el script en línea de Nuxt lleva el `buildId`) y el stack del backend no se redespliega con cada release del frontend. Si un vendor necesita otro origen, se añade en `scripts/csp.mjs`, en un PR. Nunca se agrega `'unsafe-inline'` a `script-src`.

---
## 3. Prerrequisitos

| Herramienta | Versión verificada el 2026-10-08 |
|---|---|
| Node | 24.21.0 (`.nvmrc` = `24`, `engines` `>=24.11.0 <25`) |
| pnpm | 12.10.1 (`packageManager`) |
| Nuxt | 4.6.0 (rango `^4.4.8`) |
| Vue | 3.5.43 |
| PrimeVue / módulo Nuxt | 4.5.5 |
| Tailwind | 3.4.19, como dependencia directa |
| Pinia / `@pinia/nuxt` | 4.0.3 / 1.0.2 |
| Vitest | 5.0.3 |
| TypeScript | 6.0.3 |
| vue-tsc | 3.3.12 |
| `@sentry/vue` | 11.6.0, la misma major que `@sentry/node` del backend (🆕 V2.1) |
| `openapi-typescript` | 7.13.0, por `pnpm dlx` y no como dependencia (🆕 V2.1, 11.9) |

TypeScript queda en 6.0.3, el mismo que el backend. vue-tsc 3.3 lo acepta. El aviso de `vue-router/volar/sfc-route-blocks` sigue saliendo por stderr y el comando termina en 0. TypeScript 7 no entra en ninguno de los dos repos: `typescript-eslint` exige `< 6.1` y el CLI de Nest fija `~6.0`. Pinia 4 solo cambia el empaquetado (ESM) y los avisos de desarrollo; `defineStore` sigue igual y el `package.json` ya es `"type": "module"`.

El backend tiene que estar en marcha para probar el login. Para compilar el frontend, no.

---
## 4. `package.json` completo

🆕 **V2.** Instalado con pnpm 12.10.1 el 2026-10-08. `tailwindcss` va en `devDependencies` directas: con pnpm el módulo de Nuxt no resuelve `tailwindcss/nesting` si el paquete solo está anidado.

Archivo: `package.json`

```json
{
  "name": "<app-frontend>",
  "version": "0.0.1",
  "private": true,
  "license": "UNLICENSED",
  "author": "<AUTOR>",
  "type": "module",
  "packageManager": "pnpm@12.10.1",
  "engines": {
    "node": ">=24.11.0 <25"
  },
  "scripts": {
    "dev": "nuxt dev",
    "generate": "nuxt generate && node scripts/csp.mjs",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "typecheck": "nuxt typecheck",
    "test": "vitest run",
    "api:types": "pnpm dlx openapi-typescript@7.13.0 \"${OPENAPI_URL:-https://raw.githubusercontent.com/<GITHUB_ORG>/<app>/main/openapi/openapi.json}\" -o types/api.gen.ts"
  },
  "dependencies": {
    "@nuxtjs/color-mode": "^4.0.1",
    "@nuxtjs/google-fonts": "^3.2.0",
    "@pinia/nuxt": "^1.0.2",
    "@primevue/nuxt-module": "^4.5.5",
    "@sentry/vue": "^11.6.0",
    "echarts": "^6.1.0",
    "nuxt": "^4.4.8",
    "pinia": "^4.0.3",
    "primeicons": "^8.0.0",
    "primevue": "^4.5.5",
    "vue": "^3.5.22",
    "vue-echarts": "^8.1.0",
    "vue-router": "^4.5.1"
  },
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.14.0",
    "@primeuix/themes": "^3.0.0",
    "tailwindcss": "3.4.19",
    "tailwindcss-primeui": "^0.6.1",
    "typescript": "~6.0.3",
    "vitest": "^5.0.3",
    "vue-tsc": "^3.1.0"
  }
}
```

```yaml
# pnpm-workspace.yaml
allowBuilds:
  '@parcel/watcher': true
  esbuild: true
  vue-demi: true
```

pnpm 12 aborta el install si un paquete quiere ejecutar un script que no está en `allowBuilds`. Cuando aparezca otro (`sharp`, `unrs-resolver`), se añade en el mismo PR. No se usa `--ignore-scripts`.

| Script | Qué hace |
|---|---|
| `dev` | Nuxt en `127.0.0.1:4200`, con el proxy de `/api` |
| `generate` | El artefacto de release: `.output/public`. 🆕 V2.1: termina con `scripts/csp.mjs`, que escribe la meta CSP en cada HTML (5.1). Un `nuxt generate` suelto produce un sitio sin `script-src` y el smoke del backend lo rechaza |
| `api:types` | 🆕 V2.1. Regenera `types/api.gen.ts` desde el `openapi.json` de `main` del backend, o desde `OPENAPI_URL` (una ruta local vale) (11.9) |
| `build` | No se usa para desplegar. Con `preset: 'static'` no produce el sitio que S3 sirve |
| `typecheck` | `nuxt typecheck` |
| `test` | Vitest, sobre `utils/**/*.test.ts` |
| `postinstall` | `nuxt prepare`. Sin esto el editor no tiene tipos |

`openapi-typescript` no entra en `devDependencies`: la 7.13 declara `typescript ^5` como peer y el proyecto está en 6.0. Con `pnpm dlx` y la versión exacta, el generador trae su propio TypeScript en un entorno aparte, y el del proyecto no se toca. Si una versión futura acepta TypeScript 6, pasa a `devDependencies` en un PR.

No se copian `pixelmatch` ni `pngjs` (estaban declarados y nadie los importaba), ni los scripts de paridad visual contra mockups del dominio original. Playwright se añade el día que haya un flujo de punta a punta que merezca un navegador; no se deja instalado "por si acaso".

---
## 5. `nuxt.config.ts` completo

🆕 **V2.**

```ts
// nuxt.config.ts
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2026-10-07',
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@primevue/nuxt-module',
  ],
  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],
  nitro: { preset: 'static' },
  ignore: ['**/.output/**', '**/.nuxt/**'],
  devServer: { host: '127.0.0.1', port: 4200 },
  vite: {
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      },
    },
  },
  colorMode: { classSuffix: '', preference: 'dark', fallback: 'dark' },
  googleFonts: {
    families: { 'Plus Jakarta Sans': [400, 500, 600, 700] },
    display: 'swap',
    preload: true,
    // Las fuentes se copian al build: la CSP no abre fonts.googleapis.com ni fonts.gstatic.com,
    // y el navegador del usuario no le cuenta a Google qué app abre.
    download: true,
  },
  primevue: {
    options: {
      ripple: true,
      theme: { preset: Aura, options: { darkModeSelector: '.dark' } },
    },
  },
  app: {
    head: {
      title: '<app-short>',
      htmlAttrs: { lang: 'es' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  // Relativo a propósito: el mismo build se promociona de dev a prod.
  // En local el proxy de Vite reenvía /api al backend. En AWS lo hace CloudFront.
  runtimeConfig: {
    public: {
      apiBase: '/api',
      // Iguales en los tres stages: el DSN es del proyecto de Sentry, no del stage.
      // Vacío en local, y entonces Sentry no se inicializa (11.10).
      sentryDsn: process.env.SENTRY_DSN_WEB ?? '',
      release: process.env.GITHUB_SHA ?? 'local',
    },
  },
})
```

Qué no se toca sin releer la sección 2:

- `ssr: false` y `nitro.preset: 'static'`.
- `runtimeConfig.public.apiBase` es el string `'/api'`. No es `process.env.NUXT_PUBLIC_API_BASE_URL`. En un generate estático, `runtimeConfig` se congela en el HTML: se comprobó que el `index.html` generado contiene `apiBase:"/api"` y ningún host.
- El proxy vive en `vite.server.proxy`, no en `nitro.devProxy` ni en `routeRules`. El dev server que recibe al navegador es Vite. `routeRules` con `proxy` se hornearía también en el generate y el sitio estático intentaría hacer de proxy, que no puede.
- `devServer.host` es `127.0.0.1`, no `0.0.0.0`. Las cookies de local son de ese host.
- No hay `app.head` con una CSP. La meta la escribe `scripts/csp.mjs` después del generate (5.1), porque necesita el HTML final para calcular los hashes.
- `sentryDsn` y `release` se congelan en el HTML igual que `apiBase`. Ninguno de los dos depende del stage, así que el build sigue siendo uno solo.

`assets/css/main.css` del esqueleto verificado solo tiene las tres directivas `@tailwind`. El archivo de verdad es el de la sección 7, que lo reemplaza entero y se deja en la misma ruta. El módulo avisa `Using default Tailwind CSS file` cuando no encuentra `assets/css/tailwind.css`; es informativo. Durante el generate apareció también el aviso `tailwindcss/nesting` could not be loaded, y el comando terminó bien (exit 0) generando `.output/public`. No se bloquea el release por ese aviso. El CSS del design system no depende de nesting.

`pnpm typecheck` escribe por stderr que `vue-router/volar/sfc-route-blocks` no está exportado. Es un desajuste de vue-tsc 3.3 con vue-router 4.6. El exit code es 0 y los errores de verdad del proyecto sí fallan el comando (se comprobó al quitar un genérico de `$fetch`).

### 5.1 `scripts/csp.mjs`

🆕 **V2.1.** Corre después de `nuxt generate`, sobre `.output/public`. En cada HTML calcula el sha256 de los scripts en línea ejecutables y escribe la meta CSP como primer hijo de `<head>`, antes de cualquier script. Sin dependencias.

```js
// scripts/csp.mjs
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = '.output/public'
const INLINE_SCRIPT = /<script\b(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/gi
// Los bloques de datos (el payload de Nuxt, JSON-LD) no se ejecutan y la CSP no los mira.
const DATA_BLOCK = /\btype\s*=\s*["']?application\/(?:ld\+)?json/i

function sentryOrigin() {
  const dsn = process.env.SENTRY_DSN_WEB
  // https://<clave>@o123.ingest.us.sentry.io/456 → https://o123.ingest.us.sentry.io
  return dsn ? new URL(dsn).origin : null
}

function policy(hashes) {
  const scripts = ["'self'", ...hashes.map((h) => `'sha256-${h}'`)]
  const connect = ["'self'", sentryOrigin()].filter(Boolean)
  return [
    "default-src 'self'",
    `script-src ${scripts.join(' ')}`,
    // PrimeVue (tema Aura) y ECharts escriben estilos en tiempo de ejecución.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ')
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((e) => {
      const path = join(dir, e.name)
      if (e.isDirectory()) return htmlFiles(path)
      return e.name.endsWith('.html') ? [path] : []
    }),
  )
  return nested.flat()
}

const files = await htmlFiles(OUT)
if (files.length === 0) throw new Error(`No hay HTML en ${OUT}: ¿corrió nuxt generate?`)

for (const file of files) {
  const html = await readFile(file, 'utf8')
  if (/http-equiv\s*=\s*["']?content-security-policy/i.test(html)) {
    throw new Error(`${file} ya tiene una meta CSP: csp.mjs corrió dos veces sobre el mismo build`)
  }
  const hashes = new Set()
  for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
    if (DATA_BLOCK.test(attrs) || body.trim() === '') continue
    hashes.add(createHash('sha256').update(body, 'utf8').digest('base64'))
  }
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy([...hashes])}">`
  const out = html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}${meta}`)
  if (out === html) throw new Error(`${file} no tiene <head>`)
  await writeFile(file, out)
  console.log(`csp: ${file} (${hashes.size} script(s) en línea)`)
}
```

Qué hay detrás de cada decisión:

- **Hash, no nonce.** Un nonce exige un servidor que lo genere en cada respuesta, y aquí S3 sirve archivos estáticos. El hash es del contenido exacto del script, así que vale para todas las respuestas de ese build.
- **Lo que se hashea.** El `window.__NUXT__` con la config pública, el script anti-parpadeo de `@nuxtjs/color-mode` y cualquier otro script en línea que añada un módulo. El script no tiene una lista de módulos: hashea lo que encuentra. Un módulo nuevo que mete un script en línea queda cubierto sin tocar este archivo.
- **`style-src 'unsafe-inline'`.** PrimeVue inyecta `<style>` con los tokens del tema y ECharts pone `style=""` en los tooltips. Un estilo inyectado no ejecuta código. La protección que importa es `script-src`, y esa no lleva `'unsafe-inline'`.
- **Sin `'unsafe-eval'`.** Vue va compilado (sin compilador de plantillas en el navegador), y ni PrimeVue, ni ECharts, ni Sentry usan `eval`. Si una librería nueva lo necesita, se discute en el PR que la añade, no se abre la directiva.
- **`connect-src`** es el propio origen (`/api`) más el host de ingesta de Sentry, sacado del mismo `SENTRY_DSN_WEB` del build. Sin DSN, solo `'self'`. El `PUT` de documentos va a S3 (11.2): cuando el dominio lo use en AWS, se añade aquí el origen del bucket (`https://<bucket>.s3.<REGION>.amazonaws.com`). La URL prefirmada no sirve como fuente porque cambia en cada subida.
- **Trusted Types** (`require-trusted-types-for 'script'`) no se activa. PrimeVue y `v-html` no están preparados, y una CSP que rompe la app en producción se desactiva el primer día.
- **El orden importa.** La meta tiene que ir antes que cualquier `<script>`: el navegador no aplica una política a lo que ya ejecutó. Por eso se inserta como primer hijo de `<head>`.

Para ver la política en local: `pnpm generate && pnpm preview`, y la consola del navegador no debe mostrar ningún `Refused to execute inline script`. Con `pnpm dev` no hay meta (Vite inyecta scripts propios para el HMR).

---
## 6. Estructura de carpetas

🆕 **V2.** No se crea un directorio `app/` en la raíz. Nuxt 4, si lo ve, cambia el `srcDir` y deja de ver `pages/`, `components/` y `middleware/` sin un error claro. El esqueleto verificado vive en la raíz y `nuxt prepare` generó los tipos así.

```
<app-frontend>/
├── .github/
│   ├── dependabot.yml           # npm y github-actions (16.4)
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── assets/css/main.css          # tokens, sección 7
├── components/                  # sección 12. Auto-import sin prefijo de ruta
├── composables/useApi.ts        # único cliente HTTP
├── layouts/                     # default (autenticado) y auth (público)
├── middleware/
│   ├── auth.ts
│   ├── guest.ts
│   └── role.ts                  # plantilla; el dominio crea uno por rol
├── pages/
├── plugins/sentry.client.ts     # errores del navegador (11.10)
├── scripts/csp.mjs              # meta CSP con hashes, después del generate (5.1)
├── types/
│   ├── api.gen.ts               # generado desde el OpenAPI del backend. No se edita (11.9)
│   └── api.ts                   # tipos que solo existen en la UI (11.6)
├── utils/
│   ├── http.ts
│   └── http.test.ts
├── .gitignore
├── .nvmrc                       # 24
├── nuxt.config.ts
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json                # extends .nuxt/tsconfig.json
└── vitest.config.ts
```

`tsconfig.json` excluye los `*.test.ts`: vue-tsc no entiende el `vi` de Vitest, y Vitest no necesita pasar por vue-tsc.

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "exclude": ["utils/**/*.test.ts"]
}
```

`.gitignore`: `node_modules/`, `.nuxt/`, `.output/`, `dist/`, `.env`, `.env.*` con la excepción `!.env.example`.

No hay `.env` de API. No hay nada que configurar por stage en el cliente.

---
> **Vigente en v2 como sistema visual.** Se copia del original porque el aspecto no cambió. Cualquier frase que hable de `Authorization`, de cookies `auth_token` / `auth_refresh_token`, de un `apiBase` absoluto o de CORS **no se implementa**: la sesión y las llamadas HTTP están en las secciones 10 y 11.

## 7. Design system completo

### 7.1 El patrón triple de modo oscuro, paso a paso

Hay **tres sistemas de estilos independientes** que tienen que ponerse de acuerdo sobre qué es «modo oscuro». Si uno solo se desalinea, obtienes una pantalla mitad clara mitad oscura. Este es el mecanismo exacto, en orden de ejecución:

```
                   ┌─────────────────────────────────┐
  usuario pulsa →  │  colorMode.preference = 'dark'  │   (@nuxtjs/color-mode)
                   └────────────────┬────────────────┘
                                    │  persiste en localStorage
                                    │  y escribe la clase en <html>
                                    ▼
                   ┌─────────────────────────────────┐
                   │   <html class="dark">            │   ← LA ÚNICA FUENTE DE VERDAD
                   └────────────────┬────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
 ┌──────────────────┐   ┌────────────────────────┐  ┌──────────────────────┐
 │ 1. TOKENS CSS    │   │ 2. TAILWIND            │  │ 3. PRIMEVUE          │
 │                  │   │                        │  │                      │
 │ assets/css/      │   │ tailwind.config.ts     │  │ nuxt.config.ts       │
 │   main.css       │   │ darkMode: 'class'      │  │ theme.options.       │
 │                  │   │                        │  │   darkModeSelector:  │
 │ :root { … }      │   │ habilita `dark:bg-x`   │  │   '.dark'            │
 │ .dark  { … }     │   │                        │  │                      │
 └──────────────────┘   └────────────────────────┘  └──────────────────────┘
```

#### Paso 1 — `@nuxtjs/color-mode` escribe la clase

En `nuxt.config.ts`:

```ts
colorMode: {
  classSuffix: '',     // ← sin esto la clase sería "dark-mode"
  preference: 'dark',  // valor por defecto para un usuario nuevo
  fallback: 'dark'     // si preference='system' y no se puede resolver
}
```

`classSuffix: ''` es la pieza que la gente olvida. Por defecto el módulo escribe `class="dark-mode"`, y ni Tailwind ni PrimeVue reconocen esa clase.

El módulo inyecta además un script bloqueante en el `<head>` que lee `localStorage` y aplica la clase **antes del primer pintado**, de modo que no hay destello de tema claro al recargar.

#### Paso 2 — Tailwind activa su variante `dark:`

En `tailwind.config.ts`:

```ts
darkMode: 'class'
```

Con esto, `dark:bg-slate-900` se aplica cuando hay un ancestro con clase `.dark`. En la práctica el repositorio original **apenas usa `dark:`**, porque prefiere la vía de los tokens CSS (paso 3): una clase única como `bg-<prefijo>-bg` que cambia de valor sola. Pero la configuración debe estar porque los componentes de terceros y los casos puntuales sí la usan.

#### Paso 3 — Los tokens CSS se redefinen bajo `.dark`

En `assets/css/main.css`:

```css
:root { --<prefijo>-bg: #ffffff;  /* …tema claro… */ }
.dark { --<prefijo>-bg: #010510;  /* …tema oscuro… */ }
```

Una clase de Tailwind definida como `bg-<prefijo>-bg: var(--<prefijo>-bg)` **cambia sola** al activarse `.dark`, sin necesidad de escribir dos clases ni de usar el prefijo `dark:`. Esta es la vía principal del design system: **una sola clase, dos valores**.

#### Paso 4 — PrimeVue sigue el mismo selector

En `nuxt.config.ts`:

```ts
primevue: {
  options: {
    theme: {
      preset: Aura,
      options: { darkModeSelector: '.dark' }
    }
  }
}
```

Sin esta línea, PrimeVue v4 decide su tema con `@media (prefers-color-scheme: dark)`, es decir, **sigue al sistema operativo e ignora el toggle de la aplicación**. El resultado es un `<Button>` claro sobre un fondo oscuro.

#### Paso 5 — Los gráficos de ECharts

ECharts dibuja sobre canvas y **no ve el CSS**. El composable `useChartTheme` (sección 13.3) lee `useColorMode()` y devuelve una opción base con los colores ya resueltos. Es el cuarto consumidor del mismo estado.

#### Checklist de verificación del patrón

Con el toggle en oscuro, inspecciona el DOM y comprueba **las cuatro** cosas:

1. `<html class="dark">` existe.
2. `getComputedStyle(document.documentElement).getPropertyValue('--<prefijo>-bg')` devuelve el valor oscuro.
3. Un `<Button>` de PrimeVue tiene el fondo oscuro del preset Aura.
4. Un gráfico tiene las etiquetas de eje en el gris claro, no en el gris oscuro.

### 7.2 `tailwind.config.ts` transcrito

🟩 **NÚCLEO REUTILIZABLE.**

Archivo: `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'
import PrimeUI from 'tailwindcss-primeui'

export default {
  darkMode: 'class',
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        <prefijo>: {
          bg: 'var(--<prefijo>-bg)',
          elevated: 'var(--<prefijo>-bg-elevated)',
          sidebar: 'var(--<prefijo>-bg-sidebar)',
          muted: 'var(--<prefijo>-text-muted)',
          border: 'var(--<prefijo>-border)'
        }
      }
    }
  },
  plugins: [PrimeUI]
} satisfies Config
```

| Opción | Explicación |
|---|---|
| `darkMode: 'class'` | Paso 2 del patrón triple. |
| `content: []` | **Está vacío a propósito.** `@nuxtjs/tailwindcss` inyecta automáticamente los paths de `components/`, `layouts/`, `pages/`, `plugins/`, `composables/`, `utils/`, `app.vue` y `error.vue`. Si lo rellenas a mano, **sobrescribes** el descubrimiento automático y Tailwind empieza a purgar clases que sí se usan. Déjalo vacío. |
| `fontFamily.sans` | Redefine la pila por defecto, de modo que la utilidad `font-sans` y el `font-family` heredado usen Plus Jakarta Sans. |
| `colors.<prefijo>.*` | **El puente entre Tailwind y los tokens CSS.** Cada entrada mapea a una custom property. Son solo cinco, y son exactamente los cinco colores que se usan como utilidades de Tailwind en las plantillas. El resto de tokens se consume con `style="color: var(--<prefijo>-X)"` o con sintaxis arbitraria `text-[var(--<prefijo>-X)]`. |
| `plugins: [PrimeUI]` | Expone los tokens semánticos de PrimeVue como utilidades de Tailwind y alinea el reset de ambos sistemas. |

**Utilidades generadas por el bloque `colors`:**

| Token de Tailwind | Clases disponibles | CSS resultante |
|---|---|---|
| `<prefijo>-bg` | `bg-<prefijo>-bg`, `text-<prefijo>-bg`, `border-<prefijo>-bg` | `var(--<prefijo>-bg)` |
| `<prefijo>-elevated` | `bg-<prefijo>-elevated`, … | `var(--<prefijo>-bg-elevated)` |
| `<prefijo>-sidebar` | `bg-<prefijo>-sidebar`, … | `var(--<prefijo>-bg-sidebar)` |
| `<prefijo>-muted` | `text-<prefijo>-muted`, … | `var(--<prefijo>-text-muted)` |
| `<prefijo>-border` | `border-<prefijo>-border`, `divide-<prefijo>-border`, … | `var(--<prefijo>-border)` |

### 7.3 `assets/css/main.css` transcrito ENTERO

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal y completa del archivo real (218 líneas), con `--anka-` → `--<prefijo>-` y `.anka-` → `.<prefijo>-`. Los comentarios del original se conservan, traducidos a términos genéricos donde mencionaban nombres propios.

Archivo: `assets/css/main.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
  Tokens 1:1 con el mockup de referencia (tema oscuro).
  Dark muestreado: bg #010510, cards #070f1c, sidebar #030d19, border #1a2230.
  Acentos de KPI: sky/green/purple muted/cyan/amber.
*/
:root {
  --<prefijo>-bg: #ffffff;
  --<prefijo>-bg-elevated: #ffffff;
  --<prefijo>-bg-sidebar: #ffffff;
  --<prefijo>-text: #0f172a;
  --<prefijo>-text-muted: #64748b;
  --<prefijo>-border: #edeff2;
  --<prefijo>-accent-from: #2563eb;
  --<prefijo>-accent-to: #4f46e5;
  --<prefijo>-accent: #2563eb;
  --<prefijo>-success: #16a34a;
  --<prefijo>-warning: #f59e0b;
  --<prefijo>-danger: #ef4444;
  --<prefijo>-purple: #8b5cf6;
  --<prefijo>-cyan: #0891b2;
  --<prefijo>-track: #eef1f5;
  --<prefijo>-chart-serie-a: #2563eb;
  --<prefijo>-chart-serie-b: #7c4ddf;
  --<prefijo>-nav-active: #f0f4ff;
  --<prefijo>-nav-active-text: #1d4ed8;
  --<prefijo>-grade-a: #16a34a;
  --<prefijo>-grade-b: #16a34a;
  --<prefijo>-grade-c: #f59e0b;
  --<prefijo>-grade-d: #ef4444;
  --<prefijo>-brand-purple: #5b0099;
  --<prefijo>-card-radius: 0.75rem;
  --<prefijo>-sidebar-width: 226px;
  --<prefijo>-card-shadow: none;
}

.dark {
  --<prefijo>-bg: #010510;
  --<prefijo>-bg-elevated: #070f1c;
  --<prefijo>-bg-sidebar: #030c1b;
  --<prefijo>-text: #ffffff;
  --<prefijo>-text-muted: #94a3b8;
  --<prefijo>-border: #121a28;
  --<prefijo>-accent-from: #3b82f6;
  --<prefijo>-accent-to: #4f46e5;
  --<prefijo>-accent: #3b82f6;
  --<prefijo>-success: #22c55e;
  --<prefijo>-warning: #f59e0b;
  --<prefijo>-danger: #ef4444;
  --<prefijo>-purple: #8b5cf6;
  --<prefijo>-cyan: #22d3ee;
  --<prefijo>-track: #101827;
  --<prefijo>-chart-serie-a: #2563eb;
  --<prefijo>-chart-serie-b: #613fd8;
  --<prefijo>-nav-active: linear-gradient(90deg, rgba(37, 99, 235, 0.32), rgba(37, 99, 235, 0.48));
  --<prefijo>-nav-active-text: #ffffff;
  --<prefijo>-grade-a: #22c55e;
  --<prefijo>-grade-b: #22c55e;
  --<prefijo>-grade-c: #f59e0b;
  --<prefijo>-grade-d: #ef4444;
  --<prefijo>-card-shadow: none;
}

html {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

body {
  background-color: var(--<prefijo>-bg);
  color: var(--<prefijo>-text);
}

.<prefijo>-gradient-text {
  background: linear-gradient(135deg, var(--<prefijo>-accent-from), var(--<prefijo>-accent-to));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.<prefijo>-gradient-bg {
  background: linear-gradient(135deg, var(--<prefijo>-accent-from), var(--<prefijo>-accent-to));
  color: #ffffff;
}

.<prefijo>-card {
  background: var(--<prefijo>-bg-elevated);
  border: 1px solid var(--<prefijo>-border);
  border-radius: var(--<prefijo>-card-radius);
  box-shadow: var(--<prefijo>-card-shadow);
}

.<prefijo>-entity-name {
  @apply text-base lg:text-lg font-bold tracking-tight truncate;
  color: var(--<prefijo>-text);
}

.<prefijo>-page-title {
  @apply text-xl lg:text-2xl font-bold tracking-tight;
  color: var(--<prefijo>-text);
}

.<prefijo>-pager {
  @apply inline-flex items-center gap-1 rounded-md border px-2 py-1 transition-colors;
  border-color: var(--<prefijo>-border);
  color: var(--<prefijo>-text-muted);
}

.<prefijo>-pager:disabled {
  @apply opacity-40;
}

.<prefijo>-pager-active {
  background: var(--<prefijo>-accent);
  border-color: var(--<prefijo>-accent);
  color: #ffffff;
}

.<prefijo>-page-subtitle {
  @apply text-xs lg:text-sm;
  color: var(--<prefijo>-text-muted);
}

.<prefijo>-accent-soft {
  background: color-mix(in srgb, var(--<prefijo>-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--<prefijo>-accent) 28%, transparent);
  color: var(--<prefijo>-accent);
}

.<prefijo>-nav-active {
  background: var(--<prefijo>-nav-active);
  color: var(--<prefijo>-nav-active-text);
}

/* Buscador tipo pill del mockup (PrimeVue AutoComplete). */
.<prefijo>-search .p-autocomplete-input,
.<prefijo>-search input {
  background: var(--<prefijo>-bg);
  border: 1px solid var(--<prefijo>-border);
  border-radius: 9999px;
  color: var(--<prefijo>-text);
  height: 2.25rem;
  /* Deja sitio a la lupa y al atajo ⌘K superpuestos. */
  padding-left: 2.375rem;
  padding-right: 3.25rem;
  font-size: 0.8125rem;
}

.<prefijo>-search input::placeholder {
  color: var(--<prefijo>-text-muted);
}

.<prefijo>-search input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--<prefijo>-accent) 55%, transparent);
  box-shadow: none;
}

/*
 * Rejilla calcada del diseño.
 *
 * Las fotos de propuesta fijan el reparto en 1536x1024: qué ancho tiene cada
 * columna y qué alto cada fila. Por debajo de `xl` el layout vuelve a ser
 * fluido, que es lo que necesita una pantalla pequeña; a partir de ahí se
 * aplican las medidas exactas que llegan por variables.
 */
@media (min-width: 1280px) {
  /* Clase repetida a propósito: tiene que ganar a las utilidades de columnas
     de Tailwind del breakpoint anterior, que se emiten después. */
  .<prefijo>-grid-h.<prefijo>-grid-h {
    height: var(--<prefijo>-h);
  }

  .<prefijo>-grid-cols.<prefijo>-grid-cols {
    grid-template-columns: var(--<prefijo>-cols);
  }

  .<prefijo>-grid-rows.<prefijo>-grid-rows {
    grid-template-rows: var(--<prefijo>-rows);
  }

  .<prefijo>-grid-mt.<prefijo>-grid-mt {
    margin-top: var(--<prefijo>-mt);
  }

  .<prefijo>-grid-h.<prefijo>-grid-h {
    grid-auto-rows: 100%;
  }

  .<prefijo>-grid-h > * {
    min-height: 0;
    overflow: hidden;
  }
}

/* Mismo mecanismo para el móvil: la foto de diseño fija alturas que en una
   pantalla de teléfono tienen que respetarse para que no aparezca scroll. */
@media (max-width: 1279px) {
  .<prefijo>-mgrid-h.<prefijo>-mgrid-h {
    height: var(--<prefijo>-mh);
  }
}

[data-scroll-area]::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

[data-scroll-area]::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--<prefijo>-text-muted) 35%, transparent);
  border-radius: 9999px;
}

[data-scroll-area]::-webkit-scrollbar-track {
  background: transparent;
}
```

**Nota de fidelidad:** en el original, los cuatro tokens de calificación se llaman `--anka-letter-a` … `--anka-letter-d` y los dos de gráfico `--anka-chart-ventas` / `--anka-chart-deuda`. Aquí se han renombrado a `--<prefijo>-grade-*` y `--<prefijo>-chart-serie-*` porque eran nombres de dominio. **Los valores son idénticos a los reales.** Igualmente, `.anka-company-name` se renombra a `.<prefijo>-entity-name`.

### 7.4 Tabla completa de tokens CSS

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--<prefijo>-bg` | `#ffffff` | `#010510` | Fondo de página (`body`, `bg-<prefijo>-bg`). También el fondo del `<thead>` de las tablas y del input de búsqueda, para que «hundan» respecto a la tarjeta. |
| `--<prefijo>-bg-elevated` | `#ffffff` | `#070f1c` | Fondo de tarjetas (`.<prefijo>-card`) y de la barra superior. En claro coincide con el fondo de página: la separación la da el borde, no el color. |
| `--<prefijo>-bg-sidebar` | `#ffffff` | `#030c1b` | Fondo de la navegación lateral y de la barra inferior en móvil. En oscuro es ligeramente distinto de `bg` y de `elevated`: tres planos de profundidad. |
| `--<prefijo>-text` | `#0f172a` | `#ffffff` | Color de texto primario. |
| `--<prefijo>-text-muted` | `#64748b` | `#94a3b8` | Texto secundario: etiquetas, subtítulos, cabeceras de tabla, pies de fuente. Expuesto como `text-<prefijo>-muted`. |
| `--<prefijo>-border` | `#edeff2` | `#121a28` | Todos los bordes y separadores. Expuesto como `border-<prefijo>-border` y `divide-<prefijo>-border`. |
| `--<prefijo>-accent` | `#2563eb` | `#3b82f6` | Color de acción: enlaces, barras de progreso, estado activo, foco. |
| `--<prefijo>-accent-from` | `#2563eb` | `#3b82f6` | Extremo inicial de los degradados de marca. |
| `--<prefijo>-accent-to` | `#4f46e5` | `#4f46e5` | Extremo final de los degradados. Idéntico en ambos temas. |
| `--<prefijo>-success` | `#16a34a` | `#22c55e` | Semáforo verde: estados correctos, deltas positivos. |
| `--<prefijo>-warning` | `#f59e0b` | `#f59e0b` | Semáforo ámbar: avisos, datos parciales. Idéntico en ambos temas. |
| `--<prefijo>-danger` | `#ef4444` | `#ef4444` | Semáforo rojo: errores, bloqueos, deltas negativos. Idéntico en ambos temas. |
| `--<prefijo>-purple` | `#8b5cf6` | `#8b5cf6` | Acento secundario de tarjetas métricas. Idéntico en ambos temas. |
| `--<prefijo>-cyan` | `#0891b2` | `#22d3ee` | Acento terciario de tarjetas métricas. |
| `--<prefijo>-track` | `#eef1f5` | `#101827` | Fondo de pistas: barras de progreso, selects, iconos en caja, filas al pasar el ratón. |
| `--<prefijo>-chart-serie-a` | `#2563eb` | `#2563eb` | Primera serie de barras. Idéntico en ambos temas. |
| `--<prefijo>-chart-serie-b` | `#7c4ddf` | `#613fd8` | Segunda serie de barras. |
| `--<prefijo>-nav-active` | `#f0f4ff` (color plano) | `linear-gradient(90deg, rgba(37,99,235,.32), rgba(37,99,235,.48))` | Fondo del ítem de navegación activo. **Ojo: en claro es un color y en oscuro un degradado.** Por eso se aplica con `background:` y no con `background-color:`. |
| `--<prefijo>-nav-active-text` | `#1d4ed8` | `#ffffff` | Texto del ítem de navegación activo. |
| `--<prefijo>-grade-a` | `#16a34a` | `#22c55e` | 🟨 Escala de calificación, nivel 1 (mejor). |
| `--<prefijo>-grade-b` | `#16a34a` | `#22c55e` | 🟨 Nivel 2. Idéntico al A en el original. |
| `--<prefijo>-grade-c` | `#f59e0b` | `#f59e0b` | 🟨 Nivel 3. |
| `--<prefijo>-grade-d` | `#ef4444` | `#ef4444` | 🟨 Nivel 4 (peor). |
| `--<prefijo>-brand-purple` | `#5b0099` | *(no redefinido)* | 🟨 Morado corporativo. **Declarado en `:root` y no usado en ninguna parte del repositorio.** Elimínalo o dale un uso. |
| `--<prefijo>-card-radius` | `0.75rem` | *(no redefinido)* | Radio de esquina de todas las tarjetas. Token de medida, no de color. |
| `--<prefijo>-sidebar-width` | `226px` | *(no redefinido)* | 🟥 Declarado y **no usado**: el sidebar codifica su ancho en clases de Tailwind (`w-[238px]`, `w-[4.5rem]`). Es una inconsistencia real del original; ver corrección 18.11. |
| `--<prefijo>-card-shadow` | `none` | `none` | Sombra de tarjeta. Está en `none` en ambos temas; existe como punto de extensión. |

**Variables de layout dinámico** (no son tokens de tema: las fija cada página inline):

| Variable | Fijada por | Consumida por |
|---|---|---|
| `--<prefijo>-h` | `:style="{'--<prefijo>-h': ...}"` en la página | `.<prefijo>-grid-h` (altura ≥ 1280 px) |
| `--<prefijo>-cols` | ídem | `.<prefijo>-grid-cols` (`grid-template-columns`) |
| `--<prefijo>-rows` | ídem | `.<prefijo>-grid-rows` (`grid-template-rows`) |
| `--<prefijo>-mt` | ídem | `.<prefijo>-grid-mt` (`margin-top`) |
| `--<prefijo>-mh` | ídem | `.<prefijo>-mgrid-h` (altura ≤ 1279 px) |

### 7.5 Clases utilitarias propias

🟩 **NÚCLEO REUTILIZABLE.** Son once, y cubren el 90 % del estilo de la app.

| Clase | Qué hace | Dónde se usa |
|---|---|---|
| `.<prefijo>-card` | Tarjeta estándar: fondo elevado, borde de 1 px, radio y sombra del token. **Es la clase más usada del proyecto.** | Toda superficie contenedora. |
| `.<prefijo>-gradient-bg` | Fondo degradado de marca con texto blanco. | Botones de acción primaria de las pantallas de auth. |
| `.<prefijo>-gradient-text` | El mismo degradado recortado al texto (`background-clip: text`). | Titulares de marca. |
| `.<prefijo>-accent-soft` | Pastilla de acento: fondo al 14 % de opacidad, borde al 28 %, texto en acento pleno. Usa `color-mix`. | Chips informativos, botón de tema en móvil. |
| `.<prefijo>-nav-active` | Estado activo de navegación (fondo + color de texto). | Sidebar y bottom nav. |
| `.<prefijo>-page-title` | `text-xl lg:text-2xl font-bold tracking-tight` + color primario. | `PageHeader`. |
| `.<prefijo>-page-subtitle` | `text-xs lg:text-sm` + color atenuado. | `PageHeader`. |
| `.<prefijo>-entity-name` | `text-base lg:text-lg font-bold tracking-tight truncate` + color primario. | Nombre de la entidad activa en la barra superior. |
| `.<prefijo>-pager` | Botón de paginación: inline-flex, borde, padding, transición. | `TableFooter`. |
| `.<prefijo>-pager-active` | Variante seleccionada del paginador (fondo acento, texto blanco). | `TableFooter`. |
| `.<prefijo>-search` | Estiliza el `AutoComplete` de PrimeVue como una píldora, con hueco a izquierda y derecha para la lupa y el atajo superpuestos. | `AppTopbar`. |

**Patrón a imitar — `color-mix` para las variantes de opacidad.** El repositorio no define tokens separados para «verde al 12 %». Los calcula en el momento:

```css
background: color-mix(in srgb, var(--<prefijo>-success) 12%, transparent);
border-color: color-mix(in srgb, var(--<prefijo>-success) 32%, transparent);
```

Esto mantiene la paleta en un solo sitio y funciona igual en ambos temas sin duplicar declaraciones. En las plantillas Vue se usa dentro de `:style` con plantillas de cadena (ver `StatusChip`, sección 12.3). En clases de Tailwind arbitrarias hay que escribirlo **sin espacios**, con guiones bajos:

```html
<div class="bg-[color-mix(in_srgb,var(--<prefijo>-accent)_14%,transparent)]">
```

### 7.6 Tipografía

- **Familia:** Plus Jakarta Sans, auto-hospedada por `@nuxtjs/google-fonts`.
- **Pesos cargados:** 300, 400, 500, 600, 700, 800.
- **Aplicación:** doble. Por CSS (`html { font-family: … }` en `main.css`) y por Tailwind (`theme.extend.fontFamily.sans`). La primera cubre todo el documento por herencia; la segunda hace que la utilidad `font-sans` sea coherente.
- **Escala real usada en el repositorio**, de menor a mayor:

| Clase | Tamaño | Uso típico |
|---|---|---|
| `text-[10px]` | 10 px | Pies de fuente, leyendas de gráfico. |
| `text-[11px]` | 11 px | Etiquetas de KPI, texto de chips, metadatos de fila. |
| `text-xs` | 12 px | Subtítulos, texto secundario, cabeceras de tabla. |
| `text-[13px]` | 13 px | Ítems de navegación, celdas de tabla densas. |
| `text-sm` | 14 px | Cuerpo de tabla, formularios. |
| `text-base` | 16 px | Títulos de tarjeta (`h2`). |
| `text-lg` / `text-xl` | 18 / 20 px | Títulos de página en móvil, valores destacados. |
| `text-2xl` | 24 px | Título de página en escritorio, valor principal de una métrica. |
| `text-3xl` / `text-6xl` | 30 / 60 px | Cifra destacada; código de error en `error.vue`. |

**Convenciones de peso:** `font-medium` (500) para etiquetas, `font-semibold` (600) para títulos de sección y chips, `font-bold` (700) para títulos de página y cifras, `font-black` (900) solo en el código de error.

**Convención de etiqueta:** las etiquetas de campo y de KPI usan sistemáticamente `text-[11px] font-semibold uppercase tracking-wider text-<prefijo>-muted`. Si creas una etiqueta nueva, usa exactamente eso.

**`tabular-nums`:** aplicado a toda cifra que aparezca en columna (scores, fechas, importes) para que los dígitos no bailen entre filas.

### 7.7 Iconografía

Conviven **dos** sistemas, y la frontera está clara:

| Sistema | Cuándo se usa | Cómo |
|---|---|---|
| **PrimeIcons** (`pi pi-*`) | Dentro de componentes de PrimeVue y en pantallas de auth. | `<span class="pi pi-envelope" />`, o la prop `icon="pi pi-sign-in"` de `<Button>`. |
| **`<Prefijo>Icon`** (SVG propio) | Todo el resto de la aplicación: navegación, tarjetas, chips, tablas. | `<<Prefijo>Icon name="home" :size="20" :stroke="1.5" />` |

🟥 **Esto es deuda, no una decisión.** Dos sistemas de iconos significan dos estilos de trazo conviviendo en la misma pantalla. Ver corrección 18.5 para la resolución.

El detalle del componente `<Prefijo>Icon` está en la sección 12.4.

### 7.8 Radios, espaciado y elevación

| Concepto | Valor | Nota |
|---|---|---|
| Radio de tarjeta | `var(--<prefijo>-card-radius)` = `0.75rem` (12 px) | Vía `.<prefijo>-card`. |
| Radio de chip / pastilla | `rounded-full` | Chips de estado, avatar, toggle de tema. |
| Radio de botón e input | `rounded-xl` (12 px) o `rounded-lg` (8 px) | `xl` en auth, `lg` en la app. Inconsistencia menor del original. |
| Radio de caja de icono | `rounded-[12px]` / `rounded-[11px]` / `rounded-[10px]` | Valores arbitrarios tomados del mockup. |
| Padding de tarjeta | `p-4` en escritorio, `p-3` / `p-3.5` en densidad alta | — |
| Padding del `<main>` | `p-3 md:p-6 lg:px-[26px] lg:pt-0 lg:pb-[24px]` | Ver sección 8.1. |
| Separación entre tarjetas | `gap-2.5` (10 px) en móvil, `gap-x-[10px]`/`[15px]` en escritorio | — |
| Elevación | `box-shadow: none` | El design system **no usa sombras**: la jerarquía se expresa con tres niveles de fondo (`bg` / `bg-sidebar` / `bg-elevated`) más el borde. Las únicas sombras son `shadow-2xl` en las tarjetas de auth. |

---

> **Vigente en v2 como sistema visual.** Se copia del original porque el aspecto no cambió. Cualquier frase que hable de `Authorization`, de cookies `auth_token` / `auth_refresh_token`, de un `apiBase` absoluto o de CORS **no se implementa**: la sesión y las llamadas HTTP están en las secciones 10 y 11.

## 8. Layouts y shell de aplicación

### 8.1 `app.vue` — raíz de la aplicación

🟩 **NÚCLEO REUTILIZABLE.** Siete líneas. Establece el fondo, el color de texto, la familia tipográfica y el suavizado para todo el árbol, y delega en el sistema de layouts.

Archivo: `app.vue`

```vue
<template>
  <div class="min-h-screen bg-<prefijo>-bg text-[var(--<prefijo>-text)] font-sans antialiased">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

`<NuxtLayout>` sin prop `name` resuelve el layout declarado por la página en `definePageMeta({ layout })`, o `layouts/default.vue` si no declara ninguno.

### 8.2 `layouts/default.vue` — shell autenticado

🟩 **NÚCLEO REUTILIZABLE** (la línea del store es 🟨). Transcripción literal.

Archivo: `layouts/default.vue`

```vue
<template>
  <div class="min-h-screen flex bg-<prefijo>-bg">
    <AppSidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileSidebarOpen"
      @navigate="mobileSidebarOpen = false"
      @close-mobile="mobileSidebarOpen = false"
      @toggle-collapse="toggleCollapse"
    />

    <div
      class="flex-1 flex flex-col min-w-0 transition-[margin] duration-300"
      :class="sidebarCollapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-[238px]'"
    >
      <AppTopbar @toggle-mobile="mobileSidebarOpen = !mobileSidebarOpen" />

      <main class="flex-1 min-h-0 flex flex-col overflow-y-auto p-3 md:p-6 lg:px-[26px] lg:pt-0 lg:pb-[24px]">
        <slot />
      </main>
    </div>

    <AppBottomNav />
  </div>
</template>

<script setup lang="ts">
const companyStore = useCompanyStore()

const mobileSidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
/** El colapso manual gana sobre el automático por breakpoint. */
const collapseOverridden = ref(false)

function toggleCollapse() {
  collapseOverridden.value = true
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  companyStore.initialize()
  updateSidebarCollapsed()
  window.addEventListener('resize', updateSidebarCollapsed)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSidebarCollapsed)
})

function updateSidebarCollapsed() {
  const width = window.innerWidth
  if (!collapseOverridden.value) {
    sidebarCollapsed.value = width >= 768 && width < 1024
  }
  if (width >= 1024) {
    mobileSidebarOpen.value = false
  }
}
</script>
```

**Cómo leerlo:**

| Elemento | Explicación |
|---|---|
| `min-h-screen flex` | Contenedor raíz en fila: sidebar fijo a la izquierda, columna de contenido a la derecha. |
| `sidebarCollapsed` | Estado del sidebar en escritorio: expandido (238 px) o colapsado (4.5 rem = 72 px). |
| `mobileSidebarOpen` | Estado del drawer off-canvas en móvil y tablet. |
| `collapseOverridden` | **Patrón importante.** Sin esta bandera, el colapso automático por breakpoint pisaría el clic del usuario en cada `resize`. Una vez que el usuario pulsa el botón, el automatismo se desactiva para el resto de la sesión. |
| `lg:ml-[4.5rem]` / `lg:ml-[238px]` | El sidebar es `position: fixed`, luego no ocupa espacio en el flujo. El margen izquierdo del contenido lo compensa. **Los dos valores tienen que coincidir con los anchos del sidebar o aparece solape o hueco.** |
| `transition-[margin] duration-300` | El contenido se desplaza suavemente al colapsar, en sincronía con la transición del sidebar. |
| `min-h-0` en `<main>` | Imprescindible. Sin él, un hijo flex no puede encoger por debajo de su contenido y `overflow-y-auto` nunca se activa: el scroll aparece en el `<body>` y la barra superior `sticky` deja de pegarse. |
| `companyStore.initialize()` en `onMounted` | 🟨 Carga de dominio. En tu app, sustitúyelo por lo que necesites inicializar una sola vez al entrar en la zona autenticada, o elimínalo. |

### 8.3 `layouts/auth.vue` — shell público

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `layouts/auth.vue`

```vue
<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-<prefijo>-bg">
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style="background: var(--<prefijo>-accent-from)" />
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style="background: var(--<prefijo>-accent-to)" />

    <div class="relative w-full max-w-md px-6 py-12 z-10">
      <slot />
    </div>
  </div>
</template>
```

Centrado vertical y horizontal, ancho máximo `max-w-md` (448 px), y dos círculos desenfocados en las esquinas opuestas que dan el ambiente. `overflow-hidden` en el contenedor evita que los círculos generen scroll. Sin lógica.

### 8.4 Comportamiento responsive exacto

Los breakpoints son los de Tailwind por defecto:

| Prefijo | Ancho mínimo |
|---|---|
| (base) | 0 px |
| `sm:` | 640 px |
| `md:` | 768 px |
| `lg:` | 1024 px |
| `xl:` | 1280 px |

Y este es el comportamiento del shell en cada tramo:

| Rango | Sidebar | Barra superior | Bottom nav | Margen del contenido | Padding del `<main>` |
|---|---|---|---|---|---|
| **< 768 px** (móvil) | Oculto (`-translate-x-full`). Se abre como **drawer off-canvas** con el botón hamburguesa, sobre una capa oscura `bg-black/50`. Ancho 238 px. | Alto **48 px**. Muestra hamburguesa + logo + toggle de tema. Oculta el buscador y el botón de usuario. | **Visible.** Cuatro pestañas fijas abajo, con `pb-[env(safe-area-inset-bottom)]`. | `0` | `p-3` |
| **768–1023 px** (tablet) | Oculto igual que en móvil, pero `sidebarCollapsed` se pone a `true` automáticamente. | Alto 48 px. Aparece el bloque de entidad activa (`hidden md:block`). | **Visible.** | `0` | `p-6` |
| **1024–1279 px** (escritorio) | **Visible y fijo** (`lg:translate-x-0`). Expandido a 238 px, o 72 px si el usuario lo colapsó. | Alto **100 px**. Aparecen buscador (`max-w-[290px]`) y botón de usuario. Desaparecen hamburguesa y logo móvil. | **Oculto** (`lg:hidden`). | `lg:ml-[238px]` o `lg:ml-[4.5rem]` | `lg:px-[26px] lg:pt-0 lg:pb-[24px]` |
| **≥ 1280 px** (`xl`) | Igual. | Igual. | Oculto. | Igual. | Igual + se activan las reglas de rejilla fija `.<prefijo>-grid-*`. |

**Detalles de implementación que importan:**

- El sidebar es `fixed inset-y-0 left-0 z-40`. La capa oscura es `z-30`, por debajo. La barra superior es `sticky top-0 z-20`, por debajo de ambos.
- El cambio de estado del sidebar es `transition-transform duration-300`, sincronizado con `transition-[margin] duration-300` del contenido.
- `updateSidebarCollapsed` cierra el drawer móvil (`mobileSidebarOpen = false`) al cruzar los 1024 px: si no, al girar el teléfono quedaría una capa oscura invisible bloqueando los clics.
- El evento `@navigate` del sidebar cierra el drawer al pulsar cualquier enlace. Sin esto, en móvil el drawer se queda abierto tapando la página recién cargada.
- El bottom nav lleva 4 pestañas porque `grid-cols-4` está codificado. Si pones 5 ítems, ajusta la clase.

### 8.5 `components/AppSidebar.vue`

🟩 **NÚCLEO REUTILIZABLE** salvo el array `navItems`, que es 🟨. Transcripción literal.

Archivo: `components/AppSidebar.vue`

```vue
<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-<prefijo>-border bg-<prefijo>-sidebar transition-transform duration-300"
    :class="[
      collapsed ? 'w-[4.5rem]' : 'w-[238px]',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <div class="h-[100px] flex items-center px-4 pt-4 shrink-0">
      <NuxtLink to="/" class="flex items-center gap-2 min-w-0" @click="$emit('navigate')">
        <<Prefijo>Mark :size="collapsed ? 42 : 104" />
        <span v-if="!collapsed" class="text-base font-bold truncate text-[var(--<prefijo>-accent)]">{{ brandSuffix }}</span>
      </NuxtLink>
    </div>

    <nav class="flex-1 px-3 pt-[25px] space-y-[15px] overflow-y-auto">
      <NuxtLink
        v-for="item in visibleNav"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 pl-4 pr-2.5 h-[46px] rounded-lg text-[13px] font-medium transition-colors"
        :class="linkClass(item.to)"
        :title="collapsed ? item.label : undefined"
        @click="$emit('navigate')"
      >
        <<Prefijo>Icon :name="item.icon" :size="20" class="shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <div class="px-5 pt-3 pb-9 flex justify-end">
      <button
        type="button"
        class="w-8 h-8 rounded-lg border border-<prefijo>-border text-<prefijo>-muted flex items-center justify-center hover:text-[var(--<prefijo>-text)] transition-colors"
        :aria-label="collapsed ? 'Expandir menú' : 'Colapsar menú'"
        @click="$emit('toggle-collapse')"
      >
        <<Prefijo>Icon :name="collapsed ? 'chevrons-right' : 'chevrons-left'" :size="14" />
      </button>
    </div>
  </aside>

  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-30 bg-black/50 lg:hidden"
    @click="$emit('close-mobile')"
  />
</template>

<script setup lang="ts">
import type { <Prefijo>IconName } from '~/components/<Prefijo>Icon.vue'

defineProps<{
  collapsed?: boolean
  mobileOpen?: boolean
}>()

defineEmits<{
  navigate: []
  'close-mobile': []
  'toggle-collapse': []
}>()

const route = useRoute()
const { user } = useAuth()

const brandSuffix = '<sufijo de marca, p. ej. "Console">'

const canSeeAdvanced = computed(() => {
  const groups = user.value?.groups || []
  return groups.includes('<ROL_A>') || groups.includes('<ROL_B>')
})

/** 🟨 EJEMPLO DE DOMINIO: sustituye por las rutas de tu aplicación. */
const navItems: Array<{
  to: string
  label: string
  icon: <Prefijo>IconName
  requiresAdvanced?: boolean
  hidden?: boolean
}> = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/seccion-a', label: 'Sección A', icon: 'chart-line' },
  { to: '/seccion-b', label: 'Sección B', icon: 'shield-check' },
  { to: '/listado', label: 'Listado', icon: 'briefcase' },
  { to: '/carga', label: 'Carga de datos', icon: 'file-check', requiresAdvanced: true },
  { to: '/detalle', label: 'Detalle', icon: 'file-check', requiresAdvanced: true, hidden: true },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings' }
]

const visibleNav = computed(() =>
  navItems.filter((item) => {
    if (item.requiresAdvanced && !canSeeAdvanced.value) return false
    return !item.hidden
  })
)

function linkClass(path: string) {
  const active = route.path === path
  return active
    ? '<prefijo>-nav-active font-semibold'
    : 'text-<prefijo>-muted hover:bg-[var(--<prefijo>-track)] hover:text-[var(--<prefijo>-text)]'
}
</script>
```

| Prop / emit | Tipo | Significado |
|---|---|---|
| `collapsed` | `boolean?` | Modo estrecho (solo iconos). |
| `mobileOpen` | `boolean?` | Drawer abierto en móvil. |
| `@navigate` | `[]` | El usuario pulsó un enlace. El layout cierra el drawer. |
| `@close-mobile` | `[]` | El usuario pulsó la capa oscura. |
| `@toggle-collapse` | `[]` | El usuario pulsó el botón de colapsar. |

**Patrón de RBAC en navegación:** `visibleNav` filtra por grupo **antes** de renderizar. Esto es cosmética, no seguridad: el middleware de ruta (sección 9.4) y el backend son quienes realmente protegen. Un ítem con `hidden: true` existe como ruta pero no se lista (se llega a él desde otra pantalla).

### 8.6 Cómo añadir un ítem de navegación

Cuatro pasos, en este orden:

1. **Crear la página.** `pages/mi-ruta.vue` con `definePageMeta({ middleware: ['auth'] })` (añade el rol si procede).
2. **Añadir el nombre del icono** al tipo `<Prefijo>IconName` y su `<template v-else-if>` en `components/<Prefijo>Icon.vue`, si el icono no existe aún.
3. **Añadir la entrada** al array `navItems` de `AppSidebar.vue`:
   ```ts
   { to: '/mi-ruta', label: 'nav.miRuta', icon: 'mi-icono', roles: ['<ROL_D>'] }
   ```
4. **Decidir si va en el bottom nav de móvil.** `AppBottomNav.vue` tiene su propio array `items`, limitado a **4** por el `grid-cols-4`. Si quieres 5, cambia también la clase de la rejilla.

**Trampa habitual:** `linkClass` compara con `route.path === path`, que es igualdad exacta. Una ruta anidada como `/mi-ruta/123` **no** marcará `/mi-ruta` como activa. Si necesitas rutas anidadas, cambia a:

```ts
const active = path === '/' ? route.path === '/' : route.path.startsWith(path)
```

### 8.7 `components/AppTopbar.vue`

🟩 **NÚCLEO** en su estructura; el buscador y el bloque de entidad son 🟨. Transcripción literal.

Archivo: `components/AppTopbar.vue`

```vue
<template>
  <header class="sticky top-0 z-20 h-[48px] lg:h-[100px] border-b border-<prefijo>-border bg-[var(--<prefijo>-bg-elevated)]/90 backdrop-blur-xl">
    <div class="h-full px-4 lg:px-6 flex items-center gap-3">
      <button
        type="button"
        class="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-<prefijo>-muted"
        aria-label="Abrir menú"
        @click="$emit('toggle-mobile')"
      >
        <<Prefijo>Icon name="menu" :size="20" />
      </button>

      <!-- En móvil el sidebar está oculto, así que la marca vive en el topbar. -->
      <NuxtLink to="/" class="lg:hidden flex items-center gap-2 min-w-0">
        <<Prefijo>Mark :size="28" />
        <span class="text-sm font-bold truncate text-[var(--<prefijo>-accent)]">{{ brandSuffix }}</span>
      </NuxtLink>

      <div class="flex-1 min-w-0 flex items-center gap-3">
        <!-- 🟨 EJEMPLO DE DOMINIO: buscador global de entidades. -->
        <div class="relative w-full max-w-[290px] shrink-0 hidden lg:block">
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-<prefijo>-muted">
            <<Prefijo>Icon name="search" :size="15" />
          </span>
          <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-<prefijo>-muted border border-<prefijo>-border rounded px-1.5 py-0.5">
            ⌘K
          </span>
          <AutoComplete
            v-model="searchTerm"
            :suggestions="suggestions"
            option-label="name"
            placeholder="Buscar…"
            class="w-full <prefijo>-search"
            input-class="w-full text-sm pl-10 pr-16 rounded-full"
            @complete="onSearch"
            @item-select="onSelect"
          >
            <template #option="{ option }">
              <div class="py-1">
                <p class="font-medium text-sm">{{ option.name }}</p>
                <p class="text-xs text-<prefijo>-muted">{{ option.id }}</p>
              </div>
            </template>
          </AutoComplete>
        </div>

        <!-- 🟨 EJEMPLO DE DOMINIO: entidad activa. -->
        <div v-if="entityStore.selected" class="hidden md:block min-w-0 max-w-md">
          <p class="<prefijo>-entity-name">{{ entityStore.selected.name }}</p>
          <p class="text-[11px] text-<prefijo>-muted truncate flex items-center gap-1.5">
            <span>{{ entityStore.selectedId }}</span>
            <span
              v-if="entityStore.selected.category"
              class="px-2 py-0.5 rounded-full <prefijo>-accent-soft text-[10px] font-semibold"
            >
              {{ entityStore.selected.category }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-8 shrink-0">
        <ThemeToggle />

        <Menu ref="userMenu" :model="userMenuItems" popup />
        <button
          type="button"
          class="hidden lg:inline-flex items-center gap-2.5 pl-2.5 pr-3 py-1 rounded-full border border-<prefijo>-border hover:border-[var(--<prefijo>-accent-from)] transition-colors"
          @click="toggleUserMenu"
        >
          <span
            class="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
            style="background: var(--<prefijo>-accent)"
          >
            {{ userInitials }}
          </span>
          <span class="hidden sm:block text-xs font-semibold">
            {{ userName }} · {{ userRole }}
          </span>
          <<Prefijo>Icon name="chevron-down" :size="12" class="text-<prefijo>-muted hidden sm:inline" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { EntitySummary } from '~/types/api'

defineEmits<{
  'toggle-mobile': []
}>()

const { user, logout } = useAuth()
const entityStore = useEntityStore()
const userMenu = ref()

const brandSuffix = '<sufijo de marca>'

const searchTerm = ref('')
const suggestions = ref<EntitySummary[]>([])

const userName = computed(() => {
  const fn = user.value?.firstName?.trim()
  const ln = user.value?.lastName?.trim()
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ')
  const full = user.value?.name?.trim()
  if (full) return full
  return 'Usuario'
})

/** Avatar con dos iniciales (p. ej. "AQ"). */
const userInitials = computed(() => {
  const parts = userName.value.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase())
  if (letters.length === 2) return letters.join('')
  return userName.value.slice(0, 2).toUpperCase()
})

const userRole = computed(() =>
  user.value?.groups?.includes('<ROL_B>') ? '<ROL_B>' : '<ROL_A>'
)

const userMenuItems = computed(() => [
  {
    label: user.value?.email || 'Usuario',
    disabled: true
  },
  {
    label: user.value?.groups?.includes('<ROL_B>') ? 'Administrador' : '<ROL_A>',
    disabled: true
  },
  { separator: true },
  {
    label: 'Cerrar sesión',
    icon: 'pi pi-sign-out',
    command: () => logout()
  }
])

function toggleUserMenu(event: Event) {
  userMenu.value?.toggle(event)
}

async function onSearch(event: { query: string }) {
  suggestions.value = await entityStore.search(event.query)
}

function onSelect(event: { value: EntitySummary }) {
  entityStore.select(event.value)
  searchTerm.value = event.value.name
}
</script>
```

🟥 **Dos deudas visibles aquí:**
1. `userRole` asume que cualquiera que no sea `<ROL_B>` es `<ROL_A>`. Si un usuario no pertenece a ningún grupo, la UI le muestra una etiqueta falsa. Deriva el rol de los grupos reales y muestra «Sin rol» si está vacío.
2. El atajo `⌘K` **se pinta pero no está implementado**: no hay ningún listener de teclado en el repositorio. O lo implementas con `useEventListener` sobre `keydown`, o quitas la pastilla.

### 8.8 `components/AppBottomNav.vue`

🟩 **NÚCLEO** (el array `items` es 🟨). Transcripción literal.

Archivo: `components/AppBottomNav.vue`

```vue
<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-<prefijo>-border bg-<prefijo>-sidebar pb-[env(safe-area-inset-bottom)]"
  >
    <ul class="grid grid-cols-4">
      <li v-for="item in items" :key="item.to">
        <NuxtLink
          :to="item.to"
          class="flex flex-col items-center justify-center gap-1 mx-1.5 my-2 py-2 rounded-xl transition-colors"
          :class="
            isActive(item.to)
              ? '<prefijo>-nav-active font-semibold'
              : 'text-<prefijo>-muted'
          "
        >
          <<Prefijo>Icon :name="item.icon" :size="22" />
          <span class="text-[11px] leading-none">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { <Prefijo>IconName } from '~/components/<Prefijo>Icon.vue'

const route = useRoute()

/** Móvil: 4 pestañas; el resto queda en el drawer lateral. */
const items: Array<{ to: string; label: string; icon: <Prefijo>IconName }> = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/seccion-a', label: 'Sección A', icon: 'chart-line' },
  { to: '/seccion-b', label: 'Sección B', icon: 'shield-check' },
  { to: '/listado', label: 'Listado', icon: 'briefcase' }
]

const isActive = (path: string) => route.path === path
</script>
```

`pb-[env(safe-area-inset-bottom)]` añade el relleno del área segura de iOS: sin él, la barra de gestos del iPhone tapa las etiquetas.

🟥 **Deuda:** el bottom nav **no filtra por rol**. Si pusieras una ruta restringida entre las cuatro pestañas, un usuario sin permiso la vería y al pulsarla sería redirigido. Replica el filtro `visibleNav` del sidebar si lo necesitas.

### 8.9 `components/ThemeToggle.vue`

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `components/ThemeToggle.vue`

```vue
<template>
  <!-- Móvil: un solo botón que alterna. Escritorio: la píldora de dos estados. -->
  <button
    type="button"
    class="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl <prefijo>-accent-soft"
    :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
    @click="colorMode.preference = isDark ? 'light' : 'dark'"
  >
    <<Prefijo>Icon :name="isDark ? 'moon' : 'sun'" :size="18" />
  </button>

  <div
    class="hidden lg:inline-flex items-center gap-0.5 p-0.5 rounded-full border border-<prefijo>-border bg-[var(--<prefijo>-bg)]"
  >
    <button
      type="button"
      class="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
      :class="!isDark ? 'bg-[var(--<prefijo>-bg-elevated)] text-[var(--<prefijo>-accent)] shadow-sm' : 'text-<prefijo>-muted'"
      title="Modo claro"
      aria-label="Activar modo claro"
      @click="colorMode.preference = 'light'"
    >
      <<Prefijo>Icon name="sun" :size="15" />
    </button>
    <button
      type="button"
      class="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
      :class="isDark ? 'bg-[color-mix(in_srgb,var(--<prefijo>-accent)_40%,transparent)] text-white' : 'text-<prefijo>-muted'"
      title="Modo oscuro"
      aria-label="Activar modo oscuro"
      @click="colorMode.preference = 'dark'"
    >
      <<Prefijo>Icon name="moon" :size="15" />
    </button>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
</script>
```

**Diferencia clave entre `colorMode.preference` y `colorMode.value`:** `preference` es lo que el usuario eligió (`'light'`, `'dark'` o `'system'`) y es lo que se persiste; `value` es el tema **efectivo** una vez resuelto `'system'`. **Escribe siempre en `preference` y lee siempre de `value`.**

### 8.10 `error.vue`

🟨 **EJEMPLO** con 🟥 deuda incorporada. El original fija colores de Tailwind directamente (`bg-slate-950`, `text-slate-100`, `text-slate-400`), de modo que **la página de error siempre sale oscura**, incluso con el tema claro activo. Esta es la versión corregida, usando tokens:

Archivo: `error.vue`

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-<prefijo>-bg text-[var(--<prefijo>-text)] font-sans p-6 relative overflow-hidden">
    <!-- Luces de ambiente -->
    <div class="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: var(--<prefijo>-accent-from)"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20" style="background: var(--<prefijo>-accent-to)"></div>

    <div class="max-w-md w-full relative z-10 text-center space-y-6">
      <div class="<prefijo>-card p-8 shadow-2xl space-y-6">
        <div
          class="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
          :style="{
            background: 'color-mix(in srgb, var(--<prefijo>-danger) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--<prefijo>-danger) 30%, transparent)',
            color: 'var(--<prefijo>-danger)'
          }"
        >
          <span class="pi pi-exclamation-triangle text-3xl"></span>
        </div>

        <div class="space-y-2">
          <h1 class="text-6xl font-black" style="color: var(--<prefijo>-danger)">
            {{ error.statusCode || 'Error' }}
          </h1>
          <h2 class="text-xl font-bold">
            {{ error.statusCode === 404 ? 'Página no encontrada' : 'Ha ocurrido un error inesperado' }}
          </h2>
          <p class="text-sm text-<prefijo>-muted leading-relaxed">
            {{ error.message || 'La página que buscas no existe o ha ocurrido un problema en el servidor.' }}
          </p>
        </div>

        <button
          @click="handleError"
          class="w-full flex items-center justify-center space-x-2 py-3 px-4 <prefijo>-gradient-bg font-semibold rounded-xl transition-all duration-200 shadow-lg"
        >
          <span class="pi pi-home"></span>
          <span>Volver a inicio</span>
        </button>
      </div>

      <p class="text-xs text-<prefijo>-muted">&copy; <AÑO> <org>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>
```

`clearError({ redirect: '/' })` limpia el estado de error de Nuxt y navega. Es la única forma correcta de salir de `error.vue`: un `navigateTo` a secas dejaría el error activo.

---

## 9. Routing

### 9.1 Convención file-based

Nuxt genera una ruta por cada `.vue` en `pages/`:

| Archivo | Ruta |
|---|---|
| `pages/index.vue` | `/` |
| `pages/login.vue` | `/login` |
| `pages/mi-seccion.vue` | `/mi-seccion` |
| `pages/area/index.vue` | `/area` |
| `pages/area/[id].vue` | `/area/:id` (acceso con `useRoute().params.id`) |
| `pages/[...slug].vue` | catch-all |

**El repositorio original usa exclusivamente páginas planas sin parámetros.** No hay rutas dinámicas ni anidadas. El estado de «qué entidad estoy mirando» vive en un store de Pinia, no en la URL.

🟥 **Es una deuda de diseño.** Consecuencias reales: no se puede compartir un enlace a una entidad concreta, el botón «atrás» no deshace la selección, y recargar pierde el contexto. La propia página de listado del original intenta parchearlo con `<NuxtLink :to="`/?ruc=${row.ruc}`">`, pero **nada lee ese query param**: el enlace no hace nada más que seleccionar la entidad en el store vía `@click`.

**Recomendación firme para el proyecto nuevo:** pon el identificador de la entidad en la URL (`/entidad/[id]/resumen`) y usa el store solo como caché. Si prefieres mantener el patrón del original, al menos sincroniza el store con un query param real.

### 9.2 Tabla de rutas del ejemplo

🟨 **EJEMPLO DE DOMINIO.** Esta es la tabla real del repositorio original, con los nombres traducidos, para que veas la forma de un conjunto de rutas completo.

| Ruta | Archivo | Layout | Middleware | Protección efectiva |
|---|---|---|---|---|
| `/` | `pages/index.vue` | `default` | `'auth'` | Sesión válida |
| `/listado` | `pages/cartera.vue` | `default` | `'auth'` | Sesión válida |
| `/seccion-a` | `pages/desempeno.vue` | `default` | `'auth'` | Sesión válida |
| `/seccion-b` | `pages/riesgo-crediticio.vue` | `default` | `'riesgos'` | 🟥 **Solo rol — no comprueba sesión** |
| `/detalle` | `pages/detalle-letra.vue` | `default` | `'riesgos'` | 🟥 **Solo rol** |
| `/calculadora` | `pages/calculadora-rating.vue` | `default` | `'riesgos'` | 🟥 **Solo rol** |
| `/carga` | `pages/ingesta.vue` | `default` | `['auth', 'riesgos']` | ✅ Sesión + rol |
| `/ajustes` | `pages/parametros.vue` | `default` | `['auth', 'riesgos']` | ✅ Sesión + rol |
| `/login` | `pages/login.vue` | `auth` | `'guest'` | Solo sin sesión |
| `/signup` | `pages/signup.vue` | `auth` | `'guest'` | Solo sin sesión |

**La inconsistencia está marcada a propósito.** Cinco rutas usan solo `'auth'`, tres usan solo `'riesgos'`, y dos usan el array completo. El middleware de rol *sí* llama a `fetchProfile()` si hay token, así que en la práctica funciona, pero **no hace el refresco preventivo del token ni redirige a `/login`**: un usuario sin sesión que entre a `/seccion-b` acaba en `/` en lugar de en el login. Ver corrección 18.2.

### 9.3 `definePageMeta`

Se llama en el `<script setup>` de la página. Es una macro de compilación: Nuxt la extrae en build time, por lo que **no puede usar variables en tiempo de ejecución**.

```ts
definePageMeta({
  layout: 'auth',                 // nombre de archivo en layouts/, sin extensión
  middleware: ['auth', '<ROL_A minúsculas>']  // nombre(s) de archivo en middleware/
})
```

| Clave | Valor | Por defecto |
|---|---|---|
| `layout` | `'default'` \| `'auth'` \| `false` | `'default'` |
| `middleware` | `string` \| `string[]` \| función inline | ninguno |

Los middleware se ejecutan **en el orden del array**, de izquierda a derecha, y el primero que devuelve un `navigateTo` corta la cadena. Por eso `['auth', 'rol']` es el orden correcto: primero se garantiza que hay token y perfil, después se evalúa el grupo.

### 9.4 Cómo proteger una ruta

🆕 **V2.** Esta subsección sustituye a la de la v1. El middleware no lee cookies: le pregunta a la API.

| Página | `definePageMeta` |
|---|---|
| Privada, cualquier usuario con sesión | `{ middleware: 'auth' }` |
| Privada, solo un rol | `{ middleware: ['auth', 'role'] }` y el middleware de rol compara `me.groups` |
| Login y signup | `{ layout: 'auth', middleware: 'guest' }` |

`auth` siempre va primero. El de rol asume que ya hay sesión; si se declara solo, un 401 de `me()` se propaga como error de navegación en vez de ir al login.

Toda página privada lo declara. El middleware es UX: quien llame a la API sin sesión recibe 401 del backend igual. Sirve para no pintar un shell roto.

El código de los tres middleware está en la sección 10 y pasó `nuxt typecheck`. 🆕 V2.3. El sidebar del inversionista y el del backoffice no se mezclan: cada ítem declara `roles` (8.6) y solo se pinta si `me.groups` tiene alguno.

### 9.5 Textos, avisos y tableros

🆕 **V2.2.** Decisiones del ADR-13 del backend, del lado del cliente.

- **Textos.** Ninguna cadena visible va en el `.vue`. Van en `locales/es.json` y se leen con `$t('clave')` (`@nuxtjs/i18n`, un solo locale `es`, `strategy: 'no_prefix'`). Añadir inglés más adelante es otro JSON, no un repaso de las pantallas. Los mensajes de error de la API llegan ya en español y se muestran tal cual.
- **Avisos.** La campana del topbar lee `GET /api/notifications`. Al entrar, y cada 60 segundos mientras la pestaña está visible. Marcar leído es `POST /api/notifications/{id}/read`. No hay WebSocket: el email lo manda el backend al crear el aviso.
- **Tableros.** Los gráficos son los de la sección 13, contra endpoints de agregados. Exportar es un botón que baja el archivo que devuelve la API (CSV, xlsx o PDF). El cliente no arma el PDF.
- **Responsive.** Escritorio primero, usable en el móvil (8.4). No hay modo offline.
- **Después del login.** 🆕 V2.3. El inversionista con `investorStatus` distinto de `enabled` cae en `/onboarding`; con `enabled`, en `/explorar`. Un interno cae en la primera pantalla de su rol (9.6).

### 9.6 Pantallas de PROPIA

🆕 **V2.3.** Salen del prototipo `propia_desktop` (React, solo referencia de flujo: no se copia código) y de la sección 28 del backend.

🆕 **V2.4.** La referencia visual ya no es el prototipo, que era tentativo, sino el canvas `docs/design/propia-canvas.html`: diez pantallas a 1440 × 900 (login, explorar, detalle de propiedad, wallet, mi cartera, secundario, habilitación, depósitos de Tesorería, propiedades de Operaciones y sistema visual), cada una en claro y oscuro. Se abre en el navegador sin build; `?screen=wallet&theme=dark` muestra una sola pantalla. Si el canvas y esta sección discrepan en un valor, manda esta sección. El estilo es de aplicación empresarial: sidebar navy fijo, tablas densas, KPIs en tarjetas, estados con badge y la acción principal arriba a la derecha.

**Identidad visual.** Tokens de la sección 7.4 con `<prefijo>` = `propia`. Inter para toda la interfaz, con `font-variant-numeric: tabular-nums` en importes y KPIs; IBM Plex Mono solo para códigos, cuentas, CCI y números de operación. Fraunces, la serif del prototipo, no se usa. Las dos fuentes se descargan en el build (`googleFonts.download: true`) y sustituyen a Plus Jakarta Sans en `nuxt.config.ts`; la CSP no cambia.

| Token | Claro | Oscuro |
|---|---|---|
| `--propia-bg` | `#F4F6F9` | `#0B1120` |
| `--propia-surface` / `--propia-surface-2` | `#FFFFFF` / `#F8FAFC` | `#111A2C` / `#0E1626` |
| `--propia-line` / `--propia-line-strong` | `#E2E7EF` / `#CDD5E1` | `#1E2A40` / `#2C3A55` |
| `--propia-text` | `#0F1B2D` | `#E5EAF3` |
| `--propia-ink` (títulos y cifras) | `#0A2148` | `#F2F5FA` |
| `--propia-muted` / `--propia-subtle` | `#5B6678` / `#8A94A6` | `#97A3B9` / `#6B7891` |
| `--propia-primary` (botón principal) | `#0A2148` | `#2F6BFF` |
| `--propia-blue` / `--propia-blue-soft` | `#015FFB` / `#E8F0FF` | `#6B9BFF` / `rgba(91,147,255,.14)` |
| `--propia-teal` (texto) / `--propia-teal-solid` | `#0E8A70` / `#1FB89A` | `#34D3AE` / `#1FB89A` |
| `--propia-amber` / `--propia-amber-soft` | `#B45309` / `#FEF3C7` | `#FBBF24` / `rgba(251,191,36,.12)` |
| `--propia-red` / `--propia-red-soft` | `#B42318` / `#FEE4E2` | `#F97066` / `rgba(249,112,102,.12)` |
| `--propia-side-bg` (sidebar) | `#0A2148` | `#080D19` |

El teal de texto es más oscuro que el de relleno en claro para pasar AA sobre blanco. En oscuro las tarjetas no llevan sombra: se separan por el borde.

**Modo claro y oscuro desde la primera versión.** El patrón triple de la sección 7 se usa tal cual, con los valores de la tabla bajo `:root` y `.dark`. En `nuxt.config.ts`, `colorMode` queda `{ classSuffix: '', preference: 'system', fallback: 'light' }`: la primera vez sigue al sistema operativo y después recuerda la elección. El topbar monta `<ThemeToggle />` (8.9) y el login también lo tiene, arriba a la derecha. Cada pantalla nueva se revisa en los dos temas antes de darla por terminada. El título del documento es `PROPIA · Copropiedad inmobiliaria`. El móvil sale responsive a partir de este escritorio (8.4): el sidebar pasa a la barra inferior con Explorar, Secundario, Wallet y Mi cartera.

**Sin sesión** solo existen la landing (`/`, con "¿Cómo funciona?"), `/login`, `/signup`, la recuperación de contraseña y, 🆕 V2.4, `/libro-de-reclamaciones`, que la ley exige accesible sin cuenta. El enlace va en el pie de la landing, del login y de la app. El modo visitante del prototipo, que dejaba ver Explorar y Secundario sin cuenta, **no se implementa**.

**Inversionista** (`<ROL_A>`):

| Ruta | Pantalla | Pide `investorStatus = 'enabled'` |
|---|---|---|
| `/onboarding` | Los 4 pasos (perfil, estado civil, origen de fondos con declaración PEP, poder). El último sale a DocuSign y vuelve a `/onboarding/poder`. 🆕 V2.4: con `investorStatus = 'review'` muestra "Evaluación en curso" y, si Operaciones la observó, el pedido y el botón para subir el sustento | — |
| `/explorar`, `/explorar/[id]` | Propiedades y detalle con el simulador (monto por unidades, cuota ideal, renta mensual estimada). 🆕 V2.4: pestaña Documentos con partida, tasación, contrato de arriendo y estudio de títulos | Solo para "Comprometer" y para ver los documentos |
| `/secundario`, `/secundario/[id]` | Ofertas y detalle | Solo para "Comprar" |
| `/wallet` | Saldos por moneda (disponible, comprometido y en retiro; "Liquidado" del prototipo sigue abierto, Anexo A.2 del backend), movimientos, 🆕 V2.4 estado de cuenta en PDF (mes o año), cargar saldo (cuentas de PROPIA, subir constancia), retirar | Para cargar y retirar |
| `/cartera`, `/cartera/[propertyId]` | Inversiones, renta, gastos, pagos, documentos, vender mi cuota, mi oferta | Para vender |
| `/perfil` | Datos personales, seguridad (contraseña; 🆕 V2.4: sin MFA por ahora), cuentas para recibir retiros, cerrar la cuenta, solicitudes sobre sus datos personales. 🆕 V2.4: `/perfil/sesiones` con los dispositivos conocidos y "Cerrar todas las sesiones"; el perfil pide fecha de nacimiento (mayor de 18) y si es domiciliado en Perú | — |

🆕 V2.4. **Código por email.** Añadir una cuenta de retiro, pedir un retiro, cambiar el email y cerrar la cuenta abren un diálogo que pide `POST /api/security/email-code` y un campo de 6 dígitos; la acción se reenvía con `emailCode`. Un 403 `EMAIL_CODE_REQUIRED` abre el mismo diálogo. Una cuenta de retiro nueva muestra "Disponible para retiros desde …" hasta que pasen 24 h.

🆕 V2.4. La moneda que viene seleccionada en la wallet, los filtros y el simulador es la de `settings.default_currency` (USD). El selector USD / PEN del topbar la cambia y se recuerda en `localStorage`. Los importes se formatean con `Intl.NumberFormat('es-PE', { style: 'currency', currency })`: `US$ 24,000.00` y `S/ 24,000.00`.

Si una acción responde 403 `INVESTOR_NOT_ENABLED`, el cliente lleva al paso del onboarding que falta. Con `investorStatus = 'signing'`, una franja arriba dice qué firma falta (la suya o la del cónyuge). Mientras vuelve de DocuSign, `/onboarding/poder` pide `me()` cada 3 segundos, hasta 2 minutos.

**Backoffice** (`/admin`, layout propio, con el mismo sidebar):

| Ruta | Rol | Pantalla |
|---|---|---|
| `/admin/depositos` | `<ROL_C>` | Cola de depósitos `submitted`: constancia, banco, monto, número de operación (resalta posibles duplicados). Aprobar o rechazar con motivo. 🆕 V2.4: subir el extracto en CSV y confirmar las parejas en lote |
| `/admin/pagos` | `<ROL_C>` | 🆕 V2.4. Pagos del cierre de cada propiedad (vendedor, notaría, registro, alcabala) y retiros de ingresos de PROPIA, con constancia |
| `/admin/retiros` | `<ROL_C>` | Cola de retiros `requested`: cuenta destino. Marcar pagado con constancia, o rechazar |
| `/admin/propiedades`, `/admin/propiedades/[id]` | `<ROL_D>` | Alta y edición, publicar, avanzar el cierre, subir escritura, partida y tasación, valorizaciones |
| `/admin/rentas` | `<ROL_D>` | Período por propiedad: renta bruta, gastos, vista previa del reparto, distribuir. 🆕 V2.4: comisión de administración, fondo de reserva y gastos pagados con la reserva |
| `/admin/secundario` | `<ROL_D>` | Ofertas con comprador: verificar, retracto, notaría, completar |
| `/admin/inversionistas` | `<ROL_D>`, `<ROL_B>` | Estado del onboarding, poderes, rechazos, subir constancias de retención. 🆕 V2.4: el Admin suspende, reactiva o marca fallecido, con motivo |
| `/admin/cumplimiento` | `<ROL_E>` | 🆕 V2.4. Cola de evaluación PLAFT (riesgo sugerido, listas consultadas, sustento; aprobar, observar o rechazar) y alertas de operaciones inusuales |
| `/admin/reclamaciones` | `<ROL_B>` | 🆕 V2.4. Hojas del libro de reclamaciones y solicitudes sobre datos personales, con los días que quedan para responder |
| `/admin` | `<ROL_B>` | 🆕 V2.4. Tablero de tareas del Admin: plazos vencidos (ampliar o confirmar la compra de PROPIA), cancelaciones propuestas y segundas aprobaciones |
| `/admin/usuarios`, `/admin/configuracion` | `<ROL_B>` | Internos (🆕 V2.4: se invitan por email con su grupo; la pantalla no deja combinar grupos incompatibles), cuentas bancarias de PROPIA, comisión, ventana interna, retracto, umbrales de doble aprobación |

El middleware `role` (10.4) lee `to.meta.roles`. Un interno que entra a `/` va a la primera pantalla de su rol. 🆕 V2.4: sin MFA por ahora, ni para internos.


---
## 10. Autenticación en el cliente, end to end

🆕 **V2.** El backend emite las cookies. Este código no las crea, no las lee y no las refresca a mano más que llamando a `POST /api/auth/refresh`.

### 10.1 Qué se guarda en el cliente

Nada secreto. El estado de UI es el resultado de `GET /api/auth/me`:

| Campo | Uso |
|---|---|
| `sub` | Identificador. No se muestra |
| `email`, `firstName`, `lastName` | El shell (nombre en la barra) |
| `groups` | Qué ítems de navegación se pintan. No es la autorización: esa la vuelve a hacer el backend |
| `userStatus` | `active`, `blocked`, `observed`, `rejected`. `unknown` solo si la fila no existe; el backend responde 401 antes en ese caso |
| `sessionExpiresAt` | Informativo. No se usa para decidir un refresh: el 401 lo decide |

### 10.2 Recorrido de login

1. `POST /api/auth/login` con `{ email, password }`.
2. Si el cuerpo es `{ status: "authenticated", expiresAt }`, las cookies ya viajaron en la respuesta. Se llama a `me()` y se navega a `redirect` o a `/`.
3. Si el cuerpo es `{ status: "challenge", challenge }`, se queda en la pantalla de login y se muestra el paso que toque:
   - `SOFTWARE_TOKEN_MFA` o `EMAIL_OTP`: un campo de código, luego `POST /api/auth/challenge` con `{ code }`.
   - `MFA_SETUP`: primero `POST /api/auth/challenge/mfa-setup` sin código para obtener `{ secretCode, otpauthUri }` y pintar el QR; después el mismo endpoint con `{ code }`.
   - `NEW_PASSWORD_REQUIRED`: un campo de contraseña nueva, `POST /api/auth/challenge` con `{ newPassword }`.
4. Cada respuesta de reto vuelve a ser `authenticated` o `challenge`. Se repite hasta autenticar. El estado del reto vive en la cookie `__Host-…_mfa` (o `<app-short>_mfa` en local), que el cliente no lee.
5. `POST /api/auth/logout` y navegación a `/login`. El backend revoca el refresh aunque el access haya caducado.

Signup, confirmación, reenvío, olvidé la contraseña y confirmación de contraseña son `POST /api/auth/signup`, `/confirm`, `/resend-code`, `/forgot-password`, `/confirm-password`. Son públicas. El enlace de términos sale de `GET /api/auth/terms-link`.

### 10.3 Clasificación de errores

| HTTP | Qué hace el cliente |
|---|---|
| 401 en una ruta que no es `/auth/*` | Un solo `POST /api/auth/refresh` para toda la pestaña, y reintenta la llamada original una vez. Si el refresh falla, al login |
| 401 en login o en el refresh | Mensaje de credenciales o de sesión caducada. No se intenta refrescar un refresh |
| 403 | No es una sesión caducada. Si `userStatus` no es `active`, se dice. No se borra una sesión que el backend acaba de rechazar por rol: se avisa |
| 502, 503, 504 | "Ahora mismo no se puede". No se manda al login. Un 503 de base de datos, en el backend, es exactamente el caso en el que la sesión sigue siendo válida |
| 400 | El `message` del cuerpo (string o lista de validación) |
| 409 | Conflicto de negocio, el `message` |

Cinco llamadas que reciben 401 a la vez comparten una promesa. Si cada una refrescara, la rotación de Cognito invalidaría a las demás fuera de la ventana de 10 segundos.

### 10.4 Código verificado

🆕 **V2.1.** Cambiaron y no se volvieron a ejecutar: `Me` y `SessionBody` salen del contrato generado (11.9), `statusOf` se movió a `utils/http.ts`, y `useApi` manda `x-request-id` en toda llamada e `Idempotency-Key` en los `POST`. La lógica de refresh (un solo intento, una sola promesa por pestaña) es la verificada.

```ts
// utils/http.ts
import type { components } from '~/types/api.gen'

/** Clasificación de status que el cliente debe tratar distinto. */
export type HttpClass = 'ok' | 'refresh' | 'forbidden' | 'unavailable' | 'error'

export function classifyHttp(status: number): HttpClass {
  if (status >= 200 && status < 300) return 'ok'
  if (status === 401) return 'refresh'
  if (status === 403) return 'forbidden'
  if (status === 502 || status === 503 || status === 504) return 'unavailable'
  return 'error'
}

/** 🆕 V2.1. Perfil de `GET /api/auth/me` tal como lo publica el backend (11.9). */
export type Me = components['schemas']['MeResponseDto']

type SessionDto = components['schemas']['SessionResponseDto']

/**
 * El DTO del backend lleva `expiresAt` y `challenge` opcionales en un mismo objeto.
 * La unión dice cuál viene según `status`, y obliga a mirar `status` antes de leerlos.
 */
export type SessionBody =
  | { status: 'authenticated'; expiresAt: string }
  | { status: 'challenge'; challenge: NonNullable<SessionDto['challenge']> }

export function statusOf(err: unknown): number {
  return typeof err === 'object' && err && 'status' in err ? Number(err.status) : 0
}

export function isAuthenticated(body: SessionBody): body is { status: 'authenticated'; expiresAt: string } {
  return body.status === 'authenticated'
}

/** Una sola promesa en vuelo: cinco 401 a la vez refrescan una vez. */
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | null = null
  return () => {
    if (!inflight) {
      inflight = fn().finally(() => {
        inflight = null
      })
    }
    return inflight
  }
}
```


```ts
// utils/http.test.ts
import { describe, expect, it, vi } from 'vitest'
import { classifyHttp, isAuthenticated, singleFlight, type SessionBody } from './http'

describe('classifyHttp', () => {
  it('un 401 se refresca y un 403 no cierra la sesión por caducidad', () => {
    expect(classifyHttp(401)).toBe('refresh')
    expect(classifyHttp(403)).toBe('forbidden')
    expect(classifyHttp(503)).toBe('unavailable')
    expect(classifyHttp(400)).toBe('error')
    expect(classifyHttp(200)).toBe('ok')
  })
})

describe('isAuthenticated', () => {
  it('separa sesión de reto', () => {
    const session: SessionBody = { status: 'authenticated', expiresAt: '2026-10-07T00:00:00.000Z' }
    const challenge: SessionBody = { status: 'challenge', challenge: 'SOFTWARE_TOKEN_MFA' }
    expect(isAuthenticated(session)).toBe(true)
    expect(isAuthenticated(challenge)).toBe(false)
  })
})

describe('singleFlight', () => {
  it('comparte la promesa mientras está en vuelo', async () => {
    const fn = vi.fn(async () => 'ok')
    const run = singleFlight(fn)
    const [a, b] = await Promise.all([run(), run()])
    expect(a).toBe('ok')
    expect(b).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
```


```ts
// composables/useApi.ts
import { addBreadcrumb } from '@sentry/vue'
import { classifyHttp, statusOf, type Me, type SessionBody } from '~/utils/http'

type FetchOptions = NonNullable<Parameters<typeof $fetch>[1]>

// Una sola promesa para toda la pestaña. Si viviera dentro de useApi(),
// cada componente tendría su propio candado y cinco 401 seguirían disparando cinco refresh.
let refreshInflight: Promise<void> | null = null

function refreshOnce(baseURL: string): Promise<void> {
  if (!refreshInflight) {
    refreshInflight = $fetch('/auth/refresh', { baseURL, method: 'POST', credentials: 'include' }).then(
      () => undefined,
      (err: unknown) => {
        throw err
      },
    ).finally(() => {
      refreshInflight = null
    })
  }
  return refreshInflight
}

/**
 * Cliente HTTP del SPA. No lee ni guarda tokens: la sesión va en cookies
 * httpOnly que el navegador adjunta porque la llamada es al mismo origen.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const method = String(options.method ?? 'GET').toUpperCase()
    const headers = new Headers(options.headers as HeadersInit | undefined)
    // El backend reutiliza este id en su log, su error y su auditoría (9.2 del backend).
    const requestId = crypto.randomUUID()
    headers.set('x-request-id', requestId)
    // Una clave por operación, no por intento: el reintento tras el refresh lleva la misma
    // y el backend no crea dos veces (9.6 del backend). /auth/* es público y no la usa.
    if (method === 'POST' && !path.startsWith('/auth/') && !headers.has('idempotency-key')) {
      headers.set('idempotency-key', crypto.randomUUID())
    }
    const send = async () =>
      (await $fetch(path, { ...options, headers, baseURL, credentials: 'include' })) as T

    try {
      try {
        return await send()
      } catch (err: unknown) {
        if (classifyHttp(statusOf(err)) !== 'refresh' || path.startsWith('/auth/')) throw err
        await refreshOnce(baseURL)
        return await send()
      }
    } catch (err: unknown) {
      // Sin Sentry inicializado es un no-op. Con Sentry, el próximo error del navegador
      // lleva los requestId de las llamadas que fallaron antes (11.10).
      addBreadcrumb({
        category: 'api',
        level: 'warning',
        message: `${method} ${path}`,
        data: { status: statusOf(err), requestId },
      })
      throw err
    }
  }

  return {
    api,
    login: (body: { email: string; password: string }) =>
      api<SessionBody>('/auth/login', { method: 'POST', body }),
    challenge: (body: { code?: string; newPassword?: string }) =>
      api<SessionBody>('/auth/challenge', { method: 'POST', body }),
    mfaSetup: (body: { code: string }) =>
      api<SessionBody>('/auth/challenge/mfa-setup', { method: 'POST', body }),
    me: () => api<Me>('/auth/me'),
    logout: () => api<void>('/auth/logout', { method: 'POST' }),
  }
}
```


```ts
// middleware/auth.ts
import { classifyHttp } from '~/utils/http'

export default defineNuxtRouteMiddleware(async (to) => {
  const api = useApi()
  try {
    await api.me()
  } catch (err: unknown) {
    const status = typeof err === 'object' && err && 'status' in err ? Number(err.status) : 0
    const motivo = classifyHttp(status) === 'forbidden' ? 'bloqueado' : classifyHttp(status) === 'unavailable' ? 'no-disponible' : 'sesion'
    return navigateTo({ path: '/login', query: { motivo, redirect: to.fullPath } })
  }
})
```


```ts
// middleware/guest.ts
export default defineNuxtRouteMiddleware(async () => {
  const api = useApi()
  try {
    await api.me()
  } catch {
    return
  }
  return navigateTo('/')
})
```


```ts
// middleware/role.ts
import type { Me } from '~/utils/http'

/** 🆕 V2.3. La página declara `definePageMeta({ middleware: ['auth', 'role'], roles: [...] })`. */
export default defineNuxtRouteMiddleware(async (to) => {
  const required = (to.meta.roles as string[] | undefined) ?? []
  if (required.length === 0) return
  const api = useApi()
  const me: Me = await api.me()
  if (!required.some((r) => me.groups.includes(r))) {
    return navigateTo('/')
  }
})
```


El middleware `role.ts` compara contra los grupos reales (`<ROL_A>`, `<ROL_B>`, `<ROL_C>`, `<ROL_D>`, `<ROL_E>`) tal como están en Cognito, no contra una versión en minúsculas inventada. El original comparaba grupos pasados a minúsculas y el backend no: se comparan como llegan en `me.groups`.

`auth.ts` y `guest.ts` están referenciados por las páginas del esqueleto (`pages/index.vue` con `middleware: 'auth'`, `pages/login.vue` con `middleware: 'guest'`) y entraron en el typecheck.

### 10.5 Contrato que el cliente usa

La fuente de verdad de esta tabla es `types/api.gen.ts` (11.9). Si los dos discrepan, manda el archivo generado y esta tabla se corrige.

Rutas bajo `/api`. Cuerpo de error siempre `{ statusCode, message, requestId, timestamp, path }`. El `requestId` se muestra en el mensaje de error inesperado para que soporte pueda buscar la línea de log.

| Método y ruta | Body | Respuesta |
|---|---|---|
| `POST /auth/login` | `{ email, password }` | `{ status: "authenticated", expiresAt }` o `{ status: "challenge", challenge }` |
| `POST /auth/challenge` | `{ code }` o `{ newPassword }` | La misma unión |
| `POST /auth/challenge/mfa-setup` | `{}` y luego `{ code }` | `{ secretCode, otpauthUri }` y luego la unión de sesión |
| `POST /auth/refresh` | vacío | 200 vacío de tokens. Las cookies nuevas vienen en `Set-Cookie` |
| `POST /auth/logout` | vacío | `{ message }` |
| `POST /auth/logout-all` | vacío | `{ message }` |
| `GET /auth/me` | — | `Me` (10.1) |
| `GET /auth/terms-link` | — | `{ url }` |
| `POST /auth/signup` | email, password, firstName, lastName, acceptedTerms, phone opcional | `{ message }` |
| `POST /auth/confirm` | `{ email, code }` | `{ message }` |
| `POST /auth/resend-code` | `{ email }` | `{ message }` |
| `POST /auth/forgot-password` | `{ email }` | `{ message }` |
| `POST /auth/confirm-password` | `{ email, code, newPassword }` | `{ message }` |

La contraseña, en signup y en el cambio, es la misma regla que Cognito: 12 a 128 caracteres, mayúscula, minúscula, número y un carácter que no sea letra ni número. Se valida en el cliente para no dar un rodeo, y el backend la vuelve a validar.

No se decodifica el JWT en el cliente. No hay librería `jwt-decode` en el `package.json`. El `exp` no se consulta: cuando el access caduca, la siguiente llamada recibe 401 y el refresh ocurre entonces. El margen de "refrescar cinco minutos antes" de la v1 obligaba a leer el token.

---
## 11. Capa de datos

### 11.1 El cliente

🆕 **V2.** `useApi().api(path, options)` es la única forma de hablar con el backend. `path` es relativo a `/api` (`'/projects'`, no `'/api/projects'` y no una URL absoluta). `credentials: 'include'` va dentro del composable; repetirlo en cada llamada es innecesario y olvidarlo en un `$fetch` suelto es el bug.

```ts
import type { components, paths } from '~/types/api.gen'

type ProjectPage = paths['/api/projects']['get']['responses'][200]['content']['application/json']
type Project = components['schemas']['ProjectDto']

const api = useApi()
const page = await api.api<ProjectPage>('/projects', { query: { limit: 20, offset: 0, q: search } })
// page.items: Project[], page.total, page.limit, page.offset
```

La envoltura de listado es la de `PageDto` del backend: `{ items, total, limit, offset }`. `limit` máximo 100, `offset` desde 0. El número de páginas lo calcula la UI (`Math.ceil(total / limit)`). La v2.0 de este documento decía `{ data, meta }`, que el backend nunca devolvió: es el error que el contrato generado convierte en un fallo de `pnpm typecheck` (11.9).

La clave de `paths` es la ruta completa del OpenAPI, con el prefijo (`/api/projects`). El argumento de `api.api()` sigue siendo relativo a `apiBase` (`/projects`).

No se usa `useFetch` ni `useAsyncData` para datos autenticados. Tienen su propio `$fetch` y no pasan por el refresh de `useApi`. En un SPA tampoco aportan la deduplicación de SSR que justifica su existencia.

Un 401 lo resuelve `useApi`. La página solo distingue 403, 503 y 400 para pintar el mensaje, y enseña `requestId` cuando el status es 5xx.

Un `POST` lleva su `Idempotency-Key` sin que la página haga nada. El botón de "Crear" se deshabilita mientras la promesa está en vuelo, pero el backend ya no depende de eso: un doble clic que se cuela produce un `201` con el mismo recurso, no un duplicado ni un 409. Si la página reintenta por su cuenta después de un error de red, pasa la misma clave en `headers` para que el backend la reconozca:

```ts
const key = crypto.randomUUID()
const create = () => api.api<Project>('/projects', { method: 'POST', body, headers: { 'idempotency-key': key } })
```

### 11.2 Subida de documentos

El `POST /api/documents/uploads` devuelve la URL prefirmada y las cabeceras que hay que mandar (`Content-Type`, `Content-Length`, `x-amz-checksum-sha256`). El `PUT` de los bytes va **a esa URL de S3**, no a `/api`, así que no pasa por `useApi` y no lleva la cookie. Es un `fetch` suelto, a propósito, y es el único `fetch` suelto permitido. En local no hay S3: el backend expone `PUT /api/documents/:id/content` y ese sí pasa por `useApi`, con el binario en el body.

### Lo que sigue es del original y sigue vigente

Formato de números e importes, países, cuándo usar Pinia y el store de ejemplo. El `useApi` descrito más arriba en el original (Bearer, `apiFetch`) no está en este extracto.

### 11.3 Cuándo Pinia y cuándo `useState`

| Herramienta | Úsala para | No la uses para |
|---|---|---|
| **`ref()` local en la página** | Datos que solo le interesan a esa pantalla y se recargan al entrar. **Es el caso por defecto, el 90 % de las veces.** | Nada que otra pantalla necesite leer. |
| **`useState('clave')`** | Un valor único compartido por toda la app, sin lógica asociada. Es un `ref` global con clave. Lo usa `useAuth` para `user`. | Estado con varias acciones y getters: se vuelve inmanejable. |
| **Pinia (`defineStore`)** | Un conjunto de estado + acciones + getters que viven juntos y se consumen desde varias pantallas: selección global, filtros persistentes, carrito, caché de búsqueda. | Datos de una sola pantalla. Un store por página es un antipatrón. |

**Regla práctica:** empieza con `ref` local. Promociona a `useState` cuando un segundo componente lo necesite. Promociona a Pinia cuando además aparezcan acciones.

### 11.4 El store de ejemplo

🟨 **EJEMPLO DE DOMINIO.** Es el store de selección global del original, con los nombres generalizados. El **patrón** es lo reutilizable: selección + búsqueda con estado + inicialización idempotente.

Archivo: `stores/entity.ts`

```ts
import { defineStore } from 'pinia'
import type { EntitySummary } from '~/types/api'

const DEFAULT_ID = '<id por defecto>'
const DEFAULT_ENTITY: EntitySummary = {
  id: DEFAULT_ID,
  name: '<nombre por defecto>',
  category: '<categoría>'
}

export const useEntityStore = defineStore('entity', () => {
  const selectedId = ref(DEFAULT_ID)
  const selected = ref<EntitySummary>({ ...DEFAULT_ENTITY })
  const searchResults = ref<EntitySummary[]>([])
  const searchLoading = ref(false)
  const searchError = ref<string | null>(null)

  const label = computed(() => {
    if (!selected.value) {
      return selectedId.value
    }
    return `${selected.value.name} · ${selected.value.id}`
  })

  function select(entity: EntitySummary) {
    selectedId.value = entity.id
    selected.value = entity
  }

  async function search(query: string) {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      searchResults.value = []
      return []
    }

    searchLoading.value = true
    searchError.value = null

    try {
      const { api } = useApi()
      const results = await api<EntitySummary[]>('/entities/search', {
        query: { q: trimmed, limit: 10 }
      })
      searchResults.value = results
      return results
    } catch (err: any) {
      searchError.value = err?.data?.message || 'No se pudo buscar.'
      searchResults.value = []
      return []
    } finally {
      searchLoading.value = false
    }
  }

  async function initialize() {
    if (selected.value?.id === selectedId.value) {
      return
    }

    const results = await search(selectedId.value)
    const match = results.find((item) => item.id === selectedId.value)
    if (match) {
      select(match)
    }
  }

  return {
    selectedId,
    selected,
    searchResults,
    searchLoading,
    searchError,
    label,
    select,
    search,
    initialize
  }
})
```

**Lo que debes imitar:**
- **Sintaxis de setup store** (`defineStore('id', () => {...})`), no la de opciones. Es la misma que `<script setup>`: `ref` para estado, `computed` para getters, funciones para acciones.
- **El estado de búsqueda vive en el store**, no en el componente: `searchLoading` y `searchError` junto a `searchResults`.
- **`search` devuelve el resultado *y* lo guarda.** El llamante puede usar el valor de retorno sin leer el store.
- **Umbral mínimo de consulta** (2 caracteres) antes de llamar al API.
- **`initialize()` es idempotente.** Comprueba si ya está resuelto y sale. Lo llama el layout en `onMounted`, que se ejecuta una vez por montaje; sin la guarda, cada navegación con remontaje del layout dispararía una petición.
- **`useApi()` se llama dentro de la acción**, no en el cuerpo del store. Llamarlo en el cuerpo lo ejecutaría durante la instalación del plugin de Pinia, antes de que el contexto de Nuxt esté listo.

**Lo que NO debes imitar:** 🟥 `DEFAULT_ID` / `DEFAULT_ENTITY` codifican una entidad concreta y real. Arrancar con una entidad arbitraria preseleccionada es una decisión de demo. En tu app, arranca con `null` y obliga a seleccionar, o lee la selección de la URL.

### 11.5 Por qué `stores/auth.ts` es deuda y NO debe copiarse

🟥 **NO COPIAR BAJO NINGÚN CONCEPTO.** El repositorio original contiene un store de Pinia llamado `stores/auth.ts` (115 líneas) que es un **huérfano del andamiaje inicial**. Coexiste con `composables/useAuth.ts` y hace, mal, lo mismo.

**Evidencia de que está muerto:** la búsqueda de `useAuthStore` en todo el repositorio devuelve **una sola** ocurrencia: su propia declaración. Ninguna página, componente, middleware ni plugin lo importa.

**Por qué es peligroso dejarlo:**

| Problema | Detalle |
|---|---|
| **Llama a endpoints que no existen** | Usa `POST /auth/register` (el backend expone `/auth/signup`) y `GET /auth/me` (el backend expone `/auth/profile`). Si alguien lo usara, fallaría con 404. |
| **Espera un contrato distinto** | Lee `response.token` y `response.user`; el backend devuelve `{ accessToken, idToken, refreshToken, … }`. |
| **Compite por la misma cookie** | Declara `useCookie('auth_token')` con `maxAge: 60*60*24*7` (una semana) frente a los 3600 s de `useAuth`. **Dos escritores de la misma cookie con políticas distintas.** Quien escriba último gana, y el resultado depende del orden de ejecución. |
| **No tiene refresh token** | No guarda refresh ni email: una sesión creada por este store no se puede refrescar nunca. |
| **Modelo de usuario incompatible** | `{id, email, name?, role?}` con un `role` en singular, frente a `groups: string[]`. Todo el RBAC se basa en `groups`. |
| **Navega desde el store** | Hace `navigateTo('/')` dentro de la acción, acoplando el store al router. |
| **Confunde al siguiente que llegue** | Un desarrollador (o un agente) que busque «login» encuentra dos implementaciones y no tiene forma de saber cuál es la buena sin leer las dos enteras. |

**Acción:** en el proyecto nuevo **no crees `stores/auth.ts`**. Hay exactamente un módulo de autenticación y es `composables/useAuth.ts`.

### 11.6 `types/api.ts`

🆕 **V2.1.** Lo que devuelve o recibe el backend ya no se escribe a mano: sale de `types/api.gen.ts` (11.9). `types/api.ts` se queda con los tipos que solo existen en la UI (filas de tabla ya formateadas, opciones de un gráfico) y con alias cortos sobre los generados (`export type Project = components['schemas']['ProjectDto']`). La convención de `| null` de abajo sigue valiendo: el generador emite `| null` donde el backend declaró `nullable: true`.

🟨 **EJEMPLO.** El original define aquí todos los contratos del backend como interfaces: resúmenes de entidad, filas de tabla, KPIs, series de gráfico, documentos, parámetros. Unas 25 interfaces en 204 líneas.

**El patrón a replicar:**

```ts
// Uniones literales para los enumerados del backend
export type QualityStatus = 'OK' | 'WARNING' | 'ERROR' | 'INSUFFICIENT_DATA' | 'MANUAL_REVIEW'

// Campos que pueden faltar se tipan explícitamente como `| null`, no como opcionales a secas
export interface KpiItem {
  id: string
  label: string
  value: number | string | null   // ← null significa "sin dato", distinto de 0
  unit?: string | null
  quality: QualityStatus
  signal?: 'green' | 'amber' | 'red' | null
}

// Las series de gráfico admiten huecos
export interface ChartSeries {
  name: string
  data: (number | null)[]
}
```

**La convención importante:** `number | null` para «no hay dato», nunca `0`. La UI distingue los dos casos (`—` frente a `0`) y la diferencia es significativa. Si tu dominio tiene esa propiedad, cópiala.

**`types/` no se auto-importa.** Siempre `import type { X } from '~/types/api'`.

### 11.7 `utils/format.ts`

🟩 **NÚCLEO REUTILIZABLE** (adaptando locale y moneda). Transcripción literal.

Archivo: `utils/format.ts`

```ts
const numberFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 2
})

const currencyPen = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0
})

const currencyUsd = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

export function displayValue(
  value: number | string | null | undefined,
  fallback = '—'
): string {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  return String(value)
}

export function displayNumber(
  value: number | null | undefined,
  options?: { suffix?: string; decimals?: number }
): string {
  if (value === null || value === undefined) {
    return '—'
  }

  const formatted =
    options?.decimals !== undefined
      ? value.toFixed(options.decimals)
      : numberFormatter.format(value)

  return options?.suffix ? `${formatted}${options.suffix}` : formatted
}

export function displayPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }
  return `${numberFormatter.format(value)}%`
}

export function displayCurrency(
  value: number | null | undefined,
  currency: 'PEN' | 'USD' = 'PEN'
): string {
  if (value === null || value === undefined) {
    return '—'
  }
  return currency === 'USD' ? currencyUsd.format(value) : currencyPen.format(value)
}

export function abbreviateHash(hash?: string | null, length = 8): string {
  if (!hash) {
    return '—'
  }
  return hash.length <= length ? hash : `${hash.slice(0, length)}…`
}
```

**Por qué merece la pena copiarlo:**
- Los formateadores de `Intl` se crean **una sola vez a nivel de módulo**. Instanciar un `Intl.NumberFormat` en cada render es medible en una tabla de 500 filas.
- **Todas las funciones devuelven `'—'` ante `null`/`undefined`.** Esa guión largo (em dash) es el símbolo canónico de «sin dato» en toda la app. Un único punto de decisión.
- Ajusta el locale (`'es-PE'`) y las monedas a tu caso. El resto se copia tal cual.

🟥 **Deuda a no replicar:** varios componentes del original (`MetricTile`, `KpiPremium`, y las propias páginas) **redefinen su propia `abbrevPen`** en lugar de usar estas funciones, y hay **tres copias** de esa función con pequeñas diferencias. Centraliza el formateo aquí desde el principio.

### 11.8 `utils/countries.ts`

🟩 **NÚCLEO REUTILIZABLE** si tu formulario de registro pide teléfono. 200 líneas, ~195 países:

```ts
export interface Country {
  name: string
  code: string
  dialCode: string
  flag: string
}

export const countries: Country[] = [
  { name: "Perú", code: "PE", dialCode: "+51", flag: "🇵🇪" },
  { name: "Afganistán", code: "AF", dialCode: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dialCode: "+355", flag: "🇦🇱" },
  // … ~192 entradas más, en orden alfabético español
]
```

**Dos detalles:** el país local va **primero**, fuera del orden alfabético, para que sea el valor por defecto del `<select>`; y la bandera es el emoji Unicode, no una imagen, así que no requiere assets.

### 11.9 Tipos generados desde el OpenAPI

🆕 **V2.1.** El backend commitea su contrato en `openapi/openapi.json` (17.4 del backend). `pnpm api:types` lo descarga de `main` y escribe `types/api.gen.ts` con [openapi-typescript](https://openapi-ts.dev). El archivo generado se commitea y no se edita a mano.

```
pnpm api:types                                                          # desde main del backend
OPENAPI_URL=../<app>/openapi/openapi.json pnpm api:types                # desde una rama local del backend
```

Lo que exporta, y cómo se usa:

| Export | Qué es | Ejemplo |
|---|---|---|
| `components['schemas']` | Cada DTO del backend, por el nombre de su clase | `components['schemas']['ProjectDto']` |
| `paths` | Cada ruta con sus parámetros, cuerpos y respuestas por status | `paths['/api/projects']['get']['responses'][200]['content']['application/json']` |

No se usa un cliente generado (`openapi-fetch`, `orval`). Toda llamada tiene que pasar por `useApi` (10.4), con su refresh, su `x-request-id` y su `Idempotency-Key`, y un segundo cliente HTTP es justo lo que la sección 18.1 prohíbe. Lo generado son solo tipos: no añade un byte al bundle.

**CI lo exige.** El job `verify` corre `pnpm api:types` contra `main` del backend y falla si `types/api.gen.ts` cambió. Lo que eso significa:

- Un cambio de contrato en el backend hace fallar el siguiente PR del frontend, aunque ese PR no toque la API. Es a propósito. El arreglo es `pnpm api:types`, commitear el archivo, y corregir lo que `pnpm typecheck` señale en el mismo PR.
- El backend rompe el contrato solo con la etiqueta `contract-breaking` (17.4 del backend). Cuando esa etiqueta aparece, el frontend se adapta primero a las dos formas y se despliega antes.
- El frontend no usa un campo que el backend todavía no publicó en `main`. Si hace falta trabajar en paralelo, se genera desde la rama del backend con `OPENAPI_URL` y no se fusiona hasta que el backend esté en `main`.

### 11.10 Errores del navegador

🆕 **V2.1.** Sentry recibe los errores no controlados del navegador (excepciones de Vue, promesas rechazadas sin `catch`, errores de carga de chunks). No recibe trazas de rendimiento ni grabaciones de sesión. Así se queda en el plan gratuito y no hay que pedir consentimiento por grabar la pantalla.

```ts
// plugins/sentry.client.ts
import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const { sentryDsn, release } = useRuntimeConfig().public
  if (!sentryDsn) return
  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: sentryDsn,
    release,
    // El build es el mismo en los tres stages: el host es lo que distingue dev, qa y prod.
    environment: location.hostname,
    // Sin browserTracingIntegration ni replayIntegration: solo errores, dentro del plan gratuito.
  })
})
```

Cómo se relaciona con el backend:

- `useApi` genera el `x-request-id` de cada llamada. Si la llamada falla, lo deja como breadcrumb (10.4). El evento de Sentry de un error posterior trae la lista de llamadas fallidas con su status y su `requestId`, y ese id se busca tal cual en los logs del backend (24.4 del backend).
- `release` es el SHA del commit de este repositorio (`GITHUB_SHA` en el generate). El backend tiene el suyo, en `/api/health` y en sus eventos. Con los dos se sabe qué build del navegador habló con qué versión de la API.
- Un 4xx de la API no es un error del navegador y no se reporta. Lo trata la pantalla (10.3). Un 5xx ya lo reportó el backend con su stack.

Qué no se manda: cookies (son `httpOnly` y el SDK no las ve), el body de las llamadas (los breadcrumbs llevan método, ruta y status) ni el contenido de los formularios. `sendDefaultPii` se queda en su valor por defecto, que es `false`: sin IP ni usuario en el evento.

La cuota del plan Developer (5.000 errores al mes) se comparte con el proyecto del backend. Si se agota, Sentry descarta eventos hasta el mes siguiente y la app sigue funcionando igual. Un pico de errores del navegador suele ser un chunk viejo después de un deploy (21.8). La alerta de cuota de Sentry es la señal para mirarlo.

---

> **Vigente en v2 como sistema visual.** Se copia del original porque el aspecto no cambió. Cualquier frase que hable de `Authorization`, de cookies `auth_token` / `auth_refresh_token`, de un `apiBase` absoluto o de CORS **no se implementa**: la sesión y las llamadas HTTP están en las secciones 10 y 11.

## 12. Componentes

### 12.1 Convenciones obligatorias

Todos los componentes del repositorio siguen el mismo molde. **Respétalo sin excepciones.**

```vue
<template>
  <!-- La plantilla va PRIMERO. Siempre. -->
</template>

<script setup lang="ts">
// 1. Imports de tipos
import type { <Prefijo>IconName } from '~/components/<Prefijo>Icon.vue'

// 2. Props tipadas
const props = withDefaults(
  defineProps<{
    label: string              // requerida
    value?: number | null      // opcional
    tone?: 'success' | 'warning' | 'danger'   // unión literal, nunca string suelto
  }>(),
  { value: null, tone: 'success' }   // un default por cada prop opcional
)

// 3. Emits tipados
const emit = defineEmits<{
  refresh: []                  // sin payload
  select: [id: string]         // con payload nombrado
}>()

// 4. Composables
const colorMode = useColorMode()

// 5. Estado local
const open = ref(false)

// 6. Computed
const style = computed(() => ({ /* … */ }))

// 7. Funciones
function toggle() { open.value = !open.value }
</script>
```

| Convención | Regla | Por qué |
|---|---|---|
| **`<script setup lang="ts">`** | Siempre. Nunca Options API, nunca `defineComponent`. | Uniformidad y menos ceremonia. |
| **Plantilla antes del script** | Siempre en ese orden. | Es el orden de los 40+ componentes del repositorio. |
| **`defineProps` con genérico de tipo** | `defineProps<{...}>()`, no el objeto en runtime. | Da tipado real en plantilla y en script. La única excepción del original es `error.vue`, y es un descuido. |
| **`withDefaults` si hay props opcionales** | Un default por cada prop opcional, sin excepción. | Evita `undefined` inesperados en la plantilla. |
| **Defaults de array y objeto como función** | `{ items: () => [] }`, nunca `{ items: [] }`. | Si no, todas las instancias comparten la misma referencia. |
| **Uniones literales para variantes** | `tone?: 'success' \| 'warning' \| 'danger'`. Nunca `tone?: string`. | El editor autocompleta y los typos se detectan en build. |
| **`defineEmits` tipado con tuplas** | `defineEmits<{ refresh: []; select: [id: string] }>()`. | Tipa el payload en el emisor y en el consumidor. |
| **`const props = ...` solo si lo usas en el script** | Si solo lo usas en la plantilla, `defineProps<{...}>()` a secas. | Evita una variable sin usar que el linter marcaría. |
| **Auto-import sin prefijo de carpeta** | Gracias a `pathPrefix: false`, `components/ui/StatusChip.vue` es `<StatusChip>`. | Ver sección 12.2. |
| **Estilos por clase de Tailwind o `:style` con tokens** | Nunca bloques `<style scoped>`. **Ni un solo componente del repositorio tiene `<style>`.** | Un único sistema de estilos. |

### 12.2 La trampa del auto-import plano

Con `components: { dirs: [{ path: '~/components', pathPrefix: false }] }`:

```
components/ui/StatusChip.vue          →  <StatusChip>
components/overview/KpiRow.vue        →  <KpiRow>
components/<Prefijo>Icon.vue          →  <<Prefijo>Icon>
```

**La consecuencia que te morderá:** los nombres de archivo deben ser **globalmente únicos**. Si creas `components/a/Card.vue` y `components/b/Card.vue`, uno de los dos gana silenciosamente y el otro desaparece. Nuxt no siempre avisa.

**Regla:** nombra los componentes por lo que son, no por dónde están. `UserCard`, `InvoiceCard`, `SummaryCard` — nunca `Card` dentro de tres carpetas distintas.

### 12.3 Catálogo completo de `components/ui/`

Diez componentes. Tres están transcritos completos (los más reutilizables) y de los demás se da la API exacta.

#### 12.3.1 `PageHeader.vue` — 🟩 COMPLETO

Cabecera de página estándar: título, subtítulo, badge opcional, marca de tiempo y botón de refresco. **Lo usan 6 de las 10 páginas.**

Archivo: `components/ui/PageHeader.vue`

```vue
<template>
  <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
    <div>
      <h1 class="<prefijo>-page-title flex items-center gap-1.5">
        {{ title }}
        <<Prefijo>Icon v-if="info" name="info" :size="13" class="text-<prefijo>-muted" />
        <slot name="badge" />
      </h1>
      <p v-if="subtitle" class="<prefijo>-page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="updatedAt" class="flex items-center gap-2 text-xs text-<prefijo>-muted shrink-0 lg:pt-1">
      <span>Última actualización: {{ updatedAt }}</span>
      <button
        type="button"
        class="inline-flex items-center justify-center hover:text-[var(--<prefijo>-text)]"
        aria-label="Actualizar"
        @click="$emit('refresh')"
      >
        <<Prefijo>Icon name="refresh" :size="14" :class="refreshing ? 'animate-spin' : ''" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string | null
    updatedAt?: string | null
    info?: boolean
    refreshing?: boolean
  }>(),
  { subtitle: null, updatedAt: null, info: false, refreshing: false }
)

defineEmits<{ refresh: [] }>()
</script>
```

| Prop | Tipo | Default | Uso |
|---|---|---|---|
| `title` | `string` | — | Requerida. Se pinta como `<h1>`. |
| `subtitle` | `string \| null` | `null` | Una línea bajo el título. |
| `updatedAt` | `string \| null` | `null` | **Si es `null`, el bloque de refresco no se renderiza entero.** |
| `info` | `boolean` | `false` | Añade un icono de información junto al título. |
| `refreshing` | `boolean` | `false` | Pone a girar el icono de refresco. |

| Slot | Uso |
|---|---|
| `badge` | Contenido extra en la misma línea del título (un chip de estado, por ejemplo). |

| Emit | Payload |
|---|---|
| `refresh` | ninguno |

#### 12.3.2 `StatusChip.vue` — 🟩 COMPLETO

Pastilla de estado con seis tonos. **El componente más reutilizado del design system.** Ejemplifica el patrón `color-mix` para derivar fondo y borde de un solo color.

Archivo: `components/ui/StatusChip.vue`

```vue
<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap"
    :style="chipStyle"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: 'currentColor' }" />
    <<Prefijo>Icon v-else-if="icon" :name="icon" :size="11" :stroke="2" />
    <span class="flex flex-col leading-tight">
      <span>{{ label }}</span>
      <span v-if="sub" class="font-normal opacity-80">{{ sub }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import type { <Prefijo>IconName } from '~/components/<Prefijo>Icon.vue'

const props = defineProps<{
  label: string
  sub?: string
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'processing'
  icon?: <Prefijo>IconName
  /** Punto sólido en vez de icono. */
  dot?: boolean
}>()

const TONES: Record<string, string> = {
  success: 'var(--<prefijo>-success)',
  warning: 'var(--<prefijo>-warning)',
  danger: 'var(--<prefijo>-danger)',
  info: 'var(--<prefijo>-accent)',
  neutral: 'var(--<prefijo>-text-muted)',
  processing: 'var(--<prefijo>-accent)'
}

const chipStyle = computed(() => {
  const color = TONES[props.tone || 'neutral']
  return {
    color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 32%, transparent)`
  }
})
</script>
```

| Prop | Tipo | Default | Uso |
|---|---|---|---|
| `label` | `string` | — | Texto principal. |
| `sub` | `string?` | — | Segunda línea en peso normal y opacidad 80 %. |
| `tone` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral' \| 'processing'` | `'neutral'` | Determina los tres colores (texto, fondo, borde). |
| `icon` | `<Prefijo>IconName?` | — | Icono a la izquierda. Ignorado si `dot` es `true`. |
| `dot` | `boolean?` | `false` | Punto sólido en `currentColor` en vez de icono. |

**Las tres líneas que importan:** el texto usa el color pleno, el fondo el 12 % y el borde el 32 %. Repite esa proporción en cualquier elemento tintado que crees.

#### 12.3.3 `Sparkline.vue` — 🟩 COMPLETO

Minigráfico de líneas en SVG puro, sin ECharts.

Archivo: `components/ui/Sparkline.vue`

```vue
<template>
  <svg
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    class="w-full block"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="area" :d="areaPath" :fill="`url(#${gradId})`" />
    <path :d="linePath" fill="none" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
/**
 * Sparkline en SVG en vez de ECharts: son hasta 5 por pantalla y no necesitan
 * interacción, así que un canvas por tarjeta era desproporcionado.
 */
const props = withDefaults(
  defineProps<{ data?: number[]; color?: string; area?: boolean; strokeWidth?: number }>(),
  { data: () => [], color: '#3b82f6', area: true, strokeWidth: 1.4 }
)

const W = 100
const H = 28

const gradId = `spark-${Math.random().toString(36).slice(2, 9)}`

const points = computed(() => {
  const d = props.data
  if (d.length < 2) return []
  const min = Math.min(...d)
  const max = Math.max(...d)
  const span = max - min || 1
  return d.map((v, i) => ({
    x: (i / (d.length - 1)) * W,
    y: H - 2 - ((v - min) / span) * (H - 6)
  }))
})

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
)

const areaPath = computed(() => {
  if (!points.value.length) return ''
  return `${linePath.value} L${W} ${H} L0 ${H} Z`
})
</script>
```

| Prop | Tipo | Default |
|---|---|---|
| `data` | `number[]` | `() => []` |
| `color` | `string` | `'#3b82f6'` |
| `area` | `boolean` | `true` |
| `strokeWidth` | `number` | `1.4` |

**La decisión de diseño:** cinco canvas de ECharts en una fila de KPIs cuestan memoria y tiempo de pintado para algo que no necesita tooltip ni zoom. 55 líneas de SVG lo resuelven. **Imita este criterio:** ECharts solo donde haya interacción o ejes.

**`span = max - min || 1`** evita la división por cero cuando todos los valores son iguales. **`Math.random()` en el id del degradado** evita colisiones entre instancias; es aceptable porque no hay SSR (con SSR produciría un error de hidratación — usa `useId()` si algún día lo activas).

#### 12.3.4 El resto del catálogo (API)

**`SignalDot.vue`** — Punto de semáforo.

| Prop | Tipo | Default |
|---|---|---|
| `signal` | `'green' \| 'amber' \| 'red' \| null` | `null` |
| `title` | `string?` | — (atributo `title` nativo) |
| `size` | `'sm' \| 'md'` | `'md'` (`w-2 h-2` / `w-2.5 h-2.5`) |

`signal: null` pinta el punto en `--<prefijo>-text-muted`. Lleva `aria-hidden="true"`: el significado debe estar en el texto adyacente.

**`CoverageChip.vue`** — Chip de porcentaje con etiqueta.

| Prop | Tipo | Default |
|---|---|---|
| `pct` | `number` | — (requerida) |
| `label` | `string` | — (requerida) |
| `tone` | `'partial' \| 'total' \| 'low'` | `'partial'` |

Mapa de tonos: `partial` → acento, `total` → éxito, `low` → peligro. Renderiza `{{pct}}% {{label}}`.

**`FilterSelect.vue`** — Select nativo envuelto en tarjeta, con `v-model`.

| Prop / Emit | Tipo | Notas |
|---|---|---|
| `label` | `string?` | Etiqueta encima del select. |
| `modelValue` | `string` | Requerida. |
| `options` | `Array<{label: string; value: string}>` | Requerida. |
| `@update:modelValue` | `[value: string]` | Habilita `v-model`. |

Usa un `<select>` nativo, no el `<Dropdown>` de PrimeVue: en móvil abre el selector del sistema operativo, que es mejor UX. El elemento raíz es un `<label>`, así que al pulsar el texto se enfoca el campo.

**`ScoreCell.vue`** — Celda de tabla con número y barra de progreso.

| Prop | Tipo | Default |
|---|---|---|
| `score` | `number \| null` | — |

`null` pinta `—` y una barra al 0 %. El valor se recorta a `[0, 100]`. 🟥 **No se usa en ninguna parte del repositorio.**

**`TableFooter.vue`** — Pie de tabla con conteo y paginador.

| Prop | Tipo | Default |
|---|---|---|
| `total` | `number` | — (requerida) |
| `shown` | `number` | `0` |
| `noun` | `string` | — (requerida; p. ej. `'registros'`) |
| `page` | `number` | `1` |
| `perPage` | `number \| null` | `null` |
| `labeled` | `boolean` | `false` (rotula «Anterior»/«Siguiente») |

Muestra hasta 5 páginas y luego elipsis + última. 🟥 **Los botones no emiten nada**: es un paginador **puramente visual**. Si lo copias, añádele `defineEmits<{ 'update:page': [n: number] }>()` y los `@click`.

**`MetricTile.vue`** — Tarjeta de métrica con icono, valor, delta y fuente.

| Prop | Tipo | Default |
|---|---|---|
| `label` | `string` | — (requerida) |
| `icon` | `<Prefijo>IconName` | `'chart-bar'` |
| `value` | `number \| string \| null` | `null` |
| `unit` | `string \| null` | `null` |
| `delta` | `{value: number; unit: string; dir: string} \| null` | `null` |
| `source` / `sourceDate` | `string \| null` | `null` |
| `statusLabel` | `string` | `'OK'` |
| `statusTone` | `'success' \| 'warning' \| 'danger' \| 'info'` | `'success'` |
| `accent` | `'blue' \| 'green' \| 'purple' \| 'cyan' \| 'orange'` | `'blue'` |
| `format` | `'currency' \| 'percent' \| 'ratio' \| 'text' \| 'days'` | `'text'` |

`delta.dir` acepta `'good'` (verde), `'bad'` (rojo) o `'neutral'` (atenuado). 🟥 **No se usa en ninguna parte** y **duplica** la paleta de acentos y la función de abreviación de otro componente.

**`<Prefijo>DataTable.vue`** — Tabla genérica con columnas declarativas y slots por celda.

| Prop | Tipo | Default |
|---|---|---|
| `title` | `string?` | — |
| `columns` | `Array<{key: string; label: string; align?: 'left'\|'center'\|'right'}>` | — (requerida) |
| `rows` | `Array<Record<string, unknown>>` | — (requerida) |
| `rowKeyField` | `string` | `'id'` |
| `emptyText` | `string` | `'Sin registros.'` |
| `minWidth` | `string` | `'min-w-[640px]'` |
| `page` / `pageSize` / `total` | `number` | `1` / `8` / `0` |
| `showPagination` | `boolean` | `false` |

| Slot | Props del slot |
|---|---|
| `actions` | — (cabecera, a la derecha del título) |
| `cell-{key}` | `{ row, value }` — uno por columna |

| Emit | Payload |
|---|---|
| `update:page` | `[page: number]` |

🟥 **No se usa en ninguna parte**: las páginas escriben sus `<table>` a mano. Es el componente más útil del catálogo y a la vez el más ignorado. **En tu proyecto, úsalo de verdad o bórralo.**

### 12.4 `components/<Prefijo>Icon.vue` — el icon set propio

**Enfoque:** un **único componente de 348 líneas** que contiene ~40 iconos SVG como ramas `v-if` / `v-else-if` dentro de un solo `<svg>` de 24×24 con `stroke="currentColor"` y `fill="none"`.

Estructura:

```vue
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-7h4v7" />
    </template>

    <template v-else-if="name === 'chart-line'">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 3 3 5-7" />
    </template>

    <!-- … ~38 ramas más … -->
  </svg>
</template>

<script setup lang="ts">
export type <Prefijo>IconName =
  | 'home' | 'chart-line' | 'shield-check' | 'briefcase' | 'settings'
  | 'calculator' | 'calendar' | 'calendar-dollar' | 'chart-bar' | 'chart-pie'
  | 'clock' | 'flag' | 'credit-card' | 'shopping-cart' | 'building'
  | 'trending-up' | 'alert' | 'alert-circle' | 'scale' | 'check-circle'
  | 'search' | 'info' | 'sun' | 'moon' | 'file-check' | 'refresh'
  | 'chevrons-left' | 'chevrons-right' | 'chevron-down' | 'chevron-right'
  | 'chevron-left' | 'chevron-up' | 'upload-cloud' | 'dots-vertical'
  | 'file-text' | 'copy' | 'eye' | 'lock' | 'user' | 'menu' | 'minus'
  | 'arrow-up' | 'arrow-down' | 'arrow-right' | 'pie' | 'mark'

withDefaults(
  defineProps<{
    name: <Prefijo>IconName
    size?: number | string
    stroke?: number | string
  }>(),
  { size: 16, stroke: 1.75 }
)
</script>
```

| Prop | Tipo | Default | Notas |
|---|---|---|---|
| `name` | `<Prefijo>IconName` | — | Unión literal exportada. **Es la clave del enfoque:** el autocompletado lista los iconos y un nombre inválido es un error de compilación. |
| `size` | `number \| string` | `16` | Se aplica a `width` y `height`. Valores habituales: 11 (chips), 13–15 (inline), 20–22 (navegación), 25 (tarjetas). |
| `stroke` | `number \| string` | `1.75` | Grosor del trazo. `2` para iconos pequeños que necesitan más presencia. |

**Lo bueno del enfoque:** sin dependencias; el color se hereda vía `currentColor`; `<Prefijo>IconName` es un contrato tipado; cero peticiones de red; se puede ajustar cada path al píxel.

🟥 **Lo malo, y es serio:**
1. **Todos los iconos se incluyen en el bundle siempre.** No hay tree-shaking posible: es un solo componente.
2. **Cadena de ~40 `v-else-if` evaluada en cada render.** En una tabla de 500 filas con 3 iconos por fila son 60.000 comparaciones de cadena por repintado.
3. **Convive con PrimeIcons**, así que hay dos estilos de trazo en pantalla.
4. **Mantenerlo es manual:** añadir un icono es editar el `<template>` *y* el tipo.

La resolución está en la corrección 18.5.

### 12.5 `components/<Prefijo>Mark.vue` — logotipo sensible al tema

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `components/<Prefijo>Mark.vue`

```vue
<template>
  <img
    :src="logoSrc"
    :width="size"
    :height="Math.round(size * 0.42)"
    alt="<org>"
    class="inline-block shrink-0 object-contain object-left"
    :style="{ maxHeight: `${Math.round(size * 0.42)}px` }"
  />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 })

const colorMode = useColorMode()

/**
 * El PNG de marca viene con fondo claro y trazo oscuro: sobre el tema oscuro
 * se vería como un recuadro blanco. Hay una variante por tema, ambas con
 * transparencia.
 */
const logoSrc = computed(() =>
  colorMode.value === 'dark' ? '/images/logo-<app>-dark.png' : '/images/logo-<app>-light.png'
)
</script>
```

Dos PNG en `public/images/`, uno por tema. El factor `0.42` es la relación de aspecto del logotipo original: ajústalo al tuyo. Invocado con `:size="56"` en auth, `:size="104"` en el sidebar expandido, `:size="42"` colapsado y `:size="28"` en la barra superior móvil.

**Mejora recomendada:** usa un SVG con `fill="currentColor"` en lugar de dos PNG. Elimina los assets duplicados, escala sin pérdida y hereda el color.

### 12.6 Cómo crear un componente nuevo

1. **Elige la carpeta.** `components/ui/` si es transversal y agnóstico del dominio; `components/<area>/` si pertenece a una pantalla concreta.
2. **Elige un nombre globalmente único** en PascalCase (recuerda el auto-import plano, sección 12.2).
3. **Escribe la plantilla primero.** Usa `.<prefijo>-card` para la superficie y utilidades de Tailwind con tokens para el resto.
4. **Declara las props con `withDefaults` + `defineProps<{}>()`**, con uniones literales para las variantes.
5. **Declara los emits con `defineEmits<{}>()`** tipados.
6. **Sin `<style>`.** Si necesitas CSS que Tailwind no cubre, usa `:style` con `color-mix` sobre tokens, o añade una clase utilitaria a `main.css` si se va a repetir.
7. **Estados vacíos dentro del componente.** Si `rows` llega vacío, el componente pinta su propio mensaje; no se lo delega a la página.
8. **Accesibilidad mínima:** `aria-label` en todo botón solo-icono, `aria-hidden="true"` en los SVG decorativos, `type="button"` en todo `<button>` que no envíe un formulario.
9. **Úsalo.** Si tras crearlo no lo consumes desde ninguna página, bórralo. El original acumuló cinco componentes muertos exactamente así.

---

> **Vigente en v2 como sistema visual.** Se copia del original porque el aspecto no cambió. Cualquier frase que hable de `Authorization`, de cookies `auth_token` / `auth_refresh_token`, de un `apiBase` absoluto o de CORS **no se implementa**: la sesión y las llamadas HTTP están en las secciones 10 y 11.

## 13. Gráficos con ECharts

### 13.1 El plugin de cliente transcrito

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `plugins/echarts.client.ts`

```ts
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, HeatmapChart, GaugeChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  HeatmapChart,
  GaugeChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
])

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VChart', VChart)
})
```

**Por qué el sufijo `.client`:** ECharts toca `window`, `document` y `canvas` en el momento de importarse. Con un plugin universal, el build de servidor fallaría. Con `ssr: false` no hay servidor, pero el sufijo documenta la restricción y protege si algún día se activa SSR.

**Por qué importar por módulos y no `import * as echarts`:** el bundle completo de ECharts pesa alrededor de 1 MB. Importando solo lo que se usa, el tree-shaking de Vite deja fuera el resto.

### 13.2 Módulos registrados y cómo añadir otros

| Módulo | Import | Para qué |
|---|---|---|
| `CanvasRenderer` | `echarts/renderers` | **Obligatorio.** Sin un renderizador no se dibuja nada. La alternativa es `SVGRenderer` (mejor para impresión y pocos elementos; peor con miles de puntos). |
| `BarChart` | `echarts/charts` | Barras verticales, horizontales y apiladas. |
| `LineChart` | `echarts/charts` | Líneas, áreas y suavizado. |
| `PieChart` | `echarts/charts` | Tartas y donuts (`radius: ['70%','96%']`). |
| `GaugeChart` | `echarts/charts` | Medidores circulares. |
| `HeatmapChart` | `echarts/charts` | Mapas de calor. Requiere `VisualMapComponent`. |
| `GridComponent` | `echarts/components` | **Obligatorio para cualquier gráfico cartesiano.** Define el área de dibujo. Sin él, barras y líneas no se pintan. |
| `TooltipComponent` | `echarts/components` | Tooltip al pasar el ratón. |
| `LegendComponent` | `echarts/components` | Leyenda nativa. |
| `VisualMapComponent` | `echarts/components` | Escala de color continua o por tramos, para el heatmap. |

**Para añadir un tipo nuevo:**

```ts
import { ScatterChart, RadarChart } from 'echarts/charts'
import { DataZoomComponent, MarkLineComponent, ToolboxComponent } from 'echarts/components'

use([ /* …los ya existentes… */, ScatterChart, RadarChart, DataZoomComponent, MarkLineComponent, ToolboxComponent ])
```

**Síntoma de un módulo olvidado:** el gráfico aparece en blanco y la consola imprime `Component ... not exists. Load it first.` No es un error de datos; es un `use()` incompleto.

### 13.3 `composables/useChartTheme.ts` transcrito

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal. Es el puente entre el design system y el canvas de ECharts.

Archivo: `composables/useChartTheme.ts`

```ts
export const useChartTheme = () => {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  // Muestreado de los mockups claro/oscuro
  const baseText = computed(() => (isDark.value ? '#94a3b8' : '#64748b'))
  const axisLine = computed(() => (isDark.value ? '#121a28' : '#edeff2'))
  const splitLine = computed(() => (isDark.value ? '#101827' : '#eef1f5'))
  const tooltipBg = computed(() => (isDark.value ? '#070f1c' : '#ffffff'))
  const tooltipBorder = computed(() => (isDark.value ? '#121a28' : '#edeff2'))

  /** Paleta de series. */
  const chartColors = computed(() => [
    '#2563eb',
    isDark.value ? '#613fd8' : '#7c4ddf',
    isDark.value ? '#22c55e' : '#16a34a',
    '#f59e0b',
    '#ef4444',
    isDark.value ? '#22d3ee' : '#0891b2'
  ])

  const baseChartOption = computed(() => ({
    textStyle: {
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
      color: baseText.value
    },
    grid: {
      left: 12,
      right: 12,
      top: 36,
      bottom: 12,
      containLabel: true
    },
    tooltip: {
      backgroundColor: tooltipBg.value,
      borderColor: tooltipBorder.value,
      textStyle: { color: isDark.value ? '#ffffff' : '#0f172a' }
    },
    xAxis: {
      axisLine: { lineStyle: { color: axisLine.value } },
      axisTick: { show: false },
      axisLabel: { color: baseText.value, fontSize: 10 },
      splitLine: { show: false }
    },
    yAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: baseText.value, fontSize: 10 },
      splitLine: { lineStyle: { color: splitLine.value } }
    }
  }))

  return {
    isDark,
    chartColors,
    baseChartOption
  }
}
```

| Export | Tipo | Uso |
|---|---|---|
| `isDark` | `ComputedRef<boolean>` | Para decisiones puntuales de color en un componente de gráfico. |
| `chartColors` | `ComputedRef<string[]>` | Paleta ordenada de seis series. Úsala con `chartColors.value[i]`. |
| `baseChartOption` | `ComputedRef<object>` | Opción base que cada gráfico extiende con spread. |

🟥 **Deuda: los colores están duplicados.** `useChartTheme` repite literales hex que también están en `main.css` como tokens. Cambiar `--<prefijo>-success` no cambia el verde del gráfico. ECharts no puede leer `var(--x)` directamente, pero **sí se puede resolver en tiempo de ejecución**:

```ts
function token(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(`--<prefijo>-${name}`).trim()
}
// úsalo dentro de un computed que dependa de `isDark` para que se recalcule al cambiar de tema
```

**Nota de fidelidad:** el estilo de decimales en el código original (`toFixed(1)`, `toPrecision(4)`) y los valores concretos del grid son los del mockup del proyecto original; ajústalos a tu diseño.

### 13.4 El patrón `<ClientOnly><VChart>`

Todos los componentes de gráfico del repositorio siguen exactamente esta estructura:

```vue
<ClientOnly>
  <VChart v-if="labels.length" :option="option" autoresize class="flex-1 min-h-[214px]" />
  <p v-else class="text-sm text-<prefijo>-muted py-10 text-center">Sin datos disponibles.</p>
</ClientOnly>
```

| Pieza | Por qué |
|---|---|
| `<ClientOnly>` | Evita que el componente se intente resolver fuera del navegador. **Con `ssr: false` es defensivo** —no hay render de servidor— pero cuesta nada y protege si se activa SSR o prerenderizado de rutas. Mantenlo. |
| `v-if="labels.length"` | **Obligatorio.** ECharts con `series: []` y `xAxis.data: []` pinta un lienzo vacío con ejes, no un estado vacío. Hay que decidirlo explícitamente. |
| `autoresize` | Prop de `vue-echarts` que instala un `ResizeObserver`. **Sin ella el gráfico no se redimensiona** al colapsar el sidebar o girar el móvil, y queda cortado. |
| `class="flex-1 min-h-[XXXpx]"` | ECharts necesita que su contenedor tenga altura calculable. `flex-1` sin `min-h` dentro de un flex de altura automática da 0 px y el gráfico es invisible. **Siempre una altura mínima.** |
| `:option="option"` | Un `computed`, nunca un objeto literal en la plantilla: se recrearía en cada render y forzaría un repintado completo. |

### 13.5 Componente de gráfico completo de ejemplo

🟨 **EJEMPLO DE DOMINIO**, pero su estructura es 🟩 **el patrón a copiar**. Transcripción literal del archivo real con los nombres de dominio generalizados.

Archivo: `components/<area>/DosSeriesChart.vue`

```vue
<template>
  <section class="<prefijo>-card p-4 flex flex-col">
    <div class="flex items-center justify-between mb-1 gap-3">
      <h2 class="font-semibold flex items-center gap-1.5 whitespace-nowrap">
        {{ title }}
        <<Prefijo>Icon name="info" :size="12" class="text-<prefijo>-muted" />
      </h2>
      <span class="inline-flex items-center gap-1.5 text-xs text-<prefijo>-muted border border-<prefijo>-border rounded-lg px-3 py-1.5 shrink-0">
        {{ rangeLabel || `Últimos ${labels.length} periodos` }}
        <<Prefijo>Icon name="chevron-down" :size="12" />
      </span>
    </div>

    <div class="relative flex-1 min-h-[214px] flex flex-col">
      <ClientOnly>
        <VChart v-if="labels.length" :option="option" autoresize class="flex-1 min-h-[214px]" />
        <p v-else class="text-sm text-<prefijo>-muted py-10 text-center">Sin serie disponible.</p>
      </ClientOnly>

      <!-- Aviso superpuesto sobre el tramo sin dato. -->
      <span
        v-if="gap"
        class="absolute inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-dashed"
        :style="{
          right: '4%',
          bottom: '26%',
          color: 'var(--<prefijo>-warning)',
          borderColor: 'color-mix(in srgb, var(--<prefijo>-warning) 55%, transparent)',
          background: 'color-mix(in srgb, var(--<prefijo>-warning) 8%, transparent)'
        }"
      >
        <<Prefijo>Icon name="alert" :size="13" :stroke="2" />{{ gap.label }}
      </span>
    </div>

    <p class="text-[11px] text-<prefijo>-muted mt-auto pt-3">
      {{ caption || 'Fuente: —' }}
    </p>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    labels?: string[]
    serieA?: Array<number | null>
    serieB?: Array<number | null>
    caption?: string | null
    rangeLabel?: string | null
    /** Tramo final sin dato. */
    gap?: { fromIndex: number; label: string } | null
  }>(),
  {
    title: 'Comparativa',
    labels: () => [],
    serieA: () => [],
    serieB: () => [],
    caption: null,
    rangeLabel: null,
    gap: null
  }
)

const { baseChartOption, chartColors } = useChartTheme()

/** La unidad va en el nombre de la serie, que es lo que muestra la leyenda. */
const SERIE_A = 'Serie A (unidad)'
const SERIE_B = 'Serie B (unidad)'

const toMM = (arr: Array<number | null>) =>
  arr.map((v) => (v === null ? null : +(v / 1_000_000).toFixed(2)))

const option = computed(() => ({
  ...baseChartOption.value,
  legend: {
    data: [SERIE_A, SERIE_B],
    top: 0,
    left: 0,
    textStyle: { color: baseChartOption.value.textStyle.color, fontSize: 11 },
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 16
  },
  tooltip: { ...baseChartOption.value.tooltip, trigger: 'axis' },
  xAxis: {
    ...baseChartOption.value.xAxis,
    type: 'category',
    data: props.labels
  },
  yAxis: {
    ...baseChartOption.value.yAxis,
    type: 'value',
    axisLabel: {
      ...baseChartOption.value.yAxis.axisLabel,
      formatter: (v: number) => (v === 0 ? '0' : `${v}M`)
    }
  },
  series: [
    {
      name: SERIE_A,
      type: 'bar',
      barGap: '55%',
      barCategoryGap: '42%',
      data: toMM(props.serieA),
      itemStyle: { color: chartColors.value[0], borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 11,
      label: {
        show: true,
        position: 'top',
        fontSize: 9,
        color: baseChartOption.value.textStyle.color,
        formatter: (p: any) => (p.value != null ? `${p.value.toFixed(1)}M` : '')
      }
    },
    {
      name: SERIE_B,
      type: 'bar',
      data: toMM(props.serieB),
      itemStyle: { color: chartColors.value[1], borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 11,
      label: {
        show: true,
        position: 'top',
        fontSize: 9,
        color: 'var(--<prefijo>-chart-serie-b)',
        formatter: (p: any) => (p.value != null ? `${p.value.toFixed(1)}M` : '')
      }
    }
  ]
}))
</script>
```

**Las siete reglas de un componente de gráfico:**

1. **El componente recibe datos ya formateados por props**, no llama al API. La página carga y le pasa `labels` y las series.
2. **Todo array por defecto es una función:** `labels: () => []`.
3. **`option` es un `computed`** que hace spread de `baseChartOption.value` y sobrescribe lo específico. Nunca construyas la opción entera desde cero.
4. **El spread es superficial.** Para tocar una propiedad anidada hay que repetir el spread del nivel: `xAxis: { ...baseChartOption.value.xAxis, type: 'category', data: ... }`. Un `xAxis: { type: 'category' }` a secas **borraría** todo el estilo base.
5. **Los `null` se conservan hasta el final.** `toMM` mapea `null → null`, y ECharts dibuja un hueco. Convertirlos a `0` sería mentir.
6. **La leyenda, cuando puede, va en HTML y no en ECharts.** Otros gráficos del repositorio usan un `<ul>` de `<li>` con un punto de color. Razón: el texto dentro del canvas no es accesible ni seleccionable. Este ejemplo usa la leyenda nativa; la variante HTML es preferible.
7. **`title`, `caption` y los pies de fuente son HTML**, fuera del canvas, por la misma razón.

---

> **Vigente en v2 como sistema visual.** Se copia del original porque el aspecto no cambió. Cualquier frase que hable de `Authorization`, de cookies `auth_token` / `auth_refresh_token`, de un `apiBase` absoluto o de CORS **no se implementa**: la sesión y las llamadas HTTP están en las secciones 10 y 11.

## 14. Formularios y validación

### 14.1 Cómo se hace hoy

🟨 **No hay librería de formularios.** Ni VeeValidate, ni FormKit, ni Zod en el cliente. Todo es manual, y el patrón es consistente:

| Capa | Mecanismo | Ejemplo real |
|---|---|---|
| **1. Validación del navegador** | Atributos HTML: `required`, `type="email"`, `maxlength="6"`, `type="tel"`. El `@submit.prevent` del `<form>` solo dispara si el navegador la da por buena. | Todos los campos de login y signup. |
| **2. Saneado al teclear** | `watch` sobre el ref del campo que reescribe el valor. | `watch(rawPhone, v => { rawPhone.value = v.replace(/\D/g, '') })` |
| **3. Feedback en vivo** | Un `computed` que devuelve un objeto de booleanos, pintado como checklist. | `passChecks` en signup: `{length, upper, lower, digit, special, specialAndDigit}` |
| **4. Guardas previas al envío** | `if` encadenados al inicio del handler que escriben en `error.value` y hacen `return`. | `handleSignUp`: términos → contraseña → teléfono. |
| **5. Errores del servidor** | El composable captura, pasa por `formatAuthError` y deja el texto en `error.value`. La página lo pinta en un `<Message>`. | Los diez métodos de `useAuth`. |
| **6. Estado de envío** | `:loading="loading"` en el `<Button>` de PrimeVue: spinner + deshabilitado. | Ambas páginas de auth. |

### 14.2 Componentes de PrimeVue usados en formularios

Auto-importados por `@primevue/nuxt-module`, sin `import`:

| Componente | Uso | Props destacadas |
|---|---|---|
| `<InputText>` | Texto de una línea. | `v-model`, `type`, `required`, `placeholder`, `class` |
| `<Password>` | Contraseña con ojo de mostrar/ocultar. | `v-model`, `:feedback="false"` (quita el medidor propio), `toggle-mask`, `input-class` |
| `<Button>` | Botón. | `type="submit"`, `label`, `icon="pi pi-..."`, `:loading` |
| `<Message>` | Alerta en bloque. | `severity="error" \| "success" \| "info" \| "warn"`, `:closable="false"` |
| `<IconField>` + `<InputIcon>` | Campo con icono superpuesto. | `<IconField><InputIcon class="pi pi-envelope" /><InputText … /></IconField>` |
| `<AutoComplete>` | Buscador con sugerencias asíncronas. | `v-model`, `:suggestions`, `option-label`, `@complete`, `@item-select`, slot `#option` |
| `<Menu>` | Menú contextual. | `ref`, `:model`, `popup`, método `toggle(event)` |

**Dos trampas con `<Password>`:** necesita **`input-class="w-full"` además de `class="w-full"`**, porque el `class` va al envoltorio y el `input-class` al campo real; y `:feedback="false"` es necesario para desactivar su medidor de fuerza propio cuando tú ya pintas tu checklist.

### 14.3 Recomendación concreta si quieres algo más robusto

El enfoque manual se sostiene con dos formularios. **Con cinco o más, no.** Los síntomas concretos: la validación de contraseña vive en dos sitios (el `computed` del checklist y el `computed` de validez), no hay forma de validar al perder el foco, no hay mensajes por campo, y nada garantiza que el cliente y el DTO del backend pidan lo mismo.

**Propuesta: Zod + `@primevue/forms`.** Zod porque el backend NestJS ya usa DTOs con `class-validator` y puedes derivar el esquema del mismo contrato; `@primevue/forms` porque ya tienes PrimeVue y su `Form` entiende un *resolver* de Zod de forma nativa.

```bash
pnpm add zod @primevue/forms
```

Archivo: `utils/schemas.ts`

```ts
import { z } from 'zod'

export const signUpSchema = z.object({
  firstName: z.string().min(1, 'Los nombres son obligatorios.'),
  lastName: z.string().min(1, 'Los apellidos son obligatorios.'),
  email: z.string().email('Correo electrónico inválido.'),
  phoneNumber: z.string().regex(/^\+\d{6,15}$/, 'Teléfono en formato internacional.'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'Debe incluir una mayúscula.')
    .regex(/[a-z]/, 'Debe incluir una minúscula.')
    .regex(/\d/, 'Debe incluir un número.')
    .regex(/[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/;']/, 'Debe incluir un carácter especial.'),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones.' })
  })
})

export type SignUpInput = z.infer<typeof signUpSchema>
```

Uso en la página:

```vue
<script setup lang="ts">
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { signUpSchema } from '~/utils/schemas'

const resolver = zodResolver(signUpSchema)

async function onFormSubmit({ valid, values }: { valid: boolean; values: SignUpInput }) {
  if (!valid) return
  const result = await signUp(values)
  // …
}
</script>

<template>
  <Form v-slot="$form" :resolver :initial-values="initialValues" @submit="onFormSubmit" class="space-y-4">
    <div class="space-y-1.5">
      <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
        Correo electrónico *
      </label>
      <InputText id="email" name="email" type="email" class="w-full" />
      <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
        {{ $form.email.error?.message }}
      </Message>
    </div>
    <!-- … -->
  </Form>
</template>
```

**Qué ganas:** una sola definición de las reglas, mensajes por campo, validación al perder el foco, tipos inferidos (`SignUpInput`), y el esquema reutilizable en tests.

**Qué cuesta:** dos dependencias y reescribir los formularios existentes. **Decídelo al principio del proyecto**, no cuando ya tengas ocho formularios manuales.

**Alternativa sin dependencias nuevas:** extrae las reglas a `utils/validators.ts` como funciones puras `(value) => string | null`, y mantén un `errors` reactivo por campo. Es menos potente pero ya resuelve la duplicación, y es testeable con el mismo runner nativo de Node que usa `formatAuthError`.

---

> **Vigente en v2 como sistema visual.** Se copia del original porque el aspecto no cambió. Cualquier frase que hable de `Authorization`, de cookies `auth_token` / `auth_refresh_token`, de un `apiBase` absoluto o de CORS **no se implementa**: la sesión y las llamadas HTTP están en las secciones 10 y 11.

## 15. Accesibilidad y responsive

Esta sección separa **lo que el repo original hace bien y conviene copiar** de **lo que falta y debes añadir desde el día uno**. La parte que falta es barata de implementar al principio y cara de retrofitear después, porque obliga a tocar todos los componentes ya escritos.

### 15.1 Lo que el repo hace bien (🟩 núcleo reutilizable)

| Práctica | Dónde aparece en el original | Por qué importa |
|---|---|---|
| `aria-hidden="true"` en todo SVG decorativo | `AnkaIcon.vue`, `ui/SignalDot.vue`, `ui/Sparkline.vue` | Los iconos que acompañan a un texto no deben leerse dos veces por el lector de pantalla. Como `<Prefijo>Icon` siempre se usa junto a una etiqueta visible o dentro de un botón con `aria-label`, marcarlo oculto es correcto. |
| `aria-label` en **todos** los botones que solo contienen un icono | `AppTopbar.vue` (`"Abrir menú"`), `AppSidebar.vue` (`"Expandir menú"` / `"Colapsar menú"`, dinámico), `ThemeToggle.vue` (`"Activar modo claro"` / `"Activar modo oscuro"`, dinámico), `ui/PageHeader.vue` (`"Actualizar"`) | Un botón sin texto es un botón sin nombre accesible. Fíjate en el patrón dinámico: la etiqueta describe **la acción que ocurrirá**, no el estado actual. |
| `type="button"` explícito en botones que no envían formulario | Transversal | Sin él, un `<button>` dentro de un `<form>` es `type="submit"` por defecto y dispara envíos accidentales al pulsar Enter. |
| `pb-[env(safe-area-inset-bottom)]` en la barra inferior móvil | `AppBottomNav.vue` | Evita que la navegación quede debajo de la barra gestual del iPhone. Es una línea y resuelve un bug visual que, si no, aparece solo en dispositivo real. |
| `<label for="…">` enlazado al `id` del input | `pages/login.vue` | Amplía el área clicable y da nombre accesible al campo. |
| Tablas con `<table>`/`<thead>`/`<th>` semánticos | Tablas de dominio | Un lector de pantalla puede navegar por celdas y anunciar encabezados. No lo sustituyas por `div`s con `grid`. |
| Texto siempre acompañado de forma, no solo de color | `ui/StatusChip.vue` (texto + color), `ui/SignalDot.vue` (punto + etiqueta adyacente) | Un semáforo que solo codifica con color es invisible para el daltonismo. El original **siempre** pone la etiqueta textual al lado del punto. Mantén esa regla. |

### 15.2 Lo que falta (🟥 añádelo tú desde el principio)

**1. No hay estilo de foco propio.** El repo nunca define `:focus-visible`, y en un sitio lo elimina sin reemplazo:

```css
/* assets/css/main.css — original */
.anka-search input:focus {
  outline: none;  /* ← anula el anillo del navegador y no pone nada en su lugar */
  border-color: color-mix(in srgb, var(--anka-accent) 55%, transparent);
  box-shadow: none;
}
```

Ese caso concreto está medio salvado porque cambia el borde, pero el patrón es peligroso. Define un anillo global **antes** de escribir componentes:

```css
/* assets/css/main.css — AÑADIR */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--<prefijo>-accent);
  outline-offset: 2px;
  border-radius: 6px;
}
```

`:focus-visible` (no `:focus`) hace que el anillo aparezca con teclado pero no al hacer clic con ratón, que es justo lo que la gente quiere y la razón por la que históricamente se borraba el outline. El `:where()` mantiene la especificidad en 0, así que cualquier componente puede sobreescribirlo sin pelear.

**2. No hay enlace de salto al contenido.** Con una barra lateral de ~8 enlaces, un usuario de teclado tabula ocho veces en cada página antes de llegar al contenido. Añádelo en el layout:

```vue
<!-- layouts/default.vue — AÑADIR como primer hijo -->
<a
  href="#contenido"
  class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50
         focus:rounded-lg focus:bg-[var(--<prefijo>-accent)] focus:px-4 focus:py-2
         focus:text-sm focus:font-semibold focus:text-white"
>
  Saltar al contenido
</a>
```

y pon `id="contenido"` con `tabindex="-1"` en el `<main>`.

**3. Los gráficos ECharts son invisibles para un lector de pantalla.** ECharts renderiza a `<canvas>`: no hay DOM que leer. El original no lo compensa. Mínimo aceptable: envolver cada gráfico en una región con nombre y resumen textual.

```vue
<figure role="group" :aria-label="titulo">
  <ClientOnly>
    <VChart :option="option" autoresize class="h-full w-full" />
  </ClientOnly>
  <figcaption class="sr-only">{{ resumenTextual }}</figcaption>
</figure>
```

Mejor aún: si el gráfico tiene detrás una tabla de datos, ofrece un conmutador "ver como tabla". Es un patrón barato cuando los datos ya están en memoria.

**4. No se respeta `prefers-reduced-motion`.** Cero coincidencias en todo el repo, pero hay `transition-all duration-200` por todas partes y animaciones de ECharts activadas por defecto. Añade:

```css
/* assets/css/main.css — AÑADIR */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Y en `useChartTheme` expón `animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches` para pasárselo a las opciones de ECharts.

**5. `alert()` como canal de error.** Está en `useAuth.ts` (ver §10.5) y además de ser feo es un problema de accesibilidad: roba el foco de forma modal y bloquea el hilo. Sustitúyelo por `ToastService` de PrimeVue, que renderiza en una región con `aria-live` (corrección 18.6).

**6. No hay regiones `aria-live` para cambios asíncronos.** Cuando una página pasa de "cargando" a "cargada", o cuando aparece un error de red, el lector de pantalla no anuncia nada. Patrón mínimo para el bloque de estado de cualquier página:

```vue
<div aria-live="polite" aria-atomic="true">
  <p v-if="loading">Cargando…</p>
  <p v-else-if="error">{{ error }}</p>
</div>
```

**7. Contraste del texto muy pequeño.** El repo usa `text-[10px]` con `--<prefijo>-text-muted` en chips y pies de tabla. En modo claro, un gris medio a 10 px cae por debajo de AA. Dos reglas: no bajes de `11px`/`0.6875rem` para texto informativo, y reserva `text-muted` para texto de 12 px o más. Si necesitas 10 px, usa `--<prefijo>-text-secondary`.

**8. No hay gestión de foco al navegar.** En una SPA, cambiar de ruta no mueve el foco; el lector sigue donde estaba. Añade un plugin sencillo:

```ts
// plugins/focus-on-navigate.client.ts  🟩 núcleo
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  router.afterEach(() => {
    nextTick(() => {
      const main = document.getElementById('contenido')
      main?.focus()
    })
  })
})
```

**9. El menú móvil no atrapa el foco.** Cuando `AppSidebar` se abre como panel superpuesto en móvil, se puede tabular "por detrás" hacia el contenido. O usas el `<Drawer>` de PrimeVue (que ya implementa trampa de foco y cierre con Escape) en lugar del `<aside>` manual, o implementas la trampa tú. **Recomendación: usa `<Drawer>`**; es una de las pocas simplificaciones gratuitas respecto al original.

### 15.3 Estrategia responsive

El shell del original se apoya casi exclusivamente en **un solo breakpoint, `lg` (1024 px)**, y en un segundo, `xl` (1280 px), para la rejilla calcada del diseño. Esa simplicidad es deliberada y conviene copiarla: menos puntos de ruptura significa menos combinaciones que probar.

| Rango | Barra lateral | Barra superior | Navegación inferior | Rejilla de contenido |
|---|---|---|---|---|
| `< 640px` (base) | Oculta; se abre como panel superpuesto desde el botón hamburguesa | Hamburguesa + marca; buscador y acciones secundarias ocultos | **Visible**, fija al fondo con `safe-area-inset` | Una columna, fluida |
| `640–1023px` (`sm`/`md`) | Igual que base | Aparecen acciones de `sm:` y `md:` (buscador, perfil ampliado) | Visible | Dos columnas donde el contenido lo pide |
| `≥ 1024px` (`lg`) | **Fija**, colapsable con el botón de la propia barra | Sin hamburguesa; fila completa | **Oculta** (`lg:hidden`) | Rejilla completa, fluida |
| `≥ 1280px` (`xl`) | Igual | Igual | Oculta | Se activan las medidas exactas del diseño vía `useDesignGrid` y las variables `--<prefijo>-h` / columnas en `fr` |

Reglas prácticas que se deducen del original:

- **La barra inferior y la barra lateral son mutuamente excluyentes**, ambas controladas por el mismo breakpoint `lg`. Si mueves uno, mueve el otro, o te quedas con las dos o con ninguna en alguna franja.
- **Por debajo de `xl` el layout vuelve a ser fluido a propósito.** El comentario de `main.css` lo dice explícitamente: las medidas pixel-perfect del mockup de 1536×1024 solo tienen sentido en pantallas grandes; forzarlas en una tablet produce filas aplastadas.
- **Las tablas no se reorganizan en tarjetas**: se envuelven en un contenedor con `overflow-x-auto` y se desplazan horizontalmente. Es la decisión correcta para tablas densas de datos numéricos, donde el formato tarjeta destruye la comparación entre filas. Lo que **sí** debes añadir y el original no tiene: `tabindex="0"` en el contenedor desplazable, para que se pueda desplazar con teclado.
- **Los contenedores de gráfico siempre llevan `min-h-[Npx]`.** Sin altura mínima, en móvil el `flex` los colapsa a cero y ECharts dibuja un lienzo de 0 px (ver §13.4).
- **`useDesignGrid` es opcional y solo tiene sentido si trabajas contra mockups con medidas fijas.** 🟨 Es un patrón de ejemplo, no núcleo. Si tu diseño no viene con una rejilla de 1536×1024 medida al píxel, bórralo y usa `grid-cols-*` de Tailwind directamente: te ahorras un composable, un JSON de medidas y toda la familia de clases `.<prefijo>-grid-*`.

### 15.4 Verificación

Antes de dar por buena una pantalla:

1. Recórrela entera **solo con Tab**. Todo elemento interactivo debe recibir foco, en orden visual, con anillo visible.
2. Pulsa Escape con el menú móvil abierto: debe cerrarse.
3. Pon el navegador al 200% de zoom: no debe aparecer desplazamiento horizontal en el documento (sí dentro de las tablas).
4. Cambia a modo claro y revisa el texto gris pequeño.
5. Activa "reducir movimiento" en el sistema operativo y recarga: nada debe animarse.

---

## 16. Build y despliegue

🆕 **V2.** Un solo `pnpm generate`. El artefacto no contiene el dominio del stage. El workflow lo sube al bucket que el stack del backend publicó en SSM.

### 16.1 Verificación

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  verify:
    name: Verificar y construir
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      # Firma de la procedencia del build. El paso solo corre en push a main.
      id-token: write
      attestations: write
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4.4.0
      - uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Contrato con main del backend
        run: |
          pnpm api:types
          # status y no diff: también falla si el archivo nunca se commiteó.
          if [ -n "$(git status --porcelain -- types/api.gen.ts)" ]; then
            git diff -- types/api.gen.ts | head -50
            echo "::error file=types/api.gen.ts::El contrato del backend cambió. Corre pnpm api:types, commitea types/api.gen.ts y corrige lo que marque pnpm typecheck."
            exit 1
          fi
      - run: pnpm test
      - run: pnpm typecheck
      - name: Build, con la meta CSP
        env:
          # Variable del repositorio, no secreto: el DSN de Sentry es público por diseño.
          SENTRY_DSN_WEB: ${{ vars.SENTRY_DSN_WEB }}
        run: pnpm generate
      - name: Manifiesto del build
        run: find .output/public -type f -print0 | sort -z | xargs -0 sha256sum > web.sha256
      - name: SBOM
        uses: anchore/sbom-action@66cbf4bc1f1c0d2edc94016e65bc221b6bb0ad6c # v0.24.3
        with:
          path: .
          format: spdx-json
          output-file: sbom.spdx.json
          upload-artifact: false
      - name: Procedencia firmada del manifiesto
        if: github.event_name == 'push'
        uses: actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8 # v4.2.2
        with:
          subject-path: web.sha256
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: web-${{ github.sha }}
          path: |
            .output/public
            web.sha256
            sbom.spdx.json
          # Desde la v4.4, todo lo que cuelga de una carpeta con punto (.output/) se excluye
          # salvo que se pida. Sin esto el artefacto sale vacío.
          include-hidden-files: true
          retention-days: 30
          if-no-files-found: error

  workflows:
    name: Auditar workflows
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
        with:
          persist-credentials: false
      - uses: zizmorcore/zizmor-action@cc914d7f3750a2d13d75c7f184a1060aa0e9d482 # v0.6.4
        with:
          version: '1.30.1'
          # Sin subir SARIF: un hallazgo falla el job en lugar de quedarse en la pestaña Security.
          advanced-security: false

  deploy-dev:
    if: github.event_name == 'push'
    needs: [verify, workflows]
    uses: ./.github/workflows/deploy.yml
    with:
      stage: dev
      account: '<ACCOUNT_NONPROD>'
    permissions:
      contents: read
      id-token: write
      attestations: read

  deploy-qa:
    needs: deploy-dev
    uses: ./.github/workflows/deploy.yml
    with:
      stage: qa
      account: '<ACCOUNT_NONPROD>'
    permissions:
      contents: read
      id-token: write
      attestations: read

  deploy-prod:
    needs: deploy-qa
    uses: ./.github/workflows/deploy.yml
    with:
      stage: prod
      account: '<ACCOUNT_PROD>'
    permissions:
      contents: read
      id-token: write
      attestations: read
```

`pnpm typecheck` escribe un aviso de `vue-router/volar/sfc-route-blocks` por stderr y termina 0. Un error de tipos de verdad termina distinto de 0: el job falla.

🆕 **V2.1.** Lo que añade este job respecto a la 2.0:

- **Actions fijadas por SHA**, con la versión en un comentario. Un tag lo puede mover quien controle el repositorio de la acción, y este job tiene permiso de OIDC. Son los SHA de la última versión de cada major el 2026-10-08. Dependabot actualiza el SHA y el comentario juntos (16.4).
- **El contrato antes que los tests.** Si el backend cambió, el fallo dice qué hacer, y no aparece como diez errores de tipos sueltos (11.9).
- **`SENTRY_DSN_WEB`** es una variable del repositorio (Settings → Secrets and variables → Variables). Vacía, el build sale sin Sentry y la CSP sin su host.
- **`web.sha256` firmado.** El manifiesto lista el sha256 de cada archivo del sitio, y la attestation de procedencia (Sigstore, OIDC del job) firma el manifiesto. El deploy verifica las dos cosas antes de subir nada (16.2). Es gratis porque el repositorio es público; en uno privado exige GitHub Enterprise Cloud.
- **`include-hidden-files: true`**, que la 2.0 no llevaba. `upload-artifact` 4.4+ trata `.output/public/**` como oculto y lo habría dejado fuera.
- **zizmor** audita `.github/` (inyección en `run:`, credenciales persistidas, permisos de más, acciones sin fijar). Si marca algo que es así a propósito, se justifica en `.github/zizmor.yml`. Los deploys esperan a este job.

### 16.2 Promoción

`qa` y `prod` usan el GitHub Environment del mismo nombre, con revisores, igual que el backend. El rol que se asume lo crea el stack `ci` del backend: `<app-short>-github-frontend-deploy`. Solo puede escribir en el bucket web y crear una invalidación. No puede tocar la API ni la base.

```yaml
# .github/workflows/deploy.yml
name: Desplegar stage

on:
  workflow_call:
    inputs:
      stage:
        required: true
        type: string
      account:
        required: true
        type: string

permissions:
  contents: read
  id-token: write
  attestations: read

jobs:
  deploy:
    name: Publicar ${{ inputs.stage }}
    runs-on: ubuntu-latest
    environment:
      name: ${{ inputs.stage }}
    timeout-minutes: 20
    concurrency:
      group: deploy-${{ inputs.stage }}
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
        with:
          persist-credentials: false
      # Sin `path`: el artefacto trae .output/public/, web.sha256 y el SBOM con sus rutas.
      - uses: actions/download-artifact@634f93cb2916e3fdff6788551b99b062d0335ce0 # v5.0.0
        with:
          name: web-${{ github.sha }}
      - name: El build es el que firmó CI
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          gh attestation verify web.sha256 --repo "$GITHUB_REPOSITORY" \
            --signer-workflow "$GITHUB_REPOSITORY/.github/workflows/ci.yml"
          sha256sum --check --quiet web.sha256
      - uses: aws-actions/configure-aws-credentials@61815dcd50bd041e203e49132bacad1fd04d2708 # v5.1.1
        with:
          role-to-assume: arn:aws:iam::${{ inputs.account }}:role/<app-short>-github-frontend-deploy
          aws-region: <REGION>
      - name: Subir el mismo build al bucket del stage
        env:
          STAGE: ${{ inputs.stage }}
        run: |
          set -euo pipefail
          PREFIX="/<org>/<app-short>/${STAGE}"
          BUCKET="$(aws ssm get-parameter --name "$PREFIX/web/bucket-name" --query Parameter.Value --output text)"
          DIST="$(aws ssm get-parameter --name "$PREFIX/web/distribution-id" --query Parameter.Value --output text)"
          aws s3 sync .output/public "s3://${BUCKET}" --delete \
            --cache-control 'public,max-age=31536000,immutable' --exclude 'index.html' --exclude '*.html'
          aws s3 sync .output/public "s3://${BUCKET}" --exclude '*' --include '*.html' \
            --cache-control 'no-cache'
          aws cloudfront create-invalidation --distribution-id "$DIST" --paths '/*' >/dev/null
```

El `s3 sync` parte en dos a propósito. Los archivos con hash en el nombre (`/_nuxt/*`) se cachean un año e `immutable`. Los HTML no se cachean: son los que apuntan a los hashes nuevos. Un único sync con `max-age` largo dejaría el `index.html` viejo en el edge y el usuario seguiría pidiendo chunks que ya no existen.

🆕 **V2.1.** Antes de asumir el rol de la cuenta, el job verifica la attestation de `web.sha256` (firmada por `ci.yml` de este repositorio) y el hash de cada archivo. Si el artefacto no es el que construyó CI, o un archivo cambió después del build, no se sube nada. Ese mismo hash protege la meta CSP: un HTML retocado a mano después del generate tiene otro sha256.

La invalidación es `/*`. El sitio es pequeño; una invalidación selectiva que se olvida de un HTML es un incidente más caro que la invalidación.

El orden respecto al backend: el stage del backend (CloudFront, bucket, parámetros SSM) tiene que existir antes del primer deploy del frontend. No hace falta coordinar cada release: el frontend no migra datos. Sí hace falta que el contrato que el frontend llama exista ya en ese stage. Por eso el frontend se promueve después del backend cuando el cambio toca los dos.

### 16.3 Lo que ya no se hace

- No se pasa `NUXT_PUBLIC_API_BASE_URL` en el generate.
- No hay un bucket de deploy distinto del bucket del sitio: el origen de CloudFront es ese bucket, con OAC. El workflow no crea infraestructura.
- No hay Dockerfile.

### 16.4 Dependabot

🆕 **V2.1.** La 2.0 no lo tenía en este repositorio. Con las Actions fijadas por SHA, sin Dependabot los SHA se quedan viejos para siempre.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly, day: monday }
    open-pull-requests-limit: 10
    groups:
      nuxt: { patterns: ['nuxt', '@nuxt/*', '@nuxtjs/*', 'vue', 'vue-router', 'vue-tsc'] }
      primevue: { patterns: ['primevue', '@primevue/*', '@primeuix/*', 'primeicons', 'tailwindcss-primeui'] }
      dev-tooling:
        dependency-type: development
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly, day: monday }
    groups:
      actions: { patterns: ['*'] }
```

`tailwindcss` está fijado en 3.4.19 a propósito (21.6) y PrimeVue 5 cambia el tema. Un PR de Dependabot que suba alguno de los dos de major se cierra con un comentario que apunte a la sección, no se fusiona porque CI pasó.

`openapi-typescript` no aparece en Dependabot porque no es una dependencia (4). Su versión está en el script `api:types` y se sube a mano.

---
## 17. Entorno de desarrollo local y Cursor Cloud

### 17.1 Arranque

```
corepack enable && corepack prepare pnpm@12.10.1 --activate
pnpm install
pnpm dev
```

Queda en `http://127.0.0.1:4200`. El backend tiene que estar en `http://127.0.0.1:3000`. Comprobación, con los dos en marcha:

```
curl -sS http://127.0.0.1:4200/api/health
```

Tiene que devolver el JSON del backend (`status: ok`), no el HTML de Nuxt. El 2026-10-08 esa llamada respondió 200 en 9 ms a través del proxy, con `x-request-id` y `cache-control: no-store`.

No hay `.env`. Si alguien crea `NUXT_PUBLIC_API_BASE_URL`, Nuxt no la lee: `runtimeConfig` no está mapeado a esa variable.

### 17.2 Cursor Cloud

Igual que el backend: no hay `.cursor/environment.json` verificado en este núcleo. El entorno necesita Node 24 y pnpm 12.10.1. El frontend no necesita PostgreSQL; necesita al backend si se va a probar el login.

### 17.3 Telemetría de Nuxt

El primer `nuxt dev` en una máquina nueva pregunta si quieres participar. En CI no es interactivo y no pregunta. En local se responde y no vuelve a salir. No cambia el build.

---
## 18. Correcciones obligatorias respecto al original

El código de las secciones 4, 5, 10, 11 y 16 ya las aplica. Están aquí para que un PR no las deshaga "porque el original lo hacía así".

### 18.1 Un solo cliente HTTP, sin store de auth paralelo

El original tenía `composables/useAuth.ts` y, además, un `stores/auth.ts` que nadie llamaba y que hablaba con rutas que no existían (`/auth/register`, cuerpo `{ token }`). No se crea el store. El estado de sesión es el resultado de `me()`, guardado en un `useState` si hace falta pintarlo en el shell, no un segundo cliente.

### 18.2 Las cookies de token no se recrean

`auth_token`, `auth_refresh_token`, `auth_id_token` y `auth_user_email` no existen. Eran legibles por cualquier script de la página. La v2 no las sustituye por otras cookies escritas desde JavaScript.

### 18.3 No se refresca con el email en el body

El `POST /auth/refresh` del original exigía el email para calcular `SECRET_HASH`. El backend v2 no lo pide. Mandar `{ email, refreshToken }` es un 400.

### 18.4 Un 401 no es lo mismo que un 403 ni que un 503

`fetchProfile` del original hacía logout ante cualquier error. Un corte de red o un usuario desactivado se veían como "vuelve a escribir la contraseña". La tabla de la sección 10.3 es la que manda.

### 18.5 Un build para todos los stages

La sección 16.5 de la v1 explicaba por qué la URL del API quedaba incrustada y por qué no se podía promocionar el artefacto. Eso deja de ser verdad porque la URL es relativa. No reintroducir la variable.

### 18.6 Middleware de rol encadenado detrás de auth

Varias rutas del original declaraban solo el middleware de rol y un anónimo acababa en `/` en vez de en el login. `['auth', 'role']`, en ese orden.

### 18.7 Sin Dockerfile

El original tenía una imagen que no coincidía con `nuxt generate`. No se añade.

### 18.8 pnpm fijado, sin dependencias muertas

`packageManager` es `pnpm@12.10.1`. No se declaran paquetes que nadie importa.

### 18.9 `alert()` no es el sistema de errores

Los errores de formulario usan el `Message` de PrimeVue (sección 14). `alert()` se cuela en el original en más de un sitio.

### 18.10 El identificador de la entidad va en la ruta

La v1 lo deja escrito como deuda (sección 9.1): el original guardaba la selección en Pinia y los enlaces con query no leían el query. Las pantallas nuevas usan `/<entidad>/[id]`. El store, si existe, es caché de lo que la ruta ya dice.

---
## 19. Plan de implementación ordenado

### Fase 0 — Esqueleto

Copiar `package.json`, `pnpm-workspace.yaml`, `nuxt.config.ts`, `.nvmrc`, `.gitignore`, `tsconfig.json`, `vitest.config.ts`, `utils/http.ts`, `utils/http.test.ts`, `composables/useApi.ts`, los tres middleware y las dos páginas mínimas. 🆕 V2.1: también `scripts/csp.mjs` y `plugins/sentry.client.ts`.

```
pnpm install
pnpm api:types        # V2.1: necesita openapi/openapi.json en main del backend, o OPENAPI_URL
pnpm test
pnpm typecheck
pnpm generate
```

Todos terminan bien antes de seguir. `generate` produce `.output/public`, el `index.html` contiene `apiBase:"/api"` y, desde la 2.1, empieza su `<head>` con la meta CSP. `pnpm api:types` dos veces seguidas no deja diff en `types/api.gen.ts`.

### Fase 1 — Design system y shell

Secciones 7 y 8. Sustituir el `main.css` mínimo por el de la sección 7. El shell (sidebar, topbar, layouts `default` y `auth`) se copia y se le quita cualquier lectura de cookies de token: el nombre del usuario sale de `me()`.

```
pnpm typecheck && pnpm generate
```

### Fase 2 — Login real

Pantalla de login sobre el layout `auth`, con los cuatro retos de la sección 10.2. Contra el backend local:

```
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4200/api/health
```

Tiene que ser 200. Luego el login se prueba en el navegador: cookie `httpOnly` visible en el panel de aplicación y ausente de `document.cookie`.

### Fase 3 — Primera pantalla de dominio

Una lista paginada con `useApi().api`, ruta con `[id]`, middleware `auth`. Vacío, error 503 y 401 (se fuerza cerrando sesión en otra pestaña) tienen un estado visible.

### Fase 4 — Documentos y gráficos

Cuando el dominio los necesite. La subida sigue la sección 11.2. Los gráficos, la sección 13, dentro de `<ClientOnly>`.

### Fase 5 — Pipeline

Workflows de la sección 16. El primer deploy espera a que el stage `dev` del backend haya escrito los parámetros `web/bucket-name` y `web/distribution-id`. Environments `qa` y `prod` con revisores. 🆕 V2.1: `.github/dependabot.yml`, la variable de repositorio `SENTRY_DSN_WEB` y la protección de `main` que exige `Verificar y construir` y `Auditar workflows`.

---
## 20. Checklist final de aceptación

- [ ] `pnpm test`, `pnpm typecheck` y `pnpm generate` pasan.
- [ ] El `index.html` generado contiene `apiBase:"/api"` y no contiene un host de API ni un stage.
- [ ] `rg -n "auth_token|Authorization|localStorage" --glob '!node_modules/**' --glob '!.nuxt/**'` no devuelve nada en el código propio.
- [ ] `document.cookie` en la pantalla autenticada no muestra la sesión. La pestaña Application del navegador muestra la cookie de access con `HttpOnly`.
- [ ] 🆕 V2.4. Login sin MFA acaba en `me()` con los grupos reales. Una invitación de interno recorre `NEW_PASSWORD_REQUIRED` y entra.
- [ ] Una llamada que recibe 401 refresca una sola vez aunque haya varias en paralelo (se ve una sola línea `POST /api/auth/refresh` en la red).
- [ ] Con el backend apagado, la pantalla dice que no hay servicio y no redirige al login en bucle.
- [ ] Un usuario desactivado ve el 403 y no un formulario de contraseña.
- [ ] `curl http://127.0.0.1:4200/api/health` devuelve el JSON del backend.
- [ ] El deploy de `dev` sirve `https://<DOMINIO_APP>/` y `https://<DOMINIO_APP>/api/health` en el mismo host.
- [ ] Recargar una ruta profunda (`/algo/123`) devuelve la app, no un 403/404 de S3. Eso lo hace la CloudFront Function del backend; si falla, el arreglo es de ese stack, no un `200.html` trampas en el cliente.

🆕 **V2.1**

- [ ] Cada HTML de `.output/public` empieza su `<head>` con `<meta http-equiv="Content-Security-Policy" ...script-src 'self' 'sha256-…'>`, y `script-src` no contiene `'unsafe-inline'` ni `'unsafe-eval'`.
- [ ] `pnpm generate && pnpm preview`: login, shell y una pantalla con gráfico sin ningún `Refused to …` de CSP en la consola. Lo mismo en `dev` detrás de CloudFront, donde se suman las dos políticas.
- [ ] En `dev`, en la consola del navegador, `document.head.appendChild(Object.assign(document.createElement('script'), { textContent: 'alert(1)' }))` no muestra el alert: la CSP lo bloquea.
- [ ] `types/api.gen.ts` está commiteado, `pnpm api:types` no lo cambia, y `rg -n "interface Me\b" --glob '!node_modules/**'` no encuentra una copia a mano.
- [ ] En la pestaña Network, cada llamada a `/api` lleva `x-request-id`. Cada `POST` fuera de `/api/auth/*` lleva `idempotency-key`, y el reintento después de un 401 lleva la misma.
- [ ] Con `SENTRY_DSN_WEB` definido, un `throw new Error('prueba')` en un botón aparece en Sentry con `environment` igual al host, `release` igual al SHA y, si antes falló una llamada, un breadcrumb `api` con su `requestId`.
- [ ] El job `Auditar workflows` pasa y `rg -n 'uses: [^ ]+@v[0-9]' .github/` no devuelve nada.
- [ ] El primer push a `main` crea una attestation y el deploy de `dev` pasa "El build es el que firmó CI".

---
## 21. Errores conocidos y cómo evitarlos

### 21.1 Llamar al puerto 3000 desde el navegador

Síntoma: el login "no guarda la sesión" o el navegador bloquea la respuesta por CORS. Causa: `apiBase` absoluto a `localhost:3000`. El navegador tiene que llamar a `/api` en el 4200. El proxy está en `vite.server.proxy`.

### 21.2 `useFetch` para datos con sesión

No pasa por `useApi`, así que un 401 no refresca y la pantalla trata la sesión como muerta. Sección 11.1.

### 21.3 Refresh por componente

Si la promesa en vuelo se crea dentro de `useApi()`, cada componente tiene la suya y cinco 401 disparan cinco refresh. Cognito rota el token y los cuatro sobrantes fallan. La promesa es una variable de módulo (`refreshInflight` en `useApi.ts`). No se mueve dentro de la función.

### 21.4 `$fetch<T>`

En Nuxt 4.6 el `$fetch` autoimportado no acepta argumento de tipo (`Expected 0 type arguments`). Se castea el resultado: `return (await $fetch(...)) as T`. Volver a poner el genérico rompe `pnpm typecheck`.

### 21.5 Directorio `app/`

Crearlo cambia el `srcDir` de Nuxt 4 y desaparecen las páginas. Sección 6.

### 21.6 `tailwindcss` solo como transitiva

pnpm no deja que el módulo resuelva `tailwindcss/nesting`. Va en `devDependencies` directas, fijado en 3.4.19 (el módulo 6.14 es de Tailwind 3, no de Tailwind 4). El aviso de nesting puede seguir saliendo; el generate termina bien.

### 21.7 Aviso de vue-tsc y `sfc-route-blocks`

Sale siempre, por stderr, y el comando sigue en 0. No se "arregla" pinchando la versión de vue-router a mano: Nuxt es quien la trae. Se ignora hasta un PR que suba el conjunto Nuxt/vue-tsc y demuestre que el aviso desaparece sin romper el typecheck.

### 21.8 HTML cacheado un año

Un `s3 sync` con un solo `cache-control` largo sirve el `index.html` viejo, que apunta a chunks que el `--delete` ya borró. La pantalla blanca con errores de chunk en consola es este fallo. El workflow separa HTML y assets (16.2).

### 21.9 Custom error responses de CloudFront hacia `index.html`

Si alguien "arregla" el 404 de las rutas del SPA con una custom error response de CloudFront, también convierte los 404 de `/api/*` en HTML. El backend ya resuelve esto con una CloudFront Function. No se añade la custom error response.

### 21.10 Decodificar el access token

Además de que la cookie es `httpOnly` y no se puede, el perfil que saldría de los claims no es el de la tabla `users` (grupos y estado cambian sin reemitir el token). `me()` es la fuente.

### 21.11 Primer `nuxt dev` interactivo

Pregunta por la telemetría y, si falta el plugin de nesting, ofrece instalarlo. En un script se exporta `CI=true` o se responde antes. No afecta a `nuxt generate`.

### 21.12 🆕 V2.1. Pantalla en blanco con `Refused to execute inline script`

El HTML se tocó después de `scripts/csp.mjs` (un paso de CI que inyecta algo, un `sed` sobre `index.html`), o alguien corrió `nuxt generate` sin el script. El hash de la meta ya no coincide con el script, o no hay meta. El arreglo es que `pnpm generate` sea el último paso que escribe en `.output/public`. No se arregla con `'unsafe-inline'`.

### 21.13 🆕 V2.1. `Refused to connect` hacia Sentry o S3

`connect-src` solo lleva `'self'` y el host del DSN con el que se hizo el build. Si `SENTRY_DSN_WEB` cambió de proyecto, hay que regenerar. Si el dominio empieza a subir documentos directo a S3 desde el navegador (11.2), su origen se añade en `scripts/csp.mjs`.

### 21.14 🆕 V2.1. Editar `types/api.gen.ts` a mano

CI lo regenera y el cambio desaparece, o el job falla. Si el tipo está mal, el arreglo está en el DTO del backend (un `@ApiProperty` que falta o un `nullable` mal puesto), no en el archivo generado.

---
## Anexo A — Puntos abiertos

Los de plataforma (dominio, cuentas, DocuSign, cuentas bancarias de PROPIA, textos legales) están en el Anexo A del backend y se responden una vez para los dos repositorios.

Los que solo afectan al cliente:

| Punto | Opciones |
|---|---|
| `<prefijo>` de los tokens CSS | 🆕 V2.3. Cerrado: `propia` (9.6) |
| `<descripción corta de la app>` | 🆕 V2.3. Cerrado: `PROPIA · Copropiedad inmobiliaria` |
| Modo oscuro | 🆕 V2.4. Cerrado: claro y oscuro desde la primera versión, con toggle y preferencia del sistema (9.6) |
| Idioma | 🆕 V2.2. Cerrado: español, con las cadenas en `locales/es.json` desde el primer pantallazo (9.5). Un segundo idioma es otro archivo |
| Pantallas del dominio | 🆕 V2.3. Definidas en 9.6. Se construyen con las secciones 8, 12 y 14, contra el OpenAPI del backend |
| `SENTRY_DSN_WEB` | 🆕 V2.1. El DSN de un proyecto de Sentry de tipo Vue, distinto del del backend. Plan Developer gratuito: 1 usuario y 5.000 errores al mes compartidos entre los dos proyectos. Sin DSN, el build sale sin Sentry y todo lo demás funciona |
| Pruebas de navegador | No hay Playwright en el núcleo. Se añade cuando exista un flujo (login con MFA, un alta, una subida) que merezca un spec, contra el stage `dev`, no contra mocks del contrato |

Verificado el 2026-10-08 sin cuenta AWS: install, 3 tests de Vitest, typecheck (exit 0, con el aviso de vue-router documentado en 21.7), `nuxt generate` produciendo `.output/public` con `apiBase:"/api"`, y el proxy de desarrollo devolviendo el health del backend. No verificado: el `s3 sync` contra un bucket real y el login en un navegador contra Cognito. El checklist de la sección 20 es esa verificación.

---
