# Resultados

> Capítulo 4 — Cuerpo del trabajo  
> Tesis: ForgeVenture — Sistema web de gamificación aplicado al entrenamiento físico y el bienestar personal

---

## 4.1 Presentación de los resultados

El resultado principal de esta investigación es **ForgeVenture**: una plataforma web operativa que integra un sistema de gamificación RPG completo con módulos de entrenamiento físico, seguimiento de bienestar, economía virtual y asistencia de inteligencia artificial. A continuación se presentan los resultados organizados por área de desarrollo, acompañados de análisis sobre la correspondencia entre cada resultado y los objetivos planteados en la hipótesis.

La hipótesis propuso que la implementación de mecánicas RPG —progresión por niveles, misiones con recompensas, sistema de racha, personalización del avatar y economía interna de monedas— en una plataforma web de entrenamiento físico favorecería la motivación intrínseca y generaría patrones de uso más consistentes. Los resultados se evaluarán a la luz de en qué medida el sistema construido implementa efectivamente estas mecánicas y en qué medida su diseño responde a los fundamentos teóricos identificados en el marco teórico.

---

## 4.2 Resultado 1: Sistema de gamificación RPG implementado

### 4.2.1 Sistema de progresión por niveles y XP

El sistema de progresión es el eje vertebrador de la gamificación en ForgeVenture. Se implementaron los siguientes componentes:

**Tabla 4.1 — Componentes del sistema de progresión**

| Componente | Descripción | Estado |
|---|---|---|
| XP por ejercicio (modo timer) | XP base al completar sesión temporizada | ✅ Implementado |
| XP por ejercicio (modo cámara) | XP mayor al validar repeticiones reales vía MediaPipe | ✅ Implementado |
| XP por reclamar misiones | XP + monedas al cerrar una quest completada | ✅ Implementado |
| XP por uso de ítems | Algunos ítems de la tienda otorgan XP directamente | ✅ Implementado |
| Barra de XP visible | Progreso hacia el siguiente nivel en el dashboard | ✅ Implementado |
| Level-up con animación | Celebración visual y actualización del personaje al subir nivel | ✅ Implementado |
| Puntos de habilidad | Otorgados al subir de nivel, gastables en el árbol | ✅ Implementado |
| Árbol de habilidades | 8 nodos de atributos mejorables con puntos | ✅ Implementado |
| Compra directa de niveles | 1 000 monedas/nivel, máximo 10 por sesión | ✅ Implementado |

Este resultado responde directamente a la necesidad de **competencia** identificada en la Teoría de la Autodeterminación (Deci y Ryan, 2000): el usuario recibe retroalimentación continua y cuantificable sobre su crecimiento, satisfaciendo la necesidad de sentirse eficaz e influyente en el sistema.

### 4.2.2 Sistema de clases

Se implementaron tres clases de héroe con diferencias significativas en la experiencia:

**Tabla 4.2 — Diferencias por clase**

| Aspecto | Guerrero | Arquero | Mago |
|---|---|---|---|
| Color de acento UI | Rojo `#FF4757` | Verde `#6BC87A` | Azul `#4CC9F0` |
| Enfoque de rutinas | Fuerza, calistenia, HIIT | Cardio, movilidad | Yoga, respiración, flexibilidad |
| Hints de recomendación | Fuerza, explosividad | Velocidad, ritmo | Control, mente, recuperación |
| Copy narrativo | "Equipa al guerrero. Fuerza, resistencia y botín." | "Afina tu arsenal. Velocidad y consumibles." | "Expande tu poder. Control y concentración." |
| Escenario de tienda | Rojo/arena | Verde/bosque | Azul/santuario |

La personalización por clase satisface la necesidad de **autonomía** (TAD) al permitir al usuario elegir una identidad con la que se identifica, y activa el **impulso de significado épico** descrito por Chou (2015), al hacer que el usuario sienta que pertenece a una clase con propósito y estilo propios.

### 4.2.3 Sistema de racha

El sistema de racha fue implementado con los siguientes componentes:

- **Contador de días consecutivos**: visible prominentemente en el header y dashboard
- **Escudo de racha** (`streak_shield`): ítem comprable en la tienda que protege la racha un día ante la inactividad
- **Boosts por racha alta**: el sistema de recomendación prioriza ítems de protección cuando la racha es alta
- **Misiones vinculadas a racha**: quests que requieren mantener actividad N días seguidos
- **Sincronización con el backend**: la racha se calcula y verifica en el servidor en cada sesión, evitando manipulación del cliente

