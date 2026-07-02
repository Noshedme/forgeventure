# Carpeta `frontend/src/` — Parte 1: assets, avatar, components, design

> Esta es la carpeta principal del código fuente del frontend. Todo lo que aquí vive fue escrito por el desarrollador y define la lógica, la interfaz y el comportamiento de la aplicación.

---

## 1. `src/assets/`

### ¿Qué es?

Carpeta mínima de assets **importados directamente por el código JavaScript**. A diferencia de `public/`, los archivos en `assets/` son procesados por Vite: reciben un hash en su nombre y se optimizan en el bundle final.

### Contenido

```
src/assets/
└── react.svg    → ícono SVG de React (incluido por defecto por Vite al crear el proyecto)
```

> En ForgeVenture, esta carpeta se mantiene prácticamente vacía porque todos los assets de la app viven en `public/` y se referencian por ruta fija. El único archivo presente es el SVG por defecto de Vite, no utilizado en producción.

---

## 2. `src/avatar/`

### ¿Qué es?

El **sistema completo del avatar asistente** de ForgeVenture. Este personaje animado (llamado "Flex") aparece como un widget flotante en el dashboard del usuario. Reacciona al contexto del usuario, responde preguntas, da tips personalizados y puede cambiar de aspecto (skin) desde la tienda.

```
src/avatar/
├── SpriteMap.js        → motor de frames y rutas de animación
├── useAvatarState.js   → hook de estado y ciclo de animación
├── AvatarSprite.jsx    → componente que renderiza el frame actual
├── AvatarWidget.jsx    → widget flotante completo (chat + tips + menú)
├── ChatBubble.jsx      → burbuja de diálogo del avatar
├── AvatarCatalog.js    → catálogo de avatares de perfil y marcos
├── TitulosCatalog.js   → catálogo de títulos del héroe
├── responses.js        → árbol de diálogos y lógica conversacional
└── avatar-widget.css   → estilos del widget flotante
```

---

### `SpriteMap.js` — Motor de animación por frames

Define qué carpeta y cuántos frames tiene cada estado de animación, y construye las rutas de imagen dinámicamente.

```js
// Estados disponibles y su configuración:
const FRAMES = {
  idle:      { count: 8,  fps: 6  },   // respiro suave en reposo
  talking:   { count: 6,  fps: 10 },   // boca en movimiento
  happy:     { count: 4,  fps: 8  },   // reacción positiva
  wave:      { count: 4,  fps: 7  },   // saludo
  thinking:  { count: 4,  fps: 5  },   // reflexión (más lento)
  walk:      { count: 6,  fps: 8  },   // desplazamiento
  dance:     { count: 8,  fps: 10 },   // celebración
  surprised: { count: 3,  fps: 8  },   // reacción rápida
  bored:     { count: 6,  fps: 4  },   // inactividad prolongada
};
```

**Skins disponibles** (cambian el aspecto del avatar desde la tienda):
```js
const SKINS = {
  default:   { base: '/avatar',    suffix: '' },
  guerrero:  { base: '/guerrero',  suffix: '_guerrero' },
  caballero: { base: '/caballero', suffix: '_caballero' },
};
```

**Función principal `getFramePath(state, frameIndex, skin)`:**
Dado un estado, un número de frame y una skin, devuelve la ruta exacta de la imagen:
```
getFramePath('idle', 3, 'default') → '/avatar/idle/idle_04.png'
getFramePath('happy', 1, 'guerrero') → '/guerrero/happy/happy_02_guerrero.png'
```
El frame se cicla con módulo (`frameIndex % count`) para que nunca se salga del rango.

---

### `useAvatarState.js` — Hook de ciclo de animación

Custom hook de React que gestiona el **estado activo del avatar y el contador de frames** usando un intervalo de tiempo.

**Lógica interna:**
1. Mantiene el estado actual (`idle`, `talking`, etc.) y el índice de frame actual
2. Cuando cambia el estado, reinicia el frame a 0 y ajusta el intervalo a los FPS del nuevo estado
3. `playOnce(newState, thenState)`: ejecuta una animación de una sola pasada y vuelve al estado anterior. Calcula la duración total (`frames / fps * 1000 ms`) y usa `setTimeout` para el retorno.

