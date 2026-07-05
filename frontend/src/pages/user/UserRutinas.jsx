import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  Award,
  Brain,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  Play,
  PlayCircle,
  Rows3,
  Search,
  Shield,
  Sparkles,
  Swords,
  Target,
  Timer as TimerIcon,
  Trophy,
  Wind,
  X,
  Zap,
  LayoutGrid,
} from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { auth, db } from "../../firebase";
import { getRutinasPublicas, completarRutina } from "../../services/api.js";
import PoseCamera from "../../components/exercise/PoseCamera.jsx";
import { getExerciseDetector, needsCameraTip } from "../../components/exercise/exerciseLogic.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";

const UI = {
  bg: "#070610",
  panel: "#100d1d",
  panelAlt: "#161126",
  text: "#f7f1ff",
  muted: "#b5a8c7",
  mutedDeep: "#7f7394",
  line: "rgba(255,255,255,.08)",
  gold: "#f3c969",
  success: "#80d39b",
  danger: "#ff6f7d",
  cyan: "#5ad8ff",
  teal: "#20c997",
};

const DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const DIFICULTAD_COLOR = {
  Principiante: "#7bdc3b",
  Intermedio: "#f3c969",
  Avanzado: "#ff8659",
  Elite: "#ff4d5e",
};

const SORT_KEY = "ur-sort";
const VIEW_KEY = "ur:view";
const FAVORITES_KEY = "ur:favorites";
const TERRITORY_PREF_KEY = "ur:territory-pref";
const SESSION_PREF_KEY = "ur:session-pref";

const REST_TIPS = [
  "Respira por la nariz y baja pulsaciones antes de volver a cargar.",
  "Sacude hombros y manos para no entrar tenso al siguiente tramo.",
  "Ajusta postura y vuelve a la tecnica antes de acelerar otra vez.",
  "Si la serie subio fuerte, usa este descanso para ordenar el ritmo.",
  "Mantente de pie, abre pecho y prepara la siguiente entrada con calma.",
];

const CLASS_COPY = {
  GUERRERO: {
    title: "Forja fuerza y constancia",
    lead: "Elige que entrenar hoy y explora el resto del mapa sin apuro.",
    focus: "Fuerza, calistenia y funcional",
    command: "Entra sabiendo que ruta pesada toca hoy, sin perder tiempo decidiendo.",
    commandSecondary:
      "Si no entrenaste hoy, arranca con fuerza. Si ya activaste el cuerpo, cierra con una funcional corta.",
  },
  ARQUERO: {
    title: "Mantene ritmo, velocidad y precision",
    lead: "Rutas rapidas de cardio, HIIT y movilidad para mantener tu ritmo.",
    focus: "Cardio, HIIT y movilidad",
    command: "Rutas de pulso y agilidad, priorizadas donde tu clase rinde mejor.",
    commandSecondary:
      "Sin entreno hoy, arranca con cardio corto. Si ya tomaste traccion, sube a HIIT.",
  },
  MAGO: {
    title: "Sostene control, tecnica y energia",
    lead: "Movilidad, respiracion y tecnica: entrena con precision, no al azar.",
    focus: "Flexibilidad, control y flujo",
    command: "Aqui la tecnica pesa tanto como el volumen: cada entrada cuenta.",
    commandSecondary:
      "Con semana pesada, entra por movilidad. Si vienes limpio, toma una ruta larga y estable.",
  },
  DEFAULT: {
    title: "Ordena tu mapa de rutinas",
    lead: "Encuentra que entrenar hoy y explora el resto de tus rutinas.",
    focus: "Ritmo, rutas y progreso visible",
    command: "Primero ves lo que importa hoy. Despues, el resto del mapa.",
    commandSecondary:
      "Empieza por la recomendacion diaria y explora otras zonas cuando quieras.",
  },
};

const RUTINA_DAILY_ASSETS = {
  state: {
    idle: "/exercises/daily/daily-state-untrained.png",
    active: "/exercises/daily/daily-state-training.png",
    cleared: "/exercises/daily/daily-state-cleared.png",
  },
  reward: {
    xp: "/exercises/daily/daily-reward-xp.png",
    claimed: "/exercises/daily/daily-reward-claimed.png",
    chest: "/routines/daily/daily-reward-chest.png",
    token: "/routines/daily/daily-reward-token.png",
    classBonus: "/routines/daily/daily-reward-class-bonus.png",
  },
};

const RUTINA_MODAL_ASSETS = {
  anatomy: {
    fuerza: "/routines/modals/anatomy-fuerza.png",
    cardio: "/routines/modals/anatomy-cardio.png",
    flexibilidad: "/routines/modals/anatomy-flexibilidad.png",
    funcional: "/routines/modals/anatomy-funcional.png",
    general: "/routines/modals/anatomy-general.png",
  },
  difficulty: {
    principiante: "/routines/modals/difficulty-principiante.png",
    intermedio: "/routines/modals/difficulty-intermedio.png",
    avanzado: "/routines/modals/difficulty-avanzado.png",
    elite: "/routines/modals/difficulty-elite.png",
  },
  equipment: {
    bodyweight: "/routines/modals/equipment-bodyweight.png",
    timer: "/routines/modals/equipment-timer.png",
    camera: "/routines/modals/equipment-camera.png",
    mixed: "/routines/modals/equipment-mixed.png",
  },
};

const CATEGORY_MUSCLES = {
  fuerza: "Pecho · espalda · brazos",
  calistenia: "Pecho · triceps · core",
  hipertrofia: "Musculos principales",
  funcional: "Cuerpo completo",
  cardio: "Piernas · sistema cardiovascular",
  hiit: "Cuerpo completo",
  flexibilidad: "Cadera · piernas · espalda",
  yoga: "Flexibilidad · postura",
  pilates: "Core · pelvis · espalda",
  movilidad: "Articulaciones · control",
  recuperacion: "Movilidad suave · descarga",
};

