# `src/services/`, `src/utils/` y Archivos Raíz de `src/`

> Este documento cubre la capa de servicios HTTP, las utilidades del frontend y los cinco archivos raíz que arrancan toda la aplicación.

---

## 1. `src/services/api.js` — Cliente HTTP centralizado

### ¿Qué es?

Es el **único punto de comunicación entre el frontend y el backend**. Contiene más de 1100 líneas con todas las funciones que realizan peticiones HTTP a la API Express. Ninguna página debería hacer `fetch()` directamente; en su lugar importa las funciones de este archivo.

### Configuración base

```js
const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") + "/api"
  || "http://localhost:4001/api";
```

La URL base se lee de la variable de entorno `VITE_API_URL`. Esto permite apuntar a distintos entornos (desarrollo, producción) sin tocar el código.

### La función `request()` — corazón del módulo

```js
async function request(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = new Error(...);
    err.status  = res.status;     // código HTTP (400, 401, 403, 404, 500…)
    err.code    = payload?.code;  // código de error del backend (ej: "EMAIL_IN_USE")
    err.payload = payload;        // cuerpo completo de la respuesta de error
    throw err;
  }
  return res.json();
}
```

Todas las funciones exportadas llaman a `request()`. Si el servidor responde con un error HTTP, lanza un `Error` enriquecido con `.status`, `.code` y `.payload` — esto permite que los componentes muestren mensajes de error específicos al usuario.

### Grupos de endpoints

#### 🔐 Autenticación (`/auth`)

| Función | Método | Descripción |
|---|---|---|
| `registerProfile(token, data)` | POST | Crea el perfil de usuario en Firestore tras el registro |
| `loginSync(token)` | POST | Sincroniza la sesión con el backend al iniciar sesión |
| `checkProfile(token)` | GET | Verifica si el perfil existe |
| `checkUsername(username)` | GET | Comprueba disponibilidad de nombre de usuario |
| `getProfile(token)` | GET | Obtiene el perfil completo del usuario autenticado |
| `updateProfile(token, data)` | PATCH | Actualiza campos del perfil |
| `verifyMe(token)` | GET | Verifica que el token Firebase sigue siendo válido |
| `saveOnboarding(token, data)` | POST | Guarda los datos del flujo de onboarding (clase, nombre, etc.) |
| `deleteProfile(token)` | DELETE | Elimina la cuenta del usuario |
| `forgotPassword(email)` | POST | Envía email de recuperación de contraseña |
| `resetPassword(token, newPass)` | POST | Cambia la contraseña con token de recuperación |
| `claimDailyBonus(token)` | POST | Reclama el bono de monedas del día |

#### 🛡️ Admin — Gestión de usuarios (`/auth/users`, `/admin/users`)

| Función | Descripción |
|---|---|
| `getUsers(token)` | Lista todos los usuarios (admin) |
| `addCoinsAdmin(token, uid, coins)` | Agrega monedas a un usuario |
| `updateUserRole(token, uid, role)` | Cambia el rol de un usuario |
| `deleteUser(token, uid)` | Elimina usuario de Firebase Auth |
| `getAdminUsers(token, filters)` | Lista usuarios con filtros avanzados |
| `createAdminUser(token, userData)` | Crea usuario desde el panel admin |
| `updateAdminUser(token, uid, data)` | Edita datos de usuario |
| `deleteAdminUser(token, uid)` | Hard-delete permanente |
| `getDeletedUsers(token)` | Lista usuarios en papelera (soft-deleted) |
| `restoreUser(token, uid)` | Restaura una cuenta eliminada |
| `bulkDeleteUsers(token, uids)` | Elimina múltiples usuarios a la vez |
| `bulkUpdateStatus(token, uids, status)` | Cambia estado de múltiples usuarios |

#### 📊 Dashboard (`/dashboard`)

