import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import {
  AlertTriangle,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { auth } from "../../firebase";
import { claimMision, getMisionesUsuario } from "../../services/api.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";

const UI = {
  text: "#f7f1ff",
  muted: "#b5a8c7",
  mutedDeep: "#8e82a3",
  line: "rgba(255,255,255,.08)",
  gold: "#f3c969",
  success: "#80d39b",
  cyan: "#5ad8ff",
  danger: "#ff6f7d",
};

const STORAGE_SORT = "um:sort";
const STORAGE_STREAK = "um:claimed-days";
const STORAGE_MISSION_MEMORY = "um:mission-memory";

const MISSION_CLASS_COPY = {
  GUERRERO: {
    title: "Cierra contratos fisicos",
    span: "con peso real.",
    lead:
      "La portada abre como mesa de gremio: primero deja ver el botin, luego los encargos activos y al costado una ficha de territorio viva, sin apretar la lectura.",
    focus: "Fuerza, constancia y botin util",
    rally:
      "Tus misiones deben empujarte a moverte, cobrar y volver al campo sin sentir que estas leyendo un panel frio.",
  },
  ARQUERO: {
    title: "Mantene ritmo, pulso",
    span: "y avance visible.",
    lead:
      "El tablon abre con mejor jerarquia, mas aire y encargos mejor seccionados para revisar rapido, reclamar y salir al siguiente tramo.",
    focus: "Cardio, racha y objetivos agiles",
    rally:
      "La idea es entrar, ver que vale la pena hoy y salir con una ruta clara sin ruido de sobra.",
  },
  MAGO: {
    title: "Ordena objetivos",
    span: "con foco y control.",
    lead:
      "Misiones ya no se siente estrecha. Hero, recomendacion del dia y spotlight lateral hablan con la clase y con el ritmo real del heroe.",
    focus: "Mente, disciplina y progreso limpio",
    rally:
      "Tu tablero debe sentirse como una mesa de campana, no como una tabla tecnica sin presencia.",
  },
  DEFAULT: {
    title: "Abre el tablon",
    span: "del gremio.",
    lead:
      "La pestana se reordena como una portada interna: hero arriba, recomendacion del dia, tablon al centro y ficha viva al costado.",
    focus: "Objetivos, botin y ritmo",
    rally:
      "Todo queda mas claro para entrar, revisar y reclamar sin scroll torpe ni bloques innecesarios.",
  },
};

const MISSION_TYPE_META = {
  Diaria: {
    label: "Quest diaria",
    icon: "/ui/icons/weather-sun.png",
    seal: "/missions/seals/seal-daily.png",
    banner: "/missions/spotlight/spotlight-daily-banner.png",
    summary: "Encargos cortos para sostener continuidad y ritmo diario.",
    route: "Rutina corta",
  },
  Semanal: {
    label: "Campana semanal",
    icon: "/ui/icons/zone-flag.png",
    seal: "/missions/seals/seal-weekly.png",
    banner: "/missions/spotlight/spotlight-weekly-banner.png",
    summary: "Progreso sostenido para cerrar la semana con mas terreno ganado.",
    route: "Ruta de plan",
  },
  Mente: {
    label: "Mision mental",
    icon: "/ui/stat-men.png",
    seal: "/missions/seals/seal-mind.png",
    banner: "/missions/spotlight/spotlight-mind-banner.png",
    summary: "Respiracion, foco y control para no dejar caer la constancia.",
    route: "Santuario mental",
  },
  Evento: {
    label: "Evento del gremio",
    icon: "/ui/icon-gem.png",
    seal: "/missions/seals/seal-event.png",
    banner: "/missions/spotlight/spotlight-event-banner.png",
    summary: "Ventanas especiales con botin extra y avance acelerado.",
    route: "Evento activo",
  },
  Desafio: {
    label: "Reto mayor",
    icon: "/ui/medals/rank-crown.png",
    seal: "/missions/seals/seal-challenge.png",
    banner: "/missions/spotlight/spotlight-challenge-banner.png",
    summary: "Quests de mayor peso, pensadas para marcar avance real.",
    route: "Arena de desafio",
  },
};

const MISSION_ZONE_META = {
  fuerza: { key: "fuerza", label: "Fuerza", icon: "/ui/icons/quest-fuerza.png" },
  cardio: { key: "cardio", label: "Cardio", icon: "/ui/icons/quest-cardio.png" },
  mente: { key: "mente", label: "Mente", icon: "/ui/icons/quest-mision.png" },
  hidratacion: { key: "hidratacion", label: "Hidratacion", icon: "/ui/icons/quest-hidratacion.png" },
  flexibilidad: { key: "flexibilidad", label: "Flexibilidad", icon: "/ui/icons/quest-flexibilidad.png" },
  general: { key: "general", label: "General", icon: "/ui/icons/map-pin.png" },
};

const MISSION_CLASS_STRATEGY = {
  GUERRERO: {
    preferredZones: ["fuerza"],
    supportZones: ["cardio", "general"],
    preferredTypes: ["Desafio", "Semanal"],
  },
  ARQUERO: {
    preferredZones: ["cardio", "flexibilidad"],
    supportZones: ["hidratacion", "general"],
    preferredTypes: ["Diaria", "Semanal", "Evento"],
  },
  MAGO: {
    preferredZones: ["mente", "flexibilidad"],
    supportZones: ["hidratacion", "general"],
    preferredTypes: ["Mente", "Diaria", "Semanal"],
  },
  DEFAULT: {
    preferredZones: ["general"],
    supportZones: ["fuerza", "cardio", "mente", "flexibilidad", "hidratacion"],
    preferredTypes: ["Diaria", "Semanal"],
  },
};

const MISSION_STAGE_THEME = {
  GUERRERO: {
    image: "/missions/missions-hero-warrior.png",
    crest: "/routines/map/territory-fuerza-crest.png",
    label: "Campana de hierro",
    story: "Contratos de fuerza, control y cierre firme del botin.",
  },
  ARQUERO: {
    image: "/missions/missions-hero-archer.png",
    crest: "/routines/map/territory-cardio-crest.png",
    label: "Ruta de impulso",
    story: "Encargos agiles para sostener pulso, ritmo y constancia.",
  },
  MAGO: {
    image: "/missions/missions-hero-mage.png",
    crest: "/routines/map/territory-flexibilidad-crest.png",
    label: "Mesa del foco",
    story: "Misiones que piden control, respiracion y lectura limpia del cuerpo.",
  },
  DEFAULT: {
    image: "/missions/missions-hero-default.png",
    crest: "/routines/map/territory-general-crest.png",
    label: "Mesa del gremio",
    story: "Objetivos mezclados para mantener progreso sin perder direccion.",
  },
};

const MISSION_STATUS_META = {
  ready: { label: "Lista para reclamar", color: UI.gold },
  active: { label: "En marcha", color: UI.success },
  claimed: { label: "Reclamada", color: UI.cyan },
  expired: { label: "Caducada", color: UI.danger },
};

const TABS = ["Diaria", "Semanal", "Mente", "Evento", "Desafio"];

const PAGE_CSS = `
  @keyframes umi-sheen { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }
  @keyframes umi-xpPop { 0%{opacity:0;transform:translate(-50%,-50%) scale(.6)} 40%{opacity:1;transform:translate(-50%,-80px) scale(1.08)} 100%{opacity:0;transform:translate(-50%,-140px) scale(1)} }
  @keyframes umi-modalIn { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes umi-auroraA { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(40px,-28px) scale(1.12)} 70%{transform:translate(-18px,22px) scale(.94)} }
  @keyframes umi-auroraB { 0%,100%{transform:translate(0,0) scale(1)} 45%{transform:translate(-64px,34px) scale(1.08)} 75%{transform:translate(26px,-18px) scale(.96)} }
  .umi-page {
    position: relative;
    min-height: 100vh;
    padding: clamp(14px, 2vw, 32px) clamp(14px, 2vw, 32px) 46px;
    color: ${UI.text};
    overflow: hidden;
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--class-accent), transparent 86%), transparent 26%),
      radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--class-secondary), transparent 88%), transparent 24%),
      linear-gradient(180deg, #090512 0%, var(--class-bg) 48%, #090611 100%);
  }
  .umi-shell {
    position: relative;
    z-index: 1;
    width: min(1680px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 12px;
  }
  .umi-panel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: linear-gradient(180deg, rgba(20,10,34,.78), rgba(8,5,17,.86));
    box-shadow: 0 24px 68px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.05);
  }
  .umi-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 50%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
    color: var(--class-accent);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .umi-kicker img,
  .umi-chip img,
  .umi-tab img,
  .umi-quest-art img,
  .umi-spotlight-crest img,
  .umi-spotlight-chip img,
  .umi-band-art img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .umi-chip-row,
  .umi-actions,
  .umi-spotlight-chip-row,
  .umi-quest-tags,
  .umi-stage-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .umi-chip,
  .umi-stage-pill,
  .umi-spotlight-chip,
  .umi-row-pill,
  .umi-status-chip,
  .umi-reward-badge {
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
  .umi-chip.is-focus {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 45%, transparent);
    background: color-mix(in srgb, var(--class-accent) 12%, transparent);
  }
  .umi-btn,
  .umi-btn-ghost,
  .umi-tab,
  .umi-filter {
    transition: transform .2s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease, color .2s ease;
  }
  .umi-btn,
  .umi-btn-ghost {
    min-height: 34px;
    padding: 8px 14px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
  }
  .umi-btn {
    color: #090611;
    background: linear-gradient(135deg, var(--class-accent), color-mix(in srgb, var(--class-secondary) 72%, white 8%));
    box-shadow: 0 10px 26px color-mix(in srgb, var(--class-accent) 24%, transparent);
  }
  .umi-btn-ghost,
  .umi-filter,
  .umi-sort {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.08);
    color: ${UI.text};
  }
  .umi-btn:hover:not(:disabled),
  .umi-btn-ghost:hover,
  .umi-tab:hover,
  .umi-filter:hover {
    transform: translateY(-2px);
  }
  .umi-btn:disabled {
    opacity: .58;
    cursor: not-allowed;
    transform: none;
  }
  .umi-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr);
    gap: 14px;
    padding: 18px;
    align-items: start;
  }
  .umi-hero-copy {
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .umi-hero-copy h1 {
    margin: 0;
    max-width: 11ch;
    font: 900 clamp(36px, 5.2vw, 80px)/.92 "Manrope", sans-serif;
    color: #fff9ef;
  }
  .umi-hero-copy h1 span {
    color: var(--class-accent);
    text-shadow: 0 0 34px color-mix(in srgb, var(--class-accent), transparent 45%);
  }
  .umi-hero-copy > p {
    font: 500 clamp(14px, 1.2vw, 18px)/1.7 "Manrope", sans-serif;
    color: #cdbfe0;
    max-width: 720px;
  }
  .umi-hero-copy p,
  .umi-stage-card p,
  .umi-band-copy p,
  .umi-section-head p,
  .umi-empty p,
  .umi-spotlight-copy p,
  .umi-spotlight-story p,
  .umi-quest-copy p,
  .umi-toast p,
  .umi-progress-card p,
  .umi-band-side-card p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.55;
  }
  .umi-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .umi-stat-card,
  .umi-band-side-card,
  .umi-spotlight-metric,
  .umi-progress-card {
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
  }
  .umi-stat-card small,
  .umi-band-side-card small,
  .umi-progress-card small,
  .umi-spotlight-metric small {
    display: block;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-stat-card strong,
  .umi-band-side-card strong,
  .umi-progress-card strong,
  .umi-spotlight-metric strong,
  .umi-toast strong {
    display: block;
    margin-top: 6px;
    font-family: "Manrope", sans-serif;
  }
  .umi-stat-card strong,
  .umi-band-side-card strong {
    font-size: clamp(16px, 1.5vw, 22px);
  }
  .umi-stage {
    position: relative;
    min-height: 280px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 30%, rgba(255,255,255,.08));
    background:
      linear-gradient(180deg, rgba(9,8,18,.16), rgba(9,8,18,.92)),
      var(--stage-image) center/cover no-repeat;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.04),
      inset 0 0 44px color-mix(in srgb, var(--class-accent) 14%, transparent),
      0 0 28px color-mix(in srgb, var(--class-accent) 8%, transparent);
  }
  .umi-stage::before {
    content: "";
    position: absolute;
    inset: 10px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent) 16%, transparent);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), transparent 22%),
      url("/ui/panel-texture.png");
    opacity: .34;
    pointer-events: none;
    z-index: 0;
  }
  .umi-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/missions/stage/missions-stage-overlay.png") center/cover no-repeat;
    opacity: .38;
    mix-blend-mode: screen;
    pointer-events: none;
    z-index: 1;
  }
  .umi-stage video,
  .umi-stage-layer {
    position: absolute;
    inset: 0;
  }
  .umi-stage video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(.42) saturate(.86);
  }
  .umi-stage-layer {
    background:
      linear-gradient(180deg, rgba(10,8,18,.16), rgba(10,8,18,.88)),
      linear-gradient(90deg, rgba(10,8,18,.24), rgba(10,8,18,.72) 52%, rgba(10,8,18,.22)),
      radial-gradient(circle at 72% 28%, color-mix(in srgb, var(--class-accent) 16%, transparent), transparent 26%);
  }
  .umi-stage-table {
    position: absolute;
    inset: 28px 26px 126px 26px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(135deg, rgba(14,12,24,.38), rgba(14,12,24,.08)),
      url("/missions/stage/missions-stage-table.png") center/cover no-repeat,
      url("/ui/panel-texture.png");
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.04),
      inset 0 0 34px color-mix(in srgb, var(--class-accent) 8%, transparent);
    opacity: .82;
    z-index: 1;
    pointer-events: none;
  }
  .umi-stage-table::before {
    content: "";
    position: absolute;
    inset: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background:
      linear-gradient(90deg, rgba(10,8,18,.24), rgba(10,8,18,.04)),
      linear-gradient(180deg, color-mix(in srgb, var(--class-accent) 7%, transparent), transparent 55%);
  }
  .umi-stage-table::after {
    content: "";
    position: absolute;
    inset: auto 24px 24px 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--class-accent) 40%, transparent), transparent);
    opacity: .6;
  }
  .umi-stage-crest {
    position: absolute;
    top: 18px;
    right: 18px;
    width: clamp(76px, 8vw, 112px);
    height: clamp(76px, 8vw, 112px);
    object-fit: contain;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--class-accent) 18%, transparent));
    z-index: 2;
  }
  .umi-stage-section {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 64px;
    height: 64px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.34);
    display: grid;
    place-items: center;
    backdrop-filter: blur(10px);
    z-index: 2;
  }
  .umi-stage-class-art {
    position: absolute;
    left: 18px;
    top: 96px;
    width: min(54%, 360px);
    min-height: 228px;
    padding: 16px 18px 18px;
    display: grid;
    align-content: start;
    gap: 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(14,12,24,.72), rgba(9,8,18,.28)),
      linear-gradient(135deg, color-mix(in srgb, var(--class-accent) 10%, transparent), transparent 56%);
    backdrop-filter: blur(10px);
    z-index: 2;
  }
  .umi-stage-class-art::after {
    content: "";
    position: absolute;
    inset: auto 18px 14px 18px;
    height: 1px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--class-accent) 40%, transparent), transparent);
    opacity: .75;
  }
  .umi-stage-class-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .umi-stage-class-crest {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.44);
    display: grid;
    place-items: center;
    box-shadow: inset 0 0 18px color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .umi-stage-class-crest img {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }
  .umi-stage-class-copy {
    display: grid;
    gap: 8px;
    max-width: 26ch;
  }
  .umi-stage-class-copy strong,
  .umi-stage-campaign strong {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(14px, 1.3vw, 20px);
    line-height: 1.04;
  }
  .umi-stage-class-copy p,
  .umi-stage-campaign p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.42;
  }
  .umi-stage-class-copy small,
  .umi-stage-campaign small {
    display: block;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-stage-campaign {
    position: absolute;
    left: 18px;
    bottom: 16px;
    width: min(360px, calc(100% - 462px));
    min-width: 250px;
    display: grid;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(16,12,28,.9), rgba(10,8,18,.94)),
      url("/ui/panel-texture.png");
    backdrop-filter: blur(12px);
    z-index: 2;
  }
  .umi-stage-campaign-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .umi-stage-campaign-stat {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.035);
    display: grid;
    gap: 6px;
  }
  .umi-stage-campaign-stat span {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .umi-stage-campaign-stat strong {
    font-size: 16px;
  }
  .umi-stage-card {
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: min(420px, calc(100% - 32px));
    display: grid;
    gap: 12px;
    padding: 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(16,12,28,.86), rgba(9,7,18,.94));
    backdrop-filter: blur(12px);
    z-index: 2;
    box-shadow: 0 18px 38px rgba(0,0,0,.34);
  }
  .umi-stage-card strong,
  .umi-band-copy h2,
  .umi-section-head h2,
  .umi-spotlight-copy h2,
  .umi-group-head strong,
  .umi-quest-copy strong {
    margin: 0;
    font-family: "Manrope", sans-serif;
  }
  .umi-stage-card strong,
  .umi-spotlight-copy h2 {
    font-size: clamp(16px, 1.4vw, 24px);
    line-height: 1.04;
  }
  .umi-stage-meta {
    gap: 8px;
  }
  .umi-band {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) minmax(200px, .7fr);
    gap: 14px;
    align-items: center;
    padding: 14px 18px;
  }
  .umi-band-art {
    width: 72px;
    min-height: 72px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: color-mix(in srgb, var(--band-color, var(--class-accent)) 12%, rgba(255,255,255,.03));
    display: grid;
    place-items: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .umi-band-art img {
    width: 44px;
    height: 44px;
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--band-color, var(--class-accent)) 20%, transparent));
  }
  .umi-band-copy {
    display: grid;
    gap: 10px;
  }
  .umi-band-route {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 2px;
  }
  .umi-band-node {
    position: relative;
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)),
      rgba(8,8,16,.3);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .umi-band-node::after {
    content: "";
    position: absolute;
    top: 50%;
    right: -10px;
    width: 16px;
    height: 1px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--band-color, var(--class-accent)) 40%, transparent), transparent);
    transform: translateY(-50%);
    opacity: .8;
  }
  .umi-band-node:last-child::after {
    display: none;
  }
  .umi-band-node-art {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.74);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .umi-band-node-art img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    filter: drop-shadow(0 0 12px color-mix(in srgb, var(--band-color, var(--class-accent)) 18%, transparent));
  }
  .umi-band-node-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .umi-band-node-copy small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-band-node-copy strong {
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.08;
  }
  .umi-band-node-copy p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    line-height: 1.25;
  }
  .umi-band-copy h2,
  .umi-section-head h2 {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-weight: 900;
    font-size: clamp(16px, 1.5vw, 22px);
    line-height: 1.06;
  }
  .umi-band-side {
    display: grid;
    gap: 12px;
  }
  .umi-content {
    display: grid;
    grid-template-columns: minmax(0, 1.16fr) minmax(320px, .84fr);
    gap: 16px;
    align-items: start;
  }
  .umi-board,
  .umi-spotlight {
    padding: 16px;
  }
  .umi-spotlight {
    position: sticky;
    top: 14px;
  }
  .umi-section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .umi-controls {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }
  .umi-board-status {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .umi-sync-chip {
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
  .umi-sync-chip.is-live {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 44%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .umi-sync-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 12px currentColor;
  }
  .umi-tab-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }
  .umi-tab {
    min-height: 64px;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    cursor: pointer;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 6px;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .umi-tab.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 48%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, rgba(255,255,255,.03));
    box-shadow: 0 12px 24px color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .umi-tab-icon {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    display: grid;
    place-items: center;
  }
  .umi-tab-count {
    min-width: 20px;
    min-height: 20px;
    padding: 2px 6px;
    border-radius: 999px;
    background: ${UI.gold};
    color: #090611;
    font-family: "Manrope", sans-serif;
    font-size: 10px;
  }
  .umi-filter-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
  .umi-filter-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .umi-filter {
    min-height: 34px;
    padding: 6px 12px;
    border-radius: 999px;
    cursor: pointer;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
  }
  .umi-filter.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 44%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .umi-sort {
    min-height: 38px;
    padding: 0 14px;
    border-radius: 8px;
    outline: none;
    font-family: "Manrope", sans-serif;
    font-size: 13px;
  }
  .umi-group {
    display: grid;
    gap: 12px;
  }
  .umi-group + .umi-group {
    margin-top: 18px;
  }
  .umi-group-head {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--group-color, ${UI.gold});
  }
  .umi-group-head span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--group-color, ${UI.gold});
    box-shadow: 0 0 10px var(--group-color, ${UI.gold});
  }
  .umi-group-head strong {
    font-size: 14px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .umi-group-head small {
    margin-left: auto;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  .umi-row {
    position: relative;
    width: 100%;
    display: grid;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--row-color, var(--class-accent)) 7%, rgba(255,255,255,.03)), rgba(255,255,255,.022)),
      rgba(255,255,255,.025);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
    cursor: pointer;
    text-align: left;
    overflow: hidden;
  }
  .umi-row::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at left top, color-mix(in srgb, var(--row-color, var(--class-accent)) 11%, transparent), transparent 34%),
      linear-gradient(90deg, color-mix(in srgb, var(--row-color, var(--class-accent)) 8%, transparent), transparent 32%);
    opacity: .82;
    pointer-events: none;
  }
  .umi-row-frame {
    display: none;
  }
  .umi-row::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid transparent;
    transition: border-color .2s ease, box-shadow .2s ease;
    pointer-events: none;
  }
  .umi-row:hover::after,
  .umi-row.is-selected::after {
    border-color: color-mix(in srgb, var(--row-color, var(--class-accent)) 36%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--row-color, var(--class-accent)) 16%, transparent);
  }
  .umi-row.is-selected {
    box-shadow: 0 14px 28px color-mix(in srgb, var(--row-color, var(--class-accent)) 10%, transparent);
  }
  .umi-row-main {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) minmax(180px, 208px);
    gap: 12px;
    align-items: start;
  }
  .umi-quest-art {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--row-color, var(--class-accent)) 32%, transparent);
    background:
      radial-gradient(circle at top, color-mix(in srgb, var(--row-color, var(--class-accent)) 14%, transparent), transparent 56%),
      rgba(7,6,14,.55);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .umi-quest-art > img {
    width: 46px;
    height: 46px;
    object-fit: contain;
  }
  .umi-quest-frame {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, transparent, color-mix(in srgb, var(--row-rarity, var(--row-color, var(--class-accent))) 10%, transparent)),
      radial-gradient(circle at top, color-mix(in srgb, var(--row-rarity, var(--row-color, var(--class-accent))) 14%, transparent), transparent 58%);
    opacity: .7;
    pointer-events: none;
  }
  .umi-quest-rarity {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.72);
    display: grid;
    place-items: center;
  }
  .umi-quest-rarity img {
    width: 20px;
    height: 20px;
  }
  .umi-quest-seal {
    position: absolute;
    left: 6px;
    top: 6px;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.8);
    display: grid;
    place-items: center;
    box-shadow: 0 0 16px color-mix(in srgb, var(--row-color, var(--class-accent)) 12%, transparent);
  }
  .umi-quest-seal img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .umi-quest-copy {
    display: grid;
    gap: 6px;
    min-width: 0;
    align-content: start;
  }
  .umi-quest-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }
  .umi-quest-copy strong {
    font-size: 16px;
    line-height: 1.04;
  }
  .umi-quest-sub {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .umi-quest-sub span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .umi-row-detail-copy {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.35;
  }
  .umi-row-detail {
    display: grid;
    gap: 8px;
    padding-top: 2px;
  }
  .umi-row-progress-meta {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    letter-spacing: .04em;
  }
  .umi-row-side {
    display: grid;
    gap: 6px;
    justify-items: stretch;
    min-width: 180px;
    align-content: start;
    justify-self: end;
  }
  .umi-row-side-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }
  .umi-row-loot {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding: 8px 9px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--row-rarity, var(--row-color, var(--class-accent))) 28%, transparent);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--row-rarity, var(--row-color, var(--class-accent))) 8%, transparent), rgba(255,255,255,.02)),
      rgba(8,8,16,.42);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .umi-row-loot-thumb {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.72);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .umi-row-loot-thumb img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    filter: drop-shadow(0 0 14px color-mix(in srgb, var(--row-rarity, var(--row-color, var(--class-accent))) 20%, transparent));
  }
  .umi-row-loot-copy {
    display: grid;
    gap: 3px;
    min-width: 0;
  }
  .umi-row-loot-copy small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-row-loot-copy strong {
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    line-height: 1.1;
  }
  .umi-row-loot-copy p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    line-height: 1.2;
  }
  .umi-row-rewards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .umi-row-expand {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 250px);
    gap: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,.08);
  }
  .umi-row-expand-side {
    display: grid;
    gap: 8px;
    align-content: start;
  }
  .umi-row-expand-actions {
    display: grid;
    gap: 8px;
  }
  .umi-reward-badge strong,
  .umi-status-chip strong,
  .umi-row-pill strong {
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  /* ── Compact mission row (umi-cr-*) ── */
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
    transition: background .15s, border-color .15s;
    overflow: hidden;
  }
  .umi-cr:hover {
    background: rgba(255,255,255,.042);
    border-color: rgba(255,255,255,.1);
  }
  .umi-cr.is-selected {
    border-color: color-mix(in srgb, var(--cr-color) 38%, transparent);
    background: color-mix(in srgb, var(--cr-color) 7%, rgba(255,255,255,.025));
  }
  .umi-cr.is-ready {
    border-color: rgba(243,201,105,.24);
    background: rgba(243,201,105,.055);
  }
  .umi-cr.is-done { opacity: .52; }
  .umi-cr-accentbar {
    position: absolute;
    left: 0; top: 4px; bottom: 4px;
    width: 2px;
    border-radius: 2px;
    background: var(--cr-color);
  }
  .umi-cr-icon {
    width: 30px; height: 30px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,.08);
    background: color-mix(in srgb, var(--cr-color) 13%, rgba(8,6,18,.72));
  }
  .umi-cr-icon img { width: 17px; height: 17px; object-fit: contain; }
  .umi-cr-body {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 4px;
  }
  .umi-cr-title {
    font-family: "Manrope", sans-serif;
    font-size: 13px; font-weight: 700;
    color: ${UI.text};
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 1.2;
  }
  .umi-cr-sub {
    display: flex; align-items: center; gap: 5px;
    font-family: "Manrope", sans-serif;
    font-size: 10px; font-weight: 600;
    color: ${UI.mutedDeep};
    text-transform: uppercase; letter-spacing: .07em;
    white-space: nowrap; overflow: hidden;
  }
  .umi-cr-sub-dot { opacity: .35; }
  .umi-cr-prog-text { color: var(--cr-color); font-weight: 800; }
  .umi-cr-progbar {
    height: 2px; border-radius: 2px;
    background: rgba(255,255,255,.07);
    overflow: hidden;
  }
  .umi-cr-progbar-fill {
    height: 100%; border-radius: 2px;
    transition: width .4s ease;
  }
  .umi-cr-meta {
    display: flex; flex-direction: column; align-items: flex-end;
    gap: 4px; flex-shrink: 0; min-width: 80px;
  }
  .umi-cr-xp {
    font: 800 11px/1 "JetBrains Mono", monospace;
    color: ${UI.gold}; letter-spacing: .04em;
  }
  .umi-cr-statuschip {
    display: inline-flex; align-items: center;
    padding: 3px 9px; border-radius: 999px;
    border: 1px solid;
    font: 700 9px/1 "Manrope", sans-serif;
    text-transform: uppercase; letter-spacing: .08em;
  }
  .umi-cr-claim-btn {
    padding: 4px 12px;
    border-radius: 6px; border: none; cursor: pointer;
    background: ${UI.gold};
    color: #0a0814;
    font: 800 11px/1 "Manrope", sans-serif;
    letter-spacing: .04em;
    transition: opacity .15s;
  }
  .umi-cr-claim-btn:disabled { opacity: .6; cursor: not-allowed; }
  .umi-cr-claim-btn:not(:disabled):hover { opacity: .88; }
  .umi-cr-countdown {
    font: 500 10px/1 "Manrope", sans-serif;
    color: ${UI.mutedDeep};
  }
  .umi-empty {
    min-height: 220px;
    padding: 24px;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,.12);
    background: rgba(255,255,255,.02);
    display: grid;
    place-items: center;
    text-align: center;
    gap: 12px;
  }
  .umi-empty img {
    width: 72px;
    height: 72px;
    object-fit: contain;
  }
  .umi-empty strong {
    font-family: "Manrope", sans-serif;
    font-size: 20px;
  }
  .umi-state-panel {
    position: relative;
    overflow: hidden;
    min-height: 228px;
    padding: 22px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)),
      url("/ui/dashboard-frame.png") center/cover no-repeat,
      rgba(8,8,16,.22);
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 18px;
    align-items: center;
  }
  .umi-state-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--state-color, var(--class-accent)) 14%, transparent), transparent 34%);
    pointer-events: none;
  }
  .umi-state-panel > * {
    position: relative;
    z-index: 1;
  }
  .umi-state-art {
    width: 110px;
    height: 110px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.58);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .umi-state-art img {
    width: 78px;
    height: 78px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--state-color, var(--class-accent)) 20%, transparent));
  }
  .umi-state-copy {
    display: grid;
    gap: 10px;
  }
  .umi-state-copy small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-state-copy strong {
    font-family: "Manrope", sans-serif;
    font-size: 22px;
    line-height: 1.05;
  }
  .umi-state-copy p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.4;
  }
  .umi-loading-list {
    display: grid;
    gap: 12px;
  }
  .umi-loading-card {
    position: relative;
    min-height: 128px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.025);
    overflow: hidden;
  }
  .umi-loading-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent);
    animation: umi-sheen 1.6s ease-in-out infinite;
  }
  .umi-loading-card::after {
    content: "";
    position: absolute;
    inset: 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.04);
    background:
      radial-gradient(circle at 48px 48px, rgba(255,255,255,.12) 0 28px, transparent 29px),
      linear-gradient(90deg, rgba(255,255,255,.09) 0 36%, transparent 36%),
      linear-gradient(180deg, transparent 0 26px, rgba(255,255,255,.05) 26px 38px, transparent 38px 58px, rgba(255,255,255,.05) 58px 66px, transparent 66px);
    opacity: .45;
  }
  .umi-spotlight-stack {
    display: grid;
    gap: 14px;
  }
  .umi-spotlight-banner {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(9,8,18,.36), rgba(9,8,18,.92)),
      var(--spotlight-image) center/cover no-repeat;
    padding: 16px;
    min-height: 176px;
    display: grid;
    align-content: space-between;
  }
  .umi-spotlight-banner::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(10,8,18,.86), rgba(10,8,18,.42)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--spotlight-color, var(--class-accent)) 18%, transparent), transparent 28%);
    pointer-events: none;
  }
  .umi-spotlight-copy,
  .umi-spotlight-banner > div {
    position: relative;
    z-index: 1;
  }
  .umi-spotlight-crest {
    width: 54px;
    height: 54px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.36);
    display: grid;
    place-items: center;
    backdrop-filter: blur(10px);
  }
  .umi-spotlight-crest img {
    width: 28px;
    height: 28px;
  }
  .umi-spotlight-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .umi-contract-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    align-items: start;
  }
  .umi-contract-row {
    display: contents;
  }
  .umi-contract-card {
    padding: 13px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)),
      rgba(8,8,16,.34);
    display: grid;
    gap: 7px;
    align-content: start;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .umi-contract-card--wide {
    grid-column: 1 / -1;
  }
  .umi-contract-card small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-contract-card strong {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.08;
  }
  .umi-contract-card p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    line-height: 1.35;
  }
  .umi-contract-loot {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
  }
  .umi-contract-loot-thumb,
  .umi-contract-route-crest {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.68);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .umi-contract-loot-thumb img,
  .umi-contract-route-crest img {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }
  .umi-contract-value {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .umi-contract-route {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
  }
  .umi-contract-route-copy {
    display: grid;
    gap: 6px;
  }
  .umi-contract-route-copy strong {
    color: ${UI.success};
  }
  .umi-spotlight-story,
  .umi-progress-card {
    display: grid;
    gap: 10px;
  }
  .umi-progress-card {
    padding: 13px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)),
      rgba(8,8,16,.3);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .umi-spotlight-story strong,
  .umi-progress-card strong {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
  }
  .umi-progress-card-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }
  .umi-progress-card-head span {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .umi-journal {
    padding: 20px;
  }
  .umi-journal-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(320px, .96fr);
    gap: 16px;
    align-items: start;
  }
  .umi-journal-stack {
    display: grid;
    gap: 12px;
  }
  .umi-journal-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .umi-journal-card {
    position: relative;
    overflow: hidden;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.13);
    background:
      linear-gradient(180deg, rgba(4,3,12,.78) 0%, rgba(4,3,12,.64) 100%),
      var(--card-bg, url("/ui/scene-bg.png")) center/cover no-repeat;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.07),
      0 0 0 1px rgba(255,255,255,.04),
      0 8px 32px rgba(0,0,0,.4);
    display: grid;
    gap: 10px;
  }
  .umi-journal-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at top left, color-mix(in srgb, var(--card-neon, #a78bfa) 14%, transparent) 0%, transparent 55%),
      radial-gradient(ellipse at bottom right, color-mix(in srgb, var(--card-neon, #a78bfa) 8%, transparent) 0%, transparent 50%);
    pointer-events: none;
  }
  .umi-journal-card > * {
    position: relative;
    z-index: 1;
  }
  .umi-journal-card small,
  .umi-journal-chart-card small {
    color: rgba(255,255,255,.72);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    text-shadow: 0 0 10px var(--card-neon, rgba(255,255,255,.4)), 0 0 24px var(--card-neon, rgba(255,255,255,.2));
  }
  .umi-journal-card strong,
  .umi-journal-chart-card strong {
    font-family: "Manrope", sans-serif;
    font-size: 16px;
    line-height: 1.08;
    text-shadow: 0 0 12px currentColor, 0 0 28px currentColor, 0 0 52px currentColor;
  }
  .umi-journal-card p,
  .umi-journal-chart-card p {
    margin: 0;
    color: rgba(220,215,240,.8);
    font-family: "Manrope", sans-serif;
    font-size: 13px;
    line-height: 1.4;
    text-shadow: 0 1px 8px rgba(0,0,0,.6);
  }
  .umi-journal-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .umi-journal-head img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }
  .umi-journal-value {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }
  .umi-journal-value span {
    color: rgba(255,255,255,.52);
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .08em;
    text-shadow: 0 0 8px rgba(255,255,255,.18);
  }
  .umi-journal-tipwrap {
    position: relative;
  }
  .umi-journal-tip {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    width: min(240px, calc(100vw - 64px));
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(18,13,30,.98), rgba(10,8,18,.98));
    box-shadow: 0 18px 28px rgba(0,0,0,.36);
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition: opacity .18s ease, transform .18s ease;
    z-index: 5;
  }
  .umi-journal-tipwrap:hover .umi-journal-tip,
  .umi-journal-tipwrap:focus-within .umi-journal-tip {
    opacity: 1;
    transform: translateY(0);
  }
  .umi-journal-chart-card {
    position: relative;
    overflow: hidden;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.13);
    background:
      linear-gradient(180deg, rgba(4,3,12,.82) 0%, rgba(4,3,12,.68) 100%),
      url("/missions/spotlight/spotlight-weekly-banner.png") center/cover no-repeat;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.07),
      0 8px 32px rgba(0,0,0,.4);
    display: grid;
    gap: 12px;
  }
  .umi-journal-chart {
    position: relative;
    height: 214px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.06);
    background:
      linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01)),
      url("/missions/journal/journal-bg.png") center/cover no-repeat,
      rgba(8,8,16,.4);
    overflow: hidden;
  }
  .umi-journal-chart svg {
    width: 100%;
    height: 100%;
  }
  .umi-journal-points {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .umi-journal-point {
    position: absolute;
    width: 20px;
    height: 20px;
    pointer-events: auto;
  }
  .umi-journal-point button {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: default;
  }
  .umi-journal-point button span {
    display: block;
    width: 18px;
    height: 18px;
    margin: 1px;
    background: var(--point-image) center/contain no-repeat;
    filter: drop-shadow(0 0 12px var(--point-color));
  }
  .umi-journal-tooltip {
    position: absolute;
    left: -6px;
    bottom: calc(100% + 8px);
    min-width: 150px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(18,13,30,.98), rgba(10,8,18,.98));
    box-shadow: 0 16px 24px rgba(0,0,0,.34);
    opacity: 0;
    transform: translateY(6px);
    transition: opacity .18s ease, transform .18s ease;
    pointer-events: none;
  }
  .umi-journal-point:hover .umi-journal-tooltip,
  .umi-journal-point:focus-within .umi-journal-tooltip {
    opacity: 1;
    transform: translateY(0);
  }
  .umi-journal-tooltip strong {
    display: block;
    font-family: "Manrope", sans-serif;
    font-size: 12px;
  }
  .umi-journal-tooltip p {
    margin: 4px 0 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    line-height: 1.2;
  }
  .umi-journal-labels {
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 10px;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
    text-align: center;
  }
  .umi-toast {
    position: fixed;
    right: 20px;
    z-index: 520;
    width: min(340px, calc(100vw - 30px));
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(18,13,30,.98), rgba(10,8,18,.98));
    box-shadow: 0 18px 34px rgba(0,0,0,.46);
  }
  .umi-toast.bottom { bottom: 24px; }
  .umi-toast.top { top: 18px; }
  .umi-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 540;
    background: rgba(4,4,10,.82);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .umi-modal {
    width: min(100%, 560px);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(20,17,34,.98), rgba(10,9,19,.98)),
      url("/ui/panel-texture.png");
    box-shadow: 0 26px 56px rgba(0,0,0,.55), 0 0 0 1px color-mix(in srgb, var(--class-accent) 16%, transparent);
    animation: umi-modalIn .22s ease both;
    overflow: hidden;
  }
  .umi-modal-head,
  .umi-modal-body {
    padding: 18px 20px;
  }
  .umi-modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .umi-modal-body {
    display: grid;
    gap: 14px;
  }
  .umi-modal-body h3 {
    margin: 0;
    font-family: "Manrope", sans-serif;
    font-size: 22px;
  }
  .umi-modal-body p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.45;
  }
  .umi-modal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .umi-modal-tabs {
    display: inline-grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 6px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
  }
  .umi-modal-tab {
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
    cursor: pointer;
  }
  .umi-modal-tab.is-active {
    color: var(--class-accent);
    border-color: color-mix(in srgb, var(--class-accent) 34%, transparent);
    background: color-mix(in srgb, var(--class-accent) 10%, transparent);
  }
  .umi-sheet {
    width: min(100%, 620px);
    max-height: min(88vh, 820px);
    margin-top: auto;
    border-radius: 8px 8px 0 0;
    overflow: hidden;
  }
  .umi-sheet-handle {
    width: 72px;
    height: 5px;
    margin: 10px auto 2px;
    border-radius: 999px;
    background: rgba(255,255,255,.18);
  }
  .umi-sheet-scroll {
    max-height: min(76vh, 720px);
    overflow: auto;
  }
  .umi-sheet-panel {
    display: grid;
    gap: 12px;
  }
  .umi-sheet-card {
    padding: 14px 15px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02)),
      rgba(8,8,16,.32);
    display: grid;
    gap: 8px;
  }
  .umi-sheet-hero {
    position: relative;
    overflow: hidden;
    min-height: 148px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(10,8,18,.24), rgba(10,8,18,.88)),
      var(--sheet-image) center/cover no-repeat;
    display: grid;
    align-content: end;
  }
  .umi-sheet-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(10,8,18,.16), rgba(10,8,18,.82));
    pointer-events: none;
  }
  .umi-sheet-hero > * {
    position: relative;
    z-index: 1;
  }
  .umi-sheet-card small {
    color: ${UI.mutedDeep};
    font-family: "Manrope", sans-serif;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .umi-sheet-card strong {
    font-family: "Manrope", sans-serif;
    font-size: 15px;
    line-height: 1.08;
  }
  .umi-sheet-card p {
    margin: 0;
    color: ${UI.muted};
    font-family: "Manrope", sans-serif;
    font-size: 14px;
    line-height: 1.35;
  }
  .umi-sheet-route {
    display: grid;
    grid-template-columns: 60px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }
  .umi-sheet-route-art {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8,8,16,.72);
    display: grid;
    place-items: center;
  }
  .umi-sheet-route-art img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
  /* ── 1440px ── */
  @media (max-width: 1440px) {
    .umi-hero { grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); }
    .umi-content { grid-template-columns: minmax(0, 1.2fr) minmax(290px, .8fr); }
    .umi-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  /* ── 1280px ── */
  @media (max-width: 1280px) {
    .umi-hero { grid-template-columns: minmax(0, 1.4fr) minmax(250px, .6fr); }
    .umi-content { grid-template-columns: minmax(0, 1.4fr) minmax(260px, .6fr); }
    .umi-tab-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  /* ── 1180px: columna única ── */
  @media (max-width: 1180px) {
    .umi-hero, .umi-content { grid-template-columns: 1fr; align-items: start; }
    .umi-band { grid-template-columns: auto minmax(0, 1fr); }
    .umi-spotlight { position: static; }
    .umi-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .umi-band-side { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .umi-journal-layout { grid-template-columns: 1fr; }
    .umi-stage-class-art { width: min(52%, 300px); }
    .umi-stage-campaign { width: min(300px, calc(100% - 340px)); }
    .umi-stage { min-height: 240px; }
  }
  /* ── 1024px ── */
  @media (max-width: 1024px) {
    .umi-band { grid-template-columns: auto minmax(0, 1fr); }
    .umi-tab-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  /* ── viewport corto (1366x768, 1280x720, 1128x634) ── */
  @media (max-height: 800px) and (min-width: 900px) {
    .umi-page { padding: 10px 14px; }
    .umi-hero { padding: 12px 14px; gap: 10px; }
    .umi-hero-copy h1 { font-size: clamp(20px, 2.4vw, 34px); }
    .umi-stat-card { padding: 10px 12px; }
    .umi-stat-card strong { font-size: clamp(14px, 1.3vw, 18px); }
    .umi-stage { min-height: 200px; }
    .umi-band { padding: 10px 14px; }
    .umi-band-art { width: 52px; min-height: 52px; }
    .umi-band-art img { width: 32px; height: 32px; }
    .umi-board, .umi-spotlight { padding: 12px; }
    .umi-tab { min-height: 50px; }
    .umi-shell { gap: 8px; }
  }
  /* ── 820px: móvil grande ── */
  @media (max-width: 820px) {
    .umi-page { padding: 10px 10px 24px; }
    .umi-hero, .umi-band, .umi-board, .umi-spotlight { padding: 14px; }
    .umi-hero-copy h1 { max-width: 100%; font-size: clamp(24px, 8vw, 40px); }
    .umi-tab-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .umi-row-main { grid-template-columns: 60px minmax(0, 1fr); }
    .umi-quest-art { width: 60px; height: 60px; }
    .umi-quest-art > img { width: 40px; height: 40px; }
    .umi-row-side { min-width: 0; justify-items: stretch; justify-self: stretch; }
    .umi-row-side-meta { justify-content: flex-start; }
    .umi-row-expand { grid-template-columns: 1fr; }
    .umi-contract-grid { grid-template-columns: 1fr; }
    .umi-contract-card--wide { grid-column: auto; }
    .umi-row-rewards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .umi-filter-row { flex-direction: column; align-items: stretch; }
    .umi-sort { width: 100%; }
    .umi-band-route, .umi-journal-row { grid-template-columns: 1fr; }
    .umi-state-panel { grid-template-columns: 1fr; text-align: center; justify-items: center; }
    .umi-stage { min-height: 220px; }
    .umi-stage-table { inset: 14px 12px 90px 12px; }
    .umi-stage-class-art { top: 70px; left: 10px; width: calc(100% - 20px); min-height: 120px; }
    .umi-stage-campaign, .umi-stage-card { left: 10px; right: 10px; width: auto; min-width: 0; }
    .umi-stage-campaign { bottom: 100px; }
    .umi-stage-card { bottom: 10px; }
  }
  /* ── 560px: móvil pequeño ── */
  @media (max-width: 560px) {
    .umi-stat-grid, .umi-band-side, .umi-spotlight-grid, .umi-modal-grid, .umi-contract-grid { grid-template-columns: 1fr; }
    .umi-stage { min-height: 180px; }
    .umi-stage-card { width: calc(100% - 20px); right: 10px; bottom: 10px; }
    .umi-stage-class-copy strong, .umi-stage-campaign strong { font-size: 14px; }
    .umi-stage-campaign-grid { grid-template-columns: 1fr; }
    .umi-row-rewards { grid-template-columns: 1fr; }
    .umi-tab-row { grid-template-columns: 1fr; }
    .umi-kicker, .umi-chip, .umi-btn, .umi-btn-ghost, .umi-filter { width: 100%; justify-content: center; }
    .umi-actions { display: grid; gap: 8px; }
    .umi-modal-backdrop { align-items: flex-end; padding: 0; }
    .umi-sheet { width: 100%; max-height: 88vh; border-radius: 8px 8px 0 0; }
    .umi-sheet-scroll { max-height: 78vh; padding-bottom: 14px; }
  }

  /* ── Neon text layer — toda la pestaña ── */
  .umi-page h1 {
    text-shadow: 0 0 28px rgba(255,255,255,.18), 0 0 56px rgba(255,255,255,.08);
  }
  .umi-page h2 {
    text-shadow: 0 0 20px rgba(255,255,255,.13), 0 0 40px rgba(255,255,255,.06);
  }
  .umi-kicker {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .umi-chip.is-focus {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  .umi-stat-card strong,
  .umi-band-side-card strong,
  .umi-spotlight-metric strong {
    text-shadow: 0 0 10px currentColor, 0 0 26px currentColor;
  }
  .umi-stat-card small,
  .umi-band-side-card small,
  .umi-spotlight-metric small {
    text-shadow: 0 0 8px rgba(255,255,255,.22);
  }
  .umi-cr-title {
    text-shadow: 0 0 10px rgba(255,255,255,.16);
  }
  .umi-cr-xp {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .umi-cr-statuschip {
    text-shadow: 0 0 8px currentColor;
  }
  .umi-cr-prog-text {
    text-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
  }
  .umi-reward-badge strong {
    text-shadow: 0 0 8px currentColor, 0 0 18px currentColor;
  }
  .umi-spotlight-copy strong,
  .umi-spotlight-metric strong {
    text-shadow: 0 0 12px currentColor, 0 0 28px currentColor;
  }
  .umi-band-copy h2 {
    text-shadow: 0 0 22px rgba(255,255,255,.14), 0 0 44px rgba(255,255,255,.06);
  }
  .umi-section-head h2 {
    text-shadow: 0 0 20px rgba(255,255,255,.13), 0 0 40px rgba(255,255,255,.06);
  }
  .umi-toast strong {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .umi-tab.is-active {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  .umi-cr-claim-btn {
    text-shadow: 0 0 8px rgba(10,8,20,.4);
  }
`;

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
  if (xp >= 360) return { label: "Legendaria", asset: "/ui/rarity/rarity-legendary.png", color: UI.gold };
  if (xp >= 240) return { label: "Epica", asset: "/ui/rarity/rarity-epic.png", color: "#c08aff" };
  if (xp >= 140) return { label: "Rara", asset: "/ui/rarity/rarity-rare.png", color: UI.cyan };
  return { label: "Comun", asset: "/ui/rarity/rarity-common.png", color: UI.success };
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
  if (key === "Semanal") return `Reinicia en ${fmtCountdown(secsUntilMonday(serverOffset))}`;
  if (key === "Diaria") return `Reinicia en ${fmtCountdown(secsUntilMidnight(serverOffset))}`;
  return "Contrato en marcha";
}