```js
// Ejemplo de uso:
const { state, frame, setState, playOnce } = useAvatarState('idle');

// Celebrar un logro y volver al idle:
playOnce('happy', 'idle');  // happy dura (4 frames / 8 fps) = 500ms
```

---

### `AvatarSprite.jsx` — Renderizador de frames

Componente simple que recibe el estado y el frame actual y renderiza la imagen correspondiente como un `<img>`.

**Flujo:**
```
AvatarWidget → useAvatarState (estado + frame) → AvatarSprite → <img src={getFramePath(...)} />
```

La imagen se actualiza con cada tick del intervalo, creando la ilusión de animación.

---

### `AvatarWidget.jsx` — Widget flotante completo

Es el componente principal y más complejo del sistema avatar. Orquesta todo: animación, conversación, tips, configuración.

**Partes que lo componen:**

1. **Tips inteligentes (`buildSmartTips`):** Genera una lista de tips combinando tips base (20 estáticos sobre fitness) con tips dinámicos basados en el perfil real del usuario:
   - Si le faltan ≤150 XP para subir de nivel → avisa exactamente cuánta XP falta
   - Si tiene racha ≥14 días → tip de leyenda
   - Si tiene muchas monedas acumuladas → sugiere la tienda
   - Si el nivel es alto → contenido avanzado disponible

2. **Sistema de tips rotatorios:** Los tips se mezclan (`shuffle`) y rotan automáticamente cada 12 segundos mostrando uno en la burbuja del avatar.

3. **Árbol de conversación:** Cuando el usuario abre el chat, navega por nodos de diálogo definidos en `responses.js`. Cada nodo tiene texto, un estado de animación y opciones clickeables.

4. **Acciones especiales (`__logout`, `__nav_*`):** Nodos prefijados con `__` desencadenan efectos de la app (cerrar sesión, navegar a una sección) en lugar de continuar el diálogo.

5. **Posición flotante:** Vive en posición `fixed` en la esquina inferior derecha, por encima de todo el contenido (`z-index` alto).

---

### `responses.js` — Árbol de diálogos (908 líneas)

Define **todos los textos y flujos de conversación** del avatar Flex. Está organizado en:

**Lore por clase (`CLASS_LORE`):** Descripción del camino de entrenamiento de cada clase (Guerrero, Arquero, Mago, Asesino, Paladín) con tip específico.

**Saludo inicial dinámico (`buildUserInitial`):** La primera vez que el usuario abre el widget, el saludo cambia según su contexto:
- Sin racha → saludo básico
- 1-6 días de racha → menciona la racha
- 7-13 días → "¡brutal!"
- ≥14 días → "eres una leyenda"

**Nodos de diálogo:** Cada nodo es un objeto `{ text, state, options[] }`:
- `text`: lo que dice Flex
- `state`: animación que hace mientras habla (`talking`, `thinking`, `happy`...)
- `options`: botones que el usuario puede pulsar, cada uno con un `id` que lleva al siguiente nodo

**Flujos disponibles:**
- `mi_progreso` → muestra XP, nivel, racha del usuario
- `que_hago_hoy` → recomendación personalizada de misión del día
- `charla` → conversación casual con Flex
- `nav_menu` → menú de navegación a secciones
- `training` → consejos de entrenamiento
- `nutrition` → consejos de nutrición
- `recovery` → consejos de recuperación
- `fitness_quiz` → quiz interactivo de fitness
- `app_help` → ayuda con la aplicación
- `lore_class` → lore de la clase del usuario

---

### `AvatarCatalog.js` — Catálogo de avatares y marcos

Define los **10 avatares de perfil** y los **6 marcos decorativos** disponibles en la tienda, con su metadata completa:

**Avatares de perfil:**
| ID | Nombre | Precio | Rareza |
|---|---|---|---|
| avatar_01 | Héroe Clásico | 0 (gratis) | Común |
| avatar_02 | Alma de Fuego | 400 | Común |
| avatar_03 | Espíritu Ártico | 400 | Común |
| avatar_04 | Rayo Veloz | 800 | Poco común |
| avatar_05 | Lobo Solitario | 1200 | Raro |
| avatar_06 | Dragón Ascendido | 2000 | Épico |
| avatar_07 | Fénix Eterno | 3500 | Legendario |
| avatar_08 | Sombra Oscura | 1500 | Raro |
| avatar_09 | Tormenta Solar | 2500 | Épico |
| avatar_10 | Campeón Supremo | 5000 | Legendario |

