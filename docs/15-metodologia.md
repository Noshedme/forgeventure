# Metodología

> Capítulo 3 — Cuerpo del trabajo  
> Tesis: ForgeVenture — Sistema web de gamificación aplicado al entrenamiento físico y el bienestar personal

---

## 3.1 Tipo y enfoque de investigación

El presente trabajo se inscribe en la modalidad de **investigación aplicada de desarrollo tecnológico**, cuyo objetivo es la construcción de un artefacto de software que integre conocimiento teórico previo con soluciones técnicas originales para resolver un problema concreto: la falta de adherencia al ejercicio físico en jóvenes adultos.

El enfoque de la investigación es **mixto**: combina elementos cualitativos (análisis de la experiencia de usuario, revisión de la literatura, evaluación de decisiones de diseño) con elementos cuantitativos (métricas de uso del sistema, estadísticas de llamadas a la API, indicadores de completitud de funcionalidades). Sin embargo, el producto principal de la investigación no es un conjunto de datos estadísticos sino un sistema funcional: ForgeVenture como plataforma web operativa.

Desde la perspectiva de la epistemología del diseño, este trabajo adopta la perspectiva de la **ciencia del diseño** (*Design Science Research*, Hevner et al., 2004), que plantea que los artefactos tecnológicos de alta calidad son contribuciones válidas al conocimiento científico cuando están fundamentados en teoría relevante, responden a un problema concreto y son evaluados rigurosamente.

---

## 3.2 Población y usuarios objetivo

### 3.2.1 Sujetos del estudio

El sistema desarrollado está orientado a una población objetivo de **jóvenes adultos de entre 18 y 35 años** con las siguientes características:

- Poseen acceso regular a internet y un dispositivo con navegador web moderno
- Tienen interés en iniciar o mantener una rutina de entrenamiento físico
- Han tenido experiencia previa con videojuegos de rol o aplicaciones gamificadas (aunque no es excluyente)
- No requieren de supervisión médica especial para realizar actividad física moderada
- Se encuentran en alguna de las primeras cuatro etapas del Modelo Transteórico (precontemplación, contemplación, preparación o acción)

Esta franja etaria fue seleccionada por tres razones principales. Primera, es la población que reporta las tasas más altas de uso de aplicaciones móviles y plataformas digitales (Statista, 2023), lo que garantiza familiaridad con el soporte tecnológico. Segunda, es también la población con mayor exposición previa a videojuegos y, por tanto, con mayor probabilidad de responder positivamente a mecánicas de gamificación RPG. Tercera, es una etapa de la vida en que los hábitos de actividad física establecidos tienen mayor probabilidad de mantenerse a largo plazo (Telama et al., 2005).

### 3.2.2 Criterios de inclusión y exclusión

**Criterios de inclusión**:
- Edad entre 18 y 35 años
- Acceso a dispositivo con navegador web y conexión a internet
- Disposición de al menos 30 minutos semanales para interacción con la plataforma
- Nivel básico de comprensión del español (idioma principal del sistema)

**Criterios de exclusión**:
- Condiciones médicas que contraindiquen el ejercicio físico sin supervisión clínica
- Incapacidad de crear una cuenta de correo electrónico para el registro
- Menores de 18 años (protección de datos de menores)

### 3.2.3 Perfil del usuario tipo

El sistema define tres arquetipos de usuario basados en su preferencia de entrenamiento, materializados como las **clases del sistema RPG**:

| Clase | Perfil de usuario | Estilo de entrenamiento predominante |
|---|---|---|
| **Guerrero** | Usuario que prefiere entrenamiento de fuerza funcional, se motiva por el progreso medible y la superación personal | Fuerza, calistenia, HIIT, pesas |
| **Arquero** | Usuario orientado al cardio y a la constancia, con preferencia por sesiones rápidas y variadas | Cardio, running, HIIT, movilidad rápida |
| **Mago** | Usuario que valora el control corporal, la recuperación y la dimensión mental del entrenamiento | Yoga, pilates, respiración, flexibilidad, mindfulness |

