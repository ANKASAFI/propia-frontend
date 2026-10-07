# BLUEPRINT FRONTEND — Nuxt 4 SPA + PrimeVue + Tailwind + Pinia + ECharts

**Documento de transferencia para un agente de código autónomo que va a construir una aplicación nueva, en un repositorio vacío, reutilizando el stack de un frontend existente.**

El agente lector **no tiene acceso** al repositorio de origen. Todo lo que necesita está transcrito aquí literalmente. Si algo no aparece en este documento, no existe para efectos de la implementación.

---

## 0. Propósito y cómo usar este documento

### 0.1 Qué es esto

Este documento es la **destilación completa** de un frontend Nuxt 4 en producción: un dashboard interno con autenticación contra un backend NestJS que envuelve AWS Cognito, desplegado como sitio estático en S3 + CloudFront vía GitHub Actions con OIDC.

El objetivo es que puedas reconstruir ese mismo esqueleto —**sin el dominio de negocio original**— para una aplicación nueva cuyo dominio todavía no está definido.

### 0.2 Las tres categorías de contenido

Cada bloque de este documento está etiquetado con una de estas tres marcas. **Respétalas.**

| Marca | Significado | Qué hacer |
|---|---|---|
| 🟩 **NÚCLEO REUTILIZABLE** | Código de infraestructura independiente del dominio. Está transcrito completo y verificado contra el archivo real. | **Copiar literalmente**, sustituyendo solo los marcadores de la tabla de la sección 1. |
| 🟨 **EJEMPLO DE DOMINIO** | Código específico del negocio original. Se incluye como **patrón de referencia**, no para copiarse. | Leer, entender la forma, y reescribir con tu propio dominio. |
| 🟥 **DEUDA — NO REPLICAR** | Algo que el repositorio original hace mal. Se documenta para que no lo arrastres. | **No copiar.** La sección 18 da la corrección concreta. |

### 0.3 Orden de lectura recomendado para el agente

1. Lee la **sección 1** (marcadores) y **decide los valores reales** antes de escribir una sola línea. Anótalos.
2. Lee las secciones **2–6** completas: te dan el esqueleto del proyecto (config, dependencias, carpetas).
3. Ejecuta la **fase 0 y 1** de la sección 19 (plan de implementación) antes de seguir leyendo.
4. Usa las secciones **7–17** como referencia mientras implementas cada fase.
5. Aplica la **sección 18** (correcciones obligatorias) **a medida que copias**, no al final.
6. Cierra con la **sección 20** (checklist de aceptación).

### 0.4 Reglas duras para el agente implementador