| Función | Descripción |
|---|---|
| `getPublicStats()` | Estadísticas públicas (no requiere login) |
| `getDashboardStats(token, periodo)` | Stats con filtro de período (ej: "30d") |
| `getActivityFeed(token)` | Feed de actividad reciente global |
| `getUserStats(token)` | Stats personales del usuario |
| `getNotifications(token)` | Notificaciones reales del usuario |
| `markNotificationRead(token, id)` | Marca una notificación como leída |
| `markAllNotificationsRead(token, ids)` | Marca múltiples notificaciones como leídas |
| `getUserActivity(token)` | Actividad reciente del usuario autenticado |
| `getWeeklyActivity(token)` | Actividad de los últimos 7 días (para gráfico) |
| `getLeaderboard(token)` | Top usuarios por XP |
| `getWeeklyLeaderboard(token)` | Ranking semanal por clase (se resetea cada lunes) |
| `getStreakChallenge(token)` | Estado del desafío de racha del día |
| `getChartData(token, periodo)` | Datos para gráficas |
| `logActivity(token, data)` | Registra una actividad manual |
| `getUserLogros(token)` | Logros/badges del usuario actual |

#### 📬 Mensajes del Gremio (`/messages`)

| Función | Descripción |
|---|---|
| `getAdminMessages(token)` | Lista mensajes del gremio (admin) |
| `sendAdminMessage(token, data)` | Envía mensaje de gremio como admin |
| `getAdminMessageHistory(token)` | Historial de mensajes enviados |
| `deleteAdminMessage(token, id)` | Elimina un mensaje de gremio |
| `markMessageRead(token, id)` | Usuario: marca mensaje como leído |
| `markAllMessagesRead(token, ids)` | Usuario: marca múltiples mensajes como leídos |
| `getUserMessagesPage(token, options)` | Paginación de mensajes con cursor |
| `getMessagePreferences(token)` | Preferencias de notificaciones del usuario |
| `saveMessageForUser(token, id)` | Guarda un mensaje en favoritos |
| `unsaveMessageForUser(token, id)` | Elimina mensaje de favoritos |

#### 🏋️ Ejercicios y Rutinas (`/ejercicios`)

| Función | Descripción |
|---|---|
| `getCategorias(token)` | Categorías de ejercicios (admin) |
| `createCategoria / updateCategoria / deleteCategoria` | CRUD de categorías (admin) |
| `getRutinas(token, filters)` | Lista rutinas con filtros (admin) |
| `createRutina / updateRutina / deleteRutina` | CRUD de rutinas (admin) |
| `getRutinasPublicas(token)` | Catálogo activo de rutinas para usuarios |
| `completarRutina(token, data)` | Registra rutina completada y otorga XP |
| `getEjerciciosPublicos(token)` | Catálogo activo de ejercicios para usuarios |
| `getCategoriasPublicas(token)` | Categorías activas para usuarios |
| `getMisPRs(token)` | Personal records del usuario |
| `completarSesion(token, data)` | Completa sesión de ejercicio y otorga XP |
| `saveWorkoutJournal(token, data)` | Diario post-entrenamiento (rating + palabra) |
| `getEjercicios / createEjercicio / updateEjercicio / deleteEjercicio` | CRUD completo de ejercicios (admin) |

#### ⚔️ Misiones (`/missions`)

| Función | Descripción |
|---|---|
| `getMisionesAdmin(token)` | Lista todas las misiones (admin) |
| `getMisiones(token)` | Misiones activas públicas |
| `getMisionesUsuario(token)` | Misiones del usuario con su progreso |
| `trackMision(token, payload)` | Registra progreso en una misión |
| `trackMissionProgress(token, tipo, valor)` | Alias simplificado de trackMision |
| `claimMision(token, id)` | Reclama recompensa de misión completada |
| `createMision / updateMision / deleteMision` | CRUD de misiones (admin) |

#### 🛍️ Objetos / Tienda (`/objetos`)

