# 09 · Pages/User: UserDashboard · UserDonaciones · UserEjercicios

> Documentación de tesis — ForgeVenture v1  
> Carpeta: `frontend/src/pages/user/`  
> Archivos cubiertos: `UserDashboard.jsx`, `UserDonaciones.jsx`, `UserEjercicios.jsx`

---

## Índice

1. [UserDashboard — El cuartel general del héroe](#1-userdashboardjsx)
2. [UserDonaciones — La cripta del apoyo al reino](#2-userdonacionesjsx)
3. [UserEjercicios — El campo de combate del entrenamiento](#3-userejerciciosjsx)

---

## 1. UserDashboard.jsx

**Versión:** Design System v4  
**Ruta:** `frontend/src/pages/user/UserDashboard.jsx`  
**Props:** `{ profile: propProfile, onLogout }`

### 1.1 ¿Qué experiencia ofrece al usuario?

`UserDashboard` es el **corazón operativo de ForgeVenture**. No es una pantalla más — es el sistema nervioso central que orquesta las 13 secciones del producto. El usuario vive aquí: navega entre ejercicios, misiones, logros, tienda, chat y perfil sin salir del mismo componente.

La experiencia es la de un **juego de rol con HUD**. El sidebar izquierdo funciona como el menú de un JRPG — con iconos de sección, tooltips RPG que explican cada zona en términos de aventura ("Campo de combate", "Tablón de quests", "Sala de trofeos"), y un perfil del héroe visible en todo momento con nivel, XP y streak. La topbar muestra en tiempo real las monedas del usuario, el reloj, un buscador global y las notificaciones.

Todo el dashboard cambia de color según la clase del héroe (rojo Guerrero, verde/azul Arquero, azul Mago). Cada elemento de la UI — bordes del sidebar, barra de XP, íconos activos, hover de botones, scrollbars — usa variables CSS que se repintan automáticamente.

### 1.2 Importaciones clave

```js
// Sistema de diseño
import { P, mono, sans, disp, glass, EASE,
  Aurora, PixelRain, Embers, ScrollProgress, Brackets, Reveal }
  from "../../design/system.jsx";

// Framer Motion
import { motion, AnimatePresence, useReducedMotion, useInView,
  useScroll, useSpring } from "framer-motion";

// Las 13 sub-páginas (renderizadas dentro del área de contenido)
import UserHome         from "./UserHome";
import UserEjercicios   from "./UserEjercicios";
import UserRutinas      from "./UserRutinas";
import UserMisiones     from "./UserMisiones";
import UserLogros       from "./UserLogrosLanding.jsx";
import UserTienda       from "./UserTienda.jsx";
import UserPerfil       from "./UserPerfil";
import UserPersonaje, { STAGES, getStage } from "./UserPersonaje";
import UserChat         from "./UserChat";
import UserMente        from "./UserMente";
import UserDonaciones   from "./UserDonaciones";
import UserSalud        from "./UserSalud";
import UserMensajes     from "./UserMensajes";

// API (19 endpoints)
import {
  getProfile, getUserStats, getMisionesUsuario, getUserActivity,
  getLeaderboard, getUserLogros, getNotifications, markMessageRead,
  markNotificationRead, markAllNotificationsRead,
  getWeeklyLeaderboard, setActiveAvatar, submitFeedback, getWeeklyActivity,
} from "../../services/api.js";

// Componentes modales y overlays
import DailyBonusModal      from "../../components/shared/DailyBonusModal.jsx";
import StreakChallengeCard   from "../../components/shared/StreakChallengeCard.jsx";
import PRBanner             from "../../components/shared/PRBanner.jsx";
import LevelUpCeremony      from "../../components/shared/LevelUpCeremony.jsx";
import SocialFab            from "../../components/shared/SocialFab.jsx";

// Otros
import { USER_CLASS_THEME }  from "./userClassTheme.js";
import { canShowXpPopups }   from "../../utils/runtimeSettings.js";
import { AVATARS_CATALOG }   from "../../avatar/AvatarCatalog.js";
```

### 1.3 Navegación — el array `NAV`

Los 13 ítems de navegación están definidos en un array que combina ícono, clave i18n y badge:

| id | Ícono | Badge | Descripción RPG |
|---|---|---|---|
| `home` | Home | — | Mapa del día |
| `ejercicios` | Dumbbell | — | Campo de combate |
| `rutinas` | ClipboardList | — | Ruta física activa |
| `misiones` | Target | — | Tablón de quests |
| `logros` | Trophy | — | Sala de trofeos |
| `tienda` | ShoppingBag | "NEW" | Mercado del gremio |
| `personaje` | Sword | — | Forja de clase |
| `mente` | Brain | "NEW" | Santuario mental |
| `salud` | BookOpen | — | Biblioteca de salud |
| `chat` | MessageCircle | — | Canal del gremio |
| `mensajes` | Bell | — | Buzón de avisos |
| `donaciones` | Heart | "💛" | Cristales del reino |
| `perfil` | User | — | Ficha del héroe |

### 1.4 Metadatos RPG por sección (`NAV_RPG_META`)

Cada sección tiene asociados datos que la topbar y los tooltips del sidebar usan:

```js
{
  ejercicios: {
    asset:    "/ui/header/section-ejercicios.png",
    zone:     "Entreno",
    hint:     "Campo de combate",
    keywords: ["entrenar","fuerza","ejercicio","pelea"],
  },
  misiones: {
    asset:    "/ui/header/section-misiones.png",
    zone:     "Aventura",
    hint:     "Tablón de quests",
    keywords: ["mision","quest","reclamar","xp"],
  },
  // ... y así para cada sección
}
```

El tooltip del sidebar muestra el `hint` en formato RPG junto a la zona de juego. El `asset` se usa como orbe de sección en la topbar cuando esa sección está activa. Los `keywords` permiten al buscador global encontrar secciones por palabras clave relacionadas.

### 1.5 Configuración de clase (`CLS`)

```js
const CLS = {
  GUERRERO: { icon:"⚔️", color:"#E05C8A", primary:"Fuerza",
              stats:{ fuerza:95, resistencia:70, agilidad:55, vitalidad:60 } },
  ARQUERO:  { icon:"🏃", color:"#4CC9F0", primary:"Cardio",
              stats:{ agilidad:95, resistencia:85, fuerza:50, vitalidad:70 } },
  MAGO:     { icon:"🧘", color:"#4cc9f0", primary:"Flexibilidad",
              stats:{ vitalidad:95, agilidad:80, resistencia:75, fuerza:45 } },
};
```

Estos valores alimentan las barras de estadísticas de la `HomeView` y determinan qué tipo de contenido se prioriza.

### 1.6 Sistema de variables CSS por clase

El elemento raíz del dashboard recibe el color de clase como variables CSS:
```css
--dash-class-accent:    /* color primario de la clase */
--dash-class-secondary: /* color secundario */
--dash-class-bg:        /* fondo oscuro de la clase */
--dash-class-soft:      /* versión suave al 15% de opacidad */
```

Todo el CSS usa estas variables en lugar de colores fijos. Resultado: la misma hoja de estilos sirve para los 3 colores de clase. Un Guerrero ve un sidebar rojo carmesí; un Mago lo ve azul eléctrico.

### 1.7 Estado del componente

```js
// Identidad del usuario
const [user,    setUser]    = useState(null);
const [profile, setProfile] = useState(propProfile || null);

// Navegación
const [active,           setActive]           = useState("home");
const [donationsLocked,  setDonationsLocked]  = useState(false);
const [sideCollapsed,    setSideCollapsed]     = useState(true);

// Datos del juego (7 fuentes de API)
const [missions,          setMissions]          = useState([]);
const [recentActivity,    setRecentActivity]    = useState([]);
const [leaderboard,       setLeaderboard]       = useState([]);
const [weeklyLeaderboard, setWeeklyLeaderboard] = useState({ GUERRERO:[], ARQUERO:[], MAGO:[], week:"" });
const [userLogros,        setUserLogros]        = useState([]);
const [userStats,         setUserStats]         = useState(null);
const [weeklyXPData,      setWeeklyXPData]      = useState([]);

// Notificaciones
const [notifications,     setNotifications]    = useState([]);
const [unreadMsgCount,    setUnreadMsgCount]   = useState(0);
const [showNotifs,        setShowNotifs]       = useState(false);

// Overlays y ceremonias
const [levelUpCelebration, setLevelUpCelebration] = useState(null);
const [showDailyModal,     setShowDailyModal]     = useState(false);
const [skillPointsBadge,   setSkillPointsBadge]   = useState(null);
const [prBroken,           setPrBroken]           = useState(null);

// UI global
const [searchQ,            setSearchQ]            = useState("");
const [showSearch,         setShowSearch]         = useState(false);
const [time,               setTime]               = useState(new Date());
const [focusMode,          setFocusMode]          = useState(false);
const [coinsPulse,         setCoinsPulse]         = useState(false);
```

### 1.8 Carga inicial de datos — `Promise.allSettled` paralelo

Al montar (y al cambiar `loadKey`), el dashboard lanza **7 peticiones en paralelo**:

```js
const [missionsRes, statsRes, activityRes, leaderboardRes, logrosRes, weeklyRes, weeklyXPRes] =
  await Promise.allSettled([
    getMisionesUsuario(token),   // misiones del usuario
    getUserStats(token),          // estadísticas de juego
    getUserActivity(token),       // actividad reciente
    getLeaderboard(token),        // ranking global
    getUserLogros(token),         // logros desbloqueados
    getWeeklyLeaderboard(token),  // ranking semanal por clase
    getWeeklyActivity(token),     // XP semanal (para el gráfico)
  ]);
```

Se usa `Promise.allSettled` (no `Promise.all`) para que un fallo parcial no rompa toda la carga. Cada resultado se revisa individualmente:

```js
if (statsRes.status === "fulfilled") {
  setUserStats(statsRes.value?.stats || null);
  const sp = statsRes.value?.stats?.skillPoints ?? 0;
  if (sp > 0) setSkillPointsBadge(sp);  // badge en el nav de personaje
}
```

### 1.9 Sistema de notificaciones

Las notificaciones tienen tipología visual con assets PNG:

| Tipo | Asset | Casos de uso |
|---|---|---|
| `mision` / `quest` | `notif-quest.png` | Nueva misión disponible, quest completada |
| `logro` / `medal` | `notif-medal.png` | Logro desbloqueado, subida de nivel |
| `tienda` / `shop` | `notif-shop.png` | Nuevo objeto disponible |
| `racha` / `shield` | `notif-shield.png` | Racha en riesgo, record de racha |
| `sistema` / `mensaje` | `notif-message.png` | Avisos del sistema, mensajes del equipo |

Al hacer click en una notificación se llama `markNotificationRead(token, notif.id)` y el badge rojo desaparece. "Marcar todas como leídas" llama `markAllNotificationsRead(token)`.

### 1.10 Daily Bonus Modal — una vez por día UTC

```js
useEffect(() => {
  if (!profile) return;
  const todayUTC = (() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  })();
  const sessionKey = `fv_daily_modal_${todayUTC}`;
  if (sessionStorage.getItem(sessionKey)) return;   // ya se mostró en esta sesión del día
  if (profile.lastDailyBonusDate !== todayUTC) {
    setShowDailyModal(true);
    sessionStorage.setItem(sessionKey, "1");
  }
}, [profile?.lastDailyBonusDate]);
```

La clave `fv_daily_modal_YYYY-MM-DD` en sessionStorage asegura que el modal de bono diario aparezca **sólo una vez por día UTC** aunque el usuario navegue entre secciones. Si el usuario ya reclamó el bono hoy (`lastDailyBonusDate === todayUTC`), no se muestra.

### 1.11 Pulse de monedas

```js
const lastCoinsRef = useRef(Number(propProfile?.coins || 0));

useEffect(() => {
  const currentCoins = Number(profile?.coins || 0);
  if (currentCoins !== lastCoinsRef.current) {
    lastCoinsRef.current = currentCoins;
    setCoinsPulse(true);
    setTimeout(() => setCoinsPulse(false), 520);
  }
}, [profile?.coins]);
```

Cada vez que las monedas del usuario cambian (por completar misiones o compras), el contador de monedas en la topbar dispara la animación `ud2-coin-pop` durante 520ms — un efecto visual inmediato que comunica la ganancia sin interrumpir el flujo.

### 1.12 Eventos del sistema — navegación cross-componente

El dashboard escucha dos tipos de eventos globales:

```js
// Navegación desde el avatar Flex (componente 3D flotante)
window.addEventListener("flexNavigate", (e) => navigateToSection(e.detail.section));

// Navegación desde React Router location.state (tras volver de la Arena)
useEffect(() => {
  if (location.state?.activeTab) navigateToSection(location.state.activeTab);
}, [location.state]);
```

La función `navigateToSection` tiene lógica especial para donaciones:
```js
const navigateToSection = (section) => {
  if (section === "donaciones") {
    setDonationsLocked(true);   // abre el overlay de donaciones
    setShowNotifs(false);
    setShowSearch(false);
    return;
  }
  setDonationsLocked(false);
  setActive(section);
};
```

### 1.13 `HomeView` — la vista principal del dashboard

`HomeView` es el sub-componente que se renderiza cuando `active === "home"`. Recibe datos del dashboard padre y presenta:
- **Bento de misiones activas** — las misiones en curso con botón de reclamar XP.
- **Actividad reciente** — log de las últimas acciones del usuario con timestamps.
- **Leaderboard global** — top 5 con posición del usuario resaltada.
- **Leaderboard semanal** — tabs por clase (GUERRERO / ARQUERO / MAGO) con ranking de la semana.
- **Gráfico de XP semanal** — chart de área con los últimos 7 días de XP ganado.
- **Logros recientes** — los últimos logros desbloqueados del usuario.
- **Módulos colapsables** — cada sección del HomeView puede colapsar/expandir su contenido con un botón de toggle, y el estado se persiste con `useState(() => {...})` inicializado desde localStorage.

### 1.14 Overlays y ceremonias del juego

| Componente | Condición de aparición | Efecto |
|---|---|---|
| `DailyBonusModal` | Primera visita del día | Muestra recompensa diaria, llama al backend para reclamarla |
| `LevelUpCeremony` | `levelUpCelebration !== null` | Animación épica de subida de nivel con efectos de partículas |
| `PRBanner` | `prBroken !== null` | Banner que celebra un nuevo récord personal |
| `StreakChallengeCard` | Generado por el backend | Card especial con challenge de racha para mantener la motivación |

### 1.15 Sidebar — diseño y CSS

El sidebar tiene una capa visual elaborada:
- **Fondo:** gradiente radial en la parte superior con el accent de la clase (al 12% de opacidad), sobre fondo casi negro.
- **Partículas:** imagen de textura `dashboard-particles.png` con `mix-blend-mode: screen` al 22% de opacidad, para dar sensación de profundidad.
- **Línea derecha:** gradiente vertical `accent → secondary → transparent` como borde vivo animado.
- **Tooltip RPG en hover:** cuando el sidebar está colapsado, el hover sobre cada ítem de nav muestra un tooltip con el nombre de la zona y el hint temático.

```css
.ud2-nav-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  /* tooltip que aparece a la derecha del ícono */
  border: 1px solid color-mix(in srgb, var(--dash-class-accent), transparent 68%);
  background: rgba(8,5,17,.96);
}
.ud2-nav-tooltip strong { /* nombre de la sección */ }
.ud2-nav-tooltip span   { /* hint temático en monospace */ }
```

### 1.16 Topbar — el HUD del héroe

La topbar tiene 3 columnas:
- **Izquierda:** orbe de sección (imagen del módulo activo en cuadrado de 42px con glow), nombre de la sección, zona RPG.
- **Centro:** campo de búsqueda global que filtra por `keywords` de `NAV_RPG_META`. Al escribir "quest" navega a misiones; al escribir "tienda" va a la tienda.
- **Derecha:** monedas del usuario (con pulso al cambiar), reloj en tiempo real (actualizado cada segundo con `setInterval`), campana de notificaciones, botón de modo focus.

La topbar tiene una animación `ud2-topbar-glint` — un flash de luz blanca que atraviesa de izquierda a derecha cada 6.5 segundos, simulando el reflejo de luz de un panel de cristal.

---

## 2. UserDonaciones.jsx

**Versión:** Pixel RPG Donation Shop · Bento Grid v2  
**Ruta:** `frontend/src/pages/user/UserDonaciones.jsx`

### 2.1 ¿Qué experiencia ofrece al usuario?

`UserDonaciones` es el **templo del apoyo voluntario** a ForgeVenture. Presenta la filosofía de donación de la plataforma de una forma que encaja perfectamente con el universo del juego: no es un formulario de pago genérico sino una **tienda de cristales del reino** con estética RPG gótica.

El usuario llega aquí y entiende inmediatamente que la plataforma es gratuita y que su apoyo es voluntario. En lugar de sentir presión, la página transmite gratitud y pertenencia: "Tu apoyo mantiene viva la aventura." Los donantes recientes aparecen en un feed de héroe con sus nombres en mayúsculas y el importe que aportaron. Los corazones flotantes cuando alguien hace click en "APOYAR" hacen que el gesto se sienta significativo.

### 2.2 Estética y paleta

```js
// Variables CSS propias (no del sistema global)
--fvd-bg:    #07060c       // negro profundo
--fvd-gold:  #c89b3c       // dorado antiguo
--fvd-gold-b:#f4cc78       // dorado brillante
--fvd-fire:  #ff7a1f       // naranja fuego
--fvd-ember: #ffb15c       // brasa
--fvd-xp3:   #c77dff       // púrpura XP
// Colores por tier:
--tc-bronze: #c87a3c       // Tier I - Bronce
--tc-silver: #c5cad6       // Tier II - Plata
--tc-gold:   #f4cc78       // Tier III - Oro
--tc-purple: #c08aff       // Tier IV - Legendario
--tc-red:    #e0455e       // Tier V - Titán
```

La estética es coherente con `UserChat` y `UserDonaciones` — los paneles con esquinas doradas, embers flotando, scanlines sutiles y tipografía `VT323`/`Press Start 2P` dan la sensación de una interfaz de juego de rol clásico.

### 2.3 Layout — 3 columnas

```css
.fvd-wrapper {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 12px;
}
```

| Columna | Contenido |
|---|---|
| Izquierda (280px) | Panel del héroe (avatar, nombre, clase, nivel, XP, 5 barras de stats) + objetivo de apoyo (barra de meta) + racha de apoyo (llamas animadas) |
| Centro (flex) | Cards de tier (3 opciones de apoyo) + datos bancarios + donaciones recientes |
| Derecha (320px) | QR decorativo + información de transferencia + historial de gemas del usuario |

### 2.4 Sistema de cooldown — 20 minutos entre apoyos

```js
const COOLDOWN_MS  = 20 * 60 * 1000;   // 20 minutos en ms
const LS_LAST_KEY  = "fv_apoyar_last";  // timestamp del último apoyo
const LS_COUNT_KEY = "fv_apoyar_count"; // conteo total de apoyos

const recheckCooldown = () => {
  const last  = parseInt(localStorage.getItem(LS_LAST_KEY) || "0", 10);
  const since = Date.now() - last;
  if (since < COOLDOWN_MS) {
    setOnCooldown(true);
    setRemainMs(COOLDOWN_MS - since);
  } else {
    setOnCooldown(false);
    setRemainMs(0);
  }
};
```

Un `setInterval` de 1 segundo decrementa `remainMs` mientras el cooldown está activo. Cuando llega a 0, el cooldown se desactiva y el botón se reactiva.

El cooldown persiste en `localStorage` — si el usuario cierra y reabre la página, el tiempo restante se calcula correctamente desde el timestamp guardado.

### 2.5 `handleApoyar` — el gesto de apoyo

```js
const handleApoyar = () => {
  if (onCooldown) return;
  const next = totalCount + 1;
  setTotalCount(next);

  // Persistir en localStorage
  localStorage.setItem(LS_COUNT_KEY, String(next));
  localStorage.setItem(LS_LAST_KEY, String(Date.now()));

  // Efectos visuales
  setFloatingHearts(h => [...h, { id: Date.now() }]);  // lanza corazón flotante
  setRipple(true); setTimeout(() => setRipple(false), 700);  // ondas de ripple
  setShowThanks(true); setTimeout(() => setShowThanks(false), 3200);  // toast "¡GRACIAS!"

  // Activar cooldown
  setOnCooldown(true); setRemainMs(COOLDOWN_MS);
};
```

Cada click en "APOYAR" lanza:
- Un **corazón flotante** que sube 130px con animación Framer Motion y desaparece.
- Un **efecto ripple** de 700ms en el botón.
- Un **toast** dorado en la esquina superior derecha: "¡GRACIAS POR TU APOYO! Tu apoyo mantiene viva la aventura" — visible 3.2 segundos.
- El contador de apoyos totales avanza y se ve en la barra de meta.

### 2.6 `FloatingHeart` — corazones animados

```jsx
function FloatingHeart({ id, onDone }) {
  const x = (Math.random() - 0.5) * 180;  // desplazamiento horizontal aleatorio (±90px)
  return (
    <motion.div
      initial={{ opacity:1, y:0, x:0, scale:.8 }}
      animate={{ opacity:0, y:-130, x, scale:1.4 }}
      transition={{ duration:1.4, ease:"easeOut" }}
      onAnimationComplete={onDone}
    >
      <Heart size={16} color={SC.orange} fill={`${SC.orange}99`}/>
    </motion.div>
  );
}
```

Cada corazón flota en una dirección horizontal diferente (±90px aleatorio) mientras sube 130px y se desvanece en 1.4 segundos. Al completar la animación, `onDone` lo elimina del array de `floatingHearts`.

### 2.7 Los 3 tiers de apoyo (TierCards)

| Rank | Nombre i18n | Ícono | Color |
|---|---|---|---|
| I | Tier básico | `<Leaf>` | teal (verde azulado) |
| II | Tier medio (POPULAR) | `<Swords>` | naranja |
| III | Tier alto | `<Crown>` | dorado |

Cada `TierCard` usa `motion.div` con:
- `whileHover={{ scale: 1.02, y: -3 }}` — levitación suave al hover.
- `whileTap={{ scale: .97 }}` — hundimiento al click.
- `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` — entrada animada con delay escalonado.

Cuando está seleccionada, la card recibe borde del color del tier y un shadow glow del mismo color. El check de selección aparece con `AnimatePresence` + `scale: 0 → 1`.

Las imágenes de marco y textura (`/ui/tier-frame-{rank}.png`, `/ui/tier-bg-{rank}.png`) son overlays PNG con opacidad muy baja que añaden textura de pergamino o piedra al interior de cada card.

### 2.8 Los 5 DON_TIERS — conversión $→gemas

```js
const DON_TIERS = [
  { id:"aprendiz", name:"APRENDIZ", price:1,  gems:10  },
  { id:"guerrero", name:"GUERRERO", price:5,  gems:50  },
  { id:"campeon",  name:"CAMPEÓN",  price:10, gems:120 },
  { id:"leyenda",  name:"LEYENDA",  price:25, gems:350 },
  { id:"titan",    name:"TITÁN",    price:50, gems:800 },
];

const gemsForAmt = (v) => Math.round(v * 16);  // escala libre: $1 = 16 gemas
```

El selector de monto permite elegir entre los 5 tiers predefinidos o escribir un monto personalizado. En ambos casos se calcula la cantidad de gemas correspondiente. Al hacer click en "Donar", se llama `handleApoyar()` y se añade la donación al feed de recientes.

### 2.9 Datos bancarios y QR decorativo

```js
const BANK = {
  titular: "Andrés Cherrez",
  banco:   "Banco Pichincha",
  tipo:    "Ahorros",
  numero:  "2203XXXXXXXX",    // parcialmente censurado
  cedula:  "17XXXXXXXX",
};
```

Cada campo bancario tiene un botón `CopyBtn` que copia el valor al portapapeles con `navigator.clipboard.writeText()`. El estado `copied` persiste 2 segundos antes de volver al estado normal.

El QR es un grid de 11×11 celdas generado de forma **determinística** con una función pseudo-aleatoria de semilla fija (`seed=7`):

```js
const qrCells = (() => {
  const n = 11; let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  // Genera los 3 patrones de esquina (finder patterns) fijos
  // El resto son celdas aleatorias pero reproducibles
})();
```

Siempre genera el mismo patrón — no es un QR funcional real, sino un elemento visual que comunica el concepto de "pago por QR" de forma coherente con la estética del sistema.

### 2.10 `PixelBar` — barra de meta segmentada

```js
function PixelBar({ val, max, color, segments=22 }) {
  const filled = Math.round((val / max) * segments);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {Array.from({ length:22 }, (_,i) => (
        <div key={i} style={{
          width:9, height:9, borderRadius:1,
          background: i < filled
            ? `linear-gradient(180deg,${color}dd,${color}88)`
            : `${SC.navy}99`,
          boxShadow: i < filled ? `0 0 4px ${color}55` : "none",
        }}/>
      ))}
    </div>
  );
}
```

Una barra de progreso pixelada de 22 segmentos, cada uno de 9×9px con bordes redondeados. Los segmentos activos brillan con un glow del color del tier. La meta es 50 apoyos (`GOAL = 50`).

### 2.11 Donaciones recientes — feed mock

Las donaciones recientes se presentan en un feed de héroes anónimos con nombres en mayúsculas estilo RPG:

```js
const [recentDons, setRecentDons] = useState([
  { name:"IRONBEAST",  amt:10,  msg:"¡Vamos por más, hermanos! 💪", time:"Hace 2h",  cls:"fvd-c-gold",   ico:"☻" },
  { name:"GYM_LORD",   amt:5,   msg:"Sigamos creciendo juntos 🔥",  time:"Hace 5h",  cls:"fvd-c-silver",  ico:"♜" },
  { name:"FIT_KNIGHT", amt:25,  msg:"La disciplina es libertad ⚔",  time:"Hace 1d",  cls:"fvd-c-purple",  ico:"♞" },
  { name:"SHADOWLIFT", amt:1,   msg:"Pequeño aporte, gran cambio 🙌",time:"Hace 1d",  cls:"fvd-c-bronze",  ico:"☠" },
]);
```

Cuando el usuario hace una donación, se añade `{ name:"TÚ", amt:currAmt, msg:donMsg, time:"Ahora", fresh:true }` al inicio de la lista. La fila recién añadida tiene la animación `fvd-row-in` (entra desde la izquierda) y se destaca con fondo dorado temporal.

### 2.12 `CooldownDisplay` — ring de cuenta regresiva

Un anillo SVG que muestra el tiempo restante del cooldown:

```jsx
<svg width={48} height={48} style={{ transform:"rotate(-90deg)" }}>
  <circle /* track gris */ />
  <circle
    strokeDasharray={circ}
    strokeDashoffset={circ * (1 - pct)}
    style={{ transition:"stroke-dashoffset .9s linear" }}
  />
</svg>
<div>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div>
```

El offset de `strokeDasharray` disminuye cada segundo, llenando el círculo de naranja a medida que pasa el tiempo. La transición de 0.9s hace que el movimiento sea fluido en lugar de brusco.

---

## 3. UserEjercicios.jsx

**Ruta:** `frontend/src/pages/user/UserEjercicios.jsx`  
**Props:** `{ profile }`

### 3.1 ¿Qué experiencia ofrece al usuario?

`UserEjercicios` es el **campo de entrenamiento principal** de ForgeVenture — donde la gamificación se convierte en actividad física real. El usuario no ve una lista de ejercicios: ve un **mapa de zonas de combate**, cada una con su propia ambientación visual, colores de clase, y escenas de fondo del héroe.

Lo que distingue a esta pantalla de cualquier app de fitness convencional:
- **Verificación por IA**: los ejercicios con cámara usan `PoseCamera` y análisis de poses en tiempo real para contar repeticiones automáticamente. La IA detecta cuándo se completa una flexión, una sentadilla o una dominada.
- **Batallas de jefe**: los ejercicios más difíciles pueden lanzar una Boss Battle completa (abre `UserBossBattleArena`).
- **Afinidad de clase**: la zona de entreno que aparece destacada depende de la clase del héroe (Guerrero ve Fuerza primero; Mago ve Flexibilidad).
- **Progreso visual**: cada ejercicio muestra cuántas veces se ha completado históricamente.

### 3.2 Catálogo de ejercicios estáticos (`EXERCISES`)

El componente incluye 20 ejercicios estáticos de respaldo (e1–e20) que se muestran mientras se cargan los datos reales desde Firebase. Cada ejercicio tiene:

```js
{
  id:          "e1",
  nombre:      "Flexiones",
  cat:         "Fuerza",
  dificultad:  "Principiante",         // Principiante | Intermedio | Avanzado | Elite
  xpBase:      30,                      // XP base por completar
  series:      3,
  reps:        15,                      // null si es por tiempo
  duracion:    null,                    // segundos (si es Timer)
  holdTargetSec: null,                  // segundos de postura (si es YogaHold)
  verif:       "Camara",               // Camara | Timer | YogaHold | Manual
  musculos:    ["Pecho", "Triceps", "Hombros"],
  desc:        "Patron base de empuje...",
  completadas: 8,                       // veces completado histórico
  bloqueado:   false,
}
```

**Tipos de verificación:**
- `Camara` — PoseCamera con IA detecta reps automáticamente.
- `Timer` — cuenta regresiva que el usuario completa manualmente.
- `YogaHold` — la IA valida que el usuario mantiene una postura específica durante N segundos.
- `Manual` — el usuario confirma la compleción por su cuenta.

### 3.3 Zonas de entrenamiento (`ZONE_META`)

7 zonas con identidad visual completa:

| Zona | Label RPG | Color | Summary |
|---|---|---|---|
| `Todos` | "Mapa completo" | `#c08aff` | Vista general de todo el campo |
| `Fuerza` | "Bastión de fuerza" | `#ff4d5e` | Empuje, piernas y control |
| `Cardio` | "Ruta de cardio" | `#4cc9f0` | Pulso, resistencia y ritmo |
| `Flexibilidad` | "Santuario móvil" | `#c08aff` | Movilidad y recuperación |
| `HIIT` | "Frente de impacto" | `#ff8659` | Intervalos cortos de alta intensidad |
| `Calistenia` | "Torre de control" | `#f3c969` | Fuerza relativa y dominio corporal |
| `Funcional` | "Patio funcional" | `#5ad8c8` | Core, estabilidad y patrones |

Cada zona tiene:
- `banner` — imagen de fondo de la zona para el hero del mapa.
- `daily` — imagen del ejercicio diario recomendado de esa zona.
- `icon` — ícono PNG de 16px para el selector de zona.

### 3.4 Afinidad de clase (`CLASS_AFFINITY`)

```js
const CLASS_AFFINITY = {
  GUERRERO: ["Fuerza", "Calistenia", "Funcional"],
  ARQUERO:  ["Cardio", "HIIT", "Funcional"],
  MAGO:     ["Flexibilidad", "Funcional"],
  DEFAULT:  ["Funcional"],
};
```

Las zonas afines a la clase del héroe aparecen primero en el selector de zonas y se destacan visualmente. El texto de la cabecera adapta su copy al héroe:

```js
const CLASS_COPY = {
  GUERRERO: {
    title: "Forja fuerza real",
    lead:  "Tu campo prioriza empuje, piernas y trabajo funcional. Menos ruido, mas progreso fisico con pinta de aventura.",
    focus: "Fuerza, calistenia y control del cuerpo.",
  },
  ARQUERO: {
    title: "Afina velocidad y resistencia",
    lead:  "El mapa abre rutas mas ligeras y agresivas: cardio, HIIT y movilidad activa para mantener el ritmo arriba.",
    focus: "Pulso, desplazamiento y sesiones agiles.",
  },
  MAGO: {
    title: "Domina control corporal",
    lead:  "Tu ruta mezcla movilidad, respiracion y precision. El objetivo es entrenar sin perder tecnica ni energia mental.",
    focus: "Flexibilidad, core y flujo limpio.",
  },
};
```

### 3.5 Estado del componente principal

```js
const [exercises,         setExercises]       = useState(EXERCISES);        // catálogo
const [selectedZone,      setSelectedZone]     = useState(/* localStorage */); // zona activa
const [search,            setSearch]           = useState("");
const [difficulty,        setDifficulty]       = useState("all");
const [verification,      setVerification]     = useState("all");
const [sortBy,            setSortBy]           = useState("recommended");
const [favoriteIds,       setFavoriteIds]      = useState(/* localStorage */);
const [detailExercise,    setDetailExercise]   = useState(null);  // vista de detalle
const [sessionExercise,   setSessionExercise]  = useState(null);  // sesión activa
const [xpToast,           setXpToast]          = useState(null);  // popup de XP ganado
const [quickForge,        setQuickForge]       = useState([]);    // cola de ejercicios
const [showWorldCatalog,  setShowWorldCatalog] = useState(false);
const [mobileFiltersOpen, setMobileFiltersOpen]= useState(false);
```

### 3.6 Filtros y ordenación

El catálogo se puede filtrar por:
- **Zona** — 7 zonas + "Todos".
- **Búsqueda** — texto libre contra nombre y músculos.
- **Dificultad** — Principiante / Intermedio / Avanzado / Elite.
- **Verificación** — Camara / Timer / YogaHold / Manual.
- **Ordenación** — "recommended" (afinidad de clase primero), "xp" (mayor XP arriba), "completadas" (más realizados).

Favoritos persistidos en `localStorage["uex:favorites"]` — array de IDs. La zona seleccionada también persiste en `localStorage["uex:selected-zone"]`.

### 3.7 Carga desde Firebase (fallback dinámico)

```js
const loadFirebaseExercises = async () => {
  const token = await user.getIdToken();
  const [ejRes, catRes] = await Promise.all([
    getEjerciciosPublicos(token),   // ejercicios del backend
    getCategoriasPublicas(token),   // mapa de categorías
  ]);
  // Construye catMap: categoryId → categoryName
  // Recupera historial de completados del usuario desde Firestore
  // Fusiona los ejercicios del backend con los estáticos
};
```

Los ejercicios del backend reemplazan a los estáticos si hay coincidencia de IDs. Si el backend no está disponible, los 20 estáticos funcionan como fallback completo.

El historial de completados del usuario se lee de Firestore (`collection(db, "userSessions")`) y se cruza con los ejercicios para mostrar el contador de veces completado actualizado.

### 3.8 Vista de detalle del ejercicio

Al hacer click en un ejercicio, `setDetailExercise(exercise)` abre la vista de detalle que muestra:
- **Banner de zona** — imagen de fondo de la zona del ejercicio.
- **Anatomía** — imagen PNG específica por zona (`/exercises/detail/anatomy-fuerza.png`, etc.)
- **Nivel** — badge de dificultad con imagen (`/exercises/detail/level-principiante.png`, etc.)
- **Equipamiento** — chips con iconos de lo que necesita (`bodyweight`, `mat`, `bar`, `timer`, `camera`).
- **Verificación** — chip con el método (`/exercises/chips/chip-camera.png`, etc.)
- **Músculos** — lista de grupos musculares trabajados.
- **Boss Crest** — si el ejercicio tiene una boss battle asociada, muestra el emblema del jefe.
- **Botón de inicio** — lanza la sesión activa o la boss battle.

### 3.9 Boss Battle desde ejercicios

```js
// Al iniciar un ejercicio que tiene boss battle:
const launchBossBattle = (exercise, bossConfig) => {
  const transferData = {
    key:        bossConfig.key,
    exercise,
    bossConfig,
    title:      bossConfig.title,
    subtitle:   `Zona ${exercise.cat}`,
    crest:      BOSS_CREST_ASSET[bossConfig.key] || BOSS_CREST_ASSET.default,
    zoneIcon:   exercise.cat,
    tone:       bossConfig.tone || cls.accent,
    summary:    bossConfig.summary,
  };

  // Intenta navegación interna con state
  navigate(`/dashboard/boss/${bossConfig.key}`, { state: { bossBattle: transferData, sourceTab: "ejercicios" } });
};
```

Si el ejercicio tiene `bossConfig`, se navega a `UserBossBattleArena`. Los datos se transfieren via `location.state`. Como respaldo para nueva pestaña, se guarda en `localStorage["fv_boss_transfer"]`.

### 3.10 Recepción de recompensas cross-tab

Al volver de una Boss Battle, el ejercicio actualiza su contador de `completadas` por dos caminos:

**Camino 1 — Misma pestaña** (sessionStorage):
```js
useEffect(() => {
  const rawReward = window.sessionStorage.getItem("uex:last-boss-reward");
  if (!rawReward) return;
  window.sessionStorage.removeItem("uex:last-boss-reward");
  const reward = JSON.parse(rawReward);
  setExercises(current => current.map(ex =>
    ex.id === reward.exerciseId ? { ...ex, completadas: ex.completadas + 1 } : ex
  ));
  queueXpToast(`+${reward.xpGanado} XP de jefe`, 2400);
  window.dispatchEvent(new CustomEvent("exerciseCompleted"));
}, []);
```

**Camino 2 — Nueva pestaña** (storage event de localStorage):
```js
window.addEventListener("storage", (e) => {
  if (e.key !== "fv_boss_reward" || !e.newValue) return;
  localStorage.removeItem("fv_boss_reward");
  applyBossReward(e.newValue);
});
```

El evento `storage` sólo se dispara en pestañas distintas a la que escribió, por lo que funciona perfectamente para el flujo de nueva pestaña.

### 3.11 Chat deeplink — abrir ejercicio desde el chat

```js
const consumeChatDeepLink = (payload) => {
  if (!payload) return false;
  const section = String(payload.section || "").toLowerCase();
  if (section !== "ejercicios") return false;
  const exerciseId = payload.exerciseId || payload.entityId;
  const exercise = exercises.find(e => e.id === exerciseId);
  if (!exercise) return false;
  setDetailExercise(exercise);  // abre la vista de detalle directamente
  return true;
};

// Escucha el evento del chat
window.addEventListener("chatGameplayLink", (event) => {
  if (consumeChatDeepLink(event.detail)) {
    window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY);
  }
});
```

Cuando un amigo comparte un ejercicio en el chat (mediante un CTA de tipo "exercise"), el evento `chatGameplayLink` llega a `UserEjercicios` y abre directamente la vista de detalle de ese ejercicio — sin que el usuario tenga que buscar o navegar manualmente.

### 3.12 Sesión activa — el motor de ejercicio

Cuando el usuario inicia una sesión (`setSessionExercise(exercise)`), se monta un modal/pantalla de sesión que contiene:

**Estado de la sesión:**
```js
const [usarCamara,  setUsarCamara]  = useState(isCamara && !!detector);
const [cameraError, setCameraError] = useState(false);
const [showCamTip,  setShowCamTip]  = useState(() => isCamara && !!detector && needsCameraTip(nombre));
const [phase,       setPhase]       = useState("ready");     // ready | active | rest | done
const [serieAct,    setSerieAct]    = useState(1);
const [repsHechas,  setRepsHechas]  = useState(0);
const [timerSec,    setTimerSec]    = useState(duracion || 30);
const [restSec,     setRestSec]     = useState(0);
const [xpEarned,    setXpEarned]    = useState(0);
```

**Fases de la sesión:**
1. `ready` — pantalla de preparación, muestra las instrucciones y activa la cámara si aplica.
2. `active` — ejercicio en curso. Si es `Camara`/`YogaHold`, `PoseCamera` detecta reps o postura. Si es `Timer`, cuenta regresiva. Si es `Manual`, el usuario hace click cuando termina.
3. `rest` — descanso entre series. Cuenta regresiva de segundos.
4. `done` — sesión completada. Muestra XP ganado, llama a `completarSesion(token, {...})` en el backend, dispara `xpToast`.

**Integración de PoseCamera:**
```jsx
<PoseCamera
  exerciseName={exercise.nombre}
  onRep={() => {
    repsHechasRef.current += 1;
    setRepsHechas(repsHechasRef.current);
    if (repsHechasRef.current >= exercise.reps) finishSerieRef.current();
  }}
/>
```

`PoseCamera` llama `onRep()` cada vez que detecta una repetición completa mediante análisis de poses con MediaPipe. La referencia `finishSerieRef.current` (en lugar de una función directa) evita closures obsoletas dentro del callback de la cámara.

### 3.13 Assets visuales del campo

| Grupo | Rutas | Uso |
|---|---|---|
| Escenas del héroe | `/exercises/hero/training-scene-warrior.png` etc. | Fondo de la sección por clase |
| Glow del suelo | `/exercises/hero/hero-floor-glow-warrior.png` etc. | Efecto de luz bajo el héroe |
| Anatomía | `/exercises/detail/anatomy-fuerza.png` etc. | Diagrama en vista de detalle |
| Nivel | `/exercises/detail/level-principiante.png` etc. | Badge visual de dificultad |
| Equipamiento | `/exercises/detail/equipment-bodyweight.png` etc. | Chips de lo necesario |
| Verificación | `/exercises/chips/chip-camera.png` etc. | Indicador del método |
| Boss crests | `/bosses/crests/boss-resistencia.png` etc. | Emblema del jefe por zona |
| Estados vacíos | `/exercises/states/state-empty-library.png` etc. | Pantallas cuando no hay contenido |
| Banners de zona | `/exercises/zones/zone-fuerza-banner.png` etc. | Fondo de cabecera de zona |

---

## Resumen de valor por archivo

| Archivo | Rol en el sistema | Qué le da al usuario |
|---|---|---|
| `UserDashboard` | Orquestador central de 13 sub-páginas | Un cuartel general RPG que cambia de color según su clase, con 7 fuentes de datos paralelas, navegación entre secciones sin recargas, ceremonia de level-up, bonus diario y notificaciones visuales temáticas |
| `UserDonaciones` | Tienda de apoyo voluntario con estética JRPG gótica | Un espacio donde apoyar la plataforma se siente como un gesto de héroe: corazones flotantes, feed de donantes con nombres RPG, tiers de apoyo con cards animadas y cooldown visual sin presión de venta |
| `UserEjercicios` | Campo de entrenamiento con verificación por IA | Siete zonas de combate temáticas, ejercicios verificados por cámara con análisis de poses en tiempo real, batallas de jefe para los retos más duros, y progreso cross-tab que sincroniza entre pestañas en tiempo real |

---

*Documentación generada para tesis — ForgeVenture 2026*