- **No inventes props, composables ni APIs.** Si necesitas algo que no está aquí, créalo tú y documéntalo; no asumas que existía en el original.
- **Todo bloque de código indica su ruta destino** en la línea inmediatamente anterior, con el formato `Archivo: ruta/al/archivo.ext`. Respétala exactamente.
- **No uses el directorio `app/`** de Nuxt 4. Ver la sección 6.3 para el porqué y las implicaciones.
- **Verifica después de cada fase** con el comando que la propia fase indica. No encadenes fases sin verificar.
- Cuando este documento dice *«no se puede determinar desde el repositorio»*, es literal: no lo supongas, decídelo tú y déjalo escrito.

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
- [22. Lo que no se pudo determinar desde el repositorio](#22-lo-que-no-se-pudo-determinar-desde-el-repositorio)

---

## 1. Tabla de marcadores y convención de nombres

### 1.1 Marcadores

Todos los nombres propios de la aplicación original han sido reemplazados por marcadores. **Antes de escribir código, fija el valor real de cada uno y sustitúyelo de forma consistente en todo el proyecto.**

| Marcador | Qué representa | Formato esperado | Ejemplo de valor real |
|---|---|---|---|
| `<app>` | Slug de la aplicación. Aparece en el nombre del repositorio, del bucket S3, de las rutas SSM y del grupo de concurrencia del CI. | kebab-case, sin espacios | `mi-app`, `portal-ventas` |
| `<org>` | Organización propietaria: la org de GitHub y el nombre de marca que se muestra en la UI. | PascalCase o nombre comercial | `MiEmpresa`, `ACME S.A.` |
| `<stage>` | Entorno de despliegue. El CI lo deriva de la rama. | uno de: `dev`, `qa`, `prod` | `dev` |
| `<REGION>` | Región AWS de todos los recursos. | identificador AWS | `us-east-1` |
| `<AWS_ACCOUNT_ID>` | Identificador numérico de la cuenta AWS. | 12 dígitos | `123456789012` |
| `<ROL_OIDC>` | Nombre del rol IAM que GitHub Actions asume vía OIDC. | nombre de rol IAM | `github-actions-deployment-role` |
| `<BUCKET>` | Bucket S3 que hospeda el sitio estático, uno por stage. | nombre de bucket | `<app>-frontend-<stage>` |
| `<CF_DIST_ID>` | Id de la distribución CloudFront, uno por stage. | id de CloudFront | `E1A2B3C4D5E6F7` |
| `<DOMINIO_BASE>` | Dominio público bajo el que se sirve el frontend. | dominio | `example.com` → `app-dev.example.com` |
| `<ROL_A>` | Grupo de Cognito con permisos operativos ampliados (el perfil «avanzado»). En el original era el grupo de negocio principal. | nombre de grupo Cognito | `Operaciones`, `Analistas` |
| `<ROL_B>` | Grupo de Cognito con permisos de administración. | nombre de grupo Cognito | `Admin` |
| `<prefijo>` | **Namespace en minúsculas** para los tokens CSS (`--<prefijo>-bg`), las clases utilitarias propias (`.<prefijo>-card`) y la paleta de Tailwind (`bg-<prefijo>-bg`). | kebab-case corto, 2–5 letras | `ds`, `app`, `acme` |
| `<Prefijo>` | **El mismo namespace en PascalCase**, para los componentes de marca (`<Prefijo>Icon`, `<Prefijo>Mark`). | PascalCase | `Ds`, `App`, `Acme` |
| `<correo-ejemplo>` | Email de placeholder en los inputs de login y registro. | email | `usuario@example.com` |
| `<URL_TERMINOS>` | URL de los términos y condiciones, usada como fallback si el backend no responde. | URL absoluta | `https://example.com/terminos` |
| `<AÑO>` | Año que aparece en los pies de página de copyright. | año de 4 cifras | `2026` |

### 1.2 Convención crítica: `<prefijo>` vs. `App*`

El repositorio original usa **dos familias de nombres de componente** y es importante no fusionarlas:

| Familia | Qué agrupa | Ejemplos originales | Equivalente con marcadores |
|---|---|---|---|
| `App*` | Componentes de **shell de aplicación**: los que dibujan el chrome de la interfaz. | `AppSidebar`, `AppTopbar`, `AppBottomNav` | **Se mantienen tal cual: `AppSidebar`, `AppTopbar`, `AppBottomNav`.** No llevan prefijo de marca. |
| `<Prefijo>*` | Componentes de **marca / design system propio**, los que encapsulan decisiones visuales específicas. | `AnkaIcon`, `AnkaMark`, `AnkaGauge`, `AnkaDataTable` | `<Prefijo>Icon`, `<Prefijo>Mark`, `<Prefijo>Gauge`, `<Prefijo>DataTable` |

> ⚠️ Si eliges `<Prefijo>` = `App`, colisionarás con `AppSidebar`/`AppTopbar`. **Elige un `<Prefijo>` distinto de `App`.**

### 1.3 Cómo renombrar el namespace de tokens CSS

El original define **todos** sus tokens de color y medida como custom properties con el prefijo `--anka-`. Al copiarlos:

1. Sustituye `--anka-` por `--<prefijo>-` en `assets/css/main.css`.
2. Sustituye `.anka-` por `.<prefijo>-` en las clases utilitarias propias (`.anka-card`, `.anka-gradient-bg`, etc.).
3. Sustituye la clave `anka` del objeto `theme.extend.colors` de `tailwind.config.ts` por `<prefijo>`, lo que convierte `bg-anka-bg` en `bg-<prefijo>-bg`.
4. Sustituye en todas las plantillas: `var(--anka-X)` → `var(--<prefijo>-X)`, y `text-anka-muted` → `text-<prefijo>-muted`.

**Nota de sintaxis:** `<prefijo>` es un marcador textual, no CSS válido. Debes sustituirlo por el literal elegido antes de guardar el archivo. Si eliges `<prefijo>` = `ds`, el token queda `--ds-bg` y la clase `.ds-card`.

**Comando de verificación del renombrado** (una vez elegido el valor, debe devolver 0 resultados):

```bash
grep -rn -- "--anka-\|\.anka-\|Anka\|anka-" --include='*.vue' --include='*.ts' --include='*.css' . | wc -l
```

---

## 2. Resumen de arquitectura

### 2.1 Diagrama de flujo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                NAVEGADOR                                  │
│                                                                           │
│   1. GET https://app-<stage>.<DOMINIO_BASE>/cualquier/ruta                │
│      └──> CloudFront ──> S3 (<BUCKET>)                                    │
│           · index.html         → Cache-Control: no-store                  │
│           · /_nuxt/*.js|css    → Cache-Control: max-age=31536000, public  │
│           · 404/403 → index.html (SPA fallback, ver nota 2.5)             │
│                                                                           │
│   2. El bundle arranca. Nuxt monta la SPA en el cliente. NO hay SSR.      │
│                                                                           │
│   3. Las llamadas de datos salen DIRECTAS del navegador al API:           │
│      fetch(`${NUXT_PUBLIC_API_BASE_URL}/...`)                             │
│      con cabecera  Authorization: Bearer <access token de la cookie>      │
│                              │                                            │
└──────────────────────────────┼────────────────────────────────────────────┘
                               │  CORS (el backend declara los orígenes)
                               ▼
                 ┌──────────────────────────────────┐
                 │  BACKEND NestJS  (API Gateway +  │
                 │  Lambda, o localhost:3000 en dev)│
                 │                                  │
                 │   /auth/*  ──> AWS Cognito       │
                 │   /<dominio>/*  ──> PostgreSQL   │
                 └──────────────────────────────────┘
```

**Punto clave:** CloudFront y S3 sirven **solamente archivos estáticos**. No hay proxy inverso hacia el API, no hay rewrite, no hay función edge. El navegador habla con dos orígenes distintos y por eso **CORS es obligatorio en el backend**.

### 2.2 Modelo SPA

- **Una sola entrada HTML.** `nuxt generate` con `ssr: false` produce un `index.html` que no contiene el marcado de ninguna página: solo el div raíz y las etiquetas `<script>`/`<link>` del bundle.
- **El router vive en el cliente.** Nuxt construye las rutas desde `pages/` en tiempo de build y resuelve la navegación con el History API.
- **Toda la lógica de sesión es de cliente.** Las cookies se leen y escriben con `useCookie`, que en modo SPA opera sobre `document.cookie`.
- **No hay `server/` ni Nitro en runtime.** El preset `static` desactiva el servidor Nitro de producción.

### 2.3 Por qué `ssr: false`

| Razón | Detalle |
|---|---|
| **El destino es S3** | S3 sirve objetos, no ejecuta Node. Un build SSR requeriría Lambda@Edge o un contenedor, con el coste y la complejidad operativa asociados. |
| **Es una consola interna autenticada** | No hay SEO que proteger ni tiempo de primer pintado crítico para un buscador. Todo el contenido está detrás de login. |
| **La sesión es un token en cookie no-httpOnly** | Un render de servidor necesitaría reenviar el token al backend desde el servidor, duplicando la lógica de auth. Con SPA, el único actor es el navegador. |
| **Evita la clase entera de bugs de hidratación** | Sin SSR no hay desajustes servidor/cliente por `Date.now()`, `window`, `localStorage` o cookies. |

**Qué pierdes:** tiempo hasta primer contenido mayor (el usuario ve el HTML vacío hasta que descarga y ejecuta el JS), y cero SEO. Ambas cosas son aceptables para una consola interna.

### 2.4 Por qué `nitro: { preset: 'static' }`

`ssr: false` por sí solo **no** garantiza una salida puramente estática: Nuxt sigue eligiendo un preset de Nitro según el entorno detectado (`node-server` por defecto) y `.output/server/index.mjs` seguiría existiendo.

Con `nitro: { preset: 'static' }`:

- `nuxt generate` escribe todo lo publicable en `.output/public/` y **nada más** es necesario en producción.
- Se desactiva la generación del handler de servidor.
- El comando de despliegue se reduce a `aws s3 sync .output/public/ s3://<BUCKET>`.

**Si lo omites:** `.output/` contendrá un `server/` que no se sube a S3; el despliegue seguirá funcionando por casualidad (porque solo se sincroniza `public/`), pero el build tarda más y el `Dockerfile` basado en `node .output/server/index.mjs` da la falsa impresión de ser viable (ver corrección 18.4).

### 2.5 Nota sobre el fallback de rutas en CloudFront

Una SPA con rutas del lado del cliente necesita que **cualquier** path desconocido devuelva `index.html`, o `GET /mi/ruta` en una recarga dará 403/404 de S3.

🟥 **DEUDA — NO REPLICAR (por omisión):** El repositorio original **no contiene ninguna configuración de CloudFront como código**: ni plantilla CloudFormation, ni Terraform, ni CDK. La distribución se administra fuera del repositorio y el workflow solo la invalida por id. **No se puede determinar desde el repositorio** cómo está configurado el fallback 403/404 → `/index.html`.

**Acción obligatoria para el proyecto nuevo:** configura explícitamente en la distribución CloudFront dos *Custom Error Responses*:

| HTTP Error Code | Response Page Path | HTTP Response Code | TTL |
|---|---|---|---|
| 403 | `/index.html` | 200 | 0 |
| 404 | `/index.html` | 200 | 0 |

y documenta esa configuración en el repositorio de infraestructura.

---

## 3. Prerrequisitos

### 3.1 Versiones exactas

| Herramienta | Versión | Dónde está fijada en el original | Recomendación para el proyecto nuevo |
|---|---|---|---|
| **Node.js** | **22** | `.github/workflows/deploy.yml` → `actions/setup-node@v4` con `node-version: 22`. El entorno de desarrollo verificado corre `v22.14.0`. | Fija `22` en CI y añade un `.nvmrc` con `22`. |
| **pnpm** | **CI: 11 · local: 10.33.3** | CI: `pnpm/action-setup@v3` con `version: 11`. Local verificado: `10.33.3`. | 🟥 **Es una discrepancia real.** Unifica con el campo `packageManager` de `package.json` (ver corrección 18.7). |
| **Lockfile** | `lockfileVersion: '9.0'` | `pnpm-lock.yaml`, primera línea. | Requiere pnpm ≥ 9. Compatible con 10 y 11. |
| **Node en Docker** | `node:26-alpine` | `Dockerfile`, ambas etapas. | 🟥 No coincide con el 22 del CI. Ver corrección 18.4. |

### 3.2 Variables de entorno

Solo existe **una** variable pública, y se resuelve en **tiempo de build**:

| Variable | Dónde se consume | Valor por defecto | Ámbito |
|---|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | `nuxt.config.ts` → `runtimeConfig.public.apiBase` | `http://localhost:3000` | Build time. Queda **incrustada en el bundle JS**. |

**Implicación fundamental:** el artefacto estático de `dev` **no se puede promocionar** a `qa` o `prod`. Cada stage necesita su propio build. Ver sección 16.6.

### 3.3 Backend disponible

El frontend es inútil sin un backend que exponga, como mínimo, el contrato de autenticación de la sección 10.9. Antes de empezar necesitas:

- Un backend accesible en `NUXT_PUBLIC_API_BASE_URL`.
- Que ese backend declare como origen CORS permitido el del frontend (`http://localhost:4200` **y** `http://127.0.0.1:4200` en desarrollo; ver sección 21.4).
- Un user pool de Cognito (o equivalente) con los grupos `<ROL_A>` y `<ROL_B>` creados, y al menos un usuario confirmado en cada uno para poder probar el RBAC.

---

## 4. `package.json` completo

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal del original, con el nombre parametrizado y los scripts de dominio marcados.

Archivo: `package.json`

```json
{
  "name": "<app>-frontend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "shoot": "node scripts/audit-shoot.mjs",
    "parity": "node scripts/parity.mjs",
    "diff": "node scripts/visual-diff.mjs",
    "parity:shots": "node scripts/audit-shoot.mjs",
    "parity:diff": "node scripts/visual-diff.mjs",
    "test:auth-error": "node --experimental-strip-types --test utils/formatAuthError.test.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "module",
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.14.0",
    "@primeuix/themes": "^3.0.0",
    "nuxt": "^4.4.8",
    "pixelmatch": "^7.2.0",
    "playwright": "^1.62.1",
    "pngjs": "^7.0.0",
    "sharp": "^0.35.3",
    "tailwindcss-primeui": "^0.6.1"
  },
  "dependencies": {
    "@nuxtjs/color-mode": "^4.0.1",
    "@nuxtjs/google-fonts": "^3.2.0",
    "@pinia/nuxt": "^0.11.3",
    "@primevue/nuxt-module": "^4.5.5",
    "echarts": "^6.1.0",
    "pinia": "^3.0.4",
    "primeicons": "^8.0.0",
    "primevue": "^4.5.5",
    "vue-echarts": "^8.1.0"
  }
}
```

### 4.1 Qué hace cada dependencia

| Paquete | Rango | Ámbito | Para qué sirve | ¿Imprescindible? |
|---|---|---|---|---|
| `nuxt` | `^4.4.8` | dev | El framework. Aporta el router file-based, los auto-imports, el sistema de módulos y los comandos `dev`/`build`/`generate`. | **Sí** |
| `@nuxtjs/tailwindcss` | `^6.14.0` | dev | Módulo que integra Tailwind: inyecta PostCSS, descubre automáticamente los paths de `content` (por eso `tailwind.config.ts` tiene `content: []`) y expone el viewer en dev. | **Sí** |
| `tailwindcss-primeui` | `^0.6.1` | dev | Plugin de Tailwind que publica como utilidades los tokens semánticos del tema de PrimeVue. Evita que Tailwind y PrimeVue tengan paletas divergentes. | Recomendado |
| `@primevue/nuxt-module` | `^4.5.5` | prod | Registra PrimeVue en Nuxt y **auto-importa todos los componentes** (`<Button>`, `<InputText>`, `<Password>`, `<Message>`, `<Menu>`, `<AutoComplete>`, `<IconField>`, `<InputIcon>`…) sin necesidad de importarlos. | **Sí** |
| `primevue` | `^4.5.5` | prod | La librería de componentes en sí. | **Sí** |
| `@primeuix/themes` | `^3.0.0` | dev | Presets de tema de PrimeVue v4. Se importa `Aura` en `nuxt.config.ts`. ⚠️ Está en `devDependencies` pero se consume en `nuxt.config.ts`, que solo se ejecuta en build: correcto para este flujo. | **Sí** |
| `primeicons` | `^8.0.0` | prod | Fuente de iconos `pi pi-*`. Se carga vía `css: ['primeicons/primeicons.css']`. Se usa en spinners, campos con icono y menús. | Sí (si usas PrimeVue) |
| `@nuxtjs/color-mode` | `^4.0.1` | prod | Gestiona la preferencia claro/oscuro, la persiste en `localStorage` y aplica la clase al `<html>` antes del primer pintado (sin flash). | **Sí** |
| `@nuxtjs/google-fonts` | `^3.2.0` | prod | Descarga y auto-hospeda la familia tipográfica declarada; genera los `@font-face` y el `preload`. | Opcional |
| `@pinia/nuxt` | `^0.11.3` | prod | Integra Pinia con Nuxt: auto-import de `defineStore` y de los stores de `stores/`. | Sí |
| `pinia` | `^3.0.4` | prod | El store. Se usa para estado compartido entre pantallas (selección global, filtros). | Sí |
| `echarts` | `^6.1.0` | prod | Motor de gráficos. Se importa **por módulos** (tree-shaking manual, ver sección 13). | Si hay gráficos |
| `vue-echarts` | `^8.1.0` | prod | Wrapper Vue del canvas de ECharts. Aporta el componente `VChart` con `autoresize`. | Si hay gráficos |
| `playwright` | `^1.62.1` | dev | Navegador headless para los scripts de auditoría visual. | 🟨 Solo si copias `scripts/` |
| `sharp` | `^0.35.3` | dev | Procesamiento de imagen para el comparador visual. | 🟨 Ídem |
| `pixelmatch` | `^7.2.0` | dev | Comparación pixel a pixel. ⚠️ Declarado pero **no se importa en ningún script del repositorio**: `visual-diff.mjs` usa `sharp` y su propio SSIM. | 🟥 Dependencia muerta |
| `pngjs` | `^7.0.0` | dev | Lectura/escritura PNG. ⚠️ Igual que `pixelmatch`: declarado y **no importado** en ningún script. | 🟥 Dependencia muerta |

### 4.2 Qué hace cada script

| Script | Comando | Cuándo se usa | Categoría |
|---|---|---|---|
| `dev` | `nuxt dev` | Servidor de desarrollo con HMR en `127.0.0.1:4200` (el puerto y host vienen de `nuxt.config.ts`, no del script). | 🟩 |
| `build` | `nuxt build` | Build genérico. **Con `preset: 'static'` no produce un servidor usable**; para desplegar usa `generate`. Ver sección 16.1. | 🟩 |
| `generate` | `nuxt generate` | **El comando de despliegue.** Produce `.output/public/` listo para S3. | 🟩 |
| `preview` | `nuxt preview` | Sirve localmente la salida de build para inspección. | 🟩 |
| `postinstall` | `nuxt prepare` | Genera `.nuxt/` (tipos, `tsconfig.json`, declaraciones de auto-imports). **Sin esto el editor no tipa nada.** Ver sección 21.7. | 🟩 |
| `test:auth-error` | `node --experimental-strip-types --test utils/formatAuthError.test.ts` | El **único** test automatizado del repositorio. Usa el runner nativo de Node y el stripping de tipos nativo (requiere Node ≥ 22). | 🟩 |
| `shoot`, `parity:shots` | `node scripts/audit-shoot.mjs` | Captura screenshots de cada vista a 1536×1024 contra el dev server. | 🟨 |
| `parity` | `node scripts/parity.mjs` | Verifica una especificación DOM/texto por pantalla y reporta % de cumplimiento. | 🟨 |
| `diff`, `parity:diff` | `node scripts/visual-diff.mjs` | Compara screenshots contra imágenes de mockup usando Sobel + SSIM. | 🟨 |

🟥 **Faltan scripts que deberías añadir desde el día uno:** no hay `lint`, no hay `typecheck`, no hay `test` agregador. Ver corrección 18.9.

---

## 5. `nuxt.config.ts` completo

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal con los textos de marca parametrizados.

Archivo: `nuxt.config.ts`

```ts
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2026-06-26',
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@primevue/nuxt-module'
  ],
  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],
  nitro: { preset: 'static' },
  // Evita que Vite/chokidar abran watchers sobre salidas y scripts (EMFILE).
  ignore: ['**/.output/**', '**/.nuxt/**', '**/scripts/**'],
  vite: {
    server: {
      watch: {
        ignored: ['**/.git/**', '**/.output/**', '**/.nuxt/**', '**/node_modules/**', '**/scripts/**']
      }
    }
  },
  devServer: {
    host: '127.0.0.1',
    port: 4200
  },
  components: {
    dirs: [{ path: '~/components', pathPrefix: false }]
  },
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },
  googleFonts: {
    families: {
      'Plus Jakarta Sans': [300, 400, 500, 600, 700, 800]
    },
    display: 'swap',
    preload: true
  },
  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark'
        }
      }
    }
  },
  app: {
    head: {
      title: '<org> — <descripción corta de la app>',
      htmlAttrs: {
        lang: 'es'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '<descripción larga de la app para buscadores y previews>'
        }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    }
  }
})
```

### 5.1 Explicación opción por opción

| Opción | Valor | Por qué está | Qué pasa si se omite |
|---|---|---|---|
| `ssr` | `false` | Convierte el proyecto en SPA pura. Es la decisión arquitectónica raíz (sección 2.3). | Nuxt renderiza en servidor: necesitas Node en producción, aparecen errores de hidratación con cookies y `window`, y el despliegue a S3 deja de ser posible. |
| `compatibilityDate` | `'2026-06-26'` | Congela el comportamiento por defecto de Nitro/Nuxt a esa fecha. Protege de cambios de comportamiento al actualizar menor. | Nuxt emite un warning en cada arranque y adopta los defaults más recientes, que pueden cambiar sin aviso entre versiones menores. |
| `modules` | 5 módulos | Orden importante solo en un punto: `@nuxtjs/tailwindcss` antes que `@primevue/nuxt-module` para que el plugin `tailwindcss-primeui` tenga el tema disponible. | Sin `@nuxtjs/tailwindcss` no hay Tailwind. Sin `@nuxtjs/color-mode` no hay tema. Sin `@primevue/nuxt-module` los componentes de PrimeVue no se auto-importan y toda plantilla que use `<Button>` falla. |
| `css` | `['~/assets/css/main.css', 'primeicons/primeicons.css']` | `main.css` trae las directivas `@tailwind` y los tokens. El segundo carga la fuente de iconos `pi pi-*`. El orden importa: los tokens deben cargarse antes para que PrimeVue los pueda sobrescribir. | Sin `main.css` no hay ni Tailwind ni tokens: la app sale sin estilo. Sin `primeicons.css`, los `<span class="pi pi-...">` quedan como cuadrados vacíos. |
| `nitro.preset` | `'static'` | Fuerza salida 100 % estática (sección 2.4). | Se genera un `.output/server/` innecesario y el build tarda más. |
| `ignore` | `['**/.output/**', '**/.nuxt/**', '**/scripts/**']` | Excluye del **escaneo de Nuxt** (páginas, componentes, layouts) esas carpetas. Crítico para `scripts/`: sin ello Nuxt intenta analizar los `.mjs` de Playwright. | Nuxt escanea directorios de salida y scripts, lo que aumenta el consumo de descriptores de fichero y puede provocar `EMFILE` (sección 21.1). |
| `vite.server.watch.ignored` | 5 globs | Es la **segunda mitad** del mismo problema: `ignore` afecta al escáner de Nuxt, esto afecta al **watcher de chokidar de Vite**. Son dos mecanismos distintos y hacen falta los dos. | En máquinas con límite bajo de watchers (`ulimit -n` reducido, contenedores) el dev server muere con `EMFILE: too many open files`. |
| `devServer.host` | `'127.0.0.1'` | Escucha solo en loopback IPv4. Evita que Node resuelva `localhost` a `::1` y el backend no reconozca el origen. | Puede escuchar en `::1` o en `0.0.0.0`; el origen de las peticiones pasa a ser `http://[::1]:4200`, que no coincide con la lista CORS del backend (sección 21.4). |
| `devServer.port` | `4200` | Puerto convenido del proyecto. El backend lo tiene en su lista de orígenes permitidos. | Nuxt usa 3000 por defecto, **que es el puerto del backend**: colisión directa. |
| `components.dirs` | `[{ path: '~/components', pathPrefix: false }]` | **Desactiva el prefijo de carpeta** en los nombres auto-importados. Con esto, `components/ui/StatusChip.vue` se usa como `<StatusChip>` y no como `<UiStatusChip>`. | Todos los componentes en subcarpetas pasan a llamarse con el prefijo de su ruta y **todas las plantillas que los usan se rompen**. |
| `colorMode.classSuffix` | `''` | Por defecto el módulo añade `-mode`, generando la clase `dark-mode`. Con sufijo vacío la clase es exactamente `dark`, que es **lo que esperan Tailwind (`darkMode: 'class'`) y PrimeVue (`darkModeSelector: '.dark'`)**. | El `<html>` recibe `class="dark-mode"`: ni las utilidades `dark:` de Tailwind ni el tema oscuro de PrimeVue se activan. Es el error silencioso más fácil de cometer. |
| `colorMode.preference` | `'dark'` | Tema por defecto para un usuario sin preferencia guardada. | Por defecto el módulo usa `'system'`, que sigue al sistema operativo. |
| `colorMode.fallback` | `'dark'` | Tema a usar cuando `preference` es `'system'` pero no se puede determinar. | Fallback a `'light'`. |
| `googleFonts.families` | `{'Plus Jakarta Sans': [300,400,500,600,700,800]}` | Los seis pesos que el design system realmente usa (`font-light` … `font-extrabold`). | Sin la familia declarada, `html { font-family: 'Plus Jakarta Sans' }` cae al fallback `system-ui`. |
| `googleFonts.display` | `'swap'` | Muestra el texto con la fuente de sistema mientras descarga la webfont. Evita el FOIT. | Riesgo de texto invisible durante la descarga. |
| `googleFonts.preload` | `true` | Emite `<link rel="preload">` para los `.woff2`. | La fuente se descubre tarde en la cascada y el swap es más visible. |
| `primevue.options.ripple` | `true` | Efecto de onda al pulsar en los componentes de PrimeVue. Puramente estético. | Botones sin feedback táctil. |
| `primevue.options.theme.preset` | `Aura` | Preset visual de PrimeVue v4. Es la base sobre la que se superponen los tokens propios. | PrimeVue arranca sin tema y los componentes salen sin estilo. |
| `primevue.options.theme.options.darkModeSelector` | `'.dark'` | **Pieza central del patrón triple de tema (sección 7.1).** Le dice a PrimeVue que su variante oscura se activa cuando existe un ancestro con clase `.dark`. | PrimeVue usa su media query `prefers-color-scheme` por defecto: el toggle manual de la app mueve Tailwind y los tokens propios pero **no** los componentes de PrimeVue, que quedan desincronizados. |
| `app.head.title` | string | Título por defecto del documento. | Nuxt pone un título genérico. |
| `app.head.htmlAttrs.lang` | `'es'` | Idioma del documento. Afecta a lectores de pantalla, corrector ortográfico y formateo de números del navegador. | Se asume `en`. |
| `app.head.meta` | charset, viewport, description | `viewport` es **obligatorio** para que el diseño responsive funcione en móvil. | Sin `viewport`, el móvil renderiza a 980 px y escala: todos los breakpoints de Tailwind se comportan como escritorio. |
| `runtimeConfig.public.apiBase` | `process.env.NUXT_PUBLIC_API_BASE_URL \|\| 'http://localhost:3000'` | Única configuración de la app. Se lee con `useRuntimeConfig().public.apiBase`. | Sin ella, cada composable tendría que leer `process.env` directamente, cosa que no funciona en el bundle de cliente. |

### 5.2 Una advertencia sobre `runtimeConfig` en modo estático

El nombre «runtime config» es engañoso aquí. En una SPA generada estáticamente:

- `process.env.NUXT_PUBLIC_API_BASE_URL` se evalúa **cuando corre `nuxt generate`**, no cuando el usuario abre la página.
- El valor queda **literalmente escrito** dentro de los `.js` publicados en S3.
- Cambiar la variable en el servidor no cambia nada: hay que **volver a generar y volver a desplegar**.

Esto es correcto y es el diseño intencional del original, pero debe quedar explícito. Ver sección 16.6 para la alternativa si necesitas configuración en runtime.

---

## 6. Estructura de carpetas

### 6.1 Árbol objetivo completo

```
<app>-frontend/
├── .cursor/                       # Entorno Cloud Agent (sección 17)
│   ├── environment.json
│   ├── install.sh
│   └── start.sh
├── .github/
│   └── workflows/
│       └── deploy.yml             # CI/CD a S3 + CloudFront (sección 16)
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── assets/
│   └── css/
│       └── main.css               # Tokens + utilidades propias (sección 7)
├── components/
│   ├── <Prefijo>Icon.vue          # Icon set propio (sección 12.4)
│   ├── <Prefijo>Mark.vue          # Logotipo sensible al tema
│   ├── AppSidebar.vue             # Shell: navegación lateral
│   ├── AppTopbar.vue              # Shell: barra superior
│   ├── AppBottomNav.vue           # Shell: pestañas inferiores en móvil
│   ├── ThemeToggle.vue            # Shell: conmutador claro/oscuro
│   ├── ui/                        # Design system transversal (sección 12.3)
│   │   ├── PageHeader.vue
│   │   ├── StatusChip.vue
│   │   ├── SignalDot.vue
│   │   ├── CoverageChip.vue
│   │   ├── FilterSelect.vue
│   │   ├── Sparkline.vue
│   │   ├── TableFooter.vue
│   │   ├── ScoreCell.vue
│   │   ├── MetricTile.vue
│   │   └── <Prefijo>DataTable.vue
│   └── <dominio>/                 # Un subdirectorio por área funcional
├── composables/
│   ├── useAuth.ts                 # Sesión completa (sección 10)
│   ├── useApi.ts                  # Cliente HTTP tipado (sección 11)
│   └── useChartTheme.ts           # Tema de ECharts ligado al color mode
├── layouts/
│   ├── default.vue                # Shell de aplicación autenticada
│   └── auth.vue                   # Shell de pantallas públicas
├── middleware/
│   ├── auth.ts                    # Sesión obligatoria + refresco preventivo
│   ├── guest.ts                   # Solo sin sesión
│   ├── <rol-a>.ts                 # RBAC: grupo <ROL_A> o <ROL_B>
│   └── <rol-b>.ts                 # RBAC: solo grupo <ROL_B>
├── pages/
│   ├── index.vue
│   ├── login.vue
│   ├── signup.vue
│   └── <resto de rutas>.vue
├── plugins/
│   ├── auth.ts                    # Hidrata el perfil al arrancar
│   └── echarts.client.ts          # Registra VChart y los módulos de ECharts
├── public/
│   └── images/
│       ├── logo-<app>-light.png
│       └── logo-<app>-dark.png
├── scripts/                       # 🟨 Auditoría visual opcional (sección 17.5)
├── stores/
│   └── <entidad>.ts               # Pinia: estado compartido entre pantallas
├── types/
│   └── api.ts                     # Contratos del backend
├── utils/
│   ├── formatAuthError.ts
│   ├── formatAuthError.test.ts
│   ├── format.ts
│   └── countries.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── .npmrc
├── Dockerfile                     # 🟥 Ver corrección 18.4
├── README.md
├── nuxt.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── tailwind.config.ts
```

### 6.2 Rol de cada directorio

| Directorio | Convención de Nuxt | Qué contiene | Auto-import |
|---|---|---|---|
| `assets/` | Procesado por Vite | CSS, fuentes locales, SVG que pasan por el bundler. Las URLs se reescriben con hash. | No |
| `public/` | Copiado tal cual | Archivos servidos en la raíz sin procesar ni hashear: logos, `favicon.ico`, `robots.txt`. Se referencian con rutas absolutas (`/images/logo.png`). | No |
| `components/` | Auto-import | Componentes Vue. **Con `pathPrefix: false`, el nombre es el del archivo sin la carpeta.** | Sí, global |
| `composables/` | Auto-import | Funciones `useXxx()` que encapsulan lógica reactiva reutilizable. Se exportan con `export const useX = () => {}`. | Sí, por nombre de export |
| `layouts/` | Convención | Envoltorios de página. `default.vue` se aplica si la página no declara otro. Deben contener un `<slot />`. | Vía `definePageMeta({ layout })` |
| `middleware/` | Convención | Guardas de ruta. El nombre del archivo es el identificador usado en `definePageMeta({ middleware })`. | Sí, por nombre de archivo |
| `pages/` | Router file-based | Cada `.vue` genera una ruta. Ver sección 9. | — |
| `plugins/` | Auto-registro | Se ejecutan al arrancar la app, en orden alfabético. El sufijo `.client.ts` limita la ejecución al navegador; `.server.ts` al servidor. | Sí |
| `stores/` | Auto-import (vía `@pinia/nuxt`) | Stores de Pinia con `defineStore`. | Sí, por nombre de export |
| `types/` | Normal | Interfaces y tipos TypeScript. **No** hay auto-import: requieren `import type { X } from '~/types/api'`. | No |
| `utils/` | Auto-import | Funciones puras sin reactividad. Nuxt las auto-importa igual que los composables. | Sí, por nombre de export |
| `scripts/` | Excluido | Herramientas Node sueltas. **Explícitamente excluido** vía `ignore` y `vite.server.watch.ignored`. | No |

### 6.3 Por qué NO se usa el directorio `app/`

Nuxt 4 introdujo una estructura opcional en la que el código de cliente vive bajo `app/` (`app/pages/`, `app/components/`, `app/app.vue`…) y solo la configuración, `server/` y `public/` quedan en la raíz.

**El repositorio original no la usa.** Todo cuelga directamente de la raíz: `pages/`, `components/`, `app.vue`, `error.vue`.

Implicaciones que debes tener claras:

| Implicación | Detalle |
|---|---|
| **`srcDir` es la raíz** | Nuxt detecta automáticamente que no existe `app/` y mantiene `srcDir: '.'`. No hay que configurar nada. |
| **El alias `~` y `@` apuntan a la raíz** | `~/components/X.vue`, `~/utils/format`, `~/types/api` resuelven desde la raíz del repositorio. Si migraras a `app/`, **todos** esos imports cambiarían de destino. |
| **`app.vue` y `error.vue` van en la raíz** | No en `app/app.vue`. |
| **No mezclar** | Si creas un directorio `app/` por error (por ejemplo copiando un snippet de la documentación nueva de Nuxt), Nuxt cambia el `srcDir` y **el resto de carpetas de la raíz deja de ser escaneado**: desaparecen las páginas, los componentes y los middleware sin ningún error claro. Es un fallo difícil de diagnosticar. |
| **Decisión para el proyecto nuevo** | **Mantén la estructura plana de la raíz.** Toda la documentación, todos los paths y todos los bloques de código de este blueprint la asumen. Migrar a `app/` después es un cambio mecánico pero global; hacerlo a medias no funciona. |

### 6.4 Archivos de configuración de raíz

Archivo: `.npmrc` — 🟩 **NÚCLEO**

```
only-built-dependencies-file=false
only-built-dependencies=@parcel/watcher,esbuild
```

Autoriza a pnpm a ejecutar los scripts de instalación (compilación de binarios nativos) **solo** de `@parcel/watcher` y `esbuild`. pnpm ≥ 10 bloquea los scripts de postinstalación por defecto como medida de seguridad; estos dos paquetes los necesitan de verdad.

Archivo: `pnpm-workspace.yaml` — 🟥 **DEUDA — NO REPLICAR TAL CUAL**

```yaml
allowBuilds:
  '@parcel/watcher': set this to true or false
  esbuild: set this to true or false
```

Este archivo está **sin terminar**: los valores son literalmente el texto de ayuda que pnpm imprime, no booleanos. Además duplica, con otra sintaxis, lo que ya resuelve `.npmrc`. **No lo copies.** Si quieres mantener la autorización explícita, usa una sola de las dos vías; la de `.npmrc` es la que está correcta:

Archivo: `pnpm-workspace.yaml` — versión corregida

```yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
```

Archivo: `.gitignore` — 🟩 **NÚCLEO**

```gitignore
# Nuxt dev / build outputs
.nuxt
.output
dist
node_modules


# Environment variables
.env
.env.*
!.env.example

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db
```

Archivo: `.env.example` — 🟩 **NÚCLEO**

```bash
# ============================================================
# <org> <app> - Frontend (.env de ejemplo)
# ------------------------------------------------------------
# Copia este archivo a `.env`:
#
#   cp .env.example .env
#
# El archivo `.env` está en .gitignore y no se sube al repo.
# ============================================================

# URL base del backend NestJS (local por defecto).
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Archivo: `.vscode/extensions.json` — 🟩 **NÚCLEO**

```json
{
  "recommendations": [
    "mikestead.dotenv",
    "usernamehw.errorlens",
    "formulahendry.auto-close-tag",
    "quicktype.quicktype",
    "bradlc.vscode-tailwindcss",
    "vue.volar"
  ]
}
```

Archivo: `.vscode/settings.json` — 🟩 **NÚCLEO**

```json
{
  "git.ignoreLimitWarning": true
}
```

Archivo: `.dockerignore` — 🟨 (solo si conservas el Dockerfile; ver corrección 18.4)

```
node_modules
.nuxt
.output
.git
.github
Dockerfile
.dockerignore
npm-debug.log
.env
```

### 6.5 Sobre `tsconfig.json`

**El repositorio no tiene `tsconfig.json` propio.** Confía enteramente en el `.nuxt/tsconfig.json` que genera `nuxt prepare`. Esto funciona, pero significa que:

- El editor **no tipa nada** hasta que se haya ejecutado `pnpm install` (que dispara `postinstall: nuxt prepare`) o `pnpm dev` al menos una vez.
- No hay forma de endurecer el chequeo de tipos (`strict`, `noUncheckedIndexedAccess`) sin crear el archivo.

**Recomendación para el proyecto nuevo:** crea un `tsconfig.json` mínimo que extienda el generado. Es una línea y habilita el `typecheck`:

Archivo: `tsconfig.json`

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

---

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
   { to: '/mi-ruta', label: 'Mi ruta', icon: 'mi-icono', requiresAdvanced: true }
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

**Regla que no se negocia: toda página privada declara `middleware: ['auth', ...]`, con `'auth'` siempre en primera posición.**

```vue
<script setup lang="ts">
// Ruta privada, cualquier usuario autenticado
definePageMeta({ middleware: ['auth'] })
</script>
```

```vue
<script setup lang="ts">
// Ruta privada, solo <ROL_A> o <ROL_B>
definePageMeta({ middleware: ['auth', '<rol-a>'] })
</script>
```

```vue
<script setup lang="ts">
// Ruta privada, solo <ROL_B>
definePageMeta({ middleware: ['auth', '<rol-b>'] })
</script>
```

```vue
<script setup lang="ts">
// Ruta pública que un usuario con sesión no debe ver
definePageMeta({ layout: 'auth', middleware: 'guest' })
</script>
```

> **Recordatorio de seguridad:** el middleware de cliente es **UX, no seguridad**. Cualquiera puede desactivar JavaScript, editar la cookie o llamar al API con curl. El control real está en el backend (`JwtAuthGuard` + `RolesGuard`). El middleware existe para que el usuario legítimo no vea pantallas rotas.

---

## 10. Autenticación en el cliente, end to end

### 10.1 Visión general del flujo

```
  ARRANQUE DE LA APP
  ──────────────────
  plugins/auth.ts
    └─ ¿hay cookie auth_token?
        ├─ no  → nada; el middleware redirigirá al login cuando toque
        └─ sí  → GET /auth/profile  →  rellena useState('auth_user')
                   └─ si falla → logout() → /login

  NAVEGACIÓN A UNA RUTA PRIVADA
  ─────────────────────────────
  middleware/auth.ts
    ├─ sin token                      → navigateTo('/login')
    ├─ token expira en < 5 min        → refreshSession()
    │     └─ si falla                 → logout() → /login
    └─ sin perfil en memoria          → fetchProfile()
          └─ si falla                 → logout() → /login

  LLAMADA DE DATOS
  ────────────────
  useApi().get(path)  →  useAuth().apiFetch(url)
    ├─ añade Authorization: Bearer <token>
    ├─ 2xx                            → devuelve el cuerpo
    └─ 401 con refresh disponible
          ├─ refreshSession() OK      → REINTENTA UNA VEZ con el token nuevo
          └─ refresco falla o 2.º 401 → logout() + aviso + throw
```

### 10.2 `composables/useAuth.ts` transcrito completo

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal del archivo real (375 líneas), con los grupos parametrizados. Este es **el archivo más importante del repositorio**.

Archivo: `composables/useAuth.ts`

```ts
import { ref, computed } from 'vue'
import { formatAuthError } from '~/utils/formatAuthError'

interface UserProfile {
  sub: string
  email: string
  username: string
  groups: string[]
  firstName?: string
  lastName?: string
  name?: string
}

function decodeJwtPayload(jwt: string | null | undefined): Record<string, unknown> | null {
  if (!jwt) return null
  try {
    const payloadBase64 = jwt.split('.')[1]
    const json = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function namesFromClaims(claims: Record<string, unknown> | null) {
  if (!claims) return { firstName: '', lastName: '', email: '', name: '' }
  const given = typeof claims.given_name === 'string' ? claims.given_name.trim() : ''
  const family = typeof claims.family_name === 'string' ? claims.family_name.trim() : ''
  const name = typeof claims.name === 'string' ? claims.name.trim() : ''
  const emailClaim = typeof claims.email === 'string' ? claims.email.trim() : ''
  const username = claims['cognito:username'] ?? claims.username
  const usernameEmail =
    typeof username === 'string' && username.includes('@') ? username.trim() : ''
  const parts = name.split(/\s+/).filter(Boolean)
  return {
    firstName: given || parts[0] || '',
    lastName: family || parts.slice(1).join(' ') || '',
    email: emailClaim || usernameEmail,
    name
  }
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // Cookies de sesión (compatibles con SSR)
  const token = useCookie<string | null>('auth_token', {
    maxAge: 3600, // 1 hora (alineado con la vida del access token de Cognito)
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const refreshTokenCookie = useCookie<string | null>('auth_refresh_token', {
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const userEmailCookie = useCookie<string | null>('auth_user_email', {
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const idTokenCookie = useCookie<string | null>('auth_id_token', {
    maxAge: 3600,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const userFirstNameCookie = useCookie<string | null>('auth_user_first_name', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const userLastNameCookie = useCookie<string | null>('auth_user_last_name', {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  const user = useState<UserProfile | null>('auth_user', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const handleError = (err: any): string => formatAuthError(err)

  // 1. Login
  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`${apiBase}/auth/login`, {
        method: 'POST',
        body: { email, password }
      })

      token.value = response.accessToken
      refreshTokenCookie.value = response.refreshToken
      idTokenCookie.value = response.idToken || null
      userEmailCookie.value = email
      const fromId = namesFromClaims(decodeJwtPayload(response.idToken))
      if (fromId.firstName) userFirstNameCookie.value = fromId.firstName
      if (fromId.lastName) userLastNameCookie.value = fromId.lastName

      await fetchProfile()
      return { success: true }
    } catch (err: any) {
      const errStr = handleError(err)
      error.value = errStr
      return { success: false, error: errStr }
    } finally {
      loading.value = false
    }
  }

  // 2. Registro
  const signUp = async (data: {
    email: string
    password: string
    phoneNumber: string
    firstName: string
    lastName: string
    acceptedTerms: boolean
  }) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`${apiBase}/auth/signup`, {
        method: 'POST',
        body: data
      })
      return { success: true, message: response.message }
    } catch (err: any) {
      const errStr = handleError(err)
      error.value = errStr
      return { success: false, error: errStr }
    } finally {
      loading.value = false
    }
  }

  // 3. Confirmación de registro
  const confirmSignUp = async (email: string, code: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`${apiBase}/auth/confirm`, {
        method: 'POST',
        body: { email, code }
      })
      return { success: true, message: response.message }
    } catch (err: any) {
      const errStr = handleError(err)
      error.value = errStr
      return { success: false, error: errStr }
    } finally {
      loading.value = false
    }
  }

  // 4. Reenvío del código de confirmación
  const resendCode = async (email: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`${apiBase}/auth/resend-code`, {
        method: 'POST',
        body: { email }
      })
      return { success: true, message: response.message }
    } catch (err: any) {
      const errStr = handleError(err)
      error.value = errStr
      return { success: false, error: errStr }
    } finally {
      loading.value = false
    }
  }

  // 5. Solicitud de recuperación de contraseña
  const forgotPassword = async (email: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        body: { email }
      })
      return { success: true, message: response.message }
    } catch (err: any) {
      const errStr = handleError(err)
      error.value = errStr
      return { success: false, error: errStr }
    } finally {
      loading.value = false
    }
  }

  // 6. Confirmación del restablecimiento de contraseña
  const confirmForgotPassword = async (data: {
    email: string
    code: string
    newPassword: string
  }) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`${apiBase}/auth/confirm-password`, {
        method: 'POST',
        body: data
      })
      return { success: true, message: response.message }
    } catch (err: any) {
      const errStr = handleError(err)
      error.value = errStr
      return { success: false, error: errStr }
    } finally {
      loading.value = false
    }
  }

  // 7. Perfil
  const fetchProfile = async () => {
    if (!token.value) return
    try {
      const response = await $fetch<any>(`${apiBase}/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      const fromId = namesFromClaims(decodeJwtPayload(idTokenCookie.value))
      const fromAccess = namesFromClaims(decodeJwtPayload(token.value))
      const profile = response.user || {}
      const firstName =
        profile.firstName || fromId.firstName || fromAccess.firstName || userFirstNameCookie.value || ''
      const lastName =
        profile.lastName || fromId.lastName || fromAccess.lastName || userLastNameCookie.value || ''
      user.value = {
        ...profile,
        email: profile.email || fromId.email || fromAccess.email || userEmailCookie.value || '',
        firstName,
        lastName,
        name: profile.name || fromId.name || [firstName, lastName].filter(Boolean).join(' ')
      }
      if (firstName) userFirstNameCookie.value = firstName
      if (lastName) userLastNameCookie.value = lastName
      if (user.value.email) userEmailCookie.value = user.value.email
    } catch (err) {
      // Si falla, la sesión es inválida o está bloqueada
      await logout()
    }
  }

  // 8. Refresco de sesión
  const refreshSession = async (): Promise<boolean> => {
    if (!refreshTokenCookie.value || !userEmailCookie.value) {
      await logout()
      return false
    }

    try {
      const response = await $fetch<any>(`${apiBase}/auth/refresh`, {
        method: 'POST',
        body: {
          email: userEmailCookie.value,
          refreshToken: refreshTokenCookie.value
        }
      })
      token.value = response.accessToken
      if (response.idToken) idTokenCookie.value = response.idToken
      return true
    } catch (err) {
      console.error('Session refresh failed:', err)
      await logout()
      return false
    }
  }

  // 9. Cierre de sesión
  const logout = async () => {
    if (token.value) {
      try {
        await $fetch<any>(`${apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        })
      } catch (err) {
        console.error('Error during backend global logout:', err)
      }
    }
    // Limpia cookies y estado local
    token.value = null
    refreshTokenCookie.value = null
    idTokenCookie.value = null
    userEmailCookie.value = null
    userFirstNameCookie.value = null
    userLastNameCookie.value = null
    user.value = null

    navigateTo('/login')
  }

  // 10. Envoltorio de fetch con token automático y reintento único ante 401
  const apiFetch = async <T = any>(request: string, options: any = {}): Promise<T> => {
    const headers = { ...options.headers }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    try {
      return await $fetch<T>(request, {
        ...options,
        headers
      })
    } catch (err: any) {
      // Sesión expirada: intenta refrescar una sola vez
      if (err.status === 401 && refreshTokenCookie.value && userEmailCookie.value) {
        const refreshed = await refreshSession()
        if (refreshed && token.value) {
          const retryHeaders = { ...options.headers }
          retryHeaders['Authorization'] = `Bearer ${token.value}`
          return await $fetch<T>(request, {
            ...options,
            headers: retryHeaders
          })
        }
      }

      // Si sigue sin autorizar o el refresco falló, cierra sesión y propaga
      if (err.status === 401) {
        await logout()
        const feedbackMsg = err.data?.message || 'Su cuenta ha sido bloqueada o la sesión ha expirado.'
        alert(feedbackMsg)
      }

      throw err
    }
  }

  const isAdmin = computed(() => user.value?.groups?.includes('<ROL_B>') || false)

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    signUp,
    confirmSignUp,
    resendCode,
    forgotPassword,
    confirmForgotPassword,
    fetchProfile,
    refreshSession,
    logout,
    apiFetch
  }
}
```

### 10.3 Explicación método por método

| Miembro | Firma | Qué hace |
|---|---|---|
| `decodeJwtPayload` | `(jwt) => Record<string,unknown> \| null` | Helper privado. Decodifica **solo el payload** de un JWT con `atob`, convirtiendo base64url a base64 estándar (`-`→`+`, `_`→`/`). **No verifica la firma** y no debe usarse para decisiones de seguridad: solo para leer claims de presentación. Devuelve `null` ante cualquier error. |
| `namesFromClaims` | `(claims) => {firstName,lastName,email,name}` | Helper privado. Normaliza los claims de Cognito a nombre y apellido. Prioriza `given_name`/`family_name`; si no están, parte `name` por espacios; para el email cae en `email` y, si falta, en `cognito:username` cuando contiene `@`. |
| `token` | `CookieRef<string\|null>` | Cookie `auth_token`. El access token. `isAuthenticated` se deriva solo de su presencia. |
| `user` | `Ref<UserProfile\|null>` vía `useState('auth_user')` | **Estado global compartido.** `useState` garantiza que todos los componentes vean la misma instancia. |
| `loading` | `Ref<boolean>` | 🟥 Creado con `ref()`, **no** con `useState`: **cada llamada a `useAuth()` crea su propio `loading`**. Dos componentes que llamen al composable no comparten el indicador. Ver corrección 18.8. |
| `error` | `Ref<string\|null>` | Mismo problema que `loading`. |
| `isAuthenticated` | `ComputedRef<boolean>` | `!!token.value`. Solo mira si **existe** la cookie, no si el token es válido ni si expiró. |
| `isAdmin` | `ComputedRef<boolean>` | `user.groups.includes('<ROL_B>')`. ⚠️ Es `false` mientras el perfil no esté cargado. **No se usa en ninguna parte del repositorio original.** |
| `login(email, password)` | `Promise<{success, error?}>` | `POST /auth/login`. Guarda los tres tokens y el email en cookies, extrae nombre y apellido del `idToken` y llama a `fetchProfile()`. **No navega**: la página decide a dónde ir. |
| `signUp(data)` | `Promise<{success, message?, error?}>` | `POST /auth/signup`. No inicia sesión: deja al usuario en el paso de confirmación. |
| `confirmSignUp(email, code)` | `Promise<{success, message?, error?}>` | `POST /auth/confirm`. Valida el OTP. |
| `resendCode(email)` | `Promise<{success, message?, error?}>` | `POST /auth/resend-code`. |
| `forgotPassword(email)` | `Promise<{success, message?, error?}>` | `POST /auth/forgot-password`. Dispara el envío del código. |
| `confirmForgotPassword({email, code, newPassword})` | `Promise<{success, message?, error?}>` | `POST /auth/confirm-password`. |
| `fetchProfile()` | `Promise<void>` | `GET /auth/profile` con Bearer. **Fusiona tres fuentes** en este orden de prioridad: respuesta del backend → claims del `idToken` → claims del `accessToken` → cookies de respaldo. Reescribe las cookies con lo que resuelva. **Ante cualquier error hace `logout()`**: asume que el fallo significa sesión inválida o cuenta bloqueada. |
| `refreshSession()` | `Promise<boolean>` | `POST /auth/refresh` con `{email, refreshToken}`. Actualiza `auth_token` y, si viene, `auth_id_token`. **El backend no devuelve un refresh token nuevo**, así que `auth_refresh_token` no se rota: su validez es la que fije Cognito. Ante fallo, `logout()` y `false`. |
| `logout()` | `Promise<void>` | Intenta `POST /auth/logout` (revocación global en Cognito), ignora el fallo, **borra las seis cookies**, vacía `user` y navega a `/login`. |
| `apiFetch<T>(url, options)` | `Promise<T>` | Ver 10.5. |

**Nota sobre `handleError`:** es un alias de una línea de `formatAuthError`. Existe como punto de extensión por si quieres meter telemetría; hoy no aporta nada.

### 10.4 Tabla completa de cookies

🟩 **NÚCLEO REUTILIZABLE.** Las seis cookies comparten `path: '/'`, `sameSite: 'lax'` y `secure: process.env.NODE_ENV === 'production'`.

| Nombre | Contenido | `maxAge` | Por qué existe |
|---|---|---|---|
| `auth_token` | Access token de Cognito (JWT). | `3600` (1 h) | La credencial que se envía en `Authorization: Bearer`. Su `maxAge` iguala la vida que Cognito da al token. |
| `auth_refresh_token` | Refresh token de Cognito (opaco). | `2592000` (30 d) | Permite obtener un access token nuevo sin volver a pedir contraseña. |
| `auth_id_token` | ID token de Cognito (JWT con los claims de identidad). | `3600` (1 h) | **No se envía al API.** Solo se decodifica localmente para extraer `given_name`, `family_name`, `name` y `email`. |
| `auth_user_email` | Email en texto plano. | `2592000` (30 d) | **Imprescindible para el refresco:** el endpoint `POST /auth/refresh` exige `{email, refreshToken}` porque el backend necesita calcular el `SECRET_HASH` de Cognito. Sin esta cookie no se puede refrescar. |
| `auth_user_first_name` | Nombre. | `2592000` (30 d) | Caché de presentación: evita que el avatar y el nombre parpadeen mientras se carga el perfil. |
| `auth_user_last_name` | Apellido. | `2592000` (30 d) | Ídem. |

**Observaciones críticas:**

1. 🟥 **Ninguna es `httpOnly`.** No puede serlo: las escribe JavaScript. Significa que **cualquier XSS roba la sesión completa**. Es una característica inherente a este diseño; mitígala con una CSP estricta y sanitizando todo HTML dinámico. La alternativa real (cookie `httpOnly` emitida por el backend) exigiría `credentials: 'include'`, CORS con origen explícito y cambios en el backend.
2. 🟥 **`secure: process.env.NODE_ENV === 'production'`** funciona porque Vite sustituye `process.env.NODE_ENV` en el bundle, pero es frágil y confuso. Usa `!import.meta.dev`, que es la forma idiomática de Nuxt.
3. **`maxAge` no es la validez real del token.** Es cuándo el navegador borra la cookie. Un access token puede expirar antes (reloj desfasado) o la cookie sobrevivir a un token ya revocado. Por eso el middleware decodifica el `exp` en lugar de fiarse de la existencia de la cookie.
4. **`sameSite: 'lax'`** bloquea el envío en peticiones cross-site de terceros pero permite la navegación de primer nivel. Correcto para este caso.

### 10.5 El flujo de `apiFetch` con reintento único

```
apiFetch(url, options)
   │
   ├─ clona options.headers
   ├─ si hay token → headers.Authorization = `Bearer ${token}`
   │
   ├─ $fetch(url, {...options, headers})
   │     └─ 2xx → RETORNA el cuerpo tipado
   │
   └─ catch (err)
         │
         ├─ ¿err.status === 401 Y hay refresh token Y hay email?
         │     │
         │     ├─ SÍ → refreshSession()
         │     │        ├─ ok y hay token nuevo
         │     │        │    └─ reconstruye headers DESDE options.headers (no desde los ya usados)
         │     │        │       y repite $fetch  →  RETORNA o lanza
         │     │        └─ falla → refreshSession ya hizo logout()
         │     │
         │     └─ NO → sigue
         │
         ├─ ¿err.status === 401 (todavía)?
         │     └─ logout()  +  alert(err.data?.message ?? mensaje por defecto)
         │
         └─ throw err      ← SIEMPRE propaga, incluso tras el logout
```

**Detalles que importan:**

- **El reintento es exactamente uno.** El segundo `$fetch` no está en un `try`, así que si vuelve a dar 401 la excepción sale directa sin disparar otro ciclo. No hay bucle infinito posible.
- **Los headers del reintento se reconstruyen desde `options.headers`**, no desde la variable `headers` ya mutada. Es correcto: evita arrastrar el `Authorization` caducado.
- **Siempre se hace `throw`.** La capa llamante recibe el error aunque se haya cerrado sesión. Las páginas deben manejarlo.
- 🟥 **`alert()` es inaceptable en producción.** Bloquea el hilo, no se puede estilar y es imposible de testear. Sustitúyelo por el `ToastService` de PrimeVue. Ver corrección 18.6.
- 🟥 **No hay deduplicación de refrescos.** Si cinco llamadas fallan con 401 a la vez, se disparan cinco `POST /auth/refresh` en paralelo. Con Cognito puede provocar invalidaciones cruzadas. La corrección es memorizar la promesa en vuelo:
  ```ts
  let refreshing: Promise<boolean> | null = null
  const refreshSession = (): Promise<boolean> => {
    if (!refreshing) {
      refreshing = doRefresh().finally(() => { refreshing = null })
    }
    return refreshing
  }
  ```
- **No se manejan 403 ni 429.** Un 403 (sin permiso) se propaga crudo. Decide en tu app si merece tratamiento central.

### 10.6 `middleware/auth.ts` — refresco preventivo

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `middleware/auth.ts`

```ts
function isTokenExpired(jwtToken: string): boolean {
  try {
    const payloadBase64 = jwtToken.split('.')[1]
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(decodedJson)
    const bufferSeconds = 300 // margen de 5 minutos para refrescar antes de la expiración real
    return (payload.exp - bufferSeconds) < (Date.now() / 1000)
  } catch (err) {
    return true
  }
}

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { token, user, fetchProfile, refreshSession } = useAuth()

  // Sin token, al login
  if (!token.value) {
    return navigateTo('/login')
  }

  // Refresco preventivo: si el access token expiró o está por expirar, renuévalo
  if (isTokenExpired(token.value)) {
    const refreshed = await refreshSession()
    if (!refreshed || !token.value) {
      return navigateTo('/login')
    }
  }

  // Token presente pero perfil vacío (recarga de página): cárgalo
  if (!user.value) {
    await fetchProfile()

    // Si la carga falló y limpió el token, al login
    if (!token.value) {
      return navigateTo('/login')
    }
  }
})
```

**Por qué el margen de 5 minutos:** sin él, un token que expira en 10 segundos pasaría el control, la navegación ocurriría y la primera llamada de datos de la página fallaría con 401, disparando el camino de reintento. Refrescar antes convierte un fallo visible en una renovación silenciosa. El coste es una llamada `POST /auth/refresh` extra en los últimos 5 minutos de vida del token.

**Por qué `catch { return true }`:** si el token está corrupto o no es un JWT, se trata como expirado. Eso fuerza un refresco que, al fallar, hace `logout()`. Es el comportamiento seguro.

**Dónde se ejecuta:** en modo SPA, siempre en el navegador. En la primera carga, después de los plugins.

### 10.7 Los otros tres middleware

Archivo: `middleware/guest.ts` — 🟩 **NÚCLEO**

```ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { token } = useAuth()

  // Si ya hay sesión, al dashboard
  if (token.value) {
    return navigateTo('/')
  }
})
```

Archivo: `middleware/<rol-a>.ts` — 🟩 **NÚCLEO** (nombre del archivo en minúsculas, sin acentos)

```ts
export default defineNuxtRouteMiddleware(async () => {
  const { user, token, fetchProfile } = useAuth()

  if (token.value && !user.value) {
    await fetchProfile()
  }

  const groups = user.value?.groups || []
  const allowed = groups.includes('<ROL_A>') || groups.includes('<ROL_B>')

  if (!allowed) {
    return navigateTo('/')
  }
})
```

Nota: `<ROL_B>` (el grupo de administración) está incluido deliberadamente, de modo que un administrador puede entrar en todo lo del rol operativo.

Archivo: `middleware/<rol-b>.ts` — 🟥 **DEUDA, versión original**

```ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth()

  // Guarda de ruta solo para administradores
  if (!user.value || !user.value.groups?.includes('<ROL_B>')) {
    return navigateTo('/')
  }
})
```

**Dos problemas:** (a) **no está referenciado por ninguna página** del repositorio, es código muerto; (b) a diferencia del middleware de `<ROL_A>`, **no hidrata el perfil**: si `user` es `null` (recarga directa de una URL de administración), rechaza incluso a un administrador legítimo. Solo funciona encadenado tras `'auth'`. Versión corregida:

Archivo: `middleware/<rol-b>.ts` — versión corregida

```ts
export default defineNuxtRouteMiddleware(async () => {
  const { user, token, fetchProfile } = useAuth()

  if (token.value && !user.value) {
    await fetchProfile()
  }

  if (!user.value?.groups?.includes('<ROL_B>')) {
    return navigateTo('/')
  }
})
```

### 10.8 `plugins/auth.ts`

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `plugins/auth.ts`

```ts
export default defineNuxtPlugin(async (nuxtApp) => {
  const { token, user, fetchProfile } = useAuth()

  // Al arrancar, si hay token pero no hay perfil en memoria,
  // hidrátalo globalmente para que esté listo en cualquier layout o componente.
  if (token.value && !user.value) {
    try {
      await fetchProfile()
    } catch (err) {
      console.error('Failed to restore user profile on app startup:', err)
    }
  }
})
```

**Por qué existe si el middleware ya hace lo mismo:** el middleware solo corre al navegar a una ruta que lo declara. El plugin corre **siempre**, incluso en rutas públicas. Gracias a él, el `AppTopbar` tiene nombre y rol desde el primer render, y una página sin middleware (por descuido) no queda sin perfil.

**Es un plugin universal, no `.client`.** Con `ssr: false` da igual: solo existe el cliente.

**El plugin es `async`, lo que retrasa la primera pintura** hasta que `GET /auth/profile` responde. En una red lenta son cientos de milisegundos de pantalla en blanco. Si te importa, quita el `await` y deja que el perfil llegue de forma asíncrona (los componentes ya son reactivos a `user`).

### 10.9 Contrato EXACTO esperado del backend

🟩 **NÚCLEO.** Verificado contra el controlador y el servicio reales del backend NestJS. Esto es exactamente lo que tu backend debe implementar.

| # | Método | Ruta | Auth | Body de petición | Respuesta 2xx | Consumido por |
|---|---|---|---|---|---|---|
| 1 | `GET` | `/auth/terms-link` | — | — | `200 { url: string }` | `pages/signup.vue` en `onMounted` |
| 2 | `POST` | `/auth/login` | — | `{ email: string, password: string }` | `200 { accessToken, idToken, refreshToken, expiresIn, tokenType }` | `useAuth().login` |
| 3 | `POST` | `/auth/signup` | — | `{ email, password, phoneNumber, firstName, lastName, acceptedTerms }` | `201 { message, userSub, userConfirmed }` | `useAuth().signUp` |
| 4 | `POST` | `/auth/confirm` | — | `{ email: string, code: string }` | `200 { message }` | `useAuth().confirmSignUp` |
| 5 | `POST` | `/auth/resend-code` | — | `{ email: string }` | `200 { message }` | `useAuth().resendCode` |
| 6 | `POST` | `/auth/forgot-password` | — | `{ email: string }` | `200 { message }` | `useAuth().forgotPassword` |
| 7 | `POST` | `/auth/confirm-password` | — | `{ email, code, newPassword }` | `200 { message }` | `useAuth().confirmForgotPassword` |
| 8 | `POST` | `/auth/refresh` | — | `{ email: string, refreshToken: string }` | `200 { accessToken, idToken, expiresIn, tokenType }` | `useAuth().refreshSession` |
| 9 | `POST` | `/auth/logout` | Bearer | — | `200 { message }` | `useAuth().logout` |
| 10 | `GET` | `/auth/profile` | Bearer | — | `200 { message, user: { sub, email, username, groups: string[], firstName, lastName, name? } }` | `useAuth().fetchProfile` |

**Detalles no obvios del contrato:**

1. **`POST /auth/refresh` exige el email**, no solo el refresh token. Con Cognito y un App Client con secreto, el flujo `REFRESH_TOKEN_AUTH` requiere un `SECRET_HASH` calculado sobre el nombre de usuario real. **Esta es la razón de la cookie `auth_user_email`.**
2. **`/auth/refresh` NO devuelve `refreshToken`.** El refresh token original sigue siendo válido hasta que Cognito lo caduca. El cliente no lo rota.
3. **`/auth/profile` envuelve el perfil en una clave `user`.** El composable lee `response.user`, no `response`. Si tu backend devuelve el perfil plano, `fetchProfile` leerá `{}` y perderá los grupos: el RBAC dejará de funcionar silenciosamente.
4. **`groups` viene del claim `cognito:groups`** del access token, propagado por el guard. Es el único dato del que depende todo el RBAC de cliente.
5. **Las respuestas de error deben traer `{ message: string | string[] }`.** `formatAuthError` lo busca en `err.data.message` y une los arrays con espacios. Un backend NestJS con `ValidationPipe` ya devuelve `message` como array de strings.
6. **Códigos relevantes:** `401` para credenciales inválidas o token caducado (es el único que dispara el reintento de `apiFetch`), `403` sin permiso, `4xx`/`5xx` para el resto.
7. **CORS:** el backend debe permitir el origen del frontend con `credentials: true`. Ver sección 21.4.

### 10.10 `utils/formatAuthError.ts`

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal.

Archivo: `utils/formatAuthError.ts`

```ts
export type AuthFailure = {
  status?: number
  statusCode?: number
  name?: string
  message?: string
  data?: { message?: string | string[] }
  cause?: { name?: string; message?: string }
}

function pickStatus(err: AuthFailure): number | undefined {
  const raw = err.status ?? err.statusCode
  return typeof raw === 'number' && raw > 0 ? raw : undefined
}

function pickServerMessage(err: AuthFailure): string | undefined {
  const raw = err.data?.message
  if (Array.isArray(raw) && raw.length) return raw.join(' ')
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return undefined
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

/**
 * Convierte el fallo de $fetch/ofetch en un texto que el usuario puede actuar.
 * Un 500 sin CORS llega como TypeError/"Failed to fetch": no es "sin internet".
 */
export function formatAuthError(err: AuthFailure): string {
  const status = pickStatus(err)
  const serverMessage = pickServerMessage(err)
  const raw = [err.message, err.cause?.message].filter(Boolean).join(' — ')

  if (status) {
    const prefix = `Error HTTP ${status}`
    if (serverMessage) return `${prefix}: ${serverMessage}`
    if (status === 401) return `${prefix}: credenciales inválidas o cuenta no confirmada.`
    if (status === 403) return `${prefix}: no tienes permiso para esta operación.`
    if (status >= 500) {
      return `${prefix}: la API falló al procesar el login.${raw ? ` Detalle: ${raw}` : ''}`
    }
    return serverMessage ? `${prefix}: ${serverMessage}` : `${prefix}.`
  }

  if (isOffline()) {
    return 'Sin conexión a internet. Revisa la red e inténtalo de nuevo.'
  }

  const blob = `${err.name ?? ''} ${raw}`.toLowerCase()
  if (
    blob.includes('failed to fetch') ||
    blob.includes('networkerror') ||
    blob.includes('cors') ||
    blob.includes('access-control-allow-origin') ||
    err.name === 'TypeError'
  ) {
    return (
      'La API no respondió de forma usable (a menudo un 500 al arrancar, o CORS). ' +
      `Detalle: ${raw || err.name || 'sin cuerpo de respuesta'}.`
    )
  }

  return serverMessage || raw || 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}
```

**El problema que resuelve, y por qué merece su propio archivo y sus propios tests:** cuando el backend devuelve 500 **sin** cabeceras CORS, el navegador bloquea la respuesta y `fetch` rechaza con un `TypeError: Failed to fetch` **indistinguible de estar sin internet**. La implementación ingenua («si falla el fetch, es que no hay red») manda al usuario a reiniciar el router mientras el verdadero problema es que la API no arranca. Esta función distingue los dos casos y, en el ambiguo, dice explícitamente las dos causas probables.

**Orden de evaluación:** (1) ¿hay código HTTP? → mensaje del servidor o texto por estado; (2) ¿`navigator.onLine === false`? → sin conexión; (3) ¿la firma del error huele a CORS/fetch fallido? → mensaje combinado; (4) cualquier otra cosa.

Archivo: `utils/formatAuthError.test.ts` — 🟩 **NÚCLEO**. Transcripción literal.

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatAuthError } from './formatAuthError.ts'

test('muestra el mensaje del servidor con el status HTTP', () => {
  const text = formatAuthError({
    status: 503,
    data: {
      message:
        'La API no pudo arrancar: AccessDeniedException en /<app>/backend/<stage>/db_password'
    }
  })
  assert.match(text, /Error HTTP 503/)
  assert.match(text, /AccessDeniedException/)
  assert.doesNotMatch(text, /conexión a internet/)
})

test('401 usa el mensaje de negocio si viene', () => {
  const text = formatAuthError({
    status: 401,
    data: { message: 'Credenciales inválidas. Correo o contraseña incorrectos.' }
  })
  assert.equal(
    text,
    'Error HTTP 401: Credenciales inválidas. Correo o contraseña incorrectos.'
  )
})

test('fetch fallido por CORS/500 no se disfraza de internet', () => {
  const text = formatAuthError({
    name: 'TypeError',
    message: 'Failed to fetch'
  })
  assert.match(text, /API no respondió/)
  assert.match(text, /Failed to fetch/)
  assert.doesNotMatch(text, /verifica tu conexión a internet/)
})

test('500 sin cuerpo sigue siendo HTTP 500', () => {
  const text = formatAuthError({ status: 500, message: 'FetchError' })
  assert.match(text, /Error HTTP 500/)
  assert.match(text, /API falló/)
})
```

Se ejecuta con `pnpm test:auth-error`. No necesita Vitest ni Jest: usa el runner nativo de Node y el stripping de tipos nativo (`--experimental-strip-types`), disponible desde Node 22. **Es el único test del repositorio.**

### 10.11 `pages/login.vue` completo

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal. Una sola página con **tres estados**: `login`, `forgot` y `reset`.

Archivo: `pages/login.vue`

```vue
<template>
  <div class="w-full">
    <div class="text-center mb-8">
      <div class="inline-flex flex-col items-center gap-3 mb-2">
        <<Prefijo>Mark :size="56" />
        <p class="text-xs uppercase tracking-[0.3em] text-<prefijo>-muted font-semibold">{{ brandSuffix }}</p>
      </div>
      <h1 class="text-2xl font-bold tracking-tight mt-4">
        {{ heading }}
      </h1>
      <p class="text-<prefijo>-muted text-sm mt-1">{{ subheading }}</p>
    </div>

    <div class="<prefijo>-card p-8 shadow-2xl">
      <div class="space-y-3 mb-4" v-if="error || successMessage">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="successMessage" severity="success" :closable="false">{{ successMessage }}</Message>
      </div>

      <form v-if="viewState === 'login'" @submit.prevent="handleLogin" class="space-y-5">
        <div class="space-y-1.5">
          <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Correo electrónico
          </label>
          <IconField>
            <InputIcon class="pi pi-envelope" />
            <InputText id="email" v-model="email" type="email" required placeholder="<correo-ejemplo>" class="w-full" />
          </IconField>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
              Contraseña
            </label>
            <button type="button" class="text-xs text-[var(--<prefijo>-accent)] hover:opacity-80" @click="changeState('forgot')">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <IconField>
            <InputIcon class="pi pi-lock" />
            <Password id="password" v-model="password" required placeholder="••••••••" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
          </IconField>
        </div>

        <Button type="submit" label="Ingresar" icon="pi pi-sign-in" class="w-full" :loading="loading" />
      </form>

      <form v-else-if="viewState === 'forgot'" @submit.prevent="handleForgotPassword" class="space-y-5">
        <div class="space-y-1.5">
          <label for="forgotEmail" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Correo electrónico
          </label>
          <IconField>
            <InputIcon class="pi pi-envelope" />
            <InputText id="forgotEmail" v-model="email" type="email" required placeholder="<correo-ejemplo>" class="w-full" />
          </IconField>
        </div>
        <Button type="submit" label="Enviar código de recuperación" class="w-full" :loading="loading" />
        <div class="text-center">
          <button type="button" class="text-xs text-<prefijo>-muted hover:text-[var(--<prefijo>-text)]" @click="changeState('login')">
            Volver al inicio de sesión
          </button>
        </div>
      </form>

      <form v-else @submit.prevent="handleConfirmPassword" class="space-y-4">
        <div class="space-y-1.5">
          <label for="resetCode" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Código de recuperación
          </label>
          <InputText id="resetCode" v-model="resetCode" required maxlength="6" placeholder="123456" class="w-full text-center tracking-widest font-bold" />
        </div>
        <div class="space-y-1.5">
          <label for="newPassword" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Nueva contraseña
          </label>
          <Password id="newPassword" v-model="newPassword" required placeholder="Nueva contraseña" toggle-mask class="w-full" input-class="w-full" />
        </div>
        <Button type="submit" label="Restablecer contraseña" class="w-full mt-2" :loading="loading" />
        <div class="text-center">
          <button type="button" class="text-xs text-<prefijo>-muted hover:text-[var(--<prefijo>-text)]" @click="changeState('forgot')">
            Reenviar código
          </button>
        </div>
      </form>

      <div v-if="viewState === 'login'" class="text-center mt-5">
        <p class="text-sm text-<prefijo>-muted">
          ¿No tienes una cuenta?
          <NuxtLink to="/signup" class="text-[var(--<prefijo>-accent)] hover:opacity-80 font-medium">Regístrate aquí</NuxtLink>
        </p>
      </div>
    </div>

    <p class="text-center mt-6 text-xs text-<prefijo>-muted">&copy; <AÑO> <org>. Todos los derechos reservados.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { login, forgotPassword, confirmForgotPassword, loading, error } = useAuth()

const brandSuffix = '<sufijo de marca>'

const viewState = ref<'login' | 'forgot' | 'reset'>('login')
const email = ref('')
const password = ref('')
const resetCode = ref('')
const newPassword = ref('')
const successMessage = ref('')

const heading = computed(() => {
  if (viewState.value === 'login') return 'Bienvenido de nuevo'
  if (viewState.value === 'forgot') return 'Recuperar contraseña'
  return 'Establecer contraseña'
})

const subheading = computed(() => {
  if (viewState.value === 'login') return 'Ingresa tus credenciales para acceder'
  if (viewState.value === 'forgot') return 'Te enviaremos un código de confirmación a tu correo'
  return 'Ingresa el código recibido y tu nueva contraseña'
})

function changeState(newState: 'login' | 'forgot' | 'reset') {
  viewState.value = newState
  successMessage.value = ''
  if (error.value) error.value = null
}

async function handleLogin() {
  if (!email.value || !password.value) return
  const result = await login(email.value, password.value)
  if (result.success) {
    navigateTo('/')
  }
}

async function handleForgotPassword() {
  successMessage.value = ''
  const result = await forgotPassword(email.value)
  if (result.success) {
    successMessage.value = result.message || 'Código de confirmación enviado a tu correo.'
    changeState('reset')
  }
}

async function handleConfirmPassword() {
  successMessage.value = ''
  const result = await confirmForgotPassword({
    email: email.value,
    code: resetCode.value,
    newPassword: newPassword.value
  })
  if (result.success) {
    successMessage.value = result.message || 'Contraseña restablecida correctamente.'
    changeState('login')
    password.value = ''
  }
}
</script>
```

**Estados y transiciones:**

| Estado | Titular | Acción | Siguiente |
|---|---|---|---|
| `login` | «Bienvenido de nuevo» | `login()` | `navigateTo('/')` si tiene éxito |
| `forgot` | «Recuperar contraseña» | `forgotPassword()` | `reset` si tiene éxito |
| `reset` | «Establecer contraseña» | `confirmForgotPassword()` | `login` con el campo de contraseña vacío |

**Detalles que merece la pena imitar:**
- `@submit.prevent` en el `<form>` en lugar de `@click` en el botón: habilita el envío con Enter y la validación nativa de `required`.
- `changeState` limpia `successMessage` **y** `error` en cada transición: ningún mensaje viejo sobrevive al cambio de pantalla.
- El campo `email` se comparte entre los tres estados: quien pide el código ya no lo vuelve a teclear.
- `:loading="loading"` en el `<Button>` de PrimeVue pone el spinner y deshabilita el botón, evitando el doble envío.
- `error` es un `ref` del composable mutado directamente desde la página (`error.value = null`). Funciona, pero acopla la página al estado interno del composable; expón un método `clearError()` si quieres hacerlo limpio.

### 10.12 `pages/signup.vue` completo

🟩 **NÚCLEO** en su lógica; 🟥 **deuda en su estilado** (ver nota final). Transcripción literal. Dos pasos: formulario de registro y confirmación OTP.

Archivo: `pages/signup.vue`

```vue
<template>
  <div class="w-full">
    <!-- Marca -->
    <div class="text-center mb-8">
      <div class="inline-flex justify-center mb-4">
        <<Prefijo>Mark :size="56" />
      </div>
      <h1 class="text-2xl font-bold tracking-tight">
        {{ isRegistered ? 'Confirmar cuenta' : 'Crear una cuenta' }}
      </h1>
      <p class="text-<prefijo>-muted text-sm mt-1">
        {{ isRegistered ? 'Ingresa el código OTP enviado a tu correo' : 'Regístrate para comenzar' }}
      </p>
    </div>

    <div class="<prefijo>-card p-8 shadow-2xl">

      <!-- Alertas -->
      <div class="space-y-3 mb-4" v-if="error || statusMessage">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Message v-if="statusMessage" severity="success" :closable="false">{{ statusMessage }}</Message>
      </div>

      <!-- Paso 1: registro -->
      <form v-if="!isRegistered" @submit.prevent="handleSignUp" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="firstName" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
              Nombres *
            </label>
            <InputText id="firstName" v-model="form.firstName" type="text" required placeholder="Ej. María" class="w-full" />
          </div>

          <div class="space-y-1.5">
            <label for="lastName" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
              Apellidos *
            </label>
            <InputText id="lastName" v-model="form.lastName" type="text" required placeholder="Ej. García López" class="w-full" />
          </div>
        </div>

        <!-- Teléfono con prefijo de país -->
        <div class="space-y-1.5">
          <label for="phone" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Teléfono *
          </label>
          <div class="flex items-center rounded-xl border border-<prefijo>-border bg-[var(--<prefijo>-bg)] focus-within:border-[var(--<prefijo>-accent)] transition-all duration-200">
            <select
              v-model="selectedCountryCode"
              aria-label="Prefijo de país"
              class="bg-transparent border-none pl-3.5 pr-1 py-2.5 focus:outline-none focus:ring-0 text-xs font-semibold select-none cursor-pointer max-w-[85px] shrink-0"
            >
              <option v-for="c in countries" :key="c.code" :value="c.dialCode">
                {{ c.flag }} {{ c.dialCode }}
              </option>
            </select>
            <div class="h-5 w-px bg-[var(--<prefijo>-border)] shrink-0"></div>
            <input
              id="phone"
              v-model="rawPhone"
              type="tel"
              required
              placeholder="999999999"
              class="w-full bg-transparent border-none pl-3 pr-4 py-2.5 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        <!-- Correo -->
        <div class="space-y-1.5">
          <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Correo electrónico *
          </label>
          <IconField>
            <InputIcon class="pi pi-envelope" />
            <InputText id="email" v-model="form.email" type="email" required placeholder="<correo-ejemplo>" class="w-full" />
          </IconField>
        </div>

        <!-- Contraseña -->
        <div class="space-y-1.5">
          <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Contraseña *
          </label>
          <IconField>
            <InputIcon class="pi pi-lock" />
            <Password id="password" v-model="form.password" required :feedback="false" toggle-mask class="w-full" input-class="w-full" />
          </IconField>

          <!-- Checklist de requisitos -->
          <div v-if="form.password" class="space-y-1.5 mt-2 text-[11px] text-<prefijo>-muted">
            <p class="font-medium">Requisitos de contraseña:</p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 border border-<prefijo>-border p-2.5 rounded-lg" style="background: var(--<prefijo>-track)">
              <div class="flex items-center space-x-1.5">
                <span :class="[passChecks.length ? 'pi pi-check-circle text-[var(--<prefijo>-success)]' : 'pi pi-circle', 'text-[10px]']"></span>
                <span>Mínimo 8 caracteres</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <span :class="[passChecks.upper ? 'pi pi-check-circle text-[var(--<prefijo>-success)]' : 'pi pi-circle', 'text-[10px]']"></span>
                <span>Una mayúscula</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <span :class="[passChecks.lower ? 'pi pi-check-circle text-[var(--<prefijo>-success)]' : 'pi pi-circle', 'text-[10px]']"></span>
                <span>Una minúscula</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <span :class="[passChecks.specialAndDigit ? 'pi pi-check-circle text-[var(--<prefijo>-success)]' : 'pi pi-circle', 'text-[10px]']"></span>
                <span>Número y especial</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Términos -->
        <div class="flex items-start space-x-3 py-1">
          <input
            id="terms"
            v-model="form.acceptedTerms"
            type="checkbox"
            required
            class="mt-1 h-4 w-4 rounded border-<prefijo>-border"
          />
          <label for="terms" class="text-xs text-<prefijo>-muted leading-normal">
            Acepto los <a :href="termsUrl" target="_blank" rel="noopener" class="text-[var(--<prefijo>-accent)] hover:underline font-medium">términos y condiciones</a> de la plataforma. *
          </label>
        </div>

        <Button type="submit" :label="loading ? 'Registrando…' : 'Registrar'" class="w-full mt-6" :loading="loading" />
      </form>

      <!-- Paso 2: confirmación OTP -->
      <form v-else @submit.prevent="handleConfirm" class="space-y-5">
        <div class="space-y-1.5">
          <label for="otpCode" class="block text-xs font-semibold uppercase tracking-wider text-<prefijo>-muted">
            Código de confirmación (6 dígitos) *
          </label>
          <IconField>
            <InputIcon class="pi pi-key" />
            <InputText
              id="otpCode"
              v-model="code"
              type="text"
              required
              maxlength="6"
              placeholder="123456"
              class="w-full text-center tracking-widest text-lg font-bold"
            />
          </IconField>
        </div>

        <div class="text-right">
          <button
            type="button"
            @click="handleResendCode"
            :disabled="loading"
            class="text-xs text-[var(--<prefijo>-accent)] hover:opacity-80 font-medium disabled:opacity-50"
          >
            Reenviar código de verificación
          </button>
        </div>

        <Button type="submit" :label="loading ? 'Verificando…' : 'Confirmar código'" class="w-full" :loading="loading" />
      </form>

      <div class="text-center mt-5">
        <p class="text-sm text-<prefijo>-muted">
          ¿Ya tienes una cuenta?
          <NuxtLink to="/login" class="text-[var(--<prefijo>-accent)] hover:opacity-80 font-medium">
            Inicia sesión
          </NuxtLink>
        </p>
      </div>
    </div>

    <p class="text-center mt-6 text-xs text-<prefijo>-muted">&copy; <AÑO> <org>. Todos los derechos reservados.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { countries } from '~/utils/countries'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const { signUp, confirmSignUp, login, resendCode, loading, error } = useAuth()

const form = ref({
  email: '',
  password: '',
  phoneNumber: '',
  firstName: '',
  lastName: '',
  acceptedTerms: false
})

const rawPhone = ref('')
const selectedCountryCode = ref('+51')
const code = ref('')
const isRegistered = ref(false)
const statusMessage = ref('')
const termsUrl = ref('<URL_TERMINOS>')

// El input de teléfono solo acepta dígitos
watch(rawPhone, (newValue) => {
  rawPhone.value = newValue.replace(/\D/g, '')
})

onMounted(async () => {
  try {
    const res = await $fetch<{ url: string }>(`${apiBase}/auth/terms-link`)
    if (res && res.url) {
      termsUrl.value = res.url
    }
  } catch (err) {
    console.error('Error fetching terms link:', err)
  }
})

const passChecks = computed(() => {
  const pass = form.value.password || ''
  return {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    digit: /\d/.test(pass),
    special: /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/;']/.test(pass),
    specialAndDigit: /\d/.test(pass) && /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/;']/.test(pass)
  }
})

const isPasswordValid = computed(() => {
  return passChecks.value.length &&
         passChecks.value.upper &&
         passChecks.value.lower &&
         passChecks.value.digit &&
         passChecks.value.special
})

const handleSignUp = async () => {
  statusMessage.value = ''
  if (!form.value.acceptedTerms) {
    error.value = 'Debe aceptar los términos y condiciones para continuar.'
    return
  }
  if (!isPasswordValid.value) {
    error.value = 'La contraseña no cumple con los requisitos mínimos de seguridad.'
    return
  }
  if (!rawPhone.value) {
    error.value = 'El número de teléfono es obligatorio.'
    return
  }

  // Construye el número en formato E.164
  form.value.phoneNumber = `${selectedCountryCode.value}${rawPhone.value}`

  const result = await signUp(form.value)
  if (result.success) {
    isRegistered.value = true
    statusMessage.value = result.message || 'Código enviado a tu correo. Por favor verifícalo.'
  }
}

const handleConfirm = async () => {
  statusMessage.value = ''
  const result = await confirmSignUp(form.value.email, code.value)
  if (result.success) {
    // Intenta iniciar sesión automáticamente
    const loginResult = await login(form.value.email, form.value.password)
    if (loginResult.success) {
      navigateTo('/')
    } else {
      navigateTo('/login')
    }
  }
}

const handleResendCode = async () => {
  statusMessage.value = ''
  const result = await resendCode(form.value.email)
  if (result.success) {
    statusMessage.value = result.message || 'Código de confirmación reenviado.'
  }
}
</script>
```

**Qué hay que entender de esta página:**

| Elemento | Explicación |
|---|---|
| **Dos pasos en una sola ruta** | `isRegistered` conmuta entre el formulario y el OTP. **No se pierde la contraseña**, por eso el login automático tras confirmar es posible. |
| **Teléfono E.164** | `selectedCountryCode` (un `<select>` alimentado por `utils/countries.ts`, 195 países con bandera y prefijo) se concatena con `rawPhone` justo antes de enviar. El `watch` sobre `rawPhone` elimina todo lo que no sea dígito en cada tecla. |
| **`termsUrl` dinámico** | Se pide a `GET /auth/terms-link` en `onMounted`. Si falla, se queda el valor por defecto. Permite cambiar el enlace legal sin desplegar el frontend. |
| **`passChecks` espeja la política de Cognito** | Las cinco comprobaciones (longitud, mayúscula, minúscula, dígito, especial) replican lo que el backend exige. El checklist solo aparece cuando el campo tiene contenido. **`specialAndDigit` solo existe para pintar una cuarta casilla en una rejilla 2×2**; la validación real usa `isPasswordValid`, que comprueba las cinco por separado. |
| **Validación previa al envío** | `handleSignUp` comprueba términos, contraseña y teléfono **antes** de llamar al API, escribiendo directamente en `error.value`. Ahorra un viaje de red. |
| **Login automático** | Tras confirmar el OTP, se intenta `login()` con las credenciales que siguen en memoria. Si falla (cuenta pendiente de aprobación, por ejemplo), cae a `/login` en lugar de dejar al usuario atascado. |

🟥 **Deuda corregida en la transcripción anterior:** el original estila esta página con **inputs HTML crudos y colores de Tailwind fijos** (`bg-slate-950`, `border-slate-800`, `text-slate-100`), mientras que `login.vue` usa componentes de PrimeVue y tokens. El resultado es que **signup se ve distinto de login y no respeta el tema claro**. El bloque de arriba ya está migrado a PrimeVue + tokens. Si transcribes el original literal, arrastrarás esa inconsistencia.

---

## 11. Capa de datos

### 11.1 `composables/useApi.ts` transcrito

🟩 **NÚCLEO REUTILIZABLE.** Transcripción literal (34 líneas). Es una capa finísima sobre `apiFetch` cuyo único cometido es componer la URL y fijar el método.

Archivo: `composables/useApi.ts`

```ts
export const useApi = () => {
  const config = useRuntimeConfig()
  const { apiFetch } = useAuth()

  const apiUrl = (path: string) => {
    const base = config.public.apiBase.replace(/\/$/, '')
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalized}`
  }

  const get = <T>(path: string, options: Record<string, unknown> = {}) =>
    apiFetch<T>(apiUrl(path), { ...options, method: 'GET' })

  const post = <T>(path: string, body?: unknown, options: Record<string, unknown> = {}) =>
    apiFetch<T>(apiUrl(path), {
      ...options,
      method: 'POST',
      body
    })

  const put = <T>(path: string, body?: unknown, options: Record<string, unknown> = {}) =>
    apiFetch<T>(apiUrl(path), {
      ...options,
      method: 'PUT',
      body
    })

  return {
    apiUrl,
    get,
    post,
    put
  }
}
```

| Miembro | Firma | Notas |
|---|---|---|
| `apiUrl(path)` | `(string) => string` | Quita la barra final de la base y garantiza la inicial del path: `apiUrl('items')` y `apiUrl('/items')` dan el mismo resultado. Expuesto para casos que necesitan la URL cruda (por ejemplo, un `<a download>`). |
| `get<T>(path, options?)` | `Promise<T>` | Los query params van en `options.query`: `get('/items', { query: { q: 'x', limit: 10 } })`. `$fetch` los serializa. |
| `post<T>(path, body?, options?)` | `Promise<T>` | `body` se serializa a JSON automáticamente si es un objeto plano. |
| `put<T>(path, body?, options?)` | `Promise<T>` | Igual. |

🟥 **Faltan `patch` y `delete`.** El repositorio original nunca los necesitó. Añádelos siguiendo el mismo patrón en cuanto te hagan falta; no uses `$fetch` directo, porque te saltarías el Bearer y el reintento.

**El `Authorization` lo pone `apiFetch`, no `useApi`.** Esa es la razón de que toda llamada autenticada deba pasar por aquí.

### 11.2 Patrón de llamada desde una página

🟨 **EJEMPLO** — pero el patrón es 🟩 núcleo. Esta es la forma canónica, extraída de una página real del repositorio (la de solo lectura, que es la más limpia).

Archivo: `pages/<mi-ruta>.vue` (esqueleto a copiar)

```vue
<template>
  <div class="space-y-6">
    <PageHeader
      title="Título de la sección"
      subtitle="Una frase que explica qué se ve aquí."
      :refreshing="loading"
      @refresh="load"
    />

    <!-- Estado: cargando -->
    <div v-if="loading" class="<prefijo>-card p-8 text-center text-<prefijo>-muted">
      <span class="inline-flex items-center gap-2">
        <<Prefijo>Icon name="refresh" :size="14" class="animate-spin" />Cargando…
      </span>
    </div>

    <!-- Estado: error -->
    <div
      v-else-if="error"
      class="<prefijo>-card p-6"
      :style="{
        borderColor: 'color-mix(in srgb, var(--<prefijo>-danger) 35%, transparent)',
        background: 'color-mix(in srgb, var(--<prefijo>-danger) 6%, transparent)'
      }"
    >
      <p class="font-medium" style="color: var(--<prefijo>-danger)">{{ error }}</p>
      <button type="button" class="mt-4 text-sm hover:underline" style="color: var(--<prefijo>-accent)" @click="load">
        Reintentar
      </button>
    </div>

    <!-- Estado: vacío -->
    <div v-else-if="!items.length" class="<prefijo>-card p-10 text-center text-<prefijo>-muted">
      No hay registros todavía.
    </div>

    <!-- Estado: con datos -->
    <section v-else class="<prefijo>-card overflow-hidden">
      <!-- … -->
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MiEntidad } from '~/types/api'