Esta tipología, aunque simplificada, cumple una función motivacional documentada: la identidad de clase actúa como un "ancla de identidad" (Przybylski et al., 2012) que aumenta el compromiso del usuario con el sistema.

---

## 3.3 Diseño y metodología de desarrollo del sistema

### 3.3.1 Metodología de desarrollo: iteración ágil

El desarrollo de ForgeVenture siguió un proceso iterativo e incremental inspirado en los principios del desarrollo ágil (*Agile Software Development*, Beck et al., 2001), con las siguientes características:

- **Iteraciones cortas**: el sistema se construyó módulo por módulo, completando cada sección funcional antes de avanzar a la siguiente.
- **Entregables funcionales**: en cada iteración el resultado es código ejecutable y funcional, no documentación o prototipos.
- **Revisión continua**: cada módulo fue revisado en funcionamiento antes de integrarse al sistema completo.
- **Adaptabilidad**: las decisiones técnicas pudieron revisarse entre iteraciones sin comprometer el trabajo previo, gracias a la arquitectura de componentes independientes.

El proceso de desarrollo se organizó en las siguientes fases:

**Fase 1 — Arquitectura base** (semanas 1-2):
- Configuración del repositorio y estructura de carpetas
- Setup de Vite + React 19 para el frontend
- Setup de Express + Firebase Admin para el backend
- Configuración de Firebase (Auth + Firestore + Storage)
- Definición del sistema de rutas y protección por roles

**Fase 2 — Autenticación y onboarding** (semanas 3-4):
- Implementación de registro con validación de fortaleza de contraseña
- Implementación del flujo de onboarding de 8 preguntas con algoritmo de 5 factores
- Sistema de asignación de clase y perfil inicial en Firestore

**Fase 3 — Sistema de diseño y dashboard** (semanas 5-7):
- Desarrollo del sistema de diseño centralizado (`design/system.jsx`)
- Paleta P, tipografías, componentes glass y efectos visuales (Aurora, Embers)
- Implementación del Dashboard con bento grid y estadísticas en tiempo real

**Fase 4 — Módulos de entrenamiento** (semanas 8-11):
- UserEjercicios con catálogo por zonas, modo cámara (MediaPipe) y modo timer
- UserRutinas con sistema de recomendación de 12 factores
- Sistema de XP, niveles y rachas en el backend

**Fase 5 — Sistema de misiones y progresión** (semanas 12-14):
- UserMisiones con tablón de quests, rareza y sistema de reclamación de botín
- Sistema de monedas y economía interna
- UserLogros con catálogo y sistema de desbloqueo automático

**Fase 6 — Sistema de salud y mente** (semanas 15-17):
- UserSalud con 5 tabs y 4 scores dinámicos
- UserMente con módulo de mindfulness y respiración guiada
- Integración de datos de salud en el perfil del usuario

**Fase 7 — Mercado y cosméticos** (semanas 18-22):
- UserTienda y UserTiendaLanding con sistema completo de compra/uso/equip
- Sistema cosmético: skins, avatares, marcos, títulos
- Sistema de wishlist y recomendación contextual del mercader

**Fase 8 — Personaje y perfiles** (semanas 23-25):
- UserPersonaje con sprite de 5 etapas y árbol de habilidades
- UserPerfil con ficha completa del héroe y cosméticos activos
- Sistema de i18n multiidioma

**Fase 9 — Chat IA y features avanzadas** (semanas 26-28):
- Integración de Gemini en UserChat con contexto del perfil
- UserBossBattle como meta de campaña
- Sistema de deep-links del chat hacia el resto de la plataforma

**Fase 10 — Panel de administración** (semanas 29-32):
- 12 páginas de admin con gestión completa de contenido
- Dashboard de estadísticas globales
- Sistema de mensajes del gremio

### 3.3.2 Herramientas de desarrollo utilizadas

