// src/components/auth/SuccessOverlay.jsx
// ── Overlay épico de éxito con secuencia cinematográfica RPG ──────
import { useState, useEffect, useRef } from "react";
import { px, raj, orb, T } from "../shared/theme";

// ── Partículas canvas ─────────────────────────────────────────────
function SuccessParticles({ color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    let rafId;

    const colors = [color, T.gold, T.blue, T.white];
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * c.width,
      y: c.height + 10,
      s: Math.random() * 4 + 1,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 2 + 0.8),
      o: Math.random() * 0.7 + 0.2,
      phase: Math.random() * Math.PI * 2,
      col: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? "rect" : "diamond",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx + Math.sin(p.phase) * 0.3;
        p.y += p.vy;
        p.phase += 0.04;
        const alpha = p.y < 0 ? Math.max(0, 1 + p.y / 80) : p.o;
        if (p.y < -20) {
          p.y = c.height + 10;
          p.x = Math.random() * c.width;
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.col;
        if (p.shape === "diamond") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
          ctx.restore();
        } else {
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.s), Math.ceil(p.s));
        }
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        pointerEvents: "none", zIndex: 1,
      }}
    />
  );
}

// ── Secuencia de boot de texto ────────────────────────────────────
function BootSequence({ lines, onDone }) {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < lines.length) {
        setVisible(prev => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(t);
        setTimeout(onDone, 300);
      }
    }, 220);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      width: "100%", maxWidth: 420,
      background: "#000",
      border: `1px solid ${T.navy}`,
      padding: "14px 18px",
      fontFamily: "'Press Start 2P'",
      fontSize: 7,
      color: T.success,
      lineHeight: 2.2,
      boxShadow: `2px 2px 0 rgba(0,0,0,0.5), inset 0 0 20px ${T.success}11`,
      minHeight: 110,
    }}>
      {visible.map((line, i) => (
        <div
          key={i}
          style={{ animation: `questSlide 0.15s ease ${i * 0.03}s both`, opacity: 0.9 }}
        >
          {line}
        </div>
      ))}
      <span style={{ animation: "pixelBlink 0.7s infinite" }}>█</span>
    </div>
  );
}

// ── Puntos de carga animados ──────────────────────────────────────
function LoadingDots({ color }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 10, height: 10,
            background: color,
            boxShadow: `0 0 8px ${color}`,
            animation: `loaderPulse 1s ease-in-out ${i * 0.2}s infinite`,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  );
}

