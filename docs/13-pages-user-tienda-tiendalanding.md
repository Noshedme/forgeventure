# 13 — UserTienda & UserTiendaLanding

> `frontend/src/pages/user/UserTienda.jsx` · `frontend/src/pages/user/UserTiendaLanding.jsx`

---

## Propuesta de valor — qué vive el usuario en esta pantalla

El mercado de ForgeVenture no es una tienda de videojuego más. Es el punto donde el esfuerzo real del usuario —las sesiones completadas, la racha mantenida, las misiones cerradas— se convierte en poder tangible. El usuario llega aquí y ve **exactamente cuántas monedas tiene**, qué objetos puede comprar **ahora mismo**, y cuál de ellos le da más ventaja según su clase, su racha y sus misiones activas. Eso no es aleatoriedad: es un sistema de recomendación contextual que analiza el estado del héroe en tiempo real.

Hay dos componentes distintos que cubren esta experiencia:

| Componente | Archivo | Rol |
|---|---|---|
| **UserTienda** | `UserTienda.jsx` | Tienda clásica: layout 3 columnas, tabs tienda/inventario/cosméticos/servicios/historial, modales en overlay, paleta P |
| **UserTiendaLanding** | `UserTiendaLanding.jsx` | Versión landing completa: hero por clase, tab lazy-loading, ledger de eventos, deep-link desde chat, paleta UI propia |

Ambos cubren el mismo flujo de negocio —comprar, equipar, usar, ver historial— pero con presentación visual y arquitectura de carga distintas.

---

## UserTienda.jsx

### Qué ofrece al usuario

- **Catálogo vivo** de objetos del gremio filtrable por categoría (7 tipos), rareza (6 niveles) y ordenable por precio o novedad.
- **Panel de inventario** agrupado por categoría, consumibles primero, con la posibilidad de **usar objetos** desde el mismo panel con feedback inmediato (toast animado, XP ganado, posible level-up).
- **Catálogo cosmético** completo: skins de sprite, avatares, marcos y títulos —todo visible, todo equipable o comprable en el mismo lugar.
- **Panel de servicios**: compra de niveles directos (1 000 monedas/nivel, máximo 10 por sesión) con propagación de level-up a todo el sistema.
- **Recomendación contextual del mercader**: el sistema puntúa cada objeto contra el estado actual del héroe (misiones activas, streak, entrenamiento de hoy, clase) y muestra la mejor opción posible en el panel derecho.
- **Wishlist**: el usuario puede marcar ítems para volver luego; se sincroniza a Firebase con debounce de 1,5 s.
- **Historial de compras** con registro local de cada transacción.
- **Animación de monedas** (CoinNotif) cada vez que el saldo cambia, con dirección positiva/negativa.

---

### Importaciones clave

```js
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "../../hooks/useLang.js";
import { auth } from "../../firebase.js";
import {
  getObjetosPublic, buyObjeto, buyLevel, useObjeto,
  getSkins, purchaseSkin, getInventario, getPurchases, getActiveBoosts,
  saveWishlist, purchaseAvatarItem, getAvatarCatalog,
  getMisionesUsuario, getUserStats, getRutinasPublicas,
  buyTitle, getTitlesCatalog, equipTitle,
  setActiveAvatar as apiSetActiveAvatar,
  setActiveFrame  as apiSetActiveFrame,
  setActiveSkin   as apiSetActiveSkin,
} from "../../services/api";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { getSkinPreview } from "../../avatar/SpriteMap";
import { P, mono, sans, disp, glass, Brackets, Reveal } from "../../design/system.jsx";
import { AVATARS_CATALOG, FRAMES_CATALOG, RAREZA_AVATAR_COLOR } from "../../avatar/AvatarCatalog";
import { ShoppingBag, ShoppingCart, X, Check, Zap, ChevronRight, Search,
         Package, Sparkles, Info, RotateCcw, AlertTriangle } from "lucide-react";
```

20+ funciones de API importadas —la tienda es la página con más llamadas al backend de toda la carpeta `user/`.

---

### Constantes y tokens de diseño

#### Paleta C — mapea P al contexto tienda

```js
const C = {
  bg: P.bg0, side: P.bg1, card: P.bg1, panel: P.bg2,
  navy: P.navy, navyL: P.line,
  orange: P.accent, orangeL: P.accent2, gold: P.gold,
  blue: "#4CC9F0", teal: "#4A9D8F", green: "#6BC87A",
  red: "#E05C8A", purple: P.accent, pink: "#EC4899",
  white: P.text, muted: P.muted, mutedL: P.mutedL,
};
```

#### Paleta V — tokens JRPG de atributos

```js
const V = {
  bg: P.bg0, p1: P.bg1, p2: P.bg2,
  bDark: P.navy, bMid: P.line, bHi: P.line,
  gold: P.gold, goldL: P.accent2,
  str:"#e0455e", sta:"#ffb13a", spd:"#8ac926",
  dis: P.accent, men:"#4cc9f0",
};
```

#### TIER_ACCENT_TI — colores por rareza (6 niveles)

| Rareza | Color | Glow Alpha |
|---|---|---|
| Común | `#a8a8b8` | 0.40 |
| Poco común | `#5ad15a` | 0.45 |
| Raro | `#4cc9f0` | 0.50 |
| Épico | `#c08aff` | 0.55 |
| Legendario | `#f4cc78` | 0.60 |
| Mítico | `#ff5a2e` | 0.65 |

#### CATS — 7 categorías con icono, color e imagen PNG

```js
const CATS = {
  Todos:       { color: C.orange, icon: "🌟", img: "/ui/shop/icons/shop-coin-stack.png" },
  Poción:      { color: C.green,  icon: "🧪", img: "/ui/shop/icons/shop-potion.png"     },
  Equipo:      { color: C.blue,   icon: "⚔️",  img: "/ui/shop/icons/shop-equip.png"      },
  Cosmético:   { color: C.purple, icon: "✨", img: "/ui/shop/icons/shop-cosmetic.png"   },
  Consumible:  { color: C.teal,   icon: "📦", img: "/ui/shop/icons/shop-crate.png"      },
  Coleccionable:{ color: C.gold,  icon: "🏆", img: "/ui/shop/icons/shop-collect.png"    },
  Especial:    { color: C.red,    icon: "🔥", img: "/ui/shop/icons/shop-special.png"    },
};
```