| Función | Descripción |
|---|---|
| `getObjetos(token)` | Lista todos los objetos (admin) |
| `getObjetosPublic(token)` | Catálogo público de objetos para usuarios |
| `getInventario(token)` | Inventario personal del usuario |
| `getPurchases(token, options)` | Historial de compras paginado |
| `buyObjeto(token, id, cantidad)` | Compra un objeto (deduce coins) |
| `buyLevel(token)` | Compra un nivel (objetos especiales) |
| `useObjeto(token, id)` | Usa un objeto del inventario |
| `createObjeto / updateObjeto / deleteObjeto` | CRUD de objetos (admin) |
| `getActiveBoosts(token)` | Boosts activos del usuario con tiempo restante |
| `saveWishlist(token, wishlist)` | Guarda lista de deseos del usuario |
| `seedFunctionalItems(token)` | Siembra objetos funcionales en Firestore (admin) |

#### 🎨 Skins del Avatar (`/skins`)

| Función | Descripción |
|---|---|
| `getSkins()` | Catálogo público de skins disponibles |
| `purchaseSkin(token, skinId)` | Compra una skin (deduce coins) |
| `setActiveSkin(token, skinId)` | Cambia la skin activa del usuario |

#### 🖼️ Avatares y Marcos (`/avatars`)

| Función | Descripción |
|---|---|
| `getAvatarCatalog()` | Catálogo de avatares y marcos (público) |
| `purchaseAvatarItem(token, itemId)` | Compra avatar o marco |
| `setActiveAvatar(token, avatarId)` | Cambia el avatar activo |
| `setActiveFrame(token, frameId)` | Cambia el marco activo (null = sin marco) |

#### 🏆 Logros (`/logros`)

| Función | Descripción |
|---|---|
| `getLogros(token)` | Lista todos los logros (admin) |
| `getLogrosCatalogo(token)` | Catálogo con progreso del usuario |
| `claimLogro(token, id)` | Marca logro como reclamado/celebrado |
| `createLogro / updateLogro / deleteLogro` | CRUD de logros (admin) |

#### 🏷️ Títulos (`/titles`)

| Función | Descripción |
|---|---|
| `getTitlesCatalog()` | Catálogo de títulos disponibles |
| `buyTitle(token, titulo)` | Compra un título |
| `equipTitle(token, titulo)` | Equipa un título como activo |

#### 💬 Chat entre usuarios (`/chat`)

| Función | Descripción |
|---|---|
| `searchChatUsers(token, q)` | Busca usuarios por nombre |
| `getSuggestedUsers(token)` | Héroes sugeridos para conocer |
| `sendFriendRequest(token, toUid)` | Envía solicitud de amistad |
| `respondFriendRequest(token, reqId, action)` | Acepta o rechaza solicitud |
| `getFriends(token)` | Lista de amigos |
| `getFriendRequests(token)` | Solicitudes pendientes recibidas |
| `getSentFriendRequests(token)` | Solicitudes enviadas pendientes |
| `removeFriend(token, friendUid)` | Elimina amigo |
| `getConversations(token)` | Lista de conversaciones activas |
| `openConversation(token, friendUid)` | Crea o recupera conversación |
| `getMessages(token, convId, before)` | Mensajes paginados de una conversación |
| `sendMessage(token, convId, payload)` | Envía mensaje en conversación |
| `deleteMessage(token, convId, msgId)` | Borra mensaje propio |
| `markConversationRead(token, convId)` | Marca conversación como leída |

#### 🧠 Zona Mente — Psicología Positiva (`/mente`)

| Función | Descripción |
|---|---|
| `saveMood(token, mood)` | Registra estado de ánimo del día |
| `getMoodHistory(token)` | Historial de estados de ánimo |
| `saveGratitude(token, entries)` | Guarda entradas de gratitud |
| `getGratitudeHistory(token)` | Historial de gratitud |
| `savePerma(token, scores)` | Guarda evaluación PERMA (modelo de bienestar) |
| `getPermaHistory(token)` | Historial PERMA |
| `saveStrengths(token, top3, all)` | Guarda fortalezas personales identificadas |
| `getStrengths(token)` | Recupera fortalezas del usuario |
| `logMenteSession(token, type, extra)` | Registra sesión de actividad mental |
| `getMenteSummary(token)` | Resumen de bienestar mental |
| `getMenteInsights(token)` | Insights personalizados de salud mental |
| `getCommunityMente(token)` | Datos de comunidad en Zona Mente |
| `saveMenteConnection(token, note)` | Registra actividad de conexión social |

