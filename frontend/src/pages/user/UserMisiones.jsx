import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { AlertTriangle, ChevronRight, Gift, Lightbulb, Shield, Sparkles, X } from "lucide-react";
import { auth } from "../../firebase";
import { claimMision, getMisionesUsuario } from "../../services/api.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";

const UI = {
  text: "#f7f1ff",
  muted: "#b5a8c7",
  mutedDeep: "#8e82a3",
  gold: "#f3c969",
  success: "#80d39b",
  cyan: "#5ad8ff",
  danger: "#ff6f7d",
};

const STORAGE_SORT = "um:sort";
const STORAGE_STREAK = "um:claimed-days";
const STORAGE_MISSION_MEMORY = "um:mission-memory";

// Una frase corta por clase — sin describir la pantalla, solo el beneficio.
const MISSION_CLASS_COPY = {
  GUERRERO: "Retos de fuerza y constancia para avanzar con paso firme.",
  ARQUERO: "Retos agiles para sostener el ritmo y ver avance rapido.",
  MAGO: "Retos de foco y control para progresar con calma.",
  DEFAULT: "Completa retos, gana XP y sigue subiendo en el mapa.",
};

const MISSION_TYPE_META = {
  Diaria: { label: "Diaria", icon: "/ui/icons/weather-sun.png", summary: "Cambia cada dia." },
  Semanal: { label: "Semanal", icon: "/ui/icons/zone-flag.png", summary: "Se juega durante la semana." },
  Mente: { label: "Mente", icon: "/ui/stat-men.png", summary: "Foco y control." },
  Evento: { label: "Evento", icon: "/ui/icon-gem.png", summary: "Por tiempo limitado." },
  Desafio: { label: "Desafio", icon: "/ui/medals/rank-crown.png", summary: "Mas riesgo, mejor botin." },
};

const MISSION_ZONE_META = {
  fuerza: { key: "fuerza", label: "Fuerza", icon: "/ui/icons/quest-fuerza.png" },
  cardio: { key: "cardio", label: "Cardio", icon: "/ui/icons/quest-cardio.png" },
  mente: { key: "mente", label: "Mente", icon: "/ui/icons/quest-mision.png" },
  hidratacion: { key: "hidratacion", label: "Hidratación", icon: "/ui/icons/quest-hidratacion.png" },
  flexibilidad: { key: "flexibilidad", label: "Flexibilidad", icon: "/ui/icons/quest-flexibilidad.png" },
  general: { key: "general", label: "General", icon: "/ui/icons/map-pin.png" },
};

const MISSION_CLASS_STRATEGY = {
  GUERRERO: { preferredZones: ["fuerza"], supportZones: ["cardio", "general"], preferredTypes: ["Desafio", "Semanal"] },
  ARQUERO: { preferredZones: ["cardio", "flexibilidad"], supportZones: ["hidratacion", "general"], preferredTypes: ["Diaria", "Semanal", "Evento"] },
  MAGO: { preferredZones: ["mente", "flexibilidad"], supportZones: ["hidratacion", "general"], preferredTypes: ["Mente", "Diaria", "Semanal"] },
  DEFAULT: { preferredZones: ["general"], supportZones: ["fuerza", "cardio", "mente", "flexibilidad", "hidratacion"], preferredTypes: ["Diaria", "Semanal"] },
};

const MISSION_STATUS_META = {
  ready: { label: "Lista", color: UI.gold },
  active: { label: "En curso", color: UI.success },
  claimed: { label: "Reclamada", color: UI.cyan },
  expired: { label: "Caducada", color: UI.danger },
};

const TABS = ["Diaria", "Semanal", "Mente", "Evento", "Desafio"];