function getMissionRewardVisual(mission, statusKey) {
  const typeKey = normalizeMissionType(mission?.tipo);
  if (statusKey === "ready") {
    return {
      art: "/missions/rewards/reward-contract-chest.png",
      label: "Botin listo",
      sublabel: "Cobro inmediato",
    };
  }
  if (statusKey === "claimed") {
    return {
      art: "/missions/rewards/reward-claimed-seal.png",
      label: "Botin sellado",
      sublabel: "Ya archivado",
    };
  }
  if (typeKey === "Evento") {
    return {
      art: "/missions/rewards/reward-gem-cache.png",
      label: "Token de evento",
      sublabel: "Botin temporal",
    };
  }
  if (typeKey === "Mente") {
    return {
      art: "/missions/rewards/reward-xp-scroll.png",
      label: "Enfoque activo",
      sublabel: "Foco en reserva",
    };
  }
  return {
    art: "/missions/rewards/reward-xp-scroll.png",
    label: "Botin en ruta",
    sublabel: "Sigue el contrato",
  };
}

function getMissionRowFrameAsset(rarityLabel = "") {
  switch (rarityLabel) {
    case "Legendaria":
      return "/missions/rows/row-frame-legendary.png";
    case "Epica":
      return "/missions/rows/row-frame-epic.png";
    case "Rara":
      return "/missions/rows/row-frame-rare.png";
    default:
      return "/missions/rows/row-frame-common.png";
  }
}

