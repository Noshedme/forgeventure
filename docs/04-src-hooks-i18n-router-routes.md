# Carpeta `frontend/src/` — Parte 2: hooks, i18n, router, routes

---

## 1. `src/hooks/`

Los **custom hooks** de React encapsulan lógica reutilizable que múltiples componentes necesitan. En lugar de copiar la misma lógica en cada componente, se extrae a un hook y se importa donde se necesite.

```
src/hooks/
├── useAutoRefresh.js    → re-exporta desde ui.jsx (compatibilidad)
├── useIsMobile.js       → detecta si el viewport es móvil o tablet
├── useLang.js           → hook reactivo del sistema de idiomas
└── useThemeColors.js    → hook reactivo del sistema de temas visuales
```

---

### `useAutoRefresh.js` — Re-exportación de compatibilidad

```js
export { useAutoRefresh } from "../components/shared/ui.jsx";
```

Archivo de **3 líneas** que simplemente re-exporta `useAutoRefresh` desde `components/shared/ui.jsx`. Existe para mantener compatibilidad con componentes que lo importan desde `hooks/` en lugar de desde `shared/ui.jsx`. No contiene lógica propia.

**`useAutoRefresh` (definido en `ui.jsx`):** Hook que ejecuta una función de recarga cada N segundos. Se usa en páginas como el ranking o el dashboard para mantener los datos frescos sin que el usuario tenga que recargar la página manualmente.

---

### `useIsMobile.js` — Detector de viewport reactivo

Detecta si el ancho de la ventana está por debajo de un breakpoint dado y **se actualiza automáticamente** cuando el usuario redimensiona la ventana.

```js
export function useIsMobile(breakpoint = 768) {
  // Valor inicial sincrónico (evita flash en la primera renderización)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    // matchMedia es más eficiente que un listener de 'resize'
    // solo dispara cuando cruza el breakpoint, no en cada pixel
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);   // cleanup
  }, [breakpoint]);

  return isMobile;  // boolean
}
```

**Por qué `matchMedia` en lugar de `window.resize`:**
Un listener de `resize` dispara cientos de veces mientras el usuario arrastra el borde de la ventana. `matchMedia` solo dispara **una vez** cuando el ancho cruza el breakpoint exacto, lo que es mucho más eficiente.

**Uso en el proyecto:**

| Componente | Breakpoint | Para qué |
|---|---|---|
| `UserDashboard` | `960px` | Layout de una vs tres columnas |
| `UserTienda` | `960px` (`isTiendaBreak`) | Colapsar la tienda a columna única |
| `UserChat` | `680px` (`isMobile`) | Vista de chat móvil vs desktop |
| `UserChat` | `1180px` (`isNarrow`) | Grid de señales hero en 2 vs 3 cols |

El hook acepta cualquier breakpoint como argumento:
```js
const isMobile  = useIsMobile();       // ≤768px (default)
const isTablet  = useIsMobile(1024);   // ≤1024px
const isNarrow  = useIsMobile(1180);   // ≤1180px
```

---

### `useLang.js` — Hook reactivo de internacionalización

Conecta los componentes React con el sistema de idiomas del archivo `i18n/index.js`. Cuando el idioma cambia (desde el SettingsPanel), todos los componentes que usen este hook **se re-renderizan automáticamente** con los nuevos textos.

```js
export function useLang() {
  // Estado local del idioma actual
  const [lang, setLangState] = useState(getLang);

  useEffect(() => {
    // Escucha el evento personalizado que dispara setLang() de i18n/index.js
    const handler = (e) => setLangState(e.detail || getLang());
    window.addEventListener("fv-lang-changed", handler);
    return () => window.removeEventListener("fv-lang-changed", handler);
  }, []);

  const setLang = useCallback((code) => _setLang(code), []);  // escribe localStorage + dispara evento
  const t = useCallback((key) => _t(key, lang), [lang]);       // traduce con el idioma actual

  return { lang, setLang, t, LANGS };
}
```

**Flujo de cambio de idioma:**
```
Usuario selecciona "English" en SettingsPanel
  → setLang("en")
    → localStorage.setItem("fv_lang", "en")
    → window.dispatchEvent(new CustomEvent("fv-lang-changed", { detail: "en" }))
      → todos los useLang() en todos los componentes montan reciben el evento
        → setLangState("en") → re-render con textos en inglés
```

