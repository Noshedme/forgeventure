// src/pages/Home.jsx
import { useState, useEffect, useRef } from "react";

// ── Font injection ─────────────────────────────────────────────
if (!document.getElementById("fv-fonts")) {
  const l = document.createElement("link");
  l.id = "fv-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap";
  document.head.appendChild(l);
}

// ── Theme ──────────────────────────────────────────────────────
const T = {
  bg:      "#060D1A",
  bgCard:  "#0D1B2E",
  bgPanel: "#0A1628",
  navy:    "#1E3A5F",
  orange:  "#E85D04",
  orangeL: "#FF9F1C",
  gold:    "#FFD700",
  blue:    "#4CC9F0",
  teal:    "#0A9396",
  white:   "#F0F4FF",
  muted:   "#6B8CAE",
};

const CSS = `
  @keyframes glow { 0%,100%{text-shadow:0 0 20px #E85D04,0 0 40px #E85D0455} 50%{text-shadow:0 0 30px #E85D04,0 0 70px #E85D0488,0 0 110px #E85D0433} }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes floatYS { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes scanLine { 0%{top:-2px} 100%{top:100%} }
  @keyframes borderPulse { 0%,100%{border-color:#E85D04;box-shadow:0 0 10px #E85D0444} 50%{border-color:#FF9F1C;box-shadow:0 0 22px #E85D0488} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes countUp { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes pixelIn { 0%{opacity:0;transform:scale(1.04);filter:blur(6px)} 100%{opacity:1;transform:scale(1);filter:blur(0)} }
  @keyframes neonFlicker { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:0.6} }
  @keyframes progressBar { from{width:0} to{width:var(--pw)} }
  @keyframes navBtnPulse { 0%,100%{box-shadow:0 4px 20px #E85D0455} 50%{box-shadow:0 4px 32px #E85D0499} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #060D1A; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0A1628; }
  ::-webkit-scrollbar-thumb { background: #E85D04; border-radius: 3px; }
  .fv-btn { transition: transform 0.2s, box-shadow 0.2s; }
  .fv-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 30px #E85D0488 !important; }
  .fv-btn-outline { transition: transform 0.2s, box-shadow 0.2s, background 0.2s; }
  .fv-btn-outline:hover { transform: translateY(-3px); background: #E85D0411 !important; box-shadow: 0 8px 24px #E85D0444 !important; }
  .nav-link { transition: color 0.2s; cursor: pointer; }
  .nav-link:hover { color: #E85D04 !important; }
  .nav-cta { transition: transform 0.18s, box-shadow 0.18s; animation: navBtnPulse 3s ease-in-out infinite; }
  .nav-cta:hover { transform: translateY(-2px); }
  .feature-card { transition: all 0.3s ease; }
  .feature-card:hover { border-color: #E85D04 !important; transform: translateY(-5px); box-shadow: 0 14px 44px #E85D0422 !important; }
  .tab-btn { transition: color 0.2s; }
  .tab-btn:hover { color: #E85D04 !important; }
  .class-opt { transition: all 0.3s; }
`;

const px  = (s) => ({ fontFamily: "'Press Start 2P'", fontSize: s });
const raj = (s, w = 600) => ({ fontFamily: "'Rajdhani', sans-serif", fontSize: s, fontWeight: w });
const orb = (s, w = 700) => ({ fontFamily: "'Orbitron', sans-serif", fontSize: s, fontWeight: w });

// ── Scroll helper ──────────────────────────────────────────────
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top, behavior: "smooth" });
};

function Glow({ color = T.orange, size = 300, x = "50%", y = "50%", opacity = 0.12 }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size,
      borderRadius: "50%", background: color, filter: "blur(80px)",
      opacity, transform: "translate(-50%,-50%)", pointerEvents: "none",
    }} />
  );
}