definePageMeta({ middleware: ['auth'] })

const { get } = useApi()

const loading = ref(true)
const error = ref<string | null>(null)
const items = ref<MiEntidad[]>([])

onMounted(() => load())

async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = await get<MiEntidad[]>('/mi-recurso')
  } catch (err: any) {
    items.value = []
    error.value = err?.data?.message || 'No se pudieron cargar los datos.'
  } finally {
    loading.value = false
  }
}
</script>
```

**Las cinco reglas de este patrón:**

1. **Tres refs por recurso:** `loading`, `error`, `data`. Siempre los tres, siempre con esos nombres.
2. **`loading` arranca en `true`.** Evita el parpadeo del estado vacío antes de la primera carga.
3. **En el `catch`, vacía los datos.** Nunca dejes datos viejos junto a un mensaje de error.
4. **`finally` siempre apaga `loading`.** Sin excepciones.
5. **Cuatro estados en la plantilla, en este orden:** cargando → error → vacío → datos. `v-if` / `v-else-if` encadenados, nunca `v-if` independientes.

**Variante reactiva:** si la página depende de un estado global (entidad seleccionada, filtro), usa un `watch` con `immediate: true` en lugar de `onMounted`. Así recarga sola al cambiar la dependencia:

```ts
watch(() => entityStore.selectedId, () => load(), { immediate: true })
```

🟥 **No uses `useFetch` ni `useAsyncData` para datos autenticados.** Ambos tienen su propia instancia de `$fetch` y no pasan por `apiFetch`: perderías el Bearer y el reintento tras refresco. Si quieres su ergonomía (deduplicación, caché, `refresh()`), configura un `$fetch` personalizado vía `useNuxtApp().provide` y pásalo en la opción `$fetch`; el repositorio original no lo hace.

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
      const { get } = useApi()
      const results = await get<EntitySummary[]>('/entities/search', {
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

---

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

### 16.1 `build` frente a `generate`: cuál usar

El `package.json` expone los dos comandos porque Nuxt los trae de serie, pero con esta configuración **no son intercambiables**:

| Comando | Qué hace | Salida | ¿Sirve aquí? |
|---|---|---|---|
| `pnpm build` | Compila el servidor Nitro y el cliente | `.output/server/index.mjs` + `.output/public/` | **No.** Con `ssr: false` el servidor solo serviría un `index.html` vacío; con `nitro.preset: 'static'` el artefacto de servidor ni siquiera es el que necesitas. |
| `pnpm generate` | Compila el cliente y **prerenderiza** las rutas a HTML estático | `.output/public/` autosuficiente | **Sí.** Es lo que sube el workflow a S3. |

**Regla:** en este proyecto el comando de producción es **`pnpm generate`**, y el artefacto desplegable es **`.output/public/`**. `pnpm build` solo tiene sentido si algún día quitas `ssr: false`, cosa que cambiaría el modelo entero (ver §2).

Consecuencia directa: el `Dockerfile` del original está roto (corrección 18.4). Ejecuta `pnpm build` y luego `CMD ["node", ".output/server/index.mjs"]`, un fichero que con `preset: 'static'` **no se genera**. El contenedor fallaría al arrancar. O lo borras, o lo conviertes en un contenedor de servidor estático:

```dockerfile
# Dockerfile  🟩 versión corregida (solo si realmente necesitas contenedor)
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NUXT_PUBLIC_API_BASE_URL
ENV NUXT_PUBLIC_API_BASE_URL=$NUXT_PUBLIC_API_BASE_URL
RUN pnpm generate

