# `src/pages/` — AuthRouter, Home, LoginPage, OnboardingFlow

> Estas cuatro páginas forman el **ciclo de entrada** al sistema: la página pública que muestra la plataforma, el portal de autenticación, el router que une las dos vistas de auth, y el cuestionario de bienvenida que activa el perfil del héroe.

---

## 1. `AuthRouter.jsx` — Enrutador de autenticación ligero

### ¿Qué es?

Un micro-componente de 14 líneas que actúa como **conmutador interno** entre `LoginPage` y `RegisterPage` sin necesidad de rutas de React Router.

### Lógica

```jsx
export default function AuthRouter({ onLogin }) {
  const [view, setView] = useState("login");   // "login" | "register"

  if (view === "register") {
    return <RegisterPage onGoLogin={() => setView("login")} onSuccess={onLogin} />;
  }
  return <LoginPage onGoRegister={() => setView("register")} onSuccess={onLogin} />;
}
```

### ¿Cuándo se usa?

Cuando alguna parte de la app necesita renderizar auth en línea (sin navegar a una URL). Ambas páginas tienen su propia ruta en `App.jsx` (`/login`, `/register`), pero `AuthRouter` permite incrustar el flujo de auth en un contexto donde no hay navegación disponible.

### Flujo de datos

```
AuthRouter
├── view = "login"    → <LoginPage   onGoRegister={() => setView("register")} />
└── view = "register" → <RegisterPage onGoLogin={() => setView("login")} />
```

---

## 2. `Home.jsx` — Página pública de marketing

### ¿Qué es?

La **landing page** de ForgeVenture (ruta `/home`). Es la primera pantalla que ve cualquier visitante. Tiene 3515 líneas y combina marketing, animaciones 3D, datos en tiempo real y lógica adaptativa para usuarios registrados vs. nuevos visitantes.

### Estructura visual

```
┌─────────────────────────────────────────┐
│  NAV (sticky, glassmorphic, tri-color)  │
├─────────────────────────────────────────┤
│  HERO SECTION                           │
│  ├── Panel izquierdo: título + clase    │
│  │   selector + stats + CTA             │
│  └── Panel derecho: avatar animado +    │
│       ruta de clase + card contextual   │
├─────────────────────────────────────────┤
│  STATS STRIP (4 cards con contadores)   │
├─────────────────────────────────────────┤
│  COMMAND CENTER (tabs: Mundo / Clases   │
│  / Sistema / FAQ)                       │
│  ├── Mundo: 4 feature bands del app    │
│  ├── Clases: detalle GUERRERO/ARQUERO/ │
│  │   MAGO con barras de progreso        │
│  ├── Sistema: 3 funcionalidades clave  │
│  └── FAQ: 4 preguntas desplegables     │
├─────────────────────────────────────────┤
│  FINAL CTA + Footer                     │
│  FAB flotante: redes sociales           │
└─────────────────────────────────────────┘
```

### Constantes de datos principales

#### `HOME_CLASSES` — Las tres clases jugables
Cada objeto contiene:

| Campo | Descripción |
|---|---|
| `key` | Identificador (`GUERRERO`, `ARQUERO`, `MAGO`) |
| `accent` / `secondary` | Colores de la clase (`#ff4d5e`, `#7bdc3b`, `#4cc9f0`) |
| `crest` | PNG del emblema de la clase |
| `hero` | PNG del héroe de la clase |
| `floor` / `zoneBanner` | Imágenes decorativas de fondo |
| `title` / `subtitle` | Copy principal del hero de esa clase |
| `route` / `routeCopy` | Nombre y descripción de la ruta de entrenamiento |
| `perks` | Array de 3 ventajas diferenciadas de la clase |
| `classCopy` | Tagline corto de la clase |

#### `FEATURE_BANDS` — Módulos del app explicados
Cuatro objetos que describen: Home del héroe, Campo de entrenamiento, Tablón del gremio (misiones), Mesa de rutinas. Cada uno tiene `icon`, `image`, `label`, `title`, `copy` y `bullets`.

#### `HOME_FALLBACK_STATS`
Valores por defecto que se muestran si la API de stats falla:
```js
{ totalUsers: 16, totalExercises: 18, totalAchievements: 24, classCounts: {GUERRERO:6, ARQUERO:5, MAGO:5} }
```

### Estado del componente

