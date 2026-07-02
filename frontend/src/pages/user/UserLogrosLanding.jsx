import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import {
  Award,
  Brain,
  Check,
  Dumbbell,
  Flame,
  Gift,
  HelpCircle,
  Lock,
  Search,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { auth } from "../../firebase.js";
import { claimLogro, getLogrosCatalogo } from "../../services/api.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";

const UI = {
  text: "#f7f1ff",
  muted: "#b7accb",
  mutedDeep: "#8f84a3",
  line: "rgba(255,255,255,.08)",
  gold: "#f4cc78",
  orange: "#ff9f43",
  green: "#8ac926",
  red: "#ff5d73",
  blue: "#4cc9f0",
  purple: "#c08aff",
  bg: "#080611",
};

const TYPE_META = {
  Ejercicio: { icon: Dumbbell, color: "#ff8f5f", label: "Campo fisico" },
  Racha: { icon: Flame, color: "#ffb13a", label: "Cadencia diaria" },
  Nivel: { icon: TrendingUp, color: "#f4cc78", label: "Ascenso del heroe" },
  Social: { icon: Users, color: "#67d5ff", label: "Circulo del gremio" },
  Especial: { icon: Star, color: "#c08aff", label: "Sala especial" },
  Mente: { icon: Brain, color: "#59d5c6", label: "Dominio mental" },
  Secreto: { icon: HelpCircle, color: "#9aa0b6", label: "Archivo sellado" },
};

const STAGE_THEME = {
  GUERRERO: {
    image: "/missions/missions-hero-warrior.png",
    floor: "/exercises/hero/hero-floor-glow-warrior.png",
    label: "Salon de hierro",
    copy: "Insignias de fuerza, constancia y cierre firme del esfuerzo real.",
  },
  ARQUERO: {
    image: "/missions/missions-hero-archer.png",
    floor: "/exercises/hero/hero-floor-glow-archer.png",
    label: "Galeria del pulso",
    copy: "Medallas que se ganan con ritmo, cardio y precision sostenida.",
  },
  MAGO: {
    image: "/missions/missions-hero-mage.png",
    floor: "/exercises/hero/hero-floor-glow-mage.png",
    label: "Archivo del foco",
    copy: "Sellos ligados a disciplina mental, calma y dominio del avance.",
  },
  DEFAULT: {
    image: "/missions/missions-hero-default.png",
    floor: "/exercises/hero/hero-floor-glow-default.png",
    label: "Salon del gremio",
    copy: "La vitrina del progreso mezcla botin, habito y presencia real.",
  },
};

const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";

const CSS = `
  .ulg-page {
    position: relative;
    min-height: 100vh;
    padding: 24px 20px 42px;
    color: ${UI.text};
    overflow: hidden;
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--class-accent) 14%, transparent), transparent 34%),
      radial-gradient(circle at bottom right, color-mix(in srgb, var(--class-secondary) 16%, transparent), transparent 28%),
      linear-gradient(180deg, rgba(8,6,16,.98), rgba(5,5,12,.99));
  }
  .ulg-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: .15;
    background:
      linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .ulg-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(9,8,18,.22), rgba(9,8,18,.82)),
      url("/ui/logros-bg.png") center/cover no-repeat;
    opacity: .16;
    mix-blend-mode: screen;
  }
  .ulg-shell {
    position: relative;
    z-index: 1;
    width: min(1480px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 18px;
  }
  .ulg-panel {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(20,17,34,.96), rgba(9,8,18,.97)),
      url("/ui/panel-texture.png");
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.04),
      0 24px 48px rgba(0,0,0,.32),
      0 0 0 1px color-mix(in srgb, var(--class-accent) 18%, transparent);
  }
  .ulg-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--class-accent) 12%, transparent), transparent 34%);
  }
  .ulg-panel > * { position: relative; z-index: 1; }
  .ulg-kicker,
  .ulg-chip,
  .ulg-tab,
  .ulg-select,
  .ulg-status-chip,
  .ulg-rarity-pill,
  .ulg-spot-chip {
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
    font-size: 12px;
    font-weight: 800;
  }
  .ulg-kicker {
    width: fit-content;
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 45%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .ulg-kicker img,
  .ulg-chip img,
  .ulg-rarity-pill img,
  .ulg-stage-crest img,
  .ulg-spot-chip img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .ulg-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(340px, .96fr);
    gap: 18px;
    padding: 24px;
  }
  .ulg-hero-copy { display: grid; gap: 18px; align-content: start; }
  .ulg-hero-copy h1 {
    margin: 0;
    max-width: 10ch;
    font: 900 clamp(36px, 5.2vw, 80px)/.92 "Manrope", sans-serif;
    color: #fff9ef;
  }
  .ulg-hero-copy h1 span {
    color: var(--class-accent);
    text-shadow: 0 0 34px color-mix(in srgb, var(--class-accent), transparent 45%);
  }
  .ulg-hero-copy > div > p {
    font: 500 clamp(14px, 1.2vw, 18px)/1.7 "Manrope", sans-serif;
    color: #cdbfe0;
    max-width: 720px;
  }
  .ulg-hero-copy p,
  .ulg-stage-copy p,
  .ulg-band-copy p,
  .ulg-section-head p,
  .ulg-stat-card p,
  .ulg-metric p,
  .ulg-state p,
  .ulg-spot-copy p,
  .ulg-info-card p,
  .ulg-empty p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 16px;
    line-height: 1.45;
  }
  .ulg-chip-row,
  .ulg-stage-honors,
  .ulg-tab-row,
  .ulg-rarity-row,
  .ulg-spot-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .ulg-chip.is-focus {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 45%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .ulg-hero-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .ulg-stat-card,
  .ulg-metric,
  .ulg-info-card,
  .ulg-progress-card {
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .ulg-stat-card small,
  .ulg-metric small,
  .ulg-progress-card small,
  .ulg-info-card small {
    display: block;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .ulg-stat-card strong,
  .ulg-metric strong,
  .ulg-progress-card strong,
  .ulg-info-card strong {
    display: block;
    margin-top: 6px;
    font-family: "Manrope", sans-serif;
    font-size: clamp(22px, 2vw, 30px);
  }
  .ulg-stage {
    position: relative;
    min-height: 390px;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 28%, rgba(255,255,255,.08));
    background:
      linear-gradient(180deg, rgba(9,8,18,.14), rgba(9,8,18,.86)),
      var(--stage-image) center/cover no-repeat;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.04),
      inset 0 0 46px color-mix(in srgb, var(--class-accent) 12%, transparent),
      0 0 28px color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .ulg-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(9,8,18,.22), rgba(9,8,18,.64) 58%, rgba(9,8,18,.18)),
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(9,8,18,.62));
  }
  .ulg-stage::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 58%;
    background: linear-gradient(180deg, transparent, rgba(8,7,14,.92));
  }
  .ulg-stage-crest {
    position: absolute;
    top: 18px;
    right: 18px;
    width: clamp(74px, 8vw, 110px);
    height: clamp(74px, 8vw, 110px);
    display: grid;
    place-items: center;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--class-accent) 24%, transparent));
  }
  .ulg-stage-copy {
    position: absolute;
    left: 18px;
    top: 18px;
    width: min(56%, 320px);
    display: grid;
    gap: 10px;
    padding: 16px 18px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(16,13,28,.84), rgba(9,8,18,.54)),
      linear-gradient(135deg, color-mix(in srgb, var(--class-accent) 9%, transparent), transparent 56%);
    backdrop-filter: blur(10px);
  }
  .ulg-stage-copy strong {
    font-family: "Manrope", sans-serif;
    font-size: clamp(22px, 2vw, 30px);
  }
  .ulg-stage-honors {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 18px;
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(16,13,28,.92), rgba(10,8,18,.94)),
      url("/ui/panel-texture.png");
    justify-content: space-between;
  }
  .ulg-stage-honors > div:first-child { display: grid; gap: 4px; }
  .ulg-stage-honors strong {
    font-family: "Manrope", sans-serif;
    font-size: 16px;
  }
  .ulg-stage-honors small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .ulg-badge-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-start; }
  .ulg-band {
    display: grid;
    grid-template-columns: 1.3fr .92fr .92fr;
    gap: 12px;
  }
  .ulg-band-copy {
    padding: 18px;
    display: grid;
    gap: 12px;
  }
  .ulg-progress {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255,255,255,.08);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.18);
  }
  .ulg-progress > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 70%, white 8%));
    box-shadow: 0 0 16px color-mix(in srgb, var(--class-accent) 22%, transparent);
  }
  .ulg-rarity-row { gap: 8px; }
  .ulg-honor-strip { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 10px; }
  .ulg-content {
    display: grid;
    grid-template-columns: minmax(0, 1.34fr) minmax(320px, .9fr);
    gap: 18px;
    align-items: start;
  }
  .ulg-board {
    padding: 18px;
    min-width: 0;
  }
  .ulg-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }
  .ulg-section-head h2,
  .ulg-spot-copy h2 {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-size: clamp(24px, 2.4vw, 34px);
  }
  .ulg-controls {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
  }
  .ulg-tab-row { overflow-x: auto; padding-bottom: 2px; }
  .ulg-tab {
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
  }
  .ulg-tab.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 50%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .ulg-tab:hover { transform: translateY(-2px); }
  .ulg-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(170px, .4fr));
    gap: 10px;
  }
  .ulg-search {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .ulg-search input,
  .ulg-select select {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .ulg-select {
    min-height: 48px;
    justify-content: space-between;
    padding-inline: 14px;
  }
  .ulg-state,
  .ulg-group {
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
  }
  .ulg-state {
    padding: 18px;
    display: grid;
    gap: 12px;
    justify-items: center;
    text-align: center;
  }
  .ulg-state strong,
  .ulg-empty strong {
    font-family: "Manrope", sans-serif;
    font-size: 20px;
  }
  .ulg-group {
    padding: 12px;
    margin-bottom: 12px;
  }
  .ulg-group-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    padding: 0 4px;
  }
  .ulg-group-head span:first-child {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--group-color, ${UI.gold});
    box-shadow: 0 0 14px var(--group-color, ${UI.gold});
  }
  .ulg-group-head strong {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .ulg-group-head small {
    margin-left: auto;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
  }
  .ulg-group-head-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ulg-group-toggle {
    min-height: 32px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
  }
  .ulg-group-toggle:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--class-accent) 40%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .ulg-group-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  /* ── Compact achievement row ── */
  .ulg-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px 9px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.022);
    cursor: pointer;
    overflow: hidden;
    transition: background .15s, border-color .15s;
  }
  .ulg-row:hover {
    background: rgba(255,255,255,.042);
    border-color: rgba(255,255,255,.1);
  }
  .ulg-row.is-selected {
    border-color: color-mix(in srgb, var(--row-accent) 38%, transparent);
    background: color-mix(in srgb, var(--row-accent) 7%, rgba(255,255,255,.025));
  }
  .ulg-row.is-ready {
    border-color: rgba(243,201,105,.24);
    background: rgba(243,201,105,.055);
  }
  .ulg-row.is-claimed { opacity: .54; }
  .ulg-row-bar {
    position: absolute;
    left: 0; top: 4px; bottom: 4px;
    width: 2px;
    border-radius: 2px;
    background: var(--row-accent);
  }
  .ulg-row-em {
    font-size: 20px;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: color-mix(in srgb, var(--row-accent) 13%, rgba(8,6,18,.72));
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 6px color-mix(in srgb, var(--row-accent) 48%, transparent));
  }
  .ulg-row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ulg-row-title {
    font: 700 13px/1.2 "Manrope", sans-serif;
    color: ${UI.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 0 10px rgba(255,255,255,.16);
  }
  .ulg-row-sub {
    display: flex;
    align-items: center;
    gap: 5px;
    font: 600 10px/1 "Manrope", sans-serif;
    color: ${UI.mutedDeep};
    text-transform: uppercase;
    letter-spacing: .07em;
    white-space: nowrap;
  }
  .ulg-row-dot { opacity: .35; }
  .ulg-row-prog {
    color: var(--row-accent);
    font-weight: 800;
    text-shadow: 0 0 8px currentColor;
  }
  .ulg-row-detail {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .ulg-row-detail-text {
    font: 400 12px/1.5 "Manrope", sans-serif;
    color: rgba(200,195,220,.72);
  }
  .ulg-row-detail-bar {
    height: 3px;
    border-radius: 2px;
    background: rgba(255,255,255,.07);
    overflow: hidden;
  }
  .ulg-row-detail-bar span {
    display: block;
    height: 100%;
    border-radius: 2px;
    transition: width .4s ease;
  }
  .ulg-row-xp {
    flex-shrink: 0;
    font: 800 11px/1 "JetBrains Mono", monospace;
    color: ${UI.gold};
    letter-spacing: .04em;
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .ulg-row-action {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
  }
  .ulg-claim-btn {
    padding: 5px 11px;
    border-radius: 6px;
    border: none;
    background: ${UI.gold};
    color: #0a0814;
    font: 800 11px/1 "Manrope", sans-serif;
    letter-spacing: .04em;
    cursor: pointer;
    transition: opacity .15s;
    white-space: nowrap;
    text-shadow: none;
  }
  .ulg-claim-btn:not(:disabled):hover { opacity: .88; }
  .ulg-claim-btn:disabled { opacity: .6; cursor: not-allowed; }
  .ulg-check {
    width: 16px;
    height: 16px;
    background: ${UI.green};
    clip-path: polygon(20% 50%,0 65%,40% 100%,100% 25%,80% 10%,40% 70%);
    box-shadow: 0 0 8px rgba(138,201,38,.48);
    flex-shrink: 0;
  }
  .ulg-spot {
    padding: 18px;
    display: grid;
    gap: 14px;
    position: sticky;
    top: 14px;
  }
  .ulg-spot-banner {
    position: relative;
    min-height: 240px;
    overflow: hidden;
    border-radius: 22px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(9,8,18,.14), rgba(9,8,18,.88)),
      var(--spotlight-image) center/cover no-repeat;
  }
  .ulg-spot-banner::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(9,8,18,.72)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--spotlight-color) 16%, transparent), transparent 30%);
  }
  .ulg-spot-inner {
    position: relative;
    z-index: 1;
    min-height: 240px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px;
  }
  .ulg-spot-copy { display: grid; gap: 8px; max-width: 28ch; }
  .ulg-spot-chip-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .ulg-spot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .ulg-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .ulg-btn,
  .ulg-btn-ghost {
    min-height: 46px;
    padding: 12px 16px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    font-weight: 900;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
  }
  .ulg-btn {
    color: #090611;
    background: linear-gradient(135deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 70%, white 8%));
    box-shadow: 0 12px 24px color-mix(in srgb, var(--class-accent) 24%, transparent);
  }
  .ulg-btn-ghost {
    color: ${UI.text};
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
  }
  .ulg-btn:hover:not(:disabled),
  .ulg-btn-ghost:hover:not(:disabled) { transform: translateY(-2px); }
  .ulg-btn:disabled,
  .ulg-btn-ghost:disabled { opacity: .6; cursor: not-allowed; }
  .ulg-empty {
    min-height: 180px;
    display: grid;
    place-items: center;
    gap: 10px;
    text-align: center;
  }
  .ulg-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: grid;
    place-items: center;
    padding: 18px;
    background: rgba(4,3,10,.7);
    backdrop-filter: blur(12px);
  }
  .ulg-modal {
    width: min(720px, 100%);
    max-height: 88vh;
    overflow: auto;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(20,17,34,.98), rgba(9,8,18,.98)),
      url("/ui/panel-texture.png");
    box-shadow: 0 24px 48px rgba(0,0,0,.36), 0 0 0 1px color-mix(in srgb, var(--modal-accent) 18%, transparent);
  }
  .ulg-modal-inner { padding: 18px; display: grid; gap: 14px; }
  .ulg-modal-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .ulg-modal-close {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: ${UI.muted};
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .ulg-modal-art {
    min-height: 260px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(9,8,18,.12), rgba(9,8,18,.86)),
      var(--modal-image) center/cover no-repeat;
  }
  @media (max-width: 1220px) {
    .ulg-hero,
    .ulg-content { grid-template-columns: 1fr; }
    .ulg-band { grid-template-columns: 1fr 1fr; }
    .ulg-spot { position: relative; top: 0; }
  }
  @media (max-width: 860px) {
    .ulg-page { padding: 18px 12px 32px; }
    .ulg-hero { padding: 18px; }
    .ulg-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ulg-stage-copy { width: calc(100% - 36px); }
    .ulg-band { grid-template-columns: 1fr; }
    .ulg-toolbar,
    .ulg-spot-grid { grid-template-columns: 1fr; }
    .ulg-group-grid { grid-template-columns: 1fr; }
    .ulg-row {
      grid-template-columns: 68px minmax(0, 1fr);
      align-items: start;
    }
    .ulg-row-reward,
    .ulg-row-action {
      grid-column: 2 / -1;
      justify-self: start;
    }
    .ulg-row-reward {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-items: start;
      text-align: left;
    }
  }
  @media (max-width: 560px) {
    .ulg-hero-copy h1 { max-width: 12ch; }
    .ulg-hero-stats { grid-template-columns: 1fr; }
    .ulg-actions { flex-direction: column; }
  }
  /* ── Hero stat flip card ── */
  .ulg-sfc {
    perspective: 900px;
    cursor: pointer;
    min-height: 104px;
  }
  .ulg-sfc-inner {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 104px;
    transform-style: preserve-3d;
    transition: transform .4s cubic-bezier(.4,0,.2,1);
  }
  .ulg-sfc.is-flipped .ulg-sfc-inner { transform: rotateY(180deg); }
  .ulg-sfc-face,
  .ulg-sfc-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    padding: 14px 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .ulg-sfc-back {
    transform: rotateY(180deg);
    background: rgba(14,10,24,.94);
    border-color: color-mix(in srgb, var(--sfc-color, var(--class-accent)) 30%, transparent);
    justify-content: center;
  }
  .ulg-sfc-label {
    font: 800 10px/1 "JetBrains Mono", monospace;
    color: rgba(180,170,200,.52);
    text-transform: uppercase;
    letter-spacing: .12em;
  }
  .ulg-sfc-value {
    font: 900 clamp(26px, 2.6vw, 36px)/1 "Manrope", sans-serif;
    margin-top: 4px;
  }
  .ulg-sfc-hint {
    font: 600 9px/1 "JetBrains Mono", monospace;
    color: rgba(180,170,200,.4);
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .ulg-sfc-back p {
    margin: 0;
    font: 500 12px/1.6 "Manrope", sans-serif;
    color: rgba(210,200,230,.8);
  }
  .ulg-sfc:hover .ulg-sfc-face {
    border-color: color-mix(in srgb, var(--sfc-color, var(--class-accent)) 32%, rgba(255,255,255,.08));
    background: rgba(255,255,255,.056);
  }
  /* ── Achievement flip card ── */
  @keyframes ulg-card-in { from { opacity: 0; transform: scale(.95) translateY(6px); } to { opacity: 1; transform: none; } }
  .ulg-card {
    perspective: 900px;
    cursor: pointer;
    min-height: 86px;
    animation: ulg-card-in .3s ease both;
  }
  .ulg-card-inner {
    position: relative;
    width: 100%;
    min-height: 86px;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform .42s cubic-bezier(.4,0,.2,1);
  }
  .ulg-card.is-flipped .ulg-card-inner { transform: rotateY(180deg); }
  .ulg-card-face,
  .ulg-card-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.07);
    background: rgba(255,255,255,.028);
    padding: 10px 12px;
    overflow: hidden;
  }
  .ulg-card-face::before,
  .ulg-card-back::before {
    content: "";
    position: absolute;
    left: 0; top: 8px; bottom: 8px;
    width: 2px;
    border-radius: 2px;
    background: var(--row-accent);
  }
  .ulg-card-back {
    transform: rotateY(180deg);
    background: rgba(14,10,24,.94);
    border-color: color-mix(in srgb, var(--row-accent) 30%, transparent);
    display: flex;
    flex-direction: column;
    gap: 7px;
    justify-content: space-between;
  }
  .ulg-card.is-claimable .ulg-card-face {
    border-color: rgba(243,201,105,.3);
    background: rgba(243,201,105,.055);
    box-shadow: 0 0 18px rgba(243,201,105,.08);
  }
  .ulg-card.is-claimed { opacity: .56; }
  .ulg-card:hover .ulg-card-face {
    border-color: color-mix(in srgb, var(--row-accent) 28%, rgba(255,255,255,.1));
    background: rgba(255,255,255,.042);
  }
  /* front layout */
  .ulg-cf-body {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 100%;
    padding-left: 8px;
  }
  .ulg-cf-medal {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    object-fit: contain;
    filter: drop-shadow(0 0 7px color-mix(in srgb, var(--row-accent) 55%, transparent));
  }
  .ulg-cf-text { flex: 1; min-width: 0; }
  .ulg-cf-name {
    font: 700 12px/1.35 "Manrope", sans-serif;
    color: #f7f1ff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 0 8px rgba(255,255,255,.1);
  }
  .ulg-cf-status {
    margin-top: 4px;
    font: 700 9px/1 "JetBrains Mono", monospace;
    color: var(--row-accent);
    text-shadow: 0 0 8px currentColor;
    text-transform: uppercase;
    letter-spacing: .07em;
  }
  .ulg-cf-dot {
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 99px;
    background: var(--row-accent);
    box-shadow: 0 0 8px var(--row-accent);
    align-self: flex-start;
    margin-top: 3px;
  }
  /* back layout */
  .ulg-cb-desc {
    font: 400 11px/1.5 "Manrope", sans-serif;
    color: rgba(200,190,220,.76);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    padding-left: 8px;
  }
  .ulg-cb-bar {
    height: 3px;
    border-radius: 99px;
    background: rgba(255,255,255,.07);
    overflow: hidden;
    margin: 0 2px;
  }
  .ulg-cb-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    transition: width .4s ease;
  }
  .ulg-cb-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-left: 8px;
  }
  .ulg-cb-xp {
    font: 800 10px/1 "JetBrains Mono", monospace;
    color: #f3c969;
    text-shadow: 0 0 10px currentColor;
    letter-spacing: .04em;
  }
  .ulg-cb-prog {
    font: 600 10px/1 "Manrope", sans-serif;
    color: rgba(180,170,200,.55);
  }
`;

function normalizeLoose(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getRarezaMeta(value) {
  const key = normalizeLoose(value);
  if (key === "legendario" || key === "legendary") {
    return { key: "legendary", label: "Legendario", color: UI.gold, tier: 4, asset: "/ui/rarity/rarity-legendary.png" };
  }
  if (key === "epico" || key === "epic") {
    return { key: "epic", label: "Epico", color: UI.purple, tier: 3, asset: "/ui/rarity/rarity-epic.png" };
  }
  if (key === "raro" || key === "rare") {
    return { key: "rare", label: "Raro", color: UI.blue, tier: 2, asset: "/ui/rarity/rarity-rare.png" };
  }
  return { key: "common", label: "Comun", color: UI.orange, tier: 1, asset: "/ui/rarity/rarity-common.png" };
}

function getStatusMeta(logro, classAccent) {
  if (logro?.reclamado) {
    return {
      key: "claimed",
      label: "Archivado",
      color: UI.green,
      asset: "/logros/states/state-claimed.png",
      detail: "La insignia ya quedo guardada en tu vitrina.",
    };
  }
  if (logro?.obtenido) {
    return {
      key: "claimable",
      label: "Lista para reclamar",
      color: UI.gold,
      asset: "/logros/states/state-claimable.png",
      detail: "Ya cumpliste el objetivo y solo falta cobrar el botin.",
    };
  }
  if (logro?.secreto) {
    return {
      key: "secret",
      label: "Sello oculto",
      color: UI.mutedDeep,
      asset: "/logros/states/state-secret.png",
      detail: "Sigue entrenando para revelar esta pieza del tablero.",
    };
  }
  return {
    key: "active",
    label: "En progreso",
    color: classAccent,
    asset: "/logros/states/state-active.png",
    detail: "Aun falta otro empuje para cerrar esta meta.",
  };
}

function achievementProgress(logro) {
  return Math.round((Number(logro?.progreso || 0) / Math.max(1, Number(logro?.total || 1))) * 100);
}

function getLogroFrameAsset(value) {
  const rarity = getRarezaMeta(value);
  return `/logros/rows/row-${rarity.key}.png`;
}

function getLogroMedalAsset(logro) {
  const rarity = getRarezaMeta(logro?.rareza);
  if (rarity.key === "legendary") return "/ui/medals/rank-crown.png";
  if (rarity.key === "epic") return "/ui/medals/medal-gold.png";
  if (rarity.key === "rare") return "/ui/medals/medal-silver.png";
  return "/ui/medals/medal-bronze.png";
}

function LogroArt({ logro, alt = "", className = "", style = {}, fit = "contain" }) {
  return (
    <img
      src={getLogroMedalAsset(logro)}
      alt={alt}
      className={className}
      style={{ objectFit: fit, ...style }}
    />
  );
}

function BadgeMedallion({ logro, size = 54, onClick, isNew = false }) {
  const rarity = getRarezaMeta(logro?.rareza);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        border: `1px solid ${rarity.color}55`,
        background: `radial-gradient(circle, ${rarity.color}22, rgba(10,8,18,.92))`,
        boxShadow: `0 0 18px ${rarity.color}22`,
        display: "grid",
        placeItems: "center",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      <img
        src={`/logros/${logro.id}-icon.png`}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(event) => { event.currentTarget.style.display = "none"; }}
      />
      <span style={{ position: "absolute", fontSize: size > 50 ? 22 : 16 }}>{logro.imagen || "🏆"}</span>
      {isNew && (
        <span style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 10,
          height: 10,
          borderRadius: 999,
          background: UI.gold,
          boxShadow: `0 0 12px ${UI.gold}`,
        }} />
      )}
    </button>
  );
}

