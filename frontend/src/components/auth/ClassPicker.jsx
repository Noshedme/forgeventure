// src/components/auth/ClassPicker.jsx
import { px, raj, T, CLASSES } from "../shared/theme";

export default function ClassPicker({ selected, onChange }) {
  return (
    <div style={{ margin: "24px 0 32px" }}>
      <div style={{ ...px(8), color: T.muted, marginBottom: 12, letterSpacing: "0.06em" }}>
        🎭 ELIGE TU CLASE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {CLASSES.map((c, i) => (
          <div
            key={i}
            onClick={() => onChange(i)}
            style={{
              border: `2px solid ${selected === i ? c.color : T.navy}`,
              background: selected === i ? c.bg : "#0A1425",
              padding: "16px 12px",
              textAlign: "center",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.25s",
              boxShadow: selected === i ? `0 0 20px ${c.color}44` : "none",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8, filter: selected === i ? `drop-shadow(0 0 10px ${c.color})` : "none" }}>
              {c.icon}
            </div>
            <div style={{ ...px(7), color: selected === i ? c.color : T.muted, marginBottom: 4 }}>
              {c.name}
            </div>
            <div style={{ ...raj(11, 400), color: T.muted, lineHeight: 1.3 }}>
              {c.bonus}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}