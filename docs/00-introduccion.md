# ForgeVenture — Introducción

> Documento de tesis · Trabajo de Grado  
> Sistema web de gamificación del entrenamiento físico y el bienestar personal

---

## 1. Presentación del proyecto

ForgeVenture es una aplicación web de entrenamiento físico y bienestar personal construida sobre un sistema de gamificación RPG. La premisa central es simple pero transformadora: **el esfuerzo real del usuario —las repeticiones completadas, la racha mantenida, las metas cumplidas— genera consecuencias dentro de la aplicación** de la misma forma en que completar una misión genera consecuencias dentro de un videojuego de rol.

El usuario no llega a una lista de ejercicios. Llega a un **gremio**. Tiene una clase (Guerrero, Arquero o Mago), un nivel, una racha de días activos, misiones activas con recompensas visibles, un mercado donde gastar las monedas ganadas, un inventario, un personaje visual propio y un historial de progreso que se lee como una bitácora de campaña. Cada acción tiene peso. Cada sesión completada deja una marca en el sistema.

El objetivo de ForgeVenture no es solamente registrar el entrenamiento: es **convertir la constancia en algo que valga la pena mantener**.

---

## 2. El problema que resuelve

La adherencia al ejercicio físico es uno de los grandes problemas de salud pública contemporánea. Los estudios muestran que la mayoría de las personas que inician un programa de entrenamiento lo abandona antes de los tres meses. Las causas más frecuentes no son físicas sino motivacionales: la rutina se siente repetitiva, el progreso no se hace visible con rapidez, y no hay un sistema que convierta el esfuerzo diario en algo que el usuario quiera proteger.

Las aplicaciones de fitness tradicionales responden a este problema con estadísticas y notificaciones. ForgeVenture responde con **narrativa, identidad y consecuencias**.

Tres tensiones concretas que el sistema resuelve:

| Problema | Respuesta de ForgeVenture |
|---|---|
| "El progreso no se siente" | XP, niveles, racha, historial y personaje visual que evoluciona con el usuario |
| "No sé qué hacer hoy" | Misiones activas con objetivos claros, recomendación contextual del mercader y rutinas asignadas por clase |
| "No tengo razón para volver mañana" | Racha en riesgo, misiones a punto de cerrarse, boosts activos, escudo de racha comprado que no quiero perder |

---

## 3. Alcance de la aplicación

ForgeVenture es una plataforma completa que cubre el ciclo completo de un usuario activo:

### 3.1 Flujo de incorporación
- **Página de inicio pública** con presentación de las 3 clases y el sistema de recompensas
- **Registro** con validación de fortaleza de contraseña (zxcvbn) y verificación de email
- **Onboarding** de 8 preguntas con algoritmo de 5 factores que asigna clase, rutina inicial y perfil de fitness

### 3.2 Panel del héroe (usuario autenticado)
18 páginas bajo `/user`:

| Sección | Qué hace |
|---|---|
| **Dashboard** | Bento grid con XP, racha, estadísticas de atributos, misiones activas y actividad semanal |
| **Home del héroe** | Vista principal con misiones del día, ranking, logros recientes y acceso rápido |
| **Ejercicios** | Catálogo de zonas de entrenamiento con modo cámara (MediaPipe Pose) y modo timer |
| **Rutinas** | Catálogo de rutinas públicas con sistema de recomendación de 12 factores y mapa de territorio |
| **Misiones** | Tablón de misiones activas, completadas y reclamables con rareza, botín y misión destacada |
| **Personaje** | Sprite animado con 5 etapas evolutivas, 8 atributos, árbol de habilidades con puntos |
| **Salud** | 5 tabs: resumen, hidratación, nutrición, sueño y recuperación con scores dinámicos |
| **Mente** | Módulo de mindfulness con respiración guiada y tracking de estado mental |
| **Tienda** | Mercado completo con 7 categorías, 6 rarezas, modal 4 fases, wishlist y recomendación contextual |
| **Logros** | Colección de logros desbloqueados con rareza y progreso |
| **Perfil** | Ficha del héroe con avatar, marco, skin, título activo y estadísticas históricas |
| **Chat IA** | Asistente Gemini integrado que conoce el perfil del usuario y puede navegar a secciones |
| **Boss Battle** | Modo enfrentamiento especial como meta de campaña |
| **Donaciones** | Apoyo al proyecto con integración de Ko-fi |
| **Mensajes** | Sistema de notificaciones del gremio |