#### MARKET_KIND_META — 5 tipos de mercado

| Kind | Label | Color | Descripción |
|---|---|---|---|
| `functional` | FUNCIONAL | `#8ac926` | Boosts, XP, HP, streak |
| `cosmetic` | COSMETICO | `#c08aff` | Skins, avatares, marcos |
| `collectible` | COLECCION | `#f4cc78` | Ítems coleccionables |
| `service` | SERVICIO | `#4cc9f0` | Niveles, acceso a rutinas |
| `legacy` | LEGACY | `#e05c8a` | Ítems retirados |

#### Cachés en módulo (TTLs)

```
SHOP_TTL  = 5 min  → catálogo de objetos (getObjetosPublic)
INV_TTL   = 2 min  → inventario del usuario
HIST_TTL  = 3 min  → historial de compras
CTX_TTL   = 4 min  → contexto del mercader (stats + misiones)
SVC_TTL   = 6 min  → servicios: catálogo de títulos y rutinas públicas
```

Cada caché vive en variables `_shopCache`, `_invCache`, `_histCache`, `_ctxCache`, `_svcCache` a nivel de módulo, sobreviviendo re-renders pero limpiándose si cambia el `uid`.

#### Constante de nivel

```js
const LEVEL_PRICE = 1000;   // monedas por nivel comprado
const LEVEL_MAX_BUY = 10;   // máximo niveles por sesión
```

---

### CSS y animaciones

**25+ keyframes** definidos en el string `CSS`:

| Keyframe | Uso |
|---|---|
| `ut-fadeIn` | Aparición general de elementos |
| `ut-modalIn` | Entrada del modal de ítem (scale + opacity) |
| `ut-float` | Flotación de ítems épicos en ImageBox |
| `ut-shine` / `ut-shimmer` | Efecto brillo en badges y skeletons |
| `ut-coin` / `ut-coinUp` / `ut-coinDown` | Animación de moneda ganada/perdida |
| `ut-buy` | Flash de confirmación de compra |
| `ut-newTag` | Badge "NUEVO" pulsante |
| `ut-boostIn` | Entrada de boost activo |
| `ut-timerPulse` / `ut-timerEnd` | Latido del timer de boost |
| `ut-epicBorder` | Borde pulsante en cartas épicas+ |
| `ut-hudScan` | Escaneo de HUD |
| `ut-auroraA/B/C` | Blobs de aurora del fondo |
| `ut-ember` | Partículas de fuego del canvas |
| `ti-crestPulse` | Pulso del escudo de clase |
| `ti-accentLine` | Línea de acento del héroe |
| `ti-heroFloat` | Flotación del banner del héroe |

**Layout SHOP_CSS** (clase `.ti-app`):

```css
.ti-app {
  display: grid;
  grid-template-columns: 250px 1fr 300px;   /* left / main / right */
  grid-template-rows: auto 1fr;
}
/* Breakpoints:
   1440px → cols: 230px 1fr 280px
   1180px → cols: 230px 1fr      (se elimina columna derecha)
    960px → cols: 1fr             (columna única)
*/
```

Clases de rareza: `.ti-r-common` `.ti-r-uncommon` `.ti-r-rare` `.ti-r-epic` `.ti-r-legend` `.ti-r-mythic`

Cada una agrega `color`, `border-color`, `text-shadow` y para tier ≥ 4 añade `animation: ut-epicBorder`.

---

### Funciones auxiliares

#### `missionHint(efectos)`
Recibe el array `efectos` de un ítem y devuelve un objeto `{ img, textKey, color }` que vincula el ítem a un tipo de misión activa. El usuario ve un hint contextual bajo la card, como "Úsalo antes de completar tu misión de resistencia".

#### `efTxt(ef)` / `renderEfTxt(ef, t)`
- `efTxt`: genera texto estático del efecto: `"+X% XP"`, `"HP +X%"`, `"×X XP"`, `"__streak__Xd"`, etc.
- `renderEfTxt`: mismo texto pero localizado vía `t()` para los prefijos especiales: `__streak__` → `t("ti.ef.streak")`, `__nivel__` → `t("ti.ef.level")`, etc.

#### `deriveMarketKind(item)`
Clasifica el ítem en uno de los 5 tipos de mercado analizando sus `efectos`:
- `streak_shield | hp_recover | xp_bonus | xp_mult | xp_instant | level_boost | cooldown_red` → `"functional"`
- Tipos cosméticos → `"cosmetic"`
- Sin efectos ni datos clave → `"legacy"` o `"collectible"`

#### `normalizeObjeto(o)`
Normaliza la forma del objeto recibido de la API añadiendo `marketKind` (via `deriveMarketKind`), `supportedUse` (via `isSupportedUseItem`) y otros campos derivados.

#### `scoreMarketItemForContext(item, merchantContext, heroClass, streakShield, coins)`
Algoritmo de scoring para recomendación del mercader:
- `-18` si es coleccionable; `-40` si es cosmético o legacy
- `-20` si el precio supera las monedas actuales
- `+30` si no hay `streak_shield` y el ítem lo ofrece
- `+16` si hay misiones reclamables y el ítem da XP
- `+18` si ya entrenó hoy y el ítem recupera o escuda
- `+12` si no entrenó y el ítem impulsa XP o nivel
- `+10` por cada `missionFocus` que coincida con texto del ítem
- `+6` por cada hint de clase (CLASS_ROUTINE_HINTS) que coincida

#### `scoreRoutineForContext(routine, heroClass, merchantContext)` y `scoreTitleForContext(...)`
Misma lógica aplicada a rutinas públicas y títulos para la recomendación del panel derecho cuando el tab activo es "servicios".

