# Carpetas Generadas Automáticamente

> Estas carpetas **no contienen código escrito por el desarrollador**. Son generadas automáticamente por las herramientas del ecosistema Node.js y Vite durante el proceso de instalación o compilación. No se suben a GitHub (están en `.gitignore`) y deben regenerarse en cada entorno nuevo.

---

## 1. `frontend/deps/`

### ¿Qué es?

Es la **caché de pre-bundling de dependencias** que genera Vite automáticamente la primera vez que se ejecuta `npm run dev`.

### ¿Para qué sirve?

Cuando el proyecto arranca en modo desarrollo, Vite no sirve los módulos de `node_modules` directamente porque hay miles de archivos y eso sería muy lento para el navegador. En cambio, Vite toma todas las dependencias externas (React, Firebase, Framer Motion, etc.) y las **pre-empaqueta en unos pocos archivos optimizados**. Esos archivos empaquetados son los que viven en `deps/`.

Esto reduce enormemente el tiempo de carga inicial del servidor de desarrollo.

### Contenido

```
frontend/deps/
├── _metadata.json    → registro de hashes para detectar si algo cambió
└── package.json      → declara { "type": "module" } para que Node trate los archivos como ESM
```

**`_metadata.json`** contiene cuatro hashes:

| Campo | Descripción |
|---|---|
| `hash` | Hash general del estado de la caché |
| `configHash` | Hash de `vite.config.js` — si cambia la config, se regenera |
| `lockfileHash` | Hash de `package-lock.json` — si cambian deps, se regenera |
| `browserHash` | Hash del entorno del navegador detectado |
| `optimized` | Mapa de módulos pre-empaquetados (vacío = sin optimizaciones previas) |
| `chunks` | Fragmentos compartidos entre módulos optimizados |

### ¿Cuándo se regenera?

- Al correr `npm run dev` por primera vez
- Al modificar `vite.config.js`
- Al instalar o actualizar paquetes (`npm install`)
- Al borrar la carpeta manualmente

### ¿Debo tocarla?

No. Nunca modificar ni versionar esta carpeta. Si algo falla, se puede borrar y Vite la regenera sola.

---

## 2. `frontend/dist/`

### ¿Qué es?

Es la **carpeta de producción** que genera Vite al ejecutar `npm run build`. Contiene la versión final y optimizada del frontend lista para desplegarse en un servidor web.

### ¿Para qué sirve?

En desarrollo, el código fuente está dividido en cientos de archivos `.jsx`, `.js`, `.css` e imágenes. Eso es cómodo para programar, pero ineficiente para un usuario real. El proceso de build:

1. **Compila** JSX a JavaScript puro que entiende cualquier navegador
2. **Minifica** el código (elimina espacios, renombra variables a letras cortas)
3. **Empaqueta** todos los módulos en pocos archivos (bundles)
4. **Optimiza** imágenes y assets
5. **Genera hashes** en los nombres de archivo para forzar recargas cuando hay actualizaciones

### Contenido

```
frontend/dist/
│
├── index.html                    → punto de entrada de la app (1 solo archivo HTML)
│
├── assets/
│   ├── index-[hash].js           → bundle principal con toda la lógica de React
│   ├── index.es-[hash].js        → bundle secundario (ES modules, para navegadores modernos)
│   └── index-[hash].css          → todos los estilos de la app en un solo archivo
│
└── [assets estáticos copiados desde public/]
    ├── avatar/                   → sprites y frames de los personajes
    ├── bosses/                   → imágenes de los jefes finales
    ├── exercises/                → imágenes de ejercicios
    ├── home_guerrero/            → assets de la clase Guerrero
    ├── home_arquero/             → assets de la clase Arquero
    ├── home_mago/                → assets de la clase Mago
    ├── missions/                 → sellos y recompensas de misiones
    ├── logros/                   → imágenes de logros y medallas
    ├── ui/                       → iconos, texturas, paneles de interfaz
    ├── sprites/                  → spritesheets de animación
    ├── sounds/                   → efectos de sonido
    ├── lottie/                   → animaciones Lottie en JSON
    ├── videos/                   → videos de fondo
    └── logo.png, qr-donacion.png → assets individuales
```

### Tamaño del bundle

El bundle principal (`index-[hash].js`) pesa aproximadamente **4.3 MB sin comprimir** (~1.1 MB con gzip). Esto es conocido y está relacionado con la cantidad de librerías incluidas (Firebase, MediaPipe, GSAP, Framer Motion, etc.). En producción, el servidor web aplica compresión gzip automáticamente.

### ¿Cuándo se genera?

Solo al ejecutar:

```bash
cd frontend
npm run build
```

### ¿Debo tocarla?