### 3.3 Panel de administración
12 páginas bajo `/admin` para gestión del contenido de la plataforma:
- Gestión de usuarios, ejercicios, misiones, objetos, rutinas, logros, mente y salud
- Dashboard de estadísticas globales de la plataforma
- Configuración del sistema y gestión de mensajes

---

## 4. Arquitectura técnica

### 4.1 Vista general

```
┌────────────────────────────────────────────────┐
│                  CLIENTE (SPA)                  │
│         React 19 · Vite 7 · React Router 7     │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Páginas │  │   Hooks  │  │   Servicios  │  │
│  │  /user   │  │ useLang  │  │   api.js     │  │
│  │  /admin  │  │ useIsMob │  │   firebase   │  │
│  │  /auth   │  │ useHook  │  │              │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────┬─────────────────────────────┘
                   │ HTTP / REST
┌──────────────────▼─────────────────────────────┐
│                SERVIDOR (API)                   │
│         Node.js · Express 4 · Puerto 4001       │
│                                                │
│  18 routers bajo /api/*                        │
│  Middleware: CORS · JSON · Firebase Admin SDK  │
└──────────────────┬─────────────────────────────┘
                   │ Firebase Admin SDK
┌──────────────────▼─────────────────────────────┐
│                 BASE DE DATOS                   │
│         Google Firebase / Firestore            │
│         Firebase Authentication                │
│         Firebase Storage                       │
└────────────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────┐
│            SERVICIOS EXTERNOS                   │
│  Google Gemini API  →  chat IA contextual      │
│  MediaPipe Pose     →  detección de poses      │
│  Ko-fi              →  donaciones              │
│  Nodemailer         →  correos transaccionales │
└────────────────────────────────────────────────┘
```

### 4.2 Frontend

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework UI | React | 19.2 | Componentes y estado |
| Bundler | Vite | 7.3 | Dev server + build optimizado |
| Enrutamiento | React Router DOM | 7.13 | SPA con rutas protegidas por rol |
| Animaciones | Framer Motion | 12.35 | Transiciones, springs, `AnimatePresence` |
| Gráficos | Recharts | 3.8 | Gráficos de XP, actividad semanal y atributos |
| Gráficos 2 | Chart.js + react-chartjs-2 | 4.5 | Gráficos de salud y mente |
| Animaciones canvas | GSAP | 3.15 | Animaciones del personaje y boss battle |
| Animaciones Lottie | lottie-react | 2.4 | Micro-animaciones de UI |
| Iconos | Lucide React | 0.577 | Sistema de iconos SVG |
| UI primitivas | Radix UI | — | Dialog, Checkbox, Tooltip accesibles |
| Fechas | date-fns | 4.1 | Formateo y comparación de fechas |
| Pose detection | @mediapipe/pose | 0.5 | Detección de esqueleto en cámara |
| Confetti | canvas-confetti | 1.9 | Celebración de logros y level-up |
| Seguridad | zxcvbn | 4.4 | Fortaleza de contraseña en registro |
| Toasts | react-hot-toast + sonner | — | Notificaciones en pantalla |
| Autenticación | Firebase SDK | 12.10 | Auth del lado cliente |
| IA | @google/generative-ai | 0.24 | Gemini desde el cliente (chat) |

### 4.3 Backend

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Runtime | Node.js | — | Servidor JavaScript |
| Framework web | Express | 4.19 | API REST |
| Autenticación | Firebase Admin SDK | 12.1 | Verificación de ID tokens JWT |
| Base de datos | Firestore (via Admin SDK) | — | Persistencia de todos los datos |
| Variables de entorno | dotenv | 16.4 | Configuración segura |
| CORS | cors | 2.8 | Control de orígenes permitidos |
| Email | Nodemailer | 8.0 | Correos de verificación y notificaciones |
| Dev server | nodemon | 3.1 | Recarga automática en desarrollo |

**Detección dinámica de puertos**: el servidor intenta arrancar en `4001` y si está ocupado busca automáticamente hasta 20 puertos consecutivos disponibles, garantizando que el entorno de desarrollo nunca queda bloqueado.

### 4.4 Base de datos (Firestore)

