// ─────────────────────────────────────────────────────────────────────────────
//  exerciseLogic.js  —  Motor de detección de ejercicios con MediaPipe Pose
//
//  Cada detector incluye:
//    • joints: A–B–C para calcular el ángulo principal (izq + der)
//    • umbrales DOWN / UP con histéresis (≥50° de brecha)
//    • smoothN: frames de suavizado específicos por ejercicio
//    • positionCheck(lm2D): valida orientación corporal ANTES de contar reps
//    • formChecks: validadores de técnica frame a frame
// ─────────────────────────────────────────────────────────────────────────────

// ── Índices de landmarks MediaPipe Pose (33 puntos) ──────────────────────────
export const LM = {
  NOSE:            0,
  LEFT_EYE:        2,  RIGHT_EYE:       5,
  LEFT_SHOULDER:  11,  RIGHT_SHOULDER: 12,
  LEFT_ELBOW:     13,  RIGHT_ELBOW:    14,
  LEFT_WRIST:     15,  RIGHT_WRIST:    16,
  LEFT_HIP:       23,  RIGHT_HIP:      24,
  LEFT_KNEE:      25,  RIGHT_KNEE:     26,
  LEFT_ANKLE:     27,  RIGHT_ANKLE:    28,
  LEFT_HEEL:      29,  RIGHT_HEEL:     30,
  LEFT_FOOT:      31,  RIGHT_FOOT:     32,
};

// ── Conexiones para dibujar el esqueleto ─────────────────────────────────────
export const SKELETON_CONNECTIONS = [
  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW],   [LM.LEFT_ELBOW,    LM.LEFT_WRIST],
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],  [LM.RIGHT_ELBOW,   LM.RIGHT_WRIST],
  [LM.LEFT_SHOULDER,  LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER,  LM.LEFT_HIP],     [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP,       LM.RIGHT_HIP],
  [LM.LEFT_HIP,       LM.LEFT_KNEE],    [LM.LEFT_KNEE,  LM.LEFT_ANKLE],
  [LM.RIGHT_HIP,      LM.RIGHT_KNEE],   [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  [LM.LEFT_ANKLE,     LM.LEFT_HEEL],    [LM.LEFT_HEEL,  LM.LEFT_FOOT],
  [LM.RIGHT_ANKLE,    LM.RIGHT_HEEL],   [LM.RIGHT_HEEL, LM.RIGHT_FOOT],
];

// ── Ángulo 3D en el punto B entre A–B–C (usa z si disponible) ────────────────
export function calculateAngle(a, b, c) {
  const az = a.z ?? 0, bz = b.z ?? 0, cz = c.z ?? 0;
  const ba = { x: a.x - b.x, y: a.y - b.y, z: az - bz };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: cz - bz };
  const dot   = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
  if (magBA === 0 || magBC === 0) return 180;
  return Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * (180 / Math.PI);
}

// ── Ángulo promedio izq + der, con fallback a un solo lado si no hay visibilidad
function avgAngle(lm, left3, right3) {
  const lA   = calculateAngle(lm[left3[0]],  lm[left3[1]],  lm[left3[2]]);
  const rA   = calculateAngle(lm[right3[0]], lm[right3[1]], lm[right3[2]]);
  const lVis = lm[left3[1]]?.visibility  ?? 1;
  const rVis = lm[right3[1]]?.visibility ?? 1;
  if (lVis < 0.3) return rA;
  if (rVis < 0.3) return lA;
  return (lA + rA) / 2;
}

// ── Diferencia entre ángulos izq y der (asimetría) ───────────────────────────
function asymmetry(lm, left3, right3) {
  const lA = calculateAngle(lm[left3[0]], lm[left3[1]], lm[left3[2]]);
  const rA = calculateAngle(lm[right3[0]], lm[right3[1]], lm[right3[2]]);
  return Math.abs(lA - rA);
}

// ── Detección de orientación corporal (usa coordenadas 2D de pantalla) ────────
// lm2D: poseLandmarks normalizados (x,y en 0-1, y aumenta hacia abajo)

/** Cuerpo vertical: tobillo significativamente más bajo que hombro → de pie / sentadilla */
export function bodyVerticalCheck(lm) {
  const sY = ((lm[LM.LEFT_SHOULDER]?.y ?? 0.3) + (lm[LM.RIGHT_SHOULDER]?.y ?? 0.3)) / 2;
  const aY = ((lm[LM.LEFT_ANKLE]?.y  ?? 0.9) + (lm[LM.RIGHT_ANKLE]?.y  ?? 0.9)) / 2;
  return (aY - sY) > 0.18; // tolerancia ampliada — encuadres imperfectos siguen contando
}

/** Cuerpo horizontal: tobillo y hombro al nivel similar → posición de plancha */
export function bodyHorizontalCheck(lm) {
  const sY = ((lm[LM.LEFT_SHOULDER]?.y ?? 0.5) + (lm[LM.RIGHT_SHOULDER]?.y ?? 0.5)) / 2;
  const aY = ((lm[LM.LEFT_ANKLE]?.y  ?? 0.6) + (lm[LM.RIGHT_ANKLE]?.y  ?? 0.6)) / 2;
  return (aY - sY) < 0.27; // tolerancia ampliada — encuadres imperfectos siguen contando
}

