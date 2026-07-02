import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  Brain,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Flame,
  HeartPulse,
  Lock,
  Map,
  MessageCircle,
  Instagram,
  Mail,
  Plus,
  Send,
  Shield,
  Sparkles,
  Swords,
  TimerReset,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { auth } from "../firebase";
import { getPublicStats } from "../services/api";

const FONT_ID = "forgeventure-home-fonts";
if (typeof document !== "undefined" && !document.getElementById(FONT_ID)) {
  const link = document.createElement("link");
  link.id = FONT_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700&family=Sora:wght@600;700;800&display=swap";
  document.head.appendChild(link);
}

const HOME_CLASSES = [
  {
    key: "GUERRERO",
    name: "Guerrero",
    short: "Fuerza",
    accent: "#ff4d5e",
    secondary: "#c9184a",
    crest: "/ui/crest-warrior.png",
    hero: "/missions/missions-hero-warrior.png",
    floor: "/exercises/hero/hero-floor-glow-warrior.png",
    zoneBanner: "/exercises/zones/zone-fuerza-banner.png",
    sceneMark: "/exercises/hero/hero-training-mark.png",
    title: "Fuerza, impacto y constancia con lectura de progreso real.",
    subtitle:
      "Entra con una ruta clara hacia fuerza, botin, misiones y progreso visible para que cada sesion tenga peso desde el primer dia.",
    route: "Campo de fuerza",
    routeCopy: "Quests fisicas con peso real, cadenas de repeticiones y progreso estable.",
    perks: [
      "Resalta rutas de fuerza, funcional y calistenia.",
      "Prioriza contratos de impacto y cierres con botin claro.",
      "Empuja una lectura mas roja, mas firme y con energia de arena.",
    ],
    classCopy: "Pensado para quien quiere ver el entrenamiento como avance de campana y no como una lista suelta.",
  },
  {
    key: "ARQUERO",
    name: "Arquero",
    short: "Cardio",
    accent: "#7bdc3b",
    secondary: "#20c997",
    crest: "/ui/crest-archer.png",
    hero: "/missions/missions-hero-archer.png",
    floor: "/exercises/hero/hero-floor-glow-archer.png",
    zoneBanner: "/exercises/zones/zone-cardio-banner.png",
    sceneMark: "/exercises/hero/hero-training-mark.png",
    title: "Velocidad, pulso y ritmo para sostener la aventura.",
    subtitle:
      "Sigue rutas de cardio, HIIT y movilidad con sesiones rapidas, metas claras y recompensas pensadas para mantener el ritmo.",
    route: "Ruta de impulso",
    routeCopy: "Tramos de cardio, desplazamiento, movilidad y sesiones cortas con retorno rapido.",
    perks: [
      "Muestra primero zonas de cardio, HIIT y ritmo activo.",
      "Da mas protagonismo a rachas, tiempo y distancia recorrida.",
      "Favorece recorridos agiles y metas que premian constancia sin perder velocidad.",
    ],
    classCopy: "Ideal para quien necesita entrar, leer el mapa rapido y arrancar sin perder tiempo.",
  },
  {
    key: "MAGO",
    name: "Mago",
    short: "Control",
    accent: "#4cc9f0",
    secondary: "#2f80ed",
    crest: "/ui/crest-mage.png",
    hero: "/missions/missions-hero-mage.png",
    floor: "/exercises/hero/hero-floor-glow-mage.png",
    zoneBanner: "/exercises/zones/zone-flexibilidad-banner.png",
    sceneMark: "/exercises/hero/hero-training-mark.png",
    title: "Control corporal, respiracion y foco convertidos en progreso.",
    subtitle:
      "Encuentra un camino mas preciso para respirar mejor, ganar movilidad y avanzar con control real del cuerpo.",
    route: "Santuario del foco",
    routeCopy: "Respiracion, flexibilidad, control corporal y sesiones con memoria real del heroe.",
    perks: [
      "Destaca mente, flexibilidad y recuperacion inteligente.",
      "Hace visible el progreso suave sin quitar peso al botin.",
      "Refuerza sesiones donde enfoque, tecnica y recuperacion suman de verdad.",
    ],
    classCopy: "Hecha para quien quiere una escena con presencia, pero con un tono mas limpio y concentrado.",
  },
];

const HERO_IDLE_FRAMES = Array.from({ length: 8 }, (_, index) => `/avatar/idle/idle_0${index + 1}.png`);

const HOME_NEUTRAL_PREVIEW = {
  key: "NEUTRAL",
  title: "El gremio abre sus puertas con fuerza, ritmo y foco listos para que elijas tu camino.",
  subtitle:
    "Explora el mapa, conoce las clases y descubre como tu entrenamiento puede sentirse como una aventura continua desde el primer vistazo.",
  hero: "/missions/missions-hero-default.png",
  crest: "/ui/header/section-home.png",
  route: "Mesa del gremio",
  routeCopy: "Guerrero, Arquero y Mago esperan para que descubras cual encaja mejor con tu forma de entrenar.",
  zoneBanner: "/logo.png",
  sceneMark: "/exercises/hero/hero-training-mark.png",
};

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio" },
  { id: "mundo", label: "Mundo", section: "centro" },
  { id: "clases", label: "Clases", section: "centro" },
  { id: "sistema", label: "Sistema", section: "centro" },
  { id: "faq", label: "FAQ", section: "centro" },
  { id: "apoyar", label: "Apoyar" },
];

const FEATURE_BANDS = [
  {
    id: "home-band",
    icon: "/ui/header/section-home.png",
    image: "/ui/dashboard-bg.png",
    label: "Home del heroe",
    title: "Tu base reune progreso, botin y decisiones del dia en un solo vistazo.",
    copy:
      "Racha, XP, misiones, ranking y recompensas se leen como si hubieras abierto tu propia bitacora.",
    bullets: ["Resumen del heroe", "Recompensas visibles", "Estado del dia"],
  },
  {
    id: "exercises-band",
    icon: "/ui/header/section-ejercicios.png",
    image: "/exercises/hero/training-scene-default.png",
    label: "Campo de entrenamiento",
    title: "Cada zona de entrenamiento propone un reto claro y una recompensa concreta.",
    copy:
      "Recorre fuerza, cardio, movilidad y mas con hojas tecnicas, sesiones guiadas y objetivos que te invitan a volver.",
    bullets: ["Mapa de zonas", "Rutina rapida", "Tecnica y equipo"],
  },
  {
    id: "missions-band",
    icon: "/ui/header/section-misiones.png",
    image: "/missions/spotlight/spotlight-weekly-banner.png",
    label: "Tablon del gremio",
    title: "Las misiones convierten tus metas en contratos con botin, riesgo y cierre claro.",
    copy:
      "Las quests dejan de verse como tickets sueltos y pasan a sentirse como encargos reales del mapa, con estado, rareza y cierre claro.",
    bullets: ["Botin visible", "Contrato destacado", "Progreso por encargo"],
  },
  {
    id: "routines-band",
    icon: "/ui/header/section-rutinas.png",
    image: "/ui/scene-bg.png",
    label: "Mesa de rutinas",
    title: "Las rutinas se sienten como campanas para sostener ritmo y progresion.",
    copy:
      "Elige rutas por clase, sigue la recomendacion del dia y conserva memoria de lo que ya forjaste.",
    bullets: ["Campanas por clase", "Rutas del dia", "Memoria de sesion"],
  },
];

const SYSTEM_PANELS = [
  {
    icon: Camera,
    image: "/exercises/chips/chip-camera.png",
    title: "Modo camara con conteo real",
    copy: "Cuando usas vision, la pagina premia repeticiones reales y una lectura mas honesta del esfuerzo.",
  },
  {
    icon: TimerReset,
    image: "/exercises/chips/chip-timer.png",
    title: "Timer con progreso limpio",
    copy: "Si entrenas sin camara, el tiempo sigue teniendo peso y la sesion conserva su valor dentro del avance.",
  },
  {
    icon: Shield,
    image: "/missions/rewards/reward-contract-chest.png",
    title: "Misiones y recompensas con memoria",
    copy: "La interfaz no solo muestra loot: lo liga a rutas, contratos y estados utiles para volver manana.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Que hace distinta a ForgeVenture frente a una app fitness comun?",
    a: "No se limita a registrar sesiones. Todo se presenta como un RPG de progreso personal: clases, botin, contratos, rutas y memoria real del heroe.",
  },
  {
    q: "Se puede entrenar sin camara?",
    a: "Si. El sistema ya contempla sesiones manuales y por timer para que el progreso no dependa de un solo modo de verificacion.",
  },
  {
    q: "La clase cambia de verdad la experiencia?",
    a: "Si. El color, la prioridad de zonas, el tono de algunas recomendaciones y el foco de progreso cambian para que cada cuenta se sienta propia.",
  },
  {
    q: "La pagina publica coincide con lo que luego ve el usuario dentro?",
    a: "Si. Lo que ves aqui anticipa el mismo mundo de progreso, clases, quests y recompensas que encuentras al entrar en tu cuenta.",
  },
];

const HOME_FALLBACK_STATS = {
  totalUsers: 16,
  totalExercises: 18,
  totalAchievements: 24,
  classCounts: {
    GUERRERO: 6,
    ARQUERO: 5,
    MAGO: 5,
  },
};

const HOME_FLOW_STORAGE_KEY = "forgeventure-home-flow-tab";

const SOCIAL_LINKS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    role: "Mensajero del gremio",
    hint: "Para dudas rapidas o soporte directo.",
    href: "https://wa.me/573000000000",
    icon: MessageCircle,
  },
  {
    id: "instagram",
    label: "Instagram",
    role: "Cronica del mapa",
    hint: "Novedades, avances y comunidad del gremio.",
    href: "https://instagram.com/forgeventure",
    icon: Instagram,
  },
  {
    id: "telegram",
    label: "Telegram",
    role: "Canal del mapa",
    hint: "Canal agil para avisos y contacto.",
    href: "https://t.me/forgeventure",
    icon: Send,
  },
  {
    id: "mail",
    label: "Correo",
    role: "Escriba del gremio",
    hint: "Consultas largas, alianzas o ayuda tecnica.",
    href: "mailto:hola@forgeventure.app",
    icon: Mail,
  },
];

function getDisplayStat(value, fallback) {
  return typeof value === "number" && value > 0 ? value : fallback;
}

function getStoredFlowTab() {
  if (typeof window === "undefined") return "mundo";
  try {
    const value = window.localStorage.getItem(HOME_FLOW_STORAGE_KEY);
    return ["mundo", "clases", "sistema", "faq"].includes(value) ? value : "mundo";
  } catch {
    return "mundo";
  }
}