#### 💚 Salud y Bienestar (`/salud`)

| Función | Descripción |
|---|---|
| `getSaludSummary(token)` | Resumen de salud del usuario |
| `saveSaludState(token, data)` | Actualiza estado de salud |
| `saveSaludCheckin(token, data)` | Guarda check-in de salud diario |

#### 🌳 Árbol de Habilidades (`/skills`)

| Función | Descripción |
|---|---|
| `getMySkills(token)` | Árbol de habilidades del usuario según su clase |
| `unlockSkill(token, skillId)` | Desbloquea una habilidad (gasta 1 skill point) |

#### ⚙️ Configuración y Mantenimiento (`/config`, `/admin/maintenance`, `/feedback`)

| Función | Descripción |
|---|---|
| `getConfig / saveConfig` | Configuración global de la plataforma |
| `clearCache / clearLogs / closeAllSessions` | Mantenimiento del servidor |
| `exportUsersCSV / exportSessionsCSV / exportConfigJSON` | Exportaciones de datos (admin) |
| `resetAllXP / deleteInactiveUsers` | Operaciones masivas de mantenimiento |
| `submitFeedback(token, data)` | Envía feedback (token=null → anónimo) |
| `getFeedback / getFeedbackStats / updateFeedback / deleteFeedback` | Gestión de feedback (admin) |
| `getPublicTestimonials / getPublicFeedbackStats` | Stats públicas sin auth |
| `exportFeedback(token, format)` | Exporta feedback como CSV/JSON (usa fetch directo para blob) |

---

## 2. `src/services/soundManager.js` — Gestor de Audio

### ¿Qué es?

Un **singleton** que centraliza todo el audio de la aplicación. Se exporta como `const sm = new SoundManager()` y ese mismo objeto se importa en todos los componentes que necesiten sonido. Al ser singleton, el estado del audio (volumen, pista activa, boosts) es consistente en toda la app sin necesidad de contexto de React.

### Arquitectura

| Componente | Tecnología | Para qué |
|---|---|---|
| Efectos de click | Web Audio API (`AudioContext`, `AudioBuffer`) | Pool de 4 voces simultáneas para clicks, con cooldown de 40 ms |
| Música de fondo | `HTMLAudioElement` + `MediaElementSourceNode` + `GainNode` | Loop continuo con fades suaves de 800 ms |
| Nivel de volumen global | `GainNode` maestro | Controla el volumen de todos los sonidos |

### Métodos principales

| Método | Qué hace |
|---|---|
| `unlockAudio()` | Desbloquea el AudioContext tras el primer gesto del usuario (política de autoplay de Chrome) |
| `playClick()` | Reproduce un efecto de click desde el pool de 4 voces; respeta cooldown de 40 ms para evitar spam |
| `playAltClick()` | Igual que `playClick()` pero a `playbackRate = 1.6` para un tono más agudo (hover vs. click) |
| `playLevelUp()` | Efecto de subida de nivel: baja la música al 20% de volumen durante el fanfare y la restaura tras 3.5 s |
| `playBG(trackKey)` | Reproduce una pista de música de fondo con fade-in de 800 ms |
| `stopBG()` | Detiene la música con fade-out de 800 ms |
| `setVolume(0..1)` | Ajusta el volumen global y lo persiste en localStorage |
| `toggleClick(bool)` | Activa/desactiva efectos de click |
| `toggleBG(bool)` | Activa/desactiva música de fondo |

### Pistas de música disponibles

| Key | Archivo | Ambiente |
|---|---|---|
| `ambient` | `sounds/bg_ambient.mp3` | Exploración, navegación general |
| `battle` | `sounds/bg_battle.mp3` | Ejercicios y boss battles |
| `tavern` | `sounds/bg_tavern.mp3` | Tienda, perfil, social |

### Persistencia

