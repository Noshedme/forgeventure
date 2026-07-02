# 10 · Pages/User: UserHome · UserLogros · UserMensajes

> Documentación de tesis — ForgeVenture v1  
> Carpeta: `frontend/src/pages/user/`  
> Archivos cubiertos: `UserHome.jsx`, `UserLogrosLanding.jsx`, `UserMensajes.jsx`

---

## Índice

1. [UserHome — El campo de batalla del día](#1-userhomejsx)
2. [UserLogros — La vitrina del héroe](#2-userlogroslandingjsx)
3. [UserMensajes — El buzón del gremio](#3-usermensajesjsx)

---

## 1. UserHome.jsx

**Ruta:** `frontend/src/pages/user/UserHome.jsx`  
**Props:** `{ profile, stats: statsProp, onNavigate }`

### 1.1 ¿Qué experiencia ofrece al usuario?

`UserHome` es la **primera pantalla que el usuario ve dentro del dashboard** — su mapa de aventura personal. No es un panel genérico de bienvenida: es una experiencia que lo recibe por su nombre, le muestra el estado real de su héroe en tiempo real, y le dice exactamente qué hacer a continuación.

La experiencia adapta su tono visual según el estado del día del usuario:

- Si ha entrenado y lleva racha, el fondo pulsa con energía, el personaje brilla, y chispas flotan en pantalla.
- Si no ha entrenado todavía, la pantalla se desatura levemente, el personaje pierde brillo, y la zona diaria le recomienda con suavidad que active la ruta.
- Si está a punto de subir de nivel, el borde del hero panel emite un pulso dorado continuo.

Esta inteligencia contextual convierte `UserHome` en un espejo del progreso real del usuario, no solo en un dashboard de datos.

### 1.2 Importaciones clave

```js
// Recharts para el gráfico de XP semanal
import { Area, AreaChart, CartesianGrid, RadialBar, RadialBarChart,
         ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// API (5 endpoints)
import { getUserStats, getMisionesUsuario, getUserLogros,
         getLeaderboard, getWeeklyActivity } from "../../services/api.js";

// Tema de clase
import { USER_CLASS_THEME as CLASS_META } from "./userClassTheme.js";
```

### 1.3 Datos visuales estáticos

**`HERO_IDLE_FRAMES`** — 8 frames de animación idle por clase, todos en `/avatar/idle/idle_0N.png`:
```js
const HERO_IDLE_FRAMES = {
  GUERRERO: Array.from({ length: 8 }, (_, i) => `/avatar/idle/idle_0${i + 1}.png`),
  // ... igual para ARQUERO, MAGO, DEFAULT
};
```

**`QUEST_ZONE`** — mapa de tipo de misión → zona RPG con color:
```js
const QUEST_ZONE = {
  fuerza:       { label: "Arena de fuerza",   color: "#e85d75" },
  cardio:       { label: "Ruta cardio",        color: "#4cc9f0" },
  hidratacion:  { label: "Fuente vital",       color: "#4cc9f0" },
  nutricion:    { label: "Fogón de nutrición", color: "#8ac926" },
  flexibilidad: { label: "Santuario móvil",    color: "#c08aff" },
  mente:        { label: "Santuario mental",   color: "#c08aff" },
};
```

**`QUEST_RARITY`** — 4 rarezas con color, clase CSS y conteo de gemas:
```js
const QUEST_RARITY = {
  comun:       { label:"Comun",      color:"#a89ab8", gemCount:1, icon:"/ui/rarity/rarity-common.png" },
  rara:        { label:"Rara",       color:"#4cc9f0", gemCount:2, icon:"/ui/rarity/rarity-rare.png" },
  epica:       { label:"Epica",      color:"#c08aff", gemCount:3, icon:"/ui/rarity/rarity-epic.png" },
  legendaria:  { label:"Legendaria", color:"var(--class-accent)", gemCount:4, icon:"/ui/rarity/rarity-legendary.png" },
};
```

**`SHOWCASE`** — 4 ítems de botín decorativo mostrados en la vitrina del mapa:
| Ítem | Rareza | Tipo | Fuente de lore |
|---|---|---|---|
| Trofeo Dragón | Legendario | Reliquia | Premio por quest física |
| Orbe de Enfoque | Épico | Artefacto | Botín de recuperación |
| Poción XP | Raro | Consumible | Mercado del gremio |
| Llave Legendaria | Legendario | Llave | Cadena y constancia |

**`STAT_CARDS`** — 4 atributos del héroe:
```js
const STAT_CARDS = [
  { key:"fuerza",      label:"Fuerza",      color:"#e85d75", asset:"/ui/stat-str.png" },
  { key:"resistencia", label:"Resistencia", color:"var(--class-secondary)", asset:"/ui/stat-sta.png" },
  { key:"agilidad",    label:"Agilidad",    color:"#8ac926", asset:"/ui/stat-spd.png" },
  { key:"vitalidad",   label:"Vitalidad",   color:"#4cc9f0", asset:"/ui/stat-men.png" },
];
```

### 1.4 Estado del componente

```js
const [stats,      setStats]      = useState(statsProp || {});  // datos del juego
const [missions,   setMissions]   = useState([]);               // misiones del usuario
const [achievements, setAchievements] = useState([]);           // logros recientes
const [leaderboard, setLeaderboard]  = useState([]);            // top jugadores
const [loading,    setLoading]    = useState(!statsProp);       // carga inicial
const [claimingId, setClaimingId] = useState(null);             // misión en proceso de claim
```

### 1.5 Carga inicial — 5 peticiones paralelas

```js
const [statsRes, missionsRes, achievementsRes, leaderboardRes, activityRes] =
  await Promise.allSettled([
    getUserStats(token),       // estadísticas de juego (nivel, XP, racha, etc.)
    getMisionesUsuario(token), // misiones activas del usuario
    getUserLogros(token),      // logros desbloqueados
    getLeaderboard(token),     // ranking global
    getWeeklyActivity(token),  // actividad semanal (7 días de XP)
  ]);
```

Si `statsProp` llega de `UserDashboard` (que ya los cargó), `loading` arranca en `false` y no lanza peticiones duplicadas. El efecto de `[statsProp]` sincroniza si el padre actualiza.

Los datos se normalizan con funciones utilitarias que manejan múltiples nombres de campo posibles:

```js
// Adaptadores de campos por si el backend usa nombres diferentes
pickObject(value, ["stats", "userStats", "data"])
pickArray(value,  ["misiones", "missions", "data"])
```

### 1.6 Sistema de estados del héroe

```js
const heroStateClass = [
  highStreak ? "is-hot-streak" : "",   // racha ≥ 7 días
  quietState ? "is-quiet" : "",         // no entrenó y sin actividad
  levelGlow  ? "is-ascension" : "",     // nivel a punto de subir o recién subido
  missionRush ? "is-clearing" : "",     // ≥70% misiones completadas o ≥3 completadas
].filter(Boolean).join(" ");
```

Estas clases afectan simultáneamente:
- El fondo de la página (saturación, partículas).
- El panel hero (borde, animación, box-shadow).
- El portal (aura de luz radial detrás del personaje).
- El personaje animado (filtros de color y glow).
- Las chispas flotantes (opacidad y velocidad de drift).

**Cálculo de `quietState`:**
```js
const quietState = trainedToday === false && !missionRush && !highStreak;
```

**`trainedToday`** se resuelve contra 8 posibles campos del backend:
```js
function resolveTodayActivity(stats, profile, missions) {
  const candidates = [
    stats?.lastWorkoutAt, stats?.lastExerciseAt, stats?.lastActivityAt,
    stats?.lastMissionAt, stats?.updatedAt,
    profile?.lastWorkoutAt, profile?.lastExerciseAt, profile?.lastActivityAt,
  ];
  // Si alguno es de hoy (mismo año/mes/día) → trainedToday = true
  // Si las misiones tienen completadaHoy → trainedToday = true
  // Si ningún campo existe → trainedToday = null (no se muestra pill)
}
```

### 1.7 `resolveDailyZone` — el consejero de clase

```js
function resolveDailyZone({ classKey, trainedToday, missionPct, streak, gems, coins })
```

Esta función devuelve la "misión del momento" personalizada según el estado actual del usuario. Es el corazón de la guía contextual:

| Condición | Recomendación | Acción |
|---|---|---|
| `trainedToday === false` | "Activa la ruta de hoy" — entrada corta | → `misiones` |
| `missionPct < 45` | "Pasa por la fuente" — action ligera | → `misiones` |
| Clase GUERRERO con actividad | "La arena pide fuerza" — rutina corta | → `ejercicios` |
| Clase ARQUERO con actividad | "Ruta ligera, paso firme" — cardio/movilidad | → `ejercicios` |
| Clase MAGO con actividad | "La torre pide respiración" — flexibilidad | → `mente` |
| Racha ≥7 o gemas > 0 o monedas ≥250 | "Revisa el mercado" — botín esperando | → `tienda` |
| Default | "Elige una quest corta" — sin presión | → `misiones` |

El resultado contiene: `title`, `text`, `icon`, `marker`, `color`, `action`, `actionLabel`, `chip`. Todo se renderiza como el "Daily Zone" — el panel con fondo degradado bajo el título del hero.

### 1.8 `HeroCharacterLoop` — personaje animado por frames

```js
function HeroCharacterLoop({ classKey, meta, heroStateClass }) {
  const frames = HERO_IDLE_FRAMES[classKey]; // 8 frames
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const speed = heroStateClass.includes("is-hot-streak") ? 128 : 145;
    const id = setInterval(() => {
      setFrame(current => (current + 1) % frames.length);
    }, speed);
    return () => clearInterval(id);
  }, [failed, frames.length, heroStateClass]);
}
```

Cicla entre 8 frames PNG con sprite animation manual. La velocidad aumenta a 128ms (de 145ms base) cuando el héroe está en "hot streak", comunicando energía mayor. Si `prefers-reduced-motion` está activo, el intervalo no se activa. Si la imagen falla, carga `idle_01.png` de respaldo.

Las 8 imágenes se precargan con `new Image()` en el `useEffect` inicial para eliminar el parpadeo en la primera iteración:
```js
frames.forEach((src) => { const img = new Image(); img.src = src; });
```

### 1.9 Las 16 chispas de clase

```jsx
{Array.from({ length: 16 }, (_, index) => (
  <span
    className="uh-spark"
    style={{
      "--x": `${8 + ((index * 17) % 86)}%`,   // posición horizontal
      "--y": `${18 + ((index * 23) % 70)}%`,   // posición vertical
      "--s": `${2 + (index % 3)}px`,            // tamaño (2-4px)
      "--t": `${5 + (index % 5) * .8}s`,        // duración del drift
      "--d": `${index * -.45}s`,                 // delay escalonado
      "--dx": `${index % 2 ? "-" : ""}${18 + (index % 4) * 8}px`, // dirección H
    }}
  />
))}
```

16 puntos luminosos del color de la clase, distribuidos pseudoaleatoriamente usando aritmética modular con números primos (17, 23, etc.) para evitar simetría obvia. Cada uno flota verticalmente 72px con animación `uh-drift` y desaparece con fade. En `is-hot-streak`, el glow del box-shadow se intensifica.

### 1.10 `handleClaim` — reclamar una misión

```js
async function handleClaim(missionId) {
  if (claimingId) return; // evita doble submit
  setClaimingId(missionId);
  const token = await user.getIdToken();
  await claimMision(token, missionId);

  // Recarga instantánea tras el claim
  const [statsRes, missionsRes] = await Promise.allSettled([
    getUserStats(token),
    getMisionesUsuario(token),
  ]);
  // Actualiza solo las stats y misiones (no toca logros ni leaderboard)
}
```

El estado `claimingId` evita clicks múltiples. Tras el claim exitoso, re-obtiene stats y misiones en paralelo y hace merge parcial de las stats (`setStats(prev => ({ ...prev, ...statsData }))`).

### 1.11 Secciones del layout

La página se divide en 5 grandes secciones:

| Sección | Layout | Contenido |
|---|---|---|
| **Hero** | 2 cols (`1.05fr / .95fr`) | Copy del héroe + personaje animado en portal con auras |
| **Daily Zone** | Banda de ancho completo | Recomendación contextual del día con ícono de zona |
| **Stats** | 4 cols iguales | Tarjetas de Fuerza/Resistencia/Agilidad/Vitalidad con barras RPG |
| **Quest + Showcase** | 2 cols (`1.25fr / .75fr`) | Lista de misiones activas + vitrina de botín |
| **Chart + Leaderboard** | 2 cols | Gráfico área XP semanal (Recharts) + ranking global top 5 |

Las misiones se ordenan con `CLASS_META.focusZones` — las de la zona prioritaria de la clase suben primero.

### 1.12 Gráfico XP semanal

El gráfico usa datos reales del backend si están disponibles, o construye una curva plausible como fallback:

```js
function buildTrendData(stats, level, missions) {
  // Prioridad 1: datos reales del backend (weeklyActivity, actividadSemanal, etc.)
  const source = firstArrayFromObject(stats, ["weeklyActivity","actividadSemanal","activity","historial"]);
  if (source.length) return source.slice(-7).map(entry => ({
    day: entry.dia || entry.day,
    xp: entry.xp || entry.totalXp,
    quests: entry.misiones || entry.quests,
  }));

  // Fallback: curva ascendente basada en XP acumulada y misiones completadas
  const base = Math.max(35, Math.round((level.xp || 120) / 14));
  return ["Lun","Mar","Mie","Jue","Vie","Sab","Hoy"].map((day, i) => ({
    day,
    xp: Math.max(0, Math.round(base * (0.46 + i * 0.14) + completed * 18)),
    quests: Math.max(0, completed - (6 - i)),
  }));
}
```

Siempre hay una curva que mostrar — el usuario nunca ve el gráfico vacío.

El tooltip personalizado (`CustomTooltip`) usa el ícono de zona `/ui/icons/map-pin.png` y muestra los valores de XP y quests del día seleccionado con el color de clase.

---

## 2. UserLogrosLanding.jsx

**Ruta:** `frontend/src/pages/user/UserLogrosLanding.jsx`  
**Props:** `{ profile, onNavigate }`

### 2.1 ¿Qué experiencia ofrece al usuario?

`UserLogrosLanding` es la **vitrina de trofeos** del héroe — el museo personal de su esfuerzo. Lo que hace especial a esta pantalla es que los logros no son solo medallas pasivas: son objetos interactivos que se pueden examinar, cobrar y filtrar.

El usuario llega aquí y puede ver de un vistazo cuántos logros tiene de cada rareza, cuáles están listos para reclamar (con borde dorado iluminado), cuáles son secretos (ocultos hasta cumplir condición), y cuánto XP total ha ganado la colección. Los logros "listos para reclamar" atraen la atención del usuario de forma inmediata.

El componente hace polling silencioso cada 45 segundos y se refresca automáticamente cuando el usuario completa un ejercicio — los logros de ejercicios aparecen casi en tiempo real sin que el usuario tenga que navegar o hacer refresh.

### 2.2 Constantes y metadatos

**`TYPE_META`** — 7 categorías de logros con su zona temática:
```js
const TYPE_META = {
  Ejercicio: { icon: Dumbbell, color: "#ff8f5f", label: "Campo físico" },
  Racha:     { icon: Flame,    color: "#ffb13a", label: "Cadencia diaria" },
  Nivel:     { icon: TrendingUp, color: "#f4cc78", label: "Ascenso del héroe" },
  Social:    { icon: Users,    color: "#67d5ff", label: "Círculo del gremio" },
  Especial:  { icon: Star,     color: "#c08aff", label: "Sala especial" },
  Mente:     { icon: Brain,    color: "#59d5c6", label: "Dominio mental" },
  Secreto:   { icon: HelpCircle, color: "#9aa0b6", label: "Archivo sellado" },
};
```

**`STAGE_THEME`** — escena del héroe por clase (imagen de fondo + copy del salón):
```js
const STAGE_THEME = {
  GUERRERO: { image: "/missions/missions-hero-warrior.png", label: "Salón de hierro",
              copy: "Insignias de fuerza, constancia y cierre firme del esfuerzo real." },
  ARQUERO:  { image: "/missions/missions-hero-archer.png",  label: "Galería del pulso",
              copy: "Medallas que se ganan con ritmo, cardio y precisión sostenida." },
  MAGO:     { image: "/missions/missions-hero-mage.png",    label: "Archivo del foco",
              copy: "Sellos ligados a disciplina mental, calma y dominio del avance." },
};
```

### 2.3 Funciones de rareza y estado

**`getRarezaMeta`** — normaliza el campo rareza del backend (acepta "legendario", "legendary", "Epico", "epic", etc.):
```js
function getRarezaMeta(value) {
  const key = normalizeLoose(value);  // quita tildes, minúsculas, trim
  if (key === "legendario" || key === "legendary") return { key:"legendary", color:UI.gold, tier:4, asset:"...png" };
  if (key === "epico" || key === "epic")            return { key:"epic",      color:UI.purple, tier:3, ... };
  if (key === "raro" || key === "rare")             return { key:"rare",      color:UI.blue,   tier:2, ... };
  return                                                   { key:"common",    color:UI.orange, tier:1, ... };
}
```

**`getStatusMeta`** — determina el estado visual de un logro:
```js
if (logro?.reclamado) return { key:"claimed",   label:"Archivado",          color:UI.green,   ... };
if (logro?.obtenido)  return { key:"claimable", label:"Lista para reclamar", color:UI.gold,    ... };
if (logro?.secreto)   return { key:"secret",    label:"Sello oculto",        color:UI.mutedDeep, ... };
return                        { key:"active",    label:"En progreso",         color:classAccent, ... };
```

**`achievementProgress`** — porcentaje de progreso:
```js
function achievementProgress(logro) {
  return Math.round((Number(logro?.progreso || 0) / Math.max(1, Number(logro?.total || 1))) * 100);
}
```

### 2.4 Estado del componente

```js
const [logros,         setLogros]         = useState([]);      // catálogo completo
const [search,         setSearch]         = useState("");
const [filterTipo,     setFilterTipo]     = useState("Todos"); // tipo de logro
const [filterRarity,   setFilterRarity]   = useState(/* localStorage */);
const [filterState,    setFilterState]    = useState(/* localStorage */);
const [selectedId,     setSelectedId]     = useState(null);   // logro destacado en el panel
const [claiming,       setClaiming]       = useState(null);   // ID en proceso de claim
const [xpNotif,        setXpNotif]        = useState(null);   // popup +XP
const [levelUpPop,     setLevelUpPop]     = useState(null);   // popup level up
const [newToast,       setNewToast]       = useState(null);   // toast de logro nuevo desbloqueado
const [detailOpen,     setDetailOpen]     = useState(null);   // modal de detalle
const [expandedGroups, setExpandedGroups] = useState({});     // grupos tipo colapsados/expandidos
```

Los filtros de rareza y estado se persisten en `localStorage("ulg-rarity")` y `localStorage("ulg-state")` para mantener la configuración entre visitas.

### 2.5 `loadLogros` — carga y detección de nuevos logros

```js
const loadLogros = useCallback(async (silent = false) => {
  const token = await user.getIdToken();
  const res = await getLogrosCatalogo(token);
  const next = res?.ok && Array.isArray(res.logros) ? res.logros : [];

  // Detecta logros nuevos comparando con el snapshot anterior
  const newUnlocked = next.filter(item => {
    const old = prevRef.current.find(e => e.id === item.id);
    return item.obtenido && !old?.obtenido;
  });

  if (newUnlocked.length > 0) {
    setNewToast(newUnlocked[0]);            // muestra toast del primer logro nuevo
    setTimeout(() => setNewToast(null), 4200);
  }
  prevRef.current = next;
  setLogros(next);
}, []);
```

### 2.6 Actualización en tiempo real y polling

```js
// Polling silencioso cada 45 segundos (solo si la pestaña está visible)
pollRef.current = setInterval(() => {
  if (!document.hidden) loadLogros(true);
}, 45000);

// Refresco instantáneo tras completar un ejercicio
window.addEventListener("exerciseCompleted", () => loadLogros(true));

// Deeplink desde el chat: abre un logro específico
window.addEventListener("chatGameplayLink", (event) => {
  const targetId = event.achievementId || event.entityId;
  const targetLogro = logros.find(l => l.id === targetId);
  if (targetLogro) setSelectedId(targetLogro.id);
});
```

La cadena de actualización es: ejercicio completado → `exerciseCompleted` event → `loadLogros(silent)` → diferencia contra `prevRef.current` → toast si hay nuevos.

### 2.7 Métricas calculadas

```js
const claimable    = logros.filter(l => l.obtenido && !l.reclamado);      // pendientes de cobrar
const claimed      = logros.filter(l => l.reclamado);                     // ya cobrados
const obtained     = logros.filter(l => l.obtenido);                      // desbloqueados
const visibleTotal = logros.filter(l => !l.secreto || l.obtenido).length; // no secretos
const pct          = Math.round(obtained.length / visibleTotal * 100);    // % completado
const xpTotal      = claimed.reduce((sum, l) => sum + l.xpBonus, 0);     // XP cobrado
const xpPending    = claimable.reduce((sum, l) => sum + l.xpBonus, 0);   // XP por cobrar
const honorShowcase = [...claimed]
  .sort((a,b) => getRarezaMeta(b.rareza).tier - getRarezaMeta(a.rareza).tier)
  .slice(0, 6); // top 6 cobrados por rareza
```

**`raritySummary`** — resumen de obtenidos por rareza:
```js
const raritySummary = ["common","rare","epic","legendary"].map(key => ({
  count: logros.filter(l => getRarezaMeta(l.rareza).key === key && l.obtenido).length,
  total: logros.filter(l => getRarezaMeta(l.rareza).key === key).length,
  meta: getRarezaMeta(key),
}));
```

### 2.8 Filtrado y agrupación

```js
const filtered = useMemo(() => logros.filter(l => {
  if (search) { /* busca en nombre + descripción */ }
  if (filterTipo !== "Todos" && l.tipo !== filterTipo) return false;
  if (filterRarity !== "all" && getRarezaMeta(l.rareza).key !== filterRarity) return false;
  const state = getStatusMeta(l, classTheme.accent).key;
  if (filterState === "claimable" && state !== "claimable") return false;
  // ... etc
  return true;
}), [logros, search, filterTipo, filterRarity, filterState]);

const grouped = useMemo(() =>
  Object.keys(TYPE_META)                       // 7 tipos en orden fijo
    .map(tipo => ({ tipo, items: filtered.filter(l => l.tipo === tipo) }))
    .filter(group => group.items.length > 0),  // omite tipos sin resultados
[filtered]);
```

Los grupos colapsables se controlan por `expandedGroups[tipo]` — un objeto de flags que persiste en el estado del componente.

### 2.9 Sub-componentes de logro

**`StatFlipCard`** — tarjeta 3D que gira para mostrar descripción:
```js
// Front: número y label
// Back: texto explicativo de qué significa ese stat
// Click → rotateY(180deg) con perspectiva 900px y transition .4s
```

**`AchievementRowCompact`** — tarjeta flip para el grid de logros:
- Frente: emoji/medalla + nombre abreviado + estado en color de rareza.
- Dorso: descripción, barra de progreso, XP del logro, botón "Cobrar" si listo.
- Click en el frente da vuelta la tarjeta. El botón "Cobrar" en el dorso tiene `stopPropagation` para no girarla de vuelta.

**`AchievementRow`** — fila expandible para la vista en lista:
- Siempre muestra: emoji, nombre, estado, progreso numérico, XP reward.
- Si está seleccionada (`is-selected`), expande un bloque con descripción + barra de progreso.
- Botón "Cobrar" (visible si `claimable`), check verde (si `claimed`), candado (`Lock` icon, si en progreso).

**`DetailModal`** — modal de detalle con AnimatePresence:
- Imagen de fondo: `/logros/{id}-detail.png`.
- Chips de rareza y estado con sus colores.
- Barra de progreso con gradiente rareza.
- 2 cards de info: "Objetivo" (descripción, oculta si es secreto) y "Botín" (XP + gemas secundarias).
- Botón "Reclamar recompensa" (si listo) o "Cerrar ficha" (si no).

### 2.10 `handleClaim` — reclamar un logro

```js
const handleClaim = useCallback(async (logro) => {
  if (!logro || logro.reclamado || claiming === logro.id) return;
  setClaiming(logro.id);                          // muestra spinner en el botón
  const token = await user.getIdToken();
  const res = await claimLogro(token, logro.id);

  // Actualización optimista local inmediata
  setLogros(current => current.map(item =>
    item.id === logro.id ? { ...item, reclamado: true, obtenido: true } : item
  ));

  // Popup de XP si canShowXpPopups()
  const xp = res?.xpGranted ?? res?.xpGanado ?? logro.xpBonus;
  if (xp > 0) { setXpNotif(xp); setTimeout(() => setXpNotif(null), 2600); }
}, [claiming]);
```

La actualización es **optimista** — el logro se marca como reclamado en el estado local inmediatamente, sin esperar refresco del servidor. Esto hace que la UI sea instantánea para el usuario.

### 2.11 Layout del componente

```
┌─────────────────────────────────────────────────────────┐
│ HERO (2 cols: 1.04fr / .96fr)                           │
│  ├─ Hero copy: kicker, H1, lead text, chips de rareza   │
│  │  4 StatFlipCards con métricas (logros, XP, etc.)     │
│  └─ Stage: escena del héroe por clase + honor showcase  │
├─────────────────────────────────────────────────────────┤
│ BANDA (3 cols: 1.3fr / .92fr / .92fr)                   │
│  ├─ Band copy: %completado + barra + 4 rarezas resumen  │
│  ├─ Card: XP total cobrado                              │
│  └─ Card: XP pendiente por cobrar                       │
├─────────────────────────────────────────────────────────┤
│ CONTENT (2 cols: 1.34fr / .9fr)                         │
│  ├─ BOARD (izquierda): tabs tipo, toolbar (search/sort) │
│  │  Grupos de logros por tipo (colapsables)             │
│  │  Modo grid: AchievementRowCompact (flip 3D)          │
│  │  Modo lista: AchievementRow (expandible)             │
│  └─ SPOT (derecha, sticky): panel del logro seleccionado│
│     Con banner de imagen, info de objetivo y botón     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. UserMensajes.jsx

**Ruta:** `frontend/src/pages/user/UserMensajes.jsx`  
**Props:** `{ user, profile, onUnreadChange }`

### 3.1 ¿Qué experiencia ofrece al usuario?

`UserMensajes` es el **buzón oficial del gremio** — donde el administrador de ForgeVenture se comunica con el usuario mediante anuncios, eventos, avisos del sistema, reconocimientos y mensajes personalizados.

Lo que hace especial a este buzón es que no es un simple inbox de texto: cada mensaje tiene contexto visual (imagen de cabecera si existe, colores por tipo, prioridad visual), metadatos de juego (botín asociado, sección destino, fecha de vencimiento), y una prioridad calculada algorítmicamente. Los mensajes urgentes suben solos y los eventos que vencen hoy se destacan.

El sistema de lectura es **completamente optimista y batched** — el usuario ve la marca de "leído" inmediatamente al abrir un mensaje, y las peticiones al servidor se agrupan en lotes de 1.2 segundos para minimizar llamadas a la API.

La copia de la sección cambia por clase:
- Guerrero: "Mantén el pulso del mapa, sin ahogarte en el ruido."
- Arquero: "Filtra la señal, abre solo lo que importa."
- Mago: "Ordena el tablero, lee sin perder el foco."

### 3.2 Tipos de mensajes

**`MESSAGE_TYPE_META`** — 5 tipos con color, ícono y asset:
```js
const MESSAGE_TYPE_META = {
  announcement: { label:"Anuncio",  color:"#b58cff", icon:Megaphone,     tone:"Comunicado del mapa" },
  warning:      { label:"Aviso",    color:"#84df6f", icon:AlertTriangle,  tone:"Señal prioritaria" },
  system:       { label:"Sistema",  color:"#68c8ff", icon:Zap,            tone:"Ajuste del tablero" },
  achievement:  { label:"Logro",    color:"#f2c66d", icon:Trophy,         tone:"Reconocimiento" },
  event:        { label:"Evento",   color:"#ff7c96", icon:CalendarDays,   tone:"Ventana especial" },
};
```

**`PRIORITY_META`** — 3 niveles de prioridad:
```js
const PRIORITY_META = {
  info:   { label:"Informativo",       color:SC.blue },
  action: { label:"Acción recomendada", color:SC.gold },
  urgent: { label:"Urgente",           color:SC.red  },
};
```

**`getMessagePriority(msg)`** — determina la prioridad:
```js
// tags "urgent"/"important" o type "warning" → urgent
// tags "action"/"claim" o msg.actionRequired o type "event" → action
// resto → info
```

### 3.3 Filtros disponibles

9 filtros en la barra lateral izquierda:

| Filtro | Descripción |
|---|---|
| `all` | Todo el buzón |
| `unread` | Sin leer |
| `important` | Prioridad alta (tag "important") |
| `saved` | Guardados por el usuario |
| `announcement` | Anuncios del gremio |
| `warning` | Avisos y alertas |
| `system` | Mensajes del sistema |
| `achievement` | Reconocimientos de logros |
| `event` | Eventos con ventana temporal |

Cada chip muestra el conteo actualizado en tiempo real. El filtro activo persiste en `localStorage("fv-msg-filter-{uid}")`.

### 3.4 Estado del componente

```js
// Datos
const [messages,        setMessages]        = useState([]);
const [loading,         setLoading]         = useState(true);
const [hasMoreHistory,  setHasMoreHistory]  = useState(true);

// UI
const [isMobile,        setIsMobile]        = useState(window.innerWidth < 980);
const [isNarrow,        setIsNarrow]        = useState(window.innerWidth < 1180);
const [showRail,        setShowRail]        = useState(false);     // panel filtros mobile
const [filter,          setFilter]          = useState("all");
const [search,          setSearch]          = useState("");
const [selectedMsgId,   setSelectedMsgId]   = useState("");

// Estado de lectura (3 capas)
const [savedIds,        setSavedIds]        = useState(() => new Set());
const [pendingSavedIds, setPendingSavedIds] = useState(() => new Set()); // en proceso
const [localReadIds,    setLocalReadIds]    = useState(() => new Set()); // optimistic
const [remoteReadIds,   setRemoteReadIds]   = useState(() => new Set()); // Firestore
const [pendingReadIds,  setPendingReadIds]  = useState(() => new Set()); // en batch

const [syncedAt,        setSyncedAt]        = useState(null);
const [syncState,       setSyncState]       = useState("idle");   // idle|syncing|ready
```

### 3.5 Tres fuentes de datos simultáneas

```
┌─────────────────────────────────────────────────────────────┐
│  FUENTE 1: Firestore real-time (2 queries onSnapshot)       │
│  - adminMessages where targetAll==true  (broadcast)         │
│  - adminMessages where targetUid==uid   (mensajes personales)│
│  Solo detectan CAMBIOS de firma — no cargan mensajes directo│
│  → disparan refreshHeadMessages con 650ms debounce          │
├─────────────────────────────────────────────────────────────┤
│  FUENTE 2: REST paginado (getUserMessagesPage)              │
│  - Carga inicial: 60 mensajes                               │
│  - Paginación por cursor: "cargar más"                      │
│  - Merge en Map por id (elimina duplicados broadcast+target) │
├─────────────────────────────────────────────────────────────┤
│  FUENTE 3: Estado de lectura (Firestore subcollección)       │
│  - users/{uid}/messageState where kind=="adminMessage"      │
│  - onSnapshot → remoteReadIds Set actualizado en tiempo real│
└─────────────────────────────────────────────────────────────┘
```

### 3.6 Sistema de lectura optimista con batch flush

```js
const handleRead = useCallback((msg) => {
  // 1. Actualización inmediata del estado local (UI responde al instante)
  setLocalReadIds(prev => new Set(prev).add(msg.id));
  setPendingReadIds(prev => new Set(prev).add(msg.id));

  // 2. Acumular en queue (no envía al servidor todavía)
  markReadQueueRef.current.add(msg.id);

  // 3. Debounce: envía el lote 1.2s después del último read
  clearTimeout(markReadTimerRef.current);
  markReadTimerRef.current = setTimeout(async () => {
    const ids = [...markReadQueueRef.current];
    markReadQueueRef.current = new Set();
    await markAllMessagesRead(token, ids); // un solo API call para N mensajes

    // Si falla: rollback de los IDs que no estaban en remoteReadIds
  }, 1200);
}, []);
```

**Ventaja:** El usuario que abre 5 mensajes en 2 segundos genera 1 sola llamada al backend (no 5). El rollback en caso de error restaura el estado visual anterior.

**`isRead(msg)`** — combina las 3 fuentes:
```js
const isRead = (msg) => localReadIds.has(msg.id) || remoteReadIds.has(msg.id) || Boolean(msg?.isRead);
```

### 3.7 Caché de preferencias de sesión

```js
// Map global que sobrevive desmontajes del componente dentro de la misma pestaña
const _sessionPrefCache = new Map(); // uid → { savedIds: string[], ts: number }
const SESSION_PREF_TTL = 3 * 60_000; // 3 minutos

// Al cargar preferencias (savedIds):
const cached = _sessionPrefCache.get(user.uid);
if (cached && Date.now() - cached.ts < SESSION_PREF_TTL) {
  setSavedIds(new Set(cached.savedIds));  // sirve desde caché, no hace llamada
  return;
}
// Si expiró o no existe → getMessagePreferences(token) → actualiza caché
```

Esto evita una lectura de Firestore por cada vez que el componente se monta (p. ej. al navegar entre secciones del dashboard y volver).

### 3.8 Sistema de lectura de Firestore en tiempo real (sin overdispatch)

```js
// Firestore envía eventos en el montaje con el estado inicial.
// pulseInitCountRef evita un refresh innecesario en esas 2 primeras snapshots:
if (pulseInitCountRef.current < 2) {
  pulseInitCountRef.current += 1;
  pulseSignatureRef.current = combined;
  return; // ignora el primer y segundo disparo (son solo el snapshot inicial)
}

// A partir del 3er disparo: compara firma
if (combined !== pulseSignatureRef.current) {
  pulseSignatureRef.current = combined;
  scheduleHeadRefresh(); // debounce 650ms
}
```

**Firma:** `"${broadcastSignature}::${targetedSignature}"` donde cada parte es `"{docId}:{seconds}"` concatenado. Si cambia cualquier campo de fecha o aparece un doc nuevo, la firma cambia y se dispara el refresh.

### 3.9 Ordenación inteligente de mensajes

```js
function score(msg) {
  let total = 0;
  if (!isRead(msg))                  total += 120; // no leído sube mucho
  if (msg.tags?.includes("important")) total += 80; // tag important
  if (savedIds.has(msg.id))            total += 44; // guardado por el usuario
  if (msg.type === "event" && active)  total += 36; // evento activo
  return total;
}

return [...filteredMessages].sort((a, b) => {
  const scoreDiff = score(b) - score(a);
  if (scoreDiff !== 0) return scoreDiff;
  return new Date(b.createdAt) - new Date(a.createdAt); // tie-breaker: más reciente primero
});
```

Un mensaje urgente no leído siempre aparece primero. Un mensaje antiguo guardado supera a uno nuevo leído.

### 3.10 Agrupación temporal

```js
function getTemporalBucket(ts) {
  const date = new Date(ts);
  if (date >= todayStart) return "today";        // Hoy — "Pulso inmediato"
  if (date >= weekStart)  return "week";          // Esta semana — "Lectura reciente"
  return "archive";                               // Más antiguo — "Notas previas"
}
```

La lista de mensajes se divide en 3 grupos con su propio encabezado y descripción de contexto. Los grupos vacíos se omiten del render.

### 3.11 Paginación por cursor

```js
const handleLoadOlder = async () => {
  if (loadingMore || !hasMoreHistory || !oldestCursorRef.current) return;
  const response = await getUserMessagesPage(token, {
    cursor: oldestCursorRef.current,
    limit: 60,               // HISTORY_PAGE_SIZE
  });
  olderHistoryRef.current = [...olderHistoryRef.current, ...loaded];
  mergeMessages(headMessagesRef.current, olderHistoryRef.current);
  // oldestCursorRef actualizado para la siguiente página
};
```

El merge usa un `Map` indexado por ID para eliminar duplicados entre la carga inicial (`headMessages`) y las páginas anteriores (`olderHistory`). Los mensajes expirados y no publicados se filtran en el merge:

```js
if (msg.status && msg.status !== "published") return;
if (msg.publishAt && new Date(msg.publishAt) > now) return;   // no publicado aún
if (msg.expiresAt && new Date(msg.expiresAt) < now) return;   // ya venció
```

### 3.12 `toggleSave` — guardar/desguardar mensaje

```js
const toggleSave = async (msgId) => {
  if (pendingSavedIds.has(msgId)) return; // evita doble click

  // Optimistic update
  const wasSaved = savedIds.has(msgId);
  _sessionPrefCache.delete(user.uid); // invalida caché de preferencias
  setSavedIds(prev => { const next = new Set(prev); wasSaved ? next.delete(msgId) : next.add(msgId); return next; });

  // API call
  await (wasSaved ? unsaveMessageForUser : saveMessageForUser)(token, msgId);
  // Si falla: rollback
};
```

### 3.13 Signals del héroe y resumen de revisión

**`heroSignals`** — 3 indicadores rápidos en la topbar de la sección:
```js
[
  { label: `${unreadSystem} aviso nuevo del sistema`,   active: unreadSystem > 0 },
  { label: `${unseenAchievements} reconocimientos listos`, active: unseenAchievements > 0 },
  { label: `${dueTodayEvents} evento vence hoy`,         active: dueTodayEvents > 0 },
]
```

**`reviewSignals`** — 3 ítems de contexto para el panel derecho, mostrando siempre la información más urgente:
- Prioridad 1: mensaje urgente sin abrir.
- Prioridad 2: evento que cierra en menos de 48h.
- Prioridad 3: reconocimiento nuevo sin ver.
- Si nada urgente: cuenta de no leídos + primer mensaje + guardados acumulados.

### 3.14 `DetailPanel` — el lector de mensajes

Cuando el usuario selecciona un mensaje en la lista, se muestra en `DetailPanel` a la derecha (o como overlay en mobile). El panel incluye:

- **Cabecera visual:** imagen del mensaje (si tiene `imageUrl`) o gradiente del tipo. Ícono de 72px, título, tono temático, fecha completa formateada.
- **Botones de acción:** "Marcar leído" (desactivado si ya leído o pendiente), "Guardar" (toggle con BookmarkCheck/Bookmark), "Cerrar" (solo en mobile).
- **Cuerpo del mensaje:** texto completo con `white-space: pre-wrap` para respetar saltos de línea.
- **5 facts de metadatos:** Origen, Alcance (Global/Solo para ti), Vigencia, Botín, Acción — en grid 2×3.
- **Badges:** tipo de mensaje, prioridad, estado de lectura.
- **Tags** del mensaje en chips de texto.

El estado vacío ("Elige una nota del tablero") usa el ícono `ScrollText` con texto que invita a seleccionar un mensaje, en lugar de mostrar un panel en blanco.

### 3.15 Layout responsive de 3 columnas

```css
.fvg-msg-3col {
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr) 372px;
}
@media (max-width: 1180px) { grid-template-columns: 170px minmax(0, 1fr); /* sin detalle */ }
@media (max-width: 1024px) { grid-template-columns: 1fr; /* stacked */ }
```

| Columna | Contenido |
|---|---|
| Izquierda (228px) | Rail de filtros con contadores. En mobile: overlay lateral toggle |
| Centro (1fr) | Lista de mensajes agrupados + búsqueda + controles |
| Derecha (372px) | Panel de detalle sticky. En mobile: overlay fullscreen |

Las métricas de la cabecera (`MetricCard`) incluyen: total de mensajes, no leídos, guardados, y el último mensaje recibido, cada uno con su color de tipo y glow text-shadow.

---

## Resumen de valor por archivo

| Archivo | Rol en el sistema | Qué le da al usuario |
|---|---|---|
| `UserHome` | Vista de bienvenida contextual con estado del día | Personalización real: el héroe cambia visualmente según lo que el usuario hizo o no hizo ese día; 5 fuentes de datos en paralelo y una guía de zona diaria que le dice exactamente cuál es su próximo movimiento |
| `UserLogrosLanding` | Vitrina de trofeos con logros en tiempo real | Una colección viva que se actualiza sola al entrenar, con logros reclamables en un click, rareza visual clara, polling silencioso y detección automática de nuevos logros desbloqueados |
| `UserMensajes` | Buzón oficial con Firestore real-time y lectura por lotes | Comunicación del administrador con estilo de bitácora de gremio: mensajes agrupados, prioridad automática, lectura optimista batched, guardado sincronizado y detección en tiempo real de nuevas entradas sin polling manual |

---

*Documentación generada para tesis — ForgeVenture 2026*