// ── XP Progress bar ───────────────────────────────────────────────
function XPGainBar({ color, xpGained = 250 }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProgress(100), 300);
    return () => clearTimeout(t);
  }, []);

  const segments = 16;
  const filled = Math.round((progress / 100) * segments);

  return (
    <div style={{ width: "100%", maxWidth: 380 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginBottom: 6,
      }}>
        <span style={{ ...px(6), color: T.muted }}>XP GANADO</span>
        <span style={{ ...px(7), color, animation: "glow 2s ease-in-out infinite" }}>
          +{xpGained} XP
        </span>
      </div>
      <div style={{
        height: 16, background: "#060D1A",
        border: `2px solid ${color}`,
        boxShadow: `2px 2px 0 rgba(0,0,0,0.5), inset 0 0 8px ${color}22`,
        padding: 2, display: "flex", gap: 2, overflow: "hidden",
      }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: "100%",
              background: i < filled
                ? `linear-gradient(to bottom, ${color}cc, ${color})`
                : "transparent",
              boxShadow: i < filled ? `0 0 4px ${color}` : "none",
              transition: `background ${0.05 + i * 0.04}s ease`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Overlay principal ─────────────────────────────────────────────
export default function SuccessOverlay({ mode = "login" }) {
  const [phase, setPhase] = useState("boot");   // boot → reveal → show
  const isLogin = mode === "login";

  const color   = isLogin ? T.orange : T.gold;
  const icon    = isLogin ? "⚔️" : "🎉";
  const title   = isLogin ? "¡BIENVENIDO GUERRERO!" : "¡HÉROE CREADO!";
  const subtitle = isLogin ? "Cargando tu aventura..." : "Preparando tu leyenda...";
  const xp      = isLogin ? 150 : 500;

  const BOOT_LINES = isLogin ? [
    "> VERIFICANDO CREDENCIALES...",
    "> SESIÓN AUTENTICADA ✓",
    "> CARGANDO PERFIL DE HÉROE...",
    "> SINCRONIZANDO XP Y ESTADÍSTICAS...",
    "> TODOS LOS SISTEMAS OPERATIVOS",
    "> BIENVENIDO DE VUELTA, GUERRERO.",
  ] : [
    "> REGISTRANDO NUEVO HÉROE...",
    "> CLASE ASIGNADA ✓",
    "> GENERANDO ESTADÍSTICAS BASE...",
    "> ACTIVANDO BONIFICACIONES...",
    "> PREPARANDO PRIMERA MISIÓN...",
    "> ¡TU LEYENDA COMIENZA AHORA!",
  ];

  const BADGES = isLogin
    ? [{ icon: "🔥", label: "RACHA ACTIVA" }, { icon: "⚡", label: "+150 XP" }, { icon: "🏆", label: "LVL UP" }]
    : [{ icon: "🎭", label: "CLASE NUEVA" }, { icon: "⚡", label: "+500 XP" }, { icon: "🏅", label: "PRIMER LOG" }];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(6,13,26,0.97)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 24, padding: 40,
      animation: "overlayFadeIn 0.4s ease both",
      overflowY: "auto",
    }}>
      {/* Scanlines + vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(to bottom,transparent 0px,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
        zIndex: 2,
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%,transparent 50%,rgba(0,0,0,0.7) 100%)",
        zIndex: 2,
      }} />

      {/* Partículas canvas */}
      <SuccessParticles color={color} />

      {/* Línea scan horizontal */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${color}66,${color},${color}66,transparent)`,
        animation: "scanLine 4s linear infinite",
        zIndex: 3, pointerEvents: "none",
      }} />

      {/* Contenido — sobre todo lo demás */}
      <div style={{
        position: "relative", zIndex: 4,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20,
        maxWidth: 500, width: "100%",
        animation: "pixelIn 0.5s ease both",
      }}>

        {/* Chapter tag */}
        <div style={{
          ...px(6), color: T.muted,
          letterSpacing: "0.2em",
        }}>
          ─── {isLogin ? "AVENTURA REANUDADA" : "NUEVA LEYENDA"} ───
        </div>

        {/* Boot sequence (fase 1) */}
        {phase === "boot" && (
          <BootSequence
            lines={BOOT_LINES}
            onDone={() => setPhase("reveal")}
          />
        )}

        {/* Reveal (fase 2+) */}
        {phase !== "boot" && (
          <>
            {/* Icono principal */}
            <div style={{
              fontSize: 80,
              animation: "successBurst 0.6s cubic-bezier(0.22,1,0.36,1) both",
              filter: `drop-shadow(0 0 30px ${color}) drop-shadow(0 0 60px ${color}66)`,
            }}>
              {icon}
            </div>

            {/* Título */}
            <div className="px-corners" style={{
              "--cc": color,
              padding: "14px 28px",
              background: `${color}0D`,
              border: `2px solid ${color}44`,
              textAlign: "center",
              boxShadow: `4px 4px 0 rgba(0,0,0,0.5), 0 0 30px ${color}33`,
            }}>
              <h2 style={{
                ...px(14),
                color,
                animation: "glow 2.4s ease-in-out infinite",
                marginBottom: 10,
                lineHeight: 1.6,
              }}>
                {title}
              </h2>
              <p style={{ ...raj(15, 500), color: T.muted, letterSpacing: "0.1em" }}>
                {subtitle}
              </p>
            </div>

            {/* Badges de logros */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {BADGES.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px",
                    background: T.bgCard,
                    border: `1px solid ${color}44`,
                    boxShadow: `2px 2px 0 rgba(0,0,0,0.4), 0 0 8px ${color}22`,
                    animation: `questSlide 0.3s ease ${i * 0.1}s both`,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{b.icon}</span>
                  <span style={{ ...px(6), color }}>{b.label}</span>
                </div>
              ))}
            </div>

            {/* Barra XP */}
            <XPGainBar color={color} xpGained={xp} />

            {/* Puntos de carga */}
            <LoadingDots color={color} />

            {/* Mensaje de estado */}
            <div style={{
              ...px(6), color: T.muted,
              letterSpacing: "0.15em",
              animation: "pixelBlink 1.4s infinite",
              textAlign: "center",
            }}>
              {isLogin ? "INICIANDO SESIÓN..." : "CREANDO PERSONAJE..."}
            </div>
          </>
        )}
      </div>

      {/* Versión */}
      <div style={{
        position: "absolute", bottom: 16, right: 20,
        ...px(5), color: `${T.muted}55`,
        zIndex: 4,
      }}>
        FORGEVENTURE v3.1
      </div>
    </div>
  );
}