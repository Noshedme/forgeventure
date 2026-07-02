// src/components/shared/theme.js
// ─── Única fuente de verdad visual para todos los componentes ───

// ── Paleta ────────────────────────────────────────────────────────
export const T = {
  bg:      "#060B14",   // midnight blue-black
  bgCard:  "#0B1822",   // deep card
  bgPanel: "#091320",   // dark panel
  navy:    "#1A3050",   // deep navy
  orange:  "#C05618",   // rich copper  (was electric orange)
  orangeL: "#C87A38",   // warm amber   (was bright orangeL)
  gold:    "#B89228",   // antique gold (was garish yellow)
  blue:    "#4292C8",   // steel blue   (was electric cyan)
  teal:    "#0C8280",   // deep teal
  white:   "#DCE2F0",   // cool blue-white
  muted:   "#587090",   // muted blue-grey
  error:   "#B83228",   // deep crimson
  success: "#28905A",   // forest emerald
};

// ── Helpers de tipografía ─────────────────────────────────────────
export const px  = (s) => ({ fontFamily: "'Press Start 2P'", fontSize: s });
export const raj = (s, w = 500) => ({ fontFamily: "'Space Grotesk', sans-serif", fontSize: s, fontWeight: w });
export const orb = (s, w = 700) => ({ fontFamily: "'Orbitron', sans-serif", fontSize: s, fontWeight: w });

// ── Datos de clases ───────────────────────────────────────────────
export const CLASSES = [
  {
    icon: "⚔️", name: "GUERRERO", tag: "Clase de Fuerza", color: T.orange, glow: `${T.orange}44`,
    bg: `${T.orange}11`,
    bonus: "+25% XP en ejercicios de fuerza",
    stats: [["Fuerza", 95, "XP extra en press, sentadilla y peso muerto"], ["Resistencia", 70, "Aguanta series largas sin penalización de fatiga"], ["Agilidad", 55, "Velocidad de reacción en WODs y circuitos HIIT"]],
    skills: ["Golpe Titán", "Muro de Acero", "Berserker"],
    desc: "Para los que dominan el hierro. Cada flexión te da más XP.",
    ideal: "Gym, pesas, calistenia.",
    tier: "S", rarity: "LEGENDARIO", rarityColor: T.gold,
  },
  {
    icon: "🏃", name: "ARQUERO", tag: "Clase de Cardio", color: T.blue, glow: `${T.blue}44`,
    bg: `${T.blue}11`,
    bonus: "+25% XP en ejercicios de cardio",
    stats: [["Agilidad", 95, "Bonificación máxima en cardio, running y ciclismo"], ["Resistencia", 85, "Reduce el coste de XP en ejercicios de larga duración"], ["Fuerza", 50, "XP base en ejercicios de fuerza sin bonificación"]],
    skills: ["Sprint Veloz", "Segundo Aire", "Flecha Infinita"],
    desc: "Velocidad y resistencia sin límites. Correr es tu poder.",
    ideal: "Cardio, running, ciclismo.",
    tier: "A", rarity: "ÉPICO", rarityColor: "#9B59B6",
  },
  {
    icon: "🧘", name: "MAGO", tag: "Clase Flexibilidad", color: "#9B59B6", glow: "#9B59B644",
    bg: "#9B59B611",
    bonus: "+25% XP en yoga y flexibilidad",
    stats: [["Vitalidad", 95, "HP máximo y recuperación acelerada entre sesiones"], ["Agilidad", 80, "Bonificación en yoga, pilates y movilidad activa"], ["Resistencia", 75, "Penalización reducida en sesiones de alta intensidad"]],
    skills: ["Mente Clara", "Cuerpo Fluido", "Aura Zen"],
    desc: "La mente controla al cuerpo. El equilibrio es tu arma.",
    ideal: "Yoga, pilates, meditación.",
    tier: "A", rarity: "RARO", rarityColor: T.blue,
  },
];