| Categoría | Herramienta | Versión | Propósito |
|---|---|---|---|
| Control de versiones | Git + GitHub | — | Versionado y colaboración |
| IDE | Visual Studio Code | — | Edición de código |
| Gestor de paquetes | npm | — | Gestión de dependencias |
| Bundler/Dev server | Vite | 7.3 | Build optimizado + HMR |
| Linter | ESLint | 9.39 | Calidad de código JavaScript |
| CSS | PostCSS + Tailwind | 3.4 | Utilidades CSS + procesamiento |
| Prueba manual | Chrome DevTools | — | Inspección + performance |
| Diseño visual | Figma / referencias | — | Prototipado visual previo |
| Colecciones Firestore | Firebase Console | — | Gestión directa de datos |
| Testing de API | Thunder Client (VS Code) | — | Prueba manual de endpoints |

---

## 3.4 Instrumentos de investigación

La investigación empleó los siguientes instrumentos para orientar las decisiones de diseño y evaluar los resultados:

### 3.4.1 Revisión sistemática de literatura

Se realizó una revisión de la literatura académica relevante cubriendo los siguientes campos:
- Gamificación y diseño de juegos (2010-2024)
- Teorías motivacionales aplicadas al ejercicio (1985-2024)
- Intervenciones digitales de salud y fitness (2009-2024)
- Diseño de experiencia de usuario en salud digital (2009-2024)
- Tecnologías web modernas y su aplicación (2013-2024)

Las bases de datos consultadas incluyen Google Scholar, IEEE Xplore, ACM Digital Library y PubMed, utilizando términos de búsqueda como: "gamification exercise adherence", "self-determination theory fitness apps", "flow theory digital health", "RPG mechanics motivation", "fitness app engagement".

### 3.4.2 Análisis comparativo de plataformas existentes

Se analizaron las siguientes plataformas de fitness digital como referentes:

| Plataforma | Elementos analizados |
|---|---|
| Nike Run Club | Sistema de logros, desafíos, rutas guiadas |
| Strava | Elementos sociales, segmentos, desafíos mensuales |
| Habitica | Mecánicas RPG aplicadas a hábitos |
| Zombies, Run! | Narrativa y motivación en el running |
| MyFitnessPal | Seguimiento de nutrición y ejercicio |
| Duolingo | Racha, liga semanal, gamificación de aprendizaje |
| Headspace | UX de mindfulness, sesiones guiadas |

El análisis evaluó para cada plataforma: presencia de elementos de gamificación, profundidad de la narrativa, sistema de progresión, personalización del usuario, elementos sociales, integración de IA y usabilidad general.

### 3.4.3 Evaluación heurística del sistema

El sistema fue evaluado internamente mediante las 10 heurísticas de usabilidad de Nielsen (1994) aplicadas módulo por módulo. Para cada heurística se documentó:
- Si el módulo la cumple
- Cómo la implementa concretamente
- Áreas de mejora identificadas

### 3.4.4 Análisis de logs y métricas de uso

Durante el desarrollo se registraron y analizaron métricas técnicas:
- Número de llamadas a la API por módulo
- Tiempos de carga de los módulos principales
- Errores de Firestore y estrategias de caché implementadas
- Completitud de funcionalidades por módulo

---

## 3.5 Procedimiento de desarrollo y decisiones de diseño

### 3.5.1 Criterios de selección del stack tecnológico

La selección de las tecnologías de ForgeVenture no fue arbitraria sino guiada por criterios específicos:

**React 19** fue elegido sobre alternativas como Vue.js o Svelte por:
- Mayor ecosistema de componentes disponibles (Radix UI, Framer Motion)
- Modelo de componentes reutilizables ideal para el sistema de diseño centralizado
- La capacidad de manejar múltiples actualizaciones de estado simultáneas (crítico para la sincronización entre módulos via CustomEvents)

**Vite 7** fue elegido sobre Create React App por:
- Tiempo de inicio del servidor de desarrollo significativamente menor
- HMR (Hot Module Replacement) más rápido
- Build de producción optimizado con Rollup

**Firebase** fue elegido sobre alternativas como Supabase o una base de datos PostgreSQL propia por:
- Integración nativa de autenticación, base de datos y storage en una sola plataforma
- Firebase Admin SDK que permite verificación de tokens JWT sin infraestructura adicional
- Firestore como base de datos flexible para el modelo de datos variable de una plataforma gamificada
- Plan gratuito (Spark) suficiente para el desarrollo y prototipado

