// src/services/skillTree.js
// ─────────────────────────────────────────────────────────────────────────────
// Definición del árbol de habilidades por clase y lógica de bonificación XP.
// Cada clase tiene 9 habilidades en 3 tiers. Las bonificaciones se aplican
// en completar-sesion y completar-rutina antes de los boosts activos.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos de bonus ────────────────────────────────────────────────────────────
//  "musculos"    → coincidencia con ejercicio.musculos[]
//  "categoria"   → coincidencia con ejercicio.categoria / nombre
//  "global"      → aplica siempre (todos los ejercicios)
//  "streak_bonus"→ aplica si userStreak >= minStreak

export const SKILL_TREES = {

  // ════════════════════════════════════════════════════════════
  // GUERRERO — fuerza, masa muscular, ejercicios compound
  // ════════════════════════════════════════════════════════════
  GUERRERO: {
    label: "Guerrero",
    color: "#E85D04",
    icon:  "⚔️",
    lore:  "El Guerrero forja su cuerpo en el yunque del hierro. Cada repetición es un golpe contra sus límites.",
    skills: [
      // ── TIER 1 ────────────────────────────────────────────
      {
        id: "G1", tier: 1, col: 0,
        name: "Fuerza Bruta",
        icon: "⚔️",
        levelReq: 2,
        requires: [],
        desc: "+5% XP en ejercicios de pecho y pectoral",
        flavorText: "El primer golpe siempre cuenta.",
        bonus: { type: "musculos", targets: ["pecho", "pectoral"], pct: 5 },
      },
      {
        id: "G2", tier: 1, col: 1,
        name: "Piernas de Acero",
        icon: "🦵",
        levelReq: 3,
        requires: [],
        desc: "+5% XP en ejercicios de piernas y glúteos",
        flavorText: "Un guerrero sin base es un castillo sin cimientos.",
        bonus: { type: "musculos", targets: ["piernas", "cuádriceps", "femoral", "isquiotibiales", "glúteos", "gemelos", "pantorrillas"], pct: 5 },
      },
      {
        id: "G3", tier: 1, col: 2,
        name: "Núcleo de Hierro",
        icon: "🛡️",
        levelReq: 4,
        requires: [],
        desc: "+5% XP en ejercicios de abdomen y core",
        flavorText: "El centro del guerrero es su escudo más poderoso.",
        bonus: { type: "musculos", targets: ["abdomen", "core", "oblicuos", "lumbar"], pct: 5 },
      },

      // ── TIER 2 ────────────────────────────────────────────
      {
        id: "G4", tier: 2, col: 0,
        name: "Golpe Titán",
        icon: "🔥",
        levelReq: 6,
        requires: ["G1"],
        desc: "+10% XP en pecho, brazos y press",
        flavorText: "Cada press banca es un paso hacia la leyenda.",
        bonus: { type: "musculos", targets: ["pecho", "pectoral", "tríceps", "bíceps", "brazos"], pct: 10 },
      },
      {
        id: "G5", tier: 2, col: 1,
        name: "Impulso Marcial",
        icon: "⚡",
        levelReq: 7,
        requires: ["G2"],
        desc: "+10% XP en piernas, sentadillas y peso muerto",
        flavorText: "La fuerza real empieza desde el suelo.",
        bonus: { type: "musculos", targets: ["piernas", "cuádriceps", "femoral", "isquiotibiales", "glúteos", "gemelos"], pct: 10 },
      },
      {
        id: "G6", tier: 2, col: 2,
        name: "Armadura Viva",
        icon: "🏰",
        levelReq: 8,
        requires: ["G3"],
        desc: "+10% XP en espalda, hombros y trapecio",
        flavorText: "Una espalda fuerte sostiene un reino entero.",
        bonus: { type: "musculos", targets: ["espalda", "dorsales", "hombros", "deltoides", "trapecio", "romboides"], pct: 10 },
      },

      // ── TIER 3 ────────────────────────────────────────────
      {
        id: "G7", tier: 3, col: 0,
        name: "Frenesí de Batalla",
        icon: "💢",
        levelReq: 12,
        requires: ["G4"],
        desc: "+20% XP en todos los ejercicios cuando racha ≥ 7 días",
        flavorText: "El guerrero constante desata una furia imparable.",
        bonus: { type: "streak_bonus", minStreak: 7, pct: 20 },
      },
      {
        id: "G8", tier: 3, col: 1,
        name: "Coloso",
        icon: "💪",
        levelReq: 14,
        requires: ["G5", "G6"],
        desc: "+15% XP en cualquier ejercicio de fuerza",
        flavorText: "Ya no entrenas para mejorar. Entrenas para dominar.",
        bonus: { type: "categoria", targets: ["fuerza", "musculación", "hipertrofia", "powerlifting", "press", "peso"], pct: 15 },
      },
      {
        id: "G9", tier: 3, col: 2,
        name: "Dominación Total",
        icon: "👑",
        levelReq: 18,
        requires: ["G7", "G8"],
        desc: "+25% XP en absolutamente cualquier ejercicio",
        flavorText: "El Guerrero en su cima no tiene rival.",
        bonus: { type: "global", pct: 25 },
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // ARQUERO — cardio, agilidad, resistencia, funcional
  // ════════════════════════════════════════════════════════════
  ARQUERO: {
    label: "Arquero",
    color: "#4CC9F0",
    icon:  "🏹",
    lore:  "El Arquero domina el espacio entre el reposo y el movimiento. Su arma es la precisión, su ventaja es la velocidad.",
    skills: [
      // ── TIER 1 ────────────────────────────────────────────
      {
        id: "A1", tier: 1, col: 0,
        name: "Puntería Perfecta",
        icon: "🏹",
        levelReq: 2,
        requires: [],
        desc: "+5% XP en ejercicios de cardio y resistencia",
        flavorText: "Apunta primero, dispara después.",
        bonus: { type: "categoria", targets: ["cardio", "resistencia", "aeróbico", "running", "carrera"], pct: 5 },
      },
      {
        id: "A2", tier: 1, col: 1,
        name: "Reflejos Ágiles",
        icon: "💨",
        levelReq: 3,
        requires: [],
        desc: "+5% XP en hombros y deltoides",
        flavorText: "Un arquero reacciona antes de que el peligro llegue.",
        bonus: { type: "musculos", targets: ["hombros", "deltoides", "trapecio", "manguito"], pct: 5 },
      },
      {
        id: "A3", tier: 1, col: 2,
        name: "Paso Ligero",
        icon: "🌀",
        levelReq: 4,
        requires: [],
        desc: "+5% XP en ejercicios funcionales y calistenia",
        flavorText: "Moverse en silencio, golpear con fuerza.",
        bonus: { type: "categoria", targets: ["funcional", "calistenia", "movilidad", "agilidad", "coordinación"], pct: 5 },
      },

      // ── TIER 2 ────────────────────────────────────────────
      {
        id: "A4", tier: 2, col: 0,
        name: "Flecha Certera",
        icon: "🎯",
        levelReq: 6,
        requires: ["A1"],
        desc: "+10% XP en cardio, HIIT y ejercicios aeróbicos",
        flavorText: "La flecha siempre encuentra su blanco.",
        bonus: { type: "categoria", targets: ["cardio", "hiit", "resistencia", "aeróbico", "running", "intervalos"], pct: 10 },
      },
      {
        id: "A5", tier: 2, col: 1,
        name: "Equilibrio Perfecto",
        icon: "⚖️",
        levelReq: 7,
        requires: ["A2"],
        desc: "+10% XP en hombros, espalda y postura",
        flavorText: "El arquero que no tiembla, nunca falla.",
        bonus: { type: "musculos", targets: ["hombros", "deltoides", "espalda", "dorsales", "trapecio", "postura"], pct: 10 },
      },
      {
        id: "A6", tier: 2, col: 2,
        name: "Cazador Implacable",
        icon: "🦅",
        levelReq: 8,
        requires: ["A3"],
        desc: "+10% XP en ejercicios funcionales, saltos y agilidad",
        flavorText: "El cazador no descansa. El cazador perfecciona.",
        bonus: { type: "categoria", targets: ["funcional", "calistenia", "movilidad", "saltos", "pliometría", "agilidad"], pct: 10 },
      },

      // ── TIER 3 ────────────────────────────────────────────
      {
        id: "A7", tier: 3, col: 0,
        name: "Lluvia de Flechas",
        icon: "🌧️",
        levelReq: 12,
        requires: ["A4"],
        desc: "+20% XP en cardio cuando la racha es ≥ 7 días",
        flavorText: "El arquero constante convierte el esfuerzo en arte.",
        bonus: { type: "streak_bonus", minStreak: 7, pct: 20 },
      },
      {
        id: "A8", tier: 3, col: 1,
        name: "Sombra Veloz",
        icon: "🌑",
        levelReq: 14,
        requires: ["A5", "A6"],
        desc: "+15% XP en cualquier ejercicio de resistencia o funcional",
        flavorText: "Imposible de seguir. Imposible de detener.",
        bonus: { type: "categoria", targets: ["cardio", "resistencia", "funcional", "hiit", "calistenia", "movilidad"], pct: 15 },
      },
      {
        id: "A9", tier: 3, col: 2,
        name: "Ojo del Halcón",
        icon: "🦉",
        levelReq: 18,
        requires: ["A7", "A8"],
        desc: "+25% XP en absolutamente cualquier ejercicio",
        flavorText: "El Arquero en su plenitud lo ve todo. Lo alcanza todo.",
        bonus: { type: "global", pct: 25 },
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // MAGO — flexibilidad, mente, movilidad, bienestar
  // ════════════════════════════════════════════════════════════
  MAGO: {
    label: "Mago",
    color: "#9B59B6",
    icon:  "🧘",
    lore:  "El Mago comprende que el cuerpo es el templo de la mente. Su entrenamiento es meditación en movimiento.",
    skills: [
      // ── TIER 1 ────────────────────────────────────────────
      {
        id: "M1", tier: 1, col: 0,
        name: "Mente Clara",
        icon: "🧘",
        levelReq: 2,
        requires: [],
        desc: "+5% XP en flexibilidad, yoga y movilidad",
        flavorText: "La claridad mental es la primera habilidad del mago.",
        bonus: { type: "categoria", targets: ["flexibilidad", "yoga", "movilidad", "estiramiento", "stretching"], pct: 5 },
      },
      {
        id: "M2", tier: 1, col: 1,
        name: "Flujo Vital",
        icon: "🌊",
        levelReq: 3,
        requires: [],
        desc: "+5% XP en respiración, yoga y meditación",
        flavorText: "La energía sigue al aliento. El aliento guía la vida.",
        bonus: { type: "categoria", targets: ["respiración", "yoga", "meditación", "mente", "mindfulness"], pct: 5 },
      },
      {
        id: "M3", tier: 1, col: 2,
        name: "Disciplina Mental",
        icon: "🔮",
        levelReq: 4,
        requires: [],
        desc: "+5% XP en core, abdomen y equilibrio",
        flavorText: "La voluntad del mago empieza en su centro.",
        bonus: { type: "musculos", targets: ["abdomen", "core", "oblicuos", "lumbar", "estabilizadores"], pct: 5 },
      },

      // ── TIER 2 ────────────────────────────────────────────
      {
        id: "M4", tier: 2, col: 0,
        name: "Concentración",
        icon: "💎",
        levelReq: 6,
        requires: ["M1"],
        desc: "+10% XP en flexibilidad, pilates y movilidad articular",
        flavorText: "Un solo punto de enfoque puede mover montañas.",
        bonus: { type: "categoria", targets: ["flexibilidad", "yoga", "pilates", "movilidad", "estiramiento"], pct: 10 },
      },
      {
        id: "M5", tier: 2, col: 1,
        name: "Armonía Interior",
        icon: "☯️",
        levelReq: 7,
        requires: ["M2"],
        desc: "+10% XP en actividades de mente-cuerpo y bienestar",
        flavorText: "Cuando mente y cuerpo son uno, nada puede resistirse.",
        bonus: { type: "categoria", targets: ["respiración", "yoga", "meditación", "mente", "bienestar", "mindfulness", "relajación"], pct: 10 },
      },
      {
        id: "M6", tier: 2, col: 2,
        name: "Voluntad Indomable",
        icon: "⚡",
        levelReq: 8,
        requires: ["M3"],
        desc: "+10% XP en core, cuerpo completo y estabilidad",
        flavorText: "La mente que no se rinde tampoco deja caer el cuerpo.",
        bonus: { type: "musculos", targets: ["abdomen", "core", "oblicuos", "lumbar", "cuerpo completo", "estabilizadores"], pct: 10 },
      },

      // ── TIER 3 ────────────────────────────────────────────
      {
        id: "M7", tier: 3, col: 0,
        name: "Trance Místico",
        icon: "🌟",
        levelReq: 12,
        requires: ["M4"],
        desc: "+20% XP en flexibilidad cuando la racha es ≥ 7 días",
        flavorText: "El mago en trance trasciende el dolor físico.",
        bonus: { type: "streak_bonus", minStreak: 7, pct: 20 },
      },
      {
        id: "M8", tier: 3, col: 1,
        name: "Conjuro del Poder",
        icon: "✨",
        levelReq: 14,
        requires: ["M5", "M6"],
        desc: "+15% XP en todo tipo de ejercicio mente-cuerpo",
        flavorText: "El conjuro lleva semanas. El resultado: eterno.",
        bonus: { type: "categoria", targets: ["flexibilidad", "yoga", "pilates", "respiración", "meditación", "funcional", "movilidad"], pct: 15 },
      },
      {
        id: "M9", tier: 3, col: 2,
        name: "Arcano Supremo",
        icon: "👑",
        levelReq: 18,
        requires: ["M7", "M8"],
        desc: "+25% XP en absolutamente cualquier ejercicio",
        flavorText: "El Mago Supremo convierte cada movimiento en magia.",
        bonus: { type: "global", pct: 25 },
      },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTreeForClass(heroClass = "GUERRERO") {
  return SKILL_TREES[(heroClass || "GUERRERO").toUpperCase()] || SKILL_TREES.GUERRERO;
}

export function getSkillById(heroClass, skillId) {
  const tree = getTreeForClass(heroClass);
  return tree.skills.find(s => s.id === skillId) || null;
}

/**
 * Calcula el bonus % de XP total basado en las habilidades desbloqueadas.
 * @param {string[]} unlockedSkills - IDs de habilidades desbloqueadas
 * @param {object}   ejercicioData  - Datos del ejercicio (musculos[], nombre, categoria, categoriaId)
 * @param {string}   heroClass      - Clase del usuario
 * @param {number}   userStreak     - Racha actual del usuario (días consecutivos)
 * @returns {number} Bonus porcentaje total (e.g. 15 = +15%)
 */
export function getSkillXpBonus(unlockedSkills = [], ejercicioData = {}, heroClass = "GUERRERO", userStreak = 0) {
  if (!unlockedSkills || unlockedSkills.length === 0) return 0;

  const tree = getTreeForClass(heroClass);
  let totalPct = 0;

  // Normalizar datos del ejercicio para comparación
  const ejMusculos = (ejercicioData.musculos || []).map(m => m.toLowerCase().trim());
  const ejCategoria = (ejercicioData.categoria || ejercicioData.categoriaId || ejercicioData.categoriaName || "").toLowerCase().trim();
  const ejNombre   = (ejercicioData.nombre || "").toLowerCase().trim();
  // Texto combinado para búsquedas de categoria
  const ejFullText = `${ejCategoria} ${ejNombre}`;

  for (const skillId of unlockedSkills) {
    const skill = tree.skills.find(s => s.id === skillId);
    if (!skill) continue;

    const { bonus } = skill;

    if (bonus.type === "global") {
      totalPct += bonus.pct;

    } else if (bonus.type === "streak_bonus") {
      if (userStreak >= bonus.minStreak) {
        totalPct += bonus.pct;
      }

    } else if (bonus.type === "musculos") {
      const targets = bonus.targets.map(t => t.toLowerCase());
      const matches = targets.some(target =>
        ejMusculos.some(m => m.includes(target) || target.includes(m))
      );
      if (matches) totalPct += bonus.pct;

    } else if (bonus.type === "categoria") {
      const targets = bonus.targets.map(t => t.toLowerCase());
      const matches = targets.some(target =>
        ejFullText.includes(target) || target.includes(ejCategoria)
      );
      if (matches) totalPct += bonus.pct;
    }
  }

  return totalPct; // e.g. 15 means +15%
}