Firestore es una base de datos NoSQL documental en tiempo real. En ForgeVenture almacena:

| Colección | Contenido |
|---|---|
| `usuarios` | Perfil completo del héroe: nivel, XP, racha, clase, monedas, títulos, cosméticos |
| `ejercicios` | Catálogo de ejercicios con zonas, técnica, equipamiento y PNGs |
| `misiones` | Misiones públicas con rareza, objetivos, botín y estado |
| `objetos` | Catálogo de la tienda con efectos, rareza, precios y metadatos |
| `logros` | Catálogo de logros con condiciones de desbloqueo |
| `rutinas` | Rutinas públicas con clase, duración, dificultad y series |
| `mensajes` | Mensajes del gremio por usuario |
| `mente` | Registros de mindfulness por usuario |
| `salud` | Registros de hidratación, sueño, nutrición y recuperación |
| `feedback` | Reportes de usuarios |

La autenticación se hace vía Firebase Auth. **Cada request al backend incluye el ID token del usuario**, que el middleware de Express verifica con `firebase-admin` antes de ejecutar cualquier operación sobre Firestore.

### 4.5 API endpoints

18 grupos de rutas bajo `/api/`:

| Prefijo | Contenido |
|---|---|
| `/api/auth` | Registro, login, onboarding, perfil |
| `/api/dashboard` | Estadísticas del héroe, leaderboard, actividad semanal |
| `/api/ejercicios` | Catálogo, sesiones, estadísticas de entrenamiento |
| `/api/missions` | Misiones activas, progreso, reclamación de botín |
| `/api/objetos` | Catálogo de tienda, compra, uso de ítems |
| `/api/skins` | Catálogo de skins, compra, equip |
| `/api/avatars` | Avatares y marcos, compra, equip |
| `/api/titles` | Catálogo de títulos, compra, equip |
| `/api/logros` | Catálogo, desbloqueos, progreso |
| `/api/salud` | Registros de salud, scores, recomendaciones |
| `/api/mente` | Registros de mindfulness, stats |
| `/api/messages` | Mensajes del gremio por usuario |
| `/api/chat` | Proxy al API de Gemini con contexto del perfil |
| `/api/skills` | Árbol de habilidades, gasto de puntos |
| `/api/feedback` | Envío de reportes y comentarios |
| `/api/config` | Configuración dinámica de la plataforma |
| `/api/admin` | Operaciones de gestión (solo rol admin) |
| `/api/dashboard` | Datos del dashboard por clase y periodo |

---

## 5. Sistema de gamificación

El núcleo diferencial de ForgeVenture es su sistema de gamificación. No es una capa estética sobre estadísticas: **cada mecánica de juego está conectada a una acción de entrenamiento real**.

### 5.1 Progresión del héroe

```
Entrenamiento real
       ↓
  XP ganado
       ↓
  Barra de nivel
       ↓
  Subir nivel → Puntos de habilidad
       ↓
  Árbol de habilidades → mejoras del perfil
```

- **XP**: obtenida completando ejercicios (modo cámara da más XP que modo timer), usando ítems del inventario, reclamando misiones y como bonus de racha.
- **Niveles**: cada nivel requiere XP creciente. También se pueden comprar directamente en la tienda (1 000 monedas por nivel, máximo 10 por sesión).
- **Puntos de habilidad**: obtenidos al subir de nivel. Se gastan en el árbol de habilidades del personaje para desbloquear bonificaciones de atributos.

### 5.2 Sistema de monedas (coins)

```
Completar misión → Monedas
    ↓
Mercado (tienda)
    ├── Ítems funcionales (boosts, XP, protección de racha)
    ├── Servicios (comprar niveles)
    └── Cosméticos (skins, avatares, marcos, títulos)
```

Las monedas crean un ciclo de economía interna que da valor al esfuerzo: entrenar genera monedas, las monedas permiten comprar ventajas o personalización, y esas ventajas motivan a seguir entrenando.

### 5.3 Racha (streak)

La racha es el número de días consecutivos con actividad registrada. Es el dato más visible en el dashboard. Perderla tiene un coste emocional real: el sistema la convierte en un recurso que el usuario quiere proteger activamente.

