# 12 · pages/user — UserPersonaje · UserRutinas · UserSalud / UserSaludLanding

Carpeta: `frontend/src/pages/user/`
Archivos cubiertos: `UserPersonaje.jsx`, `UserRutinas.jsx`, `UserSalud.jsx`, `UserSaludLanding.jsx`

---

## 1. UserPersonaje.jsx

### 1.1 Propuesta de valor

UserPersonaje convierte los datos de entrenamiento del usuario en una identidad visual viva: un personaje animado pixel-art cuya etapa, apariencia y estadísticas reflejan el progreso real acumulado. El usuario no ve solo números —ve a su personaje evolucionar de "Primer impulso" a "Leyenda activa", con skin equipada, anillos de clase, árbol de habilidades y medallas de logro. La vista es la fusión entre un RPG de progreso genuino y un panel de rendimiento: cada estadística tiene un origen real (o una estimación honestamente marcada), cada fase de progreso se puede explorar con tarjetas interactivas con efecto flip, y el personaje reacciona a la hora del día, a la racha activa y a las acciones recientes. Es el espejo del atleta como build viva, no como ficha estática.

---

### 1.2 Imports

```js
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth } from "../../firebase";
import { getUserStats } from "../../services/api.js";
import SkillTree from "../../components/shared/SkillTree.jsx";
import { USER_CLASS_THEME as CLASS_THEME } from "./userClassTheme.js";
import { useLang } from "../../lang/useLang.jsx";
import {
  getFrameCount, getFramePath, getFps, getSkinPreview
} from "../../avatar/SpriteMap.js";
import {
  AVATARS_CATALOG, FRAMES_CATALOG, getAvatarImage
} from "../../avatar/AvatarCatalog.js";
```

Sin imports externos de terceros. Sistema propio de sprite, avatares y i18n.

---

### 1.3 Constantes de módulo

#### STAGES — 5 etapas de evolución

| id | min | max | label | Descripción resumida |
|---|---|---|---|---|
| 1 | 1 | 4 | Primer impulso | La base se está forjando |
| 2 | 5 | 9 | Forma creciente | Ya se nota avance físico |
| 3 | 10 | 19 | Presencia marcada | El personaje deja de ser promesa |
| 4 | 20 | 29 | Dominio visible | Tu progreso ya pesa |
| 5 | 30 | 999 | Leyenda activa | Sostienes una identidad, no solo entrenas |

#### CLASS_COPY — copy narrativo por clase

```js
const CLASS_COPY = {
  GUERRERO: {
    title:  "Forja fuerza, presencia y dominio sin perder técnica limpia.",
    lead:   "...",
    flavor: "Fuerza, calistenia y control de carga...",
    zone:   "Bastión de fuerza",
  },
  ARQUERO: { title: "Sostiene ritmo, velocidad y precisión...", zone: "Ruta de precisión" },
  MAGO:    { title: "Convierte enfoque, respiración y técnica...", zone: "Cámara de foco" },
  DEFAULT: { title: "Lee tu progreso como una build viva...",    zone: "Portada del héroe" },
};
```

#### CLASS_SKILL_HINTS — orientación de árbol de habilidades

```js
const CLASS_SKILL_HINTS = {
  GUERRERO: {
    recommendation: "Prioriza fuerza, control de carga y nodos...",
    nodes: "Fuerza base, constancia de combate y recuperación de impacto.",
  },
  ARQUERO: {
    recommendation: "Te conviene abrir nodos de ritmo, precisión...",
    nodes: "Velocidad limpia, cardio táctico y movilidad sostenida.",
  },
  MAGO: {
    recommendation: "Invierte primero en foco, técnica y precisión...",
    nodes: "Respiración guiada, precisión técnica y recuperación mental.",
  },
};
```

#### SKIN_META — metadatos de skins disponibles

```js
const SKIN_META = {
  default:   { name: "Flex original",    rarity: "Común",  origin: "Carga base del gremio",     type: "Cosmetico" },
  guerrero:  { name: "Forja de guerra",  rarity: "Raro",   origin: "Skin del guardarropa",       type: "Cosmetico" },
  caballero: { name: "Caballero activo", rarity: "Épico",  origin: "Skin especial del héroe",    type: "Cosmetico" },
};
```

#### JOURNAL_MEDALS — 4 medallas con lógica derivada

```js
const JOURNAL_MEDALS = [
  { key: "first",  name: "Primera marca", asset: "/logros/medals/medal-first-blood.png",
    state: ctx => ({ done: ctx.sesiones >= 1,  progress: ctx.sesiones >= 1 ? "Activa" : "1 sesión" }) },
  { key: "streak", name: "Ritmo firme",   asset: "/logros/medals/medal-streak-master.png",
    state: ctx => ({ done: ctx.streak >= 7,    progress: `${Math.min(ctx.streak, 7)}/7` }) },
  { key: "mind",   name: "Pulso mental",  asset: "/logros/medals/medal-mind-keeper.png",
    state: ctx => ({ done: ctx.logros >= 3,    progress: `${Math.min(ctx.logros, 3)}/3` }) },
  { key: "social", name: "Sello visible", asset: "/logros/medals/medal-social-mark.png",
    state: ctx => ({ done: ctx.level >= 12,    progress: `${Math.min(ctx.level, 12)}/12` }) },
];
```

#### Otras constantes

```js
const TAB_STORAGE_KEY   = "fv-user-personaje-tab";
const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";

const STAGE_CLASS_ASSET = {
  GUERRERO: "/ui/shop/hero/shop-stage-warrior.png",
  ARQUERO:  "/ui/shop/hero/shop-stage-archer.png",
  MAGO:     "/ui/shop/hero/shop-stage-mage.png",
  DEFAULT:  "/ui/shop/hero/shop-stage-default.png",
};
```

---

### 1.4 CSS interno (prefijo `up2-`)

El CSS está inyectado con `<style>{PAGE_CSS}</style>` como template literal, con valores de color dinámicos interpolados.

#### Variables CSS de clase

```css
--hero-accent    /* color primario de clase */
--hero-secondary /* color secundario */
--hero-bg        /* fondo de clase */
--hero-soft      /* versión suavizada */
```

Toda la paleta usa `color-mix(in srgb, var(--hero-accent), transparent N%)` para gradientes y glow effects.

#### Animaciones clave

| Nombre | Función |
|---|---|
| `up2Drift` | Partículas de chispas flotando |
| `up2Float` | Personaje levitando suavemente |
| `up2Glow` | Pulso luminoso del panel |
| `up2Sweep` | Shimmer deslizándose sobre la barra XP |
| `up2Pulse` | Pulsación del anillo de etapa |
| `up2Ring` | Expansión del anillo al entrar |

#### Layout principal

| Clase | Grid |
|---|---|
| `.up2-hero` | `grid-template-columns: 1.06fr / .94fr` — personaje izquierda, meta derecha |
| `.up2-meta-grid` | `repeat(4, 1fr)` — 4 KPIs bajo el héroe |
| `.up2-stage-card` | min-height 420px — tarjeta principal de etapa |
| `.up2-main-grid` | `1.08fr 1.12fr .9fr` — 3 columnas en sección de estadísticas |
| `.up2-journey` | `repeat(5, 1fr)` — 5 fases de progreso en fila |
| `.up2-journey::before` | línea de conexión entre fases con gradiente |
| `.up2-loadout` | `repeat(3, 1fr)` — 3 slots de equipamiento |
| `.up2-compact-grid` | `repeat(2, 1fr)` — stats secundarias |
| `.up2-journey-marks` | `repeat(4, 1fr)` — 4 medallas |