/** Cadera suficientemente por debajo de los hombros (verificación adicional para sentadilla) */
function hipDropCheck(lm) {
  const sY = ((lm[LM.LEFT_SHOULDER]?.y ?? 0.3) + (lm[LM.RIGHT_SHOULDER]?.y ?? 0.3)) / 2;
  const hY = ((lm[LM.LEFT_HIP]?.y  ?? 0.55) + (lm[LM.RIGHT_HIP]?.y  ?? 0.55)) / 2;
  return (hY - sY) > 0.06; // tolerancia ampliada
}

/** Cuerpo invertido: tobillos por encima de hombros → parada de manos */
export function bodyInvertedCheck(lm) {
  const sY = ((lm[LM.LEFT_SHOULDER]?.y ?? 0.7) + (lm[LM.RIGHT_SHOULDER]?.y ?? 0.7)) / 2;
  const aY = ((lm[LM.LEFT_ANKLE]?.y  ?? 0.2) + (lm[LM.RIGHT_ANKLE]?.y  ?? 0.2)) / 2;
  return (sY - aY) > 0.14; // tolerancia ampliada
}

// ── Fábrica de detector ───────────────────────────────────────────────────────
function makeDet({
  name, leftJoints, rightJoints,
  downThreshold, upThreshold, inverted = false,
  angleLabel, downCue, upCue,
  repCue        = "¡Rep contada! 🎯",
  highlightColor = "#FF9F1C",
  smoothN,          // override de SMOOTH_N (frames a promediar)
  positionCheck,    // (lm2D) => { ok: bool, msg: string } — valida posición corporal
  formChecks = [],
}) {
  return {
    name, leftJoints, rightJoints, angleLabel,
    downCue, upCue, repCue, highlightColor, formChecks,
    smoothN,
    positionCheck,

    getAngle:           (lm) => avgAngle(lm, leftJoints, rightJoints),
    isDown:             (ang) => inverted ? ang >= downThreshold : ang <= downThreshold,
    isUp:               (ang) => inverted ? ang <= upThreshold   : ang >= upThreshold,
    getHighlightJoints: ()   => [leftJoints[1], rightJoints[1]],
    getAngleLabelJoint: ()   => leftJoints[1],

    evaluateForm(lm, phase) {
      return formChecks
        .filter(fc => fc.when === "always" || fc.when === phase)
        .map(fc => { try { return fc.check(lm); } catch { return null; } })
        .filter(Boolean);
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  CATÁLOGO DE DETECTORES
// ═════════════════════════════════════════════════════════════════════════════

const D = {};

// ── 1. SENTADILLAS ────────────────────────────────────────────────────────────
// • DOWN bajado a 105° (era 120°) → requiere al menos media sentadilla real
// • smoothN: 10 frames (movimiento lento)
// • positionCheck: cuerpo debe ser vertical (de pie / en cuclillas)
// • Segunda confirmación: ángulo de cadera también debe flexionarse
D.sentadillas = makeDet({
  name: "Sentadillas",
  leftJoints:  [LM.LEFT_HIP,  LM.LEFT_KNEE,  LM.LEFT_ANKLE],
  rightJoints: [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  downThreshold: 122, upThreshold: 148,
  angleLabel: "Ángulo rodilla", highlightColor: "#E85D04",
  smoothN: 10,
  downCue: "↑ Sube, extiende las piernas completamente",
  upCue:   "↓ Baja hasta que los muslos queden paralelos al suelo",
  repCue:  "¡Sentadilla contada! 🦵",

  positionCheck(lm2D) {
    // El cuerpo debe estar vertical (de pie / sentadilla)
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Ponte de pie para contar sentadillas — la cámara debe verte de frente o de lado" };
    }
    // La cadera debe estar visible y por debajo del hombro
    if (!hipDropCheck(lm2D)) {
      return { ok: false, msg: "Asegúrate de que tu cuerpo completo sea visible en cámara" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        // Profundidad de rodilla
        const ang = avgAngle(lm,
          [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
          [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE]);
        if (ang > 145) return { ok: false, msg: "Baja más — llega al paralelo para que cuente", severity: "warning" };
        if (ang > 128) return { ok: false, msg: "Casi paralelo, baja un poco más",              severity: "info"    };
        return { ok: true, msg: "¡Profundidad correcta! 💚", severity: "ok" };
      },
    },
    {
      when: "down",
      check(lm) {
        // Confirmación con ángulo de cadera (SHOULDER→HIP→KNEE)
        // En sentadilla correcta, la cadera también debe flexionarse
        const lHip = calculateAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
        const rHip = calculateAngle(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE]);
        const hipAng = (lHip + rHip) / 2;
        // En squat paralelo la cadera debería estar flexionada (~70-110°)
        if (hipAng > 158) return { ok: false, msg: "Flexiona más las caderas al bajar", severity: "info" };
        return null;
      },
    },
    {
      when: "always",
      check(lm) {
        // Simetría de rodillas
        const diff = asymmetry(lm,
          [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
          [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE]);
        if (diff > 36) return { ok: false, msg: "Distribuye el peso igual en ambas piernas", severity: "warning" };
        return null;
      },
    },
    {
      when: "always",
      check(lm) {
        // Inclinación del torso — hombro no debe caer muy por delante de la cadera
        const lAng = calculateAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
        const rAng = calculateAngle(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE]);
        const ang = (lAng + rAng) / 2;
        if (ang < 20) return { ok: false, msg: "¡Espalda más recta! No te inclines tanto hacia adelante", severity: "warning" };
        if (ang < 40) return { ok: false, msg: "Intenta mantener el torso más erguido",                   severity: "info"    };
        return null;
      },
    },
    {
      when: "up",
      check(lm) {
        // Extensión completa: rodillas deben estar casi rectas al subir
        const ang = avgAngle(lm,
          [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
          [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE]);
        if (ang < 136) return { ok: false, msg: "Extiende completamente las piernas al subir", severity: "info" };
        return { ok: true, msg: "¡Buena extensión! 💚", severity: "ok" };
      },
    },
  ],
});

// ── 2. FLEXIONES ──────────────────────────────────────────────────────────────
// • positionCheck: cuerpo debe ser horizontal (plancha)
// • smoothN: 7 frames (ritmo moderado)
// • Nuevo check: ancho de muñecas relativo a hombros
D.flexiones = makeDet({
  name: "Flexiones",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 115, upThreshold: 145,
  angleLabel: "Ángulo codo", highlightColor: "#4CC9F0",
  smoothN: 7,
  downCue: "↑ Empuja el suelo, extiende los brazos completamente",
  upCue:   "↓ Baja el pecho al suelo de forma controlada",
  repCue:  "¡Flexión contada! 💪",

  positionCheck(lm2D) {
    // El cuerpo debe estar horizontal (posición de plancha)
    if (!bodyHorizontalCheck(lm2D)) {
      return { ok: false, msg: "Colócate en posición de plancha (horizontal) — cámara desde el lado" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        // Profundidad de codo — pecho debe llegar al suelo
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang > 132) return { ok: false, msg: "Baja más — lleva el pecho al suelo", severity: "warning" };
        if (ang > 118) return { ok: false, msg: "Un poco más abajo para completar la rep",  severity: "info"    };
        return { ok: true, msg: "¡Buena profundidad! 💚", severity: "ok" };
      },
    },
    {
      when: "up",
      check(lm) {
        // Extensión completa arriba
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang < 128) return { ok: false, msg: "Extiende los brazos completamente arriba", severity: "info" };
        return { ok: true, msg: "Buena extensión", severity: "ok" };
      },
    },
    {
      when: "always",
      check(lm) {
        // Simetría de codos
        const diff = asymmetry(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (diff > 34) return { ok: false, msg: "Mantén ambos codos paralelos al cuerpo", severity: "warning" };
        return null;
      },
    },
    {
      when: "always",
      check(lm) {
        // Alineación cadera: hombro–cadera–rodilla recto (~170-180°)
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE],
          [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE]);
        if (ang < 115) return { ok: false, msg: "No hundas las caderas — mantén el cuerpo en línea recta", severity: "warning" };
        if (ang < 135) return { ok: false, msg: "Sube ligeramente las caderas para alinear el cuerpo",       severity: "info"    };
        return null;
      },
    },
    {
      when: "always",
      check(lm) {
        // Ancho de muñecas vs hombros — manos al ancho de hombros (aproximado)
        const lW = lm[LM.LEFT_WRIST]?.x,  rW = lm[LM.RIGHT_WRIST]?.x;
        const lS = lm[LM.LEFT_SHOULDER]?.x, rS = lm[LM.RIGHT_SHOULDER]?.x;
        if (!lW || !rW || !lS || !rS) return null;
        const wristSpan   = Math.abs(lW - rW);
        const shoulderSpan = Math.abs(lS - rS);
        if (shoulderSpan < 0.01) return null; // evitar división por cero
        const ratio = wristSpan / shoulderSpan;
        if (ratio > 2.3) return { ok: false, msg: "Acerca las manos — demasiado abiertas para flexiones", severity: "info" };
        if (ratio < 0.45) return { ok: false, msg: "Separa un poco más las manos",                         severity: "info" };
        return null;
      },
    },
  ],
});

// ── 3. DOMINADAS ─────────────────────────────────────────────────────────────
D.dominadas = makeDet({
  name: "Dominadas",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 145, upThreshold: 110, inverted: true,
  angleLabel: "Ángulo codo", highlightColor: "#9B59B6",
  smoothN: 8,
  downCue: "↑ Sube, lleva el mentón por encima de la barra",
  upCue:   "↓ Baja controlado hasta extender completamente los brazos",
  repCue:  "¡Dominada contada! 🔝",

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Cuélgate de la barra con el cuerpo recto — asegúrate de ser visible de cuerpo entero" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang < 115) return { ok: false, msg: "Extiende completamente los brazos al bajar", severity: "warning" };
        return { ok: true, msg: "Buena extensión en la bajada", severity: "ok" };
      },
    },
    {
      when: "up",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang > 125) return { ok: false, msg: "Sube más — el mentón debe superar la barra", severity: "warning" };
        return { ok: true, msg: "¡Altura correcta! 💚", severity: "ok" };
      },
    },
    {
      when: "always",
      check(lm) {
        const diff = asymmetry(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (diff > 34) return { ok: false, msg: "Jala simétricamente con ambos brazos", severity: "warning" };
        return null;
      },
    },
  ],
});