| Estado | Tipo | Para qué |
|---|---|---|
| `selectedIndex` | `0-2` | Clase activa en el selector (arranca en `1` = ARQUERO) |
| `heroPreviewIndex` | `-1` a `2` | Clase en hover en la sección hero (`-1` = neutral) |
| `selectedFeatureIndex` | `0-3` | Feature band activo en la sección Mundo |
| `flowTab` | `string` | Tab activo del Command Center: `"mundo"`, `"clases"`, `"sistema"`, `"faq"` — persiste en `localStorage` |
| `faqOpen` | `number` | Índice del FAQ abierto |
| `publicStats` | `object\|null` | Stats cargadas desde `getPublicStats()` |
| `user` | `fbUser\|null` | Usuario Firebase (via `onAuthStateChanged`) |
| `socialOpen` | `bool` | Si el FAB de redes sociales está expandido |

### Animaciones y efectos 3D

El componente usa `useSpring` de Framer Motion para crear un **efecto de paralaje 3D** en dos paneles:

```js
// Hero panel — inclina 8°/5.5° con el movimiento del mouse
heroRotateX.set((0.5 - py) * 5.5);
heroRotateY.set((px - 0.5) * 8);

// Command stage — inclina 7.5°/5.5°
stageRotateY.set((px - 0.5) * 7.5);
```

Ambos reaccionan a `mousemove` y se suavizan con `stiffness: 80, damping: 18`.

### Sub-componentes destacados

#### `PixelSprite`
Anima el sprite del héroe usando `setInterval`:
```js
// Cicla entre 8 frames a 8 FPS
const HERO_IDLE_FRAMES = Array.from({length: 8}, (_, i) => `/avatar/idle/idle_0${i+1}.png`);
```
Pre-carga todos los frames en `useEffect` para evitar parpadeos.

#### `HomeStat`
Contador animado con easing cúbico:
```js
// Cuenta desde 0 hasta el valor en 900ms usando requestAnimationFrame
const eased = 1 - Math.pow(1 - progress, 3);
const next = Math.round(numericValue * eased);
```
Respeta `prefers-reduced-motion` — si está activo, muestra el número directamente sin animar.

### Lógica adaptativa para usuario autenticado

```js
const isReturningUser = Boolean(user);  // user viene de onAuthStateChanged

// Botón principal:
const heroPrimaryAction = isReturningUser
  ? { label: "Volver a mi ruta", onClick: onLogin }
  : { label: "Forjar héroe",     onClick: onRegister };

// Card contextual:
const heroDiscoveryCard = isReturningUser
  ? { title: "Tu avance sigue vivo", ... }
  : { title: "Si quieres entrenar con un motivo claro", ... };
```

También genera **guía según la hora del día**:
- 5-12h: "Ritmo de la mañana — Hora de activar el cuerpo"
- 12-19h: "Ritmo de la tarde — Ventana de rendimiento"
- 19-5h: "Ritmo de la noche — Cierre con foco y recuperación"

### Paleta visual exclusiva

`Home.jsx` usa su propia paleta (no el sistema de diseño central) basada en los tres colores de clase mezclados:

```css
/* Variable CSS tri-color — mezcla los tres colores en borders y glows */
--fv-tri-glow:
  0 0 18px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
  0 0 28px color-mix(in srgb, var(--fv-archer) 8%, transparent),
  0 0 38px color-mix(in srgb, var(--fv-mage) 10%, transparent);

/* Fondo con 3 orbes de gradiente */
background:
  radial-gradient(circle at top left,  /* rojo guerrero */
  radial-gradient(circle at top right, /* verde arquero */
  radial-gradient(circle at bottom,    /* azul mago */
```

El fondo de la página siempre tiene los tres colores visibles para comunicar que el mundo incluye las tres clases.

### Fuentes propias

Inyecta las fuentes al `<head>` una sola vez mediante un flag de ID:
```js
if (!document.getElementById("forgeventure-home-fonts")) { /* inyecta link */ }
// Fuentes: Inter (400-800), Rajdhani (500-700), Sora (600-800)
```

---

## 3. `LoginPage.jsx` — Portal de autenticación

### ¿Qué es?

La página de inicio de sesión (ruta `/login`). Tiene 2323 líneas y contiene todo el sistema de autenticación del frontend: Firebase Auth (email/Google), recuperación de contraseña con OTP, rate limiting, animaciones de boot y un diseño de dos paneles.

