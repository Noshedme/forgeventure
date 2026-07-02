# Fase Final — Conclusiones y Recomendaciones

> Tesis: ForgeVenture — Sistema web de gamificación aplicado al entrenamiento físico y el bienestar personal

---

## Conclusiones

### Respuesta a la pregunta de investigación

La pregunta de investigación que orientó este trabajo fue: *¿En qué medida la incorporación de mecánicas de gamificación inspiradas en los juegos de rol (RPG) en una plataforma web de entrenamiento físico puede fomentar la motivación intrínseca y la adherencia al ejercicio en jóvenes adultos?*

La respuesta que arroja el trabajo desarrollado es que **la incorporación de estas mecánicas es técnicamente viable, teóricamente fundamentada y estructuralmente coherente con los modelos motivacionales más respaldados por la literatura**. ForgeVenture demuestra que es posible construir un sistema donde cada elemento de la gamificación RPG —la clase del héroe, el nivel, la racha, las misiones, el mercado, el avatar— no es un adorno sobre una aplicación de fitness convencional, sino la arquitectura misma que da sentido al entrenamiento dentro de la plataforma. El usuario no usa ForgeVenture *a pesar de* sus mecánicas de juego: las usa *porque* esas mecánicas convierten el esfuerzo físico en algo que vale la pena proteger y continuar.

### Verificación de la hipótesis

La hipótesis planteada proponía que un sistema de gamificación RPG con progresión por niveles, misiones, racha, personalización del avatar y economía de monedas **favorecería la motivación intrínseca y generaría patrones de uso más consistentes**.

Los resultados verifican que **todos los mecanismos descritos en la hipótesis fueron implementados de manera completa y funcional**. El sistema construido satisface las tres necesidades psicológicas básicas de la Teoría de la Autodeterminación (Deci y Ryan, 2000): la competencia, a través del sistema de XP, niveles y retroalimentación inmediata; la autonomía, a través de la elección de clase, rutinas, cosméticos y caminos de progresión; y la relación, a través del leaderboard, los mensajes del gremio y la narrativa compartida de "héroe del gremio". Estas son, según la evidencia revisada, las condiciones necesarias para que la motivación extrínseca inicial se internalice progresivamente hacia formas más autónomas y duraderas.

Lo que la hipótesis no puede verificarse completamente en este trabajo es el efecto real sobre la adherencia medida en el tiempo, dado que ese resultado requiere un estudio longitudinal con participantes reales. Esta limitación no invalida la contribución del trabajo: lo que se demuestra es que el sistema construido implementa, de manera rigurosa y coherente, los mecanismos que la literatura identifica como favorecedores de la motivación autónoma y la adherencia. La verificación empírica del efecto conductual queda como línea de investigación futura.

### Sobre el sistema de gamificación construido

Una conclusión central de este trabajo es que **la gamificación superficial y la gamificación profunda son cualitativamente diferentes** y producen efectos distintos en el usuario. La primera generación de aplicaciones gamificadas —basada casi exclusivamente en puntos, insignias y tablas de clasificación— ha demostrado ser insuficiente para sostener la adherencia en el tiempo (Hamari et al., 2014). ForgeVenture representa una apuesta por la gamificación de segunda generación: aquella que opera en los tres niveles de la taxonomía de Werbach y Hunter (2012), que activa los ocho impulsos del modelo Octalysis de Chou (2015) y que está alineada con los determinantes de la motivación intrínseca identificados por la TAD.

El sistema de misiones con rareza crea tensión dramática y botín visible. El mercado con economía interna de monedas convierte el esfuerzo en un recurso real que puede gastarse o guardarse. El sprite evolutivo del personaje hace visible el crecimiento del usuario de una manera que ninguna gráfica de estadísticas puede replicar. La racha diaria transforma la constancia en un activo que el usuario no quiere perder. Ninguno de estos elementos es ornamental: cada uno responde a un fundamento teórico específico y cumple una función motivacional documentada.

### Sobre la integración de tecnología avanzada

Este trabajo confirma que la combinación de tecnologías web modernas permite hoy construir experiencias que antes requerían hardware especializado o equipos de desarrollo de gran escala. La detección de poses con MediaPipe en el navegador, sin instalación adicional y desde una cámara web estándar, representa un punto de inflexión para las aplicaciones de fitness digitales: por primera vez es posible validar el ejercicio físico real desde una interfaz web y recompensar proporcional y diferenciadamente según el esfuerzo efectivo del usuario.