// ── 4. PRESS MILITAR ─────────────────────────────────────────────────────────
D.pressmilitar = makeDet({
  name: "Press Militar",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 118, upThreshold: 145,
  angleLabel: "Ángulo codo", highlightColor: "#4CC9F0",
  smoothN: 9,
  downCue: "↑ Empuja hacia arriba hasta extender completamente",
  upCue:   "↓ Baja el peso hasta los hombros controladamente",
  repCue:  "¡Press contado! 🏋️",

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Ponte de pie (o siéntate erguido) para el press militar" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang > 133) return { ok: false, msg: "Baja más el peso, hasta los hombros", severity: "warning" };
        return { ok: true, msg: "Buen rango de movimiento", severity: "ok" };
      },
    },
    {
      when: "up",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang < 128) return { ok: false, msg: "Extiende los brazos completamente arriba", severity: "info" };
        return { ok: true, msg: "¡Extensión completa! 💚", severity: "ok" };
      },
    },
    {
      when: "always",
      check(lm) {
        const diff = asymmetry(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (diff > 36) return { ok: false, msg: "Empuja de forma simétrica con ambos brazos", severity: "warning" };
        return null;
      },
    },
  ],
});

// ── 5. BANCO PLANO ────────────────────────────────────────────────────────────
D.bancoplano = makeDet({
  name: "Banco Plano",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 110, upThreshold: 140,
  angleLabel: "Ángulo codo", highlightColor: "#4CC9F0",
  smoothN: 8,
  downCue: "↑ Empuja la barra hacia arriba",
  upCue:   "↓ Baja la barra hasta el pecho lentamente",
  repCue:  "¡Rep de banco contada! 💪",

  positionCheck(lm2D) {
    if (!bodyHorizontalCheck(lm2D)) {
      return { ok: false, msg: "Túmbate en el banco y sitúa la cámara de lado para el banco plano" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang > 125) return { ok: false, msg: "Baja más la barra hasta el pecho", severity: "warning" };
        return { ok: true, msg: "Buen recorrido", severity: "ok" };
      },
    },
    {
      when: "always",
      check(lm) {
        const diff = asymmetry(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (diff > 34) return { ok: false, msg: "Mantén el agarre simétrico", severity: "warning" };
        return null;
      },
    },
  ],
});