FROM nginx:alpine
COPY --from=builder /app/.output/public /usr/share/nginx/html
# Imprescindible: fallback SPA, igual que en CloudFront.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Fíjate en el `ARG`: la URL del API tiene que entrar **en build**, no en runtime (§16.5). Esa es exactamente la razón por la que una imagen Docker aporta poco aquí: no puedes reutilizarla entre entornos.

### 16.2 El workflow completo, parametrizado

🟩 **Núcleo reutilizable.** Esta es la transcripción del workflow real con todos los nombres propios sustituidos por marcadores. Cambia los marcadores y funciona tal cual.

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend to AWS (S3 + CloudFront)

on:
  push:
    branches:
      - dev
      - qa
      - master

permissions:
  id-token: write    # imprescindible para OIDC
  contents: read

jobs:
  deploy:
    name: Build and Deploy Nuxt Static Site
    runs-on: ubuntu-latest
    # El environment y el stage se derivan de la rama: dev -> dev, qa -> qa, master -> prod.
    environment:
      name: ${{ github.ref_name == 'master' && 'prod' || github.ref_name }}
    concurrency:
      group: <app>-frontend-deploy-${{ github.ref_name }}
      cancel-in-progress: true
    env:
      AWS_EC2_METADATA_DISABLED: true
      AWS_DEFAULT_REGION: <REGION>
      STAGE: ${{ github.ref_name == 'master' && 'prod' || github.ref_name }}

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 11

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      # AWS_ROLE_ARN es un secret por environment. El fallback apunta al rol
      # compartido de despliegue (un ARN de rol no es una credencial).
      - name: Configure AWS Credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN || 'arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROL_OIDC>' }}
          aws-region: ${{ vars.AWS_REGION || '<REGION>' }}
          audience: sts.amazonaws.com

      - name: Fetch Deployment Parameters from AWS SSM Parameter Store
        run: |
          echo "Recuperando parámetros desde AWS SSM para el stage: $STAGE"

          API_URL=$(aws ssm get-parameter --name "/<app>-frontend/$STAGE/api-base-url" --with-decryption --query "Parameter.Value" --output text --region $AWS_DEFAULT_REGION)
          echo "NUXT_PUBLIC_API_BASE_URL=$API_URL" >> .env
          echo "::add-mask::$API_URL"

          S3_BUCKET=$(aws ssm get-parameter --name "/<app>-frontend/$STAGE/s3-bucket-name" --with-decryption --query "Parameter.Value" --output text --region $AWS_DEFAULT_REGION)
          echo "AWS_S3_BUCKET=$S3_BUCKET" >> $GITHUB_ENV

          CLOUDFRONT_ID=$(aws ssm get-parameter --name "/<app>-frontend/$STAGE/cloudfront-dist-id" --with-decryption --query "Parameter.Value" --output text --region $AWS_DEFAULT_REGION)
          echo "AWS_CLOUDFRONT_DISTRIBUTION_ID=$CLOUDFRONT_ID" >> $GITHUB_ENV

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile --ignore-scripts

      - name: Generate Static Web Application
        run: pnpm generate

      - name: Deploy static site to S3 Bucket
        run: |
          echo "Sincronizando archivos estáticos con S3 bucket: ${{ env.AWS_S3_BUCKET }}"
          aws s3 sync .output/public/ "s3://${{ env.AWS_S3_BUCKET }}" --delete --cache-control "max-age=31536000, public" --region $AWS_DEFAULT_REGION
          aws s3 cp .output/public/index.html "s3://${{ env.AWS_S3_BUCKET }}/index.html" --metadata-directive REPLACE --cache-control "no-store, no-cache, must-revalidate, max-age=0" --region $AWS_DEFAULT_REGION

      - name: Invalidate CloudFront CDN Cache
        run: |
          echo "Invalidando la caché para la distribución de CloudFront: ${{ env.AWS_CLOUDFRONT_DISTRIBUTION_ID }}"
          aws cloudfront create-invalidation --distribution-id "${{ env.AWS_CLOUDFRONT_DISTRIBUTION_ID }}" --paths "/*" --region $AWS_DEFAULT_REGION