Mecánicas asociadas:
- **Escudo de racha** (`streak_shield`): comprable en la tienda, protege la racha un día aunque no se entrene.
- **Boosts de XP por racha alta**: el sistema detecta rachas largas y ofrece ítems contextuales en la recomendación del mercader.
- **Misiones vinculadas a racha**: algunas misiones requieren mantener la racha N días.

### 5.4 Misiones (quests)

Las misiones son contratos del gremio con objetivos medibles:
- Tienen **rareza** (Común → Mítico) que determina la dificultad y el botín.
- Tienen un **estado**: activa / en progreso / completada / reclamable / expirada.
- Tienen **botín**: monedas, XP, ítems.
- Una misión destacada actúa como narrativa principal del período.

### 5.5 Clases (Guerrero / Arquero / Mago)

La clase no es solo un skin. Determina:
- El color de acento y la paleta visual de toda la interfaz del usuario.
- Las rutinas recomendadas por el sistema.
- La puntuación que da el algoritmo de recomendación del mercader a cada ítem.
- El copy y la narrativa de cada sección (STORE_COPY, SHOP_CLASS_COPY).
- Los hints de clase en el sistema de scoring de ítems y rutinas.

### 5.6 Personaje visual

El sprite del personaje tiene 5 etapas evolutivas basadas en el nivel del usuario. Tiene 8 atributos que se muestran visualmente (Fuerza, Resistencia, Velocidad, Disciplina, Mente + 3 específicos de clase). El árbol de habilidades permite mejorar atributos individuales gastando puntos.

---

## 6. Sistema de diseño

ForgeVenture tiene un sistema de diseño centralizado en `frontend/src/design/system.jsx` que exporta:

### Paleta P (paleta global)

```js
P = {
  bg0:    "#080611",   // fondo más oscuro
  bg1:    "#0d0a1a",   // fondo de paneles
  bg2:    "#12102a",   // fondo de cards
  navy:   "#1a1535",   // borde oscuro
  line:   "#2a2050",   // borde sutil
  accent: "#7c3aed",   // violeta primario
  accent2:"#a855f7",   // violeta claro
  gold:   "#f4cc78",   // dorado para monedas/logros
  text:   "#f0e6ff",   // texto principal
  muted:  "#9080b0",   // texto secundario
  mutedL: "#b8a8d0",   // texto muy secundario
}
```

### Tipografías

| Función | Fuente | Uso |
|---|---|---|
| `mono(s, w)` | JetBrains Mono | Códigos, labels técnicos, stats |
| `sans(s, w)` | Manrope | Cuerpo de texto, descripciones |
| `disp(s, w)` | Sora | Títulos y headings |
| `glass(opts)` | — | Estilos glassmorphic con backdrop-filter |

### Efectos visuales

| Nombre | Qué hace |
|---|---|
| `Aurora` | Componente de 3 blobs de gradiente animados en canvas para fondos de sección |
| `PixelRain` | Efecto de "lluvia de píxeles" matrix-style para transiciones |
| `Embers` | 34 partículas de fuego animadas via requestAnimationFrame |
| `Brackets` | Decoración de esquinas tipo terminal |
| `Reveal` | Wrapper de animación de aparición con `framer-motion` |

---

## 7. Sistema de internacionalización (i18n)

ForgeVenture tiene soporte multiidioma implementado con un sistema propio (sin librerías externas):

- **Hook `useLang()`**: retorna `{ lang, setLang, t }` donde `t(key)` busca en el diccionario del idioma activo.
- **4 idiomas**: Español (es), English (en), Português (pt), Français (fr).
- **Persistencia**: idioma seleccionado guardado en `localStorage`.
- **Selector de idioma**: integrado en el `SettingsPanel` con bandera y nombre.
- **Cobertura**: las secciones de tienda (UserTienda) usan `t()` extensivamente; otras secciones tienen texto mixto (hardcoded en español + i18n en claves clave).

---

## 8. Flujo de autenticación y roles

```
Visitante → Home pública (/)
     ↓
  Registro (/register) → Firebase Auth → Onboarding → /user/dashboard
  Login    (/login)    → Firebase Auth → /user/dashboard (o /admin si rol=admin)
     ↓
  Token JWT (Firebase ID Token)
     ↓
  Cada request al backend lleva Authorization: Bearer {token}
     ↓
  Middleware Express verifica token con firebase-admin
     ↓
  Extrae uid + custom claims (rol)
```

