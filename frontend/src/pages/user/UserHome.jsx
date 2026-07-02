import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { auth } from "../../firebase.js";
import {
  getUserStats,
  getMisionesUsuario,
  getUserLogros,
  getLeaderboard,
  getWeeklyActivity,
  claimMision,
} from "../../services/api.js";
import { USER_CLASS_THEME as CLASS_META } from "./userClassTheme.js";

const HERO_IDLE_FRAMES = {
  GUERRERO: Array.from({ length: 8 }, (_, index) => `/avatar/idle/idle_0${index + 1}.png`),
  ARQUERO: Array.from({ length: 8 }, (_, index) => `/avatar/idle/idle_0${index + 1}.png`),
  MAGO: Array.from({ length: 8 }, (_, index) => `/avatar/idle/idle_0${index + 1}.png`),
  DEFAULT: Array.from({ length: 8 }, (_, index) => `/avatar/idle/idle_0${index + 1}.png`),
};

const QUEST_ICON = {
  fuerza: "/ui/icons/quest-fuerza.png",
  cardio: "/ui/icons/quest-cardio.png",
  hidratacion: "/ui/icons/quest-hidratacion.png",
  nutricion: "/ui/icons/quest-nutricion.png",
  flexibilidad: "/ui/icons/quest-flexibilidad.png",
  mente: "/ui/stat-men.png",
  mision: "/ui/icons/quest-mision.png",
  default: "/ui/icons/quest-mision.png",
};

const QUEST_ZONE = {
  fuerza: { label: "Arena de fuerza", icon: "/ui/icons/quest-fuerza.png", color: "#e85d75" },
  cardio: { label: "Ruta cardio", icon: "/ui/icons/quest-cardio.png", color: "#4cc9f0" },
  hidratacion: { label: "Fuente vital", icon: "/ui/icons/quest-hidratacion.png", color: "#4cc9f0" },
  nutricion: { label: "Fogón de nutrición", icon: "/ui/icons/quest-nutricion.png", color: "#8ac926" },
  flexibilidad: { label: "Santuario móvil", icon: "/ui/icons/quest-flexibilidad.png", color: "#c08aff" },
  mente: { label: "Santuario mental", icon: "/ui/stat-men.png", color: "#c08aff" },
  mision: { label: "Quest activa", icon: "/ui/icons/quest-mision.png", color: "var(--class-accent)" },
  default: { label: "Quest activa", icon: "/ui/icons/quest-mision.png", color: "var(--class-accent)" },
};

const QUEST_RARITY = {
  comun: { label: "Comun", className: "common", color: "#a89ab8", gemCount: 1, icon: "/ui/rarity/rarity-common.png" },
  rara: { label: "Rara", className: "rare", color: "#4cc9f0", gemCount: 2, icon: "/ui/rarity/rarity-rare.png" },
  epica: { label: "Epica", className: "epic", color: "#c08aff", gemCount: 3, icon: "/ui/rarity/rarity-epic.png" },
  legendaria: { label: "Legendaria", className: "legendary", color: "var(--class-accent)", gemCount: 4, icon: "/ui/rarity/rarity-legendary.png" },
};

const SHOWCASE = [
  { src: "/items/rewards/trofeo dragon.png", label: "Trofeo Dragón", tone: "var(--class-soft)", rarity: "legendaria", type: "Reliquia", source: "Premio por quest física", bonus: "+Prestigio de disciplina" },
  { src: "/items/rewards/orbe_magico.png", label: "Orbe de Enfoque", tone: "#c08aff", rarity: "epica", type: "Artefacto", source: "Botín de recuperación", bonus: "+Energía mental" },
  { src: "/items/consumables/pocion_xp.png", label: "Poción XP", tone: "#4cc9f0", rarity: "rara", type: "Consumible", source: "Mercado del gremio", bonus: "+XP de entrenamiento" },
  { src: "/items/rewards/Llave legendaria.png", label: "Llave Legendaria", tone: "#f6b44b", rarity: "legendaria", type: "Llave", source: "Cadena y constancia", bonus: "Abre cofres de progreso" },
];

const STAT_CARDS = [
  { key: "fuerza", label: "Fuerza", color: "#e85d75", asset: "/ui/stat-str.png" },
  { key: "resistencia", label: "Resistencia", color: "var(--class-secondary)", asset: "/ui/stat-sta.png" },
  { key: "agilidad", label: "Agilidad", color: "#8ac926", asset: "/ui/stat-spd.png" },
  { key: "vitalidad", label: "Vitalidad", color: "#4cc9f0", asset: "/ui/stat-men.png" },
];