function AchievementRow({ logro, selected, onSelect, onClaim, claiming }) {
  const rarity = getRarezaMeta(logro.rareza);
  const status = getStatusMeta(logro, rarity.color);
  const progress = achievementProgress(logro);
  const ready = status.key === "claimable";
  const claimed = status.key === "claimed";
  const rewardGem = logro.recompensas?.find((reward) => normalizeLoose(reward?.tipo || reward?.nombre || reward?.icon || "") !== "xp");

  const label = logro.obtenido || !logro.secreto ? logro.nombre : "Sello oculto";
  const desc  = logro.obtenido || !logro.secreto ? logro.descripcion : "Sigue avanzando. Esta pieza sigue protegida por el mapa.";

  return (
    <div
      className={`ulg-row${selected ? " is-selected" : ""}${ready ? " is-ready" : ""}${claimed ? " is-claimed" : ""}`}
      style={{ "--row-accent": rarity.color }}
      onClick={onSelect}
    >
      <span className="ulg-row-bar" />

      <span className="ulg-row-em">{logro.imagen || "🏆"}</span>

      <span className="ulg-row-body">
        <span className="ulg-row-title">{label}</span>
        <span className="ulg-row-sub">
          <span style={{ color: status.color }}>{status.label}</span>
          {!claimed && (
            <>
              <span className="ulg-row-dot">·</span>
              <span className="ulg-row-prog">{logro.progreso}/{logro.total}</span>
            </>
          )}
        </span>
        {selected && (
          <span className="ulg-row-detail">
            <span className="ulg-row-detail-text">{desc}</span>
            <span className="ulg-row-detail-bar">
              <span style={{ width: `${claimed ? 100 : progress}%`, background: `linear-gradient(90deg, ${status.color}, ${rarity.color})` }} />
            </span>
          </span>
        )}
      </span>

      <span className="ulg-row-xp">+{logro.xpBonus} XP</span>

      <div className="ulg-row-action">
        {ready ? (
          <button
            type="button"
            className="ulg-claim-btn"
            disabled={claiming === logro.id}
            onClick={(event) => { event.stopPropagation(); onClaim(logro); }}
          >
            {claiming === logro.id ? "..." : "Cobrar"}
          </button>
        ) : claimed ? (
          <span className="ulg-check" />
        ) : (
          <Lock size={14} color={UI.mutedDeep} />
        )}
      </div>
    </div>
  );
}