Guarda las preferencias del usuario en `localStorage` bajo las claves:

| Clave | Tipo | Valor guardado |
|---|---|---|
| `fv_sound_click` | `"0"` / `"1"` | Si los clicks están activos |
| `fv_sound_bg` | `"0"` / `"1"` | Si la música de fondo está activa |
| `fv_sound_vol` | `"0.0"` a `"1.0"` | Nivel de volumen global |
| `fv_sound_track` | key de pista | Última pista de música activa |

---

## 3. `src/utils/profanityFilter.js` — Filtro de Lenguaje

### ¿Qué es?

Una utilidad de validación en tiempo real que detecta **lenguaje inapropiado** en campos de texto del frontend (nombres de usuario, mensajes de chat, etc.). Es una capa de protección client-side; la validación definitiva ocurre en el backend.

### Funcionamiento

El flujo de validación tiene tres fases:

**1. Normalización (`normalize`):**
Transforma el texto antes de buscarlo para resistir variantes:
- Convierte a minúsculas
- Sustituye leet-speak: `4→a`, `3→e`, `1→i`, `0→o`, `$→s`, `@→a`, etc.
- Elimina caracteres no alfanuméricos
- Colapsa repeticiones: `puuuta` → `puuta` (máximo 2 repeticiones seguidas)
- Normaliza espacios

**2. Construcción de patrones (`buildPattern`):**
Para cada término bloqueado, crea una expresión regular que detecta el término aunque tenga **separadores** entre letras: `p*u*t*a`, `p-u-t-a`, `p.u.t.a`.

**3. Búsqueda con límites de palabra:**
Los patrones usan `(?<![a-z0-9])` y `(?![a-z0-9])` para evitar falsos positivos: la palabra `documenting` no activa `cum`.

### Funciones exportadas

```js
hasProfanity(text)           // → true si contiene palabras inapropiadas
validateClean(text, label)   // → string de error o null si está limpio
```

**Ejemplo de uso:**
```js
import { validateClean } from "../utils/profanityFilter";

const error = validateClean(username, "nombre de usuario");
if (error) showToast(error); // "El nombre de usuario contiene lenguaje inapropiado..."
```

### Idiomas cubiertos

El diccionario `BLOCKED_TERMS` cubre términos en **español** (variantes latinoamericanas incluidas) e **inglés** con sus variantes comunes.

---

## 4. `src/utils/runtimeSettings.js` — Configuración en Tiempo Real

### ¿Qué es?

Un módulo pequeño (38 líneas) que gestiona ajustes de UI que el usuario puede activar/desactivar desde el `SettingsPanel`. Permite que los componentes consulten si ciertas funcionalidades visuales están habilitadas sin necesidad de contexto de React.

### Ajustes gestionados

| Setting | Clave localStorage | Default | Descripción |
|---|---|---|---|
| `xpPopups` | `fv_xp_popups` | `true` | Muestra popups flotantes al ganar XP |
| `streakNotif` | `fv_streak_notif` | `true` | Muestra notificaciones de racha de días |

### Jerarquía de valores

Para cada ajuste, la función `getRuntimeSettingsSnapshot()` sigue esta prioridad:

1. **`window.__fvSettings`** — objeto global inyectado por `SettingsPanel` cuando el usuario cambia un ajuste (más fresco, sin necesidad de recargar)
2. **`localStorage`** — valor persistido entre sesiones
3. **`DEFAULT_SETTINGS`** — valor por defecto si no hay nada guardado

### Funciones exportadas

```js
getRuntimeSettingsSnapshot()  // → { xpPopups: bool, streakNotif: bool }
canShowXpPopups()             // → bool — atajo para xpPopups
canShowStreakNotif()           // → bool — atajo para streakNotif
```

**Ejemplo de uso en un componente:**
```js
import { canShowXpPopups } from "../utils/runtimeSettings";

if (canShowXpPopups()) {
  showXpAnimation(xpGained);
}
```

---

## 5. `src/App.css` — Estilos Globales del Shell

### ¿Qué es?