const PAGE_CSS = `
  @keyframes umi-sheen { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
  @keyframes umi-xpPop { 0%{opacity:0;transform:translate(-50%,-50%) scale(.6)} 40%{opacity:1;transform:translate(-50%,-80px) scale(1.08)} 100%{opacity:0;transform:translate(-50%,-140px) scale(1)} }
  @keyframes umi-modalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .umi-page {
    position: relative;
    min-height: 100vh;
    padding: clamp(14px, 2vw, 28px) clamp(14px, 2vw, 28px) 40px;
    color: ${UI.text};
    overflow-x: hidden;
    background:
      radial-gradient(circle at 12% 10%, color-mix(in srgb, var(--class-accent), transparent 90%), transparent 30%),
      radial-gradient(circle at 90% 15%, color-mix(in srgb, var(--class-secondary), transparent 92%), transparent 28%),
      linear-gradient(180deg, #090512 0%, #0c0818 55%, #090611 100%);
  }
  .umi-shell {
    position: relative;
    z-index: 1;
    width: min(1400px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 14px;
  }
  .umi-panel {
    position: relative;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: linear-gradient(180deg, rgba(22,12,37,.8), rgba(8,5,17,.88));
    box-shadow: 0 22px 54px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.06);
    overflow: hidden;
  }
  .umi-panel::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--class-accent) 55%, transparent), transparent);
    opacity: .7;
    z-index: 1;
  }
  .umi-panel::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: .06;
    background-image: url("/ui/panel-texture.png");
    background-size: cover;
    background-position: center;
    mix-blend-mode: screen;
  }
  .umi-panel > * { position: relative; z-index: 2; }

  /* ── Header ── */
  .umi-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
  }
  .umi-header h1 {
    margin: 0;
    font: 900 clamp(24px, 3vw, 34px)/1.05 "Manrope", sans-serif;
    color: #fff9ef;
  }
  .umi-header p {
    margin: 6px 0 0;
    color: ${UI.muted};
    font: 500 14px/1.5 "Manrope", sans-serif;
    max-width: 560px;
  }
  .umi-header p.is-actionable { color: ${UI.gold}; font-weight: 700; }
  .umi-class-badge { margin-bottom: 10px; }
  .umi-tip-card {
    margin-top: 14px;
    display: inline-flex;
    align-items: flex-start;
    gap: 11px;
    padding: 12px 15px;
    border-radius: 8px;
    max-width: 460px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 30%, rgba(255,255,255,.08));
    background: linear-gradient(135deg, color-mix(in srgb, var(--class-accent) 12%, transparent), rgba(255,255,255,.03));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 14px 30px rgba(0,0,0,.22);
  }
  .umi-tip-icon {
    width: 30px; height: 30px; flex-shrink: 0; border-radius: 7px;
    display: grid; place-items: center;
    background: color-mix(in srgb, var(--class-accent) 24%, rgba(8,6,18,.6));
    color: var(--class-accent);
    box-shadow: inset 0 0 10px color-mix(in srgb, var(--class-accent) 26%, transparent);
  }
  .umi-tip-body { display: grid; gap: 3px; min-width: 0; }
  .umi-tip-kicker {
    font: 800 9px "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--class-accent);
  }
  .umi-tip-text {
    font: 600 12.5px/1.42 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .umi-stat-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    width: min(560px, 100%);
  }
  .umi-stat {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid;
    gap: 2px;
    min-width: 0;
    transition: transform .18s ease, border-color .18s ease, background .18s ease;
  }
  .umi-stat:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--class-accent) 40%, transparent);
    background: rgba(255,255,255,.045);
  }
  .umi-stat-val {
    font: 900 19px "JetBrains Mono", monospace;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .umi-stat-val svg { flex-shrink: 0; opacity: .9; }
  .umi-stat-val img {
    width: 18px; height: 18px; object-fit: contain; flex-shrink: 0;
    filter: drop-shadow(0 0 6px currentColor);
  }
  .umi-stat-lab {
    font: 700 9px "Manrope", sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: ${UI.mutedDeep};
  }
  .umi-dots { display: flex; gap: 3px; margin-top: 5px; }
  .umi-dot {
    width: 7px; height: 7px; border-radius: 2px;
    background: rgba(255,255,255,.12);
  }
  .umi-dot.is-claimed { background: ${UI.gold}; }
  .umi-dot.is-today { box-shadow: 0 0 0 1px var(--class-accent); }
  .umi-stage {
    padding: 16px;
    display: grid;
    grid-template-columns: minmax(0, 1.16fr) minmax(280px, .84fr);
    gap: 14px;
    align-items: stretch;
  }
  .umi-stage-main,
  .umi-stage-side {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
  }
  .umi-stage-main {
    padding: 18px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--class-accent) 16%, transparent), transparent 34%),
      linear-gradient(135deg, rgba(18,11,30,.92), rgba(8,6,18,.9));
    box-shadow: 0 18px 38px rgba(0,0,0,.24);
    display: grid;
    gap: 14px;
    align-content: start;
  }
  .umi-stage-main::after,
  .umi-stage-side::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .08;
    background-image: url("/ui/panel-texture.png");
    background-size: cover;
    background-position: center;
    mix-blend-mode: screen;
  }
  .umi-stage-main > *,
  .umi-stage-side > * { position: relative; z-index: 1; }
  .umi-stage-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 34%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, transparent);
    color: var(--class-accent);
    font: 800 10px "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .09em;
  }
  .umi-stage-title {
    margin: 0;
    max-width: 14ch;
    color: #fff8ef;
    font: 900 clamp(24px, 3.1vw, 38px)/1.02 "Manrope", sans-serif;
  }
  .umi-stage-copy {
    margin: 0;
    max-width: 62ch;
    color: #d2c8e2;
    font: 500 14px/1.55 "Manrope", sans-serif;
  }
  .umi-stage-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .umi-stage-mini-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .umi-stage-mini {
    min-width: 0;
    display: grid;
    gap: 4px;
    padding: 12px 13px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.032);
  }
  .umi-stage-mini span {
    color: ${UI.mutedDeep};
    font: 700 9px "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .umi-stage-mini strong {
    color: #fff7ef;
    font: 800 13px "Manrope", sans-serif;
  }
  .umi-stage-mini p {
    margin: 0;
    color: ${UI.muted};
    font: 500 12px/1.45 "Manrope", sans-serif;
  }
  .umi-stage-side {
    padding: 14px;
    background:
      linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.02)),
      linear-gradient(180deg, rgba(16,10,28,.94), rgba(8,6,18,.94));
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .umi-stage-side-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }
  .umi-stage-side-art {
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: color-mix(in srgb, var(--class-accent) 10%, rgba(8,6,18,.7));
    display: grid;
    place-items: center;
  }
  .umi-stage-side-art img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--class-accent) 24%, transparent));
  }
  .umi-stage-side strong {
    display: block;
    color: #fff8ef;
    font: 800 15px "Manrope", sans-serif;
  }
  .umi-stage-side p {
    margin: 5px 0 0;
    color: ${UI.muted};
    font: 500 12px/1.45 "Manrope", sans-serif;
  }
  .umi-stage-side-grid {
    display: grid;
    gap: 8px;
  }
  .umi-stage-side-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(255,255,255,.03);
  }
  .umi-stage-side-stat span {
    color: ${UI.mutedDeep};
    font: 700 10px "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .umi-stage-side-stat strong {
    color: #f5efff;
    font-size: 13px;
  }

  /* ── Chips ── */
  .umi-chip-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .umi-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font: 700 11px "Manrope", sans-serif;
  }
  .umi-chip[style*="--chip-color"] {
    color: var(--chip-color);
    border-color: color-mix(in srgb, var(--chip-color) 44%, transparent);
    background: color-mix(in srgb, var(--chip-color) 12%, transparent);
  }
  .umi-chip.is-focus {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 46%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .umi-chip img { width: 14px; height: 14px; object-fit: contain; }
  .umi-rarity-dot { width: 7px; height: 7px; border-radius: 50%; }

  /* ── Buttons ── */
  .umi-btn, .umi-btn-ghost, .umi-icon-btn {
    font-family: "Manrope", sans-serif;
    cursor: pointer;
    transition: transform .15s ease, border-color .15s ease, background .15s ease;
  }
  .umi-btn, .umi-btn-ghost {
    min-height: 40px;
    padding: 0 16px;
    border-radius: 8px;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 800;
  }
  .umi-btn {
    color: #0a0611;
    background: linear-gradient(135deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 72%, white 8%));
    box-shadow: 0 10px 26px color-mix(in srgb, var(--class-accent) 26%, transparent), inset 0 1px 0 rgba(255,255,255,.35);
  }
  .umi-btn:hover:not(:disabled) {
    box-shadow: 0 14px 30px color-mix(in srgb, var(--class-accent) 34%, transparent), inset 0 1px 0 rgba(255,255,255,.35);
  }
  .umi-btn-ghost {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.1);
    color: ${UI.text};
  }
  .umi-btn:hover:not(:disabled), .umi-btn-ghost:hover { transform: translateY(-1px); }
  .umi-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
  .umi-icon-btn {
    width: 30px; height: 30px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: ${UI.mutedDeep};
    display: inline-flex; align-items: center; justify-content: center;
  }
  .umi-icon-btn:hover { color: ${UI.text}; border-color: rgba(255,255,255,.2); }

  /* ── Controls ── */
  .umi-controls-panel { padding: 12px 14px; display: grid; gap: 10px; }
  .umi-tab-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .umi-tab-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 12px; border-radius: 8px; cursor: pointer;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    color: ${UI.muted};
    font: 700 12px "Manrope", sans-serif;
    transition: transform .15s ease, border-color .15s ease, background .15s ease, color .15s ease;
  }
  .umi-tab-pill:hover { color: ${UI.text}; border-color: rgba(255,255,255,.16); }
  .umi-tab-pill img { width: 16px; height: 16px; object-fit: contain; }
  .umi-tab-pill.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 52%, transparent);
    background: color-mix(in srgb, var(--class-accent) 14%, transparent);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--class-accent) 20%, transparent);
  }
  .umi-tab-badge {
    min-width: 18px; height: 18px; padding: 0 5px;
    border-radius: 999px; background: ${UI.gold}; color: #0a0611;
    font: 800 10px "JetBrains Mono", monospace;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .umi-filter-row { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: center; }
  .umi-filter-stack { display: flex; flex-wrap: wrap; gap: 6px; }
  .umi-filter-pill {
    padding: 6px 12px; border-radius: 999px; cursor: pointer;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    color: ${UI.muted};
    font: 700 11px "Manrope", sans-serif;
  }
  .umi-filter-pill.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 46%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .umi-sort {
    min-height: 34px; padding: 0 12px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    color: ${UI.text};
    font: 600 12px "Manrope", sans-serif;
    outline: none;
  }

  /* ── Content layout ── */
  .umi-content {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-areas: "detail" "board";
    gap: 14px;
    align-items: start;
  }
  .umi-board {
    grid-area: board;
    padding: 14px;
    border-color: color-mix(in srgb, var(--class-accent) 26%, rgba(255,255,255,.1));
    background:
      linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015)),
      radial-gradient(circle at left top, color-mix(in srgb, var(--class-accent) 12%, transparent), transparent 34%),
      linear-gradient(135deg, color-mix(in srgb, var(--class-accent) 7%, rgba(22,12,37,.86)), rgba(8,5,17,.9));
    box-shadow:
      0 22px 54px rgba(0,0,0,.32),
      0 0 0 1px color-mix(in srgb, var(--class-accent) 10%, transparent),
      inset 0 1px 0 rgba(255,255,255,.06);
  }
  .umi-detail {
    grid-area: detail;
    padding: 16px;
    border-color: color-mix(in srgb, var(--class-accent) 32%, rgba(255,255,255,.1));
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.018)),
      radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--class-accent) 16%, transparent), transparent 36%),
      linear-gradient(160deg, color-mix(in srgb, var(--class-accent) 10%, rgba(22,12,37,.88)), rgba(8,5,17,.94));
    box-shadow:
      0 22px 54px rgba(0,0,0,.34),
      0 0 24px color-mix(in srgb, var(--class-accent) 12%, transparent),
      inset 0 1px 0 rgba(255,255,255,.06);
  }
  @media (min-width: 981px) {
    .umi-content {
      grid-template-columns: minmax(0, 1.3fr) minmax(300px, .85fr);
      grid-template-areas: "board detail";
    }
    .umi-detail { position: sticky; top: 14px; }
  }

  .umi-board-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px; }
  .umi-section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--class-accent) 18%, rgba(255,255,255,.06));
  }
  .umi-section-head strong {
    display: block;
    color: #fff8ef;
    font: 800 15px "Manrope", sans-serif;
  }
  .umi-section-head p {
    margin: 4px 0 0;
    color: ${UI.muted};
    font: 500 12px/1.45 "Manrope", sans-serif;
  }
  .umi-sync { display: inline-flex; align-items: center; gap: 6px; color: ${UI.mutedDeep}; font: 600 11px "Manrope", sans-serif; }
  .umi-sync-dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
  .umi-sync.is-live { color: var(--class-accent); }

  .umi-group { display: grid; gap: 8px; }
  .umi-group + .umi-group { margin-top: 16px; }
  .umi-group-head {
    display: flex; align-items: center; gap: 8px;
    color: var(--group-color, ${UI.gold});
    font: 800 11px "Manrope", sans-serif;
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .umi-group-head span.dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--group-color, ${UI.gold});
    box-shadow: 0 0 8px var(--group-color, ${UI.gold});
  }
  .umi-group-head small { margin-left: auto; color: ${UI.mutedDeep}; font-weight: 600; text-transform: none; letter-spacing: 0; }

  /* ── Compact mission row ── */
  .umi-cr {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px 9px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.022);
    cursor: pointer;
    text-align: left;
    transition: background .15s ease, border-color .15s ease, transform .15s ease, box-shadow .15s ease;
    overflow: hidden;
  }
  .umi-cr:hover {
    background: rgba(255,255,255,.045);
    border-color: rgba(255,255,255,.12);
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(0,0,0,.24);
  }
  .umi-cr:focus-visible { outline: 2px solid var(--class-accent); outline-offset: 1px; }
  .umi-cr.is-selected {
    border-color: color-mix(in srgb, var(--cr-color) 42%, transparent);
    background: color-mix(in srgb, var(--cr-color) 8%, rgba(255,255,255,.025));
  }
  .umi-cr.is-ready { border-color: rgba(243,201,105,.26); background: rgba(243,201,105,.06); }
  .umi-cr.is-done { opacity: .5; }
  .umi-cr-accentbar {
    position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; border-radius: 2px;
    background: linear-gradient(180deg, var(--cr-color), color-mix(in srgb, var(--cr-color) 55%, transparent));
    box-shadow: 0 0 10px color-mix(in srgb, var(--cr-color) 55%, transparent);
  }
  .umi-cr-icon {
    width: 30px; height: 30px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,.08);
    background: color-mix(in srgb, var(--cr-color) 13%, rgba(8,6,18,.72));
    box-shadow: inset 0 0 10px color-mix(in srgb, var(--cr-color) 16%, transparent);
  }
  .umi-cr-icon img { width: 17px; height: 17px; object-fit: contain; }
  .umi-cr-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .umi-cr-title {
    font: 700 13px "Manrope", sans-serif;
    color: ${UI.text};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 1.2;
  }
  .umi-cr-sub {
    display: flex; align-items: center; gap: 5px;
    font: 600 10px "Manrope", sans-serif;
    color: ${UI.mutedDeep};
    text-transform: uppercase; letter-spacing: .06em;
    white-space: nowrap; overflow: hidden;
  }
  .umi-cr-sub-dot { opacity: .35; }
  .umi-cr-prog-text { color: var(--cr-color); font-weight: 800; }
  .umi-cr-progbar { height: 2px; border-radius: 2px; background: rgba(255,255,255,.07); overflow: hidden; }
  .umi-cr-progbar-fill { height: 100%; border-radius: 2px; transition: width .4s ease; }
  .umi-cr-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; min-width: 78px; }
  .umi-cr-xp { font: 800 11px "JetBrains Mono", monospace; color: ${UI.gold}; letter-spacing: .02em; }
  .umi-cr-statuschip {
    display: inline-flex; align-items: center;
    padding: 3px 9px; border-radius: 999px; border: 1px solid;
    font: 700 9px "Manrope", sans-serif;
    text-transform: uppercase; letter-spacing: .06em;
  }
  .umi-cr-claim-btn {
    padding: 4px 12px; border-radius: 6px; border: none; cursor: pointer;
    background: ${UI.gold}; color: #0a0611;
    font: 800 11px "Manrope", sans-serif;
    transition: opacity .15s;
  }
  .umi-cr-claim-btn:disabled { opacity: .6; cursor: not-allowed; }
  .umi-cr-claim-btn:not(:disabled):hover { opacity: .86; }
  .umi-cr-countdown { font: 500 10px "Manrope", sans-serif; color: ${UI.mutedDeep}; }

  /* ── Board states ── */
  .umi-state { display: grid; justify-items: center; text-align: center; gap: 8px; padding: 32px 16px; color: ${UI.muted}; }
  .umi-state strong { font: 800 15px "Manrope", sans-serif; color: #fff; }
  .umi-state p { margin: 0; font: 500 13px "Manrope", sans-serif; max-width: 320px; }
  .umi-loading-list { display: grid; gap: 8px; margin-top: 6px; width: 100%; }
  .umi-loading-card {
    position: relative; height: 60px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.02);
    overflow: hidden;
  }
  .umi-loading-card::before {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
    animation: umi-sheen 1.6s ease-in-out infinite;
  }

  /* ── Detail card ── */
  .umi-detail-body { display: grid; gap: 12px; }
  .umi-detail-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .umi-detail-icon {
    width: 40px; height: 40px; flex-shrink: 0; border-radius: 9px;
    border: 1px solid color-mix(in srgb, var(--icon-color, var(--class-accent)) 30%, rgba(255,255,255,.08));
    background: color-mix(in srgb, var(--icon-color, var(--class-accent)) 16%, rgba(8,6,18,.6));
    box-shadow: inset 0 0 12px color-mix(in srgb, var(--icon-color, var(--class-accent)) 20%, transparent);
    display: grid; place-items: center;
  }
  .umi-detail-icon img { width: 20px; height: 20px; object-fit: contain; }
  .umi-detail-body h3 { margin: 0; font: 900 18px/1.15 "Manrope", sans-serif; color: #fff9ef; }
  .umi-detail-desc { margin: 0; color: ${UI.muted}; font: 500 13px/1.5 "Manrope", sans-serif; }
  .umi-reason-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .umi-reason-chip {
    padding: 3px 9px; border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 40%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, transparent);
    color: var(--class-accent);
    font: 700 10px "Manrope", sans-serif;
  }
  .umi-detail-progress {
    padding: 11px 13px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid; gap: 7px;
  }
  .umi-detail-progress-head { display: flex; justify-content: space-between; align-items: center; font: 700 11px "Manrope", sans-serif; color: ${UI.mutedDeep}; text-transform: uppercase; letter-spacing: .06em; }
  .umi-detail-countdown { font: 600 11px "Manrope", sans-serif; color: ${UI.mutedDeep}; }
  .umi-detail-reward {
    display: flex; align-items: center; gap: 8px;
    font: 800 17px "JetBrains Mono", monospace; color: ${UI.gold};
    text-shadow: 0 0 18px color-mix(in srgb, ${UI.gold} 45%, transparent);
  }
  .umi-detail-done { font: 600 12px "Manrope", sans-serif; color: ${UI.mutedDeep}; }
  .umi-empty { display: grid; justify-items: center; text-align: center; gap: 8px; padding: 26px 10px; color: ${UI.muted}; }
  .umi-empty strong { font: 800 14px "Manrope", sans-serif; color: #fff; }
  .umi-empty p { margin: 0; font: 500 12px "Manrope", sans-serif; max-width: 240px; }

  /* ── Modal ── */
  .umi-modal-backdrop {
    position: fixed; inset: 0; z-index: 540;
    background: rgba(4,4,10,.8);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .umi-modal {
    width: min(100%, 460px);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: linear-gradient(180deg, rgba(20,17,34,.98), rgba(10,9,19,.98));
    box-shadow: 0 26px 56px rgba(0,0,0,.55), 0 0 0 1px color-mix(in srgb, var(--class-accent) 16%, transparent);
    animation: umi-modalIn .2s ease both;
    overflow: hidden;
  }
  .umi-modal.umi-sheet {
    width: min(100%, 560px);
    max-height: 88vh;
    margin-top: auto;
    border-radius: 8px 8px 0 0;
  }
  .umi-sheet-handle { width: 64px; height: 4px; margin: 10px auto 0; border-radius: 999px; background: rgba(255,255,255,.18); }
  .umi-modal-head {
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .umi-modal-kicker {
    display: inline-flex; align-items: center; gap: 7px;
    color: var(--class-accent);
    font: 800 11px "Manrope", sans-serif;
    text-transform: uppercase; letter-spacing: .08em;
  }
  .umi-modal-body { padding: 16px 18px 18px; display: grid; gap: 12px; overflow-y: auto; }
  .umi-modal-body h3 { margin: 0; font: 900 19px "Manrope", sans-serif; color: #fff; }
  .umi-modal-body p { margin: 0; color: ${UI.muted}; font: 500 14px/1.5 "Manrope", sans-serif; }
  .umi-modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .umi-metric {
    padding: 12px 14px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .umi-metric small { display: block; color: ${UI.mutedDeep}; font: 700 10px "Manrope", sans-serif; text-transform: uppercase; letter-spacing: .08em; }
  .umi-metric strong { display: block; margin-top: 6px; font: 900 22px "JetBrains Mono", monospace; }

  /* ── Toasts ── */
  .umi-toast {
    position: fixed; right: 20px; z-index: 520;
    width: min(320px, calc(100vw - 30px));
    padding: 13px 15px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(18,13,30,.98), rgba(10,8,18,.98));
    box-shadow: 0 18px 34px rgba(0,0,0,.42);
  }
  .umi-toast.bottom { bottom: 22px; }
  .umi-toast.top { top: 16px; }
  .umi-toast strong { display: block; font: 800 13px "Manrope", sans-serif; }
  .umi-toast p { margin: 4px 0 0; color: ${UI.muted}; font: 500 12px "Manrope", sans-serif; }

  @media (max-width: 700px) {
    .umi-stage { grid-template-columns: 1fr; }
    .umi-stage-mini-grid { grid-template-columns: 1fr; }
    .umi-stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
    .umi-filter-row { flex-direction: column; align-items: stretch; }
    .umi-sort { width: 100%; }
  }
`;