**Framer Motion** fue elegida sobre CSS animations puras o GSAP para las transiciones de UI por:
- API declarativa que integra naturalmente con el modelo de componentes de React
- `AnimatePresence` para animaciones de entrada/salida de modales y toasts
- Soporte nativo para spring physics y stagger

**MediaPipe Pose** fue elegida para la detección de ejercicios por:
- No requiere hardware adicional (solo cámara web estándar)
- Funciona en el navegador sin instalación de software
- Documentación amplia y modelo preentrenado listo para usar

**Google Gemini** fue elegida para el chat IA por:
- Integración directa con el stack de Google (Firebase)
- Capacidades multimodales y comprensión de instrucciones complejas
- SDK de JavaScript disponible (`@google/generative-ai`)

### 3.5.2 Decisiones de arquitectura del sistema

**Arquitectura de separación frontend/backend**: aunque Firebase permite omitir un backend propio y llamar directamente a Firestore desde el cliente, se optó por implementar una API REST propia en Express por tres razones:
1. Seguridad: las reglas de negocio (validar que el usuario tenga monedas suficientes antes de hacer una compra, por ejemplo) deben ejecutarse en el servidor, no en el cliente
2. Extensibilidad: un backend propio permite integrar servicios adicionales (Nodemailer, algoritmos de scoring, semillas de datos) sin modificar la lógica del cliente
3. Claridad arquitectural: separar responsabilidades facilita el mantenimiento y la comprensión del sistema

**Sistema de cachés en módulo**: para reducir las llamadas a Firestore (que tiene costos de lectura en el plan pago) y mejorar la experiencia de usuario, se implementaron cachés a nivel de módulo JavaScript con TTLs específicos por tipo de dato. Los datos que cambian poco frecuentemente (catálogo de objetos, catálogo de rutinas) tienen TTLs de 5-6 minutos; los datos que cambian frecuentemente (boosts activos, inventario) tienen TTLs de 2 minutos o se consultan siempre frescos.

**Bus de eventos con CustomEvents**: en lugar de usar una librería de gestión de estado global (Redux, Zustand), se optó por CustomEvents del navegador para la comunicación entre componentes no relacionados en el árbol de React. Esta decisión reduce la complejidad del estado global y permite que módulos completamente independientes (la tienda, el dashboard, el header) se sincronicen sin acoplamiento directo.

**Sistema de diseño centralizado**: todos los valores de diseño (paleta de colores, tipografías, efectos) se centralizan en `frontend/src/design/system.jsx` y se importan desde allí en todos los módulos. Esto garantiza consistencia visual y permite actualizar el aspecto de toda la plataforma modificando un único archivo.

### 3.5.3 Procedimiento de implementación del sistema de gamificación

El sistema de gamificación de ForgeVenture fue implementado siguiendo la taxonomía de Werbach y Hunter (2012), comenzando por las dinámicas y descendiendo hacia las mecánicas y los componentes:

**Paso 1 — Definición de dinámicas**:
- Narrativa: el usuario es un "héroe del gremio" en un mundo de aventuras
- Progresión: el héroe sube de nivel, mejora atributos y desbloquea contenido
- Restricciones: la economía de monedas limita las compras y crea decisiones significativas
- Relaciones: el leaderboard y los mensajes del gremio crean un contexto social

**Paso 2 — Implementación de mecánicas**:
- Desafíos: misiones con rareza y dificultad creciente
- Retroalimentación: animaciones de XP, monedas, logros y level-up en tiempo real
- Adquisición de recursos: monedas ganadas por completar misiones y ejercicios
- Recompensas: botín de misiones, ítems de la tienda, cosméticos
- Estados ganadores: completar la misión destacada, mantener la racha más larga del leaderboard

**Paso 3 — Desarrollo de componentes**:
- Logros: catálogo con condiciones de desbloqueo y rareza
- Avatares y cosméticos: skins, marcos, títulos para personalización del personaje
- Insignias implícitas: el sprite del personaje cambia visualmente con el nivel
- Niveles y XP: sistema de progresión numérica visible en todo momento
- Misiones/quests: tablón de contratos del gremio con botín visible
- Bienes virtuales: catálogo de la tienda con 6 categorías y economía de monedas