**Uso:**
```js
const { t, lang, setLang } = useLang();

<h1>{t("dash.nav.home")}</h1>         // → "Mapa del Héroe" (es) / "Hero Map" (en)
<button onClick={() => setLang("pt")} // → cambia a Português
```

---

### `useThemeColors.js` — Hook reactivo de temas visuales

Gestiona los **5 temas de color** disponibles en ForgeVenture y expone la paleta activa como un objeto de colores. Funciona con el mismo patrón de evento personalizado que `useLang`.

**Temas disponibles (`THEME_PRESETS`):**

| ID | Nombre | Descripción |
|---|---|---|
| `sc-admin` | Admin clásico | Azul marino y cobre (tema por defecto) |
| `wine-aurora` | Vino Aurora | Púrpura oscuro, dorado, azul eléctrico |
| `cyber-neon` | Cyber Neon | Negro, amarillo neón, magenta, cian |
| `forest-druid` | Forest Druid | Verde oscuro, esmeralda, lima |
| `ocean-abyss` | Ocean Abyss | Azul abismo, índigo, ámbar |

**`buildColors(themeId, accent)`:**
Combina el preset de tema con un color de acento personalizado (configurable en SettingsPanel). El acento reemplaza los colores de `orange`/`orangeL` en la paleta resultante, permitiendo personalización fina sin cambiar el tema completo.

```js
export function useThemeColors() {
  const [colors, setColors] = useState(() => {
    // Carga inicial sincrónica desde localStorage
    const themeId = localStorage.getItem("fv_theme") || "sc-admin";
    const accent  = localStorage.getItem("fv_accent");
    return buildColors(themeId, accent);
  });

  useEffect(() => {
    // Se actualiza cuando SettingsPanel cambia el tema
    const handler = () => { /* lee localStorage → buildColors → setColors */ };
    window.addEventListener("fv-theme-changed", handler);
    return () => window.removeEventListener("fv-theme-changed", handler);
  }, []);

  return colors;  // { bg, card, panel, navy, orange, gold, blue, text, muted, ... }
}
```

**Objeto devuelto (ejemplo con tema `sc-admin`):**
```js
{
  bg:      "#0A0E1A",   // fondo principal
  card:    "#141A2A",   // fondo de cards
  panel:   "#0A0E1A",   // fondo de paneles
  navy:    "#1A3354",   // bordes y separadores
  orange:  "#D4A574",   // acento principal (o color custom del usuario)
  gold:    "#C9B037",   // XP, recompensas, highlights
  blue:    "#5A9FD4",   // información, links
  green:   "#6B9F6A",   // éxito, confirmación
  white:   "#F0F4FF",   // texto principal
  muted:   "#7A8A9E",   // texto secundario
}
```

---

## 2. `src/i18n/`

Sistema de **internacionalización (i18n) propio**, sin dependencias externas. Un único archivo de 3.224 líneas que contiene todas las traducciones de la app y el motor para usarlas.

```
src/i18n/
└── index.js    → diccionarios de 4 idiomas + motor de traducción
```

---

### `i18n/index.js` — Sistema de traducción completo

#### ¿Por qué un sistema propio y no una librería?

ForgeVenture usa un sistema propio en lugar de librerías como `i18next` o `react-intl` por tres razones:
1. **Cero dependencias extra** — menos peso en el bundle
2. **Sin contexto de React** — la función `t()` puede usarse fuera de componentes (en servicios, utilidades, etc.)
3. **Evento nativo del DOM** — el mecanismo de actualización usa `CustomEvent` del navegador, lo que permite que cualquier parte de la app reaccione al cambio de idioma sin necesidad de providers anidados

---

#### Idiomas soportados (`LANGS`)

```js
export const LANGS = [
  { code: "es", label: "Español",   flag: "🇪🇸" },
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "fr", label: "Français",  flag: "🇫🇷" },
];
```

---

#### Estructura de los diccionarios (`LOCALES`)

Cada idioma es un objeto de clave → valor dentro del objeto `LOCALES`. Las claves siguen una convención de prefijo por sección:

| Prefijo | Sección de la app |
|---|---|
| `sp.*` | Settings Panel (configuración) |
| `dash.*` | Dashboard principal |
| `dash.nav.*` | Navegación lateral del dashboard |
| `dash.greet.*` | Saludos por hora del día |
| `dash.mis.*` | Módulo de misiones en el dashboard |
| `dash.act.*` | Módulo de actividad/bitácora |
| `dash.log.*` | Módulo de logros en el dashboard |
| `dash.rank.*` | Módulo de ranking |
| `dash.chart.*` | Gráfica semanal de XP |
| `ch.*` | Chat |
| `pr.*` | Perfil del usuario |
| `common.*` | Textos reutilizables globales |