function BadgeMedallionVisual({ logro, size = 54, onClick, isNew = false }) {
  const rarity = getRarezaMeta(logro?.rareza);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        border: `1px solid ${rarity.color}55`,
        background: `radial-gradient(circle, ${rarity.color}22, rgba(10,8,18,.92))`,
        boxShadow: `0 0 18px ${rarity.color}22`,
        display: "grid",
        placeItems: "center",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      <LogroArt logro={logro} alt="" style={{ width: "76%", height: "76%" }} />
      {isNew && (
        <span style={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 10,
          height: 10,
          borderRadius: 999,
          background: UI.gold,
          boxShadow: `0 0 12px ${UI.gold}`,
        }} />
      )}
    </button>
  );
}

function StatFlipCard({ label, value, desc, color, hint = "ver detalle" }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`ulg-sfc${flipped ? " is-flipped" : ""}`}
      style={{ "--sfc-color": color }}
      onClick={() => setFlipped((prev) => !prev)}
    >
      <div className="ulg-sfc-inner">
        <div className="ulg-sfc-face">
          <span className="ulg-sfc-label">{label}</span>
          <span className="ulg-sfc-value" style={{ color }}>{value}</span>
          <span className="ulg-sfc-hint">{hint}</span>
        </div>
        <div className="ulg-sfc-back">
          <p>{desc}</p>
        </div>
      </div>
    </div>
  );
}

