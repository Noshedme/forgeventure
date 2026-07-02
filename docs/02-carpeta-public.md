# Carpeta `frontend/public/`

## ¿Qué es esta carpeta?

`public/` es el directorio de **assets estáticos** del frontend. Todo lo que vive aquí se sirve tal cual al navegador, sin que Vite lo procese, compile ni transforme. La URL de acceso en el navegador es directa: un archivo en `public/ui/logo.png` se accede como `/ui/logo.png` desde cualquier componente.

Durante el build de producción (`npm run build`), Vite copia toda esta carpeta dentro de `dist/`, manteniendo la misma estructura de rutas.

### ¿Por qué no están dentro de `src/`?

Los assets en `src/` son importados por el código JS y Vite les aplica optimizaciones (hash en el nombre, tree-shaking, inlining si son pequeños). Los assets en `public/` se referencian por ruta fija en el código y se necesita que esa ruta nunca cambie. Esto es clave para:
- **Sprites animados**: el sistema de animación construye rutas dinámicamente (`/avatar/idle/frame_01.png`, `/avatar/idle/frame_02.png`...) y necesita que la ruta sea predecible.
- **Videos y audios**: se cargan bajo demanda, no en el bundle inicial.
- **Assets de terceros** como MediaPipe que buscan archivos por ruta fija.

---

## Estructura completa

```
frontend/public/
│
├── logo.png                  → logo principal de ForgeVenture
├── qr-donacion.png           → QR code para donaciones
├── vite.svg                  → ícono por defecto de Vite (no usado en producción)
│
├── avatar/                   → estados de animación del avatar flotante del usuario
├── bosses/                   → sprites de los jefes de boss battle
├── caballero/                → personaje NPC secundario (consejero del gremio)
├── equipo/                   → imágenes de piezas de equipamiento del héroe
├── exercises/                → assets del módulo de ejercicios
├── home_guerrero/            → animación idle del héroe Guerrero en el Home
├── home_arquero/             → animación idle del héroe Arquero en el Home
├── home_mago/                → animación idle del héroe Mago en el Home
├── items/                    → objetos del inventario y tienda
├── logros/                   → sistema de logros y medallas
├── lottie/                   → animaciones JSON de Lottie
├── marcos/                   → marcos decorativos para el avatar de perfil
├── missions/                 → assets del sistema de misiones
├── muñeco/                   → figura de referencia para detección de poses
├── perfil/                   → fotos/avatares de perfil seleccionables
├── personaje/                → sprites del personaje en la Ficha del Héroe
├── routines/                 → assets del sistema de rutinas
├── sounds/                   → efectos de sonido y música
├── sprites/                  → sprites misceláneos de juego
├── ui/                       → sistema de interfaz gráfica completo
└── videos/                   → videos de fondo
```

---

## Desglose por carpeta

---

### `avatar/`

Contiene los **fotogramas de animación del widget de avatar** que aparece como asistente flotante en el dashboard del usuario. Cada subcarpeta representa un estado emocional/acción, y dentro hay PNGs numerados que forman el spritesheet secuencial.

```
avatar/
├── idle/        → 9 frames  — postura en reposo, animación de respiración
├── walk/        → 6 frames  — desplazamiento lateral
├── talking/     → 6 frames  — boca en movimiento, comentarios activos
├── thinking/    → 4 frames  — pose de reflexión (dedo en la barbilla)
├── happy/       → 4 frames  — reacción positiva (logro completado, nivel subido)
├── dance/       → 8 frames  — celebración especial (racha larga, boss derrotado)
├── wave/        → 4 frames  — saludo al entrar a la sesión
├── bored/       → 6 frames  — sin actividad por mucho tiempo
├── surprised/   → 3 frames  — reacción a evento inesperado
├── victory/     → 2 frames  — victoria en boss battle
└── hurt/        → (vacío)   — reservado para daño recibido
```