// ─── Pure helpers ──────────────────────────────────────────────────────────
function normalizeMissionType(tipo = "") {
  const raw = String(tipo || "").toLowerCase();
  if (raw.includes("desaf")) return "Desafio";
  if (raw.includes("seman")) return "Semanal";
  if (raw.includes("mente")) return "Mente";
  if (raw.includes("event")) return "Evento";
  return "Diaria";
}

function getMissionTypeMeta(tipo = "") {
  return MISSION_TYPE_META[normalizeMissionType(tipo)] || MISSION_TYPE_META.Diaria;
}

function getMissionZone(mision) {
  const key = normalizeMissionType(mision?.tipo);
  if (key === "Mente") return MISSION_ZONE_META.mente;
  const text = `${mision?.titulo || ""} ${mision?.descripcion || ""}`.toLowerCase();
  if (text.includes("cardio") || text.includes("ritmo") || text.includes("pulso")) return MISSION_ZONE_META.cardio;
  if (text.includes("fuerza") || text.includes("flexion") || text.includes("sentadilla")) return MISSION_ZONE_META.fuerza;
  if (text.includes("respira") || text.includes("medita") || text.includes("mente")) return MISSION_ZONE_META.mente;
  if (text.includes("agua") || text.includes("hidra")) return MISSION_ZONE_META.hidratacion;
  if (text.includes("flex") || text.includes("yoga") || text.includes("movilidad")) return MISSION_ZONE_META.flexibilidad;
  return MISSION_ZONE_META.general;
}

function getMissionRarity(xp = 0) {
  if (xp >= 360) return { label: "Legendaria", color: UI.gold };
  if (xp >= 240) return { label: "Épica", color: "#c08aff" };
  if (xp >= 140) return { label: "Rara", color: UI.cyan };
  return { label: "Común", color: UI.success };
}