const PAGE_CSS = `
  @keyframes ur-xpPop { 0%{opacity:0;transform:translate(-50%,-50%) scale(.6)} 40%{opacity:1;transform:translate(-50%,-80px) scale(1.12)} 100%{opacity:0;transform:translate(-50%,-140px) scale(1)} }
  @keyframes ur-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes ur-modalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ur-sheetIn { from{opacity:0;transform:translateX(28px) scale(.985)} to{opacity:1;transform:translateX(0) scale(1)} }
  @keyframes ur-lineScroll { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .urt-page {
    position: relative;
    min-height: 100vh;
    padding: clamp(14px, 2vw, 32px);
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--class-accent), transparent 86%), transparent 26%),
      radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--class-secondary), transparent 88%), transparent 24%),
      linear-gradient(180deg, #090512 0%, var(--class-bg) 48%, #090611 100%);
    color: ${UI.text};
    overflow-x: hidden;
  }
  .urt-page::before {
    content: "";
    position: fixed;
    inset: 0;
    background:
      linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
    background-size: 38px 38px;
    opacity: .18;
    pointer-events: none;
  }
  .urt-shell {
    position: relative;
    z-index: 1;
    width: min(1680px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 12px;
  }
  .urt-panel {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(20,10,34,.78), rgba(8,5,17,.86));
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    box-shadow:
      0 24px 68px rgba(0,0,0,.34),
      inset 0 1px 0 rgba(255,255,255,.05);
  }
  .urt-panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
  }
  .urt-panel-head h3, .urt-band-copy h2, .urt-spotlight-copy h3 {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(18px, 1.6vw, 26px);
    line-height: 1.06;
  }
  .urt-panel-head p, .urt-band-copy p, .urt-spotlight-copy p, .urt-hero-copy p, .urt-command-card p, .urt-command-item p, .urt-mini-card p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.55;
  }
  .urt-panel-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 50%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    color: var(--class-accent);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .urt-kicker, .urt-chip-row, .urt-actions, .urt-card-actions, .urt-mini-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .urt-kicker img, .urt-chip img, .urt-map-card img, .urt-summary-card img, .urt-mini-badge img, .urt-routine-mark img, .urt-band-visual img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .urt-kicker span {
    color: var(--class-accent);
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .urt-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    font-weight: 700;
  }
  .urt-chip.is-focus {
    border-color: color-mix(in srgb, var(--class-accent) 55%, transparent);
    background: color-mix(in srgb, var(--class-accent) 14%, transparent);
    color: var(--class-accent);
  }
  .urt-btn, .urt-btn-ghost, .urt-tab, .urt-map-card, .urt-select, .urt-search input {
    transition: transform .2s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease;
  }
  .urt-btn, .urt-btn-ghost, .urt-tab {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
    padding: 8px 14px;
    min-height: 34px;
  }
  .urt-btn {
    color: #0a0712;
    background: linear-gradient(135deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 70%, white 8%));
    box-shadow: 0 10px 28px color-mix(in srgb, var(--class-accent) 25%, transparent);
  }
  .urt-btn:hover, .urt-btn-ghost:hover, .urt-map-card:hover, .urt-tab:hover { transform: translateY(-2px); }
  .urt-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
  .urt-btn-ghost {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    color: ${UI.text};
  }
  .urt-btn-ghost.is-on {
    border-color: color-mix(in srgb, var(--class-accent) 48%, transparent);
    background: color-mix(in srgb, var(--class-accent) 14%, transparent);
    color: var(--class-accent);
  }
  .urt-hero {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 18px;
    align-items: start;
  }
  .urt-hero-copy {
    display: grid;
    gap: 18px;
    align-content: start;
  }
  .urt-hero-copy h1 {
    margin: 0;
    font: 900 clamp(36px, 4.4vw, 72px)/1.02 "Manrope", sans-serif;
    color: #fff9ef;
    max-width: 32ch;
  }
  .urt-hero-copy h1 span {
    color: var(--class-accent);
    text-shadow: 0 0 34px color-mix(in srgb, var(--class-accent), transparent 45%);
  }
  .urt-hero-copy > p {
    font: 500 clamp(14px, 1.2vw, 18px)/1.7 "Manrope", sans-serif;
    color: #cdbfe0;
    max-width: 900px;
  }
  .urt-hero-status {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--status-color) 42%, transparent);
    background: color-mix(in srgb, var(--status-color) 10%, transparent);
  }
  .urt-status-icon {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: rgba(0,0,0,.24);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .urt-hero-status strong, .urt-progress-head strong, .urt-command-card strong, .urt-command-item strong, .urt-mini-card strong, .urt-routine-copy strong, .urt-routine-footer strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 16px;
    color: ${UI.text};
  }
  .urt-hero-status p, .urt-progress-head span, .urt-command-card small, .urt-command-item p, .urt-mini-card span, .urt-routine-copy span, .urt-routine-footer p {
    margin: 2px 0 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.38;
  }
  .urt-hero-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .urt-kpi, .urt-summary-card, .urt-command-card, .urt-side-card {
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .urt-kpi strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: clamp(24px, 2vw, 34px);
    color: ${UI.text};
  }
  .urt-kpi span {
    display: block;
    margin-top: 6px;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .urt-summary-card-top, .urt-mini-card-top, .urt-routine-card-top, .urt-progress-head, .urt-toolbar, .urt-toolbar-row, .urt-tabs, .urt-week-strip, .urt-map-card-top, .urt-map-meta, .urt-routine-meta, .urt-routine-footer {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .urt-progress-head, .urt-toolbar, .urt-toolbar-row, .urt-map-meta, .urt-routine-meta, .urt-routine-footer { justify-content: space-between; }
  .urt-band {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 18px;
  }
  .urt-band-visual {
    width: 72px;
    min-height: 72px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: color-mix(in srgb, var(--class-accent) 14%, rgba(255,255,255,.02));
    display: grid;
    place-items: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
    position: relative;
    overflow: hidden;
  }
  .urt-band-visual::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 24%, rgba(255,255,255,.12), transparent 34%),
      linear-gradient(180deg, rgba(255,255,255,.04), transparent 35%);
    pointer-events: none;
  }
  .urt-band-state,
  .urt-band-reward {
    position: relative;
    z-index: 1;
    object-fit: contain;
  }
  .urt-band-state {
    width: 72px;
    height: 72px;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--class-accent) 24%, transparent));
  }
  .urt-band-reward {
    position: absolute;
    right: 10px;
    bottom: 8px;
    width: 42px;
    height: 42px;
    filter: drop-shadow(0 0 14px rgba(243,201,105,.35));
  }
  .urt-band-copy {
    display: grid;
    gap: 10px;
  }
  .urt-band-copy h2 { font-size: clamp(26px, 2.4vw, 42px); margin-top: 6px; }
  .urt-band-route {
    display: grid;
    gap: 10px;
    margin-top: 2px;
    max-width: 520px;
  }
  .urt-band-route-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
  .urt-band-route-meta strong {
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    color: ${UI.text};
  }
  .urt-band-route-meta span {
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  .urt-band-route-track {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .urt-band-route-node {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
  }
  .urt-band-route-node.is-done {
    border-color: rgba(128,211,155,.42);
    background: rgba(128,211,155,.14);
    color: ${UI.success};
    box-shadow: 0 0 16px rgba(128,211,155,.18);
  }
  .urt-band-route-node.is-active {
    border-color: color-mix(in srgb, var(--class-accent) 50%, transparent);
    background: color-mix(in srgb, var(--class-accent) 14%, transparent);
    color: var(--class-accent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--class-accent) 18%, transparent);
  }
  .urt-band-route-line {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: rgba(255,255,255,.08);
    overflow: hidden;
  }
  .urt-band-route-line > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 72%, white 6%));
    box-shadow: 0 0 14px color-mix(in srgb, var(--class-accent) 26%, transparent);
  }
  .urt-band-actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 10px;
    max-width: 340px;
  }
  .urt-band-reward-box {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .urt-band-reward-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
  .urt-band-reward-copy strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .urt-band-reward-copy span {
    display: block;
    margin-top: 2px;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  .urt-band-reward-ico {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 0 14px rgba(243,201,105,.25));
  }
  .urt-band-actions .urt-chip-row {
    gap: 8px;
  }
  .urt-grid-2 { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(340px, .95fr); gap: 18px; }
  .urt-summary, .urt-command, .urt-map, .urt-spotlight, .urt-library { padding: 16px; }
  .urt-summary-grid, .urt-mini-grid, .urt-routine-grid, .urt-command-grid { display: grid; gap: 12px; }
  .urt-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 0; }
  .urt-summary-shell { display: grid; gap: 14px; }
  .urt-summary-card-top img, .urt-map-card-top img { width: 22px; height: 22px; }
  .urt-summary-card-top span, .urt-side-card p, .urt-map-card-top span, .urt-map-card small, .urt-mini-card p, .urt-routine-footer p { color: ${UI.muted}; font-family: "Manrope", sans-serif; }
  .urt-bitacora-card {
    position: relative;
    overflow: visible;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--group-color) 12%, rgba(255,255,255,.03)), rgba(255,255,255,.025)),
      rgba(255,255,255,.025);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .urt-bitacora-card::before {
    content: "";
    position: absolute;
    inset: 10px;
    border: 1px solid color-mix(in srgb, var(--group-color) 18%, transparent);
    border-radius: 8px;
    pointer-events: none;
    opacity: .8;
  }
  .urt-bitacora-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  .urt-bitacora-head strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    margin-bottom: 3px;
  }
  .urt-bitacora-head span,
  .urt-bitacora-foot,
  .urt-bitacora-metric-copy span,
  .urt-bitacora-tip p,
  .urt-chart-head p,
  .urt-chart-note,
  .urt-chart-col span,
  .urt-chart-col small,
  .urt-chart-legend span {
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
  }
  .urt-bitacora-head span,
  .urt-chart-head p,
  .urt-chart-note { font-size: 13px; line-height: 1.35; }
  .urt-panel-head-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }
  .urt-panel-head-art {
    width: 40px;
    height: 40px;
    object-fit: contain;
    filter: drop-shadow(0 0 14px rgba(255,196,92,.35));
  }
  .urt-bitacora-icon {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--group-color) 26%, transparent);
    background: color-mix(in srgb, var(--group-color) 14%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 20px color-mix(in srgb, var(--group-color) 18%, transparent);
  }
  .urt-bitacora-icon img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }
  .urt-bitacora-metrics {
    display: grid;
    gap: 10px;
  }
  .urt-bitacora-metric {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(0,0,0,.18);
    transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
  }
  .urt-bitacora-metric:hover {
    border-color: color-mix(in srgb, var(--metric-color) 38%, transparent);
    background: color-mix(in srgb, var(--metric-color) 10%, rgba(255,255,255,.02));
    box-shadow: 0 14px 28px rgba(0,0,0,.24);
  }
  .urt-bitacora-metric-badge {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--metric-color) 34%, transparent);
    background: color-mix(in srgb, var(--metric-color) 14%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .urt-bitacora-metric-badge img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  .urt-bitacora-metric-copy strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    margin-bottom: 2px;
  }
  .urt-bitacora-metric-copy span { font-size: 12px; line-height: 1.3; }
  .urt-bitacora-value {
    font-family: "Manrope", sans-serif;
    font-size: 23px;
    color: var(--metric-color);
    text-align: right;
    text-shadow: 0 0 18px color-mix(in srgb, var(--metric-color) 14%, transparent);
  }
  .urt-bitacora-foot {
    margin-top: 12px;
    font-size: 12px;
  }
  .urt-progress-block {
    padding: 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.018)),
      rgba(0,0,0,.22);
    overflow: hidden;
  }
  .urt-progress-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }
  .urt-progress-head-title {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .urt-progress-head-title img {
    width: 30px;
    height: 30px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--class-accent) 40%, transparent));
  }
  .urt-chart-head strong,
  .urt-progress-head strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 16px;
  }
  .urt-chart-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .urt-chart-title img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .urt-chart-panel {
    position: relative;
    display: grid;
    gap: 14px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.07);
    background:
      linear-gradient(180deg, rgba(8,7,16,.86), rgba(8,7,16,.9)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--class-accent) 10%, transparent), transparent 32%),
      url("/exercises/summary/bitacora-chart-bg.png") center/cover;
  }
  .urt-chart-stage {
    position: relative;
    min-height: 220px;
    padding: 18px 14px 46px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background:
      linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)),
      rgba(0,0,0,.16);
    overflow: hidden;
  }
  .urt-chart-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 100% 25%, 14.28% 100%;
    opacity: .24;
    pointer-events: none;
  }
  .urt-chart-svg {
    position: absolute;
    inset: 18px 12px 44px;
    width: calc(100% - 24px);
    height: calc(100% - 62px);
    pointer-events: none;
    z-index: 1;
  }
  .urt-chart-cols {
    position: absolute;
    inset: 18px 12px 44px;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
    z-index: 2;
  }
  .urt-chart-col {
    height: 100%;
    display: grid;
    align-items: end;
    justify-items: center;
    gap: 8px;
  }
  .urt-chart-col small {
    font-size: 12px;
    color: ${UI.text};
    font-weight: 700;
  }
  .urt-chart-col span {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .urt-chart-col.is-today span { color: var(--class-accent); }
  .urt-chart-col.is-complete small {
    color: ${UI.success};
    text-shadow: 0 0 12px rgba(128,211,155,.4);
  }
  .urt-chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  .urt-chart-legend strong {
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    color: ${UI.text};
  }
  .urt-chart-legend span { font-size: 12px; }
  .urt-week-strip { margin-top: 0; flex-wrap: wrap; }
  .urt-week-day {
    flex: 1 1 0;
    min-width: 62px;
    padding: 10px 8px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.03);
    display: grid;
    gap: 4px;
    justify-items: center;
  }
  .urt-week-day.is-active { border-color: color-mix(in srgb, var(--class-accent) 28%, transparent); }
  .urt-week-day.is-today {
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    border-color: color-mix(in srgb, var(--class-accent) 50%, transparent);
  }
  .urt-week-day span {
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .urt-week-day strong { font-family: "Manrope", sans-serif; font-size: 18px; }
  .urt-command-grid { grid-template-columns: 1fr; margin-bottom: 0; }
  .urt-command-card small, .urt-side-card small {
    display: block;
    margin-bottom: 8px;
    color: var(--class-accent);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .urt-command-stack { display: grid; gap: 12px; }
  .urt-command-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    padding: 18px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 24%, transparent);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--class-accent) 12%, rgba(255,255,255,.03)), rgba(255,255,255,.025)),
      rgba(255,255,255,.025);
    box-shadow: 0 16px 34px color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .urt-command-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--class-accent) 14%, transparent), transparent 34%);
    pointer-events: none;
  }
  .urt-command-hero-copy,
  .urt-command-hero-visual,
  .urt-guild-card { position: relative; z-index: 1; }
  .urt-command-hero-copy {
    display: grid;
    gap: 10px;
    align-content: start;
  }
  .urt-command-hero-copy h4,
  .urt-guild-card h4 {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-size: 20px;
    line-height: 1.08;
  }
  .urt-command-hero-copy p,
  .urt-guild-card p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    line-height: 1.42;
  }
  .urt-command-hero-visual {
    width: 108px;
    min-width: 108px;
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 10px;
  }
  .urt-command-seal {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.05);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .urt-command-seal img {
    width: 46px;
    height: 46px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px color-mix(in srgb, var(--class-accent) 18%, transparent));
  }
  .urt-command-mini-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .urt-guild-card {
    overflow: hidden;
    display: grid;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--card-accent) 10%, rgba(255,255,255,.03)), rgba(255,255,255,.025)),
      rgba(255,255,255,.025);
  }
  .urt-guild-card-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .urt-guild-badge {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    border: 1px solid color-mix(in srgb, var(--card-accent) 30%, transparent);
    background: color-mix(in srgb, var(--card-accent) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .urt-guild-badge img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }
  .urt-guild-card-head span {
    display: block;
    margin-bottom: 6px;
    color: var(--card-accent);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .urt-guild-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .urt-guild-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--chip-accent, rgba(255,255,255,.1)) 36%, transparent);
    background: color-mix(in srgb, var(--chip-accent, rgba(255,255,255,.04)) 12%, transparent);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 700;
  }
  .urt-guild-note {
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,.06);
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  .urt-map-track {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
    align-items: start;
  }
  .urt-map-card {
    position: relative;
    text-align: left;
    padding: 0;
    grid-column: span 4;
    min-height: 228px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--territory-color) 10%, rgba(255,255,255,.02)), rgba(255,255,255,.02)),
      rgba(255,255,255,.02);
    cursor: pointer;
    overflow: hidden;
    margin-top: var(--territory-lift, 0px);
  }
  .urt-map-card.is-active {
    border-color: color-mix(in srgb, var(--class-accent) 48%, transparent);
    box-shadow: 0 14px 32px color-mix(in srgb, var(--class-accent) 20%, transparent);
    transform: translateY(-2px);
  }
  .urt-map-card.is-focus {
    box-shadow: 0 12px 28px color-mix(in srgb, var(--territory-color) 18%, transparent);
  }
  .urt-map-banner {
    position: relative;
    min-height: 118px;
    background:
      linear-gradient(180deg, rgba(9,8,18,.18), rgba(9,8,18,.78)),
      var(--territory-banner) center/cover no-repeat;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }
  .urt-map-banner::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, color-mix(in srgb, var(--territory-color) 10%, transparent), transparent 54%);
    pointer-events: none;
  }
  .urt-map-banner-top,
  .urt-map-banner-bottom,
  .urt-map-card-body,
  .urt-map-card-top { position: relative; z-index: 1; }
  .urt-map-banner-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 14px 0;
  }
  .urt-map-banner-bottom {
    position: absolute;
    right: 14px;
    bottom: 12px;
  }
  .urt-map-crest {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(0,0,0,.24);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 20px rgba(0,0,0,.24);
    backdrop-filter: blur(10px);
  }
  .urt-map-crest img {
    width: 34px;
    height: 34px;
    object-fit: contain;
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--territory-color) 22%, transparent));
  }
  .urt-map-flag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--territory-color) 40%, transparent);
    background: rgba(8,8,16,.38);
    color: var(--territory-color);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
  }
  .urt-map-card-body {
    display: grid;
    gap: 14px;
    padding: 14px;
  }
  .urt-map-card-top { align-items: flex-start; }
  .urt-map-card-top strong, .urt-mini-card strong, .urt-routine-copy strong { display: block; font-family: "Manrope", sans-serif; font-size: 18px; }
  .urt-map-card-top span {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.3;
    color: color-mix(in srgb, var(--territory-color) 70%, white 18%);
    text-transform: uppercase;
    letter-spacing: .12em;
  }
  .urt-map-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .urt-map-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 700;
  }
  .urt-map-pill.is-focus {
    border-color: color-mix(in srgb, var(--territory-color) 40%, transparent);
    background: color-mix(in srgb, var(--territory-color) 12%, transparent);
    color: var(--territory-color);
  }
  .urt-map-progress {
    display: grid;
    gap: 8px;
  }
  .urt-map-progress-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }
  .urt-map-progress-head small {
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .urt-map-progress-head strong {
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    color: ${UI.text};
  }
  .urt-map-meta small, .urt-routine-meta small {
    display: block;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .urt-map-meta strong, .urt-routine-meta strong { font-family: "Manrope", sans-serif; font-size: 18px; }
  .urt-spotlight-banner {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(9,8,18,.36), rgba(9,8,18,.92)),
      var(--spotlight-image) center/cover no-repeat;
    padding: 22px;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(260px, .95fr);
    gap: 16px;
  }
  .urt-spotlight-banner::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(10,8,18,.82), rgba(10,8,18,.45));
    pointer-events: none;
  }
  .urt-spotlight-copy, .urt-spotlight-side { position: relative; z-index: 1; }
  .urt-spotlight-side { display: grid; gap: 12px; }
  .urt-mini-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 16px; }
  .urt-mini-card, .urt-routine-card {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 16px;
  }
  .urt-mini-badge, .urt-routine-mark {
    width: 46px;
    height: 46px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .urt-toolbar { flex-direction: column; align-items: stretch; gap: 14px; margin-bottom: 18px; }
  .urt-tabs { gap: 8px; }
  .urt-view-switch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
  }
  .urt-view-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: ${UI.muted};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all .2s ease;
  }
  .urt-view-btn.is-active {
    color: var(--class-accent);
    background: color-mix(in srgb, var(--class-accent) 14%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--class-accent) 38%, transparent), 0 0 18px color-mix(in srgb, var(--class-accent) 14%, transparent);
  }
  .urt-tab {
    padding: 10px 14px;
    background: rgba(255,255,255,.04);
    color: ${UI.muted};
    border: 1px solid rgba(255,255,255,.08);
  }
  .urt-tab.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 48%, transparent);
    background: color-mix(in srgb, var(--class-accent) 14%, transparent);
  }
  .urt-toolbar-row { flex-wrap: wrap; }
  .urt-search { position: relative; flex: 1 1 280px; min-width: 220px; }
  .urt-search svg {
    position: absolute;
    top: 50%;
    left: 14px;
    transform: translateY(-50%);
    color: ${UI.mutedDeep};
  }
  .urt-search input, .urt-select {
    min-height: 46px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 14px;
  }
  .urt-search input { width: 100%; padding: 0 14px 0 42px; }
  .urt-search input:focus, .urt-select:focus {
    outline: none;
    border-color: color-mix(in srgb, var(--class-accent) 55%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--class-accent) 16%, transparent);
  }
  .urt-select { padding: 0 14px; cursor: pointer; }
  .urt-library-featured {
    display: grid;
    gap: 12px;
    margin-bottom: 18px;
  }
  .urt-library-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
  .urt-library-rail {
    display: grid;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015)),
      rgba(255,255,255,.02);
  }
  .urt-library-rail-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
  .urt-library-rail-top strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .urt-library-rail-top span,
  .urt-library-pick p {
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  .urt-library-pick {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(0,0,0,.16);
  }
  .urt-library-pick-mark {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.05);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .urt-library-pick-mark img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
  .urt-library-pick strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    margin-bottom: 2px;
  }
  .urt-library-pick-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }
  .urt-routine-grid { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
  .urt-routine-grid.is-list { grid-template-columns: 1fr; }
  .urt-routine-card {
    display: grid;
    gap: 14px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--routine-color) 8%, rgba(255,255,255,.02)), rgba(255,255,255,.02)),
      rgba(255,255,255,.02);
  }
  .urt-routine-card.is-done { border-color: rgba(128,211,155,.3); }
  .urt-routine-card.is-list {
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr);
    align-items: start;
    column-gap: 18px;
  }
  .urt-routine-card.is-list > .urt-routine-card-top,
  .urt-routine-card.is-list > .urt-chip-row,
  .urt-routine-card.is-list > .urt-routine-days {
    grid-column: 1;
  }
  .urt-routine-card.is-list > .urt-routine-meta,
  .urt-routine-card.is-list > .urt-routine-memory {
    grid-column: 2;
  }
  .urt-routine-card.is-list > .urt-routine-footer {
    grid-column: 1 / -1;
    padding-top: 2px;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .urt-routine-mark-wrap {
    display: grid;
    gap: 8px;
    justify-items: center;
  }
  .urt-routine-copy { flex: 1; min-width: 0; }
  .urt-routine-top-actions {
    display: grid;
    gap: 8px;
    justify-items: end;
  }
  .urt-routine-xp {
    flex-shrink: 0;
    border-radius: 999px;
    border: 1px solid rgba(243,201,105,.22);
    background: rgba(243,201,105,.12);
    color: ${UI.gold};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    font-weight: 800;
    padding: 8px 10px;
  }
  .urt-routine-rarity {
    min-height: 24px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(0,0,0,.18);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .urt-favorite-btn {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.muted};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all .2s ease;
  }
  .urt-favorite-btn.is-on {
    color: #ff758f;
    border-color: rgba(255,117,143,.38);
    background: rgba(255,117,143,.12);
    box-shadow: 0 0 18px rgba(255,117,143,.12);
  }
  .urt-routine-meta { gap: 8px; }
  .urt-routine-meta > div {
    flex: 1;
    min-width: 0;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(0,0,0,.18);
  }
  .urt-routine-memory {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .urt-routine-memory-item {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.03);
  }
  .urt-routine-memory-item small {
    display: block;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .urt-routine-memory-item strong {
    display: block;
    margin-top: 5px;
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    color: ${UI.text};
  }
  .urt-routine-days { display: flex; justify-content: flex-start; }
  .urt-routine-footer { align-items: flex-end; }
  .urt-loading-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .urt-loading-card {
    min-height: 220px;
    border-radius: 8px;
    background: linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.1), rgba(255,255,255,.05));
    background-size: 220% 100%;
    animation: ur-lineScroll 1.4s linear infinite;
  }
  .urt-empty {
    min-height: 220px;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,.12);
    background: rgba(255,255,255,.02);
    display: grid;
    place-items: center;
    text-align: center;
    gap: 10px;
    padding: 22px;
  }
  .urt-empty img { width: 64px; height: 64px; object-fit: contain; }
  .urt-empty strong { font-family: "Manrope", sans-serif; font-size: 18px; }
  .urt-empty p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    max-width: 40ch;
  }
  .urt-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 320;
    background:
      radial-gradient(circle at top, color-mix(in srgb, var(--class-accent) 8%, transparent), transparent 35%),
      rgba(4,4,10,.84);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .urt-modal-backdrop.detail {
    align-items: stretch;
    justify-content: flex-end;
    padding: 18px;
  }
  .urt-modal-backdrop.detail,
  .urt-modal-backdrop.detail * {
    cursor: auto !important;
  }
  .urt-modal-backdrop.detail button,
  .urt-modal-backdrop.detail [role="button"],
  .urt-modal-backdrop.detail a {
    cursor: pointer !important;
  }
  .urt-modal {
    width: min(100%, 760px);
    max-height: 92vh;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(20,17,34,.98), rgba(10,9,19,.98)),
      url("/ui/panel-texture.png");
    box-shadow: 0 26px 56px rgba(0,0,0,.55), 0 0 0 1px color-mix(in srgb, var(--class-accent) 16%, transparent);
    animation: ur-modalIn .22s ease both;
  }
  .urt-modal.ritual {
    width: min(100%, 920px);
  }
  .urt-modal.detail {
    width: min(100%, 620px);
    max-height: calc(100vh - 36px);
    height: auto;
    display: flex;
    flex-direction: column;
    margin-left: auto;
    border-radius: 28px;
    animation: ur-sheetIn .24s cubic-bezier(.22,1,.36,1) both;
  }
  .urt-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .urt-modal-head.ritual {
    position: relative;
    overflow: hidden;
    padding: 20px 22px;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--class-accent) 10%, transparent), transparent 42%),
      rgba(255,255,255,.02);
  }
  .urt-modal-body {
    max-height: calc(92vh - 96px);
    overflow: auto;
    padding: 18px 20px 20px;
    display: grid;
    gap: 16px;
  }
  .urt-modal.detail .urt-modal-body {
    max-height: calc(100vh - 148px);
    overscroll-behavior: contain;
  }
  .urt-modal-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(260px, .85fr);
    gap: 16px;
    padding: 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--detail-color) 10%, rgba(255,255,255,.03)), rgba(255,255,255,.02)),
      rgba(255,255,255,.02);
  }
  .urt-modal-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--detail-color) 14%, transparent), transparent 52%),
      var(--detail-banner) center/cover no-repeat;
    opacity: .28;
    pointer-events: none;
  }
  .urt-modal-hero-copy,
  .urt-modal-hero-side,
  .urt-detail-art-card,
  .urt-session-ritual-head,
  .urt-session-stage,
  .urt-session-feedback { position: relative; z-index: 1; }
  .urt-modal-hero-copy {
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .urt-modal-hero-copy h3,
  .urt-session-ritual-head strong {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-size: clamp(26px, 2.2vw, 32px);
  }
  .urt-modal-hero-copy p,
  .urt-detail-side-copy span,
  .urt-session-phase-copy p,
  .urt-session-phase-copy span,
  .urt-session-feedback p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.42;
  }
  .urt-modal-hero-side {
    display: grid;
    gap: 12px;
  }
  .urt-detail-art-card {
    overflow: hidden;
    display: grid;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.34);
    min-height: 100%;
  }
  .urt-detail-art {
    width: 100%;
    min-height: 148px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(circle at top, color-mix(in srgb, var(--detail-color) 12%, transparent), transparent 55%),
      rgba(255,255,255,.03);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .urt-detail-art img {
    width: min(100%, 210px);
    max-height: 168px;
    object-fit: contain;
    filter: drop-shadow(0 0 24px color-mix(in srgb, var(--detail-color) 18%, transparent));
  }
  .urt-detail-side-grid {
    display: grid;
    gap: 10px;
  }
  .urt-detail-side-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.03);
  }
  .urt-detail-side-badge {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .urt-detail-side-badge img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
  .urt-detail-side-copy strong,
  .urt-modal-stat strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 16px;
  }
  .urt-modal-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .urt-modal-stat, .urt-step-card, .urt-session-card {
    padding: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
  }
  .urt-step-card { display: flex; gap: 12px; align-items: center; }
  .urt-step-card-copy { flex: 1; min-width: 0; }
  .urt-step-card-copy strong, .urt-session-title strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .urt-step-card-copy span, .urt-session-title span, .urt-modal-stat span {
    display: block;
    margin-top: 4px;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
  }
  .urt-session-layout {
    display: grid;
    gap: 16px;
  }
  .urt-session-ritual-head {
    display: grid;
    gap: 12px;
  }
  .urt-session-phase-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    min-height: 30px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--phase-color) 40%, transparent);
    background: color-mix(in srgb, var(--phase-color) 12%, transparent);
    color: var(--phase-color);
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .urt-session-ritual-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(260px, .95fr);
    gap: 16px;
    align-items: start;
  }
  .urt-session-stage {
    padding: 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--phase-color, var(--class-accent)) 8%, rgba(255,255,255,.03)), rgba(255,255,255,.02)),
      rgba(255,255,255,.03);
    text-align: center;
    overflow: hidden;
  }
  .urt-session-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top, color-mix(in srgb, var(--phase-color, var(--class-accent)) 12%, transparent), transparent 42%),
      linear-gradient(180deg, rgba(255,255,255,.03), transparent 35%);
    pointer-events: none;
  }
  .urt-session-stage.is-rest {
    --phase-color: ${UI.cyan};
  }
  .urt-session-stage.is-done {
    --phase-color: ${UI.gold};
  }
  .urt-session-stage.is-next {
    --phase-color: ${UI.success};
  }
  .urt-session-stage.is-ready,
  .urt-session-stage.is-active,
  .urt-session-stage.is-intro {
    --phase-color: var(--class-accent);
  }
  .urt-session-phase-copy {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }
  .urt-session-feedback {
    display: grid;
    gap: 8px;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015)),
      rgba(0,0,0,.16);
  }
  .urt-session-stage,
  .urt-session-feedback {
    align-self: start;
  }
  .urt-session-feedback strong {
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    color: ${UI.text};
  }
  .urt-session-flash {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    min-height: 34px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(243,201,105,.32);
    background: rgba(243,201,105,.12);
    color: ${UI.gold};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 0 24px rgba(243,201,105,.14);
  }
  .urt-session-ring {
    position: relative;
    width: 160px;
    height: 160px;
    margin: 0 auto 18px;
  }
  .urt-session-ring svg { transform: rotate(-90deg); }
  .urt-session-ring-copy {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
  }
  .urt-session-ring-copy strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 28px;
  }
  .urt-session-controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .urt-session-reps {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 16px;
  }
  .urt-session-rep-btn {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-size: 24px;
    cursor: pointer;
  }
  .urt-camera-wrap {
    margin-top: 18px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.08);
  }
  .urt-toast {
    position: fixed;
    bottom: 28px;
    right: 20px;
    z-index: 600;
    width: min(340px, calc(100vw - 32px));
    background: linear-gradient(180deg, rgba(18,13,30,.98), rgba(10,8,18,.98));
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 8px;
    box-shadow: 0 20px 44px rgba(0,0,0,.55);
    overflow: hidden;
  }
  /* ── 1440px ── */
  @media (max-width: 1440px) {
    .urt-grid-2 { grid-template-columns: minmax(0, 1.1fr) minmax(290px, .9fr); }
  }
  /* ── 1280px ── */
  @media (max-width: 1280px) {
    .urt-grid-2 { grid-template-columns: minmax(0, 1.3fr) minmax(250px, .7fr); }
    .urt-hero-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-map-track { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  }
  /* ── 1180px: columna única ── */
  @media (max-width: 1180px) {
    .urt-grid-2, .urt-spotlight-banner { grid-template-columns: 1fr; }
    .urt-summary-grid, .urt-loading-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-mini-grid, .urt-command-grid, .urt-command-mini-grid { grid-template-columns: 1fr; }
    .urt-modal-hero, .urt-session-ritual-grid { grid-template-columns: 1fr; }
    .urt-library-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-map-track { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .urt-map-card { grid-column: auto; margin-top: 0; }
  }
  /* ── 1024px ── */
  @media (max-width: 1024px) {
    .urt-hero-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-band { grid-template-columns: auto minmax(0, 1fr); }
    .urt-band-actions { display: none; }
  }
  /* ── viewport corto (1366x768, 1280x720, 1128x634) ── */
  @media (max-height: 800px) and (min-width: 900px) {
    .urt-page { padding: 10px 14px; }
    .urt-hero { padding: 12px 14px; gap: 12px; }
    .urt-hero-copy h1 { font-size: clamp(20px, 2.4vw, 36px); }
    .urt-hero-copy { gap: 10px; }
    .urt-kpi { padding: 8px 12px; }
    .urt-kpi strong { font-size: clamp(16px, 1.5vw, 22px); }
    .urt-band { padding: 10px 14px; }
    .urt-band-visual { width: 48px; min-height: 48px; }
    .urt-summary, .urt-command, .urt-map, .urt-spotlight, .urt-library { padding: 12px; }
    .urt-panel-head { margin-bottom: 10px; }
    .urt-shell { gap: 10px; }
  }
  /* ── 820px: móvil grande ── */
  @media (max-width: 820px) {
    .urt-page { padding: 10px 10px 24px; }
    .urt-hero, .urt-summary, .urt-command, .urt-map, .urt-spotlight, .urt-library { padding: 14px; }
    .urt-band { grid-template-columns: 1fr; justify-items: start; }
    .urt-band-actions { max-width: none; width: 100%; display: flex; }
    .urt-hero-kpis, .urt-summary-grid, .urt-loading-grid, .urt-modal-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .urt-map-banner { min-height: 96px; }
    .urt-modal-head, .urt-modal-head.ritual, .urt-modal-body { padding-left: 14px; padding-right: 14px; }
    .urt-modal-backdrop.detail { align-items: flex-end; padding: 10px; }
    .urt-modal.detail { width: min(100%, 560px); max-height: 88vh; height: auto; }
    .urt-routine-grid { grid-template-columns: 1fr; }
    .urt-routine-card.is-list { grid-template-columns: 1fr; }
    .urt-routine-memory { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .urt-routine-footer, .urt-toolbar-row { flex-direction: column; align-items: stretch; }
    .urt-command-hero { grid-template-columns: 1fr; }
    .urt-command-hero-visual { width: auto; min-width: 0; justify-items: start; }
  }
  /* ── 560px: móvil pequeño ── */
  @media (max-width: 560px) {
    .urt-hero-copy h1 { max-width: 100%; font-size: clamp(24px, 8vw, 38px); }
    .urt-hero-kpis, .urt-summary-grid, .urt-modal-grid { grid-template-columns: 1fr; }
    .urt-map-track, .urt-week-strip, .urt-tabs { grid-template-columns: 1fr; }
    .urt-library-strip, .urt-routine-memory { grid-template-columns: 1fr; }
    .urt-tabs { display: grid; width: 100%; }
    .urt-map-card-body { padding: 10px; }
    .urt-map-crest { width: 40px; height: 40px; }
    .urt-map-crest img { width: 24px; height: 24px; }
    .urt-library-pick { grid-template-columns: 1fr; justify-items: start; }
    .urt-routine-top-actions { justify-items: stretch; }
    .urt-detail-side-item { grid-template-columns: 1fr; justify-items: start; }
    .urt-modal.detail { width: 100%; }
  }

  /* ── Neon text layer — toda la pestaña de rutinas ── */
  .urt-page h1 {
    text-shadow: 0 0 28px rgba(255,255,255,.18), 0 0 56px rgba(255,255,255,.08);
  }
  .urt-panel-head h3,
  .urt-band-copy h2,
  .urt-spotlight-copy h3 {
    text-shadow: 0 0 20px rgba(255,255,255,.13), 0 0 40px rgba(255,255,255,.06);
  }
  .urt-kicker span {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .urt-chip.is-focus {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  .urt-tab.is-active {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  .urt-kpi strong {
    text-shadow: 0 0 12px currentColor, 0 0 28px currentColor;
  }
  .urt-kpi span {
    text-shadow: 0 0 8px rgba(255,255,255,.18);
  }
  .urt-hero-status strong,
  .urt-progress-head strong,
  .urt-command-card strong,
  .urt-command-item strong,
  .urt-mini-card strong,
  .urt-routine-copy strong,
  .urt-map-card-top strong,
  .urt-routine-footer strong {
    text-shadow: 0 0 10px currentColor, 0 0 24px currentColor;
  }
  .urt-summary-card-top span {
    text-shadow: 0 0 8px rgba(255,255,255,.18);
  }
  .urt-band-copy h2 {
    text-shadow: 0 0 22px rgba(255,255,255,.14), 0 0 44px rgba(255,255,255,.06);
  }
  .urt-btn-ghost.is-on {
    text-shadow: 0 0 8px currentColor;
  }
`;