const PAGE_CSS = `
  :root {
    color-scheme: dark;
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background: #070611;
  }

  .fvl-home {
    --fv-accent: #d9d7ff;
    --fv-secondary: #b8c7ff;
    --fv-warrior: #ff4d5e;
    --fv-archer: #7bdc3b;
    --fv-mage: #4cc9f0;
    --fv-tri-glow:
      0 0 0 1px rgba(255,255,255,0.02),
      0 0 18px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      0 0 28px color-mix(in srgb, var(--fv-archer) 8%, transparent),
      0 0 38px color-mix(in srgb, var(--fv-mage) 10%, transparent);
    --fv-bg: #070611;
    --fv-surface: rgba(12, 10, 24, 0.82);
    --fv-surface-strong: rgba(14, 12, 28, 0.94);
    --fv-line: rgba(255, 255, 255, 0.08);
    --fv-text: #f7f2ff;
    --fv-muted: #c6bdd6;
    --fv-muted-deep: #8f83a7;
    position: relative;
    min-height: 100vh;
    overflow-x: hidden;
    color: var(--fv-text);
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--fv-warrior) 10%, transparent), transparent 20%),
      radial-gradient(circle at top right, color-mix(in srgb, var(--fv-archer) 10%, transparent), transparent 24%),
      radial-gradient(circle at bottom center, color-mix(in srgb, var(--fv-mage) 12%, transparent), transparent 26%),
      linear-gradient(180deg, #090713, #06050f 48%, #05040d);
    font-family: "Inter", sans-serif;
  }

  .fvl-home::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.2;
    background:
      linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: radial-gradient(circle at center, #000 30%, transparent 88%);
  }

  .fvl-backdrop {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .fvl-backdrop::before,
  .fvl-backdrop::after {
    content: "";
    position: absolute;
    inset: auto;
    border-radius: 999px;
    filter: blur(120px);
    opacity: 0.22;
  }

  .fvl-backdrop::before {
    width: 34vw;
    height: 34vw;
    min-width: 280px;
    min-height: 280px;
    top: 6%;
    left: -4%;
    background: color-mix(in srgb, var(--fv-warrior) 42%, transparent);
  }

  .fvl-backdrop::after {
    width: 30vw;
    height: 30vw;
    min-width: 260px;
    min-height: 260px;
    right: -6%;
    bottom: 8%;
    background: color-mix(in srgb, var(--fv-mage) 42%, transparent);
  }

  .fvl-backdrop-grid {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at center, transparent 20%, rgba(5, 4, 13, 0.8) 100%),
      url("/ui/dashboard-particles.png") center / cover no-repeat;
    opacity: 0.22;
  }

  .fvl-nav {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: min(1440px, calc(100% - 28px));
    margin: 0 auto;
    padding: 14px 18px;
    backdrop-filter: blur(18px);
    background: rgba(7, 6, 17, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0 0 22px 22px;
    border-top: none;
    box-shadow:
      0 12px 34px rgba(0, 0, 0, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 18%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 16%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 18%, transparent);
  }

  .fvl-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
  }

  .fvl-brand img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--fv-accent) 28%, transparent));
  }

  .fvl-brand-copy {
    display: grid;
    gap: 3px;
  }

  .fvl-brand-copy strong,
  .fvl-nav-links button,
  .fvl-kicker span,
  .fvl-class-switch button strong,
  .fvl-badge strong,
  .fvl-stat-strip strong,
  .fvl-faq-trigger strong,
  .fvl-final-copy h2,
  .fvl-footer strong {
    font-family: "Sora", sans-serif;
  }

  .fvl-brand-copy strong {
    font-size: 15px;
    line-height: 1;
  }

  .fvl-brand-copy span {
    color: var(--fv-muted-deep);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .fvl-nav-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .fvl-nav-links button,
  .fvl-nav-ghost,
  .fvl-nav-cta,
  .fvl-hero-ghost,
  .fvl-hero-cta,
  .fvl-final-actions button {
    appearance: none;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
  }

  .fvl-nav-links button {
    min-height: 38px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid transparent;
    color: var(--fv-muted);
    font-size: 13px;
  }

  .fvl-nav-links button:hover,
  .fvl-nav-links button:focus-visible {
    color: var(--fv-text);
    border-color: rgba(255,255,255,0.1);
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.02),
      0 0 10px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      0 0 14px color-mix(in srgb, var(--fv-archer) 8%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-mage) 10%, transparent);
    outline: none;
  }

  .fvl-nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fvl-nav-ghost,
  .fvl-nav-cta,
  .fvl-hero-ghost,
  .fvl-hero-cta,
  .fvl-final-actions button {
    min-height: 44px;
    padding: 12px 18px;
    border-radius: 14px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 700;
  }

  .fvl-nav-ghost,
  .fvl-hero-ghost {
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 7%, transparent),
        rgba(255, 255, 255, 0.04) 38%,
        color-mix(in srgb, var(--fv-mage) 7%, transparent));
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--fv-text);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 18%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 14%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 18%, transparent);
  }

  .fvl-nav-cta,
  .fvl-hero-cta,
  .fvl-final-actions .is-primary {
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 18%, rgba(255,255,255,0.08)),
        color-mix(in srgb, var(--fv-archer) 15%, rgba(255,255,255,0.06)) 52%,
        color-mix(in srgb, var(--fv-mage) 18%, rgba(255,255,255,0.08)));
    color: var(--fv-text);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: var(--fv-tri-glow);
  }

  .fvl-nav-ghost:hover,
  .fvl-nav-cta:hover,
  .fvl-hero-ghost:hover,
  .fvl-hero-cta:hover,
  .fvl-final-actions button:hover {
    transform: translateY(-2px);
    box-shadow:
      0 14px 28px rgba(0,0,0,0.18),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 12%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-archer) 10%, transparent),
      0 0 24px color-mix(in srgb, var(--fv-mage) 12%, transparent);
  }

  .fvl-main {
    position: relative;
    z-index: 1;
    width: min(1480px, calc(100% - 32px));
    margin: 0 auto;
    padding: 16px 0 48px;
    display: grid;
    gap: 22px;
  }

  .fvl-hero {
    display: grid;
    gap: 14px;
  }

  .fvl-hero-shell {
    position: relative;
    overflow: hidden;
    min-height: min(82vh, 800px);
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(90deg, rgba(8, 7, 18, 0.92) 0%, rgba(8, 7, 18, 0.78) 42%, rgba(8, 7, 18, 0.6) 100%),
      var(--hero-image) center / cover no-repeat;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.02),
      0 24px 80px rgba(0, 0, 0, 0.34),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-archer) 9%, transparent),
      0 0 24px color-mix(in srgb, var(--fv-mage) 10%, transparent);
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
    gap: 22px;
    padding: 28px;
    align-items: stretch;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .fvl-hero-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 22%),
      radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 24%);
    pointer-events: none;
  }

  .fvl-hero-shell::after {
    content: "";
    position: absolute;
    inset: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 14%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 12%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 14%, transparent);
    pointer-events: none;
  }

  .fvl-hero-copy,
  .fvl-hero-side {
    position: relative;
    z-index: 1;
  }

  .fvl-hero-copy {
    transform: translateZ(14px);
  }

  .fvl-hero-side {
    transform: translateZ(22px);
  }

  .fvl-hero-shell-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--fv-warrior) 12%, transparent), transparent 28%),
      radial-gradient(circle at 84% 16%, color-mix(in srgb, var(--fv-archer) 11%, transparent), transparent 24%),
      radial-gradient(circle at 58% 84%, color-mix(in srgb, var(--fv-mage) 13%, transparent), transparent 28%);
    opacity: 0.9;
    filter: blur(10px);
  }

  .fvl-hero-shell-ambient {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .fvl-hero-shell-ambient::before,
  .fvl-hero-shell-ambient::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    filter: blur(36px);
    opacity: 0.18;
    animation: fvl-home-drift 16s ease-in-out infinite alternate;
  }

  .fvl-hero-shell-ambient::before {
    width: 240px;
    height: 240px;
    top: 14%;
    left: -3%;
    background: color-mix(in srgb, var(--fv-warrior) 26%, transparent);
  }

  .fvl-hero-shell-ambient::after {
    width: 220px;
    height: 220px;
    right: 8%;
    bottom: 10%;
    background: color-mix(in srgb, var(--fv-mage) 28%, transparent);
    animation-duration: 20s;
  }

  .fvl-hero-shell-particles {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 24%, rgba(255,255,255,0.18) 0 1px, transparent 1.5px),
      radial-gradient(circle at 64% 28%, rgba(255,255,255,0.16) 0 1px, transparent 1.5px),
      radial-gradient(circle at 76% 62%, rgba(255,255,255,0.12) 0 1px, transparent 1.5px),
      radial-gradient(circle at 42% 74%, rgba(255,255,255,0.15) 0 1px, transparent 1.5px);
    opacity: 0.34;
    animation: fvl-home-shimmer 14s linear infinite;
  }

  .fvl-hero-copy {
    display: grid;
    align-content: center;
    gap: 16px;
    padding: 18px 4px 18px 0;
  }

  .fvl-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    min-height: 38px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255,255,255,0.04);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 24%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 20%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 24%, transparent);
  }

  .fvl-kicker img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }

  .fvl-kicker span {
    color: var(--fv-text);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .fvl-hero-copy h1 {
    margin: 0;
    font-family: "Sora", sans-serif;
    font-size: clamp(46px, 8vw, 92px);
    line-height: 0.92;
  }

  .fvl-hero-copy h1 small {
    display: block;
    margin-top: 10px;
    color: #d6ddff;
    font-size: clamp(18px, 2vw, 24px);
    line-height: 1.15;
  }

  .fvl-hero-copy p {
    max-width: 640px;
    margin: 0;
    color: var(--fv-muted);
    font-size: clamp(17px, 2vw, 21px);
    line-height: 1.55;
  }

  .fvl-chip-row,
  .fvl-hero-actions,
  .fvl-class-switch {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .fvl-badge,
  .fvl-hero-pill,
  .fvl-class-switch button {
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(255, 255, 255, 0.04) 40%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent));
  }

  .fvl-badge,
  .fvl-hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 8px 12px;
    color: var(--fv-text);
  }

  .fvl-badge svg,
  .fvl-hero-pill svg {
    color: #cfd8ff;
  }

  .fvl-badge strong,
  .fvl-hero-pill strong {
    font-size: 12px;
  }

  .fvl-badge span,
  .fvl-hero-pill span {
    color: var(--fv-muted);
    font-size: 12px;
  }

  .fvl-class-switch button {
    min-height: 52px;
    padding: 10px 16px;
    color: var(--fv-muted);
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  .fvl-class-switch button img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }

  .fvl-class-switch button strong {
    display: block;
    font-size: 12px;
    line-height: 1.1;
  }

  .fvl-class-switch button span {
    display: block;
    font-size: 11px;
    color: var(--fv-muted-deep);
  }

  .fvl-class-switch button.is-active {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255,255,255,0.05);
    color: var(--fv-text);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 30%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 26%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 30%, transparent),
      0 0 10px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      0 0 16px color-mix(in srgb, var(--fv-archer) 10%, transparent),
      0 0 22px color-mix(in srgb, var(--fv-mage) 12%, transparent);
  }

  .fvl-hero-flow {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .fvl-hero-flow button {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(255, 255, 255, 0.03) 38%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent)),
      rgba(10, 9, 20, 0.74);
    padding: 12px 14px;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 8%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-hero-flow button:hover,
  .fvl-hero-flow button.is-active {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 20%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 18%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 20%, transparent),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 8%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-hero-flow strong {
    display: block;
    font-family: "Sora", sans-serif;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .fvl-hero-flow span {
    display: block;
    color: var(--fv-muted);
    font-size: 11px;
    line-height: 1.4;
  }

  .fvl-hero-context-strip {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .fvl-hero-context-card {
    padding: 14px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(255, 255, 255, 0.03) 38%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent)),
      rgba(10, 9, 20, 0.72);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 8%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-hero-context-card small {
    display: block;
    margin-bottom: 6px;
    color: var(--fv-muted-deep);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .fvl-hero-context-card strong {
    display: block;
    margin-bottom: 6px;
    font-family: "Sora", sans-serif;
    font-size: 14px;
  }

  .fvl-hero-context-card p {
    margin: 0;
    color: var(--fv-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .fvl-hero-flow-trace {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 8px;
    height: 4px;
    border-radius: 999px;
    background:
      linear-gradient(90deg,
        color-mix(in srgb, var(--fv-warrior) 82%, transparent) 0%,
        color-mix(in srgb, var(--fv-archer) 88%, transparent) 48%,
        color-mix(in srgb, var(--fv-mage) 84%, transparent) 100%);
    box-shadow:
      0 0 10px color-mix(in srgb, var(--fv-warrior) 18%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-archer) 18%, transparent),
      0 0 24px color-mix(in srgb, var(--fv-mage) 20%, transparent);
    pointer-events: none;
  }

  .fvl-hero-flow-trace::before {
    content: "";
    position: absolute;
    right: 8%;
    top: 50%;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    transform: translateY(-50%);
    background: radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.16) 48%, transparent 76%);
    filter: blur(1px);
    opacity: 0.92;
  }

  .fvl-hero-flow-trace::after {
    content: "";
    position: absolute;
    inset: -4px -2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
    opacity: 0.42;
  }

  .fvl-hero-side {
    display: grid;
    align-content: end;
    gap: 14px;
  }

  .fvl-aside-card,
  .fvl-surface-card,
  .fvl-section-shell,
  .fvl-system-band,
  .fvl-faq-card,
  .fvl-final-band {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255, 255, 255, 0.03) 36%,
        color-mix(in srgb, var(--fv-mage) 4%, transparent)),
      var(--fv-surface);
    backdrop-filter: blur(16px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 8%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-aside-card {
    overflow: hidden;
    border-radius: 26px;
  }

  .fvl-avatar-stage {
    position: relative;
    min-height: 360px;
    display: grid;
    place-items: center;
    padding: 24px 24px 8px;
    background:
      linear-gradient(180deg, rgba(9, 8, 18, 0.08), rgba(9, 8, 18, 0.72)),
      url("/ui/panel-texture.png"),
      rgba(9, 8, 18, 0.4);
  }

  .fvl-avatar-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at center, color-mix(in srgb, var(--fv-accent) 16%, transparent), transparent 52%);
    pointer-events: none;
  }

  .fvl-avatar-floor {
    position: absolute;
    inset: auto 8% 14px 8%;
    height: 160px;
    background: var(--floor-image) center bottom / contain no-repeat;
    opacity: 0.68;
    pointer-events: none;
  }

  .fvl-avatar-stage .fvl-scene-mark {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 110px;
    height: 110px;
    object-fit: contain;
    opacity: 0.2;
    pointer-events: none;
  }

  .fvl-hero-crest {
    position: absolute;
    top: 18px;
    left: 18px;
    width: 72px;
    height: 72px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--fv-accent) 28%, transparent));
  }

  .fvl-sprite {
    position: relative;
    width: 220px;
    height: 220px;
    background-position: center bottom;
    background-repeat: no-repeat;
    background-size: contain;
    image-rendering: pixelated;
    z-index: 1;
  }

  .fvl-avatar-copy {
    display: grid;
    gap: 14px;
    padding: 18px 18px 20px;
  }

  .fvl-avatar-copy h2,
  .fvl-section-heading h2,
  .fvl-band-copy h3,
  .fvl-class-panel h3,
  .fvl-system-copy h3 {
    margin: 0;
    font-family: "Sora", sans-serif;
    line-height: 1.04;
  }

  .fvl-avatar-copy h2 {
    font-size: clamp(22px, 2.3vw, 30px);
  }

  .fvl-avatar-copy p,
  .fvl-section-heading p,
  .fvl-band-copy p,
  .fvl-panel-copy p,
  .fvl-system-copy p,
  .fvl-faq-body p,
  .fvl-final-copy p,
  .fvl-footer p {
    margin: 0;
    color: var(--fv-muted);
    font-size: 15px;
    line-height: 1.5;
  }

  .fvl-route-note {
    display: grid;
    grid-template-columns: 68px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(255,255,255,0.03) 38%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent));
  }

  .fvl-route-note img {
    width: 68px;
    height: 68px;
    object-fit: cover;
    border-radius: 14px;
  }

  .fvl-route-note strong {
    display: block;
    margin-bottom: 4px;
    font-family: "Sora", sans-serif;
    font-size: 13px;
    color: var(--fv-accent);
  }

  .fvl-route-note span {
    color: var(--fv-muted);
    font-size: 13px;
    line-height: 1.4;
  }

  .fvl-stat-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .fvl-stat-strip .fvl-surface-card {
    padding: 14px;
    border-radius: 18px;
    min-height: 96px;
    display: grid;
    align-content: start;
    gap: 6px;
  }

  .fvl-stat-strip small,
  .fvl-hero-stats small,
  .fvl-section-heading small,
  .fvl-panel-copy small,
  .fvl-system-copy small,
  .fvl-faq-trigger small,
  .fvl-footer small {
    color: var(--fv-muted-deep);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .fvl-stat-strip strong,
  .fvl-hero-stats strong {
    font-size: clamp(24px, 2.2vw, 34px);
    line-height: 1;
  }

  .fvl-hero-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .fvl-hero-stats .fvl-surface-card {
    border-radius: 20px;
    padding: 18px 20px;
    min-height: 110px;
    display: grid;
    align-content: start;
    gap: 8px;
    transition:
      transform 0.28s ease,
      border-color 0.28s ease,
      box-shadow 0.28s ease,
      background 0.28s ease;
    will-change: transform;
  }

  .fvl-hero.is-linked .fvl-hero-stats .fvl-surface-card {
    border-color: rgba(255, 255, 255, 0.11);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 7%, transparent),
        rgba(255, 255, 255, 0.04) 38%,
        color-mix(in srgb, var(--fv-mage) 7%, transparent)),
      var(--fv-surface);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 16%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 14%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 16%, transparent),
      0 12px 28px rgba(0, 0, 0, 0.16),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 8%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-archer) 8%, transparent),
      0 0 22px color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-hero.is-linked .fvl-hero-stats .fvl-surface-card:nth-child(1) {
    transform: translateY(-6px);
  }

  .fvl-hero.is-linked .fvl-hero-stats .fvl-surface-card:nth-child(2) {
    transform: translateY(-10px);
  }

  .fvl-hero.is-linked .fvl-hero-stats .fvl-surface-card:nth-child(3) {
    transform: translateY(-8px);
  }

  .fvl-hero.is-linked .fvl-hero-stats .fvl-surface-card:nth-child(4) {
    transform: translateY(-12px);
  }

  .fvl-hero-stats-note {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    min-height: 34px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255, 255, 255, 0.03) 38%,
        color-mix(in srgb, var(--fv-mage) 4%, transparent)),
      rgba(12, 10, 24, 0.68);
    color: var(--fv-muted);
    font-size: 12px;
  }

  .fvl-home-divider {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 16px;
    min-height: 46px;
    padding: 0 6px;
  }

  .fvl-home-divider::before,
  .fvl-home-divider::after {
    content: "";
    height: 1px;
    background:
      linear-gradient(90deg,
        transparent,
        color-mix(in srgb, var(--fv-warrior) 22%, rgba(255,255,255,0.08)) 18%,
        color-mix(in srgb, var(--fv-archer) 18%, rgba(255,255,255,0.08)) 52%,
        color-mix(in srgb, var(--fv-mage) 22%, rgba(255,255,255,0.08)),
        transparent);
    opacity: 0.9;
  }

  .fvl-home-divider-mark {
    width: 54px;
    height: 54px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 8%, transparent),
        rgba(255,255,255,0.04) 38%,
        color-mix(in srgb, var(--fv-mage) 8%, transparent)),
      rgba(10, 9, 20, 0.82);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 14%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 12%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 14%, transparent),
      0 0 16px color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-home-divider-mark img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    opacity: 0.94;
  }

  .fvl-section {
    display: grid;
    gap: 18px;
  }

  .fvl-command-shell {
    display: grid;
    grid-template-columns: minmax(240px, 0.34fr) minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }

  .fvl-command-rail {
    position: sticky;
    top: 92px;
    display: grid;
    gap: 12px;
  }

  .fvl-command-button {
    width: 100%;
    padding: 16px 18px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255,255,255,0.03) 36%,
        color-mix(in srgb, var(--fv-mage) 4%, transparent)),
      rgba(10, 9, 20, 0.78);
    color: inherit;
    text-align: left;
    cursor: pointer;
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 8%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-command-button.is-active {
    border-color: rgba(255,255,255,0.12);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 10%, transparent),
        rgba(255,255,255,0.04) 36%,
        color-mix(in srgb, var(--fv-mage) 10%, transparent)),
      rgba(10, 9, 20, 0.82);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 20%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 18%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 20%, transparent),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 8%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-archer) 8%, transparent),
      0 0 24px color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-command-button-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .fvl-command-button-head strong {
    display: block;
    font-family: "Sora", sans-serif;
    font-size: 14px;
    margin-bottom: 3px;
  }

  .fvl-command-button-head span,
  .fvl-command-button p {
    color: var(--fv-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .fvl-command-button p {
    margin: 10px 0 0;
  }

  .fvl-command-stage {
    min-height: 540px;
  }

  .fvl-command-stage-shell {
    position: relative;
    min-height: 540px;
    border-radius: 26px;
    padding: 18px;
    overflow: hidden;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255, 255, 255, 0.02) 38%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent)),
      rgba(8, 8, 18, 0.46);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 8%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 10%, transparent),
      0 22px 60px rgba(0, 0, 0, 0.22);
    transform-style: preserve-3d;
    will-change: transform;
  }

  .fvl-command-stage-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 24%, transparent 74%, rgba(255, 255, 255, 0.02)),
      radial-gradient(circle at 12% 14%, color-mix(in srgb, var(--fv-warrior) 12%, transparent), transparent 32%),
      radial-gradient(circle at 82% 16%, color-mix(in srgb, var(--fv-mage) 12%, transparent), transparent 30%),
      radial-gradient(circle at 52% 88%, color-mix(in srgb, var(--fv-archer) 10%, transparent), transparent 34%);
    opacity: 0.9;
    pointer-events: none;
  }

  .fvl-command-stage-shell > * {
    position: relative;
    z-index: 1;
  }

  .fvl-command-stage-shell .fvl-module-deck,
  .fvl-command-stage-shell .fvl-class-layout,
  .fvl-command-stage-shell .fvl-system-grid,
  .fvl-command-stage-shell .fvl-faq-layout {
    transform: translateZ(12px);
  }

  .fvl-command-stage-glow {
    position: absolute;
    inset: -16% -10% auto;
    height: 220px;
    background:
      radial-gradient(circle at center,
        color-mix(in srgb, var(--fv-mage) 13%, transparent),
        transparent 56%);
    opacity: 0.72;
    pointer-events: none;
    filter: blur(10px);
  }

  .fvl-section-shell {
    border-radius: 28px;
    padding: 22px;
  }

  .fvl-section-heading {
    display: grid;
    gap: 10px;
    margin-bottom: 8px;
  }

  .fvl-section-heading h2 {
    font-size: clamp(28px, 4vw, 48px);
  }

  .fvl-module-deck {
    display: grid;
    grid-template-columns: minmax(280px, 0.42fr) minmax(0, 1fr);
    gap: 18px;
    align-items: stretch;
  }

  .fvl-module-tabs {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .fvl-module-tab {
    width: 100%;
    padding: 16px 18px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255, 255, 255, 0.03) 36%,
        color-mix(in srgb, var(--fv-mage) 4%, transparent)),
      rgba(10, 9, 20, 0.7);
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .fvl-module-tab.is-active {
    border-color: color-mix(in srgb, var(--fv-accent) 28%, transparent);
    box-shadow:
      inset 0 0 28px color-mix(in srgb, var(--fv-accent) 10%, transparent),
      0 14px 30px rgba(0, 0, 0, 0.18);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--fv-accent) 10%, transparent), rgba(255, 255, 255, 0.02)),
      rgba(10, 9, 20, 0.78);
  }

  .fvl-module-tab:hover,
  .fvl-system-point:hover,
  .fvl-side-pill:hover,
  .fvl-deck-stage-panel:hover,
  .fvl-faq-card:hover,
  .fvl-route-note:hover,
  .fvl-surface-card:hover {
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 18%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 16%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 18%, transparent),
      0 0 10px color-mix(in srgb, var(--fv-warrior) 8%, transparent),
      0 0 16px color-mix(in srgb, var(--fv-archer) 8%, transparent),
      0 0 22px color-mix(in srgb, var(--fv-mage) 10%, transparent);
  }

  .fvl-module-tab-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .fvl-module-tab-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .fvl-module-tab-title img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .fvl-module-tab-title strong,
  .fvl-deck-stage-copy h3,
  .fvl-deck-stage-panel strong {
    font-family: "Sora", sans-serif;
  }

  .fvl-module-tab-title strong {
    display: block;
    font-size: 13px;
    line-height: 1.2;
  }

  .fvl-module-tab-title span,
  .fvl-module-tab p {
    color: var(--fv-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .fvl-module-tab p {
    margin: 10px 0 0;
  }

  .fvl-deck-stage {
    position: relative;
    overflow: hidden;
    min-height: 420px;
    border-radius: 26px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(90deg, rgba(9, 8, 18, 0.92), rgba(9, 8, 18, 0.64) 54%, rgba(9, 8, 18, 0.48)),
      var(--band-image) center / cover no-repeat;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.74fr);
    gap: 20px;
    padding: 24px;
  }

  .fvl-deck-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--fv-accent) 18%, transparent), transparent 26%);
    pointer-events: none;
  }

  .fvl-deck-stage-copy,
  .fvl-deck-stage-side {
    position: relative;
    z-index: 1;
  }

  .fvl-deck-stage-copy {
    display: grid;
    align-content: start;
    gap: 12px;
    max-width: 740px;
  }

  .fvl-deck-stage-copy h3 {
    margin: 0;
    font-size: clamp(26px, 2.7vw, 38px);
    line-height: 1.03;
  }

  .fvl-deck-stage-side {
    display: grid;
    gap: 10px;
    align-content: end;
  }

  .fvl-deck-points {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .fvl-deck-rail {
    display: grid;
    gap: 10px;
  }

  .fvl-deck-stage-panel {
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(9, 8, 18, 0.66);
  }

  .fvl-deck-stage-panel strong {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .fvl-deck-stage-panel span {
    color: var(--fv-muted);
    font-size: 13px;
    line-height: 1.45;
  }

  .fvl-side-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 10px 12px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(9, 8, 18, 0.64) 42%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent));
  }

  .fvl-side-pill strong {
    font-family: "Sora", sans-serif;
    font-size: 12px;
  }

  .fvl-side-pill span {
    color: var(--fv-muted);
    font-size: 12px;
  }

  .fvl-class-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(340px, 0.98fr);
    gap: 18px;
    align-items: stretch;
  }

  .fvl-class-scene {
    position: relative;
    overflow: hidden;
    min-height: 520px;
    border-radius: 28px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(180deg, rgba(9, 8, 18, 0.18), rgba(9, 8, 18, 0.86)),
      var(--class-image) center / cover no-repeat;
  }

  .fvl-class-scene::after {
    content: "";
    position: absolute;
    inset: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 22px;
    pointer-events: none;
  }

  .fvl-scene-panel {
    position: absolute;
    left: 22px;
    right: 22px;
    bottom: 22px;
    display: grid;
    gap: 14px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(180deg, rgba(15, 13, 28, 0.9), rgba(10, 9, 20, 0.94)),
      url("/ui/panel-texture.png");
    backdrop-filter: blur(14px);
  }

  .fvl-scene-panel-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .fvl-scene-panel-head img {
    width: 54px;
    height: 54px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px color-mix(in srgb, var(--fv-accent) 24%, transparent));
  }

  .fvl-scene-panel-head h3 {
    font-size: clamp(22px, 2.4vw, 30px);
  }

  .fvl-scene-panel-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .fvl-panel-copy {
    display: grid;
    gap: 6px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.035);
  }

  .fvl-class-panel {
    display: grid;
    gap: 14px;
    align-content: start;
  }

  .fvl-class-panel h3 {
    font-size: clamp(24px, 2.6vw, 32px);
  }

  .fvl-progress-list {
    display: grid;
    gap: 12px;
  }

  .fvl-progress-row {
    display: grid;
    gap: 7px;
  }

  .fvl-progress-meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: var(--fv-muted);
    font-size: 13px;
  }

  .fvl-progress-bar {
    position: relative;
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.06);
  }

  .fvl-progress-bar span {
    position: absolute;
    inset: 0 auto 0 0;
    width: var(--bar-width);
    border-radius: inherit;
    background: linear-gradient(90deg, var(--fv-accent), color-mix(in srgb, var(--fv-secondary) 82%, white 6%));
    box-shadow: 0 0 18px color-mix(in srgb, var(--fv-accent) 24%, transparent);
  }

  .fvl-perks {
    display: grid;
    gap: 10px;
  }

  .fvl-perk {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    color: var(--fv-muted);
    font-size: 14px;
    line-height: 1.45;
  }

  .fvl-perk svg {
    color: var(--fv-accent);
    margin-top: 2px;
  }

  .fvl-system-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(340px, 0.96fr);
    gap: 18px;
  }

  .fvl-system-band {
    border-radius: 26px;
    padding: 20px;
  }

  .fvl-system-band.is-wide {
    overflow: hidden;
    background:
      linear-gradient(90deg, rgba(9, 8, 18, 0.92), rgba(9, 8, 18, 0.72) 52%, rgba(9, 8, 18, 0.52)),
      url("/ui/scene-bg.png") center / cover no-repeat;
  }

  .fvl-system-copy {
    display: grid;
    gap: 14px;
    max-width: 640px;
  }

  .fvl-system-copy h3 {
    font-size: clamp(26px, 2.8vw, 36px);
  }

  .fvl-system-points {
    display: grid;
    gap: 12px;
  }

  .fvl-system-point {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.04);
  }

  .fvl-system-point img,
  .fvl-system-point .fvl-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(10, 9, 20, 0.84);
    display: grid;
    place-items: center;
    object-fit: contain;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .fvl-system-point .fvl-icon-wrap svg {
    color: var(--fv-accent);
  }

  .fvl-system-side {
    display: grid;
    gap: 14px;
  }

  .fvl-side-grid {
    display: grid;
    gap: 12px;
  }

  .fvl-faq-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
    gap: 18px;
  }

  .fvl-faq-list {
    display: grid;
    gap: 10px;
  }

  .fvl-faq-card {
    border-radius: 22px;
    overflow: hidden;
  }

  .fvl-faq-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 18px 20px;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .fvl-faq-trigger strong {
    font-size: 14px;
  }

  .fvl-faq-trigger svg {
    color: var(--fv-accent);
    flex-shrink: 0;
  }

  .fvl-faq-body {
    padding: 0 20px 18px;
  }

  .fvl-final-band {
    position: relative;
    overflow: hidden;
    border-radius: 30px;
    padding: 24px;
    background:
      linear-gradient(90deg, rgba(10, 9, 20, 0.94), rgba(10, 9, 20, 0.74) 56%, rgba(10, 9, 20, 0.56)),
      url("/missions/missions-hero-default.png") center / cover no-repeat;
  }

  .fvl-final-band::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at right center, color-mix(in srgb, var(--fv-accent) 18%, transparent), transparent 26%);
    pointer-events: none;
  }

  .fvl-final-layout {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
    gap: 16px;
    align-items: end;
  }

  .fvl-final-copy {
    display: grid;
    gap: 10px;
    max-width: 720px;
  }

  .fvl-final-copy h2 {
    font-size: clamp(30px, 4.4vw, 56px);
    line-height: 0.96;
    margin: 0;
  }

  .fvl-final-actions {
    display: grid;
    gap: 10px;
    align-content: end;
  }

  .fvl-final-mark {
    position: absolute;
    right: 22px;
    top: 22px;
    width: 168px;
    height: 168px;
    border-radius: 28px;
    display: grid;
    place-items: center;
    background:
      radial-gradient(circle at center, rgba(255,255,255,0.06), transparent 68%),
      rgba(10, 9, 20, 0.26);
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 14%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 12%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 14%, transparent),
      0 0 22px color-mix(in srgb, var(--fv-mage) 10%, transparent);
    pointer-events: none;
  }

  .fvl-final-mark img {
    width: 112px;
    height: 112px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--fv-accent) 24%, transparent));
  }

  .fvl-final-support {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(10, 9, 20, 0.74);
  }

  .fvl-final-support img {
    width: 88px;
    height: 88px;
    border-radius: 16px;
    object-fit: cover;
    background: #fff;
  }

  .fvl-social-fab {
    position: fixed;
    right: max(18px, calc(env(safe-area-inset-right) + 12px));
    bottom: max(18px, calc(env(safe-area-inset-bottom) + 12px));
    z-index: 80;
    display: grid;
    justify-items: end;
    gap: 12px;
  }

  .fvl-social-panel {
    width: min(332px, calc(100vw - 24px));
    padding: 16px;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 5%, transparent),
        rgba(255, 255, 255, 0.04) 38%,
        color-mix(in srgb, var(--fv-mage) 5%, transparent)),
      rgba(8, 8, 18, 0.86);
    backdrop-filter: blur(18px);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 12%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 10%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 12%, transparent),
      0 18px 44px rgba(0, 0, 0, 0.34),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 7%, transparent),
      0 0 20px color-mix(in srgb, var(--fv-mage) 9%, transparent);
  }

  .fvl-social-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .fvl-social-panel-head strong,
  .fvl-social-link-copy strong {
    display: block;
    font-family: "Sora", sans-serif;
  }

  .fvl-social-panel-head strong {
    font-size: 15px;
    margin-bottom: 4px;
  }

  .fvl-social-panel-head p,
  .fvl-social-link-copy span {
    margin: 0;
    color: var(--fv-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .fvl-social-panel-close,
  .fvl-social-toggle {
    appearance: none;
    border: none;
    cursor: pointer;
    color: inherit;
  }

  .fvl-social-panel-close {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .fvl-social-links {
    display: grid;
    gap: 10px;
  }

  .fvl-social-link {
    position: relative;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 16px;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
    padding: 12px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 4%, transparent),
        rgba(255, 255, 255, 0.03) 38%,
        color-mix(in srgb, var(--fv-mage) 4%, transparent)),
      rgba(12, 10, 24, 0.72);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .fvl-social-link::after {
    content: attr(data-role);
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: calc(100% + 8px);
    padding: 8px 10px;
    border-radius: 12px;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 8%, transparent),
        rgba(255,255,255,0.05) 38%,
        color-mix(in srgb, var(--fv-mage) 8%, transparent)),
      rgba(8, 8, 18, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: var(--fv-text);
    font-family: "Sora", sans-serif;
    font-size: 11px;
    letter-spacing: 0.04em;
    opacity: 0;
    transform: translateY(4px);
    pointer-events: none;
    transition: opacity 0.18s ease, transform 0.18s ease;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.24);
  }

  .fvl-social-link:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 15%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 13%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 15%, transparent),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 7%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-mage) 9%, transparent);
  }

  .fvl-social-link:hover::after {
    opacity: 1;
    transform: translateY(0);
  }

  .fvl-social-link-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 8%, transparent),
        rgba(255,255,255,0.05) 38%,
        color-mix(in srgb, var(--fv-mage) 8%, transparent)),
      rgba(255,255,255,0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .fvl-social-link-icon svg,
  .fvl-social-link-arrow {
    color: #dbe4ff;
  }

  .fvl-social-link-copy strong {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .fvl-social-toggle {
    position: relative;
    min-width: 64px;
    min-height: 64px;
    padding: 0 18px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    background:
      linear-gradient(135deg,
        color-mix(in srgb, var(--fv-warrior) 14%, transparent),
        rgba(255, 255, 255, 0.08) 38%,
        color-mix(in srgb, var(--fv-mage) 16%, transparent)),
      rgba(9, 8, 18, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 1px 0 0 color-mix(in srgb, var(--fv-warrior) 18%, transparent),
      inset 0 -1px 0 color-mix(in srgb, var(--fv-archer) 16%, transparent),
      inset -1px 0 0 color-mix(in srgb, var(--fv-mage) 18%, transparent),
      0 14px 28px rgba(0, 0, 0, 0.34),
      0 0 12px color-mix(in srgb, var(--fv-warrior) 10%, transparent),
      0 0 20px color-mix(in srgb, var(--fv-mage) 12%, transparent);
  }

  .fvl-social-toggle.is-idle::before {
    content: "";
    position: absolute;
    inset: -6px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background:
      radial-gradient(circle at center,
        color-mix(in srgb, var(--fv-warrior) 10%, transparent),
        transparent 56%);
    opacity: 0.72;
    animation: fvl-social-pulse 2.4s ease-out infinite;
    pointer-events: none;
  }

  .fvl-social-toggle.is-idle::after {
    content: "";
    position: absolute;
    top: 10px;
    right: 10px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--fv-archer), var(--fv-mage));
    box-shadow:
      0 0 0 3px rgba(7, 6, 17, 0.84),
      0 0 10px color-mix(in srgb, var(--fv-archer) 36%, transparent),
      0 0 18px color-mix(in srgb, var(--fv-mage) 28%, transparent);
    pointer-events: none;
  }

  .fvl-social-toggle strong {
    font-family: "Sora", sans-serif;
    font-size: 13px;
  }

  .fvl-social-toggle-copy {
    display: grid;
    text-align: left;
    gap: 2px;
  }

  .fvl-social-toggle-copy span {
    color: var(--fv-muted);
    font-size: 11px;
    line-height: 1.2;
  }

  @keyframes fvl-social-pulse {
    0% {
      transform: scale(0.96);
      opacity: 0.18;
    }
    45% {
      opacity: 0.52;
    }
    100% {
      transform: scale(1.08);
      opacity: 0;
    }
  }

  @keyframes fvl-home-drift {
    0% {
      transform: translate3d(0, 0, 0) scale(1);
    }
    100% {
      transform: translate3d(16px, -10px, 0) scale(1.08);
    }
  }

  @keyframes fvl-home-shimmer {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 0.16;
    }
    50% {
      transform: translate3d(-8px, 6px, 0);
      opacity: 0.28;
    }
    100% {
      transform: translate3d(0, 0, 0);
      opacity: 0.16;
    }
  }

  .fvl-footer {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    flex-wrap: wrap;
    padding: 6px 4px 0;
  }

  .fvl-footer strong {
    font-size: 14px;
  }

  .fvl-footer p {
    font-size: 13px;
  }

  @media (max-width: 1180px) {
    .fvl-hero-shell,
    .fvl-class-layout,
    .fvl-system-grid,
    .fvl-faq-layout,
    .fvl-final-layout,
    .fvl-command-shell {
      grid-template-columns: 1fr;
    }

    .fvl-hero-shell {
      min-height: auto;
    }

    .fvl-hero-copy {
      padding-right: 0;
    }
  }

  @media (max-width: 920px) {
    .fvl-nav {
      width: calc(100% - 16px);
      padding: 12px 14px;
      border-radius: 0 0 18px 18px;
    }

    .fvl-nav-links {
      display: none;
    }

    .fvl-main {
      width: calc(100% - 18px);
      gap: 18px;
      padding-bottom: 40px;
    }

    .fvl-hero-shell,
    .fvl-section-shell,
    .fvl-final-band {
      padding: 18px;
      border-radius: 24px;
    }

    .fvl-hero-shell {
      gap: 18px;
      min-height: auto;
    }

    .fvl-hero-copy h1 {
      font-size: clamp(40px, 14vw, 72px);
    }

    .fvl-hero-stats,
    .fvl-stat-strip,
    .fvl-scene-panel-grid,
    .fvl-hero-context-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .fvl-module-deck,
    .fvl-deck-stage {
      grid-template-columns: 1fr;
    }

    .fvl-command-rail {
      position: static;
    }

    .fvl-hero-flow {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .fvl-nav-actions {
      width: 100%;
      justify-content: stretch;
    }

    .fvl-nav-ghost,
    .fvl-nav-cta,
    .fvl-hero-ghost,
    .fvl-hero-cta,
    .fvl-final-actions button {
      width: 100%;
      justify-content: center;
    }

    .fvl-nav {
      flex-wrap: wrap;
    }

    .fvl-hero-shell,
    .fvl-section-shell,
    .fvl-deck-stage,
    .fvl-system-band,
    .fvl-faq-card,
    .fvl-final-band {
      border-radius: 20px;
    }

    .fvl-avatar-stage {
      min-height: 300px;
    }

    .fvl-sprite {
      width: 180px;
      height: 180px;
    }

    .fvl-hero-stats,
    .fvl-stat-strip,
    .fvl-scene-panel-grid,
    .fvl-hero-context-strip {
      grid-template-columns: 1fr;
    }

    .fvl-hero-flow {
      grid-template-columns: 1fr;
    }

    .fvl-final-support,
    .fvl-route-note,
    .fvl-system-point {
      grid-template-columns: 1fr;
    }

    .fvl-social-fab {
      right: 12px;
      left: 12px;
      bottom: 12px;
      justify-items: stretch;
    }

    .fvl-social-panel,
    .fvl-social-toggle {
      width: 100%;
    }

    .fvl-social-toggle {
      justify-content: center;
    }

    .fvl-final-mark {
      display: none;
    }

    .fvl-final-support img,
    .fvl-route-note img {
      width: 72px;
      height: 72px;
    }
  }
`;