**Marcos de perfil:** 6 marcos con gradientes CSS definidos (algunos con `animated: true` para el efecto de rotación continua). Los marcos legendarios usan `conic-gradient` para el efecto arcoíris.

**`RAREZA_AVATAR_COLOR`:** Mapa de color por rareza, usado para el badge de rareza en la UI de la tienda.

---

### `TitulosCatalog.js` — Catálogo de títulos del héroe

Define los **títulos** que el héroe puede ostentar debajo de su nombre. Hay dos tipos:

- **Ganados (`fuente: "ganado"`):** Se obtienen completando logros o misiones específicas. Precio 0. Ej: "Guardián Mental" (7 días de bienestar), "Mente de Acero" (logro de disciplina).
- **Comprables (`fuente: "tienda"`):** Se compran con monedas en la tienda. Tienen precio variable según rareza.

Cada título tiene: `id`, `nombre`, `desc`, `rareza`, `color` hex, `fuente`, `precio`, y un `hint` que explica cómo conseguirlo.

---

### `avatar-widget.css`

Estilos del widget flotante: animaciones de entrada/salida de la burbuja de chat, scrollbar personalizado del historial de mensajes, transiciones de apertura del panel.

---

## 3. `src/components/`

Componentes React reutilizables agrupados por dominio. Se importan desde múltiples páginas.

```
src/components/
├── SplashScreen.jsx      → pantalla de carga inicial
├── admin/
│   └── config/           → paneles de configuración del admin
├── auth/                 → flujo de autenticación y onboarding
├── exercise/             → motor de detección de ejercicios con IA
└── shared/               → componentes transversales de UI
```

---

### `SplashScreen.jsx`

Pantalla de carga animada que se muestra mientras Firebase inicializa la sesión del usuario. Evita el flash de contenido no autenticado (FOUC). Muestra el logo de ForgeVenture con una animación de entrada y una barra de progreso.

**Lógica:** Se renderiza condicionalmente en `App.jsx` mientras `authLoading === true`. Una vez que Firebase confirma el estado de autenticación, desaparece con una transición de salida.

---

### `components/admin/config/`

Paneles del panel de administración para configurar distintos aspectos de la plataforma. Todos se montan dentro de `AdminConfig.jsx` como pestañas.

| Archivo | Función |
|---|---|
| `GeneralConfig.jsx` | Nombre de la app, descripción, logo, URL pública |
| `JuegoConfig.jsx` | Parámetros de gameplay: XP base, multiplicadores, límites de energía |
| `XPConfig.jsx` | Sistema de XP por acción: cuántos puntos da cada misión, ejercicio o logro |
| `NotificacionesConfig.jsx` | Gestión de notificaciones push y emails automáticos |
| `SeguridadConfig.jsx` | Políticas de contraseña, sesión máxima, bloqueo de cuentas |
| `MaintenanceConfig.jsx` | Modo mantenimiento: activa un banner y bloquea acceso a usuarios normales |
| `shared.jsx` | Componentes de UI compartidos entre todos los paneles: `ConfigSection`, `ConfigField`, `ConfigToggle`, `SaveButton` |

**`shared.jsx` — patrón de formulario de configuración:**
Define primitivas reutilizables para construir formularios de configuración consistentes. Cada campo tiene label, descripción, valor actual y un handler de cambio. El botón de guardar llama a la API del backend para persistir los valores en Firestore.

---

### `components/auth/`

Componentes del flujo de **registro, login y selección de clase**.

#### `ClassPicker.jsx` — Selector de clase RPG

Muestra las 3 clases disponibles (Guerrero, Arquero, Mago) como tarjetas interactivas con:
- Efecto 3D en hover con `perspective` y `rotateY/rotateX` CSS
- Barras de stats animadas (Fuerza, Velocidad, Magia, Resistencia) representadas como segmentos pixelados
- Al seleccionar una clase, emite la elección al componente padre (onboarding)

**Lógica de stats por clase:**
```
GUERRERO: Fuerza=95, Velocidad=60, Magia=20, Resistencia=85
ARQUERO:  Fuerza=55, Velocidad=90, Magia=45, Resistencia=75
MAGO:     Fuerza=30, Velocidad=65, Magia=95, Resistencia=60
```