### Estructura visual

```
┌──────────────┬─────────────────────────────────┐
│ Panel        │ Panel derecho (formulario)       │
│ izquierdo   │                                  │
│ (decorativo) │  LOGO + Boot loader (1ª vez)    │
│              │                                  │
│ Hero default │  ┌──────────────────────────┐   │
│ + Sprite     │  │ EMAIL / GOOGLE / FORGOT  │   │
│ + Cards      │  │                          │   │
│ flotantes    │  │ [InputField email]       │   │
│              │  │ [InputField password]    │   │
│ ← oculto en │  │ [Remember me] [Forgot]   │   │
│   mobile    │  │ [Btn: Acceder]           │   │
│              │  │ [Btn: Google]            │   │
│              │  └──────────────────────────┘   │
└──────────────┴─────────────────────────────────┘
```

### Flujo de autenticación principal

```
[Usuario escribe email + password]
         ↓
setPersistence(browserLocalPersistence | browserSessionPersistence)
         ↓
signInWithEmailAndPassword(auth, email, password)      [Firebase]
         ↓ (éxito)
fbUser.getIdToken()
         ↓
loginSync(token)                [backend Express → verifica en Firestore]
         ↓ (éxito)
onSuccess()                     [navega a /dashboard]
```

#### Manejo de errores

Cada código de error de Firebase tiene un mensaje temático en RPG:

| Código Firebase | Mensaje mostrado |
|---|---|
| `auth/user-not-found` | "No existe una cuenta con ese correo" |
| `auth/wrong-password` | "Contraseña incorrecta" |
| `auth/invalid-credential` | "Correo o contraseña incorrectos" |
| `auth/too-many-requests` | "Demasiados intentos. Espera un momento" |
| `auth/popup-blocked` | "Popup bloqueado — usando redirección..." |

Además cada error tipo tiene un panel contextual en el panel izquierdo con **icono + título + copy** adaptado al error (ej: red caída → mención al enlace inestable; contraseña mal → mención al sello).

### Login con Google

```js
// 1. Intenta con popup (más rápido)
signInWithPopup(auth, googleProvider)
  .catch(err => {
    if (err.code === "auth/popup-blocked") {
      // 2. Si el popup está bloqueado → redirige
      signInWithRedirect(auth, googleProvider);
      setShowRedirectOverlay(true);
    }
  })
```

Mientras dura la redirección, muestra `<GoogleRedirectOverlay>` con spinner, mensaje y botón de cancelar (aparece a los 4s; timeout de error a los 30s).

### Flujo de recuperación de contraseña

El modal `<ForgotPasswordModal>` tiene **3 pasos**:

```
Paso 1 — email     → usuario escribe correo → forgotPassword(email) → backend envía OTP
Paso 2 — OTP       → usuario introduce código de 6 dígitos con <OTPInput>
Paso 3 — password  → usuario escribe nueva contraseña → resetPassword(token, {code, email, newPassword})
```

**Cooldown**: 60 segundos entre reenvíos de código. Se persiste en `sessionStorage` para sobrevivir un refresh de página.

### Sub-componentes internos

#### `Loader` — Boot sequence (solo la primera vez por sesión)
```js
// Aparece UNA vez por sesión (sessionStorage flag "fv_booted")
const BOOT_SEQUENCE = [
  "> ABRIENDO ACCESO DEL GREMIO",
  "> AJUSTANDO SELLOS DE ENTRADA",
  "> VERIFICANDO CREDENCIALES DEL HÉROE",
  "> PREPARANDO LA BITÁCORA PERSONAL",
  "> ACCESO LISTO",
];
// Imprime las líneas cada 220ms → luego barra de progreso pixel
// Al terminar → sessionStorage.setItem("fv_booted", "1")
```

#### `OTPInput` — Entrada de código de 6 dígitos
- 6 inputs individuales con navegación por teclado (←, →, Backspace)
- Soporte de pegado (`onPaste` → distribuye dígitos automáticamente)
- Animación de sacudida en caso de error (Framer Motion `x: [-4, 4, -3, 3, -1, 1, 0]`)
- Barra de progreso debajo (segmentos que se iluminan)

#### `InputField` — Campo de texto con efectos
- Label animado con flecha `▶` parpadeante cuando tiene focus
- Corchetes pixel en las esquinas cuando está activo
- Indicador de fortaleza de contraseña (DÉBIL/NORMAL/FUERTE/ÉPICO) con barra de 4 segmentos
- Botón de ojo para mostrar/ocultar contraseña
- Mensaje de error con animación de entrada/salida