Hoja de estilos de **utilidades y clases globales** del shell pixel RPG de ForgeVenture. Se importa en `App.jsx` y sus clases son usadas por componentes en todo el proyecto.

### Contenido

#### Reset del contenedor raíz
```css
#root { max-width: 100%; margin: 0; padding: 0; display: block; width: 100%; min-height: 100%; }
```
Anula los estilos que Vite pone por defecto en el `#root` (max-width: 1280px, text-align: center).

#### Clases de tipografía pixel
```css
.pixel-font   /* 'Press Start 2P' — títulos RPG */
.orb-font     /* 'Orbitron'       — HUD y stats */
.raj-font     /* 'Rajdhani'       — texto secundario */
```

#### Efectos visuales
| Clase | Efecto |
|---|---|
| `.px-shadow-sm/md/lg` | Sombras pixel-perfect de 1/2/4 px |
| `.px-text-sm/md` | Sombra de texto pixel-perfect |
| `.glow-orange/gold/blue` | Texto con resplandor de color |
| `.border-px-orange/blue/gold` | Bordes con sombra de 2 px |
| `.pixel-render` | `image-rendering: pixelated` para sprites |

#### Clases de comportamiento
| Clase | Comportamiento |
|---|---|
| `.no-select` | `user-select: none` — evita selección accidental en UI de juego |
| `.px-btn` | Botón pixel: fuente Press Start 2P, sombra 3px, animación de presión `translate(2px,2px)` |
| `.cursor-game` | `cursor: none` — solo en desktop con mouse real (`hover: hover`) |

#### Accesibilidad
```css
button:focus-visible, a:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid #E85D04 !important;
}
@media (prefers-reduced-motion: reduce) { /* desactiva todas las animaciones */ }
```

---

## 6. `src/index.css` — Base Global y Sistema de Diseño CSS

### ¿Qué es?

El archivo CSS más fundamental del proyecto. Se importa en `main.jsx` antes que todo lo demás y establece las **variables CSS globales**, el **reset**, las **fuentes**, el **sistema de tailwind** y todos los **breakpoints responsivos**.

### Variables CSS globales (`:root`)

```css
--fv-bg:      #060D1A   /* fondo principal oscuro */
--fv-card:    #0D1B2E   /* fondo de cards */
--fv-panel:   #0A1628   /* fondo de paneles */
--fv-navy:    #1E3A5F   /* bordes y separadores */
--fv-orange:  #E85D04   /* color de acción principal */
--fv-orangeL: #FF9F1C   /* naranja claro (highlight) */
--fv-gold:    #FFD700   /* dorado (logros, monedas) */
--fv-blue:    #4CC9F0   /* azul claro (Mago, datos) */
--fv-teal:    #0A9396   /* verde azulado (salud) */
--fv-white:   #F0F4FF   /* texto principal */
--fv-muted:   #6B8CAE   /* texto secundario */
```

### Efectos decorativos en el `body`

El archivo aplica dos pseudoelementos de posición fixed sobre toda la app:

| Pseudoelemento | Efecto |
|---|---|
| `body::before` | Ruido de película (noise texture SVG, `opacity: 0.018`) — da textura orgánica a los fondos oscuros |
| `body::after` | Viñeta de esquinas (4 gradientes radiales oscuros) — profundidad cinematográfica |

Estos efectos están en `z-index: 9985/9986` para estar por encima de todo excepto modales de máxima prioridad.

### Tailwind + componentes personalizados

```css
@tailwind base;
@tailwind components;    /* .card-pixel, .btn-pixel, .badge-pixel, .bar-rpg, .section-wrap */
@tailwind utilities;     /* .img-pixel, .font-pixel, .glow-*, .shadow-px-*, etc. */
```

Los componentes `@layer components` son los bloques de construcción del diseño del dashboard.

### Breakpoints responsivos

El sistema define clases de layout usadas por las páginas de usuario y admin:

| Clase | Uso |
|---|---|
| `.ud-grid-2/3/4` | Grids de 2, 3 o 4 columnas del dashboard |
| `.ut-layout / .ut-sidebar / .ut-main` | Layout de la Tienda con sidebar de filtros |
| `.up-stats-grid` | Grid 4 columnas de estadísticas del Perfil |
| `.um-grid / .ul-grid` | Grid de Misiones (2 col) y Logros (3 col) |
| `.ad-kpi-grid / .ad-charts-grid / .ad-layout` | Grids del panel Admin |
| `.ud-tabs-row` | Barra de pestañas con scroll horizontal (sin scrollbar visible) |

**Breakpoints activos:**
- `≤1024px`: KPI admin 4→2 col, stats perfil 4→2 col
- `≤768px`: todos los grids colapsan a 1 col, sidebar de tienda se vuelve horizontal
- `≤600px`: cursor pixel desaparece, login/register muestran solo el formulario
- `≤480px`: logros y admin pasan a 1 columna

---

## 7. `src/firebase.js` — Inicialización de Firebase

### ¿Qué es?

El módulo que inicializa la conexión del **frontend** con Firebase. Es la fuente única de los servicios Firebase disponibles en el cliente.

### Qué hace

```js
import { initializeApp }  from "firebase/app";
import { getAuth }        from "firebase/auth";
import { getFirestore }   from "firebase/firestore";

const app = initializeApp(firebaseConfig);    // conecta con el proyecto Firebase
export const auth = getAuth(app);             // servicio de autenticación
export const db   = getFirestore(app);        // base de datos Firestore
export default app;
```

### Proyecto Firebase conectado

| Campo | Valor |
|---|---|
| `projectId` | `forgeventura-7c2dc` |
| `authDomain` | `forgeventura-7c2dc.firebaseapp.com` |
| `storageBucket` | `forgeventura-7c2dc.firebasestorage.app` |

### Importaciones clave en el proyecto

- **`auth`** → usado en `App.jsx` (`onAuthStateChanged`, `auth.signOut()`) y en los hooks de autenticación
- **`db`** → no se usa directamente en muchos componentes (la mayoría accede a Firestore vía el backend Express); se usa principalmente en el avatar y en partes del sistema de chat en tiempo real

> **Nota de seguridad:** Las credenciales en `firebaseConfig` son la configuración pública de la app web de Firebase. No son secretas — Firebase las protege mediante reglas de seguridad en `firestore.rules` y mediante Firebase Auth. Las credenciales privadas (clave de servicio del servidor) van en `backend/serviceAccountKey.json`, que nunca se sube a GitHub.

---

## 8. `src/index.css` — Ver sección 6 arriba

---

## 9. `src/main.jsx` — Punto de Entrada de React

### ¿Qué es?

El **archivo raíz del arranque** de la app React. Es el primer archivo que ejecuta Vite al cargar la aplicación.

### Qué hace

```jsx
import { StrictMode }    from 'react'
import { createRoot }    from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Cada línea tiene un propósito:**

| Elemento | Función |
|---|---|
| `import './index.css'` | Carga los estilos globales ANTES que cualquier componente |
| `createRoot(#root)` | Conecta React al `<div id="root">` del HTML (React 18+) |
| `<StrictMode>` | Modo estricto: detecta efectos secundarios involuntarios en desarrollo; no afecta producción |
| `<BrowserRouter>` | Habilita el sistema de routing (URLs limpias sin hash) de React Router |
| `<App />` | Raíz de todos los componentes de la aplicación |

---

## Resumen visual de la capa de servicios y utilidades

```
main.jsx
└── index.css         → variables CSS, reset, tailwind, efectos de body
└── App.jsx           → arranque de React
    ├── App.css       → utilidades pixel RPG, responsive del dashboard
    ├── firebase.js   → auth + db de Firebase
    ├── services/
    │   ├── api.js          → 80+ funciones HTTP hacia el backend Express
    │   └── soundManager.js → singleton de audio (Web Audio API + HTMLAudioElement)
    └── utils/
        ├── profanityFilter.js   → validación de lenguaje client-side
        └── runtimeSettings.js  → ajustes de UI (XP popups, streak notifs)
```