#### Flip cards de fase

Las 5 tarjetas de etapa usan `perspective: 720px` + `transform-style: preserve-3d`. Al hacer hover, `.up2-flip-inner` hace `rotateY(180deg)` en 0.54s con `cubic-bezier(.22,1,.36,1)`. La cara posterior muestra detalles del rango de nivel y el hito de etapa.

#### Badge de avatar incrustado

`.up2-stage-avatar-badge`: 88×88px en la esquina inferior derecha del frame del personaje, mostrando el avatar equipado con su marco.

---

### 1.5 Firma del componente y estado

```jsx
export default function UserPersonaje({ profile = {} }) {
  const { t } = useLang();

  // Tabs: "personaje" | "habilidades"
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem(TAB_STORAGE_KEY);
    return stored === "habilidades" ? "habilidades" : "personaje";
  });

  const [stats, setStats]           = useState(null);       // datos del API
  const [loading, setLoading]       = useState(true);
  const [viewedPhase, setViewedPhase] = useState(null);     // fase seleccionada en journey
  const [frameIdx, setFrameIdx]     = useState(0);          // frame actual del sprite
  const [msg, setMsg]               = useState(null);       // texto del burbuja de contexto
  const [msgVisible, setMsgVisible] = useState(false);
  const [levelUpAnim, setLevelUpAnim] = useState(false);    // animación de subida de nivel
  const [clickRipple, setClickRipple] = useState(false);
  const [isTired, setIsTired]       = useState(false);      // estado de fatiga del personaje
  const [heroImgError, setHeroImgError] = useState(false);
  const [assetErrors, setAssetErrors]   = useState({});

  const prevStageRef    = useRef(null);   // etapa anterior para detectar subida
  const msgTimer        = useRef(null);   // timeout del mensaje de burbuja
  const frameTimer      = useRef(null);   // interval de animación del sprite
  const refreshTimer    = useRef(null);   // timeout del refresco silencioso
```

---

### 1.6 API y efectos

#### `refreshStats({ silent })`

```js
const refreshStats = async ({ silent = true } = {}) => {
  const user = auth.currentUser;
  if (!user) { if (!silent) setLoading(false); return; }
  if (!silent) setLoading(true);
  const token = await user.getIdToken();
  const res   = await getUserStats(token);
  applyStatsSnapshot(res?.stats || {});
};
```

- Llama al endpoint `/api/user/stats` a través del servicio `getUserStats`.
- Usa `applyStatsSnapshot` que hace `mergeDefined` para aplicar solo los campos no-undefined.
- `scheduleRefresh(delay)` retrasa el refresco silencioso (default 240ms) usando `setTimeout`.

#### Efectos principales

| Efecto | Trigger | Acción |
|---|---|---|
| Carga inicial | mount | `refreshStats({ silent: false })` |
| `skinChanged` event | window event | actualiza `stats.activeSkin`, llama `scheduleRefresh` |
| `avatarEquipped` event | window event | parcha `stats` con detalles del avatar |
| Sync de `profile` prop | `profile` change | aplica 14 campos del perfil a `stats` via `mergeDefined` |
| Tab storage | `activeTab` change | guarda en `localStorage[TAB_STORAGE_KEY]` |
| Chat deeplink | `chatGameplayLink` event | lee `CHAT_DEEPLINK_KEY` de sessionStorage y navega al tab |
| Refresh masivo | 10 eventos del sistema | scheduling de refresh 120ms tras cualquier evento de gameplay |

#### Eventos escuchados (10)

```
skillUnlocked, exerciseCompleted, misionCompleted, logroUnlocked,
levelUp, streakUpdated, itemUsed, skinChanged, avatarEquipped,
avatarPurchased, focus (window), visibilitychange (document)
```

---

### 1.7 Valores computados

#### Datos directos de stats

```js
const level     = stats?.nivel      ?? profile.level      ?? 1;
const xp        = stats?.xp         ?? profile.xp         ?? 0;
const xpNext    = stats?.xpNext     ?? profile.xpNext     ?? 100;
const xpTotal   = stats?.xpTotal    ?? profile.xpTotal    ?? xp;
const streak    = stats?.streak     ?? profile.streak     ?? 0;
const rachaMax  = stats?.rachaMax   ?? streak;
const sesiones  = stats?.sesionesTotales   ?? 0;
const logros    = stats?.logrosObtenidos   ?? 0;
const weeklyXP  = stats?.weeklyXP         ?? 0;
const coins     = profile?.coins   ?? stats?.coins   ?? 0;
const gems      = profile?.gems    ?? stats?.gems    ?? 0;
const misiones  = stats?.misionesCompletadas ?? 0;
const calorias  = stats?.calorias ?? 0;
const skillPoints = stats?.skillPoints ?? profile?.skillPoints ?? 0;
```

Tiempo total: formateado a `"Xh Ym"` si ≥ 60 min, sino `"X min"`.

#### Estadísticas primarias — `primaryStats` (useMemo)

4 stats con valor real del API o estimado vía fórmula:

| key | label | Fórmula de estimación | Tono |
|---|---|---|---|
| fuerza | Fuerza | `level * 2 + sesiones * 0.12` | `#e85d75` |
| resistencia | Resistencia | `level * 1.8 + streak * 0.5` | `theme.secondary` |
| agilidad | Agilidad | `level * 1.5 + xpPct * 0.3` | `#8ac926` |
| disciplina | Disciplina | `streak * 2 + logros * 0.5` | `#c08aff` |

Cada stat lleva `estimated: true` si viene de fórmula, no del API. Se marca visualmente con `.up2-tag.is-estimate`.

#### Estadísticas secundarias — `secondaryStats` (useMemo)

4 stats adicionales también con origen real/estimado:

| key | label | Fórmula de estimación | Tono |
|---|---|---|---|
| hip | Hipertrofia | `sesiones * 0.2 + level * 1.5` | `#ff7a5c` |
| tec | Técnica | `weeklyXP / 50 + level * 1.2` | `#4cc9f0` |
| rec | Recuperación | `streak * 1.5 + level * 1.8` | `#8ac926` |
| mov | Movilidad | `level * 1.8 + logros * 0.5` | `#c08aff` |

#### `buildSummary` (useMemo)

```js
const buildSummary = {
  title: `${classBadge.label}: ${strongestPrimary.label} al frente`,
  lead:  `${strongestPrimary.label} y ${strongestSecondary.label} son las piezas que más empujan...`,
  note:  `Si mantienes este ritmo, ${currentStage.label} sigue consolidando...`,
};
```

Calcula el stat primario y secundario más alto para generar un resumen narrativo de la build.

#### `etaDays` (useMemo)

Estima días hasta la siguiente etapa:
```js
const avgDaily   = weeklyXP / 7;
const levelsLeft = Math.max(nextStage.min - level, 0);
const xpNeeded   = Math.max(levelsLeft * 120 - xp, 0);
return Math.ceil(xpNeeded / avgDaily);  // null si no aplica
```

#### `medalCards` (useMemo)

Cada una de las 4 medallas de `JOURNAL_MEDALS` calcula:
- `visualState`: `"completed"` | `"secret"` | `"progress"`
- La medalla "social" (level ≥ 12) se oculta como "Sello sellado" si level < 6
- `frameAsset`: PNG de marco según estado
- `displayState`: texto de progreso o "Completada" / "Secreta"