function Divider() {
  return <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg,transparent,${T.navy},transparent)` }} />;
}

function Badge({ children, color = T.orange }) {
  return (
    <span style={{ ...px(8), color, border: `1px solid ${color}44`, background: `${color}11`, padding: "4px 10px", letterSpacing: "0.05em" }}>
      {children}
    </span>
  );
}

function XPBar({ label, value, color = T.orange, delay = 0 }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ ...raj(12), color: T.muted }}>{label}</span>
        <span style={{ ...px(7), color }}>{value}%</span>
      </div>
      <div style={{ height: 10, background: "#0A1628", border: `1px solid ${color}44`, position: "relative", overflow: "hidden" }}>
        <div style={{
          height: "100%", background: `linear-gradient(90deg,${color}88,${color})`,
          "--pw": `${value}%`, animation: `progressBar 1.4s ease ${delay}s both`,
          boxShadow: `0 0 8px ${color}66`,
        }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ── Pixel warrior ──────────────────────────────────────────────
function HeroCharacter() {
  const [f, setF] = useState(0);
  useEffect(() => { const t = setInterval(() => setF(p => 1 - p), 600); return () => clearInterval(t); }, []);
  const fr = [{ armY: -2, legL: 2, legR: -2 }, { armY: 2, legL: -2, legR: 2 }][f];
  return (
    <div style={{ animation: "floatY 3s ease-in-out infinite", filter: "drop-shadow(0 0 20px #E85D04aa)" }}>
      <svg width="100" height="130" viewBox="0 0 100 130" style={{ imageRendering: "pixelated" }}>
        <rect x="35" y="5" width="30" height="5" fill={T.gold} />
        <rect x="30" y="10" width="40" height="5" fill={T.gold} />
        <rect x="30" y="15" width="40" height="25" fill="#FFDAB9" />
        <rect x="38" y="22" width="8" height="6" fill={T.navy} />
        <rect x="54" y="22" width="8" height="6" fill={T.navy} />
        <rect x="40" y="23" width="4" height="4" fill={T.blue} />
        <rect x="56" y="23" width="4" height="4" fill={T.blue} />
        <rect x="32" y="17" width="12" height="3" fill="rgba(255,255,255,0.3)" />
        <rect x="28" y="40" width="44" height="35" fill={T.navy} />
        <rect x="30" y="42" width="40" height="31" fill="#2A4A7F" />
        <rect x="42" y="47" width="16" height="3" fill={T.orange} />
        <rect x="44" y="52" width="12" height="2" fill={T.orangeL} />
        <rect x="46" y="56" width="8" height="8" fill={T.orange} />
        <rect x="15" y="40" width="15" height="12" fill={T.orange} />
        <rect x="70" y="40" width="15" height="12" fill={T.orange} />
        <rect x="14" y="52" width="13" height="22" fill="#2A4A7F" transform={`translate(0,${fr.armY})`} />
        <rect x="73" y="52" width="13" height="22" fill="#2A4A7F" transform={`translate(0,${-fr.armY})`} />
        <rect x="82" y="30" width="4" height="50" fill="#C0C0FF" transform={`translate(0,${-fr.armY})`} />
        <rect x="78" y="52" width="12" height="4" fill={T.gold} transform={`translate(0,${-fr.armY})`} />
        <rect x="83" y="26" width="6" height="8" fill={T.gold} transform={`translate(0,${-fr.armY})`} />
        <rect x="8" y="50" width="12" height="16" fill={T.orange} transform={`translate(0,${fr.armY})`} />
        <rect x="10" y="52" width="8" height="12" fill={T.navy} transform={`translate(0,${fr.armY})`} />
        <rect x="13" y="55" width="2" height="6" fill={T.gold} transform={`translate(0,${fr.armY})`} />
        <rect x="30" y="75" width="17" height="30" fill={T.navy} transform={`translate(0,${fr.legL})`} />
        <rect x="53" y="75" width="17" height="30" fill={T.navy} transform={`translate(0,${fr.legR})`} />
        <rect x="28" y="103" width="21" height="10" fill="#111" transform={`translate(0,${fr.legL})`} />
        <rect x="51" y="103" width="21" height="10" fill="#111" transform={`translate(0,${fr.legR})`} />
        <ellipse cx="50" cy="120" rx="30" ry="6" fill={T.orange} opacity="0.15" />
      </svg>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────
function Navbar({ onLogin, onRegister }) {
  const [scrolled, setScrolled]       = useState(false);
  const [activeSection, setActive]    = useState("inicio");

  const NAV_LINKS = [
    { label: "Inicio",          id: "inicio"          },
    { label: "Características", id: "caracteristicas" },
    { label: "Clases",          id: "clases"          },
    { label: "Módulos",         id: "modulos"         },
    { label: "Acerca de",       id: "acerca"          },
  ];

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 40);

      // Detectar cuál sección está en pantalla
      const OFFSET = 120;
      let current = "inicio";
      for (const { id } of NAV_LINKS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= OFFSET) current = id;
      }
      setActive(current);
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? "rgba(6,13,26,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? `1px solid ${T.navy}` : "1px solid transparent",
      transition: "all 0.3s ease", padding: "0 5%",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

        {/* Logo */}
        <div onClick={() => scrollTo("inicio")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <span style={{ fontSize: 22, filter: `drop-shadow(0 0 8px ${T.orange})` }}>⚔️</span>
          <span style={{ ...px(11), color: T.orange, animation: "neonFlicker 6s ease-in-out infinite" }}>FORGE</span>
          <span style={{ ...px(11), color: T.white }}>VENTURE</span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {NAV_LINKS.map(({ label, id }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="nav-link"
                style={{
                  ...raj(13, 600),
                  color: isActive ? T.orange : T.muted,
                  background: "none", border: "none",
                  letterSpacing: "0.05em",
                  position: "relative", paddingBottom: 4,
                }}
              >
                {label}
                {/* Línea activa animada */}
                <span style={{
                  position: "absolute", bottom: 0, left: 0,
                  height: 2,
                  width: isActive ? "100%" : "0%",
                  background: T.orange,
                  boxShadow: isActive ? `0 0 8px ${T.orange}` : "none",
                  transition: "width 0.3s ease",
                }} />
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button className="nav-cta" onClick={onLogin} style={{
          ...px(8), color: T.bg, background: T.orange, border: "none",
          padding: "10px 20px", cursor: "pointer", boxShadow: `0 4px 20px ${T.orange}55`,
        }}>
          ⚔️ JUGAR
        </button>
      </div>
    </nav>
  );
}

// ── HERO ───────────────────────────────────────────────────────
function Hero({ onLogin, onRegister }) {
  const [typed, setTyped] = useState("");
  const full = "Forja tu cuerpo. Vive la aventura.";
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setTyped(full.slice(0, i)); if (i >= full.length) clearInterval(t); }, 55);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="inicio" style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 80 }}>
      <Glow color={T.orange} size={500} x="60%" y="40%" opacity={0.08} />
      <Glow color={T.blue}   size={400} x="20%" y="70%" opacity={0.06} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${T.navy}22 1px,transparent 1px),linear-gradient(90deg,${T.navy}22 1px,transparent 1px)`, backgroundSize: "50px 50px", zIndex: 0 }} />
      <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${T.orange}44,${T.orange},${T.orange}44,transparent)`, animation: "scanLine 6s linear infinite", zIndex: 1 }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 2, gap: 40 }}>
        <div style={{ flex: 1, animation: "fadeUp 0.8s ease both" }}>
          <Badge>🎮 RPG + FITNESS · 100% GRATIS</Badge>
          <h1 style={{ ...orb("clamp(36px,5vw,64px)", 900), color: T.white, margin: "20px 0 10px", lineHeight: 1.1 }}>
            <span style={{ color: T.orange, display: "block", animation: "glow 2.5s ease-in-out infinite" }}>FORGE</span>
            <span>VENTURE</span>
          </h1>
          <p style={{ ...raj(18, 500), color: T.blue, letterSpacing: "0.12em", marginBottom: 16, textTransform: "uppercase" }}>
            {typed}<span style={{ animation: "blinkCursor 1s infinite" }}>|</span>
          </p>
          <p style={{ ...raj(16, 400), color: T.muted, maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
            Convierte tu rutina de ejercicio en una <strong style={{ color: T.white }}>aventura RPG épica</strong>.
            Gana XP, sube de nivel, desbloquea habilidades y forja al guerrero definitivo — siendo tú el personaje principal.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="fv-btn" onClick={onLogin}
              style={{ ...px(9), color: T.bg, background: T.orange, border: "none", padding: "14px 28px", cursor: "pointer", boxShadow: `0 4px 24px ${T.orange}66` }}>
              ⚔️ COMENZAR AVENTURA
            </button>
            <button className="fv-btn-outline" onClick={onRegister}
              style={{ ...px(9), color: T.orange, background: "transparent", border: `2px solid ${T.orange}66`, padding: "14px 22px", cursor: "pointer" }}>
              CREAR CUENTA
            </button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
            {[["∞", "XP disponible"], ["3", "Clases únicas"], ["$0", "Costo total"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ ...orb(28, 900), color: T.orange }}>{v}</div>
                <div style={{ ...raj(12, 500), color: T.muted, letterSpacing: "0.08em", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeUp 0.8s ease 0.2s both" }}>
          <div style={{ ...px(8), color: T.gold, border: `2px solid ${T.gold}`, padding: "6px 14px", background: `${T.gold}11`, boxShadow: `0 0 16px ${T.gold}44` }}>LVL 12</div>
          <HeroCharacter />
          <div style={{ background: T.bgCard, border: `1px solid ${T.orange}44`, padding: "14px 20px", minWidth: 220, boxShadow: `0 0 30px ${T.orange}22`, animation: "borderPulse 3s infinite" }}>
            <div style={{ ...px(7), color: T.muted, marginBottom: 10, letterSpacing: "0.05em" }}>GUERRERO · CLASE A</div>
            <XPBar label="XP"  value={72} color={T.orange} />
            <XPBar label="HP"  value={88} color="#2ecc71" delay={0.2} />
            <XPBar label="STR" value={65} color={T.blue}   delay={0.4} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ ...raj(11, 600), color: T.muted }}>🔥 RACHA</span>
              <span style={{ ...px(8), color: T.orange }}>14 DÍAS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator → va a Características */}
      <div
        onClick={() => scrollTo("caracteristicas")}
        style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", animation: "floatY 2s ease-in-out infinite", zIndex: 2, cursor: "pointer" }}
      >
        <div style={{ ...raj(11, 600), color: T.muted, textAlign: "center", letterSpacing: "0.15em", marginBottom: 6 }}>SCROLL</div>
        <div style={{ width: 1, height: 30, background: `linear-gradient(${T.orange},transparent)`, margin: "0 auto" }} />
      </div>
    </section>
  );
}

// ── FEATURES ───────────────────────────────────────────────────
const FEATURES = [
  { icon: "📹", title: "Detección con Cámara",  desc: "MediaPipe detecta tu cuerpo y cuenta repeticiones automáticamente en tiempo real. Sin trampa posible.",        color: T.orange  },
  { icon: "⏱️", title: "Timer Anti-Trampa",     desc: "Sin cámara, sin problema. El temporizador inteligente pausa si cambias de pestaña y registra cada momento.",    color: T.blue    },
  { icon: "🤖", title: "Forge AI",              desc: "Tu asistente personal de entrenamiento. Siempre disponible, responde en lenguaje de videojuego.",               color: T.teal    },
  { icon: "🍎", title: "Nutrición + XP",        desc: "Come bien y gana XP de recuperación. Recetario completo, macros del día y calculadora de calorías.",            color: "#2ecc71" },
  { icon: "🏆", title: "Logros y Badges",       desc: "Desbloquea badges épicos, gana títulos y colecciona recompensas por cada meta que superas.",                    color: T.gold    },
  { icon: "⚡", title: "Tiempo Real",           desc: "El Admin actualiza rutinas, misiones y recetas — tú las ves al instante sin recargar la página.",               color: "#9B59B6" },
];

function Features() {
  return (
    <section id="caracteristicas" style={{ padding: "100px 5%", position: "relative" }}>
      <Glow color={T.blue} size={400} x="80%" y="50%" opacity={0.06} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60, animation: "fadeUp 0.6s ease both" }}>
          <Badge>✦ CARACTERÍSTICAS</Badge>
          <h2 style={{ ...orb("clamp(24px,3.5vw,40px)"), color: T.white, margin: "16px 0 12px" }}>Todo lo que necesitas</h2>
          <p style={{ ...raj(16, 400), color: T.muted, maxWidth: 500, margin: "0 auto" }}>
            Una plataforma completa que une el mundo de los videojuegos con el fitness real.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card" style={{
              background: T.bgCard, border: `1px solid ${T.navy}`, padding: "28px 24px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: `fadeUp 0.6s ease ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 14, filter: `drop-shadow(0 0 8px ${f.color}88)` }}>{f.icon}</div>
              <h3 style={{ ...orb(14), color: f.color, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ ...raj(14, 400), color: T.muted, lineHeight: 1.7 }}>{f.desc}</p>
              <div style={{ marginTop: 16, width: 32, height: 2, background: f.color, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CLASSES ────────────────────────────────────────────────────
const CLASSES = [
  {
    icon: "⚔️", name: "GUERRERO", tag: "Clase de Fuerza",
    color: T.orange, glow: `${T.orange}44`,
    bonus: "+25% XP en ejercicios de fuerza",
    stats: [["Fuerza", 95], ["Resistencia", 70], ["Agilidad", 55]],
    skills: ["Golpe Titán", "Muro de Acero", "Berserker"],
    desc: "Para los que dominan el hierro. Cada flexión, cada sentadilla te da más XP que cualquier otro.",
    ideal: "Gym, pesas, calistenia, ejercicios de fuerza y musculación.",
  },
  {
    icon: "🏃", name: "ARQUERO", tag: "Clase de Cardio",
    color: T.blue, glow: `${T.blue}44`,
    bonus: "+25% XP en ejercicios de cardio",
    stats: [["Agilidad", 95], ["Resistencia", 85], ["Fuerza", 50]],
    skills: ["Sprint Veloz", "Segundo Aire", "Flecha Infinita"],
    desc: "Velocidad y resistencia sin límites. Correr, saltar y moverse son tu fuente de poder.",
    ideal: "Cardio, running, ciclismo, saltar, deportes de velocidad.",
  },
  {
    icon: "🧘", name: "MAGO", tag: "Clase de Flexibilidad",
    color: "#9B59B6", glow: "#9B59B644",
    bonus: "+25% XP en yoga y flexibilidad",
    stats: [["Vitalidad", 95], ["Agilidad", 80], ["Resistencia", 75]],
    skills: ["Mente Clara", "Cuerpo Fluido", "Aura Zen"],
    desc: "La mente controla al cuerpo. El equilibrio y la flexibilidad son tu mayor arma.",
    ideal: "Yoga, pilates, meditación, ejercicios de flexibilidad y equilibrio.",
  },
];

function Classes({ onRegister }) {
  const [selected, setSelected] = useState(0);
  const cls = CLASSES[selected];
  return (
    <section id="clases" style={{ padding: "100px 5%", position: "relative", background: `linear-gradient(180deg,transparent,${T.bgPanel}55,transparent)` }}>
      <Glow color={T.orange} size={350} x="30%" y="50%" opacity={0.06} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <Badge>🎭 ELIGE TU CLASE</Badge>
          <h2 style={{ ...orb("clamp(24px,3.5vw,40px)"), color: T.white, margin: "16px 0 12px" }}>Tu aventura, tu estilo</h2>
          <p style={{ ...raj(15, 400), color: T.muted }}>Cada clase potencia un tipo de entrenamiento diferente.</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 40 }}>
          {CLASSES.map((c, i) => (
            <button key={i} onClick={() => setSelected(i)} className="class-opt" style={{
              ...px(8), border: `2px solid ${selected === i ? c.color : T.navy}`,
              background: selected === i ? `${c.color}22` : "transparent",
              color: selected === i ? c.color : T.muted,
              padding: "12px 24px", cursor: "pointer",
              boxShadow: selected === i ? `0 0 20px ${c.color}44` : "none",
            }}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <div key={selected} style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30,
          background: T.bgCard, border: `1px solid ${cls.color}44`,
          padding: 40, boxShadow: `0 0 50px ${cls.glow}`,
          animation: "pixelIn 0.4s ease both",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 56, filter: `drop-shadow(0 0 16px ${cls.color})`, animation: "floatYS 2.5s ease-in-out infinite" }}>{cls.icon}</div>
              <div>
                <div style={{ ...orb(28, 900), color: cls.color }}>{cls.name}</div>
                <div style={{ ...raj(13, 600), color: T.muted, letterSpacing: "0.1em", marginTop: 4 }}>{cls.tag}</div>
              </div>
            </div>
            <p style={{ ...raj(15, 400), color: T.muted, lineHeight: 1.8, marginBottom: 24 }}>{cls.desc}</p>
            <div style={{ display: "inline-block", ...raj(13, 700), color: cls.color, border: `1px solid ${cls.color}55`, background: `${cls.color}11`, padding: "8px 14px", marginBottom: 24, letterSpacing: "0.05em" }}>
              ⚡ {cls.bonus}
            </div>
            <div>
              <div style={{ ...px(8), color: T.muted, marginBottom: 12, letterSpacing: "0.05em" }}>HABILIDADES</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {cls.skills.map(s => (
                  <span key={s} style={{ ...raj(12, 600), color: cls.color, border: `1px solid ${cls.color}44`, padding: "5px 10px", background: `${cls.color}0D` }}>{s}</span>
                ))}
              </div>
            </div>
            <button className="fv-btn" onClick={onRegister}
              style={{ ...px(8), color: T.bg, background: cls.color, border: "none", padding: "12px 22px", cursor: "pointer", marginTop: 28, boxShadow: `0 4px 20px ${cls.color}55` }}>
              JUGAR COMO {cls.name} →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ ...px(8), color: T.muted, marginBottom: 20, letterSpacing: "0.05em" }}>ESTADÍSTICAS BASE</div>
            {cls.stats.map(([label, val], i) => (
              <XPBar key={label} label={label} value={val} color={cls.color} delay={i * 0.2} />
            ))}
            <div style={{ marginTop: 24, padding: 16, background: T.bgPanel, border: `1px solid ${T.navy}` }}>
              <div style={{ ...raj(12, 600), color: T.muted, marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Ideal para:</div>
              <div style={{ ...raj(14, 400), color: T.white, lineHeight: 1.7 }}>{cls.ideal}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── MODULES ────────────────────────────────────────────────────
const MODULES = [
  {
    id: "dashboard", label: "🏠 Dashboard", title: "Tu centro de operaciones",
    desc: "Cada vez que abres la app, tu personaje te espera. Ves tu XP, tu racha activa, la misión del día y cuánto falta para el siguiente nivel — todo de un vistazo.",
    preview: [
      { label: "⚔️ Aragorn_Dev",    sub: "Guerrero · Nivel 12",        right: "🔥 14 días" },
      { label: "XP Progress",       sub: "2,840 / 4,000 XP",           bar: 71, color: T.orange  },
      { label: "HP",                sub: "Salud del personaje",         bar: 88, color: "#2ecc71" },
      { label: "🎯 Misión del día", sub: "30 min cardio → 150 XP",     tag: "ACTIVA" },
    ],
  },
  {
    id: "exercise", label: "⚔️ Ejercicio", title: "Entrena. Gana XP real.",
    desc: "La cámara detecta tu cuerpo con IA y cuenta cada repetición. Sin cámara, el temporizador anti-trampa garantiza que solo ganas XP si de verdad entrenas.",
    preview: [
      { label: "📹 Modo Cámara", sub: "MediaPipe detecta postura en tiempo real", tag: "IA"     },
      { label: "⏱️ Modo Timer",  sub: "Anti-trampa: pausa si cambias de pestaña", tag: "ACTIVO" },
      { label: "💪 Flexiones",   sub: "23 reps completadas · 180 XP ganados",     bar: 77, color: T.orange },
      { label: "🏃 Cardio",      sub: "18 min activos · 120 XP ganados",          bar: 60, color: T.blue   },
    ],
  },
  {
    id: "nutrition", label: "🍎 Nutrición", title: "Come bien. Gana más XP.",
    desc: "Registra tus comidas del día, revisa el recetario saludable y si cumples tus macros recibes un bono especial de XP de recuperación para tu personaje.",
    preview: [
      { label: "🥩 Proteínas",     sub: "120g / 150g objetivo", bar: 80, color: "#E74C3C" },
      { label: "🍚 Carbohidratos", sub: "180g / 220g objetivo", bar: 82, color: T.orange  },
      { label: "🥑 Grasas",        sub: "55g / 65g objetivo",   bar: 85, color: T.gold    },
      { label: "🍗 Bonus XP",      sub: "Completar macros del día → +50 XP", tag: "PENDIENTE" },
    ],
  },
  {
    id: "stats", label: "📊 Estadísticas", title: "Tu progreso, visible.",
    desc: "Gráficas animadas de tu evolución física y de juego. Compara semanas, ve tus récords personales y demuestra — con datos reales — que sí estás mejorando.",
    preview: [
      { label: "📈 Esta semana",      sub: "5 sesiones · 1,240 XP · +18% vs semana ant.", tag: "↑18%" },
      { label: "🏆 Mejor racha",      sub: "14 días consecutivos activos",   bar: 100, color: T.gold   },
      { label: "💪 Récord flexiones", sub: "38 reps — Personal best",        bar: 76,  color: T.orange },
      { label: "⏱️ Sesión más larga", sub: "72 minutos activos continuos",   bar: 60,  color: T.blue   },
    ],
  },
];

function ModulePreviewCard({ items }) {
  return (
    <div style={{ background: T.bgPanel, border: `1px solid ${T.navy}`, padding: 24, minHeight: 260, display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.navy}55`, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: item.bar !== undefined ? 8 : 0 }}>
            <div>
              <div style={{ ...raj(13, 700), color: T.white, marginBottom: 2 }}>{item.label}</div>
              <div style={{ ...raj(12, 400), color: T.muted }}>{item.sub}</div>
            </div>
            {item.right && <span style={{ ...px(7), color: T.orange }}>{item.right}</span>}
            {item.tag && (
              <span style={{
                ...raj(10, 700),
                color: ["ACTIVA","IA","ACTIVO"].includes(item.tag) || item.tag.startsWith("↑") ? "#2ecc71" : T.muted,
                border: "1px solid currentColor", padding: "2px 6px", letterSpacing: "0.05em",
              }}>{item.tag}</span>
            )}
          </div>
          {item.bar !== undefined && (
            <div style={{ height: 6, background: "#0A1628", border: `1px solid ${item.color}33`, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${item.bar}%`, background: item.color, boxShadow: `0 0 6px ${item.color}88`, transition: "width 0.8s ease" }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Modules({ onLogin }) {
  const [active, setActive] = useState(0);
  const mod = MODULES[active];
  return (
    <section id="modulos" style={{ padding: "100px 5%", position: "relative" }}>
      <Glow color={T.teal} size={300} x="70%" y="30%" opacity={0.07} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <Badge>📱 MÓDULOS</Badge>
          <h2 style={{ ...orb("clamp(24px,3.5vw,40px)"), color: T.white, margin: "16px 0 12px" }}>Una app, muchos mundos</h2>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 30, borderBottom: `1px solid ${T.navy}`, overflowX: "auto", paddingBottom: 1 }}>
          {MODULES.map((m, i) => (
            <button key={i} onClick={() => setActive(i)} className="tab-btn" style={{
              ...raj(13, 600), background: "transparent", border: "none",
              borderBottom: active === i ? `3px solid ${T.orange}` : "3px solid transparent",
              color: active === i ? T.orange : T.muted,
              padding: "12px 20px", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.04em",
            }}>
              {m.label}
            </button>
          ))}
        </div>
        <div key={active} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center", animation: "pixelIn 0.35s ease both" }}>
          <div>
            <h3 style={{ ...orb(22), color: T.white, marginBottom: 14 }}>{mod.title}</h3>
            <p style={{ ...raj(15, 400), color: T.muted, lineHeight: 1.8, marginBottom: 24 }}>{mod.desc}</p>
            <div style={{ width: 50, height: 3, background: T.orange, marginBottom: 24, boxShadow: `0 0 8px ${T.orange}` }} />
            <button className="fv-btn" onClick={onLogin}
              style={{ ...px(8), color: T.bg, background: T.orange, border: "none", padding: "12px 22px", cursor: "pointer", boxShadow: `0 4px 20px ${T.orange}55` }}>
              ACCEDER →
            </button>
          </div>
          <ModulePreviewCard items={mod.preview} />
        </div>
      </div>
    </section>
  );
}

// ── ABOUT / CTA ────────────────────────────────────────────────
function About({ onLogin, onRegister }) {
  const stats = [
    { icon: "⚔️", value: "12",  label: "Pantallas de juego"   },
    { icon: "🏋️", value: "50+", label: "Ejercicios incluidos"  },
    { icon: "🏆", value: "30+", label: "Logros desbloqueables" },
    { icon: "🤖", value: "1",   label: "IA asistente"          },
  ];
  return (
    <section id="acerca" style={{ padding: "100px 5%", position: "relative", background: `linear-gradient(180deg,transparent,${T.bgPanel}88,transparent)` }}>
      <Glow color={T.orange} size={500} x="50%" y="50%" opacity={0.05} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 80 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center", background: T.bgCard, border: `1px solid ${T.navy}`, padding: "30px 20px", animation: `countUp 0.5s ease ${i * 0.12}s both` }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ ...orb(36, 900), color: T.orange, animation: "glow 3s ease-in-out infinite" }}>{s.value}</div>
              <div style={{ ...raj(13, 600), color: T.muted, marginTop: 6, letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "60px 40px", background: T.bgCard, border: `1px solid ${T.orange}44`, boxShadow: `0 0 60px ${T.orange}11`, position: "relative", overflow: "hidden" }}>
          <Glow color={T.orange} size={300} x="50%" y="50%" opacity={0.06} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ ...px(9), color: T.orange, marginBottom: 16, letterSpacing: "0.05em", animation: "glow 2s ease-in-out infinite" }}>
              ¿LISTO PARA LA AVENTURA?
            </div>
            <h2 style={{ ...orb("clamp(28px,4vw,52px)", 900), color: T.white, marginBottom: 16, lineHeight: 1.15 }}>
              Tu personaje te está<br />
              <span style={{ color: T.orange }}>esperando.</span>
            </h2>
            <p style={{ ...raj(16, 400), color: T.muted, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Crea tu cuenta gratis, elige tu clase y empieza a ganar XP con cada repetición que hagas en la vida real.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="fv-btn" onClick={onRegister}
                style={{ ...px(9), color: T.bg, background: T.orange, border: "none", padding: "16px 32px", cursor: "pointer", boxShadow: `0 6px 30px ${T.orange}66` }}>
                ⚔️ CREAR CUENTA GRATIS
              </button>
              <button className="fv-btn-outline" onClick={onLogin}
                style={{ ...px(9), color: T.muted, background: "transparent", border: `2px solid ${T.navy}`, padding: "16px 24px", cursor: "pointer" }}>
                INICIAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.navy}`, padding: "32px 5%", background: T.bgPanel }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div onClick={() => scrollTo("inicio")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>⚔️</span>
          <span style={{ ...px(8), color: T.orange }}>FORGE</span>
          <span style={{ ...px(8), color: T.muted }}>VENTURE</span>
        </div>
        <div style={{ ...raj(12, 500), color: T.muted, letterSpacing: "0.08em" }}>
          Forja tu cuerpo · Vive la aventura · v1.0.0
        </div>
        <div style={{ ...raj(12, 400), color: T.muted }}>
          Tesis de Graduación — Desarrollo de Software
        </div>
      </div>
    </footer>
  );
}

// ── Main Home ──────────────────────────────────────────────────
export default function Home({ onLogin, onRegister }) {
  return (
    <>
      <style>{CSS}</style>
      <div style={{ background: T.bg, minHeight: "100vh", color: T.white, overflowX: "hidden" }}>
        <Navbar   onLogin={onLogin} onRegister={onRegister} />
        <Hero     onLogin={onLogin} onRegister={onRegister} />
        <Divider />
        <Features />
        <Divider />
        <Classes  onRegister={onRegister} />
        <Divider />
        <Modules  onLogin={onLogin} />
        <Divider />
        <About    onLogin={onLogin} onRegister={onRegister} />
        <Footer />
      </div>
    </>
  );
}