**Distribución de líneas por idioma:**

| Idioma | Línea de inicio | Aprox. claves |
|---|---|---|
| Español (`es`) | 19 | ~230 claves |
| English (`en`) | 977 | ~230 claves |
| Português (`pt`) | 1805 | ~230 claves |
| Français (`fr`) | 2506 | ~230 claves |

---

#### Ejemplos de traducciones

```js
// Navegación
"dash.nav.home":       "Mapa del Héroe"    /  "Hero Map"        / "Mapa do Herói"   / "Carte du Héros"
"dash.nav.ejercicios": "Campo de Entreno"  /  "Training Field"  / "Campo de Treino" / "Terrain d'Entraînement"
"dash.nav.tienda":     "Mercado del Gremio"/  "Guild Market"    / "Mercado do Clã"  / "Marché de la Guilde"

// Saludo por hora
"dash.greet.morning":  "Buenos días"  / "Good morning"  / "Bom dia"    / "Bonjour"
"dash.greet.evening":  "Buenas noches"/ "Good evening"  / "Boa noite"  / "Bonsoir"
```

---

#### Motor de traducción (API pública)

**`getLang()`**
Lee el idioma guardado en `localStorage` bajo la clave `fv_lang`. Si no existe (primera visita), devuelve `"es"` como idioma por defecto.

```js
export function getLang() {
  try { return localStorage.getItem("fv_lang") || "es"; }
  catch { return "es"; }  // catch por si localStorage está bloqueado (modo privado estricto)
}
```

**`setLang(code)`**
Escribe el nuevo idioma en `localStorage` y **dispara un evento personalizado del DOM** para notificar a todos los componentes suscritos.

```js
export function setLang(code) {
  try { localStorage.setItem("fv_lang", code); } catch {}
  window.dispatchEvent(new CustomEvent("fv-lang-changed", { detail: code }));
}
```

**`t(key, lang)`**
Traduce una clave al idioma especificado. Implementa una **cadena de fallback de 3 niveles**:

```js
export function t(key, lang) {
  const L = lang || getLang();
  return LOCALES[L]?.[key]     // 1º: idioma solicitado
      ?? LOCALES.es?.[key]     // 2º: fallback a Español (siempre completo)
      ?? key;                  // 3º: devuelve la clave cruda (nunca rompe la UI)
}
```

**¿Por qué 3 niveles de fallback?**
- Si se añade una clave nueva en español pero aún no se tradujo al inglés → el usuario en inglés ve el texto en español en vez de una cadena vacía o un error
- Si la clave no existe en ningún idioma → se muestra la clave (`"dash.nav.home"`) que es mejor que un crash o un elemento vacío

---

#### Uso fuera de React (sin hook)

```js
// En un servicio o utilidad (no componente React):
import { t } from "../i18n/index.js";

const mensaje = t("dash.greet.morning");  // lee el idioma de localStorage cada vez
```

**Importante:** Esta forma no es reactiva. Si el idioma cambia mientras el módulo está en memoria, la función sigue devolviendo traducciones correctas (porque lee localStorage en cada llamada), pero el módulo que la usa no se re-renderiza automáticamente.

---

## 3. `src/router/`

Contiene los **guards de ruta para el panel de administración**. Un guard es un componente que envuelve rutas y decide si el usuario tiene permiso para acceder.

```
src/router/
└── Guards.jsx    → AdminGuard: verifica token Firebase + rol admin en el backend
```

---

### `router/Guards.jsx` — AdminGuard

Protege las rutas del panel de administración. No solo verifica que el usuario esté autenticado (eso lo hace Firebase), sino que además **consulta al backend** para verificar que tiene el rol `admin` en la base de datos.

```js
export function AdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");   // sin sesión → al login
        return;
      }

      try {
        const token = await user.getIdToken();      // obtiene JWT de Firebase
        const res = await verifyMe(token);           // llama a /api/auth/me con el token

        if (res.user.roleId === "admin") {
          setAuthorized(true);                       // ✓ es admin
        } else {
          navigate("/dashboard");                    // ✗ usuario normal → al dashboard
        }
      } catch (err) {
        navigate("/login");                          // error de red o token inválido
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;   // limpia el listener al desmontar
  }, [navigate]);

  if (loading) return <div>Verificando permisos...</div>;
  return authorized ? children : null;
}
```