### 3.5.4 Procedimiento de implementación del algoritmo de recomendación

El sistema de recomendación contextual del mercader es uno de los componentes más sofisticados del sistema. Se implementó en dos variantes complementarias:

**Variante 1 — Scoring de ítems** (función `scoreMarketItemForContext`):
Aplica una puntuación numérica a cada ítem del catálogo basada en:
- Tipo de mercado del ítem (funcional/cosmético/coleccionable/servicio/legacy)
- Precio vs. saldo actual del usuario
- Estado del escudo de racha (si no tiene, los ítems de protección puntúan más alto)
- Misiones reclamables (si hay misiones pendientes, los ítems de XP puntúan más alto)
- Si ya entrenó hoy (si sí, los ítems de recuperación puntúan más alto)
- Si no entrenó hoy (los ítems de XP puntúan más alto para motivar la acción)
- Coincidencia del texto del ítem con los focos de misión activa
- Coincidencia con hints de clase (CLASS_ROUTINE_HINTS)

**Variante 2 — Scoring de rutinas** (función `scoreRoutineForContext`):
Aplica puntuación a rutinas públicas basada en:
- Hints de clase del héroe
- Focos de misión activa
- Si ya entrenó (favorece movilidad y recuperación)
- Si no entrenó (favorece fuerza y cardio)
- Si hay misiones reclamables (favorece rutinas cortas)

---

## 3.6 Limitaciones metodológicas

### 3.6.1 Ausencia de grupo de control

El presente trabajo no incluye un grupo de control formal. La comparación entre ForgeVenture y aplicaciones de fitness convencionales se realiza mediante análisis de características (qué elementos tiene cada una) y revisión de literatura previa, pero no mediante un experimento controlado que mida la adherencia real de un grupo usando ForgeVenture frente a un grupo usando una aplicación alternativa.

Esta limitación es reconocida y se debe a los recursos y el tiempo disponibles para el trabajo de tesis. Un estudio controlado de adherencia requeriría mínimamente ocho semanas de seguimiento, un tamaño de muestra estadísticamente significativo (generalmente n > 50 por grupo) y la gestión ética de datos de salud de participantes humanos.

### 3.6.2 Evaluación de usabilidad con muestra reducida

La evaluación de usabilidad del sistema se realizó con una muestra de usuarios de conveniencia durante el proceso de desarrollo. Los resultados no son generalizables estadísticamente pero permitieron identificar fricciones de diseño que fueron corregidas en iteraciones posteriores.

### 3.6.3 Condicionamiento por el contexto tecnológico

El sistema depende de servicios de terceros (Firebase, Google Gemini, MediaPipe) que pueden modificar sus APIs, precios o términos de servicio. Esta dependencia externa es una limitación estructural del sistema que podría requerir adaptaciones futuras.

### 3.6.4 Alcance de la evaluación de IA

La evaluación del asistente de IA (UserChat con Gemini) se realizó mediante pruebas funcionales manuales. No se realizó una evaluación sistemática de la calidad, precisión o seguridad de las respuestas del modelo en el dominio de la salud, lo que sería necesario antes de un despliegue a gran escala.

---

## Referencias metodológicas

Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., … & Thomas, D. (2001). *Manifesto for agile software development*. Agile Alliance.

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, *28*(1), 75–105.

Przybylski, A. K., Murayama, K., DeHaan, C. R., & Gladwell, V. (2012). Motivational, emotional, and behavioral correlates of fear of missing out. *Computers in Human Behavior*, *29*(4), 1841–1848.

Statista. (2023). *Share of internet users who use mobile applications to exercise and fitness worldwide, by age group*. Statista Research Department.

Telama, R., Yang, X., Viikari, J., Välimäki, I., Wanne, O., & Raitakari, O. (2005). Physical activity from childhood to adulthood: A 21-year tracking study. *American Journal of Preventive Medicine*, *28*(3), 267–273.

Werbach, K., & Hunter, D. (2012). *For the win: How game thinking can revolutionize your business*. Wharton Digital Press.