#### `tabs` (useMemo)

```js
const tabs = [
  { id: "personaje",    label: t("pe.tab.personaje") || "Personaje" },
  { id: "habilidades",  label: t("pe.tab.habilidades") || "Habilidades",
    badge: skillPoints > 0 ? skillPoints : null },
];
```

La insignia numérica del tab "Habilidades" es la cantidad de puntos de habilidad sin gastar.

#### `stageTone` (useMemo) — mensaje contextual

```js
if (levelUpAnim) return "Subida reciente: el brillo del personaje sigue encendido.";
if (streak === 0) return "Hoy la escena baja un poco. Un entrenamiento basta para volver a activarla.";
if (streak >= 14) return "Racha alta. El tablero está leyendo un héroe muy estable.";
if (streak >= 7)  return "Buen ritmo. Tu build ya tiene una presencia clara en el mapa.";
return "La forma sigue viva. Mantener sesiones cortas pero limpias sostendrá esta ruta.";
```

#### `popContextMessage` — pool de mensajes por modo

4 modos con 3-4 mensajes cada uno: `tired`, `excited`, `levelup`, `idle`. El idle incluye `getTimeTone()`, `classCopy.flavor` y `stageTone`.

---

### 1.8 Sistema de sprite (SpriteMap)

```js
const heroAnimState  = getHeroAnimState({ isTired, levelUpAnim });
const heroFrameCount = getFrameCount(heroAnimState);
const heroFrame      = getFramePath(heroAnimState, frameIdx, activeSkinId);
```

- `getHeroAnimState` devuelve `"tired"`, `"levelup"` o el estado base según flags.
- `getFrameCount` da el número de frames de la animación para el estado.
- `getFramePath` construye la ruta al PNG del frame: `/avatars/{skin}/{state}_{idx:02}.png`.
- `getSkinPreview` da la imagen estática de preview de la skin para el slot de loadout.
- `getFps` da los FPS de la animación (usado en `frameTimer`).

---

### 1.9 Sub-componentes y secciones del layout

| Sección | Descripción |
|---|---|
| Hero panel izquierdo | Stage card con personaje animado, anillo de clase, burbuja de mensaje, badge de avatar, pin de crest, marca de stage |
| Meta panel derecho | 4 KPIs en grid, barra XP, strip card de level/streak, stage footer 1.2fr/.8fr |
| Journey 5 fases | Grid horizontal con flip cards; la fase actual tiene `is-current`, futuras tienen `is-locked` |
| Main grid 3 cols | Estadísticas primarias + secundarias + zona de skills/loadout |
| Progress bars | `.up2-meter` con bar-track-tile.png de fondo + bar-fill-tile.png + bar-shine-tile.png |
| Build summary | Panel con título narrativo, lead y nota de etapa |
| Medallas | Grid 4 cols, estados completed/progress/secret |
| Loadout slots | 3 slots: avatar, skin, frame — tooltips en hover via `data-tooltip` + `::after` |
| Skill Tree | `<SkillTree>` component con hints de clase y skill points disponibles |

---

### 1.10 Resumen técnico

| Propiedad | Valor |
|---|---|
| Componente | `UserPersonaje({ profile = {} })` |
| CSS prefix | `up2-` |
| API llamada | `getUserStats(token)` → `/api/user/stats` |
| Storage | `fv-user-personaje-tab` (localStorage) |
| Session storage | `fv-chat-deeplink-v1` (deeplinks del chat) |
| Sub-components externos | `SkillTree` |
| Librerías avatar | `SpriteMap.js`, `AvatarCatalog.js` |
| Etapas de personaje | 5 (niveles 1-4 / 5-9 / 10-19 / 20-29 / 30+) |
| Stats primarias | 4 (fuerza, resistencia, agilidad, disciplina) |
| Stats secundarias | 4 (hipertrofia, técnica, recuperación, movilidad) |
| Medallas | 4 (JOURNAL_MEDALS con lógica derivada) |
| Tabs | 2 (Personaje, Habilidades) |
| Eventos escuchados | 12 eventos del sistema de juego |
| i18n | `useLang()` para labels de tabs |

---

---

## 2. UserRutinas.jsx

### 2.1 Propuesta de valor

UserRutinas es el sistema de entrenamiento completo de ForgeVenture: no un catálogo de ejercicios, sino un tablero inteligente que elige, organiza y activa la sesión óptima del día. El usuario entra y el sistema ya sabe qué hacer: considera su clase, la hora, su historial reciente, fatiga por zona, preferencias guardadas y rutinas asignadas para presentar una recomendación concreta. Desde ahí puede explorar el mapa de territorios (cada categoría es una zona geográfica de entrenamiento), filtrar y ordenar rutinas, o lanzar directamente la sesión. Durante la sesión, si el ejercicio lo permite, PoseCamera activa detección de pose por IA en tiempo real. Al terminar, la rutina queda registrada con XP, tiempo real y series, y el tablero actualiza progreso de la semana en vivo.

---

### 2.2 Imports notables

```js
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";          // modales con portal
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore"; // acceso DIRECTO a Firestore
import { auth, db } from "../../firebase";
import { getRutinasPublicas, completarRutina } from "../../services/api.js";
import PoseCamera from "../../components/exercise/PoseCamera.jsx";
import { getExerciseDetector, needsCameraTip } from "../../components/exercise/exerciseLogic.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
```

Lucide icons: `Activity, AlertTriangle, Check, ChevronRight, Clock, Flame, Heart, LayoutGrid, LayoutList, Search, Star, Trophy, X`.

---

### 2.3 Constantes de módulo

#### localStorage keys

```js
const SORT_KEY           = "ur-sort";
const VIEW_KEY           = "ur:view";
const FAVORITES_KEY      = "ur:favorites";
const TERRITORY_PREF_KEY = "ur:territory-pref";
const SESSION_PREF_KEY   = "ur:session-pref";
```

#### Dificultades y colores

```js
const DIFICULTAD_COLOR = {
  Principiante: "#7bdc3b",
  Intermedio:   "#f3c969",
  Avanzado:     "#ff8659",
  Elite:        "#ff4d5e",
};
```

#### Stage art por clase

```js
const RUTINA_STAGE_ART = {
  GUERRERO: { scene: "/exercises/hero/training-scene-warrior.png", glow: ".../hero-floor-glow-warrior.png" },
  ARQUERO:  { scene: "/exercises/hero/training-scene-archer.png",  glow: ".../hero-floor-glow-archer.png"  },
  MAGO:     { scene: "/exercises/hero/training-scene-mage.png",    glow: ".../hero-floor-glow-mage.png"    },
  DEFAULT:  { scene: "/exercises/hero/training-scene-default.png", glow: ".../hero-floor-glow-default.png" },
};
```

#### Daily reward assets

```js
const RUTINA_DAILY_ASSETS = {
  state:  {
    idle:    "/exercises/daily/daily-state-untrained.png",
    active:  "/exercises/daily/daily-state-training.png",
    cleared: "/exercises/daily/daily-state-cleared.png",
  },
  reward: {
    xp:        "/exercises/daily/daily-reward-xp.png",
    claimed:   "/exercises/daily/daily-reward-claimed.png",
    chest:     "/routines/daily/daily-reward-chest.png",
    token:     "/routines/daily/daily-reward-token.png",
    classBonus:"/routines/daily/daily-reward-class-bonus.png",
  },
};
```

