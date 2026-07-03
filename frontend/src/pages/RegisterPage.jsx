// src/pages/RegisterPage.jsx — v7 · ForgeVenture Design System v3
// ─────────────────────────────────────────────────────────────────────────────
// PRESERVADO: toda la lógica auth (Firebase, registerProfile, checkUsername,
//             validateClean, 2-step wizard, Google flow, debounce username)
// REDISEÑADO: DS v3 · Glassmorphism · Ambient orbs · Rajdhani/Orbitron/Press Start 2P
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import {
  motion, AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Map as MapIcon,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { C, px, raj, orb } from "../components/admin/config/shared.jsx";
import { auth }                       from "../firebase";
import { registerProfile, checkUsername } from "../services/api";
import * as RadixCheckbox             from "@radix-ui/react-checkbox";
import { validateClean }              from "../utils/profanityFilter.js";
import { CLASSES }                    from "../components/shared/theme";
import AuthPortalLoader               from "../components/auth/AuthPortalLoader";

// ── Font injection ─────────────────────────────────────────────
if (!document.getElementById("fv7r-fonts")) {
  const l = document.createElement("link");
  l.id = "fv7r-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Sora:wght@400;600;700;800&display=swap";
  document.head.appendChild(l);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Design palette (ForgeVenture DS v3 — keeps P.xxx refs intact) ─────────
const P = {
  bg0:    C.bg,
  bg1:    C.side,
  bg2:    C.card,
  accent: C.orange,
  accent2:C.gold,
  gold:   C.gold,
  blue:   C.blue,
  purple: C.purple,
  line:   C.navy,
  navy:   C.navy,
  text:   C.white,
  muted:  C.muted,
  mutedL: C.mutedL,
  success:C.green,
  error:  C.red,
};

const HOME_PUBLIC_COLORS = {
  warrior: "#ff5d73",
  archer: "#79dd58",
  mage: "#53c7ff",
  neutral: "#dbe3ff",
  neutralSoft: "#aeb9d5",
};

const HOME_PANEL_GRADIENT = `linear-gradient(135deg,
  color-mix(in srgb, ${HOME_PUBLIC_COLORS.warrior} 5%, transparent),
  rgba(255, 255, 255, 0.035) 38%,
  color-mix(in srgb, ${HOME_PUBLIC_COLORS.mage} 5%, transparent))`;

const HOME_PANEL_INSET = `
  inset 0 1px 0 rgba(255,255,255,0.04),
  inset 1px 0 0 color-mix(in srgb, ${HOME_PUBLIC_COLORS.warrior} 16%, transparent),
  inset 0 -1px 0 color-mix(in srgb, ${HOME_PUBLIC_COLORS.archer} 14%, transparent),
  inset -1px 0 0 color-mix(in srgb, ${HOME_PUBLIC_COLORS.mage} 16%, transparent)
`;

const getRegisterAccent = (step, classIdx = 0) =>
  step === 2 ? CLASS_DISPLAY[classIdx]?.color ?? HOME_PUBLIC_COLORS.neutral : HOME_PUBLIC_COLORS.neutral;

const homeHeading = (size, weight = 700) => ({
  fontFamily: "'Sora', sans-serif",
  fontSize: size,
  fontWeight: weight,
  letterSpacing: 0,
});

function makeHomePanel({
  radius = 22,
  surface = "rgba(10, 9, 20, 0.74)",
  border = "rgba(255,255,255,0.08)",
  outerGlow = "rgba(0,0,0,0.28)",
} = {}) {
  return {
    borderRadius: radius,
    border: `1px solid ${border}`,
    background: `${HOME_PANEL_GRADIENT}, ${surface}`,
    backdropFilter: "blur(16px)",
    boxShadow: `${HOME_PANEL_INSET}, 0 18px 46px ${outerGlow}`,
  };
}

function makeHomePill(accent = HOME_PUBLIC_COLORS.neutral, filled = false) {
  return {
    borderRadius: 999,
    border: `1px solid ${filled ? `${accent}44` : "rgba(255,255,255,0.08)"}`,
    background: filled
      ? `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.04) 55%, rgba(10,9,20,0.65))`
      : `${HOME_PANEL_GRADIENT}, rgba(10,9,20,0.66)`,
    boxShadow: filled
      ? `${HOME_PANEL_INSET}, 0 0 20px ${accent}14`
      : HOME_PANEL_INSET,
  };
}

function makePrimaryButtonBackground(accent = HOME_PUBLIC_COLORS.neutral, isClassStep = false) {
  if (isClassStep) {
    return `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, white 14%) 100%)`;
  }
  return `linear-gradient(135deg,
    ${HOME_PUBLIC_COLORS.archer} 0%,
    color-mix(in srgb, ${HOME_PUBLIC_COLORS.mage} 86%, white 8%) 52%,
    color-mix(in srgb, ${HOME_PUBLIC_COLORS.warrior} 84%, white 10%) 100%)`;
}

// ── Typography helpers ─────────────────────────────────────────
const mono = (s, w = 600) => raj(s, w);
const sans = (s, w = 500) => raj(s, w);

// ── Class colors DS v3 ─────────────────────────────────────────
const CLASS_DISPLAY = [
  { color: "#ff4d5e", glow: "rgba(255,77,94,0.28)", tier: "S" },
  { color: "#7bdc3b", glow: "rgba(123,220,59,0.28)", tier: "A" },
  { color: "#4cc9f0", glow: "rgba(76,201,240,0.28)", tier: "A" },
];

const REGISTER_CLASS_MEDIA = [
  {
    key: "warrior",
    crest: "/ui/crest-warrior.png",
    hero: "/missions/missions-hero-warrior.png",
    floor: "/exercises/hero/hero-floor-glow-warrior.png",
    zone: "/exercises/zones/zone-fuerza-banner.png",
    route: "Bastión de fuerza",
    routeCopy: "Empuje, control y trabajo de base para cuentas que quieren sentir progreso firme desde el primer día.",
    bullets: ["Fuerza y calistenia", "Impacto y disciplina", "Botín de avance directo"],
  },
  {
    key: "archer",
    crest: "/ui/crest-archer.png",
    hero: "/missions/missions-hero-archer.png",
    floor: "/exercises/hero/hero-floor-glow-archer.png",
    zone: "/exercises/zones/zone-cardio-banner.png",
    route: "Ruta de impulso",
    routeCopy: "Pulso, ritmo y sesiones ágiles para héroes que quieren entrar al mapa con movilidad y constancia.",
    bullets: ["Cardio y desplazamiento", "Ritmo y racha", "Sesiones rápidas con retorno"],
  },
  {
    key: "mage",
    crest: "/ui/crest-mage.png",
    hero: "/missions/missions-hero-mage.png",
    floor: "/exercises/hero/hero-floor-glow-mage.png",
    zone: "/exercises/zones/zone-flexibilidad-banner.png",
    route: "Santuario del foco",
    routeCopy: "Respiración, control y movilidad para una cuenta que prioriza técnica sin perder presencia visual.",
    bullets: ["Foco y recuperacion", "Flexibilidad y control", "Lectura limpia del progreso"],
  },
];

const REGISTER_NEUTRAL_MEDIA = {
  crest: "/logo.png",
  hero: "/missions/missions-hero-default.png",
  floor: "/exercises/hero/hero-floor-glow-default.png",
  zone: "/videos/quest-map.mp4",
  route: "Mesa de bienvenida",
  routeCopy: "Crea tu cuenta, elige clase y entra al mapa con una base clara para misiones, entrenamiento y progreso real.",
  bullets: ["Cuenta lista en 2 pasos", "Clase personal desde el inicio", "Botín de bienvenida y mapa abierto"],
};

const REGISTER_VALUE_STRIPS = [
  {
    title: "Entrada limpia al mapa",
    copy: "Correo, nombre de heroe y clase quedan listos sin ruido para entrar directo a la experiencia completa.",
    icon: Shield,
  },
  {
    title: "Bonos visibles desde el día uno",
    copy: "Cada clase ya deja ver su afinidad para que la elección se sienta útil y no decorativa.",
    icon: Sparkles,
  },
  {
    title: "Progreso que luego continua",
    copy: "Lo que defines aqui conecta con Home, quests, rutinas y entrenamiento dentro de la cuenta.",
    icon: MapIcon,
  },
];

const REGISTER_REWARD_PREVIEW = [
  {
    title: "XP de bienvenida",
    copy: "Primer impulso para abrir tu progreso.",
    image: "/missions/rewards/reward-xp-scroll.png",
  },
  {
    title: "Reserva de gemas",
    copy: "Moneda inicial para empezar con margen.",
    image: "/missions/rewards/reward-gem-cache.png",
  },
  {
    title: "Cofre del contrato",
    copy: "Botín base para la primera ruta.",
    image: "/routines/daily-reward-chest.png",
  },
];

const REGISTER_CLASS_GUIDANCE = [
  "Guerrero verá primero fuerza, calistenia y rutas de impacto directo.",
  "Arquero verá primero cardio, ritmo y sesiones más ágiles.",
  "Mago verá primero flexibilidad, foco y control corporal.",
];

const REGISTER_DRAFT_KEY = "fv_register_draft_v1";
const BOOTED_KEY = "fv_booted";
const SELECTED_CLASS_KEY = "fv_selectedClass";

function readSession(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function writeSession(key, value) {
  try { sessionStorage.setItem(key, value); } catch {}
}

function removeSession(key) {
  try { sessionStorage.removeItem(key); } catch {}
}

function writeLocal(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function readRegisterDraft() {
  try {
    const raw = localStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function clearRegisterDraft() {
  try { localStorage.removeItem(REGISTER_DRAFT_KEY); } catch {}
}

// ── Motion variants ────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];
const FV = {
  up:          { hidden: { opacity: 0, y: 20  }, show: { opacity: 1, y: 0,    transition: { duration: 0.5, ease } } },
  scale:       { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } } },
  stagger:     { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } },
  staggerFast: { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } },
};

// ── Boot sequence (solo primera vez) ──────────────────────────
const BOOT_SEQUENCE = [
  "> PREPARANDO EL ALTAR DE REGISTRO",
  "> ABRIENDO EL LIBRO DE CLASES",
  "> RESERVANDO TU SELLO DE HÉROE",
  "> MARCANDO LA RUTA INICIAL",
  "> TODO LISTO PARA FORJAR TU CUENTA",
];

// ── Firebase error map ─────────────────────────────────────────
const firebaseError = (code) => ({
  "auth/email-already-in-use":   "Este correo ya tiene una cuenta registrada",
  "auth/invalid-email":          "El correo no es válido",
  "auth/weak-password":          "La contraseña es muy débil (mínimo 6 caracteres)",
  "auth/network-request-failed": "Sin conexión. Verifica tu internet",
  "auth/popup-blocked":          "Popup bloqueado — habilita ventanas emergentes",
  "auth/popup-closed-by-user":   "Cerraste la ventana de Google. Intenta de nuevo",
})[code] || "Error al crear la cuenta. Intenta de nuevo";

const USERNAME_RE = /^[A-Za-z0-9_]+$/;

// ── Idle sprite ────────────────────────────────────────────────
const IDLE_FRAMES = Array.from({ length: 8 }, (_, i) => `/avatar/idle/idle_0${i + 1}.png`);

function SpriteIdle({ size = 160, fps = 8, style = {} }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => { IDLE_FRAMES.forEach(src => { const i = new Image(); i.src = src; }); }, []);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % IDLE_FRAMES.length), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      backgroundImage: `url('${IDLE_FRAMES[frame]}')`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center bottom",
      imageRendering: "pixelated",
      ...style,
    }} />
  );
}