function AchievementRowCompact({ logro, selected, onSelect, onClaim, claiming }) {
  const [flipped, setFlipped] = useState(false);
  const rarity = getRarezaMeta(logro.rareza);
  const status = getStatusMeta(logro, rarity.color);
  const progress = achievementProgress(logro);
  const ready = status.key === "claimable";
  const claimed = status.key === "claimed";
  const label = logro.obtenido || !logro.secreto ? logro.nombre : "Sello oculto";
  const desc = logro.obtenido || !logro.secreto
    ? logro.descripcion
    : "Sigue avanzando. Esta pieza sigue protegida por el mapa.";

  function handleFlip() {
    setFlipped((prev) => !prev);
    onSelect?.();
  }

  return (
    <div
      className={`ulg-card${flipped ? " is-flipped" : ""}${ready ? " is-claimable" : ""}${claimed ? " is-claimed" : ""}${selected ? " is-selected" : ""}`}
      style={{ "--row-accent": rarity.color }}
      onClick={handleFlip}
    >
      <div className="ulg-card-inner">
        {/* FRENTE — solo nombre e icono */}
        <div className="ulg-card-face">
          <div className="ulg-cf-body">
            <LogroArt logro={logro} alt="" className="ulg-cf-medal" />
            <div className="ulg-cf-text">
              <div className="ulg-cf-name">{label}</div>
              <div className="ulg-cf-status">{status.label}</div>
            </div>
            <span className="ulg-cf-dot" />
          </div>
        </div>

        {/* DORSO — descripcion, progreso, recompensa */}
        <div className="ulg-card-back" onClick={(event) => event.stopPropagation()}>
          <div className="ulg-cb-desc">{desc}</div>
          <div className="ulg-cb-bar">
            <span style={{
              width: `${claimed ? 100 : progress}%`,
              background: `linear-gradient(90deg, ${status.color}, ${rarity.color})`,
            }} />
          </div>
          <div className="ulg-cb-footer">
            <span className="ulg-cb-xp">+{logro.xpBonus} XP</span>
            <span className="ulg-cb-prog">{claimed ? "Completo" : `${logro.progreso}/${logro.total}`}</span>
            {ready && (
              <button
                type="button"
                className="ulg-claim-btn"
                disabled={claiming === logro.id}
                onClick={(event) => { event.stopPropagation(); onClaim(logro); }}
              >
                {claiming === logro.id ? "..." : "Cobrar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ logro, classTheme, onClose, onClaim, claiming }) {
  if (!logro) return null;
  const rarity = getRarezaMeta(logro.rareza);
  const status = getStatusMeta(logro, classTheme.accent);
  const progress = achievementProgress(logro);
  const rewardGem = logro.recompensas?.find((reward) => normalizeLoose(reward?.tipo || reward?.nombre || reward?.icon || "") !== "xp");
  const TypeIcon = TYPE_META[logro.tipo]?.icon || Award;

  return (
    <motion.div
      className="ulg-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        className="ulg-modal"
        style={{ "--modal-accent": rarity.color, "--modal-image": `url(/logros/${logro.id}-detail.png)` }}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
      >
        <div className="ulg-modal-inner">
          <div className="ulg-modal-head">
            <div>
              <div className="ulg-kicker">
                <TypeIcon size={14} />
                <span>{logro.tipo}</span>
              </div>
              <h2 style={{ margin: "10px 0 6px", fontFamily: "'Manrope',sans-serif" }}>
                {logro.obtenido || !logro.secreto ? logro.nombre : "Sello oculto"}
              </h2>
              <p style={{ margin: 0, color: UI.muted, fontFamily: "'Manrope',sans-serif" }}>{status.detail}</p>
            </div>
            <button type="button" className="ulg-modal-close" onClick={onClose} aria-label="Cerrar detalle">
              <X size={16} />
            </button>
          </div>

          <div className="ulg-modal-art" />

          <div className="ulg-spot-chip-row">
            <span className="ulg-spot-chip" style={{ color: status.color, borderColor: `${status.color}55` }}>
              <img src={status.asset} alt="" />
              {status.label}
            </span>
            <span className="ulg-spot-chip" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>
              <img src={rarity.asset} alt="" />
              {rarity.label}
            </span>
          </div>

          <div className="ulg-progress-card">
            <small>Progreso</small>
            <strong style={{ color: status.color }}>{logro.reclamado ? "Completado" : `${logro.progreso}/${logro.total}`}</strong>
            <div className="ulg-progress" style={{ marginTop: 10 }}>
              <span style={{ width: `${logro.reclamado ? 100 : progress}%`, background: `linear-gradient(90deg, ${status.color}, ${rarity.color})` }} />
            </div>
          </div>

          <div className="ulg-spot-grid">
            <div className="ulg-info-card">
              <small>Objetivo</small>
              <strong>{logro.secreto && !logro.obtenido ? "Condicion oculta" : "Meta visible"}</strong>
              <p>{logro.secreto && !logro.obtenido ? "Sigue jugando. Este logro se abre cuando el mapa lo decida." : logro.descripcion}</p>
            </div>
            <div className="ulg-info-card">
              <small>Botin</small>
              <strong style={{ color: UI.gold }}>+{logro.xpBonus} XP</strong>
              <p>{rewardGem ? `Incluye ${rewardGem.valor || rewardGem.nombre || "recompensa extra"} ademas del XP principal.` : `Tambien deja ${Math.max(1, Math.floor(logro.xpBonus / 10))} gemas como premio secundario.`}</p>
            </div>
          </div>

          <div className="ulg-actions">
            {logro.obtenido && !logro.reclamado ? (
              <button type="button" className="ulg-btn" disabled={claiming === logro.id} onClick={() => onClaim(logro)}>
                <Gift size={16} />
                {claiming === logro.id ? "Reclamando..." : "Reclamar recompensa"}
              </button>
            ) : (
              <button type="button" className="ulg-btn-ghost" onClick={onClose}>
                <Trophy size={16} />
                Cerrar ficha
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function UserLogrosLanding({ profile, onNavigate }) {
  const isMobile = useIsMobile();
  const classKey = String(profile?.heroClass || "DEFAULT").toUpperCase();
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const stageTheme = STAGE_THEME[classKey] || STAGE_THEME.DEFAULT;
  const [logros, setLogros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterRarity, setFilterRarity] = useState(() => localStorage.getItem("ulg-rarity") || "all");
  const [filterState, setFilterState] = useState(() => localStorage.getItem("ulg-state") || "all");
  const [selectedId, setSelectedId] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [xpNotif, setXpNotif] = useState(null);
  const [levelUpPop, setLevelUpPop] = useState(null);
  const [newToast, setNewToast] = useState(null);
  const [detailOpen, setDetailOpen] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const prevRef = useRef([]);
  const pollRef = useRef(null);

  const loadLogros = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const user = auth.currentUser;
      if (!user) {
        setLogros([]);
        return;
      }
      const token = await user.getIdToken();
      const res = await getLogrosCatalogo(token);
      const next = res?.ok && Array.isArray(res.logros) ? res.logros : [];
      const previous = prevRef.current;
      const newUnlocked = next.filter((item) => {
        const old = previous.find((entry) => entry.id === item.id);
        return item.obtenido && !old?.obtenido;
      });
      if (newUnlocked.length > 0) {
        setNewToast(newUnlocked[0]);
        window.setTimeout(() => setNewToast(null), 4200);
      }
      prevRef.current = next;
      setLogros(next);
    } catch (err) {
      console.error(err);
      setError("No pudimos leer la vitrina del heroe. Revisa la conexion e intenta otra vez.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) loadLogros();
      else {
        setLogros([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadLogros]);

  useEffect(() => {
    const handler = () => loadLogros(true);
    window.addEventListener("exerciseCompleted", handler);
    return () => window.removeEventListener("exerciseCompleted", handler);
  }, [loadLogros]);

  useEffect(() => {
    localStorage.setItem("ulg-rarity", filterRarity);
  }, [filterRarity]);

  useEffect(() => {
    localStorage.setItem("ulg-state", filterState);
  }, [filterState]);

  useEffect(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (!document.hidden) loadLogros(true);
    }, 45000);
    return () => clearInterval(pollRef.current);
  }, [loadLogros]);

  const filtered = useMemo(() => {
    return logros.filter((logro) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const haystack = `${logro.nombre || ""} ${logro.descripcion || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterTipo !== "Todos" && logro.tipo !== filterTipo) return false;
      if (filterRarity !== "all" && getRarezaMeta(logro.rareza).key !== filterRarity) return false;
      const state = getStatusMeta(logro, classTheme.accent).key;
      if (filterState === "claimable" && state !== "claimable") return false;
      if (filterState === "claimed" && state !== "claimed") return false;
      if (filterState === "active" && state !== "active") return false;
      if (filterState === "secret" && state !== "secret") return false;
      return true;
    });
  }, [logros, search, filterTipo, filterRarity, filterState, classTheme.accent]);

  const grouped = useMemo(() => {
    return Object.keys(TYPE_META)
      .map((tipo) => ({ tipo, items: filtered.filter((logro) => logro.tipo === tipo) }))
      .filter((group) => group.items.length > 0);
  }, [filtered]);

  const claimable = useMemo(() => logros.filter((logro) => logro.obtenido && !logro.reclamado), [logros]);
  const claimed = useMemo(() => logros.filter((logro) => logro.reclamado), [logros]);
  const obtained = useMemo(() => logros.filter((logro) => logro.obtenido), [logros]);
  const visibleTotal = useMemo(() => logros.filter((logro) => !logro.secreto || logro.obtenido).length, [logros]);
  const pct = visibleTotal > 0 ? Math.round((obtained.length / visibleTotal) * 100) : 0;
  const xpTotal = useMemo(() => claimed.reduce((sum, logro) => sum + Number(logro.xpBonus || 0), 0), [claimed]);
  const xpPending = useMemo(() => claimable.reduce((sum, logro) => sum + Number(logro.xpBonus || 0), 0), [claimable]);
  const honorShowcase = useMemo(() => [...claimed].sort((a, b) => getRarezaMeta(b.rareza).tier - getRarezaMeta(a.rareza).tier).slice(0, 6), [claimed]);

  useEffect(() => {
    if (!selectedId && logros.length > 0) {
      setSelectedId((claimable[0] || obtained[0] || logros[0]).id);
    }
  }, [selectedId, logros, claimable, obtained]);

  useEffect(() => {
    if (selectedId && !logros.some((logro) => logro.id === selectedId)) {
      setSelectedId(logros[0]?.id || null);
    }
  }, [selectedId, logros]);

  useEffect(() => {
    if (!logros.length || typeof window === "undefined") return undefined;

    const applyChatAction = (raw) => {
      const payload = raw?.detail || raw;
      if (!payload || payload.section !== "logros") return false;
      const targetId = payload.achievementId || payload.entityId || null;
      if (!targetId) return false;
      const targetLogro = logros.find((logro) => logro.id === targetId);
      if (!targetLogro) return false;
      setSelectedId(targetLogro.id);
      return true;
    };

    const handleChatAction = (event) => {
      applyChatAction(event);
    };

    try {
      const stored = window.sessionStorage.getItem(CHAT_DEEPLINK_KEY);
      if (stored && applyChatAction(JSON.parse(stored))) {
        window.sessionStorage.removeItem(CHAT_DEEPLINK_KEY);
      }
    } catch {}

    window.addEventListener("chatGameplayLink", handleChatAction);
    return () => window.removeEventListener("chatGameplayLink", handleChatAction);
  }, [logros]);

  const selectedLogro = logros.find((logro) => logro.id === selectedId) || claimable[0] || logros[0] || null;
  const selectedRarity = getRarezaMeta(selectedLogro?.rareza);
  const selectedStatus = getStatusMeta(selectedLogro || {}, classTheme.accent);
  const selectedType = TYPE_META[selectedLogro?.tipo] || TYPE_META.Especial;
  const SelectedTypeIcon = selectedType.icon || Award;
  const selectedProgress = achievementProgress(selectedLogro);
  const raritySummary = useMemo(() => ([
    { label: "Comun", key: "common" },
    { label: "Raro", key: "rare" },
    { label: "Epico", key: "epic" },
    { label: "Legendario", key: "legendary" },
  ].map((entry) => {
    const count = logros.filter((logro) => getRarezaMeta(logro.rareza).key === entry.key && logro.obtenido).length;
    const total = logros.filter((logro) => getRarezaMeta(logro.rareza).key === entry.key).length;
    const meta = getRarezaMeta(entry.label);
    return { ...entry, count, total, meta };
  })), [logros]);

  const ctxMsg = loading
    ? "La sala esta alineando insignias y lectura del progreso."
    : claimable.length > 0
      ? `${claimable.length} recompensas ya quedaron listas para cobrar.`
      : pct >= 85
        ? `Tu coleccion ya pisa ${pct}% del mapa visible.`
        : `La vitrina sigue ordenando progreso, rareza y botin pendiente.`;

  const handleClaim = useCallback(async (logro) => {
    if (!logro || logro.reclamado || claiming === logro.id) return;
    try {
      setClaiming(logro.id);
      setError("");
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await claimLogro(token, logro.id);
      if (!res?.ok && !res?.alreadyClaimed) throw new Error("No se pudo reclamar el logro.");

      const xp = Number((res?.xpGranted ?? res?.xpGanado ?? logro.xpBonus) || 0);
      setLogros((current) => current.map((item) => (
        item.id === logro.id ? { ...item, reclamado: true, obtenido: true } : item
      )));

      if (xp > 0 && canShowXpPopups()) {
        setXpNotif(xp);
        window.setTimeout(() => setXpNotif(null), 2600);
      }

      if (res?.leveledUp || (res?.newLevel && res.newLevel > (profile?.level || 0))) {
        setLevelUpPop(res.newLevel || res.level);
        window.setTimeout(() => setLevelUpPop(null), 3200);
      }

      window.dispatchEvent(new CustomEvent("exerciseCompleted", {
        detail: {
          xp,
          newLevel:  res?.newLevel || res?.level,
          xpNext:    res?.xpNext,
          leveledUp: res?.leveledUp,
          weeklyXP:  res?.weeklyXP,
          streak:    res?.streak,
        },
      }));

      loadLogros(true);
    } catch (err) {
      console.error(err);
      setError("No pudimos reclamar esta insignia. Intenta otra vez.");
    } finally {
      setClaiming(null);
    }
  }, [claiming, loadLogros, profile?.level]);

  const toggleGroup = useCallback((tipo) => {
    setExpandedGroups((current) => ({ ...current, [tipo]: !current[tipo] }));
  }, []);

  return (
    <>
      <style>{CSS}</style>

      <AnimatePresence>
        {detailOpen && (
          <DetailModal
            logro={detailOpen}
            classTheme={classTheme}
            onClose={() => setDetailOpen(null)}
            onClaim={handleClaim}
            claiming={claiming}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newToast && (
          <motion.div
            initial={{ x: 140, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 140, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{ position: "fixed", bottom: 28, right: 24, zIndex: 910, maxWidth: 320 }}
          >
            <div style={{ background: "#161122", border: `2px solid ${getRarezaMeta(newToast.rareza).color}77`,
              boxShadow: `0 0 32px ${getRarezaMeta(newToast.rareza).color}44,0 8px 32px rgba(0,0,0,.75)`,
              padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, overflow: "hidden", borderRadius: 18 }}>
              <BadgeMedallionVisual logro={{ ...newToast, obtenido: true }} size={58} isNew />
              <div>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 900 }}>{newToast.nombre}</div>
                <div style={{ color: getRarezaMeta(newToast.rareza).color, fontFamily: "'Manrope',sans-serif", fontWeight: 800 }}>
                  {getRarezaMeta(newToast.rareza).label} · +{newToast.xpBonus || 0} XP
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {xpNotif && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 905,
          pointerEvents: "none",
          fontFamily: "'Manrope',sans-serif",
          fontSize: 34,
          fontWeight: 900,
          color: UI.gold,
          textShadow: `0 0 40px ${UI.gold},0 0 80px ${UI.gold}44`,
          transform: "translate(-50%, -50%)",
        }}>
          +{xpNotif} XP
        </div>
      )}

      {levelUpPop && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 906,
          pointerEvents: "none",
          textAlign: "center",
          transform: "translate(-50%, -50%)",
        }}>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 900, color: UI.gold, letterSpacing: ".12em" }}>
            NIVEL SUBIDO
          </div>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 42, fontWeight: 900, color: "#fff" }}>
            {levelUpPop}
          </div>
        </div>
      )}

      <div
        className="ulg-page"
        style={{
          "--class-accent": classTheme.accent,
          "--class-secondary": classTheme.secondary || classTheme.accent,
        }}
      >
        <div className="ulg-shell">
          <section className="ulg-panel ulg-hero">
            <div className="ulg-hero-copy">
              <div className="ulg-kicker">
                <img src="/ui/header/section-logros.png" alt="" />
                <span>Sala de logros</span>
              </div>

              <div>
                <h1>Convierte esfuerzo real en insignias <span>que si pesan.</span></h1>
                <p>
                  El tablero ahora deja ver progreso, rareza y botin pendiente con mucha
                  mejor lectura. Menos ruido, mas presencia y una vitrina que si se siente parte del mundo RPG.
                </p>
              </div>

              <div className="ulg-chip-row">
                <span className="ulg-chip is-focus">
                  <Award size={14} />
                  Clase {classTheme.label}
                </span>
                <span className="ulg-chip">
                  <Trophy size={14} color={UI.gold} />
                  {ctxMsg}
                </span>
                {claimable.length > 0 && (
                  <span className="ulg-chip">
                    <Gift size={14} color={UI.gold} />
                    {claimable.length} recompensas listas y +{xpPending.toLocaleString()} XP por cobrar
                  </span>
                )}
              </div>

              <div className="ulg-hero-stats">
                <StatFlipCard
                  label="Insignias ganadas"
                  value={`${obtained.length}/${Math.max(visibleTotal, 1)}`}
                  desc={`${pct}% de la coleccion visible ya tiene marca del heroe.`}
                  color={UI.gold}
                  hint={`${pct}% completado`}
                />
                <StatFlipCard
                  label="Botin pendiente"
                  value={claimable.length}
                  desc="Premios listos para reclamar sin perderte en el tablero."
                  color={claimable.length > 0 ? UI.gold : UI.muted}
                  hint={claimable.length > 0 ? "listos para cobrar" : "al dia"}
                />
                <StatFlipCard
                  label="XP de logros"
                  value={`+${xpTotal.toLocaleString()}`}
                  desc="Experiencia ya cobrada desde tus medallas y sellos archivados."
                  color={classTheme.accent}
                  hint="xp acumulado"
                />
                <StatFlipCard
                  label="Sala activa"
                  value={stageTheme.label}
                  desc={stageTheme.copy}
                  color={classTheme.secondary || classTheme.accent}
                  hint="tu territorio"
                />
              </div>
            </div>

            <div
              className="ulg-stage"
              style={{
                "--stage-image": `url(${stageTheme.image})`,
              }}
            >
              <div className="ulg-stage-crest">
                <img src="/ui/header/section-logros.png" alt="" />
              </div>

              <div className="ulg-stage-copy">
                <small style={{ color: UI.mutedDeep, fontFamily: "'Manrope',sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em" }}>
                  Portada del salon
                </small>
                <strong>{stageTheme.label}</strong>
                <p>{stageTheme.copy}</p>
              </div>

              <div className="ulg-stage-honors">
                <div>
                  <small>Honor destacado</small>
                  <strong>{honorShowcase[0]?.nombre || selectedLogro?.nombre || "Tu siguiente insignia"}</strong>
                </div>
                <div className="ulg-badge-row">
                  {(honorShowcase.length > 0 ? honorShowcase : (selectedLogro ? [selectedLogro] : [])).slice(0, 5).map((logro) => (
                    <BadgeMedallionVisual
                      key={logro.id}
                      logro={logro}
                      size={50}
                      isNew={newToast?.id === logro.id}
                      onClick={() => setSelectedId(logro.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="ulg-band">
            <div className="ulg-panel ulg-band-copy">
              <div className="ulg-kicker">
                <TrendingUp size={14} />
                <span>Bitacora del salon</span>
              </div>
              <div>
                <strong style={{ display: "block", fontFamily: "'Manrope',sans-serif", fontSize: 28 }}>
                  Tu coleccion ya muestra {pct}% del mapa visible
                </strong>
                <p>
                  Cada reto completado deja rastro claro: que ya cobraste, que esta listo
                  y que piezas todavia necesitan otro empuje.
                </p>
              </div>
              <div className="ulg-progress" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="ulg-panel ulg-metric">
              <small>Rarezas vivas</small>
              <strong style={{ color: classTheme.accent }}>{raritySummary.filter((item) => item.count > 0).length}/4</strong>
              <div className="ulg-rarity-row" style={{ marginTop: 10 }}>
                {raritySummary.map((item) => (
                  <span key={item.key} className="ulg-rarity-pill" style={{ color: item.meta.color, borderColor: `${item.meta.color}55` }}>
                    <img src={item.meta.asset} alt="" />
                    {item.label} {item.count}/{Math.max(item.total, 0)}
                  </span>
                ))}
              </div>
            </div>

            <div className="ulg-panel ulg-metric">
              <small>Salon de honor</small>
              <strong style={{ color: UI.gold }}>{claimed.length}</strong>
              <div className="ulg-honor-strip">
                {honorShowcase.length > 0 ? honorShowcase.slice(0, 4).map((logro) => (
                  <BadgeMedallionVisual key={logro.id} logro={logro} size={46} onClick={() => setSelectedId(logro.id)} />
                )) : <p>Todavia no hay piezas archivadas. Las primeras llegan apenas cierres tus metas base.</p>}
              </div>
            </div>
          </section>

          <div className="ulg-content">
            <section className="ulg-panel ulg-board">
              <div className="ulg-section-head">
                <div>
                  <div className="ulg-kicker">
                    <img src="/ui/header/section-logros.png" alt="" />
                    <span>Registro del heroe</span>
                  </div>
                  <h2 style={{ marginTop: 10 }}>Tablero de insignias</h2>
                  <p>
                    {filtered.length} entradas visibles. Todo queda seccionado para revisar,
                    seguir o cobrar sin convertir la pantalla en una pared infinita.
                  </p>
                </div>

                <div className="ulg-progress-card" style={{ minWidth: isMobile ? "auto" : 240 }}>
                  <small>Lectura actual</small>
                  <strong style={{ color: classTheme.accent }}>{filterTipo === "Todos" ? "Vista completa" : filterTipo}</strong>
                  <p>{claimable.length} logros listos y {claimed.length} ya archivados en tu vitrina.</p>
                </div>
              </div>

              <div className="ulg-controls">
                <div className="ulg-tab-row">
                  {["Todos", ...Object.keys(TYPE_META)].map((tipo) => {
                    const active = filterTipo === tipo;
                    const count = tipo === "Todos" ? logros.length : logros.filter((logro) => logro.tipo === tipo).length;
                    const readyCount = tipo === "Todos"
                      ? claimable.length
                      : logros.filter((logro) => logro.tipo === tipo && logro.obtenido && !logro.reclamado).length;
                    const meta = TYPE_META[tipo];
                    const Icon = meta?.icon || Trophy;
                    return (
                      <button key={tipo} className={`ulg-tab${active ? " is-active" : ""}`} onClick={() => setFilterTipo(tipo)}>
                        {tipo === "Todos" ? <Trophy size={14} /> : <Icon size={14} />}
                        <span>{tipo === "Todos" ? "Todo el salon" : tipo}</span>
                        <small style={{ color: active ? classTheme.accent : UI.mutedDeep }}>{count}</small>
                        {readyCount > 0 && <span style={{ color: UI.gold }}>{readyCount}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="ulg-toolbar">
                  <div className="ulg-search">
                    <Search size={15} color={UI.muted} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar insignia, objetivo o descripcion..."
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", color: UI.muted, cursor: "pointer", display: "flex" }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <label className="ulg-select">
                    <span style={{ color: UI.muted }}>Rareza</span>
                    <select value={filterRarity} onChange={(event) => setFilterRarity(event.target.value)}>
                      <option value="all">Todas</option>
                      <option value="common">Comun</option>
                      <option value="rare">Raro</option>
                      <option value="epic">Epico</option>
                      <option value="legendary">Legendario</option>
                    </select>
                  </label>

                  <label className="ulg-select">
                    <span style={{ color: UI.muted }}>Estado</span>
                    <select value={filterState} onChange={(event) => setFilterState(event.target.value)}>
                      <option value="all">Todo</option>
                      <option value="claimable">Listos</option>
                      <option value="claimed">Archivados</option>
                      <option value="active">En progreso</option>
                      <option value="secret">Secretos</option>
                    </select>
                  </label>
                </div>
              </div>

              {error && (
                <div className="ulg-state" style={{ borderColor: `${UI.red}55` }}>
                  <X size={20} color={UI.red} />
                  <strong style={{ color: UI.red }}>No pudimos leer el salon</strong>
                  <p>{error}</p>
                </div>
              )}

              {loading && (
                <div className="ulg-group">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="ulg-row" style={{ height: 96, opacity: .35, cursor: "default", "--row-accent": classTheme.accent }} />
                  ))}
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="ulg-state">
                  <img src="/ui/header/section-logros.png" alt="" style={{ width: 48, height: 48, objectFit: "contain", opacity: .8 }} />
                  <strong>El salon no encontro piezas con este filtro</strong>
                  <p>Prueba otra rareza, abre mas categorias o limpia la busqueda para ver mejor el tablero.</p>
                </div>
              )}

              {!loading && grouped.map(({ tipo, items }) => {
                const meta = TYPE_META[tipo] || TYPE_META.Especial;
                const GroupIcon = meta.icon || Award;
                const expanded = !!expandedGroups[tipo];
                const visibleItems = expanded ? items : items.slice(0, 4);
                return (
                  <div className="ulg-group" key={tipo}>
                    <div className="ulg-group-head" style={{ "--group-color": meta.color || classTheme.accent }}>
                      <span />
                      <GroupIcon size={15} color={meta.color || classTheme.accent} />
                      <strong>{tipo}</strong>
                      <div className="ulg-group-head-actions">
                        <small>{items.filter((item) => item.obtenido).length}/{items.length}</small>
                        {items.length > 4 && (
                          <button
                            type="button"
                            className="ulg-group-toggle"
                            onClick={() => toggleGroup(tipo)}
                          >
                            {expanded ? "Ver menos" : `Ver ${items.length - 4} mas`}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="ulg-group-grid">
                      {visibleItems.map((logro) => (
                        <AchievementRowCompact
                          key={logro.id}
                          logro={logro}
                          selected={selectedLogro?.id === logro.id}
                          onSelect={() => setSelectedId(logro.id)}
                          onClaim={handleClaim}
                          claiming={claiming}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>

            <aside className="ulg-panel ulg-spot">
              {selectedLogro ? (
                <>
                  <div
                    className="ulg-spot-banner"
                    style={{
                      "--spotlight-image": `url(/logros/${selectedLogro.id}-detail.png), url(${stageTheme.image})`,
                      "--spotlight-color": selectedRarity.color,
                    }}
                  >
                    <div className="ulg-spot-inner">
                      <div className="ulg-spot-chip-row">
                        <span className="ulg-spot-chip" style={{ color: selectedStatus.color, borderColor: `${selectedStatus.color}55` }}>
                          <img src={selectedStatus.asset} alt="" />
                          {selectedStatus.label}
                        </span>
                        <span className="ulg-spot-chip">
                          <SelectedTypeIcon size={13} />
                          {selectedLogro.tipo}
                        </span>
                        <span className="ulg-spot-chip" style={{ color: selectedRarity.color, borderColor: `${selectedRarity.color}55` }}>
                          <img src={selectedRarity.asset} alt="" />
                          {selectedRarity.label}
                        </span>
                      </div>

                      <div className="ulg-spot-copy">
                        <h2>{selectedLogro.obtenido || !selectedLogro.secreto ? selectedLogro.nombre : "Sello oculto"}</h2>
                        <p>
                          {selectedLogro.obtenido || !selectedLogro.secreto
                            ? selectedLogro.descripcion
                            : "Sigue entrenando. Esta pieza se revela cuando el mapa considere que ya la mereces."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ulg-progress-card">
                    <small>Progreso del sello</small>
                    <strong style={{ color: selectedStatus.color }}>
                      {selectedLogro.reclamado ? "Completado" : `${selectedLogro.progreso}/${selectedLogro.total}`}
                    </strong>
                    <div className="ulg-progress" style={{ marginTop: 10 }} aria-hidden="true">
                      <span style={{ width: `${selectedLogro.reclamado ? 100 : selectedProgress}%`, background: `linear-gradient(90deg, ${selectedStatus.color}, ${selectedRarity.color})` }} />
                    </div>
                    <p>{selectedStatus.detail}</p>
                  </div>

                  <div className="ulg-spot-grid">
                    <div className="ulg-info-card">
                      <small>Objetivo</small>
                      <strong>{selectedLogro.secreto && !selectedLogro.obtenido ? "Condicion oculta" : "Meta visible"}</strong>
                      <p>
                        {selectedLogro.secreto && !selectedLogro.obtenido
                          ? "Todavia no toca abrir esta pista. Primero suma mas avance en la zona ligada."
                          : selectedLogro.descripcion}
                      </p>
                    </div>
                    <div className="ulg-info-card">
                      <small>Botin del sello</small>
                      <strong style={{ color: UI.gold }}>+{selectedLogro.xpBonus} XP</strong>
                      <p>
                        {selectedLogro.recompensas?.find((reward) => normalizeLoose(reward?.tipo || reward?.nombre || reward?.icon || "") !== "xp")
                          ? "Incluye botin extra ademas del XP principal."
                          : `Tambien deja ${Math.max(1, Math.floor(selectedLogro.xpBonus / 10))} gemas como premio secundario.`}
                      </p>
                    </div>
                  </div>

                  <div className="ulg-info-card">
                    <small>Lectura del gremio</small>
                    <strong style={{ color: classTheme.accent }}>{stageTheme.label}</strong>
                    <p>{stageTheme.copy}</p>
                  </div>

                  <div className="ulg-actions">
                    {selectedLogro.obtenido && !selectedLogro.reclamado ? (
                      <button type="button" className="ulg-btn" disabled={claiming === selectedLogro.id} onClick={() => handleClaim(selectedLogro)}>
                        <Gift size={16} />
                        {claiming === selectedLogro.id ? "Reclamando..." : "Reclamar recompensa"}
                      </button>
                    ) : (
                      <button type="button" className="ulg-btn-ghost" onClick={() => setDetailOpen(selectedLogro)}>
                        <Trophy size={16} />
                        Ver ficha completa
                      </button>
                    )}
                    <button type="button" className="ulg-btn-ghost" onClick={() => setDetailOpen(selectedLogro)}>
                      <Target size={16} />
                      Abrir detalles
                    </button>
                  </div>
                </>
              ) : (
                <div className="ulg-empty">
                  <img src="/ui/header/section-logros.png" alt="" style={{ width: 56, height: 56, objectFit: "contain", opacity: .8 }} />
                  <strong>Selecciona una insignia para verla de cerca</strong>
                  <p>El panel lateral te muestra objetivo, progreso y botin sin sacar al heroe del tablero principal.</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