```

Decisiones del workflow que conviene entender antes de tocarlo:

| Elemento | Por qué está |
|---|---|
| `permissions: id-token: write` | Sin esto, GitHub no emite el token OIDC y `configure-aws-credentials` falla con un error poco descriptivo. Es el olvido más común. |
| Tres ramas disparadoras | `dev`, `qa` y `master` corresponden uno a uno a los tres stages. No hay despliegue manual ni etiquetas. |
| `environment: name:` derivado de la rama | Permite tener secrets y reglas de protección distintos por entorno en GitHub (por ejemplo, aprobación obligatoria para `prod`). |
| `concurrency` con `cancel-in-progress` | Si empujas dos commits seguidos a `dev`, el primer despliegue se cancela. Evita que una ejecución vieja sobrescriba una nueva en S3. El grupo incluye la rama, así que `dev` y `prod` no se cancelan entre sí. |
| `AWS_EC2_METADATA_DISABLED: true` | Impide que la CLI pierda tiempo intentando leer el servicio de metadatos del runner (que no existe) antes de caer en las credenciales OIDC. Ahorra segundos y evita errores intermitentes. |
| Fallback literal del ARN del rol | El secret `AWS_ROLE_ARN` solo está definido en algunos entornos. Un ARN de rol **no es un secreto** (no sirve sin la relación de confianza OIDC), así que el fallback en claro es aceptable. |
| `--ignore-scripts` en el install | Bloquea los scripts post-instalación de dependencias por seguridad. **Ojo:** también bloquea el `postinstall: nuxt prepare` del propio proyecto. Funciona porque `nuxt generate` vuelve a preparar el proyecto, pero es frágil; ver corrección 18.9. |
| `--with-decryption` en parámetros no cifrados | Es inofensivo: si el parámetro es `String` en vez de `SecureString`, la bandera se ignora. Deja que esté, por si mañana ciframos alguno. |
| `::add-mask::$API_URL` | Oculta la URL del API en los logs de la ejecución. Las otras dos no se enmascaran (nombre de bucket e ID de distribución se consideran no sensibles). |

### 16.3 Los tres parámetros SSM

El workflow no lleva ninguna configuración de entorno dentro del repositorio: la lee de **AWS Systems Manager Parameter Store** en tiempo de despliegue. Esto hay que crearlo **una vez por stage** antes del primer despliegue, y **no lo hace el agente**: lo hace una persona o un PR de infraestructura.

| Parámetro | Tipo | Ejemplo de valor | Consumido por |
|---|---|---|---|
| `/<app>-frontend/<stage>/api-base-url` | `String` o `SecureString` | `https://api-<stage>.<DOMINIO_BASE>` | Se escribe en `.env` **antes** de `pnpm generate`, y Nuxt lo hornea en el bundle |
| `/<app>-frontend/<stage>/s3-bucket-name` | `String` | `<app>-frontend-<stage>` | `aws s3 sync` |
| `/<app>-frontend/<stage>/cloudfront-dist-id` | `String` | `EXXXXXXXXXXXXX` | `aws cloudfront create-invalidation` |

Con `<stage>` ∈ `{dev, qa, prod}`. El rol OIDC necesita, como mínimo:

- `ssm:GetParameter` sobre `arn:aws:ssm:<REGION>:<AWS_ACCOUNT_ID>:parameter/<app>-frontend/*`
- `s3:ListBucket` sobre el bucket y `s3:PutObject` / `s3:DeleteObject` sobre `<BUCKET>/*` (el `--delete` del sync necesita borrar)
- `cloudfront:CreateInvalidation` sobre la distribución concreta

Sin comodines de servicio completo. Esta es la misma regla de mínimo privilegio que aplica el backend.

### 16.4 Estrategia de caché en S3, y por qué