La integración del modelo Gemini con acceso al perfil completo del usuario —clase, nivel, misiones, racha, saldo, logros— y con capacidad de navegar al usuario mediante deep-links a secciones específicas de la plataforma, demuestra que los asistentes de IA de nueva generación pueden operar como agentes contextuales dentro de aplicaciones web, superando ampliamente el modelo de los chatbots basados en reglas de la generación anterior.

### Sobre el diseño como investigación

Desde la perspectiva de la Design Science Research (Hevner et al., 2004), ForgeVenture es en sí mismo una contribución al conocimiento: un artefacto de software que materializa, prueba y refina los principios teóricos revisados en la literatura. El proceso de construir el sistema obligó a tomar decisiones de diseño que el marco teórico no podía resolver por sí solo —¿cuántos factores incluir en el algoritmo de recomendación? ¿Qué TTL asignar a cada caché? ¿Cómo equilibrar la riqueza del sistema de gamificación con la usabilidad?— y esas decisiones, documentadas en detalle a lo largo de esta tesis, constituyen un conocimiento procedimental que trasciende el caso específico de ForgeVenture y puede orientar el diseño de sistemas similares.

### Aportación al ámbito de estudio

La aportación de este trabajo al campo de las aplicaciones de salud digital y la gamificación puede sintetizarse en cuatro puntos:

**1. Un modelo de integración multicapa**: ForgeVenture demuestra que las mecánicas RPG (progresión, identidad de clase, misiones, economía interna) pueden integrarse coherentemente con módulos de entrenamiento real, seguimiento de bienestar y asistencia de IA en un único sistema web sin fricciones de uso.

**2. El sistema de recomendación contextual del mercader**: el algoritmo de scoring multivariable que analiza el estado del usuario en tiempo real para ofrecer recomendaciones de ítems, rutinas y cosméticos es un aporte técnico original que no se encontró en ninguna de las plataformas de referencia analizadas.

**3. La arquitectura de bus de eventos para sincronización en SPA gamificadas**: el uso de CustomEvents del navegador como mecanismo de comunicación entre módulos independientes resuelve de manera elegante el problema de sincronización de estado en una SPA con múltiples componentes que reflejan el mismo perfil del usuario.

**4. La evidencia de viabilidad técnica**: la tesis demuestra que un sistema de la complejidad de ForgeVenture —36 páginas, 18 grupos de API, 60+ sub-componentes, detección de poses en tiempo real, asistente de IA contextual, sistema cosmético multicapa, economía interna y cuatro idiomas— es construible por un equipo de desarrollo pequeño utilizando el ecosistema web moderno, sin hardware especializado y con costos de infraestructura mínimos en la fase de desarrollo.

---

## Recomendaciones para investigaciones futuras

### R1. Estudio longitudinal de adherencia

La recomendación más urgente derivada de este trabajo es la realización de un **estudio longitudinal controlado** que mida la adherencia al ejercicio de un grupo de usuarios de ForgeVenture frente a un grupo de usuarios de una aplicación de fitness convencional (sin gamificación) durante un período mínimo de doce semanas.

Las variables de adherencia a medir deberían incluir: frecuencia semanal de sesiones de entrenamiento registradas, tasa de retención en la plataforma a las 4, 8 y 12 semanas, tiempo medio por sesión y número de misiones completadas por semana. Estas métricas permitirían cuantificar el efecto real de la gamificación sobre el comportamiento y contrastar los resultados con los estudios previos revisados en el marco teórico (Hamari et al., 2014; Johnson et al., 2016).

Un diseño experimental viable incluiría: asignación aleatoria de participantes a condición experimental (ForgeVenture completo) y condición de control (ForgeVenture sin elementos de gamificación —sin niveles, misiones, racha ni economía de monedas—), cuestionarios de motivación validados (Behavioral Regulation in Exercise Questionnaire, BREQ-3) al inicio, a las 6 semanas y al final del estudio, y registro automático de la actividad via los logs del backend.

### R2. Evaluación formal de motivación intrínseca con instrumentos validados

El presente trabajo sustenta en la TAD la capacidad del sistema para fomentar la motivación intrínseca, pero no aplica instrumentos psicométricos validados para medirla. Se recomienda incorporar en una versión futura del sistema cuestionarios estandarizados de motivación en el ejercicio, en particular:

- **BREQ-3** (*Behavioural Regulation in Exercise Questionnaire*, Wilson et al., 2006): mide los seis tipos de regulación motivacional del continuo de la TAD aplicados al ejercicio.
- **IMI** (*Intrinsic Motivation Inventory*, Ryan, 1982): mide la motivación intrínseca en contextos específicos de actividad.
- **BPNSFS** (*Basic Psychological Needs Satisfaction and Frustration Scale*, Chen et al., 2015): mide la satisfacción y frustración de las tres necesidades básicas (competencia, autonomía, relación).