function getMissionMemory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_MISSION_MEMORY) || "{}");
    return {
      recent: Array.isArray(parsed?.recent) ? parsed.recent : [],
      lastClosed: parsed?.lastClosed || null,
    };
  } catch {
    return { recent: [], lastClosed: null };
  }
}

function saveMissionMemory(memory) {
  localStorage.setItem(STORAGE_MISSION_MEMORY, JSON.stringify({
    recent: Array.isArray(memory?.recent) ? memory.recent.slice(-14) : [],
    lastClosed: memory?.lastClosed || null,
  }));
}

function getOffsetDate(serverOffset = 0) {
  return new Date(Date.now() + serverOffset);
}

function secsUntilMidnight(serverOffset = 0) {
  const now = getOffsetDate(serverOffset);
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight - now) / 1000));
}

function secsUntilMonday(serverOffset = 0) {
  const now = getOffsetDate(serverOffset);
  const day = now.getDay();
  const daysUntil = day === 1 ? 7 : (8 - day) % 7;
  return Math.max(0, daysUntil * 86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()));
}

function secsUntilExpiry(isoString, serverOffset = 0) {
  if (!isoString) return null;
  const now = Date.now() + serverOffset;
  return Math.max(0, Math.floor((new Date(isoString) - now) / 1000));
}

function isExpiredMission(mision, serverOffset = 0) {
  if (normalizeMissionType(mision?.tipo) === "Evento" && mision?.fechaFin) {
    return secsUntilExpiry(`${mision.fechaFin}T23:59:59`, serverOffset) === 0;
  }
  return false;
}

function fmtCountdown(secs) {
  if (secs >= 86400) return `${Math.floor(secs / 86400)}d ${Math.floor((secs % 86400) / 3600)}h`;
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getMissionStatusKey(mision, serverOffset = 0) {
  if (!mision) return "active";
  if (isExpiredMission(mision, serverOffset)) return "expired";
  if (mision.reclamada) return "claimed";
  if (mision.estado === "completada") return "ready";
  return "active";
}

function getMissionCountdownLabel(mision, serverOffset = 0) {
  const key = normalizeMissionType(mision?.tipo);
  if (key === "Evento" && mision?.fechaFin) {
    const secs = secsUntilExpiry(`${mision.fechaFin}T23:59:59`, serverOffset);
    return secs > 0 ? `Cierra en ${fmtCountdown(secs)}` : "Ventana cerrada";
  }
  if (key === "Semanal") return `Nueva en ${fmtCountdown(secsUntilMonday(serverOffset))}`;
  if (key === "Diaria") return `Nueva en ${fmtCountdown(secsUntilMidnight(serverOffset))}`;
  return "Activa";
}

function getMissionRoute(mision) {
  const typeKey = normalizeMissionType(mision?.tipo);
  const zone = getMissionZone(mision);
  if (typeKey === "Mente") return { id: "mente", label: "Abrir mente" };
  if (typeKey === "Evento") return { id: "tienda", label: "Abrir tienda" };
  if (typeKey === "Semanal") return { id: "rutinas", label: "Abrir rutina" };
  if (zone.label === "Cardio" || zone.label === "Fuerza" || zone.label === "Flexibilidad") return { id: "ejercicios", label: "Abrir ejercicios" };
  return { id: "misiones", label: "Ver tablero" };
}

function formatSyncLabel(timestamp) {
  if (!timestamp) return "Sin registro";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 45000) return "ahora mismo";
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  return `hace ${hours} h`;
}

function getMissionBoardStateMeta({ loading, error, tab, filterEstado, hasAnyInTab, visibleCount }) {
  if (loading) {
    return { title: "Cargando misiones...", detail: "Estamos trayendo tu avance.", color: UI.cyan };
  }
  if (error) {
    return { title: "No pudimos cargar tus misiones", detail: "Revisa tu conexión e intenta de nuevo.", color: UI.danger, isError: true };
  }
  if (!hasAnyInTab) {
    return { title: `Sin ${getMissionTypeMeta(tab).label.toLowerCase()} por ahora`, detail: "Vuelve luego para ver nuevas.", color: UI.mutedDeep };
  }
  if (visibleCount === 0) {
    return {
      title: filterEstado === "reclamadas" ? "Aún no reclamaste ninguna" : "Sin misiones con este filtro",
      detail: "Prueba otro filtro para ver más misiones.",
      color: UI.cyan,
    };
  }
  return null;
}

function sortMisiones(list, sortMode, serverOffset, recommendationContext = null) {
  const getSecs = (mision) => {
    const key = normalizeMissionType(mision.tipo);
    if (key === "Evento" && mision.fechaFin) return secsUntilExpiry(`${mision.fechaFin}T23:59:59`, serverOffset);
    if (key === "Diaria") return secsUntilMidnight(serverOffset);
    if (key === "Semanal") return secsUntilMonday(serverOffset);
    return Number.MAX_SAFE_INTEGER;
  };

  const priority = (mision) => {
    if (getMissionStatusKey(mision, serverOffset) === "ready") return 0;
    if (getMissionStatusKey(mision, serverOffset) === "active") return 1;
    if (getMissionStatusKey(mision, serverOffset) === "claimed") return 2;
    return 3;
  };

  return [...list].sort((left, right) => {
    switch (sortMode) {
      case "claimable":
        return priority(left) - priority(right) || right.xpRecompensa - left.xpRecompensa;
      case "expiring":
        return getSecs(left) - getSecs(right);
      case "xp":
        return right.xpRecompensa - left.xpRecompensa;
      case "lessCompleted":
        return (left.progreso || 0) - (right.progreso || 0);
      default:
        if (recommendationContext) {
          const rightData = getMissionRecommendationData(right, recommendationContext);
          const leftData = getMissionRecommendationData(left, recommendationContext);
          return rightData.score - leftData.score
            || priority(left) - priority(right)
            || getSecs(left) - getSecs(right)
            || right.xpRecompensa - left.xpRecompensa;
        }
        return priority(left) - priority(right) || getSecs(left) - getSecs(right) || right.xpRecompensa - left.xpRecompensa;
    }
  });
}

function getClaimedDays() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_STREAK) || "[]");
  } catch {
    return [];
  }
}

function saveClaimedDay(dateStr) {
  const current = getClaimedDays();
  if (current.includes(dateStr)) return;
  const next = [...current, dateStr].sort().slice(-30);
  localStorage.setItem(STORAGE_STREAK, JSON.stringify(next));
}

function computeDailyStreak(claimedDays) {
  const set = new Set(claimedDays);
  let streak = 0;
  const date = new Date();
  for (;;) {
    const key = date.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function getWeekDays(serverOffset = 0) {
  const now = getOffsetDate(serverOffset);
  const monday = new Date(now);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const item = new Date(monday);
    item.setDate(monday.getDate() + index);
    return item.toISOString().slice(0, 10);
  });
}

function todayISODate(serverOffset = 0) {
  return getOffsetDate(serverOffset).toISOString().slice(0, 10);
}

function rememberClosedMission(mission, serverOffset = 0) {
  if (!mission?.id) return getMissionMemory();
  const zone = getMissionZone(mission);
  const entry = {
    id: mission.id,
    title: mission.titulo || "",
    type: normalizeMissionType(mission.tipo),
    zone: zone.key,
    zoneLabel: zone.label,
    date: todayISODate(serverOffset),
    xp: mission.xpRecompensa || 0,
  };
  const current = getMissionMemory();
  const recent = [...current.recent.filter((item) => !(item.id === entry.id && item.date === entry.date)), entry].slice(-14);
  const next = { recent, lastClosed: entry };
  saveMissionMemory(next);
  return next;
}

// Puntúa y explica (en tags cortos) por qué una misión es la recomendada del día.
function getMissionRecommendationData(mission, context) {
  if (!mission) return { score: -999, reasons: [] };

  const typeKey = normalizeMissionType(mission.tipo);
  const zone = getMissionZone(mission);
  const statusKey = getMissionStatusKey(mission, context.serverOffset);
  const strategy = context.strategy || MISSION_CLASS_STRATEGY.DEFAULT;
  const recentEntries = context.recentEntries || [];
  const lastClosed = context.lastClosed;
  const sameZoneRecent = recentEntries.filter((entry) => entry.zone === zone.key).length;
  const sameTypeRecent = recentEntries.filter((entry) => entry.type === typeKey).length;
  const sameTypeRecentDays = new Set(
    recentEntries.filter((entry) => entry.type === typeKey).map((entry) => entry.date),
  ).size;
  const progressPct = Math.min(((mission.progreso || 0) / Math.max(mission.total || 1, 1)) * 100, 100);

  let score = 0;
  const reasons = [];

  if (statusKey === "ready") {
    score += 340;
    reasons.push("Lista para reclamar");
  } else if (statusKey === "active") {
    score += 210;
  } else if (statusKey === "claimed") {
    score -= 180;
  } else if (statusKey === "expired") {
    score -= 420;
  }

  if (strategy.preferredZones.includes(zone.key)) {
    score += 120;
    reasons.push("Ideal para tu clase");
  } else if (strategy.supportZones.includes(zone.key)) {
    score += 55;
  }

  if (strategy.preferredTypes.includes(typeKey)) {
    score += 65;
  }

  score += Math.min(progressPct * 0.9, 70);
  score += Math.min((mission.xpRecompensa || 0) / 8, 42);

  if (typeKey === "Diaria" && !context.claimedToday) {
    score += 46;
    reasons.push("Protege tu racha");
  }

  if (typeKey === "Evento" && mission?.fechaFin) {
    const secs = secsUntilExpiry(`${mission.fechaFin}T23:59:59`, context.serverOffset);
    if (secs <= 21600) {
      score += 72;
      reasons.push("Cierra pronto");
    } else if (secs <= 86400) {
      score += 38;
    }
  }

  if (typeKey === "Diaria" && secsUntilMidnight(context.serverOffset) <= 21600) {
    score += 32;
  }

  if (lastClosed?.id === mission.id) score -= 120;
  if (lastClosed?.zone === zone.key) score -= 86;
  if (lastClosed?.type === typeKey) score -= 52;

  if (sameZoneRecent >= 2) {
    score -= 104;
  } else if (sameZoneRecent === 1 && lastClosed?.zone !== zone.key) {
    score += 20;
  }

  if (sameTypeRecent >= 2 || sameTypeRecentDays >= 2) {
    score -= 92;
  }

  if (lastClosed?.zone && lastClosed.zone !== zone.key) {
    score += 30;
    reasons.push("Cambia de enfoque");
  }

  return { score, reasons: [...new Set(reasons)].slice(0, 3) };
}