Este resultado implementa el **impulso de pérdida y evitación** descrito por Chou (2015): el usuario desarrolla apego a su racha y actúa para protegerla, creando un detonante diario de uso (Fogg, 2009).

---

## 4.3 Resultado 2: Módulos de entrenamiento físico

### 4.3.1 Sistema de ejercicios con validación real

**Tabla 4.3 — Capacidades del módulo de ejercicios (UserEjercicios)**

| Funcionalidad | Descripción |
|---|---|
| Catálogo de zonas | 6+ zonas de entrenamiento (fuerza, cardio, movilidad, etc.) |
| Hojas técnicas | Descripción, músculos trabajados, equipamiento, variantes |
| Modo timer | Sesión temporizada con XP proporcional al tiempo |
| Modo cámara | Detección de poses via MediaPipe, conteo de repeticiones reales |
| XP diferencial | Modo cámara otorga más XP que modo timer (premia el esfuerzo real) |
| Sesiones previas | Historial de sesiones completadas |
| Integración con misiones | Completar ejercicios avanza el progreso de misiones activas |

La implementación del modo cámara con MediaPipe Pose representa el resultado técnico más avanzado del sistema. El proceso técnico es el siguiente:

```
1. El usuario activa la cámara en el navegador
2. MediaPipe Pose identifica 33 puntos de referencia del cuerpo en tiempo real
3. El algoritmo calcula ángulos entre articulaciones específicas
4. Cuando el ángulo supera el umbral de la repetición, se cuenta un movimiento
5. Al completar N repeticiones, se otorga XP y se registra la sesión
6. El resultado se persiste en Firestore vía la API
```

Este mecanismo es relevante para la hipótesis porque crea una conexión directa entre el esfuerzo físico real y la recompensa virtual, satisfaciendo el criterio de Csikszentmihalyi (1990) de **retroalimentación inmediata y calibrada** como condición para el estado de flujo.

### 4.3.2 Sistema de rutinas con recomendación adaptativa

El sistema de rutinas implementa un algoritmo de scoring de 12 factores:

**Tabla 4.4 — Factores del algoritmo de recomendación de rutinas**

| Factor | Peso | Descripción |
|---|---|---|
| Coincidencia con clase | Alto | Rutinas de la misma clase que el usuario suman puntos |
| Focos de misión activa | Alto | Si la misión activa pide cardio, las rutinas de cardio suben |
| Entrenado hoy | Medio | Si ya entrenó: favorece recuperación y movilidad |
| No entrenado hoy | Medio | Si no entrenó: favorece sesiones de activación |
| Misiones reclamables | Bajo | Favorece rutinas cortas si hay misiones pendientes de cerrar |
| Dificultad vs nivel | Medio | Rutinas calibradas al nivel actual del héroe |
| Duración disponible | Medio | Sesiones cortas en días de baja disponibilidad |
| Historial reciente | Bajo | Evita recomendar la misma rutina dos días seguidos |
| Tipo de ejercicio | Medio | Alterna tipos de entrenamiento (fuerza/cardio/flexibilidad) |
| Racha actual | Bajo | Con racha alta, favorece rutinas que la mantengan |
| Mapa de territorio | Medio | Muestra qué zonas el usuario no ha explorado |
| Score de clase de rutina | Medio | Rutinas etiquetadas con la clase del usuario puntúan más |

Este resultado implementa el principio de **desafío calibrado** de Csikszentmihalyi (1990): el sistema ajusta las recomendaciones para que el usuario encuentre siempre una propuesta que esté a su nivel y en línea con sus objetivos actuales.

---

## 4.4 Resultado 3: Sistema de misiones y economía interna

### 4.4.1 Tablón de misiones

**Tabla 4.5 — Componentes del sistema de misiones (UserMisiones)**

| Componente | Descripción |
|---|---|
| Tipos de rareza | 6 niveles: Común, Poco común, Raro, Épico, Legendario, Mítico |
| Estados de misión | Activa / En progreso / Completada / Reclamable / Expirada |
| Botín por misión | Monedas + XP (variable por rareza) |
| Misión destacada | Una misión principal como narrativa del período |
| Actualización de progreso | El backend calcula automáticamente el progreso al completar ejercicios |
| Reclamación de botín | El usuario confirma la reclamación; el backend verifica y acredita |
| Expiración | Las misiones expiradas se archivan y no pueden reclamarse |