#### Modal assets (anatomía, dificultad, equipamiento)

```js
const RUTINA_MODAL_ASSETS = {
  anatomy:    { fuerza:"...", cardio:"...", flexibilidad:"...", funcional:"...", general:"..." },
  difficulty: { principiante:"...", intermedio:"...", avanzado:"...", elite:"..." },
  equipment:  { bodyweight:"...", timer:"...", camera:"...", mixed:"..." },
};
```

#### Músculos por categoría

```js
const CATEGORY_MUSCLES = {
  fuerza:       "Pecho · espalda · brazos",
  calistenia:   "Pecho · tríceps · core",
  hipertrofia:  "Músculos principales",
  funcional:    "Cuerpo completo",
  cardio:       "Piernas · sistema cardiovascular",
  hiit:         "Cuerpo completo",
  flexibilidad: "Cadera · piernas · espalda",
  yoga:         "Flexibilidad · postura",
  pilates:      "Core · pelvis · espalda",
  movilidad:    "Articulaciones · control",
  recuperacion: "Movilidad suave · descarga",
};
```

#### Rest tips

5 consejos para descanso entre series (consejo aleatorio durante la sesión).

#### UI color tokens (objeto `UI`)

```js
const UI = {
  text: "#f0e8ff", muted: "#9b8ab5", deepMuted: "#5c4f78",
  gold: "#f3c969", success: "#80d39b", danger: "#ff6f7d",
  cyan: "#5ad8ff", accent: "#c08aff",
  // ...surface colors para cards/borders/backgrounds
};
```

---

### 2.4 CSS interno (prefijo `urt-`)

#### Variables CSS de clase

```css
--class-accent     /* color primario de clase */
--class-secondary  /* color secundario */
--class-bg         /* fondo de clase */
--status-color     /* color del estado actual de sesión */
```

#### Animaciones clave

| Nombre | Función |
|---|---|
| `ur-xpPop` | Notificación de XP al completar rutina |
| `ur-float` | Personaje de stage flotando |
| `ur-modalIn` | Entrada del modal de detalle |
| `ur-sheetIn` | Entrada del sheet de sesión |
| `ur-lineScroll` | Scroll de texto largo en cards |

#### Layout principal

| Clase | Grid / descripción |
|---|---|
| `.urt-hero` | `grid: 1.08fr / .92fr` — escena izquierda, panel derecho |
| `.urt-stage` | min-height 280px, capa `<video>` de fondo |
| `.urt-stage-table` | Panel glassmorphic en el lado derecho del héroe |
| `.urt-hero-kpis` | `repeat(4, 1fr)` — 4 KPIs bajo el héroe |
| `.urt-grid-2` | `minmax(0, 1.05fr) minmax(340px, .95fr)` — contenido + sidebar |
| `.urt-summary-grid` | `repeat(3, 1fr)` — 3 cards de resumen de bitácora |
| `.urt-map-track` | `repeat(12, 1fr)` — grid de territorios (cards de `span 4`) |
| `.urt-chart-stage` | min-height 220px — área del gráfico semanal |
| `.urt-chart-cols` | `repeat(7, 1fr)` — 7 columnas para los días de la semana |

#### Bitácora cards

`.urt-bitacora-card` usa `--group-color` para glow y border. `.urt-bitacora-metric` muestra tooltip en hover via `.urt-bitacora-tip` con `opacity: 0 → 1` y `transform: translateY(4px) → 0`.

#### Territory map cards

`.urt-map-card` usa `--territory-color` y `--territory-banner` (imagen CSS). La clase `.is-active` añade border y shadow del `--class-accent`. Cada card tiene:
- `.urt-map-banner`: min-height 118px con background image
- `.urt-map-crest`: 54×54px badge con icon del territorio
- `.urt-map-flag`: pill con color del territorio

---

### 2.5 Firma del componente y estado

```jsx
export default function UserRutinas({ profile, onNavigate }) {
  const isMobile = useIsMobile();
  const [rutinas, setRutinas]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [user, setUser]                   = useState(null);    // Firebase auth user
  const [tab, setTab]                     = useState(/* "mis" | "todas" */);
  const [search, setSearch]               = useState("");
  const [filterDif, setFilterDif]         = useState("all");
  const [filterHoy, setFilterHoy]         = useState(false);
  const [sortMode, setSortMode]           = useState(/* "default"|"hoy"|"xp"|"menosCompl"|"duracion" */);
  const [viewMode, setViewMode]           = useState(/* "cards" | list */);
  const [favoriteIds, setFavoriteIds]     = useState([]);
  const [detalleRut, setDetalleRut]       = useState(null);   // rutina en modal de detalle
  const [sesionRut, setSesionRut]         = useState(null);   // rutina en sesión activa
  const [xpNotif, setXpNotif]             = useState(null);   // notificación XP
  const [logroNotif, setLogroNotif]       = useState(null);   // notificación logro
  const [completionToast, setCompletionToast] = useState(null); // toast de rutina terminada
  const [camPermError, setCamPermError]   = useState(null);   // "denied" | "error" | null
  const [selectedCat, setSelectedCat]     = useState("");     // territorio seleccionado
  const [preferredTerritory, setPreferredTerritory] = useState("");
  const [preferredSessionType, setPreferredSessionType] = useState("auto"); // "auto"|"manual"|"camera"
```

---

### 2.6 API y efectos

#### Efecto 1 — Firebase auth

```js
useEffect(() => {
  const unsub = onAuthStateChanged(auth, (authUser) => setUser(authUser));
  return () => unsub();
}, []);
```

#### Efecto 2 — Carga dual de rutinas

```js
useEffect(() => {
  if (!user) return;
  const load = async () => {
    setLoading(true);
    // 1. Firestore directo: progreso personal del usuario
    const progressRef  = collection(db, "users", user.uid, "progress");
    const progressSnap = await getDocs(progressRef);
    const userProgress = {};
    progressSnap.forEach((docSnap) => {
      userProgress[docSnap.id] = docSnap.data();
    });

    // 2. API REST: rutinas públicas del catálogo
    const token    = await user.getIdToken();
    const response = await getRutinasPublicas(token);
    if (response?.rutinas?.length > 0) {
      setRutinas(response.rutinas.map((r) => normalizarRutina(r, userProgress)));
    } else {
      setRutinas(RUTINAS_MOCK.map((r) => normalizarRutina(r)));  // fallback mock
    }
  };
  load();
}, [user]);
```

El `userProgress` del Firestore se pasa a `normalizarRutina` para enriquecer cada rutina con datos reales (completadas, completadaHoy, completadaEstaSemana, weeklyStreak, ultimoCompletado).

#### Efecto 3 — Persistencia de preferencias

Guarda en localStorage todos los filtros, preferencias y favoritos al cambiar.

#### `handleComplete(xp, completedCount, totalCount, sessionData)`