---

### Estado del componente (`useState`)

| State | Tipo | Rol |
|---|---|---|
| `cat` | string | Categoría activa (persiste en localStorage `ut-filter-cat`) |
| `search` | string | Búsqueda libre de texto |
| `filterRar` | string | Filtro de rareza (persiste `ut-filter-rar`) |
| `sortBy` | string | Criterio de orden: `nuevo/precio_asc/precio_desc/rareza` |
| `tab` | string | Tab activo: `tienda/inventario/cosmeticos/servicios/historial` |
| `itemModal` | object\|null | Ítem abierto en el modal 4-fases |
| `coinAnim` | number\|null | Dispara CoinNotif con el importe |
| `coins` | number | Saldo vivo (inicializado desde `profile.coins`) |
| `inventario` | array | Inventario local del usuario |
| `historial` | array | Historial de compras/usos |
| `objetos` | array | Catálogo del mercado (normalizado) |
| `cargando` | bool | Loading global inicial |
| `skinCatalog` | array | Skins disponibles (getSkings) |
| `avatarCatalog` | array | Avatares (getAvatarCatalog) |
| `frameCatalog` | array | Marcos (getAvatarCatalog) |
| `titleCatalog` | array | Títulos (getTitlesCatalog) |
| `publicRoutines` | array | Rutinas públicas (getRutinasPublicas) |
| `ownedSkins/Avatars/Frames/Titles` | array | Propiedad del usuario |
| `activeBoosts` | array | Boosts activos (getActiveBoosts) |
| `streakShield` | object\|null | Estado del escudo de racha |
| `wishlist` | Set | IDs de ítems en wishlist |
| `merchantContext` | object | Contexto calculado del héroe |
| `selectedItem` | object\|null | Ítem seleccionado para el panel detalle |
| `detailFocus` | object\|null | `{ type, id, manual }` para el panel derecho |
| `equippedAvatar/Frame/Skin/Title` | string\|null | Estado cosmético activo |
| `useResult` | object\|null | Resultado del uso de un ítem (para UseResultToast) |
| `skinBuyModal` | object\|null | Skin en confirmación de compra |
| `coinAnimType` | string | `"gain"` o `"loss"` |

---

### Efectos y carga de datos (`useEffect`)

#### Carga inicial (mount)
```
Promise.allSettled([
  getObjetosPublic(token),          → catálogo principal
  getInventario(token),             → inventario del usuario
  getPurchases(token),              → historial de compras
  getActiveBoosts(token),           → boosts + streakShield + wishlist
  getAvatarCatalog(),               → avatares + marcos
  syncMerchantContext(token, uid),  → getUserStats + getMisionesUsuario
  getTitlesCatalog() + getRutinasPublicas(token),  → servicios
])
```

Cada llamada consulta primero su caché en módulo. Si está fresco (dentro del TTL) se omite la llamada a Firestore. El resultado siempre es `Promise.allSettled` para que un fallo en una carga no bloquee al resto.

#### Efectos secundarios
- Sincroniza filtros → `localStorage` en cada cambio
- Wishlist → Firebase con debounce 1,5 s via `_wishlistTimer`
- `exerciseCompleted` event → refresca boosts y sincroniza monedas
- `prevCoinsRef` detecta cambio de saldo → lanza `coinAnimType`
- `profile` prop changes → `setLocalProfile`, sync owned cosmetics

---

### Handlers de compra

#### `handleBuy(item, qty, total)`
1. Verifica saldo (`coins >= total`)
2. Llama `buyObjeto(token, item.id, qty)`
3. Actualiza saldo via `applyStoreProfilePatch({ coins: newCoins })`
4. Actualiza inventario local (añade o suma qty si `stackeable`)
5. Registra entrada en historial local
6. Invalida cachés `_invCache` y `_histCache`
7. Emite `profileUpdated` y `shopStateChanged` (CustomEvents del sistema)
8. Lanza `CoinNotif` con el importe gastado

#### `handleBuySkin(skin)`
→ `purchaseSkin(token, skin.id)` → actualiza `ownedSkins`, monedas, emite `shopStateChanged`

#### `handleBuyAvatarItem(item)`
→ `purchaseAvatarItem(token, item.id)` → actualiza `ownedAvatars` o `ownedFrames`, emite `avatarPurchased`

#### `handleBuyTitle(titleEntry)`
→ `buyTitle(token, titleEntry.nombre)` → actualiza `ownedTitles`, emite `titlePurchased`

#### `handleEquipAvatar/Frame/Skin/Title`
→ Llama a `apiSetActiveAvatar/Frame/Skin` o `equipTitle` → actualiza estado local → emite `avatarEquipped/skinChanged/titleEquipped`

#### `handleUse(item)`
1. Verifica que el ítem sea usable (`isSupportedUseItem`)
2. Actualiza inventario optimistamente (descuenta qty)
3. Llama `useObjeto(token, item.id)`
4. Si falla: revierte inventario
5. Si ok: actualiza `activeBoosts`, `streakShield`, `profilePatch`
6. Registra en historial (`categoria: "Uso"`)
7. Emite `itemUsed` y si hay XP/levelUp también `exerciseCompleted` y `levelUp`
8. Muestra `UseResultToast` con efectos, XP ganado y posible level-up

---

### Sub-componentes (definidos dentro de UserTienda.jsx)

#### `UTBackground({ color })`
Canvas con 34 partículas de ember animadas via `requestAnimationFrame` + 3 blobs CSS aurora (`.ut-aurora-a/b/c`) + capa de pixel grid. El canvas hace resize en cada `window.resize`. Color del tono recibido como prop vía CSS variable `--ti-ac`.

#### `ItemImageBox({ item, height })`
Progressive URL fallback para imágenes de ítems:
1. `/ui/items/consumables/{imagen}`
2. `/ui/items/equipment/{imagen}`
3. `/ui/items/rewards/{imagen}`
4. `/ui/items/{imagen}`
5. Ícono de categoría (CATS fallback)