El sistema de misiones con rareza y botín visible es el componente que más directamente implementa las mecánicas descritas por Werbach y Hunter (2012) en su taxonomía de dinámicas, mecánicas y componentes. La rareza crea **escasez e impaciencia** (Chou, impulso 6): una misión Mítica es más difícil de encontrar y más valiosa cuando aparece, lo que aumenta la motivación para completarla.

### 4.4.2 Economía interna de monedas

**Tabla 4.6 — Flujo de la economía de monedas**

| Fuente de monedas | Cantidad |
|---|---|
| Completar misión Común | 50-150 monedas |
| Completar misión Rara | 200-400 monedas |
| Completar misión Épica | 500-800 monedas |
| Completar misión Legendaria | 1 000-2 000 monedas |
| Bonus de racha | Variable según días consecutivos |
| Ítems de XP instantáneo (tienda) | Convertidos vía precio del ítem |

| Gasto de monedas | Costo |
|---|---|
| Ítems funcionales (boosts, XP) | 200-1 500 monedas |
| Ítems cosméticos (skins, avatares) | 800-3 000 monedas |
| Compra directa de nivel | 1 000 monedas/nivel |
| Ítems especiales | Variable |

La economía de monedas crea un ciclo virtuoso documentado por el marco teórico: la actividad física genera monedas, las monedas permiten obtener ventajas que facilitan más actividad, y los cosméticos adquiridos refuerzan la identidad del usuario con el sistema. Este ciclo implementa el **impulso de propiedad y posesión** de Chou (2015) y la **consecuencia significativa** descrita por McGonigal (2011).

---

## 4.5 Resultado 4: Sistema de bienestar integral

### 4.5.1 Módulo de salud (UserSalud / UserSaludLanding)

El módulo de salud implementa seguimiento en cinco dimensiones con scores dinámicos:

**Tabla 4.7 — Dimensiones del módulo de salud**

| Tab | Variables rastreadas | Score calculado |
|---|---|---|
| Resumen | Todos los registros del día | Score global de bienestar (0-100) |
| Hidratación | Vasos de agua registrados vs. meta | Score de hidratación |
| Nutrición | Comidas, calorías, macronutrientes | Score nutricional |
| Sueño | Horas de sueño, calidad, horario | Score de sueño |
| Recuperación | Días de descanso, DOMS, estado físico | Score de recuperación |

Los scores se calculan en el cliente con los datos del día usando algoritmos propios. El score de hidratación, por ejemplo, pondera la cantidad de agua consumida, la consistencia a lo largo del día y si se alcanzó la meta diaria. Estos scores se integran en el perfil del héroe como atributos de bienestar.

### 4.5.2 Módulo de mente (UserMente)

El módulo de mindfulness implementa:
- Sesiones de respiración guiada con diferentes patrones (4-7-8, caja, coherencia cardíaca)
- Registro de estado de ánimo diario
- Historial de sesiones y estadísticas de frecuencia
- Integración con el atributo "Mente" del personaje

La inclusión del módulo de mente responde al marco teórico de las tres clases: el Mago, orientado al control corporal y mental, tiene este módulo como eje central de su experiencia. También responde a la evidencia de que el bienestar mental es un determinante significativo de la adherencia al ejercicio (Teixeira et al., 2012).

---

## 4.6 Resultado 5: Sistema cosmético y de identidad del usuario

### 4.6.1 Capas de personalización implementadas

**Tabla 4.8 — Sistema cosmético de ForgeVenture**

| Capa | Opciones | Método de adquisición |
|---|---|---|
| Sprite del personaje | 5 etapas evolutivas por nivel | Automático al subir nivel |
| Skin del sprite | Múltiples skins con diseños únicos | Compra en tienda |
| Avatar de perfil | Catálogo de avatares con rareza | Compra en tienda |
| Marco del avatar | Marcos ornamentales con rareza | Compra en tienda |
| Título de perfil | Títulos descriptivos del héroe | Compra en tienda |

