# 07 · Pages: PrivacidadPage · RegisterPage · SupportPage · TerminosPage

> Documentación de tesis — ForgeVenture v1  
> Carpeta: `frontend/src/pages/`  
> Páginas cubiertas en este documento: `PrivacidadPage.jsx`, `RegisterPage.jsx`, `SupportPage.jsx`, `TerminosPage.jsx`

---

## Índice

1. [PrivacidadPage.jsx](#1-privacidadpagejsx)
2. [TerminosPage.jsx](#2-terminospagejsx)
3. [RegisterPage.jsx](#3-registerpagejsx)
4. [SupportPage.jsx](#4-supportpagejsx)

---

## 1. PrivacidadPage.jsx

**Versión:** v2 · Design System v3  
**Ruta:** `frontend/src/pages/PrivacidadPage.jsx`  
**Última actualización:** 30 de abril de 2026

### 1.1 Propósito

Página legal que presenta la política de privacidad completa de la plataforma ForgeVenture. Cubre los 17 apartados exigidos por la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador, incluyendo: responsable del tratamiento, datos recopilados, finalidades, derechos ARCO+P, cookies, transferencias internacionales y canal de contacto.

### 1.2 Importaciones y paleta local

```js
import { C, raj, orb } from "../components/admin/config/shared.jsx";
```

El componente no importa directamente `P` del sistema global; en cambio define su propia paleta local `P` mapeada desde `C`:

```js
const P = {
  bg0: C.bg,  bg1: C.side,  bg2: C.card,
  accent: C.orange,  gold: C.gold,
  navy: C.navy,  line: C.navy,
  text: C.white,  muted: C.muted,  mutedL: C.mutedL,
  blue: C.blue,  purple: C.purple,  success: C.green,  error: C.red,
};
const mono = (s, w = 600) => raj(s, w);   // alias para tipografía monoespaciada
```

Las fuentes se inyectan dinámicamente en el `<head>` con un guard `document.getElementById("fv7p-fonts")` para evitar duplicados.

### 1.3 Datos estáticos clave

```js
const LAST_UPDATED   = "30 de abril de 2026";
const EFFECTIVE_DATE = "30 de abril de 2026";
const RESPONSABLE = {
  nombre:     "ForgeVenture",
  tipo:       "Plataforma de entrenamiento gamificado",
  ruc:        "XXXXXXXXXXXXXXXXX",
  domicilio:  "Ecuador",
  email:      "legal@forgeventure.ec",
  emailDatos: "datos@forgeventure.ec",
};
```

### 1.4 Mapa de secciones (SECTIONS)

El array `SECTIONS` define las 17 secciones de la política. Cada objeto tiene `{ id, label }`. El `id` se usa como ancla HTML (`scrollMarginTop: 80`) para la navegación lateral:

| # | id | Título visible |
|---|---|---|
| 1 | `responsable` | Responsable del Tratamiento |
| 2 | `bases` | Fundamento Legal |
| 3 | `datos_rec` | Datos que Recopilamos |
| 4 | `finalidades` | Finalidades del Tratamiento |
| 5 | `base_legal` | Base Legal |
| 6 | `conservacion` | Plazos de Conservación |
| 7 | `destinatarios` | Destinatarios y Terceros |
| 8 | `transferencias` | Transferencias Internacionales |
| 9 | `derechos` | Derechos ARCO+P |
| 10 | `menores` | Menores de Edad |
| 11 | `seguridad` | Medidas de Seguridad |
| 12 | `cookies` | Cookies |
| 13 | `decisiones` | Decisiones Automatizadas |
| 14 | `brechas` | Notificación de Brechas |
| 15 | `cambios` | Modificaciones |
| 16 | `autoridad` | Autoridad de Control |
| 17 | `contacto` | Contacto ARCO |

### 1.5 Sub-componentes internos

#### `AmbientOrbs` (memo)
Fondo visual fijo que no re-renderiza. Contiene:
- **Base** — gradiente diagonal `160deg` de `C.bg` a `#080D18`.
- **Orbe azul** — parte superior derecha (5% top / 8% right), radio 680px, `C.blue` al 14% de opacidad, blur 90px.
- **Orbe naranja** — parte inferior izquierda (−5% bottom / 4% left), radio 600px, `C.orange` al 12%, blur 90px.
- **Orbe verde** — centro-izquierda (40% top / 35% left), radio 400px, `C.green` al 7%, blur 70px.
- **Grid** — patrón de líneas cada 56px con `maskImage` elíptico para que sólo sea visible en el centro.
- **Viñeta** — gradiente radial que oscurece los bordes hacia `C.bg`.

#### `ScrollProgress`
Barra de progreso de lectura de 2px de alto, posición `fixed` en la parte superior. Usa `useScroll()` de Framer Motion para obtener `scrollYProgress` (valor 0–1) y `useSpring()` con `{ stiffness: 100, damping: 30 }` para suavizar el movimiento. El degradado va de `C.blue → C.orange → C.gold`.

#### `Reveal`
Envuelve cualquier bloque en un `motion.div` con animación de entrada. Parámetros:
- `delay` (default 0) — retraso en segundos.
- `y` (default 22) — desplazamiento vertical inicial en px.

Usa `useInView(ref, { once: true, margin: "-60px" })` para activar la animación sólo cuando el elemento entra al viewport (con margen negativo para que ocurra un poco antes de llegar). La animación sólo ocurre **una vez** — `once: true`.

#### `Badge`
Pastilla de texto con borde redondeado completo. Acepta `color` y `children`. Usada para etiquetar secciones con indicadores como "✓ LOPDP Art. 4".

#### `SectionTitle`
Encabezado `h2` de cada sección legal. Muestra un prefijo `▸` en azul (`C.blue`) seguido del texto del título. Fuente Orbitron, tamaño 17px, peso 700.

#### `InfoBox`
Caja de información estilo callout con borde izquierdo de 3px en azul (`C.blue`), fondo `C.blue` al 5% de opacidad. Usada para destacar definiciones o aclaraciones importantes dentro de cada sección.

#### `RightBox`
Similar a `InfoBox` pero con borde izquierdo verde (`C.green`). Usada para los derechos positivos del usuario o confirmaciones de lo que SÍ hace la plataforma.

#### `BodyP`
Párrafo estándar de contenido legal. Tipografía Rajdhani 15px peso 400, color `P.muted`, interlineado 1.85.

#### `Li`
Ítem de lista con viñeta personalizada `▸` en color accent. Tipografía Rajdhani 14px.

#### `Table`
Tabla de datos legales con encabezado en `C.blue`/10% de opacidad y filas alternadas ligeramente oscuras. Utilizada para presentar las bases legales del tratamiento en formato columnar.

### 1.6 Componente principal `PrivacidadPage`

**Estado interno:**
```js
const [active, setActive] = useState(null);  // id de sección activa en sidebar
```

**Refs:** Un `ref` por cada sección (`useRef`), más `useRef` para el `IntersectionObserver` que detecta qué sección está visible.

**Navegación lateral (sidebar):**
- En desktop (≥ 1024px) se muestra un sidebar sticky a la izquierda con todos los `SECTIONS`.
- Cada entrada es un `<button>` que al hacer click llama a `section.ref.current.scrollIntoView({ behavior: "smooth" })`.
- El estado `active` se actualiza mediante un `IntersectionObserver` con `rootMargin: "-30% 0px -60% 0px"` que detecta qué sección está actualmente en el centro del viewport.
- La sección activa se resalta visualmente con borde izquierdo en `C.blue` y texto más brillante.

**Scroll ancla:** Cada `<section>` del contenido tiene `id={section.id}` y `style={{ scrollMarginTop: 80 }}` para que el scroll no quede tapado por la topbar sticky de 58px.

**Layout:** Grid de dos columnas — sidebar izquierdo de 240px fijo + área de contenido principal que ocupa el resto. En móvil el sidebar desaparece (sólo contenido lineal).

### 1.7 Flujo de lectura del usuario

1. El usuario llega a la página → aparece `ScrollProgress` en la parte superior y `AmbientOrbs` como fondo.
2. Cada sección entra con animación `Reveal` (fade + translateY) al hacer scroll.
3. El sidebar detecta automáticamente la sección visible y la resalta.
4. El usuario puede hacer click en cualquier entrada del sidebar para saltar directamente a esa sección.
5. La sección 17 (Contacto ARCO) incluye email clicable `datos@forgeventure.ec`.

---

## 2. TerminosPage.jsx

**Versión:** v2 · Design System v3  
**Ruta:** `frontend/src/pages/TerminosPage.jsx`  
**Última actualización:** 13 de abril de 2026

### 2.1 Propósito

Presenta los Términos y Condiciones de uso de ForgeVenture. Son el contrato legal entre la plataforma y el usuario, compuesto por 18 secciones que cubren condiciones de uso aceptable, propiedad intelectual, limitación de responsabilidad, datos personales, cookies, jurisdicción ecuatoriana y canal de contacto.

### 2.2 Relación con PrivacidadPage

`TerminosPage` comparte la **misma arquitectura** que `PrivacidadPage`:
- Mismas importaciones: `{ C, raj, orb }` de `shared.jsx`, Framer Motion, React Router.
- Misma paleta local `P` mapeada desde `C`.
- Mismo alias `mono = (s,w) => raj(s,w)`.
- Mismos sub-componentes `AmbientOrbs`, `ScrollProgress`, `Reveal`, `Badge`, `SectionTitle`, `InfoBox`, `RightBox`, `BodyP`, `Li`, `Table`.
- Mismo layout con sidebar lateral sticky + grid de dos columnas.
- Mismo `IntersectionObserver` para detectar sección activa.

La diferencia principal está en los **colores de los orbes** y el **gradiente de ScrollProgress**:

| Elemento | PrivacidadPage | TerminosPage |
|---|---|---|
| Orbe top | azul (top-right) | naranja (top-left) |
| Orbe bottom | naranja (bottom-left) | púrpura (bottom-right) |
| Orbe centro | verde (centro) | azul (centro-derecha) |
| ScrollProgress | azul → naranja → gold | naranja → gold → azul |
| Font inject ID | `fv7p-fonts` | `fv7t-fonts` |

### 2.3 Sub-componentes exclusivos de TerminosPage

#### `LegalBadge`
Variante de `Badge` específica para destacar referencias normativas. Presenta el texto en azul con fondo traslúcido, borde sutil.

#### `LawRef`
Span de estilo código que referencia artículos legales específicos (ej: "Art. 4 LOPDP"). Se muestra con tipografía monoespaciada, color azul, borde inferior punteado para indicar que es una cita normativa.

#### `SubTitle`
Subtítulo `h3` para subsecciones dentro de una sección principal. Fuente Orbitron, 13px, peso 700, color gold, texto en mayúsculas con `letterSpacing: "0.1em"`. Usado para dividir secciones largas en subsecciones (ej: dentro de "Condiciones de Uso Aceptable" hay subsecciones para conductas permitidas y prohibidas).

#### `UL`
Lista no ordenada con espaciado interno uniforme. Cada `<li>` usa el componente `Li` de viñeta `▸`.

### 2.4 Mapa de secciones (18 secciones)

| # | id | Título visible |
|---|---|---|
| 1 | `objeto` | Objeto y Naturaleza |
| 2 | `partes` | Identificación de las Partes |
| 3 | `edad` | Edad Mínima y Capacidad Legal |
| 4 | `cuenta` | Creación y Gestión de Cuenta |
| 5 | `uso` | Condiciones de Uso Aceptable |
| 6 | `privacidad` | Privacidad y Protección de Datos |
| 7 | `datos_rec` | Datos Personales Recopilados |
| 8 | `finalidad` | Finalidades del Tratamiento |
| 9 | `derechos` | Derechos ARCO+P |
| 10 | `terceros` | Transferencias a Terceros |
| 11 | `cookies` | Cookies y Tecnologías |
| 12 | `propiedad` | Propiedad Intelectual |
| 13 | `responsab` | Limitación de Responsabilidad |
| 14 | `suspension` | Suspensión y Eliminación |
| 15 | `menores` | Protección de Menores |
| 16 | `modif` | Modificaciones |
| 17 | `jurisd` | Ley Aplicable y Jurisdicción (Ecuador) |
| 18 | `contacto` | Contacto y Canal ARCO |

### 2.5 Datos estáticos

```js
const LAST_UPDATED   = "13 de abril de 2026";
const EFFECTIVE_DATE = "13 de abril de 2026";
const RESPONSABLE = {
  nombre:     "ForgeVenture",
  tipo:       "Plataforma de entrenamiento gamificado",
  ruc:        "XXXXXXXXXXXXXXXXX",      // pendiente RUC real
  domicilio:  "Ecuador",
  email:      "legal@forgeventure.ec",
  emailDatos: "datos@forgeventure.ec",
};
```

---

## 3. RegisterPage.jsx

**Versión:** v7 · Design System v3  
**Ruta:** `frontend/src/pages/RegisterPage.jsx`  
**Props de entrada:** `{ onGoLogin, onGoBack, onSuccess, googleData }`

### 3.1 Propósito

Wizard de registro de 2 pasos que permite al usuario crear una cuenta en ForgeVenture ya sea con email/contraseña o mediante Google OAuth. Incluye selección de clase RPG, persistencia de borrador en localStorage, validación en tiempo real de nombre de héroe, boot sequence temática y soporte para flujo pre-seleccionado de clase desde la home.

### 3.2 Importaciones clave

```js
// Firebase Auth
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from "firebase/auth";

// API interna
import { registerProfile, checkUsername } from "../services/api";

// Validación de contenido
import { validateClean } from "../services/profanityFilter";

// Sistema de diseño
import { CLASSES, C, raj, orb, px, mono } from "../components/admin/config/shared.jsx";
import { AuthPortalLoader } from "../components/auth/AuthPortalLoader.jsx";
```

### 3.3 Constantes y datos estáticos

#### Claves de almacenamiento
```js
const REGISTER_DRAFT_KEY  = "fv_register_draft_v1";   // localStorage — borrador del formulario
const BOOTED_KEY          = "fv_booted";               // sessionStorage — boot sequence ya corrió
const SELECTED_CLASS_KEY  = "fv_selectedClass";        // sessionStorage — clase elegida desde Home
```

#### Paleta visual por clase
```js
const CLASS_DISPLAY = [
  { color: "#ff4d5e", glow: "rgba(255,77,94,0.28)",  tier: "S" },  // Guerrero — rojo
  { color: "#7bdc3b", glow: "rgba(123,220,59,0.28)", tier: "A" },  // Arquero  — verde
  { color: "#4cc9f0", glow: "rgba(76,201,240,0.28)", tier: "A" },  // Mago     — azul
];
```

#### Media por clase (`REGISTER_CLASS_MEDIA`)
Cada clase tiene asociado un objeto con:
- `crest` — imagen del escudo/emblema (PNG de /public/ui/).
- `hero` — imagen del personaje en pose idle.
- `floor` / `zone` — imagen del suelo y zona de la clase.
- `route` / `routeCopy` — imagen de ruta y texto descriptivo de la misma.
- `bullets` — array de 3 strings con ventajas de la clase.

#### Valores adicionales
- `REGISTER_NEUTRAL_MEDIA` — media por defecto antes de seleccionar clase (paso 1).
- `REGISTER_VALUE_STRIPS` — 3 proposiciones de valor: "Entrada limpia", "Bonos visibles", "Progreso que continúa".
- `REGISTER_REWARD_PREVIEW` — 3 recompensas al registrarse: XP scroll, gem cache, cofre del contrato.
- `REGISTER_CLASS_GUIDANCE` — string de orientación por clase mostrado durante la selección.
- `HOME_PUBLIC_COLORS` — colores por clase: warrior `#ff4d5e`, archer `#7bdc3b`, mage `#4cc9f0`.

#### Sprites animados
Los sprites son hojas de 8 fotogramas animados mediante `setInterval` a 8 FPS:

**`IDLE_FRAMES`** (neutral, paso 1):
```js
["/avatar/idle/idle_01.png", ..., "/avatar/idle/idle_08.png"]
```

**`CLASS_FOLDERS_R`**:
```js
["home_guerrero", "home_arquero", "home_mago"]
```

**`CLASS_FRAMES_R`**: 8 fotogramas por clase con ruta `/{folder}/home_idle_{key}_0X.png`. La `key` es el nombre corto de la clase en minúsculas.

#### Sub-componentes de sprite

**`SpriteIdle`**: sprite genérico del avatar neutral. Pre-carga todos los fotogramas en el primer render. Cicla entre los 8 fotogramas cada 125ms (8 FPS). Muestra el fotograma actual con un `<img>` con `imageRendering: "pixelated"`.

**`ClassSprite`**: sprite específico de la clase seleccionada. Acepta `classIndex`. Cuando `classIndex` cambia (el usuario cambia de clase), resetea el fotograma a 0 para que el ciclo empiece limpio desde el principio.

### 3.4 Estado del componente

```js
// Datos del formulario
const [username,      setUsername]      = useState(/* desde draft o googleProfile */);
const [email,         setEmail]         = useState(/* desde draft o googleProfile */);
const [password,      setPassword]      = useState("");
const [confirmPwd,    setConfirmPwd]    = useState("");
const [classIdx,      setClassIdx]      = useState(/* desde draft o sessionStorage, default 0 */);

// Control de formulario
const [errors,         setErrors]       = useState({});
const [touched,        setTouched]      = useState({});
const [tosAccepted,    setTosAccepted]  = useState(/* desde draft */);
const [rememberMe,     setRememberMe]   = useState(/* desde draft, default true */);
const [classConfirmed, setClassConfirmed] = useState(/* desde draft o sessionStorage */);

// Auth
const [googleProfile, setGoogleProfile] = useState(/* desde prop googleData o draft */);

// UI
const [step,          setStep]          = useState(/* 1 o 2 según draft/googleProfile */);
const [loaded,        setLoaded]        = useState(/* true si boot ya corrió */);
const [loading,       setLoading]       = useState(false);      // submit email
const [loadingGoogle, setLoadingGoogle] = useState(false);      // submit Google
const [successState,  setSuccessState]  = useState(null);       // post-registro
const [shaking,       setShaking]       = useState(false);      // animación de error

// Username availability
const [usernameStatus, setUsernameStatus] = useState("idle");   // idle|checking|available|taken
const usernameDebounce             = useRef(null);
const usernameAvailabilityCache    = useRef(new Map());         // caché en memoria
```

### 3.5 Boot sequence

Al montar, si `sessionStorage["fv_booted"]` no vale `"1"`, se muestra `<AuthPortalLoader>` con las líneas:
```
> PREPARANDO EL ALTAR DE REGISTRO
> ABRIENDO EL LIBRO DE CLASES
> RESERVANDO TU SELLO DE HÉROE
> MARCANDO LA RUTA INICIAL
> TODO LISTO PARA FORJAR TU CUENTA
```

Cuando termina, se escribe `"1"` en `sessionStorage["fv_booted"]` y se activa `loaded = true`, revelando el formulario. Si la bandera ya existe (`skipBoot = true`), el `AuthPortalLoader` no se monta y el formulario aparece directamente.

### 3.6 Persistencia de borrador

Un `useEffect` con debounce de 180ms escucha cambios en `username`, `email`, `step`, `tosAccepted`, `classIdx`, `classConfirmed`, `rememberMe`, `fromGoogle`, `googleProfile` y guarda el estado en `localStorage["fv_register_draft_v1"]` como JSON. Al montar, `readRegisterDraft()` lo recupera.

Al completar el registro con éxito, `clearRegisterDraft()` y `removeSession(SELECTED_CLASS_KEY)` limpian el almacenamiento.

### 3.7 Flujo de pasos

#### Paso 1 — Cuenta

Campos visibles:
- **Nombre de héroe** (username) — con validación en tiempo real + verificación de disponibilidad.
- **Correo electrónico** — con validación de formato.
- **Contraseña** — mínimo 6 caracteres.
- **Confirmar contraseña** — debe coincidir con contraseña.
- **Aceptar Términos** — checkbox obligatorio (sólo para flujo email, no Google).
- **Recordarme** — toggle que elige entre `browserLocalPersistence` o `browserSessionPersistence`.
- **Botón Google** — alternativa para saltar al paso 2 directamente.

#### Paso 2 — Clase

Permite elegir entre las 3 clases:
- **Guerrero** (rojo S-tier) — foco en fuerza e intensidad.
- **Arquero** (verde A-tier) — foco en resistencia y cardio.
- **Mago** (azul A-tier) — foco en movilidad y técnica.

El panel lateral izquierdo muestra la imagen de clase (crest, hero, floor, zone, route) según la clase seleccionada. El panel derecho presenta el formulario de confirmación. El usuario debe marcar `classConfirmed = true` al confirmar su elección.

### 3.8 Validación de campos (`validateField`)

```js
validateField("username") →
  - Vacío → "El nombre de héroe es obligatorio"
  - < 3 chars → "Mínimo 3 caracteres"
  - > 20 chars → "Máximo 20 caracteres"
  - No cumple /^[A-Za-z0-9_]+$/ → "Solo letras, números y _ (sin espacios)"
  - Lenguaje inapropiado → mensaje de profanityFilter

validateField("email") →
  - Vacío → "El correo es obligatorio"
  - No cumple /\S+@\S+\.\S+/ → "Correo inválido"

validateField("password") →
  - Vacío → "La contraseña es obligatoria"
  - < 6 chars → "Mínimo 6 caracteres"

validateField("confirmPwd") →
  - Vacío → "Confirma tu contraseña"
  - Diferente a password → "Las contraseñas no coinciden"
```

### 3.9 Verificación de disponibilidad de username

```js
verifyUsernameAvailability(rawUsername):
  1. Cancela el timer de debounce anterior.
  2. Consulta el caché en memoria (Map).
  3. Si hay resultado en caché: aplica directamente, no llama a la API.
  4. Si no: setUsernameStatus("checking") → llama checkUsername(trimmed).
  5. Guarda resultado en caché.
  6. setUsernameStatus("available" | "taken").
  7. Si "taken": setErrors({ username: "Este nombre de heroe ya esta en uso" }).
```

El debounce en `handleUsernameChange` es de **600ms** desde el último keystroke. Esto evita llamadas a la API en cada letra.

El `UsernameBadge` renderiza un spinner CSS cuando `"checking"`, un `✓ Disponible` verde cuando `"available"`, o nada cuando `"taken"` (el error de campo ya lo cubre).

### 3.10 `handleNext` — avanzar al paso 2

```
1. Valida los 4 campos del paso 1 simultáneamente.
2. Si username es válido localmente pero usernameStatus ≠ "available":
   llama verifyUsernameAvailability() de forma síncrona (await).
3. Si no hay Google y !tosAccepted: agrega error "tos".
4. Si hay cualquier error: marca todos como touched, activa shake, no avanza.
5. Si no hay errores: setStep(2).
```

### 3.11 `handleSubmit` — crear cuenta (paso 2)

```
1. Si !classConfirmed: error "Elige una clase antes de continuar".
2. Flujo Google:
   - Si auth.currentUser existe y username cambió: updateProfile(displayName).
   - registerProfile(uid, username, email, className) en backend.
3. Flujo email:
   - setPersistence(auth, browserLocal | browserSession) según rememberMe.
   - createUserWithEmailAndPassword(auth, email, password).
   - sendEmailVerification(cred.user) — correo automático.
   - updateProfile(cred.user, { displayName: username }).
   - registerProfile(uid, username, email, className) en backend.
4. En ambos casos: limpia draft y selectedClass de storage.
5. setSuccessState({ verificationPending, contactEmail, authSource }).
6. Si error Firebase: mapea el código con firebaseError() y decide si retrocede al paso 1.
```

**Códigos Firebase que retroceden al paso 1:**
- `auth/email-already-in-use`
- `auth/invalid-email`
- `auth/weak-password`

### 3.12 `handleGoogle` — OAuth con popup

```
1. Limpia errores, setLoadingGoogle(true).
2. signInWithPopup(auth, googleProvider).
3. Extrae uid, email, displayName.
4. Llama continueRegisterWithGoogle() que:
   - Arma el perfil { uid, email, username, fromGoogle: true }.
   - setGoogleProfile(profile).
   - setUsername(profile.username).
   - setEmail(profile.email).
   - setStep(2) — salta directamente al paso de clase.
   - Limpia errors y touched.
```

### 3.13 Estado de éxito (`successState`)

Cuando `successState` no es null, el wizard deja de mostrarse y aparece la pantalla de confirmación. Muestra:
- Si `verificationPending: true`: "Revisa tu correo para verificar tu cuenta en {email}".
- Si Google (`authSource: "google"`): "Acceso validado con Google — listo para entrar".
- Botón que llama a `onSuccess()` para que el `AuthRouter` redirigija al usuario a su home.

### 3.14 Acento dinámico (`getRegisterAccent`)

```js
function getRegisterAccent(step, classIdx) {
  if (step === 2) return CLASS_DISPLAY[classIdx]?.color ?? P.accent;
  return P.accent;  // naranja neutro en paso 1
}
```

El color de acento impregna todo el formulario del paso 2: bordes de inputs, glow de botones, título de panel lateral.

### 3.15 Contexto de entrada (`entryContextPills`)

Pills informativas que adaptan su texto según el estado:
```js
[
  fromGoogle ? "Google activo" : "Alta por correo",
  fromHome   ? "Llegas con clase sugerida" : "Elección abierta",
]
```

`fromHome` es `true` si `sessionStorage["fv_selectedClass"]` existe — significa que el usuario vino de la Home después de hacer click en un botón de clase específica.

### 3.16 Fondo visual

El componente usa `<AuroraBackground />` del sistema de diseño compartido (importado desde `design/AuroraBackground.jsx`), que genera el fondo animado de partículas y gradientes aurora del sistema.

---

## 4. SupportPage.jsx

**Versión:** v7 (multiversión acumulativa con marcadores B1–B5, I1–I5, V1–V7)  
**Ruta:** `frontend/src/pages/SupportPage.jsx`

### 4.1 Propósito

Centro de soporte y comunicación bidireccional de la plataforma. Integra 4 secciones principales: FAQ interactivo con búsqueda, canales de contacto, panel de estado del sistema con estadísticas en tiempo real, y sistema de feedback con formulario de envío, historial personal en vivo (Firestore `onSnapshot`) y muro de testimonios públicos.

### 4.2 Paleta propia (`T`)

SupportPage es la única página del sistema que **no usa** directamente la paleta `C` ni `P` del Design System. Define su propio tema `T`:

```js
const T = {
  bg:       "#060D1A",    // fondo profundo casi negro
  navy:     "#0D1B2A",    // separadores y líneas
  orange:   "#E85D04",    // acento primario — alerta/acción
  gold:     "#FFD166",    // rating, destacados
  blue:     "#4CC9F0",    // secondary accent
  teal:     "#2EC4B6",    // notas de admin, elementos terciarios
  green:    "#06D6A0",    // estado positivo / resuelto
  muted:    "#8892A4",    // texto secundario
  white:    "#F0F4FF",    // texto principal
};
```

**Helpers de tipografía:**
```js
raj(size, weight)  // Rajdhani — texto general, descripciones
orb(size)          // Orbitron — títulos, cabeceras
px(size)           // Press Start 2P — identidad de marca, pixel art
```

### 4.3 Constantes de configuración

#### `CLASS_COLOR` — colores por clase para testimonios
```js
{ GUERRERO: T.orange, MAGO: "#9B59B6", ARQUERO: T.green }
```

#### `CLASS_ICON` — emoji por clase
```js
{ GUERRERO: "⚔️", MAGO: "🔮", ARQUERO: "🏹" }
```

#### `STATUS_CFG` — configuración visual de estado de reporte
| Estado | Dot | Color | Label |
|---|---|---|---|
| `pending` | 🟡 | gold | Pendiente |
| `read` | 🔵 | blue | Leído |
| `resolved` | 🟢 | green | Resuelto |

Cada estado tiene `{ dot, color, bg, border, label }` para renderizar el badge.

#### `TYPE_PLACEHOLDERS` — hints del textarea según tipo de feedback
```js
{
  bug:        "Describe el error: ¿qué pasó?, ¿qué esperabas?, ¿en qué pantalla?",
  suggestion: "¿Qué mejorarías o añadirías? Cuéntanos tu idea.",
  complaint:  "Cuéntanos qué no funcionó como esperabas.",
  praise:     "¡Comparte lo que te gustó! Ayuda a otros a saber qué esperar.",
  other:      "Comparte lo que quieras hacernos saber.",
}
```

#### `CHANNELS` — 5 canales de contacto
| Canal | Tipo | Badge | Color |
|---|---|---|---|
| Discord | RECOMENDADO | `🎮 Discord` | `#5865F2` |
| Email | FORMAL | `📧 Email` | `T.blue` |
| WhatsApp | DIRECTO | `💬 WhatsApp` | `#25D366` |
| Instagram | SOCIAL | `📸 Instagram` | `#E1306C` |
| YouTube | TUTORIALES | `📺 YouTube` | `#FF0000` |

Cada canal tiene: `href` (link real), `copyValue` (texto a copiar al portapapeles), `handle`, `desc`, `icon`, `badge`, `color`.

#### `FAQ` — 8 preguntas frecuentes
| # | Icono | Tema |
|---|---|---|
| 1 | 🗺️ | ¿Cómo empezar? |
| 2 | 📷 | ¿La app requiere cámara? |
| 3 | ⭐ | ¿Cómo gano XP? |
| 4 | 🏋️ | ¿Puedo usarla sin cámara? |
| 5 | 🚨 | ¿Cómo reporto un bug? |
| 6 | 🌐 | Navegadores compatibles |
| 7 | 🔒 | Privacidad de datos |
| 8 | 💎 | ¿Es gratuita? |

#### `QUICK_TIPS` — 4 tips rápidos
Tips de solución rápida para problemas comunes (cámara, permisos, caché, conexión).

#### `NAV_ITEMS` — mini navegación sticky
```js
[
  { id:"faq",      icon:"❓", label:"FAQ"      },
  { id:"canales",  icon:"📡", label:"Canales"  },
  { id:"estado",   icon:"📊", label:"Estado"   },
  { id:"feedback", icon:"✉️", label:"Enviar"   },
]
```

### 4.4 Hook personalizado: `useCountUp`

```js
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === null || target === undefined) return;
    let start    = null;
    const from   = 0;
    const to     = target;
    const step   = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);  // cubic ease-out
      setValue(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}
```

Anima cualquier número desde 0 hasta `target` a lo largo de `duration` ms usando easing cúbico (`1 - (1-p)³`), el cual es suave al inicio y desacelera al final. Usa `requestAnimationFrame` para sincronizarse con el refresco de pantalla. Se reinicia automáticamente si `target` cambia.

### 4.5 Sub-componentes

#### `Highlight`
Resalta en naranja la subcadena que coincide con el término de búsqueda del FAQ. Convierte el texto a minúsculas para buscar sin case-sensitivity, pero preserva el texto original al renderizar.

#### `StarDisplay`
Muestra estrellas parciales (para rating promedio). Para cada posición `n` calcula `fill = clamp(rating - (n-1), 0, 1)`. Renderiza la estrella base en gris (`T.navy`) y una superposición naranja/dorada con `width: fill*100%` y `overflow: hidden`.

#### `FaqItem`
Ítem de acordeón FAQ. Acepta `isOpen`, `onToggle`, `searchTerm`. Al hacer click en el botón, llama `onToggle`. La respuesta (`sp-faq-answer`) se expande con transición CSS max-height. El ícono del ítem tiene un glow cuando está abierto.

#### `ChannelCard`
Tarjeta de canal de contacto. Al hacer hover cambia el borde y shadow al color del canal. El botón "Copiar" llama a `navigator.clipboard.writeText(c.copyValue)` y muestra toast de confirmación. Al hacer click en la tarjeta navega a `c.href` en nueva pestaña.

#### `SectionHeader`
Cabecera de cada sección principal con pill, diamond decorativo y líneas a los lados.

#### `TestimonialCard`
Tarjeta de testimonio público. Muestra: rating en estrellas, mensaje (truncado a 180 chars), clase del héroe (con color de `CLASS_COLOR`), nivel y tiempo relativo (`timeAgo()`). En hover cambia borde y resalta el nombre de clase.

#### `HistoryItem`
Ítem del historial personal de feedbacks. Clickable para expandir/colapsar el mensaje completo. Muestra badge de estado con `STATUS_CFG`, emoji de tipo, preview del asunto o primeros 60 chars del mensaje, rating en estrellas y tiempo relativo. Si el reporte tiene `adminNote`, se muestra en un callout especial con borde izquierdo en teal.

#### `FeedbackForm`
Formulario de envío de feedback. Componente separado que recibe `user` (Firebase user) y `myFeedback` (historial para detectar límite de 24h).

**Estado interno del formulario:**
```js
const [type,        setType]    = useState("suggestion");
const [rating,      setRating]  = useState(0);
const [hoverRating, setHover]   = useState(0);
const [burstStar,   setBurst]   = useState(0);    // V4: efecto burst al marcar estrella
const [subject,     setSubject] = useState("");
const [message,     setMessage] = useState("");
const [sending,     setSending] = useState(false);
const [sent,        setSent]    = useState(false);
const [sentRating,  setSentRating] = useState(0); // recordar rating para compartir
const [error,       setError]   = useState("");
```

**Límite de frecuencia (B4):**
```js
const recentSub = myFeedback?.find(f => Date.now() - f.createdAt < 24 * 3600 * 1000);
```
Si hay un envío en las últimas 24h, el botón de envío queda deshabilitado y se muestra cuántas horas quedan.

**Validaciones antes de enviar:**
1. Si `recentSub` → error con horas restantes.
2. Si `message.trim().length < 10` → "El mensaje debe tener al menos 10 caracteres."
3. Si `!rating` → "Por favor selecciona una calificación."
4. `validateClean(subject)` + `validateClean(message)` — filtro de lenguaje inapropiado.

**`handleSubmit`:**
```js
const token = await user.getIdToken();
await submitFeedback(token, { type, rating, subject, message });
```
Llama a la función `submitFeedback` del API con el token Firebase del usuario. En caso de éxito: `setSent(true)`.

**V4 — Star burst:** Al hacer click en una estrella, `burstStar` se activa durante 450ms, disparando la animación CSS `sp-star-pop` (escala y opacidad) en la estrella clickada.

**V5 — Counter colors:** Los contadores de caracteres cambian de color:
- Verde muted → normal.
- Gold → ≥ 80% de capacidad.
- Rojo → ≥ 95% de capacidad (más glow).

**I4 — Pantalla post-envío con compartir:** Tras el envío exitoso, aparece una pantalla de éxito que genera links de compartir para Twitter/X y WhatsApp con el texto:
```
¡Acabo de dar {sentRating}⭐ a ForgeVenture! ⚔️🏆
La mejor app de fitness gamificada, completamente gratis.
#ForgeVenture #Fitness #Gaming
```

### 4.6 Componente principal `SupportPage`

#### Estado principal

```js
const [firebaseUser, setFirebaseUser] = useState(null);  // usuario autenticado
const [publicStats,  setPublicStats]  = useState(null);  // estadísticas del sistema
const [loadingStats, setLoadingStats] = useState(true);
const [testimonials, setTestimonials] = useState([]);    // testimonios públicos
const [myFeedback,   setMyFeedback]   = useState([]);    // reportes propios (onSnapshot)
const [loadingHistory, setLoadingHistory] = useState(false);
const [openFaqSet,   setOpenFaqSet]   = useState(new Set());  // V7: FAQs abiertos
const [faqSearch,    setFaqSearch]    = useState("");         // I2: búsqueda FAQ
const [feedbackTab,  setFeedbackTab]  = useState("send");     // V2: tab activa
const [activeSection, setActiveSection] = useState(null);     // I5: sección visible
const [showMiniNav,  setShowMiniNav]  = useState(false);      // I5: mini nav visible
```

#### Effects y lógica reactiva

**Auth listener** (useEffect):
```js
const unsub = onAuthStateChanged(auth, u => setFirebaseUser(u));
return unsub;
```
Detecta cambios de sesión en tiempo real. Si el usuario cierra sesión, se limpia `myFeedback`.

**Estadísticas públicas** (useEffect, una sola vez):
```js
getPublicFeedbackStats()
  .then(d => setPublicStats(d))
  .catch(() => setPublicStats(null))
  .finally(() => setLoadingStats(false));
```
Llama al endpoint público que devuelve `{ avgRating, totalResolved, avgResponseHours }`. Los valores se animan con `useCountUp`.

**Testimonios públicos** (useEffect, una sola vez):
```js
getPublicTestimonials().then(d => setTestimonials(d.items || []));
```

**Historial personal con Firestore onSnapshot** (useEffect, se activa cuando cambia `firebaseUser`):
```js
const q = query(collection(db, "feedback"), where("uid", "==", firebaseUser.uid));
const unsub = onSnapshot(q, (snap) => {
  // Mapea documentos a items ordenados por createdAt desc
  // B5: detecta cambios de status y lanza toast.info()
  // prevStatuses guarda estado anterior para comparar
  setMyFeedback(items);
  setLoadingHistory(false);
});
return () => unsub();
```
Esta suscripción es en tiempo real: si un administrador cambia el estado de un reporte, el usuario ve el cambio al instante y recibe un toast. El flag `isFirstSnap` evita que se lancen toasts en la carga inicial.

**Animación de estadísticas** (useCountUp):
```js
const animRating   = useCountUp(rawRating,   1500);  // rating promedio
const animResolved = useCountUp(rawResolved, 1200);  // total resueltos
const animHours    = useCountUp(rawHours,    1000);  // horas promedio de respuesta
```

#### I5 — Mini nav y detección de sección activa

Se usan 5 refs: `heroRef`, `faqRef`, `canalesRef`, `estadoRef`, `feedbackRef`.

Dos `IntersectionObserver`:
1. **heroObs** — observa el bloque hero. Cuando sale del viewport: `setShowMiniNav(true)` (aparece mini nav sticky). Cuando vuelve al viewport: `setShowMiniNav(false)`.
2. **sectionObs** — con `rootMargin: "-35% 0px -55% 0px"` — detecta qué sección está en la franja central del viewport y actualiza `activeSection`.

La mini nav (`sp-mini-nav`) añade la clase `hidden` cuando `!showMiniNav`, que aplica `transform: translateY(-110%)` para ocultarla fuera del viewport.

#### V2 — Tabs con pill deslizante

```js
const TABS = [
  { id:"send",      label:"✈ Enviar",       show:true },
  { id:"history",   label:"📋 Mi historial", show:!!firebaseUser },
  { id:"comunidad", label:"💬 Comunidad",    show:true },
];
```

La tab "Mi historial" sólo aparece si el usuario está autenticado. La posición del pill deslizante se calcula en `useLayoutEffect` midiendo el `offsetLeft` y `offsetWidth` del botón activo con `tabsRef`.

#### FAQ con búsqueda (I2)

```js
const filteredFaq = FAQ
  .map((item, i) => ({ ...item, originalIndex: i }))
  .filter(item =>
    !faqSearch.trim() ||
    item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );
```

Filtra tanto en la pregunta como en la respuesta. El componente `FaqItem` usa `<Highlight>` para resaltar el término buscado dentro del texto de cada resultado.

### 4.7 Estructura visual de la página

```
SupportPage
├── <style> CSS inyectado (animaciones, clases sp-*)
├── Ambient orbs (3 orbes: naranja, azul, teal + grid + scan line)
├── <FloatingHelpButton> — botón flotante a Discord
├── Topbar sticky
│   ├── Botón "← Volver"
│   ├── Logo FORGE VENTURE (pixel font)
│   └── Indicador Online (punto verde pulsante)
├── Mini nav sticky (I5) — aparece al hacer scroll
│   └── Botones: FAQ | Canales | Estado | Enviar
├── Contenido (maxWidth 1100, padding 5%)
│   ├── HERO — título, subtítulo, pill "CENTRO DE SOPORTE"
│   ├── Estadísticas animadas — 3 métricas del sistema
│   ├── FAQ (ref faqRef)
│   │   ├── Búsqueda con input
│   │   ├── Progress bar de FAQs completados (V7)
│   │   └── Lista de FaqItems (acordeón controlado)
│   ├── CANALES (ref canalesRef)
│   │   └── Grid de 5 ChannelCards
│   ├── QUICK TIPS — 4 cards de tips rápidos
│   ├── ESTADO DEL SISTEMA (ref estadoRef)
│   │   ├── 3 stats animadas (avgRating, totalResolved, avgResponseHours)
│   │   └── StarDisplay del rating promedio
│   └── FEEDBACK (ref feedbackRef)
│       ├── Tabs con pill (Enviar | Mi historial* | Comunidad)
│       ├── Tab "send" → FeedbackForm
│       ├── Tab "history" → lista de HistoryItems (onSnapshot)
│       └── Tab "comunidad" → grid de TestimonialCards
└── <FloatingHelpButton> repetido (fixed)
```

### 4.8 CSS interno notable

Las clases se definen como template literal inyectado en `<style>`:

| Clase | Descripción |
|---|---|
| `sp-page` | Animación de entrada: `sp-pageIn` (0.5s fade) |
| `sp-scan` | Línea de scanline que baja lentamente por la pantalla |
| `sp-glass` | Glassmorphism: `backdrop-filter: blur(16px)`, fondo semitransparente, borde sutil |
| `sp-card` | Hover: `translateY(-6px)` + `scale(1.01)` con shine sweep interno |
| `sp-pill` | Badge redondeado con colores de variante (naranja, azul, verde, muted, gold) |
| `sp-mini-nav` | Barra sticky top con transición smooth y clase `hidden` para ocultar |
| `sp-faq-item` | Ítem FAQ con border-bottom y padding |
| `sp-faq-btn` | Botón de toggle FAQ — flex, sin borde nativo |
| `sp-faq-answer` | Panel respuesta con max-height: 0 → 500px y overflow:hidden |
| `sp-faq-chevron` | Triángulo que rota 90° con `.open` |
| `sp-star` | Estrella de rating con hover scale y glow |
| `sp-hist-item` | Ítem de historial con border-bottom animado |
| `sp-status-badge` | Badge inline de estado (pending/read/resolved) |
| `sp-fb-input` | Input del formulario con focus border + glow en naranja |
| `sp-fb-btn` | Botón de envío con hover translateY y sombra naranja |
| `sp-float-btn` | Botón Discord flotante que se expande con label al hover |

**Animaciones CSS definidas:**

| Keyframe | Efecto |
|---|---|
| `sp-scan` | Línea que baja de 0% a 100% de la pantalla (20s loop) |
| `sp-blink` | Parpadeo suave (opacity 0.4 → 1, 1.2s loop) |
| `sp-success` | Aparición de pantalla éxito (fadeIn + translateY) |
| `sp-spin` | Rotación 360° (spinner de carga) |
| `sp-orbDrift` | Orbes: traslación lenta en X e Y con scale suave |
| `sp-cardIn` | Tarjeta: opacity 0→1 + Y 24px→0 |
| `sp-shimmer` | Efecto shimmer para skeletons de carga |
| `sp-star-pop` | Burst de estrella: scale 1→1.5→1 + drop-shadow |
| `sp-ring-out` | Ring expansivo desde el punto central |
| `sp-copy-flash` | Flash verde en botón de copiar |

---

## Resumen comparativo de las 4 páginas

| Aspecto | PrivacidadPage | TerminosPage | RegisterPage | SupportPage |
|---|---|---|---|---|
| Tipo | Legal (estática) | Legal (estática) | Auth (interactiva) | Soporte (interactiva) |
| Versión | v2 | v2 | v7 | v7 |
| Paleta | `P` mapeada de `C` | `P` mapeada de `C` | `P` mapeada de `C` | `T` propia independiente |
| Fondo | AmbientOrbs memo | AmbientOrbs memo | AuroraBackground | Orbes CSS + scanline |
| Framer Motion | ✓ ScrollProgress, Reveal | ✓ ScrollProgress, Reveal | ✓ AnimatePresence | ✗ (CSS puro) |
| Firebase | ✗ | ✗ | Auth + Firestore (registerProfile) | Auth + Firestore (onSnapshot) |
| API calls | ✗ | ✗ | checkUsername, registerProfile | submitFeedback, getPublicFeedbackStats, getPublicTestimonials |
| Persistencia | ✗ | ✗ | localStorage + sessionStorage | ✗ |
| Tiempo real | ✗ | ✗ | username debounce 600ms | onSnapshot Firestore |
| Wizard | ✗ | ✗ | 2 pasos (cuenta → clase) | ✗ |
| Secciones | 17 | 18 | 2 pasos | 4 secciones (FAQ/Canales/Estado/Feedback) |
| Sidebar | ✓ sticky | ✓ sticky | ✗ | Mini nav sticky (IntersectionObserver) |
| Sprite animado | ✗ | ✗ | ✓ (8 FPS, setInterval) | ✗ |
| profanityFilter | ✗ | ✗ | ✓ username | ✓ subject + message |
| Tabs | ✗ | ✗ | ✗ | ✓ 3 tabs con pill deslizante |
| Toast | ✗ | ✗ | ✗ | ✓ sonner (copy, status change) |
| Google OAuth | ✗ | ✗ | ✓ | ✗ |

---

*Documentación generada para tesis — ForgeVenture 2026*