// ── 6. PESO MUERTO (hip hinge) ────────────────────────────────────────────────
D.pesomunerto = makeDet({
  name: "Peso Muerto",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_HIP, LM.LEFT_KNEE],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE],
  downThreshold: 105, upThreshold: 140,
  angleLabel: "Ángulo cadera", highlightColor: "#E74C3C",
  smoothN: 10,
  downCue: "↑ Extiende las caderas — levanta el torso y aprieta los glúteos",
  upCue:   "↓ Flexiona las caderas y rodillas, lleva el peso hacia el suelo",
  repCue:  "¡Peso muerto contado! ⚔️",

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Ponte de pie con la barra — cámara desde el lateral" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = calculateAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
        if (ang < 12) return { ok: false, msg: "¡Espalda recta! No redondees la zona lumbar", severity: "warning" };
        if (ang < 24) return { ok: false, msg: "Mantén más recta la espalda baja",             severity: "info"    };
        return { ok: true, msg: "Buena postura de espalda", severity: "ok" };
      },
    },
    {
      when: "up",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE],
          [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE]);
        if (ang < 136) return { ok: false, msg: "Extiende completamente las caderas — aprieta glúteos arriba", severity: "info" };
        return { ok: true, msg: "¡Extensión completa! 💚", severity: "ok" };
      },
    },
  ],
});

// ── 7. FONDOS EN PARALELAS ────────────────────────────────────────────────────
D.fondosenparalelas = makeDet({
  name: "Fondos en Paralelas",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 115, upThreshold: 140,
  angleLabel: "Ángulo codo", highlightColor: "#FFD700",
  smoothN: 7,
  downCue: "↑ Empuja hacia arriba extendiendo los tríceps",
  upCue:   "↓ Baja hasta que los codos lleguen a 90°",
  repCue:  "¡Fondo contado! 💪",

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Súbete a las paralelas con el cuerpo vertical — cámara desde el lado" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang > 128) return { ok: false, msg: "Baja más — codos a 90° para una rep completa", severity: "warning" };
        return { ok: true, msg: "¡Profundidad correcta! 💚", severity: "ok" };
      },
    },
    {
      when: "always",
      check(lm) {
        const diff = asymmetry(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (diff > 34) return { ok: false, msg: "Distribuye el peso por igual en ambos brazos", severity: "warning" };
        return null;
      },
    },
  ],
});

// ── 8. BURPEES ───────────────────────────────────────────────────────────────
D.burpees = makeDet({
  name: "Burpees",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_HIP, LM.LEFT_KNEE],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE],
  downThreshold: 128, upThreshold: 150,
  angleLabel: "Ángulo cadera", highlightColor: "#E74C3C",
  smoothN: 5,
  downCue: "↑ Salta explosivamente con los brazos arriba",
  upCue:   "↓ Baja al suelo, coloca las manos y estira las piernas",
  repCue:  "¡Burpee contado! 💥",
  formChecks: [
    {
      when: "up",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE],
          [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE]);
        if (ang < 132) return { ok: false, msg: "Extiende el cuerpo completamente en el salto", severity: "warning" };
        return { ok: true, msg: "¡Buena extensión en el salto! 💚", severity: "ok" };
      },
    },
  ],
});