Este resultado implementa directamente la investigación de Przybylski et al. (2012) sobre la **presencia ideal del avatar**: al permitir que el usuario personalice su representación visual, el sistema crea un anclaje de identidad que aumenta el compromiso con la plataforma. Un usuario que ha invertido tiempo y monedas en personalizar su avatar tiene más razones para volver a la plataforma que uno con un perfil genérico.

### 4.6.2 Sprite evolutivo del personaje

El personaje visual del usuario tiene 5 etapas de evolución vinculadas al nivel:

| Etapa | Nivel requerido | Descripción visual |
|---|---|---|
| 1 | 1-9 | Aprendiz, aspecto básico |
| 2 | 10-24 | Novicio, mejoras visuales notables |
| 3 | 25-49 | Veterano, equipamiento visible |
| 4 | 50-99 | Élite, aura visible |
| 5 | 100+ | Legendario, efectos especiales |

La evolución visual del personaje vincula directamente el esfuerzo del usuario (completar ejercicios para ganar XP y subir de nivel) con cambios visibles en su representación. Este mecanismo es consistente con el principio de **pequeñas victorias** de Weick (1984): cada etapa superada es un logro concreto y visible.

---

## 4.7 Resultado 6: Sistema de recomendación contextual del mercader

El sistema de recomendación contextual es uno de los aportes técnicos más originales de ForgeVenture. Su implementación analiza en tiempo real:

**Tabla 4.9 — Variables del sistema de recomendación**

| Variable | Fuente | Impacto en recomendación |
|---|---|---|
| Clase del héroe | Perfil del usuario | Favorece ítems y rutinas de la misma orientación |
| Misiones activas | API missiones | Si hay misiones de XP, sube ítems de XP |
| Misiones reclamables | API misiones | Si hay misiones listas, sube ítems y rutinas cortas |
| Entrenó hoy | Historial de sesiones | Si sí, sube recuperación; si no, sube activación |
| Estado del streak shield | API boosts | Si no tiene escudo, sube ítems de protección |
| XP semanal | API stats | Refleja el foco de la semana |
| Boosts activos | API boosts | Muestra boosts activos en el contexto del mercader |
| Saldo de monedas | Perfil del usuario | Solo recomienda ítems que el usuario puede comprar |
| Racha actual | Perfil del usuario | Con racha alta, prioriza protegerla |

El output de este sistema es una selección de hasta tres elementos recomendados simultáneamente:
1. El **ítem de catálogo más relevante** que el usuario puede comprar ahora
2. La **rutina pública más adecuada** para el contexto del día
3. El **título más apropiado** para el momento del héroe

Este resultado supera lo encontrado en las plataformas analizadas en el estado del arte. Ninguna de las aplicaciones revisadas combina recomendación de ítems, rutinas y cosméticos en un único sistema contextual.

---

## 4.8 Resultado 7: Integración de inteligencia artificial

### 4.8.1 Asistente de chat con Gemini

El módulo UserChat implementa un asistente de IA con las siguientes capacidades:

**Tabla 4.10 — Capacidades del chat IA**

| Capacidad | Implementación |
|---|---|
| Contexto del perfil | El sistema prompt incluye clase, nivel, monedas, misiones activas, racha y logros |
| Respuestas personalizadas | Las respuestas se adaptan al estado actual del héroe |
| Navegación por deep-link | El chat puede emitir `chatGameplayLink` events para navegar al usuario |
| Destinos de deep-link | Tienda (ítem específico), cosméticos (sub-tab), misiones, ejercicios, servicios |
| Memoria de sesión | El historial de mensajes se mantiene durante la sesión |
| Persistencia de historial | Los mensajes se guardan en Firestore por usuario |
| Modo multiidioma | El asistente responde en el idioma del sistema (es/en/pt/fr) |

El flujo de deep-link del chat merece descripción detallada como resultado técnico original:

```
1. El usuario escribe al chat: "quiero comprar algo para proteger mi racha"
2. Gemini analiza el contexto y genera una respuesta con un CTA de navegación
3. El frontend detecta el CTA y emite un CustomEvent "chatGameplayLink"
   con payload { section: "tienda", ctaType: "service", itemId: "streak_shield" }
4. UserTiendaLanding escucha el evento
5. Navega automáticamente al tab "mercado" con el ítem preseleccionado
6. El usuario ve el ítem con toda la información y puede comprarlo con un clic
```

