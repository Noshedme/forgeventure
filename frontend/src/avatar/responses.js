// src/avatar/responses.js
// Nodos estáticos: { text, state, options[] }
// Nodos dinámicos: (userData) => { text, state, options[] }

// ─── Lore por clase ───────────────────────────────────────────────────────────
const CLASS_LORE = {
  GUERRERO: {
    icon: '⚔️',
    desc: 'El Guerrero domina la fuerza bruta y la resistencia. Tu camino: pesas, sentadillas, press, peso muerto. Aumenta carga progresivamente y come proteína de sobra.',
    tip: 'Tu superpoder es la constancia. Supera tu récord personal cada semana, aunque sea 1 rep más.',
  },
  ARQUERO: {
    icon: '🏹',
    desc: 'El Arquero combina velocidad con precisión. Tu camino: cardio, HIIT, agilidad y resistencia muscular. El ritmo es tu arma.',
    tip: 'Alterna cardio de alta intensidad con días de técnica. La variedad es tu ventaja competitiva.',
  },
  MAGO: {
    icon: '🔮',
    desc: 'El Mago usa la mente para dominar el cuerpo. Tu camino: movilidad, técnica perfecta y progresión inteligente. La paciencia es tu superpoder.',
    tip: 'Dedica 5 min al día a respiración consciente. Transforma la mente y el cuerpo sigue automáticamente.',
  },
  ASESINO: {
    icon: '🗡️',
    desc: 'El Asesino actúa rápido y sin margen de error. Tu camino: pliometría, circuitos y explosividad. Cada segundo cuenta.',
    tip: 'Workouts cortos e intensos son tu especialidad. 20 min al máximo supera a 60 min sin ritmo.',
  },
  PALADIN: {
    icon: '🛡️',
    desc: 'El Paladín combina fuerza con aguante. Entrena híbrido: fuerza + resistencia cardiovascular. Defensa y ataque por igual.',
    tip: 'No subestimes el descanso. Tu cuerpo aguanta mucho, pero la recuperación es lo que te hace más fuerte.',
  },
};

// ─── Greeting dinámico ────────────────────────────────────────────────────────
function buildUserInitial(u) {
  const name   = u?.heroName || u?.username;
  const level  = u?.level  ?? 1;
  const streak = u?.streak ?? 0;

  let text;
  if (name && streak >= 14) {
    text = `¡${name}! 🔥 ${streak} días de racha — eres una leyenda. Nivel ${level}. ¿Qué quieres hoy?`;
  } else if (name && streak >= 7) {
    text = `¡Hola, ${name}! ${streak} días seguidos — ¡brutal! 🔥 Nivel ${level}. ¿En qué te ayudo?`;
  } else if (name && streak > 0) {
    text = `¡Hola, ${name}! Llevas ${streak} día${streak > 1 ? 's' : ''} de racha 🔥 Nivel ${level}. ¡Vamos!`;
  } else if (name) {
    text = `¡Hola, ${name}! Soy Flex, tu compañero de nivel ${level}. ¿Qué necesitas hoy?`;
  } else {
    text = '¡Hola, héroe! Soy Flex, tu compañero de entrenamiento. ¿Qué necesitas hoy?';
  }

  return {
    text,
    state: 'wave',
    options: [
      { label: '📊 Mis stats hoy',         id: 'mi_progreso'  },
      { label: '⚡ ¿Qué hago hoy?',        id: 'que_hago_hoy' },
      { label: '💬 ¿Cómo estás, Flex?',    id: 'charla'       },
      { label: '📍 Ir a sección…',         id: 'nav_menu'     },
      { label: '🏋️ Entrenamiento',         id: 'training'     },
      { label: '🍎 Nutrición',             id: 'nutrition'    },
      { label: '😴 Recuperación',          id: 'recovery'     },
      { label: '🧠 Quiz fitness',          id: 'fitness_quiz' },
      { label: '❓ Ayuda con la app',      id: 'app_help'     },
      { label: '🚪 Cerrar sesión',         id: '__logout'     },
    ],
  };
}