Si `item.rareza` es Épico o superior: aplica `animation: ut-float`. Si la imagen es emoji: salta directamente al ícono de categoría.

#### `RarezaBadge({ rareza, small })`
`"★".repeat(tier)` + label con `color`, `background` y `text-shadow` para tier ≥ 4 (Épico/Legendario/Mítico).

#### `CoinNotif({ amount, type, onDone })`
Overlay centrado con animación `ut-coin`. Muestra `−{amount}` en rojo o `+{amount}` en dorado. Auto-dismiss a los 2 s via `setTimeout → onDone`.

#### `ItemModal({ item, coins, onClose, onBuy })`
Modal de 4 fases con `framer-motion` spring:

| Fase | Contenido |
|---|---|
| `detail` | Imagen, RarezaBadge, nombre, descripción, efectos con `renderEfTxt`, precio, btn "COMPRAR" |
| `confirm` | Tabla: precio × qty, saldo actual, saldo resultante. Btn "CONFIRMAR" |
| `success` | Emoji del ítem, lista de efectos aplicados, mensaje de éxito |
| `noCoins` | Mensaje de saldo insuficiente + tip contextual (qué hacer para conseguir monedas) |

Si el ítem es `stackeable`: muestra selector `qty ± 1` con precio actualizado en tiempo real.

#### `ItemCard({ item, coins, owned, onClick, idx })`
`motion.div` con stagger `delay: idx × 0.04s`. Si rareza tier ≥ 4: clase `ut-epic-card` con borde pulsante. Footer: precio en dorado si puede pagar, en rojo si no. Badge de misión synergy renderizado inline.

#### `SkeletonCard()`
3 líneas shimmer placeholder durante carga inicial.

#### `UseResultToast({ result, onDone })`
Slide-in desde derecha (framer-motion). Muestra nombre del ítem, efectos (con `renderEfTxt`), XP ganado y "¡LEVEL UP!" si aplica. Auto-dismiss a los 5,5 s.

#### `fmtTime(secs)`
`secs >= 3600` → `"Xh Ym"` | `secs < 3600` → `"MM:SS"`. Usado en contadores de boost activo.

---

### Computed values (`useMemo`)

#### `merchantRecommendation`
```js
{
  item:        // mejor ítem por scoreMarketItemForContext que el usuario puede pagar
  routine:     // mejor rutina por scoreRoutineForContext
  title:       // mejor título por scoreTitleForContext
  serviceLabel // label del servicio recomendado en el panel de servicios
}
```

Actualizado cada vez que cambian `objetos`, `publicRoutines`, `titleCatalog`, `merchantContext`, `heroClass`, `streakShield`, `coins`, `ownedTitles` o `activeTitle`.

#### `activeDetail`
Resuelve qué mostrar en el panel derecho:
- Si `detailFocus.type === "routine"` → busca en `publicRoutines`
- Si `detailFocus.type === "title"` → busca en `titleCatalog`
- Si `detailFocus.type === "item"` o ninguno → usa `selectedItem` o `merchantRecommendation.item`

#### `filtrado`
Catálogo filtrado (cat + search + rareza) y ordenado (sortBy). Actualizado por cambio en `objetos`, `cat`, `search`, `filterRar`, `sortBy`.

#### `invSorted` / `invGrouped`
Inventario ordenado (consumibles primero, luego por rareza tier) y agrupado por categoría. `invGrouped` calcula `usables` por grupo.

#### `ctxMsg`
String contextual para el banner de saldo:
- Misiones listas para cerrar → `"X misiones listas para cerrar con botín"`
- Foco de misión activo → `"El mercader ve foco en {tema} para hoy"`
- Boost de cooldown → mensaje de recarga reducida
- Boosts activos → recuento
- Streak shield activo → mensaje de protección
- Ítems usables en inventario → recuento
- Ya entrenó hoy → sugerencia de recuperación
- XP semanal → muestra el dato
- Puede comprar nivel → invitación

---

### Layout del render

```
<UTBackground color={myColor} />          ← canvas fondo global

<div class="ti-app">                       ← grid 3 columnas
  <header class="ti-top-bar">             ← span full-width
    Brand | Título clase + ctxMsg | Wallet (coins) | Tab nav
  </header>

  <aside class="ti-left">                 ← columna 250px
    Crest de clase + copy
    Boosts activos (lista con fmtTime)
    Acceso rápido wishlist (count)
    Panel servicios compacto
  </aside>

  <main class="ti-main">                  ← columna 1fr
    Categorías (CATS buttons)
    Filtros rarity + sort + search bar
    Featured items (3 ítems destacados)
    Grid de ItemCard (filtrado)
    Tab inventario → invGrouped con UseBtn
    Tab cosméticos → skins/avatares/marcos/títulos
    Tab historial → tabla de historial
    Tab servicios → buyLevel panel + routines
  </main>

  <aside class="ti-right">               ← columna 300px (desaparece en 1180px)
    Panel detalle activo (activeDetail)
    → Item detail: imagen grande, efectos, RarezaBadge, MARKET_KIND_META badge
    → Routine detail: imagen, dificultad, duración, acceso
    → Title detail: rareza, precio, btn comprar/equipar
    Merchant recommendation hint
  </aside>
</div>
```

Responsive:
- `1440px`: columnas se reducen a 230px/1fr/280px
- `1180px`: la columna derecha desaparece; el detalle pasa a modal
- `960px`: columna única, las CATS se convierten en un scroll horizontal

---

### Eventos del sistema emitidos

| Evento | Cuándo |
|---|---|
| `profileUpdated` | Cualquier cambio que afecte al perfil global |
| `shopStateChanged` | Compra, uso, cambio cosmético |
| `exerciseCompleted` | Uso de ítem con XP o level-up |
| `levelUp` | Compra de nivel o ítem que sube nivel |
| `avatarPurchased` | Compra de avatar o marco |
| `avatarEquipped` | Equipar avatar o marco |
| `skinChanged` | Equipar skin |
| `titlePurchased` | Compra de título |
| `titleEquipped` | Equipar/desequipar título |
| `itemUsed` | Uso de ítem del inventario |