Son dos comandos deliberadamente distintos:

```bash
# 1. Todo, con caché agresiva de un año.
aws s3 sync .output/public/ "s3://<BUCKET>" --delete \
  --cache-control "max-age=31536000, public"

# 2. Encima, index.html otra vez, sin caché ninguna.
aws s3 cp .output/public/index.html "s3://<BUCKET>/index.html" \
  --metadata-directive REPLACE \
  --cache-control "no-store, no-cache, must-revalidate, max-age=0"
```

El razonamiento:

- **Los activos que genera Nuxt llevan un hash en el nombre** (`_nuxt/entry.B7xK2p.js`). Si el contenido cambia, el nombre cambia. Por tanto, un fichero con un nombre dado es **inmutable para siempre** y puede cachearse un año en el navegador y en el borde de CloudFront. Es el patrón de "activos con huella digital".
- **`index.html` no lleva hash**: siempre se llama igual y es quien apunta a los activos hasheados. Si se cachea, el navegador sigue pidiendo el bundle viejo aunque hayas desplegado uno nuevo, y el usuario ve la versión anterior hasta que expire la caché. Por eso se vuelve a subir con `no-store`.
- El orden importa: `sync` sube todo (incluido `index.html`, con la cabecera equivocada) y el `cp` posterior **corrige** solo ese fichero. `--metadata-directive REPLACE` es obligatorio: sin él, `cp` conserva los metadatos del objeto existente y la corrección no se aplica.
- `--delete` elimina del bucket lo que ya no está en `.output/public/`. Mantiene el bucket limpio de bundles antiguos. El riesgo es que, durante los segundos que dura el sync, un usuario con el HTML viejo ya cargado puede pedir un chunk que acaba de desaparecer, y obtener un 404. Es una ventana pequeña y conocida; si te molesta, quita `--delete` y limpia con una regla de ciclo de vida de S3 a 30 días.

### 16.5 Cómo entra la URL del API, y por qué no es configurable en runtime

Esta es **la implicación arquitectónica más importante de toda la sección** y conviene entenderla antes de diseñar los entornos.

La cadena es:

```
SSM /<app>-frontend/<stage>/api-base-url
      │
      ▼  (paso "Fetch Deployment Parameters")
  fichero .env en el runner:  NUXT_PUBLIC_API_BASE_URL=https://…
      │
      ▼  (pnpm generate; Nuxt lee .env y mapea NUXT_PUBLIC_* a runtimeConfig.public)
  valor literal incrustado en el JavaScript generado
      │
      ▼
  .output/public/_nuxt/*.js   ← la URL viaja dentro del bundle
```

Nuxt mapea variables `NUXT_PUBLIC_<CLAVE>` a `runtimeConfig.public.<clave>` en **arranque del servidor**. En una aplicación con servidor Nitro, eso ocurre en cada arranque y la variable **sí** es de runtime. Aquí no hay servidor: el sitio es estático y lo sirve S3. El único momento en que existe un proceso Node capaz de leer el entorno es durante `pnpm generate`. Por tanto, el valor queda **congelado en el bundle**.

Consecuencias prácticas, todas de obligado conocimiento:

1. **Un build por stage.** No puedes promocionar el mismo artefacto de `dev` a `qa` a `prod`. Cada rama produce su propio bundle con su propia URL. Si tu proceso de release asume "construye una vez, despliega en todas partes", este modelo lo rompe.
2. **La URL del API es pública.** Está en texto plano dentro de un `.js` descargable por cualquiera. El `::add-mask::` solo oculta la URL en los *logs de CI*, no en el artefacto. No pongas nada secreto en una variable `NUXT_PUBLIC_*`: **todas** acaban en el navegador.
3. **Cambiar la URL del API exige redesplegar**, no basta con editar el parámetro SSM. El parámetro solo se lee en build.
4. **En local, `.env` cumple exactamente el mismo papel** que el fichero que escribe el workflow. Por eso `.env.example` contiene solo esa línea.

Si algún día necesitas configuración verdaderamente de runtime (por ejemplo, un mismo bundle que apunte a backends distintos según el dominio), el patrón es: sube un `config.json` **sin hash y sin caché** junto a `index.html`, y haz que un plugin de cliente lo lea con `$fetch` antes del primer render. No lo hagas sin necesidad: añade una petición bloqueante al arranque.

### 16.6 CloudFront: lo que el repositorio NO configura

⚠️ **Hay una pieza imprescindible que no está en ningún fichero del repositorio original y que tienes que configurar a mano o en tu IaC.** En una SPA con enrutado del lado del cliente, si el usuario entra directamente a `https://<DOMINIO_BASE>/<ruta>` o recarga esa URL, CloudFront pide a S3 el objeto `/<ruta>`, que no existe, y devuelve un error. La aplicación nunca llega a cargar.

La distribución necesita **respuestas de error personalizadas**:

| Código de error HTTP | Página de respuesta | Código de respuesta |
|---|---|---|
| 403 | `/index.html` | 200 |
| 404 | `/index.html` | 200 |

El 403 es el que la gente olvida: si el bucket está detrás de un Origin Access Control (lo recomendable), S3 devuelve 403 en lugar de 404 para objetos inexistentes, porque el rol no tiene `s3:ListBucket`.

Resto de la configuración que el workflow da por hecha y no crea:

- Bucket S3 **privado**, servido mediante Origin Access Control, no como website endpoint público.
- `Default Root Object` = `index.html`.
- Certificado ACM en `us-east-1` para el dominio, independientemente de en qué región esté el bucket.
- Rol IAM con la relación de confianza OIDC hacia `token.actions.githubusercontent.com`, restringida por `sub` al repositorio y, preferiblemente, a las ramas concretas.

Todo esto va en un **PR de infraestructura separado**, nunca en el PR de aplicación.

---

## 17. Entorno de desarrollo local y Cursor Cloud

### 17.1 Puesta en marcha mínima, sin Cursor

```bash
# 1. Node 22 y pnpm.
node --version        # v22.x
corepack enable

# 2. Dependencias.
pnpm install

# 3. Configuración.
cp .env.example .env  # apunta al backend local

# 4. Servidor de desarrollo.
pnpm dev              # http://127.0.0.1:4200
```

El puerto **4200** lo fija `devServer` en `nuxt.config.ts` (§5), no es el 3000 por defecto de Nuxt. La razón es evitar la colisión con el backend NestJS, que ocupa el 3000. El `host: '127.0.0.1'` también es deliberado: hace que el origen del navegador sea exactamente el que el backend tiene en su lista CORS (ver §21).

### 17.2 `.env`

🟩 **Núcleo.** El fichero de ejemplo completo:

```bash
# .env.example
# ============================================================
# <app> - Frontend (.env de ejemplo)
# ------------------------------------------------------------
# Copia este archivo a `.env`:
#
#   cp .env.example .env
#
# El archivo `.env` está en .gitignore y no se sube al repo.
# ============================================================

# URL base del backend (local por defecto).
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

Una sola variable. Resiste la tentación de añadir más: cada `NUXT_PUBLIC_*` acaba incrustada en el bundle público (§16.5), y cada variable no pública es inútil en un sitio estático.

### 17.3 Entorno Cursor Cloud

Los tres ficheros viven en `.cursor/`. En el repositorio original **no están en `master`**, sino en una rama aparte; en tu proyecto nuevo ponlos en la rama principal desde el principio.

#### `.cursor/environment.json`

🟩 **Núcleo, adaptando nombres.** Versión parametrizada:

```json
{
  "name": "<app> (frontend + backend)",
  "user": "ubuntu",
  "install": "bash /agent/repos/<app>-frontend/.cursor/install.sh",
  "start": "bash /agent/repos/<app>-frontend/.cursor/start.sh",
  "terminals": [
    {
      "name": "backend (:3000)",
      "command": "if [ -d /agent/repos/<app>-backend ]; then cd /agent/repos/<app>-backend && npm run start:dev; else echo '<app>-backend not checked out; skipping backend dev server'; fi"
    },
    {
      "name": "frontend (Nuxt :4200)",
      "command": "cd /agent/repos/<app>-frontend && pnpm dev"
    }
  ],
  "ports": [3000, 4200],
  "repositoryDependencies": ["github.com/<org>/<app>-backend"]
}
```

Claves del diseño:

- **`install` frente a `start`.** `install` corre una vez al construir la imagen del entorno: instala paquetes del sistema y dependencias. `start` corre en **cada arranque** de la máquina: levanta servicios y aplica migraciones. Lo que dependa de un proceso vivo (PostgreSQL) va en `start`, no en `install`. El comentario del original lo dice explícitamente y es la distinción que más se equivoca.
- **`repositoryDependencies`** hace que Cursor clone también el backend en `/agent/repos/<app>-backend`, de modo que el front pueda desarrollarse contra un API real y no contra mocks.
- **Los dos terminales** arrancan los dos servidores de desarrollo. El condicional `if [ -d … ]` en el backend evita que el entorno falle cuando el repositorio secundario no está disponible: degrada en lugar de romper.
- **`ports`** expone ambos para que los puedas abrir desde el navegador del host.

#### `.cursor/install.sh`

🟨 **Ejemplo adaptable.** El original instala PostgreSQL y `poppler-utils` porque el backend de riesgos los necesita. En un proyecto nuevo, **quita lo que no uses**: `poppler-utils` casi con seguridad sobra.

```bash
#!/usr/bin/env bash
# Bootstrap idempotente del entorno Cloud Agent de <app>.
#
# Cubre el frontend (<app>-frontend, principal) más el backend
# (<app>-backend, clonado como dependencia de repositorio) y una instancia
# local de PostgreSQL 16.
#
# Las migraciones y semillas NO se ejecutan aquí: van en start.sh (dependen de
# un PostgreSQL arrancado y deben ser idempotentes).
set -euo pipefail

FRONTEND_DIR="/agent/repos/<app>-frontend"
BACKEND_DIR="/agent/repos/<app>-backend"

echo "==> Asegurando PostgreSQL 16"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

echo "==> Asegurando pnpm"
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || npm install -g pnpm
fi

echo "==> Instalando dependencias del frontend"
cd "$FRONTEND_DIR"
pnpm install --frozen-lockfile
if [ ! -f "$FRONTEND_DIR/.env" ]; then
  echo "==> Escribiendo .env del frontend"
  echo "NUXT_PUBLIC_API_BASE_URL=http://localhost:3000" > "$FRONTEND_DIR/.env"
fi

if [ -d "$BACKEND_DIR" ] && [ -f "$BACKEND_DIR/package.json" ]; then
  echo "==> Instalando dependencias del backend ($BACKEND_DIR)"
  cd "$BACKEND_DIR"
  npm ci
  if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "==> Escribiendo .env del backend con valores locales (AWS/Cognito son placeholders)"
    cat > "$BACKEND_DIR/.env" <<'EOF'
NODE_ENV=dev
PORT=3000
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000

# AWS / Cognito.
# Los placeholders permiten que el API arranque en local. Para ejercitar los
# flujos reales de autenticación, aporta valores reales como Cursor Secrets
# (se inyectan como variables de entorno y tienen prioridad sobre estos).
AWS_ACCESS_KEY_ID=local-dev-placeholder
AWS_SECRET_ACCESS_KEY=local-dev-placeholder
AWS_REGION=<REGION>
AWS_S3_BUCKET_NAME=local-dev-placeholder
COGNITO_USER_POOL_ID=local-dev-placeholder
COGNITO_CLIENT_ID=local-dev-placeholder
COGNITO_CLIENT_SECRET=local-dev-placeholder
COGNITO_REGION=<REGION>

# PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=<app>_dev
EOF
  fi
else
  echo "==> Repositorio de backend no encontrado; se omite su preparación"
fi

echo "==> install.sh completado"
```

Patrones que merece la pena copiar literalmente:

- **`set -euo pipefail`** en la primera línea. Sin `-e`, un paso que falla no detiene el script y acabas con un entorno medio construido que parece correcto.
- **Idempotencia por comprobación previa** (`if ! command -v …`, `if [ ! -f … ]`). El script puede ejecutarse dos veces sin romper nada ni pisar un `.env` que el desarrollador haya editado a mano.
- **Placeholders para credenciales, nunca credenciales reales.** El backend valida su configuración con Zod al arrancar y se niega a levantar si falta una variable; los placeholders satisfacen la validación sin filtrar nada. Los valores reales entran como **Cursor Secrets**, que se inyectan como variables de entorno y tienen prioridad sobre el `.env`.
- **Degradación suave** cuando el repositorio secundario no está.

#### `.cursor/start.sh`

🟨 **Ejemplo adaptable.** Reconciliación por arranque:

```bash
#!/usr/bin/env bash
# Reconciliación por arranque del entorno Cloud Agent de <app>.
# Arranca PostgreSQL, asegura rol y base de datos, y aplica migraciones y
# semillas del backend. Es seguro ejecutarlo repetidamente (idempotente).
set -euo pipefail

BACKEND_DIR="/agent/repos/<app>-backend"

echo "==> Arrancando el clúster PostgreSQL 16"
sudo pg_ctlcluster 16 main start 2>/dev/null || true

echo "==> Esperando a que PostgreSQL acepte conexiones"
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q; then
    break
  fi
  sleep 1
done
sudo -u postgres pg_isready

echo "==> Asegurando contraseña del rol y base de datos"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='<app>_dev'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE <app>_dev;"
fi

if [ -d "$BACKEND_DIR" ] && [ -f "$BACKEND_DIR/package.json" ]; then
  echo "==> Aplicando migraciones y semillas del backend"
  cd "$BACKEND_DIR"
  npm run migration:run
  npm run db:seed
else
  echo "==> Repositorio de backend ausente; se omiten migraciones y semillas"
fi

echo "==> start.sh completado"
```

Dos detalles no obvios:

- **El bucle de espera de 30 intentos con `pg_isready`.** `pg_ctlcluster … start` retorna antes de que el servidor acepte conexiones. Sin la espera, la migración siguiente falla de forma intermitente, que es el peor modo de fallo posible. El `pg_isready` final sin `-q` deja un mensaje en el log si se agotaron los intentos.
- **`|| true` tras el arranque del clúster.** Si PostgreSQL ya estaba arrancado, `pg_ctlcluster` devuelve código distinto de cero, y con `set -e` eso mataría el script en el segundo arranque. El `|| true` es lo que lo hace idempotente.

### 17.4 Levantar el front contra el backend local

1. Backend en el puerto **3000** con `ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000`.
2. Frontend en el **4200** con `NUXT_PUBLIC_API_BASE_URL=http://localhost:3000`.
3. Abre siempre la URL que coincida con el origen permitido. El backend del original expande por su cuenta los alias `localhost` ↔ `127.0.0.1` en su configuración CORS, pero **no des eso por supuesto en tu backend nuevo**: si tu API no hace esa expansión, entrar por `http://127.0.0.1:4200` cuando la lista dice `http://localhost:4200` produce un fallo CORS que el navegador reporta de forma confusa (ver §21).
4. El backend debe responder con `Access-Control-Allow-Credentials: true`. Aunque el front manda el token en la cabecera `Authorization` y no en cookie de sesión del servidor, la configuración original lo activa y conviene mantener la simetría.

Comprobación rápida de que el canal funciona, antes de depurar nada en el front:

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:4200' \
  -d '{"email":"<correo-ejemplo>","password":"…"}'
```

Si ahí no ves la cabecera `Access-Control-Allow-Origin`, el problema es del backend y no vas a arreglarlo tocando Nuxt.

### 17.5 El directorio `scripts/`: qué es y si merece copiarlo

🟨🟥 **Ejemplo de dominio con deuda incorporada. Recomendación: NO lo copies tal cual.**

El original trae once ficheros en `scripts/` que forman un arnés de captura de pantalla y comparación visual con Playwright, construido para validar la implementación contra las fotos del diseño:

| Fichero | Qué hace |
|---|---|
| `harness.mjs` | Arranca un contexto de Playwright, inyecta las cookies de sesión falsas e intercepta las llamadas al API para servir fixtures |
| `fixture.mjs` | Define un JWT falso y un perfil de usuario con grupos, además de las respuestas simuladas del API |
| `shoot.mjs` / `audit-shoot.mjs` | Capturan pantallas de rutas concretas |
| `parity-spec.mjs` / `parity.mjs` | Describen y ejecutan las comparaciones de paridad con el diseño |
| `visual-diff.mjs` | Compara píxel a píxel las capturas con las imágenes de referencia |
| `design-ruler.mjs` / `design-grid.json` | Miden el mockup y producen las medidas que consume `useDesignGrid` |
| `icon-boxes.mjs` / `layout-fit.mjs` | Utilidades de verificación de iconos y encaje del layout |

Problemas concretos:

- `visual-diff.mjs` tiene **una ruta absoluta de la máquina de un desarrollador** codificada (`/Users/…/Downloads/…`). No funciona en ninguna otra máquina ni en CI.
- Depende de imágenes de referencia que **no están en el repositorio**.
- `pixelmatch` y `pngjs` están declaradas en `package.json` pero **ningún fichero las importa**: son dependencias muertas (corrección 18.10).
- Todo el arnés está acoplado a rutas, fixtures y grupos de usuario del dominio original.

**Qué sí vale la pena rescatar**, si vas a trabajar contra mockups medidos al píxel: la *idea* de `harness.mjs` y `fixture.mjs`, es decir, un contexto de Playwright que inyecta la sesión por cookie e intercepta el API con respuestas fijas. Eso te permite capturar cualquier pantalla autenticada de forma determinista, sin backend. Reescríbelo desde cero para tus rutas, con rutas relativas al repositorio y las imágenes de referencia versionadas, o no lo hagas.

**Qué no:** `visual-diff.mjs`, `design-ruler.mjs` y `design-grid.json` solo tienen sentido con el flujo de trabajo "el diseño llega como PNG de 1536×1024 y hay que calcarlo". Si tu diseño llega como componentes de Figma o como especificación en tokens, todo ese subsistema sobra, y con él `useDesignGrid` y las clases `.<prefijo>-grid-*` (§15.3).

---

## 18. Correcciones obligatorias respecto al original

🟥 Esta sección es la lista cerrada de **deuda que NO debes replicar**. Cada entrada tiene la misma estructura: qué hace el original, por qué está mal, y el cambio concreto. Son referencias que aparecen citadas a lo largo de todo el documento.

### 18.1 Un solo módulo de autenticación: borra `stores/auth.ts`

**Qué hace el original.** Conviven dos implementaciones de autenticación: el composable `useAuth.ts` (375 líneas, el que realmente usa la aplicación) y un store de Pinia `stores/auth.ts` (115 líneas) que **ningún fichero importa**.

**Por qué está mal.** El store huérfano no es solo código muerto, es código muerto *peligroso*:

| Problema | Detalle |
|---|---|
| Endpoints inexistentes | Llama a `/auth/register` y `/auth/me`; el backend expone `/auth/signup` y no tiene `/auth/me` |
| Colisión de cookie | Escribe en la **misma** cookie `auth_token` que `useAuth`, pero con `maxAge: 60*60*24*7` en lugar de `3600`. Si alguien lo activa, la sesión queda desincronizada con la caducidad real del token de Cognito |
| Modelo de permisos divergente | Usa `role?: string` (un rol); el sistema real usa `groups: string[]` del claim `cognito:groups` |
| Navegación desde el store | Llama a `navigateTo` dentro de las acciones, mezclando estado y enrutado |
| Sin refresco de token | No implementa el flujo de refresco; una sesión caducaría sin recuperación |
| Sin decodificación de JWT | No lee los claims, así que no puede resolver permisos |
| Duplica la verdad | Dos fuentes para "¿quién es el usuario?" garantizan que en algún momento discrepen |

**Qué hacer.** No lo copies. Punto. La autenticación vive **solo** en `composables/useAuth.ts`. Si en algún momento necesitas estado global de sesión reactivo entre componentes, ya lo tienes: `useAuth` usa `useState('auth_user')`, que *es* el singleton.

### 18.2 `definePageMeta` con la cadena completa de middleware en toda ruta privada

**Qué hace el original.** La asignación de middleware por página es inconsistente. Algunas rutas privadas declaran `middleware: 'auth'`, otras declaran solo el middleware de rol, y otras no declaran nada.

**Por qué está mal.** El middleware de rol asume que el perfil ya está cargado y que hay token. Si se ejecuta sin `auth` delante, en el mejor caso redirige al login por un camino equivocado y en el peor deja pasar.

**Qué hacer.** Regla sin excepciones: **`auth` siempre primero, el rol después**, y en toda página que no sea pública.

```ts
// Página privada de cualquier rol autenticado
definePageMeta({ middleware: ['auth'] })

// Página restringida a <ROL_A>
definePageMeta({ middleware: ['auth', '<rol-a>'] })