// ── 9. MOUNTAIN CLIMBERS ─────────────────────────────────────────────────────
D.mountainclimbers = makeDet({
  name: "Mountain Climbers",
  leftJoints:  [LM.LEFT_HIP,  LM.LEFT_KNEE,  LM.LEFT_ANKLE],
  rightJoints: [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  downThreshold: 105, upThreshold: 140,
  angleLabel: "Ángulo rodilla", highlightColor: "#E74C3C",
  smoothN: 4,

  positionCheck(lm2D) {
    if (!bodyHorizontalCheck(lm2D)) {
      return { ok: false, msg: "Colócate en posición de plancha para Mountain Climbers" };
    }
    return { ok: true };
  },

  downCue: "↔ Alterna — lleva la otra rodilla al pecho",
  upCue:   "↓ Lleva la rodilla hacia el pecho explosivamente",
  repCue:  "¡Climber contado! ⛰️",
  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = Math.min(
          calculateAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]),
          calculateAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE])
        );
        if (ang > 120) return { ok: false, msg: "Lleva más la rodilla al pecho", severity: "warning" };
        return { ok: true, msg: "¡Buena llegada al pecho! 💚", severity: "ok" };
      },
    },
    {
      when: "always",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE],
          [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE]);
        if (ang < 120) return { ok: false, msg: "No levantes tanto las caderas — mantén la plancha", severity: "warning" };
        return null;
      },
    },
  ],
});

// ── 10. ZANCADAS ─────────────────────────────────────────────────────────────
D.zancadas = makeDet({
  name: "Zancadas",
  leftJoints:  [LM.LEFT_HIP,  LM.LEFT_KNEE,  LM.LEFT_ANKLE],
  rightJoints: [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  downThreshold: 130, upThreshold: 148,
  angleLabel: "Ángulo rodilla", highlightColor: "#E85D04",
  smoothN: 9,

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Ponte de pie para hacer zancadas" };
    }
    return { ok: true };
  },

  downCue: "↑ Sube, regresa a posición inicial",
  upCue:   "↓ Da el paso y baja la rodilla hacia el suelo",
  repCue:  "¡Zancada contada! 🦵",
  formChecks: [
    {
      when: "down",
      check(lm) {
        const leftAng  = calculateAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
        const rightAng = calculateAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]);
        const front    = Math.min(leftAng, rightAng);
        if (front > 150) return { ok: false, msg: "Baja más la rodilla trasera hacia el suelo", severity: "warning" };
        if (front > 135) return { ok: false, msg: "Un poco más abajo en la zancada",             severity: "info"    };
        return { ok: true, msg: "¡Buena profundidad! 💚", severity: "ok" };
      },
    },
  ],
});

// ── 11. MUSCLE UP ─────────────────────────────────────────────────────────────
D.muscleup = makeDet({
  name: "Muscle Up",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 145, upThreshold: 108, inverted: true,
  angleLabel: "Ángulo codo", highlightColor: "#FFD700",
  smoothN: 7,
  downCue: "↑ Explosivo — sube y supera la barra con el torso",
  upCue:   "↓ Baja controlado, extiende los brazos completamente",
  repCue:  "¡Muscle Up contado! 🏆",

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Cuélgate de la barra con el cuerpo recto para el Muscle Up" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "up",
      check(lm) {
        const ang = avgAngle(lm,
          [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST],
          [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST]);
        if (ang > 122) return { ok: false, msg: "Sube el torso por encima de la barra completamente", severity: "warning" };
        return { ok: true, msg: "¡Muscle Up completo! 🏆", severity: "ok" };
      },
    },
  ],
});

// ── 12. CALISTENIA BÁSICA ─────────────────────────────────────────────────────
D.calisteniabasica = makeDet({
  name: "Calistenia Básica",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 108, upThreshold: 148,
  angleLabel: "Ángulo codo", highlightColor: "#4CC9F0",
  smoothN: 7,
  downCue: "↑ Empuja el suelo, extiende los brazos",
  upCue:   "↓ Baja al suelo controladamente",
  repCue:  "¡Rep de calistenia contada! 🤸",
  positionCheck: D.flexiones.positionCheck,
  formChecks: D.flexiones.formChecks,
});

// ── 13. SALTAR LA CUERDA ─────────────────────────────────────────────────────
D.saltarlacuerda = makeDet({
  name: "Saltar la Cuerda",
  leftJoints:  [LM.LEFT_HIP,  LM.LEFT_KNEE,  LM.LEFT_ANKLE],
  rightJoints: [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
  downThreshold: 148, upThreshold: 162,
  angleLabel: "Ángulo rodilla", highlightColor: "#4CC9F0",
  smoothN: 3, // saltos rápidos — mínimo suavizado

  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) {
      return { ok: false, msg: "Ponte de pie para saltar la cuerda" };
    }
    return { ok: true };
  },

  downCue: "↑ Salta — impulsa con los pies",
  upCue:   "↓ Prepara el siguiente salto",
  repCue:  "¡Salto contado! 🪀",
  formChecks: [
    {
      when: "always",
      check(lm) {
        const diff = asymmetry(lm,
          [LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE],
          [LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE]);
        if (diff > 30) return { ok: false, msg: "Mantén el peso equilibrado en ambas piernas", severity: "warning" };
        return null;
      },
    },
  ],
});