```js
const handleComplete = async (xp, completedCount, totalCount, sessionData = {}) => {
  if (!user || !sesionRut) return;
  // Si el usuario salió antes de completar todos los ejercicios, cierra sin guardar
  if (typeof completedCount === "number" && completedCount < totalCount) {
    setSesionRut(null);
    return;
  }
  const token  = await user.getIdToken();
  const result = await completarRutina(token, {
    rutinaId:      sesionRut.id,
    xpGanado:      xp,
    tiempoRealizado: sessionData.duracionReal || null,
    totalSeries:   sessionData.totalSeries    || null,
  });
  // Actualiza rutina en estado local
  setRutinas((current) =>
    current.map((r) => r.id === sesionRut.id ? { ...r, completadas: ..., completadaHoy: true, ... } : r)
  );
  setSesionRut(null);
  setCompletionToast({ ... });
};
```

---

### 2.7 Sistema de recomendación inteligente

`recommendationModel` (useMemo) puntúa cada rutina del pool:

| Factor | Score |
|---|---|
| Rutina asignada al plan | +12 |
| Activa hoy (en `diasSemana`) | +16 |
| No completada hoy | +8 |
| Completada hoy | -18 |
| Afín a la clase | +12 a +18 (según streak) |
| Coincide con territorio preferido | +10 |
| Coincide con modo de sesión preferido | +4 a +8 |
| Misma rutina que la última | -18 |
| Misma zona que la última | -8 a -20 |
| Fatiga por zona × recencia | -fatigue × 1.8 |
| Post-sesión: zona de recuperación | +18 |
| Post-sesión: ruta corta (≤25 min) | +12 |
| Streak bajo + ruta corta | +8 ("entrada fácil de retomar") |

Output:
```js
{
  ranked: [...],           // todas las rutinas ordenadas por score
  recommended,             // rutina recomendada óptima
  activeEntry,             // entrada rankeada de la recomendada
  lastRoutine,             // última rutina completada
  fatigueByZone,           // mapa de fatiga acumulada por zona
  consecutiveZoneCount,    // cuántas veces seguidas se entrenó la misma zona
}
```

Lógica de selección final: post-sesión → recuperación > corta > mejor overall; sin sesión → asignada hoy > mejor overall.

---

### 2.8 Integración de PoseCamera

Dentro del modal de sesión (`RutinaSessionModal`), en cada paso/ejercicio:

```jsx
{!isTimer && usarCamara && (
  <PoseCamera
    ejercicio={paso}
    targetReps={paso.reps || 1}
    onRepsChange={(count) => setRepsHechas(count)}
  />
)}
```

- `usarCamara`: activo cuando `preferredSessionType === "camera"` o cuando el ejercicio lo requiere.
- `getExerciseDetector(ejercicio)` resuelve el detector de pose (curl, squat, push-up, etc.) según el nombre del ejercicio.
- `needsCameraTip(ejercicio)` devuelve si el ejercicio necesita un tip de posicionamiento de cámara.
- `camPermError` se establece a `"denied"` o `"error"` si falla el permiso de cámara, mostrando un toast informativo.

El modal usa `createPortal(content, document.body)` para renderizar fuera del árbol DOM de la página.

---

### 2.9 Valores computados clave

```js
// Filtros y ordenación
const filtradas        = rutinas.filter(/* dif + search + hoy */);
const misRutinas       = filtradas.filter((r) => r.asignada);
const sortedFuente     = [...fuente].sort(/* por sortMode */);
const grouped          = Map(categoria → [rutinas]);

// Territorios
const territoryCards   = [{ cat:"Todas", ...}, ...grouped]; // "Todas" + categorías
const selectedRoutines = sortedFuente.filter(cat === selectedTerritory.cat);

// KPIs de progreso
const completadasHoy       = rutinas.filter((r) => r.completadaHoy).length;
const completadasEstaSemana= misRutinas.filter((r) => r.completadaEstaSemana).length;
const weekProgressPct      = Math.min((completadasEstaSemana / expectedThisWeek) * 100, 100);
const totalXpEarned        = rutinas.reduce((s, r) => s + r.completadas * r.xpTotal, 0);
const totalMinutes         = rutinas.reduce((s, r) => s + r.completadas * r.duracionMin, 0);
const exploredZones        = new Set(completadas.map((r) => r.categoria)).size;
const clearedRoutes        = rutinas.filter((r) => r.completadas > 0).length;

// Estado de escena
const trainingState = completadasHoy > 0 ? "cleared"
                    : sesionRut        ? "active"
                    : "idle";
```

---

### 2.10 `heroStatus` — mensaje contextual del hero

```js
const heroStatus = loading     ? { Ico: Activity, text: "Sincronizando tablero del gremio..." }
: completadasHoy > 0           ? { Ico: Trophy,   text: "Ya despejaste X rutas hoy." }
: rutinasHoy.length > 0        ? { Ico: Flame,    text: "X rutinas te esperan hoy." }
: /* fallback */                  { Ico: Heart,    text: "El mapa sigue abierto." };
```

---

### 2.11 Resumen técnico

| Propiedad | Valor |
|---|---|
| Componente | `UserRutinas({ profile, onNavigate })` |
| CSS prefix | `urt-` |
| Acceso Firestore directo | `collection(db, "users", uid, "progress")` — getDocs |
| API calls | `getRutinasPublicas(token)`, `completarRutina(token, {...})` |
| localStorage keys | 7 claves (`ur-sort`, `ur:view`, `ur:favorites`, `ur:tab`, `ur:selected-cat`, `ur:territory-pref`, `ur:session-pref`) |
| Sub-componentes | `RutinaDetailModal`, `RutinaSessionModal` (ambos via `createPortal`) |
| AI integración | `PoseCamera` + `getExerciseDetector` + `needsCameraTip` |
| Modales | 2 (detalle + sesión) vía `createPortal` |
| Sistema de recomendación | 12+ factores de scoring, puntos de fatiga por zona |
| Territorios | 12 categorías de ejercicio + "Todas" |
| Dificultades | 4 (Principiante, Intermedio, Avanzado, Elite) |
| Fallback | `RUTINAS_MOCK` si el API falla o no hay rutinas públicas |
| Video layer | `<video>` en el hero stage del personaje |

---

---

## 3. UserSalud.jsx

### 3.1 Descripción

`UserSalud.jsx` es únicamente un archivo barrel (re-export) que redirige la importación al componente real:

```js
// UserSalud.jsx — archivo completo
export { default } from "./UserSaludLanding.jsx";
```

No contiene lógica, estado, ni CSS. Existe para que el router y las importaciones internas puedan apuntar a `UserSalud` sin exponer el nombre interno `UserSaludLanding`. El componente completo vive en `UserSaludLanding.jsx`.

---

---

## 4. UserSaludLanding.jsx

### 4.1 Propuesta de valor

UserSaludLanding no es una guía de salud genérica: es un sistema de bienestar contextual que cambia según quién eres (clase, nivel, racha), qué hora es (mañana/tarde/noche) y qué has hecho hoy (si ya entrenaste, si registraste sueño, cuánta agua llevas). Las 5 pestañas —Base, Movimiento, Respiración, Hidratación, Nutrición— no solo muestran información; tienen un botón de acción que escribe progreso real en el servidor y recompensa con XP. El panel no te dice "bebe más agua": te muestra cuántos vasos llevas hoy, te da un botón para sumar uno, y cuando llegas a la meta te da XP y actualiza tu perfil. Los números de ciencia (30% menos riesgo cardiovascular, 40% mejora de ánimo, 1.5× más longevidad) tienen fuente citada. El sistema inteligente recomienda la pestaña óptima para el momento actual del día, clase y estado de entrenamiento.

---

### 4.2 Imports

```js
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth } from "../../firebase";
import { getSaludSummary, saveSaludCheckin, saveSaludState } from "../../services/api.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
```