#### `HeroCharacter.jsx` — Personaje animado en el registro

Muestra el sprite del personaje de la clase seleccionada durante el onboarding, con animación idle en tiempo real. Cambia automáticamente cuando el usuario cambia de clase en `ClassPicker`. Usa los mismos sprites de `/personaje/base_[clase]/stage1_idle_N.png` que la Ficha del Héroe.

#### `Field.jsx` — Input de formulario RPG

Campo de formulario estilizado con el diseño RPG de ForgeVenture. Soporta:
- Tipos: `text`, `email`, `password` (con toggle de visibilidad)
- Validación visual: borde verde si válido, rojo si hay error
- Para contraseñas: barra de fortaleza animada usando la librería `zxcvbn`
- Ícono de Lucide configurable

#### `AuthPortalLoader.jsx`

Overlay de carga que aparece durante operaciones de autenticación (login con Google, registro). Muestra una animación de portal mágico con el logo de ForgeVenture.

#### `SuccessOverlay.jsx`

Pantalla de éxito animada que se muestra tras el registro exitoso. Incluye confetti (usando `canvas-confetti`), el nombre y clase del nuevo héroe, y una animación de entrada antes de redirigir al dashboard.

#### `useParticles.js`

Hook que genera partículas flotantes animadas en el canvas de fondo de las pantallas de auth. Crea N partículas con posición, velocidad, tamaño y opacidad aleatorias, animadas con `requestAnimationFrame`.

---

### `components/exercise/`

El **motor de inteligencia artificial para detección de ejercicios** mediante la cámara. Es uno de los sistemas más complejos del proyecto.

#### `exerciseLogic.js` — Motor de detección (1040 líneas)

Define la lógica matemática de detección de cada ejercicio usando los **33 landmarks (puntos de pose)** que devuelve MediaPipe.

**Índices de landmarks (`LM`):**
MediaPipe Pose detecta 33 puntos del cuerpo (nariz, ojos, hombros, codos, muñecas, caderas, rodillas, tobillos, etc.). El archivo define constantes con nombre para cada índice:
```js
LM.LEFT_SHOULDER = 11    LM.RIGHT_SHOULDER = 12
LM.LEFT_ELBOW    = 13    LM.RIGHT_ELBOW    = 14
LM.LEFT_WRIST    = 15    LM.RIGHT_WRIST    = 16
LM.LEFT_HIP      = 23    LM.RIGHT_HIP      = 24
LM.LEFT_KNEE     = 25    LM.RIGHT_KNEE     = 26
```

**Detección por ángulo con histéresis:**
Para cada ejercicio se define un triplete de joints (A → B → C) y se calcula el ángulo en B usando la ley del coseno con vectores 3D de los world landmarks. Se usa **histéresis** (dos umbrales con al menos 50° de brecha) para evitar contar repeticiones por oscilaciones pequeñas:

```
Sentadilla: ángulo en rodilla
  DOWN < 95°  →  posición baja detectada
  UP   > 155° →  posición alta (1 rep completada)

Flexión (push-up): ángulo en codo
  DOWN < 90°  →  pecho abajo
  UP   > 155° →  brazos extendidos (1 rep)

Abdominal (crunch): ángulo en cadera
  DOWN < 80°  →  contraído
  UP   > 130° →  extendido
```

**Validadores de posición (`positionCheck`):**
Antes de empezar a contar reps, verifican que el usuario está en la orientación correcta (de lado, de frente, de espaldas) usando la posición relativa de landmarks clave.

**Validadores de técnica (`formChecks`):**
Durante el ejercicio, detectan errores de forma en tiempo real:
- Rodillas hacia adentro en sentadilla
- Cadera caída en flexión
- Cuello forzado en abdominal

**`SKELETON_CONNECTIONS`:** Lista de pares de landmarks que se conectan para dibujar el esqueleto sobre el video.

#### `PoseCamera.jsx` — Cámara con detección en vivo (748 líneas)

Componente React que gestiona toda la integración con la cámara web y MediaPipe.