**Lógica de animación:** El sistema en `src/avatar/SpriteMap.js` y `src/avatar/AvatarSprite.jsx` selecciona el estado activo según el contexto del usuario (si está en racha, si acaba de subir de nivel, si lleva tiempo inactivo) y cicla los frames con un intervalo configurable (FPS por estado).

---

### `bosses/`

Assets del módulo **Boss Battle Arena**. Cada tipo de ejercicio tiene su propio jefe con tres fases de animación.

```
bosses/
├── crests/
│   ├── boss-core.png          → crest del jefe central (todos los tipos)
│   ├── boss-general.png       → crest genérico
│   ├── boss-movilidad.png     → crest de jefes de movilidad
│   └── boss-resistencia.png   → crest de jefes de resistencia
│
├── abdominales/
│   ├── idle/    → jefe en posición de espera (antes de comenzar la batalla)
│   ├── attack/  → jefe atacando (el usuario falla una repetición)
│   └── death/   → jefe siendo derrotado (reps completadas)
│
├── flexiones/
│   ├── idle/
│   ├── attack/
│   └── death/
│
└── sentadillas/
    ├── idle/
    ├── attack/
    └── death/
```

**Lógica:** `UserBossBattleArena.jsx` usa la cámara y MediaPipe Pose para detectar repeticiones en tiempo real. Según el ejercicio activo, carga el jefe correspondiente. Cada repetición completada reduce la vida del jefe; cada fallo activa la animación de ataque.

---

### `caballero/`

Personaje NPC secundario que aparece como **consejero o guía** dentro de la app. Tiene 5 estados de animación, similar al avatar del usuario pero con diseño de caballero.

```
caballero/
├── idle/     → 8 frames — en espera
├── talking/  → 6 frames — narración de tips o bienvenida
├── thinking/ → 4 frames — procesando información
├── happy/    → 4 frames — reacción positiva
└── walk/     → 6 frames — desplazamiento
```

---

### `equipo/`

Imágenes de las **6 piezas de equipamiento** que el héroe puede vestir. Se muestran en la Tienda y en la Ficha del Héroe como parte del loadout visual.

```
equipo/
├── casco.png       → slot de cabeza
├── hombreros.png   → slot de hombros
├── pechera.png     → slot de pecho (armadura principal)
├── guantes.png     → slot de manos
├── pantalones.png  → slot de piernas
└── botas.png       → slot de pies
```

---

### `exercises/`

Assets del módulo de ejercicios, organizados por el contexto en que aparecen en la UI.

```
exercises/
├── chips/
│   ├── chip-camera.png    → badge "Con cámara" (detección de poses activa)
│   ├── chip-manual.png    → badge "Manual" (el usuario cuenta sus reps)
│   └── chip-timer.png     → badge "Por tiempo" (cronómetro)
│
├── daily/
│   ├── daily-reward-claimed.png    → recompensa diaria ya reclamada
│   ├── daily-reward-xp.png         → ícono de XP ganada
│   ├── daily-state-cleared.png     → zona completada hoy
│   ├── daily-state-training.png    → en progreso
│   ├── daily-state-untrained.png   → sin completar
│   └── daily-zone-[zona].png       → ícono de cada zona (cardio, fuerza, etc.)
│
├── detail/
│   ├── anatomy-[zona].png          → diagrama corporal de músculos trabajados por zona
│   ├── equipment-bar.png           → requiere barra
│   ├── equipment-bodyweight.png    → solo peso corporal
│   └── equipment-camera.png        → requiere cámara
│
├── hero/
│   ├── training-scene-[clase].png      → ilustración del héroe entrenando por clase
│   ├── hero-floor-glow-[clase].png     → resplandor de suelo del héroe por clase
│   └── hero-training-mark.png          → marca de entrenamiento activo
│
├── states/
│   ├── state-blocked-detail.png   → ejercicio bloqueado (nivel insuficiente)
│   ├── state-blocked-quest.png    → requiere misión activa
│   ├── state-empty-library.png    → biblioteca vacía
│   ├── state-empty-route.png      → ruta sin ejercicios
│   └── state-empty-zone.png       → zona sin contenido
│
├── summary/
│   ├── sum-xp.png         → XP ganada en el resumen post-entrenamiento
│   ├── sum-minutes.png    → minutos de entrenamiento
│   ├── sum-repeat.png     → repeticiones totales
│   ├── sum-zones.png      → zonas trabajadas
│   ├── sum-chart.png      → gráfica de rendimiento
│   └── sum-logbook.png    → bitácora de entrenamiento
│
└── zones/
    └── zone-[zona]-banner.png   → banner de cabecera de cada zona de entrenamiento
                                    (cardio, fuerza, calistenia, hiit, funcional, flexibilidad, general)
```