const css = `
  @keyframes uh-float { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-10px) } }
  @keyframes uh-glow { 0%,100%{ opacity:.55 } 50%{ opacity:1 } }
  @keyframes uh-shine { 0%{ transform:translateX(-120%) } 100%{ transform:translateX(120%) } }
  @keyframes uh-drift { 0%{ transform:translate3d(0, 0, 0); opacity:.18 } 40%{ opacity:.72 } 100%{ transform:translate3d(var(--dx), -72px, 0); opacity:0 } }
  @keyframes uh-breathe { 0%,100%{ transform:scale(1); opacity:.56 } 50%{ transform:scale(1.04); opacity:.9 } }
  @keyframes uh-line { 0%{ background-position:0 0 } 100%{ background-position:42px 42px } }
  @keyframes uh-aura-ring { 0%{ transform:scale(.86); opacity:.48 } 70%{ transform:scale(1.16); opacity:0 } 100%{ transform:scale(1.16); opacity:0 } }
  @keyframes uh-gold-pulse { 0%,100%{ box-shadow:0 34px 110px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.05), 0 0 0 color-mix(in srgb, var(--class-accent), transparent 100%) } 50%{ box-shadow:0 34px 110px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.08), 0 0 48px color-mix(in srgb, var(--class-accent), transparent 68%) } }
  @keyframes uh-victory-pop { 0%,100%{ transform:translateY(0) rotate(0deg) } 50%{ transform:translateY(-5px) rotate(-1deg) } }
  @keyframes uh-loot-float { 0%,100%{ transform:translateY(0) rotate(-1deg) } 50%{ transform:translateY(-8px) rotate(1deg) } }
  @keyframes uh-loot-glint { 0%{ transform:translateX(-130%) rotate(18deg); opacity:0 } 22%{ opacity:.55 } 46%{ opacity:0 } 100%{ transform:translateX(130%) rotate(18deg); opacity:0 } }

  .uh-page {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    color: #f8f1ff;
    background:
      radial-gradient(circle at 16% 16%, color-mix(in srgb, var(--class-accent), transparent 86%), transparent 30%),
      radial-gradient(circle at 88% 24%, color-mix(in srgb, var(--class-secondary), transparent 88%), transparent 25%),
      linear-gradient(180deg, #090617 0%, var(--class-bg) 48%, #080511 100%);
  }
  .uh-page::before {
    content: "";
    position: fixed;
    inset: 56px 0 0 0;
    pointer-events: none;
    opacity: .32;
    background-image: url("/ui/dashboard-particles.png");
    background-size: cover;
    background-position: center;
    mix-blend-mode: screen;
    transition: opacity .35s ease, filter .35s ease;
  }
  .uh-page.is-quiet::before { opacity: .14; filter: grayscale(.25) brightness(.75); }
  .uh-page.is-hot-streak::before { opacity: .42; filter: saturate(1.18) brightness(1.06); }
  .uh-shell {
    width: min(100%, 1680px);
    margin: 0 auto;
    padding: clamp(18px, 2.4vw, 42px);
    position: relative;
    z-index: 1;
    box-sizing: border-box;
  }
  .uh-hero {
    min-height: clamp(560px, 72vh, 790px);
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(420px, .95fr);
    gap: clamp(24px, 4vw, 76px);
    align-items: center;
    position: relative;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 74%);
    border-radius: 8px;
    background:
      linear-gradient(90deg, rgba(8, 5, 17, .94) 0%, color-mix(in srgb, var(--class-bg), rgba(15, 8, 27, .82) 55%) 48%, color-mix(in srgb, var(--class-bg), rgba(19, 11, 30, .55) 50%) 100%),
      url("/ui/scene-bg.png") center/cover;
    box-shadow: 0 34px 110px rgba(0, 0, 0, .48), inset 0 1px 0 rgba(255,255,255,.05);
    padding: clamp(24px, 4.8vw, 72px);
    transition: border-color .35s ease, filter .35s ease, box-shadow .35s ease;
  }
  .uh-hero.is-quiet {
    filter: saturate(.82) brightness(.82);
    border-color: rgba(168, 154, 184, .18);
  }
  .uh-hero.is-hot-streak {
    border-color: color-mix(in srgb, var(--class-accent), transparent 60%);
    box-shadow: 0 34px 110px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.06), 0 0 42px color-mix(in srgb, var(--class-accent), transparent 78%);
  }
  .uh-hero.is-ascension {
    border-color: color-mix(in srgb, var(--class-secondary), transparent 50%);
    animation: uh-gold-pulse 3.8s ease-in-out infinite;
  }
  .uh-hero.is-clearing {
    border-color: color-mix(in srgb, var(--class-accent), var(--class-secondary) 35%);
  }
  .uh-hero::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 34%;
    background: linear-gradient(180deg, transparent, rgba(8,5,17,.92));
    pointer-events: none;
  }
  .uh-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .16;
    background-image:
      linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(90deg, transparent, #000 18%, #000 76%, transparent);
    animation: uh-line 18s linear infinite;
  }
  .uh-copy, .uh-stage { position: relative; z-index: 1; }
  .uh-sparks {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
  }
  .uh-spark {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    background: var(--class-accent);
    box-shadow: 0 0 14px color-mix(in srgb, var(--class-accent), transparent 28%);
    animation: uh-drift var(--t) ease-in-out infinite;
    animation-delay: var(--d);
  }
  .uh-hero.is-quiet .uh-spark { opacity: .35; animation-duration: calc(var(--t) * 1.45); }
  .uh-hero.is-hot-streak .uh-spark, .uh-hero.is-ascension .uh-spark { box-shadow: 0 0 18px color-mix(in srgb, var(--class-accent), transparent 10%); }
  .uh-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 70%);
    border-radius: 999px;
    background: rgba(8, 5, 17, .62);
    color: var(--class-accent);
    font: 800 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .uh-ui-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    image-rendering: pixelated;
    flex-shrink: 0;
    filter: drop-shadow(0 6px 8px rgba(0,0,0,.34));
  }
  .uh-ui-icon.lg {
    width: 28px;
    height: 28px;
  }
  .uh-btn-img {
    width: 22px;
    height: 22px;
    object-fit: contain;
    image-rendering: pixelated;
    flex-shrink: 0;
    filter: drop-shadow(0 7px 8px rgba(0,0,0,.32));
  }
  .uh-title {
    margin: 24px 0 18px;
    max-width: 880px;
    font: 900 clamp(46px, 6.4vw, 104px)/.92 "Manrope", sans-serif;
    letter-spacing: 0;
    color: #fff9ef;
    overflow-wrap: anywhere;
  }
  .uh-title span { color: var(--class-accent); text-shadow: 0 0 34px color-mix(in srgb, var(--class-accent), transparent 45%); }
  .uh-lead {
    max-width: 720px;
    color: #cdbfe0;
    font: 500 clamp(15px, 1.35vw, 20px)/1.7 "Manrope", sans-serif;
  }
  .uh-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }
  .uh-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.06);
    color: #fff;
    font: 800 13px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: transform .2s ease, border-color .2s ease, background .2s ease;
    white-space: nowrap;
  }
  .uh-btn:hover { transform: translateY(-2px); border-color: var(--class-accent); background: rgba(255,255,255,.09); }
  .uh-btn:hover .uh-btn-img, .uh-btn:hover .uh-ui-icon { transform: translateY(-1px) scale(1.08); }
  .uh-btn.primary {
    color: #100814;
    border-color: transparent;
    background: linear-gradient(135deg, var(--class-accent), var(--class-secondary));
    box-shadow: 0 16px 42px color-mix(in srgb, var(--class-accent), transparent 70%);
  }
  .uh-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(112px, 1fr));
    gap: 12px;
    margin-top: 36px;
    max-width: 780px;
  }
  .uh-kpi {
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    background: rgba(6, 4, 12, .62);
    padding: 16px;
    backdrop-filter: blur(18px);
    transition: transform .22s ease, border-color .22s ease, background .22s ease;
  }
  .uh-kpi:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--class-accent), transparent 70%); background: rgba(255,255,255,.055); }
  .uh-kpi strong {
    display: block;
    color: #fff;
    font: 900 28px/1 "JetBrains Mono", monospace;
    font-variant-numeric: tabular-nums;
  }
  .uh-kpi span {
    display: block;
    margin-top: 8px;
    color: #a89ab8;
    font: 800 10px/1.3 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uh-kpi-img {
    width: 34px;
    height: 34px;
    object-fit: contain;
    image-rendering: pixelated;
    margin-bottom: 12px;
    filter: drop-shadow(0 10px 12px rgba(0,0,0,.34));
  }
  .uh-stage {
    min-height: 560px;
    display: grid;
    place-items: center;
  }
  .uh-portal {
    width: min(100%, 560px);
    aspect-ratio: 1 / 1.08;
    position: relative;
    display: grid;
    place-items: center;
  }
  .uh-portal::before {
    content: "";
    position: absolute;
    inset: 7% 2% 14%;
    border-radius: 50%;
    background: radial-gradient(circle, var(--class-soft), transparent 63%);
    filter: blur(18px);
    animation: uh-glow 3.4s ease-in-out infinite;
  }
  .uh-portal.is-hot-streak::before {
    background: radial-gradient(circle, color-mix(in srgb, var(--class-accent), transparent 70%), var(--class-soft) 42%, transparent 68%);
    filter: blur(15px);
  }
  .uh-portal.is-quiet::before {
    background: radial-gradient(circle, rgba(168, 154, 184, .12), transparent 66%);
  }
  .uh-portal.is-ascension::before {
    background: radial-gradient(circle, color-mix(in srgb, var(--class-secondary), transparent 66%), var(--class-soft) 45%, transparent 70%);
    filter: blur(13px);
  }
  .uh-portal.is-clearing::before {
    background: radial-gradient(circle, color-mix(in srgb, var(--class-accent), var(--class-secondary) 25%) 0%, var(--class-soft) 48%, transparent 72%);
  }
  .uh-portal.is-hot-streak::after, .uh-portal.is-ascension::after, .uh-portal.is-clearing::after {
    opacity: .95;
  }
  .uh-aura-ring {
    position: absolute;
    inset: 10% 4% 16%;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 62%);
    pointer-events: none;
    animation: uh-aura-ring 2.8s ease-out infinite;
    z-index: 0;
  }
  .uh-aura-ring.two { animation-delay: 1.25s; border-color: color-mix(in srgb, var(--class-accent), transparent 48%); }
  .uh-portal.is-quiet .uh-aura-ring { display: none; }
  .uh-portal::after {
    content: "";
    position: absolute;
    width: 72%;
    height: 18%;
    left: 14%;
    bottom: 12%;
    border-radius: 50%;
    background: radial-gradient(ellipse, color-mix(in srgb, var(--class-accent), transparent 78%), transparent 70%);
    filter: blur(12px);
    animation: uh-breathe 4s ease-in-out infinite;
  }
  .uh-class-crest {
    position: absolute;
    top: clamp(14px, 2vw, 28px);
    right: clamp(14px, 2vw, 28px);
    width: clamp(86px, 8vw, 132px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 68%);
    background:
      radial-gradient(circle at 50% 28%, var(--class-soft), transparent 66%),
      rgba(6, 4, 12, .42);
    box-shadow: 0 18px 46px rgba(0,0,0,.34), 0 0 26px color-mix(in srgb, var(--class-accent), transparent 82%);
    z-index: 3;
    pointer-events: none;
  }
  .uh-class-crest img {
    width: 78%;
    height: 78%;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 14px 18px rgba(0,0,0,.42));
  }
  .uh-character {
    width: min(92%, 500px);
    max-height: 520px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 30px 36px rgba(0,0,0,.62)) drop-shadow(0 0 28px var(--class-soft));
    animation: uh-float 4.8s ease-in-out infinite;
    transition: filter .35s ease, transform .35s ease;
  }
  .uh-character.is-hot-streak {
    filter: drop-shadow(0 30px 36px rgba(0,0,0,.62)) drop-shadow(0 0 34px color-mix(in srgb, var(--class-accent), transparent 66%));
  }
  .uh-character.is-quiet {
    filter: drop-shadow(0 30px 36px rgba(0,0,0,.62)) grayscale(.12) brightness(.88);
  }
  .uh-character.is-ascension {
    filter: drop-shadow(0 30px 36px rgba(0,0,0,.62)) drop-shadow(0 0 42px color-mix(in srgb, var(--class-secondary), transparent 50%));
  }
  .uh-character.is-clearing {
    animation: uh-float 4.8s ease-in-out infinite, uh-victory-pop 2.8s ease-in-out infinite;
  }
  .uh-hero-states {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 18px;
    max-width: 720px;
  }
  .uh-state-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 0 11px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.055);
    color: #f8f1ff;
    font: 800 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .04em;
  }
  .uh-state-pill.hot { border-color: color-mix(in srgb, var(--class-accent), transparent 70%); color: var(--class-accent); background: color-mix(in srgb, var(--class-accent), transparent 90%); }
  .uh-state-pill.gold { border-color: color-mix(in srgb, var(--class-secondary), transparent 68%); color: var(--class-secondary); background: color-mix(in srgb, var(--class-secondary), transparent 90%); }
  .uh-state-pill.win { border-color: color-mix(in srgb, var(--class-accent), transparent 62%); color: #fff; background: var(--class-soft); }
  .uh-state-pill.quiet { border-color: rgba(168,154,184,.2); color: #cdbfe0; background: rgba(168,154,184,.07); }
  .uh-daily-zone {
    margin: 22px 0 4px;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 78%);
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--class-accent), transparent 92%), transparent 38%),
      radial-gradient(circle at 82% 18%, var(--zone-glow), transparent 36%),
      rgba(12, 7, 22, .78);
    box-shadow: 0 18px 54px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.04);
  }
  .uh-daily-zone::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: .1;
    pointer-events: none;
    background-image: url("/ui/panel-texture.png");
    background-size: cover;
    background-position: center;
    mix-blend-mode: screen;
  }
  .uh-daily-zone::after {
    content: "";
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--zone-color), transparent);
    opacity: .55;
  }
  .uh-daily-inner {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    padding: 15px 18px;
  }
  .uh-daily-marker {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--zone-color), transparent 52%);
    background: radial-gradient(circle, var(--zone-glow), rgba(255,255,255,.03) 70%);
    box-shadow: inset 0 0 18px rgba(255,255,255,.04), 0 0 22px var(--zone-glow);
  }
  .uh-daily-marker img {
    width: 42px;
    height: 42px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 12px rgba(0,0,0,.34));
  }
  .uh-daily-copy {
    min-width: 0;
  }
  .uh-daily-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--class-accent);
    font: 900 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .uh-daily-kicker img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-daily-title {
    margin: 0;
    color: #fff9ef;
    font: 900 clamp(18px, 1.8vw, 25px)/1.1 "Manrope", sans-serif;
    letter-spacing: 0;
  }
  .uh-daily-text {
    margin: 6px 0 0;
    color: #bcaed0;
    font: 600 13px/1.5 "Manrope", sans-serif;
  }
  .uh-daily-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .uh-daily-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 34px;
    padding: 0 11px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--zone-color), transparent 62%);
    background: color-mix(in srgb, var(--zone-color), transparent 88%);
    color: #fff;
    font: 900 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .06em;
    white-space: nowrap;
  }
  .uh-daily-chip img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-card {
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(20, 10, 34, .78), rgba(8, 5, 17, .86));
    box-shadow: 0 24px 68px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.05);
    overflow: hidden;
    position: relative;
  }
  .uh-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .055;
    background-image: url("/ui/panel-texture.png");
    background-size: cover;
    background-position: center;
    mix-blend-mode: screen;
  }
  .uh-card > * { position: relative; z-index: 1; }
  .uh-floating {
    position: absolute;
    left: 0;
    bottom: 4%;
    width: min(86%, 440px);
    padding: 18px;
    backdrop-filter: blur(18px);
  }
  .uh-xp-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    color: #f6edff;
    font: 800 12px/1 "JetBrains Mono", monospace;
  }
  .uh-progress {
    height: 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.08);
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.1);
  }
  .uh-progress > div {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--class-accent), var(--class-secondary));
    box-shadow: 0 0 20px var(--class-soft);
    position: relative;
  }
  .uh-progress > div::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
    animation: uh-shine 2.6s ease-in-out infinite;
  }
  .uh-section {
    margin-top: 22px;
    display: grid;
    gap: 18px;
  }
  .uh-section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 18px;
    margin-top: 44px;
  }
  .uh-section-head h2 {
    margin: 0;
    color: #fff9ef;
    font: 900 clamp(25px, 3vw, 44px)/1.05 "Manrope", sans-serif;
    letter-spacing: 0;
  }
  .uh-section-head p {
    margin: 8px 0 0;
    color: #a89ab8;
    font: 500 14px/1.6 "Manrope", sans-serif;
    max-width: 650px;
  }
  .uh-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .uh-stat {
    padding: 18px;
    min-height: 158px;
    position: relative;
    transition: transform .22s ease, border-color .22s ease;
  }
  .uh-stat:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--stat-color), transparent 58%); }
  .uh-stat:hover .uh-stat-img { transform: scale(1.08) rotate(-2deg); }
  .uh-stat-top {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
  }
  .uh-stat-img {
    width: 54px;
    height: 54px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 16px rgba(0,0,0,.35));
    transition: transform .24s ease;
  }
  .uh-stat h3 {
    margin: 18px 0 8px;
    color: #fff;
    font: 900 18px/1 "Manrope", sans-serif;
  }
  .uh-stat .value {
    color: var(--stat-color);
    font: 900 34px/1 "JetBrains Mono", monospace;
    font-variant-numeric: tabular-nums;
  }
  .uh-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(360px, .75fr);
    gap: 18px;
    align-items: stretch;
  }
  .uh-bottom-grid {
    grid-template-columns: minmax(320px, .8fr) minmax(0, 1.2fr);
  }
  .uh-panel-pad { padding: clamp(18px, 2vw, 26px); }
  .uh-panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }
  .uh-panel-title h3 {
    margin: 0;
    color: #fff;
    font: 900 20px/1.1 "Manrope", sans-serif;
  }
  .uh-panel-title span {
    color: var(--class-accent);
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uh-quest-list {
    display: grid;
    gap: 12px;
  }
  .uh-quest {
    display: grid;
    grid-template-columns: 68px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border: 1px solid var(--quest-border, rgba(255,255,255,.08));
    border-radius: 8px;
    background:
      radial-gradient(circle at 0% 0%, var(--quest-glow, transparent), transparent 38%),
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.024));
    transition: border-color .2s ease, background .2s ease, transform .2s ease;
  }
  .uh-quest.ready {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--class-accent), transparent 90%), 0 0 24px var(--quest-glow, color-mix(in srgb, var(--class-accent), transparent 90%));
  }
  .uh-quest.class-focus {
    border-color: color-mix(in srgb, var(--class-accent), transparent 35%);
    box-shadow: inset 3px 0 0 var(--class-accent), 0 0 24px color-mix(in srgb, var(--class-accent), transparent 82%);
  }
  .uh-quest:hover { background: rgba(255,255,255,.055); }
  .uh-quest-icon-wrap {
    width: 58px;
    height: 58px;
    position: relative;
    display: grid;
    place-items: center;
    border-radius: 8px;
    border: 1px solid var(--quest-border, rgba(255,255,255,.1));
    background: rgba(6, 4, 12, .42);
  }
  .uh-quest-icon {
    width: 52px;
    height: 52px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 12px rgba(0,0,0,.35));
  }
  .uh-quest-pin {
    position: absolute;
    right: -5px;
    top: -7px;
    width: 22px;
    height: 22px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 8px 8px rgba(0,0,0,.35));
  }
  .uh-quest h4 {
    margin: 0 0 8px;
    color: #fff;
    font: 900 15px/1.2 "Manrope", sans-serif;
  }
  .uh-quest small {
    display: block;
    color: #a89ab8;
    font: 700 11px/1 "JetBrains Mono", monospace;
  }
  .uh-quest-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
  }
  .uh-zone-chip,
  .uh-rarity-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 25px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.045);
    color: #f8f1ff;
    font: 900 9px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .uh-class-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 25px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 62%);
    color: #fff;
    background: color-mix(in srgb, var(--class-accent), transparent 86%);
    font: 900 9px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .uh-class-chip img {
    width: 17px;
    height: 17px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-zone-chip {
    border-color: color-mix(in srgb, var(--zone-color), transparent 68%);
    color: var(--zone-color);
    background: color-mix(in srgb, var(--zone-color), transparent 90%);
  }
  .uh-zone-chip img,
  .uh-rarity-chip img {
    width: 17px;
    height: 17px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-rarity-chip {
    border-color: var(--quest-border);
    color: var(--rarity-color);
    background: var(--quest-glow);
  }
  .uh-reward-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
  .uh-gems {
    display: flex;
    gap: 3px;
    justify-content: flex-end;
  }
  .uh-gems img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 5px 6px rgba(0,0,0,.35));
  }
  .uh-claim {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 34px;
    padding: 0 11px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 62%);
    background: color-mix(in srgb, var(--class-accent), transparent 90%);
    color: var(--class-accent);
    font: 900 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .uh-claim img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 78%);
    color: var(--class-accent);
    background: color-mix(in srgb, var(--class-accent), transparent 92%);
    font: 900 11px/1 "JetBrains Mono", monospace;
    white-space: nowrap;
  }
  .uh-showcase {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .uh-item {
    min-height: 190px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--loot-border, rgba(255,255,255,.08));
    border-radius: 8px;
    background:
      radial-gradient(circle at 50% 22%, var(--item-tone), transparent 48%),
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02));
    transition: border-color .22s ease, background .22s ease, transform .22s ease;
    position: relative;
    overflow: hidden;
  }
  .uh-item::before {
    content: "";
    position: absolute;
    top: -20%;
    bottom: -20%;
    width: 42%;
    left: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent);
    animation: uh-loot-glint 4.8s ease-in-out infinite;
    animation-delay: var(--loot-delay, 0s);
    pointer-events: none;
  }
  .uh-item:hover,
  .uh-item:focus-visible {
    border-color: var(--loot-border, color-mix(in srgb, var(--class-accent), transparent 75%));
    box-shadow: 0 16px 40px rgba(0,0,0,.32), 0 0 24px var(--item-tone);
  }
  .uh-loot-img {
    width: min(100%, 128px);
    aspect-ratio: 1;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 20px 22px rgba(0,0,0,.38)) drop-shadow(0 0 14px var(--item-tone));
    animation: uh-loot-float var(--loot-speed, 4.8s) ease-in-out infinite;
    animation-delay: var(--loot-delay, 0s);
  }
  .uh-loot-name {
    color: #f8f1ff;
    font: 900 13px/1.2 "Manrope", sans-serif;
    text-align: center;
  }
  .uh-loot-origin {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 26px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid var(--loot-border, rgba(255,255,255,.12));
    background: rgba(6,4,12,.42);
    color: var(--class-accent);
    font: 900 9px/1 "JetBrains Mono", monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .uh-loot-origin img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-loot-detail {
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 10px;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid var(--loot-border, rgba(255,255,255,.12));
    background:
      linear-gradient(180deg, var(--item-tone), rgba(8,5,17,.92) 42%),
      rgba(8,5,17,.94);
    box-shadow: 0 14px 34px rgba(0,0,0,.42);
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    transition: opacity .22s ease, transform .22s ease;
  }
  .uh-item:hover .uh-loot-detail,
  .uh-item:focus-visible .uh-loot-detail {
    opacity: 1;
    transform: translateY(0);
  }
  .uh-loot-detail strong {
    display: block;
    color: #fff;
    font: 900 12px/1.2 "Manrope", sans-serif;
    margin-bottom: 5px;
  }
  .uh-loot-detail span {
    display: block;
    color: #bcaed0;
    font: 800 10px/1.45 "JetBrains Mono", monospace;
  }
  .uh-loot-rarity {
    position: absolute;
    top: 10px;
    right: 10px;
    min-height: 24px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    border: 1px solid var(--loot-border, rgba(255,255,255,.12));
    color: var(--loot-color);
    background: rgba(6,4,12,.42);
    font: 900 8px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .uh-rank {
    display: grid;
    gap: 10px;
  }
  .uh-rank-row {
    display: grid;
    grid-template-columns: 42px 38px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 11px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
    transition: transform .2s ease, background .2s ease, border-color .2s ease;
  }
  .uh-rank-row:hover { transform: translateX(4px); background: rgba(255,255,255,.055); border-color: color-mix(in srgb, var(--class-accent), transparent 76%); }
  .uh-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    background: #160c24;
    border: 1px solid rgba(255,255,255,.14);
  }
  .uh-rank-row strong {
    color: #fff;
    font: 900 13px/1.2 "Manrope", sans-serif;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .uh-rank-row span {
    color: var(--class-accent);
    font: 900 12px/1 "JetBrains Mono", monospace;
    font-variant-numeric: tabular-nums;
  }
  .uh-rank-medal {
    width: 40px;
    height: 40px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 8px 10px rgba(0,0,0,.35)) drop-shadow(0 0 10px color-mix(in srgb, var(--class-accent), transparent 78%));
  }
  .uh-rank-crown {
    width: 34px;
    height: 34px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 14px rgba(0,0,0,.42)) drop-shadow(0 0 12px color-mix(in srgb, var(--class-accent), transparent 66%));
  }
  .uh-ach-medal {
    width: 42px;
    height: 42px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 10px 12px rgba(0,0,0,.36)) drop-shadow(0 0 10px color-mix(in srgb, var(--class-accent), transparent 76%));
  }
  .uh-chart-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(220px, .65fr);
    gap: 12px;
    margin-top: 16px;
  }
  .uh-summary-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .uh-chart-box {
    min-height: 230px;
    padding: 14px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 84%);
    border-radius: 8px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--class-accent), transparent 94%), transparent 34%),
      radial-gradient(circle at 18% 0%, rgba(192, 138, 255, .13), transparent 42%),
      rgba(13, 7, 22, .76);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.025), inset 0 -18px 48px rgba(0,0,0,.26);
    position: relative;
    overflow: hidden;
  }
  .uh-chart-box::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: .08;
    pointer-events: none;
    background-image: url("/ui/panel-texture.png");
    background-size: cover;
    background-position: center;
    mix-blend-mode: screen;
  }
  .uh-chart-box::after {
    content: "";
    position: absolute;
    inset: 8px;
    pointer-events: none;
    border-radius: 6px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 92%);
  }
  .uh-chart-box > * { position: relative; z-index: 1; }
  .uh-chart-box h4 {
    margin: 0;
    color: #fff;
    font: 900 14px/1.2 "Manrope", sans-serif;
  }
  .uh-chart-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .uh-chart-title-main {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .uh-chart-title-main img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 8px 8px rgba(0,0,0,.35));
  }
  .uh-chart-rune {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--class-accent);
    box-shadow: 0 0 14px var(--class-accent);
    flex-shrink: 0;
  }
  .uh-rpg-meter {
    height: 18px;
    margin-top: 12px;
    padding: 4px 7px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 82%);
    background:
      url("/ui/bars/bar-track-tile.png") center/auto 100% repeat-x,
      rgba(6, 4, 12, .72);
    overflow: hidden;
    position: relative;
  }
  .uh-rpg-meter-fill {
    height: 100%;
    width: var(--meter-value);
    min-width: 8px;
    border-radius: 999px;
    background:
      linear-gradient(90deg, var(--meter-color), var(--class-secondary)),
      url("/ui/bars/bar-fill-tile.png") center/auto 100% repeat-x;
    box-shadow: 0 0 14px color-mix(in srgb, var(--meter-color), transparent 42%);
    position: relative;
    transition: width .9s cubic-bezier(.22,1,.36,1);
  }
  .uh-rpg-meter-fill::after {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/bars/bar-shine-tile.png") center/auto 100% repeat-x;
    opacity: .48;
  }
  .uh-chart-note {
    margin-top: 8px;
    color: #a89ab8;
    font: 700 11px/1.5 "Manrope", sans-serif;
  }
  .uh-tooltip {
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 62%);
    border-radius: 8px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--class-accent), transparent 92%), transparent 42%),
      rgba(8, 5, 17, .96);
    color: #fff;
    padding: 10px 12px;
    box-shadow: 0 14px 34px rgba(0,0,0,.46), inset 0 0 0 1px rgba(255,255,255,.04);
    font: 800 11px/1.4 "JetBrains Mono", monospace;
    min-width: 130px;
  }
  .uh-tooltip-head {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--class-accent);
    margin-bottom: 7px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .uh-tooltip-head img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .uh-tooltip-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 4px;
  }
  .uh-empty {
    min-height: 170px;
    display: grid;
    place-items: center;
    color: #a89ab8;
    text-align: center;
    font: 700 14px/1.6 "Manrope", sans-serif;
    border: 1px dashed rgba(255,255,255,.12);
    border-radius: 8px;
    background: rgba(255,255,255,.025);
  }
  @media (max-width: 1360px) {
    .uh-shell { padding: 18px; }
    .uh-hero {
      grid-template-columns: minmax(0, 1fr) minmax(330px, .78fr);
      gap: 28px;
      padding: 34px;
      min-height: 560px;
    }
    .uh-title { font-size: clamp(44px, 5.2vw, 72px); }
    .uh-lead { font-size: 16px; max-width: 620px; }
    .uh-portal { width: min(100%, 430px); }
    .uh-character { max-height: 410px; }
    .uh-class-crest { width: clamp(76px, 9vw, 112px); }
    .uh-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 560px; }
    .uh-stat { min-height: 148px; }
    .uh-item { min-height: 164px; }
    .uh-loot-img { width: min(100%, 108px); }
    .uh-chart-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 1180px) {
    .uh-hero { grid-template-columns: 1fr; min-height: auto; }
    .uh-stage { min-height: 430px; }
    .uh-floating { left: 50%; transform: translateX(-50%); }
    .uh-grid { grid-template-columns: 1fr; }
    .uh-bottom-grid { grid-template-columns: 1fr; }
    .uh-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 860px) {
    .uh-page::before { opacity: .22; }
    .uh-hero {
      padding: 26px;
      border-radius: 8px;
    }
    .uh-title { font-size: clamp(40px, 9.2vw, 62px); line-height: .96; }
    .uh-actions { gap: 10px; }
    .uh-btn { min-height: 46px; padding: 0 14px; font-size: 12px; }
    .uh-panel-title { align-items: flex-start; }
    .uh-daily-inner { grid-template-columns: auto minmax(0, 1fr); }
    .uh-daily-actions { grid-column: 1 / -1; justify-content: flex-start; flex-wrap: wrap; }
    .uh-quest { grid-template-columns: 58px minmax(0, 1fr); }
    .uh-quest .uh-reward-stack { grid-column: 1 / -1; align-items: stretch; }
    .uh-quest .uh-chip, .uh-claim { justify-content: center; }
    .uh-gems { justify-content: center; }
    .uh-summary-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 720px) {
    .uh-shell { padding: 10px; }
    .uh-hero { padding: 18px; gap: 18px; }
    .uh-kpis, .uh-stats, .uh-showcase, .uh-summary-kpis { grid-template-columns: 1fr; }
    .uh-title { margin-top: 18px; font-size: clamp(34px, 11vw, 48px); line-height: 1; }
    .uh-lead { font-size: 14px; line-height: 1.6; }
    .uh-actions { flex-direction: column; align-items: stretch; }
    .uh-btn { width: 100%; white-space: normal; }
    .uh-stage { min-height: 360px; }
    .uh-portal { width: 100%; }
    .uh-character { max-height: 315px; width: min(100%, 340px); }
    .uh-class-crest { width: 78px; top: 12px; right: 12px; }
    .uh-floating { width: 100%; position: relative; left: auto; bottom: auto; transform: none; margin-top: -26px; padding: 14px; }
    .uh-xp-top { flex-direction: column; align-items: flex-start; gap: 6px; }
    .uh-daily-zone { margin-top: 14px; }
    .uh-daily-inner { padding: 14px; gap: 12px; }
    .uh-daily-marker { width: 54px; height: 54px; }
    .uh-daily-marker img { width: 36px; height: 36px; }
    .uh-section-head { align-items: start; flex-direction: column; }
    .uh-section-head h2 { font-size: clamp(24px, 8vw, 34px); }
    .uh-quest { grid-template-columns: 58px minmax(0, 1fr); gap: 12px; }
    .uh-quest-icon-wrap { width: 54px; height: 54px; }
    .uh-quest-icon { width: 48px; height: 48px; }
    .uh-chart-grid { grid-template-columns: 1fr; }
    .uh-rank-row { grid-template-columns: 34px 34px minmax(0, 1fr); }
    .uh-rank-medal { width: 34px; height: 34px; }
    .uh-rank-row span { grid-column: 3; }
  }
  @media (max-width: 430px) {
    .uh-shell { padding: 8px; }
    .uh-hero { padding: 15px; }
    .uh-eyebrow { max-width: 100%; font-size: 9px; letter-spacing: .08em; white-space: normal; line-height: 1.25; }
    .uh-title { font-size: clamp(30px, 12vw, 42px); }
    .uh-kpi { padding: 14px; }
    .uh-kpi strong { font-size: 24px; }
    .uh-daily-inner { grid-template-columns: 1fr; text-align: left; }
    .uh-daily-marker { width: 58px; height: 58px; }
    .uh-daily-actions { justify-content: stretch; }
    .uh-daily-actions .uh-btn, .uh-daily-chip { width: 100%; justify-content: center; }
    .uh-stat { min-height: 136px; padding: 15px; }
    .uh-stat-img { width: 46px; height: 46px; }
    .uh-stat .value { font-size: 30px; }
    .uh-panel-pad { padding: 14px; }
    .uh-panel-title { flex-direction: column; gap: 10px; }
    .uh-panel-title .uh-btn { width: 100%; }
    .uh-item { min-height: 150px; }
    .uh-loot-img { width: 96px; }
    .uh-loot-detail { position: relative; left: auto; right: auto; bottom: auto; width: 100%; opacity: 1; transform: none; margin-top: 2px; }
    .uh-loot-origin { white-space: normal; justify-content: center; }
    .uh-rank-row {
      grid-template-columns: 34px 34px minmax(0, 1fr);
      row-gap: 4px;
      padding: 10px;
    }
    .uh-rank-row span {
      grid-column: 3;
      font-size: 11px;
    }
    .uh-avatar { width: 34px; height: 34px; }
    .uh-chart-box { min-height: 214px; padding: 12px; }
    .uh-chart-title { align-items: flex-start; }
    .uh-chart-title-main img { width: 24px; height: 24px; }
    .uh-chart-box h4 { font-size: 13px; }
  }
`;