La administración periódica de estos instrumentos dentro de la plataforma (por ejemplo, al completar 30 días de uso) permitiría trazar cómo evoluciona el perfil motivacional del usuario a medida que acumula experiencia con el sistema.

### R3. Expansión del sistema de inteligencia artificial

La integración de Gemini como asistente contextual es un primer paso prometedor, pero el potencial de la IA en este sistema es considerablemente mayor. Se recomiendan las siguientes líneas de expansión:

**Personalización adaptativa de dificultad**: un modelo de IA que analice el historial de sesiones del usuario (tipos de ejercicio, duración, frecuencia, tasas de completión de misiones) y ajuste dinámicamente la dificultad de las misiones recomendadas, aplicando de manera automatizada el principio de desafío calibrado de Csikszentmihalyi.

**Detección de riesgo de abandono**: un clasificador que identifique señales tempranas de abandono (reducción de frecuencia, sesiones más cortas, menor tasa de reclamación de misiones) y active intervenciones proactivas personalizadas antes de que el usuario abandone definitivamente.

**Generación de rutinas personalizadas**: un modelo que genere rutinas de entrenamiento personalizadas basadas en el historial del usuario, sus objetivos actuales, el tiempo disponible declarado y las restricciones físicas indicadas en el onboarding.

### R4. Validación clínica del contenido de salud

El módulo de salud (hidratación, nutrición, sueño, recuperación) y el chat IA pueden proporcionar orientaciones que, aunque bien intencionadas, no han sido revisadas por profesionales de la salud. Se recomienda para una versión de despliegue a escala:

- Revisión del contenido informativo de los módulos de salud por parte de un equipo de nutricionistas, médicos deportivos y psicólogos.
- Implementación de disclaimers explícitos sobre los límites del sistema: ForgeVenture no es un servicio médico y sus recomendaciones no reemplazan la consulta profesional.
- Filtros de seguridad adicionales en el chat IA para detectar y redirigir apropiadamente consultas sobre condiciones médicas, lesiones o trastornos alimentarios.
- Colaboración con instituciones de salud que permitan respaldar el contenido con evidencia clínica validada.

### R5. Desarrollo de versión móvil nativa o Progressive Web App

El sistema actual es una aplicación web responsiva, pero la experiencia en dispositivos móviles, aunque funcional, no aprovecha capacidades nativas del dispositivo como:

- Notificaciones push para recordatorios de racha y misiones próximas a expirar
- Integración con los sensores de movimiento del teléfono para registrar actividad pasiva
- Acceso offline para consultar rutinas y marcar sesiones sin conexión
- Integración con HealthKit (iOS) o Google Fit (Android) para sincronizar datos de actividad de otras fuentes

La transformación de ForgeVenture en una **Progressive Web App (PWA)** con Service Worker es la vía de menor fricción para obtener notificaciones push y acceso offline sin necesidad de desarrollar aplicaciones nativas. Como paso posterior, el desarrollo de versiones nativas en React Native permitiría acceder al ecosistema completo de sensores y datos de salud del dispositivo.

### R6. Expansión del sistema social

El marco teórico identifica la **necesidad de relación** como una de las tres necesidades psicológicas básicas (TAD) y la **influencia social** como uno de los impulsos centrales del modelo Octalysis (Chou). Sin embargo, ForgeVenture en su versión actual implementa los elementos sociales de manera limitada (leaderboard y mensajes del gremio). Se recomiendan las siguientes expansiones:

- **Misiones cooperativas**: quests que requieran la participación de dos o más usuarios para completarse, fomentando la motivación social directa.
- **Gremios o clanes**: grupos de usuarios con identidad propia, leaderboard interno y misiones de grupo.
- **Sistema de mentores**: usuarios de nivel alto que puedan guiar a usuarios nuevos, creando un sistema de relación asimétrica que beneficia a ambas partes.
- **Desafíos semanales entre clases**: competiciones entre Guerreros, Arqueros y Magos que creen identidad de grupo y motivación colectiva.

### R7. Investigación sobre gamificación ética y prevención del abandono post-gamificación

Una línea de investigación teórica relevante derivada de este trabajo es el estudio del **fenómeno de abandono post-gamificación**: qué ocurre con la motivación y el comportamiento de los usuarios cuando el sistema de gamificación se retira o cuando el usuario "domina" todas las mecánicas disponibles (alcanza el nivel máximo, completa todos los logros, posee todos los cosméticos).