**Arquitectura técnica:**
- **Carga desde CDN** (no desde node_modules): los archivos WASM de MediaPipe no son compatibles con el sistema de módulos de Vite, por lo que los scripts se cargan dinámicamente desde jsDelivr CDN en runtime.
- **Singleton de Pose**: MediaPipe Pose solo puede inicializarse una vez por sesión. El componente mantiene una referencia compartida para evitar reinicializaciones.
- **World landmarks vs 2D landmarks**: usa coordenadas 3D (`worldLandmarks`) para calcular ángulos más precisos y 2D (`poseLandmarks`) solo para dibujar el esqueleto sobre el canvas.
- **Suavizado de ángulo (`SMOOTH_N` frames)**: promedia los últimos N ángulos para eliminar el ruido de la detección y evitar falsos positivos.
- **Anti-doble-conteo**: un timer mínimo (`MIN_REP_MS`) entre repeticiones evita que un movimiento brusco cuente como dos reps.
- **Calidad por rep**: cada repetición se clasifica como 💚 buena, 🟡 advertencia o 🔴 con error según los `formChecks` activos durante esa rep.

**Flujo por frame:**
```
Cámara → MediaPipe Pose → landmarks 3D → calcular ángulo
→ suavizar → comparar umbrales DOWN/UP → contar rep
→ validar técnica → emitir a componente padre
```

---

### `components/shared/`

Componentes globales usados en múltiples páginas del usuario.

#### `ui.jsx` — Biblioteca de UI transversal (577 líneas)

Exporta primitivas de UI reutilizables:

| Componente | Función |
|---|---|
| `Skeleton*` | Placeholders de carga (shimmer animado) para cards, listas, texto |
| `EmptyState` | Estado vacío con ícono, título y descripción |
| `Spinner` | Indicador de carga circular |
| `ConfirmModal` | Modal de confirmación destructiva (sí / cancelar) |
| `useAutoRefresh` | Hook que refresca datos cada N segundos automáticamente |

También define la **paleta de colores base** `C` (RPG oscuro) y el objeto `SHARED_CSS` con las animaciones globales de la app (`fv-shimmer`, `fv-fadeUp`, `fv-scaleIn`, `fv-spin`, `fv-pulse`, etc.) que se inyectan una vez en el DOM.

#### `theme.js` — Fuente de verdad visual (168 líneas)

Define tokens de diseño compartidos entre los componentes de auth y onboarding:
- Paleta `T` (azul marino oscuro, cobre, oro, azul acero)
- Helpers de tipografía: `px(size)`, `raj(size, weight)`, `orb(size, weight)`
- Definiciones de las clases `CLASSES[]` con sus colores, stats y descripciones (usados por `ClassPicker` y `HeroCharacter`)

#### `SettingsPanel.jsx` — Panel de configuración de usuario (1152 líneas)

Panel lateral deslizante con todas las preferencias del usuario. Se abre desde el header del dashboard.

**Secciones:**
- **Perfil:** nombre, foto, clase del héroe
- **Sonido:** toggle de música ambiental, efectos de sonido, volumen
- **Apariencia:** tema visual, tamaño de fuente
- **Notificaciones:** preferencias de alertas
- **Idioma:** selector de idioma (ES, EN, PT, FR) conectado al sistema i18n
- **Privacidad:** visibilidad del perfil, datos compartidos
- **Cuenta:** cerrar sesión, eliminar cuenta

Los cambios se persisten en Firestore (colección `users/{uid}/preferences`) y se aplican inmediatamente en la UI.

#### `SkillTree.jsx` — Árbol de habilidades (1051 líneas)

Visualización interactiva del árbol de habilidades del héroe. Renderiza nodos conectados por líneas SVG en un layout de grafo.

**Lógica:**
- Cada nodo tiene estado: `locked` (bloqueado), `available` (desbloqueable), `unlocked` (activo)
- Un nodo se desbloquea cuando sus prerrequisitos están activos y el usuario tiene suficientes puntos
- Al hacer clic en un nodo disponible, se llama a la API para registrar el desbloqueo en Firestore
- Las líneas SVG entre nodos cambian de color según el estado de conexión

#### `LevelUpCeremony.jsx` — Ceremonia de subida de nivel (514 líneas)

