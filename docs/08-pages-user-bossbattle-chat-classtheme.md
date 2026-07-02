# 08 · Pages/User: UserBossBattleArena · UserChat · userClassTheme

> Documentación de tesis — ForgeVenture v1  
> Carpeta: `frontend/src/pages/user/`  
> Archivos cubiertos: `UserBossBattleArena.jsx`, `UserChat.jsx`, `userClassTheme.js`

---

## Índice

1. [userClassTheme.js — El sistema de identidad por clase](#1-userclassthemejs)
2. [UserBossBattleArena.jsx — La arena de combate del héroe](#2-userbossattlearenajsx)
3. [UserChat.jsx — El cuartel social de ForgeVenture](#3-userchatjsx)

---

## 1. userClassTheme.js

**Ruta:** `frontend/src/pages/user/userClassTheme.js`

### 1.1 ¿Qué es?

`userClassTheme.js` es el **diccionario de identidad visual** del sistema de clases de ForgeVenture. No es una página ni un componente: es un módulo de configuración pura que exporta una constante de objeto — `USER_CLASS_THEME` — que actúa como fuente de verdad visual para todo el ecosistema de páginas de usuario.

Cuando un usuario elige su clase (Guerrero, Arquero o Mago) durante el registro, esa elección no es sólo una etiqueta. Cada clase tiene un **universo visual completo** definido aquí: colores, fondos, sprites y estadísticas clave. Cualquier página que necesite saber cómo se ve el usuario simplemente importa `USER_CLASS_THEME[userClass]` y obtiene todos los valores de una sola vez.

### 1.2 Estructura de la constante

```js
export const USER_CLASS_THEME = {
  GUERRERO: { ... },
  ARQUERO:  { ... },
  MAGO:     { ... },
  DEFAULT:  { ... },
};
```

Cada clave coincide con el campo `heroClass` del perfil del usuario almacenado en Firebase (en mayúsculas). La clave `DEFAULT` es el fallback para usuarios que aún no han completado su selección de clase.

### 1.3 Anatomía de un tema de clase

Cada entrada del objeto contiene los siguientes campos:

| Campo | Tipo | Descripción |
|---|---|---|
| `label` | string | Nombre legible de la clase: "Guerrero", "Arquero", "Mago" |
| `labelShort` | string | Nombre en mayúsculas para badges y chips: "GUERRERO" |
| `title` | string | Lema del camino de la clase |
| `accent` | string (hex) | Color primario de la clase — domina botones, bordes y brillos |
| `secondary` | string (hex) | Color secundario — usado en gradientes y detalles |
| `bg` | string (hex) | Color de fondo oscuro y saturado de la clase |
| `soft` | string (rgba) | Versión suave del accent al 15-20% de opacidad — fondos de cards, hovers |
| `crest` | string (path) | Ruta al escudo/emblema PNG de la clase en `/public/ui/` |
| `sprite` | string (path) | Ruta al primer frame del sprite idle de la clase |
| `stat` | string | Estadística principal de la clase (Fuerza / Agilidad / Vitalidad) |
| `focusZones` | string[] | Zonas de contenido donde esta clase tiene mayor relevancia |

### 1.4 Las 4 claves y su identidad

#### GUERRERO — Camino de fuerza
```js
accent:     "#ff4d5e"           // rojo combativo
secondary:  "#c9184a"           // granate profundo
bg:         "#21070d"           // rojo casi negro
soft:       "rgba(255,77,94,.2)"
crest:      "/ui/crest-warrior.png"
sprite:     "/home_guerrero/home_idle_guerrero_01.png"
stat:       "Fuerza"
focusZones: ["fuerza"]
```
El Guerrero domina el rojo. Sus fondos son oscuros y cálidos, casi sangre. Su foco de entrenamiento está en la fuerza pura. Visualmente es la clase más agresiva e intensa de la interfaz.

#### ARQUERO — Ritmo y precisión
```js
accent:     "#7bdc3b"           // verde vibrante
secondary:  "#20c997"           // verde agua
bg:         "#061f16"           // verde botella oscuro
soft:       "rgba(123,220,59,.18)"
crest:      "/ui/crest-archer.png"
sprite:     "/home_arquero/home_idle_arquero_01.png"
stat:       "Agilidad"
focusZones: ["cardio", "nutricion"]
```
El Arquero es verde y fresco. Evoca velocidad, resistencia y movimiento continuo. Cubre dos zonas de contenido: cardio y nutrición — el más equilibrado en términos de bienestar físico total.

#### MAGO — Dominio mental
```js
accent:     "#4cc9f0"           // azul eléctrico
secondary:  "#2f80ed"           // azul profundo
bg:         "#06182d"           // azul marino oscuro
soft:       "rgba(76,201,240,.18)"
crest:      "/ui/crest-mage.png"
sprite:     "/home_mago/home_idle_mago_01.png"
stat:       "Vitalidad"
focusZones: ["mente", "flexibilidad"]
```
El Mago es el azul cerebral. Su foco está en la mente y la flexibilidad — yoga, meditación, movilidad. La interfaz en modo Mago transmite calma, precisión y control mental.

#### DEFAULT — Forja personal
```js
accent:     "#c08aff"           // púrpura neutro
secondary:  "#c08aff"
bg:         "#12091f"
soft:       "rgba(192,138,255,.15)"
crest:      "/ui/crest-default.png"
sprite:     "/avatar/idle/idle_01.png"
stat:       "Balance"
focusZones: ["mision"]
```
Fallback para usuarios sin clase asignada. El morado es el color más neutro del sistema — no representa ninguna especialidad, sino el punto de partida antes de forjarse una identidad.

### 1.5 ¿Por qué existe este archivo?

Sin este módulo, cada componente que necesitara saber el color del usuario tendría que contener sus propias listas de colores por clase, generando duplicación y riesgo de inconsistencia. Con `userClassTheme.js`, basta con:

```js
import { USER_CLASS_THEME } from "./userClassTheme.js";
const cls = USER_CLASS_THEME[profile.heroClass] || USER_CLASS_THEME.DEFAULT;
// cls.accent, cls.bg, cls.crest... todo en un solo objeto
```

Lo usan directamente `UserBossBattleArena.jsx` y `UserChat.jsx`, y pueden sumarse cualquier página futura de usuario sin repetir la lógica de color.

---

## 2. UserBossBattleArena.jsx

**Ruta:** `frontend/src/pages/user/UserBossBattleArena.jsx`  
**Props:** `{ profile }`

### 2.1 ¿Qué experiencia ofrece al usuario?

La **Boss Battle Arena** es el escenario de combate de ForgeVenture. Cuando un usuario acepta el reto de un jefe (Boss), toda la pantalla se transforma: desaparece el dashboard habitual y aparece una arena a pantalla completa, completamente teñida con los colores de la clase del héroe, con una barra de información flotante arriba y el componente de batalla ocupando todo el espacio disponible.

Es el momento de mayor intensidad visual del sistema. El diseño comunica que algo importante está ocurriendo — el usuario no está navegando una pantalla más, está **dentro de una batalla**. Cuando el usuario completa el reto, recibe su XP y la arena se cierra de forma ceremonial.

### 2.2 Importaciones clave

```js
import { ArrowLeft, X } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import BossBattleModal from "../../components/shared/BossBattleModal.jsx";
import { USER_CLASS_THEME } from "./userClassTheme.js";
```

La arena no tiene lógica de ejercicio propia — delega completamente en `BossBattleModal` el motor de batalla. Su rol es ser el **contenedor de pantalla completa** que da contexto, presenta al jefe y maneja la navegación de entrada y salida.

### 2.3 Datos del combate — dos fuentes posibles

Los datos de la batalla (`bossBattle`) pueden llegar por dos caminos distintos:

```js
const [bossBattle] = useState(() => {
  // Fuente 1: React Router location.state (navegación interna normal)
  if (location.state?.bossBattle) return location.state.bossBattle;

  // Fuente 2: localStorage "fv_boss_transfer" (si se abrió en nueva pestaña)
  try {
    const stored = localStorage.getItem("fv_boss_transfer");
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.removeItem("fv_boss_transfer");  // se limpia tras leer
      if (parsed?.key === bossKey || parsed?.key) return parsed;
    }
  } catch {}
  return null;
});
```

**¿Por qué dos fuentes?** Porque si el usuario hace clic derecho → "Abrir en nueva pestaña" sobre el botón de batalla, React Router no puede pasar el `state` entre pestañas. En ese caso, la pestaña de origen escribe los datos del boss en `localStorage["fv_boss_transfer"]` y la nueva pestaña los recoge al montar. Tras la lectura se borra inmediatamente para no contaminar futuras sesiones.

El flag `isNewTab = !location.state?.bossBattle` determina el comportamiento de navegación en toda la página.

### 2.4 Escenas visuales del arena

#### `CLASS_FLOOR_GLOW` — glow del suelo por clase
```js
{
  GUERRERO: "/exercises/hero/hero-floor-glow-warrior.png",
  ARQUERO:  "/exercises/hero/hero-floor-glow-archer.png",
  MAGO:     "/exercises/hero/hero-floor-glow-mage.png",
  DEFAULT:  "/exercises/hero/hero-floor-glow-default.png",
}
```

#### `BOSS_SCENE` — banner de fondo según zona del jefe
```js
{
  resistencia: "/exercises/zones/zone-cardio-banner.png",
  movilidad:   "/exercises/zones/zone-flexibilidad-banner.png",
  core:        "/exercises/zones/zone-funcional-banner.png",
  default:     "/ui/scene-bg.png",
}
```

El escenario del fondo cambia según la naturaleza del jefe (`bossKey`): una batalla de resistencia tiene un fondo diferente a una de movilidad. Esto refuerza la inmersión temática.

### 2.5 Sistema de CSS variables por clase

El componente raíz recibe la clase del usuario y aplica sus colores como **variables CSS** en el elemento contenedor:

```jsx
<div
  className="ueb-page"
  style={{
    "--ueb-accent":    cls.accent,     // color primario de la clase
    "--ueb-secondary": cls.secondary,  // color secundario
    "--ueb-bg":        cls.bg,         // fondo oscuro
    "--ueb-soft":      cls.soft,       // versión suave para hovers
    "--ueb-boss-tone": bossTone,       // tono del boss (puede ser diferente al de la clase)
  }}
>
```

Todas las clases CSS del archivo usan `var(--ueb-accent)`, `var(--ueb-secondary)`, etc. Esto significa que **el mismo CSS sirve para los 3 colores de clase** — la arena se repintará sola en rojo, verde o azul dependiendo de quién la abre.

### 2.6 Fondo de la página (`.ueb-page`)

```css
background:
  radial-gradient(circle at top, color-mix(in srgb, var(--ueb-accent), transparent 82%), transparent 24%),
  radial-gradient(circle at 88% 22%, color-mix(in srgb, var(--ueb-secondary), transparent 88%), transparent 20%),
  linear-gradient(180deg, #090617 0%, var(--ueb-bg) 48%, #080511 100%),
  url("/ui/dashboard-bg.png") center top / cover no-repeat,
  #090611;
```

Cuatro capas apiladas: un halo de accent arriba, un segundo halo del secundario en la esquina derecha, un gradiente oscuro de clase al centro, y la textura del dashboard de fondo. El resultado es un espacio oscuro que "sangra" con el color de la clase del héroe.

### 2.7 Barra de información flotante (`ueb-overlay-bar`)

Posición `fixed` en la parte superior. Glassmorphism: `backdrop-filter: blur(16px) saturate(1.4)` sobre un fondo casi negro semitransparente. Borde inferior en el color de accent de la clase.

Contiene:
- **Izquierda:** escudo/crest del boss + subtítulo y título del combate.
- **Derecha:** pill con la recompensa de XP (`+{bossBattle.bossConfig.xpReward} XP`), chip con la etiqueta de acción (`bossConfig.actionLabel`), y botón de volver/cerrar.

El botón adapta su comportamiento a si es nueva pestaña o no:
- Nueva pestaña → ícono `X` + texto "Cerrar" → `window.close()`
- Misma pestaña → ícono `ArrowLeft` + texto "Volver" → `navigate("/dashboard", { state: { activeTab: sourceTab } })`

### 2.8 Componente central: `BossBattleModal`

```jsx
<BossBattleModal
  ejercicio={bossBattle.exercise}
  profile={profile}
  bossConfig={bossBattle.bossConfig}
  onClose={handleBack}
  onComplete={handleComplete}
  presentation="page"          // modo pantalla completa (vs modal)
  arenaTheme={{
    tone:          bossTone,
    classAccent:   cls.accent,
    classSecondary: cls.secondary,
    classBg:       cls.bg,
    classSoft:     cls.soft,
    scene:         arenaScene,
    crest:         bossBattle.crest,
    zoneIcon:      bossBattle.zoneIcon,
    summary:       bossBattle.summary,
  }}
/>
```

La arena pasa **todos los tokens visuales** al modal para que la UI del combate sea coherente con la clase. El `presentation="page"` le indica al modal que debe ocupar todo el espacio disponible (en lugar de flotar como ventana emergente sobre el dashboard).

### 2.9 `handleComplete` — cuando el héroe vence al jefe

```js
const handleComplete = (payload) => {
  // 1. Guardar recompensa en localStorage para que el dashboard la lea
  localStorage.setItem("fv_boss_reward", JSON.stringify({ ...payload, bossKey }));

  if (isNewTab) {
    // 2a. Nueva pestaña: mostrar overlay de cierre → cerrar la pestaña
    setClosing(true);
    setTimeout(() => {
      window.close();
      navigate("/dashboard", { replace: true }); // fallback si close() falla
    }, 1500);
  } else {
    // 2b. Misma pestaña: guardar en sessionStorage también y navegar al dashboard
    window.sessionStorage.setItem("uex:last-boss-reward", JSON.stringify({ ...payload, bossKey }));
    navigate("/dashboard", { replace: true, state: { activeTab: sourceTab } });
  }
};
```

Las recompensas se transfieren al dashboard mediante `localStorage["fv_boss_reward"]`. El dashboard escucha el evento `storage` de JavaScript para detectar este cambio en tiempo real — de modo que si la batalla fue en nueva pestaña, la ventana principal actualiza el XP y muestra la recompensa sin necesidad de recargar.

### 2.10 Pantalla de cierre ceremonial (`ueb-closing`)

Cuando `closing = true` (sólo en nueva pestaña), aparece un overlay oscuro con:
- Texto: `"VICTORIA REGISTRADA"` en el color de accent de la clase.
- Barra de progreso animada: relleno de izquierda a derecha en 1.4 segundos (animación `ueb-fill`).
- Texto: `"Cerrando arena..."` en gris muted.

Esta pantalla transmite al usuario que su victoria fue registrada antes de que la pestaña se cierre, evitando que la experiencia termine de forma abrupta.

### 2.11 Manejo de estados de error / datos faltantes

Si `bossBattle` es null (datos no disponibles):
- En nueva pestaña → mensaje de error con botón "Cerrar pestaña".
- En misma pestaña → `<Navigate to="/dashboard" replace />` inmediato.

```js
const normalizeClass = (profile) => {
  const raw = profile?.heroClass || profile?.clase || profile?.class || "GUERRERO";
  return String(raw).toUpperCase();
};
```

La función `normalizeClass` es defensiva: acepta múltiples nombres de campo posibles del perfil (`heroClass`, `clase`, `class`) para garantizar que siempre se obtenga un color de clase válido independientemente de qué versión del objeto de perfil se reciba.

### 2.12 Responsividad

```css
@media (max-width: 900px) {
  .ueb-overlay-bar { padding: 9px 14px; }
  .ueb-overlay-copy strong { font-size: 14px; max-width: 200px; }
  .ueb-action-chip { display: none; }    /* el chip de acción desaparece */
}
@media (max-width: 600px) {
  .ueb-overlay-copy span { display: none; }   /* subtítulo desaparece */
  .ueb-xp-pill { padding: 0 10px; font-size: 10px; }
  .ueb-back span { display: none; }           /* texto del botón desaparece */
  .ueb-back { padding: 0 10px; }              /* sólo ícono en móvil */
}
```

---

## 3. UserChat.jsx

**Versión:** v6 · SC Premium · Visual redesign  
**Ruta:** `frontend/src/pages/user/UserChat.jsx`  
**Props:** `{ user: initialUser, profile }`

### 3.1 ¿Qué experiencia ofrece al usuario?

`UserChat` es el **corazón social de ForgeVenture**. No es un chat genérico: es una sala de guerra temática donde los héroes se comunican entre sí, gestionan alianzas, envían y aceptan solicitudes de amistad, y comparten logros del juego directamente en la conversación.

La interfaz tiene una estética de RPG premium: cuatro columnas de paneles con esquinas doradas, partículas de brasa flotando en el fondo, barra de XP del usuario visible en todo momento, y la presencia online de los amigos en tiempo real con indicadores de color. Todo esto mientras el usuario escribe mensajes como lo haría en cualquier chat moderno.

**Lo que distingue al chat de ForgeVenture de un chat convencional:**
- Cada mensaje puede incluir un CTA (call-to-action) de gameplay — un enlace que abre directamente una misión, rutina, ejercicio o logro dentro del dashboard.
- Los amigos se ven con su clase, nivel e indicador de presencia en tiempo real.
- La búsqueda de usuarios sugiere compañeros de entrenamiento activos.
- El sistema guarda la última conversación abierta por usuario en `localStorage` para no perder el contexto al salir y volver.

### 3.2 Stack técnico

```js
// Firebase
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";

// Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// API interna (14 funciones)
import {
  getConversations, getFriends, getSentFriendRequests, getFriendRequests,
  searchChatUsers, getSuggestedUsers,
  sendFriendRequest, respondFriendRequest, removeFriend,
  openConversation, sendMessage, deleteMessage,
  markConversationRead, getMessages,
} from "../../services/api.js";

// Sistemas de diseño
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { USER_CLASS_THEME } from "./userClassTheme.js";

// Utilidades
import { validateClean } from "../../utils/profanityFilter.js";
import { useToast } from "../../components/shared/ui.jsx";
import { useLang } from "../../hooks/useLang.js";
```

### 3.3 Paleta `SC` — derivada del sistema global

```js
const SC = {
  bg: P.bg0, bg1: P.bg1, bg2: P.bg2,
  accent: P.accent, accentL: P.accent2,
  gold: P.gold, text: P.text, muted: P.muted,
  blue: "#4CC9F0", green: "#6BC87A", red: "#E05C8A",
  navy: P.navy,
  // ... más tokens
};

const CLASS_COLOR = { GUERRERO: SC.red, ARQUERO: SC.green, MAGO: SC.blue };
```

`SC` mapea tokens del sistema global `P` a nombres semánticos locales para el chat. El color por clase se usa en los avatares de amigos, en el header de conversación, y en el accent del panel izquierdo del chat activo.

### 3.4 Variables CSS de clase del chat

```css
:root {
  --chat-accent:    /* color de clase del usuario autenticado */
  --chat-secondary: /* color secundario de la clase */
}
```

Igual que la arena, el chat aplica el color de clase del usuario como variable CSS. Los paneles, bordes activos, barras de XP, scrollbars y fondos de hover de los amigos reaccionan al color de la clase del usuario actual.

### 3.5 Constantes de tiempo

```js
const TYPING_WRITE_THROTTLE_MS   = 7000;   // mínimo entre escrituras de "está escribiendo"
const TYPING_IDLE_TIMEOUT_MS     = 2500;   // tiempo sin teclear para dejar de marcar "escribiendo"
const TYPING_VISIBLE_WINDOW_MS   = 5000;   // ventana de tiempo en que el indicador es visible
const PRESENCE_HEARTBEAT_MS      = 240000; // latido cada 4 minutos para mantener presencia
const CONVERSATION_REFRESH_MS    = 30000;  // refresco mínimo de lista de conversaciones
const REQUESTS_REFRESH_MS        = 45000;  // refresco mínimo de solicitudes
const MAX_PRESENCE_WATCH         = 8;      // máximo de UIDs a observar en Firestore simultáneamente
```

Estas constantes equilibran la experiencia (feeling de tiempo real) con el consumo de llamadas Firestore (cost control). El sistema no es puramente reactivo ni puramente polling — usa un enfoque híbrido.

### 3.6 Persistencia del estado de UI

```js
const CHAT_UI_STORAGE_KEY = "fv-chat-ui-v1";

// La clave se scope-a por UID: "fv-chat-ui-v1:{uid}"
const getChatUiStorageKey = (uid) => uid ? `${CHAT_UI_STORAGE_KEY}:${uid}` : CHAT_UI_STORAGE_KEY;
```

Se guarda en `localStorage` el estado de UI por usuario: qué vista estaba activa (`view`), cuál era la conversación abierta (`activeConvId`), el filtro de clase (`classFilter`) y el término de búsqueda de conversaciones. Cuando el usuario vuelve al chat, retoma exactamente donde lo dejó.

Si el mismo navegador tiene dos usuarios distintos iniciando sesión en momentos diferentes, cada uno tiene su propia clave y el estado no se mezcla.

### 3.7 CTA deeplink — gameplay en el chat

```js
const CHAT_CTA_SECTION_BY_TYPE = {
  mission: "misiones",
  routine: "rutinas",
  achievement: "logros",
  item: "tienda",
  exercise: "ejercicios",
  profile: "perfil",
  character: "personaje",
  section: null,
};
```

Los mensajes del backend pueden incluir un campo `cta` con `{ type, id, label }`. Cuando el componente detecta este campo en un mensaje, renderiza un botón dentro de la burbuja. Al hacer click, el sistema:

1. Serializa la acción en `sessionStorage["fv-chat-deeplink-v1"]`.
2. Dispara dos CustomEvents: `flexNavigate` (para que el dashboard cambie de sección) y `chatGameplayLink` (para que el módulo destino cargue el ítem específico).

Esto permite que un amigo te comparta una rutina específica y al hacer click en el botón del chat se abra directamente esa rutina en el dashboard, sin salir del chat.

### 3.8 Estado del componente principal

```js
// ── Identidad
const [currentUser, setCurrentUser] = useState(initialUser || null);

// ── Conversaciones y mensajes
const [conversations,  setConversations]  = useState([]);
const [activeConvId,   setActiveConvId]   = useState(/* desde localStorage */);
const [messages,       setMessages]       = useState([]);
const [olderMessages,  setOlderMessages]  = useState([]);
const [hasMoreMsgs,    setHasMoreMsgs]    = useState(false);
const [loadingMore,    setLoadingMore]    = useState(false);

// ── Social
const [friends,        setFriends]        = useState([]);
const [requests,       setRequests]       = useState([]);
const [sentReqs,       setSentReqs]       = useState([]);
const [suggested,      setSuggested]      = useState([]);
const [searchQ,        setSearchQ]        = useState("");
const [searchResults,  setSearchResults]  = useState([]);
const [classFilter,    setClassFilter]    = useState(/* desde localStorage */);

// ── UI
const [view,           setView]           = useState(/* "chats" | "buscar" | ... */);
const [msgInput,       setMsgInput]       = useState("");
const [sending,        setSending]        = useState(false);
const [isMobile,       setIsMobile]       = useState(window.innerWidth < 700);
const [isNarrow,       setIsNarrow]       = useState(window.innerWidth < 1280);
const [showSidebar,    setShowSidebar]    = useState(true);
const [contextMenu,    setContextMenu]    = useState(null);
const [convSearch,     setConvSearch]     = useState(/* desde localStorage */);
const [showScrollBtn,  setShowScrollBtn]  = useState(false);
const [removeFriendTarget, setRemoveFriendTarget] = useState(null);

// ── Presencia y typing
const [peerTyping,     setPeerTyping]     = useState(false);
const [presences,      setPresences]      = useState({});
const [pageVisible,    setPageVisible]    = useState(document.visibilityState === "visible");
```

### 3.9 Perfil del visor (`viewerProfile`)

```js
const viewerProfile = useMemo(() => ({
  uid:      currentUser?.uid || profile?.uid,
  username: profile?.username || currentUser?.displayName || "Héroe",
  photoURL: profile?.photoURL || currentUser?.photoURL || null,
  heroClass: String(profile?.heroClass || "DEFAULT").toUpperCase(),
  level:    Number(profile?.level || 1),
  xp:       Number(profile?.xp ?? 0),
  xpMax:    Number(profile?.xpMax || (level ** 2) * 100),
  streak:   Number(profile?.streak ?? 0),
}), [/* dependencias del perfil y user */]);
```

El perfil del usuario autenticado se consolida de dos fuentes posibles (`profile` prop y `currentUser` de Firebase) con fallbacks defensivos. Esto garantiza que aunque los datos lleguen en diferentes estados o tiempos, siempre haya algo que mostrar.

### 3.10 Sistema de presencia en tiempo real

El sistema de presencia es la tecnología que muestra el punto verde/amarillo/gris junto al nombre de cada amigo.

#### Escritura de presencia propia

```js
// Al montar o cambiar visibilidad:
const presenceRef = doc(db, "presence", currentUser.uid);
await setDoc(presenceRef, {
  online: true,
  lastSeen: serverTimestamp(),
  uid: currentUser.uid,
}, { merge: true });

// Heartbeat cada 4 minutos (PRESENCE_HEARTBEAT_MS)
heartbeatId = window.setInterval(() => writePresence(true), PRESENCE_HEARTBEAT_MS);

// Al ocultar la pestaña:
document.addEventListener("visibilitychange", () => {
  writePresence(document.visibilityState === "visible");
});
```

#### Lectura de presencia de amigos (`onSnapshot`)

Se observan hasta `MAX_PRESENCE_WATCH = 8` UIDs simultáneamente para no exceder los límites de Firestore. Los UIDs a observar se priorizan en este orden:
1. Participantes de conversaciones activas filtradas.
2. Amigos listados.
3. Resultados de búsqueda.

```js
presenceUnsubs.current = watchedPresenceIds.map(uid =>
  onSnapshot(doc(db, "presence", uid), snap => {
    const data = snap.data();
    setPresences(prev => ({ ...prev, [uid]: data }));
  })
);
```

Cuando un amigo cambia de estado (online → offline), la UI actualiza el punto de color en tiempo real sin recargar.

### 3.11 Sistema de "está escribiendo..." (typing indicator)

```js
const TYPING_WRITE_THROTTLE_MS = 7000;    // evita escribir en Firestore en cada keystroke
const TYPING_IDLE_TIMEOUT_MS   = 2500;    // 2.5s sin teclear → dejar de escribir
const TYPING_VISIBLE_WINDOW_MS = 5000;    // el indicador sigue visible 5s tras el último evento

// En handleInputChange:
if (!typingActiveRef.current) {
  // Escribir "está escribiendo" en Firestore (sólo si han pasado 7s desde la última vez)
  const ref = doc(db, "conversations", activeConvId, "typing", currentUser.uid);
  await setDoc(ref, { ts: serverTimestamp(), uid: currentUser.uid });
  typingActiveRef.current = true;
}
// Reiniciar el timer de idle
clearTimeout(typingTimerRef.current);
typingTimerRef.current = setTimeout(() => {
  stopTypingSignal();
}, TYPING_IDLE_TIMEOUT_MS);
```

#### Lectura del typing del peer

```js
const typingRef = doc(db, "conversations", activeConvId, "typing", otherUid);
unsubTypingRef.current = onSnapshot(typingRef, snap => {
  const data = snap.data();
  if (!data?.ts) { setPeerTyping(false); return; }
  const age = Date.now() - data.ts.toMillis();
  setPeerTyping(age < TYPING_VISIBLE_WINDOW_MS);
});
```

Si el timestamp del typing del peer tiene más de 5 segundos de antigüedad, el indicador desaparece. Esto evita que el indicador quede "colgado" si el otro usuario cerró la pestaña sin limpiar el documento de Firestore.

### 3.12 Carga de mensajes — paginación y "cargar más"

```js
// Carga inicial (los más recientes)
const loadLatestMessages = async (convId) => {
  const data = await getMessages(tok, convId);  // sin cursor
  setMessages(data.messages || []);
  setOlderMessages([]);
  setHasMoreMsgs(Boolean(data.hasMore));
};

// Cargar mensajes anteriores (paginación hacia atrás)
const handleLoadMore = async () => {
  const oldest = allMessages[0];  // primer mensaje visible
  const data = await getMessages(tok, activeConvId, oldest.timestamp);  // cursor = timestamp
  setOlderMessages(prev => [...data.messages, ...prev]);
  setHasMoreMsgs(Boolean(data.hasMore));
};
```

Los mensajes se deduplicán al combinar:
```js
const allMessages = useMemo(() => {
  const seen = new Set(messages.map(m => m.id));
  const older = olderMessages.filter(m => !seen.has(m.id));
  return [...older, ...messages];
}, [messages, olderMessages]);
```

### 3.13 `handleSend` — enviar mensaje

```js
const handleSend = async () => {
  if (!msgInput.trim() || !activeConvId || sending) return;
  const text = msgInput.trim();

  // 1. Filtro de lenguaje
  const profErr = validateClean(text, "mensaje");
  if (profErr) { showToast(profErr, "error"); return; }

  // 2. Detener "está escribiendo"
  stopTypingSignal();
  setMsgInput(""); setSending(true);

  try {
    const tok = await getToken();
    const response = await sendMessage(tok, activeConvId, text);
    
    // 3. Optimistic update: añadir el mensaje localmente de inmediato
    const sentMessage = response?.message || {
      id: `temp-${Date.now()}`, fromUid: currentUser.uid, text,
      timestamp: Date.now(), deleted: false, cta: null,
    };
    setMessages(prev => [...prev, sentMessage]);
    
    // 4. Actualizar la conversación en la lista (last message, unread count)
    upsertConversationLocal({ id: activeConvId, lastMessage: sentMessage, ... });

  } catch (err) {
    showToast(err.message || "Error al enviar", "error");
    setMsgInput(text);  // restaurar el input si falla
  } finally {
    setSending(false);
    inputRef.current?.focus();  // mantener el foco en el input
  }
};
```

El optimistic update hace que el mensaje aparezca al instante en la UI sin esperar la respuesta del servidor, dando sensación de velocidad.

### 3.14 Sistema de amigos — ciclo completo

| Acción | Función API | Efecto local |
|---|---|---|
| Buscar usuario | `searchChatUsers(tok, q)` | Actualiza `searchResults` |
| Sugeridos de afinidad | `getSuggestedUsers(tok)` | Actualiza `suggested` (cacheado 5 min) |
| Enviar solicitud | `sendFriendRequest(tok, toUid)` | Marca `alreadySent: true` en sugeridos, añade a `sentReqs` |
| Aceptar solicitud | `respondFriendRequest(tok, reqId, "accept")` | Recarga friends + requests, invalida cache de sugeridos |
| Rechazar solicitud | `respondFriendRequest(tok, reqId, "reject")` | Filtra la solicitud de `requests` |
| Eliminar amigo | `removeFriend(tok, uid)` | Filtra de `friends`, remueve la conversación asociada |
| Abrir conversación | `openConversation(tok, friendUid)` | Crea/recupera la conv, `setActiveConvId` |

### 3.15 Scroll inteligente

```js
const isNearBottom = () => {
  const { scrollTop, scrollHeight, clientHeight } = msgContainerRef.current;
  return scrollHeight - scrollTop - clientHeight < 120;
};
```

El chat sólo hace scroll automático al fondo en dos casos:
1. Cuando el usuario **envía** un mensaje (`shouldScrollRef.current = true` en `handleSend`).
2. Cuando llegan mensajes nuevos Y el usuario ya estaba **cerca del fondo** (`< 120px de distancia`).

Si el usuario está leyendo mensajes anteriores, los mensajes nuevos NO fuerzan el scroll — en su lugar aparece un botón flotante `↓` para ir al fondo voluntariamente.

### 3.16 Refrescos periódicos y en focus

```js
useEffect(() => {
  const refreshFriends = () => {
    loadConversations(true);
    loadFriendsAndSent(true);
    loadRequests(true);
    if (view === "chats" && activeConvId) loadLatestMessages(activeConvId, { silent: true });
  };
  window.addEventListener("focus", refreshFriends);
  document.addEventListener("visibilitychange", refreshFriends);
  // Limpieza al desmontar...
}, [...]);

// Refresco periódico cada 30s
window.setInterval(() => {
  loadConversations();
  loadRequests();
  if (view === "chats" && activeConvId) loadLatestMessages(activeConvId, { silent: true });
}, CONVERSATION_REFRESH_MS);
```

Cuando el usuario vuelve a la pestaña del chat (evento `focus` o cambio de visibilidad), los datos se refrescan automáticamente. El refresco es "silencioso" — no muestra indicador de carga para no interrumpir la lectura.

### 3.17 Lectura de mensajes (`markConversationRead`)

```js
// Al cambiar la conversación activa:
const tok = await getToken();
await markConversationRead(tok, activeConvId);
// Actualizar contador de no leídos localmente:
setConversations(prev => prev.map(conv =>
  conv.id === activeConvId
    ? { ...conv, unread: { ...(conv.unread || {}), [currentUser.uid]: 0 } }
    : conv
));
```

Cuando el usuario abre una conversación, la marca como leída en el backend y resetea el contador de mensajes no leídos localmente. Esto actualiza el badge rojo del tab de chats.

### 3.18 Layout de 4 columnas

```css
.fvch-wrapper {
  max-width: 1560px;
  display: grid;
  grid-template-columns: 280px 300px 1fr 300px;
  grid-template-rows: auto 1fr auto;
  gap: 10px;
}
```

| Columna | Clase | Contenido |
|---|---|---|
| 1 (280px) | `.fvch-left-col` | Panel RPG del héroe: avatar, nivel, XP, stats, equipamiento |
| 2 (300px) | `.fvch-friends-col` | Lista de amigos y solicitudes (tabs: Chats / Amigos) |
| 3 (flex) | `.fvch-chat-col` | Ventana de mensajes activa |
| 4 (300px) | `.fvch-info-col` | Info del amigo activo, acciones, rango social |

En móvil (`< 700px`) el layout colapsa a una vista de una sola columna con navegación entre secciones.

### 3.19 Panel RPG izquierdo — el héroe en el chat

El panel izquierdo muestra el perfil del usuario como si fuera una ficha de personaje de RPG:
- Avatar con frame de borde en el color de la clase, con esquinas doradas.
- Nombre del héroe, clase, nivel.
- Barra de XP con gradiente de clase.
- 5 barras de estadísticas: STR (fuerza), STA (resistencia), SPD (velocidad), DIS (disciplina), MEN (mentalidad). Cada una tiene su glifo gráfico (corazón, escudo, bota, pergamino, cerebro) en CSS puro con `clip-path`.
- 6 slots de equipamiento en grid 3×2 con esquinas doradas y colores de borde por tipo (arma, yelmo, armadura, cinturón, pantalón, botas).

Todo esto es visual/decorativo pero refuerza la identidad de juego dentro de un componente que en esencia es un chat.

### 3.20 Diseño visual premium — elementos clave

#### Partículas de brasa (`fvch-embers`)
Partículas de 3px que suben desde el fondo con animación `fvch-rise` en loop infinito. Se generan en posiciones aleatorias horizontalmente. Su color sigue el accent de la clase del usuario.

#### Paneles con esquinas doradas
```css
.fvch-panel::before { /* esquina superior izquierda — punto dorado 6×6px */ }
.fvch-panel::after  { /* esquina superior derecha */ }
.fvch-corners::before { /* esquina inferior izquierda */ }
.fvch-corners::after  { /* esquina inferior derecha */ }
```

Cuatro puntos dorados (`--fvch-gold`) en las esquinas de cada panel, imitando el estilo de marcos de mapas en juegos de estrategia. Es el sello visual identitario del chat.

#### Scrollbars custom
```css
.fc-scroll::-webkit-scrollbar { width: 4px; }
.fc-scroll::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--chat-accent, #c08aff), transparent 62%);
}
```

Los scrollbars de 4px se tiñen del color de la clase del usuario — incluso los scrollbars son parte del sistema temático.

#### Burbujas de mensaje
- Mensajes del peer → fondo `rgba(22,17,34,.9)` con borde sutil, borde-radius asimétrico (2px izquierda, 12px derecha).
- Mensajes propios → fondo gradiente violáceo `#2a1a45 → #1e0f33`, borde dorado sutil, borde-radius invertido (12px izquierda, 2px derecha).

#### Estado de presencia en amigos
```css
.fvch-status-dot.online  { background: #8ac926; box-shadow: 0 0 5px #8ac926; }
.fvch-status-dot.away    { background: #ffb13a; }
.fvch-status-dot.busy    { background: #c08aff; }
.fvch-status-dot.offline { background: #5e5269; }
```

### 3.21 Animaciones Framer Motion

```js
const FV = {
  up:     { hidden:{ opacity:0, y:16 },    show:{ opacity:1, y:0 }    },
  left:   { hidden:{ opacity:0, x:-16 },   show:{ opacity:1, x:0 }    },
  msgIn:  { hidden:{ opacity:0, y:6, scale:0.97 }, show:{ opacity:1, y:0, scale:1 } },
  stagger:{ hidden:{}, show:{ transition:{ staggerChildren:0.055, delayChildren:0.02 } } },
};
```

- `up` — paneles y secciones que aparecen desde abajo.
- `left` — columna de amigos que entra desde la izquierda.
- `msgIn` — cada burbuja de mensaje aparece con un pequeño scale desde 97% a 100% en 200ms. Esto hace que los mensajes entrantes se "materialicen" suavemente en lugar de aparecer de golpe.
- `stagger` — permite animar listas de ítems con un pequeño retraso escalonado (55ms entre cada ítem).

---

## Resumen de valor por archivo

| Archivo | Rol | Qué le da al usuario |
|---|---|---|
| `userClassTheme.js` | Módulo de configuración pura | Define el universo visual completo de cada clase: colores, fondos, sprites, stat principal — fuente de verdad para toda la experiencia de usuario |
| `UserBossBattleArena.jsx` | Página de combate a pantalla completa | La experiencia más inmersiva de la plataforma — el momento de máxima intensidad donde el entrenamiento se convierte en batalla, con recompensas reales de XP transferidas al dashboard |
| `UserChat.jsx` | Hub social premium | Una sala de guerra temática donde los héroes forman alianzas, comparten logros con un click, y se comunican en tiempo real con presencia online, typing indicators, y una UI de RPG que hace único cada conversación |

---

*Documentación generada para tesis — ForgeVenture 2026*