Sin librerías externas. CSS propio con prefijo `ush-`.

---

### 4.3 Constantes de módulo

#### TABS — 5 pestañas de salud

```js
const TABS = [
  { id: "general",     label: "Base",        color: "#c08aff",
    kicker: "Visión global",      title: "Base real de bienestar"        },
  { id: "ejercicio",   label: "Movimiento",  color: "#ff6f7d",
    kicker: "Campo físico",       title: "Entrenamiento con estructura"  },
  { id: "respiracion", label: "Respiración", color: "#5ad8ff",
    kicker: "Control del pulso",  title: "Foco y calma aplicados"        },
  { id: "hidratacion", label: "Hidratación", color: "#4cc9f0",
    kicker: "Reserva corporal",   title: "Agua con criterio"             },
  { id: "nutricion",   label: "Nutrición",   color: "#80d39b",
    kicker: "Mesa del héroe",     title: "Comer para avanzar"            },
];
```

#### Cache de cliente

```js
const saludClientCache = new Map();      // uid → { ts, data }
const SALUD_CLIENT_TTL = 45_000;         // 45 segundos
```

#### SCIENCE_FACTS — 4 evidencias

```js
const SCIENCE_FACTS = [
  { value: "30%", title: "menos riesgo cardiovascular",
    source: "OMS | guías globales de actividad física" },
  { value: "40%", title: "mejora del estado de ánimo",
    source: "revisiones sistemáticas en salud mental y ejercicio" },
  { value: "1.5x", title: "más longevidad en activos",
    source: "cohortes poblacionales sobre actividad y mortalidad" },
  { value: "26%", title: "menos riesgo de diabetes tipo 2",
    source: "metaanálisis de intervención en hábitos cardiometabólicos" },
];
```

#### GENERAL_PILLARS — 3 pilares base

```js
const GENERAL_PILLARS = [
  { title: "Movimiento",    stat: "150 min/sem",       color: "#ff6f7d" },
  { title: "Nutrición",     stat: "80% del resultado", color: "#80d39b" },
  { title: "Recuperación",  stat: "7-9 h sueño",       color: "#5ad8ff" },
];
```

#### BREATH_TECHNIQUES — 3 técnicas

```js
const BREATH_TECHNIQUES = [
  { title: "Box breathing",  color: "#5ad8ff", pattern: "4 - 4 - 4 - 4",
    use: "Foco, estrés agudo y antes de sesión exigente." },
  { title: "4-7-8",          color: "#c08aff", pattern: "4 - 7 - 8",
    use: "Antes de dormir o cuando necesitas desacelerar rápido." },
  { title: "Diafragmática",  color: "#80d39b", pattern: "5 - 1 - 6",
    use: "Como respiración base durante el día o entre series." },
];
```

#### HYDRATION_FLOW — 5 momentos del día

```js
const HYDRATION_FLOW = [
  { time: "06:30", qty: "400 ml", label: "Despertar",                   color: "#f3c969" },
  { time: "10:00", qty: "500 ml", label: "Media mañana",                color: "#5ad8ff" },
  { time: "13:00", qty: "400 ml", label: "Almuerzo",                    color: "#80d39b" },
  { time: "17:00", qty: "500 ml", label: "Antes o después de entrenar", color: "#ff6f7d" },
  { time: "20:30", qty: "250 ml", label: "Cierre del día",              color: "#c08aff" },
];
```

#### NUTRITION_BLOCKS — 3 macronutrientes con dosis

```js
const NUTRITION_BLOCKS = [
  { title: "Proteínas",         dose: "1.6 - 2.2 g/kg", color: "#ff6f7d" },
  { title: "Carbohidratos",     dose: "3 - 5 g/kg",     color: "#f3c969" },
  { title: "Grasas saludables", dose: "0.8 - 1.2 g/kg", color: "#5ad8ff" },
];
```

#### CLASS_NUTRITION_HINT — hint por clase

```js
const CLASS_NUTRITION_HINT = {
  GUERRERO: { label: "Prioridad fuerza",    color: "#ff4d5e", icon: "/ui/stat-str.png", text: "Proteína alta y carbohidratos alrededor del entreno..." },
  ARQUERO:  { label: "Balance energético",  color: "#7bdc3b", icon: "/ui/icons/stat-xp.png", text: "Macros equilibrados y comidas regulares..." },
  MAGO:     { label: "Cerebro activo",      color: "#4cc9f0", icon: "/ui/stat-men.png", text: "Grasas de calidad, omega-3 y carbohidratos estables..." },
  DEFAULT:  { label: "Base sólida",         color: "#c08aff", icon: "/ui/stat-men.png", text: "Proteína, carbohidratos acordes al gasto..." },
};
```

#### Otras constantes de contenido

- `DAILY_CHECKS`: 6 hábitos diarios base con color
- `EXERCISE_TYPES`: 4 tipos (Cardio aeróbico, Fuerza, Movilidad, HIIT funcional) con frecuencia y beneficios
- `EXERCISE_PRINCIPLES`: 4 principios (Sobrecarga progresiva, Especificidad, Recuperación real, Consistencia)
- `NUTRITION_MYTHS`: 3 mitos con realidad para flip cards
- `NUTRITION_GOALS`: 3 objetivos (Mantenimiento, Pérdida de grasa, Rendimiento) con accordion
- `TIMING_ITEMS`: 4 reglas de timing de comida
- `MODULE_COMMON_MISTAKES`: errores comunes por pestaña
- `MODULE_TODAY_GUIDE`: guía del día por pestaña

---

### 4.4 CSS interno (prefijo `ush-`)

#### Variables CSS dinámicas

```css
--salud-accent     /* color de la pestaña activa */
--salud-secondary  /* secundario */
--salud-bg         /* fondo tintado */
--tab-color        /* color de la pestaña (en hover de tabs) */
--check-c          /* color de cada daily check card */
--hint-c           /* color del class hint strip */
```

#### Animaciones

| Nombre | Función |
|---|---|
| `ush-bar-grow` | Barras de progreso crecen desde 0 al montar |
| `ush-shimmer-sweep` | Shimmer en botones de acción |
| `ush-dot-pop` | Animación de relleno de dots de comidas |

#### Layout

| Clase | Grid |
|---|---|
| `.ush-hero` | `1.08fr / .92fr` — escena izquierda, panel derecho |
| `.ush-kpis` | `repeat(4, 1fr)` — 4 KPIs del header |
| `.ush-layout` | `1fr 320px` — contenido principal + sidebar sticky |
| `.ush-stage` | min-height 370px — imagen de hero por pestaña |
| `.ush-grid-2/3/4` | 2, 3 o 4 columnas con gap 14px |
| `.ush-strip` | panel de tabs en franja horizontal |
| `.ush-panel` | zona de contenido de cada tab con `border-top` |

#### Responsive breakpoints

| px | Cambio |
|---|---|
| 1100 | `.ush-layout` → 1 col, `.ush-side` pierde posición sticky |
| 980 | `.ush-hero` → 1 col |
| 900 | `.ush-strip`, `.ush-grid-3/4` → 2 cols |
| 680 | kpis, grid-2/3/4 → 1 col; tabs → width 100% |

#### Flip cards

`.ush-flip-card` tiene `perspective: 900px`. Al añadir `.is-flipped`, el `.ush-flip-inner` hace `rotateY(180deg)` en 0.46s. Usado en macronutrientes y mitos de nutrición.