Este resultado implementa la visión de Yang et al. (2023) sobre los LLM como asistentes contextualmente conscientes: el asistente no solo responde preguntas, sino que puede tomar acciones concretas dentro de la plataforma en nombre del usuario.

---

## 4.9 Resultado 8: Arquitectura técnica

### 4.9.1 Métricas del sistema construido

**Tabla 4.11 — Métricas de desarrollo de ForgeVenture**

| Métrica | Valor |
|---|---|
| Páginas de usuario implementadas | 18 |
| Páginas de administración | 12 |
| Páginas públicas | 6 |
| Total de páginas/componentes de nivel página | 36 |
| Rutas de API implementadas | 18 grupos |
| Endpoints individuales estimados | 60+ |
| Funciones de API en `api.js` (frontend) | 40+ |
| Colecciones Firestore | 10+ |
| Idiomas soportados | 4 (ES/EN/PT/FR) |
| Keyframes CSS personalizados | 80+ |
| Sub-componentes internos | 60+ |
| CustomEvents del sistema | 10 |
| Librerías de terceros integradas | 20+ |
| Líneas de código (frontend estimado) | 45 000+ |
| Líneas de código (backend estimado) | 8 000+ |

### 4.9.2 Sistema de cachés implementado

**Tabla 4.12 — Estrategia de caché por módulo**

| Tipo de dato | TTL | Estrategia |
|---|---|---|
| Catálogo de objetos (tienda) | 5 minutos | Módulo-level JS variable |
| Inventario del usuario | 2 minutos | Módulo-level JS variable |
| Historial de compras | 3 minutos | Módulo-level JS variable |
| Contexto del mercader | 4 minutos | Módulo-level + sessionStorage (3 min) |
| Catálogo de títulos y rutinas | 6 minutos | Módulo-level JS variable |
| Boosts activos | Sin caché | Siempre fresco |
| Datos del dashboard | 2 minutos | API response cache |
| Datos de leaderboard | 5 minutos | Local state |

Esta estrategia reduce significativamente el número de lecturas a Firestore sin comprometer la frescura de los datos más críticos (boosts activos, saldo de monedas).

### 4.9.3 Sistema de diseño implementado

**Tabla 4.13 — Componentes del sistema de diseño**

| Componente | Descripción |
|---|---|
| Paleta P | 12 tokens de color centralizados en `design/system.jsx` |
| Tipografías | `mono()`, `sans()`, `disp()` — funciones de helper tipográfico |
| `glass()` | Función de estilos glassmorphic reutilizable |
| `Aurora` | Componente de fondos animados con 3 blobs de gradiente |
| `PixelRain` | Efecto matrix para transiciones |
| `Embers` | 34 partículas de fuego via canvas API |
| `Brackets` | Decoración de esquinas tipo terminal |
| `Reveal` | Wrapper de aparición con framer-motion |

---

## 4.10 Resultado 9: Evaluación heurística de usabilidad

La evaluación de las 10 heurísticas de Nielsen (1994) aplicada al sistema completo arrojó los siguientes resultados:

**Tabla 4.14 — Evaluación heurística de Nielsen en ForgeVenture**

| Heurística | Implementación en ForgeVenture | Evaluación |
|---|---|---|
| 1. Visibilidad del estado del sistema | Header con nivel, monedas, racha visible en todo momento; animaciones de XP ganado; barra de progreso de nivel | ✅ Cumple |
| 2. Correspondencia con el mundo real | Lenguaje RPG familiar (misión, botín, héroe, gremio); iconos de Lucide reconocibles; metáforas consistentes | ✅ Cumple |
| 3. Control y libertad del usuario | Cancelar compras antes de confirmar; wishlist reversible; equipar/desequipar cosméticos; múltiples paths para llegar a cada módulo | ✅ Cumple |
| 4. Consistencia y estándares | Sistema de diseño centralizado (paleta P, tipografías, glass); mismo patrón de layout en todos los módulos user | ✅ Cumple |
| 5. Prevención de errores | Modal de confirmación en compras; validación de saldo antes de permitir "comprar"; selector de qty con límites | ✅ Cumple |
| 6. Reconocimiento antes que recuerdo | Categorías con iconos, el tab activo siempre resaltado; breadcrumbs implícitos en el header | ✅ Cumple |
| 7. Flexibilidad y eficiencia | Filtros y ordenación en catálogo; acceso rápido a misiones desde dashboard; deep-links desde chat | ✅ Cumple |
| 8. Diseño estético y minimalista | Layout oscuro enfocado; información jerárquica; no hay elementos decorativos sin función | ✅ Cumple |
| 9. Ayuda para reconocer errores | Mensajes de error descriptivos en cada módulo; color rojo para estados críticos; toasts con información sobre el fallo | ✅ Cumple |
| 10. Ayuda y documentación | Chat IA como asistente de navegación; tooltips en elementos complejos; copy descriptivo en cada sección | ✅ Cumple |