---

### `home_guerrero/` / `home_arquero/` / `home_mago/`

Animaciones de **8 frames** del héroe en postura idle para el panel principal del dashboard. Cada clase tiene su propio set con diseño visual diferente.

```
home_guerrero/
├── home_idle_guerrero_01.png
├── home_idle_guerrero_02.png
...
└── home_idle_guerrero_08.png    → los 8 frames se ciclan en bucle
```

**Lógica:** `UserHome.jsx` detecta la clase del héroe (`profile.heroClass`) y carga la carpeta correspondiente. Los frames se ciclan con `setInterval` a ~8 FPS para dar vida al personaje en el dashboard.

---

### `items/`

Objetos del sistema de **inventario y tienda**, divididos en tres categorías.

```
items/
├── consumables/
│   ├── pocion_vida.png       → restaura vida / energía
│   ├── pocion_mana.png       → restaura maná / concentración
│   ├── pocion_fuerza.png     → buff temporal de fuerza
│   ├── pocion_poder.png      → buff de poder general
│   ├── pocion_xp.png         → multiplicador de XP
│   └── pocion_pergamino.png  → pergamino de misión
│
├── equipment/
│   ├── anillo_fuerza.png         → anillo de fuerza
│   ├── anillo_velocidad.png      → anillo de velocidad
│   ├── anillo_inteligencia.png   → anillo de inteligencia
│   ├── collar_vitalidad.png      → collar de vitalidad
│   ├── collar_proteccion.png     → collar de protección
│   └── collar_mistico.png        → collar místico
│
└── rewards/
    ├── trofeo dragon.png       → trofeo de dragon (recompensa rara)
    ├── Llave legendaria.png    → llave de cofre legendario
    ├── orbe_magico.png         → orbe mágico
    ├── gremorio.png            → grimorio del gremio
    ├── gremorio2.png           → variante del grimorio
    └── totem.png               → tótem de poder
```

---

### `logros/`

Assets del sistema de **logros y medallas**.

```
logros/
├── medals/
│   ├── medal-first-blood.png    → primer logro completado
│   ├── medal-streak-master.png  → racha de días consecutivos
│   ├── medal-mind-keeper.png    → logros del módulo mental
│   └── medal-social-mark.png    → logros sociales (chat, gremio)
│
├── rows/
│   ├── row-common.png     → fondo de fila de logro común (gris)
│   ├── row-rare.png       → fondo de logro raro (azul)
│   ├── row-epic.png       → fondo de logro épico (morado)
│   └── row-legendary.png  → fondo de logro legendario (dorado)
│
└── states/
    ├── state-active.png      → logro en progreso
    ├── state-claimable.png   → logro listo para reclamar
    ├── state-claimed.png     → logro ya reclamado
    └── state-secret.png      → logro oculto (no revelado aún)
```

---

### `lottie/`

Animaciones vectoriales en formato **JSON de Lottie** (reproducidas con la librería `lottie-react`). Son animaciones fluidas sin pérdida de calidad a cualquier tamaño.

```
lottie/
├── campfire.json   → fogata animada (pantallas de carga, ambientación)
└── fire.json       → llama de fuego (efectos de energía, boss battle)
```

---

### `marcos/`

**6 marcos decorativos** que el usuario puede aplicar sobre su foto de perfil. Se superponen como overlay CSS sobre el avatar del perfil.