---

## UserTiendaLanding.jsx

### Qué ofrece al usuario

UserTiendaLanding es la versión "landing visual" del mercado: la primera pantalla que el usuario ve tiene un **hero personalizado por clase** (escenario de fondo, copy específico y colores de clase), seguido de un layout de dos columnas donde el ítem recomendado se muestra instantáneamente mientras el catálogo completo carga en background. El mercado es tab-lazy: cada pestaña carga sus datos solo cuando el usuario la abre por primera vez.

Características diferenciadoras respecto a UserTienda:
- **Hero dinámico por clase**: GUERRERO/ARQUERO/MAGO tienen escenario CSS, copy y paleta de colores distintos.
- **Ledger de eventos**: cada compra genera una entrada `ledgerEvent` que se fusiona con el historial de Firestore en tiempo real.
- **Chat deep-link**: recibe navegación desde el chat IA (`chatGameplayLink` event o `sessionStorage`) y abre directamente el ítem o tab indicado.
- **Service spotlight**: el chat puede resaltar el panel de servicios durante 3,2 s via `serviceSpotlight`.
- **Lazy loading por tab**: `loadedTabs` + `loadingByTab` garantizan que cada tab se carga solo una vez.
- **Historial paginado**: `loadHistoryTab` soporta cursor/append con botón "cargar más".
- **Scoring de inventario**: `inventoryRecommendedIds` identifica ítems del inventario que vale la pena usar ahora mismo.

---

### Importaciones clave

```js
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Heart, Search } from "lucide-react";
import { auth } from "../../firebase.js";
import {
  getObjetosPublic, buyObjeto, buyLevel, useObjeto,
  getSkins, purchaseSkin, getInventario, getPurchases, getActiveBoosts,
  saveWishlist, purchaseAvatarItem, getAvatarCatalog,
  getMisionesUsuario, getUserStats,
  buyTitle, getTitlesCatalog, equipTitle,
  setActiveAvatar, setActiveFrame, setActiveSkin,
} from "../../services/api.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { AVATARS_CATALOG, FRAMES_CATALOG, RAREZA_AVATAR_COLOR, getAvatarImage } from "../../avatar/AvatarCatalog.js";
import { getSkinPreview } from "../../avatar/SpriteMap.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
```

---

### Constantes clave

```js
const LEVEL_PRICE = 1000;              // monedas por nivel
const LEVEL_MAX_BUY = 10;             // máximo niveles por sesión
const SHOP_HISTORY_PAGE_SIZE = 24;    // ítems por página de historial
const SHOP_RECO_TTL = 3 * 60 * 1000; // cache de contexto mercader: 3 min en sessionStorage
```

#### Paleta UI (propia, sin P palette)

```js
const UI = {
  text: "#f7f1ff", muted: "#b7accb", mutedDeep: "#85799c",
  bg: "#080611", line: "rgba(255,255,255,.08)", gold: "#f4cc78",
  orange: "#ff9f43", green: "#8ac926", red: "#ff6b7d",
  blue: "#4cc9f0", purple: "#c08aff",
};
```

#### STORE_COPY — narrativa por clase

```js
const STORE_COPY = {
  GUERRERO: {
    title: "Entra al mercado con fuerza y botín claro.",
    lead:  "Equipa al guerrero. Fuerza, resistencia y botín para la próxima batalla.",
    note:  "Cada pieza forja al héroe que ya eres.",
  },
  ARQUERO: {
    title: "Compra rápido, equípate mejor y sigue el ritmo.",
    lead:  "Afina tu arsenal. Velocidad, precisión y consumibles para sostener el ritmo.",
    note:  "El arquero gana con lo que tiene en el momento exacto.",
  },
  MAGO: {
    title: "Ordena recursos, foco y cosméticos sin perder claridad.",
    lead:  "Expande tu poder. Control, concentración y objetos para dominar cada sesión.",
    note:  "La tienda del mago es estrategia pura.",
  },
  DEFAULT: {
    title: "Abre el mercado del gremio con una vista más viva.",
    lead:  "Explora el mercado. Objetos, mejoras y cosméticos para forjar tu camino.",
    note:  "Tu próxima ventaja empieza aquí.",
  },
};
```

#### COSMETIC_TAB_META — 4 sub-tabs del mercado cosmético

```js
const COSMETIC_TAB_META = {
  skin:   { label: "Skins",    icon: SHOP_ASSETS.icons.cosmetic },
  avatar: { label: "Avatares", icon: "..." },
  frame:  { label: "Marcos",   icon: "..." },
  title:  { label: "Títulos",  icon: "..." },
};
```

---

### CSS — prefijo `uts-`

Clases principales (diferente a `ti-` de UserTienda):

| Clase | Descripción |
|---|---|
| `.uts-page` | Fondo radial gradient + pixel grid overlay `::before` |
| `.uts-shell` | Max 1680px, grid principal |
| `.uts-panel` | Border-radius 20px, dark gradient bg |
| `.uts-hero` | Grid `minmax(0, 1.04fr) minmax(360px, .96fr)` — copy + stage |
| `.uts-content` | Grid `minmax(0, 1.72fr) minmax(280px, .58fr)` — mercado + panel derecho sticky |
| `.uts-band` | Grid `1.12fr .92fr .92fr` — 3 stats superiores |
| `.uts-toolbar` | Grid `minmax(0, 1.14fr) repeat(3, minmax(130px, .32fr))` — search + filtros |
| `.uts-grid` | `repeat(auto-fit, minmax(220px, 1fr))` — grid de cartas |
| `.uts-card` | `min-height 278px`, `grid-template-rows: 120px auto 1fr auto` |
| `.uts-stage` | `min-height 360px`, `background: var(--shop-scene) cover` |
| `.uts-right` | `position: sticky; top: 14px` |
| `.uts-modal-overlay` | `fixed inset 0; z-index 920` |
| `.uts-modal` | `max 520px; border-radius 24px` |
| `.uts-toast` | `fixed right 24px bottom 24px; z-index 930` |