const SESSION_CSS = `
  .urs-overlay {
    position: fixed; inset: 0; z-index: 9100;
    display: flex; flex-direction: column;
    background: rgba(4,3,10,.93);
  }
  .urs-overlay::before {
    content: "";
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at top left, color-mix(in srgb, var(--sp-color,#8b6fff) 9%, transparent), transparent 44%),
      radial-gradient(ellipse at bottom right, color-mix(in srgb, var(--sp-color,#8b6fff) 5%, transparent), transparent 38%);
    pointer-events: none;
  }
  .urs-header {
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,.055);
    position: relative; z-index: 1;
    background: linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,.012)), rgba(8,6,18,.82);
  }
  .urs-header-top-line {
    height: 2px;
  }
  .urs-header-row {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 20px;
  }
  .urs-phase-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 13px; border-radius: 999px; flex-shrink: 0;
    border: 1px solid color-mix(in srgb, var(--phase-color, var(--sp-color,#8b6fff)) 40%, transparent);
    background: color-mix(in srgb, var(--phase-color, var(--sp-color,#8b6fff)) 12%, transparent);
    color: var(--phase-color, var(--sp-color,#8b6fff));
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em; text-transform: uppercase;
  }
  .urs-header-title {
    flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
  }
  .urs-header-title strong {
    font-family: "Manrope", sans-serif; font-size: 16px; font-weight: 800;
    color: ${UI.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .urs-header-title span {
    font-family: "Manrope", sans-serif; font-size: 11px; color: ${UI.muted};
  }
  .urs-header-right {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  .urs-xp-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 999px;
    border: 1px solid rgba(243,201,105,.28);
    background: rgba(243,201,105,.1);
    color: ${UI.gold};
    font: 800 13px/1 "JetBrains Mono", monospace;
    letter-spacing: .04em;
  }
  .urs-close-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.muted}; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, color .15s;
  }
  .urs-close-btn:hover { background: rgba(255,255,255,.09); color: ${UI.text}; }
  .urs-progress {
    height: 3px; background: rgba(255,255,255,.06);
  }
  .urs-progress-fill {
    height: 100%; transition: width .5s ease;
  }
  .urs-body {
    flex: 1; display: grid;
    grid-template-columns: 280px 1fr;
    overflow: hidden; position: relative; z-index: 1;
  }
  .urs-side {
    display: flex; flex-direction: column; gap: 12px;
    padding: 16px 14px;
    border-right: 1px solid rgba(255,255,255,.06);
    overflow-y: auto;
    background:
      linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,.008)),
      rgba(8,6,18,.58);
  }
  .urs-card-label {
    display: block;
    font: 800 9px/1 "JetBrains Mono", monospace;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--sp-color,#8b6fff); margin-bottom: 8px;
  }
  .urs-ritual-card {
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018)), rgba(8,6,18,.72);
    padding: 12px;
  }
  .urs-ritual-card p {
    margin: 0 0 10px;
    font-family: "Manrope", sans-serif; font-size: 12px; line-height: 1.5;
    color: ${UI.muted};
  }
  .urs-badges-row {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .urs-badge-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 10px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    font-family: "Manrope", sans-serif; font-size: 11px; font-weight: 700;
    color: ${UI.muted};
  }
  .urs-badge-pill img { width: 14px; height: 14px; object-fit: contain; }
  .urs-steps-list {
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018)), rgba(8,6,18,.72);
    padding: 12px;
    flex: 1;
  }
  .urs-step-row {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 7px 2px;
    border-bottom: 1px solid rgba(255,255,255,.04);
    transition: opacity .15s;
  }
  .urs-step-row:last-child { border-bottom: none; }
  .urs-step-row.is-done { opacity: .6; }
  .urs-step-row.is-active .urs-step-copy strong { color: var(--sp-color,#8b6fff); }
  .urs-step-num {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
    border: 1px solid rgba(255,255,255,.1); background: transparent;
    display: flex; align-items: center; justify-content: center;
    font: 700 9px/1 "JetBrains Mono", monospace; color: ${UI.mutedDeep};
    transition: border-color .2s, background .2s;
  }
  .urs-step-row.is-done .urs-step-num {
    border-color: color-mix(in srgb, var(--sp-color,#8b6fff) 60%, transparent);
    background: color-mix(in srgb, var(--sp-color,#8b6fff) 16%, transparent);
  }
  .urs-step-row.is-active .urs-step-num {
    border-color: color-mix(in srgb, var(--sp-color,#8b6fff) 50%, transparent);
    background: color-mix(in srgb, var(--sp-color,#8b6fff) 10%, transparent);
  }
  .urs-step-copy strong {
    display: block; font-family: "Manrope", sans-serif; font-size: 12px; font-weight: 700;
    color: ${UI.text}; margin-bottom: 2px; transition: color .2s;
  }
  .urs-step-copy span {
    font-family: "Manrope", sans-serif; font-size: 10px; color: ${UI.mutedDeep};
  }
  .urs-flash {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 14px; border-radius: 10px;
    border: 1px solid rgba(243,201,105,.3);
    background: rgba(243,201,105,.1);
    color: ${UI.gold};
    font: 800 12px/1 "Manrope", sans-serif;
  }
  .urs-main {
    display: flex; align-items: center; justify-content: center;
    padding: 32px 36px;
    overflow-y: auto;
    position: relative;
  }
  .urs-phase-block {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; max-width: 480px; width: 100%;
  }
  .urs-icon-badge {
    width: 96px; height: 96px; border-radius: 50%; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }
  .urs-phase-title {
    font-family: "Manrope", sans-serif; font-size: 26px; font-weight: 800;
    color: ${UI.text}; margin-bottom: 8px; display: block;
  }
  .urs-phase-sub {
    font-family: "Manrope", sans-serif; font-size: 14px; color: ${UI.muted};
    margin: 0 0 14px; line-height: 1.4;
  }
  .urs-phase-copy {
    font-family: "Manrope", sans-serif; font-size: 14px; color: ${UI.muted};
    margin: 0 auto 22px; max-width: 34ch; line-height: 1.55;
  }
  .urs-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 10px;
    border: none; cursor: pointer;
    background: var(--btn-color, var(--sp-color,#8b6fff));
    color: #fff; font: 800 14px/1 "Manrope", sans-serif;
    box-shadow: 0 0 28px color-mix(in srgb, var(--btn-color, var(--sp-color,#8b6fff)) 28%, transparent);
    transition: opacity .15s;
  }
  .urs-btn:hover { opacity: .85; }
  .urs-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: ${UI.muted}; cursor: pointer;
    font: 700 13px/1 "Manrope", sans-serif;
    transition: background .15s, color .15s;
  }
  .urs-btn-ghost:hover { background: rgba(255,255,255,.08); color: ${UI.text}; }
  .urs-ring {
    position: relative; width: 160px; height: 160px;
    margin: 0 auto 20px;
  }
  .urs-ring svg { transform: rotate(-90deg); }
  .urs-ring-inner {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .urs-ring-inner strong {
    font: 800 32px/1 "Manrope", sans-serif; display: block;
  }
  .urs-ring-inner span {
    font: 600 12px/1 "Manrope", sans-serif; color: ${UI.muted}; margin-top: 5px;
  }
  .urs-rep-row {
    display: flex; align-items: center; gap: 18px;
    margin: 16px 0 10px;
  }
  .urs-rep-btn {
    width: 50px; height: 50px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: ${UI.text}; font-size: 22px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s;
  }
  .urs-rep-btn:hover { background: rgba(255,255,255,.09); }
  .urs-rep-count {
    font: 800 38px/1 "Manrope", sans-serif; color: var(--sp-color,#8b6fff);
    min-width: 3ch; text-align: center;
  }
  .urs-rep-max {
    font-size: 17px; color: ${UI.muted}; font-weight: 600;
  }
  .urs-actions {
    display: flex; gap: 10px; flex-wrap: wrap;
    justify-content: center; margin-top: 22px;
  }
  .urs-camera-wrap {
    margin-top: 18px; border-radius: 10px; overflow: hidden;
    border: 1px solid rgba(255,255,255,.08);
    width: 100%; max-width: 360px;
  }
  /* ── Camera-tip popup (rutinas) ── */
  .urs-camtip-backdrop {
    position: fixed; inset: 0; z-index: 9100;
    background: rgba(4,3,10,.74); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .urs-camtip-card {
    background: linear-gradient(160deg,#110d1e,#0b0816);
    border: 1px solid rgba(255,255,255,.10);
    border-top: 2px solid ${UI.accent};
    border-radius: 18px; padding: 28px 26px 22px;
    max-width: 360px; width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,.72), 0 0 0 1px rgba(255,255,255,.04);
    display: flex; flex-direction: column; gap: 14px;
  }
  .urs-camtip-icon { font-size: 32px; text-align: center; }
  .urs-camtip-title { font: 800 16px/1.2 "Rajdhani", sans-serif; color: #f0ecff; letter-spacing: .04em; text-align: center; }
  .urs-camtip-body { font: 500 13px/1.55 "Manrope", sans-serif; color: #8e86aa; text-align: center; }
  .urs-camtip-body strong { color: #c8bfe8; }
  .urs-camtip-actions { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
  .urs-camtip-btn-ok {
    width: 100%; padding: 11px 18px; background: ${UI.accent};
    border: none; border-radius: 10px; color: #fff;
    font: 700 13px/1 "Rajdhani", sans-serif; letter-spacing: .06em; cursor: pointer; transition: opacity .15s;
  }
  .urs-camtip-btn-ok:hover { opacity: .85; }
  .urs-camtip-btn-skip {
    width: 100%; padding: 11px 18px; background: transparent;
    border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
    color: #7d769b; font: 600 12px/1 "Manrope", sans-serif; cursor: pointer; transition: background .18s, color .18s;
  }
  .urs-camtip-btn-skip:hover { background: rgba(255,255,255,.06); color: #c8bfe8; }
  .urs-stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 10px; width: 100%; margin: 18px 0 24px;
  }
  .urs-stat {
    padding: 14px 8px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.012)), rgba(8,6,18,.72);
    display: flex; flex-direction: column; align-items: center; gap: 5px;
  }
  .urs-stat strong {
    font: 800 22px/1 "Manrope", sans-serif;
  }
  .urs-stat span {
    font: 700 9px/1 "JetBrains Mono", monospace; color: ${UI.mutedDeep};
    text-transform: uppercase; letter-spacing: .08em;
  }
  @media (max-width: 720px) {
    .urs-body { grid-template-columns: 1fr; }
    .urs-side { display: none; }
    .urs-main { padding: 24px 18px; }
    .urs-stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

function normalizeRutinaClass(heroClass) {
  const key = (heroClass || "").toUpperCase();
  return USER_CLASS_THEME[key] ? key : "DEFAULT";
}

function getWeekStartDate(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isThisWeek(isoDate) {
  if (!isoDate) return false;
  const start = getWeekStartDate();
  const end = new Date(start.getTime() + 7 * 86400000);
  const date = new Date(isoDate);
  return date >= start && date < end;
}

function diasDesde(isoDate) {
  if (!isoDate) return null;
  const diff = Math.floor((Date.now() - new Date(isoDate)) / 86400000);
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  if (diff < 7) return `hace ${diff} dias`;
  if (diff < 30) return `hace ${Math.floor(diff / 7)} semanas`;
  return `hace ${Math.floor(diff / 30)} meses`;
}

function catMuscles(categoria = "") {
  const key = categoria.toLowerCase();
  for (const [term, value] of Object.entries(CATEGORY_MUSCLES)) {
    if (key.includes(term)) return value;
  }
  return "Trabajo general";
}

function hasClsBonus(heroClass, categoria = "") {
  const cls = (heroClass || "").toUpperCase();
  const key = categoria.toLowerCase();
  if (cls === "GUERRERO") return ["fuerza", "calistenia", "funcional", "hipertrofia", "resistencia"].some((term) => key.includes(term));
  if (cls === "ARQUERO") return ["cardio", "hiit", "aerob", "interval", "movilidad"].some((term) => key.includes(term));
  if (cls === "MAGO") return ["flexibilidad", "yoga", "pilates", "movilidad", "balance", "recuper"].some((term) => key.includes(term));
  return false;
}

function catColor(categoria = "") {
  return getRutinaCategoryMeta(categoria).color;
}

function catIconComponent(categoria = "") {
  const key = categoria.toLowerCase();
  if (key.includes("fuerza") || key.includes("calistenia") || key.includes("hipertrofia")) return Swords;
  if (key.includes("cardio") || key.includes("hiit") || key.includes("aer")) return Activity;
  if (key.includes("flexibilidad") || key.includes("yoga") || key.includes("pilates")) return Wind;
  if (key.includes("movilidad") || key.includes("recuper")) return Heart;
  return Dumbbell;
}

function getRutinaCategoryMeta(categoria = "") {
  const raw = categoria.toLowerCase();
  if (raw.includes("fuerza") || raw.includes("calistenia") || raw.includes("hipertrofia")) {
    return {
      key: "fuerza",
      label: "Bastion de fuerza",
      short: "Fuerza",
      icon: "/ui/icons/quest-fuerza.png",
      banner: "/exercises/zones/zone-fuerza-banner.png",
      color: "#ff4d5e",
      summary: "Empuje, piernas y control de base para construir potencia real.",
    };
  }
  if (raw.includes("cardio") || raw.includes("hiit") || raw.includes("aer")) {
    return {
      key: "cardio",
      label: "Ruta de cardio",
      short: raw.includes("hiit") ? "HIIT" : "Cardio",
      icon: "/ui/icons/quest-cardio.png",
      banner: raw.includes("hiit") ? "/exercises/zones/zone-hiit-banner.png" : "/exercises/zones/zone-cardio-banner.png",
      color: "#5ad8ff",
      summary: "Pulso alto, resistencia y tramos con mejor lectura para sesiones rapidas.",
    };
  }
  if (raw.includes("flexibilidad") || raw.includes("yoga") || raw.includes("pilates") || raw.includes("movilidad")) {
    return {
      key: "flexibilidad",
      label: "Santuario movil",
      short: "Flexibilidad",
      icon: "/ui/icons/quest-flexibilidad.png",
      banner: "/exercises/zones/zone-flexibilidad-banner.png",
      color: "#7b78ff",
      summary: "Movilidad, postura y control para que el resto del mapa se sienta mejor.",
    };
  }
  if (raw.includes("funcional")) {
    return {
      key: "funcional",
      label: "Patio funcional",
      short: "Funcional",
      icon: "/ui/icons/quest-hidratacion.png",
      banner: "/exercises/zones/zone-funcional-banner.png",
      color: "#20c997",
      summary: "Trabajo mixto para base corporal, control y transferencia util al dia a dia.",
    };
  }
  return {
    key: "general",
    label: "Mapa general",
    short: "General",
    icon: "/ui/header/section-rutinas.png",
    banner: "/exercises/zones/zone-general-banner.png",
    color: "#c08aff",
    summary: "Una lectura abierta del campo para cambiar de ruta sin perder el hilo.",
  };
}

function getRutinaRarity(rutina, classBonus = false) {
  const xp = Number(rutina?.xpTotal || 0);
  const difficulty = (rutina?.dificultad || "").toLowerCase();
  if (difficulty.includes("elite") || difficulty.includes("el")) {
    return { label: "Legendaria", color: UI.gold };
  }
  if (classBonus || xp >= 260 || difficulty.includes("avanz")) {
    return { label: "Epica", color: "#c08aff" };
  }
  if (xp >= 160 || difficulty.includes("inter")) {
    return { label: "Rara", color: UI.cyan };
  }
  return { label: "Comun", color: UI.success };
}

function getRoutineMemory(rutina) {
  return {
    lastLabel: rutina.ultimoCompletado ? diasDesde(rutina.ultimoCompletado) : "Sin registros",
    streakLabel: `${rutina.weeklyStreak || 0} sem`,
    playedLabel: `${rutina.completadas || 0} cierres`,
  };
}

function normalizeLooseText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDifficultyColorSafe(dificultad = "", fallback = UI.gold) {
  const key = normalizeLooseText(dificultad);
  if (key.includes("elite")) return DIFICULTAD_COLOR.Elite;
  if (key.includes("avanz")) return DIFICULTAD_COLOR.Avanzado;
  if (key.includes("inter")) return DIFICULTAD_COLOR.Intermedio;
  if (key.includes("prin")) return DIFICULTAD_COLOR.Principiante;
  return fallback;
}

function getRoutineEquipmentKey(rutina) {
  const hasCamera = rutina.pasos.some((paso) => normalizeLooseText(paso.verif).includes("camara"));
  const hasTimer = rutina.pasos.some((paso) => normalizeLooseText(paso.verif).includes("timer"));
  if (hasCamera && hasTimer) return "mixed";
  if (hasCamera) return "camera";
  if (hasTimer) return "timer";
  return "bodyweight";
}

function getRoutineZoneKey(rutina) {
  return getRutinaCategoryMeta(rutina?.subcategoria || rutina?.categoria || "General").key;
}

function getRutinaModalAssets(rutina) {
  const meta = getRutinaCategoryMeta(rutina.categoria);
  const diffKey = normalizeLooseText(rutina.dificultad || "");
  const difficultyAsset = diffKey.includes("elite")
    ? RUTINA_MODAL_ASSETS.difficulty.elite
    : diffKey.includes("avanz")
      ? RUTINA_MODAL_ASSETS.difficulty.avanzado
      : diffKey.includes("inter")
        ? RUTINA_MODAL_ASSETS.difficulty.intermedio
        : RUTINA_MODAL_ASSETS.difficulty.principiante;

  return {
    anatomy: RUTINA_MODAL_ASSETS.anatomy[meta.key] || RUTINA_MODAL_ASSETS.anatomy.general,
    difficulty: difficultyAsset,
    equipment: RUTINA_MODAL_ASSETS.equipment[getRoutineEquipmentKey(rutina)] || RUTINA_MODAL_ASSETS.equipment.bodyweight,
  };
}

function fmt(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function MiniBar({ val, max, color, height = 6 }) {
  const pct = Math.max(0, Math.min(max ? (val / max) * 100 : 0, 100));
  return (
    <div style={{ height, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color, boxShadow: `0 0 14px ${color}66` }} />
    </div>
  );
}

function DiaChips({ dias, color, small = false, hoyDia = null }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {DIAS.map((day) => {
        const active = dias.includes(day);
        const isToday = active && day === hoyDia;
        return (
          <span
            key={day}
            style={{
              fontFamily: "'Manrope',sans-serif",
              fontSize: small ? 11 : 13,
              fontWeight: isToday ? 800 : active ? 700 : 500,
              color: isToday ? UI.gold : active ? color : UI.mutedDeep,
              background: isToday ? `${UI.gold}22` : active ? `${color}18` : "transparent",
              border: `1px solid ${isToday ? UI.gold : active ? color : "rgba(255,255,255,.08)"}`,
              padding: small ? "2px 6px" : "4px 8px",
              borderRadius: 999,
            }}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
}

function normalizarRutina(rutina, userProgress = {}) {
  const pasos = (rutina.pasos || rutina.ejercicios || []).map((paso, index) => ({
    id: paso.id || `paso-${index}`,
    nombre: paso.nombre || paso.name || `Paso ${index + 1}`,
    imagen: paso.imagen || paso.icon || paso.emoji || null,
    series: Number(paso.series) || 3,
    reps: paso.reps != null ? Number(paso.reps) : null,
    duracion: paso.duracion != null ? Number(paso.duracion) : null,
    descanso: Number(paso.descanso) || 60,
    verif: paso.verif || paso.verificacion || "Timer",
    xp: Number(paso.xp) || 25,
  }));

  const xpTotal = Number(rutina.xpTotal) || pasos.reduce((sum, paso) => sum + paso.xp, 0) || 100;
  const progress = userProgress[`rutina_${rutina.id}`] || {};
  const lastDone = progress.ultimoCompletado ? new Date(progress.ultimoCompletado) : null;
  const today = new Date();
  const completadaHoy = lastDone ? lastDone.toDateString() === today.toDateString() : false;
  const progressDays = Array.isArray(progress.diasSemana) && progress.diasSemana.length > 0 ? progress.diasSemana : null;
  const diasSemana = progressDays || (Array.isArray(rutina.diasSemana) ? rutina.diasSemana : []);
  const asignada = (progress.asignada === true || diasSemana.length > 0) && rutina.activo !== false;

  return {
    ...rutina,
    completadas: Number(progress.completadas || 0),
    completadaHoy,
    objetivo: rutina.objetivo || rutina.descripcion?.split(".")[0] || "Mejorar rendimiento fisico",
    diasSemana,
    subcategoria: rutina.subcategoria || "",
    pasos,
    xpTotal,
    duracionMin: Number(rutina.duracionMin || rutina.duracion) || 30,
    activo: rutina.activo !== false,
    asignada,
    weeklyStreak: Number(progress.weeklyStreak || 0),
    ultimoCompletado: progress.ultimoCompletado || null,
    completadaEstaSemana: isThisWeek(progress.ultimoCompletado),
  };
}

const RUTINAS_MOCK = [
  {
    id: "r1",
    nombre: "Guerrero del hierro",
    categoria: "Fuerza",
    subcategoria: "Hipertrofia",
    dificultad: "Avanzado",
    duracionMin: 55,
    diasSemana: ["Lun", "Mie", "Vie"],
    objetivo: "Ganar musculo con base fuerte y volumen controlado.",
    xpTotal: 220,
    imagen: null,
    asignada: true,
    activo: true,
    descripcion: "Rutina de tres dias para empuje, tiron y estabilidad general.",
    pasos: [
      { id: "p1", nombre: "Plancha", series: 3, reps: null, duracion: 60, descanso: 30, verif: "Timer", xp: 40 },
      { id: "p2", nombre: "Flexiones", series: 4, reps: 15, duracion: null, descanso: 60, verif: "Camara", xp: 30 },
      { id: "p3", nombre: "Dominadas", series: 3, reps: 8, duracion: null, descanso: 90, verif: "Camara", xp: 55 },
    ],
  },
  {
    id: "r2",
    nombre: "Sprint y fuego",
    categoria: "Cardio",
    subcategoria: "HIIT",
    dificultad: "Avanzado",
    duracionMin: 30,
    diasSemana: ["Mar", "Jue", "Sab"],
    objetivo: "Subir pulso y sostener resistencia sin perder tecnica.",
    xpTotal: 310,
    imagen: null,
    asignada: true,
    activo: true,
    descripcion: "HIIT corto y agresivo para mantener gasto alto y ritmo de combate.",
    pasos: [
      { id: "p1", nombre: "Intervalos HIIT", series: 6, reps: null, duracion: 20, descanso: 10, verif: "Timer", xp: 90 },
      { id: "p2", nombre: "Burpees", series: 4, reps: 10, duracion: null, descanso: 30, verif: "Camara", xp: 70 },
    ],
  },
  {
    id: "r3",
    nombre: "Alma zen",
    categoria: "Flexibilidad",
    subcategoria: "Yoga",
    dificultad: "Principiante",
    duracionMin: 40,
    diasSemana: ["Lun", "Mie", "Vie", "Dom"],
    objetivo: "Mejorar movilidad y bajar rigidez sin perder continuidad.",
    xpTotal: 130,
    imagen: null,
    asignada: true,
    activo: true,
    descripcion: "Sesion suave para flexibilidad, respiracion y control postural.",
    pasos: [
      { id: "p1", nombre: "Flujo yoga", series: 1, reps: null, duracion: 20, descanso: 0, verif: "Timer", xp: 45 },
      { id: "p2", nombre: "Estiramiento guiado", series: 1, reps: null, duracion: 15, descanso: 0, verif: "Timer", xp: 20 },
    ],
  },
];

function URBackground({ color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 34 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 0.6 + 0.3),
      r: Math.random() * 1.8 + 0.6,
      life: Math.random(),
      speed: Math.random() * 0.004 + 0.002,
    }));
    const colors = [color + "bb", UI.gold + "88", UI.cyan + "55"];

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.life += particle.speed;
        if (particle.life >= 1) {
          particle.life = 0;
          particle.x = Math.random() * canvas.width;
          particle.y = canvas.height + 10;
        }
        const alpha =
          particle.life < 0.2 ? particle.life / 0.2 : particle.life > 0.8 ? 1 - (particle.life - 0.8) / 0.2 : 1;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y + particle.vy * particle.life * 900, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = colors[Math.floor((particle.x / canvas.width) * colors.length)] || colors[0];
        ctx.globalAlpha = alpha * 0.55;
        ctx.fill();
        particle.x += particle.vx;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "55%", height: "55%", borderRadius: "50%", background: `radial-gradient(circle,${color}12 0%,transparent 65%)`, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: "60%", height: "60%", borderRadius: "50%", background: `radial-gradient(circle,${UI.gold}10 0%,transparent 65%)`, filter: "blur(70px)" }} />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "screen" }} />
    </div>
  );
}

function RutinaDetailModal({ rutina, profile, onClose, onStart }) {
  const color = catColor(rutina.categoria);
  const meta = getRutinaCategoryMeta(rutina.categoria);
  const bonus = hasClsBonus(profile?.heroClass, rutina.subcategoria || rutina.categoria);
  const xpFinal = bonus ? Math.round(rutina.xpTotal * 1.25) : rutina.xpTotal;
  const difficultyColor = getDifficultyColorSafe(rutina.dificultad, color);
  const modalAssets = getRutinaModalAssets(rutina);
  const equipmentKey = getRoutineEquipmentKey(rutina);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  const detailFacts = [
    {
      label: "Anatomia",
      title: catMuscles(rutina.categoria),
      hint: "Zona corporal dominante de esta ruta.",
      asset: modalAssets.anatomy,
      fallbackIcon: meta.icon,
    },
    {
      label: "Equipo",
      title: equipmentKey === "camera" ? "Camara o conteo guiado" : equipmentKey === "timer" ? "Temporizador limpio" : equipmentKey === "mixed" ? "Mixto: camara y timer" : "Peso corporal",
      hint: "Preparacion tecnica antes de entrar.",
      asset: modalAssets.equipment,
      fallbackIcon: "/ui/icons/map-pin.png",
    },
    {
      label: "Dificultad",
      title: rutina.dificultad,
      hint: "Escala de exigencia de esta campana.",
      asset: modalAssets.difficulty,
      fallbackIcon: meta.icon,
    },
  ];

  return (
    <div className="urt-modal-backdrop detail" style={{ "--class-accent": color }} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="urt-modal detail">
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div className="urt-modal-head">
          <div className="urt-kicker">
            <img src={meta.icon} alt="" />
            <span>{meta.label}</span>
          </div>
          <button className="urt-btn-ghost" onClick={onClose} aria-label="Cerrar detalle de rutina">
            <X size={14} />
          </button>
        </div>

        <div className="urt-modal-body">
          <section className="urt-modal-hero" style={{ "--detail-color": color, "--detail-banner": `url(${meta.banner})` }}>
            <div className="urt-modal-hero-copy">
              <div className="urt-panel-tag" style={{ width: "fit-content" }}>
                Hoja tecnica
              </div>
              <h3>{rutina.nombre}</h3>
              <p>{rutina.descripcion}</p>

              <div className="urt-chip-row">
                <span className="urt-chip">{rutina.categoria}</span>
                {rutina.subcategoria && <span className="urt-chip">{rutina.subcategoria}</span>}
                <span className="urt-chip" style={{ color: difficultyColor, borderColor: `${difficultyColor}55` }}>{rutina.dificultad}</span>
                {bonus && <span className="urt-chip is-focus">Afinidad de clase</span>}
              </div>
            </div>

            <div className="urt-modal-hero-side">
              <div className="urt-detail-art-card" style={{ "--detail-color": color }}>
                <div className="urt-detail-art">
                  <img
                    src={modalAssets.anatomy}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = meta.icon;
                    }}
                  />
                </div>
                <div className="urt-detail-side-grid">
                  {detailFacts.map((item) => (
                    <div key={item.label} className="urt-detail-side-item">
                      <div className="urt-detail-side-badge">
                        <img
                          src={item.asset}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.src = item.fallbackIcon;
                          }}
                        />
                      </div>
                      <div className="urt-detail-side-copy">
                        <strong>{item.title}</strong>
                        <span>{item.hint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="urt-modal-grid">
            <div className="urt-modal-stat">
              <strong style={{ color }}>+{xpFinal} XP</strong>
              <span>Recompensa total</span>
            </div>
            <div className="urt-modal-stat">
              <strong style={{ color: UI.cyan }}>{rutina.duracionMin} min</strong>
              <span>Duracion estimada</span>
            </div>
            <div className="urt-modal-stat">
              <strong style={{ color: UI.gold }}>{rutina.pasos.length}</strong>
              <span>Pasos de rutina</span>
            </div>
            <div className="urt-modal-stat">
              <strong style={{ color: UI.success }}>{rutina.completadas}</strong>
              <span>Registros guardados</span>
            </div>
          </div>

          <div className="urt-session-card">
            <strong style={{ display: "block", fontFamily: "'Manrope',sans-serif", fontSize: 16, marginBottom: 6 }}>Objetivo del territorio</strong>
            <p style={{ margin: 0, color: UI.muted, fontFamily: "'Manrope',sans-serif", fontSize: 15 }}>{rutina.objetivo}</p>
            <div style={{ marginTop: 12 }}>
              <DiaChips dias={rutina.diasSemana} color={color} hoyDia={DIAS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]} />
            </div>
          </div>

          <div className="urt-session-card">
            <strong style={{ display: "block", fontFamily: "'Manrope',sans-serif", fontSize: 16, marginBottom: 6 }}>Trabajo fisico</strong>
            <p style={{ margin: 0, color: UI.muted, fontFamily: "'Manrope',sans-serif", fontSize: 15 }}>{catMuscles(rutina.categoria)}</p>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {rutina.pasos.map((paso, index) => (
              <div key={paso.id} className="urt-step-card">
                <div className="urt-mini-badge" style={{ borderColor: `${color}44`, background: `${color}16` }}>
                  {paso.imagen ? (
                    <span style={{ fontSize: 18 }}>{paso.imagen}</span>
                  ) : (
                    (() => {
                      const Icon = catIconComponent(rutina.categoria);
                      return <Icon size={18} color={color} />;
                    })()
                  )}
                </div>
                <div className="urt-step-card-copy">
                  <strong>{index + 1}. {paso.nombre}</strong>
                  <span>
                    {paso.duracion ? `${paso.series} x ${paso.duracion}s` : `${paso.series} x ${paso.reps} reps`} · descanso {paso.descanso}s
                  </span>
                </div>
                <div className="urt-chip-row">
                  <span className="urt-chip">{paso.verif}</span>
                  <span className="urt-chip">+{paso.xp} XP</span>
                </div>
              </div>
            ))}
          </div>

          <div className="urt-actions">
            <button className="urt-btn-ghost" onClick={onClose}>
              <ChevronRight size={14} />
              Volver
            </button>
            <button className="urt-btn" onClick={() => { onClose(); onStart(rutina); }} disabled={!rutina.pasos.length}>
              <PlayCircle size={14} />
              Iniciar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RutinaSessionModal({ rutina, profile, onClose, onComplete, preferredSessionType = "auto", onSessionModeChange = null }) {
  const color = catColor(rutina.categoria);
  const meta = getRutinaCategoryMeta(rutina.categoria);
  const totalSteps = rutina.pasos.length;
  const bonus = hasClsBonus(profile?.heroClass, rutina.subcategoria || rutina.categoria);
  const modalAssets = getRutinaModalAssets(rutina);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [seriesAct, setSeriesAct] = useState(1);
  const [repsHechas, setRepsHechas] = useState(0);
  const [timerSec, setTimerSec] = useState(0);
  const [restSec, setRestSec] = useState(0);
  const [xpAcum, setXpAcum] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);
  const [usarCamara, setUsarCamara] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [showCamTip, setShowCamTip]   = useState(false);
  const [restTip, setRestTip] = useState("");
  const [stepFeedback, setStepFeedback] = useState(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalSeriesRef = useRef(0);
  const finishSerieRef = useRef(null);

  const paso = rutina.pasos[stepIndex] || rutina.pasos[0];
  const isTimer = paso?.verif === "Timer" || !paso?.reps;
  const hasDetector = !isTimer && !!getExerciseDetector(paso?.nombre);
  const xpSerie = paso ? Math.round((paso.xp / Math.max(paso.series, 1)) * (bonus ? 1.25 : 1)) : 0;
  const equipmentLabel = getRoutineEquipmentKey(rutina) === "camera"
    ? "Camara"
    : getRoutineEquipmentKey(rutina) === "timer"
      ? "Temporizador"
      : getRoutineEquipmentKey(rutina) === "mixed"
        ? "Control mixto"
        : "Peso corporal";
  const phaseMeta = {
    intro: { label: "Preparacion", title: "Rito de entrada", copy: "Ordena respiracion, ritmo y tecnica antes de abrir la primera serie.", color, Icon: Shield },
    ready: { label: "Listo", title: "Entrada alineada", copy: "El gesto ya esta claro. Solo falta abrir el tramo y sostener forma.", color, Icon: PlayCircle },
    active: { label: "Activo", title: "Tramo en combate", copy: "La ruta ya esta viva. Cuenta limpio y mantene presencia en cada repeticion.", color, Icon: Zap },
    rest: { label: "Descanso", title: "Respira y recompone", copy: "Solta tension, baja pulsaciones y prepara la siguiente serie con mejor control.", color: UI.cyan, Icon: Wind },
    next: { label: "Transicion", title: "Paso sellado", copy: "Una fase cerrada. El siguiente gesto ya esta esperando en la mesa del ritual.", color: UI.success, Icon: ChevronRight },
    done: { label: "Cierre", title: "Campana completada", copy: "El recorrido quedo registrado con experiencia, memoria y huella real en el tablero.", color: UI.gold, Icon: Trophy },
  };
  const currentPhaseMeta = phaseMeta[phase] || phaseMeta.intro;

  useEffect(() => {
    if (!paso) return;
    setSeriesAct(1);
    setRepsHechas(0);
    setTimerSec(isTimer ? paso.duracion || 30 : 0);
    setCameraError(false);
    if (isTimer) {
      setUsarCamara(false);
      onSessionModeChange?.("timer");
      return;
    }
    if (preferredSessionType === "manual") {
      setUsarCamara(false);
      return;
    }
    if (preferredSessionType === "camera" && hasDetector) {
      setUsarCamara(true);
      return;
    }
    setUsarCamara(hasDetector);
  }, [hasDetector, isTimer, onSessionModeChange, paso, preferredSessionType]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (phase === "active" && isTimer) {
      intervalRef.current = setInterval(() => {
        setTimerSec((current) => {
          if (current <= 1) {
            clearInterval(intervalRef.current);
            finishSerieRef.current?.();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }
    if (phase === "rest") {
      intervalRef.current = setInterval(() => {
        setRestSec((current) => {
          if (current <= 1) {
            clearInterval(intervalRef.current);
            nextSerieOrPaso();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimer, phase]);

  useEffect(() => {
    if (phase === "rest") {
      setRestTip(REST_TIPS[Math.floor(Math.random() * REST_TIPS.length)]);
    }
  }, [phase]);

  useEffect(() => {
    if (!stepFeedback) return undefined;
    const timeout = setTimeout(() => setStepFeedback(null), 1400);
    return () => clearTimeout(timeout);
  }, [stepFeedback]);

  const finishSerie = useCallback(() => {
    if (!paso) return;
    clearInterval(intervalRef.current);
    setXpAcum((current) => current + xpSerie);
    totalSeriesRef.current += 1;
    setStepFeedback({
      title: "Serie sellada",
      copy: `${paso.nombre} deja +${xpSerie} XP en la bitacora.`,
    });
    if (seriesAct >= paso.series) {
      setCompletedIds((current) => [...current, paso.id]);
      if (stepIndex >= totalSteps - 1) setPhase("done");
      else setPhase("next");
    } else {
      setPhase("rest");
      setRestSec(paso.descanso || 60);
    }
  }, [paso, seriesAct, stepIndex, totalSteps, xpSerie]);

  useEffect(() => {
    finishSerieRef.current = finishSerie;
  }, [finishSerie]);

  useEffect(() => {
    if (!isTimer && phase === "active" && usarCamara && repsHechas >= (paso?.reps || 1)) {
      const timeout = setTimeout(() => finishSerieRef.current?.(), 700);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [faseSafety(phase), isTimer, paso?.reps, repsHechas, usarCamara]);

  const nextSerieOrPaso = () => {
    setSeriesAct((current) => current + 1);
    setTimerSec(isTimer ? paso?.duracion || 30 : 0);
    setRepsHechas(0);
    setPhase("ready");
  };

  const goNextPaso = () => {
    setStepIndex((current) => current + 1);
    setPhase("ready");
  };

  const progressPct = totalSteps ? Math.round(((stepIndex + (phase === "done" ? 1 : 0)) / totalSteps) * 100) : 0;
  const ringRadius = 54;
  const circumference = 2 * Math.PI * ringRadius;
  const totalSec = isTimer ? paso?.duracion || 30 : Math.max(paso?.reps || 1, 1);
  const currentSec = phase === "rest" ? restSec : isTimer ? timerSec : repsHechas;
  const pct = totalSec ? Math.min(currentSec / totalSec, 1) : 0;
  const ritualInfo =
    phase === "intro"
      ? `${rutina.pasos.length} pasos · ${rutina.duracionMin} min · +${bonus ? Math.round(rutina.xpTotal * 1.25) : rutina.xpTotal} XP`
      : phase === "rest"
        ? restTip
        : phase === "done"
          ? "El cierre ya esta listo para reclamar y guardar memoria."
          : paso
            ? `${paso.nombre} · ${isTimer ? `${paso.duracion}s` : `${paso.reps} reps`} · ${paso.verif}`
            : "Esperando la siguiente entrada.";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && phase !== "active") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, phase]);

  return createPortal(
    <div className="urs-overlay" style={{ "--sp-color": color, "--class-accent": color }}>
      <style>{SESSION_CSS}</style>

      {/* Camera-tip popup for complex exercises */}
      {showCamTip && (
        <div className="urs-camtip-backdrop">
          <div className="urs-camtip-card">
            <div className="urs-camtip-icon">🎥</div>
            <div className="urs-camtip-title">Detección de cámara — aviso</div>
            <div className="urs-camtip-body">
              <strong>{paso?.nombre}</strong> es un ejercicio de movimiento compuesto y rápido.
              La IA puede tener dificultades para detectar cada rep con precisión.{" "}
              Puedes <strong>activar la cámara</strong> (la IA hace su mejor esfuerzo)
              o seguir con <strong>conteo manual</strong> para mayor control.
            </div>
            <div className="urs-camtip-actions">
              <button className="urs-camtip-btn-ok" onClick={() => { setUsarCamara(true); onSessionModeChange?.("camera"); setShowCamTip(false); }}>
                📷 Activar cámara IA
              </button>
              <button className="urs-camtip-btn-skip" onClick={() => setShowCamTip(false)}>
                ✋ Seguir con conteo manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="urs-header">
        <div className="urs-header-top-line" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div className="urs-header-row">
          <span className="urs-phase-chip" style={{ "--phase-color": currentPhaseMeta.color }}>
            <currentPhaseMeta.Icon size={13} />
            {currentPhaseMeta.label}
          </span>
          <div className="urs-header-title">
            <strong>{rutina.nombre}</strong>
            <span>
              {phase === "done"
                ? "Rutina cerrada"
                : phase === "intro"
                  ? "Preparando sesion"
                  : `Paso ${Math.min(stepIndex + 1, totalSteps)}/${totalSteps} · serie ${seriesAct}/${paso?.series || 1}`}
            </span>
          </div>
          <div className="urs-header-right">
            <span className="urs-xp-badge">+{xpAcum} XP</span>
            {phase !== "active" && (
              <button className="urs-close-btn" onClick={onClose} aria-label="Cerrar sesion">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
        <div className="urs-progress">
          <div
            className="urs-progress-fill"
            style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
          />
        </div>
      </header>

      {/* Two-panel body */}
      <div className="urs-body">

        {/* LEFT: Sidebar */}
        <aside className="urs-side">
          <div className="urs-ritual-card">
            <span className="urs-card-label">Lectura del ritual</span>
            <p>{ritualInfo}</p>
            <div className="urs-badges-row">
              <div className="urs-badge-pill">
                <img src={modalAssets.equipment} alt="" onError={(e) => { e.currentTarget.src = "/ui/icons/map-pin.png"; }} />
                {equipmentLabel}
              </div>
              <div className="urs-badge-pill">
                <img src={modalAssets.difficulty} alt="" onError={(e) => { e.currentTarget.src = meta.icon; }} />
                {rutina.dificultad}
              </div>
            </div>
          </div>

          <div className="urs-steps-list">
            <span className="urs-card-label">Pasos de la rutina</span>
            {rutina.pasos.map((step, index) => {
              const done = completedIds.includes(step.id);
              const active = index === stepIndex && phase !== "intro" && phase !== "done";
              return (
                <div key={step.id} className={`urs-step-row${done ? " is-done" : active ? " is-active" : ""}`}>
                  <div className="urs-step-num">
                    {done ? <Check size={11} color={color} /> : <span>{index + 1}</span>}
                  </div>
                  <div className="urs-step-copy">
                    <strong>{step.nombre}</strong>
                    <span>{step.duracion ? `${step.series} x ${step.duracion}s` : `${step.series} x ${step.reps} reps`}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <AnimatePresence>
            {stepFeedback && (
              <motion.div
                key={stepFeedback.title}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="urs-flash"
              >
                <Sparkles size={14} />
                {stepFeedback.title}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* RIGHT: Main panel */}
        <main className="urs-main">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="urs-phase-block">
              <div className="urs-icon-badge" style={{ borderColor: `${color}44`, background: `${color}14` }}>
                {(() => {
                  const Icon = catIconComponent(rutina.categoria);
                  return <Icon size={38} color={color} />;
                })()}
              </div>
              <strong className="urs-phase-title">{rutina.nombre}</strong>
              <p className="urs-phase-sub">
                {rutina.pasos.length} pasos · {rutina.duracionMin} min · {bonus ? `+${Math.round(rutina.xpTotal * 1.25)}` : `+${rutina.xpTotal}`} XP
              </p>
              <p className="urs-phase-copy">{currentPhaseMeta.copy}</p>
              <button className="urs-btn" onClick={() => { startTimeRef.current = Date.now(); setPhase("ready"); }}>
                <PlayCircle size={16} />
                Empezar sesion
              </button>
            </motion.div>
          )}

          {phase === "ready" && paso && (
            <motion.div key={`ready-${stepIndex}-${seriesAct}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="urs-phase-block">
              <div className="urs-icon-badge" style={{ borderColor: `${color}44`, background: `${color}14` }}>
                {paso.imagen ? <span style={{ fontSize: 32 }}>{paso.imagen}</span> : <Play size={30} color={color} />}
              </div>
              <strong className="urs-phase-title">{paso.nombre}</strong>
              <p className="urs-phase-sub">Serie {seriesAct} de {paso.series} · {isTimer ? `${paso.duracion}s` : `${paso.reps} reps`} · {paso.verif}</p>
              <p className="urs-phase-copy">{currentPhaseMeta.copy}</p>
              <button className="urs-btn" onClick={() => { setTimerSec(isTimer ? paso.duracion || 30 : 0); setPhase("active"); }}>
                <PlayCircle size={16} />
                Iniciar tramo
              </button>
            </motion.div>
          )}

          {phase === "active" && paso && (
            <motion.div key={`active-${stepIndex}-${seriesAct}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="urs-phase-block">
              <div className="urs-ring">
                <svg width={160} height={160}>
                  <circle cx={80} cy={80} r={ringRadius} fill="none" stroke={`${color}22`} strokeWidth={8} />
                  <circle
                    cx={80} cy={80} r={ringRadius} fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - pct)}
                    style={{ transition: "stroke-dashoffset .9s linear" }}
                  />
                </svg>
                <div className="urs-ring-inner">
                  <strong style={{ color }}>{isTimer ? fmt(timerSec) : repsHechas}</strong>
                  <span>{isTimer ? "tiempo" : `de ${paso.reps} reps`}</span>
                </div>
              </div>
              <strong className="urs-phase-title" style={{ fontSize: 20 }}>{paso.nombre}</strong>
              <p className="urs-phase-sub">Serie {seriesAct}/{paso.series} · {paso.verif} · +{xpSerie} XP por serie</p>
              {!isTimer && usarCamara && (
                <div className="urs-camera-wrap">
                  <PoseCamera
                    ejercicio={paso}
                    targetReps={paso.reps || 1}
                    onRepsChange={(count) => setRepsHechas(count)}
                    onError={() => { setUsarCamara(false); setCameraError(true); }}
                  />
                </div>
              )}
              {!isTimer && !usarCamara && (
                <>
                  <div className="urs-rep-row">
                    <button className="urs-rep-btn" onClick={() => { setRepsHechas((c) => Math.max(0, c - 1)); onSessionModeChange?.("manual"); }}>−</button>
                    <span className="urs-rep-count">{repsHechas}<span className="urs-rep-max">/{paso.reps}</span></span>
                    <button className="urs-rep-btn" onClick={() => { setRepsHechas((c) => c + 1); onSessionModeChange?.("manual"); }}>+</button>
                  </div>
                  <div style={{ width: "100%", maxWidth: 260, margin: "8px auto 0" }}>
                    <MiniBar val={repsHechas} max={paso.reps || 1} color={color} height={6} />
                  </div>
                  {hasDetector && !cameraError && (
                    <button className="urs-btn-ghost" style={{ marginTop: 14 }} onClick={() => { if (needsCameraTip(paso?.nombre)) { setShowCamTip(true); } else { setUsarCamara(true); onSessionModeChange?.("camera"); } }}>
                      <Camera size={14} />
                      Activar camara
                    </button>
                  )}
                </>
              )}
              <div className="urs-actions">
                <button className="urs-btn" onClick={finishSerie}>
                  <Check size={14} />
                  Marcar serie
                </button>
              </div>
            </motion.div>
          )}

          {phase === "rest" && paso && (
            <motion.div key={`rest-${stepIndex}-${seriesAct}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="urs-phase-block">
              <div className="urs-ring">
                <svg width={160} height={160}>
                  <circle cx={80} cy={80} r={ringRadius} fill="none" stroke={`${UI.cyan}22`} strokeWidth={8} />
                  <circle
                    cx={80} cy={80} r={ringRadius} fill="none" stroke={UI.cyan} strokeWidth={8}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - restSec / Math.max(paso.descanso || 60, 1))}
                    style={{ transition: "stroke-dashoffset .9s linear" }}
                  />
                </svg>
                <div className="urs-ring-inner">
                  <strong style={{ color: UI.cyan }}>{restSec}s</strong>
                  <span>descanso</span>
                </div>
              </div>
              <strong className="urs-phase-title" style={{ fontSize: 20 }}>Respira y prepara</strong>
              <p className="urs-phase-copy" style={{ maxWidth: "32ch", margin: "0 auto 20px" }}>{restTip}</p>
              <button className="urs-btn-ghost" onClick={() => { clearInterval(intervalRef.current); nextSerieOrPaso(); }}>
                <ChevronRight size={14} />
                Saltar descanso
              </button>
            </motion.div>
          )}

          {phase === "next" && rutina.pasos[stepIndex + 1] && (
            <motion.div key={`next-${stepIndex}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="urs-phase-block">
              <div className="urs-icon-badge" style={{ borderColor: `${UI.success}44`, background: `${UI.success}14` }}>
                {rutina.pasos[stepIndex + 1].imagen
                  ? <span style={{ fontSize: 32 }}>{rutina.pasos[stepIndex + 1].imagen}</span>
                  : <Play size={30} color={UI.success} />}
              </div>
              <strong className="urs-phase-title">Paso completado</strong>
              <p className="urs-phase-sub">Siguiente: {rutina.pasos[stepIndex + 1].nombre}</p>
              <button className="urs-btn" style={{ "--btn-color": UI.success }} onClick={goNextPaso}>
                <PlayCircle size={14} />
                Continuar
              </button>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="urs-phase-block">
              <div className="urs-icon-badge" style={{ borderColor: `${UI.gold}44`, background: `${UI.gold}14` }}>
                <Trophy size={38} color={UI.gold} />
              </div>
              <strong className="urs-phase-title" style={{ color: UI.gold }}>Rutina cerrada</strong>
              <p className="urs-phase-copy">{currentPhaseMeta.copy}</p>
              <div className="urs-stats-grid">
                <div className="urs-stat"><strong style={{ color: UI.gold }}>+{xpAcum}</strong><span>XP ganado</span></div>
                <div className="urs-stat"><strong style={{ color }}>{completedIds.length}</strong><span>Pasos</span></div>
                <div className="urs-stat"><strong style={{ color: UI.cyan }}>{totalSeriesRef.current}</strong><span>Series</span></div>
                <div className="urs-stat"><strong style={{ color: UI.success }}>{rutina.duracionMin}</strong><span>Min</span></div>
              </div>
              <button
                className="urs-btn"
                style={{ "--btn-color": UI.gold }}
                onClick={() =>
                  onComplete(xpAcum, completedIds.length, totalSteps, {
                    duracionReal: startTimeRef.current ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000)) : rutina.duracionMin,
                    totalSeries: totalSeriesRef.current,
                    categoria: rutina.categoria,
                    musculos: catMuscles(rutina.categoria),
                    rutinaNombre: rutina.nombre,
                  })
                }
              >
                <Award size={14} />
                Reclamar progreso
              </button>
            </motion.div>
          )}
        </main>
      </div>
    </div>,
    document.body
  );
}
function faseSafety(value) {
  return value;
}

function RutinaCard({ rutina, profile, hoyDia, onView, onStart, viewMode = "cards", isFavorite = false, onToggleFavorite = null }) {
  const meta = getRutinaCategoryMeta(rutina.categoria);
  const difficultyColor = getDifficultyColorSafe(rutina.dificultad, meta.color);
  const classBonus = hasClsBonus(profile?.heroClass, rutina.subcategoria || rutina.categoria);
  const xpReward = classBonus ? Math.round(rutina.xpTotal * 1.25) : rutina.xpTotal;
  const isToday = rutina.diasSemana.includes(hoyDia);
  const rarity = getRutinaRarity(rutina, classBonus);
  const memory = getRoutineMemory(rutina);

  return (
    <article className={`urt-routine-card ${rutina.completadaHoy ? "is-done" : ""} ${viewMode === "list" ? "is-list" : ""}`} style={{ "--routine-color": meta.color, "--rarity-color": rarity.color }}>
      <div className="urt-routine-card-top">
        <div className="urt-routine-mark-wrap">
          <div className="urt-routine-mark" style={{ borderColor: `${meta.color}44`, background: `${meta.color}14` }}>
            <img src={meta.icon} alt="" />
          </div>
          <span className="urt-routine-rarity" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>{rarity.label}</span>
        </div>
        <div className="urt-routine-copy">
          <strong>{rutina.nombre}</strong>
          <span>{rutina.objetivo}</span>
        </div>
        <div className="urt-routine-top-actions">
          <button
            type="button"
            className={`urt-favorite-btn ${isFavorite ? "is-on" : ""}`}
            onClick={() => onToggleFavorite?.(rutina.id)}
            aria-label={isFavorite ? `Quitar ${rutina.nombre} de favoritas` : `Guardar ${rutina.nombre} en favoritas`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <div className="urt-routine-xp">+{xpReward} XP</div>
        </div>
      </div>

      <div className="urt-chip-row">
        <span className="urt-chip">{rutina.categoria}</span>
        {rutina.subcategoria && <span className="urt-chip">{rutina.subcategoria}</span>}
        <span className="urt-chip" style={{ color: difficultyColor, borderColor: `${difficultyColor}55` }}>{rutina.dificultad}</span>
        {classBonus && <span className="urt-chip is-focus">Afinidad</span>}
        {isToday && <span className="urt-chip">Hoy</span>}
        {isFavorite && <span className="urt-chip">Favorita</span>}
      </div>

      <div className="urt-routine-meta">
        <div>
          <small>Duracion</small>
          <strong>{rutina.duracionMin} min</strong>
        </div>
        <div>
          <small>Pasos</small>
          <strong>{rutina.pasos.length}</strong>
        </div>
        <div>
          <small>Registros</small>
          <strong>{rutina.completadas}</strong>
        </div>
      </div>

      <div className="urt-routine-memory">
        <div className="urt-routine-memory-item">
          <small>Ultima vez</small>
          <strong>{memory.lastLabel}</strong>
        </div>
        <div className="urt-routine-memory-item">
          <small>Mejor racha</small>
          <strong>{memory.streakLabel}</strong>
        </div>
        <div className="urt-routine-memory-item">
          <small>Mas jugada</small>
          <strong>{memory.playedLabel}</strong>
        </div>
      </div>

      <div className="urt-routine-days">
        <DiaChips dias={rutina.diasSemana} color={meta.color} small hoyDia={hoyDia} />
      </div>

      <div className="urt-routine-footer">
        <div>
          <strong>{rutina.completadaHoy ? "Zona despejada hoy" : rutina.asignada ? "Asignada al plan" : "Ruta disponible"}</strong>
          <p>
            {rutina.ultimoCompletado && !rutina.completadaHoy
              ? `Ultimo cierre ${diasDesde(rutina.ultimoCompletado)}`
              : rutina.completadaHoy
                ? "Ya se registro progreso hoy."
                : "Lista para entrar cuando quieras."}
          </p>
        </div>
        <div className="urt-card-actions">
          <button className="urt-btn-ghost" onClick={() => onView(rutina)}>
            <Search size={14} />
            Detalle
          </button>
          <button className="urt-btn" onClick={() => onStart(rutina)}>
            <PlayCircle size={14} />
            {rutina.completadaHoy ? "Repetir" : "Iniciar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function UserRutinas({ profile, onNavigate }) {
  const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";
  const isMobile = useIsMobile();
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState(() => (typeof window === "undefined" ? "mis" : window.localStorage.getItem("ur:tab") || "mis"));
  const [search, setSearch] = useState("");
  const [filterDif, setFilterDif] = useState("all");
  const [filterHoy, setFilterHoy] = useState(false);
  const [sortMode, setSortMode] = useState(() => (typeof window === "undefined" ? "default" : window.localStorage.getItem(SORT_KEY) || "default"));
  const [viewMode, setViewMode] = useState(() => (typeof window === "undefined" ? "cards" : window.localStorage.getItem(VIEW_KEY) || "cards"));
  const [favoriteIds, setFavoriteIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [detalleRut, setDetalleRut] = useState(null);
  const [sesionRut, setSesionRut] = useState(null);
  const [xpNotif, setXpNotif] = useState(null);
  const [logroNotif, setLogroNotif] = useState(null);
  const [completionToast, setCompletionToast] = useState(null);
  const [camPermError, setCamPermError] = useState(null);
  const [selectedCat, setSelectedCat] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem("ur:selected-cat") || ""));
  const [preferredTerritory, setPreferredTerritory] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem(TERRITORY_PREF_KEY) || ""));
  const [preferredSessionType, setPreferredSessionType] = useState(() => (typeof window === "undefined" ? "auto" : window.localStorage.getItem(SESSION_PREF_KEY) || "auto"));

  const classKey = normalizeRutinaClass(profile?.heroClass);
  const theme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const copy = CLASS_COPY[classKey] || CLASS_COPY.DEFAULT;
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const hoyDia = DIAS[todayIdx];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (authUser) => setUser(authUser));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const progressRef = collection(db, "users", user.uid, "progress");
        const progressSnap = await getDocs(progressRef);
        const userProgress = {};
        progressSnap.forEach((docSnap) => {
          userProgress[docSnap.id] = docSnap.data();
        });

        const response = await getRutinasPublicas(token);
        if (response?.rutinas?.length > 0) {
          setRutinas(response.rutinas.map((rutina) => normalizarRutina(rutina, userProgress)));
        } else {
          setRutinas(RUTINAS_MOCK.map((rutina) => normalizarRutina(rutina)));
        }
      } catch (error) {
        console.error("Error cargando rutinas:", error);
        setRutinas(RUTINAS_MOCK.map((rutina) => normalizarRutina(rutina)));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ur:tab", tab);
    if (selectedCat) window.localStorage.setItem("ur:selected-cat", selectedCat);
    window.localStorage.setItem(VIEW_KEY, viewMode);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    if (preferredTerritory) window.localStorage.setItem(TERRITORY_PREF_KEY, preferredTerritory);
    window.localStorage.setItem(SESSION_PREF_KEY, preferredSessionType);
  }, [favoriteIds, preferredSessionType, preferredTerritory, selectedCat, tab, viewMode]);

  const chooseTerritory = useCallback((cat, remember = true) => {
    setSelectedCat(cat);
    if (remember) setPreferredTerritory(cat);
  }, []);

  const filtradas = useMemo(() => {
    return rutinas.filter((rutina) => {
      if (filterDif !== "all" && rutina.dificultad !== filterDif) return false;
      if (search) {
        const term = search.toLowerCase();
        const match =
          rutina.nombre.toLowerCase().includes(term) ||
          (rutina.categoria || "").toLowerCase().includes(term) ||
          (rutina.subcategoria || "").toLowerCase().includes(term) ||
          (rutina.objetivo || "").toLowerCase().includes(term);
        if (!match) return false;
      }
      if (filterHoy && !rutina.diasSemana.includes(hoyDia)) return false;
      return true;
    });
  }, [filterDif, filterHoy, hoyDia, rutinas, search]);

  const misRutinas = useMemo(() => filtradas.filter((rutina) => rutina.asignada), [filtradas]);
  const fuente = tab === "mis" ? misRutinas : filtradas;

  const sortedFuente = useMemo(() => {
    return [...fuente].sort((left, right) => {
      switch (sortMode) {
        case "hoy": {
          const leftToday = left.diasSemana.includes(hoyDia) ? 0 : 1;
          const rightToday = right.diasSemana.includes(hoyDia) ? 0 : 1;
          return leftToday - rightToday;
        }
        case "xp":
          return right.xpTotal - left.xpTotal;
        case "menosCompl":
          return (left.completadas || 0) - (right.completadas || 0);
        case "duracion":
          return left.duracionMin - right.duracionMin;
        default:
          return 0;
      }
    });
  }, [fuente, hoyDia, sortMode]);

  const grouped = useMemo(() => {
    const map = new Map();
    sortedFuente.forEach((rutina) => {
      const key = rutina.categoria || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(rutina);
    });
    return Array.from(map.entries()).map(([cat, ruts]) => ({
      cat,
      ruts,
      meta: getRutinaCategoryMeta(cat),
    }));
  }, [sortedFuente]);

  const territoryCards = useMemo(() => {
    return [
      {
        cat: "Todas",
        ruts: sortedFuente,
        meta: {
          key: "general",
          label: "Mapa completo",
          short: "General",
          icon: "/ui/header/section-rutinas.png",
          banner: "/exercises/zones/zone-general-banner.png",
          color: theme.accent,
          summary: "Toda la mesa de rutinas abierta para entrar por prioridad, dia o territorio.",
        },
      },
      ...grouped,
    ];
  }, [grouped, sortedFuente, theme.accent]);

  const selectedTerritory = territoryCards.find((territory) => territory.cat === selectedCat) || territoryCards[0] || null;
  const selectedRoutines = useMemo(() => {
    if (!selectedTerritory || selectedTerritory.cat === "Todas") return sortedFuente;
    return sortedFuente.filter((rutina) => rutina.categoria === selectedTerritory.cat);
  }, [selectedTerritory, sortedFuente]);
  const rutinasHoy = useMemo(() => misRutinas.filter((rutina) => rutina.diasSemana.includes(hoyDia)), [hoyDia, misRutinas]);
  const completadasHoy = rutinas.filter((rutina) => rutina.completadaHoy).length;
  const completadasEstaSemana = misRutinas.filter((rutina) => rutina.completadaEstaSemana).length;
  const daysPassed = DIAS.slice(0, todayIdx + 1);
  const expectedThisWeek = misRutinas.reduce((sum, rutina) => sum + rutina.diasSemana.filter((day) => daysPassed.includes(day)).length, 0);
  const weekProgressPct = expectedThisWeek ? Math.min((completadasEstaSemana / expectedThisWeek) * 100, 100) : 0;
  const totalXpEarned = rutinas.reduce((sum, rutina) => sum + (rutina.completadas || 0) * rutina.xpTotal, 0);
  const totalMinutes = rutinas.reduce((sum, rutina) => sum + (rutina.completadas || 0) * rutina.duracionMin, 0);
  const totalActive = rutinas.filter((rutina) => rutina.activo !== false).length;
  const streak = Number(profile?.streak ?? profile?.racha ?? profile?.currentStreak ?? 0);
  const recommendationPool = useMemo(() => {
    const base = misRutinas.length ? misRutinas : rutinas.filter((rutina) => rutina.activo !== false);
    return base.length ? base : rutinas;
  }, [misRutinas, rutinas]);
  const recentCompleted = useMemo(() => {
    return [...rutinas]
      .filter((rutina) => rutina.ultimoCompletado)
      .sort((left, right) => new Date(right.ultimoCompletado).getTime() - new Date(left.ultimoCompletado).getTime());
  }, [rutinas]);
  const recommendationModel = useMemo(() => {
    const lastRoutine = recentCompleted[0] || null;
    const lastZoneKey = lastRoutine ? getRoutineZoneKey(lastRoutine) : "";
    const recentWindow = recentCompleted.slice(0, 5);
    const fatigueByZone = recentWindow.reduce((acc, rutina, index) => {
      const zoneKey = getRoutineZoneKey(rutina);
      const weight = Math.max(1, 5 - index);
      acc[zoneKey] = (acc[zoneKey] || 0) + weight;
      return acc;
    }, {});
    let consecutiveZoneCount = 0;
    if (lastZoneKey) {
      for (const rutina of recentCompleted) {
        if (getRoutineZoneKey(rutina) === lastZoneKey) consecutiveZoneCount += 1;
        else break;
      }
    }

    const preferredZoneKey =
      preferredTerritory && preferredTerritory !== "Todas"
        ? getRutinaCategoryMeta(preferredTerritory).key
        : "";

    const ranked = recommendationPool.map((rutina) => {
      const zoneKey = getRoutineZoneKey(rutina);
      const modeKey = getRoutineEquipmentKey(rutina);
      const classMatch = hasClsBonus(classKey, rutina.subcategoria || rutina.categoria);
      const isTodayAssigned = rutina.diasSemana.includes(hoyDia);
      const sameAsLast = lastRoutine?.id === rutina.id;
      const sameZoneAsLast = lastZoneKey && zoneKey === lastZoneKey;
      const fatigue = fatigueByZone[zoneKey] || 0;
      const isRecoveryZone = ["flexibilidad", "funcional"].includes(zoneKey);
      const shortRoute = rutina.duracionMin <= 25;
      const easierRoute = normalizeLooseText(rutina.dificultad).includes("prin") || normalizeLooseText(rutina.dificultad).includes("inter");

      let score = 0;
      const reasons = [];

      if (rutina.asignada) {
        score += 12;
        reasons.push("Asignada a tu plan");
      }
      if (isTodayAssigned) {
        score += 16;
        reasons.push("Activa hoy");
      }
      if (!rutina.completadaHoy) {
        score += 8;
      } else {
        score -= 18;
      }
      if (classMatch) {
        score += streak >= 5 ? 18 : 12;
        reasons.push("Afin a tu clase");
      }
      if (preferredZoneKey && preferredZoneKey === zoneKey) {
        score += 10;
        reasons.push("Territorio que sueles elegir");
      }
      if (preferredSessionType !== "auto") {
        if (preferredSessionType === "manual" && modeKey !== "camera") {
          score += 7;
          reasons.push("Respeta tu modo manual");
        } else if (preferredSessionType === modeKey) {
          score += 8;
          reasons.push("Coincide con tu modo favorito");
        } else if (preferredSessionType === "camera" && modeKey === "mixed") {
          score += 4;
        }
      }
      if (sameAsLast) {
        score -= 18;
      }
      if (sameZoneAsLast) {
        score -= 8 + Math.min(consecutiveZoneCount * 3, 12);
      }
      score -= fatigue * 1.8;
      if (consecutiveZoneCount >= 2 && sameZoneAsLast) {
        reasons.push("La zona ya viene cargada");
      }

      if (completadasHoy > 0) {
        if (isRecoveryZone) {
          score += 18;
          reasons.push("Buena ruta de recuperacion");
        }
        if (shortRoute) {
          score += 12;
          reasons.push("Remate corto");
        }
        if (!sameZoneAsLast) {
          score += 8;
        }
        if (!isRecoveryZone && !shortRoute) {
          score -= 12;
        }
      } else {
        if (streak <= 1 && shortRoute) {
          score += 8;
          reasons.push("Entrada facil de retomar");
        }
        if (streak >= 4 && classMatch && !easierRoute) {
          score += 6;
        }
      }

      if (!lastRoutine && classMatch) {
        score += 10;
      }

      return { rutina, score, reasons, zoneKey, modeKey };
    }).sort((left, right) => right.score - left.score);

    const todayPick = ranked.find((entry) => entry.rutina.diasSemana.includes(hoyDia) && !entry.rutina.completadaHoy);
    const recoveryPick = ranked.find((entry) => ["flexibilidad", "funcional"].includes(entry.zoneKey) && entry.rutina.duracionMin <= 30 && !entry.rutina.completadaHoy);
    const shortFinisher = ranked.find((entry) => entry.rutina.duracionMin <= 25 && !entry.rutina.completadaHoy);
    const bestOverall = ranked[0] || null;

    const recommended =
      completadasHoy > 0
        ? recoveryPick?.rutina || shortFinisher?.rutina || bestOverall?.rutina || null
        : todayPick?.rutina || bestOverall?.rutina || null;

    const activeEntry = ranked.find((entry) => entry.rutina.id === recommended?.id) || bestOverall || null;

    return {
      ranked,
      recommended,
      activeEntry,
      lastRoutine,
      lastZoneKey,
      fatigueByZone,
      consecutiveZoneCount,
    };
  }, [classKey, completadasHoy, hoyDia, preferredSessionType, preferredTerritory, recommendationPool, recentCompleted, streak]);

  const dailyRut = recommendationModel.recommended || rutinasHoy[0] || recommendationPool[0] || null;
  const heroRoutine = dailyRut || selectedRoutines[0] || sortedFuente[0] || null;
  const featuredRoutine = useMemo(() => {
    const territoryKey = selectedTerritory?.cat === "Todas" ? null : getRutinaCategoryMeta(selectedTerritory?.cat || "General").key;
    const rankedTerritory = recommendationModel.ranked.filter((entry) => !territoryKey || entry.zoneKey === territoryKey);
    return rankedTerritory[0]?.rutina || selectedRoutines.find((rutina) => !rutina.completadaHoy) || selectedRoutines[0] || heroRoutine;
  }, [heroRoutine, recommendationModel.ranked, selectedRoutines, selectedTerritory]);
  const recommendedCategory = recommendationModel.recommended?.categoria || "";
  const recommendationReasonText = recommendationModel.activeEntry?.reasons?.length
    ? recommendationModel.activeEntry.reasons.slice(0, 3).join(" · ")
    : "Elegida por tu progreso reciente.";

  useEffect(() => {
    if (!territoryCards.length) return;
    const exists = territoryCards.some((territory) => territory.cat === selectedCat);
    if (exists) return;
    const focus =
      territoryCards.find((territory) => territory.cat === preferredTerritory) ||
      territoryCards.find((territory) => territory.cat === recommendedCategory) ||
      territoryCards.find((territory) => territory.cat !== "Todas" && hasClsBonus(classKey, territory.cat)) ||
      territoryCards.find((territory) => territory.cat !== "Todas") ||
      territoryCards[0];
    if (focus) setSelectedCat(focus.cat);
  }, [classKey, preferredTerritory, recommendedCategory, selectedCat, territoryCards]);

  const heroStatus = useMemo(() => {
    if (loading) {
      return {
        Ico: Activity,
        color: theme.accent,
        text: "Sincronizando tablero del gremio...",
        sub: "Leyendo progresos, campanas y disponibilidad del dia.",
      };
    }
    if (completadasHoy > 0) {
      return {
        Ico: Trophy,
        color: UI.success,
        text: completadasHoy > 1 ? `${completadasHoy} rutas ya quedaron cerradas hoy.` : "Ya despejaste una ruta hoy.",
        sub: "Puedes rematar con una campana corta o guardar energia para la siguiente rotacion.",
      };
    }
    if (rutinasHoy.length > 0) {
      return {
        Ico: Flame,
        color: UI.gold,
        text: `${rutinasHoy.length} rutinas te estan esperando hoy.`,
        sub: rutinasHoy.map((rutina) => rutina.nombre).slice(0, 2).join(" · "),
      };
    }
    return {
      Ico: Heart,
      color: theme.accent,
      text: "Hoy no hay una campana fija, pero el mapa sigue abierto.",
      sub: "Explora una zona afin a tu clase y manten vivo el ritmo semanal.",
    };
  }, [completadasHoy, loading, rutinasHoy, theme.accent]);

  const exploredZones = new Set(rutinas.filter((rutina) => (rutina.completadas || 0) > 0).map((rutina) => rutina.categoria || "General")).size;
  const clearedRoutes = rutinas.filter((rutina) => (rutina.completadas || 0) > 0).length;
  const summaryGroups = [
    {
      key: "volumen",
      title: "Volumen",
      hint: "Carga que el hero ya movio en esta etapa del mapa.",
      foot: totalMinutes > 0 ? "Cuenta tiempo real y experiencia conseguida." : "Aun no hay trabajo acumulado en esta etapa.",
      color: theme.secondary,
      asset: "/exercises/summary/sum-minutes.png",
      metrics: [
        {
          label: "Tiempo forjado",
          value: `${totalMinutes} min`,
          hint: "Trabajo total",
          color: theme.secondary,
          asset: "/exercises/summary/sum-minutes.png",
        },
        {
          label: "XP fisico",
          value: totalXpEarned,
          hint: "Experiencia conseguida",
          color: UI.cyan,
          asset: "/exercises/summary/sum-xp.png",
        },
      ],
    },
    {
      key: "consistencia",
      title: "Consistencia",
      hint: "Ritmo del plan y permanencia dentro de la semana activa.",
      foot: expectedThisWeek ? `${completadasEstaSemana} entradas limpias sobre ${expectedThisWeek} esperadas.` : "Todavia no hay objetivo semanal cargado.",
      color: UI.gold,
      asset: "/exercises/summary/sum-repeat.png",
      metrics: [
        {
          label: "Pulso semanal",
          value: `${completadasEstaSemana}/${expectedThisWeek || 0}`,
          hint: expectedThisWeek ? "Avance real" : "Sin meta semanal",
          color: UI.gold,
          asset: "/exercises/summary/sum-chart.png",
        },
        {
          label: "Racha activa",
          value: `${streak} d`,
          hint: streak > 0 ? "Cadena vigente" : "Sin cadena activa",
          color: theme.accent,
          asset: "/exercises/summary/sum-repeat.png",
        },
      ],
    },
    {
      key: "progreso",
      title: "Progreso real",
      hint: "Cuanto territorio ya dejo huella y cuanta mesa sigue abierta.",
      foot: clearedRoutes > 0 ? `${clearedRoutes} rutas ya tienen memoria en el tablero.` : "El tablero sigue limpio, sin rutas reclamadas aun.",
      color: theme.accent,
      asset: "/exercises/summary/sum-zones.png",
      metrics: [
        {
          label: "Campanas activas",
          value: misRutinas.length || totalActive,
          hint: "Rutas listas",
          color: theme.accent,
          asset: "/ui/icons/zone-flag.png",
        },
        {
          label: "Zonas tocadas",
          value: `${exploredZones}/${Math.max(grouped.length, 1)}`,
          hint: exploredZones > 0 ? "Territorio con memoria" : "Aun sin explorar",
          color: UI.success,
          asset: "/exercises/summary/sum-zones.png",
        },
      ],
    },
  ];
  const trainingState = completadasHoy > 0 ? "cleared" : sesionRut ? "active" : "idle";
  const dailyRewardType = completadasHoy > 0
    ? "claimed"
    : hasClsBonus(classKey, dailyRut?.subcategoria || dailyRut?.categoria || "")
      ? "classBonus"
      : "xp";
  const dailyRouteNodes = [
    {
      id: "preparar",
      label: "Preparar",
      done: completadasHoy > 0,
      active: trainingState === "idle",
      icon: Calendar,
    },
    {
      id: "entrenar",
      label: "Entrenar",
      done: completadasHoy > 0,
      active: trainingState === "active",
      icon: Play,
    },
    {
      id: "reclamar",
      label: "Reclamar",
      done: completadasHoy > 0,
      active: trainingState === "cleared",
      icon: Award,
    },
  ];
  const territoryProgress = selectedTerritory?.ruts?.length
    ? Math.round((selectedTerritory.ruts.filter((rutina) => rutina.completadas > 0).length / selectedTerritory.ruts.length) * 100)
    : 0;
  const orderRoutine = dailyRut || featuredRoutine;
  const orderZoneMeta = getRutinaCategoryMeta(orderRoutine?.categoria || selectedTerritory?.cat || "General");
  const classFocusSummary = (theme.focusZones || [])
    .map((zone) => getRutinaCategoryMeta(zone).short || getRutinaCategoryMeta(zone).label)
    .slice(0, 2)
    .join(" · ");
  const classBonusActive = orderRoutine ? hasClsBonus(classKey, orderRoutine.subcategoria || orderRoutine.categoria) : false;
  const guildAlert = completadasHoy > 0
    ? {
        label: "Estado del heroe",
        title: "Cuerpo ya activado",
        text: "Ya despejaste una ruta hoy. Cierra con una entrada corta o descansa sin forzar.",
        asset: RUTINA_DAILY_ASSETS.state.cleared,
        accent: UI.success,
        chips: [`${completadasHoy} hoy`, streak > 0 ? `${streak} dias de racha` : "Ritmo retomado"],
        note: "Tu escena cambia porque hoy si entrenaste.",
      }
    : sesionRut
      ? {
          label: "Alerta del cuerpo",
          title: "Sesion en marcha",
          text: "Termina esta ruta antes de cambiar de zona o sumar otra carga.",
          asset: RUTINA_DAILY_ASSETS.state.active,
          accent: theme.accent,
          chips: ["Sesion abierta", orderRoutine?.duracionMin ? `${orderRoutine.duracionMin} min` : "Ruta activa"],
          note: "Prioriza continuidad: termina lo que empezaste.",
        }
      : {
          label: "Alerta del cuerpo",
          title: "Listo para entrar",
          text: rutinasHoy.length > 0
            ? "Tienes rutas listas hoy. Empieza con una afin a tu clase."
            : "Sin orden fija hoy: entra por una zona suave y manten tu racha.",
          asset: RUTINA_DAILY_ASSETS.state.idle,
          accent: UI.gold,
          chips: [rutinasHoy.length > 0 ? `${rutinasHoy.length} rutas hoy` : "Dia flexible", streak > 0 ? `${streak} dias de racha` : "Sin racha"],
          note: "Entrena ahora y mejoras las recomendaciones de manana.",
        };

  const startSession = useCallback(async (rutina) => {
    setCamPermError(null);
    if (!rutina.pasos || rutina.pasos.length === 0) {
      setCamPermError("noEjercicios");
      return;
    }
    const needsCam = rutina.pasos.some((paso) => normalizeLooseText(paso.verif).includes("camara"));
    if (needsCam && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        const isDenied = error.name === "NotAllowedError" || error.name === "PermissionDeniedError";
        setCamPermError(isDenied ? "denied" : "error");
      }
    }
    const modeKey = getRoutineEquipmentKey(rutina);
    if (modeKey === "timer") setPreferredSessionType("timer");
    chooseTerritory(rutina.categoria, true);
    setSesionRut(rutina);
  }, [chooseTerritory]);

  const handleComplete = async (xp, completedCount, totalCount, sessionData = {}) => {
    if (!user || !sesionRut) return;
    if (typeof completedCount === "number" && typeof totalCount === "number" && completedCount < totalCount) {
      setSesionRut(null);
      return;
    }
    const rutinaId = sesionRut.id;
    try {
      const token = await user.getIdToken();
      const result = await completarRutina(token, {
        rutinaId,
        xpGanado: xp,
        tiempoRealizado: sessionData.duracionReal || null,
        totalSeries: sessionData.totalSeries || null,
      });
      const finalXp = result.xpGanado || xp;
      const newWeeklyStreak = result.weeklyStreak ?? (sesionRut.weeklyStreak >= 1 ? sesionRut.weeklyStreak : 1);
      setRutinas((current) =>
        current.map((rutina) =>
          rutina.id === rutinaId
            ? {
                ...rutina,
                completadas: result.completadas !== undefined ? result.completadas : rutina.completadas + 1,
                completadaHoy: true,
                completadaEstaSemana: true,
                weeklyStreak: newWeeklyStreak,
                ultimoCompletado: new Date().toISOString(),
              }
            : rutina,
        ),
      );
      setSesionRut(null);
      setCompletionToast({
        rutinaNombre: sessionData.rutinaNombre || sesionRut.nombre,
        categoria: sessionData.categoria || sesionRut.categoria,
        musculos: sessionData.musculos || catMuscles(sesionRut.categoria),
        duracionReal: sessionData.duracionReal || sesionRut.duracionMin,
        totalSeries: sessionData.totalSeries || 0,
        totalEjs: completedCount,
        xp: finalXp,
        leveledUp: result.leveledUp,
        newLevel: result.level,
        weeklyStreak: newWeeklyStreak,
      });
      setTimeout(() => setCompletionToast(null), 7000);
      if (result.leveledUp) {
        setXpNotif({ xp: finalXp, leveledUp: true, newLevel: result.level });
        setTimeout(() => setXpNotif(null), 4500);
      }
      if (Array.isArray(result.newAchievements) && result.newAchievements.length > 0) {
        result.newAchievements.forEach((ach, i) => {
          setTimeout(() => {
            setLogroNotif(ach);
            setTimeout(() => setLogroNotif(null), 3200);
          }, i * 1400);
        });
      }
      window.dispatchEvent(new CustomEvent("exerciseCompleted", {
        detail: {
          rutinaId,
          xp: result.xpGanado || xp,
          leveledUp: result.leveledUp,
          weeklyXP: result.weeklyXP,
          streak: result.streak,
          newAchievements: result.newAchievements || [],
        },
      }));
      if (result.leveledUp) {
        window.dispatchEvent(new CustomEvent("levelUp", { detail: result }));
      }
    } catch (error) {
      console.error("Error completando rutina:", error);
      setRutinas((current) =>
        current.map((rutina) =>
          rutina.id === rutinaId
            ? {
                ...rutina,
                completadas: rutina.completadas + 1,
                completadaHoy: true,
                completadaEstaSemana: true,
                ultimoCompletado: new Date().toISOString(),
              }
            : rutina,
        ),
      );
      setSesionRut(null);
      setXpNotif({ xp, leveledUp: false, newLevel: null });
      setTimeout(() => setXpNotif(null), 2500);
    }
  };

  const weekStrip = DIAS.map((day, index) => {
    const assigned = misRutinas.filter((rutina) => rutina.diasSemana.includes(day)).length;
    return {
      day,
      assigned,
      isToday: index === todayIdx,
      isPast: index < todayIdx,
      completed: index === todayIdx ? completadasHoy > 0 : false,
      pressure: assigned >= 3 ? "Alta" : assigned >= 2 ? "Media" : assigned >= 1 ? "Ligera" : "Libre",
    };
  });
  const weekChartMax = Math.max(1, ...weekStrip.map((item) => item.assigned));
  const weekChartPoints = weekStrip
    .map((item, index) => {
      const x = weekStrip.length === 1 ? 50 : (index / (weekStrip.length - 1)) * 100;
      const y = 100 - (item.assigned / weekChartMax) * 82;
      return `${x},${y}`;
    })
    .join(" ");
  const weekChartArea = `0,100 ${weekChartPoints} 100,100`;
  const libraryRoutines = selectedTerritory?.cat === "Todas" ? sortedFuente : selectedRoutines;
  const favoriteRoutines = useMemo(() => {
    const favs = libraryRoutines.filter((rutina) => favoriteIds.includes(rutina.id));
    return favs.slice(0, 4);
  }, [favoriteIds, libraryRoutines]);
  const campaignRoutines = useMemo(() => {
    return recommendationModel.ranked
      .filter((entry) => libraryRoutines.some((rutina) => rutina.id === entry.rutina.id))
      .slice(0, 4)
      .map((entry) => entry.rutina);
  }, [libraryRoutines, recommendationModel.ranked]);

  const toggleFavorite = useCallback((rutinaId) => {
    setFavoriteIds((current) => (current.includes(rutinaId) ? current.filter((id) => id !== rutinaId) : [...current, rutinaId]));
  }, []);

  useEffect(() => {
    const consumeChatDeepLink = (payload) => {
      if (!payload) return false;
      const section = String(payload.section || "").toLowerCase();
      if (section && section !== "rutinas") return false;
      const rutinaId = payload.rutinaId || payload.entityId || null;
      if (!rutinaId) return false;
      const rutina = rutinas.find((entry) => entry.id === rutinaId);
      if (!rutina) return false;
      setDetalleRut(rutina);
      return true;
    };

    const consumeStored = () => {
      try {
        const raw = window.sessionStorage.getItem(CHAT_DEEPLINK_KEY);
        if (!raw) return;
        const payload = JSON.parse(raw);
        if (consumeChatDeepLink(payload)) {
          window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY);
        }
      } catch {}
    };

    const onChatDeepLink = (event) => {
      if (consumeChatDeepLink(event.detail || null)) {
        try { window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY); } catch {}
      }
    };

    consumeStored();
    window.addEventListener("chatGameplayLink", onChatDeepLink);
    return () => window.removeEventListener("chatGameplayLink", onChatDeepLink);
  }, [rutinas]);

  const panelMotion = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <>
      <style>{PAGE_CSS}</style>

      {detalleRut && <RutinaDetailModal rutina={detalleRut} profile={profile} onClose={() => setDetalleRut(null)} onStart={startSession} />}
      {sesionRut && (
        <RutinaSessionModal
          rutina={sesionRut}
          profile={profile}
          onClose={() => setSesionRut(null)}
          onComplete={handleComplete}
          preferredSessionType={preferredSessionType}
          onSessionModeChange={setPreferredSessionType}
        />
      )}

      {camPermError && !sesionRut && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 500, maxWidth: 460, width: "calc(100% - 32px)" }}>
          <div style={{ background: "#161122", border: `1px solid ${camPermError === "denied" ? "#ff6f7d66" : "#f3c96966"}`, borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 12px 34px rgba(0,0,0,.55)" }}>
            {camPermError === "denied" ? <X size={18} color="#ff6f7d" /> : <AlertTriangle size={18} color="#f3c969" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 15, fontWeight: 700, color: UI.text, marginBottom: 2 }}>
                {camPermError === "denied" ? "Camara bloqueada" : camPermError === "noEjercicios" ? "Rutina sin pasos" : "No pudimos usar la camara"}
              </div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: UI.muted }}>
                {camPermError === "denied"
                  ? "Necesitas permitir acceso a camara para contar repeticiones en esta ruta."
                  : camPermError === "noEjercicios"
                    ? "Esta rutina no tiene ejercicios cargados todavia."
                    : "La sesion puede seguir, pero toca cambiar a conteo manual o timer."}
              </div>
            </div>
            <button onClick={() => setCamPermError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: UI.muted, display: "flex" }} aria-label="Cerrar aviso de camara">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {xpNotif && (
        <div style={{ position: "fixed", top: "50%", left: "50%", zIndex: 400, pointerEvents: "none", textAlign: "center", animation: "ur-xpPop 2.4s ease forwards", transform: "translate(-50%,-50%)" }}>
          {xpNotif.leveledUp ? (
            <div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 40, fontWeight: 900, color: UI.gold, textShadow: "0 0 40px rgba(243,201,105,.7)" }}>Nivel arriba</div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 22, fontWeight: 700, color: UI.text, marginTop: 8 }}>Nivel {xpNotif.newLevel}</div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 18, fontWeight: 600, color: UI.gold, marginTop: 4 }}>+{xpNotif.xp} XP</div>
            </div>
          ) : (
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 36, fontWeight: 900, color: UI.gold, textShadow: "0 0 30px rgba(243,201,105,.55)" }}>+{xpNotif.xp} XP</div>
          )}
        </div>
      )}

      {logroNotif && (
        <div style={{ position: "fixed", bottom: 30, right: 24, zIndex: 500, maxWidth: 320 }}>
          <div style={{ background: "#161122", border: "1px solid rgba(243,201,105,.38)", boxShadow: "0 0 30px rgba(243,201,105,.16), 0 8px 32px rgba(0,0,0,.8)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, borderRadius: 18 }}>
            <div style={{ width: 52, height: 52, background: "rgba(243,201,105,.14)", border: "1px solid rgba(243,201,105,.38)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, flexShrink: 0 }}>
              <Award size={26} color={UI.gold} />
            </div>
            <div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 700, color: UI.gold, marginBottom: 4 }}>Logro del gremio</div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 900, color: UI.text, marginBottom: 3 }}>{logroNotif.nombre}</div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: UI.muted }}>{logroNotif.rareza}</div>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {completionToast && (
          <motion.div key="rutina-toast" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="urt-toast">
            <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${catColor(completionToast.categoria)}, ${UI.gold}, ${catColor(completionToast.categoria)}, transparent)` }} />
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, background: `${catColor(completionToast.categoria)}18`, border: `1px solid ${catColor(completionToast.categoria)}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 12 }}>
                  <Trophy size={18} color={catColor(completionToast.categoria)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 700, color: UI.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{completionToast.rutinaNombre}</div>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: catColor(completionToast.categoria) }}>{completionToast.categoria} · {completionToast.musculos}</div>
                </div>
                <button onClick={() => setCompletionToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: UI.muted, display: "flex", flexShrink: 0 }} aria-label="Cerrar resumen">
                  <X size={13} />
                </button>
              </div>
              <div className="urt-modal-grid">
                <div className="urt-modal-stat">
                  <strong style={{ color: UI.gold }}>+{completionToast.xp}</strong>
                  <span>XP</span>
                </div>
                <div className="urt-modal-stat">
                  <strong style={{ color: catColor(completionToast.categoria) }}>{completionToast.totalSeries || "â€”"}</strong>
                  <span>Series</span>
                </div>
                <div className="urt-modal-stat">
                  <strong style={{ color: UI.cyan }}>{completionToast.duracionReal}</strong>
                  <span>Min</span>
                </div>
                <div className="urt-modal-stat">
                  <strong style={{ color: UI.success }}>{completionToast.totalEjs}</strong>
                  <span>Pasos</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="urt-page" style={{ "--class-accent": theme.accent, "--class-secondary": theme.secondary }}>
        <URBackground color={theme.accent} />

        <div className="urt-shell">
          <motion.section className="urt-panel urt-hero" {...panelMotion}>
            <div className="urt-hero-copy">
              <div className="urt-kicker">
                <img src="/ui/header/section-rutinas.png" alt="" />
                <span>Campo de rutinas</span>
              </div>

              <h1>{copy.title} <span>con un mapa que si se siente de aventura.</span></h1>
              <p>{copy.lead}</p>

              <div className="urt-chip-row">
                <span className="urt-chip is-focus">
                  <img src={theme.crest} alt="" />
                  Clase {theme.label}
                </span>
                <span className="urt-chip">
                  <Flame size={14} />
                  Racha actual: {streak} dias
                </span>
                <span className="urt-chip">
                  <Award size={14} />
                  {copy.focus}
                </span>
              </div>

              <div className="urt-hero-status" style={{ "--status-color": heroStatus.color }}>
                <div className="urt-status-icon">
                  <heroStatus.Ico size={18} color={heroStatus.color} />
                </div>
                <div>
                  <strong>{heroStatus.text}</strong>
                  <p>{heroStatus.sub}</p>
                </div>
              </div>

              <div className="urt-actions">
                <button className="urt-btn" onClick={() => heroRoutine && startSession(heroRoutine)} disabled={!heroRoutine}>
                  <PlayCircle size={16} />
                  {heroRoutine?.completadaHoy ? "Volver a la ruta" : "Entrar a la siguiente ruta"}
                </button>
                {onNavigate && (
                  <button className="urt-btn-ghost" onClick={() => onNavigate("dashboard")}>
                    <ChevronRight size={16} />
                    Volver al home
                  </button>
                )}
              </div>

              <div className="urt-hero-kpis">
                <div className="urt-kpi">
                  <strong>{misRutinas.length || totalActive}</strong>
                  <span>rutas activas</span>
                </div>
                <div className="urt-kpi">
                  <strong>{completadasHoy}</strong>
                  <span>despejadas hoy</span>
                </div>
                <div className="urt-kpi">
                  <strong>{totalXpEarned}</strong>
                  <span>xp fisico</span>
                </div>
                <div className="urt-kpi">
                  <strong>{selectedRoutines.length}</strong>
                  <span>en la zona actual</span>
                </div>
              </div>
            </div>
          </motion.section>

          {dailyRut && (
            <motion.section className="urt-panel urt-band" {...panelMotion}>
              <div className="urt-band-visual">
                <img
                  className="urt-band-state"
                  src={RUTINA_DAILY_ASSETS.state[trainingState]}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src = getRutinaCategoryMeta(dailyRut.categoria).icon;
                  }}
                />
                <img
                  className="urt-band-reward"
                  src={RUTINA_DAILY_ASSETS.reward[dailyRewardType]}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="urt-band-copy">
                <div className="urt-kicker">
                  <img src="/ui/icons/map-pin.png" alt="" />
                  <span>Hoy el mapa recomienda</span>
                </div>
                <h2>{dailyRut.nombre}</h2>
                <p>{dailyRut.objetivo}. El mapa la eligio por {recommendationReasonText.toLowerCase()}.</p>
                <div className="urt-band-route">
                  <div className="urt-band-route-meta">
                    <strong>Ruta del dia</strong>
                    <span>
                      {trainingState === "cleared"
                        ? "Zona despejada"
                        : trainingState === "active"
                          ? "Sesion en progreso"
                          : "Entrada lista"}
                    </span>
                  </div>
                  <div className="urt-band-route-track">
                    {dailyRouteNodes.map((node, index) => {
                      const Icon = node.icon;
                      return (
                        <Fragment key={node.id}>
                          <div key={node.id} className={`urt-band-route-node ${node.done ? "is-done" : ""} ${node.active ? "is-active" : ""}`} title={node.label}>
                            {node.done ? <Check size={14} /> : <Icon size={14} />}
                          </div>
                          {index < dailyRouteNodes.length - 1 && (
                            <div className="urt-band-route-line">
                              <span style={{ width: node.done ? "100%" : node.active ? "52%" : "16%" }} />
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="urt-band-actions">
                <div className="urt-band-reward-box">
                  <div className="urt-band-reward-head">
                    <div className="urt-band-reward-copy">
                      <strong>
                        {trainingState === "cleared"
                          ? "Recompensa guardada"
                          : dailyRewardType === "classBonus"
                            ? "Bonus de clase"
                            : "Recompensa del tramo"}
                      </strong>
                      <span>
                        {trainingState === "cleared"
                          ? "La ruta ya dio su botin de hoy."
                          : dailyRewardType === "classBonus"
                            ? `+${Math.round(dailyRut.xpTotal * 1.25)} XP con afinidad activa.`
                            : `+${dailyRut.xpTotal} XP por cerrar la campana.`}
                      </span>
                    </div>
                    <img
                      className="urt-band-reward-ico"
                      src={RUTINA_DAILY_ASSETS.reward[dailyRewardType]}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="urt-chip-row">
                    <span className="urt-chip">
                      <Calendar size={14} />
                      {hoyDia}
                    </span>
                    <span className="urt-chip">
                      <Target size={14} />
                      {dailyRut.pasos.length} pasos
                    </span>
                    <span className="urt-chip">
                      <Award size={14} />
                      {dailyRewardType === "classBonus" ? `+${Math.round(dailyRut.xpTotal * 1.25)} XP` : `+${dailyRut.xpTotal} XP`}
                    </span>
                  </div>
                </div>
                <button className="urt-btn" onClick={() => startSession(dailyRut)}>
                  <Play size={16} />
                  {trainingState === "cleared" ? "Revisar ruta" : trainingState === "active" ? "Seguir ruta" : "Iniciar ruta"}
                </button>
              </div>
            </motion.section>
          )}

          <motion.section className="urt-panel urt-command urt-command-wide" {...panelMotion}>
              <div className="urt-panel-head">
                <div>
                  <div className="urt-panel-tag">Mesa del gremio</div>
                  <h3>Que conviene tocar ahora</h3>
                  <p>Tu proxima ruta, ordenada por prioridad y estado del cuerpo.</p>
                </div>
              </div>

              <div className="urt-command-grid">
                <div className="urt-command-stack">
                  <article className="urt-command-hero">
                    <div className="urt-command-hero-copy">
                      <div className="urt-panel-tag">Orden de hoy</div>
                      <h4>{orderRoutine?.nombre || "Sin orden cargada"}</h4>
                      <p>
                        {orderRoutine
                          ? `${orderZoneMeta.summary} ${orderRoutine.completadaHoy ? "Ya la completaste hoy, pero puedes repasar tecnica." : "Es la mejor opcion para arrancar esta jornada."}`
                          : "Sin ruta puntual para hoy, pero el mapa sigue abierto para explorar."}
                      </p>

                      <div className="urt-guild-meta">
                        <span className="urt-guild-chip" style={{ "--chip-accent": orderZoneMeta.color }}>
                          <img src={orderZoneMeta.icon} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                          {orderZoneMeta.short || orderZoneMeta.label}
                        </span>
                        {orderRoutine?.duracionMin ? (
                          <span className="urt-guild-chip" style={{ "--chip-accent": theme.accent }}>
                            <Clock size={13} />
                            {orderRoutine.duracionMin} min
                          </span>
                        ) : null}
                        {orderRoutine?.xpTotal ? (
                          <span className="urt-guild-chip" style={{ "--chip-accent": UI.gold }}>
                            <Award size={13} />
                            +{classBonusActive ? Math.round(orderRoutine.xpTotal * 1.25) : orderRoutine.xpTotal} XP
                          </span>
                        ) : null}
                      </div>

                      <div className="urt-guild-note">
                        {selectedTerritory?.meta.short || "General"} {territoryProgress ? `ya va en ${territoryProgress}% de exploracion.` : "aun no registra huella esta semana."}
                      </div>
                    </div>

                    <div className="urt-command-hero-visual">
                      <div className="urt-command-seal">
                        <img src={orderZoneMeta.icon || "/ui/icons/zone-flag.png"} alt="" />
                      </div>
                      <span className="urt-chip is-focus">{orderRoutine?.dificultad || "Ruta abierta"}</span>
                    </div>
                  </article>

                  <div className="urt-command-mini-grid">
                    <article className="urt-guild-card" style={{ "--card-accent": theme.accent }}>
                      <div className="urt-guild-card-top">
                        <div className="urt-guild-card-head">
                          <span>Bono por clase</span>
                          <h4>{classBonusActive ? "Afinidad encendida" : "Afinidad en reserva"}</h4>
                        </div>
                        <div className="urt-guild-badge">
                          <img src={theme.crest} alt="" />
                        </div>
                      </div>
                      <p>
                        {classBonusActive
                          ? `La ruta del dia cae dentro de tu estilo y sube la recompensa del tramo. ${copy.command}`
                          : `Tu clase empuja mejor en ${classFocusSummary || "zonas afines"}. Si giras a ese territorio, el mapa responde mejor y la recompensa escala.`}
                      </p>
                      <div className="urt-guild-meta">
                        <span className="urt-guild-chip" style={{ "--chip-accent": theme.accent }}>
                          <img src={theme.crest} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                          {theme.label}
                        </span>
                        <span className="urt-guild-chip" style={{ "--chip-accent": UI.gold }}>
                          <Sparkles size={13} />
                          {classBonusActive ? "+25% XP" : "Bonus latente"}
                        </span>
                      </div>
                      <div className="urt-guild-note">{classFocusSummary ? `Zonas afines: ${classFocusSummary}.` : "La afinidad se activa al entrar en territorios de tu clase."}</div>
                    </article>

                    <article className="urt-guild-card" style={{ "--card-accent": guildAlert.accent }}>
                      <div className="urt-guild-card-top">
                        <div className="urt-guild-card-head">
                          <span>{guildAlert.label}</span>
                          <h4>{guildAlert.title}</h4>
                        </div>
                        <div className="urt-guild-badge">
                          <img src={guildAlert.asset} alt="" />
                        </div>
                      </div>
                      <p>{guildAlert.text}</p>
                      <div className="urt-guild-meta">
                        {guildAlert.chips.map((chip) => (
                          <span key={chip} className="urt-guild-chip" style={{ "--chip-accent": guildAlert.accent }}>
                            <img src="/ui/icons/map-pin.png" alt="" style={{ width: 13, height: 13, objectFit: "contain" }} />
                            {chip}
                          </span>
                        ))}
                      </div>
                      <div className="urt-guild-note">{guildAlert.note}</div>
                    </article>
                  </div>
                </div>
              </div>
          </motion.section>

          <motion.section className="urt-panel urt-map" {...panelMotion}>
            <div className="urt-panel-head">
              <div>
                <div className="urt-panel-tag">Territorios de rutina</div>
                <h3>Mapa del campo</h3>
                <p>Elige una zona para ver sus rutas, recompensas y tu avance ahi.</p>
              </div>
            </div>

            <div className="urt-map-track">
              {territoryCards.map((territory) => {
                const total = territory.ruts.length;
                const completadas = territory.ruts.filter((rutina) => rutina.completadas > 0).length;
                const activeToday = territory.ruts.filter((rutina) => rutina.diasSemana.includes(hoyDia)).length;
                const progress = total ? Math.round((completadas / total) * 100) : 0;
                const isActive = selectedTerritory?.cat === territory.cat;
                const isFocus = territory.cat !== "Todas" && hasClsBonus(classKey, territory.cat);
                const lift = territory.cat === "Todas" ? 0 : territory.meta.key === "cardio" ? 20 : territory.meta.key === "flexibilidad" ? 42 : territory.meta.key === "funcional" ? 28 : 0;
                const territoryState = progress >= 100 ? "Zona dominada" : activeToday > 0 ? `${activeToday} rutas hoy` : total > 0 ? `${total} rutas listas` : "Sin rutas";

                return (
                  <button
                    key={territory.cat}
                    type="button"
                    className={`urt-map-card ${isActive ? "is-active" : ""} ${isFocus ? "is-focus" : ""}`}
                    style={{
                      "--territory-color": territory.meta.color,
                      "--territory-banner": `url(${territory.meta.banner})`,
                      "--territory-lift": `${lift}px`,
                    }}
                    onClick={() => chooseTerritory(territory.cat, true)}
                  >
                    <div className="urt-map-banner">
                      <div className="urt-map-banner-top">
                        <span className="urt-map-flag">
                          <img src="/ui/icons/zone-flag.png" alt="" style={{ width: 13, height: 13, objectFit: "contain" }} />
                          {territory.meta.short || territory.meta.label}
                        </span>
                        <div className="urt-map-crest">
                          <img src={territory.meta.icon} alt="" />
                        </div>
                      </div>
                      <div className="urt-map-banner-bottom">
                        <span className={`urt-map-pill ${isFocus ? "is-focus" : ""}`}>{isFocus ? "Afin a tu clase" : "Territorio abierto"}</span>
                      </div>
                    </div>

                    <div className="urt-map-card-body">
                      <div className="urt-map-card-top">
                        <div>
                          <strong>{territory.meta.label}</strong>
                          <span>{territoryState}</span>
                        </div>
                      </div>

                      <div className="urt-map-stats">
                        <span className="urt-map-pill">
                          <Calendar size={13} />
                          {activeToday} hoy
                        </span>
                        <span className="urt-map-pill">
                          <Target size={13} />
                          {total} rutas
                        </span>
                      </div>

                      <div className="urt-map-progress">
                        <div className="urt-map-progress-head">
                          <small>Exploracion</small>
                          <strong>{progress}%</strong>
                        </div>
                        <MiniBar val={progress} max={100} color={territory.meta.color} height={6} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {selectedTerritory && (
            <motion.section className="urt-panel urt-spotlight" {...panelMotion}>
              <div className="urt-spotlight-banner" style={{ "--spotlight-image": `url(${selectedTerritory.meta.banner})` }}>
                <div className="urt-spotlight-copy">
                  <div className="urt-kicker">
                    <img src={selectedTerritory.meta.icon} alt="" />
                    <span>{selectedTerritory.cat === "Todas" ? "Tablero general" : selectedTerritory.meta.label}</span>
                  </div>
                  <h3>{featuredRoutine?.nombre || "Sin rutas disponibles"}</h3>
                  <p>{selectedTerritory.meta.summary}</p>

                  {featuredRoutine && (
                    <div className="urt-chip-row">
                      <span className="urt-chip">
                        <Clock size={14} />
                        {featuredRoutine.duracionMin} min
                      </span>
                      <span className="urt-chip">
                        <Award size={14} />
                        +{featuredRoutine.xpTotal} XP
                      </span>
                      <span className="urt-chip">
                        <Calendar size={14} />
                        {featuredRoutine.diasSemana.length} dias activos
                      </span>
                    </div>
                  )}
                </div>

                <div className="urt-spotlight-side">
                  <div className="urt-side-card">
                    <small>Resumen corto</small>
                    <strong>{featuredRoutine?.objetivo || "Sin objetivo cargado"}</strong>
                    <p>{featuredRoutine ? `${featuredRoutine.pasos.length} pasos, dificultad ${featuredRoutine.dificultad.toLowerCase()}. ${recommendationReasonText}` : "Elige un territorio para ver esta ficha."}</p>
                  </div>
                  <div className="urt-side-card">
                    <small>Proximo gesto</small>
                    <strong>{featuredRoutine?.completadaHoy ? "Revisar hoja tecnica" : "Entrar a la sesion"}</strong>
                    <p>{featuredRoutine?.completadaHoy ? "La campana ya fue tocada hoy. Conviene revisar detalles o cambiar de territorio." : "La ruta sigue lista para reclamar tiempo, tecnica y experiencia."}</p>
                  </div>
                </div>
              </div>

              <div className="urt-mini-grid">
                {selectedRoutines.slice(0, 3).map((rutina) => (
                  <article key={rutina.id} className="urt-mini-card">
                    <div className="urt-mini-card-top">
                      <div className="urt-mini-badge" style={{ borderColor: `${catColor(rutina.categoria)}44`, background: `${catColor(rutina.categoria)}16` }}>
                        <img src={getRutinaCategoryMeta(rutina.categoria).icon} alt="" />
                      </div>
                      <div>
                        <strong>{rutina.nombre}</strong>
                        <span>{rutina.subcategoria || rutina.categoria}</span>
                      </div>
                    </div>
                    <p>{rutina.objetivo}</p>
                    <div className="urt-chip-row">
                      <span className="urt-chip">{rutina.dificultad}</span>
                      <span className="urt-chip">+{rutina.xpTotal} XP</span>
                    </div>
                    <div className="urt-mini-actions">
                      <button className="urt-btn-ghost" onClick={() => setDetalleRut(rutina)}>
                        <Search size={14} />
                        Ver
                      </button>
                      <button className="urt-btn" onClick={() => startSession(rutina)}>
                        <Play size={14} />
                        Entrar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section className="urt-panel urt-library" {...panelMotion}>
            <div className="urt-panel-head">
              <div>
                <div className="urt-panel-tag">Biblioteca de rutinas</div>
                <h3>{tab === "mis" ? "Mis campanas activas" : "Explorar todas las rutas"}</h3>
                <p>{selectedTerritory?.cat === "Todas" ? "Vista completa del mapa. Usa filtros y cambia de territorio cuando quieras." : `Filtrando dentro de ${selectedTerritory?.meta.short || "la zona actual"}.`}</p>
              </div>
              <span className="urt-chip">{libraryRoutines.length} visibles</span>
            </div>

            <div className="urt-toolbar">
              <div className="urt-tabs">
                <button className={`urt-tab ${tab === "mis" ? "is-active" : ""}`} onClick={() => setTab("mis")}>Mis rutas</button>
                <button className={`urt-tab ${tab === "explorar" ? "is-active" : ""}`} onClick={() => setTab("explorar")}>Explorar</button>
              </div>

              <div className="urt-toolbar-row">
                <div className="urt-search">
                  <Search size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar rutina, zona u objetivo..." />
                </div>

                <select className="urt-select" value={filterDif} onChange={(event) => setFilterDif(event.target.value)}>
                  <option value="all">Toda dificultad</option>
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Elite">Elite</option>
                </select>

                <select className="urt-select" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  <option value="default">Orden natural</option>
                  <option value="hoy">Primero hoy</option>
                  <option value="xp">Mayor XP</option>
                  <option value="menosCompl">Menos jugadas</option>
                  <option value="duracion">Mas cortas</option>
                </select>

                <button className={`urt-btn-ghost ${filterHoy ? "is-on" : ""}`} onClick={() => setFilterHoy((current) => !current)}>
                  <Calendar size={16} />
                  {isMobile ? "Hoy" : "Solo hoy"}
                </button>

                <div className="urt-view-switch" aria-label="Cambiar vista de biblioteca">
                  <button type="button" className={`urt-view-btn ${viewMode === "cards" ? "is-active" : ""}`} onClick={() => setViewMode("cards")} aria-label="Vista de cartas">
                    <LayoutGrid size={16} />
                  </button>
                  <button type="button" className={`urt-view-btn ${viewMode === "list" ? "is-active" : ""}`} onClick={() => setViewMode("list")} aria-label="Vista de lista">
                    <Rows3 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="urt-loading-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`rutina-loading-${index}`} className="urt-loading-card" />
                ))}
              </div>
            ) : libraryRoutines.length === 0 ? (
              <div className="urt-empty">
                <img src="/ui/header/notifications/notif-empty.png" alt="" />
                <strong>No encontramos rutas con ese filtro.</strong>
                <p>Limpia dificultad, territorio o buscador para volver a abrir el mapa completo.</p>
              </div>
            ) : (
              <>
                <div className="urt-library-featured">
                  {favoriteRoutines.length > 0 && (
                    <div className="urt-library-rail">
                      <div className="urt-library-rail-top">
                        <div>
                          <strong>Hechizos fijados</strong>
                          <span>Tus rutas guardadas para volver sin buscarlas de nuevo.</span>
                        </div>
                        <span className="urt-chip">{favoriteRoutines.length} marcadas</span>
                      </div>
                      <div className="urt-library-strip">
                        {favoriteRoutines.map((rutina) => {
                          const meta = getRutinaCategoryMeta(rutina.categoria);
                          return (
                            <article key={`fav-${rutina.id}`} className="urt-library-pick">
                              <div className="urt-library-pick-mark" style={{ borderColor: `${meta.color}44`, background: `${meta.color}16` }}>
                                <img src={meta.icon} alt="" />
                              </div>
                              <div>
                                <strong>{rutina.nombre}</strong>
                                <p>{rutina.objetivo}</p>
                              </div>
                              <div className="urt-library-pick-meta">
                                <button type="button" className="urt-btn-ghost" onClick={() => setDetalleRut(rutina)}>
                                  <Search size={14} />
                                  Ver
                                </button>
                                <button type="button" className="urt-btn" onClick={() => startSession(rutina)}>
                                  <Play size={14} />
                                  Entrar
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="urt-library-rail">
                    <div className="urt-library-rail-top">
                      <div>
                        <strong>Continuar campana</strong>
                        <span>Las rutas con mejor punto de entrada segun hoy, tu clase y la memoria del tablero.</span>
                      </div>
                      <span className="urt-chip is-focus">{campaignRoutines.length} sugeridas</span>
                    </div>
                    <div className="urt-library-strip">
                      {campaignRoutines.map((rutina) => {
                        const meta = getRutinaCategoryMeta(rutina.categoria);
                        const classBonus = hasClsBonus(classKey, rutina.subcategoria || rutina.categoria);
                        return (
                          <article key={`campaign-${rutina.id}`} className="urt-library-pick">
                            <div className="urt-library-pick-mark" style={{ borderColor: `${meta.color}44`, background: `${meta.color}16` }}>
                              <img src={meta.icon} alt="" />
                            </div>
                            <div>
                              <strong>{rutina.nombre}</strong>
                              <p>{rutina.completadaHoy ? "Ya hubo registro hoy, pero sigue firme para repetir tecnica." : rutina.diasSemana.includes(hoyDia) ? "Activa hoy y lista para seguir avanzando." : "Buena opcion para extender la campana sin salir del hilo."}</p>
                            </div>
                            <div className="urt-library-pick-meta">
                              {classBonus && <span className="urt-chip is-focus">Afinidad</span>}
                              <span className="urt-chip">{rutina.duracionMin} min</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={`urt-routine-grid ${viewMode === "list" ? "is-list" : ""}`}>
                  {libraryRoutines.map((rutina) => (
                    <RutinaCard
                      key={rutina.id}
                      rutina={rutina}
                      profile={profile}
                      hoyDia={hoyDia}
                      onView={setDetalleRut}
                      onStart={startSession}
                      viewMode={viewMode}
                      isFavorite={favoriteIds.includes(rutina.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.section>
        </div>
      </div>
    </>
  );
}