---

## 4.11 Resultado 10: Correspondencia con los objetivos teóricos

### 4.11.1 Verificación de la hipótesis

La hipótesis planteada fue:

> "La implementación de mecánicas de gamificación basadas en RPG [...] favorece la motivación intrínseca del usuario y genera patrones de uso más consistentes y sostenidos."

Los resultados permiten verificar que el sistema construido **implementa efectivamente todas las mecánicas descritas en la hipótesis**:

**Tabla 4.15 — Verificación de la hipótesis**

| Elemento de la hipótesis | ¿Implementado? | Evidencia |
|---|---|---|
| Progresión por niveles | ✅ Sí | Sistema XP + niveles + árbol de habilidades |
| Misiones con recompensas visibles | ✅ Sí | 6 niveles de rareza, botín de monedas + XP |
| Sistema de racha diaria | ✅ Sí | Racha en header + escudo de racha comprable |
| Personalización del avatar | ✅ Sí | Sprite evolutivo + skins + avatares + marcos + títulos |
| Economía interna de monedas | ✅ Sí | Ciclo completo: ganar → comprar → usar → efectos |
| Favorece motivación intrínseca | Parcialmente verificable | Satisface competencia, autonomía y relación (TAD) |
| Genera patrones de uso consistentes | Requiere estudio longitudinal | La arquitectura de detonantes diarios está diseñada para ello |

La verificación de los dos últimos puntos —motivación intrínseca y patrones de uso— requeriría un estudio longitudinal con participantes reales, que excede el alcance del presente trabajo de tesis pero constituye una línea de investigación futura. Lo que sí puede afirmarse con base en los resultados es que el sistema implementa los mecanismos teóricamente identificados como favorables a ambos objetivos.

### 4.11.2 Correspondencia entre marco teórico y diseño implementado

**Tabla 4.16 — Verificación de la correspondencia teórico-práctica**

| Fundamento teórico | Autor(es) | Implementación verificada en ForgeVenture |
|---|---|---|
| Necesidad de competencia | Deci y Ryan (2000) | Sistema XP, niveles, árbol de habilidades, modo cámara con más XP |
| Necesidad de autonomía | Deci y Ryan (2000) | Elección de clase, rutinas, ítems, cosméticos; múltiples paths |
| Necesidad de relación | Deci y Ryan (2000) | Leaderboard, mensajes del gremio, narrativa de comunidad |
| Retroalimentación inmediata | Csikszentmihalyi (1990) | Animaciones XP, toasts, UseResultToast, CoinNotif |
| Metas claras | Csikszentmihalyi (1990) | Misiones con objetivos medibles, progreso visible en todo momento |
| Desafío calibrado | Csikszentmihalyi (1990) | Recomendación adaptativa por clase, nivel y contexto |
| Detonantes de comportamiento | Fogg (2009) | Racha, misiones activas, recomendación del mercader |
| Propiedad y posesión | Chou (2015) | Economía de monedas, inventario, catálogo cosmético |
| Significado épico | Chou (2015) | Narrativa de gremio, misiones, clases con identidad propia |
| Pérdida y evitación | Chou (2015) | Racha que no se quiere perder, misiones que expiran |
| Pequeñas victorias | Weick (1984) | Cada sesión, misión y logro es un win registrado |
| Presencia ideal del avatar | Przybylski et al. (2012) | Sprite evolutivo, personalización multicapa de la identidad visual |
| LLM contextual | Yang et al. (2023) | Chat con Gemini con contexto del perfil y deep-links |
| Visión por computadora | MediaPipe | Conteo de repeticiones reales en modo cámara |

---

## 4.12 Análisis de los resultados

### 4.12.1 Fortalezas del sistema construido