Modal overlay que se activa automáticamente cuando el usuario sube de nivel. Incluye:
- Animación de partículas con `canvas-confetti`
- Número de nivel anterior → nuevo con animación de conteo
- Nuevas recompensas desbloqueadas en ese nivel
- Sonido de fanfarria (`levelup.wav` vía `soundManager`)
- Botón de continuar que cierra el modal y actualiza el estado global

#### `DailyBonusModal.jsx` — Modal de bono diario (1502 líneas)

Sistema de **recompensas por racha de días consecutivos**. Se abre automáticamente la primera vez que el usuario entra al día.

**Lógica de racha:**
- Si el usuario entró ayer → racha continúa, día +1
- Si el usuario no entró ayer → racha se reinicia a día 1
- Los días se muestran como casillas (día 1 al 7), con la imagen correspondiente
- El día actual tiene el frame de "hoy", los anteriores están marcados como "claimed", los futuros como "locked"
- El día 7 siempre da una recompensa mayor (gemas o ítem épico)

#### `DailyBonusPopup.jsx` — Popup flotante de bono (389 líneas)

Versión compacta del bono diario que aparece como notificación en la esquina si el usuario no ha reclamado el bono del día. Al hacer clic, abre el `DailyBonusModal`.

#### `BossBattleModal.jsx` — Modal de Boss Battle (1029 líneas)

Modal de pantalla completa para los enfrentamientos con jefes. Integra `PoseCamera` con la lógica de combate gamificada:
- La vida del jefe se reduce con cada repetición completada
- El jefe ataca (animación de ataque) cuando el usuario comete errores de técnica
- Al derrotar al jefe, aparece la animación de `death` y se entregan recompensas
- Timer de combate: si se acaba el tiempo, el jefe "escapa"

#### `PRBanner.jsx` — Banner de récord personal (191 líneas)

Banner animado que aparece cuando el usuario rompe su récord personal en un ejercicio (más reps, más peso, mejor tiempo). Incluye el ejercicio, el récord anterior vs el nuevo, y una animación de entrada desde la parte superior.

#### `StreakChallengeCard.jsx` — Tarjeta de desafío de racha (296 líneas)

Card interactiva que muestra el desafío de racha activo del usuario (por ejemplo: "Completa 5 días seguidos"). Muestra el progreso, los días restantes y la recompensa al completarlo.

#### `SocialFab.jsx` — Botón flotante social (410 líneas)

Botón de acción flotante (FAB) con funcionalidades sociales:
- Abrir el chat
- Ver solicitudes de amistad pendientes
- Notificaciones recientes
- Badge con contador de elementos sin leer

---

## 4. `src/design/`

### ¿Qué es?

El **sistema de diseño central** de ForgeVenture. Es un único archivo que exporta todos los tokens visuales, helpers de tipografía y componentes de fondo reutilizables. Todas las páginas del dashboard importan desde aquí en lugar de duplicar valores localmente.

```
src/design/
└── system.jsx    → paleta P, helpers mono/sans/disp, glass(), Aurora, PixelRain, Embers, y más
```

---

### `system.jsx` — Sistema de diseño (313 líneas)

#### Inyección de fuentes (ejecución única)

Al importarse por primera vez, inyecta un `<link>` en el `<head>` del documento para cargar las tres fuentes del proyecto desde Google Fonts:
- **Manrope** (pesos 300–900): fuente sans-serif para títulos y cuerpo
- **JetBrains Mono** (pesos 400–800): fuente monoespaciada para labels, stats y datos técnicos
- **VT323**: fuente pixel art para el efecto PixelRain

#### Paleta `P` — morado oscuro RPG

```js
P.bg0    = "#08051A"  // fondo más oscuro (negro morado)
P.bg1    = "#14092A"  // fondo de cards
P.bg2    = "#2A1050"  // fondo de paneles destacados
P.accent = "#A55EEA"  // morado principal (botones, spans, glows)
P.accent2= "#D4B4FF"  // morado claro (variante secundaria)
P.gold   = "#FFD166"  // dorado (recompensas, XP, highlights)
P.glow   = "#4A1E7A"  // morado oscuro para sombras de glow
P.navy   = "#1C1040"  // azul marino oscuro
P.line   = "#2A1550"  // color de bordes y líneas
P.text   = "#F0E6FF"  // texto principal (blanco morado)
P.muted  = "#9080B0"  // texto secundario (gris morado)
P.mutedL = "#B0A0C8"  // texto terciario (más claro)
```