function pickRecommendedMission(list, context) {
  return [...list].sort((left, right) => {
    const rightData = getMissionRecommendationData(right, context);
    const leftData = getMissionRecommendationData(left, context);
    return rightData.score - leftData.score
      || (right.xpRecompensa || 0) - (left.xpRecompensa || 0)
      || (right.progreso || 0) - (left.progreso || 0);
  })[0] || null;
}

// ─── Small components ───────────────────────────────────────────────────────
function MiniBar({ val, max, color, height = 8 }) {
  const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0;
  return (
    <div style={{ height, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.05)" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 72%, white 10%))`,
        }}
      />
    </div>
  );
}

function PageAurora({ color }) {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: "50%", height: "50%", borderRadius: "50%", background: `radial-gradient(circle, ${color}14 0%, transparent 65%)`, filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-14%", right: "-8%", width: "55%", height: "55%", borderRadius: "50%", background: `radial-gradient(circle, ${UI.gold}0E 0%, transparent 65%)`, filter: "blur(70px)" }} />
    </div>
  );
}

function MissionDetailBody({ mission, serverOffset, reasonTags = [], onClaim, claiming, onNavigate }) {
  if (!mission) {
    return (
      <div className="umi-empty">
        <Sparkles size={26} color={UI.mutedDeep} />
        <strong>Elige una misión</strong>
        <p>Toca cualquier misión de la lista para ver el detalle aquí.</p>
      </div>
    );
  }

  const typeMeta = getMissionTypeMeta(mission.tipo);
  const zone = getMissionZone(mission);
  const rarity = getMissionRarity(mission.xpRecompensa || 0);
  const statusKey = getMissionStatusKey(mission, serverOffset);
  const status = MISSION_STATUS_META[statusKey];
  const route = getMissionRoute(mission);
  const pct = Math.min(((mission.progreso || 0) / Math.max(mission.total || 1, 1)) * 100, 100);
  const isReady = statusKey === "ready";
  const isClaimed = statusKey === "claimed";
  const isClaiming = claiming === mission.id;

  return (
    <div className="umi-detail-body">
      <div className="umi-detail-top">
        <span className="umi-detail-icon" style={{ "--icon-color": status.color }}>
          <img src={typeMeta.icon} alt="" />
        </span>
        {reasonTags.length > 0 && <span className="umi-chip is-focus">Recomendada hoy</span>}
      </div>

      <h3>{mission.titulo}</h3>
      {mission.descripcion && <p className="umi-detail-desc">{mission.descripcion}</p>}

      <div className="umi-chip-row">
        <span className="umi-chip" style={{ "--chip-color": status.color }}>
          <Shield size={12} />
          {status.label}
        </span>
        <span className="umi-chip">
          <img src={zone.icon} alt="" />
          {zone.label}
        </span>
        <span className="umi-chip" style={{ "--chip-color": rarity.color }}>
          <span className="umi-rarity-dot" style={{ background: rarity.color }} />
          {rarity.label}
        </span>
      </div>

      {reasonTags.length > 0 && (
        <div className="umi-reason-row">
          {reasonTags.map((reason) => <span key={reason} className="umi-reason-chip">{reason}</span>)}
        </div>
      )}

      {!isClaimed && (
        <div className="umi-detail-progress">
          <div className="umi-detail-progress-head">
            <span>Progreso</span>
            <strong style={{ color: status.color }}>{mission.progreso}/{mission.total}</strong>
          </div>
          <MiniBar val={pct} max={100} color={status.color} height={8} />
          <span className="umi-detail-countdown">{getMissionCountdownLabel(mission, serverOffset)}</span>
        </div>
      )}

      <div className="umi-detail-reward">
        <Gift size={16} color={UI.gold} />
        <strong>+{mission.xpRecompensa} XP</strong>
      </div>

      <div className="umi-chip-row">
        {isReady ? (
          <button className="umi-btn" onClick={() => onClaim(mission)} disabled={isClaiming} style={{ width: "100%" }}>
            <Gift size={15} />
            {isClaiming ? "Reclamando..." : "Reclamar"}
          </button>
        ) : !isClaimed ? (
          <button className="umi-btn-ghost" onClick={() => onNavigate?.(route.id)} style={{ width: "100%" }}>
            {route.label}
            <ChevronRight size={15} />
          </button>
        ) : (
          <span className="umi-detail-done">Ya la reclamaste.</span>
        )}
      </div>
    </div>
  );
}