La Teoría de la Autodeterminación predice que si el sistema ha fomentado con éxito la internalización de la motivación, el abandono de la gamificación no debería producir abandono del ejercicio. Sin embargo, si la motivación se mantuvo predominantemente extrínseca, el abandono de las recompensas virtuales podría correlacionar con el abandono del comportamiento. Un estudio que mida la motivación y la adherencia en usuarios que han "completado" el sistema de gamificación aportaría evidencia valiosa sobre la sostenibilidad a largo plazo de los sistemas gamificados.

### R8. Expansión y localización del contenido

El catálogo de ejercicios, rutinas, misiones y ítems de la tienda fue diseñado como base funcional para el trabajo de tesis, pero requiere expansión significativa para un despliegue de uso real:

- **Catálogo de ejercicios**: ampliar de las zonas actuales a un catálogo de más de 200 ejercicios clasificados por músculo, equipamiento, dificultad y modalidad.
- **Biblioteca de rutinas**: generar al menos 50 rutinas curadas, distribuidas equitativamente entre las tres clases y los distintos niveles de experiencia.
- **Catálogo de misiones**: desarrollar un sistema de generación automática de misiones basado en el historial del usuario, evitando la repetición y la sensación de "misiones genéricas".
- **Localización cultural**: los cuatro idiomas actuales (ES/EN/PT/FR) cubren un amplio espectro, pero la localización cultural va más allá de la traducción. Los culturemas del sistema (gremio, héroe, misión, botín) tienen resonancias distintas en diferentes culturas y podrían requerir adaptación narrativa para mercados específicos.

### R9. Integración con dispositivos wearables

Los dispositivos wearables (relojes inteligentes, bandas de actividad) han alcanzado una penetración significativa en la población objetivo. La integración de ForgeVenture con dispositivos como Garmin, Apple Watch o Google Fit permitiría:

- Verificar automáticamente que el usuario realizó actividad física sin necesidad de que reporte manualmente desde la aplicación
- Importar métricas de frecuencia cardíaca para calibrar la intensidad del entrenamiento y la recompensa de XP
- Registrar el sueño y la hidratación automáticamente, enriqueciendo los módulos de salud sin fricción de registro manual
- Extender el sistema de detonantes de Fogg (2009): una notificación del wearable "Llevas 30 minutos sin moverte, tu racha está a salvo por 4 horas más" crea un detonante basado en datos fisiológicos reales.

### R10. Aplicación del modelo a otros dominios

Finalmente, el modelo de gamificación RPG desarrollado en ForgeVenture es transferible a otros dominios que comparten el mismo problema estructural: comportamientos beneficiosos para el usuario pero difíciles de sostener sin motivación extrínseca inicial. Se recomiendan las siguientes aplicaciones del modelo:

- **Aprendizaje de idiomas o matemáticas**: la estructura de misiones, niveles y racha ha demostrado eficacia en Duolingo para el aprendizaje de idiomas.
- **Hábitos de lectura**: una plataforma que gamifique la lectura diaria con las mismas mecánicas podría abordar la crisis de lectura en jóvenes adultos.
- **Bienestar financiero**: gestión de ahorros y hábitos financieros con mecánicas RPG (misiones de ahorro, "niveles de independencia financiera", economía interna de objetivos).
- **Rehabilitación física**: en colaboración con fisioterapeutas, el sistema de detección de poses y el sistema de misiones podría adaptarse para guiar y motivar el cumplimiento de ejercicios de rehabilitación en el hogar, donde la adherencia al tratamiento es especialmente difícil de mantener.

---

## Reflexión final

ForgeVenture nació de una pregunta sencilla: ¿qué pasaría si el entrenamiento físico tuviera las mismas consecuencias que completar una misión en un videojuego? La respuesta construida a lo largo de este trabajo es un sistema que demuestra que esa pregunta tiene respuesta técnica y que esa respuesta puede sustentarse en décadas de investigación sobre motivación humana, diseño de comportamiento y experiencia de usuario.

El ejercicio físico no dejará de ser difícil por el hecho de que exista una aplicación bien gamificada. Pero si esa aplicación logra que el usuario vuelva mañana porque tiene una racha que no quiere perder, una misión a punto de completarse o un nivel a pocos puntos de subir, habrá hecho algo que la mayoría de los sistemas de salud digital no consigue: **convertir la constancia en algo que valga la pena proteger por razones propias del usuario, no impuestas desde afuera**.

Eso es, en síntesis, la apuesta de este trabajo y la contribución que aspira a dejar en el campo.