CSS variables dinámicas:

| Variable | Qué controla |
|---|---|
| `--shop-accent` | Color primario de la clase del héroe |
| `--shop-secondary` | Color secundario de la clase |
| `--shop-scene` | Imagen de fondo del hero stage |
| `--subtab-color` | Color del sub-tab cosmético activo |
| `--inventory-color` | Color de la sección de inventario |
| `--card-accent` | Acento por carta |
| `--card-glow` | Glow radial por carta |
| `--cat-color` | Color del botón de categoría activo |

---

### Estado del componente

| State | Tipo | Rol |
|---|---|---|
| `tab` | string | Tab activo: `mercado/inventario/cosmeticos/historial` (localStorage `uts-tab`) |
| `category` | string | Categoría activa del catálogo |
| `search` | string | Búsqueda libre |
| `rarityFilter` | string | Filtro de rareza |
| `sortBy` | string | Orden del catálogo |
| `inventoryFilter` | string | Filtro de inventario: `all/usable/expiring/recommended` |
| `inventorySort` | string | Orden de inventario: `utility/qty/rarity` |
| `historyFilter` | string | Filtro historial: `today/week/all` |
| `cosmeticTab` | string | Sub-tab cosmético: `skin/avatar/frame/title` |
| `coins` | number | Saldo vivo |
| `items` | array | Catálogo del mercado |
| `inventory` | array | Inventario del usuario |
| `history` | array | Historial paginado de compras |
| `skins/avatarCatalog/frameCatalog/titlesCatalog` | arrays | Catálogos cosméticos |
| `ownedSkins/Avatars/Frames/Titles` | arrays | Propiedad del usuario |
| `activeTitle/SkinId/AvatarId/FrameId` | strings | Cosméticos activos |
| `activeBoosts` | array | Boosts activos |
| `streakShield` | object\|null | Escudo de racha |
| `wishlist` | Set | IDs en wishlist |
| `selected` | object\|null | `{ kind, data }` seleccionado en panel derecho |
| `loadingByTab` | object | `{ mercado, inventario, cosmeticos, historial }` |
| `loadedTabs` | object | Tracks qué tabs ya cargaron (evita re-fetch) |
| `errorsByTab` | object | Error por tab |
| `buyingId/usingId` | string\|null | ID en proceso de compra/uso (anti-double click) |
| `purchaseTarget` | object\|null | Ítem pendiente de confirmación |
| `toast` | object\|null | `{ title, text, tone }` para el toast |
| `liveProfile` | object | Copia local del perfil (se parchea con resultados de API) |
| `inventoryCategory` | string | Categoría activa del inventario |
| `inventoryPage` | number | Página actual del inventario paginado |
| `historyCursor/HasMore/LoadingMore` | mixed | Paginación del historial |
| `ledgerEvents` | array | Eventos de compra en tiempo real (se fusionan con history) |
| `cosmeticPreview` | object\|null | Cosmético en preview antes de equipar |
| `pendingShopAction` | object\|null | Acción pendiente de deep-link del chat |
| `merchantContext` | object | Contexto del héroe calculado |
| `serviceSpotlight` | bool | Resalta el panel de servicios 3,2 s (activado por chat) |
| `inventoryDetailOpen` | bool | Expande/colapsa detalle en inventario |

---

### Carga de datos — tab lazy-loading

Cada tab tiene su propia función de carga con el patrón `useCallback`:

#### `loadMarketTab(force?)`
```
→ getObjetosPublic(token)   // catálogo principal
→ getActiveBoosts(token)    // boosts + streakShield + wishlist
→ loadMerchantContext(token) // getUserStats + getMisionesUsuario (cache sessionStorage 3 min)
```
Se ejecuta al montar el componente. Cache: `loadedTabs.mercado` previene re-fetches.

#### `loadInventoryTab(force?)`
```
→ getInventario(token)
→ getActiveBoosts(token)
```

#### `loadCosmeticsTab(force?)`
```
→ getSkins()
→ getAvatarCatalog()  // avatares + marcos
→ getTitlesCatalog()
```

#### `loadHistoryTab(force?, { append? })`
```
→ getPurchases(token, { limit: 24, cursor })
```
Soporte para append: si `append=true` y `historyHasMore=true`, añade la siguiente página al array. Cursor retornado por la API para paginación.

---

### `loadMerchantContext(token, { force? })`
Cache de 3 min en `sessionStorage` (clave `fv-shop-reco-{uid}`):
1. Si cache fresco y no `force`: restaura y retorna
2. Si no: `Promise.allSettled([getUserStats, getMisionesUsuario])`
3. Llama `buildMerchantContext({ profile, statsPayload, missions, recentSection })`
4. Guarda resultado en sessionStorage con timestamp

---

### Computed values (`useMemo`)

#### `filteredItems`
Catálogo filtrado (category + search + rarityFilter) y ordenado (sortBy). Basado en `items`.

#### `featuredItems`
Ítems con `esNuevo || descuento`. Si no hay, toma los primeros 4 del catálogo.

#### `merchantRecommendation`
Mejor ítem del catálogo según `scoreShopItem(...)`. Algoritmo paralelo al de UserTienda pero usando la función `scoreShopItem` local de este archivo. El ítem recomendado se muestra en el panel derecho como highlight.

#### `marketHighlight`
`merchantRecommendation || featuredItems[0]`. Ítem pre-seleccionado al abrir el mercado.

#### `selectedEntry`
`selected || { kind: "item", data: marketHighlight }`.

#### `groupedInventory`
Inventario agrupado por categoría con `rarityMeta` para ordenado. Misma lógica que `invGrouped` de UserTienda.