#### `AuroraBackground`
Fondo decorativo con 3 orbes de blur (`orange`, `purple`, `blue`) + grid + scanlines + viñeta, idéntico al patrón del sistema de diseño.

#### `CustomCursor`
Cursor personalizado con `clip-path` en forma de visor cuadrado (esquinas abiertas) que sigue al mouse con interpolación suave (10% de seguimiento por frame).

#### `Particles`
16 partículas de colores (`accent`, `blue`, `gold`, `purple`) que suben animadas con `motion.div` en loop infinito.

### Persistencia en localStorage

| Clave | Contenido |
|---|---|
| `fv_login_last_email` | Último email usado (para el campo "Remember me") |
| `fv_login_remember_me` | Si "Recordar" estaba marcado |
| `fv_login_last_method` | Último método: `"email"` o `"google"` |

### Panel adaptativo (izquierdo)

El panel izquierdo cambia su copia según el estado actual:

| Situación | Kicker | Título |
|---|---|---|
| Flow normal | "PRIMERA ENTRADA DEL DÍA" | "Cruza el portal sin romper el tono del mapa" |
| Usuario con sesión previa | "VUELVES CON RASTRO GUARDADO" | "Tu última entrada sigue reconocida" |
| Forgot password activo | "RECUPERACIÓN DISPONIBLE" | "El portal ya tiene una ruta para devolverte el acceso" |

---

## 4. `OnboardingFlow.jsx` — Cuestionario de bienvenida

### ¿Qué es?

El flujo que aparece **una sola vez** en la vida del usuario: justo después del primer registro, cuando `profile.onboardingCompleted === false`. Recoge información sobre hábitos de fitness del usuario y aplica un algoritmo de 5 factores para asignar su nivel de dificultad y recompensas de bienvenida.

### ¿Cuándo se activa?

Desde `App.jsx → DashboardResolver`:
```jsx
if (sessionState.profile.onboardingCompleted === false) {
  return <OnboardingFlow
    profile={sessionState.profile}
    onComplete={() => window.location.reload()}
  />;
}
```

Cuando el usuario termina, la app hace `window.location.reload()` para que `App.jsx` recargue el perfil actualizado (ahora con `onboardingCompleted: true`).

### Las 8 preguntas

| # | Tema | Icono | Acento |
|---|---|---|---|
| Q1 | Frecuencia de ejercicio | ⚡ Zap | naranja |
| Q2 | Tipo de ejercicio preferido | 🏋️ Dumbbell | azul |
| Q3 | Condición física actual | 📊 Activity | teal |
| Q4 | Alimentación actual | 🌿 Leaf | verde |
| Q5 | Horas de sueño | 🌙 Moon | púrpura |
| Q6 | Hidratación diaria | 💧 Droplets | azul |
| Q7 | Objetivo principal | 🎯 Target | dorado |
| Q8 | Nivel de estrés | 🧠 Brain | rojo |

Cada pregunta tiene entre 4 y 5 opciones. Cada opción tiene `label`, `Ico` (icono Lucide), `tag` (identificador semántico) y `score` (solo en algunas preguntas, 0-3).

### Algoritmo de 5 factores (`computeProfile`)

```js
function computeProfile(answers) {
  const freqScore = (answers.q1?.score ?? 0) * 2;    // Q1: 0, 1, 2, 3 → ×2 = 0 a 6
  const condScore = (answers.q3?.score ?? 0) * 2;    // Q3: 0, 1, 2, 3 → ×2 = 0 a 6

  const stressMap = { low:+1, medium:0, high:-1, extreme:-2 };
  const sleepMap  = { poor:-1, fair:0, good:+1, great:+1 };
  const goalMap   = { muscle_gain:+1, endurance:+1, weight_loss:0, wellness:-1 };

  const total = freqScore + condScore + stressMod + sleepMod + goalMod;
  // Rango posible: -3 a 14

  if (total <= 4) return { level: "beginner",     label: "INICIANTE",  coins: 150, ... }
  if (total <= 9) return { level: "intermediate", label: "INTERMEDIO", coins: 100, ... }
  return           { level: "advanced",    label: "AVANZADO",    coins: 50,  ... }
}
```