function getMissionRiskMeta(mission, rarity, statusKey) {
  const zone = getMissionZone(mission);
  const progressPct = Math.min(((mission?.progreso || 0) / Math.max(mission?.total || 1, 1)) * 100, 100);
  if (statusKey === "ready") {
    return {
      label: "Cobro inmediato",
      detail: "La tarea ya esta cerrada y solo pide reclamar.",
      color: UI.gold,
    };
  }
  if (rarity.label === "Legendaria" || rarity.label === "Epica") {
    return {
      label: "Carga alta",
      detail: `Contrato ${rarity.label.toLowerCase()} en ${zone.label.toLowerCase()}.`,
      color: rarity.color,
    };
  }
  if (progressPct >= 60) {
    return {
      label: "Tramo final",
      detail: "Queda poco para sellar el objetivo.",
      color: UI.success,
    };
  }
  return {
    label: "Avance estable",
    detail: `Zona ${zone.label.toLowerCase()} con progreso abierto.`,
    color: UI.cyan,
  };
}

function getMissionRouteVisual(route) {
  switch (route?.id) {
    case "mente":
      return { icon: "/ui/stat-men.png", crest: "/ui/crest-mage.png", label: "Santuario mental" };
    case "tienda":
      return { icon: "/ui/icon-gold.png", crest: "/ui/header/section-tienda.png", label: "Tienda del gremio" };
    case "rutinas":
      return { icon: "/ui/header/section-rutinas.png", crest: "/routines/map/territory-general-crest.png", label: "Mesa de rutinas" };
    case "ejercicios":
      return { icon: "/ui/header/section-ejercicios.png", crest: "/sprites/quest_pin_active.png", label: "Campo de entrenamiento" };
    default:
      return { icon: "/ui/header/section-misiones.png", crest: "/ui/header/section-misiones.png", label: "Tablon del gremio" };
  }
}