#### `.ush-daily-check-card` hover

Al hover: `translateX(3px)` + border izquierdo de color de categoría + fondo tintado. Efecto visual de "deslizarse" al confirmar.

---

### 4.5 Firma del componente y estado

```jsx
export default function UserSaludLanding({ profile }) {
  const [saludSummary, setSaludSummary]   = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("idle"); // "idle"|"loading"|"refreshing"|"ready"|"error"
  const [actionSaving, setActionSaving]   = useState("");     // key de la acción guardándose
  const [actionPulse, setActionPulse]     = useState(null);   // notificación de XP

  const syncBootRef  = useRef(false);  // evita sync en mount inicial
  const syncedTabRef = useRef("");     // último tab sincronizado con server

  const viewerUid      = String(profile?.uid || auth.currentUser?.uid || "guest");
  const saludStorageKey = getSaludStorageKey(viewerUid); // "fv_user_salud_tab-{uid}"

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(saludStorageKey);
    if (VALID_TAB_IDS.has(saved)) return saved;
    return VALID_TAB_IDS.has(profile?.saludModule?.lastTab)
      ? profile.saludModule.lastTab
      : "general";
  });
```

---

### 4.6 API y efectos

#### Efecto 1 — Carga del summary de salud

```js
useEffect(() => {
  async function loadSummary() {
    const user = auth.currentUser;
    if (!user) { setSummaryStatus("idle"); setSaludSummary(null); return; }

    // Cache de cliente (45s TTL)
    const cached = saludClientCache.get(viewerUid);
    if (cached && Date.now() - cached.ts < SALUD_CLIENT_TTL) {
      setSaludSummary(cached.data);
      setSummaryStatus("ready");
      return;
    }

    setSummaryStatus((prev) => prev === "ready" ? "refreshing" : "loading");
    const token    = await user.getIdToken();
    const response = await getSaludSummary(token);
    const nextSummary = response?.summary || null;
    setSaludSummary(nextSummary);
    saludClientCache.set(viewerUid, { ts: Date.now(), data: nextSummary });
    setSummaryStatus("ready");
  }
  loadSummary();
}, [profile?.uid, profile?.email, viewerUid]);
```

#### Efecto 2 — Sync de tab activa con servidor (debounce 900ms)

```js
useEffect(() => {
  if (!syncBootRef.current) { syncBootRef.current = true; return; }
  if (activeTab === syncedTabRef.current) return;
  const timeoutId = setTimeout(async () => {
    const token = await auth.currentUser.getIdToken();
    await saveSaludState(token, { activeTab });
    syncedTabRef.current = activeTab;
    // actualiza saludSummary.moduleState.lastTab en local
  }, 900);
  return () => clearTimeout(timeoutId);
}, [activeTab]);
```

#### `handleSaludAction(moduleId, payload)` — acción de hábito

```js
const handleSaludAction = async (moduleId, payload = {}) => {
  const user = auth.currentUser;
  if (!user) return;
  setActionSaving(`${moduleId}:${payload.mode}`);
  const token    = await user.getIdToken();
  const response = await saveSaludCheckin(token, { module: moduleId, ...payload });
  // Actualiza daily state localmente sin refetch
  setSaludSummary((prev) => ({ ...prev, daily: response?.daily || prev?.daily }));
  // Actualiza cache
  saludClientCache.set(viewerUid, { ts: Date.now(), data: nextSummary });
  // Toast de XP
  setActionPulse({ label: `+${response?.xpEarned} XP | ${módulo}`, tone: classTheme.accent });
  // Dispara eventos del sistema
  if (response?.leveledUp)
    window.dispatchEvent(new CustomEvent("levelUp", { detail: response }));
  if (response?.xpEarned > 0 || response?.createdProgress)
    window.dispatchEvent(new CustomEvent("profileUpdated", { detail: { source: "salud", ... } }));
};
```

---

### 4.7 Valores computados

#### Stats derivados de `saludSummary`

```js
const level   = saludSummary?.stats?.level   ?? profile?.level   ?? 1;
const streak  = saludSummary?.stats?.streak  ?? profile?.streak  ?? 0;
const xp      = saludSummary?.stats?.xp      ?? profile?.xp      ?? 0;
const xpPct   = clamp(saludSummary?.stats?.xpPct, 0, 100);
const weeklySnapshot = saludSummary?.weekly || { sessions:0, xp:0, activeDays:0 };
const supportFlags   = saludSummary?.boosts?.supportFlags || {};
```

#### `timeBand` — banda horaria

```js
const currentHour = new Date().getHours();
const timeBand    = currentHour < 11 ? "manana" : currentHour < 18 ? "tarde" : "noche";
```

#### `trainedToday` (useMemo)

Resolución en cascada:
1. `saludSummary.trainedToday` (boolean explícito)
2. `profile.trainedToday ?? profile.todayWorkout ?? profile.todayTraining`
3. `isTodayLike(profile.lastWorkoutAt)` | `lastExerciseAt` | `lastActivityAt`
4. `null` si ninguno aplica

#### `dailyState` (useMemo)

```js
const dailyState = {
  sleep:       { done, hours },
  general:     { done },
  ejercicio:   { done: done || trainedToday === true },
  respiracion: { done, minutes },
  hidratacion: { cups, target: Math.max(4, target || 6), done },
  nutricion:   { meals, done },
  completedCount,
};
```

#### 4 scores dinámicos

Todos usan `clamp(valor, min, max)` y dependen de `level`, `streak`, `dailyState`, `classKey`, `timeBand`:

| Score | Fórmula base | rango |
|---|---|---|
| `recoveryPressure` | `30 + level*1.4 + streak*1.1 + activeDays*4 + sleep?16 + noche?12` | 20–96 |
| `movementScore` | `34 + level*1.8 + streak*1.1 + sessions*7 + ejercicio?14` | 24–98 |
| `hydrationScore` | `28 + level*1.1 + streak*0.7 + cups*9 + tarde?10` | 26–96 |
| `nutritionScore` | `30 + level*1.3 + streak*0.9 + meals*15` | 24–97 |

#### `recommendedId` — tab recomendada

Árbol de decisión de 14 condiciones que considera en orden: `supportFlags.xpBonus`, `streakShieldActive`, sueño faltante, `trainedToday`, `timeBand`, scores comparados. Devuelve uno de: `"general"`, `"ejercicio"`, `"respiracion"`, `"hidratacion"`, `"nutricion"`.

#### Copy contextual por `timeBand`

```js
const heroHeadline = {
  manana: { title: "Abre el día con", span: "una base que sostenga." },
  tarde:  { title: "Ajusta energía, agua y ritmo", span: "antes de gastar de más." },
  noche:  { title: "Cierra sin romper", span: "recuperación ni claridad." },
}[timeBand];

const heroLead = { manana: "...", tarde: "...", noche: "..." }[timeBand];
const phaseLabel    = { manana: "Arranque del día", tarde: "Ventana de rendimiento", noche: "Cierre y recuperación" }[timeBand];
const contextualChip = { manana: "Hora de ordenar base y energía", ... }[timeBand];
```

#### `heroKpis` — 4 KPIs del header

```js
const heroKpis = [
  { label: "nivel actual",  value: `Lv ${level}` },
  { label: "racha activa",  value: `${streak} d` },
  { label: "semana viva",   value: `${weeklySnapshot.sessions} ses` },
  { label: "foco hoy",      value: trainedToday ? "recuperar" : recommendedMeta.title.split(" ")[0] },
];
```