#### `filteredInventoryItems`
Inventario filtrado por `inventoryFilter` (usable/expiring/recommended) y ordenado por `inventorySort` (utility/qty/rarity). `"recommended"` usa `inventoryRecommendedIds` (score ≥ 18).

#### `visibleInventoryItems`
Paginación local del inventario: `inventoryPage × inventoryPageSize (4 mobile / 6 desktop)`.

#### `cosmeticCollections`
Objeto con sub-colecciones `{ skin, avatar, frame, title }` con conteos `owned/total`.

#### `marketLedger`
`[...ledgerEvents, ...history]` fusionados y ordenados por `occurredAt` DESC. `ledgerEvents` tiene prioridad al encabezar la lista.

#### `historyFilteredEntries` / `visibleHistory`
Historial filtrado por `historyFilter` (today/week/all). Sin expandir: primeras 8 entradas.

---

### Handlers

#### `handleBuyItem(item, qty, total)`
1. Verifica `coins >= total` (o `item.gratis`)
2. `buyObjeto(token, item.id, qty)`
3. Actualiza saldo y `inventory` localmente
4. `pushLedgerEvent(...)` para entrada en el ledger inmediato
5. Refresca inventario y historial si ya estaban cargados (lazy)
6. Emite `shopStateChanged`
7. Toast: `"Compra realizada — {nombre} ya quedó en tu inventario"`

#### `handleUseItem(item)`
Similar a UserTienda. Extra: si la API retorna `profilePatch`, llama `onProfilePatch(patch)`. Emite `itemUsed`, `exerciseCompleted`, `levelUp` si hay XP/level-up.

#### `handleBuySkin(skin)`
`purchaseSkin` → actualiza `ownedSkins`, `liveProfile` → `pushLedgerEvent` → toast púrpura.

#### `handleBuyAvatarItem(item)` / `handleBuyTitleItem(item)`
`purchaseAvatarItem` / `buyTitle` → actualiza owned arrays → emite `avatarPurchased` → toast con color de rareza.

#### `handleEquipCosmetic(item, type)`
Switch por `type` (`skin/avatar/frame/title`):
- `skin` → `setActiveSkin` → `skinChanged`
- `avatar` → `setActiveAvatar` → `avatarEquipped`
- `frame` → `setActiveFrame` (toggle: si ya equipado lo quita) → `avatarEquipped`
- Frame "desactivar": `nextFrameId = null`

#### `handleLevelSuccess(res)`
Cuando se compra un nivel:
- Actualiza `liveProfile.level`, `xpNext`, `levelsBoughtTotal`, `skillPoints`
- `onProfilePatch(patch)` + `onCoinsChange(nextCoins)`
- Emite `levelUp` con todos los datos
- Refresca historial y contexto mercader
- `pushLedgerEvent("Ascenso del gremio")` con rareza "Legendario"
- Toast dorado: `"Ascenso completado — Tu héroe subió a nivel X"`

---

### Deep-link desde chat IA

El componente escucha dos vías:
1. `sessionStorage["fv-chat-deeplink-v1"]` → procesado al montar
2. `window.addEventListener("chatGameplayLink", ...)` → procesado en tiempo real

El handler `consumeChatDeepLink(payload)` analiza `payload.ctaType/section/itemId`:
- `ctaType` incluye "service" o "level" → `setTab("mercado")` + `setServiceSpotlight(true)`
- `ctaType` incluye "skin/avatar/frame/title/cosmetic" → `setTab("cosmeticos")` + `setPendingShopAction`
- `itemId` presente → busca en `items`, selecciona y abre el panel

`serviceSpotlight` se limpia automáticamente a los 3,2 s. `pendingShopAction` se resuelve cuando el tab cosméticos y los catálogos estén cargados (via `useEffect` que observa `[avatarCatalog, frameCatalog, pendingShopAction, skins, tab]`).

---

### `UTBackground` en UserTiendaLanding — `UTBackground`

La versión de `UTBackground` aquí se llama por su variante interna en el archivo. Igual al de UserTienda: canvas con 34 partículas ember + 3 blobs aurora CSS + pixel grid overlay.

---

### Layout del render

```
<div class="uts-page">                    ← fondo radial + pixel grid
  <div class="uts-shell">                 ← max 1680px
    
    <!-- HERO SECTION -->
    <div class="uts-hero">               ← grid 1.04fr / 0.96fr
      <div class="uts-copy">
        Título de clase (STORE_COPY.title)
        Lead text (STORE_COPY.lead)
        Band de stats: monedas, boosts, items en inv
        Tabs nav: mercado / inventario / cosméticos / historial
      </div>
      <div class="uts-stage">            ← background: var(--shop-scene)
        Ítem/cosmético seleccionado en preview animado
      </div>
    </div>

    <!-- CONTENT SECTION (tabs) -->
    <div class="uts-content">            ← grid 1.72fr / 0.58fr

      <!-- Tab MERCADO -->
      <div class="uts-market">
        Toolbar: search + filtros rareza/sort/category
        Featured strip (featuredItems)
        uts-grid de cartas (filteredItems)
        Panel de servicios (buyLevel + spotlight)
      </div>

      <!-- Tab INVENTARIO -->
      <div class="uts-inventory">
        Category tabs (groupedInventory)
        Filter bar (inventoryFilter + inventorySort)
        Grid de ítems del inventario (visibleInventoryItems)
        Paginación anterior/siguiente
        Detalle del ítem seleccionado (inventoryDetailOpen)
      </div>

      <!-- Tab COSMÉTICOS -->
      <div class="uts-cosmetics">
        Sub-tabs: skin / avatar / frame / title
        Grid de colección (activeCosmeticCollection.items)
        Preview animado + botones comprar/equipar
      </div>

      <!-- Tab HISTORIAL -->
      <div class="uts-history">
        Filter (today/week/all) + stats totales
        Lista visibleHistory (8 sin expandir, todos expandidos)
        Btn "cargar más" (append paginado)
      </div>

      <!-- PANEL DERECHO (sticky) -->
      <div class="uts-right">
        selectedEntry → detail del ítem/cosmético/servicio
        Merchant recommendation card
        Wishlist toggle (Heart icon)
        Quick buy / equip actions
      </div>
    </div>

    <!-- TOAST -->
    <AnimatePresence>
      { toast && <div class="uts-toast">... </div> }
    </AnimatePresence>

  </div>
</div>
```