// ── Class sprite con frames por clase ──────────────────────────
const CLASS_FOLDERS_R = ["home_guerrero", "home_arquero", "home_mago"];
const CLASS_KEYS_R    = ["guerrero", "arquero", "mago"];
const CLASS_FRAMES_R  = CLASS_FOLDERS_R.map((folder, ci) =>
  Array.from({ length: 8 }, (_, i) =>
    `/${folder}/home_idle_${CLASS_KEYS_R[ci]}_0${i + 1}.png`
  )
);

function ClassSprite({ classIndex = 0, size = 160, fps = 8 }) {
  const [frame, setFrame] = useState(0);
  const frames = CLASS_FRAMES_R[classIndex] ?? CLASS_FRAMES_R[0];
  useEffect(() => { frames.forEach(src => { const img = new Image(); img.src = src; }); }, [frames]);
  useEffect(() => {
    setFrame(0);
    const id = setInterval(() => setFrame(f => (f + 1) % frames.length), 1000 / fps);
    return () => clearInterval(id);
  }, [frames, fps]);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      backgroundImage: `url('${frames[frame]}')`,
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center bottom",
      imageRendering: "pixelated",
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: ${C.bg}; overflow-x: hidden; font-family: 'Rajdhani', sans-serif; }

  @media (prefers-reduced-motion:reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }

  ::selection { background: ${HOME_PUBLIC_COLORS.mage}33; color: ${C.white}; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, ${HOME_PUBLIC_COLORS.archer}77, ${HOME_PUBLIC_COLORS.mage}77, ${HOME_PUBLIC_COLORS.warrior}77);
    border-radius:4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, ${HOME_PUBLIC_COLORS.archer}, ${HOME_PUBLIC_COLORS.mage}, ${HOME_PUBLIC_COLORS.warrior});
  }

  /* ── Input ── */
  .fv6r-input {
    outline: none; box-sizing: border-box;
    font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 600;
    caret-color: ${C.orange};
    transition: border-color .2s, box-shadow .2s, background .2s;
    border-radius: 9px;
  }
  .fv6r-input::placeholder { color: ${C.muted}55; font-weight: 400; }
  .fv6r-input:focus {
    border-color: ${C.orange} !important;
    box-shadow: 0 0 0 2px ${C.orange}22, 0 0 14px ${C.orange}18 !important;
    background: rgba(10,14,26,0.8) !important;
  }
  .fv6r-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Button shimmer ── */
  .fv6r-btn { position: relative; overflow: hidden; border-radius: 10px; }
  .fv6r-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%); transform: translateX(-120%) skewX(-20deg); transition: transform 0.45s ease; }
  .fv6r-btn:not(:disabled):hover::before { transform: translateX(260%) skewX(-20deg); }

  /* ── Class card ── */
  .fv6r-class-card { cursor: pointer; will-change: transform; }
  .fv6r-class-card:focus-visible { outline: 2px solid ${C.orange}; outline-offset: 3px; }

  /* ── Animations ── */
  @keyframes fv6r-spin  { to { transform: rotate(360deg); } }
  @keyframes fv6r-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes fv6r-scan  { 0%{top:-2px} 100%{top:100%} }
  @keyframes fv6r-gradFlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

  .fv6r-blink { animation: fv6r-blink 0.9s infinite; }

  .grad-text-r {
    background: linear-gradient(90deg, ${HOME_PUBLIC_COLORS.archer}, ${HOME_PUBLIC_COLORS.mage}, ${HOME_PUBLIC_COLORS.warrior});
    background-size: 300% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fv6r-gradFlow 5s ease infinite;
  }

  /* ── Pixel corners ── */
  .px6r-corners { position: relative; }
  .px6r-corners::before {
    content: ''; position: absolute; inset: -3px; pointer-events: none; z-index: 10;
    background:
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 0 0/14px 2px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 0 0/2px 14px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 100% 0/14px 2px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 100% 0/2px 14px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 0 100%/14px 2px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 0 100%/2px 14px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 100% 100%/14px 2px no-repeat,
      linear-gradient(var(--cc,${C.orange}),var(--cc,${C.orange})) 100% 100%/2px 14px no-repeat;
  }

  /* ── Responsive ── */
  .rg6-page-shell { width: 100%; max-width: 1440px; display: grid; gap: 20px; }
  .rg6-content-grid { display: grid; grid-template-columns: minmax(300px, 360px) minmax(0, 1fr); gap: 20px; align-items: start; }
  .rg6-form-shell {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.08);
    background: ${HOME_PANEL_GRADIENT}, linear-gradient(180deg, rgba(10,12,22,0.92), rgba(8,9,18,0.9));
    box-shadow: ${HOME_PANEL_INSET}, 0 22px 60px rgba(0,0,0,0.42);
  }
  .rg6-form-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 24%);
  }
  .rg6-stage-shell::after {
    content: "";
    position: absolute;
    inset: 14px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.05);
    pointer-events: none;
  }
  @media (max-width: 1100px) {
    .rg6-content-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 960px) {
    .rg6-stage-shell > div { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 900px) { .rg6-grid { grid-template-columns: 0.7fr 1.3fr !important; } }
  @media (max-width: 980px) {
    .rg6-lower-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .rg6-grid { grid-template-columns: 1fr !important; }
    .rg6-left { display: none !important; }
    .rg6-right { padding: clamp(24px,6vw,52px) clamp(16px,5vw,36px) !important; overflow-y: auto; max-height: 100vh; }
    .rg6-class-grid { grid-template-columns: 1fr !important; }
    .rg6-lower-step { grid-template-columns: 24px 1fr !important; gap: 8px !important; }
    .rg6-page-shell { gap: 16px; }
    .rg6-content-grid { gap: 16px; }
  }

  /* ── Mobile top banner ── */
  .rg6-mobile-top { display: none; }
  @media (max-width: 640px) {
    .rg6-mobile-top { display: flex; align-items: center; justify-content: space-between; position: absolute; top: 16px; left: clamp(16px,5vw,36px); right: clamp(16px,5vw,36px); z-index: 10; }
  }

  /* ── Back/nav button responsive ── */
  .rg6-back { position: absolute; top: 30px; left: 44px; z-index: 12; }
  @media (max-width: 640px) {
    .rg6-back { top: 56px; left: clamp(16px,5vw,36px); right: clamp(16px,5vw,36px); }
  }

  /* ── Sticky submit CTA on mobile ── */
  @media (max-width: 640px) {
    .rg6-sticky-cta { position: sticky; bottom: 0; z-index: 10; margin: 0 -16px; padding: 12px 16px 16px; background: linear-gradient(to top, ${C.bg}f5 0%, transparent 100%); }
  }

  /* ── Radix Checkbox ── */
  .fv6r-checkbox-root { width: 17px; height: 17px; background: transparent; border: 2px solid ${C.navy}; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, border-color .15s; flex-shrink: 0; border-radius: 5px; }
  .fv6r-checkbox-root[data-state="checked"] { background: ${HOME_PUBLIC_COLORS.mage}; border-color: ${HOME_PUBLIC_COLORS.mage}; box-shadow: 0 0 8px ${HOME_PUBLIC_COLORS.mage}44; }
  .fv6r-checkbox-root:focus-visible { outline: 2px solid ${HOME_PUBLIC_COLORS.mage}44; outline-offset: 2px; }
  .fv6r-checkbox-indicator { color: #fff; display: flex; align-items: center; justify-content: center; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// AURORA BACKGROUND — static ambient orbs (DS v3)
// ─────────────────────────────────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
      background: `linear-gradient(160deg,${C.bg} 0%,#080D18 55%,${C.bg} 100%)` }}>
      {/* Orb 1 — orange top-left */}
      <div style={{ position: "absolute", top: "3%", left: "6%", width: 700, height: 700,
        background: `radial-gradient(circle, ${C.orange}18 0%, transparent 65%)`, filter: "blur(90px)" }} />
      {/* Orb 2 — purple bottom-right */}
      <div style={{ position: "absolute", bottom: "-8%", right: "2%", width: 650, height: 650,
        background: `radial-gradient(circle, ${C.purple}14 0%, transparent 65%)`, filter: "blur(90px)" }} />
      {/* Orb 3 — blue center */}
      <div style={{ position: "absolute", top: "38%", right: "28%", width: 380, height: 380,
        background: `radial-gradient(circle, ${C.blue}0D 0%, transparent 65%)`, filter: "blur(70px)" }} />
      {/* Grid */}
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${C.navy}14 1px, transparent 1px), linear-gradient(90deg, ${C.navy}14 1px, transparent 1px)`,
        backgroundSize: "48px 48px" }} />
      {/* Scanlines */}
      <div style={{ position: "absolute", inset: 0,
        background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)" }} />
      {/* Vignette */}
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(0,0,0,0.52) 100%)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR
// ─────────────────────────────────────────────────────────────────────────────
function CustomCursor() {
  const ring = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(hover:none)").matches) return;
    let mx = 0, my = 0, rx = 0, ry = 0, rafId = null;
    const move = (e) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      if (ring.current) { ring.current.style.left = rx + "px"; ring.current.style.top = ry + "px"; }
      rafId = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move, { passive: true });
    rafId = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(rafId); };
  }, []);
  return (
    <div ref={ring} style={{
      position: "fixed", width: 28, height: 28, pointerEvents: "none", zIndex: 9999,
      border: `1px solid ${P.accent}66`, transform: "translate(-14px,-14px)",
      clipPath: "polygon(0 0,40% 0,40% 10%,10% 10%,10% 40%,0 40%,0 60%,10% 60%,10% 90%,40% 90%,40% 100%,60% 100%,60% 90%,90% 90%,90% 60%,100% 60%,100% 40%,90% 40%,90% 10%,60% 10%,60% 0,100% 0,100% 100%,0 100%)",
      background: `${P.accent}10`,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLES
// ─────────────────────────────────────────────────────────────────────────────
const Particles = memo(function Particles({ count = 14 }) {
  const items = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i, x: Math.random() * 100,
      size: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 2 : 4,
      delay: Math.random() * 12, duration: Math.random() * 14 + 10,
      dx: (Math.random() - 0.5) * 160,
      color: [P.accent, P.blue, P.gold, P.purple][Math.floor(Math.random() * 4)],
    }))
  ).current;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      {items.map(pt => (
        <motion.div key={pt.id}
          initial={{ y: "105vh", x: 0, opacity: 0.8, rotate: 0 }}
          animate={{ y: "-10vh", x: pt.dx, opacity: 0, rotate: 720 }}
          transition={{ duration: pt.duration, delay: pt.delay, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", left: `${pt.x}%`, bottom: 0, width: pt.size, height: pt.size,
            background: pt.color, boxShadow: `0 0 ${pt.size * 2}px ${pt.color}`, imageRendering: "pixelated" }} />
      ))}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LOADER (skip si ya se mostró antes)
// ─────────────────────────────────────────────────────────────────────────────
function Loader({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [phase,    setPhase]    = useState("boot");
  const [lines,    setLines]    = useState([]);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  useEffect(() => {
    if (reduced || readSession(BOOTED_KEY) === "1") { onDone(); return; }
    let idx = 0;
    const t = setInterval(() => {
      if (idx < BOOT_SEQUENCE.length) { setLines(p => [...p, BOOT_SEQUENCE[idx]]); idx++; }
      else { clearInterval(t); setTimeout(() => setPhase("loading"), 160); }
    }, 210);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    let val = 0;
    const iv = setInterval(() => {
      val += Math.random() * 18 + 6;
      if (val >= 100) {
        val = 100; clearInterval(iv);
        setTimeout(() => { setPhase("done"); writeSession(BOOTED_KEY, "1"); setTimeout(onDone, 400); }, 160);
      }
      setProgress(Math.min(val, 100));
    }, 65);
    return () => clearInterval(iv);
  }, [phase, onDone]);

  const filled = Math.round((progress / 100) * 16);

  return (
    <motion.div animate={{ opacity: phase === "done" ? 0 : 1 }} transition={{ duration: 0.4 }}
      style={{ position: "fixed", inset: 0, background: P.bg0, zIndex: 9000, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "clamp(16px,5vw,32px)", pointerEvents: phase === "done" ? "none" : "all" }}>

      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
          <motion.div
            animate={{ filter: [`drop-shadow(0 0 8px ${P.accent})`, `drop-shadow(0 0 20px ${P.accent})`, `drop-shadow(0 0 8px ${P.accent})`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Sparkles size={20} color={P.accent} />
          </motion.div>
          <span className="grad-text-r" style={{ ...orb(14) }}>FORGE</span>
          <span style={{ ...orb(14), color: P.text }}>VENTURE</span>
        </div>
        <div style={{ ...mono(9, 600), color: P.blue, letterSpacing: ".26em" }}>CHARACTER CREATION v6</div>
      </motion.div>

      <div style={{ width: "100%", maxWidth: 400, background: P.bg1, border: `1px solid ${P.line}`,
        padding: "14px 18px", marginBottom: 22, minHeight: 115, ...mono(7), color: "#10B981", lineHeight: 2.4 }}>
        {lines.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 0.85, x: 0 }} transition={{ delay: i * 0.04 }}>{l}</motion.div>
        ))}
        {phase === "loading" && <span className="fv6r-blink">█</span>}
      </div>

      {phase === "loading" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ ...mono(8, 600), color: P.muted, letterSpacing: ".12em" }}>LOADING CHARACTER DATA</span>
            <span style={{ ...mono(9, 700), color: P.accent }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 16, background: P.bg0, border: `1px solid ${P.accent}55`, display: "flex", gap: 2, padding: 2 }}>
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: "100%",
                background: i < filled ? `linear-gradient(to bottom, ${P.accent2}, ${P.accent})` : "transparent",
                transition: "background 0.08s", boxShadow: i < filled ? `0 0 4px ${P.accent}88` : "none" }} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────────────────────────────────────
function Spinner({ size = 14, color = P.accent }) {
  return <div style={{ width: size, height: size, border: `2px solid ${P.line}`, borderTop: `2px solid ${color}`, animation: "fv6r-spin 0.7s linear infinite", borderRadius: "50%", flexShrink: 0 }} />;
}

// ── Eye / EyeOff icons ─────────────────────────────────────────
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FIELD
// ─────────────────────────────────────────────────────────────────────────────
function InputField({ id, label, type = "text", value, onChange, onBlur, placeholder, error, hint, disabled, autoComplete, statusBadge, inputMode }) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = type === "password" && show ? "text" : type;
  const inputId   = id || `fv6r-${label?.replace(/\s/g, "-").toLowerCase()}`;

  return (
    <motion.div variants={FV.up} style={{ marginBottom: 12 }}>
      {label && (
        <motion.label htmlFor={inputId}
          animate={{ color: focused ? P.accent : P.muted }}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, ...mono(9, 700), letterSpacing: ".14em", cursor: "pointer" }}>
          {focused && <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="fv6r-blink" style={{ color: P.accent }}>▶</motion.span>}
          {label}
        </motion.label>
      )}
      <div style={{ position: "relative" }}>
        <AnimatePresence>
          {focused && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: -3, pointerEvents: "none", zIndex: 0,
                background: `linear-gradient(${P.accent},${P.accent}) 0 0/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 0 0/2px 12px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 0/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 0/2px 12px no-repeat,linear-gradient(${P.accent},${P.accent}) 0 100%/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 0 100%/2px 12px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 100%/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 100%/2px 12px no-repeat`,
              }} />
          )}
        </AnimatePresence>
        <input id={inputId} className="fv6r-input" type={inputType} value={value}
          onChange={onChange}
          onBlur={e  => { setFocused(false); onBlur?.(e); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder} disabled={disabled} autoComplete={autoComplete}
          inputMode={inputMode} aria-invalid={!!error}
          style={{ position: "relative", zIndex: 1, width: "100%",
            padding: type === "password" ? "12px 44px 12px 14px" : "12px 14px",
            background: disabled ? P.bg2 : focused ? P.bg1 : P.bg0,
            border: `1px solid ${error ? P.error : focused ? P.accent : P.line}`,
            color: disabled ? P.muted : P.text,
          }} />
        {type === "password" && (
          <motion.button type="button" onClick={() => setShow(s => !s)}
            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
            aria-label={show ? `Ocultar ${label?.toLowerCase() || "contraseña"}` : `Mostrar ${label?.toLowerCase() || "contraseña"}`}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: P.muted, fontSize: 14, zIndex: 2 }}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div role="alert"
            initial={{ opacity: 0, height: 0, y: -4 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, ...sans(12), color: P.error, marginTop: 5 }}>
              <span style={{ ...mono(8, 700), color: P.error }}>⚠</span> {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {hint && !error && <div style={{ ...sans(11, 400), color: P.muted, marginTop: 4 }}>▷ {hint}</div>}
      {statusBadge && !error && statusBadge}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH
// ─────────────────────────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const calc = () => {
    if (!password) return { score: 0, label: "", color: "transparent", tier: "" };
    let s = 0;
    if (password.length >= 6)          s++;
    if (password.length >= 10)         s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (s <= 1) return { score: 1, label: "DÉBIL",     color: P.error,   tier: "F" };
    if (s === 2) return { score: 2, label: "REGULAR",   color: "#E67E22", tier: "D" };
    if (s === 3) return { score: 3, label: "BUENA",     color: P.blue,    tier: "C" };
    if (s === 4) return { score: 4, label: "FUERTE",    color: P.accent,  tier: "B" };
    return              { score: 5, label: "ÉPICA 🔥",  color: P.gold,    tier: "S" };
  };
  const { score, label, color, tier } = calc();

  return (
    <AnimatePresence>
      {!!password && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22 }} style={{ overflow: "hidden", marginTop: -4, marginBottom: 14 }}>
          <div style={{ background: P.bg1, border: `1px solid ${P.line}`, padding: "8px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ ...mono(8, 700), color: P.muted, letterSpacing: ".12em" }}>[ FORTALEZA ]</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <motion.span key={tier} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...sans(11, 700), color }}>{label}</motion.span>
                <motion.span key={`t-${tier}`} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  style={{ ...mono(8, 700), color, border: `1px solid ${color}55`, padding: "1px 6px", background: `${color}11` }}>TIER {tier}</motion.span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 3, height: 6 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <motion.div key={i} animate={{ background: i < score ? color : P.line, boxShadow: i < score ? `0 0 4px ${color}66` : "none" }}
                  transition={{ duration: 0.25 }} style={{ flex: 1, height: "100%" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              {[
                [password.length >= 6,  "6+ chars"],
                [password.length >= 10, "10+ chars"],
                [/[A-Z]/.test(password), "MAYÚS"],
                [/[0-9]/.test(password), "NÚMERO"],
                [/[^A-Za-z0-9]/.test(password), "SÍMBOLO"],
              ].map(([ok, tip]) => (
                <motion.span key={tip}
                  animate={{ color: ok ? P.success : P.muted, opacity: ok ? 1 : 0.5 }}
                  style={{ ...mono(8, ok ? 700 : 400), display: "inline-flex", alignItems: "center", gap: 2 }}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={ok ? "y" : "n"}
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}>
                      {ok ? "✓" : "○"}
                    </motion.span>
                  </AnimatePresence>
                  {tip}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
const ClassSelector = memo(function ClassSelector({ selected, onChange, onConfirm, classError, fromHome, recommendedIdx }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowRight") { onChange(Math.min(selected + 1, CLASSES.length - 1)); onConfirm?.(); }
    if (e.key === "ArrowLeft")  { onChange(Math.max(selected - 1, 0)); onConfirm?.(); }
  }, [selected, onChange, onConfirm]);

  return (
    <div style={{ marginBottom: 22 }} onKeyDown={handleKeyDown}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ ...mono(9, 700), color: P.muted, letterSpacing: ".14em" }}>[ 🎭 ELIGE TU CLASE ]</span>
        <span style={{ ...mono(8, 500), color: P.muted }}>◀ ▶ o flechas</span>
      </div>

      <motion.div role="radiogroup" aria-label="Selecciona tu clase"
        className="rg6-class-grid"
        variants={FV.staggerFast} initial="hidden" animate="show"
        style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {CLASSES.map((c, i) => {
          const cd = CLASS_DISPLAY[i] || CLASS_DISPLAY[0];
          const media = REGISTER_CLASS_MEDIA[i] || REGISTER_CLASS_MEDIA[0];
          const isSelected = selected === i;
          return (
            <motion.div key={i} variants={FV.scale}
              whileHover={{ y: -4, scale: 1.02, boxShadow: `0 14px 40px ${cd.color}28` }}
              whileTap={{ scale: 0.96 }}
              role="radio" aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              className="fv6r-class-card"
              onClick={() => { onChange(i); onConfirm?.(); }}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { onChange(i); onConfirm?.(); } }}
              style={{ border: `1px solid ${isSelected ? cd.color : C.navy}30`,
                borderRadius: 14, overflow: "hidden", position: "relative", cursor: "pointer",
                background: "rgba(20,26,42,0.82)", backdropFilter: "blur(14px)",
                boxShadow: isSelected ? `0 0 28px ${cd.color}33, 0 4px 24px rgba(0,0,0,0.4)` : "0 2px 12px rgba(0,0,0,0.3)",
                transition: "box-shadow .22s, border-color .22s" }}>

              {/* Header band */}
              <div style={{ position: "relative", overflow: "hidden",
                background: isSelected
                  ? `linear-gradient(135deg, ${cd.color}22 0%, ${cd.color}08 100%)`
                  : `linear-gradient(135deg, ${C.navy}66 0%, transparent 100%)`,
                borderBottom: `1px solid ${isSelected ? cd.color : C.navy}22`,
                padding: "14px 10px 10px", textAlign: "center",
                transition: "background .22s" }}>
                {/* Corner orb */}
                <div style={{ position: "absolute", top: -28, right: -28, width: 80, height: 80, borderRadius: "50%",
                  background: `radial-gradient(circle, ${cd.color}44, transparent)`,
                  filter: "blur(22px)", opacity: isSelected ? 0.6 : 0.2,
                  transition: "opacity .25s", pointerEvents: "none" }} />
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: isSelected ? cd.color : "transparent",
                  boxShadow: isSelected ? `0 0 8px ${cd.color}` : "none",
                  transition: "background .22s" }} />

                <AnimatePresence>
                  {isSelected && (
                    <motion.div key="indicator" initial={{ opacity: 0 }} animate={{ opacity: [1, 0, 1] }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)", ...mono(8), color: cd.color }}>▲</motion.div>
                  )}
                </AnimatePresence>

                {!isSelected && fromHome && i === recommendedIdx && (
                  <div style={{ position: "absolute", top: 4, right: 4, ...mono(6, 700), color: P.gold,
                    border: `1px solid ${P.gold}44`, background: `${P.gold}14`, padding: "1px 5px",
                    borderRadius: 4, whiteSpace: "nowrap" }}>REC</div>
                )}
                {!isSelected && !fromHome && i === 0 && (
                  <div style={{ position: "absolute", top: 4, right: 4, ...mono(6, 700), color: P.success,
                    border: `1px solid ${P.success}44`, background: `${P.success}14`, padding: "1px 5px",
                    borderRadius: 4, whiteSpace: "nowrap" }}>FREE</div>
                )}

                <motion.div animate={isSelected ? { y: [0, -5, 0] } : { y: 0 }}
                  transition={isSelected ? { duration: 2.5, ease: "easeInOut", repeat: Infinity } : {}}
                  style={{ marginBottom: 8, filter: isSelected ? `drop-shadow(0 0 12px ${cd.color})` : "none", transition: "filter .3s", display: "flex", justifyContent: "center" }}>
                  <img src={media.crest} alt="" style={{ width: 54, height: 54, objectFit: "contain" }} />
                </motion.div>
                <div style={{ ...orb(9, 800), color: isSelected ? cd.color : P.muted, letterSpacing: ".06em", marginBottom: 2 }}>{c.name}</div>
                <div style={{ ...mono(7, 700), color: cd.color, background: `${cd.color}18`, border: `1px solid ${cd.color}30`,
                  borderRadius: 20, padding: "2px 8px", display: "inline-block" }}>TIER {cd.tier}</div>
              </div>

              {/* Body */}
              <div style={{ padding: "8px 10px 10px", textAlign: "center" }}>
                <div style={{ ...sans(9, 400), color: isSelected ? P.mutedL : P.muted, lineHeight: 1.5, opacity: isSelected ? 1 : 0.7 }}>{c.bonus}</div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div key="sel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ ...mono(7, 700), color: `${cd.color}cc`, marginTop: 4, letterSpacing: ".08em" }}>✓ SELECCIONADO</motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Active class detail */}
      <AnimatePresence mode="wait">
        <motion.div key={selected}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{ marginTop: 10, padding: "12px 14px",
            background: "rgba(20,26,42,0.7)", backdropFilter: "blur(10px)",
            border: `1px solid ${CLASS_DISPLAY[selected]?.color ?? P.accent}28`,
            borderLeft: `3px solid ${CLASS_DISPLAY[selected]?.color ?? P.accent}`,
            borderRadius: 10, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <img src={REGISTER_CLASS_MEDIA[selected]?.crest ?? REGISTER_CLASS_MEDIA[0].crest} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
              <span style={{ ...mono(8, 700), color: CLASS_DISPLAY[selected]?.color ?? P.accent, letterSpacing: ".06em" }}>BONUS {CLASSES[selected].bonus}</span>
            </div>
            <span style={{ ...raj(10, 600), color: P.muted,
              background: `${CLASS_DISPLAY[selected]?.color ?? P.accent}12`,
              border: `1px solid ${CLASS_DISPLAY[selected]?.color ?? P.accent}28`,
              borderRadius: 6, padding: "2px 8px" }}>DESDE DÍA 1</span>
          </div>
          <p style={{ ...sans(11, 500), color: P.mutedL, lineHeight: 1.55, margin: 0 }}>
            {REGISTER_CLASS_GUIDANCE[selected] ?? REGISTER_CLASS_GUIDANCE[0]}
          </p>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {classError && (
          <motion.div role="alert"
            initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div style={{ ...mono(8, 700), color: P.error, marginTop: 10, background: `${P.error}11`, border: `1px solid ${P.error}44`, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, letterSpacing: ".06em" }}>
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>⚠</motion.span> {classError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENT TOAST
// ─────────────────────────────────────────────────────────────────────────────
function AchievementToast() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 2200); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          onAnimationComplete={() => setTimeout(() => setVisible(false), 3500)}
          style={{ position: "fixed", top: 76, right: 18, zIndex: 8000, background: P.bg1, border: `1px solid ${P.gold}55`, padding: "12px 16px", maxWidth: 260, boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 20px ${P.gold}22` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Sparkles size={18} color={P.gold} />
            <div>
              <div style={{ ...mono(8, 700), color: P.gold, marginBottom: 2, letterSpacing: ".1em" }}>LOGRO DESBLOQUEADO</div>
              <div style={{ ...sans(12, 600), color: P.text }}>Nuevo aventurero</div>
              <div style={{ ...sans(11, 400), color: P.muted, marginTop: 1 }}>+500 XP de bienvenida</div>
            </div>
          </div>
          <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 3.5, ease: "linear" }}
            style={{ marginTop: 8, height: 2, background: P.gold, boxShadow: `0 0 6px ${P.gold}`, transformOrigin: "left" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION SUCCESS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function RegistrationSuccessScreen({ username, classIdx, onDone, verificationPending = false, contactEmail = "", authSource = "email" }) {
  const [countdown, setCountdown] = useState(4);
  const cls = CLASSES[classIdx] ?? CLASSES[0];
  const cd  = CLASS_DISPLAY[classIdx] ?? CLASS_DISPLAY[0];
  const successTitle = verificationPending ? "CUENTA CREADA" : "ACCESO LISTO";
  const successCopy = verificationPending
    ? "Tu acceso ya existe, pero aun falta validar el correo para abrir toda la experiencia."
    : "Tu perfil ya quedo listo y puede entrar directo al mapa sin pasos pendientes.";
  const successCta = verificationPending ? "Entendido" : "Entrar ahora";
  const stats = verificationPending
    ? [
        { label: "CLASE", value: cls.name },
        { label: "CORREO", value: contactEmail || "Pendiente" },
        { label: "ESTADO", value: "Por verificar" },
        { label: "BONUS", value: cls.bonus },
      ]
    : [
        { label: "CLASE", value: cls.name },
        { label: "ACCESO", value: authSource === "google" ? "Google listo" : "Cuenta activa" },
        { label: "TIER", value: cd.tier },
        { label: "BONUS", value: cls.bonus },
      ];

  useEffect(() => {
    const iv = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(iv); onDone(); return 0; } return c - 1; }), 1000);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: P.bg0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 24 }}>
      <AuroraBackground />
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.15 }}
        style={{ position: "relative", zIndex: 2, maxWidth: 480, width: "100%",
          background: "rgba(20,26,42,0.92)", border: `1px solid ${cd.color}44`, padding: 36,
          borderRadius: 18, textAlign: "center", backdropFilter: "blur(20px)",
          boxShadow: `0 0 60px ${cd.color}22, 0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)` }}>

        {/* Top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cd.color}, transparent)` }} />

        {/* Sprite */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <ClassSprite classIndex={classIdx} size={120} fps={8} />
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ ...mono(10, 700), color: cd.color, letterSpacing: ".14em", marginBottom: 6 }}>{successTitle}</div>
          <div style={{ ...orb("clamp(22px,4vw,28px)", 900), color: P.text, marginBottom: 4 }}>{username}</div>
          <div style={{ ...sans(13, 400), color: P.muted, marginBottom: 8 }}>{cls.tag}</div>
          <p style={{ ...sans(12, 500), color: "#d4dced", lineHeight: 1.55, margin: "0 0 16px" }}>
            {successCopy}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {stats.map(({ label, value }) => (
            <div key={label} style={{ background: "rgba(10,14,26,0.7)", border: `1px solid ${cd.color}22`,
              borderTop: `2px solid ${cd.color}`, padding: "8px 10px", textAlign: "left", borderRadius: 8,
              backdropFilter: "blur(8px)" }}>
              <div style={{ ...mono(7, 600), color: P.muted, marginBottom: 3, letterSpacing: ".1em" }}>{label}</div>
              <div style={{ ...orb(11, 700), color: cd.color }}>{value}</div>
            </div>
          ))}
        </motion.div>

        {/* Bonus banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          style={{ background: `${cd.color}11`, border: `1px solid ${cd.color}44`, padding: "8px 14px", marginBottom: 20, ...sans(12, 600), color: cd.color }}>
          BONUS {cls.bonus}
        </motion.div>

        {verificationPending && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
            style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 12, background: `${cd.color}0f`, border: `1px solid ${cd.color}33`, textAlign: "left" }}>
            <div style={{ ...mono(8, 700), color: cd.color, letterSpacing: ".1em", marginBottom: 6 }}>SIGUIENTE PASO</div>
            <div style={{ ...sans(11, 500), color: "#d4dced", lineHeight: 1.55 }}>
              Revisa <strong>{contactEmail || "tu correo"}</strong>, abre el mensaje de ForgeVenture y confirma el enlace para activar el ingreso completo.
            </div>
          </motion.div>
        )}

        {/* Countdown */}
        <div style={{ ...mono(8, 600), color: P.muted, marginBottom: 10, letterSpacing: ".12em" }}>
          {verificationPending ? `CIERRE AUTOMATICO EN ${countdown}s...` : `INICIANDO AVENTURA EN ${countdown}s...`}
        </div>
        <div style={{ height: 3, background: `${cd.color}22`, overflow: "hidden", border: `1px solid ${cd.color}33` }}>
          <motion.div style={{ height: "100%", background: cd.color, boxShadow: `0 0 8px ${cd.color}`, transformOrigin: "left" }}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 4, ease: "linear", delay: 0.2 }} />
        </div>
        <motion.button type="button" onClick={onDone}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          whileHover={{ color: cd.color }} whileTap={{ scale: 0.97 }}
          style={{ marginTop: 14, ...sans(12, 600), color: P.muted, background: "none", border: "none", cursor: "pointer", letterSpacing: ".08em" }}>
          {successCta}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT PANEL