#### `quickMarkers` — 4 marcadores de estado

```js
const quickMarkers = [
  { label: "Movimiento",   value: movementScore,    color: UI.danger },
  { label: "Recuperacion", value: recoveryPressure, color: UI.cyan   },
  { label: "Nutricion",    value: nutritionScore,   color: UI.success },
  { label: "Hidratacion",  value: hydrationScore,   color: "#4cc9f0" },
];
```

`lowestMarker` y `strongestMarker` se calculan para mostrar el área de mayor déficit y el CTA más urgente.

---

### 4.8 Sub-componentes internos

#### `Img({ src, fallbackSrc, alt, style, className })`

Componente de imagen con fallback: si falla `src`, intenta `fallbackSrc`; si también falla, `display: none`. Usa `image-rendering: pixelated` por defecto.

#### `ModuleActionBar({ title, hint, actions, accent })`

Barra de acción por pestaña con:
- Kicker "PROGRESO REAL" en monospace
- Título en 800/18px
- Hint en 500/13px muted
- Botones con shimmer animado y hover lift; `disabled` apagado sin shimmer

#### `renderGeneralTab({ daily, onAction, loading })`

Tab "Base":
- `ModuleActionBar` con acciones de sueño y checklist base
- 3 info cards de pilares (Movimiento, Nutrición, Recuperación) con PNG y stat
- 4 soft cards de SCIENCE_FACTS con valor gigante (900/40px) y fuente citada
- Grid 2 cols de DAILY_CHECKS (6 ítems) con hover de deslizamiento y dot de color
- Card de "Regla simple" con prioridad de pilares

#### `renderExerciseTab({ daily, onAction, loading })`

Tab "Movimiento":
- `ModuleActionBar` con marcar movimiento + botón "Ir a ejercicios" (dispatch `flexNavigate`)
- 4 info cards de tipos de ejercicio con imagen de portada, frecuencia y lista de beneficios
- 2 info cards: principios (4 numerados) + barras de volumen semanal (Fuerza 82%, Cardio 68%, Movilidad 46%, HIIT 26%)
- Consejo "mejor poco y estable que heroico y roto"

#### `renderBreathingTab({ daily, onAction, loading })`

Tab "Respiración":
- `ModuleActionBar` para cerrar recuperación
- 3 info cards de técnicas con patrón, título y uso
- Grid 2: cuándo usar cada técnica (4 reglas) + lectura útil con imagen stat-men.png

#### `renderHydrationTab({ daily, onAction, loading })`

Tab "Hidratación":
- `ModuleActionBar` con contador `+1 vaso` (no desactiva al completar para poder seguir sumando)
- Grid 2: mapa del día (5 slots con hora y cantidad) + alertas simples
- Soft card de "regla rápida para entrenar en calor"

#### `NutritionTab({ daily, onAction, loading, classKey })` (componente con propio estado)

Tab "Nutrición" — estado local:
```js
const [mythFlipped, setMythFlipped]   = useState({});  // flip individual de mitos
const [macroFlipped, setMacroFlipped] = useState({});  // flip individual de macros
const [goalOpen, setGoalOpen]         = useState(null); // accordion de objetivos
const [timingOpen, setTimingOpen]     = useState(false);// accordion de timing
```

Contenido:
- `ModuleActionBar` con contador de comidas (máx 4)
- Strip de hint por clase (CLASS_NUTRITION_HINT) con ícono de stat
- Meal dots tracker: 4 dots con animación `ush-dot-pop` al rellenarse
- 3 flip cards de macros (Proteínas/Carbohidratos/Grasas) con frente y dorso
- Accordion de 3 objetivos nutricionales con expand/collapse y dot animado
- Bottom grid: accordion de timing útil + 3 flip cards de mitos

#### `TabContent({ activeTab, daily, onAction, loading, classKey })`

Dispatcher que renderiza la función o componente correspondiente al tab activo.

---

### 4.9 Helpers internos

```js
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const num   = (value, fallback = 0) => { const p = Number(value); return Number.isFinite(p) ? p : fallback; };

// Verifica si un timestamp (Firestore Timestamp, Date, o string) es hoy
const isTodayLike = (value) => {
  if (!value) return null;
  const raw  = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const now  = new Date();
  return date.getFullYear() === now.getFullYear()
      && date.getMonth()    === now.getMonth()
      && date.getDate()     === now.getDate();
};
```

---

### 4.10 Resumen técnico

| Propiedad | Valor |
|---|---|
| Componente | `UserSaludLanding({ profile })` |
| CSS prefix | `ush-` |
| API calls | `getSaludSummary(token)`, `saveSaludCheckin(token, {...})`, `saveSaludState(token, { activeTab })` |
| Cache cliente | `saludClientCache` Map, TTL 45s por uid |
| localStorage | `fv_user_salud_tab-{uid}` |
| Tabs | 5 (general, ejercicio, respiracion, hidratacion, nutricion) |
| Sub-componentes internos | `Img`, `ModuleActionBar`, `renderGeneralTab`, `renderExerciseTab`, `renderBreathingTab`, `renderHydrationTab`, `NutritionTab`, `TabContent` |
| Scores dinámicos | 4 (movimiento, recuperación, nutrición, hidratación) |
| Time bands | 3 (mañana <11h, tarde <18h, noche ≥18h) |
| Lógica de recomendación | 14 condiciones ordenadas por prioridad |
| Dispatch de `flexNavigate` | Tab ejercicio → abre UserEjercicios |
| Eventos emitidos | `levelUp`, `profileUpdated` al guardar checkin |
| SCIENCE_FACTS | 4 evidencias con fuente citada |
| Flip cards | Macros (3) + Mitos (3) con CSS 3D transform |
| Accordions | Objetivos nutricionales + timing útil + phase cards de UserSaludLanding |

---

## 5. Tabla comparativa de los 4 componentes

| Aspecto | UserPersonaje | UserRutinas | UserSalud | UserSaludLanding |
|---|---|---|---|---|
| Tipo | Página completa | Página completa | Barrel re-export | Página completa |
| Props | `{ profile = {} }` | `{ profile, onNavigate }` | — | `{ profile }` |
| API calls | 1 (`getUserStats`) | 2 REST + 1 Firestore direct | — | 3 (`getSaludSummary`, `saveSaludCheckin`, `saveSaludState`) |
| CSS prefix | `up2-` | `urt-` | — | `ush-` |
| Firebase direct | No | Sí (Firestore `getDocs`) | — | No (solo `auth.currentUser`) |
| IA / cámara | No | Sí (`PoseCamera`) | — | No |
| Portal (React) | No | Sí (`createPortal` en modales) | — | No |
| Tabs | 2 | N/A (territory map) | — | 5 |
| Cache cliente | No | No | — | Sí (45s) |
| Flip cards | Fases de progreso | No | — | Macros + mitos |
| i18n | Sí (`useLang`) | No | — | No |
| Storage keys | 1 | 7 | — | 1 (por uid) |
| Eventos escuchados | 12 | 1 (auth) | — | 0 |
| Eventos emitidos | 0 | `profileUpdated` | — | `levelUp`, `profileUpdated` |
| Sprite animado | Sí (SpriteMap) | No | — | No |
| Skill tree | Sí (`SkillTree`) | No | — | No |