Rutas protegidas:
- `/user/*` → requiere autenticación
- `/admin/*` → requiere autenticación + rol admin

---

## 9. Comunicación en tiempo real (CustomEvents)

Dado que ForgeVenture es una SPA con múltiples vistas montadas simultáneamente (dashboard, tienda, perfil), el sistema usa **CustomEvents del navegador** como bus de eventos interno para sincronizar estado entre componentes no relacionados en el árbol:

| Evento | Quién lo emite | Quién lo escucha |
|---|---|---|
| `profileUpdated` | Tienda, ejercicios | Dashboard, HUD, perfil |
| `exerciseCompleted` | Ejercicios, tienda (item use) | Dashboard, HUD, boosts |
| `levelUp` | Tienda, ejercicios | Dashboard, HUD, personaje |
| `shopStateChanged` | Tienda | Dashboard, otros panels |
| `avatarEquipped` | Tienda | Perfil, header |
| `skinChanged` | Tienda | Perfil, sprite |
| `chatGameplayLink` | Chat IA | Tienda, misiones, ejercicios |
| `itemUsed` | Tienda | Dashboard, HUD |

Esta arquitectura permite que el saldo de monedas se actualice en el header sin recargar la página, que el nivel del personaje suba con animación cuando se usa un ítem, y que el chat IA pueda navegar al usuario a una sección específica de la tienda con un artículo preseleccionado.

---

## 10. Estructura de la documentación

Este conjunto de documentos cubre **toda la base de código de ForgeVenture** organizada en 13 documentos:

| Documento | Contenido |
|---|---|
| **00 — Introducción** (este archivo) | Visión general, arquitectura, sistema de gamificación, tech stack |
| **01 — Carpetas generadas** | `deps/`, `dist/`, `node_modules/` — carpetas auto-generadas |
| **02 — Carpeta public** | Assets estáticos: PNGs, SVGs, estructura de `/ui/` |
| **03 — src/assets, avatar, components, design** | Sistema de diseño, catálogos de avatar, componentes compartidos |
| **04 — src/hooks, i18n, router, routes** | Hooks customizados, sistema de idiomas, enrutamiento |
| **05 — src/services, utils, rootfiles** | Capa de API (api.js), utilidades, configuración raíz |
| **06 — pages/auth, home, login, onboarding** | Flujo público: landing, registro, login, onboarding 8 preguntas |
| **07 — pages/privacidad, register, support, terminos** | Páginas legales y soporte |
| **08 — pages/user: BossBattle, Chat, ClassTheme** | Arena boss, chat IA con Gemini, sistema de temas de clase |
| **09 — pages/user: Dashboard, Donaciones, Ejercicios** | Panel principal, donaciones Ko-fi, campo de entrenamiento |
| **10 — pages/user: Home, Logros, Mensajes** | Home del héroe, colección de logros, mensajes del gremio |
| **11 — pages/user: Mente, Misiones, Perfil** | Mindfulness, tablón de quests, ficha del héroe |
| **12 — pages/user: Personaje, Rutinas, Salud** | Sprite evolutivo, catálogo de rutinas, módulo de salud |
| **13 — pages/user: Tienda, TiendaLanding** | Mercado completo, recomendación contextual, cosméticos |

Cada documento sigue la misma estructura: propuesta de valor → imports → constantes → diseño → estado → APIs → sub-componentes → layout → resumen.

---

## 11. Resumen ejecutivo

ForgeVenture demuestra que es posible construir una aplicación de fitness que el usuario quiera usar no por obligación sino porque **el progreso se siente**. Cada decisión técnica —desde la comunicación por CustomEvents hasta el sistema de scoring contextual del mercader— existe para que la acción en pantalla refleje el esfuerzo real del usuario en el mundo.

| Métrica | Valor |
|---|---|
| Páginas de usuario | 18 (incluyendo variantes Landing) |
| Páginas de administración | 12 |
| Páginas públicas | 6 |
| Rutas de API | 18 grupos |
| Funciones de API en `api.js` | 40+ |
| Colecciones Firestore | 10+ |
| Idiomas soportados | 4 (ES / EN / PT / FR) |
| Animaciones CSS (keyframes) | 80+ en todo el proyecto |
| Sub-componentes internos | 60+ |
| CustomEvents del sistema | 10 |
| Librerías de terceros | 20+ |