// ── Keyframes globales (inyectar una sola vez en el root) ─────────
export const AUTH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

  @keyframes glow        { 0%,100%{text-shadow:0 0 8px #C05618,0 0 20px #C0561855,2px 2px 0 #000} 50%{text-shadow:0 0 16px #C05618,0 0 40px #C0561880,0 0 60px #C0561822,2px 2px 0 #000} }
  @keyframes floatY      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes floatYS     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes borderPulse { 0%,100%{border-color:#C05618;box-shadow:0 0 8px #C0561844,inset 0 0 8px #C0561811} 50%{border-color:#C87A38;box-shadow:0 0 20px #C0561880,inset 0 0 12px #C0561822} }
  @keyframes pixelBlink  { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes pixelIn     { 0%{opacity:0;transform:scale(1.04);filter:blur(4px)} 100%{opacity:1;transform:scale(1);filter:blur(0)} }
  @keyframes scanLine    { 0%{top:-2px} 100%{top:100%} }
  @keyframes progressBar { from{width:0} to{width:var(--pw,100%)} }
  @keyframes loaderPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
  @keyframes loaderSpin  { to{transform:rotate(360deg)} }
  @keyframes neonFlicker { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:0.5} }
  @keyframes questSlide  { from{transform:translateX(-20px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes statCountUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes achievePop  { 0%{transform:translateX(120%);opacity:0} 8%{transform:translateX(0);opacity:1} 80%{transform:translateX(0);opacity:1} 100%{transform:translateX(130%);opacity:0} }
  @keyframes selectRingAnim { 0%,100%{box-shadow:0 0 0 2px var(--c,#C05618),0 0 12px var(--c,#C05618),2px 2px 0 rgba(0,0,0,0.4)} 50%{box-shadow:0 0 0 4px var(--c,#C05618),0 0 28px var(--c,#C05618),2px 2px 0 rgba(0,0,0,0.4)} }
  @keyframes inputFocus  { 0%{box-shadow:0 0 0 0 #C0561844} 100%{box-shadow:0 0 0 4px #C0561822,2px 2px 0 rgba(0,0,0,0.4)} }
  @keyframes errorShake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes particleDrift { 0%{transform:translateY(0) translateX(0) rotate(0deg);opacity:0.7} 100%{transform:translateY(-120vh) translateX(var(--dx)) rotate(720deg);opacity:0} }
  @keyframes spinDot     { to{transform:rotate(360deg)} }
  @keyframes xpFill      { from{width:0} to{width:var(--pw)} }
  @keyframes glitchText  { 0%,100%{clip-path:none;transform:none} 92%{clip-path:polygon(0 0,100% 0,100% 35%,0 35%);transform:translateX(-3px)} 94%{clip-path:polygon(0 60%,100% 60%,100% 100%,0 100%);transform:translateX(3px)} 96%{clip-path:none} }
  @keyframes heroReveal  { 0%{opacity:0;transform:scale(0.8) translateY(20px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes successBurst{ 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes overlayFadeIn{ from{opacity:0} to{opacity:1} }
  @keyframes cardHoverGlow{ 0%,100%{box-shadow:0 0 0 2px var(--c),0 8px 32px var(--g),2px 2px 0 rgba(0,0,0,0.4)} 50%{box-shadow:0 0 0 3px var(--c),0 12px 48px var(--g),2px 2px 0 rgba(0,0,0,0.4)} }

  /* ── Scrollbar pixel ── */
  ::-webkit-scrollbar { width:8px; }
  ::-webkit-scrollbar-track { background:#091320; }
  ::-webkit-scrollbar-thumb { background:#C05618; box-shadow:inset 2px 2px 0 #C87A3844,inset -2px -2px 0 rgba(0,0,0,0.3); }

  /* ── Scanlines ── */
  .auth-scanlines { position:fixed;inset:0;z-index:9990;pointer-events:none; background:repeating-linear-gradient(to bottom,transparent 0px,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px); }
  .auth-vignette  { position:fixed;inset:0;z-index:9989;pointer-events:none; background:radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(0,0,0,0.6) 100%); }

  /* ── Pixel corners ── */
  .px-corners { position:relative; }
  .px-corners::before {
    content:''; position:absolute; inset:-3px; pointer-events:none; z-index:10;
    background:
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 0 0/14px 2px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 0 0/2px 14px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 100% 0/14px 2px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 100% 0/2px 14px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 0 100%/14px 2px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 0 100%/2px 14px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 100% 100%/14px 2px no-repeat,
      linear-gradient(var(--cc,#C05618),var(--cc,#C05618)) 100% 100%/2px 14px no-repeat;
  }

  /* ── RPG Window ── */
  .rpg-window {
    background:rgba(6,11,20,0.96); border:2px solid #1A3050;
    box-shadow:0 0 0 1px #060B14,4px 4px 0 rgba(0,0,0,0.4),inset 0 1px 0 rgba(66,146,200,0.07);
    position:relative;
  }
  .rpg-window::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,rgba(66,146,200,0.18),transparent);
  }

  /* ── Pixel map bg ── */
  .px-map-bg {
    background-image:
      radial-gradient(circle,rgba(192,86,24,0.12) 1px,transparent 1px),
      radial-gradient(circle,rgba(66,146,200,0.05) 1px,transparent 1px);
    background-size:32px 32px,64px 64px;
    background-position:0 0,16px 16px;
  }

  /* ── Pixel button ── */
  .fv-btn {
    position:relative; overflow:hidden;
    box-shadow:3px 3px 0 rgba(0,0,0,0.5),inset 2px 2px 0 rgba(255,255,255,0.15);
    image-rendering:pixelated;
    transition:transform 0.1s,box-shadow 0.1s;
  }
  .fv-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.2) 0%,transparent 50%);transform:translateX(-100%) skewX(-20deg);transition:transform 0.4s ease; }
  .fv-btn:hover::before { transform:translateX(200%) skewX(-20deg); }
  .fv-btn:hover { transform:translateY(-2px);box-shadow:3px 5px 0 rgba(0,0,0,0.6),inset 2px 2px 0 rgba(255,255,255,0.15),0 8px 20px #C0561840 !important; }
  .fv-btn:active { transform:translateY(1px);box-shadow:1px 1px 0 rgba(0,0,0,0.5) !important; }

  /* ── RPG Input ── */
  .fv-input {
    outline:none; box-sizing:border-box;
    transition:border-color 0.2s, box-shadow 0.2s;
    image-rendering:pixelated;
  }
  .fv-input:focus {
    border-color:#C05618 !important;
    box-shadow:0 0 0 3px #C0561820, 2px 2px 0 rgba(0,0,0,0.4);
    animation:inputFocus 0.3s ease both;
  }
  .fv-input::placeholder { color:#1A3050; }
  .fv-input.error-shake { animation:errorShake 0.4s ease; }

  /* ── Noise overlay ── */
  .px-noise {
    position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:128px;
  }

  /* ── Glitch hover ── */
  .glitch-hover:hover { animation:glitchText 0.4s ease; }
`;