// ─────────────────────────────────────────────────────────────────────────────
function RegisterLandingPanel({
  step,
  classIdx,
  fromGoogle = false,
  fromHome = false,
  afterEnterSteps = [],
  registerTrustBand = [],
  registerStats = [],
  onReturnHome,
}) {
  const cls = CLASSES[classIdx] ?? CLASSES[0];
  const media = step === 2 ? REGISTER_CLASS_MEDIA[classIdx] ?? REGISTER_CLASS_MEDIA[0] : REGISTER_NEUTRAL_MEDIA;
  const accent = getRegisterAccent(step, classIdx);
  const stageIntro = step === 2
    ? "La clase que elijas define color, ritmo y primeras rutas del tablero."
    : "Una sola entrada clara para crear cuenta, marcar clase y abrir el mapa con identidad.";
  const stageFocusTitle = step === 2 ? cls.name : "Forja tu llegada";
  const stageFocusCopy = step === 2
    ? "Tu clase queda enlazada a recomendaciones, tono visual y primeras quests de entrenamiento."
    : "Cuenta, acceso y clase quedan alineados para que luego misiones, rutinas y entrenamiento se sientan parte del mismo mundo.";
  const contextPills = [
    fromGoogle ? "Entrada con Google" : null,
    fromHome ? "Clase heredada desde Home" : null,
  ].filter(Boolean);

  return (
    <motion.div
      className="rg6-left"
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRight: `1px solid ${P.line}`,
        padding: "24px",
        display: "grid",
        alignContent: "start",
        gap: 16,
        background: `linear-gradient(180deg, rgba(9,8,18,0.96), rgba(8,7,16,0.92))`,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 16% 18%, ${HOME_PUBLIC_COLORS.warrior}12 0%, transparent 28%),
            radial-gradient(circle at 82% 14%, ${HOME_PUBLIC_COLORS.mage}12 0%, transparent 24%),
            radial-gradient(circle at 54% 86%, ${step === 2 ? `${accent}16` : `${HOME_PUBLIC_COLORS.archer}12`} 0%, transparent 30%)
          `,
          filter: "blur(42px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...makeHomePanel({ radius: 16, surface: "rgba(10,12,20,0.72)", outerGlow: "rgba(0,0,0,0.22)" }), width: 48, height: 48, display: "grid", placeItems: "center" }}>
              <img src={media.crest} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ ...homeHeading(13, 700), color: "#f6f2ff" }}>{step === 2 ? cls.name : "ForgeVenture"}</div>
              <div style={{ ...mono(7, 600), color: accent, letterSpacing: ".12em" }}>{step === 2 ? "CLASE MARCADA" : "PORTAL DE INGRESO"}</div>
            </div>
          </div>
          <span style={{ ...sans(11, 600), color: P.muted }}>{step === 2 ? media.route : "Entrada al gremio"}</span>
        </div>

        {contextPills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {contextPills.map((pill) => (
              <span key={pill} style={{ ...makeHomePill(accent, true), padding: "7px 10px", ...sans(11, 600), color: "#eef3ff" }}>
                {pill}
              </span>
            ))}
          </div>
        )}

        <div style={{ ...makeHomePanel({ radius: 26, surface: "rgba(7,8,18,0.66)", outerGlow: "rgba(0,0,0,0.32)" }), position: "relative", minHeight: 500, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(8,8,16,0.18), rgba(8,8,16,0.68)), url('${media.hero}') center / cover no-repeat` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(9,8,18,0.02), rgba(9,8,18,0.44)), radial-gradient(circle at 18% 16%, ${HOME_PUBLIC_COLORS.warrior}12 0%, transparent 24%), radial-gradient(circle at 84% 12%, ${HOME_PUBLIC_COLORS.mage}12 0%, transparent 22%)` }} />

          <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "20px 20px 18px", display: "grid", alignContent: "space-between" }}>
            <div style={{ ...makeHomePanel({ radius: 18, surface: "rgba(8,9,18,0.72)", outerGlow: "rgba(0,0,0,0.18)" }), maxWidth: 330, padding: "14px 15px" }}>
              <div style={{ ...mono(7, 700), color: accent, letterSpacing: ".12em", marginBottom: 8 }}>{step === 2 ? "RUTA ACTIVA" : "PORTADA DE INGRESO"}</div>
              <div style={{ ...homeHeading(22, 700), color: "#f5f2ff", marginBottom: 8, lineHeight: 1.08 }}>{step === 2 ? media.route : "Mesa de bienvenida"}</div>
              <p style={{ ...sans(12, 500), color: "#c7d1e5", lineHeight: 1.6 }}>
                {stageIntro}
              </p>
            </div>

            <div style={{ position: "relative", minHeight: 184, display: "grid", justifyItems: "center", alignItems: "end" }}>
              {step === 2 ? <ClassSprite classIndex={classIdx} size={230} fps={8} /> : <SpriteIdle size={220} fps={8} />}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ ...homeHeading("clamp(24px,2.4vw,34px)", 700), color: "#f7f3ff", marginBottom: 8, lineHeight: 1.02 }}>{stageFocusTitle}</div>
                <p style={{ ...sans(13, 500), color: "#d0d8ea", lineHeight: 1.6, maxWidth: 520 }}>
                  {stageFocusCopy}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                {(step === 2 ? media.bullets : ["Cuenta segura", "Clase personal", "Mapa listo"]).map((bullet) => (
                  <div key={bullet} style={{ ...makeHomePanel({ radius: 14, surface: "rgba(8,9,18,0.72)", outerGlow: "rgba(0,0,0,0.14)" }), padding: "10px 12px", ...sans(11, 600), color: "#f3f6ff" }}>
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              type="button"
              onClick={onReturnHome}
              whileHover={{ y: -2, borderColor: `${accent}66`, color: accent }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...sans(12, 700),
                ...makeHomePill(accent),
                minHeight: 44,
                padding: "0 20px",
                color: P.muted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: ".06em",
              }}
            >
              Volver al portal
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StepIndicator({ step, total = 2, classIdx = 0 }) {
  const STEP_NAMES = ["CUENTA", "CLASE"];
  const STEP_SEALS = [REGISTER_NEUTRAL_MEDIA.crest, REGISTER_CLASS_MEDIA[classIdx]?.crest ?? REGISTER_CLASS_MEDIA[0].crest];
  const accent = getRegisterAccent(step, classIdx);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
      ...makeHomePanel({ radius: 14, surface: "rgba(11,14,24,0.82)", outerGlow: "rgba(0,0,0,0.18)" }),
      padding: "12px 16px" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flex: i < total - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div
              animate={{
                background: i < step ? `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.04))` : "rgba(255,255,255,0.02)",
                borderColor: i < step ? accent : "rgba(255,255,255,0.08)",
                boxShadow: i === step - 1 ? `0 0 14px ${accent}33` : "none",
              }}
              transition={{ duration: 0.3 }}
              style={{ width: 34, height: 34, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${i < step ? accent : "rgba(255,255,255,0.08)"}`, flexShrink: 0, position: "relative", overflow: "hidden" }}>
              <img src={STEP_SEALS[i]} alt="" style={{ width: 18, height: 18, objectFit: "contain", opacity: i < step ? 1 : 0.55, filter: i < step ? `drop-shadow(0 0 6px ${accent})` : "none" }} />
              {i < step - 1 && (
                <span style={{ position: "absolute", right: -2, bottom: -2, width: 14, height: 14, borderRadius: 999, background: accent, display: "grid", placeItems: "center", boxShadow: `0 0 8px ${accent}66` }}>
                  <Check size={9} color="#fff" />
                </span>
              )}
            </motion.div>
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ ...mono(8, i === step - 1 ? 700 : 400), color: i < step ? accent : P.muted, letterSpacing: ".1em" }}>
                {STEP_NAMES[i] ?? i + 1}
              </span>
              <span style={{ ...sans(11, 500), color: "#aeb8cc" }}>
                {i === 0 ? "Datos del viajero" : "Marca tu afinidad"}
              </span>
            </div>
          </div>
          {i < total - 1 && (
            <motion.div animate={{ background: i < step - 1 ? accent : "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, height: 2, borderRadius: 2, minWidth: 20 }} />
          )}
        </div>
      ))}
      <span style={{ ...mono(7, 600), color: P.muted, marginLeft: "auto", letterSpacing: ".1em", whiteSpace: "nowrap" }}>
        {step} / {total}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — toda la lógica auth intacta
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage({ onGoLogin, onGoBack, onSuccess, googleData }) {
  const rawInitialDraft = useMemo(() => readRegisterDraft(), []);
  // Un borrador de una sesión de Google anterior solo es válido si coincide
  // con el usuario de Firebase Auth actualmente logueado (evita reusar un
  // uid viejo/borrado que quedó guardado en localStorage).
  const initialDraft = useMemo(() => {
    if (rawInitialDraft?.authSource === "google") {
      const currentUid = auth.currentUser?.uid;
      if (!currentUid || rawInitialDraft?.googleProfile?.uid !== currentUid) {
        clearRegisterDraft();
        return null;
      }
    }
    return rawInitialDraft;
  }, [rawInitialDraft]);
  const initialGoogleProfile = useMemo(() => {
    if (googleData?.fromGoogle) return googleData;
    if (initialDraft?.authSource === "google" && initialDraft?.googleProfile?.uid) return initialDraft.googleProfile;
    return null;
  }, [googleData, initialDraft]);
  const [googleProfile, setGoogleProfile] = useState(initialGoogleProfile);
  const fromGoogle = !!googleProfile;

  const skipBoot = readSession(BOOTED_KEY) === "1";

  const [username,      setUsername]      = useState(() => initialGoogleProfile?.username || initialDraft?.username || "");
  const [email,         setEmail]         = useState(() => initialGoogleProfile?.email || initialDraft?.email || "");
  const [password,      setPassword]      = useState("");
  const [confirmPwd,    setConfirmPwd]    = useState("");
  const [classIdx,      setClassIdx]      = useState(() => {
    if (typeof initialDraft?.classIdx === "number" && initialDraft.classIdx >= 0 && initialDraft.classIdx < CLASSES.length) {
      return initialDraft.classIdx;
    }
    try {
      const saved = readSession(SELECTED_CLASS_KEY);
      if (saved !== null) { const idx = parseInt(saved, 10); if (idx >= 0 && idx < CLASSES.length) return idx; }
    } catch { /* noop */ }
    return 0;
  });
  const fromHome = (() => {
    try { return readSession(SELECTED_CLASS_KEY) !== null; } catch { return false; }
  })();
  const [errors,         setErrors]         = useState({});
  const [touched,        setTouched]        = useState({});
  const [loading,        setLoading]        = useState(false);
  const [loadingGoogle,  setLoadingGoogle]  = useState(false);
  const [successState,   setSuccessState]   = useState(null);
  const [shaking,        setShaking]        = useState(false);
  const [step,           setStep]           = useState(() => {
    if (initialGoogleProfile) return 2;
    if (!initialDraft?.username && !initialDraft?.email) return 1;
    return initialDraft?.step === 2 ? 2 : 1;
  });
  const [loaded,         setLoaded]         = useState(() => readSession(BOOTED_KEY) === "1");
  const [usernameStatus, setUsernameStatus] = useState("idle"); // idle | checking | available | taken
  const usernameDebounce = useRef(null);
  const usernameAvailabilityCache = useRef(new Map());
  const initialClassIdxRef = useRef(classIdx);
  const [classConfirmed, setClassConfirmed] = useState(() => {
    if (typeof initialDraft?.classConfirmed === "boolean") return initialDraft.classConfirmed;
    try { return readSession(SELECTED_CLASS_KEY) !== null; } catch { return false; }
  });
  const [tosAccepted,  setTosAccepted]  = useState(() => !!initialDraft?.tosAccepted);
  const [rememberMe,   setRememberMe]   = useState(() => initialDraft?.rememberMe ?? true);

  const triggerShake = () => { setShaking(true); setTimeout(() => setShaking(false), 460); };

  // ── Validation ─────────────────────────────────────────────────
  const validateField = useCallback((field, val) => {
    switch (field) {
      case "username":
        if (!val.trim())            return "El nombre de héroe es obligatorio";
        if (val.length < 3)         return "Mínimo 3 caracteres";
        if (val.length > 20)        return "Máximo 20 caracteres";
        if (!USERNAME_RE.test(val)) return "Solo letras, números y _ (sin espacios)";
        { const profErr = validateClean(val, "nombre de héroe"); if (profErr) return profErr; }
        return null;
      case "email":
        if (!val.trim())               return "El correo es obligatorio";
        if (!/\S+@\S+\.\S+/.test(val)) return "Correo inválido";
        return null;
      case "password":
        if (!val)           return "La contraseña es obligatoria";
        if (val.length < 6) return "Mínimo 6 caracteres";
        return null;
      case "confirmPwd":
        if (!val)             return "Confirma tu contraseña";
        if (val !== password) return "Las contraseñas no coinciden";
        return null;
      default: return null;
    }
  }, [password]);

  const handleBlur = useCallback((field) => {
    setTouched(t => ({ ...t, [field]: true }));
    const val = field === "username" ? username : field === "email" ? email : field === "password" ? password : confirmPwd;
    setErrors(e => ({ ...e, [field]: validateField(field, val) || undefined }));
  }, [username, email, password, confirmPwd, validateField]);

  const clearGeneral = () => { if (errors.general) setErrors(p => ({ ...p, general: undefined })); };

  useEffect(() => {
    const saveId = setTimeout(() => {
      try {
        const payload = {
          username,
          email,
          step,
          tosAccepted,
          classIdx,
          classConfirmed,
          rememberMe,
          authSource: fromGoogle ? "google" : "email",
          googleProfile: fromGoogle && googleProfile
            ? {
                uid: googleProfile.uid,
                email: googleProfile.email,
                username: googleProfile.username ?? username,
                fromGoogle: true,
              }
            : null,
        };
        writeLocal(REGISTER_DRAFT_KEY, JSON.stringify(payload));
      } catch {}
    }, 180);

    return () => clearTimeout(saveId);
  }, [username, email, step, tosAccepted, classIdx, classConfirmed, rememberMe, fromGoogle, googleProfile]);

  const verifyUsernameAvailability = useCallback(async (rawUsername) => {
    const trimmed = rawUsername.trim();
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    const cached = usernameAvailabilityCache.current.get(trimmed);
    if (cached) {
      setUsernameStatus(cached.available ? "available" : "taken");
      setErrors((prev) => ({ ...prev, username: cached.error || undefined }));
      return cached;
    }
    setUsernameStatus("checking");
    try {
      const { available } = await checkUsername(trimmed);
      const error = available ? null : "Este nombre de héroe ya está en uso";
      const result = { available, error };
      usernameAvailabilityCache.current.set(trimmed, result);
      setUsernameStatus(available ? "available" : "taken");
      setErrors((prev) => ({ ...prev, username: error || undefined }));
      return result;
    } catch {
      const error = "No pudimos verificar el nombre ahora. Intenta de nuevo";
      setUsernameStatus("idle");
      setErrors((prev) => ({ ...prev, username: error }));
      return { available: false, error };
    }
  }, []);

  const continueRegisterWithGoogle = useCallback((profile) => {
    const nextProfile = {
      uid: profile.uid,
      email: profile.email || "",
      username: profile.username || profile.displayName || profile.email?.split("@")[0] || "",
      fromGoogle: true,
    };
    setGoogleProfile(nextProfile);
    setUsername(nextProfile.username);
    setEmail(nextProfile.email);
    setStep(2);
    setErrors({});
    setTouched({});
  }, []);

  const handleUsernameChange = (e) => {
    const v = e.target.value; setUsername(v); clearGeneral();
    const fmtErr = validateField("username", v);
    if (touched.username) setErrors(p => ({ ...p, username: fmtErr || undefined }));
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    if (!fmtErr && v.trim().length >= 3) {
      setUsernameStatus("checking");
      usernameDebounce.current = setTimeout(async () => {
        await verifyUsernameAvailability(v);
      }, 600);
    } else {
      setUsernameStatus("idle");
    }
  };

  const handleEmailChange      = (e) => { const v = e.target.value; setEmail(v);      clearGeneral(); if (touched.email)      setErrors(p => ({ ...p, email:      validateField("email",      v) || undefined })); };
  const handlePasswordChange   = (e) => { const v = e.target.value; setPassword(v);   clearGeneral(); if (touched.password)   setErrors(p => ({ ...p, password:   validateField("password",   v) || undefined })); };
  const handleConfirmPwdChange = (e) => { const v = e.target.value; setConfirmPwd(v); clearGeneral(); if (touched.confirmPwd) setErrors(p => ({ ...p, confirmPwd: validateField("confirmPwd", v) || undefined })); };

  const handleNext = async (e) => {
    e?.preventDefault?.();
    const vals = { username, email, password, confirmPwd };
    const errs = {};
    Object.keys(vals).forEach(f => {
      const err = validateField(f, vals[f]);
      if (err) errs[f] = err;
    });
    if (!errs.username) {
      const availability = usernameStatus === "available"
        ? { available: true, error: null }
        : await verifyUsernameAvailability(username);
      if (!availability.available) errs.username = availability.error;
    }
    if (!fromGoogle && !tosAccepted) errs.tos = "Debes aceptar los Términos de servicio para continuar";
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTouched({ username: true, email: true, password: true, confirmPwd: true });
      triggerShake();
      return;
    }
    setErrors({});
    setStep(2);
  };

  const goBack = () => { setErrors({}); setStep(1); if (!fromHome) setClassConfirmed(false); };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!classConfirmed) { setErrors(p => ({ ...p, classError: "Elige una clase antes de continuar" })); triggerShake(); return; }
    const usernameErr = fromGoogle ? validateField("username", username) : null;
    if (usernameErr) { setErrors({ username: usernameErr }); triggerShake(); return; }
    setLoading(true);
    try {
      if (fromGoogle) {
        if (auth.currentUser && username !== (googleProfile?.username || auth.currentUser.displayName || "")) {
          await updateProfile(auth.currentUser, { displayName: username });
        }
        await registerProfile(googleProfile.uid, username, googleProfile.email, CLASSES[classIdx].name);
      } else {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await updateProfile(cred.user, { displayName: username });
        await registerProfile(cred.user.uid, username, email, CLASSES[classIdx].name);
      }
      removeSession(SELECTED_CLASS_KEY);
      clearRegisterDraft();
      setSuccessState({
        verificationPending: !fromGoogle,
        contactEmail: fromGoogle ? (googleProfile?.email || email) : email,
        authSource: fromGoogle ? "google" : "email",
      });
    } catch (err) {
      setErrors({ general: firebaseError(err.code) || err.message, generalCode: err.code });
      const step1Codes = ["auth/email-already-in-use", "auth/invalid-email", "auth/weak-password"];
      if (!fromGoogle && step1Codes.includes(err.code)) setStep(1);
      triggerShake();
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setErrors({}); setLoadingGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      continueRegisterWithGoogle({ uid: user.uid, email: user.email, username: user.displayName });
    } catch (err) {
      setErrors({ general: firebaseError(err.code) });
    } finally { setLoadingGoogle(false); }
  };

  // Username status badge
  const UsernameBadge = usernameStatus === "checking" ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
      <div style={{ width: 10, height: 10, border: `1px solid ${P.line}`, borderTop: `1px solid ${P.blue}`, borderRadius: "50%", animation: "fv6r-spin 0.7s linear infinite" }} />
      <span style={{ ...mono(8, 600), color: P.blue }}>Verificando...</span>
    </div>
  ) : usernameStatus === "available" ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, ...mono(8, 700), color: P.success }}>
        <Check size={12} />
        Disponible
      </span>
    </div>
  ) : usernameStatus === "taken" ? null : null;

  const activeMedia = useMemo(
    () => (step === 2 ? REGISTER_CLASS_MEDIA[classIdx] ?? REGISTER_CLASS_MEDIA[0] : REGISTER_NEUTRAL_MEDIA),
    [classIdx, step]
  );
  const activeAccent = getRegisterAccent(step, classIdx);
  const activeTitle = step === 2 ? (CLASSES[classIdx]?.name ?? "Tu clase") : "Tu cuenta";
  const verificationLabel = fromGoogle ? "Acceso validado" : "Correo de verificación";
  const verificationValue = fromGoogle ? "Google listo" : "Se envia al crear";


  return (
    <>
      <style>{CSS}</style>
      <AuroraBackground />
      {!skipBoot && (
        <AuthPortalLoader
          onDone={() => setLoaded(true)}
          title="ForgeVenture"
          subtitle="Forja de cuenta"
          lines={BOOT_SEQUENCE}
          progressLabel="PREPARANDO TU SELLO"
        />
      )}
      {successState && <AchievementToast />}

      <AnimatePresence>
        {successState && (
          <RegistrationSuccessScreen username={username} classIdx={classIdx}
            verificationPending={successState.verificationPending}
            contactEmail={successState.contactEmail}
            authSource={successState.authSource}
            onDone={() => { setSuccessState(null); onSuccess?.(); }} />
        )}
      </AnimatePresence>
      {/* ── MAIN LAYOUT ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: skipBoot ? 0.3 : 0.01 }}
        style={{ minHeight: "100vh", display: "flex", alignItems: "stretch", justifyContent: "center", position: "relative", zIndex: 2 }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease }}
          className="px6r-corners rg6-grid"
          style={{
            "--cc": activeAccent,
            width: "100%", maxWidth: 1380,
            display: "grid", gridTemplateColumns: "minmax(420px, 0.92fr) minmax(560px, 1.08fr)",
            background: `linear-gradient(180deg, rgba(9,8,18,0.94), rgba(8,7,16,0.9))`, border: `1px solid rgba(255,255,255,0.08)`,
            boxShadow: `${HOME_PANEL_INSET}, 0 30px 80px rgba(0,0,0,0.6)`,
            overflow: "hidden", position: "relative", alignSelf: "stretch",
          }}>

          {/* Top accent bar */}
          <motion.div
            animate={{
              background: step === 2
                ? `linear-gradient(90deg, ${CLASS_DISPLAY[classIdx]?.color ?? P.accent}, ${CLASS_DISPLAY[classIdx]?.color ?? P.accent}66, transparent)`
                : `linear-gradient(90deg, ${HOME_PUBLIC_COLORS.archer}, ${HOME_PUBLIC_COLORS.mage}, ${HOME_PUBLIC_COLORS.warrior}, transparent)`,
              boxShadow: step === 2
                ? `0 0 12px ${CLASS_DISPLAY[classIdx]?.color ?? P.accent}66`
                : `0 0 12px ${HOME_PUBLIC_COLORS.mage}44`,
            }}
            transition={{ duration: 0.5 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 20 }} />
          {/* Left panel */}
          <RegisterLandingPanel
            step={step}
            classIdx={classIdx}
            fromGoogle={fromGoogle}
            fromHome={fromHome}
            onReturnHome={() => {
              if (onGoBack) {
                onGoBack();
                return;
              }
              window.location.assign("/home");
            }}
          />

          {/* ── RIGHT PANEL ── */}
          <div className="rg6-right"
            style={{ padding: "36px 40px 20px", display: "flex", flexDirection: "column", justifyContent: "flex-start",
              position: "relative", background: `linear-gradient(180deg, rgba(9,8,18,0.9), rgba(8,7,16,0.96))`, backdropFilter: "blur(16px)", overflowY: "auto" }}>

            {/* Ambient orbs */}
            <div style={{ position: "absolute", right: "-10%", top: "5%", width: 280, height: 280, borderRadius: "50%",
              background: `radial-gradient(circle, ${activeAccent}14 0%, transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />

            {/* Mobile top banner */}
            <div className="rg6-mobile-top">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={11} color={activeAccent} />
                <span className="grad-text-r" style={{ ...orb(7) }}>FORGEVENTURE</span>
              </div>
              <span style={{ ...mono(7, 600), color: P.muted, letterSpacing: ".1em" }}>FORJA DE CUENTA</span>
            </div>

            {/* Back / Login buttons — glassmorphism pills */}
            <div className="rg6-back" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {step === 2 && !fromGoogle && (
                <motion.button type="button" onClick={goBack}
                  aria-label="Volver al paso de cuenta"
                  whileHover={{ scale: 1.05, borderColor: `${activeAccent}66`, color: activeAccent, y: -2 }}
                  whileTap={{ scale: 0.93 }}
                  style={{ ...sans(11, 700), color: P.muted, letterSpacing: ".08em",
                    ...makeHomePill(activeAccent), backdropFilter: "blur(10px)",
                    padding: "7px 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "color .15s, border-color .15s" }}>
                  Volver a datos
                </motion.button>
              )}
              {step !== 1 && (
                <motion.button type="button"
                  onClick={() => onGoLogin?.()}
                  aria-label="Ir a iniciar sesión"
                  whileHover={{ scale: 1.05, borderColor: `${activeAccent}66`, color: activeAccent, y: -2 }}
                  whileTap={{ scale: 0.93 }}
                  style={{ ...sans(11, 700), color: P.muted, letterSpacing: ".08em",
                    ...makeHomePill(activeAccent), backdropFilter: "blur(10px)",
                    padding: "7px 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "color .15s, border-color .15s" }}>
                  Ya tengo cuenta
                </motion.button>
              )}
            </div>

            <div style={{ width: "100%", maxWidth: 760, marginRight: "auto" }}>
            {/* Header */}
            <motion.div variants={FV.up} initial="hidden" animate="show" style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ ...makeHomePanel({ radius: 14, surface: "rgba(10,12,20,0.72)", outerGlow: "rgba(0,0,0,0.22)" }), width: 44, height: 44, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <img src="/logo.png" alt="ForgeVenture" style={{ width: 26, height: 26, objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ ...homeHeading(14, 700), color: "#f5f1ff" }}>ForgeVenture</div>
                  <div style={{ ...mono(7, 600), color: HOME_PUBLIC_COLORS.neutral, letterSpacing: ".12em" }}>PORTAL DE REGISTRO</div>
                </div>
              </div>
              <h1 style={{ ...homeHeading("clamp(26px,3vw,38px)", 700), color: "#f7f3ff", marginBottom: 10, lineHeight: 1.04 }}>
                {step === 1 ? "Crea tu cuenta." : "Elige tu clase."}
              </h1>
              <p style={{ ...sans(14, 500), color: "#ccd5e7", lineHeight: 1.65, maxWidth: 480 }}>
                {step === 1
                  ? "Nombre de héroe, acceso seguro y clase en dos pasos. Sin ruido."
                  : "La clase define tu mapa, colores y primeras recomendaciones."}
              </p>
            </motion.div>

            <div style={{ ...makeHomePanel({ radius: 22, surface: "rgba(9,10,18,0.86)", outerGlow: "rgba(0,0,0,0.28)" }), marginBottom: 12, padding: "14px 16px 14px" }}>
              <StepIndicator step={step} classIdx={classIdx} />

              {/* General error */}
              <AnimatePresence>
                {errors.general && (
                  <motion.div role="alert"
                    initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    style={{ background: `${P.error}0f`, border: `1px solid ${P.error}44`, borderLeft: `3px solid ${P.error}`, padding: "10px 14px", marginBottom: 18, overflow: "hidden" }}>
                    <span style={{ ...mono(8, 700), color: P.error, letterSpacing: ".06em" }}>⚠ {errors.general}</span>
                    {errors.generalCode === "auth/email-already-in-use" && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        <span style={{ ...sans(12, 400), color: P.mutedL }}>¿Ya tienes cuenta?</span>
                        <motion.button type="button" onClick={() => onGoLogin?.()}
                          aria-label="Ir a iniciar sesión"
                          whileHover={{ color: HOME_PUBLIC_COLORS.mage }} whileTap={{ scale: 0.95 }}
                          style={{ ...sans(12, 700), color: HOME_PUBLIC_COLORS.mage, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Iniciar sesión
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── STEP 1: ACCOUNT FORM ── */}
              <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}>

                  {/* Google button (only non-Google flow) */}
                  {!fromGoogle && (
                    <>
                      <motion.button type="button" onClick={handleGoogle} disabled={loadingGoogle || loading}
                        aria-label="Continuar registro con Google"
                        whileHover={!loadingGoogle && !loading ? { scale: 1.02, y: -2, borderColor: "rgba(66,133,244,0.4)" } : {}}
                        whileTap={!loadingGoogle && !loading ? { scale: 0.97 } : {}}
                        style={{ width: "100%", padding: "12px 16px", marginBottom: 12,
                          background: "rgba(10,14,26,0.7)", border: `1px solid rgba(66,133,244,0.22)`,
                          borderRadius: 10,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
                          cursor: loadingGoogle ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          opacity: loadingGoogle ? 0.7 : 1, transition: "all .2s" }}>
                        {loadingGoogle ? (
                          <><Spinner size={16} color="#4285F4" /><span style={{ ...sans(13, 600), color: P.muted }}>Conectando...</span></>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.7 39.7 16.4 44 24 44z"/>
                              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                            </svg>
                            <span style={{ ...sans(14, 600), color: P.text }}>Registrarse con Google</span>
                          </>
                        )}
                      </motion.button>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${P.line})` }} />
                        <span style={{ ...sans(11, 500), color: P.muted, letterSpacing: ".06em" }}>o crea con correo</span>
                        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${P.line}, transparent)` }} />
                      </div>
                    </>
                  )}

                  {/* Account form */}
                  <motion.form onSubmit={handleNext} noValidate
                    animate={shaking ? { x: [-7, 7, -5, 5, -3, 3, 0] } : "show"}
                    transition={{ duration: 0.45 }}
                    variants={FV.stagger} initial="hidden">

                    <InputField id="reg-username" label="NOMBRE DE HÉROE" type="text"
                      value={username} onChange={handleUsernameChange} onBlur={() => handleBlur("username")}
                      placeholder="Ej: DarkKnight99" error={errors.username}
                      hint="3–20 caracteres · solo letras, números y _"
                      autoComplete="username" statusBadge={UsernameBadge} />

                    {!fromGoogle && (
                      <>
                        <InputField id="reg-email" label="CORREO" type="email"
                          value={email} onChange={handleEmailChange} onBlur={() => handleBlur("email")}
                          placeholder="heroe@forgeventure.com" error={errors.email} autoComplete="email" inputMode="email" />

                        <InputField id="reg-password" label="CONTRASEÑA" type="password"
                          value={password} onChange={handlePasswordChange} onBlur={() => handleBlur("password")}
                          placeholder="••••••••" error={errors.password} autoComplete="new-password" />

                        <PasswordStrength password={password} />

                        <InputField id="reg-confirm" label="CONFIRMAR CONTRASEÑA" type="password"
                          value={confirmPwd} onChange={handleConfirmPwdChange} onBlur={() => handleBlur("confirmPwd")}
                          placeholder="••••••••" error={errors.confirmPwd} autoComplete="new-password" />
                      </>
                    )}

                    {!fromGoogle && (
                      <>
                        <div onClick={() => setRememberMe(v => !v)}
                          role="checkbox"
                          aria-checked={rememberMe}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setRememberMe(v => !v);
                            }
                          }}
                          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", userSelect: "none" }}>
                          <div style={{ width: 16, height: 16, background: rememberMe ? HOME_PUBLIC_COLORS.mage : "transparent", border: `2px solid ${rememberMe ? HOME_PUBLIC_COLORS.mage : P.muted}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
                            {rememberMe && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ ...sans(12, 500), color: P.muted }}>Mantener sesión iniciada</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                          <RadixCheckbox.Root
                            id="reg-tos"
                            checked={tosAccepted}
                            onCheckedChange={(v) => { setTosAccepted(!!v); if (errors.tos) setErrors(p => ({ ...p, tos: undefined })); }}
                            className="fv6r-checkbox-root"
                            style={{ marginTop: 2 }}>
                            <RadixCheckbox.Indicator className="fv6r-checkbox-indicator">
                              <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 4.5L3.5 7L8 1.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </RadixCheckbox.Indicator>
                          </RadixCheckbox.Root>
                          <label htmlFor="reg-tos" style={{ ...sans(11, 400), color: P.muted, lineHeight: 1.5, cursor: "pointer" }}>
                            Acepto los{" "}
                            <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: HOME_PUBLIC_COLORS.mage, textDecoration: "underline" }}>Términos de Servicio</a>
                            {" "}y la{" "}
                            <a href="/privacidad" target="_blank" rel="noreferrer" style={{ color: HOME_PUBLIC_COLORS.mage, textDecoration: "underline" }}>Política de Privacidad</a>
                          </label>
                        </div>
                        <AnimatePresence>
                          {errors.tos && (
                            <motion.div role="alert"
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }} style={{ overflow: "hidden", marginBottom: 12 }}>
                              <div style={{ ...mono(8, 700), color: P.error, background: `${P.error}11`, border: `1px solid ${P.error}44`, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                                <span>⚠</span> {errors.tos}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.div
                          variants={FV.up}
                          style={{
                            marginBottom: 10,
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: `1px solid ${activeAccent}2f`,
                            background: `linear-gradient(180deg, ${activeAccent}10, rgba(9,11,20,0.82))`,
                            display: "grid",
                            gap: 5,
                          }}
                        >
                          <div style={{ ...mono(8, 700), color: activeAccent, letterSpacing: ".1em" }}>
                            AL TERMINAR
                          </div>
                          <p style={{ ...sans(11, 500), color: "#d5dcef", lineHeight: 1.55, margin: 0 }}>
                            Creamos tu acceso, guardamos la clase elegida y enviamos un correo de verificación para activar la entrada completa al mapa.
                          </p>
                        </motion.div>
                      </>
                    )}

                    <div className="rg6-sticky-cta">
                      <motion.button type="submit" disabled={loading}
                        aria-label="Continuar al paso de clase"
                        whileHover={!loading ? { scale: 1.02, y: -3, boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 30px ${HOME_PUBLIC_COLORS.mage}30` } : {}}
                        whileTap={!loading ? { scale: 0.97, y: 1 } : {}}
                        className="fv6r-btn"
                        style={{ width: "100%", ...sans(14, 700), letterSpacing: ".08em",
                          color: loading ? P.muted : "#fff",
                          background: loading
                            ? `${HOME_PUBLIC_COLORS.mage}44`
                            : makePrimaryButtonBackground(activeAccent, false),
                          border: "none", padding: "15px", borderRadius: 10,
                          cursor: loading ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          boxShadow: `0 4px 24px ${HOME_PUBLIC_COLORS.mage}24, 0 0 0 1px ${HOME_PUBLIC_COLORS.mage}12` }}>
                        {loading ? <><Spinner size={13} /> PROCESANDO...</> : usernameStatus === "checking" ? <><Spinner size={13} color={P.blue} /> VERIFICANDO...</> : <><span>Siguiente</span><ArrowRight size={15} /></>}
                      </motion.button>
                    </div>
                  </motion.form>

                  {/* Login link */}
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <span style={{ ...sans(13, 400), color: P.muted }}>¿Ya tienes cuenta?{" "}</span>
                    <motion.button type="button" onClick={() => onGoLogin?.()}
                      aria-label="Ir a iniciar sesión"
                      whileHover={{ color: HOME_PUBLIC_COLORS.mage }}
                      style={{ ...sans(13, 700), color: HOME_PUBLIC_COLORS.mage, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      Iniciar sesión
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: CLASS SELECTION ── */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}>

                  {fromHome && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      style={{ ...makeHomePanel({ radius: 16, surface: `${activeAccent}10`, border: `${activeAccent}33`, outerGlow: "rgba(0,0,0,0.14)" }), display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "9px 14px" }}
                    >
                      <span style={{ fontSize: 16 }}>{CLASSES[classIdx].icon}</span>
                      <div>
                        <div style={{ ...mono(8, 700), color: activeAccent, letterSpacing: ".1em" }}>
                          CLASE PRE-SELECCIONADA DESDE HOME
                        </div>
                        <div style={{ ...sans(11, 500), color: P.mutedL, marginTop: 2 }}>
                          {CLASSES[classIdx].name} · {CLASSES[classIdx].tag} · Puedes cambiarla abajo
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <ClassSelector
                    selected={classIdx}
                    onChange={(i) => { setClassIdx(i); writeSession(SELECTED_CLASS_KEY, String(i)); }}
                    onConfirm={() => setClassConfirmed(true)}
                    classError={errors.classError}
                    fromHome={fromHome}
                    recommendedIdx={initialClassIdxRef.current} />

                  <div style={{ ...makeHomePanel({ radius: 16, surface: "rgba(9,10,18,0.74)", outerGlow: "rgba(0,0,0,0.16)" }), marginBottom: 14, padding: "14px 14px 12px" }}>
                    <div style={{ ...mono(8, 700), color: activeAccent, letterSpacing: ".1em", marginBottom: 10 }}>
                      TU CUENTA EMPIEZA CON
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                      {REGISTER_REWARD_PREVIEW.map((reward) => (
                        <div key={reward.title} style={{ ...makeHomePanel({ radius: 14, surface: "rgba(255,255,255,0.03)", outerGlow: "rgba(0,0,0,0.12)" }), padding: "10px 10px 12px", textAlign: "center" }}>
                          <img src={reward.image} alt="" style={{ width: 34, height: 34, objectFit: "contain", marginBottom: 8 }} />
                          <div style={{ ...sans(11, 700), color: "#f5f2ff", marginBottom: 4 }}>{reward.title}</div>
                          <div style={{ ...sans(10, 500), color: P.muted, lineHeight: 1.45 }}>{reward.copy}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.button type="button" onClick={handleSubmit} disabled={loading}
                    aria-label="Finalizar registro y crear personaje"
                    whileHover={!loading ? { scale: 1.02, y: -3, boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 30px ${P.accent}44` } : {}}
                    whileTap={!loading ? { scale: 0.97, y: 1 } : {}}
                    className="fv6r-btn"
                    style={{ width: "100%", ...sans(14, 700), letterSpacing: ".08em",
                      color: loading ? P.muted : "#fff",
                      background: loading
                        ? `${activeAccent}44`
                        : makePrimaryButtonBackground(activeAccent, true),
                      border: "none", padding: "15px", borderRadius: 10, marginBottom: 10,
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      boxShadow: `0 4px 24px ${activeAccent}33, 0 0 0 1px ${activeAccent}16` }}>
                    {loading ? <><Spinner size={13} /> FORJANDO HEROE...</> : "Forjar mi personaje"}
                  </motion.button>

                  <p style={{ ...sans(11, 400), color: P.muted, textAlign: "center" }}>
                    Podrás cambiar de clase más adelante desde tu perfil.
                  </p>
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