function ClaimModal({ mission, claimResult, onClose }) {
  const xp = claimResult?.xpGanado ?? mission?.xpRecompensa ?? 0;
  const coins = claimResult?.coinsGanados || 0;

  return (
    <div className="umi-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="umi-modal">
        <div className="umi-modal-head">
          <span className="umi-modal-kicker"><Gift size={14} /> Recompensa lista</span>
          <button className="umi-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
        </div>
        <div className="umi-modal-body">
          <h3>{mission?.titulo}</h3>
          <p>¡Bien hecho! Esta misión ya quedó en tu progreso.</p>
          <div className="umi-modal-grid">
            <div className="umi-metric">
              <small>XP ganada</small>
              <strong style={{ color: UI.gold }}>+{xp}</strong>
            </div>
            {coins > 0 && (
              <div className="umi-metric">
                <small>Monedas</small>
                <strong style={{ color: "#c08aff" }}>+{coins}</strong>
              </div>
            )}
          </div>
          <button className="umi-btn" onClick={onClose} style={{ width: "100%" }}>Seguir</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ mission, serverOffset, reasonTags, onClose, onClaim, claiming, onNavigate }) {
  const isMobile = useIsMobile();
  return (
    <div className="umi-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`umi-modal${isMobile ? " umi-sheet" : ""}`}>
        {isMobile && <div className="umi-sheet-handle" />}
        <div className="umi-modal-head">
          <span className="umi-modal-kicker">Detalle de misión</span>
          <button className="umi-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
        </div>
        <div className="umi-modal-body">
          <MissionDetailBody
            mission={mission}
            serverOffset={serverOffset}
            reasonTags={reasonTags}
            onClaim={onClaim}
            claiming={claiming}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}

function MissionQuestRow({ mission, isSelected, onSelect, onClaim, claiming, serverOffset, classAccent }) {
  const typeMeta = getMissionTypeMeta(mission.tipo);
  const zoneMeta = getMissionZone(mission);
  const statusKey = getMissionStatusKey(mission, serverOffset);
  const statusMeta = MISSION_STATUS_META[statusKey];
  const isClaimable = statusKey === "ready";
  const isDone = statusKey === "claimed";
  const isClaiming = claiming === mission.id;
  const pct = Math.min((mission.progreso / Math.max(mission.total || 1, 1)) * 100, 100);
  const accentColor = statusMeta?.color || classAccent;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      className={`umi-cr${isSelected ? " is-selected" : ""}${isDone ? " is-done" : ""}${isClaimable ? " is-ready" : ""}`}
      style={{ "--cr-color": accentColor }}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
    >
      <span className="umi-cr-accentbar" />
      <span className="umi-cr-icon"><img src={typeMeta.icon} alt="" /></span>
      <span className="umi-cr-body">
        <span className="umi-cr-title">{mission.titulo}</span>
        <span className="umi-cr-sub">
          <span>{typeMeta.label}</span>
          <span className="umi-cr-sub-dot">/</span>
          <span>{zoneMeta.label}</span>
          {!isDone && (
            <>
              <span className="umi-cr-sub-dot">/</span>
              <span className="umi-cr-prog-text">{mission.progreso}/{mission.total}</span>
            </>
          )}
        </span>
        {!isDone && (
          <span className="umi-cr-progbar">
            <span className="umi-cr-progbar-fill" style={{ width: `${pct}%`, background: accentColor }} />
          </span>
        )}
      </span>
      <span className="umi-cr-meta">
        <span className="umi-cr-xp">+{mission.xpRecompensa} XP</span>
        {isClaimable ? (
          <button
            className="umi-cr-claim-btn"
            onClick={(e) => { e.stopPropagation(); onClaim(mission); }}
            disabled={isClaiming}
          >
            {isClaiming ? "..." : "Reclamar"}
          </button>
        ) : (
          <span className="umi-cr-statuschip" style={{ color: accentColor, borderColor: `${accentColor}44` }}>
            {statusMeta?.label || "Activa"}
          </span>
        )}
        {!isDone && <span className="umi-cr-countdown">{getMissionCountdownLabel(mission, serverOffset)}</span>}
      </span>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
export default function UserMisiones({ profile, onNavigate }) {
  const isMobile = useIsMobile();
  const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";
  const [missions, setMissions] = useState([]);
  const [tab, setTab] = useState("Diaria");
  const [selectedMission, setSelectedMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [showExpired, setShowExpired] = useState(false);
  const [filterEstado, setFilterEstado] = useState("todas");
  const [sortMode, setSortMode] = useState(() => localStorage.getItem(STORAGE_SORT) || "auto");
  const [claimedDays, setClaimedDays] = useState(() => getClaimedDays());
  const [missionMemory, setMissionMemory] = useState(() => getMissionMemory());
  const [updateToast, setUpdateToast] = useState(null);
  const [newDoneToast, setNewDoneToast] = useState(null);
  const [claimFlash, setClaimFlash] = useState(null);
  const [xpNotif, setXpNotif] = useState(null);
  const [logroNotif, setLogroNotif] = useState(null);
  const [detailOpen, setDetailOpen] = useState(null);

  const previousMissionsRef = useRef([]);
  const resetCheckRef = useRef({ diaria: secsUntilMidnight(), semanal: secsUntilMonday() });
  const lastAutoRefreshRef = useRef(0);

  const classKey = String(profile?.heroClass || "DEFAULT").toUpperCase();
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const classTagline = MISSION_CLASS_COPY[classKey] || MISSION_CLASS_COPY.DEFAULT;
  const classStrategy = MISSION_CLASS_STRATEGY[classKey] || MISSION_CLASS_STRATEGY.DEFAULT;

  const refreshMissions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setSyncing(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        setMissions([]);
        return;
      }
      const before = Date.now();
      const token = await user.getIdToken();
      const result = await getMisionesUsuario(token);
      const after = Date.now();
      let resolvedServerOffset = 0;

      if (result?.serverTime) {
        const serverMs = new Date(result.serverTime).getTime();
        const clientMid = (before + after) / 2;
        resolvedServerOffset = serverMs - clientMid;
        setServerOffset(resolvedServerOffset);
      }

      const next = result?.ok && Array.isArray(result.missions) ? result.missions : [];
      const previous = previousMissionsRef.current;

      if (silent && previous.length > 0) {
        const progressed = next.filter((mission) => {
          const prev = previous.find((item) => item.id === mission.id);
          return prev && (mission.progreso || 0) > (prev.progreso || 0);
        });
        if (progressed.length > 0) {
          setUpdateToast({ count: progressed.length, names: progressed.map((mission) => mission.titulo) });
          setTimeout(() => setUpdateToast(null), 3400);
        }
      }

      const newDone = next.find((mission) => {
        const prev = previous.find((item) => item.id === mission.id);
        return mission.estado === "completada" && !mission.reclamada && prev && prev.estado !== "completada";
      });
      if (newDone) {
        setNewDoneToast(newDone);
        setMissionMemory(rememberClosedMission(newDone, resolvedServerOffset));
        setTimeout(() => setNewDoneToast(null), 4200);
      }

      previousMissionsRef.current = next;
      setMissions(next);
      setLastSyncAt(Date.now());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las misiones. Revisa tu conexión e intenta otra vez.");
    } finally {
      if (!silent) setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) refreshMissions();
      else {
        setMissions([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [refreshMissions]);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - lastAutoRefreshRef.current < 10_000) return;
      lastAutoRefreshRef.current = now;
      refreshMissions(true);
    };
    window.addEventListener("exerciseCompleted", handler);
    return () => window.removeEventListener("exerciseCompleted", handler);
  }, [refreshMissions]);

  useEffect(() => {
    const timer = setInterval(() => {
      const diariaLeft = secsUntilMidnight(serverOffset);
      const semanalLeft = secsUntilMonday(serverOffset);
      const previous = resetCheckRef.current;
      if (previous.diaria > 30 && diariaLeft < 30) refreshMissions(true);
      if (previous.semanal > 30 && semanalLeft < 30) refreshMissions(true);
      resetCheckRef.current = { diaria: diariaLeft, semanal: semanalLeft };
    }, 20000);
    return () => clearInterval(timer);
  }, [refreshMissions, serverOffset]);

  const handleSortChange = useCallback((value) => {
    setSortMode(value);
    localStorage.setItem(STORAGE_SORT, value);
  }, []);

  const handleRowSelect = useCallback((mission) => {
    setSelectedMission(mission);
    if (isMobile) setDetailOpen(mission);
  }, [isMobile]);

  const handleClaim = useCallback(async (mission) => {
    if (!mission || claiming === mission.id || mission.reclamada) return;
    try {
      setClaiming(mission.id);
      setError(null);
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const result = await claimMision(token, mission.id);
      if (!result?.ok) return;

      setMissions((current) => current.map((item) => (
        item.id === mission.id ? { ...item, reclamada: true, estado: "completada" } : item
      )));
      setClaimFlash({ mission, result });
      setDetailOpen((current) => (current?.id === mission.id ? null : current));
      if (canShowXpPopups()) {
        setXpNotif(result.xpGanado ?? mission.xpRecompensa);
        setTimeout(() => setXpNotif(null), result.leveledUp ? 4200 : 2600);
      }

      if (normalizeMissionType(mission.tipo) === "Diaria") {
        const today = todayISODate(serverOffset);
        saveClaimedDay(today);
        setClaimedDays(getClaimedDays());
      }

      setMissionMemory(rememberClosedMission(mission, serverOffset));

      window.dispatchEvent(new CustomEvent("exerciseCompleted", {
        detail: {
          xp: result.xpGanado,
          leveledUp: result.leveledUp,
          newLevel: result.level,
          coinsGanados: result.coinsGanados ?? 0,
          weeklyXP: result.weeklyXP,
          streak: result.streak,
          newAchievements: result.newAchievements || [],
        },
      }));
      if (result.leveledUp) {
        window.dispatchEvent(new CustomEvent("levelUp", { detail: result }));
      }
      if (Array.isArray(result.newAchievements) && result.newAchievements.length > 0) {
        result.newAchievements.forEach((ach, i) => {
          setTimeout(() => {
            setLogroNotif(ach);
            setTimeout(() => setLogroNotif(null), 3200);
          }, i * 1400);
        });
      }
    } catch (err) {
      console.error(err);
      const message = String(err?.message || "").toLowerCase();
      if (message.includes("reclamad") || message.includes("already")) {
        setMissions((current) => current.map((item) => (item.id === mission.id ? { ...item, reclamada: true } : item)));
        setError("Esta misión ya fue reclamada.");
      } else if (message.includes("completad")) {
        setError("Esta misión aún no está completa.");
      } else {
        setError("No se pudo reclamar la misión. Intenta otra vez.");
      }
      setTimeout(() => setError(null), 3000);
    } finally {
      setClaiming(null);
    }
  }, [claiming, serverOffset]);

  const allForTab = useMemo(
    () => missions.filter((mission) => normalizeMissionType(mission.tipo) === tab),
    [missions, tab],
  );

  const activeInTab = useMemo(
    () => allForTab.filter((mission) => !isExpiredMission(mission, serverOffset)),
    [allForTab, serverOffset],
  );

  const expiredInTab = useMemo(
    () => allForTab.filter((mission) => isExpiredMission(mission, serverOffset)),
    [allForTab, serverOffset],
  );

  const filtered = useMemo(() => {
    const base = showExpired ? allForTab : activeInTab;
    switch (filterEstado) {
      case "listas": return base.filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready");
      case "progreso": return base.filter((mission) => getMissionStatusKey(mission, serverOffset) === "active");
      case "reclamadas": return base.filter((mission) => getMissionStatusKey(mission, serverOffset) === "claimed");
      default: return base;
    }
  }, [activeInTab, allForTab, filterEstado, serverOffset, showExpired]);

  const dailyStreak = computeDailyStreak(claimedDays);
  const todayKey = todayISODate(serverOffset);
  const claimedToday = claimedDays.includes(todayKey);

  const recommendationContext = useMemo(() => ({
    classKey,
    classLabel: classTheme.label,
    strategy: classStrategy,
    recentEntries: missionMemory.recent.slice(-4).reverse(),
    lastClosed: missionMemory.lastClosed,
    serverOffset,
    claimedToday,
    dailyStreak,
  }), [claimedToday, classKey, classStrategy, classTheme.label, dailyStreak, missionMemory, serverOffset]);

  const dailyTip = useMemo(() => {
    const urgentEvent = missions.find((m) => {
      if (normalizeMissionType(m.tipo) !== "Evento" || !m.fechaFin || m.reclamada) return false;
      const secs = secsUntilExpiry(`${m.fechaFin}T23:59:59`, serverOffset);
      return secs > 0 && secs <= 21600;
    });
    if (urgentEvent) {
      const secs = secsUntilExpiry(`${urgentEvent.fechaFin}T23:59:59`, serverOffset);
      return `El evento "${urgentEvent.titulo}" cierra en ${fmtCountdown(secs)}. No lo dejes pasar.`;
    }
    if (dailyStreak > 0 && !claimedToday) {
      return `Tu racha de ${dailyStreak} día${dailyStreak === 1 ? "" : "s"} sigue viva. Completa una misión diaria hoy para no perderla.`;
    }
    if (dailyStreak === 0) {
      return "Completa una misión diaria para empezar tu racha.";
    }
    const almostDone = missions.find((m) => {
      if (getMissionStatusKey(m, serverOffset) !== "active") return false;
      const pct = (m.progreso || 0) / Math.max(m.total || 1, 1);
      return pct >= 0.6 && pct < 1;
    });
    if (almostDone) {
      return `Estás cerca de terminar "${almostDone.titulo}". Un poco más y la reclamas.`;
    }
    return classTagline;
  }, [missions, dailyStreak, claimedToday, serverOffset, classTagline]);

  const ordered = useMemo(
    () => sortMisiones(filtered, sortMode, serverOffset, sortMode === "auto" ? recommendationContext : null),
    [filtered, recommendationContext, serverOffset, sortMode],
  );

  const recommendedMission = useMemo(
    () => pickRecommendedMission(activeInTab.length ? activeInTab : allForTab, recommendationContext),
    [activeInTab, allForTab, recommendationContext],
  );

  useEffect(() => {
    const nextSelected = recommendedMission || ordered[0] || allForTab[0] || null;
    if (!selectedMission || normalizeMissionType(selectedMission.tipo) !== tab || !allForTab.some((mission) => mission.id === selectedMission.id)) {
      setSelectedMission(nextSelected);
    } else if (selectedMission) {
      const refreshed = missions.find((mission) => mission.id === selectedMission.id);
      if (refreshed && refreshed !== selectedMission) setSelectedMission(refreshed);
    }
  }, [allForTab, missions, ordered, recommendedMission, selectedMission, tab]);

  useEffect(() => {
    const consumeChatDeepLink = (payload) => {
      if (!payload) return false;
      const section = String(payload.section || "").toLowerCase();
      if (section && section !== "misiones") return false;
      const missionId = payload.missionId || payload.entityId || null;
      if (!missionId) return false;
      const mission = missions.find((entry) => entry.id === missionId);
      if (!mission) return false;
      setTab(normalizeMissionType(mission.tipo));
      setSelectedMission(mission);
      return true;
    };

    const consumeStored = () => {
      try {
        const raw = window.sessionStorage.getItem(CHAT_DEEPLINK_KEY);
        if (!raw) return;
        const payload = JSON.parse(raw);
        if (consumeChatDeepLink(payload)) window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY);
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
  }, [missions]);

  const totalReady = useMemo(
    () => missions.filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready").length,
    [missions, serverOffset],
  );
  const totalClaimed = useMemo(
    () => missions.filter((mission) => getMissionStatusKey(mission, serverOffset) === "claimed").length,
    [missions, serverOffset],
  );
  const xpReady = useMemo(
    () => missions
      .filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready")
      .reduce((sum, mission) => sum + (mission.xpRecompensa || 0), 0),
    [missions, serverOffset],
  );

  const weekDays = getWeekDays(serverOffset);
  const weekDots = weekDays.map((day) => ({ day, claimed: claimedDays.includes(day), today: day === todayKey }));

  const boardGroups = useMemo(() => ({
    ready: ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready"),
    active: ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "active"),
    claimed: ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "claimed"),
    expired: showExpired ? ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "expired") : [],
  }), [ordered, serverOffset, showExpired]);

  const visibleCount = boardGroups.ready.length + boardGroups.active.length + boardGroups.claimed.length + boardGroups.expired.length;
  const boardStateMeta = getMissionBoardStateMeta({
    loading, error, tab, filterEstado, hasAnyInTab: allForTab.length > 0, visibleCount,
  });
  const syncLabel = formatSyncLabel(lastSyncAt);

  const featuredMission = selectedMission && allForTab.some((mission) => mission.id === selectedMission.id)
    ? selectedMission
    : (recommendedMission || ordered[0] || allForTab[0] || null);

  const reasonTagsFor = useCallback((mission) => (
    mission && recommendedMission && mission.id === recommendedMission.id
      ? getMissionRecommendationData(mission, recommendationContext).reasons
      : []
  ), [recommendedMission, recommendationContext]);
  const featuredTypeMeta = featuredMission ? getMissionTypeMeta(featuredMission.tipo) : getMissionTypeMeta(tab);
  const featuredZoneMeta = featuredMission ? getMissionZone(featuredMission) : MISSION_ZONE_META.general;
  const featuredStatusKey = featuredMission ? getMissionStatusKey(featuredMission, serverOffset) : "active";
  const featuredStatusMeta = MISSION_STATUS_META[featuredStatusKey] || MISSION_STATUS_META.active;
  const featuredRarity = featuredMission ? getMissionRarity(featuredMission.xpRecompensa || 0) : getMissionRarity(0);
  const featuredRoute = featuredMission ? getMissionRoute(featuredMission) : { id: "misiones", label: "Ver todas" };
  const featuredReasons = featuredMission ? reasonTagsFor(featuredMission) : [];
  const featuredProgressPct = featuredMission
    ? Math.min(((featuredMission.progreso || 0) / Math.max(featuredMission.total || 1, 1)) * 100, 100)
    : 0;

  return (
    <>
      <style>{PAGE_CSS}</style>

      {claimFlash && (
        <ClaimModal mission={claimFlash.mission} claimResult={claimFlash.result} onClose={() => setClaimFlash(null)} />
      )}

      {detailOpen && (
        <DetailModal
          mission={detailOpen}
          serverOffset={serverOffset}
          reasonTags={reasonTagsFor(detailOpen)}
          onClose={() => setDetailOpen(null)}
          onClaim={handleClaim}
          claiming={claiming}
          onNavigate={onNavigate}
        />
      )}

      {xpNotif && (
        <div
          style={{
            position: "fixed", top: "50%", left: "50%", zIndex: 550, pointerEvents: "none",
            color: UI.gold, fontFamily: "'Manrope',sans-serif", fontSize: 34, fontWeight: 900,
            textShadow: `0 0 40px ${UI.gold}88`, animation: "umi-xpPop 2.4s ease forwards", whiteSpace: "nowrap",
          }}
        >
          +{xpNotif} XP
        </div>
      )}

      {logroNotif && (
        <div className="umi-toast bottom" style={{ borderColor: `${UI.gold}55` }}>
          <strong style={{ color: UI.gold }}>{logroNotif.icon || "🏅"} Logro desbloqueado</strong>
          <p>{logroNotif.nombre || logroNotif.titulo || logroNotif.name || "Nuevo logro"}</p>
        </div>
      )}

      {newDoneToast && (
        <div className="umi-toast bottom" style={{ borderColor: `${classTheme.accent}55` }}>
          <strong style={{ color: classTheme.accent }}>Misión completada</strong>
          <p>{newDoneToast.titulo} ya está lista para reclamar.</p>
        </div>
      )}

      <AnimatePresence>
        {updateToast && (
          <motion.div
            key="update-toast"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            className="umi-toast top"
            style={{ borderColor: `${classTheme.accent}55` }}
          >
            <strong style={{ color: classTheme.accent }}>
              {updateToast.count} cambio{updateToast.count === 1 ? "" : "s"} nuevo{updateToast.count === 1 ? "" : "s"}
            </strong>
            <p>{updateToast.names.slice(0, 2).join(" / ")}{updateToast.names.length > 2 ? ` +${updateToast.names.length - 2}` : ""}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="umi-page" style={{ "--class-accent": classTheme.accent, "--class-secondary": classTheme.secondary }}>
        <PageAurora color={classTheme.accent} />

        <div className="umi-shell">

          <header className="umi-header">
            <div>
              <span className="umi-chip is-focus umi-class-badge">
                <img src={classTheme.crest} alt="" />
                {classTheme.label}
              </span>
              <h1>Misiones</h1>
              <p className={totalReady > 0 ? "is-actionable" : ""}>
                {totalReady > 0
                  ? `Tienes ${totalReady} mision${totalReady === 1 ? "" : "es"} lista${totalReady === 1 ? "" : "s"} para cobrar.`
                  : classTagline}
              </p>
              <div className="umi-tip-card">
                <span className="umi-tip-icon"><Lightbulb size={15} /></span>
                <div className="umi-tip-body">
                  <span className="umi-tip-kicker">Tip de hoy</span>
                  <span className="umi-tip-text">{dailyTip}</span>
                </div>
              </div>
            </div>
            <div className="umi-stat-row">
              <div className="umi-stat">
                <span className="umi-stat-val" style={{ color: UI.gold }}><img src="/logros/medals/medal-streak-master.png" alt="" />{dailyStreak}</span>
                <span className="umi-stat-lab">Racha</span>
                <div className="umi-dots">
                  {weekDots.map((d) => (
                    <span key={d.day} className={`umi-dot${d.claimed ? " is-claimed" : ""}${d.today ? " is-today" : ""}`} />
                  ))}
                </div>
              </div>
              <div className="umi-stat">
                <span className="umi-stat-val" style={{ color: UI.gold }}><img src="/missions/rewards/reward-contract-chest.png" alt="" />{totalReady}</span>
                <span className="umi-stat-lab">Listas hoy</span>
              </div>
              <div className="umi-stat">
                <span className="umi-stat-val" style={{ color: UI.cyan }}><img src="/ui/icons/stat-xp.png" alt="" />{xpReady}</span>
                <span className="umi-stat-lab">XP pendiente</span>
              </div>
              <div className="umi-stat">
                <span className="umi-stat-val" style={{ color: UI.success }}><img src="/missions/rewards/reward-claimed-seal.png" alt="" />{totalClaimed}</span>
                <span className="umi-stat-lab">Hechas</span>
              </div>
            </div>
          </header>

          <section className="umi-panel umi-stage">
            <div className="umi-stage-main">
              <span className="umi-stage-kicker">
                <Sparkles size={13} />
                {featuredMission ? "Mision destacada" : "Tablon del dia"}
              </span>

              <div>
                <h2 className="umi-stage-title">
                  {featuredMission?.titulo || `${featuredTypeMeta.label} en espera`}
                </h2>
                <p className="umi-stage-copy">
                  {featuredMission?.descripcion
                    || `${featuredTypeMeta.summary} Empieza por aqui sin abrir toda la lista.`}
                </p>
              </div>

              <div className="umi-stage-meta">
                <span className="umi-chip" style={{ "--chip-color": featuredStatusMeta.color }}>
                  <Shield size={12} />
                  {featuredStatusMeta.label}
                </span>
                <span className="umi-chip">
                  <img src={featuredZoneMeta.icon} alt="" />
                  {featuredZoneMeta.label}
                </span>
                <span className="umi-chip" style={{ "--chip-color": featuredRarity.color }}>
                  <span className="umi-rarity-dot" style={{ background: featuredRarity.color }} />
                  {featuredRarity.label}
                </span>
                <span className="umi-chip">
                  <Gift size={12} />
                  +{featuredMission?.xpRecompensa || 0} XP
                </span>
                {featuredMission && (
                  <span className="umi-chip is-focus">
                    {getMissionCountdownLabel(featuredMission, serverOffset)}
                  </span>
                )}
              </div>

              <div className="umi-stage-mini-grid">
                <article className="umi-stage-mini">
                  <span>Conviene hoy</span>
                  <strong>{featuredReasons[0] || "Entrar por la mejor opcion"}</strong>
                  <p>{dailyTip}</p>
                </article>
                <article className="umi-stage-mini">
                  <span>Progreso</span>
                  <strong>{featuredMission ? `${featuredMission.progreso || 0}/${featuredMission.total || 1}` : "Sin datos"}</strong>
                  <p>{featuredMission ? `${Math.round(featuredProgressPct)}% ya va cubierto.` : "Elige una mision para ver el avance."}</p>
                </article>
                <article className="umi-stage-mini">
                  <span>Siguiente paso</span>
                  <strong>{featuredRoute.label}</strong>
                  <p>{featuredZoneMeta.label} y {featuredTypeMeta.label.toLowerCase()} quedan arriba por ahora.</p>
                </article>
              </div>
            </div>

            <aside className="umi-stage-side">
              <div className="umi-stage-side-head">
                <div>
                  <strong>Botin</strong>
                  <p>Lo justo para decidir rapido.</p>
                </div>
                <div className="umi-stage-side-art">
                  <img src={featuredTypeMeta.icon} alt="" />
                </div>
              </div>

              <div className="umi-stage-side-grid">
                <div className="umi-stage-side-stat">
                  <span>Recompensa</span>
                  <strong>+{featuredMission?.xpRecompensa || 0} XP</strong>
                </div>
                <div className="umi-stage-side-stat">
                  <span>Zona</span>
                  <strong>{featuredZoneMeta.label}</strong>
                </div>
                <div className="umi-stage-side-stat">
                  <span>Visibles</span>
                  <strong>{visibleCount} visibles</strong>
                </div>
                <div className="umi-stage-side-stat">
                  <span>Para cobrar</span>
                  <strong style={{ color: UI.gold }}>{boardGroups.ready.length}</strong>
                </div>
              </div>

              {featuredMission && featuredStatusKey !== "claimed" ? (
                featuredStatusKey === "ready" ? (
                  <button className="umi-btn" onClick={() => handleClaim(featuredMission)}>
                    <Gift size={15} />
                    Cobrar ahora
                  </button>
                ) : (
                  <button className="umi-btn-ghost" onClick={() => onNavigate?.(featuredRoute.id)}>
                    {featuredRoute.label}
                    <ChevronRight size={15} />
                  </button>
                )
              ) : (
                <span className="umi-chip is-focus">Todo al dia</span>
              )}
            </aside>
          </section>

          <div className="umi-panel umi-controls-panel">
            <div className="umi-tab-row">
              {TABS.map((typeKey) => {
                const meta = getMissionTypeMeta(typeKey);
                const readyCount = missions.filter((mission) => normalizeMissionType(mission.tipo) === typeKey && getMissionStatusKey(mission, serverOffset) === "ready").length;
                return (
                  <button
                    key={typeKey}
                    className={`umi-tab-pill${tab === typeKey ? " is-active" : ""}`}
                    onClick={() => { setTab(typeKey); setFilterEstado("todas"); setShowExpired(false); }}
                  >
                    <img src={meta.icon} alt="" />
                    {meta.label}
                    {readyCount > 0 && <span className="umi-tab-badge">{readyCount}</span>}
                  </button>
                );
              })}
            </div>

            <div className="umi-filter-row">
              <div className="umi-filter-stack">
                {[
                  ["todas", "Todas"],
                  ["listas", "Listas"],
                  ["progreso", "En curso"],
                  ["reclamadas", "Hechas"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`umi-filter-pill${filterEstado === value ? " is-active" : ""}`}
                    onClick={() => setFilterEstado(value)}
                  >
                    {label}
                  </button>
                ))}
                {expiredInTab.length > 0 && (
                  <button
                    className={`umi-filter-pill${showExpired ? " is-active" : ""}`}
                    onClick={() => setShowExpired((current) => !current)}
                  >
                    {showExpired ? "Ocultar caducadas" : `Ver caducadas (${expiredInTab.length})`}
                  </button>
                )}
              </div>

              <select className="umi-sort" value={sortMode} onChange={(event) => handleSortChange(event.target.value)}>
                <option value="auto">Orden inteligente</option>
                <option value="claimable">Primero listas</option>
                <option value="expiring">Más urgentes</option>
                <option value="xp">Más XP</option>
                <option value="lessCompleted">Menos avanzadas</option>
              </select>
            </div>
          </div>

          <div className="umi-content">
            <aside className="umi-panel umi-detail">
              <div className="umi-section-head">
                <div>
                  <strong>Ficha abierta</strong>
                  <p>Objetivo, premio y salida rapida en un solo lugar.</p>
                </div>
              </div>
              <MissionDetailBody
                mission={featuredMission}
                serverOffset={serverOffset}
                reasonTags={reasonTagsFor(featuredMission)}
                onClaim={handleClaim}
                claiming={claiming}
                onNavigate={onNavigate}
              />
            </aside>

            <section className="umi-panel umi-board">
              <div className="umi-section-head">
                <div>
                  <strong>Tablon de misiones</strong>
                  <p>Lo importante queda arriba para entrar mas rapido.</p>
                </div>
              </div>
              <div className="umi-board-head">
                <span className={`umi-sync${syncing ? " is-live" : ""}`}>
                  <span className="umi-sync-dot" />
                  {syncing ? "Actualizando…" : `Actualizado ${syncLabel}`}
                </span>
              </div>

              {loading ? (
                <div className="umi-state">
                  <Sparkles size={26} color={boardStateMeta?.color} />
                  <strong>{boardStateMeta?.title}</strong>
                  <p>{boardStateMeta?.detail}</p>
                  <div className="umi-loading-list">
                    {[...Array(3)].map((_, index) => <div key={index} className="umi-loading-card" />)}
                  </div>
                </div>
              ) : (
                <>
                  {error || visibleCount === 0 ? (
                    <div className="umi-state">
                      {boardStateMeta?.isError
                        ? <AlertTriangle size={26} color={boardStateMeta.color} />
                        : <Sparkles size={26} color={boardStateMeta?.color} />}
                      <strong>{boardStateMeta?.title}</strong>
                      <p>{boardStateMeta?.detail}</p>
                    </div>
                  ) : null}

                  {!error && boardGroups.ready.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": UI.gold }}>
                        <span className="dot" />
                        Listas
                        <small>{boardGroups.ready.length}</small>
                      </div>
                      {boardGroups.ready.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => handleRowSelect(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classAccent={classTheme.accent}
                        />
                      ))}
                    </div>
                  )}

                  {!error && boardGroups.active.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": classTheme.accent }}>
                        <span className="dot" />
                        En curso
                        <small>{boardGroups.active.length}</small>
                      </div>
                      {boardGroups.active.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => handleRowSelect(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classAccent={classTheme.accent}
                        />
                      ))}
                    </div>
                  )}

                  {!error && boardGroups.claimed.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": UI.cyan }}>
                        <span className="dot" />
                        Hechas
                        <small>{boardGroups.claimed.length}</small>
                      </div>
                      {boardGroups.claimed.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => handleRowSelect(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classAccent={classTheme.accent}
                        />
                      ))}
                    </div>
                  )}

                  {!error && boardGroups.expired.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": UI.danger }}>
                        <span className="dot" />
                        Cerradas
                        <small>{boardGroups.expired.length}</small>
                      </div>
                      {boardGroups.expired.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => handleRowSelect(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classAccent={classTheme.accent}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

        </div>
      </div>
    </>
  );
}