---

### Eventos emitidos por UserTiendaLanding

| Evento | Cuándo |
|---|---|
| `shopStateChanged` | Compra de ítem, skin |
| `avatarPurchased` | Compra de avatar o marco |
| `skinChanged` | Equipar skin |
| `avatarEquipped` | Equipar avatar o marco |
| `itemUsed` | Uso de ítem del inventario |
| `exerciseCompleted` | Ítem que otorga XP |
| `levelUp` | Compra de nivel o ítem con level-up |

---

## Tabla comparativa UserTienda vs UserTiendaLanding

| Aspecto | UserTienda | UserTiendaLanding |
|---|---|---|
| **Paleta** | `C` + `V` mapeados desde `P` (design/system) | `UI` object propio, sin P |
| **Prefijo CSS** | `ti-` | `uts-` |
| **Carga de datos** | `Promise.allSettled` en mount, cachés en módulo | Tab lazy-loading, cache en sessionStorage |
| **Recomendación** | `scoreMarketItemForContext` (ítem + routine + title) | `scoreShopItem` (ítem únicamente en panel) |
| **Historial** | Array local en módulo (`_histCache`) | Paginado con cursor via `getPurchases(cursor)` |
| **Cosmético** | Tabs dentro del mismo componente | Sub-tabs en tab "cosméticos" separada |
| **Deep-link chat** | No | Sí — `chatGameplayLink` + sessionStorage |
| **Service spotlight** | No | Sí — 3,2 s highlight desde chat |
| **Hero de clase** | Banner lateral + copy | Hero section completo con stage CSS + STORE_COPY |
| **Ledger de eventos** | `historial` array push local | `ledgerEvents` fusionados con `history` (merge sort) |
| **i18n** | Uso extensivo de `useLang()` / `t()` | Mínimo, texto mayormente hardcoded |
| **Wishlist** | `Set` → debounce 1,5 s → `saveWishlist` | Igual + refs `wishlistHydratedRef/SkipSyncRef` |
| **Toast** | `UseResultToast` (5,5 s, efecto detallado) + `CoinNotif` | Toast genérico `{ title, text, tone }` 3,2 s |
| **Inventario** | Agrupado por categoría, `invGrouped` simple | Paginado (4/6 por página), filtros usable/expiring/recommended |

---

## API calls totales (ambos componentes)

| Función | Propósito | TTL caché |
|---|---|---|
| `getObjetosPublic` | Catálogo de ítems del mercado | 5 min (UserTienda) / lazy tab |
| `buyObjeto` | Comprar ítem | — |
| `buyLevel` | Comprar nivel directamente | — |
| `useObjeto` | Usar ítem del inventario | — |
| `getSkins` | Catálogo de skins | Lazy (cosméticos) |
| `purchaseSkin` | Comprar skin | — |
| `getInventario` | Inventario del usuario | 2 min / lazy tab |
| `getPurchases` | Historial paginado | 3 min / lazy tab |
| `getActiveBoosts` | Boosts activos + streakShield + wishlist | Siempre fresco |
| `saveWishlist` | Persistir wishlist | Debounce 1,5 s |
| `purchaseAvatarItem` | Comprar avatar o marco | — |
| `getAvatarCatalog` | Catálogo avatares + marcos | Lazy (cosméticos) |
| `getMisionesUsuario` | Misiones activas (para scoring) | 4 min (UserTienda) / 3 min sessionStorage |
| `getUserStats` | Stats del héroe (para scoring) | Igual |
| `getRutinasPublicas` | Rutinas públicas (panel servicios) | 6 min (UserTienda) |
| `buyTitle` | Comprar título | — |
| `getTitlesCatalog` | Catálogo de títulos | Lazy (cosméticos) |
| `equipTitle` | Equipar/desequipar título | — |
| `setActiveAvatar` | Equipar avatar | — |
| `setActiveFrame` | Equipar marco | — |
| `setActiveSkin` | Equipar skin | — |

**Total: 20 funciones de API** — el mayor número de cualquier página `user/`.

---

## Resumen

| Item | Detalle |
|---|---|
| **Archivos** | `UserTienda.jsx` (~2600 líneas) · `UserTiendaLanding.jsx` (~3000 líneas) |
| **Sub-componentes** | UTBackground, ItemImageBox, RarezaBadge, CoinNotif, ItemModal (4 fases), ItemCard, SkeletonCard, UseResultToast, fmtTime |
| **Keyframes CSS** | 25+ (UserTienda) · 15+ (UserTiendaLanding) |
| **Estado total** | ~35 useState por componente |
| **APIs** | 20 funciones compartidas entre ambos |
| **Eventos emitidos** | 10 CustomEvents distintos al sistema |
| **Cachés** | 5 módulo-level (UserTienda) · 1 sessionStorage TTL 3 min (UserTiendaLanding) |
| **Rareza tiers** | 6: Común → Poco común → Raro → Épico → Legendario → Mítico |
| **Categorías** | 7: Todos / Poción / Equipo / Cosmético / Consumible / Coleccionable / Especial |
| **Market kinds** | 5: functional / cosmetic / collectible / service / legacy |
| **Tabs UserTienda** | tienda / inventario / cosméticos / servicios / historial |
| **Tabs UserTiendaLanding** | mercado / inventario / cosméticos / historial |
| **Sub-tabs cosméticos** | skin / avatar / frame / title |
| **Responsive** | 3 breakpoints (1440 / 1180 / 960) en UserTienda · diseño propio en UserTiendaLanding |
| **Deep-link** | No (UserTienda) · Sí via chatGameplayLink + sessionStorage (UserTiendaLanding) |