function scrollToId(id) {
  if (typeof document === "undefined") return;
  const node = document.getElementById(id);
  if (!node) return;
  const top = node.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: "smooth" });
}

const FLOW_STAGE_MOTION = {
  initial: { opacity: 0, y: 26, scale: 0.985, filter: "blur(12px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -18, scale: 0.992, filter: "blur(8px)" },
  transition: {
    duration: 0.34,
    ease: [0.22, 1, 0.36, 1],
  },
};

function PixelSprite({ frames, size = 220, fps = 8 }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    frames.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [frames]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, 1000 / fps);
    return () => window.clearInterval(timer);
  }, [fps, frames]);

  return (
    <div
      className="fvl-sprite"
      style={{
        width: size,
        height: size,
        backgroundImage: `url("${frames[frame]}")`,
      }}
      aria-hidden="true"
    />
  );
}

function SectionHeading({ icon, eyebrow, title, copy }) {
  return (
    <div className="fvl-section-heading">
      <div className="fvl-kicker">
        <img src={icon} alt="" />
        <span>{eyebrow}</span>
      </div>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function HomeStat({ label, value, sublabel }) {
  const prefersReducedMotion = useReducedMotion();
  const numericValue = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);
  const suffix = String(value).replace(String(Number.isNaN(numericValue) ? "" : numericValue), "");
  const [displayValue, setDisplayValue] = useState(
    Number.isNaN(numericValue) || prefersReducedMotion ? String(value) : `0${suffix}`,
  );

  useEffect(() => {
    if (Number.isNaN(numericValue) || prefersReducedMotion) {
      setDisplayValue(String(value));
      return undefined;
    }

    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(numericValue * eased);
      setDisplayValue(`${next}${suffix}`);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [numericValue, prefersReducedMotion, suffix, value]);

  return (
    <div className="fvl-surface-card">
      <small>{label}</small>
      <strong>{displayValue}</strong>
      <p>{sublabel}</p>
    </div>
  );
}

export default function Home({ onLogin, onRegister }) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [heroPreviewIndex, setHeroPreviewIndex] = useState(-1);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);
  const [flowTab, setFlowTab] = useState(getStoredFlowTab);
  const [faqOpen, setFaqOpen] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [publicStats, setPublicStats] = useState(null);
  const [user, setUser] = useState(null);
  const socialRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const heroRotateX = useSpring(0, { stiffness: 80, damping: 18, mass: 0.5 });
  const heroRotateY = useSpring(0, { stiffness: 80, damping: 18, mass: 0.5 });
  const heroShiftX = useSpring(0, { stiffness: 70, damping: 18, mass: 0.5 });
  const heroShiftY = useSpring(0, { stiffness: 70, damping: 18, mass: 0.5 });
  const stageRotateX = useSpring(0, { stiffness: 90, damping: 18, mass: 0.45 });
  const stageRotateY = useSpring(0, { stiffness: 90, damping: 18, mass: 0.45 });
  const stageShiftX = useSpring(0, { stiffness: 80, damping: 18, mass: 0.45 });
  const stageShiftY = useSpring(0, { stiffness: 80, damping: 18, mass: 0.45 });

  const selected = HOME_CLASSES[selectedIndex] || HOME_CLASSES[0];
  const heroPreview = heroPreviewIndex >= 0 ? (HOME_CLASSES[heroPreviewIndex] || HOME_CLASSES[0]) : HOME_NEUTRAL_PREVIEW;
  const selectedFeature = FEATURE_BANDS[selectedFeatureIndex] || FEATURE_BANDS[0];
  const rawStatsPayload = publicStats?.stats || publicStats || {};
  const isReturningUser = Boolean(user);
  const currentHour = new Date().getHours();
  const statsPayload = useMemo(() => {
    const totalUsers = getDisplayStat(rawStatsPayload.totalUsers, HOME_FALLBACK_STATS.totalUsers);
    const totalExercises = getDisplayStat(rawStatsPayload.totalExercises, HOME_FALLBACK_STATS.totalExercises);
    const totalAchievements = getDisplayStat(rawStatsPayload.totalAchievements, HOME_FALLBACK_STATS.totalAchievements);
    const classCounts = {
      GUERRERO: getDisplayStat(rawStatsPayload.classCounts?.GUERRERO, HOME_FALLBACK_STATS.classCounts.GUERRERO),
      ARQUERO: getDisplayStat(rawStatsPayload.classCounts?.ARQUERO, HOME_FALLBACK_STATS.classCounts.ARQUERO),
      MAGO: getDisplayStat(rawStatsPayload.classCounts?.MAGO, HOME_FALLBACK_STATS.classCounts.MAGO),
    };

    return {
      ...rawStatsPayload,
      totalUsers,
      totalExercises,
      totalAchievements,
      classCounts,
    };
  }, [rawStatsPayload]);

  const hasLiveStats = useMemo(() => {
    const classTotal =
      (rawStatsPayload.classCounts?.GUERRERO ?? 0) +
      (rawStatsPayload.classCounts?.ARQUERO ?? 0) +
      (rawStatsPayload.classCounts?.MAGO ?? 0);

    return (
      (rawStatsPayload.totalUsers ?? 0) > 0 ||
      (rawStatsPayload.totalExercises ?? 0) > 0 ||
      (rawStatsPayload.totalAchievements ?? 0) > 0 ||
      classTotal > 0
    );
  }, [rawStatsPayload]);

  const dayGuidance = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return {
        eyebrow: "Ritmo de la manana",
        title: "Hora de activar el cuerpo",
        copy: "Buen momento para abrir una ruta ligera, despertar el pulso y dejar lista la energia del dia.",
      };
    }

    if (currentHour >= 12 && currentHour < 19) {
      return {
        eyebrow: "Ritmo de la tarde",
        title: "Ventana de rendimiento",
        copy: "Ideal para buscar intensidad, sumar trabajo fisico real y aprovechar tu mejor tramo del dia.",
      };
    }

    return {
      eyebrow: "Ritmo de la noche",
      title: "Cierre con foco y recuperacion",
      copy: "Buena hora para movilidad, respiracion y una sesion que deje progreso sin cargar de mas el cuerpo.",
    };
  }, [currentHour]);

  const socialPrompt = useMemo(() => {
    if (!isReturningUser) return "Dudas para empezar";
    if (heroPreviewIndex >= 0) return `Ayuda con ${heroPreview.name.toLowerCase()}`;
    return "Retoma tu ruta";
  }, [heroPreview.name, heroPreviewIndex, isReturningUser]);

  const heroPrimaryAction = isReturningUser
    ? { label: "Volver a mi ruta", onClick: onLogin }
    : { label: "Forjar heroe", onClick: onRegister };

  const heroDiscoveryCard = isReturningUser
    ? {
        eyebrow: "Tu regreso",
        title: "Tu avance sigue vivo",
        copy: "Entra para retomar tus frentes, revisar tus recompensas y volver a sumar XP desde donde lo dejaste.",
      }
    : {
        eyebrow: "Para quien es",
        title: "Si quieres entrenar con un motivo claro",
        copy: "Sirve para crear habito, bajar grasa, sostener ritmo o gamificar tu progreso sin perder de vista lo fisico.",
      };

  const heroContextCopy = isReturningUser
    ? "Tu avance sigue vivo: vuelve a tus frentes, revisa tus recompensas y retoma el pulso sin empezar desde cero."
    : "Descubre un mundo donde el ejercicio se convierte en avance visible: clases con identidad, caminos claros, botin y una base que recuerda cada paso de tu heroe.";

  useEffect(() => {
    let mounted = true;

    getPublicStats()
      .then((result) => {
        if (mounted) setPublicStats(result);
      })
      .catch(() => {
        if (mounted) setPublicStats(null);
      });

    const unsubscribe = onAuthStateChanged(auth, (value) => setUser(value));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!socialOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!socialRef.current?.contains(event.target)) {
        setSocialOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSocialOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [socialOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HOME_FLOW_STORAGE_KEY, flowTab);
    } catch {
      // Ignore storage failures on restricted environments.
    }
  }, [flowTab]);

  const heroStats = useMemo(() => {
    const users = statsPayload.totalUsers ?? 0;
    const exercises = statsPayload.totalExercises ?? 0;
    const achievements = statsPayload.totalAchievements ?? 0;
    const selectedClassCount = statsPayload.classCounts?.[selected.key] ?? 0;

    return [
      {
        label: "Heroes en marcha",
        value: `${users}+`,
        sublabel: "Aventureros que ya convirtieron su entrenamiento en avance constante.",
      },
      {
        label: "Retos del mapa",
        value: `${exercises}`,
        sublabel: "Ejercicios listos para abrir caminos, pulir tecnica y mantener el ritmo.",
      },
      {
        label: "Sellos conseguidos",
        value: `${achievements}`,
        sublabel: "Logros y marcas que convierten cada sesion en avance visible.",
      },
      {
        label: `${selected.name} en la forja`,
        value: `${selectedClassCount}`,
        sublabel: "Heroes que eligieron esa senda para entrenar y crecer con ese estilo.",
      },
    ];
  }, [selected.key, selected.name, statsPayload]);

  const classDistribution = useMemo(() => {
    const totalUsers = Math.max(1, statsPayload.totalUsers ?? 0);
    return HOME_CLASSES.map((item) => {
      const count = statsPayload.classCounts?.[item.key] ?? 0;
      const width = `${Math.max(10, Math.round((count / totalUsers) * 100))}%`;
      return { ...item, count, width };
    });
  }, [statsPayload]);

  const handleHomeNav = (item) => {
    if (item.section === "centro") {
      setFlowTab(item.id);
      scrollToId(item.section);
      return;
    }
    scrollToId(item.id);
  };

  const handleCommandStageMove = (event) => {
    if (prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    stageRotateX.set((0.5 - py) * 5.5);
    stageRotateY.set((px - 0.5) * 7.5);
    stageShiftX.set((px - 0.5) * 8);
    stageShiftY.set((py - 0.5) * 6);
  };

  const resetCommandStage = () => {
    stageRotateX.set(0);
    stageRotateY.set(0);
    stageShiftX.set(0);
    stageShiftY.set(0);
  };

  const handleHeroMove = (event) => {
    if (prefersReducedMotion) return;
    setHeroHovered(true);
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    heroRotateX.set((0.5 - py) * 2.8);
    heroRotateY.set((px - 0.5) * 4.2);
    heroShiftX.set((px - 0.5) * 5);
    heroShiftY.set((py - 0.5) * 4);
  };

  const resetHeroMove = () => {
    setHeroHovered(false);
    heroRotateX.set(0);
    heroRotateY.set(0);
    heroShiftX.set(0);
    heroShiftY.set(0);
  };

  return (
    <div className="fvl-home">
      <style>{PAGE_CSS}</style>

      <div className="fvl-backdrop" aria-hidden="true">
        <div className="fvl-backdrop-grid" />
      </div>

      <header className="fvl-nav">
        <button className="fvl-brand" onClick={() => scrollToId("inicio")} aria-label="Ir al inicio">
          <img src="/logo.png" alt="ForgeVenture" />
          <span className="fvl-brand-copy">
            <strong>ForgeVenture</strong>
            <span>RPG fitness del gremio</span>
          </span>
        </button>

        <nav className="fvl-nav-links" aria-label="Navegacion principal">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => handleHomeNav(item)}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="fvl-nav-actions">
          <button className="fvl-nav-ghost" onClick={onLogin} aria-label={user ? "Volver al panel" : "Entrar"}>
            {user ? "Volver al gremio" : "Entrar al gremio"}
          </button>
          <button
            className="fvl-nav-cta"
            onClick={isReturningUser ? onLogin : onRegister}
            aria-label={isReturningUser ? "Retomar mi ruta" : "Crear cuenta y comenzar"}
          >
            {isReturningUser ? "Retomar ruta" : "Forjar cuenta"}
          </button>
        </div>
      </header>

      <main className="fvl-main">
        <section id="inicio" className={`fvl-hero${heroHovered ? " is-linked" : ""}`}>
          <motion.div
            className="fvl-hero-shell"
            onMouseEnter={() => setHeroHovered(true)}
            onMouseMove={handleHeroMove}
            onMouseLeave={resetHeroMove}
            style={{
              "--hero-image": `url("${heroPreview.hero}")`,
              ...(prefersReducedMotion ? {} : {
                rotateX: heroRotateX,
                rotateY: heroRotateY,
                x: heroShiftX,
                y: heroShiftY,
                transformPerspective: 1600,
              }),
            }}
          >
            <div className="fvl-hero-shell-glow" aria-hidden="true" />
            <div className="fvl-hero-shell-ambient" aria-hidden="true">
              <div className="fvl-hero-shell-particles" />
            </div>
            <div className="fvl-hero-copy">
              <div className="fvl-kicker">
                <img src="/ui/header/section-home.png" alt="" />
                <span>Puerta del gremio</span>
              </div>

              <h1>
                ForgeVenture
                <small>Entrena, sube de nivel y haz que el fitness se vea como una aventura real.</small>
              </h1>

              <p>{heroContextCopy}</p>

              <div className="fvl-chip-row">
                <span className="fvl-badge">
                  <Swords size={15} />
                  <strong>Aventura fisica</strong>
                </span>
                <span className="fvl-badge">
                  <HeartPulse size={15} />
                  <strong>Progreso real</strong>
                </span>
                <span className="fvl-badge">
                  <Sparkles size={15} />
                  <strong>Clases vivas</strong>
                </span>
              </div>

              <div className="fvl-hero-context-strip">
                <div className="fvl-hero-context-card">
                  <small>{heroDiscoveryCard.eyebrow}</small>
                  <strong>{heroDiscoveryCard.title}</strong>
                  <p>{heroDiscoveryCard.copy}</p>
                </div>
                <div className="fvl-hero-context-card">
                  <small>{dayGuidance.eyebrow}</small>
                  <strong>{dayGuidance.title}</strong>
                  <p>{dayGuidance.copy}</p>
                </div>
              </div>

              <div className="fvl-hero-actions">
                <button className="fvl-hero-cta" onClick={heroPrimaryAction.onClick}>
                  {heroPrimaryAction.label} <ArrowRight size={16} />
                </button>
                <button className="fvl-hero-ghost" onClick={() => { setFlowTab("mundo"); scrollToId("centro"); }}>
                  Explorar el mapa <ChevronDown size={16} />
                </button>
              </div>

              <div className="fvl-class-switch" aria-label="Seleccionar clase destacada">
                {HOME_CLASSES.map((item, index) => {
                  const isActive = heroPreviewIndex === index;
                  return (
                    <button
                      key={item.key}
                      className={isActive ? "is-active" : ""}
                      onClick={() => setHeroPreviewIndex((current) => current === index ? -1 : index)}
                      aria-pressed={isActive}
                    >
                      <img src={item.crest} alt="" />
                      <span>
                        <strong>{item.name}</strong>
                        <span>{item.short}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="fvl-hero-flow" aria-label="Ruta rapida por capitulos del home">
                {[
                  { id: "mundo", label: "Mundo", copy: "Mira por donde empieza la aventura." },
                  { id: "clases", label: "Clases", copy: "Descubre tu forma de entrenar." },
                  { id: "sistema", label: "Sistema", copy: "Entiende como ganas XP y botin." },
                  { id: "faq", label: "FAQ", copy: "Aclara dudas antes de entrar." },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={flowTab === item.id ? "is-active" : ""}
                    onClick={() => {
                      setFlowTab(item.id);
                      scrollToId("centro");
                    }}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.copy}</span>
                    {flowTab === item.id && (
                      <motion.span
                        layoutId="hero-flow-trace"
                        className="fvl-hero-flow-trace"
                        transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.55 }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="fvl-hero-side">
              <div className="fvl-aside-card">
                <div className="fvl-avatar-stage" style={{ "--floor-image": heroPreview.floor ? `url("${heroPreview.floor}")` : "none" }}>
                  <img className="fvl-scene-mark" src={heroPreview.sceneMark} alt="" />
                  <img className="fvl-hero-crest" src={heroPreview.crest} alt="" />
                  <div className="fvl-avatar-floor" />
                  <PixelSprite frames={HERO_IDLE_FRAMES} />
                </div>

                <div className="fvl-avatar-copy">
                  <div className="fvl-kicker">
                    <img src={heroPreview.crest} alt="" />
                    <span>{heroPreview.route}</span>
                  </div>
                  <h2>{heroPreview.title}</h2>
                  <p>{heroPreview.subtitle}</p>

                  <div className="fvl-route-note">
                    <img src={heroPreview.zoneBanner} alt="" />
                    <div>
                      <strong>{heroPreview.route}</strong>
                      <span>{heroPreview.routeCopy}</span>
                    </div>
                  </div>
                </div>
              </div>

                <div className="fvl-stat-strip">
                  <div className="fvl-surface-card">
                  <small>{heroPreviewIndex >= 0 ? "Clase del momento" : "Inicio abierto"}</small>
                  <strong>{heroPreviewIndex >= 0 ? heroPreview.name : "Tres clases"}</strong>
                  <p>{heroPreviewIndex >= 0 ? heroPreview.classCopy : "Empieza explorando el gremio completo antes de elegir el camino que mas se parezca a tu forma de entrenar."}</p>
                  </div>
                  <div className="fvl-surface-card">
                    <small>{hasLiveStats ? "Gremio activo" : "Gremio en expansion"}</small>
                  <strong>{statsPayload.totalUsers ?? 0}+</strong>
                  <p>{hasLiveStats ? "Heroes ya visibles avanzando con rutas, rachas y progreso compartido." : "Vista base del mapa mientras llegan cifras reales del gremio."}</p>
                </div>
                <div className="fvl-surface-card">
                  <small>{dayGuidance.eyebrow}</small>
                  <strong>{dayGuidance.title}</strong>
                  <p>{dayGuidance.copy}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="fvl-hero-stats">
            {heroStats.map((item) => (
              <HomeStat key={item.label} label={item.label} value={item.value} sublabel={item.sublabel} />
            ))}
          </div>
          {!hasLiveStats && (
            <div className="fvl-hero-stats-note">
              <Sparkles size={14} />
              <span>Gremio en expansion: mostrando una vista base mientras llegan cifras en vivo.</span>
            </div>
          )}
        </section>

        <div className="fvl-home-divider" aria-hidden="true">
          <div />
          <div className="fvl-home-divider-mark">
            <img src="/ui/header/section-home.png" alt="" />
          </div>
          <div />
        </div>

        <section id="centro" className="fvl-section">
          <div className="fvl-section-shell">
            <SectionHeading
              icon="/ui/header/section-misiones.png"
              eyebrow="Mesa del gremio"
              title="Todo lo importante del gremio vive aqui para que elijas tu camino sin perder el hilo."
              copy="Explora el mundo, compara clases, entiende como progresa tu heroe y resuelve dudas dentro de una misma sala de mando."
            />

            <div className="fvl-command-shell">
              <aside className="fvl-command-rail">
                {[
                  { id: "mundo", label: "Mundo", copy: "Recorre las zonas clave del universo ForgeVenture." },
                  { id: "clases", label: "Clases", copy: "Mira como cambia el viaje segun tu estilo de entrenamiento." },
                  { id: "sistema", label: "Sistema", copy: "Descubre como se guardan sesiones, rachas y recompensas." },
                  { id: "faq", label: "FAQ", copy: "Aclara lo esencial antes de abrir tu campana." },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`fvl-command-button${flowTab === item.id ? " is-active" : ""}`}
                    onClick={() => setFlowTab(item.id)}
                  >
                    <div className="fvl-command-button-head">
                      <span>
                        <strong>{item.label}</strong>
                        <span>Parada del mapa</span>
                      </span>
                      <ChevronRight size={16} />
                    </div>
                    <p>{item.copy}</p>
                  </button>
                ))}
              </aside>

              <div className="fvl-command-stage">
                <motion.div
                  className="fvl-command-stage-shell"
                  onMouseMove={handleCommandStageMove}
                  onMouseLeave={resetCommandStage}
                  style={prefersReducedMotion ? undefined : {
                    rotateX: stageRotateX,
                    rotateY: stageRotateY,
                    x: stageShiftX,
                    y: stageShiftY,
                    transformPerspective: 1400,
                  }}
                >
                  <div className="fvl-command-stage-glow" aria-hidden="true" />
                  <AnimatePresence mode="wait">
                  {flowTab === "mundo" && (
                    <motion.div
                      key="flow-mundo"
                      {...FLOW_STAGE_MOTION}
                    >
                      <div className="fvl-module-deck">
                        <div className="fvl-module-tabs">
                          {FEATURE_BANDS.map((item, index) => {
                            const isActive = selectedFeature.id === item.id;
                            return (
                              <button
                                key={item.id}
                                className={`fvl-module-tab${isActive ? " is-active" : ""}`}
                                onClick={() => setSelectedFeatureIndex(index)}
                              >
                                <div className="fvl-module-tab-head">
                                  <div className="fvl-module-tab-title">
                                    <img src={item.icon} alt="" />
                                    <span>
                                      <strong>{item.label}</strong>
                                      <span>{item.bullets[0]}</span>
                                    </span>
                                  </div>
                                  <ChevronRight size={16} />
                                </div>
                                <p>{item.copy}</p>
                              </button>
                            );
                          })}
                        </div>

                        <motion.article
                          key={selectedFeature.id}
                          className="fvl-deck-stage"
                          style={{ "--band-image": `url("${selectedFeature.image}")` }}
                        >
                          <div className="fvl-deck-stage-copy">
                            <div className="fvl-kicker">
                              <img src={selectedFeature.icon} alt="" />
                              <span>{selectedFeature.label}</span>
                            </div>
                            <h3>{selectedFeature.title}</h3>
                            <p>{selectedFeature.copy}</p>
                            <div className="fvl-deck-points">
                              {selectedFeature.bullets.map((bullet) => (
                                <span key={bullet} className="fvl-hero-pill">
                                  <Check size={14} />
                                  <strong>{bullet}</strong>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="fvl-deck-stage-side">
                            <div className="fvl-deck-rail">
                              <div className="fvl-deck-stage-panel">
                                <strong>Ruta conectada</strong>
                                <span>Cada frente del gremio se enlaza con el siguiente para que siempre sepas a donde ir.</span>
                              </div>
                              <div className="fvl-deck-stage-panel">
                                <strong>Mundo vivo</strong>
                                <span>Home, ejercicios, misiones y rutinas laten como partes del mismo viaje.</span>
                              </div>
                              <div className="fvl-deck-stage-panel">
                                <strong>Decision clara</strong>
                                <span>En pocos pasos sabes donde arrancar y que recompensa vale la pena perseguir.</span>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      </div>
                    </motion.div>
                  )}

                  {flowTab === "clases" && (
                    <motion.div
                      key="flow-clases"
                      {...FLOW_STAGE_MOTION}
                    >
                      <div className="fvl-class-layout" style={{ "--fv-accent": selected.accent, "--fv-secondary": selected.secondary }}>
                        <div className="fvl-class-scene" style={{ "--class-image": `url("${selected.hero}")` }}>
                          <div className="fvl-scene-panel">
                            <div className="fvl-scene-panel-head">
                              <div>
                                <small>Ruta destacada</small>
                                <h3>{selected.route}</h3>
                                <p>{selected.routeCopy}</p>
                              </div>
                              <img src={selected.crest} alt="" />
                            </div>

                            <div className="fvl-scene-panel-grid">
                              <div className="fvl-panel-copy">
                                <small>Clase elegida</small>
                                <strong>{selected.name}</strong>
                                <p>Marca el tono de tu viaje y la forma en que se presentan tus rutas mas afines.</p>
                              </div>
                              <div className="fvl-panel-copy">
                                <small>Territorio afin</small>
                                <strong>{selected.short}</strong>
                                <p>Da prioridad a territorios y recomendaciones acordes con tu manera de entrenar.</p>
                              </div>
                              <div className="fvl-panel-copy">
                                <small>Lectura del mapa</small>
                                <strong>Mas claridad</strong>
                                <p>Todo se ordena para que veas mejor tu progreso, tus rutas y tu siguiente objetivo.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="fvl-class-panel">
                          <div className="fvl-surface-card" style={{ padding: 20, borderRadius: 24 }}>
                            <small>Como se reparte la comunidad</small>
                            <h3>{selected.name} como puerta de entrada</h3>
                            <p>{selected.classCopy}</p>
                          </div>

                          <div className="fvl-surface-card" style={{ padding: 20, borderRadius: 24 }}>
                            <small>Distribucion visible</small>
                            <div className="fvl-progress-list">
                              {classDistribution.map((item) => (
                                <div key={item.key} className="fvl-progress-row">
                                  <div className="fvl-progress-meta">
                                    <span>{item.name}</span>
                                    <span>{item.count}</span>
                                  </div>
                                  <div className="fvl-progress-bar" style={{ "--bar-width": item.width }}>
                                    <span />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="fvl-surface-card" style={{ padding: 20, borderRadius: 24 }}>
                            <small>Que cambia con esta clase</small>
                            <div className="fvl-perks">
                              {selected.perks.map((perk) => (
                                <div key={perk} className="fvl-perk">
                                  <Sparkles size={14} />
                                  <span>{perk}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {flowTab === "sistema" && (
                    <motion.div
                      key="flow-sistema"
                      {...FLOW_STAGE_MOTION}
                    >
                      <div className="fvl-system-grid">
                        <div className="fvl-system-band is-wide">
                          <div className="fvl-system-copy">
                            <div className="fvl-kicker">
                              <img src="/ui/header/section-personaje.png" alt="" />
                              <span>Forja con reglas claras</span>
                            </div>
                            <h3>Entrar al mundo ya cuenta una historia de progreso, no una lista de features.</h3>
                            <p>
                              Aqui entiendes rapido como se vive ForgeVenture: sesiones reales, rutas por clase,
                              progreso con memoria y recompensas que empujan a seguir avanzando.
                            </p>
                            <div className="fvl-system-points">
                              {SYSTEM_PANELS.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <div key={item.title} className="fvl-system-point">
                                    {item.image ? <img src={item.image} alt="" /> : (
                                      <div className="fvl-icon-wrap">
                                        <Icon size={18} />
                                      </div>
                                    )}
                                    <div>
                                      <strong style={{ display: "block", fontFamily: "'Sora',sans-serif", fontSize: 13, marginBottom: 4 }}>{item.title}</strong>
                                      <p>{item.copy}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="fvl-system-side">
                          <div className="fvl-system-band">
                            <div className="fvl-panel-copy" style={{ padding: 0, background: "transparent", border: "none" }}>
                              <small>Lo que te aguarda</small>
                              <strong style={{ fontFamily: "'Sora',sans-serif", fontSize: 18 }}>Cada sesion deja huella</strong>
                              <p>Tu progreso no se pierde: el gremio guarda rachas, rutas, botin y decisiones para que siempre tengas un siguiente paso.</p>
                            </div>
                            <div className="fvl-side-grid" style={{ marginTop: 14 }}>
                              <div className="fvl-system-point">
                                <div className="fvl-icon-wrap"><Brain size={18} /></div>
                                <div>
                                  <strong style={{ display: "block", fontFamily: "'Sora',sans-serif", fontSize: 13, marginBottom: 4 }}>Recomendacion con criterio</strong>
                                  <p>Las sugerencias apuntan a tu clase, a tu ritmo y a lo que mas te conviene entrenar hoy.</p>
                                </div>
                              </div>
                              <div className="fvl-system-point">
                                <div className="fvl-icon-wrap"><Lock size={18} /></div>
                                <div>
                                  <strong style={{ display: "block", fontFamily: "'Sora',sans-serif", fontSize: 13, marginBottom: 4 }}>Progreso bajo control</strong>
                                  <p>Sabes que hiciste, que te falta y que recompensa te espera sin perderte entre menus.</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="fvl-system-band">
                            <div className="fvl-panel-copy" style={{ padding: 0, background: "transparent", border: "none" }}>
                              <small>Pulso del gremio</small>
                              <strong style={{ fontFamily: "'Sora',sans-serif", fontSize: 18 }}>Empiezas con una meta y sales con una ruta.</strong>
                              <p>Desde la primera visita ya puedes entender que entrenar, como sumar XP y por que vale la pena volver manana.</p>
                            </div>
                            <div className="fvl-chip-row" style={{ marginTop: 14 }}>
                              <span className="fvl-badge"><Flame size={14} /><strong>Racha</strong><span>encendida</span></span>
                              <span className="fvl-badge"><Clock3 size={14} /><strong>Tiempo</strong><span>que suma</span></span>
                              <span className="fvl-badge"><Zap size={14} /><strong>XP</strong><span>ganada</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {flowTab === "faq" && (
                    <motion.div
                      key="flow-faq"
                      {...FLOW_STAGE_MOTION}
                    >
                      <div className="fvl-faq-layout">
                        <div className="fvl-faq-list">
                          {FAQ_ITEMS.map((item, index) => {
                            const isOpen = faqOpen === index;
                            return (
                              <div key={item.q} className="fvl-faq-card">
                                <button className="fvl-faq-trigger" onClick={() => setFaqOpen(isOpen ? -1 : index)} aria-expanded={isOpen}>
                                  <span>
                                    <small>Duda {String(index + 1).padStart(2, "0")}</small>
                                    <strong>{item.q}</strong>
                                  </span>
                                  <ChevronDown size={18} style={{ transform: `rotate(${isOpen ? 180 : 0}deg)`, transition: "transform .2s ease" }} />
                                </button>
                                <AnimatePresence initial={false}>
                                  {isOpen && (
                                    <motion.div
                                      className="fvl-faq-body"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.22 }}
                                    >
                                      <p>{item.a}</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>

                        <div className="fvl-system-band">
                          <div className="fvl-panel-copy" style={{ padding: 0, background: "transparent", border: "none" }}>
                            <small>Antes de partir</small>
                            <strong style={{ fontFamily: "'Sora',sans-serif", fontSize: 22 }}>Todo apunta a una sola idea:</strong>
                            <p>hacer que moverse, entrenar y volver manana se sienta como avanzar en un mundo propio.</p>
                          </div>
                          <div className="fvl-side-grid" style={{ marginTop: 18 }}>
                            <div className="fvl-system-point">
                              <div className="fvl-icon-wrap"><Shield size={18} /></div>
                              <div>
                                <strong style={{ display: "block", fontFamily: "'Sora',sans-serif", fontSize: 13, marginBottom: 4 }}>Progreso con sentido</strong>
                                <p>Cada zona, mision o rutina existe para ayudarte a avanzar de manera clara, no para llenarte de ruido.</p>
                              </div>
                            </div>
                            <div className="fvl-system-point">
                              <div className="fvl-icon-wrap"><Trophy size={18} /></div>
                              <div>
                                <strong style={{ display: "block", fontFamily: "'Sora',sans-serif", fontSize: 13, marginBottom: 4 }}>Recompensas visibles</strong>
                                <p>El botin, las rachas y los logros siempre tienen un lugar claro dentro de tu avance.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section id="apoyar" className="fvl-section">
          <div className="fvl-final-band">
            <div className="fvl-final-mark" aria-hidden="true">
              <img src={heroPreview.crest === "/ui/header/section-home.png" ? "/logo.png" : heroPreview.crest} alt="" />
            </div>
            <div className="fvl-final-layout">
              <div className="fvl-final-copy">
                <div className="fvl-kicker">
                  <img src="/ui/header/section-donaciones.png" alt="" />
                  <span>Da el primer paso</span>
                </div>
                <h2>Empieza hoy y convierte tu entrenamiento en una aventura que deja huella.</h2>
                <p>
                  Elige tu clase, abre tu primera ruta y deja que misiones, ejercicios y rutinas te empujen a volver con un objetivo nuevo cada dia.
                </p>
              </div>

              <div className="fvl-final-actions">
                <button className="is-primary" onClick={onRegister}>
                  Abrir cuenta y comenzar
                </button>
                <button className="fvl-nav-ghost" onClick={onLogin}>
                  {user ? "Volver a mi ruta" : "Ya tengo cuenta"}
                </button>
                <div className="fvl-final-support">
                  <img src="/qr-donacion.png" alt="QR de apoyo al proyecto" />
                  <div>
                    <small>Apoyo al gremio</small>
                    <strong style={{ display: "block", fontFamily: "'Sora',sans-serif", fontSize: 15, margin: "4px 0 6px" }}>Escanea y ayuda a seguir ampliando el mundo.</strong>
                    <p>Tu apoyo ayuda a sumar nuevas rutas, mejoras visuales y mas contenido para el gremio.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="fvl-footer">
          <div>
            <strong>ForgeVenture</strong>
            <p>Forja tu cuerpo. Vive la aventura. Cada sesion cuenta y cada paso deja progreso.</p>
          </div>
          <div>
            <small>Camino del heroe</small>
            <p>Fuerza, ritmo o control: el gremio siempre tiene una ruta lista para ti.</p>
          </div>
        </footer>
      </main>

      <div className="fvl-social-fab" ref={socialRef}>
        <AnimatePresence>
          {socialOpen && (
            <motion.div
              className="fvl-social-panel"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="fvl-social-panel-head">
                <div>
                  <strong>Habla con el gremio</strong>
                  <p>Elige la via que te quede mas comoda para dudas, soporte o novedades.</p>
                </div>
                <button
                  type="button"
                  className="fvl-social-panel-close"
                  onClick={() => setSocialOpen(false)}
                  aria-label="Cerrar redes del gremio"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="fvl-social-links">
                {SOCIAL_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.id}
                      className="fvl-social-link"
                      data-role={item.role}
                      href={item.href}
                      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                      rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                      title={item.role}
                    >
                      <span className="fvl-social-link-icon">
                        <Icon size={18} />
                      </span>
                      <span className="fvl-social-link-copy">
                        <strong>{item.label}</strong>
                        <span>{item.hint}</span>
                      </span>
                      <ArrowRight size={14} className="fvl-social-link-arrow" />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          className={`fvl-social-toggle${socialOpen ? "" : " is-idle"}`}
          onClick={() => setSocialOpen((current) => !current)}
          aria-expanded={socialOpen}
          aria-label={socialOpen ? "Ocultar redes del gremio" : "Mostrar redes del gremio"}
        >
          {socialOpen ? <Plus size={18} style={{ transform: "rotate(45deg)" }} /> : <MessageCircle size={18} />}
          <span className="fvl-social-toggle-copy">
            <strong>{socialOpen ? "Cerrar" : "Redes"}</strong>
            {!socialOpen && <span>{socialPrompt}</span>}
          </span>
        </button>
      </div>
    </div>
  );
}
