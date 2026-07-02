// src/components/auth/HeroCharacter.jsx
// ── Personaje animado con sprites reales por clase ─────────────────────────
//
//  Estructura de carpetas en /public:
//    /personaje/base_guerrero/stage1_idle_1.png … stage1_idle_N.png
//    /personaje/base_arquero/ stage1_idle_1.png … stage1_idle_N.png
//    /personaje/base_mago/    stage1_idle_1.png … stage1_idle_N.png
//
//  Para añadir más frames: sube las imágenes y aumenta FRAME_COUNT.
//  Solo animación: idle.
// ───────────────────────────────────────────────────────────────────────────
import { useState, useEffect, memo } from "react";
import { px, raj, orb, T, CLASSES } from "../shared/theme";

// ── Configuración de frames ─────────────────────────────────────────────────
//  Sube idle_01.png … idle_08.png a /public/muñeco/ y ajusta FRAME_COUNT.
const FRAME_COUNT = 8;          // frames disponibles en /public/muñeco/
const FRAME_FPS   = 6;          // fotogramas por segundo del idle
const FRAME_MS    = Math.round(1000 / FRAME_FPS); // ~167ms

function idleFrame(frameIdx) {
  const num = String((frameIdx % FRAME_COUNT) + 1).padStart(2, "0");
  return `/muñeco/idle_${num}.png`;
}

// ── Mini XP bar inline ───────────────────────────────────────────────────────
function MiniBar({ value, color }) {
  const segments = 6;
  const filled   = Math.round((value / 100) * segments);
  return (
    <div style={{ display: "flex", gap: 2, height: 5 }}>
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: "100%",
          background: i < filled ? color : `${color}22`,
          boxShadow:  i < filled ? `0 0 3px ${color}88` : "none",
        }} />
      ))}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
const HeroCharacter = memo(function HeroCharacter({
  scale      = 1,
  classIndex = 0,     // 0 = Guerrero · 1 = Arquero · 2 = Mago
  level      = "?",
  showCard   = true,
  showBadge  = true,  // mostrar badge de nivel encima del sprite
  xp         = 72,
  hp         = 88,
  size       = 180,   // ancho/alto en px del sprite
}) {
  const [frame,   setFrame]   = useState(0);
  const [glowing, setGlowing] = useState(false);
  const [imgError,setImgError]= useState(false);

  const cls = CLASSES[classIndex] ?? CLASSES[0];

  // Ciclo de frames (idle)
  useEffect(() => {
    if (FRAME_COUNT <= 1) return;
    const t = setInterval(() => setFrame(f => (f + 1) % FRAME_COUNT), FRAME_MS);
    return () => clearInterval(t);
  }, []);

  // Pulso de glow cada 3s
  useEffect(() => {
    const t = setInterval(() => {
      setGlowing(true);
      setTimeout(() => setGlowing(false), 700);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Resetear error de imagen al cambiar de clase
  useEffect(() => setImgError(false), [classIndex]);

  const src = idleFrame(frame);

  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      gap:            12,
      animation:      "heroReveal 0.6s cubic-bezier(0.22,1,0.36,1) both",
    }}>

      {/* ── Level badge ── */}
      {showBadge && <div style={{
        ...px(8), color: T.gold,
        border:     `2px solid ${T.gold}`,
        padding:    "6px 16px",
        background: `${T.gold}11`,
        boxShadow:  `2px 2px 0 rgba(0,0,0,0.5), 0 0 ${glowing ? 20 : 8}px ${T.gold}${glowing ? "88" : "44"}`,
        transition: "box-shadow 0.4s",
        animation:  "borderPulse 3s infinite",
      }}>
        ▸ LVL {level} ◂
      </div>}

      {/* ── Sprite ── */}
      <div style={{
        transform:  `scale(${scale})`,
        animation:  "floatY 2.8s ease-in-out infinite",
        filter:     `drop-shadow(0 0 ${glowing ? 24 : 14}px ${cls.color}${glowing ? "bb" : "88"}) drop-shadow(0 6px 4px rgba(0,0,0,0.7))`,
        transition: "filter 0.4s",
        width:      size,
        height:     size,
        display:    "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}>
        {!imgError ? (
          <img
            key={src}
            src={src}
            alt={`${cls.name} idle`}
            onError={() => setImgError(true)}
            style={{
              width:           "100%",
              height:          "100%",
              objectFit:       "contain",
              objectPosition:  "bottom center",
              imageRendering:  "pixelated",
              display:         "block",
            }}
            draggable={false}
          />
        ) : (
          /* Fallback: cuadrado con inicial de clase si la imagen no carga */
          <div style={{
            width: size, height: size,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${cls.color}18`, border: `2px solid ${cls.color}44`,
            ...orb(48, 900), color: cls.color,
            textShadow: `0 0 20px ${cls.color}`,
          }}>
            {cls.name[0]}
          </div>
        )}
      </div>

      {/* ── RPG Stats card ── */}
      {showCard && (
        <div className="rpg-window px-corners" style={{
          "--cc":    cls.color,
          padding:   "16px 20px",
          minWidth:  230,
          animation: "borderPulse 3s infinite",
          position:  "relative",
        }}>
          <div className="px-noise" />

          {/* Header */}
          <div style={{
            display:        "flex",
            justifyContent: "space-between",
            marginBottom:   12,
            paddingBottom:  8,
            borderBottom:   `1px solid ${T.navy}`,
          }}>
            <span style={{ ...px(6), color: cls.color }}>{cls.name}</span>
            <span style={{ ...px(6), color: T.muted  }}>CLASE {cls.tier}</span>
          </div>

          {/* Barras */}
          {[
            { label: "XP",  value: xp,           color: cls.color },
            { label: "HP",  value: hp,            color: T.success },
            { label: "STR", value: cls.stats[0][1], color: T.blue  },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ ...px(5), color: T.muted }}>{label}</span>
                <span style={{ ...px(5), color }}>{value}/100</span>
              </div>
              <MiniBar value={value} color={color} />
            </div>
          ))}

          {/* Footer */}
          <div style={{
            display:        "flex",
            justifyContent: "space-between",
            marginTop:      10,
            paddingTop:     8,
            borderTop:      `1px solid ${T.navy}`,
          }}>
            <span style={{ ...px(5), color: T.muted }}>🔥 RACHA</span>
            <span style={{ ...px(6), color: cls.color, animation: "pixelBlink 2s infinite" }}>
              LISTA
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default HeroCharacter;
