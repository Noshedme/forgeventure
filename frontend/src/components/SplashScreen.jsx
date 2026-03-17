import { useEffect, useState, useRef } from "react";

// ── Pixel font via Google Fonts (loaded in index.html or here via style inject)
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;600;700&display=swap";
document.head.appendChild(fontLink);

// ── Particle system ────────────────────────────────────────────
function useParticles(canvasRef, count = 80) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -Math.random() * 0.8 - 0.2,
      opacity: Math.random() * 0.7 + 0.1,
      color: Math.random() > 0.6
        ? `hsl(${24 + Math.random() * 20}, 95%, 60%)`   // orange
        : Math.random() > 0.5
          ? `hsl(${200 + Math.random() * 40}, 80%, 70%)` // blue
          : `hsl(${50 + Math.random() * 20}, 100%, 70%)`, // gold
      pulse: Math.random() * Math.PI * 2,
    }));

    // Pixel star shapes
    const drawPixelStar = (ctx, x, y, size, color, opacity) => {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      // Cross shape for pixel feel
      ctx.fillRect(x - size / 2, y - size * 1.5, size, size * 3);
      ctx.fillRect(x - size * 1.5, y - size / 2, size * 3, size);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.03;
        const pulseOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.size > 2) {
          drawPixelStar(ctx, p.x, p.y, p.size * 0.4, p.color, pulseOpacity);
        } else {
          ctx.globalAlpha = pulseOpacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.size), Math.ceil(p.size));
        }
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
}