```
marcos/
├── marco_01.png   → marco básico
├── marco_02.png   → marco de aventurero
├── marco_03.png   → marco épico
├── marco_04.png   → marco legendario
├── marco_05.png   → marco de campeón
└── marco_06.png   → marco de maestro
```

---

### `missions/`

Assets del sistema de **misiones** (diarias, semanales, desafíos, eventos).

```
missions/
├── journal/
│   ├── journal-bg.png          → fondo del diario de misiones
│   ├── journal-seal-claimed.png → sello de misión completada
│   ├── journal-seal-empty.png   → sello vacío (sin completar)
│   └── journal-seal-today.png   → sello de misión del día
│
├── rewards/
│   ├── reward-xp-scroll.png       → pergamino de XP como recompensa
│   ├── reward-gem-cache.png       → cofre de gemas
│   ├── reward-contract-chest.png  → cofre de contrato
│   └── reward-claimed-seal.png    → sello de recompensa reclamada
│
├── rows/
│   ├── row-frame-common.png     → fondo de fila de misión común
│   ├── row-frame-rare.png       → fondo raro
│   ├── row-frame-epic.png       → fondo épico
│   └── row-frame-legendary.png  → fondo legendario
│
├── seals/
│   ├── seal-daily.png      → sello de misión diaria
│   ├── seal-weekly.png     → sello de misión semanal
│   ├── seal-challenge.png  → sello de desafío
│   ├── seal-event.png      → sello de evento especial
│   └── seal-mind.png       → sello de misión mental
│
├── sheet/
│   ├── sheet-contract-header.png  → cabecera del contrato de misión
│   └── sheet-route-header.png     → cabecera de la hoja de ruta
│
├── spotlight/
│   └── spotlight-[tipo]-banner.png  → banner destacado por tipo de misión
│
├── stage/
│   ├── missions-stage-overlay.png  → overlay del mapa de misiones
│   └── missions-stage-table.png    → tabla/mapa de etapas
│
├── states/
│   ├── state-empty-missions.png      → sin misiones disponibles
│   ├── state-filter-empty.png        → filtro sin resultados
│   ├── state-syncing-board.png       → sincronizando con el servidor
│   └── state-connection-lost.png     → sin conexión
│
└── missions-hero-[clase].png   → ilustración del héroe por clase en el hero de misiones
    (archer, default, mage, warrior)
```

---

### `muñeco/`

Figura humana simplificada con **8 frames de animación idle**. Se usa como referencia visual cuando el sistema de detección de poses (MediaPipe) está activo, mostrando la silueta detectada antes de que el ejercicio comience.

```
muñeco/
├── idle_01.png
...
└── idle_08.png
```

---

### `perfil/`

**10 imágenes de avatar de perfil** seleccionables por el usuario si no sube una foto propia.

```
perfil/
├── avatar_01.png → avatar_06.png   → ilustraciones estilo RPG
└── avatar_07.jpg → avatar_10.jpg   → fotografías o renders
```

---

### `personaje/`

Sprites del héroe en la **Ficha del Personaje** (`UserPersonaje.jsx`). Cada clase tiene su propia carpeta con sprites de las distintas etapas de progresión.

```
personaje/
├── base_guerrero/
│   ├── stage1_idle_1.png    → frame 1 del idle en etapa 1
│   ├── stage1_idle_2.png    → frame 2 del idle en etapa 1
│   ├── stage1_tired_1.png   → frame 1 del estado cansado en etapa 1
│   └── stage1_tired_2.png   → frame 2 del estado cansado
│
├── base_arquero/            → misma estructura que guerrero
└── base_mago/               → misma estructura que guerrero
```

**Lógica:** A medida que el usuario sube de nivel y avanza en etapas (`stage1`, `stage2`...), el personaje cambia de aspecto. El componente `UserPersonaje.jsx` lee el nivel actual y carga los sprites de la etapa correspondiente.

---

### `routines/`

Assets del módulo de **rutinas de entrenamiento**.