**Flujo de verificación:**
```
Usuario navega a /admin
  → AdminGuard monta
    → onAuthStateChanged detecta si hay sesión Firebase activa
      → SI hay sesión: getIdToken() → llama a verifyMe(token)
        → backend verifica el JWT y devuelve { user: { roleId: "admin" } }
          → SI roleId === "admin" → renderiza el panel admin
          → SI no → redirige a /dashboard
      → NO hay sesión → redirige a /login
```

**¿Por qué verificar el rol en el backend y no solo en Firebase?**
Firebase Auth solo sabe si el usuario existe y está autenticado. El rol (`admin`, `user`) es un dato del negocio guardado en Firestore. Verificarlo en el backend (con el SDK Admin) garantiza que:
1. El token no ha sido manipulado (el backend lo valida criptográficamente)
2. El rol es el que está en la base de datos, no el que el frontend asume

---

## 4. `src/routes/`

Contiene guards alternativos para el flujo de autenticación de usuarios regulares (no admins).

```
src/routes/
└── Guards.jsx    → PrivateRoute y PublicRoute usando contexto de autenticación
```

---

### `routes/Guards.jsx` — Guards de usuario

```js
// Solo deja pasar si HAY sesión activa (ej: /dashboard)
export function PrivateRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// Solo deja pasar si NO HAY sesión (ej: /login, /registro)
export function PublicRoute() {
  const { user } = useAuth();
  return !user ? <Outlet /> : <Navigate to="/home" replace />;
}
```

Estos guards usan el patrón de **Outlet** de React Router v6: en lugar de envolver `children`, actúan como layouts intermedios en el árbol de rutas. Las rutas hijas se renderizan a través del `<Outlet />`.

> **Nota:** Este archivo es una versión alternativa/inicial de los guards. La versión activa usada en producción está **definida directamente en `App.jsx`** con los guards `PrivateRoute`, `PublicOnlyRoute` y la lógica de `AdminGuard` del `router/`. Los guards de `routes/Guards.jsx` están disponibles pero no son el punto de entrada principal del árbol de rutas actual.

---

### Árbol de rutas completo (definido en `App.jsx`)

Para entender el contexto completo de ambas carpetas de guards, aquí está cómo se estructura el sistema de rutas:

```
/                          → redirige a /home
/home                      → Landing page pública (Home.jsx)

<PublicOnlyRoute>          → solo si NO hay sesión
  /login                   → LoginPage.jsx
  /register                → RegisterPage.jsx

<PrivateRoute>             → solo si HAY sesión (Firebase)
  /dashboard               → UserDashboard.jsx o AdminDashboard.jsx
                             (UserDashboard decide internamente si mostrar admin)
  /dashboard/ejercicios/jefe/:bossKey → UserBossBattleArena.jsx

/soporte                   → SupportPage.jsx (pública)
/terminos                  → TerminosPage.jsx (pública)
/privacidad                → PrivacidadPage.jsx (pública)

*                          → redirige a /home (catch-all)
```

**Diferencia entre `PrivateRoute` y `AdminGuard`:**

| Guard | Dónde vive | Verifica | Mecanismo |
|---|---|---|---|
| `PrivateRoute` (App.jsx) | Rutas de usuario | `sessionState.fbUser` (Firebase Auth en memoria) | Contexto React (`useAuth`) |
| `PublicOnlyRoute` (App.jsx) | Login y Register | Que NO haya sesión + que el perfil esté cargado | Contexto React (`useAuth`) |
| `AdminGuard` (router/Guards.jsx) | Panel de Admin | Firebase Auth + `roleId === "admin"` en Firestore | Llamada HTTP al backend |

---

## Resumen de la sección

| Carpeta | Archivo | Función principal |
|---|---|---|
| `hooks/` | `useIsMobile.js` | Detecta breakpoints de forma eficiente con matchMedia |
| `hooks/` | `useLang.js` | Hook reactivo que sincroniza todos los componentes al cambiar idioma |
| `hooks/` | `useThemeColors.js` | Hook reactivo que aplica el tema visual elegido por el usuario |
| `i18n/` | `index.js` | 4 idiomas × ~230 claves + motor de traducción con fallback de 3 niveles |
| `router/` | `Guards.jsx` | AdminGuard: verifica Firebase + rol `admin` en el backend antes de dar acceso |
| `routes/` | `Guards.jsx` | PrivateRoute / PublicRoute para el flujo de autenticación de usuarios |