No. Cada vez que corres `npm run build` se sobreescribe completamente. Los archivos dentro de `dist/` son los que se suben al hosting (Vercel, Netlify, Firebase Hosting, etc.), no el código fuente.

---

## 3. `frontend/node_modules/` y `backend/node_modules/`

### ¿Qué es?

Son las carpetas donde npm descarga e instala todas las **librerías externas** que el proyecto necesita. Hay una en `frontend/` y otra en `backend/` porque son dos proyectos Node independientes con sus propias dependencias.

### ¿Para qué sirven?

Cuando el código importa una librería:

```js
import { motion } from "framer-motion";
import express from "express";
```

Node.js y el navegador (vía Vite) buscan esos módulos dentro de `node_modules/`. Sin esta carpeta, el proyecto no puede ni arrancar.

### Contenido — Frontend (`frontend/node_modules/`)

Contiene **259 paquetes** instalados. Las dependencias principales son:

| Paquete | Versión | Para qué se usa |
|---|---|---|
| `react` + `react-dom` | 19.x | Motor de UI, renderizado de componentes |
| `firebase` | 12.x | Autenticación, Firestore (base de datos), Storage |
| `framer-motion` | 12.x | Animaciones fluidas de componentes |
| `lucide-react` | 0.577 | Librería de iconos SVG |
| `recharts` | 3.x | Gráficas de estadísticas del usuario |
| `chart.js` + `react-chartjs-2` | 4.x / 5.x | Gráficas adicionales |
| `gsap` | 3.x | Animaciones avanzadas (GSAP timeline) |
| `lottie-react` | 2.x | Animaciones Lottie (JSON) |
| `@mediapipe/pose` | 0.5 | Detección de poses corporales por cámara |
| `@mediapipe/camera_utils` | 0.3 | Utilidades de cámara para MediaPipe |
| `@google/generative-ai` | 0.24 | Integración con Gemini AI |
| `react-router-dom` | 7.x | Enrutamiento entre páginas |
| `react-hot-toast` + `sonner` | 2.x | Notificaciones y toasts |
| `@radix-ui/react-dialog` | 1.x | Modales accesibles |
| `@radix-ui/react-tooltip` | 1.x | Tooltips accesibles |
| `@radix-ui/react-checkbox` | 1.x | Checkboxes accesibles |
| `canvas-confetti` | 1.x | Efecto de confetti en celebraciones |
| `date-fns` | 4.x | Formateo y manipulación de fechas |
| `clsx` | 2.x | Combinar clases CSS condicionalmente |
| `zxcvbn` | 4.x | Evaluador de fortaleza de contraseñas |
| `vite` | 7.x | Servidor de desarrollo y bundler |
| `tailwindcss` | 3.x | Framework CSS de utilidades |
| `autoprefixer` + `postcss` | — | Procesamiento de CSS para compatibilidad |

### Contenido — Backend (`backend/node_modules/`)

Más liviano. Contiene las dependencias del servidor Express:

| Paquete | Versión | Para qué se usa |
|---|---|---|
| `express` | 4.x | Framework del servidor web (rutas, middlewares) |
| `firebase-admin` | 12.x | SDK de Firebase para el servidor (leer/escribir Firestore, verificar tokens) |
| `cors` | 2.x | Permite requests desde el frontend (Cross-Origin Resource Sharing) |
| `dotenv` | 16.x | Carga variables de entorno desde el archivo `.env` |
| `nodemailer` | 8.x | Envío de emails transaccionales vía Gmail SMTP |
| `nodemon` | 3.x | Reinicia el servidor automáticamente al guardar cambios (solo desarrollo) |

### ¿Cuándo se genera?

Al ejecutar en cada carpeta:

```bash
npm install
```

npm lee el archivo `package.json`, descarga todos los paquetes listados y los instala en `node_modules/`. El archivo `package-lock.json` garantiza que siempre se instalen **las mismas versiones exactas** en cualquier máquina.

### ¿Debo tocarla?

Nunca. Esta carpeta:
- Puede pesar entre **200 MB y 500 MB**
- Tiene miles de archivos anidados
- Se regenera completa con `npm install`
- Está en `.gitignore` por eso mismo

---

## Resumen

| Carpeta | Generada por | Cuándo | Se sube a GitHub |
|---|---|---|---|
| `frontend/deps/` | Vite | Al correr `npm run dev` | No |
| `frontend/dist/` | Vite | Al correr `npm run build` | No |
| `frontend/node_modules/` | npm | Al correr `npm install` | No |
| `backend/node_modules/` | npm | Al correr `npm install` | No |

> En una PC nueva, las tres se recrean automáticamente siguiendo las instrucciones del `README.md`. El desarrollador nunca debe crearlas ni modificarlas a mano.
