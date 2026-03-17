// src/components/auth/SuccessOverlay.jsx
import { px, raj, T } from "../shared/theme";

export default function SuccessOverlay({ mode }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(6,13,26,0.96)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      animation: "pixelIn 0.4s ease both",
    }}>
      <div style={{
        fontSize: 90,
        marginBottom: 24,
        animation: "floatY 2.4s ease-in-out infinite",
        filter: `drop-shadow(0 0 30px ${T.orange})`,
      }}>
        {mode === "login" ? "⚔️" : "🎉"}
      </div>
      <h2 style={{
        ...px(18),
        color: T.orange,
        marginBottom: 16,
        animation: "glow 2.4s ease-in-out infinite",
      }}>
        {mode === "login" ? "¡BIENVENIDO GUERRERO!" : "¡HÉROE CREADO!"}
      </h2>
      <p style={{ ...raj(18, 500), color: T.muted, letterSpacing: "0.1em" }}>
        {mode === "login" ? "Cargando tu aventura..." : "Preparando tu leyenda..."}
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 12,
            height: 12,
            background: T.orange,
            borderRadius: "50%",
            animation: `spin 1s linear infinite ${i*0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}