// ── 14. HANDSTAND HOLDS ───────────────────────────────────────────────────────
D.handstandholds = makeDet({
  name: "Handstand Holds",
  leftJoints:  [LM.LEFT_WRIST,  LM.LEFT_ELBOW,  LM.LEFT_SHOULDER],
  rightJoints: [LM.RIGHT_WRIST, LM.RIGHT_ELBOW, LM.RIGHT_SHOULDER],
  downThreshold: 148, upThreshold: 155,
  angleLabel: "Alineación brazo", highlightColor: "#FFD700",
  smoothN: 10,
  downCue: "Estira completamente los brazos",
  upCue:   "Mantén el equilibrio — cuerpo completamente recto",
  repCue:  "¡Hold completado! 🙃",

  positionCheck(lm2D) {
    if (!bodyInvertedCheck(lm2D)) {
      return { ok: false, msg: "Entra en parada de manos — tobillos deben estar por encima de los hombros" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "always",
      check(lm) {
        const diff = asymmetry(lm,
          [LM.LEFT_WRIST, LM.LEFT_ELBOW, LM.LEFT_SHOULDER],
          [LM.RIGHT_WRIST, LM.RIGHT_ELBOW, LM.RIGHT_SHOULDER]);
        if (diff > 30) return { ok: false, msg: "Alinea ambos brazos simétricamente", severity: "warning" };
        return { ok: true, msg: "Buena alineación de brazos", severity: "ok" };
      },
    },
  ],
});

// ── 15. TRX SUSPENSION ────────────────────────────────────────────────────────
D.trxsuspension = makeDet({
  name: "TRX Suspension",
  leftJoints:  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,  LM.LEFT_WRIST],
  rightJoints: [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
  downThreshold: 140, upThreshold: 105, inverted: true,
  angleLabel: "Ángulo codo", highlightColor: "#2ecc71",
  smoothN: 8,
  downCue: "↑ Jala hacia el pecho doblando los codos",
  upCue:   "↓ Extiende los brazos, mantén tensión",
  repCue:  "¡Rep TRX contada! 📋",
  formChecks: D.dominadas.formChecks,
});

// ── 16. SPLITS ────────────────────────────────────────────────────────────────
D.splits = makeDet({
  name: "Splits",
  leftJoints:  [LM.LEFT_KNEE,  LM.LEFT_HIP,  LM.RIGHT_HIP],
  rightJoints: [LM.RIGHT_KNEE, LM.RIGHT_HIP, LM.LEFT_HIP],
  downThreshold: 102, upThreshold: 136,
  angleLabel: "Apertura cadera", highlightColor: "#9B59B6",
  smoothN: 12,
  downCue: "↑ Vuelve a la posición inicial",
  upCue:   "↓ Abre lentamente las piernas hacia los lados",
  repCue:  "¡Split contado! 🤸",

  positionCheck(lm2D) {
    if (!bodyHorizontalCheck(lm2D)) {
      return { ok: false, msg: "Baja al suelo en posición de splits — cámara desde el frente o el lado" };
    }
    return { ok: true };
  },

  formChecks: [
    {
      when: "down",
      check(lm) {
        const ang = calculateAngle(lm[LM.LEFT_KNEE], lm[LM.LEFT_HIP], lm[LM.RIGHT_KNEE]);
        if (ang > 144) return { ok: false, msg: "Abre más las piernas, llega al suelo", severity: "info" };
        return { ok: true, msg: "¡Buena apertura! 💚", severity: "ok" };
      },
    },
  ],
});

// ═════════════════════════════════════════════════════════════════════════════
//  TABLA DE ALIAS  (nombres del backend → clave del detector)
// ═════════════════════════════════════════════════════════════════════════════
const ALIASES = {
  "sentadilla": "sentadillas", "squat": "sentadillas", "squats": "sentadillas",
  "flexion": "flexiones", "pushup": "flexiones", "pushups": "flexiones", "push-up": "flexiones",
  "dominada": "dominadas", "pullup": "dominadas", "pullups": "dominadas", "pull-up": "dominadas",
  "press": "pressmilitar", "militarypress": "pressmilitar", "pressmilitar": "pressmilitar",
  "banco": "bancoplano", "benchpress": "bancoplano", "bancoplano": "bancoplano",
  "pesomuerto": "pesomunerto", "deadlift": "pesomunerto", "pesomuertomuerto": "pesomunerto",
  "fondos": "fondosenparalelas", "dips": "fondosenparalelas", "fondosenparalelas": "fondosenparalelas",
  "burpee": "burpees",
  "mountainclimber": "mountainclimbers", "mountain": "mountainclimbers", "climbers": "mountainclimbers",
  "zancada": "zancadas", "lunge": "zancadas", "lunges": "zancadas",
  "muscleup": "muscleup", "muscle": "muscleup",
  "calisteniabasica": "calisteniabasica", "calistenia": "calisteniabasica",
  "saltarlacuerda": "saltarlacuerda", "jumprope": "saltarlacuerda", "saltar": "saltarlacuerda", "cuerda": "saltarlacuerda",
  "handstandholds": "handstandholds", "handstand": "handstandholds", "parada de manos": "handstandholds",
  "trxsuspension": "trxsuspension", "trx": "trxsuspension", "suspension": "trxsuspension",
  "split": "splits",
};

// ── Lookup principal ──────────────────────────────────────────────────────────
export function getExerciseDetector(exerciseName) {
  if (!exerciseName) return null;

  const key = exerciseName
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-_]+/g, "");

  if (D[key])                            return D[key];
  if (ALIASES[key] && D[ALIASES[key]])   return D[ALIASES[key]];

  const keys = Object.keys(D);
  const match = keys.find(k => key.startsWith(k) || k.startsWith(key));
  if (match) return D[match];

  const aliasMatch = Object.entries(ALIASES).find(([alias]) =>
    key.includes(alias) || alias.includes(key));
  if (aliasMatch && D[aliasMatch[1]]) return D[aliasMatch[1]];

  // Hold detectors (yoga / estiramientos)
  if (DH[key]) return DH[key];
  if (HOLD_ALIASES[key] && DH[HOLD_ALIASES[key]]) return DH[HOLD_ALIASES[key]];
  const holdKeys  = Object.keys(DH);
  const holdMatch = holdKeys.find(k => key.startsWith(k) || k.startsWith(key));
  if (holdMatch) return DH[holdMatch];
  const holdAlias = Object.entries(HOLD_ALIASES).find(([a]) => key.includes(a) || a.includes(key));
  if (holdAlias && DH[holdAlias[1]]) return DH[holdAlias[1]];

  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
