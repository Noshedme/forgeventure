// src/avatar/AvatarSVG.jsx
// Avatar "Flex" — SVG inline, cero archivos externos, cero dependencias nuevas

const C = {
  skin:   '#FFCBA4',
  skinD:  '#D4875A',
  brand:  '#E85D04',
  brandD: '#C94E02',
  suit:   '#1A3455',
  suitL:  '#2A5285',
  white:  '#FFFFFF',
  dark:   '#111111',
  hair:   '#2C1503',
  shoe:   '#0D1120',
  cheek:  '#F5A585',
  iris:   '#3A80D2',
  tooth:  '#F5F5F0',
};

// Boca como función que retorna JSX según tipo y posición Y base
function drawMouth(type, y) {
  switch (type) {
    case 'smile':
      return (
        <path
          d={`M48,${y} Q60,${y + 8} 72,${y}`}
          fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round"
        />
      );
    case 'bigSmile':
      return (
        <>
          <path d={`M44,${y} Q60,${y + 13} 76,${y}`} fill={C.dark} />
          <path d={`M45,${y + 1} Q60,${y + 8} 75,${y + 1}`} fill={C.tooth} />
          <path
            d={`M44,${y} Q60,${y + 13} 76,${y}`}
            fill="none" stroke={C.dark} strokeWidth="2"
          />
        </>
      );
    case 'open':
      return (
        <>
          <path
            d={`M52,${y} Q60,${y + 4} 68,${y} L67,${y + 9} Q60,${y + 12} 53,${y + 9} Z`}
            fill={C.dark}
          />
          <path d={`M53,${y + 1} Q60,${y + 4} 67,${y + 1}`} fill={C.tooth} />
        </>
      );
    case 'wideOpen':
      return (
        <>
          <path
            d={`M50,${y} Q60,${y + 5} 70,${y} L69,${y + 11} Q60,${y + 14} 51,${y + 11} Z`}
            fill={C.dark}
          />
          <path d={`M51,${y + 1} Q60,${y + 4} 69,${y + 1}`} fill={C.tooth} />
        </>
      );
    case 'thinking':
      return (
        <path
          d={`M52,${y + 4} Q60,${y + 1} 68,${y + 4}`}
          fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round"
        />
      );
    case 'ooh':
      return (
        <>
          <ellipse cx="60" cy={y + 7} rx="6" ry="8" fill={C.dark} />
          <ellipse cx="60" cy={y + 5} rx="4" ry="3.5" fill={C.tooth} />
        </>
      );
    default: // closed
      return (
        <path
          d={`M50,${y} Q60,${y + 2} 70,${y}`}
          fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round"
        />
      );
  }
}