function pickArray(value, keys = []) {
  if (Array.isArray(value)) return value;
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

function pickObject(value, keys = []) {
  if (!value || Array.isArray(value)) return {};
  for (const key of keys) {
    if (value[key] && typeof value[key] === "object") return value[key];
  }
  return value;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeClass(profile) {
  const raw = profile?.heroClass || profile?.clase || profile?.class || profile?.classId || profile?.roleClass || "DEFAULT";
  return String(raw).toUpperCase();
}

function levelData(profile, stats) {
  const level = toNumber(stats?.nivel ?? stats?.level ?? profile?.nivel ?? profile?.level, 1);
  const xp = toNumber(stats?.xp ?? stats?.totalXp ?? profile?.xp ?? profile?.totalXp, 0);
  const current = toNumber(stats?.xpActual ?? stats?.currentXp ?? profile?.xpActual, xp % 1000);
  const needed = toNumber(stats?.xpNext ?? stats?.xpSiguiente ?? stats?.nextLevelXp ?? profile?.xpSiguiente, 1000);
  const pct = needed > 0 ? clamp(Math.round((current / needed) * 100)) : clamp(xp % 100);
  return { level, xp, current, needed, pct };
}

function missionProgress(mission) {
  const current = toNumber(mission?.progreso ?? mission?.progress ?? mission?.actual, 0);
  const goal = Math.max(1, toNumber(mission?.total ?? mission?.objetivo ?? mission?.goal ?? mission?.meta, 1));
  return { current, goal, pct: clamp(Math.round((current / goal) * 100)) };
}

function normalizeQuestType(mission) {
  const raw = String(mission?.tipo || mission?.categoria || mission?.zona || mission?.area || "default").toLowerCase();
  if (raw.includes("fuer")) return "fuerza";
  if (raw.includes("cardio") || raw.includes("resistencia")) return "cardio";
  if (raw.includes("hidr")) return "hidratacion";
  if (raw.includes("nutri")) return "nutricion";
  if (raw.includes("flex")) return "flexibilidad";
  if (raw.includes("mente") || raw.includes("mental") || raw.includes("respira")) return "mente";
  if (QUEST_ZONE[raw]) return raw;
  return "default";
}

function normalizeRarityName(value) {
  const raw = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (raw.includes("legend")) return "legendaria";
  if (raw.includes("epic")) return "epica";
  if (raw.includes("rar")) return "rara";
  if (raw.includes("com")) return "comun";
  return "";
}

function questRarity(mission, xp) {
  const explicit = normalizeRarityName(mission?.rareza || mission?.rarity || mission?.tier);
  if (explicit && QUEST_RARITY[explicit]) return QUEST_RARITY[explicit];
  if (xp >= 300) return QUEST_RARITY.legendaria;
  if (xp >= 180) return QUEST_RARITY.epica;
  if (xp >= 90) return QUEST_RARITY.rara;
  return QUEST_RARITY.comun;
}

function safeAvatar(id) {
  return `/perfil/${id || "avatar_01"}.png`;
}

function isTodayLike(value) {
  if (!value) return null;
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function resolveTodayActivity(stats, profile, missions) {
  const candidates = [
    stats?.lastWorkoutAt,
    stats?.lastExerciseAt,
    stats?.lastActivityAt,
    stats?.lastMissionAt,
    stats?.updatedAt,
    profile?.lastWorkoutAt,
    profile?.lastExerciseAt,
    profile?.lastActivityAt,
  ];
  for (const candidate of candidates) {
    const result = isTodayLike(candidate);
    if (result !== null) return result;
  }
  if (missions.some((mission) => mission?.completadaHoy || mission?.completedToday)) return true;
  return null;
}

function resolveLevelUpState(stats, profile, level) {
  const explicit = stats?.justLeveledUp || stats?.leveledUp || profile?.justLeveledUp;
  if (explicit) return true;
  const dates = [stats?.lastLevelUpAt, stats?.levelUpAt, profile?.lastLevelUpAt, profile?.levelUpAt];
  if (dates.some((date) => isTodayLike(date) === true)) return true;
  return level.pct >= 92;
}

function resolveDailyZone({ classKey, trainedToday, missionPct, streak, gems, coins }) {
  const classTone = {
    GUERRERO: "#ff4d5e",
    ARQUERO: "#7bdc3b",
    MAGO: "#4cc9f0",
    DEFAULT: "#c08aff",
  }[classKey] || "#c08aff";
  if (trainedToday === false) {
    return {
      id: "activate",
      title: "Activa la ruta de hoy",
      text: "Una entrada corta basta para que el mapa vuelva a moverse. Empieza con una quest física simple.",
      icon: "/ui/icons/weather-cloud.png",
      marker: "/ui/icons/map-pin.png",
      color: classTone,
      action: "misiones",
      actionLabel: "Abrir mapa",
      chip: "Ruta pendiente",
    };
  }
  if (missionPct < 45) {
    return {
      id: "hydration",
      title: "Pasa por la fuente",
      text: "Antes de subir la intensidad, completa una acción ligera: agua, movilidad o una quest rápida.",
      icon: "/ui/icons/quest-hidratacion.png",
      marker: "/ui/icons/weather-sun.png",
      color: "#4cc9f0",
      action: "misiones",
      actionLabel: "Ver quests",
      chip: "Fuente vital",
    };
  }
  if (classKey === "GUERRERO") {
    return {
      id: "strength",
      title: "La arena pide fuerza",
      text: "Tu clase brilla cuando empujas un poco más. Una rutina corta puede dejar buen XP de combate.",
      icon: "/ui/icons/quest-fuerza.png",
      marker: "/ui/icons/zone-flag.png",
      color: "#e85d75",
      action: "ejercicios",
      actionLabel: "Entrar a la arena",
      chip: "Fuerza",
    };
  }
  if (classKey === "ARQUERO") {
    return {
      id: "cardio",
      title: "Ruta ligera, paso firme",
      text: "Hoy conviene moverse con ritmo. Cardio o movilidad dejan el mapa bien encaminado.",
      icon: "/ui/icons/quest-cardio.png",
      marker: "/ui/icons/zone-flag.png",
      color: "#7bdc3b",
      action: "ejercicios",
      actionLabel: "Tomar la ruta",
      chip: "Cardio",
    };
  }
  if (classKey === "MAGO") {
    return {
      id: "breath",
      title: "La torre pide respiracion",
      text: "Un bloque breve de respiración o flexibilidad recarga maná sin quemar el cuerpo.",
      icon: "/ui/icons/quest-flexibilidad.png",
      marker: "/ui/stat-men.png",
      color: "#4cc9f0",
      action: "mente",
      actionLabel: "Entrar al santuario",
      chip: "Mente",
    };
  }
  if (streak >= 7 || gems > 0 || coins >= 250) {
    return {
      id: "shop",
      title: "Revisa el mercado",
      text: "Tienes avance acumulado. Puede haber botín, amuletos o mejoras esperando en la tienda.",
      icon: "/ui/icon-gold.png",
      marker: "/ui/icons/map-pin.png",
      color: classTone,
      action: "tienda",
      actionLabel: "Visitar mercado",
      chip: "Mercado",
    };
  }
  return {
    id: "balanced",
    title: "Elige una quest corta",
    text: "No hace falta una sesión enorme. Una acción bien hecha mantiene viva la aventura y el cuerpo en marcha.",
    icon: "/ui/icons/quest-mision.png",
    marker: "/ui/icons/zone-flag.png",
    color: classTone,
    action: "misiones",
    actionLabel: "Elegir quest",
    chip: "Aventura activa",
  };
}

function firstArrayFromObject(obj, keys) {
  for (const key of keys) {
    if (Array.isArray(obj?.[key])) return obj[key];
  }
  return [];
}

function buildTrendData(stats, level, missions) {
  const source = firstArrayFromObject(stats, [
    "weeklyActivity",
    "actividadSemanal",
    "activity",
    "historial",
    "xpHistory",
    "progresoSemanal",
  ]);
  if (source.length) {
    return source.slice(-7).map((entry, index) => ({
      day: entry?.dia || entry?.day || entry?.label || `D${index + 1}`,
      xp: toNumber(entry?.xp ?? entry?.totalXp ?? entry?.valor ?? entry?.value, 0),
      quests: toNumber(entry?.misiones ?? entry?.quests ?? entry?.completadas, 0),
    }));
  }

  const completed = missions.filter((mission) => mission?.estado === "completada" || mission?.estado === "reclamada" || mission?.reclamada || mission?.completada || missionProgress(mission).pct >= 100).length;
  const base = Math.max(35, Math.round((level.xp || level.current || 120) / 14));
  return ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Hoy"].map((day, index) => ({
    day,
    xp: Math.max(0, Math.round(base * (0.46 + index * 0.14) + completed * 18)),
    quests: index < 6 ? Math.max(0, completed - (6 - index)) : completed,
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="uh-tooltip">
      <div className="uh-tooltip-head">
        <img src="/ui/icons/map-pin.png" alt="" />
        {label}
      </div>
      {payload.map((item) => (
        <div className="uh-tooltip-row" key={item.dataKey} style={{ color: item.color }}>
          <span>{item.name}</span>
          <strong>{toNumber(item.value).toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

function SectionHead({ kicker, title, text, action }) {
  return (
    <div className="uh-section-head">
      <div>
        <div className="uh-eyebrow" style={{ padding: "7px 10px", fontSize: 10 }}>
          <img className="uh-ui-icon" src="/ui/icons/zone-flag.png" alt="" /> {kicker}
        </div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

function HeroCharacterLoop({ classKey, meta, heroStateClass }) {
  const frames = HERO_IDLE_FRAMES[classKey] || HERO_IDLE_FRAMES.DEFAULT;
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFrame(0);
    setFailed(false);
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [frames]);

  useEffect(() => {
    const reduceMotion = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion || failed || frames.length <= 1) return undefined;

    const speed = heroStateClass.includes("is-hot-streak") || heroStateClass.includes("is-clearing") ? 128 : 145;
    const id = window.setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, speed);
    return () => window.clearInterval(id);
  }, [failed, frames.length, heroStateClass]);

  return (
    <img
      className={`uh-character ${heroStateClass}`}
      src={failed ? "/avatar/idle/idle_01.png" : frames[frame]}
      alt={meta.label}
      onError={() => setFailed(true)}
    />
  );
}

function ProgressBar({ value, color }) {
  return (
    <div className="uh-progress" style={{ height: 9 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamp(value)}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ "--class-accent": color }}
      />
    </div>
  );
}

export default function UserHome({ profile, stats: statsProp, onNavigate }) {
  const [stats, setStats] = useState(statsProp || {});
  const [missions, setMissions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(!statsProp);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const [statsRes, missionsRes, achievementsRes, leaderboardRes, activityRes] = await Promise.allSettled([
          getUserStats(token),
          getMisionesUsuario(token),
          getUserLogros(token),
          getLeaderboard(token),
          getWeeklyActivity(token),
        ]);
        if (!alive) return;
        if (statsRes.status === "fulfilled") {
          const statsData = pickObject(statsRes.value, ["stats", "userStats", "data"]);
          if (activityRes.status === "fulfilled" && Array.isArray(activityRes.value?.semana)) {
            statsData.weeklyActivity = activityRes.value.semana;
          }
          setStats(statsData);
        }
        if (missionsRes.status === "fulfilled") {
          setMissions(pickArray(missionsRes.value, ["misiones", "missions", "data"]));
        }
        if (achievementsRes.status === "fulfilled") {
          setAchievements(pickArray(achievementsRes.value, ["logros", "achievements", "data"]));
        }
        if (leaderboardRes.status === "fulfilled") {
          setLeaderboard(pickArray(leaderboardRes.value, ["leaderboard", "ranking", "data"]));
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (statsProp) setStats(statsProp);
  }, [statsProp]);

  async function handleClaim(missionId) {
    if (claimingId) return;
    const user = auth.currentUser;
    if (!user) return;
    setClaimingId(missionId);
    try {
      const token = await user.getIdToken();
      await claimMision(token, missionId);
      const [statsRes, missionsRes] = await Promise.allSettled([
        getUserStats(token),
        getMisionesUsuario(token),
      ]);
      if (statsRes.status === "fulfilled") {
        const statsData = pickObject(statsRes.value, ["stats", "userStats", "data"]);
        setStats(prev => ({ ...prev, ...statsData }));
      }
      if (missionsRes.status === "fulfilled") {
        setMissions(pickArray(missionsRes.value, ["misiones", "missions", "data"]));
      }
    } catch {
      // mission may already be claimed or not completada — silent fail
    } finally {
      setClaimingId(null);
    }
  }

  const classKey = normalizeClass(profile);
  const cls = CLASS_META[classKey] || CLASS_META.DEFAULT;
  const level = levelData(profile, stats);
  const username = profile?.username || profile?.displayName || profile?.name || "Aventurero";
  const streak = toNumber(stats?.streak ?? profile?.streak, 0);
  const coins = toNumber(stats?.coins ?? profile?.coins, 0);
  const gems = toNumber(stats?.gems ?? profile?.gems, 0);

  const featuredMissions = useMemo(() => {
    const list = missions.length ? missions : [
      { id: "sample-1", nombre: "Completa una quest de fuerza", tipo: "fuerza", progreso: 0, objetivo: 1, xpRecompensa: 120 },
      { id: "sample-2", nombre: "Recarga maná con respiración", tipo: "flexibilidad", progreso: 0, objetivo: 1, xpRecompensa: 80 },
      { id: "sample-3", nombre: "Bebe de la fuente vital", tipo: "hidratacion", progreso: 1, objetivo: 3, xpRecompensa: 60 },
    ];
    const focus = new Set(cls.focusZones || []);
    return [...list]
      .sort((a, b) => Number(focus.has(normalizeQuestType(b))) - Number(focus.has(normalizeQuestType(a))))
      .slice(0, 4);
  }, [missions, cls.focusZones]);

  const recentAchievements = useMemo(() => achievements.slice(0, 3), [achievements]);
  const topPlayers = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);
  const completedMissions = useMemo(
    () => missions.filter((mission) => mission?.estado === "completada" || mission?.estado === "reclamada" || mission?.reclamada || mission?.completada || missionProgress(mission).pct >= 100).length,
    [missions]
  );
  const missionPct = missions.length ? clamp(Math.round((completedMissions / missions.length) * 100)) : level.pct;
  const trendData = useMemo(() => buildTrendData(stats, level, missions), [stats, level.xp, level.current, missions]);
  const statChartData = useMemo(
    () => STAT_CARDS.map(({ key, label, color }) => ({
      name: label,
      value: toNumber(stats?.[key] ?? profile?.[key] ?? (key === "fuerza" ? 42 : 36), 0),
      fill: color,
    })),
    [stats, profile]
  );
  const trainedToday = resolveTodayActivity(stats, profile, missions);
  const highStreak = streak >= 7;
  const levelGlow = resolveLevelUpState(stats, profile, level);
  const missionRush = missionPct >= 70 || completedMissions >= 3;
  const quietState = trainedToday === false && !missionRush && !highStreak;
  const heroStateClass = [
    highStreak ? "is-hot-streak" : "",
    quietState ? "is-quiet" : "",
    levelGlow ? "is-ascension" : "",
    missionRush ? "is-clearing" : "",
  ].filter(Boolean).join(" ");
  const heroStatePills = [
    highStreak && { key: "streak", kind: "hot", icon: "/ui/icon-energy.png", label: `Cadena encendida: ${streak} días` },
    levelGlow && { key: "level", kind: "gold", icon: "/ui/medals/rank-crown.png", label: level.pct >= 92 ? "Ascenso casi listo" : "Nuevo rango ganado" },
    missionRush && { key: "missions", kind: "win", icon: "/ui/icons/quest-mision.png", label: "Buen avance de quests" },
    quietState && { key: "quiet", kind: "quiet", icon: "/ui/icons/weather-cloud.png", label: "Día pendiente de activar" },
  ].filter(Boolean);
  const dailyZone = resolveDailyZone({ classKey, trainedToday, missionPct, streak, gems, coins });

  return (
    <div
      className={`uh-page ${heroStateClass}`}
      style={{
        "--class-accent": cls.accent,
        "--class-secondary": cls.secondary,
        "--class-bg": cls.bg,
        "--class-soft": cls.soft,
      }}
    >
      <style>{css}</style>
      <main className="uh-shell">
        <section className={`uh-hero ${heroStateClass}`}>
          <div className="uh-class-crest" aria-hidden="true">
            <img src={cls.crest} alt="" />
          </div>
          <div className="uh-sparks" aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => (
              <span
                key={index}
                className="uh-spark"
                style={{
                  "--x": `${8 + ((index * 17) % 86)}%`,
                  "--y": `${18 + ((index * 23) % 70)}%`,
                  "--s": `${2 + (index % 3)}px`,
                  "--t": `${5 + (index % 5) * .8}s`,
                  "--d": `${index * -.45}s`,
                  "--dx": `${index % 2 ? "-" : ""}${18 + (index % 4) * 8}px`,
                }}
              />
            ))}
          </div>
          <motion.div
            className="uh-copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="uh-eyebrow">
              <img className="uh-ui-icon" src="/ui/medals/rank-crown.png" alt="" /> Mapa de entrenamiento
            </div>
            <h1 className="uh-title">
              {username}, hoy toca <span>forjar el cuerpo.</span>
            </h1>
            <p className="uh-lead">
              Tus quests, atributos y recompensas viven en un solo mapa.
              Entra al campo, mueve el cuerpo y convierte cada sesión en progreso real.
            </p>
            <div className="uh-actions">
              <button className="uh-btn primary" onClick={() => onNavigate?.("ejercicios")}>
                <img className="uh-btn-img" src="/ui/icons/quest-fuerza.png" alt="" /> Entrar al campo
              </button>
              <button className="uh-btn" onClick={() => onNavigate?.("misiones")}>
                <img className="uh-btn-img" src="/ui/icons/quest-mision.png" alt="" /> Abrir quests
              </button>
              <button className="uh-btn" onClick={() => onNavigate?.("personaje")}>
                <img className="uh-btn-img" src={cls.crest} alt="" /> Forja del héroe
              </button>
            </div>

            {heroStatePills.length > 0 && (
              <div className="uh-hero-states">
                {heroStatePills.map((pill) => (
                  <div className={`uh-state-pill ${pill.kind}`} key={pill.key}>
                    <img className="uh-ui-icon" src={pill.icon} alt="" />
                    {pill.label}
                  </div>
                ))}
              </div>
            )}

            <div className="uh-kpis">
              <div className="uh-kpi">
                <strong>{level.level}</strong>
                <span>Nivel</span>
              </div>
              <div className="uh-kpi">
                <strong>{level.xp.toLocaleString()}</strong>
                <span>XP de entreno</span>
              </div>
              <div className="uh-kpi">
                <strong>{streak}</strong>
                <span>Días de disciplina</span>
              </div>
              <div className="uh-kpi">
                <strong>{coins.toLocaleString()}</strong>
                <span>Oro de la forja</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="uh-stage"
            initial={{ opacity: 0, scale: .96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`uh-portal ${heroStateClass}`}>
              {(highStreak || levelGlow || missionRush) && (
                <>
                  <span className="uh-aura-ring" />
                  <span className="uh-aura-ring two" />
                </>
              )}
              <HeroCharacterLoop classKey={classKey} meta={cls} heroStateClass={heroStateClass} />
              <div className="uh-card uh-floating">
                <div className="uh-xp-top">
                  <span>{cls.title}</span>
                  <span>{level.current.toLocaleString()} / {level.needed.toLocaleString()} XP</span>
                </div>
                <ProgressBar value={level.pct} color={cls.accent} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 14, color: "#a89ab8", font: "800 11px/1 JetBrains Mono, monospace" }}>
                  <span>Clase: {cls.label}</span>
                  <span>{level.pct}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section
          className="uh-daily-zone"
          style={{
            "--zone-color": dailyZone.color,
            "--zone-glow": `${dailyZone.color}24`,
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .55, delay: .12, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="uh-daily-inner">
            <div className="uh-daily-marker">
              <img src={dailyZone.marker} alt="" />
            </div>
            <div className="uh-daily-copy">
              <div className="uh-daily-kicker">
                <img src="/ui/icons/zone-flag.png" alt="" />
                Hoy el mapa recomienda
              </div>
              <h2 className="uh-daily-title">{dailyZone.title}</h2>
              <p className="uh-daily-text">{dailyZone.text}</p>
            </div>
            <div className="uh-daily-actions">
              <span className="uh-daily-chip">
                <img src={dailyZone.icon} alt="" />
                {dailyZone.chip}
              </span>
              <button className="uh-btn" onClick={() => onNavigate?.(dailyZone.action)}>
                {dailyZone.actionLabel}
                <img className="uh-ui-icon" src="/ui/icons/map-pin.png" alt="" />
              </button>
            </div>
          </div>
        </motion.section>

        <SectionHead
          kicker="Atributos"
          title="Así va tu build física"
          text="Tus atributos principales quedan a la mano, sin ruido. Lo justo para saber qué entrenar antes de la siguiente sesión."
          action={
            <button className="uh-btn" onClick={() => onNavigate?.("perfil")}>
              Ver ficha <img className="uh-ui-icon" src="/ui/icons/map-pin.png" alt="" />
            </button>
          }
        />

        <section className="uh-section uh-stats">
          {STAT_CARDS.map(({ key, label, color, asset }, index) => {
            const value = toNumber(stats?.[key] ?? profile?.[key] ?? (key === "fuerza" ? 42 : 36), 0);
            return (
              <motion.article
                key={key}
                className="uh-card uh-stat"
                style={{ "--stat-color": color }}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .1 + index * .06, duration: .45 }}
              >
                <div className="uh-stat-top">
                  <img className="uh-stat-img" src={asset} alt="" />
                </div>
                <h3>{label}</h3>
                <div className="value">{value}</div>
                <div style={{ marginTop: 14 }}>
                  <ProgressBar value={value} color={color} />
                </div>
              </motion.article>
            );
          })}
        </section>

        <SectionHead
          kicker="Ruta de hoy"
          title="Quests, botín y movimiento"
          text="Una vista amplia para saber qué toca entrenar, qué puedes reclamar y cómo vas frente al resto del gremio."
        />

        <section className="uh-section uh-grid">
          <article className="uh-card uh-panel-pad">
            <div className="uh-panel-title">
              <div>
                <span>Tablón</span>
                <h3>Quests en marcha</h3>
              </div>
              <button className="uh-btn" onClick={() => onNavigate?.("misiones")}>
                Abrir mapa <img className="uh-ui-icon" src="/ui/icons/map-pin.png" alt="" />
              </button>
            </div>

            {loading && !missions.length ? (
              <div className="uh-empty">El gremio está preparando tus quests...</div>
            ) : (
              <div className="uh-quest-list">
                {featuredMissions.map((mission) => {
                  const type = normalizeQuestType(mission);
                  const zone = QUEST_ZONE[type] || QUEST_ZONE.default;
                  const progress = missionProgress(mission);
                  const done = mission?.estado === "completada" || mission?.estado === "reclamada" || mission?.reclamada || mission?.completada || progress.pct >= 100;
                  const claimed = mission?.estado === "reclamada" || mission?.reclamada === true;
                  const claimable = done && !claimed;
                  const xpGain = toNumber(mission?.xpRecompensa ?? mission?.xp, 80);
                  const rarity = questRarity(mission, xpGain);
                  const classFocus = cls.focusZones?.includes(type);
                  return (
                    <motion.div
                      className={`uh-quest rarity-${rarity.className} ${done ? "ready" : ""} ${classFocus ? "class-focus" : ""}`}
                      key={mission?.id || mission?.nombre}
                      whileHover={{ x: 4, borderColor: cls.accent }}
                      style={{
                        "--quest-border": `${rarity.color}66`,
                        "--quest-glow": `${rarity.color}18`,
                        "--rarity-color": rarity.color,
                        "--zone-color": zone.color,
                      }}
                    >
                      <div className="uh-quest-icon-wrap">
                        <img className="uh-quest-icon" src={QUEST_ICON[type] || QUEST_ICON.default} alt="" />
                        {claimable && <img className="uh-quest-pin" src="/sprites/quest_pin_active.png" alt="" />}
                      </div>
                      <div>
                        <div className="uh-quest-meta">
                          <span className="uh-zone-chip">
                            <img src={zone.icon} alt="" />
                            {zone.label}
                          </span>
                          <span className="uh-rarity-chip">
                            <img src={rarity.icon} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                            {rarity.label}
                          </span>
                          {classFocus && (
                            <span className="uh-class-chip">
                              <img src={cls.crest} alt="" />
                              Afinidad {cls.label}
                            </span>
                          )}
                        </div>
                        <h4>{mission?.nombre || mission?.titulo || "Quest disponible"}</h4>
                        <ProgressBar value={done ? 100 : progress.pct} color={claimed ? "#9080B0" : done ? "#8ac926" : cls.accent} />
                        <small>{claimed ? "Botín ya reclamado" : done ? "Lista para reclamar botín" : `${progress.current}/${progress.goal} de avance físico`}</small>
                      </div>
                      <div className="uh-reward-stack">
                        <div className="uh-gems" aria-hidden="true">
                          {Array.from({ length: rarity.gemCount }, (_, index) => (
                            <img key={index} src="/ui/icon-gem.png" alt="" />
                          ))}
                        </div>
                        {claimed ? (
                          <div className="uh-claim" style={{ opacity: 0.5, cursor: "default" }}>
                            <img src="/sprites/chest_open.png" alt="" />
                            Reclamado
                          </div>
                        ) : claimable ? (
                          <button
                            className={`uh-claim${claimingId === mission.id ? " loading" : ""}`}
                            onClick={() => handleClaim(mission.id)}
                            disabled={!!claimingId}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            <img src="/sprites/chest_open.png" alt="" />
                            {claimingId === mission.id ? "Reclamando..." : "Reclamar botín"}
                          </button>
                        ) : (
                          <div className="uh-chip">
                            <img className="uh-ui-icon" src="/ui/icons/stat-xp.png" alt="" /> +{xpGain} XP
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </article>

          <aside className="uh-card uh-panel-pad">
            <div className="uh-panel-title">
              <div>
                <span>Botín</span>
                <h3>Recompensas a la vista</h3>
              </div>
              <button className="uh-btn" onClick={() => onNavigate?.("tienda")} title="Abrir mercado">
                <img className="uh-ui-icon lg" src="/ui/icon-gold.png" alt="" />
              </button>
            </div>
            <div className="uh-showcase">
              {SHOWCASE.map((item, index) => {
                const rarity = QUEST_RARITY[item.rarity] || QUEST_RARITY.rara;
                const shopItem = item.source.toLowerCase().includes("tienda");
                return (
                  <motion.button
                    key={item.src}
                    className="uh-item"
                    style={{
                      "--item-tone": `${item.tone}33`,
                      "--loot-border": `${rarity.color}66`,
                      "--loot-color": rarity.color,
                      "--loot-speed": `${4.4 + index * .35}s`,
                      "--loot-delay": `${index * -.7}s`,
                      cursor: "pointer",
                    }}
                    onClick={() => onNavigate?.("tienda")}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: .98 }}
                  >
                    <span className="uh-loot-rarity">{rarity.label}</span>
                    <img className="uh-loot-img" src={item.src} alt={item.label} />
                    <span className="uh-loot-name">{item.label}</span>
                    <span className="uh-loot-origin">
                      <img src={shopItem ? "/ui/icon-gold.png" : "/ui/icons/quest-mision.png"} alt="" />
                      {item.source}
                    </span>
                    <div className="uh-loot-detail">
                      <strong>{item.type}</strong>
                      <span>{item.bonus}</span>
                      <span>{shopItem ? "Revísalo en el mercado" : "Se gana entrenando"}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="uh-section uh-grid uh-bottom-grid">
          <article className="uh-card uh-panel-pad">
            <div className="uh-panel-title">
              <div>
                <span>Liga</span>
                <h3>Héroes de la semana</h3>
              </div>
              <img className="uh-rank-crown" src="/ui/medals/rank-crown.png" alt="" />
            </div>
            {topPlayers.length ? (
              <div className="uh-rank">
                {topPlayers.map((player, index) => {
                  const medal = index === 0
                    ? "/ui/medals/medal-gold.png"
                    : index === 1
                      ? "/ui/medals/medal-silver.png"
                      : "/ui/medals/medal-bronze.png";
                  return (
                    <div className="uh-rank-row" key={player?.uid || player?.id || index}>
                      <img className="uh-rank-medal" src={medal} alt={`Puesto ${index + 1}`} />
                      <img className="uh-avatar" src={safeAvatar(player?.activeAvatar)} alt="" />
                      <strong>{player?.nombre || player?.username || player?.displayName || "Héroe"}</strong>
                      <span>{toNumber(player?.xp ?? player?.totalXp, 0).toLocaleString()} XP</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="uh-empty">La arena aún espera movimiento. El primer entrenamiento abre la liga.</div>
            )}
          </article>

          <article className="uh-card uh-panel-pad">
            <div className="uh-panel-title">
              <div>
                <span>Bitácora</span>
                <h3>Cómo viene la semana</h3>
              </div>
              <img className="uh-ui-icon lg" src="/ui/icons/stat-xp.png" alt="" />
            </div>
            <div className="uh-stats uh-summary-kpis">
              <div className="uh-kpi">
                <img className="uh-kpi-img" src="/ui/icon-gem.png" alt="" />
                <strong>{gems.toLocaleString()}</strong>
                <span>Gemas</span>
              </div>
              <div className="uh-kpi">
                <img className="uh-kpi-img" src="/ui/icon-energy.png" alt="" />
                <strong>{streak}</strong>
                <span>Cadena</span>
              </div>
              <div className="uh-kpi">
                <img className="uh-kpi-img" src="/ui/medals/medal-gold.png" alt="" />
                <strong>{achievements.length}</strong>
                <span>Logros</span>
              </div>
            </div>

            <div className="uh-chart-grid">
              <div className="uh-chart-box">
                <div className="uh-chart-title">
                  <div className="uh-chart-title-main">
                    <img src="/ui/icons/stat-xp.png" alt="" />
                    <h4>Ritmo de XP físico</h4>
                  </div>
                  <span className="uh-chart-rune" />
                </div>
                <ResponsiveContainer width="100%" height={168}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uhXpGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cls.accent} stopOpacity={0.72} />
                        <stop offset="95%" stopColor={cls.accent} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#a89ab8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#a89ab8", fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      name="XP"
                      stroke={cls.accent}
                      strokeWidth={3}
                      fill="url(#uhXpGlow)"
                      activeDot={{ r: 5, fill: cls.secondary, stroke: cls.accent, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div
                  className="uh-rpg-meter"
                  style={{ "--meter-value": `${clamp(level.pct)}%`, "--meter-color": cls.accent }}
                  aria-hidden="true"
                >
                  <div className="uh-rpg-meter-fill" />
                </div>
                <p className="uh-chart-note">Una lectura rápida del empuje reciente. Si hay historial real, se usa; si no, el mapa muestra una guía estimada.</p>
              </div>

              <div className="uh-chart-box">
                <div className="uh-chart-title">
                  <div className="uh-chart-title-main">
                    <img src="/ui/icons/quest-mision.png" alt="" />
                    <h4>Quests listas</h4>
                  </div>
                  <span className="uh-chart-rune" />
                </div>
                <ResponsiveContainer width="100%" height={168}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="88%"
                    barSize={14}
                    data={[{ name: "Quests", value: missionPct, fill: cls.accent }]}
                    startAngle={210}
                    endAngle={-150}
                  >
                    <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "rgba(255,255,255,.08)" }} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: -104, height: 86, display: "grid", placeItems: "center", pointerEvents: "none" }}>
                  <div style={{ textAlign: "center" }}>
                    <strong style={{ display: "block", color: "#fff", font: "900 30px/1 JetBrains Mono, monospace" }}>{missionPct}%</strong>
                    <span style={{ color: "#a89ab8", font: "800 10px/1 JetBrains Mono, monospace", letterSpacing: ".1em" }}>AVANCE</span>
                  </div>
                </div>
                <div
                  className="uh-rpg-meter"
                  style={{ "--meter-value": `${clamp(missionPct)}%`, "--meter-color": cls.accent }}
                  aria-hidden="true"
                >
                  <div className="uh-rpg-meter-fill" />
                </div>
                <p className="uh-chart-note">{completedMissions}/{missions.length || featuredMissions.length} quests completadas o cerca de entregar botín.</p>
              </div>
            </div>

            <div className="uh-chart-box" style={{ minHeight: 190, marginTop: 12 }}>
              <div className="uh-chart-title">
                <div className="uh-chart-title-main">
                  <img src="/ui/stat-str.png" alt="" />
                  <h4>Balance de atributos físicos</h4>
                </div>
                <span className="uh-chart-rune" />
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={statChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uhStatsGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cls.secondary} stopOpacity={0.64} />
                      <stop offset="95%" stopColor={cls.secondary} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#a89ab8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#a89ab8", fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Puntos"
                    stroke={cls.secondary}
                    strokeWidth={2.5}
                    fill="url(#uhStatsGlow)"
                    activeDot={{ r: 5, fill: cls.accent, stroke: cls.secondary, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {recentAchievements.length ? recentAchievements.map((achievement, index) => (
                <div className="uh-quest" key={achievement?.id || index} style={{ gridTemplateColumns: "48px minmax(0, 1fr) auto" }}>
                  <img className="uh-ach-medal" src="/ui/medals/medal-gold.png" alt="" />
                  <div>
                    <h4>{achievement?.nombre || "Trofeo desbloqueado"}</h4>
                    <small>{achievement?.descripcion || achievement?.rareza || "Nueva marca física registrada"}</small>
                  </div>
                  <div className="uh-chip">OK</div>
                </div>
              )) : (
                <div className="uh-empty">Cuando ganes trofeos nuevos, aparecerán aquí sin tener que buscarlos.</div>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