// Página pública con redirección si ya hay sesión
definePageMeta({ middleware: ['guest'], layout: 'auth' })
```

Añade a tu revisión de código: *ninguna página sin `definePageMeta`*. Una página sin metadatos es una página pública por accidente.

### 18.3 Cablea o borra el middleware de rol secundario

**Qué hace el original.** `middleware/admin.ts` existe, pero **ninguna página lo referencia**. Además, a diferencia de `middleware/riesgos.ts`, **no hidrata el perfil del usuario** antes de comprobar el grupo: lee `user.value?.groups` directamente.

**Por qué está mal.** En una SPA, tras una recarga completa el estado en memoria está vacío aunque las cookies existan. `riesgos.ts` resuelve esto llamando a la carga del perfil antes de comprobar; `admin.ts` no. El día que alguien lo enganche a una página, fallará solo al recargar: el bug más difícil de reproducir que existe.

**Qué hacer.** O lo borras, o lo arreglas para que sea idéntico en estructura al de `<ROL_A>`:

```ts
// middleware/<rol-b>.ts  🟩 versión corregida
export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchProfile } = useAuth()

  // Tras una recarga completa el estado en memoria está vacío aunque la
  // cookie siga ahí: hay que rehidratar antes de decidir.
  if (!user.value) {
    await fetchProfile()
  }

  if (!user.value?.groups?.includes('<ROL_B>')) {
    return navigateTo('/')
  }
})
```

Mejor todavía: **genera los middleware de rol desde una fábrica** y elimina la posibilidad de divergencia.

```ts
// utils/roleGuard.ts  🟩
export function roleGuard(group: string) {
  return defineNuxtRouteMiddleware(async () => {
    const { user, fetchProfile } = useAuth()
    if (!user.value) await fetchProfile()
    if (!user.value?.groups?.includes(group)) return navigateTo('/')
  })
}
```

```ts
// middleware/<rol-a>.ts
export default roleGuard('<ROL_A>')
```

### 18.4 Alinea el `Dockerfile` con `generate`, o bórralo

**Qué hace el original.** Un `Dockerfile` de dos etapas que usa `node:26-alpine`, ejecuta `pnpm install` (sin `--frozen-lockfile`) y `pnpm build`, y arranca con `CMD ["node", ".output/server/index.mjs"]`.

**Por qué está mal.** Tres fallos encadenados:

1. `node:26-alpine` no coincide con el Node 22 que usan CI y el entorno local. Tres versiones mayores de diferencia en el runtime que compila el bundle.
2. `pnpm build` no es el comando de este proyecto; el de producción es `pnpm generate` (§16.1).
3. `.output/server/index.mjs` **no existe** con `nitro.preset: 'static'`. El contenedor construye sin error y falla al arrancar.
4. `pnpm install` sin `--frozen-lockfile` puede resolver versiones distintas de las del lockfile, haciendo que la imagen no sea reproducible.

**Qué hacer.** Si no necesitas contenedor —y en un despliegue S3 + CloudFront **no lo necesitas**—, bórralo junto con `.dockerignore`. Un fichero de infraestructura roto es peor que no tenerlo: alguien lo usará. Si lo necesitas, usa la versión corregida de §16.1 (build con `generate`, servir con nginx y fallback SPA).

### 18.5 Decide el sistema de iconos antes de escribir componentes

**Qué hace el original.** Dos sistemas conviven: `AnkaIcon.vue`, un componente monolítico de 348 líneas con ~46 iconos SVG como ramas `v-if`/`v-else-if`, y `primeicons`, instalado como dependencia y usado con clases `pi pi-*`.

**Por qué está mal.** El fichero monolítico tiene ventajas reales (control total del trazo, cero peticiones, tipado de nombres con una unión de literales) y un coste real (todos los iconos entran en el bundle aunque uses tres; añadir uno obliga a editar un fichero de 350 líneas y a tocar el tipo; los conflictos de merge son constantes si dos personas añaden iconos a la vez). Tener **los dos** es lo peor de ambos mundos: dos estilos visuales distintos en la misma interfaz.

**Qué hacer.** Elige uno, al principio, y documéntalo:

- **Opción A (recomendada para empezar rápido):** una librería con tree-shaking real, por ejemplo `unplugin-icons` con un conjunto de Iconify. Importas por nombre, solo entra lo que usas, y no mantienes SVG a mano.
- **Opción B (recomendada si el diseño exige un trazo propio):** mantén el componente monolítico, pero **borra `primeicons`** y no uses `pi pi-*` en ningún sitio. Si llegas a ~60 iconos, parte el fichero en un mapa `Record<string, string>` de rutas SVG en vez de ramas `v-if`.

Lo que no es opción: dejar los dos.

### 18.6 Sustituye `alert()` por el servicio de notificaciones de PrimeVue

**Qué hace el original.** `useAuth.ts` llama a `alert()` dentro del flujo de `apiFetch` cuando la sesión no se puede recuperar.

**Por qué está mal.** Bloquea el hilo, no se puede estilar, es imposible de testear, roba el foco de forma modal y, en algunos navegadores con pestañas en segundo plano, no se muestra en absoluto. Además, un composable no debería hacer E/S de interfaz.

**Qué hacer.** PrimeVue ya está instalado y trae `ToastService`.

```ts
// plugins/primevue-toast.ts  🟩
import ToastService from 'primevue/toastservice'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ToastService)
})
```

```vue
<!-- layouts/default.vue y layouts/auth.vue: añade una vez -->
<Toast position="top-right" />
```

```ts
// Dentro de useAuth, donde estaba el alert()
const toast = useToast()
toast.add({
  severity: 'warn',
  summary: 'Sesión expirada',
  detail: 'Vuelve a iniciar sesión para continuar.',
  life: 5000,
})
```

Si no quieres acoplar el composable al servicio de toast, la alternativa limpia es que `useAuth` **no notifique nada** y se limite a lanzar un error tipado; que la página decida cómo mostrarlo.

### 18.7 Fija la versión de pnpm en el repositorio

**Qué hace el original.** El `package.json` **no declara `packageManager` ni `engines`**. El workflow de CI instala pnpm **11**. El lockfile está en formato 9.0, generado por una versión local distinta (10.x).

**Por qué está mal.** Dos versiones mayores de pnpm resolviendo el mismo lockfile pueden diferir, y `--frozen-lockfile` en CI fallará con un error de lockfile desactualizado que en local no se reproduce.

**Qué hacer.** Declara ambos y alinea el CI:

```json
{
  "packageManager": "pnpm@11.0.0",
  "engines": {
    "node": ">=22 <23",
    "pnpm": ">=11"
  }
}
```

Con `packageManager` declarado y Corepack activo, `pnpm` usa automáticamente esa versión en cualquier máquina. En el workflow, puedes entonces simplificar `pnpm/action-setup` quitando el `version: 11` fijo, para que lo lea del `package.json`.

### 18.8 `loading` y `error` en el composable deben ser estado global

**Qué hace el original.** En `useAuth.ts`, `user` se declara con `useState('auth_user')` —estado global compartido— pero `loading` y `error` se declaran con `ref()` plano.

**Por qué está mal.** Un composable de Nuxt se ejecuta de nuevo en cada invocación. `useState` devuelve siempre la misma referencia; `ref()` crea una nueva cada vez. Resultado: si el componente A llama a `useAuth().login()` y el componente B observa `useAuth().loading`, **B nunca ve el cambio**, porque tiene su propio `ref`. Hoy no se nota porque solo la página de login observa su propio `loading`, pero es una trampa que explota en cuanto alguien pone un indicador de carga global.

**Qué hacer.**

```ts
// composables/useAuth.ts  🟩 corregido
const loading = useState<boolean>('auth_loading', () => false)
const error = useState<string | null>('auth_error', () => null)
```

Regla general para este proyecto: **dentro de un composable, todo estado que deba compartirse entre llamadas usa `useState` con clave; nunca `ref()`.** Un `ref()` dentro de un composable solo es correcto si el estado es intencionadamente por-invocación, y en ese caso ponle un comentario diciéndolo.

### 18.9 Añade scripts de `lint`, `typecheck` y `test`

**Qué hace el original.** El `package.json` tiene once scripts y **ninguno** es `lint`, `typecheck` o `test`. No hay ESLint configurado. El único test del repositorio (`utils/formatAuthError.test.ts`) se ejecuta con un script específico, `test:auth-error`, que nombra el fichero a mano. **No hay `tsconfig.json`** en el repositorio: se depende por completo del que genera Nuxt en `.nuxt/`.

**Por qué está mal.** Sin `typecheck`, los errores de tipo solo aparecen en el editor, y en CI nunca. Sin `lint`, no hay norma de código ejecutable. Y un script de test que nombra ficheros uno a uno deja de encontrar tests nuevos en cuanto alguien añade el segundo.

**Qué hacer.**

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "nuxt typecheck",
    "test": "node --experimental-strip-types --test \"**/*.test.ts\""
  }
}
```

Instala `@nuxt/eslint` (módulo oficial, genera la configuración plana y la mantiene sincronizada con la estructura de Nuxt) y `vue-tsc` (lo requiere `nuxt typecheck`). Añade un `tsconfig.json` mínimo como el de §6. Y añade un job de verificación al CI, previo al despliegue:

```yaml
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

Fíjate en que aquí **no** se pasa `--ignore-scripts`: el job necesita que `postinstall: nuxt prepare` genere `.nuxt/tsconfig.json`, o `typecheck` falla. En el job de despliegue el original sí usa `--ignore-scripts` y funciona de milagro, porque `nuxt generate` vuelve a preparar el proyecto por su cuenta. Si quieres mantener `--ignore-scripts` por seguridad, añade un `pnpm exec nuxt prepare` explícito después del install en ambos jobs; es más honesto que depender de un efecto secundario.

### 18.10 Elimina el código y las dependencias muertas

**Qué hace el original.** Arrastra artefactos sin uso.

| Elemento | Estado verificado |
|---|---|
| `components/ui/AnkaDataTable.vue` | Cero referencias |
| `components/ui/MetricTile.vue` | Cero referencias |
| `components/ui/ScoreCell.vue` | Cero referencias |
| `components/KpiCard.vue` | Cero referencias |
| `components/RatioTable.vue` | Cero referencias |
| `stores/auth.ts` | Cero referencias (ver 18.1) |
| `pixelmatch` (dependencia) | Declarada, nunca importada |
| `pngjs` (dependencia) | Declarada, nunca importada |
| `--anka-brand-purple` (token CSS) | Definido, nunca consumido |
| `isAdmin` (en `useAuth`) | Exportado, nunca consumido |
| Botones de `ui/TableFooter.vue` | Renderizan pero **no emiten ningún evento**: son decorativos |

**Por qué está mal.** Un componente sin uso es un componente sin probar que alguien copiará creyendo que funciona. `TableFooter` es el caso más insidioso: parece una paginación y no pagina nada.

**Qué hacer.** En un repositorio nuevo esto es gratis: simplemente **no los crees**. Crea un componente cuando tengas la segunda pantalla que lo necesite, no antes. Y si copias `ui/TableFooter.vue`, dale `defineEmits` de verdad o quítale los botones.

### 18.11 Resuelve la anchura de la barra lateral en un solo sitio

**Qué hace el original.** `main.css` define `--anka-sidebar-width`, pero los componentes del shell fijan la anchura con utilidades Tailwind literales (`w-64`, `w-20`, y los desplazamientos correspondientes en el contenido).

**Por qué está mal.** La variable sugiere que cambiar un valor basta; en realidad hay que cambiar cuatro clases repartidas en dos ficheros, y el estado colapsado tiene su propio par de valores. Es exactamente el tipo de trampa que hace que un cambio visual pequeño rompa el layout en un breakpoint.

**Qué hacer.** Elige una de las dos y sé consistente:

- **Opción simple (recomendada):** borra la variable y deja las utilidades de Tailwind. Documenta en un comentario del layout las cuatro clases que tienen que moverse juntas.
- **Opción completa:** usa la variable de verdad, con dos valores, y aplícala con `style` en vez de clases:

```css
:root {
  --<prefijo>-sidebar-width: 16rem;
  --<prefijo>-sidebar-width-collapsed: 5rem;
}
```

```vue
<aside :style="{ width: collapsed ? 'var(--<prefijo>-sidebar-width-collapsed)' : 'var(--<prefijo>-sidebar-width)' }">
```

### 18.12 Deduplica el refresco de token

**Qué hace el original.** `apiFetch` detecta un 401, llama a `refreshSession()` y reintenta una vez.

**Por qué está mal.** Si una página lanza tres peticiones en paralelo y las tres reciben 401, se disparan **tres** refrescos simultáneos. Cognito invalida el token de refresco en uso en algunas configuraciones, así que dos de los tres pueden fallar y cerrar la sesión de un usuario perfectamente válido.

**Qué hacer.** Comparte una única promesa en vuelo.

```ts
// composables/useAuth.ts  🟩
const refreshPromise = useState<Promise<boolean> | null>('auth_refresh_inflight', () => null)

async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshPromise.value) {
    refreshPromise.value = refreshSession().finally(() => {
      refreshPromise.value = null
    })
  }
  return refreshPromise.value
}
```

Y que `apiFetch` llame a `refreshSessionOnce()`, nunca a `refreshSession()` directamente.

### 18.13 Calcula la bandera `secure` de las cookies con la API de Nuxt

**Qué hace el original.** Las seis cookies se declaran con `secure: process.env.NODE_ENV === 'production'`.

**Por qué está mal.** `process.env` en código de cliente depende de que el empaquetador lo sustituya; en un bundle estático el resultado es frágil y poco explícito. Nuxt ofrece una bandera pensada exactamente para esto.

**Qué hacer.**

```ts
const cookieOptions = {
  sameSite: 'lax' as const,
  secure: !import.meta.dev,
}

const token = useCookie<string | null>('auth_token', { maxAge: 3600, ...cookieOptions })
```

De paso, **extrae las opciones comunes a una constante**: en el original se repiten `sameSite` y `secure` seis veces, lo que garantiza que algún día una de las seis quede distinta.

### 18.14 Nunca escondas un fallo de red detrás de datos de demostración

**Qué hace el original.** `composables/useEvaluation.ts` implementa `fetchWithFallback`: captura **cualquier** error de la llamada al API y devuelve datos de demostración.

**Por qué está mal.** La interfaz muestra números plausibles cuando el backend está caído, mal configurado o devolviendo 500. Nadie se entera. En una aplicación cuyo propósito es mostrar datos para tomar decisiones, esto no es un atajo de desarrollo: es un fallo de corrección.

**Qué hacer.** Los datos de demostración, si los necesitas, van detrás de una bandera explícita y visible, nunca en el camino de error:

```ts
const config = useRuntimeConfig()
const useMocks = config.public.useMocks === true   // nunca true en producción

const data = useMocks ? demoData : await apiFetch<T>(url)
```

Y el error de red se propaga a la página, que lo muestra. Si decides mantener un modo demo, pinta un banner permanente en pantalla mientras esté activo.

### 18.15 Termina `pnpm-workspace.yaml`

**Qué hace el original.** El fichero contiene literalmente marcadores sin resolver:

```yaml
allowBuilds:
  '@parcel/watcher': set this to true or false
  esbuild: set this to true or false
```

**Por qué está mal.** Son valores de plantilla que nadie rellenó. pnpm los ignora o avisa, y la intención queda sin expresar.

**Qué hacer.** Decide. Ambos paquetes tienen binarios y necesitan ejecutar su script de instalación:

```yaml
# pnpm-workspace.yaml
onlyBuiltDependencies:
  - '@parcel/watcher'
  - esbuild