// Datos de animación por estado y frame
// by  = desplazamiento Y del cuerpo (respiración/rebote)
// m   = tipo de boca
// eH  = escala vertical del ojo (1 = abierto, ~0 = parpadeo)
// lA  = ángulo del brazo izquierdo (grados CW alrededor del hombro)
// rA  = ángulo del brazo derecho
// ebR = desplazamiento Y de la ceja derecha (negativo = sube)
const ANIM = {
  idle: [
    { by: 0,  m: 'closed',   eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
    { by: -1, m: 'closed',   eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
    { by: -2, m: 'smile',    eH: 1,    lA: 22,  rA: -22,  ebR: 0 },
    { by: -1, m: 'smile',    eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
    { by: 0,  m: 'closed',   eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
    { by: 0,  m: 'closed',   eH: 0.1,  lA: 20,  rA: -20,  ebR: 0 }, // parpadeo
    { by: -1, m: 'closed',   eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
    { by: 0,  m: 'smile',    eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
  ],
  talking: [
    { by: 0,  m: 'open',     eH: 1,    lA: 22,  rA: -22,  ebR: 0 },
    { by: -1, m: 'wideOpen', eH: 1,    lA: 24,  rA: -24,  ebR: 0 },
    { by: 0,  m: 'ooh',      eH: 1,    lA: 22,  rA: -22,  ebR: 0 },
    { by: -1, m: 'wideOpen', eH: 1,    lA: 24,  rA: -24,  ebR: 0 },
    { by: 0,  m: 'open',     eH: 1,    lA: 22,  rA: -22,  ebR: 0 },
    { by: 0,  m: 'smile',    eH: 1,    lA: 20,  rA: -20,  ebR: 0 },
  ],
  happy: [
    { by: -2, m: 'bigSmile', eH: 0.7,  lA: 130, rA: -130, ebR: 0 },
    { by: 0,  m: 'bigSmile', eH: 0.7,  lA: 125, rA: -125, ebR: 0 },
    { by: -3, m: 'bigSmile', eH: 0.7,  lA: 135, rA: -135, ebR: 0 },
    { by: -1, m: 'bigSmile', eH: 0.7,  lA: 130, rA: -130, ebR: 0 },
  ],
  wave: [
    { by: 0,  m: 'smile',    eH: 1,    lA: 20,  rA: -120, ebR: 0 },
    { by: -1, m: 'smile',    eH: 1,    lA: 20,  rA: -90,  ebR: 0 },
    { by: 0,  m: 'smile',    eH: 1,    lA: 20,  rA: -115, ebR: 0 },
    { by: -1, m: 'smile',    eH: 1,    lA: 20,  rA: -100, ebR: 0 },
  ],
  thinking: [
    { by: 0,  m: 'thinking', eH: 1,    lA: 20,  rA: 150,  ebR: -3 },
    { by: -1, m: 'thinking', eH: 1,    lA: 20,  rA: 152,  ebR: -4 },
    { by: 0,  m: 'thinking', eH: 1,    lA: 20,  rA: 150,  ebR: -3 },
    { by: 0,  m: 'thinking', eH: 1,    lA: 20,  rA: 148,  ebR: -2 },
  ],
  // ── Nuevos estados ──
  walk: [
    { by: 0,  m: 'closed',   eH: 1,    lA: 50,  rA: -10,  ebR: 0 },
    { by: -2, m: 'closed',   eH: 1,    lA: 30,  rA: -30,  ebR: 0 },
    { by: 0,  m: 'closed',   eH: 1,    lA: 10,  rA: -50,  ebR: 0 },
    { by: -2, m: 'closed',   eH: 1,    lA: 30,  rA: -30,  ebR: 0 },
    { by: 0,  m: 'closed',   eH: 1,    lA: 50,  rA: -10,  ebR: 0 },
    { by: -2, m: 'closed',   eH: 1,    lA: 30,  rA: -30,  ebR: 0 },
  ],
  dance: [
    { by: -3, m: 'bigSmile', eH: 0.85, lA: 100, rA: -20,  ebR: 0 },
    { by: 0,  m: 'bigSmile', eH: 0.85, lA: 60,  rA: -60,  ebR: 0 },
    { by: -3, m: 'bigSmile', eH: 0.85, lA: 20,  rA: -100, ebR: 0 },
    { by: 0,  m: 'bigSmile', eH: 0.85, lA: 60,  rA: -60,  ebR: 0 },
    { by: -3, m: 'bigSmile', eH: 0.85, lA: 100, rA: -20,  ebR: 0 },
    { by: 0,  m: 'bigSmile', eH: 0.85, lA: 60,  rA: -60,  ebR: 0 },
    { by: -3, m: 'bigSmile', eH: 0.85, lA: 20,  rA: -100, ebR: 0 },
    { by: 0,  m: 'bigSmile', eH: 0.85, lA: 60,  rA: -60,  ebR: 0 },
  ],
  surprised: [
    { by: -5, m: 'wideOpen', eH: 1.4,  lA: 120, rA: -120, ebR: -5 },
    { by: -3, m: 'open',     eH: 1.2,  lA: 100, rA: -100, ebR: -3 },
    { by: 0,  m: 'ooh',      eH: 1,    lA: 80,  rA: -80,  ebR: 0  },
  ],
  bored: [
    { by: 0,  m: 'closed',   eH: 0.45, lA: 20,  rA: -20,  ebR: 0 },
    { by: 1,  m: 'closed',   eH: 0.35, lA: 20,  rA: -20,  ebR: 0 },
    { by: 0,  m: 'closed',   eH: 0.45, lA: 20,  rA: -20,  ebR: 0 },
    { by: 1,  m: 'thinking', eH: 0.35, lA: 20,  rA: 150,  ebR: 0 },
    { by: 0,  m: 'wideOpen', eH: 1,    lA: 22,  rA: -22,  ebR: 0 }, // bosteza
    { by: 0,  m: 'closed',   eH: 0.4,  lA: 20,  rA: -20,  ebR: 0 },
  ],
};

export default function AvatarSVG({ state = 'idle', frame = 0 }) {
  const frames = ANIM[state] ?? ANIM.idle;
  const { by, m, eH, lA, rA, ebR = 0 } = frames[frame % frames.length];

  const mY   = 50;   // Y base de la boca
  const eyeY = 36;   // Y centro de los ojos
  const eyeRY = 4.5; // radio Y del ojo (open)
  const eyeRX = 4.5; // radio X del ojo

  return (
    <svg
      viewBox="0 0 120 170"
      width="120"
      height="170"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <g transform={`translate(0,${by})`}>

        {/* ── PIERNAS ── */}
        <rect x="42" y="108" width="16" height="42" rx="7" fill={C.suit} />
        <rect x="62" y="108" width="16" height="42" rx="7" fill={C.suit} />
        {/* Detalle rodillas */}
        <rect x="44" y="126" width="12" height="5" rx="2.5" fill={C.suitL} opacity="0.6" />
        <rect x="64" y="126" width="12" height="5" rx="2.5" fill={C.suitL} opacity="0.6" />

        {/* ── ZAPATOS ── */}
        <ellipse cx="48" cy="152" rx="14" ry="7"  fill={C.shoe} />
        <ellipse cx="72" cy="152" rx="14" ry="7"  fill={C.shoe} />
        <ellipse cx="45" cy="149" rx="6"  ry="3"  fill="#2A2A4A" opacity="0.5" />
        <ellipse cx="69" cy="149" rx="6"  ry="3"  fill="#2A2A4A" opacity="0.5" />

        {/* ── BRAZO IZQUIERDO (detrás del torso) ── */}
        {/* Rotación CW desde hombro izq (38, 72) */}
        <g transform={`rotate(${lA},38,72)`}>
          <rect x="31" y="72"  width="14" height="28" rx="7" fill={C.suit}  />
          <rect x="31" y="96"  width="14" height="20" rx="7" fill={C.suitL} />
          <circle cx="38" cy="116" r="9" fill={C.skin} />
          <circle cx="35" cy="113" r="2" fill={C.skinD} opacity="0.35" />
          <circle cx="38" cy="112" r="2" fill={C.skinD} opacity="0.35" />
          <circle cx="41" cy="113" r="2" fill={C.skinD} opacity="0.35" />
        </g>

        {/* ── TORSO ── */}
        <rect x="36" y="66" width="48" height="44" rx="10" fill={C.suit}  />
        {/* Highlight superior */}
        <rect x="36" y="66" width="48" height="14" rx="10" fill={C.suitL} opacity="0.45" />
        {/* Franja naranja (logo) */}
        <rect x="51" y="78" width="18" height="5" rx="2.5" fill={C.brand} />
        {/* Collar en V */}
        <path
          d="M52,67 L60,75 L68,67"
          fill="none" stroke={C.suitL} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* ── BRAZO DERECHO (delante del torso) ── */}
        {/* Rotación CW desde hombro der (82, 72) */}
        <g transform={`rotate(${rA},82,72)`}>
          <rect x="75" y="72"  width="14" height="28" rx="7" fill={C.suit}  />
          <rect x="75" y="96"  width="14" height="20" rx="7" fill={C.suitL} />
          <circle cx="82" cy="116" r="9" fill={C.skin} />
          <circle cx="79" cy="113" r="2" fill={C.skinD} opacity="0.35" />
          <circle cx="82" cy="112" r="2" fill={C.skinD} opacity="0.35" />
          <circle cx="85" cy="113" r="2" fill={C.skinD} opacity="0.35" />
        </g>

        {/* ── CUELLO ── */}
        <rect x="53" y="61" width="14" height="8" rx="4" fill={C.skin} />

        {/* ── CABEZA ── */}
        {/* Orejas */}
        <circle cx="34" cy="38" r="9" fill={C.skinD} />
        <circle cx="34" cy="38" r="6" fill={C.skin}  />
        <circle cx="86" cy="38" r="9" fill={C.skinD} />
        <circle cx="86" cy="38" r="6" fill={C.skin}  />

        {/* Cabeza principal */}
        <circle cx="60" cy="37" r="27" fill={C.skin} />

        {/* Cintillo naranja (headband) */}
        <path
          d="M33,30 Q60,21 87,30 Q86,39 84,40 Q60,32 36,40 Q34,39 33,30 Z"
          fill={C.brand}
        />
        <path
          d="M37,26 Q60,18 83,26"
          fill="none" stroke={C.brandD} strokeWidth="1.5" opacity="0.5"
        />

        {/* Pelo (por encima del cintillo) */}
        <path
          d="M37,28 Q60,11 83,28 Q74,13 60,11 Q46,13 37,28 Z"
          fill={C.hair}
        />

        {/* Cejas */}
        <path
          d="M43,27 Q52,24 58,27"
          fill="none" stroke={C.hair} strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Ceja derecha — sube con ebR en estado thinking */}
        <path
          d={`M62,${27 + ebR} Q68,${24 + ebR} 77,${27 + ebR}`}
          fill="none" stroke={C.hair} strokeWidth="2.5" strokeLinecap="round"
        />

        {/* ── OJOS ── */}
        {/* Ojo izquierdo */}
        <ellipse cx="52" cy={eyeY}     rx={eyeRX + 1}   ry={(eyeRY + 1) * eH}   fill={C.white} />
        <ellipse cx="52" cy={eyeY}     rx={eyeRX - 0.5} ry={(eyeRY - 0.5) * eH} fill={C.iris}  />
        <ellipse cx="52" cy={eyeY + 0.5} rx="2.5"       ry={2.5 * eH}           fill={C.dark}  />
        {eH > 0.5 && <circle cx="53.5" cy={eyeY - 1} r="1.2" fill={C.white} />}

        {/* Ojo derecho */}
        <ellipse cx="68" cy={eyeY}     rx={eyeRX + 1}   ry={(eyeRY + 1) * eH}   fill={C.white} />
        <ellipse cx="68" cy={eyeY}     rx={eyeRX - 0.5} ry={(eyeRY - 0.5) * eH} fill={C.iris}  />
        <ellipse cx="68" cy={eyeY + 0.5} rx="2.5"       ry={2.5 * eH}           fill={C.dark}  />
        {eH > 0.5 && <circle cx="69.5" cy={eyeY - 1} r="1.2" fill={C.white} />}

        {/* Nariz */}
        <ellipse cx="60" cy="44" rx="2" ry="1.5" fill={C.skinD} opacity="0.5" />

        {/* Rubor en mejillas (smile / bigSmile) */}
        {(m === 'bigSmile' || m === 'smile') && (
          <>
            <ellipse cx="44" cy="47" rx="7" ry="4" fill={C.cheek} opacity="0.35" />
            <ellipse cx="76" cy="47" rx="7" ry="4" fill={C.cheek} opacity="0.35" />
          </>
        )}

        {/* ── BOCA ── */}
        {drawMouth(m, mY)}

      </g>
    </svg>
  );
}
