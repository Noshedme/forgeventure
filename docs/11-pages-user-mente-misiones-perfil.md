# docs/11 — pages/user: UserMente · UserMisiones · UserPerfil

> Documentación de la carpeta `frontend/src/pages/user/`.
> Énfasis doble: **experiencia real del usuario** + lógica técnica completa.

---

## Índice

1. [UserMente — Santuario Mental](#1-usermente--santuario-mental)
2. [UserMisiones — Tablón de Misiones del Gremio](#2-usermisiones--tabln-de-misiones-del-gremio)
3. [UserPerfil — Ficha del Héroe](#3-userperfil--ficha-del-hroe)
4. [Tabla resumen](#4-tabla-resumen)

---

## 1. UserMente — Santuario Mental

### Propuesta de valor al usuario

UserMente es el **centro de bienestar mental** de ForgeVenture. Va más allá del tracking físico: le da al usuario herramientas de psicología positiva (PERMA, fortalezas, gratitud, respiración) integradas con el sistema RPG de XP. El mensaje: _cuidar la mente también da puntos, rachas y recompensas_. La interfaz de fantasy oscura (paleta Wine Aurora, púrpura `#b06aff`, detalles dorados) hace que meditar o registrar emociones se sienta como entrar a un santuario exclusivo dentro del juego.

**El usuario gana:**
- Un ritual diario completo (ánimo + gratitud + respiración + PERMA + afirmaciones + fortalezas) con XP concreto por cada acción
- Visibilidad de su estado emocional en el tiempo (gráfico de historial de ánimo, 7 días)
- Técnicas de respiración interactivas con visualización orbital animada
- Reflexión guiada por clase RPG (preguntas y afirmaciones distintas para Guerrero, Arquero o Mago)
- Conexión con el estado emocional colectivo del gremio (cuántos están "tensos", "con energía", etc.)
- Insights personalizados que cruzan datos de ejercicio, ánimo y racha

---

### Archivo

`frontend/src/pages/user/UserMente.jsx`

---

### Imports principales

```js
// React / Motion
import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase
import { auth } from "../../firebase";

// i18n
import { useLang } from "../../i18n/useLang";

// Hooks
import { useIsMobile } from "../../hooks/useIsMobile";
import { canShowXpPopups } from "../../utils/userPreferences";

// Design system
import { P as SC, mono as orb, sans as raj, glass } from "../../design/system.jsx";

// APIs (12 endpoints)
import {
  saveMood, getMoodHistory,
  saveGratitude, getGratitudeHistory,
  savePerma, getPermaHistory,
  saveStrengths, getStrengths,
  logMenteSession, getMenteSummary,
  getMenteInsights,
  getCommunityMente, saveMenteConnection,
} from "../../services/api";
```

---

### CSS y design tokens

```css
/* Root vars del santuario */
--fvm-mente:    #b06aff      /* acento principal: púrpura */
--fvm-mente-a:  rgba(176,106,255,.55)
--fvm-gold:     #c89b3c      /* dorado RPG */
--fvm-gold-b:   #f4cc78
--fvm-gold-s:   #8a6000

/* Colores de estado emocional (mood pairs) */
--m-tenso:  #ff4d5e   --ma-tenso:  rgba(255,77,94,.45)
--m-cansado:#9b8ea0   --ma-cansado:rgba(155,142,160,.45)
--m-neutro: #4cc9f0   --ma-neutro: rgba(76,201,240,.45)
--m-bien:   #4a9d8f   --ma-bien:   rgba(74,157,143,.45)
--m-energia:#ff6b2c   --ma-energia:rgba(255,107,44,.45)

/* Fases de respiración */
--pc-inhala:#b06aff   --pa-inhala:rgba(176,106,255,.55)
--pc-reten: #ffb13a   --pa-reten: rgba(255,177,58,.5)
--pc-exhala:#4cc9f0   --pa-exhala:rgba(76,201,240,.5)
--pc-pausa: #8ac926   --pa-pausa: rgba(138,201,38,.5)
```

**Layout raíz:**
- `.fvm-wrapper` → 3 columnas: `280px 1fr 320px`
- `.fvm-panel` con 4 puntos dorados en esquinas (CSS `::before`/`::after` de `.fvm-corners`)
- `.fvm-tabbar` → barra de secciones horizontal (scroll horizontal en móvil)

**Animaciones clave:**
| Clase | Efecto |
|-------|--------|
| `fvm-flicker` | llama de racha parpadeante |
| `fvr-ring-pulse` | anillos expansivos del orbe de respiración |
| `fvr-node-pulse` | nodo de ciclo de respiración pulsante |
| `fvm-shimmer` | shimmer de carga |
| `mm-xpFloat` | burbuja XP flotando hacia arriba |
| `mm-breathePulse` | orbe de respiración que late |

---

### Constantes de datos

#### MOODS (5 estados)
```js
const MOODS = [
  { id:"tense",   label:"Tenso",       color:SC.red,    xp:25 },
  { id:"tired",   label:"Cansado",     color:SC.muted,  xp:25 },
  { id:"neutral", label:"Neutro",      color:SC.blue,   xp:25 },
  { id:"good",    label:"Bien",        color:SC.teal,   xp:25 },
  { id:"powered", label:"Con energía", color:SC.orange, xp:25 },
];
const MOOD_SCORE = { tense:1, tired:2, neutral:5, good:8, powered:10 };
```

#### PERMA (5 dimensiones de psicología positiva)
```js
const PERMA = [
  { id:"P", label:"Emociones Positivas", color:SC.orange, emoji:"😊" },
  { id:"E", label:"Compromiso & Flujo",  color:SC.blue,   emoji:"🎯" },
  { id:"R", label:"Relaciones Positivas",color:SC.purple, emoji:"🤝" },
  { id:"M", label:"Significado & Prop.", color:SC.teal,   emoji:"💡" },
  { id:"A", label:"Logros & Competencia",color:SC.gold,   emoji:"🏆" },
];
```

#### AFFIRMATIONS (por clase RPG)
Preguntas y respuestas de reflexión adaptadas a cada clase:
- **GUERRERO** (5): sobre límites, fuerza, disciplina
- **ARQUERO** (5): sobre velocidad, libertad, consistencia
- **MAGO** (5): sobre equilibrio, mente, esencia
- **DEFAULT** (5): universales sobre persistencia

Cada afirmación tiene pregunta (`q`) y respuesta (`a`). Las tarjetas se voltean con flip 3D (`.fva-flip-inner.flipped`).

#### BREATH_MODES (3 técnicas de respiración)
```js
const BREATH_MODES = [
  { id:"box",   label:"Box Breathing", short:"4·4·4·4", color:"#5A9FD4",
    phases:[inhala 4s, reten 4s, exhala 4s, pausa 4s],
    tip:"Técnica de Navy SEALs..." },
  { id:"478",   label:"4-7-8",         short:"4·7·8",   color:"#4A9D8F",
    phases:[inhala 4s, reten 7s, exhala 8s] },
  { id:"power", label:"Energizante",   short:"2·2·2·2", color:"#D4A574" },
];
```

#### STRENGTHS_QUIZ (6 preguntas, 9 fortalezas posibles)
Quiz de 6 preguntas de opción múltiple que detecta la fortaleza psicológica del usuario:
Creatividad, Valentía, Amabilidad, Sabiduría, Perseverancia, Liderazgo, Perspectiva, Gratitud, Humor.

#### TODAY_ACTIVITIES (7 actividades diarias con XP)
```js
const TODAY_ACTIVITIES = [
  { key:"mood",        xp:25,  color:SC.orange },
  { key:"gratitude",   xp:30,  color:SC.teal   },
  { key:"breathing",   xp:20,  color:SC.blue   },
  { key:"perma",       xp:40,  color:SC.purple },
  { key:"affirmation", xp:15,  color:SC.gold   },
  { key:"strengths",   xp:60,  color:SC.teal   },
  { key:"connection",  xp:20,  color:SC.green  },
];
// XP total diario máximo: 210 XP
```

---

### Helpers y caché

```js
const todayStr = () => new Date().toISOString().slice(0,10);
const menteScopedKey = (scope, key) => `fv_mente_${scope}_${key}`;

// Caché en memoria (no localStorage)
const menteClientCache = new Map();
const MENTE_CLIENT_CACHE_TTL       = 45 * 1000; // 45 seg
const MENTE_CLIENT_INSIGHTS_TTL   = 2 * 60 * 1000; // 2 min
```

---

### Sub-componentes principales

#### `XPPopup`
Burbuja flotante de XP (posición `fixed`, bottom-right). Se auto-destruye a los 1400ms.

#### `TodayProgress`
Board de progreso diario:
- Header con XP acumulado del día + ratio completadas/total
- Barra de progreso animada (`motion.div` `width` de 0 → pct%)
- 7 chips de actividades, cada uno clicable para ir a la pestaña correspondiente
- Banner verde al completar el 100% con ícono de trofeo

#### `MoodCheckin` (Check-in de ánimo)
Estado local:
```js
const [selected, setSelected] = useState(() => lsGet(lsKey, null));
const [tip,      setTip]      = useState(null);
const [history,  setHistory]  = useState([]);
const [saving,   setSaving]   = useState(false);
```
**Flujo:**
1. Usuario elige mood → `pick(mood)` guarda en localStorage inmediatamente
2. Llama `saveMood(token, mood.id)` → si `res.xpEarned` dispara `onXP()`
3. Actualiza historial local sin segunda llamada API
4. Calcula racha local (últimos 7 días en `history` o localStorage)

**Gráfico semanal de ánimo:**
- SVG con barras por día (altura proporcional a `MOOD_VAL[id]`: tense=20, tired=38, neutral=50, good=75, powered=100)
- `DAYS_SHORT` = ["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"]
- Cara emoji pixel en cada barra (tipo: `smile / flat / frown`)

**Panel de feedback tras check-in:**
- Cara pixel grande con color del estado elegido
- Mensaje head + body personalizado (5 `FB_MSG`)
- XP ganado + stamp "COMPLETADO"

#### `MoodChart`
Gráfico histórico (últimos 7 registros):
- SVG dinámico `340×90`
- Barras con gradiente vertical (`linearGradient` por mood)
- Ícono SVG del mood bajo cada barra
- Fecha en eje X

#### `InsightsPanel`
Lista de insights del backend:
- Skeleton loader (3 placeholders)
- Empty state con ícono
- Primer insight: tamaño destacado + gold medal PNG
- Restantes: tamaño compacto con borde izquierdo de color por tipo
- Tipos: `mood_trend`, `exercise_sync`, `perma_delta`, `streak`, `class_tip`, `positive`, `warning`, `achievement`

#### `CommunityPanel`
Pulso del gremio:
- Dot animado que pulsa (`.motion.div` scale 1→1.2→1, opacity 0.7→1→0.7)
- Distribución de ánimo en barras horizontales con porcentaje (datos de `comm.moods.count`)
- Top 3 fortalezas colectivas con medallas PNG (gold/silver/bronze)
- Live counter de usuarios activos hoy

---

### APIs

| Endpoint | Cuándo se llama |
|----------|-----------------|
| `saveMood(token, moodId)` | Al elegir estado de ánimo |
| `getMoodHistory(token)` | Al montar `MoodCheckin` |
| `saveGratitude(token, data)` | Al guardar entradas de gratitud |
| `getGratitudeHistory(token)` | Al entrar a la pestaña gratitud |
| `savePerma(token, scores)` | Al enviar sliders PERMA |
| `getPermaHistory(token)` | Al cargar historial PERMA |
| `saveStrengths(token, result)` | Al completar quiz de fortalezas |
| `getStrengths(token)` | Al cargar resultado previo de fortalezas |
| `logMenteSession(token, data)` | Al terminar sesión de respiración |
| `getMenteSummary(token)` | Al cargar resumen diario |
| `getMenteInsights(token)` | Al cargar insights (TTL 2 min) |
| `getCommunityMente(token)` | Al cargar pulso del gremio |
| `saveMenteConnection(token, data)` | Al hacer conexión social |

---

### Secciones de la barra de navegación

9 ítems en `.fvm-bottom-nav` con iconos CSS clip-path (dorados):
`animo`, `respiracion`, `meditacion`, `visualizacion`, `enfoque`, `diario`, `perma`, `afirmaciones`, `fortalezas`

---

### Responsive

| Breakpoint | Cambio |
|------------|--------|
| ≤ 1280px | Columnas 230/1fr/260px |
| ≤ 1152px | 2 columnas (left col oculta arriba de 1024) |
| ≤ 1024px | 1 columna; right col 2-col grid |
| ≤ 820px | mood grid 3 cols; orbe 220px |
| ≤ 640px | mood grid 2 cols; orbe 180px |

---

---

## 2. UserMisiones — Tablón de Misiones del Gremio

### Propuesta de valor al usuario

UserMisiones es el **tablón de contratos** de ForgeVenture. Convierte las obligaciones de entrenamiento (ejercitar, meditar, completar rutinas) en misiones de gremio RPG con recompensas reales (XP, monedas, boosts). El usuario no ve "tareas pendientes" — ve _contratos de gremio activos_, con rareza (Común/Rara/Épica/Legendaria), cronómetros de cierre, arte de clase, y un escenario visual que cambia según si es Guerrero, Arquero o Mago. El efecto: el usuario quiere "cerrar el contrato antes de que caiga la noche".

**El usuario gana:**
- Un tablón personalizado por clase (GUERRERO, ARQUERO, MAGO) con copy motivacional distinto
- 5 tipos de misiones filtrables con su propia narrativa y recompensas
- Contadores en tiempo real (cuándo reinicia la diaria, cuándo vence el evento)
- Rareza visual en cada misión: Legendaria = dorado, Épica = púrpura, Rara = cyan, Común = verde
- Escena cinematográfica de fondo (video + PNG stage + overlay gradiente) personalizada por clase
- Spotlight lateral sticky con banner de misión seleccionada, loot, ruta de acción y diario semanal

---

### Archivo

`frontend/src/pages/user/UserMisiones.jsx`

---

### Imports principales

```js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase";
import { useLang } from "../../i18n/useLang";
import { useIsMobile } from "../../hooks/useIsMobile";
import { canShowXpPopups } from "../../utils/userPreferences";
import { USER_CLASS_THEME } from "../../design/classTheme";
import { P as UI } from "../../design/system.jsx";
import { claimMision, getMisionesUsuario } from "../../services/api";
```

---

### Constantes de datos

#### MISSION_CLASS_COPY (por clase)
```js
const MISSION_CLASS_COPY = {
  GUERRERO: {
    title:  "Cierra contratos fisicos",
    span:   "con peso real.",
    lead:   "...",
    focus:  "Fuerza, constancia y botin util",
    rally:  "...",
  },
  ARQUERO: {
    title:  "Mantene ritmo, pulso",
    span:   "y avance visible.",
    ...
  },
  MAGO: {
    title:  "Ordena objetivos",
    span:   "con foco y control.",
    ...
  },
  DEFAULT: { title:"Abre el tablon", span:"del gremio." },
};
```

#### MISSION_TYPE_META (5 tipos)
```js
const MISSION_TYPE_META = {
  Diaria:  { label:"Quest diaria",      seal:"/missions/seals/seal-daily.png",     banner:"/missions/spotlight/spotlight-daily-banner.png"    },
  Semanal: { label:"Campana semanal",   seal:"/missions/seals/seal-weekly.png",    banner:"/missions/spotlight/spotlight-weekly-banner.png"   },
  Mente:   { label:"Mision mental",     seal:"/missions/seals/seal-mind.png",      banner:"/missions/spotlight/spotlight-mind-banner.png"     },
  Evento:  { label:"Evento del gremio", seal:"/missions/seals/seal-event.png",     banner:"/missions/spotlight/spotlight-event-banner.png"    },
  Desafio: { label:"Reto mayor",        seal:"/missions/seals/seal-challenge.png", banner:"/missions/spotlight/spotlight-challenge-banner.png"},
};
```

#### MISSION_CLASS_STRATEGY (algoritmo de priorización)
```js
const MISSION_CLASS_STRATEGY = {
  GUERRERO: {
    preferredZones: ["fuerza"],
    supportZones:   ["cardio","general"],
    preferredTypes: ["Desafio","Semanal"],
  },
  ARQUERO: {
    preferredZones: ["cardio","flexibilidad"],
    supportZones:   ["hidratacion","general"],
    preferredTypes: ["Diaria","Semanal","Evento"],
  },
  MAGO: {
    preferredZones: ["mente","flexibilidad"],
    supportZones:   ["hidratacion","general"],
    preferredTypes: ["Mente","Diaria","Semanal"],
  },
};
```

#### MISSION_STAGE_THEME (escenario visual por clase)
```js
const MISSION_STAGE_THEME = {
  GUERRERO: {
    image: "/missions/missions-hero-warrior.png",
    crest: "/ui/crest-warrior.png",
    label: "Campana de hierro",
    story: "...",
  },
  ARQUERO: { image:"/missions/missions-hero-archer.png",  label:"Ruta de impulso" },
  MAGO:    { image:"/missions/missions-hero-mage.png",    label:"Mesa del foco"   },
};
```

#### MISSION_ZONE_META (6 zonas)
```js
const MISSION_ZONE_META = {
  fuerza:       { label:"Fuerza",       color:"#ff4d5e", icon:"/ui/stat-str.png" },
  cardio:       { label:"Cardio",       color:"#6BC87A"  },
  flexibilidad: { label:"Flexibilidad", color:"#4CC9F0"  },
  mente:        { label:"Mente",        color:"#b06aff"  },
  hidratacion:  { label:"Hidratación",  color:"#4cc9f0"  },
  general:      { label:"General",      color:UI.gold    },
};
```

#### TABS
```js
const TABS = ["Diaria", "Semanal", "Mente", "Evento", "Desafio"];
```

#### localStorage keys
```js
const STORAGE_SORT          = "um:sort";
const STORAGE_STREAK        = "um:claimed-days";
const STORAGE_MISSION_MEMORY = "um:mission-memory";
```

---

### Funciones helper

| Función | Lógica |
|---------|--------|
| `normalizeMissionType(tipo)` | Normaliza strings a los 5 tipos canónicos |
| `getMissionZone(mision)` | Detecta zona por keywords en título/descripción |
| `getMissionRarity(xp)` | ≥360→Legendaria, ≥240→Épica, ≥140→Rara, else Común |
| `getMissionMemory()` | Lee `um:mission-memory` del localStorage (últimas 14 entradas) |
| `saveMissionMemory(memory)` | Escribe al localStorage con límite de 14 |
| `secsUntilMidnight(offset)` | Segundos hasta las 00:00 (reinicio Diaria) |
| `secsUntilMonday(offset)` | Segundos hasta el lunes (reinicio Semanal) |
| `secsUntilExpiry(isoString, offset)` | Tiempo restante hasta vencimiento de Evento |
| `isExpiredMission(mision, offset)` | True si Evento ya expiró |
| `fmtCountdown(secs)` | "2d 3h" o "MM:SS" según magnitud |
| `getMissionStatusKey(mision)` | `"active" | "ready" | "claimed" | "expired"` |
| `getMissionCountdownLabel(mision)` | "Reinicia en 02:34:12" / "Cierra en 5h" |
| `getMissionRarityColor(xp)` | Color del rareza según XP |
| `getMissionRewardVisual(mission, statusKey)` | Asset PNG + label de recompensa |
| `getMissionRowFrameAsset(rarityLabel)` | Frame PNG de fila según rareza |
| `getMissionRiskMeta(mission, rarity, statusKey)` | Chip de riesgo: "Carga alta", "Tramo final", "Cobro inmediato" |
| `getMissionRouteVisual(route)` | PNG + label de ruta de acción |
| `buildMissionWeekSeries(weekDays, claimedDays, todayKey)` | Array de 7 días para diario semanal |
| `getMissionJournalSeal(point)` | PNG de sello en diario: claimed / today / empty |
| `formatSyncLabel(timestamp)` | "Ahora mismo" / "Hace 3 min" / "Hace 2 h" |
| `getMissionBoardStateMeta(...)` | Estado vacío/error/loading del tablón |

---

### Rareza visual

| XP mínimo | Rareza | Color |
|-----------|--------|-------|
| 360 | Legendaria | `#c89b3c` (gold) |
| 240 | Épica | `#c08aff` (púrpura) |
| 140 | Rara | `#4cc9f0` (cyan) |
| 0 | Común | `#4a9d8f` (success) |

---

### Layout del escenario (`umi-stage`)

```
┌─────────────────────────────────────────────────────────────────┐
│  <video> background (loop, muted, autoplay) ← video ambiental  │
│  .umi-stage-table → PNG cinematográfico de la escena           │
│  .umi-stage-layer → gradiente overlay                           │
│                                                                 │
│  .umi-stage-class-art (arte del héroe por clase)               │
│  .umi-stage-campaign (panel izquierdo con stats de campaña)    │
│  .umi-stage-card (panel derecho con misión seleccionada)       │
└─────────────────────────────────────────────────────────────────┘
```

**Stats en `.umi-stage-campaign`:**
- Grid 3 columnas: misiones activas / XP ganado / racha semanal

---

### Layout del tablón

```
┌──────────────────────────────────────────────────────────────┐
│  .umi-hero  (grid: 1.1fr / 0.9fr)                           │
│    ← copy de clase + stats    |  arte de clase →            │
├──────────────────────────────────────────────────────────────┤
│  .umi-band  (banda de campaña con 3 nodos de ruta)          │
├──────────────────────────────────────────────────────────────┤
│  .umi-tab-row  (5 pestañas: repeat(5, 1fr))                 │
├─────────────────────┬────────────────────────────────────────┤
│  .umi-board         │  .umi-spotlight (sticky, top:14px)    │
│  (lista de misiones)│  ← banner de misión seleccionada      │
│                     │  ← loot grid (2 col)                  │
│                     │  ← ruta de acción                     │
│                     │  ← diario semanal (7 sellos)          │
└─────────────────────┴────────────────────────────────────────┘
```

---

### Row de misión (`.umi-row`)

```
┌────────────────────────────────────────────────────────────────┐
│  72px art  │  copy (título, sub-tags, descripción, progreso)  │
│  (rareza   │                                                   │
│   + sello) │  180-208px side (loot, timer, botón claim)      │
└────────────────────────────────────────────────────────────────┘
```

Efectos visuales:
- `::before` → radial gradient en esquina superior-izquierda con `--row-color`
- `::after` → borde interno que aparece en hover/selected
- `.umi-row-frame` → frame PNG de rareza (display:none por defecto, visible en variante expandida)

---

### Row compacta (`.umi-cr`)

Versión condensada para vistas densas:
- Accent bar vertical izquierda (`--cr-color`)
- Ícono de tipo (sello PNG) 30×30
- Título + meta (zona, countdown, progreso %)
- XP + chip de status + botón claim o countdown

---

### Compact row de misión claim

```js
// Estado de reclamación
if (mision.reclamada) return "claimed";
if (mision.estado === "completada") return "ready";
return "active";
```

Botón de reclamar → llama `claimMision(token, misionId)` → toast de éxito con XP ganado.

---

### Modal de misión (`umi-modal`)

Aparece sobre backdrop `rgba(4,4,10,.82) + blur(10px)`.
Tabs: 3 pestañas con info ampliada (contrato, recompensa, ruta).

---

### Bottom sheet (`umi-sheet`) — mobile

Para viewport ≤560px: `width:100%`, `max-height:88vh`, `border-radius:8px 8px 0 0`.
Handle drag handle en la parte superior.

---

### APIs

| Endpoint | Cuándo |
|----------|--------|
| `getMisionesUsuario(token)` | Al montar y al cambiar de pestaña |
| `claimMision(token, misionId)` | Al presionar botón de reclamar |

---

### State del componente principal (inferido)

```js
const [misiones,         setMisiones]         = useState([]);
const [loading,          setLoading]          = useState(true);
const [error,            setError]            = useState(null);
const [tab,              setTab]              = useState("Diaria");
const [selectedMission,  setSelectedMission]  = useState(null);
const [sort,             setSort]             = useState(lsGet(STORAGE_SORT, "priority"));
const [filterEstado,     setFilterEstado]     = useState("all");
const [showExpired,      setShowExpired]      = useState(false);
const [claimingId,       setClaimingId]       = useState(null);
const [serverOffset,     setServerOffset]     = useState(0);
const [syncTs,           setSyncTs]           = useState(null);
const [missionMemory,    setMissionMemory]    = useState(getMissionMemory());
const claimedDays = lsGet(STORAGE_STREAK, []);
```

---

### Responsive

| Breakpoint | Cambio |
|------------|--------|
| ≤ 1440px | Hero: `1.2fr / .8fr`; content: `1.2fr / .8fr` |
| ≤ 1280px | Hero: `1.4fr / .6fr`; tabs: `repeat(3, 1fr)` |
| ≤ 1180px | 1 columna; spotlight estático |
| ≤ 820px | Hero y tablón en padding 14px; tabs: `2 col` |
| ≤ 560px | Todo en 1 columna; modal → bottom sheet |

---

---

## 3. UserPerfil — Ficha del Héroe

### Propuesta de valor al usuario

UserPerfil es **el carné de identidad del héroe** dentro de ForgeVenture. No es solo una página de cuenta — es una vitrina RPG completa con XP ring animado, bento grid de estadísticas, logros coleccionables por rareza, un avatar personalizable con marcos, y boosts activos con contadores en vivo. El usuario siente que tiene un _personaje real_ que crece, que tiene historia y que puede mostrar. La pestaña de edición va más allá de cambiar el nombre: permite elegir clase, título, bio, avatar, marco, skin y configurar la seguridad de la cuenta.

**El usuario gana:**
- Vista de su XP actual con anillo SVG animado que muestra el progreso al nivel siguiente
- Dashboard del héroe con: racha máxima, tiempo total, monedas, XP semanal, logros obtenidos
- Actividad semanal en gráfico de barras (7 días, sesiones y XP)
- Stats de clase (Fuerza/Resistencia/Agilidad/Vitalidad) + stats generales
- Vitrina de hasta 12 logros con rareza y PNG específico por rareza
- Boosts activos con barra de consumo en tiempo real y alerta al quedar < 5 min
- Avatar PNG con marco de rareza animado (o fallback gradiente con `clip-path: mask`)
- Gestión completa de identidad: username, heroName, clase, título, bio
- Seguridad avanzada: cambio de contraseña, cambio de email (con verificación), reautenticación con Google, eliminar cuenta

---

### Archivo

`frontend/src/pages/user/UserPerfil.jsx`

---

### Imports principales

```js
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase";
import {
  reauthenticateWithCredential, reauthenticateWithPopup,
  updatePassword, verifyBeforeUpdateEmail,
  EmailAuthProvider, GoogleAuthProvider,
} from "firebase/auth";

import { useLang } from "../../i18n/useLang";
import { useIsMobile } from "../../hooks/useIsMobile";
import { validateClean } from "../../utils/validateClean";
import { P as _SP, mono, sans, glass } from "../../design/system.jsx";

// APIs
import {
  getUserStats, updateProfile, getSkins, setActiveSkin,
  getLogrosCatalogo, getWeeklyActivity, deleteProfile,
  getAvatarCatalog, purchaseAvatarItem, setActiveAvatar, setActiveFrame,
  buyTitle, equipTitle, getTitlesCatalog,
} from "../../services/api";

// Lottie (lazy-loaded)
const Lottie = lazy(() => import("lottie-react"));
```

---

### Alias de paleta

```js
// _SP importado como alias para evitar conflicto con variable local P
import { P as _SP } from "../../design/system.jsx";
const P = { ..._SP, green:"#6BC87A", blue:"#4CC9F0" };
// C = paleta compuesta para uso interno
const C = { bg:P.bg0, orange:P.accent, purple:P.accent2, ... };
// SC = alias de system colors para compatibilidad CSS
const SC = C;
```

---

### Constantes

#### CLS (stats de clase base)
```js
const CLS = {
  GUERRERO:{ icon:"⚔️", color:C.orange, desc:"Domina los ejercicios de fuerza",         bonus:"Fuerza +25% XP",       stats:{fuerza:95,resistencia:72,agilidad:55,vitalidad:88} },
  ARQUERO: { icon:"🏃", color:C.blue,   desc:"Especialista en cardio y velocidad",       bonus:"Cardio +25% XP",       stats:{fuerza:60,resistencia:90,agilidad:95,vitalidad:75} },
  MAGO:    { icon:"🧘", color:C.purple, desc:"Maestro de la flexibilidad y la mente",    bonus:"Flexibilidad +25% XP", stats:{fuerza:50,resistencia:68,agilidad:80,vitalidad:92} },
};
```

#### PROFILE_CLS (con crests y rutas)
```js
const PROFILE_CLS = {
  GUERRERO: { ...CLS.GUERRERO, color:"#ff4d5e", secondary:"#c9184a", crest:"/ui/crest-warrior.png" },
  ARQUERO:  { color:"#6BC87A",  secondary:"#20c997", crest:"/ui/crest-archer.png" },
  MAGO:     { color:"#4CC9F0",  secondary:"#2f80ed", crest:"/ui/crest-mage.png"  },
};
```

#### CLS_COLORS (colores de Resumen por clase)
```js
const CLS_COLORS = {
  GUERRERO:{ cls2:"#ff4d5e", philo:"La fuerza nace del enfoque...", bonus:"+25% XP EN EJERCICIOS DE FUERZA" },
  ARQUERO: { cls2:"#6ad15a", philo:"La precisión se construye...", bonus:"+25% XP EN EJERCICIOS DE CARDIO"  },
  MAGO:    { cls2:"#4CC9F0", philo:"El dominio del cuerpo...",    bonus:"+25% XP EN FLEXIBILIDAD Y MENTE"   },
};
```

#### Session logros caché
```js
const _sessionLogrosCache = new Map(); // uid → { ts, logros }
const SESSION_LOGROS_TTL  = 5 * 60_000; // 5 min TTL
```

#### localStorage keys
```js
const PROFILE_TAB_STORAGE_KEY = "fv-user-profile-tab-v2";
// (scoped por uid vía useScopedStorageState)
```

---

### Custom hook: `useScopedStorageState`

```js
function useScopedStorageState(baseKey, fallbackValue) {
  // Lee/escribe localStorage con clave = `baseKey:${uid || "guest"}`
  // Retorna [value, setter] como useState
  // Se sincroniza al cambiar de uid (useEffect sobre auth.currentUser)
}
```

Esto garantiza que al cambiar de usuario, el estado del perfil (pestaña activa, panel activo) no se filtre entre cuentas.

---

### Custom hook: `useLottieJson`

```js
function useLottieJson(src) {
  // fetch(src) → JSON → setAnimationData
  // Returns animationData o null mientras carga
}
```
Usado para cargar `/lottie/fire.json` (animación llama de racha).

---

### Función `normalizeStats(p)` → `EMPTY_STATS`

Convierte respuesta cruda del API en objeto con todos los campos tipados:
- `sesionesTotales`, `xpTotal`, `rachaMax`, `nivel`, `xp`, `xpNext`, `hp`
- `streak`, `coins`, `heroClass`, `username`, `email`, `heroName`, `titulo`, `bio`
- `createdAt`, `updatedAt`, `pendingEmailTarget`, `pendingEmailStatus`
- `activeBoosts: {}`, `streakShield: null`
- `ownedSkins: ["default"]`, `activeSkin`, `ownedAvatars`, `activeAvatar`
- `ownedFrames: []`, `activeFrame: null`, `ownedTitles: []`
- `weeklyXP`, `tiempoTotal`, `profileModules`

---

### Helpers de utilidad

```js
coerceDate(value)         // Firestore Timestamp → Date o null
formatStamp(value)        // → "02 ene 2025"
formatRecentStamp(value)  // → "Hoy 14:32" o "02 ene 2025"
isTodayStamp(value)       // → boolean
normalizeRarityLabel(raw) // → "Legendario" / "Raro" / "Comun" etc.
mergeCatalogEntryWithFallback(entry, fallback) // fusiona catálogo
getReadableProvider(providerId) // "Google" / "Correo y clave" / "GitHub"
```

#### `RARITY_RANK`
```js
{ Comun:1, "Poco comun":2, Raro:3, Epico:4, Legendario:5, Mitico:6 }
```

---

### Sub-componentes de soporte

#### `MiniBar({ val, max, color, height })`
Barra de progreso pequeña animada con shimmer.

#### `Spinner({ color })`
Spinner de 13px con borde superior coloreado.

#### `SavedFlash({ show })`
Flash "✓ Guardado" verde (aparece/desaparece con animación `up-saved`).

#### `CInput({ label, value, onChange, ... })`
Input/textarea custom con:
- Toggle show/hide para passwords (Eye / EyeOff de lucide-react)
- Error inline con animación `up-inlineErr`
- Clase `up-input` para estilos unificados

#### `HeroAvatar({ heroClass, size, animated })`
Avatar de clase con:
- Círculo con emoji + borde + radial gradient del color de clase
- Badge ⚡ en esquina inferior derecha
- Animación float opcional (`up-float`)

#### `FrameOverlay({ frameId, fallbackGradient, ... })`
Overlay del marco sobre el avatar:
1. Intenta cargar PNG `/marcos/{frameId}.png`
2. Si falla, usa `fallbackGradient` con mask CSS radial para dejar el centro transparente
3. Calcula `holePct = (avatarSize / outerSize) * 50` para que el marco encaje perfectamente

#### `ProfileAvatar({ heroClass, avatarId, frameId, size, cls })`
Avatar completo con frame:
- Contenedor externo = `size + 2 * PAD` (PAD = 22% del size)
- `motion.div` con `boxShadow` animado (glow pulsante 2.8s)
- Imagen PNG `/perfil/{avatar.id}.png` → fallback emoji con ID
- `FrameOverlay` si hay frameId
- Dot de clase animado (scale 1→1.15→1) en esquina

#### `ActiveBoosts({ activeBoosts, streakShield })`
Panel de boosts activos:
- Tick cada 1s (`setInterval`) para countdown en vivo
- Formateo: `h m` o `m s` según magnitud
- Barra de consumo: `initial:{width:"100%"}` → `animate:{width:"{pct}%"}`
- Borde urgente (`urgent = msLeft < 5 min`) con animación `up-boostUrg`
- Tipos: `xp_bonus` (⚡gold), `xp_mult` (✨accent2), `cooldown_red` (⏱️blue), `streakShield` (🛡️accent)
- Valor y descripción de cada boost

---

### TAB: RESUMEN (`TabResumen`)

Recibe: `{ stats, badges, actividad }`

#### Sub-paneles (3 rutas)

| ID | Título | Qué muestra |
|----|--------|-------------|
| `panel` | "Pulso, economía y boosts" | XP ring + bento grid + boosts |
| `campo` | "Semana, clase y marcas" | Gráfico semanal + stats de clase + stats generales |
| `insignias` | "Logros y rarezas" | Vitrina de 12 badges con rareza |

El estado se persiste en localStorage con `useScopedStorageState("fv-profile-summary-pane-v1", "panel")`.

#### XP Ring (sub-panel `panel`)
```js
const RR = 52;
const CIRC = 2 * Math.PI * RR; // 326.7
const dashOffset = CIRC * (1 - xpPct / 100);
// stroke-dashoffset transición 1.2s cubic-bezier(.3,.9,.4,1)
// Gradiente mpRG: secondary → primary
```

#### Bento grid (`mp-bento`)
```
grid: 1.55fr 1fr 1fr
mp-xp-card:    grid-row: span 2  (columna izquierda, ocupa 2 filas)
mp-streak-card: fila 1 col 2
mp-time-card:   fila 2 col 2
mp-coin-card:   fila 1 col 3
mp-week-card:   fila 2 col 3 (XP semanal, pequeño)
mp-ach-card:    fila 3 col 2-3
```

Cards con `themedCard(accent, bg)`:
```js
const themedCard = (accent, bg, glowAlpha=0.18) => ({
  "--mp-accent": accent,
  borderColor: withAlpha(accent, 0.28),
  background: `linear-gradient(145deg, rgba(16,18,34,.92), ${bg})`,
  boxShadow: `0 10px 28px rgba(0,0,0,.38), 0 0 22px ${withAlpha(accent, glowAlpha)}`,
});
```

#### Gráfico semanal (`mp-chart` — sub-panel `campo`)
- 7 columnas (LUN→DOM)
- Barras `mp-day-bar` con altura proporcional a sesiones del día
- Líneas guía horizontales en 25%, 50%, 75%
- Hover tooltip con sesiones + XP del día

#### Stats de clase (`mp-cls-card`)
STAT_LINES = FUERZA / RESISTENCIA / AGILIDAD / VITALIDAD (valores de `cls.stats`)

#### Stats generales (`mp-gen-card`)
- Misiones completadas
- Ejercicio favorito
- Categoría favorita
- Días activos
- Fecha de registro

#### Vitrina de logros (`mp-badge-grid — sub-panel `insignias`)
- 6 columnas (`repeat(6, 1fr)`)
- 12 slots (obtenidos + locked hasta completar)
- Rareza visual:

| Clase CSS | Rareza | Color borde |
|-----------|--------|-------------|
| `r-common` | Común | gris |
| `r-rare` | Raro | cyan |
| `r-epic` | Épico | púrpura |
| `r-legend` | Legendario | dorado |
| `r-mythic` | Mítico | rojo |

Fallback assets PNG por rareza:
```js
const getBadgeAsset = (badge, index) => {
  if (!badge.obtenido)            return "/logros/states/state-secret.png";
  if (badge.rareza === "Legendario") return "/ui/medals/rank-crown.png";
  if (badge.rareza === "Epico")      return "/ui/medals/medal-gold.png";
  if (badge.rareza === "Raro")       return "/ui/medals/medal-silver.png";
  return BADGE_FALLBACKS[index % 4];
};
```

---

### TAB: ESTADÍSTICAS / PROGRESO / HISTORIAL (`PerfilPlaceholderTab`)

Componente genérico que sirve las 3 tabs de lectura de datos. Recibe `tabId` y renderiza:
- Panel hero (copy, eyebrow, nota editorial)
- Stats cards en grid `auto-fit minmax(160px, 1fr)`
- Módulos de análisis en grid `auto-fit minmax(220px, 1fr)`
- **Module controls**: foco persistido en Firebase (`onPersistState`)
  - `focusOptions` (3 opciones)
  - `pinOptions` (3 anclas)
  - Estado guardado con "Última visita" formateada

`useEffect` → toca `lastViewedAt` si han pasado >20 min desde la última visita, después de 900ms de delay.

`onJump(target)` → permite navegar entre tabs desde los botones de acción:
- `"resumen"` → tab Resumen
- `"editar"` → tab Editar
- `"guardarropa"` → tab Guardarropa
- `"seguridad"` → tab Seguridad

---

### TAB: EDITAR (`TabEditar`)

Estado:
```js
const [editMode, setEditMode] = useState(false);
const [viewPane, setViewPane] = useScopedStorageState("fv-profile-edit-view-pane-v1", "identidad");
const [editPane, setEditPane] = useScopedStorageState("fv-profile-edit-form-pane-v1", "perfil");
const [form, setForm] = useState({ username, heroName, titulo, bio, heroClass });
const [loading, setLoading] = useState(false);
const [errors,  setErrors]  = useState({});
const [dirty,   setDirty]   = useState(new Set());
const [confirmClass, setConfirmClass] = useState(false);
const [pendingClass, setPendingClass] = useState(null);
```

**Validaciones:**
- `username`: requerido, 3-24 chars, pasa por `validateClean()` (filtro de profanidad)
- `bio`: max 200 chars (inferido del patrón)

**Cambio de clase:**
- Requiere confirmación con modal (`confirmClass` + `pendingClass`)
- Username no puede cambiar si `stats.usernameChanged === true` (flag del backend)

**Panes de edición:**
- `identidad`: username, heroName, bio, clase
- `apariencia`: avatar, marco, skin
- `titulo`: selector de títulos del catálogo

---

### TAB: GUARDARROPA / AVATARES / MARCOS / TÍTULOS

Sistemas de personalización:
- `AVATARS_CATALOG` → lista de avatares disponibles con precio y rareza
- `FRAMES_CATALOG` → marcos con `gradient`, `color`, `animated` flag
- `getSkins(token)` → skins de color del perfil
- `setActiveSkin(token, skinId)` → aplica skin
- `setActiveAvatar(token, avatarId)` → aplica avatar
- `setActiveFrame(token, frameId)` → aplica marco
- `purchaseAvatarItem(token, itemId)` → compra con monedas
- `buyTitle(token, titleId)` → compra título
- `equipTitle(token, titleId)` → equipa título activo

---

### TAB: SEGURIDAD

#### Cambio de contraseña
1. Verifica si el proveedor es `password`
2. Si es así, reauthentication con `reauthenticateWithCredential(user, EmailAuthProvider.credential(email, currentPassword))`
3. `updatePassword(user, newPassword)`

#### Cambio de email
1. `verifyBeforeUpdateEmail(user, newEmail)` → envía email de verificación
2. Guarda `pendingEmailTarget` en el perfil vía `updateProfile`
3. Muestra estado `pendingEmailStatus`: `"idle"` / `"pending"` / `"verified"`

#### Reautenticación con Google
- `reauthenticateWithPopup(user, new GoogleAuthProvider())`

#### Eliminar cuenta
- Modal de confirmación + reautenticación
- `deleteProfile(token)` → borra datos del backend
- Firebase `user.delete()`

---

### APIs

| Endpoint | Tab | Descripción |
|----------|-----|-------------|
| `getUserStats(token)` | Mount | Stats completas del héroe |
| `getLogrosCatalogo(token)` | Resumen | Catálogo de logros (caché 5min) |
| `getWeeklyActivity(token)` | Resumen | Actividad de los 7 días |
| `updateProfile(token, data)` | Editar | Guarda username, heroName, bio, clase, título, profileModules |
| `getSkins(token)` | Guardarropa | Catálogo de skins |
| `setActiveSkin(token, skinId)` | Guardarropa | Aplica skin |
| `getAvatarCatalog(token)` | Guardarropa | Catálogo de avatares |
| `purchaseAvatarItem(token, id)` | Guardarropa | Compra avatar/marco |
| `setActiveAvatar(token, id)` | Guardarropa | Aplica avatar |
| `setActiveFrame(token, id)` | Guardarropa | Aplica marco |
| `getTitlesCatalog(token)` | Editar | Lista de títulos disponibles |
| `buyTitle(token, id)` | Editar | Compra título |
| `equipTitle(token, id)` | Editar | Equipa título |
| `deleteProfile(token)` | Seguridad | Elimina datos del usuario |

---

### CSS prefix `mp-` (RPG redesign)

| Clase | Elemento |
|-------|----------|
| `mp-bento` | Grid bento 1.55fr / 1fr / 1fr |
| `mp-xp-card` | Card XP ring (span 2 rows) |
| `mp-ring-wrap` | Contenedor SVG del anillo |
| `mp-ring-bg/fg` | Círculos SVG del anillo (bg/fg) |
| `mp-ring-center` | Centro del anillo (nivel + crest) |
| `mp-card` | Card genérica (backdrop-filter blur(14px), rgba bg) |
| `mp-boost` | Card de boost (xp/shield/energy) |
| `mp-boost-ico` | Ícono hexagonal del boost (`clip-path: polygon(50% 0, 100% 25%, ...)`) |
| `mp-badge-grid` | Grid 6 columnas de logros |
| `mp-badge` | Badge individual con rareza |
| `mp-tabs` | Barra 5 tabs `repeat(5, 1fr)` |
| `mp-tab-btn` | Botón de pestaña |
| `mp-week-card` | Card de actividad semanal |
| `mp-day-bar` | Barra de día (height transition cubic-bezier) |
| `mp-stats-row` | Grid `1fr 1fr` stats clase + general |
| `mp-showcase-card` | Card de vitrina de logros |
| `up-input` | Estilos de input del formulario de edición |

---

### 5 pestañas del perfil

| # | ID | Label | Descripción |
|---|----|----|---|
| 1 | `resumen` | Resumen | Bento grid con XP, racha, boosts, actividad semanal, logros |
| 2 | `estadisticas` | Estadísticas | Mesa de estadísticas con stats reales del perfil |
| 3 | `progreso` | Progreso | Ruta de momentum: nivel próximo, boosts, racha |
| 4 | `guardarropa` | Guardarropa (Equipamiento) | Avatares, marcos, skins, títulos |
| 5 | `historial` | Historial | Memoria semanal, ejercicio/zona favorita, fecha de origen |

---

---

## 4. Tabla resumen

| Archivo | Función principal | APIs | Estado local | XP max/día |
|---------|------------------|------|--------------|------------|
| **UserMente** | Santuario mental con 7 actividades diarias, respiración interactiva, PERMA, afirmaciones por clase, pulso del gremio | 13 | mood + gratitud + PERMA + fortalezas + sesión | 210 XP |
| **UserMisiones** | Tablón de contratos RPG con 5 tipos, rareza dinámica, escenario visual por clase, countdown en tiempo real | 2 | tab + sort + selectedMission + claimedDays | Variable (XP por misión) |
| **UserPerfil** | Ficha del héroe con XP ring, bento grid, 5 tabs, guardarropa completo, seguridad Firebase | 14 | stats + badges + actividad + tab + editForm | — |

| Componente | CSS prefix | Paleta | Fuente |
|------------|------------|--------|--------|
| UserMente | `fvm-`, `fvr-`, `fvp-`, `fva-`, `sc-`, `mm-` | Wine Aurora: `#b06aff` + `#c89b3c` | Manrope / JetBrains Mono |
| UserMisiones | `umi-` | Glassmorphic clase-variable (`--class-accent`) | Manrope / JetBrains Mono |
| UserPerfil | `mp-`, `up-` | P palette (_SP alias) + `#6BC87A` + `#4CC9F0` | Manrope / JetBrains Mono |

| Característica | UserMente | UserMisiones | UserPerfil |
|----------------|-----------|-------------|------------|
| Animaciones Framer Motion | ✅ fadeUp, stagger | ✅ | ✅ spring, scale |
| Lottie | ❌ | ❌ | ✅ fire.json (lazy) |
| Video background | ❌ | ✅ (`<video>` stage) | ❌ |
| Cache cliente | ✅ Map + TTL 45s/2min | ✅ localStorage mission memory | ✅ Map session logros 5min |
| i18n | ✅ completo | ✅ | ✅ |
| localStorage scoped | ✅ `fv_mente_{uid}_*` | ✅ `um:*` | ✅ `useScopedStorageState` por uid |
| Firebase Auth directo | ❌ | ❌ | ✅ reauth + updatePassword + verifyBeforeUpdateEmail |
| Responsive | ✅ 6 breakpoints | ✅ 7 breakpoints | ✅ |