function getMissionBandStateVisual(statusKey) {
  switch (statusKey) {
    case "ready":
      return {
        art: "/missions/rewards/reward-contract-chest.png",
        label: "Lista para reclamar",
        detail: "El contrato ya quedo cerrado.",
      };
    case "claimed":
      return {
        art: "/missions/rewards/reward-claimed-seal.png",
        label: "Reclamada hoy",
        detail: "Botin ya guardado en la bitacora.",
      };
    case "expired":
      return {
        art: "/missions/states/state-filter-empty.png",
        label: "Ventana caida",
        detail: "Ese encargo ya no se puede sellar hoy.",
      };
    default:
      return {
        art: "/missions/seals/seal-daily.png",
        label: "En progreso",
        detail: "El encargo sigue vivo y abierto.",
      };
  }
}

function buildMissionWeekSeries(weekDays, claimedDays, todayKey) {
  return weekDays.map((day, index) => {
    const claimed = claimedDays.includes(day);
    const isToday = day === todayKey;
    return {
      key: day,
      label: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"][index],
      claimed,
      isToday,
      value: claimed ? 3.6 : isToday ? 1.6 : 0.9,
    };
  });
}

function getMissionJournalSeal(point) {
  if (point.claimed) return "/missions/journal/journal-seal-claimed.png";
  if (point.isToday) return "/missions/journal/journal-seal-today.png";
  return "/missions/journal/journal-seal-empty.png";
}