//  DETECTORES DE POSE HOLD (yoga / estiramientos)
//  En lugar de contar reps, validan positionCheck y acumulan tiempo de hold.
//  El objeto devuelto tiene holdMode:true — PoseCamera lo detecta y cambia UI.
// ═════════════════════════════════════════════════════════════════════════════

function makePoseHold({ name, positionCheck, holdTargetSec = 30, highlightJoints = [], highlightColor = "#c08aff", formChecks = [] }) {
  return {
    name,
    holdMode: true,
    holdTargetSec,
    highlightColor,
    formChecks,
    positionCheck,
    getHighlightJoints: () => highlightJoints,
    evaluateForm(lm) {
      return formChecks.map(fc => { try { return fc.check(lm); } catch { return null; } }).filter(Boolean);
    },
    // Stubs vacíos — evitan que drawFrame de PoseCamera dibuje arco de ángulo
    leftJoints: [], rightJoints: [],
    getAngle: () => 0,
    isDown: () => false,
    isUp: () => false,
    getAngleLabelJoint: () => undefined,
    angleLabel: "Hold",
    smoothN: 1,
    downCue: "", upCue: "", repCue: "",
  };
}

const DH = {};

// ── PERRO BOCA ABAJO ─────────────────────────────────────────────────────────
DH.perrobocaabajo = makePoseHold({
  name: "Perro Boca Abajo",
  holdTargetSec: 45,
  highlightColor: "#c08aff",
  highlightJoints: [LM.LEFT_HIP, LM.RIGHT_HIP],
  positionCheck(lm2D) {
    const sY = ((lm2D[LM.LEFT_SHOULDER]?.y ?? 0.5) + (lm2D[LM.RIGHT_SHOULDER]?.y ?? 0.5)) / 2;
    const hY = ((lm2D[LM.LEFT_HIP]?.y  ?? 0.3) + (lm2D[LM.RIGHT_HIP]?.y  ?? 0.3)) / 2;
    const aY = ((lm2D[LM.LEFT_ANKLE]?.y ?? 0.6) + (lm2D[LM.RIGHT_ANKLE]?.y ?? 0.6)) / 2;
    if (hY > sY - 0.03)  return { ok: false, msg: "Empuja las caderas hacia arriba — forma de V invertida" };
    if (aY - sY > 0.35)  return { ok: false, msg: "Inclina el cuerpo hacia adelante desde las caderas" };
    return { ok: true, msg: "¡Buena postura! Mantén la V 💜" };
  },
  formChecks: [{
    check(lm) {
      const k = (calculateAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]) +
                 calculateAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE])) / 2;
      if (k < 130) return { ok: false, msg: "Estira las rodillas para elongar los isquios", severity: "info" };
      return null;
    },
  }],
});

// ── GUERRERO II ──────────────────────────────────────────────────────────────
DH.guerreroii = makePoseHold({
  name: "Guerrero II",
  holdTargetSec: 30,
  highlightColor: "#FFD700",
  highlightJoints: [LM.LEFT_WRIST, LM.RIGHT_WRIST],
  positionCheck(lm2D) {
    if (!bodyVerticalCheck(lm2D)) return { ok: false, msg: "Ponte de pie con los pies bien separados" };
    const sY  = ((lm2D[LM.LEFT_SHOULDER]?.y ?? 0.4) + (lm2D[LM.RIGHT_SHOULDER]?.y ?? 0.4)) / 2;
    const lwY = lm2D[LM.LEFT_WRIST]?.y  ?? sY;
    const rwY = lm2D[LM.RIGHT_WRIST]?.y ?? sY;
    if (Math.abs((lwY + rwY) / 2 - sY) > 0.18) return { ok: false, msg: "Extiende los brazos horizontalmente a los lados" };
    return { ok: true, msg: "¡Guerrero II activo! 🏹" };
  },
  formChecks: [{
    check(lm) {
      const frontKnee = Math.min(
        calculateAngle(lm[LM.LEFT_HIP],  lm[LM.LEFT_KNEE],  lm[LM.LEFT_ANKLE]),
        calculateAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE])
      );
      if (frontKnee > 145) return { ok: false, msg: "Dobla más la rodilla delantera", severity: "info" };
      return null;
    },
  }],
});