#### Helpers de tipografía

Funciones que devuelven objetos de estilo CSS inline, eliminando la necesidad de escribir la misma familia de fuente repetidamente:

```js
mono(size, weight)  → { fontFamily: 'JetBrains Mono', fontSize, fontWeight }
sans(size, weight)  → { fontFamily: 'Manrope', fontSize, fontWeight }
disp(size, weight)  → { fontFamily: 'Manrope', fontSize, fontWeight, letterSpacing: '-.02em' }
```

#### `glass(opacity)` — Glassmorphism

Función que genera el estilo de **vidrio esmerilado** (glassmorphism) usado en todos los paneles del dashboard:
```js
glass(0.75) → {
  background: 'linear-gradient(135deg, #14092ABF, #2A1050aa)',
  backdropFilter: 'blur(14px)',
  border: '1px solid #2A1550',
}
```
La opacidad se convierte a hexadecimal y se añade al color de fondo como alpha.

---

#### Componente `Aurora` — Fondo con blobs animados

Tres esferas de color difuminadas (`filter: blur(100px)`) que flotan lentamente en el fondo usando `framer-motion`. Cada esfera tiene duración, dirección y escala de movimiento diferente (28s, 34s y 40s respectivamente) para que nunca se repitan al mismo tiempo.

Sobre las esferas se superponen:
- **Grid overlay:** cuadrícula sutil de 56×56px con máscara radial para que solo sea visible en el centro
- **Vignette:** gradiente radial que oscurece los bordes de la pantalla

Respeta `prefers-reduced-motion` — si el usuario tiene activada la reducción de movimiento, no renderiza nada.

#### Componente `PixelRain` — Lluvia de caracteres pixel

Efecto **Matrix-style** en un `<canvas>` de pantalla completa. Lluvia de caracteres (`01▲◆●⚔⚡◉`) en colores morado, lila y dorado cayendo por columnas de 16px de ancho.

**Lógica del canvas:**
- Cada columna tiene su propia posición Y independiente y color asignado aleatoriamente al inicio
- Cada frame: rellena con `rgba(8,5,26,0.08)` (casi transparente) para crear el efecto de rastro desvanecido
- Dibuja el carácter actual de cada columna y avanza la posición Y
- Cuando una columna sale del borde inferior, reaparece en una posición Y negativa aleatoria

Se renderiza con `mix-blend-mode: screen` para integrarse visualmente con el fondo Aurora.

#### Componente `Embers` — 60 partículas flotantes

**60 partículas** de tamaño diminuto (radio 0.6–2.2px) que flotan suavemente hacia arriba en el canvas. Cada partícula tiene velocidad, color y opacidad aleatoria. Al salir por el borde superior reaparecen abajo con una posición X aleatoria.

#### Componente `Reveal` — Aparición al hacer scroll

Envuelve cualquier elemento y lo anima con **fade + slide-up** cuando entra en el viewport. Usa `useInView` de Framer Motion con un margen de `-50px` (se activa justo antes de que sea completamente visible). La animación solo se ejecuta una vez (`once: true`).

#### Componente `Counter` — Número animado

Anima un número de 0 al valor objetivo cuando entra en el viewport. Usa `setInterval` para incrementar el valor gradualmente. Si el valor objetivo es un string no numérico, lo muestra directamente sin animar.

#### Componente `Brackets` — Decoración de esquinas

Dibuja 4 corchetes decorativos en las esquinas de un elemento, estilo HUD de juego RPG. Se usa sobre cards y paneles destacados.

#### Componente `ScrollProgress` — Barra de progreso de scroll

Barra horizontal en la parte superior de la página que indica el progreso de scroll del usuario. Usa `useSpring` de Framer Motion para que el avance sea suavizado.

#### Componente `CustomCursor` — Cursor personalizado

Reemplaza el cursor del sistema por un **crosshair en forma de corchetes** que sigue al mouse con un efecto de inercia (lag de 14% por frame). Usa `requestAnimationFrame` para la interpolación suave.

#### Componente `MiniBar` — Barra de progreso inline

Barra de progreso compacta con animación de entrada. Calcula el porcentaje (`val/max*100`), lo anima desde 0 con `framer-motion` y añade un brillo tipo "glow" del color de la barra.