function formatSyncLabel(timestamp) {
  if (!timestamp) return "Sin registro";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 45000) return "Ahora mismo";
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  return `Hace ${hours} h`;
}

function getMissionBoardStateMeta({ loading, error, tab, filterEstado, showExpired, hasAnyInTab, visibleCount }) {
  if (loading) {
    return {
      art: "/missions/states/state-syncing-board.png",
      kicker: "Tablero sincronizando",
      title: "El gremio esta alineando contratos",
      detail: "Las ordenes del dia se estan reuniendo para mostrar progreso, botin y prioridad real.",
      color: UI.cyan,
    };
  }
  if (error) {
    return {
      art: "/missions/states/state-connection-lost.png",
      kicker: "Lectura interrumpida",
      title: "La mesa no pudo actualizarse",
      detail: "La conexion corto la lectura del tablon. Intenta otra vez y el gremio retomara el registro.",
      color: UI.danger,
    };
  }
  if (!hasAnyInTab) {
    return {
      art: "/missions/states/state-empty-missions.png",
      kicker: "Territorio sin encargos",
      title: `No hay contratos en ${getMissionTypeMeta(tab).label.toLowerCase()}`,
      detail: "Cuando esta ruta reciba nuevas ordenes, apareceran aqui con su botin y estado vivos.",
      color: UI.muted,
    };
  }
  if (visibleCount === 0) {
    return {
      art: "/missions/states/state-filter-empty.png",
      kicker: "Vista sin resultados",
      title: filterEstado === "reclamadas" ? "No hay contratos archivados en esta vista" : "Los filtros vaciaron la mesa",
      detail: filterEstado === "reclamadas"
        ? "Todavia no hay registros que mostrar en esta combinacion."
        : "Prueba otro filtro o vuelve al tablon completo para ver mas encargos activos.",
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

function getHeroPeriod(serverOffset = 0) {
  const hour = getOffsetDate(serverOffset).getHours();
  if (hour < 5) return "madrugada";
  if (hour < 12) return "manana";
  if (hour < 19) return "tarde";
  return "noche";
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
    reasons.push("ya esta lista para cobrar");
  } else if (statusKey === "active") {
    score += 210;
  } else if (statusKey === "claimed") {
    score -= 180;
  } else if (statusKey === "expired") {
    score -= 420;
  }

  if (strategy.preferredZones.includes(zone.key)) {
    score += 120;
    reasons.push(`encaja con tu clase ${context.classLabel.toLowerCase()}`);
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
    reasons.push("protege tu racha diaria");
  }

  if (typeKey === "Evento" && mission?.fechaFin) {
    const secs = secsUntilExpiry(`${mission.fechaFin}T23:59:59`, context.serverOffset);
    if (secs <= 21600) {
      score += 72;
      reasons.push("se cierra pronto");
    } else if (secs <= 86400) {
      score += 38;
    }
  }

  if (typeKey === "Diaria" && secsUntilMidnight(context.serverOffset) <= 21600) {
    score += 32;
  }

  if (lastClosed?.id === mission.id) {
    score -= 120;
  }
  if (lastClosed?.zone === zone.key) {
    score -= 86;
  }
  if (lastClosed?.type === typeKey) {
    score -= 52;
  }

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
    reasons.push("cambia el territorio para variar la carga");
  }

  return {
    score,
    reasons: [...new Set(reasons)].slice(0, 3),
  };
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

function getMissionRoute(mision) {
  const typeKey = normalizeMissionType(mision?.tipo);
  const zone = getMissionZone(mision);
  if (typeKey === "Mente") return { id: "mente", label: "Ir a mente" };
  if (typeKey === "Evento") return { id: "tienda", label: "Ver tienda" };
  if (typeKey === "Semanal") return { id: "rutinas", label: "Abrir rutina" };
  if (zone.label === "Cardio" || zone.label === "Fuerza" || zone.label === "Flexibilidad") return { id: "ejercicios", label: "Ir al campo" };
  return { id: "misiones", label: "Volver al tablon" };
}

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
          boxShadow: `0 0 16px ${color}44`,
        }}
      />
    </div>
  );
}

function MissionJournalChart({ points, color }) {
  const width = 360;
  const height = 164;
  const paddingX = 18;
  const paddingY = 18;
  const stepX = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const toY = (value) => height - paddingY - ((value / maxValue) * (height - paddingY * 2));
  const polyline = points.map((point, index) => `${paddingX + index * stepX},${toY(point.value)}`).join(" ");
  const area = `${paddingX},${height - paddingY} ${polyline} ${paddingX + (points.length - 1) * stepX},${height - paddingY}`;

  return (
    <div className="umi-journal-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {[0.25, 0.5, 0.75].map((tick) => (
          <line
            key={tick}
            x1={paddingX}
            x2={width - paddingX}
            y1={height - paddingY - tick * (height - paddingY * 2)}
            y2={height - paddingY - tick * (height - paddingY * 2)}
            stroke="rgba(255,255,255,.07)"
            strokeDasharray="4 6"
          />
        ))}
        <polygon
          points={area}
          fill={`color-mix(in srgb, ${color} 14%, transparent)`}
          style={{ filter: `drop-shadow(0 0 18px ${color}22)` }}
        />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="umi-journal-points">
        {points.map((point, index) => (
          <div
            key={point.key}
            className={`umi-journal-point${point.claimed ? " is-claimed" : ""}${point.isToday ? " is-today" : ""}`}
            style={{
              left: `calc(${((index) / Math.max(points.length - 1, 1)) * 100}% - 10px)`,
              top: `${toY(point.value) - 10}px`,
              "--point-color": point.claimed ? UI.gold : point.isToday ? color : "rgba(255,255,255,.22)",
              "--point-image": `url(${getMissionJournalSeal(point)})`,
            }}
          >
            <button type="button">
              <span />
            </button>
            <div className="umi-journal-tooltip">
              <strong>{point.label}</strong>
              <p>{point.claimed ? "Quest diaria reclamada." : point.isToday ? "Jornada actual en curso." : "Sin sello registrado."}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="umi-journal-labels">
        {points.map((point) => (
          <span key={point.key}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function UMBackground({ color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    let raf;

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
    const colors = [`${color}bb`, `${UI.gold}88`, `${UI.cyan}66`];

    const tick = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.life += particle.speed;
        if (particle.life >= 1) {
          particle.life = 0;
          particle.x = Math.random() * canvas.width;
          particle.y = canvas.height + 10;
        }
        const alpha = particle.life < 0.2 ? particle.life / 0.2 : particle.life > 0.8 ? 1 - (particle.life - 0.8) / 0.2 : 1;
        context.beginPath();
        context.arc(particle.x, particle.y + particle.vy * particle.life * 900, particle.r, 0, Math.PI * 2);
        context.fillStyle = colors[Math.floor((particle.x / canvas.width) * colors.length)];
        context.globalAlpha = alpha * 0.55;
        context.fill();
        particle.x += particle.vx;
      });
      context.globalAlpha = 1;
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
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "55%",
          height: "55%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}12 0%, transparent 65%)`,
          filter: "blur(60px)",
          animation: "umi-auroraA 22s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${UI.gold}0E 0%, transparent 65%)`,
          filter: "blur(70px)",
          animation: "umi-auroraB 28s ease-in-out infinite",
        }}
      />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "screen" }} />
    </div>
  );
}