// ── Grid scanlines overlay ─────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
      backgroundImage: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.08) 2px,
        rgba(0,0,0,0.08) 4px
      )`,
    }} />
  );
}

// ── Pixel character sprite (CSS art) ──────────────────────────
function PixelCharacter({ visible }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.8)",
      transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
      imageRendering: "pixelated",
      fontSize: 0,
      lineHeight: 0,
      marginBottom: 8,
    }}>
      {/* Pixel art warrior using CSS box-shadows */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <WarriorSprite />
      </div>
    </div>
  );
}

function WarriorSprite() {
  const px = (map, color = "#E85D04") => {
    const shadows = [];
    map.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell !== " ") {
          const c = cell === "O" ? "#FF9F1C" : cell === "B" ? "#1E3A5F" : cell === "S" ? "#C0C0FF" : cell === "G" ? "#FFD700" : cell === "K" ? "#0A1628" : color;
          shadows.push(`${x * 5}px ${y * 5}px 0 ${c}`);
        }
      });
    });
    return shadows.join(", ");
  };

  const sprite = [
    "   GGG   ",
    "  GOOOOG ",
    "  GOKKOG ",
    "  GOOOOG ",
    "   BBBBB ",
    "  BBSSSBB",
    " BBB S BBB",
    "  B  S  B ",
    " BB  S  BB",
  ];

  return (
    <div style={{
      position: "relative",
      width: 5, height: 5,
      boxShadow: px(sprite),
      marginLeft: 20,
      marginBottom: sprite.length * 5,
      marginRight: sprite[0].length * 5,
      filter: "drop-shadow(0 0 12px #E85D04aa)",
    }} />
  );
}

// ── XP Loading bar ─────────────────────────────────────────────
function XPBar({ progress, visible }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.6s ease 0.4s",
      width: "100%",
      maxWidth: 420,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8,
      }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#E85D04", letterSpacing: 1 }}>
          XP
        </span>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFD700" }}>
          {Math.floor(progress)}%
        </span>
      </div>
      {/* Outer bar */}
      <div style={{
        width: "100%", height: 20,
        border: "3px solid #E85D04",
        background: "#0A1628",
        position: "relative",
        imageRendering: "pixelated",
        boxShadow: "0 0 20px #E85D0455, inset 0 0 10px #00000088",
      }}>
        {/* Pixel segments */}
        {Array.from({ length: 20 }).map((_, i) => {
          const filled = (i / 20) * 100 < progress;
          const partial = !filled && ((i / 20) * 100 < progress + 5);
          return (
            <div key={i} style={{
              position: "absolute",
              left: i * (100 / 20) + "%",
              width: "calc(" + (100 / 20) + "% - 2px)",
              top: 2, bottom: 2,
              background: filled
                ? i % 3 === 0 ? "#FF9F1C" : "#E85D04"
                : "transparent",
              boxShadow: filled ? "0 0 6px #E85D0488" : "none",
              transition: "background 0.1s",
            }} />
          );
        })}
        {/* Shine */}
        <div style={{
          position: "absolute", top: 2, left: 0,
          width: progress + "%", height: "40%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
          transition: "width 0.1s",
          pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

// ── Status messages ────────────────────────────────────────────
const MESSAGES = [
  "Inicializando aventura...",
  "Cargando estadísticas del héroe...",
  "Equipando armadura pixel...",
  "Calibrando sistema de XP...",
  "Sincronizando misiones diarias...",
  "Preparando el campo de batalla...",
  "¡Tu aventura está por comenzar!",
];

// ── Floating runes ─────────────────────────────────────────────
const RUNES = ["⚔", "🛡", "💪", "⚡", "🔥", "✦", "◆", "▲"];

function FloatingRune({ rune, style }) {
  return (
    <div style={{
      position: "absolute",
      fontFamily: "monospace",
      fontSize: Math.random() * 14 + 10,
      color: Math.random() > 0.5 ? "#E85D0444" : "#1E3A5F66",
      animation: `floatRune ${4 + Math.random() * 4}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 4}s`,
      userSelect: "none",
      pointerEvents: "none",
      ...style,
    }}>
      {rune}
    </div>
  );
}

// ── Corner decorations ─────────────────────────────────────────
function CornerDeco({ position }) {
  const isRight = position.includes("right");
  const isBottom = position.includes("bottom");
  return (
    <div style={{
      position: "absolute",
      [isBottom ? "bottom" : "top"]: 24,
      [isRight ? "right" : "left"]: 24,
      width: 60, height: 60,
      borderTop: isBottom ? "none" : "3px solid #E85D04",
      borderBottom: isBottom ? "3px solid #E85D04" : "none",
      borderLeft: isRight ? "none" : "3px solid #E85D04",
      borderRight: isRight ? "3px solid #E85D04" : "none",
      opacity: 0.6,
    }} />
  );
}

// ── Main SplashScreen ──────────────────────────────────────────
export default function SplashScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [phase, setPhase] = useState("enter"); // enter | loading | done
  const [titleVisible, setTitleVisible] = useState(false);
  const [charVisible, setCharVisible] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [exitAnim, setExitAnim] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useParticles(canvasRef, 70);

  // Entry sequence
  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 300);
    setTimeout(() => setCharVisible(true), 700);
    setTimeout(() => setBarVisible(true), 1000);
  }, []);

  // Loading progress
  useEffect(() => {
    if (!barVisible) return;
    let current = 0;
    const interval = setInterval(() => {
      const step = Math.random() * 4 + 1;
      current = Math.min(current + step, 100);
      setProgress(current);

      // Update message
      const idx = Math.floor((current / 100) * (MESSAGES.length - 1));
      setMsgIdx(idx);

      // Glitch effect at certain points
      if (Math.floor(current) % 25 === 0) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 80);
          setTimeout(() => {
            setExitAnim(true);
            setTimeout(() => onComplete?.(), 800);
          }, 500);
        }, 400);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [barVisible]);

  const runePositions = [
    { top: "10%", left: "5%" }, { top: "20%", right: "8%" },
    { top: "40%", left: "3%" }, { top: "60%", right: "5%" },
    { top: "75%", left: "8%" }, { top: "85%", right: "10%" },
    { top: "15%", left: "20%" }, { top: "70%", right: "20%" },
  ];

  return (
    <>
      <style>{`
        @keyframes floatRune {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(10deg); opacity: 0.7; }
        }
        @keyframes titleGlow {
          0%, 100% { text-shadow: 0 0 20px #E85D04, 0 0 40px #E85D0466, 0 0 80px #E85D0422; }
          50% { text-shadow: 0 0 30px #E85D04, 0 0 60px #E85D0488, 0 0 100px #E85D0444, 0 0 140px #E85D0422; }
        }
        @keyframes subtitlePulse {
          0%, 100% { opacity: 0.7; letter-spacing: 0.3em; }
          50% { opacity: 1; letter-spacing: 0.4em; }
        }
        @keyframes scanMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes glitchShift {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 1px); clip-path: inset(30% 0 50% 0); }
          40% { transform: translate(3px, -1px); clip-path: inset(10% 0 70% 0); }
          60% { transform: translate(-2px, 2px); clip-path: inset(60% 0 20% 0); }
          80% { transform: translate(2px, -2px); clip-path: inset(80% 0 5% 0); }
          100% { transform: translate(0); clip-path: none; }
        }
        @keyframes borderScan {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        @keyframes pixelFadeIn {
          0% { opacity: 0; transform: scale(0.95); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes exitSlide {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); filter: brightness(3); }
        }
        @keyframes levelUp {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#060D1A",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        animation: exitAnim ? "exitSlide 0.8s forwards" : "pixelFadeIn 0.5s forwards",
      }}>

        {/* Particle canvas */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

        {/* Scanlines */}
        <Scanlines />

        {/* Moving scan line */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #E85D0444, #E85D04, #E85D0444, transparent)",
          animation: "scanLine 4s linear infinite",
          zIndex: 2, pointerEvents: "none",
        }} />

        {/* Corner decorations */}
        <CornerDeco position="top-left" />
        <CornerDeco position="top-right" />
        <CornerDeco position="bottom-left" />
        <CornerDeco position="bottom-right" />

        {/* Floating runes */}
        {RUNES.map((rune, i) => (
          <FloatingRune key={i} rune={rune} style={runePositions[i]} />
        ))}

        {/* Radial background glow */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, #1E3A5F22 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Grid lines */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(30,58,95,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,58,95,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }} />

        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 0,
          padding: "0 40px",
          width: "100%", maxWidth: 560,
          animation: glitch ? "glitchShift 0.15s steps(1) forwards" : "none",
        }}>

          {/* Logo / sword icon */}
          <div style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "scale(1)" : "scale(0.5)",
            transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
            fontSize: 48, marginBottom: 8,
            filter: "drop-shadow(0 0 20px #E85D04)",
            animation: titleVisible ? "levelUp 2s ease-in-out infinite" : "none",
          }}>
            ⚔️
          </div>

          {/* FORGEVENTURE title */}
          <h1 style={{
            fontFamily: "'Press Start 2P'",
            fontSize: "clamp(20px, 4vw, 36px)",
            color: "#E85D04",
            margin: "0 0 6px 0",
            letterSpacing: "0.05em",
            animation: titleVisible ? "titleGlow 2s ease-in-out infinite" : "none",
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(-30px)",
            transition: "opacity 0.8s, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            textAlign: "center",
          }}>
            FORGEVENTURE
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(11px, 2vw, 14px)",
            color: "#7AB3D4",
            letterSpacing: "0.35em",
            margin: "0 0 32px 0",
            textTransform: "uppercase",
            opacity: titleVisible ? 1 : 0,
            animation: titleVisible ? "subtitlePulse 3s ease-in-out infinite" : "none",
            transition: "opacity 1s ease 0.3s",
            textAlign: "center",
          }}>
            Forja tu cuerpo · Vive la aventura
          </p>

          {/* Pixel character */}
          <PixelCharacter visible={charVisible} />

          {/* Divider */}
          <div style={{
            width: "100%", height: 2, margin: "16px 0",
            background: "linear-gradient(90deg, transparent, #E85D04, #FFD700, #E85D04, transparent)",
            opacity: barVisible ? 0.8 : 0,
            transition: "opacity 0.5s ease 0.2s",
            boxShadow: "0 0 10px #E85D0466",
          }} />

          {/* XP Loading bar */}
          <XPBar progress={progress} visible={barVisible} />

          {/* Status message */}
          <div style={{
            marginTop: 16,
            fontFamily: "'Press Start 2P'",
            fontSize: "clamp(6px, 1.2vw, 9px)",
            color: "#7AB3D4",
            opacity: barVisible ? 1 : 0,
            transition: "opacity 0.5s ease 0.6s",
            minHeight: 24,
            textAlign: "center",
            letterSpacing: "0.05em",
            animation: glitch ? "glitchShift 0.1s steps(1)" : "none",
          }}>
            {MESSAGES[msgIdx]}
          </div>

          {/* Version tag */}
          <div style={{
            marginTop: 24,
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 12,
            color: "#1E3A5F",
            letterSpacing: "0.2em",
            opacity: barVisible ? 0.6 : 0,
            transition: "opacity 0.5s ease 0.8s",
          }}>
            v1.0.0 · ALPHA
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, #1E3A5F, #E85D04 ${progress}%, #0A1628 ${progress}%)`,
          transition: "background 0.1s",
          zIndex: 10,
          boxShadow: "0 0 15px #E85D0488",
        }} />
      </div>
    </>
  );
}