```
routines/
├── map/
│   └── territory-[zona]-crest.png   → crest de cada territorio del mapa de rutinas
│       (cardio, fuerza, funcional, flexibilidad, general)
│
├── modals/
│   ├── anatomy-[zona].png        → diagrama anatómico por zona muscular
│   ├── difficulty-[nivel].png    → ícono de dificultad (principiante, intermedio, avanzado, elite)
│   └── equipment-[tipo].png      → ícono de equipamiento requerido
│
├── daily-reward-chest.png        → cofre de recompensa diaria de rutina
├── daily-reward-class-bonus.png  → bono de clase por rutina completada
└── daily-reward-token.png        → token de rutina diaria
```

---

### `sounds/`

Efectos de sonido de la aplicación, gestionados por `src/services/soundManager.js`.

```
sounds/
├── bg-ambient.wav   → música de fondo ambiental (loop continuo en el dashboard)
├── click.wav        → sonido de clic en botones y elementos interactivos
└── levelup.wav      → fanfarria de subida de nivel
```

---

### `sprites/`

Sprites misceláneos de elementos de juego.

```
sprites/
├── chest_closed.png    → cofre cerrado (recompensa pendiente de abrir)
├── chest_open.png      → cofre abierto (recompensa reclamada)
├── quest_pin_active.png → pin de misión activa en el mapa
└── sword_cursor.png    → cursor personalizado con forma de espada (hover en botones RPG)
```

---

### `ui/`

El **sistema de interfaz gráfica completo** de ForgeVenture. Todos los elementos visuales de la UI están aquí organizados por componente o sección.

```
ui/
├── bars/
│   ├── bar-frame-left.png    → extremo izquierdo de barra de progreso (XP, vida)
│   ├── bar-frame-right.png   → extremo derecho
│   ├── bar-track-tile.png    → tile del carril (fondo de la barra)
│   ├── bar-fill-tile.png     → tile del relleno (porcentaje completado)
│   └── bar-shine-tile.png    → brillo sobre el relleno (efecto de luz)
│
├── buttons/
│   ├── btn-primary-left/right/tile.png  → botón primario (3 piezas para estirarse)
│   └── btn-sm-left/right/tile.png       → botón pequeño (3 piezas)
│
├── chat/
│   ├── chat-empty-panel.png      → estado vacío del panel de chat
│   ├── chat-hero-overlay.png     → overlay del héroe en el header del chat
│   ├── chat-online-badge.png     → badge de usuario en línea
│   ├── chat-request-seal.png     → sello de solicitud de amistad
│   └── chat-social-rank-[1-4].png → insignias de rango social
│
├── dailybonus/
│   ├── day-claimed.png          → día de bono ya reclamado
│   ├── day-locked.png           → día bloqueado (futuro)
│   ├── day-streak-broken.png    → racha rota
│   └── day-today-frame.png      → marco del día actual
│
├── dividers/
│   ├── divider-h-cap.png     → extremo del separador horizontal
│   ├── divider-h-center.png  → parte central del separador
│   └── divider-h-tile.png    → tile repetible del separador
│
├── frames/
│   ├── panel-corner-tl/tr/bl/br.png  → esquinas de paneles RPG
│   └── panel-edge-h/v.png            → bordes horizontales y verticales de paneles
│
├── header/
│   ├── section-[pagina].png          → ícono de cada sección en el header
│   │   (home, chat, logros, mensajes, mente, misiones, perfil, ejercicios, donaciones)
│   └── notifications/
│       ├── notif-message.png   → notificación de mensaje
│       ├── notif-medal.png     → notificación de medalla/logro
│       ├── notif-quest.png     → notificación de misión
│       ├── notif-shield.png    → notificación de aviso/seguridad
│       ├── notif-shop.png      → notificación de tienda
│       └── notif-empty.png     → estado vacío de notificaciones
│
├── health/
│   ├── hero/
│   │   └── health-stage-[modulo].png    → imagen del héroe para cada módulo de salud
│   │       (agua, nutrición, movimiento, respiración, biblioteca)
│   ├── modules/
│   │   └── module-[modulo].png          → ícono de cada módulo de salud
│   └── seals/
│       └── seal-[habito].png            → sello de hábito completado (agua, nutrición, sueño, movimiento)
│
├── icons/
│   ├── map-pin.png             → pin del mapa
│   ├── quest-[zona].png        → ícono de zona de quest (cardio, fuerza, etc.)
│   ├── stat-xp.png             → ícono de XP
│   └── weather-cloud/sun.png   → íconos de clima para la salud
│
├── medals/
│   ├── medal-bronze/silver/gold.png  → medallas por posición
│   └── rank-crown.png                → corona de rango máximo
│
├── rarity/
│   ├── rarity-common.png     → indicador de rareza común
│   ├── rarity-rare.png       → rareza rara
│   ├── rarity-epic.png       → rareza épica
│   └── rarity-legendary.png  → rareza legendaria
│
├── shop/
│   ├── hero/     → imágenes del héroe por clase para la tienda + overlay de tabla
│   ├── history/  → íconos de historial de compras por tipo
│   ├── icons/    → íconos de la tienda (monedas, contratos, cofres, servicios)
│   ├── inventory/→ tabs del inventario (pociones, gear, especiales)
│   └── states/   → estados vacíos de la tienda (sin resultados, sincronizando)
│
├── tabs/
│   ├── tab-active-left/right/tile.png    → tab activo (3 piezas)
│   └── tab-inactive-tile.png             → tab inactivo
│
├── crest-guerrero/arquero/mago/default.png  → crests de clase para avatar y UI
├── dashboard-bg.png        → textura de fondo del dashboard
├── dashboard-frame.png     → marco decorativo del dashboard
├── dashboard-particles.png → partículas decorativas de fondo
├── icon-energy.png         → ícono de energía del héroe
├── icon-gem.png            → ícono de gema (moneda premium)
├── icon-gold.png           → ícono de moneda estándar
├── logo.png                → logo alternativo de ForgeVenture
└── panel-texture.png       → textura de paneles glassmorphic
```