function ClaimModal({ mission, claimResult, onClose }) {
  const rarity = getMissionRarity(claimResult?.xpGanado || mission?.xpRecompensa || 0);
  const gems = claimResult?.coinsGanados ?? Math.max(1, Math.floor((mission?.xpRecompensa || 0) / 8));

  return (
    <div className="umi-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="umi-modal" style={{ "--class-accent": rarity.color }}>
        <div className="umi-modal-head">
          <div className="umi-kicker">
            <img src={rarity.asset} alt={rarity.label} />
            <span>Botin reclamado</span>
          </div>
          <button className="umi-btn-ghost" onClick={onClose} aria-label="Cerrar recompensa">
            <X size={14} />
          </button>
        </div>
        <div className="umi-modal-body">
          <h3>{mission?.titulo}</h3>
          <p>El contrato ya entro a tu bitacora y dejo experiencia real para seguir forjando avance.</p>
          <div className="umi-modal-grid">
            <div className="umi-spotlight-metric">
              <small>XP ganada</small>
              <strong style={{ color: UI.gold }}>{claimResult?.xpGanado ?? mission?.xpRecompensa ?? 0}</strong>
            </div>
            <div className="umi-spotlight-metric">
              <small>Gemas</small>
              <strong style={{ color: "#c08aff" }}>{gems}</strong>
            </div>
          </div>
          <button className="umi-btn" onClick={onClose}>
            Seguir
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ mission, serverOffset, onClose, onClaim, claiming }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("objetivo");
  const typeMeta = getMissionTypeMeta(mission?.tipo);
  const zoneMeta = getMissionZone(mission);
  const rarity = getMissionRarity(mission?.xpRecompensa || 0);
  const statusKey = getMissionStatusKey(mission, serverOffset);
  const status = MISSION_STATUS_META[statusKey];
  const rewardVisual = getMissionRewardVisual(mission, statusKey);
  const riskMeta = getMissionRiskMeta(mission, rarity, statusKey);
  const route = getMissionRoute(mission);
  const routeVisual = getMissionRouteVisual(route);
  const gems = Math.max(1, Math.floor((mission?.xpRecompensa || 0) / 8));
  const progressPct = Math.min(((mission?.progreso || 0) / Math.max(mission?.total || 1, 1)) * 100, 100);

  if (isMobile) {
    return (
      <div className="umi-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="umi-modal umi-sheet" style={{ "--class-accent": status.color }}>
          <div className="umi-sheet-handle" />
          <div className="umi-modal-head">
            <div className="umi-kicker">
              <img src={typeMeta.icon} alt="" />
              <span>Hoja de contrato</span>
            </div>
            <button className="umi-btn-ghost" onClick={onClose} aria-label="Cerrar detalle">
              <X size={14} />
            </button>
          </div>

          <div className="umi-sheet-scroll">
            <div className="umi-modal-body">
              <h3>{mission.titulo}</h3>
              <div className="umi-spotlight-chip-row">
                <span className="umi-spotlight-chip" style={{ color: status.color, borderColor: `${status.color}55` }}>
                  <Shield size={13} />
                  {status.label}
                </span>
                <span className="umi-spotlight-chip">
                  <img src={zoneMeta.icon} alt="" />
                  {zoneMeta.label}
                </span>
                <span className="umi-spotlight-chip" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>
                  <img src={rarity.asset} alt="" />
                  {rarity.label}
                </span>
              </div>

              <div className="umi-modal-tabs" role="tablist" aria-label="Vistas del contrato">
                {[
                  ["objetivo", "Objetivo"],
                  ["botin", "Botin"],
                  ["ruta", "Ruta"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`umi-modal-tab${tab === value ? " is-active" : ""}`}
                    onClick={() => setTab(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="umi-sheet-panel">
                {tab === "objetivo" && (
                  <>
                    <div className="umi-sheet-hero" style={{ "--sheet-image": "url('/missions/sheet/sheet-contract-header.png')" }}>
                      <small style={{ color: UI.mutedDeep }}>Contrato activo</small>
                      <strong style={{ fontFamily: "'Manrope',sans-serif", fontSize: 18 }}>{mission.titulo}</strong>
                    </div>
                    <div className="umi-sheet-card">
                      <small>Objetivo principal</small>
                      <strong>{typeMeta.summary}</strong>
                      <p>{mission.descripcion}</p>
                    </div>
                    <div className="umi-sheet-card">
                      <small>Progreso del contrato</small>
                      <strong style={{ color: status.color }}>{mission.progreso}/{mission.total}</strong>
                      <MiniBar val={progressPct} max={100} color={status.color} height={8} />
                      <p>{getMissionCountdownLabel(mission, serverOffset)}</p>
                    </div>
                  </>
                )}

                {tab === "botin" && (
                  <>
                    <div className="umi-sheet-card">
                      <small>Botin previsto</small>
                      <div className="umi-sheet-route">
                        <div className="umi-sheet-route-art">
                          <img src={rewardVisual.art} alt="" />
                        </div>
                        <div>
                          <strong style={{ color: statusKey === "ready" ? UI.gold : rarity.color }}>{rewardVisual.label}</strong>
                          <p>{rewardVisual.sublabel}</p>
                        </div>
                      </div>
                    </div>
                    <div className="umi-modal-grid">
                      <div className="umi-spotlight-metric">
                        <small>XP</small>
                        <strong style={{ color: UI.gold }}>{mission.xpRecompensa}</strong>
                      </div>
                      <div className="umi-spotlight-metric">
                        <small>Gemas</small>
                        <strong style={{ color: "#c08aff" }}>{gems}</strong>
                      </div>
                    </div>
                  </>
                )}

                {tab === "ruta" && (
                  <>
                    <div className="umi-sheet-hero" style={{ "--sheet-image": "url('/missions/sheet/sheet-route-header.png')" }}>
                      <small style={{ color: UI.mutedDeep }}>Ruta vinculada</small>
                      <strong style={{ fontFamily: "'Manrope',sans-serif", fontSize: 18 }}>{route.label}</strong>
                    </div>
                    <div className="umi-sheet-card">
                      <small>Riesgo del territorio</small>
                      <strong style={{ color: riskMeta.color }}>{riskMeta.label}</strong>
                      <p>{riskMeta.detail}</p>
                    </div>
                    <div className="umi-sheet-card">
                      <small>Ruta ligada</small>
                      <div className="umi-sheet-route">
                        <div className="umi-sheet-route-art">
                          <img src={routeVisual.crest} alt="" />
                        </div>
                        <div>
                          <strong style={{ color: UI.success }}>{route.label}</strong>
                          <p>{routeVisual.label}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {statusKey === "ready" ? (
                <button className="umi-btn" onClick={() => onClaim(mission)} disabled={claiming === mission.id}>
                  {claiming === mission.id ? "Reclamando..." : "Reclamar recompensa"}
                </button>
              ) : (
                <button className="umi-btn-ghost" onClick={onClose}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="umi-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="umi-modal" style={{ "--class-accent": status.color }}>
        <div className="umi-modal-head">
          <div className="umi-kicker">
            <img src={typeMeta.icon} alt="" />
            <span>Hoja de contrato</span>
          </div>
          <button className="umi-btn-ghost" onClick={onClose} aria-label="Cerrar detalle">
            <X size={14} />
          </button>
        </div>

        <div className="umi-modal-body">
          <h3>{mission.titulo}</h3>
          <p>{mission.descripcion}</p>
          <div className="umi-spotlight-chip-row">
            <span className="umi-spotlight-chip" style={{ color: status.color, borderColor: `${status.color}55` }}>
              <Shield size={13} />
              {status.label}
            </span>
            <span className="umi-spotlight-chip">
              <img src={zoneMeta.icon} alt="" />
              {zoneMeta.label}
            </span>
            <span className="umi-spotlight-chip" style={{ color: rarity.color, borderColor: `${rarity.color}55` }}>
              <img src={rarity.asset} alt="" />
              {rarity.label}
            </span>
          </div>
          <MiniBar val={progressPct} max={100} color={status.color} height={8} />
          <div className="umi-modal-grid">
            <div className="umi-spotlight-metric">
              <small>Progreso</small>
              <strong style={{ color: status.color }}>{mission.progreso}/{mission.total}</strong>
            </div>
            <div className="umi-spotlight-metric">
              <small>XP</small>
              <strong style={{ color: UI.gold }}>{mission.xpRecompensa}</strong>
            </div>
          </div>
          {getMissionStatusKey(mission, serverOffset) === "ready" ? (
            <button className="umi-btn" onClick={() => onClaim(mission)} disabled={claiming === mission.id}>
              {claiming === mission.id ? "Reclamando..." : "Reclamar recompensa"}
            </button>
          ) : (
            <button className="umi-btn-ghost" onClick={onClose}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MissionQuestRow({ mission, isSelected, onSelect, onClaim, claiming, serverOffset, classTheme }) {
  const typeMeta = getMissionTypeMeta(mission.tipo);
  const zoneMeta = getMissionZone(mission);
  const statusMeta = MISSION_STATUS_META[getMissionStatusKey(mission, serverOffset)];
  const isClaimable = getMissionStatusKey(mission, serverOffset) === "ready";
  const isDone = getMissionStatusKey(mission, serverOffset) === "claimed";
  const isClaiming = claiming === mission.id;
  const pct = Math.min((mission.progreso / Math.max(mission.total || 1, 1)) * 100, 100);

  const accentColor = statusMeta?.color || classTheme.accent;

  return (
    <motion.button
      type="button"
      className={`umi-cr${isSelected ? " is-selected" : ""}${isDone ? " is-done" : ""}${isClaimable ? " is-ready" : ""}`}
      style={{ "--cr-color": accentColor }}
      onClick={onSelect}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
    >
      <span className="umi-cr-accentbar" />

      <span className="umi-cr-icon">
        <img src={typeMeta.seal || typeMeta.icon} alt="" />
      </span>

      <span className="umi-cr-body">
        <span className="umi-cr-title">{mission.titulo}</span>
        <span className="umi-cr-sub">
          <span>{typeMeta.label}</span>
          <span className="umi-cr-sub-dot">·</span>
          <span>{zoneMeta.label}</span>
          {!isDone && (
            <>
              <span className="umi-cr-sub-dot">·</span>
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
        {!isDone && (
          <span className="umi-cr-countdown">{getMissionCountdownLabel(mission, serverOffset)}</span>
        )}
      </span>
    </motion.button>
  );
}

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

  const previousMissionsRef   = useRef([]);
  const resetCheckRef         = useRef({ diaria: secsUntilMidnight(), semanal: secsUntilMonday() });
  const lastAutoRefreshRef    = useRef(0); // timestamp del último auto-refresh por evento externo

  const classKey = String(profile?.heroClass || "DEFAULT").toUpperCase();
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const heroCopy = MISSION_CLASS_COPY[classKey] || MISSION_CLASS_COPY.DEFAULT;
  const classStrategy = MISSION_CLASS_STRATEGY[classKey] || MISSION_CLASS_STRATEGY.DEFAULT;
  const stageTheme = MISSION_STAGE_THEME[classKey] || MISSION_STAGE_THEME.DEFAULT;

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
          setUpdateToast({
            count: progressed.length,
            names: progressed.map((mission) => mission.titulo),
          });
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
      setError("No se pudieron cargar las misiones. Revisa tu conexion e intenta otra vez.");
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
      // Evitar lecturas simultáneas: mínimo 10 s entre auto-refreshes por eventos externos
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
        item.id === mission.id
          ? { ...item, reclamada: true, estado: "completada" }
          : item
      )));
      setClaimFlash({ mission, result });
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
        setMissions((current) => current.map((item) => (
          item.id === mission.id ? { ...item, reclamada: true } : item
        )));
        setError("Este contrato ya fue reclamado.");
      } else if (message.includes("completad")) {
        setError("El contrato aun no esta cerrado.");
      } else {
        setError("No se pudo reclamar el contrato. Intenta otra vez.");
      }
      setTimeout(() => setError(null), 3000);
    } finally {
      setClaiming(null);
    }
  }, [claiming]);

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
      case "listas":
        return base.filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready");
      case "progreso":
        return base.filter((mission) => getMissionStatusKey(mission, serverOffset) === "active");
      case "reclamadas":
        return base.filter((mission) => getMissionStatusKey(mission, serverOffset) === "claimed");
      default:
        return base;
    }
  }, [activeInTab, allForTab, filterEstado, serverOffset, showExpired]);

  const dailyStreak = computeDailyStreak(claimedDays);
  const todayKey = todayISODate(serverOffset);
  const heroPeriod = getHeroPeriod(serverOffset);

  const recommendationContext = useMemo(() => ({
    classKey,
    classLabel: classTheme.label,
    strategy: classStrategy,
    recentEntries: missionMemory.recent.slice(-4).reverse(),
    lastClosed: missionMemory.lastClosed,
    serverOffset,
    claimedToday: claimedDays.includes(todayKey),
    dailyStreak,
  }), [claimedDays, classKey, classStrategy, classTheme.label, dailyStreak, missionMemory, serverOffset, todayKey]);

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
  }, [missions]);

  const totalReady = useMemo(
    () => missions.filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready").length,
    [missions, serverOffset],
  );
  const totalActive = useMemo(
    () => missions.filter((mission) => getMissionStatusKey(mission, serverOffset) === "active").length,
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

  const dailyMissions = useMemo(
    () => missions.filter((mission) => normalizeMissionType(mission.tipo) === "Diaria" && !isExpiredMission(mission, serverOffset)),
    [missions, serverOffset],
  );
  const weeklyMissions = useMemo(
    () => missions.filter((mission) => normalizeMissionType(mission.tipo) === "Semanal" && !isExpiredMission(mission, serverOffset)),
    [missions, serverOffset],
  );
  const dailyDone = dailyMissions.filter((mission) => mission.estado === "completada" || mission.reclamada).length;
  const weeklyDone = weeklyMissions.filter((mission) => mission.estado === "completada" || mission.reclamada).length;

  const dailyProgressPct = dailyMissions.length ? Math.round((dailyDone / dailyMissions.length) * 100) : 0;
  const weeklyProgressPct = weeklyMissions.length ? Math.round((weeklyDone / weeklyMissions.length) * 100) : 0;
  const activeProgressPct = activeInTab.length
    ? Math.round((activeInTab.filter((mission) => mission.reclamada || mission.estado === "completada").length / activeInTab.length) * 100)
    : 0;

  const weekDays = getWeekDays(serverOffset);

  const contextMessage = loading
    ? "El gremio esta alineando el tablon."
    : totalReady > 0
      ? `${totalReady} recompensas esperan reclamo ahora mismo.`
      : heroPeriod === "noche"
        ? "Buen momento para cerrar lo pendiente antes del reinicio."
        : heroPeriod === "madrugada"
          ? "La mesa todavia esta calma. Buen momento para adelantar encargos."
          : heroPeriod === "tarde"
            ? `${totalActive} contratos siguen vivos para la tarde.`
            : `${missions.filter((mission) => getMissionStatusKey(mission, serverOffset) !== "claimed").length} contratos siguen abiertos hoy.`;

  const featuredMission = selectedMission && allForTab.some((mission) => mission.id === selectedMission.id)
    ? selectedMission
    : (recommendedMission || ordered[0] || allForTab[0] || null);

  const featuredTypeMeta = getMissionTypeMeta(featuredMission?.tipo || tab);
  const featuredZone = getMissionZone(featuredMission);
  const featuredRarity = getMissionRarity(featuredMission?.xpRecompensa || 0);
  const featuredStatusKey = getMissionStatusKey(featuredMission, serverOffset);
  const featuredStatus = MISSION_STATUS_META[featuredStatusKey] || MISSION_STATUS_META.active;
  const featuredRoute = getMissionRoute(featuredMission);
  const featuredRewardVisual = getMissionRewardVisual(featuredMission, featuredStatusKey);
  const featuredRisk = getMissionRiskMeta(featuredMission, featuredRarity, featuredStatusKey);
  const featuredRouteVisual = getMissionRouteVisual(featuredRoute);
  const featuredProgressPct = featuredMission
    ? Math.min((featuredMission.progreso / Math.max(featuredMission.total || 1, 1)) * 100, 100)
    : 0;

  const dayMission = useMemo(
    () => recommendedMission || ordered[0] || allForTab[0] || null,
    [allForTab, ordered, recommendedMission],
  );
  const dayMissionMeta = getMissionTypeMeta(dayMission?.tipo || tab);
  const dayMissionZone = getMissionZone(dayMission);
  const dayMissionStatusKey = getMissionStatusKey(dayMission, serverOffset);
  const dayMissionStatus = MISSION_STATUS_META[dayMissionStatusKey] || MISSION_STATUS_META.active;
  const dayMissionProgress = dayMission ? Math.min((dayMission.progreso / Math.max(dayMission.total || 1, 1)) * 100, 100) : 0;
  const dayMissionRecommendation = getMissionRecommendationData(dayMission, recommendationContext);
  const recommendationSummary = dayMissionRecommendation.reasons.length
    ? dayMissionRecommendation.reasons.join(" · ")
    : "lectura estable del tablon para mover progreso sin repetir el mismo rumbo.";
  const dayMissionReward = getMissionRewardVisual(dayMission, dayMissionStatusKey);
  const dayMissionState = getMissionBandStateVisual(dayMissionStatusKey);
  const dayMissionRouteVisual = getMissionRouteVisual(getMissionRoute(dayMission));
  const weekSeries = buildMissionWeekSeries(weekDays, claimedDays, todayKey);
  const weeklyClaimCount = weekSeries.filter((point) => point.claimed).length;
  const journalProgressValue = activeInTab.length ? `${activeInTab.filter((mission) => mission.reclamada || mission.estado === "completada").length}/${activeInTab.length}` : "0/0";

  const boardGroups = useMemo(() => ({
    ready: ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "ready"),
    active: ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "active"),
    claimed: ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "claimed"),
    expired: showExpired ? ordered.filter((mission) => getMissionStatusKey(mission, serverOffset) === "expired") : [],
  }), [ordered, serverOffset, showExpired]);

  const visibleCount = boardGroups.ready.length + boardGroups.active.length + boardGroups.claimed.length + boardGroups.expired.length;
  const boardStateMeta = getMissionBoardStateMeta({
    loading,
    error,
    tab,
    filterEstado,
    showExpired,
    hasAnyInTab: allForTab.length > 0,
    visibleCount,
  });
  const syncLabel = formatSyncLabel(lastSyncAt);

  return (
    <>
      <style>{PAGE_CSS}</style>

      {claimFlash && (
        <ClaimModal
          mission={claimFlash.mission}
          claimResult={claimFlash.result}
          onClose={() => setClaimFlash(null)}
        />
      )}

      {detailOpen && (
        <DetailModal
          mission={detailOpen}
          serverOffset={serverOffset}
          onClose={() => setDetailOpen(null)}
          onClaim={handleClaim}
          claiming={claiming}
        />
      )}

      {xpNotif && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            zIndex: 550,
            pointerEvents: "none",
            color: UI.gold,
            fontFamily: "'Manrope',sans-serif",
            fontSize: 34,
            fontWeight: 900,
            textShadow: `0 0 40px ${UI.gold},0 0 80px ${UI.gold}44`,
            animation: "umi-xpPop 2.4s ease forwards",
            whiteSpace: "nowrap",
          }}
        >
          +{xpNotif} XP
        </div>
      )}

      {logroNotif && (
        <div className="umi-toast bottom" style={{ borderColor: `${UI.gold}55` }}>
          <strong style={{ color: UI.gold }}>{logroNotif.icon || "🏅"} Logro desbloqueado</strong>
          <p>{logroNotif.nombre || logroNotif.titulo || logroNotif.name || "Nuevo logro conseguido"}</p>
        </div>
      )}

      {newDoneToast && (
        <div className="umi-toast bottom" style={{ borderColor: `${classTheme.accent}55` }}>
          <strong style={{ color: classTheme.accent }}>Quest sellada</strong>
          <p>{newDoneToast.titulo} ya quedo lista para reclamar.</p>
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
              {updateToast.count} avance{updateToast.count === 1 ? "" : "s"} nuevo{updateToast.count === 1 ? "" : "s"}
            </strong>
            <p>{updateToast.names.slice(0, 2).join(" · ")}{updateToast.names.length > 2 ? ` +${updateToast.names.length - 2}` : ""}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="umi-page" style={{ "--class-accent": classTheme.accent, "--class-secondary": classTheme.secondary }}>
        <UMBackground color={classTheme.accent} />

        <div className="umi-shell">
          <section className="umi-panel umi-hero">
            <div className="umi-hero-copy">
              <div className="umi-kicker">
                <img src="/ui/header/section-misiones.png" alt="" />
                <span>Tablon del gremio</span>
              </div>

              <h1>{heroCopy.title} <span>{heroCopy.span}</span></h1>
              <p>{heroCopy.lead}</p>

              <div className="umi-chip-row">
                <span className="umi-chip is-focus">
                  <img src={classTheme.crest} alt="" />
                  Clase {classTheme.label}
                </span>
                <span className="umi-chip">
                  <img src={getMissionTypeMeta(tab).icon} alt="" />
                  {getMissionTypeMeta(tab).label}
                </span>
                <span className="umi-chip">
                  <Flame size={14} color={UI.gold} />
                  Racha diaria: {dailyStreak} dias
                </span>
              </div>

              <div className="umi-actions">
                <button
                  className="umi-btn"
                  onClick={() => {
                    if (featuredMission && getMissionStatusKey(featuredMission, serverOffset) === "ready") handleClaim(featuredMission);
                    else if (featuredMission) setDetailOpen(featuredMission);
                  }}
                  disabled={!featuredMission || claiming === featuredMission?.id}
                >
                  <Target size={16} />
                  {featuredMission && getMissionStatusKey(featuredMission, serverOffset) === "ready"
                    ? claiming === featuredMission?.id ? "Reclamando botin..." : "Reclamar botin"
                    : "Abrir contrato principal"}
                </button>

                <button className="umi-btn-ghost" onClick={() => onNavigate?.(featuredRoute.id)} disabled={!featuredMission}>
                  <ChevronRight size={16} />
                  {featuredRoute.label}
                </button>
              </div>

              <div className="umi-stat-grid">
                <div className="umi-stat-card">
                  <small>Listas</small>
                  <strong style={{ color: UI.gold }}>{totalReady}</strong>
                </div>
                <div className="umi-stat-card">
                  <small>Activas</small>
                  <strong style={{ color: classTheme.accent }}>{totalActive}</strong>
                </div>
                <div className="umi-stat-card">
                  <small>XP lista</small>
                  <strong style={{ color: UI.cyan }}>{xpReady}</strong>
                </div>
                <div className="umi-stat-card">
                  <small>Bitacora</small>
                  <strong style={{ color: UI.success }}>{totalClaimed}</strong>
                </div>
              </div>
            </div>

            <div className="umi-stage" style={{ "--stage-image": `url(${stageTheme.image})` }}>
              <video src="/videos/quest-map.mp4" autoPlay muted loop playsInline />
              <div className="umi-stage-layer" />
            </div>
          </section>

          <section className="umi-panel umi-band" style={{ "--band-color": dayMissionStatus.color }}>
            <div className="umi-band-art">
              <img src={dayMissionState.art} alt="" />
            </div>

            <div className="umi-band-copy">
              <div className="umi-kicker">
                <img src="/ui/icons/zone-flag.png" alt="" />
                <span>Hoy el mapa recomienda</span>
              </div>
              <h2>{dayMission?.titulo || "El gremio esta preparando el siguiente encargo"}</h2>
              <p>{dayMission ? `${dayMissionMeta.summary} ${contextMessage}` : contextMessage}</p>
              {dayMission && (
                <div className="umi-band-route">
                  <div className="umi-band-node">
                    <div className="umi-band-node-art">
                      <img src={dayMissionState.art} alt="" />
                    </div>
                    <div className="umi-band-node-copy">
                      <small>Estado del dia</small>
                      <strong style={{ color: dayMissionStatus.color }}>{dayMissionState.label}</strong>
                      <p>{dayMissionState.detail}</p>
                    </div>
                  </div>
                  <div className="umi-band-node">
                    <div className="umi-band-node-art">
                      <img src={dayMissionReward.art} alt="" />
                    </div>
                    <div className="umi-band-node-copy">
                      <small>Botin previsto</small>
                      <strong style={{ color: UI.gold }}>{dayMissionReward.label}</strong>
                      <p>+{dayMission?.xpRecompensa || 0} XP y {Math.max(1, Math.floor((dayMission?.xpRecompensa || 0) / 8))} gemas.</p>
                    </div>
                  </div>
                  <div className="umi-band-node">
                    <div className="umi-band-node-art">
                      <img src={dayMissionRouteVisual.icon} alt="" />
                    </div>
                    <div className="umi-band-node-copy">
                      <small>Ruta ligada</small>
                      <strong style={{ color: classTheme.accent }}>{dayMissionRouteVisual.label}</strong>
                      <p>{recommendationSummary}.</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="umi-spotlight-chip-row">
                <span className="umi-spotlight-chip" style={{ color: dayMissionStatus.color, borderColor: `${dayMissionStatus.color}55` }}>
                  <Shield size={13} />
                  {dayMissionStatus.label}
                </span>
                <span className="umi-spotlight-chip">
                  <img src={dayMissionZone.icon} alt="" />
                  {dayMissionZone.label}
                </span>
                <span className="umi-spotlight-chip">
                  <Gift size={13} color={UI.gold} />
                  +{dayMission?.xpRecompensa || 0} XP y {dayMission ? Math.max(1, Math.floor(dayMission.xpRecompensa / 8)) : 0} gemas
                </span>
              </div>
              <MiniBar val={dayMissionProgress} max={100} color={dayMissionStatus.color} height={8} />
            </div>

            <div className="umi-band-side">
              <div className="umi-band-side-card">
                <small>Racha diaria</small>
                <strong style={{ color: UI.gold }}>{dailyStreak} dias</strong>
                <p>{dailyDone}/{Math.max(dailyMissions.length, 1)} contratos diarios cerrados.</p>
              </div>
              <div className="umi-band-side-card">
                <small>Semana viva</small>
                <strong style={{ color: classTheme.accent }}>{weeklyDone}/{Math.max(weeklyMissions.length, 1)}</strong>
                <p>Campanas semanales avanzadas con lectura clara.</p>
              </div>
            </div>
          </section>

          <div className="umi-content">
            <section className="umi-panel umi-board">
              <div className="umi-section-head">
                <div>
                  <div className="umi-kicker">
                    <img src="/ui/header/section-misiones.png" alt="" />
                    <span>Registro de contratos</span>
                  </div>
                  <h2 style={{ marginTop: 10 }}>Board del heroe</h2>
                  <p>{visibleCount} entradas visibles en esta vista. Todo queda seccionado para cobrar, seguir o revisar sin amontonar la lectura.</p>
                </div>

                {!isMobile && (
                  <div className="umi-progress-card" style={{ minWidth: 240 }}>
                    <div className="umi-progress-card-head">
                      <span>Tab activo</span>
                      <strong style={{ color: classTheme.accent }}>{getMissionTypeMeta(tab).label}</strong>
                    </div>
                    <MiniBar val={activeProgressPct} max={100} color={classTheme.accent} height={8} />
                    <p>{boardGroups.ready.length} listas, {boardGroups.active.length} en marcha y {boardGroups.claimed.length} cerradas.</p>
                    <div className="umi-board-status">
                      <span className={`umi-sync-chip${syncing ? " is-live" : ""}`}>
                        <span className="umi-sync-dot" />
                        {syncing ? "Sincronizando" : `Ultima revision: ${syncLabel}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="umi-board-status" style={{ marginBottom: 14 }}>
                <span className={`umi-sync-chip${syncing ? " is-live" : ""}`}>
                  <span className="umi-sync-dot" />
                  {syncing ? "El tablero se esta actualizando" : `Ultima revision: ${syncLabel}`}
                </span>
                {!loading && !error && (
                  <span className="umi-sync-chip">
                    <img src="/ui/header/section-misiones.png" alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                    {visibleCount} contratos visibles
                  </span>
                )}
              </div>

              <div className="umi-controls">
                <div className="umi-tab-row">
                  {TABS.map((typeKey) => {
                    const meta = getMissionTypeMeta(typeKey);
                    const readyCount = missions.filter((mission) => normalizeMissionType(mission.tipo) === typeKey && getMissionStatusKey(mission, serverOffset) === "ready").length;
                    return (
                      <button
                        key={typeKey}
                        className={`umi-tab${tab === typeKey ? " is-active" : ""}`}
                        onClick={() => {
                          setTab(typeKey);
                          setFilterEstado("todas");
                          setShowExpired(false);
                        }}
                      >
                        <div className="umi-tab-icon">
                          <img src={meta.icon} alt="" />
                        </div>
                        <span>{meta.label}</span>
                        {readyCount > 0 && <span className="umi-tab-count">{readyCount}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="umi-filter-row">
                  <div className="umi-filter-stack">
                    {[
                      ["todas", "Todo el tablon"],
                      ["listas", "Listas"],
                      ["progreso", "En marcha"],
                      ["reclamadas", "Reclamadas"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        className={`umi-filter${filterEstado === value ? " is-active" : ""}`}
                        onClick={() => setFilterEstado(value)}
                      >
                        {label}
                      </button>
                    ))}
                    {expiredInTab.length > 0 && (
                      <button
                        className={`umi-filter${showExpired ? " is-active" : ""}`}
                        onClick={() => setShowExpired((current) => !current)}
                      >
                        {showExpired ? "Ocultar caducadas" : `Ver caducadas (${expiredInTab.length})`}
                      </button>
                    )}
                  </div>

                  <select className="umi-sort" value={sortMode} onChange={(event) => handleSortChange(event.target.value)}>
                    <option value="auto">Orden inteligente</option>
                    <option value="claimable">Primero listas</option>
                    <option value="expiring">Mas urgentes</option>
                    <option value="xp">Mas XP</option>
                    <option value="lessCompleted">Menos avanzadas</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="umi-state-panel" style={{ "--state-color": boardStateMeta?.color || classTheme.accent }}>
                  <div className="umi-state-art">
                    <img src={boardStateMeta?.art || "/missions/states/state-syncing-board.png"} alt="" />
                  </div>
                  <div className="umi-state-copy">
                    <small>{boardStateMeta?.kicker || "Tablero sincronizando"}</small>
                    <strong>{boardStateMeta?.title || "El gremio esta alineando contratos"}</strong>
                    <p>{boardStateMeta?.detail || "La mesa esta levantando progreso, botin y prioridad del dia."}</p>
                    <div className="umi-loading-list">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="umi-loading-card" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {error || visibleCount === 0 ? (
                    <div className="umi-state-panel" style={{ "--state-color": boardStateMeta?.color || classTheme.accent }}>
                      <div className="umi-state-art">
                        <img src={boardStateMeta?.art || "/missions/states/state-empty-missions.png"} alt="" />
                      </div>
                      <div className="umi-state-copy">
                        <small>{boardStateMeta?.kicker || "Mesa vacia"}</small>
                        <strong>{boardStateMeta?.title || "No hay contratos para mostrar"}</strong>
                        <p>{boardStateMeta?.detail || "Ajusta la vista o espera la siguiente actualizacion del gremio."}</p>
                      </div>
                    </div>
                  ) : null}

                  {!error && boardGroups.ready.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": UI.gold }}>
                        <span />
                        <strong>Listas para reclamar</strong>
                        <small>{boardGroups.ready.length}</small>
                      </div>
                      {boardGroups.ready.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => setSelectedMission(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classTheme={classTheme}
                        />
                      ))}
                    </div>
                  )}

                  {!error && boardGroups.active.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": classTheme.accent }}>
                        <span />
                        <strong>Campanas en marcha</strong>
                        <small>{boardGroups.active.length}</small>
                      </div>
                      {boardGroups.active.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => setSelectedMission(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classTheme={classTheme}
                        />
                      ))}
                    </div>
                  )}

                  {!error && boardGroups.claimed.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": UI.cyan }}>
                        <span />
                        <strong>Bitacora cerrada</strong>
                        <small>{boardGroups.claimed.length}</small>
                      </div>
                      {boardGroups.claimed.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => setSelectedMission(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classTheme={classTheme}
                        />
                      ))}
                    </div>
                  )}

                  {!error && boardGroups.expired.length > 0 && (
                    <div className="umi-group">
                      <div className="umi-group-head" style={{ "--group-color": UI.danger }}>
                        <span />
                        <strong>Caducadas</strong>
                        <small>{boardGroups.expired.length}</small>
                      </div>
                      {boardGroups.expired.map((mission) => (
                        <MissionQuestRow
                          key={mission.id}
                          mission={mission}
                          isSelected={featuredMission?.id === mission.id}
                          onSelect={() => setSelectedMission(mission)}
                          onClaim={handleClaim}
                          claiming={claiming}
                          serverOffset={serverOffset}
                          classTheme={classTheme}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>

            <aside className="umi-panel umi-spotlight">
              {featuredMission ? (
                <div className="umi-spotlight-stack">
                  <div
                    className="umi-spotlight-banner"
                    style={{
                      "--spotlight-image": `url(${featuredTypeMeta.banner})`,
                      "--spotlight-color": featuredStatus.color,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div className="umi-kicker">
                        <img src={featuredTypeMeta.icon} alt="" />
                        <span>{featuredTypeMeta.route}</span>
                      </div>
                      <div className="umi-spotlight-crest">
                        <img src={featuredRarity.asset} alt={featuredRarity.label} />
                      </div>
                    </div>

                    <div className="umi-spotlight-copy">
                      <h2>{featuredMission.titulo}</h2>
                      <p>{featuredMission.descripcion}</p>
                    </div>
                  </div>

                  <div className="umi-spotlight-chip-row">
                    <span className="umi-spotlight-chip" style={{ color: featuredStatus.color, borderColor: `${featuredStatus.color}55` }}>
                      <Shield size={13} />
                      {featuredStatus.label}
                    </span>
                    <span className="umi-spotlight-chip">
                      <img src={featuredZone.icon} alt="" />
                      {featuredZone.label}
                    </span>
                    <span className="umi-spotlight-chip" style={{ color: featuredRarity.color, borderColor: `${featuredRarity.color}55` }}>
                      <img src={featuredRarity.asset} alt={featuredRarity.label} />
                      {featuredRarity.label}
                    </span>
                  </div>

                  <div className="umi-progress-card">
                    <div className="umi-progress-card-head">
                      <span>Progreso visible</span>
                      <strong style={{ color: featuredStatus.color }}>{featuredMission.progreso}/{featuredMission.total}</strong>
                    </div>
                    <MiniBar val={featuredProgressPct} max={100} color={featuredStatus.color} height={9} />
                    <p>{getMissionCountdownLabel(featuredMission, serverOffset)}</p>
                  </div>

                  <div className="umi-contract-grid">
                    <div className="umi-contract-card">
                      <small>Objetivo del contrato</small>
                      <strong>{featuredTypeMeta.summary}</strong>
                      <p>{featuredMission.descripcion}</p>
                    </div>

                    <div className="umi-contract-card">
                      <small>Botin previsto</small>
                      <div className="umi-contract-loot">
                        <div className="umi-contract-loot-thumb">
                          <img src={featuredRewardVisual.art} alt="" />
                        </div>
                        <div className="umi-contract-route-copy">
                          <strong style={{ color: featuredStatusKey === "ready" ? UI.gold : featuredRarity.color }}>
                            {featuredRewardVisual.label}
                          </strong>
                          <p>{featuredRewardVisual.sublabel}</p>
                          <div className="umi-contract-value">
                            <span className="umi-reward-badge" style={{ color: UI.gold }}>
                              <strong>+{featuredMission.xpRecompensa}</strong> XP
                            </span>
                            <span className="umi-reward-badge" style={{ color: "#c08aff" }}>
                              <strong>{Math.max(1, Math.floor(featuredMission.xpRecompensa / 8))}</strong> Gemas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="umi-contract-row">
                      <div className="umi-contract-card">
                        <small>Zona y riesgo</small>
                        <strong style={{ color: featuredRisk.color }}>{featuredRisk.label}</strong>
                        <p>{featuredRisk.detail}</p>
                        <div className="umi-spotlight-chip-row">
                          <span className="umi-spotlight-chip">
                            <img src={featuredZone.icon} alt="" />
                            {featuredZone.label}
                          </span>
                          <span className="umi-spotlight-chip" style={{ color: featuredRarity.color, borderColor: `${featuredRarity.color}55` }}>
                            <img src={featuredRarity.asset} alt={featuredRarity.label} />
                            {featuredRarity.label}
                          </span>
                        </div>
                      </div>

                      <div className="umi-contract-card">
                        <small>Ruta ligada</small>
                        <div className="umi-contract-route">
                          <div className="umi-contract-route-crest">
                            <img src={featuredRouteVisual.crest} alt="" />
                          </div>
                          <div className="umi-contract-route-copy">
                            <strong>{featuredRoute.label}</strong>
                            <p>{featuredRouteVisual.label}</p>
                            <span className="umi-spotlight-chip">
                              <img src={featuredRouteVisual.icon} alt="" />
                              abrir territorio
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="umi-contract-card umi-contract-card--wide">
                      <small>Lectura del gremio</small>
                      <strong>{heroCopy.focus}</strong>
                      <p>{heroCopy.rally}</p>
                    </div>
                  </div>

                  <div className="umi-actions">
                    {featuredStatusKey === "ready" ? (
                      <button className="umi-btn" onClick={() => handleClaim(featuredMission)} disabled={claiming === featuredMission.id}>
                        <Gift size={16} />
                        {claiming === featuredMission.id ? "Reclamando..." : "Reclamar recompensa"}
                      </button>
                    ) : (
                      <button className="umi-btn" onClick={() => onNavigate?.(featuredRoute.id)}>
                        <ChevronRight size={16} />
                        {featuredRoute.label}
                      </button>
                    )}

                    <button
                      className="umi-btn-ghost"
                      onClick={() => {
                        if (isMobile) setDetailOpen(featuredMission);
                        else onNavigate?.(featuredRoute.id);
                      }}
                    >
                      {isMobile ? "Ver ficha completa" : "Abrir ruta ligada"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="umi-empty">
                  <img src="/ui/header/notifications/notif-empty.png" alt="" />
                  <strong>Selecciona un contrato del tablon</strong>
                  <p>La ficha lateral se llena sola con territorio, botin y estado real del objetivo.</p>
                </div>
              )}
            </aside>
          </div>

          {!loading && (
            <section className="umi-panel umi-journal">
              <div className="umi-section-head" style={{ marginBottom: 0 }}>
                <div>
                  <div className="umi-kicker">
                    <Sparkles size={14} />
                    <span>Bitacora corta</span>
                  </div>
                  <h2 style={{ marginTop: 10 }}>Ritmo del heroe</h2>
                  <p>La bitacora ya no cae como bloque tecnico: separa consistencia, botin y avance real del contrato activo.</p>
                </div>
              </div>

              <div className="umi-journal-layout" style={{ marginTop: 16 }}>
                <div className="umi-journal-stack">
                  <div className="umi-journal-row">
                    <div className="umi-journal-card umi-journal-tipwrap" style={{ "--card-bg": "url('/missions/spotlight/spotlight-daily-banner.png')", "--card-neon": "#f3c969" }}>
                      <div className="umi-journal-head">
                        <img src="/ui/icons/weather-sun.png" alt="" />
                        <small>Consistencia</small>
                      </div>
                      <div className="umi-journal-value">
                        <strong style={{ color: UI.gold }}>{dailyStreak} dias</strong>
                        <span>{weeklyClaimCount}/7 sellos esta semana</span>
                      </div>
                      <p>La racha y los sellos semanales muestran si estas sosteniendo el tablero sin huecos.</p>
                      <div className="umi-journal-tip">
                        <strong>Lectura de consistencia</strong>
                        <p>Cuenta racha diaria y cuantos dias de esta semana ya cerraste con reclamo real.</p>
                      </div>
                    </div>

                    <div className="umi-journal-card umi-journal-tipwrap" style={{ "--card-bg": "url('/missions/spotlight/spotlight-event-banner.png')", "--card-neon": "#4ade80" }}>
                      <div className="umi-journal-head">
                        <img src={dayMissionReward.art} alt="" />
                        <small>Botin y reserva</small>
                      </div>
                      <div className="umi-journal-value">
                        <strong style={{ color: UI.gold }}>{xpReady} XP</strong>
                        <span>{totalReady} recompensas listas</span>
                      </div>
                      <p>Lo pendiente por cobrar te dice cuanto progreso ya esta ganado, aunque aun no lo hayas sellado.</p>
                      <div className="umi-journal-tip">
                        <strong>Reserva del gremio</strong>
                        <p>XP lista para reclamar mas contratos cerrados que todavia esperan cobro.</p>
                      </div>
                    </div>
                  </div>

                  <div className="umi-journal-row">
                    <div className="umi-journal-card umi-journal-tipwrap" style={{ "--card-bg": "url('/missions/spotlight/spotlight-challenge-banner.png')", "--card-neon": "#38bdf8" }}>
                      <div className="umi-journal-head">
                        <img src="/exercises/summary/sum-xp.png" alt="" />
                        <small>Avance real</small>
                      </div>
                      <div className="umi-journal-value">
                        <strong style={{ color: classTheme.accent }}>{journalProgressValue}</strong>
                        <span>progreso del tab activo</span>
                      </div>
                      <p>{boardGroups.active.length} en marcha, {boardGroups.claimed.length} ya archivadas y lectura viva del territorio {featuredZone.label.toLowerCase()}.</p>
                      <div className="umi-journal-tip">
                        <strong>Avance del territorio</strong>
                        <p>Compara lo que ya cerraste contra lo que sigue abierto en el tab actual.</p>
                      </div>
                    </div>

                    <div className="umi-journal-card umi-journal-tipwrap" style={{ "--card-bg": "url('/missions/spotlight/spotlight-mind-banner.png')", "--card-neon": "#c084fc" }}>
                      <div className="umi-journal-head">
                        <img src={featuredRouteVisual.icon} alt="" />
                        <small>Rumbo del heroe</small>
                      </div>
                      <div className="umi-journal-value">
                        <strong style={{ color: UI.cyan }}>{featuredZone.label}</strong>
                        <span>{featuredRoute.label}</span>
                      </div>
                      <p>{heroCopy.focus}. El mapa sigue empujando esta zona porque conversa mejor con tu clase y tu ritmo reciente.</p>
                      <div className="umi-journal-tip">
                        <strong>Lectura del rumbo</strong>
                        <p>Resume la zona que domina hoy y a que ruta te conviene saltar despues.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="umi-journal-chart-card">
                  <div className="umi-journal-head">
                    <img src="/missions/journal/journal-seal-claimed.png" alt="" />
                    <small>Bitacora semanal</small>
                  </div>
                  <div className="umi-journal-value">
                    <strong style={{ color: classTheme.accent }}>{weeklyClaimCount}/7</strong>
                    <span>dias con sello real</span>
                  </div>
                  <p>El trazo sube cuando reclamas una diaria. El punto actual te deja leer si la semana sigue viva o se esta enfriando.</p>
                  <MissionJournalChart points={weekSeries} color={classTheme.accent} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