```

Esto es coherente con lo que ya dice el `.npmrc` del repositorio (`only-built-dependencies=@parcel/watcher,esbuild`); mantén una sola de las dos declaraciones, no las dos.

### 18.16 La página de error debe respetar el tema

**Qué hace el original.** `error.vue` fija `bg-slate-950` y `text-slate-100` directamente: **siempre oscura**, aunque el usuario tenga el modo claro activo.

**Por qué está mal.** Es la única pantalla de la aplicación que ignora el sistema de temas, y aparece justo en el peor momento.

**Qué hacer.** Usa los tokens, como todo lo demás: `bg-[var(--<prefijo>-bg)]` y `text-[var(--<prefijo>-text)]`. La versión corregida completa está en §8.

### 18.17 No mezcles utilidades Tailwind crudas con el sistema de tokens

**Qué hace el original.** `pages/signup.vue` está escrita con clases Tailwind literales de la paleta `slate` (`bg-slate-950`, `border-slate-800`, `text-slate-100`, `placeholder-slate-500`) repetidas en cada campo, mientras que `pages/login.vue` usa los tokens y los componentes de PrimeVue.

**Por qué está mal.** Las dos pantallas de autenticación tienen estilos divergentes, `signup` no responde al cambio de tema, y la cadena de clases de un input se repite seis veces palabra por palabra.

**Qué hacer.** Un único sistema: componentes de PrimeVue estilados por el preset Aura, con tokens para lo que haya que ajustar. La versión migrada de `signup` está en §10.

---

## 19. Plan de implementación ordenado

Cada fase termina con un **comando de verificación** que tiene que pasar antes de continuar. No avances con una fase en rojo: en este stack los fallos se encadenan y depurar la fase 6 con la 2 rota es tiempo perdido.

### Fase 0 — Decisiones previas (sin código)

Resuelve y escríbelas en el README antes de teclear nada, porque todas son caras de cambiar después:

1. Valor de cada marcador de §1, en especial `<prefijo>` (prefijo de tokens CSS y componentes de marca).
2. Nombres de los dos grupos de permisos, `<ROL_A>` y `<ROL_B>`.
3. Sistema de iconos: librería o conjunto propio (18.5).
4. Validación de formularios: Zod + `@primevue/forms`, o validadores propios (§14).
5. ¿Hay mockups con medidas al píxel? Si no, descarta `useDesignGrid` y las clases de rejilla (§15.3).

### Fase 1 — Esqueleto y herramientas

**Entregable:** el proyecto arranca en blanco, con linting y comprobación de tipos.

Ficheros: `package.json`, `.npmrc`, `pnpm-workspace.yaml`, `tsconfig.json`, `.gitignore`, `.env.example`, `.vscode/settings.json`, `.vscode/extensions.json`, `nuxt.config.ts` (sin los módulos de interfaz todavía), `app.vue` mínimo.

```bash
pnpm install && pnpm typecheck && pnpm lint && pnpm dev
# Verifica: http://127.0.0.1:4200 responde con una página en blanco sin errores en consola.
```

### Fase 2 — Sistema de diseño y temas

**Entregable:** el conmutador de tema funciona y los tokens responden en las tres capas.

Ficheros: `assets/css/main.css` completo, `tailwind.config.ts`, módulos `@nuxtjs/tailwindcss`, `@nuxtjs/color-mode`, `@nuxtjs/google-fonts`, `@primevue/nuxt-module` en `nuxt.config.ts`, `components/ThemeToggle.vue`.

```bash
pnpm dev
# Verifica, con el conmutador, que cambian a la vez:
#  1. un elemento con bg-[var(--<prefijo>-bg)]   (tokens CSS)
#  2. un elemento con dark:text-white            (variante de Tailwind)
#  3. un <Button> de PrimeVue                    (darkModeSelector)
# Y en el inspector: <html class="dark"> aparece y desaparece.
```

Esta es la fase que más vale verificar a conciencia: si las tres capas no están sincronizadas aquí, lo descubrirás con cuarenta componentes escritos.

### Fase 3 — Shell de la aplicación

**Entregable:** navegación completa, responsive, con rutas vacías.

Ficheros: `layouts/default.vue`, `layouts/auth.vue`, `error.vue` (versión corregida), `components/AppSidebar.vue`, `AppTopbar.vue`, `AppBottomNav.vue`, `<Prefijo>Mark.vue`, el sistema de iconos elegido, y una página vacía por cada entrada del menú.

```bash
pnpm dev
# Verifica a 390px, 768px, 1024px y 1440px de ancho:
#  - <1024px: hamburguesa + barra inferior, sin barra lateral fija
#  - >=1024px: barra lateral fija y colapsable, sin barra inferior
#  - el elemento activo del menú se resalta en TODAS las rutas, incluidas las anidadas
# Recorre la navegación entera solo con Tab.
```

### Fase 4 — Autenticación de extremo a extremo

**Entregable:** iniciar sesión, cerrar sesión, recarga con sesión viva, caducidad y refresco, restablecimiento de contraseña.

Ficheros: `composables/useAuth.ts` (con 18.8, 18.12 y 18.13 aplicadas), `composables/useApi.ts`, `utils/formatAuthError.ts` + su test, `middleware/auth.ts`, `guest.ts`, `utils/roleGuard.ts` + los dos middleware de rol, `plugins/auth.ts`, `plugins/primevue-toast.ts`, `pages/login.vue`, `pages/signup.vue`.

```bash
pnpm test        # debe pasar el test de formatAuthError
pnpm typecheck
pnpm dev
```

Comprobaciones manuales obligatorias, en este orden:

1. Entrar a una ruta privada sin sesión → redirige a `/login`.
2. Iniciar sesión → entra y la barra superior muestra el nombre.
3. **Recargar con F5** → sigue dentro (esta es la que descubre los fallos de rehidratación).
4. Borrar la cookie `auth_token` a mano y navegar → refresca en silencio y sigue dentro.
5. Borrar `auth_token` y `auth_refresh_token` → sale al login con un mensaje legible.
6. Con sesión activa, ir a `/login` → el middleware `guest` redirige a la raíz.
7. Entrar con un usuario sin el grupo `<ROL_A>` a una ruta de `<ROL_A>` → redirige, no muestra la página.
8. Credenciales incorrectas → mensaje en español de `formatAuthError`, no el texto crudo de Cognito.

### Fase 5 — Capa de datos y primera pantalla real

**Entregable:** una pantalla que pinta datos reales del backend, con sus estados de carga, error y vacío.

Ficheros: `types/api.ts`, `utils/format.ts`, el store de entidad si lo necesitas, la primera página de dominio, los componentes de `components/ui/` que esa página requiera (`PageHeader`, `StatusChip`, y los que surjan).

```bash
pnpm dev
# Verifica, con el backend parado: la página muestra el estado de error, NO datos inventados.
# Con el backend en marcha: muestra datos. Con una respuesta vacía: estado vacío explícito.
# Con un campo null en la respuesta: aparece '—', nunca 0 ni NaN.
```

### Fase 6 — Gráficos

**Entregable:** un gráfico que responde al tema y al redimensionado.

Ficheros: `plugins/echarts.client.ts`, `composables/useChartTheme.ts` (leyendo los tokens con `getComputedStyle`, §13.3), el primer componente de gráfico.

```bash
pnpm dev
# Verifica:
#  - el gráfico aparece (si no: revisa ClientOnly y el registro de componentes de ECharts)
#  - cambia de color al conmutar el tema, sin recargar
#  - se redimensiona al cambiar el ancho de la ventana (autoresize)
#  - en móvil tiene altura > 0 (min-h-[Npx] en el contenedor)
pnpm generate && pnpm preview
# Verifica que el gráfico también aparece en el build estático: es donde fallan
# los componentes que no respetan ClientOnly.
```

### Fase 7 — Resto de pantallas

Itera por pantalla, backend y frontend juntos. Por cada una: tipos, llamada, estados, componentes, accesibilidad. No abras la siguiente con la anterior a medias.

```bash
pnpm lint && pnpm typecheck && pnpm test
```

### Fase 8 — Build y despliegue

**Entregable:** el sitio desplegado y navegable por URL directa.

Ficheros: `.github/workflows/deploy.yml`, el job `verify`, y el PR **separado** de infraestructura (bucket, distribución, respuestas de error personalizadas, rol OIDC, parámetros SSM).

```bash
pnpm generate
ls .output/public/index.html && ls .output/public/_nuxt/
npx serve .output/public -s     # el -s activa el fallback SPA, igual que CloudFront
# Verifica: entrar DIRECTAMENTE a http://localhost:3000/<ruta-profunda> carga la aplicación.
```

Tras el primer despliegue, la prueba que descubre la configuración ausente de CloudFront (§16.6):

```bash
curl -I https://<DOMINIO_BASE>/<ruta-profunda>
# Debe devolver 200 y el HTML de la aplicación. Un 403 o un 404 significa que
# faltan las respuestas de error personalizadas en la distribución.
```

### Fase 9 — Entorno Cursor y documentación

Ficheros: `.cursor/environment.json`, `.cursor/install.sh`, `.cursor/start.sh`, `README.md`, `AGENTS.md`.

```bash
bash .cursor/install.sh && bash .cursor/start.sh
# Ejecútalos DOS VECES seguidas: ambos deben terminar sin error las dos veces.
```

---

## 20. Checklist final de aceptación

Marca cada punto solo después de comprobarlo en ejecución, no leyendo el código.

**Configuración y arranque**

- [ ] `pnpm install --frozen-lockfile` funciona en una máquina limpia
- [ ] `packageManager` y `engines` declarados, y CI usa la misma versión de pnpm
- [ ] `pnpm dev` levanta en `127.0.0.1:4200` sin avisos en consola
- [ ] `pnpm lint`, `pnpm typecheck` y `pnpm test` existen y pasan
- [ ] `.env.example` presente, `.env` en `.gitignore`
- [ ] `pnpm-workspace.yaml` sin marcadores de plantilla sin resolver

**Temas y diseño**

- [ ] El conmutador cambia a la vez tokens CSS, variantes `dark:` de Tailwind, componentes de PrimeVue y colores de ECharts
- [ ] La preferencia de tema sobrevive a una recarga
- [ ] No queda ninguna clase de color literal (`bg-slate-*`, `text-slate-*`) fuera del propio `main.css`
- [ ] Ningún token definido sin consumir, ni consumido sin definir
- [ ] `error.vue` respeta el tema

**Navegación y permisos**

- [ ] Toda página tiene `definePageMeta`; ninguna es pública por omisión
- [ ] Toda ruta privada lleva `['auth', …]` con `auth` en primera posición
- [ ] Los middleware de rol rehidratan el perfil antes de comprobar el grupo
- [ ] El resaltado del menú activo funciona en rutas anidadas
- [ ] Recargar con F5 en una ruta privada mantiene la sesión

**Autenticación**

- [ ] Existe **una sola** implementación de sesión; no hay store de Pinia de autenticación
- [ ] `loading` y `error` del composable usan `useState`, no `ref`
- [ ] El refresco de token está deduplicado con una promesa en vuelo compartida
- [ ] El 401 reintenta **una** vez y, si vuelve a fallar, cierra sesión limpiamente
- [ ] Los errores de autenticación se muestran en español a través de `formatAuthError`
- [ ] No queda ningún `alert()` en el código

**Datos**

- [ ] Un fallo de red produce un estado de error visible, nunca datos de demostración
- [ ] Los valores ausentes se pintan como `'—'`, nunca como `0`
- [ ] Toda pantalla tiene sus tres estados: cargando, error y vacío
- [ ] Ninguna página usa `useFetch` ni `useAsyncData` para llamadas autenticadas

**Gráficos**

- [ ] Todo `VChart` está dentro de `<ClientOnly>`
- [ ] Todo contenedor de gráfico tiene altura mínima explícita
- [ ] Los colores del gráfico se leen de los tokens, no están duplicados en hexadecimal
- [ ] Los gráficos aparecen también en `pnpm generate` + `pnpm preview`

**Accesibilidad**

- [ ] Hay estilo `:focus-visible` global
- [ ] Hay enlace de salto al contenido
- [ ] Todo botón solo-icono tiene `aria-label`
- [ ] Todo SVG decorativo tiene `aria-hidden="true"`
- [ ] Se respeta `prefers-reduced-motion`
- [ ] El menú móvil atrapa el foco y cierra con Escape
- [ ] Los gráficos tienen alternativa textual

**Despliegue**

- [ ] El comando de producción es `pnpm generate` y el artefacto es `.output/public/`
- [ ] Los tres parámetros SSM existen para cada stage
- [ ] El rol OIDC tiene permisos acotados, sin comodines de servicio
- [ ] `index.html` se sirve con `no-store`; el resto, inmutable
- [ ] La distribución mapea 403 y 404 a `/index.html` con código 200
- [ ] Una URL profunda cargada directamente funciona
- [ ] No hay `Dockerfile` roto en el repositorio

**Higiene**

- [ ] Cero componentes sin referencias
- [ ] Cero dependencias declaradas y no importadas
- [ ] Cero rutas absolutas de máquinas de desarrollo en scripts
- [ ] Un único sistema de iconos

---

## 21. Errores conocidos y cómo evitarlos

Catálogo de fallos que este stack produce en la práctica, con el síntoma primero —que es como los vas a encontrar— y la causa después.

### 21.1 `EMFILE: too many open files` al arrancar

**Síntoma.** `pnpm dev` arranca y muere, o el recargado en caliente deja de funcionar al cabo de unos minutos.

**Causa.** El observador de ficheros intenta vigilar `node_modules`, `.nuxt`, `.output` y `dist`. Son decenas de miles de ficheros y se agota el límite de descriptores del sistema.

**Solución.** Dos mecanismos, porque actúan en capas distintas y **hacen falta los dos**: `ignore` en la raíz de `nuxt.config.ts` (afecta al escaneo de Nuxt) y `vite.server.watch.ignored` (afecta al observador de Vite). Están transcritos en §5. Si aun así ocurre, sube el límite del sistema con `ulimit -n 10240`.

### 21.2 Un gráfico no aparece, o lanza "Component is not exists"

**Síntoma.** Hueco en blanco donde debería estar el gráfico, o un error en consola mencionando un componente de ECharts.

**Causa.** ECharts se importa de forma modular: solo existe lo que registras explícitamente en `plugins/echarts.client.ts`. Si tu `option` usa `type: 'pie'` y nunca hiciste `use([PieChart])`, ECharts no sabe dibujarlo.

**Solución.** Añade el módulo al `use([...])` del plugin. Lo mismo para componentes auxiliares: `LegendComponent`, `DataZoomComponent`, `MarkLineComponent`. Ver la tabla de §13.1.

### 21.3 El gráfico se ve con 0 píxeles de alto

**Síntoma.** El componente existe en el DOM pero no se ve nada; el `<canvas>` mide 0.

**Causa.** ECharts mide su contenedor al montarse. En un contenedor flex o grid sin altura resuelta, mide cero y dibuja cero. No se recupera solo.

**Solución.** Altura mínima explícita siempre: `class="h-full w-full min-h-[240px]"`, y `autoresize` en el `<VChart>`.

### 21.4 El gráfico rompe el build estático

**Síntoma.** `pnpm dev` funciona; `pnpm generate` falla con `document is not defined` o `window is not defined`.

**Causa.** Aunque `ssr: false`, el prerenderizado de `nuxt generate` ejecuta los componentes en Node para producir el HTML inicial. ECharts necesita el DOM.

**Solución.** `<ClientOnly>` alrededor de todo `<VChart>`, y el plugin con sufijo `.client.ts`. Sin excepciones. Aprovecha el slot `#fallback` para pintar un esqueleto con la misma altura y evitar el salto de layout.

### 21.5 Al recargar, el usuario aparece como no autenticado durante un instante

**Síntoma.** Parpadeo: se ve el layout sin nombre de usuario, o un redirect momentáneo al login.

**Causa.** Las cookies existen, pero el estado en memoria (`useState('auth_user')`) está vacío tras una carga completa. La rehidratación es asíncrona.

**Solución.** El plugin `plugins/auth.ts` inicializa la sesión en el arranque, y los middleware de rol rehidratan el perfil antes de decidir. Si persiste el parpadeo, muestra un estado de carga mientras `user` sea `null` y haya cookie de token, en lugar de asumir "sin sesión".

### 21.6 Fallo de CORS contra el backend local

**Síntoma.** La petición se ve en la pestaña de red con estado `(failed)` o `CORS error`, y en consola aparece que falta `Access-Control-Allow-Origin`.

**Causa habitual.** Abriste el front por `http://localhost:4200` pero el backend solo permite `http://127.0.0.1:4200`, o al revés. Para el navegador son **orígenes distintos**, aunque resuelvan a la misma máquina.

**Solución.** Tres medidas, por orden de robustez: que `devServer.host` en `nuxt.config.ts` fije un host determinista; que `ALLOWED_ORIGINS` del backend incluya **las dos** formas; y, si controlas el backend, que expanda los alias `localhost` ↔ `127.0.0.1` automáticamente al construir su lista CORS. El backend del proyecto original hace lo tercero; no lo des por hecho en uno nuevo.

**Segunda causa.** La petición de preflight `OPTIONS` falla. Compruébalo con `curl -i -X OPTIONS` antes de culpar al frontend.

### 21.7 El puerto 4200 está ocupado

**Síntoma.** Nuxt arranca en 4201 y entonces fallan todas las peticiones por CORS.

**Causa.** Otro proceso ocupa el 4200; Nuxt busca el siguiente libre en silencio.

**Solución.** Lee siempre la URL que imprime Nuxt al arrancar, no la que esperabas. Si vas a cambiar de puerto, actualiza también `ALLOWED_ORIGINS` del backend.

### 21.8 `--frozen-lockfile` falla solo en CI

**Síntoma.** `pnpm install` local funciona; el mismo comando en CI aborta diciendo que el lockfile no está actualizado.

**Causa.** Versiones distintas de pnpm entre tu máquina y el runner (§18.7), o alguien editó `package.json` sin regenerar el lockfile.

**Solución.** Declara `packageManager`. Y nunca edites `package.json` a mano para las dependencias: usa `pnpm add` / `pnpm remove`.

### 21.9 La clase `dark` nunca aparece en `<html>`

**Síntoma.** El conmutador no hace nada, o escribe `class="dark-mode"` en vez de `class="dark"`.

**Causa.** Falta `classSuffix: ''` en la configuración de `@nuxtjs/color-mode`. Por defecto el módulo añade el sufijo `-mode`, y entonces ni Tailwind (`darkMode: 'class'`) ni PrimeVue (`darkModeSelector: '.dark'`) reconocen el selector.

**Solución.** `colorMode: { classSuffix: '' }`. Es una línea y rompe las tres capas a la vez si falta. Ver §7.

### 21.10 Tailwind no genera clases que sí están en el código

**Síntoma.** Escribes `bg-<prefijo>-elevated` y no pasa nada; en el inspector la clase está en el elemento pero no existe en el CSS.

**Causa A.** El fichero no está en el ámbito escaneado. `tailwind.config.ts` tiene `content: []` **a propósito**: el módulo `@nuxtjs/tailwindcss` rellena las rutas automáticamente con los directorios de Nuxt. Si colocas componentes fuera de esos directorios, no se escanean.

**Causa B.** Construiste el nombre de clase por concatenación (`` `bg-${color}-500` ``). Tailwind escanea texto plano: no puede ver clases que solo existen en tiempo de ejecución.

**Solución.** Para la B, usa un mapa explícito de valor a cadena de clases completas, nunca interpolación. Es el patrón que usan `StatusChip` y `SignalDot` en el original, y es la razón por la que lo usan.

### 21.11 Dos componentes con el mismo nombre de fichero

**Síntoma.** Se renderiza el componente equivocado, sin ningún error.

**Causa.** `components: { dirs: [{ path: '~/components', pathPrefix: false }] }` registra los componentes con nombre **plano**, ignorando el directorio. `components/charts/Card.vue` y `components/ui/Card.vue` compiten por el mismo nombre global `<Card>`.

**Solución.** Nombres de fichero **únicos en todo el árbol** de `components/`. Prefija por área cuando haga falta (`UiCard.vue`, `ChartCard.vue`). Ver §12.2.

### 21.12 Una variable de entorno nueva no llega al navegador

**Síntoma.** `useRuntimeConfig().public.loQueSea` es `undefined` en el cliente.

**Causa.** Solo las variables declaradas en `runtimeConfig.public` del `nuxt.config.ts` **y** con el prefijo `NUXT_PUBLIC_` en el entorno llegan al cliente, y solo en tiempo de build (§16.5).

**Solución.** Declara la clave en `runtimeConfig.public`, nómbrala `NUXT_PUBLIC_*` en el `.env`, y **vuelve a construir**. Si esperabas poder cambiarla sin redesplegar, releer §16.5.

### 21.13 Tras desplegar, los usuarios siguen viendo la versión antigua

**Síntoma.** Tú ves lo nuevo; otros no, durante horas.

**Causa.** `index.html` se quedó con la cabecera de caché de un año que puso el `sync`, porque faltó el `cp` posterior o el `--metadata-directive REPLACE`.

**Solución.** Los dos comandos de §16.4, en ese orden, y la invalidación de CloudFront sobre `/*`.

### 21.14 Entrar por URL directa devuelve 403 o 404

**Síntoma.** La navegación interna funciona; recargar en una ruta profunda rompe.

**Causa.** CloudFront pide a S3 un objeto que no existe. Con Origin Access Control el error es **403**, no 404, que es por lo que mucha gente solo configura el 404 y sigue roto.

**Solución.** Respuestas de error personalizadas para 403 **y** 404 → `/index.html` con código 200 (§16.6).

### 21.15 `nuxt typecheck` falla con cientos de errores de tipos ausentes

**Síntoma.** No encuentra `#imports`, `#app`, ni los tipos autogenerados.

**Causa.** No se ejecutó `nuxt prepare`, que es quien genera `.nuxt/tsconfig.json` y las declaraciones de los auto-imports. Pasa con `--ignore-scripts` en CI (§18.9).

**Solución.** `pnpm exec nuxt prepare` antes de comprobar tipos.

### 21.16 Un auto-import no se resuelve en un fichero nuevo

**Síntoma.** `useAuth is not defined`, o el editor lo marca en rojo aunque la aplicación funcione.

**Causa.** El auto-import de Nuxt cubre `composables/`, `utils/` y `components/` solo en el **primer nivel** por defecto, y las declaraciones de tipos se regeneran al arrancar el servidor de desarrollo.

**Solución.** Reinicia `pnpm dev` tras crear ficheros nuevos en esos directorios. Si el problema es solo del editor, ejecuta `pnpm exec nuxt prepare` y recarga la ventana.

---

## 22. Lo que no se pudo determinar desde el repositorio

Esta sección es deliberada: **lo que no consta, no se inventa**. Si algo de aquí te hace falta, pregúntalo antes de decidir.

### 22.1 Ausente del repositorio del frontend

| Elemento | Situación |
|---|---|
| `tsconfig.json` | **No existe** ni en disco ni en el historial de git. El proyecto depende enteramente del que Nuxt genera en `.nuxt/`. El `tsconfig.json` mínimo que propone §6 es una **recomendación**, no una transcripción |
| Configuración de ESLint o Prettier | No hay ningún fichero de configuración, ni dependencias de linting. La propuesta de §18.9 es recomendación |
| Configuración de CloudFront y del bucket S3 | **Nada** vive en el repositorio del frontend: ni plantilla de infraestructura, ni política de bucket, ni respuestas de error personalizadas. Lo descrito en §16.6 se deduce de lo que el workflow da por supuesto, no de un fichero |
| Valores reales de los parámetros SSM | El workflow los lee en ejecución; sus valores no están en el repositorio |
| Imágenes de referencia del diseño | `visual-diff.mjs` las espera en una ruta absoluta de una máquina de desarrollo. No están versionadas y no se pudieron inspeccionar |
| Tests más allá de uno | El único test del repositorio es `utils/formatAuthError.test.ts`. No hay tests de componentes, ni de integración, ni configuración de Vitest o Playwright Test |
| Los dominios `*.kipu.pe` que mencionaba el encargo | **No aparecen en ningún fichero del repositorio del frontend.** Se encontraron únicamente en documentación del repositorio del backend. Están parametrizados como `<DOMINIO_BASE>` por completitud, pero el frontend no los referencia |
| Activos de marca | Los dos PNG que consume `<Prefijo>Mark` existen como binarios; no hay fuente vectorial ni guía de marca en el repositorio |

### 22.2 Discrepancias entre lo que se esperaba y lo que hay

| Esperado | Realidad verificada |
|---|---|
| `AnkaIcon.vue` con ~350 iconos SVG | El fichero tiene **348 líneas** y define **~46 nombres de icono**. La cifra de 350 corresponde a las líneas, no a los iconos |
| pnpm consistente | CI instala pnpm **11**; el lockfile está en formato **9.0** y fue generado localmente con **10.33.3**. No hay `packageManager` que arbitre (§18.7) |
| Dockerfile funcional | Usa `node:26-alpine` frente al Node 22 del resto, y arranca un fichero que esta configuración no genera (§18.4) |

### 22.3 Decisiones del original cuya motivación no consta

No hay comentario, commit ni documento que las explique. Se describen tal cual, sin atribuirles una razón inventada:

1. **Por qué `stores/auth.ts` sigue en el repositorio.** Parece un primer intento anterior a `useAuth.ts` que nadie borró, pero no hay nada que lo confirme. Lo que sí es verificable es que no se usa y que es incompatible con el backend actual.
2. **Por qué el middleware del segundo rol existe sin estar enganchado a ninguna página.** Puede ser preparación para pantallas futuras o un resto de una iteración previa. No consta.
3. **Por qué `pnpm-workspace.yaml` quedó con los marcadores de plantilla sin rellenar.** Probablemente un `pnpm approve-builds` interrumpido, pero es conjetura.
4. **Por qué conviven `primeicons` y el conjunto propio de iconos.** No hay nota de decisión. Se observa que ambos se usan.
5. **Por qué `useAuth` mezcla `useState` para el usuario y `ref` para `loading`/`error`.** No hay indicio de que sea intencionado; el efecto práctico es un fallo latente (§18.8).
6. **Por qué el job de despliegue usa `--ignore-scripts`.** Lo razonable es suponer que es una medida de seguridad frente a scripts de instalación de dependencias, pero no está documentado, y tiene el efecto colateral de saltarse el `postinstall` del propio proyecto.
7. **Por qué `error.vue` fija colores oscuros literales** en lugar de usar los tokens, siendo la única pantalla que lo hace.
8. **Si `ui/TableFooter.vue` iba a implementar paginación.** Los botones existen y no emiten eventos; no hay rastro de una implementación empezada.

### 22.4 Dependencias externas que el frontend asume y no puede verificar

- **Comportamiento exacto del proveedor de identidad** ante tokens caducados, revocados o emitidos para otro cliente. El frontend solo observa el código HTTP que le devuelve el backend.
- **Vida real del token de refresco.** La cookie se fija a 30 días; si el proveedor lo invalida antes, el frontend se entera con un 401 y cierra sesión.
- **Política del proveedor sobre refrescos concurrentes.** Es la razón por la que §18.12 recomienda deduplicar, pero no se pudo confirmar si el proveedor concreto invalida el token de refresco al usarlo.
- **Contenido real de los claims del token.** El frontend decodifica `cognito:groups`, `given_name`, `family_name` y `email`. Que esos claims estén presentes depende de la configuración del grupo de usuarios, que no es visible desde el repositorio.