// ── POSTURA DEL NIÑO ─────────────────────────────────────────────────────────
DH.posturadelninno = makePoseHold({
  name: "Postura del Niño",
  holdTargetSec: 60,
  highlightColor: "#5ad8c8",
  highlightJoints: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
  positionCheck(lm2D) {
    if (!bodyHorizontalCheck(lm2D)) return { ok: false, msg: "Baja al suelo y estira los brazos hacia el frente" };
    return { ok: true, msg: "¡Postura del niño — respira profundo! 🌙" };
  },
});

// ── ESTIRAMIENTO DE ISQUIOS ──────────────────────────────────────────────────
DH.estiramisquios = makePoseHold({
  name: "Estiramiento de Isquios",
  holdTargetSec: 40,
  highlightColor: "#4CC9F0",
  highlightJoints: [LM.LEFT_KNEE, LM.RIGHT_KNEE],
  positionCheck(lm2D) {
    const hY = ((lm2D[LM.LEFT_HIP]?.y ?? 0.55) + (lm2D[LM.RIGHT_HIP]?.y ?? 0.55)) / 2;
    if (hY < 0.18 || hY > 0.96) return { ok: false, msg: "Asegúrate de que tu cuerpo sea visible en cámara" };
    return { ok: true, msg: "¡Mantén el estiramiento! 🧘" };
  },
  formChecks: [{
    check(lm) {
      const k = (calculateAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]) +
                 calculateAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE])) / 2;
      if (k < 140) return { ok: false, msg: "Estira las rodillas para maximizar el estiramiento", severity: "info" };
      return null;
    },
  }],
});

// ── PUENTE DE CADERAS ─────────────────────────────────────────────────────────
DH.puentecaderas = makePoseHold({
  name: "Puente de Caderas",
  holdTargetSec: 30,
  highlightColor: "#ff8659",
  highlightJoints: [LM.LEFT_HIP, LM.RIGHT_HIP],
  positionCheck(lm2D) {
    if (!bodyHorizontalCheck(lm2D)) return { ok: false, msg: "Túmbate boca arriba con las rodillas dobladas" };
    const sY = ((lm2D[LM.LEFT_SHOULDER]?.y ?? 0.6) + (lm2D[LM.RIGHT_SHOULDER]?.y ?? 0.6)) / 2;
    const hY = ((lm2D[LM.LEFT_HIP]?.y  ?? 0.5) + (lm2D[LM.RIGHT_HIP]?.y  ?? 0.5)) / 2;
    if (hY >= sY - 0.02) return { ok: false, msg: "Eleva más las caderas — empuja el suelo con los pies" };
    return { ok: true, msg: "¡Mantén el puente! Aprieta glúteos 🔥" };
  },
});

// ── PLANCHA IA (plancha con validación IA — distinto a e4 Timer) ──────────────
DH.planchaia = makePoseHold({
  name: "Plancha IA",
  holdTargetSec: 60,
  highlightColor: "#4CC9F0",
  highlightJoints: [LM.LEFT_HIP, LM.RIGHT_HIP],
  positionCheck(lm2D) {
    if (!bodyHorizontalCheck(lm2D)) return { ok: false, msg: "Colócate en posición de plancha — cámara desde el lado" };
    return { ok: true, msg: "¡Plancha activa! Activa el core 💪" };
  },
  formChecks: [{
    check(lm) {
      const ang = avgAngle(lm,
        [LM.LEFT_SHOULDER,  LM.LEFT_HIP,  LM.LEFT_KNEE],
        [LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE]);
      if (ang < 120) return { ok: false, msg: "No hundas las caderas — mantén el cuerpo recto", severity: "warning" };
      if (ang < 142) return { ok: false, msg: "Sube ligeramente las caderas para alinearte",    severity: "info"    };
      return null;
    },
  }],
});

// ── Alias para hold detectors ─────────────────────────────────────────────────
const HOLD_ALIASES = {
  "perro": "perrobocaabajo", "downdog": "perrobocaabajo", "downdogpose": "perrobocaabajo",
  "guerrero": "guerreroii", "warrior": "guerreroii",
  "ninno": "posturadelninno", "nino": "posturadelninno", "childpose": "posturadelninno", "child": "posturadelninno",
  "isquios": "estiramisquios", "hamstring": "estiramisquios",
  "puente": "puentecaderas", "bridge": "puentecaderas", "hipbridge": "puentecaderas",
  "planchai": "planchaia",
};

// ── Ejercicios con reconocimiento complejo — mostrar tip de modo manual ────────
const CAMERA_TIP_KEYS = new Set(["burpees", "muscleup"]);

export function needsCameraTip(exerciseName) {
  if (!exerciseName) return false;
  const key = exerciseName
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[\s\-_]+/g, "");
  return CAMERA_TIP_KEYS.has(key) || CAMERA_TIP_KEYS.has(ALIASES[key] ?? "");
}