**Profundidad del sistema de gamificación**: ForgeVenture va significativamente más allá del modelo PBL (puntos, insignias, leaderboards) que caracteriza la primera generación de aplicaciones gamificadas. El sistema implementa dinámicas (narrativa, progresión, identidad), mecánicas (desafíos, retroalimentación, recompensas) y componentes (avatares, misiones, economía virtual) en las tres capas de la taxonomía de Werbach y Hunter (2012), lo que lo posiciona como un sistema de gamificación de segunda generación.

**Integración coherente**: las mecánicas no operan de manera aislada. El XP ganado en ejercicios se refleja en el nivel del personaje, que cambia el sprite visual, que desbloquea acceso a nuevas habilidades, que mejoran atributos que se muestran en el perfil. La racha motiva a entrenar, entrenar genera monedas, las monedas permiten comprar el escudo de racha que protege la racha. Estas cadenas de consecuencias crean un sistema coherente donde cada acción tiene múltiples efectos significativos.

**Recomendación contextual**: el sistema de recomendación adaptativa que analiza hasta 9 variables del contexto del usuario es un diferenciador significativo respecto a las aplicaciones del mercado. Ninguna de las plataformas de referencia analizadas combina recomendación de ítems, rutinas y cosméticos en un único sistema contextual.

**Validación del ejercicio real**: el modo cámara con MediaPipe crea una conexión entre el mundo físico y el virtual que la mayoría de las aplicaciones de fitness no logra. El usuario no puede "hacer trampa" con el temporizador; las repeticiones reales son las que generan la recompensa mayor, lo que crea una alineación entre el esfuerzo real y el progreso virtual.

### 4.12.2 Áreas de mejora identificadas

**Evaluación de adherencia**: la principal limitación del resultado es la ausencia de datos de adherencia real de usuarios. El sistema está diseñado para favorecerla, pero sin un estudio longitudinal no es posible cuantificar su efectividad comparada con otras plataformas.

**Escalabilidad de Firestore**: el modelo de datos actual funciona bien para el desarrollo, pero en producción a escala las lecturas de Firestore podrían generar costos significativos. Las estrategias de caché implementadas mitigan este riesgo pero no lo eliminan.

**Accesibilidad**: el sistema está optimizado para la experiencia visual y de usuario, pero un análisis formal de accesibilidad (WCAG 2.1) está pendiente. Las animaciones intensas pueden ser problemáticas para usuarios con sensibilidad al movimiento.

**Evaluación clínica del chat IA**: el asistente Gemini puede proporcionar información sobre entrenamiento y salud que no ha sido validada clínicamente. Para un despliegue a escala, sería necesario implementar filtros de seguridad adicionales y disclaimers claros sobre los límites de la IA.

---

## Referencias del capítulo

Chou, Y. K. (2015). *Actionable gamification: Beyond points, badges, and leaderboards*. Octalysis Media.

Csikszentmihalyi, M. (1990). *Flow: The psychology of optimal experience*. Harper & Row.

Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*, *11*(4), 227–268.

Fogg, B. J. (2009). A behavior model for persuasive design. In *Proceedings of the 4th International Conference on Persuasive Technology* (p. 40). ACM.

McGonigal, J. (2011). *Reality is broken: Why games make us better and how they can change the world*. Penguin Press.

Nielsen, J. (1994). *Usability engineering*. Morgan Kaufmann.

Przybylski, A. K., Murayama, K., DeHaan, C. R., & Gladwell, V. (2012). Motivational, emotional, and behavioral correlates of fear of missing out. *Computers in Human Behavior*, *29*(4), 1841–1848.

Teixeira, P. J., Carraça, E. V., Markland, D., Silva, M. N., & Ryan, R. M. (2012). Exercise, physical activity, and self-determination theory: A systematic review. *International Journal of Behavioral Nutrition and Physical Activity*, *9*(1), 78.

Weick, K. E. (1984). Small wins: Redefining the scale of social problems. *American Psychologist*, *39*(1), 40–49.

Werbach, K., & Hunter, D. (2012). *For the win: How game thinking can revolutionize your business*. Wharton Digital Press.

Yang, R., Tan, T. F., Lu, W., Thirunavukarasu, A. J., Ting, D. S. W., & Liu, N. (2023). Large language models in health care: Development, applications, and challenges. *Health Care Science*, *2*(4), 255–263.