const ADMIN_INITIAL = {
  text: '¡Hey admin! Aquí Flex. Todo bajo control. ¿En qué te ayudo?',
  state: 'wave',
  options: [
    { label: '📍 Ir a panel…',           id: 'nav_menu'       },
    { label: '💬 Charla rápida',         id: 'admin_charla'   },
    { label: '🔧 ¿Qué puedo hacer?',     id: 'admin_tips'     },
    { label: '📊 Ver estadísticas',      id: '__nav_stats'    },
    { label: '👥 Usuarios',              id: '__nav_usuarios' },
    { label: '🚪 Cerrar sesión',         id: '__logout'       },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPUESTAS USUARIO
// ─────────────────────────────────────────────────────────────────────────────
const USER_RESPONSES = {

  // ── Navegación ───────────────────────────────────────────────────────────────
  nav_menu: {
    text: '¿A dónde quieres ir? Te llevo en un segundo. 🚀',
    state: 'talking',
    options: [
      { label: '🏠 Dashboard',       id: '__nav_home'       },
      { label: '🏋️ Ejercicios',      id: '__nav_ejercicios' },
      { label: '📋 Mis Rutinas',     id: '__nav_rutinas'    },
      { label: '🎯 Misiones',        id: '__nav_misiones'   },
      { label: '🏆 Logros',          id: '__nav_logros'     },
      { label: '🛒 Tienda',          id: '__nav_tienda'     },
      { label: '👤 Mi Perfil',       id: '__nav_perfil'     },
      { label: '← Volver',          id: '__home'           },
    ],
  },

  // ── Stats personalizados (dinámico) ──────────────────────────────────────────
  mi_progreso: (u) => {
    if (!u) {
      return {
        text: 'No tengo acceso a tus datos ahora mismo. Revísalos en el Dashboard. 📊',
        state: 'thinking',
        options: [
          { label: '📊 Ir al Dashboard', id: '__nav_home' },
          { label: '← Inicio',          id: '__home'     },
        ],
      };
    }
    const { level = 1, xp = 0, xpNext = 100, streak = 0, coins = 0, totalSesiones = 0 } = u;
    const xpLeft = Math.max(0, xpNext - xp);
    const xpPct  = xpNext > 0 ? Math.round((xp / xpNext) * 100) : 100;
    const streakMsg = streak >= 7
      ? `🔥 Racha épica: ${streak} días`
      : streak > 0
        ? `🔥 Racha: ${streak} día${streak > 1 ? 's' : ''}`
        : '⚠️ Sin racha activa';

    const extraOpts = [];
    if (streak === 0) extraOpts.push({ label: '🔥 ¿Cómo empiezo la racha?', id: 'racha_tips' });
    if (xpLeft > 0 && xpLeft <= 200) extraOpts.push({ label: `⚡ ¡Ganar esos ${xpLeft} XP!`, id: '__nav_misiones' });
    if (coins >= 800) extraOpts.push({ label: '🛒 Ir a la Tienda', id: '__nav_tienda' });

    return {
      text: `⚔️ Nivel ${level} · ${xpPct}% XP (faltan ${xpLeft} para nivel ${level + 1})\n${streakMsg} · 💰 ${coins} monedas · 🏋️ ${totalSesiones} sesiones`,
      state: 'happy',
      options: [
        { label: '📊 Dashboard completo', id: '__nav_home'     },
        { label: '🎯 Ver Misiones',       id: '__nav_misiones' },
        ...extraOpts,
        { label: '← Inicio',            id: '__home'         },
      ],
    };
  },

  // ── ¿Qué hago hoy? (dinámico + hora) ─────────────────────────────────────────
  que_hago_hoy: (u) => {
    const hour   = new Date().getHours();
    const streak = u?.streak ?? 0;

    let timeMsg;
    if (hour < 7)       timeMsg = '🌅 Primeras horas del día — perfectas para movilidad o ejercicio suave antes de que el cuerpo despierte del todo.';
    else if (hour < 10) timeMsg = '🌄 Buena mañana para entrenar. Metabolismo activo y mente despejada — ideal para cardio o cuerpo completo.';
    else if (hour < 13) timeMsg = '☀️ Media mañana — el mejor momento del día para levantar pesos. Temperatura corporal óptima y energía al máximo.';
    else if (hour < 16) timeMsg = '🌤 Mediodía. Come algo ligero antes si entrenas ahora. Buen momento para técnica o cardio moderado.';
    else if (hour < 20) timeMsg = '🌇 Tarde-noche: el cuerpo tiene su pico de fuerza y flexibilidad entre 16-20h. Excelente para entrenar fuerte.';
    else                timeMsg = '🌙 Es tarde. Opta por algo suave — yoga, estiramientos o movilidad. El cardio intenso de noche altera el sueño.';

    const streakLine = streak >= 7
      ? `\n\n🔥 ${streak} días de racha — haz aunque sea algo hoy para no romperla.`
      : streak > 0
        ? `\n\n⚡ ${streak} día${streak > 1 ? 's' : ''} de racha. ¡Una misión rápida la mantiene!`
        : '\n\n💡 Sin racha activa — hoy es el día perfecto para empezar.';

    return {
      text: timeMsg + streakLine,
      state: 'thinking',
      options: [
        { label: '📋 Ver mis Rutinas',     id: '__nav_rutinas'    },
        { label: '🎯 Misiones del día',    id: '__nav_misiones'   },
        { label: '🏋️ Explorar Ejercicios', id: '__nav_ejercicios' },
        { label: '← Inicio',             id: '__home'           },
      ],
    };
  },

  // ── Mi clase (dinámico) ────────────────────────────────────────────────────────
  mi_clase: (u) => {
    const cls  = CLASS_LORE[u?.heroClass] || CLASS_LORE.GUERRERO;
    const name = u?.heroName || u?.username || 'héroe';
    return {
      text: `${cls.icon} ${name}, ${u?.heroClass ? `eres un(a) ${u.heroClass}` : 'eres un Guerrero'}.\n\n${cls.desc}\n\n💡 ${cls.tip}`,
      state: 'happy',
      options: [
        { label: '🏋️ Ejercicios para mi clase', id: '__nav_ejercicios' },
        { label: '👤 Ver mi Perfil',            id: '__nav_perfil'     },
        { label: '📋 Ver Rutinas',              id: '__nav_rutinas'    },
        { label: '← Inicio',                   id: '__home'           },
      ],
    };
  },

  // ── Racha tips ────────────────────────────────────────────────────────────────
  racha_tips: {
    text: 'La racha es tu hábito en forma de número. Para mantenerla: (1) Pon una alarma de entreno. (2) Prepara la ropa la noche antes. (3) Ten una misión "emergencia" de solo 10 min para los días malos. Después de 21 días consecutivos, el hábito es casi automático. 🔥',
    state: 'talking',
    options: [
      { label: '🎯 Ver Misiones',        id: '__nav_misiones'  },
      { label: '🔄 Descanso activo',     id: 'recovery_active' },
      { label: '← Inicio',             id: '__home'          },
    ],
  },

  // ── Cómo ganar monedas ────────────────────────────────────────────────────────
  coins_ganar: {
    text: '💰 Para acumular monedas rápido: (1) Misiones diarias — dan más que ejercicios sueltos. (2) Mantén la racha — da bonus diario. (3) Desbloquea logros — algunos dan 200-500 monedas. (4) Sube de nivel — recompensa fija garantizada. La constancia es el truco real.',
    state: 'happy',
    options: [
      { label: '🎯 Ver Misiones',        id: '__nav_misiones' },
      { label: '🏆 Ver Logros',          id: '__nav_logros'   },
      { label: '🛒 Ir a la Tienda',      id: '__nav_tienda'   },
      { label: '← Inicio',             id: '__home'         },
    ],
  },

  // ── Suplementos ───────────────────────────────────────────────────────────────
  suplementos: {
    text: '¿Qué suplementos valen la pena? Los respaldados por la ciencia: (1) Creatina monohidrato — más fuerza y masa, seguro y barato. (2) Proteína de suero — solo si no llegas al objetivo diario con comida. (3) Cafeína — rendimiento y enfoque real. (4) Vitamina D — si vives poco al sol. Todo lo demás es marketing. 💊',
    state: 'talking',
    options: [
      { label: '🍎 Más sobre nutrición', id: 'nutrition' },
      { label: '🥩 Sobre proteínas',     id: 'protein'   },
      { label: '← Inicio',             id: '__home'    },
    ],
  },

  // ── Charla / Mood ──────────────────────────────────────────────────────────────
  charla: {
    text: '¡Yo estoy al 100%! Listo para ayudarte a romperla 💪 ¿Y tú cómo te sientes hoy?',
    state: 'happy',
    options: [
      { label: '💪 Con mucha energía',    id: 'mood_high'  },
      { label: '😐 Regular, más o menos', id: 'mood_mid'   },
      { label: '😴 Muy cansado hoy',      id: 'mood_tired' },
      { label: '🤕 Me duele algo',        id: 'mood_sore'  },
      { label: '😤 Sin ganas de nada',    id: 'mood_lazy'  },
    ],
  },
  mood_high: {
    text: '¡ESO ES! Días así hay que aprovecharlos al máximo. Activa una rutina de alta intensidad, añade peso extra o intenta superar tu récord personal. ¡Hoy es el día! 🔥',
    state: 'happy',
    options: [
      { label: '📋 Ver mis rutinas',      id: '__nav_rutinas'    },
      { label: '🏋️ Explorar ejercicios',  id: '__nav_ejercicios' },
      { label: '🎯 Misiones de hoy',      id: '__nav_misiones'   },
      { label: '← Inicio',              id: '__home'           },
    ],
  },
  mood_mid: {
    text: 'Normal es el punto de partida, no el de llegada. Haz algo moderado: 20-30 min de cardio ligero o una sesión de técnica. El movimiento genera energía. ⚡',
    state: 'talking',
    options: [
      { label: '🎯 Ver misiones del día', id: '__nav_misiones'  },
      { label: '📋 Rutinas ligeras',      id: '__nav_rutinas'   },
      { label: '💊 Suplementos útiles',   id: 'suplementos'     },
      { label: '← Inicio',              id: '__home'          },
    ],
  },
  mood_tired: {
    text: 'El descanso también es entrenamiento. Si llevas más de 3 días seguidos entrenando duro, tu cuerpo te pide un break. Descansa, hidrátate y duerme bien. Mañana vuelves con más fuerza. 😴',
    state: 'thinking',
    options: [
      { label: '😴 Recuperación',        id: 'recovery'        },
      { label: '💤 ¿Cuánto debo dormir?',id: 'sleep'           },
      { label: '🔄 Descanso activo',     id: 'recovery_active' },
      { label: '← Inicio',             id: '__home'          },
    ],
  },
  mood_sore: {
    text: 'Depende del tipo de dolor. Agujetas = sigue moviéndote suavemente. Dolor articular o agudo = para y descansa. ¿De cuál se trata?',
    state: 'thinking',
    options: [
      { label: '😣 Agujetas musculares',   id: 'doms'       },
      { label: '⚠️ Dolor articular/agudo', id: 'pain_joint' },
      { label: '← Inicio',               id: '__home'     },
    ],
  },
  mood_lazy: {
    text: 'Te entiendo — a todos nos pasa. Truco infalible: comprométete solo con 5 minutos. Si después sigues sin ganas, paras. Pero el 90% de las veces te enganchas. ¡Pruébalo! 😤',
    state: 'surprised',
    options: [
      { label: '⚡ Vale, ¡voy a intentarlo!', id: 'mood_high'      },
      { label: '🎯 Ver misiones rápidas',     id: '__nav_misiones' },
      { label: '💬 Necesito más motivación',  id: 'motivacion'     },
    ],
  },
  doms: {
    text: 'Las agujetas (DOMS) son microroturas musculares — ¡señal de que creciste! Alivio: calor local, movilidad ligera, proteína suficiente y descanso. Desaparecen en 48-72h. El foam roller también ayuda mucho. 💪',
    state: 'talking',
    options: [
      { label: '😴 Recuperación',        id: 'recovery'   },
      { label: '🧘 Estiramientos',       id: 'stretching' },
      { label: '🟠 Foam roller',         id: 'foam_roller'},
      { label: '← Inicio',             id: '__home'     },
    ],
  },
  pain_joint: {
    text: '⚠️ El dolor articular no se ignora. Detén el entreno en esa zona, aplica hielo 15-20 min, reposa y si persiste más de 48h consulta a un médico. Tu salud siempre primero.',
    state: 'thinking',
    options: [
      { label: '🔄 Descanso activo',    id: 'recovery_active' },
      { label: '🧊 Hielo / Crioterapia',id: 'cryotherapy'     },
      { label: '← Inicio',            id: '__home'          },
    ],
  },
  motivacion: {
    text: '"El dolor de hoy es la fuerza de mañana." Cada repetición que haces cuando no quieres es la que más te cambia. No entrenas solo el cuerpo — entrenas la mente. 🧠💪',
    state: 'happy',
    options: [
      { label: '🔥 ¡Vamos a entrenar!', id: 'training'      },
      { label: '💬 Una más',           id: 'motivacion_2'  },
      { label: '📋 Ver mis rutinas',   id: '__nav_rutinas' },
      { label: '← Inicio',           id: '__home'        },
    ],
  },
  motivacion_2: {
    text: '"No busques el día perfecto — haz perfectos tus días imperfectos." El progreso consistente supera al esfuerzo esporádico. Un 1% mejor cada día = 37x mejor al año. 📈',
    state: 'happy',
    options: [
      { label: '🔥 ¡Listo, a entrenar!', id: '__nav_misiones' },
      { label: '💬 Una más',            id: 'motivacion_3'   },
      { label: '← Inicio',            id: '__home'          },
    ],
  },
  motivacion_3: {
    text: '"Tu cuerpo puede soportar casi cualquier cosa. Es tu mente la que necesitas convencer." Los campeones no tienen más energía que tú — tienen más disciplina. 🏆',
    state: 'dance',
    options: [
      { label: '⚔️ ¡Vamos a por ello!', id: '__nav_rutinas' },
      { label: '← Inicio',            id: '__home'        },
    ],
  },

  // ── Entrenamiento ─────────────────────────────────────────────────────────────
  training: {
    text: '¿Qué aspecto del entrenamiento quieres explorar?',
    state: 'talking',
    options: [
      { label: '🎯 ¿Cuántos días/semana?', id: 'freq'        },
      { label: '🔥 Técnica de ejercicios', id: 'form'        },
      { label: '🌡️ Calentamiento',         id: 'warmup'      },
      { label: '💨 Respiración',           id: 'breathing'   },
      { label: '📈 ¿Cómo progreso?',       id: 'progress'    },
      { label: '💊 Suplementos',           id: 'suplementos' },
      { label: '⚔️ Consejos por clase',    id: 'mi_clase'    },
      { label: '← Inicio',               id: '__home'      },
    ],
  },
  freq: {
    text: 'Depende de tu nivel. ¿Cuánto tiempo llevas entrenando?',
    state: 'thinking',
    options: [
      { label: '🟢 Menos de 6 meses',  id: 'beginner' },
      { label: '🟡 6 meses – 2 años',  id: 'mid'      },
      { label: '🔴 Más de 2 años',     id: 'adv'      },
    ],
  },
  beginner: {
    text: '3 días/semana es perfecto para empezar. Tu cuerpo necesita 48h para recuperarse. Rutina recomendada: Lunes, Miércoles, Viernes — cuerpo completo. En 4-6 semanas notarás cambios reales. 🌱',
    state: 'happy',
    options: [
      { label: '📋 Ver Rutinas',       id: '__nav_rutinas' },
      { label: '🔥 Técnica básica',    id: 'form'          },
      { label: '🍎 Nutrición básica',  id: 'nutrition'     },
      { label: '← Volver',           id: 'freq'          },
    ],
  },
  mid: {
    text: '4 días/semana con división Upper/Lower o Push/Pull/Legs. Duerme 7-8h y come 1.8g proteína/kg. La recuperación es donde creces — no lo sacrifiques por más días de gym. 💪',
    state: 'happy',
    options: [
      { label: '📋 Ver Rutinas',       id: '__nav_rutinas' },
      { label: '🍎 Nutrición',         id: 'protein'       },
      { label: '← Volver',           id: 'freq'          },
    ],
  },
  adv: {
    text: '5-6 días con splits especializados. Pero ojo: más volumen requiere más recuperación. Si el rendimiento baja o no duermes bien, reduce a 4 días. La recuperación diferencia al bueno del grande. 🔴',
    state: 'talking',
    options: [
      { label: '📋 Ver Rutinas',        id: '__nav_rutinas'    },
      { label: '😴 Recuperación',       id: 'recovery'         },
      { label: '📈 Deload estratégico', id: 'prog_deload'      },
      { label: '← Volver',            id: 'freq'             },
    ],
  },

  // ── Técnica ───────────────────────────────────────────────────────────────────
  form: {
    text: 'La técnica primero, el peso viene solo. ¿Sobre qué ejercicio?',
    state: 'thinking',
    options: [
      { label: '🦵 Sentadilla',       id: 'form_squat'  },
      { label: '💪 Press banca',      id: 'form_bench'  },
      { label: '🏋️ Peso muerto',     id: 'form_dead'   },
      { label: '🤸 Dominadas',        id: 'form_pullup' },
      { label: '🙆 Press hombros',    id: 'form_ohp'    },
      { label: '🍑 Hip thrust',       id: 'form_hip'    },
      { label: '← Volver',          id: 'training'    },
    ],
  },
  form_squat: {
    text: 'Sentadilla: Pies al ancho de hombros, puntas ligeramente hacia afuera. Rodillas siguen la dirección de las puntas. Espalda neutra, pecho arriba. Baja hasta paralelo o más. Toda la planta del pie en el suelo — no levantes los talones. 🦵',
    state: 'talking',
    options: [
      { label: '🏋️ Ver ejercicios', id: '__nav_ejercicios' },
      { label: '← Más técnica',    id: 'form'             },
    ],
  },
  form_bench: {
    text: 'Press banca: Arco lumbar natural, glúteos en banco, escápulas retraídas y deprimidas. Agarre a ~1.5 ancho de hombros. Baja hasta el pecho inferior. Nunca rebotas. Empuja el suelo con los pies. 💪',
    state: 'talking',
    options: [
      { label: '🏋️ Ver ejercicios', id: '__nav_ejercicios' },
      { label: '← Más técnica',    id: 'form'             },
    ],
  },
  form_dead: {
    text: 'Peso muerto: Barra sobre el mediopié. Manos algo más ancho que piernas. Espalda neutra — nunca redondees. Empuja el suelo, no tires de la barra. Cuando la barra pasa las rodillas, lleva caderas al frente. 🏋️',
    state: 'talking',
    options: [
      { label: '🏋️ Ver ejercicios', id: '__nav_ejercicios' },
      { label: '← Más técnica',    id: 'form'             },
    ],
  },
  form_pullup: {
    text: 'Dominadas: Agarre prono, manos algo más ancho que hombros. Deprime las escápulas antes de empezar. Jala los codos hacia las caderas. Sube hasta que el mentón pase la barra. Baja controlado — no cuelgues. 🤸',
    state: 'talking',
    options: [
      { label: '🏋️ Ver ejercicios', id: '__nav_ejercicios' },
      { label: '← Más técnica',    id: 'form'             },
    ],
  },
  form_ohp: {
    text: 'Press hombros: De pie o sentado. Barra a nivel de clavícula. Empuja arriba y lleva la cabeza "a través" del movimiento. Core y glúteos apretados. No arquees la espalda lumbar. 🙆',
    state: 'talking',
    options: [
      { label: '🏋️ Ver ejercicios', id: '__nav_ejercicios' },
      { label: '← Más técnica',    id: 'form'             },
    ],
  },
  form_hip: {
    text: 'Hip thrust: Espalda apoyada en banco a la altura de los omóplatos. Barra sobre caderas con almohadilla. Empuja con los talones, activa glúteos al máximo arriba. Caderas paralelas al suelo. No hiperextiendes la espalda. 🍑',
    state: 'talking',
    options: [
      { label: '🏋️ Ver ejercicios', id: '__nav_ejercicios' },
      { label: '← Más técnica',    id: 'form'             },
    ],
  },

  // ── Calentamiento ─────────────────────────────────────────────────────────────
  warmup: {
    text: 'El calentamiento activa el sistema nervioso y previene lesiones. Nunca lo saltes. ¿Cuánto tiempo tienes?',
    state: 'talking',
    options: [
      { label: '⏱ 5 minutos',      id: 'warmup_5'  },
      { label: '⏱ 10-15 minutos',  id: 'warmup_15' },
      { label: '← Volver',        id: 'training'  },
    ],
  },
  warmup_5: {
    text: 'Express: 1min jumping jacks → 1min movilidad de caderas → 1min rotación de hombros → 2min trote en sitio. ¡5 min y listo! 🔥',
    state: 'happy',
    options: [
      { label: '📋 Ir a rutinas', id: '__nav_rutinas' },
      { label: '← Volver',      id: 'training'      },
    ],
  },
  warmup_15: {
    text: '5min cardio → 5min movilidad dinámica (caderas, hombros, tobillos) → 5min activación específica al 40-50% del peso de trabajo. Así rindes al máximo desde el primer set. 💯',
    state: 'happy',
    options: [
      { label: '📋 Ir a rutinas', id: '__nav_rutinas' },
      { label: '← Volver',      id: 'training'      },
    ],
  },

  // ── Respiración ───────────────────────────────────────────────────────────────
  breathing: {
    text: 'Respiración correcta = más fuerza y seguridad. Regla de oro: EXHALA en el esfuerzo (fase concéntrica), INHALA en la vuelta (fase excéntrica). En levantamientos pesados usa la maniobra de Valsalva: inhala profundo, cierra la glotis y aprieta el core — estabiliza la columna. 💨',
    state: 'talking',
    options: [
      { label: '🏋️ Aplicarlo en técnica', id: 'form'     },
      { label: '← Volver',               id: 'training' },
    ],
  },

  // ── Progresión ────────────────────────────────────────────────────────────────
  progress: {
    text: 'Sin progresión el cuerpo no cambia. ¿Qué tipo buscas?',
    state: 'thinking',
    options: [
      { label: '⬆️ Aumentar peso',         id: 'prog_weight' },
      { label: '🔁 Más reps/series',       id: 'prog_volume' },
      { label: '⚡ Deload y recuperación', id: 'prog_deload'  },
      { label: '📈 Ver mi progreso',       id: '__nav_home'  },
      { label: '← Volver',               id: 'training'    },
    ],
  },
  prog_weight: {
    text: 'Progresión lineal: principiantes +2.5kg por sesión, intermedios +2.5kg por semana. Si fallas 3 veces el mismo peso, reduce un 10% y reconstruye. La barra siempre debe sentirse "controlable". 📊',
    state: 'talking',
    options: [
      { label: '📊 Ver Dashboard', id: '__nav_home' },
      { label: '← Volver',       id: 'progress'   },
    ],
  },
  prog_volume: {
    text: 'Aumenta 1-2 reps por semana antes de subir peso. Cuando llegues al tope del rango (ej: 3×12 limpio), sube el peso y vuelve a 3×8. Es el método de la mayoría de programas serios de fuerza. 💪',
    state: 'talking',
    options: [
      { label: '📋 Ver mis rutinas', id: '__nav_rutinas' },
      { label: '← Volver',         id: 'progress'      },
    ],
  },
  prog_deload: {
    text: 'El deload es una semana al 60-70% de tu volumen y carga habitual. Hazlo cada 4-8 semanas para que el sistema nervioso, articulaciones y tendones se recuperen de verdad. No es rendirse — es estrategia inteligente. 😌',
    state: 'thinking',
    options: [
      { label: '😴 Recuperación',  id: 'recovery' },
      { label: '← Volver',       id: 'progress'  },
    ],
  },

  // ── Nutrición ─────────────────────────────────────────────────────────────────
  nutrition: {
    text: 'La nutrición es el 70% del resultado. Sin combustible no hay motor. ¿Qué quieres saber?',
    state: 'talking',
    options: [
      { label: '🥩 Proteínas',          id: 'protein'     },
      { label: '💧 Hidratación',        id: 'hydration'   },
      { label: '🍌 Pre-entrenamiento',  id: 'pre_workout' },
      { label: '🥤 Post-entrenamiento', id: 'post_workout'},
      { label: '⚖️ Calorías y dieta',   id: 'calories'    },
      { label: '💊 Suplementos',        id: 'suplementos' },
      { label: '← Inicio',            id: '__home'      },
    ],
  },
  protein: {
    text: 'Apunta a 1.6-2.2g por kg de peso corporal. Para 70kg: 112-154g/día. Fuentes top: pollo, huevos, atún, legumbres, lácteos griegos. El batido de proteína es un suplemento conveniente, no un sustituto de la comida real. 🥩',
    state: 'talking',
    options: [
      { label: '💧 Hidratación',       id: 'hydration'   },
      { label: '🍌 Pre-entrenamiento', id: 'pre_workout' },
      { label: '← Nutrición',        id: 'nutrition'   },
    ],
  },
  hydration: {
    text: 'Bebe 2-3 litros al día, más si entrenas fuerte. Regla práctica: orina clara = bien hidratado. Durante el entreno: 200-300ml cada 15-20 min. El café deshidrata ligeramente — añade un vaso extra por cada taza. 💧',
    state: 'talking',
    options: [
      { label: '🍌 Pre-entrenamiento', id: 'pre_workout' },
      { label: '← Nutrición',        id: 'nutrition'   },
    ],
  },
  pre_workout: {
    text: 'Pre-entreno ideal (1-2h antes): carbohidrato complejo + proteína. Ejemplos: arroz con pollo, avena con huevo. Con poco tiempo: plátano o dátiles 30 min antes. Cafeína: 3-6mg/kg es efectivo y seguro. 🍌⚡',
    state: 'happy',
    options: [
      { label: '🥤 Post-entrenamiento', id: 'post_workout' },
      { label: '← Nutrición',         id: 'nutrition'    },
    ],
  },
  post_workout: {
    text: 'Post-entreno (30-60 min después): proteína + carbohidrato rápido. Ejemplos: batido con plátano, arroz blanco con atún, yogur griego con frutas. Esta ventana maximiza la síntesis proteica y la recuperación. 🥤💪',
    state: 'happy',
    options: [
      { label: '🥩 Proteínas',  id: 'protein'   },
      { label: '← Nutrición', id: 'nutrition' },
    ],
  },
  calories: {
    text: 'Para perder grasa: déficit de 300-500 kcal/día. Para ganar músculo: superávit de 200-300 kcal. Nunca cortes ni añadas más de 500 kcal de golpe — ambos son contraproducentes. Calcula tu TDEE y ajusta desde ahí. ⚖️',
    state: 'thinking',
    options: [
      { label: '🥩 Proteínas primero',  id: 'protein'    },
      { label: '💊 Suplementos útiles', id: 'suplementos'},
      { label: '← Nutrición',         id: 'nutrition'  },
    ],
  },

  // ── Recuperación ──────────────────────────────────────────────────────────────
  recovery: {
    text: 'La recuperación es donde ocurre el crecimiento real. ¿Qué aspecto te interesa?',
    state: 'thinking',
    options: [
      { label: '💤 Sueño y descanso',  id: 'sleep'          },
      { label: '🔄 Descanso activo',   id: 'recovery_active'},
      { label: '🧘 Estiramientos',     id: 'stretching'     },
      { label: '🟠 Foam roller',       id: 'foam_roller'    },
      { label: '🧊 Crioterapia',       id: 'cryotherapy'    },
      { label: '← Inicio',           id: '__home'         },
    ],
  },
  sleep: {
    text: 'El sueño es tu suplemento más poderoso y gratuito. 7-9 horas para adultos. Durante el sueño profundo se libera hormona de crecimiento, se reparan fibras musculares y se consolida la memoria motora. Prioriza el sueño antes que 1h más en el gym. 💤',
    state: 'thinking',
    options: [
      { label: '🔄 Descanso activo',  id: 'recovery_active' },
      { label: '← Recuperación',    id: 'recovery'        },
    ],
  },
  recovery_active: {
    text: 'Descanso activo en días "off": camina 20-30 min, nada, haz yoga o movilidad ligera. Mueve el cuerpo sin estrés muscular — aumenta el flujo sanguíneo y limpia metabolitos de fatiga. 10x mejor que quedarte quieto. 🚶',
    state: 'happy',
    options: [
      { label: '🧘 Estiramientos',  id: 'stretching' },
      { label: '← Recuperación', id: 'recovery'   },
    ],
  },
  stretching: {
    text: 'Estira DESPUÉS de entrenar, nunca en frío. Mantén cada posición 20-30 segundos — ahí es donde el músculo cede realmente. Prioriza el grupo muscular trabajado. Yoga 1-2x por semana transforma la flexibilidad en meses. 🧘',
    state: 'talking',
    options: [
      { label: '🟠 Foam roller',   id: 'foam_roller' },
      { label: '← Recuperación', id: 'recovery'    },
    ],
  },
  foam_roller: {
    text: 'El foam roller trabaja la fascia muscular. 30-60 seg por zona — busca los puntos de tensión y mantente ahí. Zonas clave: cuádriceps, IT band, espalda alta, glúteos y pantorrillas. Úsalo antes de entrenar para activar y después para recuperar. 🟠',
    state: 'talking',
    options: [
      { label: '🧊 Crioterapia', id: 'cryotherapy' },
      { label: '← Recuperación',id: 'recovery'    },
    ],
  },
  cryotherapy: {
    text: 'El hielo reduce inflamación aguda post-entreno. 10-15 min de hielo en la zona dolorida, o baño frío a 10-12°C durante 10 min. Útil especialmente después de sesiones muy intensas. No lo uses en cada entrenamiento — cierta inflamación es necesaria para el crecimiento. 🧊',
    state: 'talking',
    options: [
      { label: '← Recuperación', id: 'recovery' },
      { label: '← Inicio',      id: '__home'   },
    ],
  },

  // ── Quiz de fitness ───────────────────────────────────────────────────────────
  fitness_quiz: {
    text: '¡Test rápido de conocimiento fitness! Primera pregunta: ¿Cuántas horas de sueño necesita alguien que entrena duro? 💤',
    state: 'thinking',
    options: [
      { label: 'A) 5-6 horas',          id: 'quiz_wrong_1' },
      { label: 'B) 7-9 horas',          id: 'quiz_ok_1'    },
      { label: 'C) 10+ horas siempre',  id: 'quiz_close_1' },
    ],
  },
  quiz_ok_1: {
    text: '¡CORRECTO! 🎉 7-9 horas es el rango ideal. En sueño profundo se libera hormona de crecimiento y se reparan fibras musculares. ¡El sueño es tu suplemento más barato!',
    state: 'dance',
    options: [
      { label: '🧠 Siguiente pregunta', id: 'quiz_2'  },
      { label: '😴 Más sobre sueño',   id: 'sleep'   },
      { label: '← Inicio',           id: '__home'  },
    ],
  },
  quiz_wrong_1: {
    text: 'No exactamente. Con 5-6 horas no llegas a los ciclos de sueño profundo donde ocurre la recuperación real. Necesitas 7-9 horas para que el entrenamiento tenga efecto completo. 😴',
    state: 'surprised',
    options: [
      { label: '🧠 Siguiente pregunta', id: 'quiz_2' },
      { label: '😴 Más sobre sueño',   id: 'sleep'  },
      { label: '← Inicio',           id: '__home' },
    ],
  },
  quiz_close_1: {
    text: 'Cerca, pero más no es siempre mejor. 10+ horas puede dejarte con inercia del sueño. Lo ideal es 7-9 horas consistentes y de calidad, no cantidad máxima. 😴',
    state: 'thinking',
    options: [
      { label: '🧠 Siguiente pregunta', id: 'quiz_2' },
      { label: '← Inicio',           id: '__home' },
    ],
  },
  quiz_2: {
    text: '¡Pregunta 2! ¿Cuánta proteína necesitas por kg de peso para construir músculo? 🥩',
    state: 'thinking',
    options: [
      { label: 'A) 0.5-0.8 g/kg', id: 'quiz2_bajo'   },
      { label: 'B) 1.6-2.2 g/kg', id: 'quiz2_ok'     },
      { label: 'C) 3+ g/kg',      id: 'quiz2_exceso' },
    ],
  },
  quiz2_ok: {
    text: '¡Exacto! 💪 1.6-2.2g/kg es el rango respaldado por la ciencia. Para 70kg: 112-154g al día. ¡Eres un héroe culto en nutrición!',
    state: 'dance',
    options: [
      { label: '🧠 Última pregunta',    id: 'quiz_3'    },
      { label: '🍎 Más sobre nutrición',id: 'nutrition' },
      { label: '← Inicio',           id: '__home'    },
    ],
  },
  quiz2_bajo: {
    text: 'Eso es muy poco para crecer. Con 0.5-0.8g/kg apenas mantienes la masa que ya tienes. Para construir músculo necesitas 1.6-2.2g/kg. ¡Sube esa proteína! 🥩',
    state: 'surprised',
    options: [
      { label: '🧠 Siguiente pregunta', id: 'quiz_3'  },
      { label: '🥩 Tips de proteína',  id: 'protein' },
      { label: '← Inicio',           id: '__home'  },
    ],
  },
  quiz2_exceso: {
    text: 'Más no es mejor aquí. Por encima de 2.5g/kg no hay beneficio adicional demostrado. La investigación dice 1.6-2.2g/kg es suficiente y óptimo. 🥩',
    state: 'thinking',
    options: [
      { label: '🧠 Siguiente pregunta',  id: 'quiz_3'  },
      { label: '🥩 Más sobre proteínas', id: 'protein' },
      { label: '← Inicio',            id: '__home'  },
    ],
  },
  quiz_3: {
    text: '¡Última! ¿Cuánto tiempo hay que mantener un estiramiento para ganar flexibilidad real? 🧘',
    state: 'thinking',
    options: [
      { label: 'A) 5-10 segundos',  id: 'quiz3_poco'  },
      { label: 'B) 20-30 segundos', id: 'quiz3_ok'    },
      { label: 'C) 2+ minutos',     id: 'quiz3_mucho' },
    ],
  },
  quiz3_ok: {
    text: '¡Perfecto! 🎉 20-30 segundos es el mínimo para que el músculo y la fascia cedan de verdad. Menos de 10s es solo activación; más de 60s lo reservas para flexibilidad pasiva profunda. ¡Test superado, héroe! 🏆',
    state: 'dance',
    options: [
      { label: '🏆 Ver mis Logros',      id: '__nav_logros' },
      { label: '🧘 Más estiramientos',   id: 'stretching'  },
      { label: '← Inicio',            id: '__home'      },
    ],
  },
  quiz3_poco: {
    text: '5-10 segundos activa la circulación pero no cambia la flexibilidad real. Para eso necesitas mínimo 20-30 segundos sostenidos — ahí el músculo "cede" de verdad. 🧘',
    state: 'surprised',
    options: [
      { label: '🧘 Más sobre estiramientos', id: 'stretching' },
      { label: '← Inicio',               id: '__home'     },
    ],
  },
  quiz3_mucho: {
    text: '2+ minutos está bien para flexibilidad pasiva profunda (PNF, yoga restaurativo), pero al final de un entreno normal con 20-30 segundos es suficiente. ¡No hace falta más! 🧘',
    state: 'thinking',
    options: [
      { label: '🧘 Más sobre estiramientos', id: 'stretching' },
      { label: '← Inicio',               id: '__home'     },
    ],
  },

  // ── Ayuda con la app ──────────────────────────────────────────────────────────
  app_help: {
    text: '¡Con gusto! ¿Sobre qué necesitas ayuda?',
    state: 'happy',
    options: [
      { label: '🎯 ¿Qué son las misiones?',      id: 'help_misiones' },
      { label: '💰 ¿Cómo gano monedas?',         id: 'coins_ganar'   },
      { label: '🏆 ¿Qué son los logros?',        id: 'help_logros'   },
      { label: '🎭 ¿Para qué sirven las skins?', id: 'help_skins'    },
      { label: '📊 ¿Cómo sube mi nivel?',        id: 'help_nivel'    },
      { label: '⚔️ ¿Qué es mi clase?',           id: 'mi_clase'      },
      { label: '← Inicio',                      id: '__home'        },
    ],
  },
  help_misiones: {
    text: 'Las misiones son retos diarios y semanales que te dan XP y monedas al completarlos. Van desde "haz 3 ejercicios hoy" hasta "mantén tu racha 7 días". Son la forma más eficiente de progresar — mucho más que ejercicios sueltos. 🎯',
    state: 'happy',
    options: [
      { label: '🎯 Ir a Misiones',        id: '__nav_misiones' },
      { label: '💰 ¿Cómo gano monedas?', id: 'coins_ganar'   },
      { label: '← Ayuda',              id: 'app_help'      },
    ],
  },
  help_logros: {
    text: 'Los logros son medallas permanentes que desbloqueas por hitos: primer entrenamiento, 7 días de racha, 10 ejercicios completados y más. Algunos dan monedas extra y desbloquean ítems especiales en la tienda. 🏆',
    state: 'happy',
    options: [
      { label: '🏆 Ver mis Logros', id: '__nav_logros' },
      { label: '← Ayuda',        id: 'app_help'    },
    ],
  },
  help_skins: {
    text: '¡Las skins cambian mi aspecto! (sí, el mío 😄) Cómpralas en la Tienda con monedas y equípalas en Mi Perfil → Guardarropa. ¡Me veo genial con todas! 🎭',
    state: 'dance',
    options: [
      { label: '🛒 Ver skins en Tienda', id: '__nav_tienda' },
      { label: '👤 Ir a mi Perfil',     id: '__nav_perfil' },
      { label: '← Ayuda',             id: 'app_help'    },
    ],
  },
  help_nivel: {
    text: 'Subes de nivel acumulando XP. Ganas XP completando ejercicios, rutinas y misiones. Cada nivel desbloquea más contenido y recompensas en monedas. Ve tu barra de progreso en el Dashboard. 📊',
    state: 'happy',
    options: [
      { label: '📊 Ver Dashboard',  id: '__nav_home'   },
      { label: '⚡ Mis stats ahora',id: 'mi_progreso'  },
      { label: '← Ayuda',        id: 'app_help'     },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPUESTAS ADMIN
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_RESPONSES = {
  nav_menu: {
    text: '¿A qué panel quieres ir? 🎮',
    state: 'talking',
    options: [
      { label: '📊 Dashboard',      id: '__nav_dashboard'  },
      { label: '👥 Usuarios',       id: '__nav_usuarios'   },
      { label: '🏋️ Ejercicios',     id: '__nav_ejercicios' },
      { label: '📋 Rutinas',        id: '__nav_rutinas'    },
      { label: '🎯 Misiones',       id: '__nav_misiones'   },
      { label: '📦 Objetos',        id: '__nav_objetos'    },
      { label: '🏆 Logros',         id: '__nav_logros'     },
      { label: '📈 Estadísticas',   id: '__nav_stats'      },
      { label: '⚙️ Configuración',  id: '__nav_config'     },
      { label: '← Volver',        id: '__home'           },
    ],
  },
  admin_charla: {
    text: '¡Siempre a full, admin! Gestionando héroes y asegurando que la plataforma esté impecable. ¿Algo concreto en lo que pueda ayudarte? 🛡️',
    state: 'happy',
    options: [
      { label: '🔧 Tips de gestión',        id: 'admin_tips'   },
      { label: '⚡ Acción rápida…',         id: 'admin_quick'  },
      { label: '❓ Preguntas sobre la app', id: 'admin_faq'    },
      { label: '← Inicio',               id: '__home'       },
    ],
  },
  admin_tips: {
    text: 'Tips de gestión en ForgeVenture: revisa las estadísticas semanalmente, añade nuevas misiones para mantener el engagement, y actualiza el catálogo de objetos con ítems de temporada. Los usuarios activos suben cuando hay novedades. 📊',
    state: 'talking',
    options: [
      { label: '📈 Ver estadísticas',   id: '__nav_stats'    },
      { label: '🎯 Gestionar misiones', id: '__nav_misiones' },
      { label: '📦 Catálogo objetos',   id: '__nav_objetos'  },
      { label: '← Volver',           id: 'admin_charla'   },
    ],
  },
  admin_quick: {
    text: '¿Qué quieres hacer rápido?',
    state: 'talking',
    options: [
      { label: '👥 Ver usuarios activos', id: '__nav_usuarios'   },
      { label: '📊 Revisar stats',        id: '__nav_stats'      },
      { label: '➕ Añadir ejercicio',     id: '__nav_ejercicios' },
      { label: '➕ Crear misión',         id: '__nav_misiones'   },
      { label: '⚙️ Ajustar config',       id: '__nav_config'     },
      { label: '← Volver',             id: 'admin_charla'     },
    ],
  },
  admin_faq: {
    text: '¿Sobre qué parte de la plataforma tienes dudas?',
    state: 'thinking',
    options: [
      { label: '👥 Sistema de usuarios', id: 'faq_users'    },
      { label: '💰 Sistema de monedas',  id: 'faq_coins'    },
      { label: '🎭 Sistema de skins',    id: 'faq_skins'    },
      { label: '📊 Métricas y stats',    id: 'faq_stats'    },
      { label: '← Volver',            id: 'admin_charla' },
    ],
  },
  faq_users: {
    text: 'Los usuarios tienen roles "user" y "admin". En el panel de Usuarios puedes editar clase, nivel, XP, racha, estado y monedas. Los admins tienen acceso completo al panel. 👥',
    state: 'talking',
    options: [
      { label: '👥 Ir a Usuarios', id: '__nav_usuarios' },
      { label: '← FAQ',          id: 'admin_faq'      },
    ],
  },
  faq_coins: {
    text: 'Las monedas son la divisa del juego. Los usuarios las ganan completando misiones y logros. Como admin puedes ajustar monedas manualmente desde el panel de Usuarios. Úsalo para premiar o corregir. 💰',
    state: 'talking',
    options: [
      { label: '👥 Gestionar monedas', id: '__nav_usuarios' },
      { label: '← FAQ',              id: 'admin_faq'      },
    ],
  },
  faq_skins: {
    text: 'Las skins se definen en el backend y se compran en la Tienda. Para añadir más skins agrega imágenes a /public/[nombre]/ y actualiza el catálogo en el backend. 🎭',
    state: 'talking',
    options: [
      { label: '← FAQ',    id: 'admin_faq' },
      { label: '← Inicio', id: '__home'   },
    ],
  },
  faq_stats: {
    text: 'Las estadísticas muestran usuarios activos, XP generado, misiones completadas y objetos comprados. Revísalas semanalmente. Si bajan los activos, añade misiones nuevas o un evento especial. 📈',
    state: 'talking',
    options: [
      { label: '📈 Ver Estadísticas', id: '__nav_stats' },
      { label: '← FAQ',            id: 'admin_faq'   },
    ],
  },
};

// ─── API pública ──────────────────────────────────────────────────────────────
export function getInitialMessage(role, u = null) {
  return role === 'admin' ? ADMIN_INITIAL : buildUserInitial(u);
}

export function getResponse(id, role, u = null) {
  if (id === '__home') return getInitialMessage(role, u);
  const table = role === 'admin' ? ADMIN_RESPONSES : USER_RESPONSES;
  const node  = table[id];
  if (!node) {
    return {
      text: 'Hmm, no encontré eso. Pero puedo ayudarte con otras cosas. 😅',
      state: 'thinking',
      options: [{ label: '← Inicio', id: '__home' }],
    };
  }
  return typeof node === 'function' ? node(u) : node;
}

// Compatibilidad con imports previos
export const INITIAL_MESSAGE = buildUserInitial(null);