---

### `videos/`

Videos de fondo para secciones de alto impacto visual. Se reproducen en bucle sin sonido (`muted`, `loop`, `autoplay`).

```
videos/
├── hero-bg.mp4    → video de fondo del hero principal (dashboard / home)
├── arena-bg.mp4  → video de fondo del Boss Battle Arena
└── quest-map.mp4 → video de fondo del mapa de misiones
```

---

## Resumen de assets por categoría

| Categoría | Carpeta | Tipo de archivo | Uso en la app |
|---|---|---|---|
| Animaciones de avatar | `avatar/` | PNG (frames) | Widget de asistente flotante |
| Animaciones de jefes | `bosses/` | PNG (frames) | Boss Battle Arena |
| Personaje del dashboard | `home_*/` | PNG (frames) | Panel principal por clase |
| Personaje de ficha | `personaje/` | PNG (frames) | Pantalla de Ficha del Héroe |
| NPC consejero | `caballero/` | PNG (frames) | Personaje guía |
| Referencia de poses | `muñeco/` | PNG (frames) | Detección con MediaPipe |
| Equipamiento | `equipo/` | PNG | Tienda y ficha del héroe |
| Objetos / items | `items/` | PNG | Inventario y tienda |
| Misiones | `missions/` | PNG | Módulo de misiones |
| Logros | `logros/` | PNG | Sistema de logros |
| Ejercicios | `exercises/` | PNG | Módulo de ejercicios |
| Rutinas | `routines/` | PNG | Módulo de rutinas |
| Perfil | `perfil/`, `marcos/` | PNG / JPG | Avatares de perfil y marcos |
| Animaciones Lottie | `lottie/` | JSON | Efectos de fuego y fogata |
| Sonidos | `sounds/` | WAV | Efectos y música de fondo |
| Videos | `videos/` | MP4 | Fondos cinematográficos |
| Sprites de juego | `sprites/` | PNG | Cofres, pins, cursor |
| Sistema de UI | `ui/` | PNG | Toda la interfaz RPG |