**Lógica del algoritmo:**
- **Frecuencia** y **condición física** son los factores principales (hasta 6 puntos cada uno)
- **Estrés alto** resta puntos porque reduce la capacidad de recuperación
- **Poco sueño** resta puntos por el mismo motivo
- **Objetivos de fuerza/resistencia** suman; bienestar general resta (indica que no necesita alta intensidad)

### Recompensas de bienvenida por nivel

| Nivel | Coins | Razón |
|---|---|---|
| INICIANTE | 150 | Más coins para compensar la curva de entrada |
| INTERMEDIO | 100 | Balance estándar |
| AVANZADO | 50 | Ya tiene ventaja de rendimiento, menos monedas |

### Navegación entre preguntas

```js
const goNext = (option) => {
  // 1. Guarda la respuesta
  setAnswers(prev => ({ ...prev, [question.id]: option }));
  // 2. Animación de salida (fadeOut)
  setAnimDir("out");
  // 3. Tras 200ms: avanza al siguiente paso
  setTimeout(() => {
    setStep(s => s + 1);
    setAnimDir("in");
  }, 200);
};
```

La última pregunta (Q8) lleva a la pantalla de resultados (`step === TOTAL === 8`).

### Pantalla de resultados (`ResultScreen`)

Aparece en secuencia escalonada:
- `t=0`: Level icon + label + mensaje del perfil
- `t=550ms`: Tile de monedas de bienvenida (animación `ob-pop`)
- `t=950ms`: 3 stat cards (NIVEL, PERFIL, RACHA)

### Guardar el onboarding

Al presionar **"COMENZAR AVENTURA"**:

```js
const token = await auth.currentUser.getIdToken();
await saveOnboarding(token, {
  answers,           // respuestas completas
  profile: {
    level:      computedProfile.level,       // "beginner" | "intermediate" | "advanced"
    dificultad: computedProfile.dificultad,  // "Principiante" | "Intermedio" | "Avanzado"
    welcomeCoins: computedProfile.coins,     // 50 | 100 | 150
    exerciseType: answers.q2?.tag,           // "gym" | "cardio" | "sports" | "home" | "yoga"
    goal:         answers.q7?.tag,           // "weight_loss" | "muscle_gain" | "endurance" | "wellness"
  },
});
onComplete();  // → window.location.reload() en App.jsx
```

El backend escribe en Firestore:
- `onboardingCompleted: true` → evita que este flujo aparezca de nuevo
- `coins: welcomeCoins` → monedas de bienvenida al saldo
- `fitnessLevel` / `dificultad` → datos usados para personalizar rutinas recomendadas

### Estado y animaciones

| Estado | Descripción |
|---|---|
| `step` | Pregunta actual (0-7) + 8 = pantalla de resultados |
| `answers` | Objeto `{ q1: {...}, q2: {...}, ... }` acumulado |
| `animDir` | `"in"` / `"out"` — controla la animación de transición entre preguntas |
| `saving` | `true` mientras se guarda (desactiva el botón CTA) |
| `error` | Mensaje de error si `saveOnboarding` falla |

Las transiciones entre preguntas usan animaciones CSS puras (`ob-fadeIn`, `ob-fadeOut`) en vez de Framer Motion para mantener el componente liviano.

### `StepDots` — Indicador de progreso

Barra de puntos donde el punto activo se expande a `width: 20px` (los demás son `8px` o `6px`), y los completados se colorean semitransparentes con el acento de la pregunta actual.

---

## Resumen visual del ciclo de entrada

```
/ (raíz)
└── /home          → Home.jsx          [pública — marketing]
    ├── [Forjar héroe] ──────────────────────────────────────┐
    └── [Volver a mi ruta]                                   │
                                                             ▼
/login             → LoginPage.jsx     [auth — email/Google] │
    ├── [email login]    → loginSync() → /dashboard          │
    ├── [Google login]   → loginSync() → /dashboard          │
    └── [forgot]         → OTP → resetPassword()             │
                                                             │
/register          → RegisterPage.jsx  [auth — registro] ←──┘
    └── [onboardingCompleted: false]
              ↓
         OnboardingFlow.jsx   [8 preguntas → perfil]
              ↓
         saveOnboarding() → Firestore → /dashboard (reload)
```

El usuario solo pasa por `OnboardingFlow` una sola vez en toda su vida dentro de la plataforma. A partir de ahí, cada login va directo al dashboard.
