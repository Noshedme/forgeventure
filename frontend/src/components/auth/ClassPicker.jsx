// src/components/auth/ClassPicker.jsx
// ── Selector de clase con efectos 3D, stat bars animadas y pixel corners ──
import { useState, useRef, useCallback, memo } from "react";
import { px, raj, orb, T, CLASSES } from "../shared/theme";

// ── Mini XP bar (igual que en Home) ──────────────────────────────
function XPBar({ label, value, color, delay = 0 }) {
  const segments = 8;
  const filled = Math.round((value / 100) * segments);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ ...px(5), color: T.muted }}>{label}</span>
        <span style={{ ...px(5), color }}>{value}</span>
      </div>
      <div style={{ display: "flex", gap: 2, height: 8, background: "#0A1628", border: `1px solid ${color}33`, padding: 1 }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: "100%",
              background: i < filled ? `linear-gradient(to bottom,${color}cc,${color})` : "transparent",
              boxShadow: i < filled ? `0 0 4px ${color}66` : "none",
              animation: i < filled ? `progressBar 0.1s ease ${delay + i * 0.06}s both` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card individual de clase ──────────────────────────────────────
const ClassCard = memo(function ClassCard({ c, i, selected, onSelect }) {
  const cardRef = useRef(null);
  const isSelected = selected === i;

  // Efecto 3D tilt como en FeatureCard3D de Home
  const onMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotY = ((e.clientX - rect.left) / rect.width  - 0.5) * 14;
    const rotX = -((e.clientY - rect.top)  / rect.height - 0.5) * 14;
    card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px) scale(1.03)`;
    card.style.boxShadow = `0 20px 50px ${c.color}33, ${rotY * -2}px ${rotX * 2}px 24px ${c.color}22, 3px 3px 0 rgba(0,0,0,0.4)`;
  }, [c.color]);

  const onLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = isSelected
      ? "perspective(700px) rotateX(0) rotateY(0) translateY(-2px) scale(1.01)"
      : "perspective(700px) rotateX(0) rotateY(0) translateY(0) scale(1)";
    card.style.boxShadow = isSelected
      ? `0 0 0 2px ${c.color}, 0 0 20px ${c.glow}, 3px 3px 0 rgba(0,0,0,0.5)`
      : "2px 2px 0 rgba(0,0,0,0.4)";
  }, [isSelected, c.color, c.glow]);

  return (
    <div
      ref={cardRef}
      className="px-corners"
      onClick={() => onSelect(i)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseOut={onLeave}
      style={{
        "--cc": isSelected ? c.color : T.navy,
        background: isSelected ? c.bg : T.bgCard,
        border: `2px solid ${isSelected ? c.color : T.navy}`,
        padding: "18px 14px",
        cursor: "pointer",
        transformStyle: "preserve-3d",
        transition: "border-color 0.3s, background 0.3s, box-shadow 0.15s",
        boxShadow: isSelected
          ? `0 0 0 2px ${c.color}, 0 0 20px ${c.glow}, 3px 3px 0 rgba(0,0,0,0.5)`
          : "2px 2px 0 rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
        animation: isSelected ? "selectRingAnim 1.8s ease-in-out infinite" : "none",
        "--c": c.color,
      }}
    >
      {/* Rarity banner top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: c.rarityColor,
        boxShadow: `0 0 8px ${c.rarityColor}`,
      }} />

      {/* Rarity badge */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        ...px(4), color: c.rarityColor,
        border: `1px solid ${c.rarityColor}55`,
        background: `${c.rarityColor}11`,
        padding: "2px 5px",
      }}>
        {c.rarity}
      </div>

      {/* Tier badge */}
      <div style={{
        position: "absolute", top: 8, left: 8,
        ...px(6), color: isSelected ? c.color : T.muted,
        border: `1px solid ${isSelected ? c.color : T.navy}`,
        background: isSelected ? `${c.color}11` : "transparent",
        padding: "2px 6px",
        transition: "all 0.3s",
      }}>
        {c.tier}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${c.color}, transparent)`,
          boxShadow: `0 0 8px ${c.color}`,
        }} />
      )}

      {/* Noise texture */}
      <div className="px-noise" />

      {/* Icon */}
      <div style={{
        fontSize: 36,
        textAlign: "center",
        marginTop: 14,
        marginBottom: 10,
        filter: isSelected ? `drop-shadow(0 0 12px ${c.color})` : "none",
        animation: isSelected ? "floatYS 2.5s ease-in-out infinite" : "none",
        transition: "filter 0.3s",
        position: "relative", zIndex: 1,
      }}>
        {c.icon}
      </div>

      {/* Name */}
      <div style={{
        ...px(8),
        color: isSelected ? c.color : T.muted,
        textAlign: "center",
        marginBottom: 4,
        animation: isSelected ? "glow 3s ease-in-out infinite" : "none",
        transition: "color 0.3s",
        position: "relative", zIndex: 1,
      }}>
        {isSelected && <span style={{ animation: "pixelBlink 0.8s infinite", marginRight: 4 }}>▶</span>}
        {c.name}
      </div>

      {/* Tag */}
      <div style={{
        ...raj(10, 600),
        color: isSelected ? `${c.color}cc` : `${T.muted}88`,
        textAlign: "center",
        letterSpacing: "0.08em",
        marginBottom: 12,
        textTransform: "uppercase",
        transition: "color 0.3s",
        position: "relative", zIndex: 1,
      }}>
        {c.tag}
      </div>

      {/* Bonus badge */}
      <div style={{
        ...px(5),
        color: isSelected ? c.color : T.muted,
        border: `1px solid ${isSelected ? c.color + "55" : T.navy}`,
        background: isSelected ? `${c.color}0D` : "transparent",
        padding: "5px 8px",
        textAlign: "center",
        marginBottom: 12,
        lineHeight: 1.8,
        transition: "all 0.3s",
        position: "relative", zIndex: 1,
      }}>
        ⚡ {c.bonus}
      </div>

      {/* Stats — solo visibles cuando está seleccionado */}
      <div style={{
        maxHeight: isSelected ? 100 : 0,
        overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.22,1,0.36,1)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ paddingTop: 8, borderTop: `1px solid ${c.color}33` }}>
          {c.stats.map(([label, val], idx) => (
            <XPBar key={label} label={label} value={val} color={c.color} delay={idx * 0.1} />
          ))}
        </div>
      </div>

      {/* Skills chips */}
      <div style={{
        display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8,
        justifyContent: "center",
        maxHeight: isSelected ? 60 : 0,
        overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.22,1,0.36,1) 0.1s",
        position: "relative", zIndex: 1,
      }}>
        {c.skills.map(s => (
          <span key={s} style={{
            ...px(4), color: c.color,
            border: `1px solid ${c.color}44`,
            background: `${c.color}0D`,
            padding: "3px 6px",
          }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
});

// ── ClassPicker principal ─────────────────────────────────────────
export default function ClassPicker({ selected, onChange }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ margin: "28px 0 36px" }}>
      {/* Header RPG */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
        padding: "10px 14px",
        background: T.bgPanel,
        border: `1px solid ${T.navy}`,
        boxShadow: "inset 0 1px 0 rgba(76,201,240,0.06)",
      }}>
        <div style={{ ...px(7), color: T.muted, letterSpacing: "0.06em" }}>
          🎭 ELIGE TU CLASE
        </div>
        <div style={{ ...px(6), color: T.orange, animation: "pixelBlink 2s infinite" }}>
          {selected !== null ? `◆ ${CLASSES[selected].name} SELECCIONADO` : "[ SELECCIONAR ]"}
        </div>
      </div>

      {/* Instrucción */}
      <div style={{
        ...raj(12, 500), color: T.muted,
        textAlign: "center", marginBottom: 14,
        letterSpacing: "0.12em",
      }}>
        ◀ CLICK PARA SELECCIONAR · HOVER PARA STATS ▶
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {CLASSES.map((c, i) => (
          <ClassCard
            key={i}
            c={c}
            i={i}
            selected={selected}
            onSelect={onChange}
          />
        ))}
      </div>

      {/* Footer de confirmación */}
      {selected !== null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          marginTop: 14, padding: "10px 14px",
          background: `${CLASSES[selected].color}0D`,
          border: `1px solid ${CLASSES[selected].color}44`,
          animation: "pixelIn 0.3s ease both",
        }}>
          <span style={{ fontSize: 20 }}>{CLASSES[selected].icon}</span>
          <div>
            <div style={{ ...px(6), color: CLASSES[selected].color }}>
              {CLASSES[selected].name} — {CLASSES[selected].tag.toUpperCase()}
            </div>
            <div style={{ ...raj(11, 500), color: T.muted, marginTop: 3 }}>
              {CLASSES[selected].desc}
            </div>
          </div>
          <div style={{
            marginLeft: "auto",
            ...px(7), color: CLASSES[selected].color,
            animation: "pixelBlink 0.8s infinite",
          }}>
            ✓
          </div>
        </div>
      )}
    </div>
  );
}