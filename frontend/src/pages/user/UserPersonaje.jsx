import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../../hooks/useLang.js";
import { auth } from "../../firebase.js";
import { getUserStats } from "../../services/api.js";
import SkillTree from "../../components/shared/SkillTree.jsx";
import { USER_CLASS_THEME as CLASS_THEME } from "./userClassTheme.js";
import { getFrameCount, getFramePath, getFps, getSkinPreview } from "../../avatar/SpriteMap.js";
import { AVATARS_CATALOG, FRAMES_CATALOG, getAvatarImage } from "../../avatar/AvatarCatalog.js";

export const STAGES = [
  {
    id: 1,
    min: 1,
    max: 4,
    label: "Primer impulso",
    desc: "La base se esta forjando. Lo importante aqui es sostener constancia y tecnica.",
    focus: "Rutina ligera, tecnica limpia y ritmo estable.",
    bonus: "Pulso de inicio y señal basica del mapa.",
    body: "Activa coordinacion, respiracion y tolerancia al esfuerzo.",
    unlocks: "Abre habilidades base, primeras rutas y seguimiento inicial.",
  },
  {
    id: 2,
    min: 5,
    max: 9,
    label: "Forma creciente",
    desc: "Ya se nota avance fisico. Tu tablero empieza a responder a cada sesion.",
    focus: "Mas volumen semanal y mejor control del esfuerzo.",
    bonus: "Mejor ritmo de XP y rutas mas consistentes.",
    body: "Mejora resistencia de trabajo y control del pulso.",
    unlocks: "Abre nodos intermedios y misiones con mas carga.",
  },
  {
    id: 3,
    min: 10,
    max: 19,
    label: "Presencia marcada",
    desc: "El personaje deja de ser promesa y empieza a sentirse como una build real.",
    focus: "Ritmo sostenido, mejor recuperacion y sesiones completas.",
    bonus: "Mayor estabilidad para cerrar semanas sin cortar la racha.",
    body: "Se nota mas tono, recuperacion y capacidad de repetir esfuerzo.",
    unlocks: "Activa builds mas serias, bosses medios y mejor presencia del personaje.",
  },
  {
    id: 4,
    min: 20,
    max: 29,
    label: "Dominio visible",
    desc: "Tu progreso ya pesa. El mapa te reconoce por constancia y potencia.",
    focus: "Cierres fuertes, misiones largas y control del desgaste.",
    bonus: "Botin mas valioso y progresion mas solida por sesion.",
    body: "Representa potencia, tolerancia alta y control del cansancio.",
    unlocks: "Abre contenido avanzado, rutas largas y presencia rara en el perfil.",
  },
  {
    id: 5,
    min: 30,
    max: 999,
    label: "Leyenda activa",
    desc: "No solo entrenas: sostienes una identidad completa dentro del gremio.",
    focus: "Mantenimiento elite, precision y presencia total.",
    bonus: "Cima activa con brillo alto, loot premium y presencia total.",
    body: "Consolida una forma estable, potente y sostenible.",
    unlocks: "Mantiene abierta toda la capa avanzada del gameplay.",
  },
];

const CLASS_COPY = {
  GUERRERO: {
    title: "Forja fuerza, presencia y dominio sin perder tecnica limpia.",
    lead: "Tu personaje refleja fuerza, constancia y trabajo real. Cada sesion alimenta una build mas pesada y mas estable.",
    flavor: "Fuerza, calistenia y control de carga empujan esta ruta.",
    zone: "Bastion de fuerza",
  },
  ARQUERO: {
    title: "Sostiene ritmo, velocidad y precision como una build afinada.",
    lead: "Tu enfoque favorece cardio, agilidad y sesiones que empujan el pulso sin romper control ni continuidad.",
    flavor: "Cardio, movilidad activa y remates cortos dominan esta clase.",
    zone: "Ruta de precision",
  },
  MAGO: {
    title: "Convierte enfoque, respiracion y tecnica en progreso visible.",
    lead: "Aqui la build premia control corporal, foco y consistencia. La pantalla debe sentirse viva, no ruidosa.",
    flavor: "Flexibilidad, mente y recuperacion marcan esta afinidad.",
    zone: "Camara de foco",
  },
  DEFAULT: {
    title: "Lee tu progreso como una build viva, no como una ficha plana.",
    lead: "Nivel, racha, sesiones y logros quedan ordenados en una portada mas clara y mucho mas protagonista.",
    flavor: "Cada sesion deja marca y abre nuevas piezas del personaje.",
    zone: "Portada del heroe",
  },
};

const CLASS_BADGES = {
  GUERRERO: { label: "Guerrero", icon: "W" },
  ARQUERO: { label: "Arquero", icon: "A" },
  MAGO: { label: "Mago", icon: "M" },
  DEFAULT: { label: "Aventura", icon: "F" },
};

const STAGE_CLASS_ASSET = {
  GUERRERO: "/ui/shop/hero/shop-stage-warrior.png",
  ARQUERO: "/ui/shop/hero/shop-stage-archer.png",
  MAGO: "/ui/shop/hero/shop-stage-mage.png",
  DEFAULT: "/ui/shop/hero/shop-stage-default.png",
};

const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";

const CLASS_SKILL_HINTS = {
  GUERRERO: {
    recommendation: "Prioriza fuerza, control de carga y nodos que sostengan sesiones pesadas.",
    nodes: "Fuerza base, constancia de combate y recuperacion de impacto.",
  },
  ARQUERO: {
    recommendation: "Te conviene abrir nodos de ritmo, precision y control del pulso.",
    nodes: "Velocidad limpia, cardio tactico y movilidad sostenida.",
  },
  MAGO: {
    recommendation: "Invierte primero en foco, tecnica y precision corporal fina.",
    nodes: "Respiracion guiada, precision tecnica y recuperacion mental.",
  },
  DEFAULT: {
    recommendation: "Sube nodos que ayuden a sostener la semana sin romper continuidad.",
    nodes: "Constancia, tecnica base y recuperacion simple.",
  },
};

const SKIN_META = {
  default: { name: "Flex original", rarity: "Comun", origin: "Carga base del gremio", type: "Cosmetico" },
  guerrero: { name: "Forja de guerra", rarity: "Raro", origin: "Skin del guardarropa", type: "Cosmetico" },
  caballero: { name: "Caballero activo", rarity: "Epico", origin: "Skin especial del heroe", type: "Cosmetico" },
};

const JOURNAL_MEDALS = [
  {
    key: "first",
    name: "Primera marca",
    asset: "/logros/medals/medal-first-blood.png",
    state: (ctx) => ({
      done: ctx.sesiones >= 1,
      progress: ctx.sesiones >= 1 ? "Activa" : "1 sesion",
      detail: "Abre tu memoria fisica inicial.",
    }),
  },
  {
    key: "streak",
    name: "Ritmo firme",
    asset: "/logros/medals/medal-streak-master.png",
    state: (ctx) => ({
      done: ctx.streak >= 7,
      progress: `${Math.min(ctx.streak, 7)}/7`,
      detail: "Siete dias para fijar disciplina.",
    }),
  },
  {
    key: "mind",
    name: "Pulso mental",
    asset: "/logros/medals/medal-mind-keeper.png",
    state: (ctx) => ({
      done: ctx.logros >= 3,
      progress: `${Math.min(ctx.logros, 3)}/3`,
      detail: "Logros que sostienen enfoque y consistencia.",
    }),
  },
  {
    key: "social",
    name: "Sello visible",
    asset: "/logros/medals/medal-social-mark.png",
    state: (ctx) => ({
      done: ctx.level >= 12,
      progress: `${Math.min(ctx.level, 12)}/12`,
      detail: "Tu build ya se nota dentro del portal.",
    }),
  },
];

const TAB_STORAGE_KEY = "fv-user-personaje-tab";

const PANEL_CSS = `
  @keyframes up2Drift {
    0% { transform: translate3d(0, 0, 0) scale(.95); opacity: .12; }
    45% { opacity: .48; }
    100% { transform: translate3d(var(--dx), -68px, 0) scale(1.08); opacity: 0; }
  }
  @keyframes up2Float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-7px); }
  }
  @keyframes up2Glow {
    0%, 100% { box-shadow: 0 24px 64px rgba(0,0,0,.42), 0 0 0 color-mix(in srgb, var(--hero-accent), transparent 100%); }
    50% { box-shadow: 0 24px 64px rgba(0,0,0,.46), 0 0 34px color-mix(in srgb, var(--hero-accent), transparent 72%); }
  }
  @keyframes up2Sweep {
    0% { transform: translateX(-120%); opacity: 0; }
    24% { opacity: .38; }
    48% { opacity: 0; }
    100% { transform: translateX(120%); opacity: 0; }
  }
  @keyframes up2Pulse {
    0%, 100% { transform: scale(1); opacity: .38; }
    50% { transform: scale(1.03); opacity: .68; }
  }
  @keyframes up2Ring {
    0% { transform: scale(.82); opacity: .5; }
    100% { transform: scale(1.16); opacity: 0; }
  }

  .up2-page {
    min-height: 100%;
    color: #f7f2ff;
    background:
      radial-gradient(circle at 16% 18%, color-mix(in srgb, var(--hero-accent), transparent 88%), transparent 28%),
      radial-gradient(circle at 84% 20%, color-mix(in srgb, var(--hero-secondary), transparent 88%), transparent 26%),
      linear-gradient(180deg, #090613 0%, color-mix(in srgb, var(--hero-bg), #090613 46%) 52%, #07040f 100%);
    position: relative;
    overflow-x: hidden;
  }
  .up2-page::before {
    content: "";
    position: fixed;
    inset: 56px 0 0 0;
    pointer-events: none;
    background: url("/ui/dashboard-particles.png") center/cover no-repeat;
    opacity: .22;
    mix-blend-mode: screen;
  }
  .up2-page::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: .12;
    mask-image: linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent);
  }
  .up2-shell {
    width: min(100%, 1680px);
    margin: 0 auto;
    padding: clamp(18px, 2.8vw, 36px);
    display: flex;
    flex-direction: column;
    gap: 18px;
    position: relative;
    z-index: 1;
    box-sizing: border-box;
  }
  .up2-panel {
    position: relative;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 76%);
    border-radius: 8px;
    background:
      linear-gradient(180deg, rgba(13, 9, 22, .92), rgba(9, 6, 16, .96)),
      url("/ui/panel-texture.png") center/cover no-repeat;
    box-shadow: 0 20px 54px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.04);
    overflow: hidden;
  }
  .up2-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(135deg, color-mix(in srgb, var(--hero-accent), transparent 94%), transparent 40%, color-mix(in srgb, var(--hero-secondary), transparent 94%));
    opacity: .9;
  }
  .up2-panel > * {
    position: relative;
    z-index: 1;
  }
  .up2-panel-pad {
    padding: 18px;
  }
  .up2-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 68%);
    background: rgba(8, 5, 17, .56);
    color: var(--hero-accent);
    font: 800 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .up2-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
    image-rendering: pixelated;
    flex-shrink: 0;
    filter: drop-shadow(0 6px 10px rgba(0,0,0,.32));
  }
  .up2-icon--sm {
    width: 16px;
    height: 16px;
  }
  .up2-icon--lg {
    width: 28px;
    height: 28px;
  }
  .up2-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.06fr) minmax(360px, .94fr);
    gap: clamp(18px, 3vw, 36px);
    align-items: stretch;
    min-height: clamp(500px, 68vh, 720px);
    padding: clamp(22px, 3vw, 34px);
    background:
      linear-gradient(90deg, rgba(8, 5, 16, .92) 0%, color-mix(in srgb, var(--hero-bg), rgba(12, 7, 21, .84) 58%) 54%, rgba(9, 6, 16, .48) 100%),
      url("/ui/scene-bg.png") center/cover no-repeat;
    animation: up2Glow 4.8s ease-in-out infinite;
  }
  .up2-hero::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 28%;
    background: linear-gradient(180deg, transparent, rgba(7,4,14,.94));
    pointer-events: none;
  }
  .up2-sparks {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }
  .up2-spark {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    background: var(--hero-accent);
    box-shadow: 0 0 18px color-mix(in srgb, var(--hero-accent), transparent 22%);
    animation: up2Drift var(--t) ease-in-out infinite;
    animation-delay: var(--d);
  }
  .up2-copy {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    gap: 20px;
    z-index: 1;
  }
  .up2-title {
    margin: 18px 0 14px;
    font: 900 clamp(36px, 5.2vw, 80px)/.92 "Manrope", sans-serif;
    color: #fff9ef;
    letter-spacing: 0;
    max-width: 14ch;
  }
  .up2-title span {
    color: var(--hero-accent);
    text-shadow: 0 0 34px color-mix(in srgb, var(--hero-accent), transparent 53%);
  }
  .up2-lead {
    max-width: 720px;
    margin: 0;
    color: #cdbfe0;
    font: 500 clamp(14px, 1.2vw, 18px)/1.7 "Manrope", sans-serif;
  }
  .up2-chip-row,
  .up2-action-row,
  .up2-meta-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .up2-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(10, 7, 18, .68);
    color: #efe5ff;
    font: 700 12px/1 "Manrope", sans-serif;
    white-space: nowrap;
  }
  .up2-chip strong {
    color: var(--hero-accent);
    font-weight: 800;
  }
  .up2-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 46px;
    padding: 0 18px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05);
    color: #fff;
    font: 800 13px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
  }
  .up2-btn:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--hero-accent), transparent 52%);
    box-shadow: 0 16px 26px rgba(0,0,0,.26), 0 0 24px color-mix(in srgb, var(--hero-accent), transparent 78%);
  }
  .up2-btn--primary {
    background: linear-gradient(90deg, color-mix(in srgb, var(--hero-accent), transparent 12%), color-mix(in srgb, var(--hero-secondary), transparent 18%));
    color: #fffdf7;
    border-color: color-mix(in srgb, var(--hero-accent), transparent 42%);
  }
  .up2-btn--ghost {
    background: rgba(8,5,17,.48);
  }
  .up2-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .up2-stat-card {
    min-height: 108px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }
  .up2-stat-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .up2-kicker {
    color: #8f85a8;
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .up2-stat-value {
    color: #fff7dc;
    font: 900 clamp(28px, 2vw, 36px)/1 "Manrope", sans-serif;
  }
  .up2-stat-note {
    color: #c7bad9;
    font: 500 12px/1.5 "Manrope", sans-serif;
  }
  .up2-stage-shell {
    position: relative;
    min-height: 100%;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 14px;
    z-index: 1;
  }
  .up2-stage-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .up2-stage-badges {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .up2-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(9, 6, 16, .72);
    color: #f4ecff;
    font: 700 12px/1 "Manrope", sans-serif;
  }
  .up2-stage-card {
    position: relative;
    min-height: 420px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 72%);
    background:
      radial-gradient(circle at 50% 72%, color-mix(in srgb, var(--hero-accent), transparent 76%), transparent 34%),
      linear-gradient(180deg, rgba(12, 8, 21, .94), rgba(8, 6, 15, .96));
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 24px 18px;
  }
  .up2-stage-backdrop {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(8, 5, 17, .16), rgba(8, 5, 17, .82)),
      linear-gradient(90deg, rgba(8, 5, 17, .92) 0%, rgba(8, 5, 17, .28) 50%, rgba(8, 5, 17, .94) 100%);
    background-size: cover;
    background-position: center;
    opacity: .48;
    pointer-events: none;
    mix-blend-mode: screen;
  }
  .up2-stage-forge {
    position: absolute;
    inset: auto 6% 6% 6%;
    height: 36%;
    border-radius: 50%;
    background:
      radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--hero-accent), transparent 62%), transparent 34%),
      radial-gradient(circle at 50% 78%, color-mix(in srgb, var(--hero-secondary), transparent 74%), transparent 54%);
    filter: blur(16px);
    opacity: .65;
    pointer-events: none;
  }
  .up2-stage-pedestal {
    position: absolute;
    left: 50%;
    bottom: 4%;
    width: min(72%, 360px);
    height: 84px;
    transform: translateX(-50%);
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 70%);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--hero-accent), transparent 72%), rgba(7, 5, 14, .84)),
      rgba(7, 5, 14, .72);
    box-shadow: 0 18px 32px rgba(0,0,0,.38), 0 0 22px color-mix(in srgb, var(--hero-accent), transparent 80%);
    pointer-events: none;
  }
  .up2-stage-card::before {
    content: "";
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 72%);
    opacity: .4;
    animation: up2Pulse 4.6s ease-in-out infinite;
  }
  .up2-stage-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 32%, rgba(255,255,255,.05), transparent 24%),
      linear-gradient(135deg, transparent 0%, rgba(255,255,255,.04) 50%, transparent 100%);
    pointer-events: none;
  }
  .up2-stage-frame {
    position: relative;
    width: min(100%, 420px);
    aspect-ratio: 1 / 1.06;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
  }
  .up2-stage-frame:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--hero-accent), white 10%);
    outline-offset: 5px;
  }
  .up2-stage-ring,
  .up2-stage-ring::after,
  .up2-stage-ring::before {
    content: "";
    position: absolute;
    inset: 14%;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 76%);
  }
  .up2-stage-ring::before {
    inset: 6%;
    opacity: .45;
  }
  .up2-stage-ring::after {
    inset: 22%;
    opacity: .2;
  }
  .up2-stage-ring::before {
    background: radial-gradient(circle, transparent 58%, color-mix(in srgb, var(--hero-secondary), transparent 78%) 100%);
  }
  .up2-stage-ripple {
    position: absolute;
    inset: 12%;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--hero-secondary), transparent 62%);
    animation: up2Ring 1.3s ease-out both;
  }
  .up2-character {
    position: relative;
    width: min(78%, 320px);
    aspect-ratio: 1 / 1.08;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: up2Float 3.4s ease-in-out infinite;
  }
  .up2-character::before {
    content: "";
    position: absolute;
    bottom: 4%;
    left: 50%;
    width: 74%;
    height: 18%;
    transform: translateX(-50%);
    background: radial-gradient(circle, color-mix(in srgb, var(--hero-accent), transparent 62%), transparent 72%);
    filter: blur(14px);
  }
  .up2-character img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
    filter:
      drop-shadow(0 24px 34px rgba(0,0,0,.46))
      drop-shadow(0 0 26px color-mix(in srgb, var(--hero-accent), transparent 58%));
  }
  .up2-stage-avatar-badge {
    position: absolute;
    right: 18px;
    bottom: 16px;
    width: 88px;
    height: 88px;
    border-radius: 22px;
    border: 1px solid color-mix(in srgb, var(--hero-secondary), transparent 56%);
    background:
      radial-gradient(circle at 50% 36%, color-mix(in srgb, var(--hero-secondary), transparent 86%), transparent 58%),
      rgba(8, 5, 17, .82);
    box-shadow: 0 14px 28px rgba(0,0,0,.32);
    display: grid;
    place-items: center;
    overflow: hidden;
    z-index: 2;
  }
  .up2-stage-avatar-badge img {
    image-rendering: pixelated;
  }
  .up2-stage-avatar {
    width: 68px;
    height: 68px;
    object-fit: cover;
    border-radius: 18px;
  }
  .up2-stage-avatar-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
  .up2-crest-pin {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 96px;
    height: 96px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 14px 18px rgba(0,0,0,.34));
    opacity: .92;
  }
  .up2-stage-mark {
    position: absolute;
    top: 18px;
    left: 18px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 999px;
    background: rgba(10, 7, 18, .76);
    border: 1px solid rgba(255,255,255,.08);
  }
  .up2-stage-mark span {
    color: #f7f0ff;
    font: 800 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .up2-bubble {
    position: absolute;
    top: 34px;
    left: 50%;
    transform: translateX(-50%);
    max-width: min(86%, 320px);
    padding: 12px 16px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 58%);
    background: rgba(8, 5, 17, .88);
    box-shadow: 0 14px 30px rgba(0,0,0,.32), 0 0 20px color-mix(in srgb, var(--hero-accent), transparent 80%);
    color: #f4ecff;
    font: 600 14px/1.5 "Manrope", sans-serif;
    text-align: center;
    z-index: 3;
  }
  .up2-bubble::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -9px;
    width: 16px;
    height: 16px;
    transform: translateX(-50%) rotate(45deg);
    background: rgba(8, 5, 17, .92);
    border-right: 1px solid color-mix(in srgb, var(--hero-accent), transparent 58%);
    border-bottom: 1px solid color-mix(in srgb, var(--hero-accent), transparent 58%);
  }
  .up2-stage-footer {
    display: grid;
    grid-template-columns: 1.2fr .8fr;
    gap: 12px;
  }
  .up2-strip-card {
    min-height: 110px;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(9, 6, 16, .72);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }
  .up2-strip-card h3,
  .up2-panel-title,
  .up2-stack-title {
    margin: 0;
    color: #fff8e7;
    font: 800 clamp(22px, 2vw, 28px)/1.05 "Manrope", sans-serif;
    letter-spacing: 0;
  }
  .up2-strip-card p,
  .up2-panel-text {
    margin: 0;
    color: #cbbedd;
    font: 500 13px/1.6 "Manrope", sans-serif;
  }
  .up2-progress {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .up2-progress-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: #f6f0ff;
    font: 700 12px/1 "Manrope", sans-serif;
  }
  .up2-meter {
    position: relative;
    height: 16px;
    overflow: hidden;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02)),
      url("/ui/bars/bar-track-tile.png") repeat-x center/auto 100%;
  }
  .up2-meter > span {
    position: absolute;
    inset: 0 auto 0 0;
    width: var(--w);
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--tone), transparent 18%), var(--tone)),
      url("/ui/bars/bar-fill-tile.png") repeat-x center/auto 100%;
    box-shadow: 0 0 16px color-mix(in srgb, var(--tone), transparent 62%);
    border-radius: inherit;
  }
  .up2-meter > span::after {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/bars/bar-shine-tile.png") repeat-x center/auto 100%;
    mix-blend-mode: screen;
    opacity: .38;
    animation: up2Sweep 3.6s ease-in-out infinite;
  }
  .up2-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px;
  }
  .up2-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    color: #a89dbd;
    font: 800 12px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: all .2s ease;
  }
  .up2-tab.is-active {
    color: #fff8e7;
    border-color: color-mix(in srgb, var(--hero-accent), transparent 44%);
    background: linear-gradient(90deg, color-mix(in srgb, var(--hero-accent), transparent 88%), color-mix(in srgb, var(--hero-secondary), transparent 90%));
    box-shadow: 0 0 20px color-mix(in srgb, var(--hero-accent), transparent 84%);
  }
  .up2-tab-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--hero-accent), transparent 20%);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: 800 11px/1 "JetBrains Mono", monospace;
  }
  .up2-band {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .up2-main-grid {
    display: grid;
    grid-template-columns: 1.08fr 1.12fr .9fr;
    gap: 18px;
    align-items: start;
  }
  .up2-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }
  .up2-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .up2-section-head p {
    margin: 6px 0 0;
    color: #bdb2cf;
    font: 500 13px/1.55 "Manrope", sans-serif;
  }
  .up2-journey {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
  }
  .up2-journey::before {
    content: "";
    position: absolute;
    left: 6%;
    right: 6%;
    top: 50%;
    height: 2px;
    transform: translateY(-50%);
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--hero-accent), transparent 44%), color-mix(in srgb, var(--hero-secondary), transparent 48%), transparent);
    opacity: .58;
    pointer-events: none;
  }
  .up2-phase-card {
    position: relative;
    z-index: 1;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    cursor: pointer;
    transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
    min-height: 210px;
    perspective: 720px;
  }
  .up2-phase-card:hover {
    border-color: color-mix(in srgb, var(--tone), transparent 50%);
    box-shadow: 0 0 22px color-mix(in srgb, var(--tone), transparent 84%);
  }
  .up2-phase-card.is-current {
    background: linear-gradient(180deg, color-mix(in srgb, var(--hero-accent), transparent 90%), rgba(255,255,255,.03));
    border-color: color-mix(in srgb, var(--hero-accent), transparent 46%);
    box-shadow: 0 0 26px color-mix(in srgb, var(--hero-accent), transparent 86%);
  }
  .up2-phase-card.is-locked {
    opacity: .6;
    filter: saturate(.74);
  }
  /* ── flip mechanics ── */
  .up2-flip-inner {
    width: 100%; height: 100%;
    min-height: 210px;
    transform-style: preserve-3d;
    transition: transform 0.54s cubic-bezier(.22,1,.36,1);
    border-radius: 8px;
    position: relative;
  }
  .up2-phase-card:hover .up2-flip-inner {
    transform: rotateY(180deg);
  }
  .up2-flip-front, .up2-flip-back {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 8px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .up2-flip-back {
    transform: rotateY(180deg);
    background: linear-gradient(160deg, color-mix(in srgb, var(--tone), transparent 86%), rgba(9,6,18,.98));
    border: 1px solid color-mix(in srgb, var(--tone), transparent 58%);
    gap: 7px;
  }
  .up2-phase-icon {
    width: 30px; height: 30px;
    object-fit: contain;
    filter: drop-shadow(0 0 8px var(--tone));
    flex-shrink: 0;
  }
  .up2-phase-card.is-locked .up2-phase-icon { filter: grayscale(1) opacity(.35); }
  .up2-flip-back-title {
    font: 800 13px/1.2 "Manrope", sans-serif;
    color: color-mix(in srgb, var(--tone), white 30%);
    letter-spacing: .01em;
    margin-bottom: 2px;
  }
  .up2-flip-detail-row {
    display: flex; align-items: flex-start; gap: 7px;
    font: 500 11px/1.44 "Manrope", sans-serif;
    color: #cfc3e2;
  }
  .up2-flip-detail-row img {
    width: 14px; height: 14px;
    flex-shrink: 0; margin-top: 1px; opacity: .82;
    object-fit: contain;
  }
  .up2-flip-milestone {
    margin-top: auto;
    border-top: 1px solid rgba(255,255,255,.07);
    padding-top: 7px;
    font: 500 10px/1.4 "JetBrains Mono", monospace;
    color: #7a6a96;
    letter-spacing: .03em;
  }
  .up2-phase-index {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff8e6;
    font: 900 14px/1 "Manrope", sans-serif;
    background: linear-gradient(180deg, color-mix(in srgb, var(--tone), white 12%), var(--tone));
    box-shadow: 0 0 18px color-mix(in srgb, var(--tone), transparent 74%);
  }
  .up2-phase-name {
    color: #fff9ed;
    font: 800 15px/1.2 "Manrope", sans-serif;
  }
  .up2-phase-desc {
    color: #bbaed1;
    font: 500 12px/1.52 "Manrope", sans-serif;
  }
  .up2-phase-chiprow {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .up2-phase-chip {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    color: #d8cee8;
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .up2-phase-range {
    color: #efe6fb;
    font: 700 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .up2-phase-milestone {
    color: #ab9ec3;
    font: 500 11px/1.45 "Manrope", sans-serif;
  }
  .up2-phase-details {
    display: grid;
    gap: 6px;
  }
  .up2-phase-detail {
    color: #d6cbea;
    font: 500 11px/1.45 "Manrope", sans-serif;
  }
  .up2-phase-detail strong {
    color: #fff6e6;
    font-weight: 800;
  }
  .up2-phase-more {
    margin-top: 2px;
    border-top: 1px solid rgba(255,255,255,.06);
    padding-top: 8px;
  }
  .up2-phase-more summary {
    list-style: none;
    cursor: pointer;
    color: #f3ead9;
    font: 700 11px/1.2 "Manrope", sans-serif;
  }
  .up2-phase-more summary::-webkit-details-marker {
    display: none;
  }
  .up2-phase-more[open] summary {
    color: var(--hero-accent);
  }
  .up2-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.08);
    color: #ece3fb;
    font: 700 11px/1 "Manrope", sans-serif;
  }
  .up2-tag.is-estimate {
    color: #d7caeb;
    border-color: color-mix(in srgb, var(--hero-secondary), transparent 56%);
    background: color-mix(in srgb, var(--hero-secondary), transparent 90%);
  }
  .up2-compact-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .up2-card-plain {
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid;
    gap: 8px;
  }
  .up2-card-plain strong {
    color: #fff6df;
    font: 800 14px/1.25 "Manrope", sans-serif;
  }
  .up2-card-plain span {
    color: #bdb2cf;
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .up2-build-summary {
    padding: 14px 16px;
    margin-bottom: 14px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 72%);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--hero-accent), transparent 92%), rgba(255,255,255,.03)),
      rgba(9, 6, 16, .72);
    display: grid;
    gap: 8px;
  }
  .up2-build-summary strong {
    color: #fff7e9;
    font: 800 14px/1.25 "Manrope", sans-serif;
  }
  .up2-build-summary span {
    color: #c8bcdb;
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .up2-build-list {
    display: grid;
    gap: 10px;
  }
  .up2-build-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
  }
  .up2-build-row strong {
    color: #fff8ec;
    font: 700 13px/1.2 "Manrope", sans-serif;
  }
  .up2-build-row span {
    color: #b9aecb;
    font: 500 12px/1.45 "Manrope", sans-serif;
  }
  .up2-build-row small {
    color: #8f85a8;
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .up2-journey-marks {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .up2-medal {
    position: relative;
    min-height: 126px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 14px;
    align-items: center;
  }
  .up2-medal.is-completed {
    border-color: color-mix(in srgb, var(--hero-accent), transparent 54%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--hero-accent), transparent 92%), rgba(255,255,255,.03));
  }
  .up2-medal.is-progress {
    border-color: color-mix(in srgb, var(--hero-secondary), transparent 60%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--hero-secondary), transparent 93%), rgba(255,255,255,.03));
  }
  .up2-medal.is-secret {
    border-color: rgba(255,255,255,.06);
    background: linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.015));
    filter: saturate(.8);
  }
  .up2-medal-frame {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 42px;
    height: 42px;
    object-fit: contain;
    image-rendering: pixelated;
    opacity: .82;
    pointer-events: none;
  }
  .up2-medal img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 12px 16px rgba(0,0,0,.34));
  }
  .up2-medal-name {
    color: #fff8ed;
    font: 800 14px/1.18 "Manrope", sans-serif;
  }
  .up2-medal-note {
    color: #b9aecb;
    font: 500 12px/1.5 "Manrope", sans-serif;
    margin-top: 4px;
  }
  .up2-medal-state {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    color: var(--hero-accent);
    font: 800 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .up2-loadout {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .up2-loadout-slot {
    position: relative;
    min-height: 154px;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }
  .up2-loadout-slot.is-cosmetic {
    border-color: color-mix(in srgb, var(--hero-secondary), transparent 62%);
  }
  .up2-loadout-slot.is-functional {
    border-color: color-mix(in srgb, var(--hero-accent), transparent 56%);
  }
  .up2-loadout-slot:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: calc(100% + 10px);
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 60%);
    background: rgba(8, 5, 17, .94);
    color: #f1e9ff;
    font: 600 11px/1.45 "Manrope", sans-serif;
    box-shadow: 0 14px 28px rgba(0,0,0,.34);
    z-index: 5;
    pointer-events: none;
  }
  .up2-loadout-kind {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8, 5, 17, .82);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .up2-loadout-kind img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .up2-loadout-rarity {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(8, 5, 17, .74);
    color: #fff1d7;
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .up2-loadout-rarity-frame {
    position: absolute;
    inset: -10%;
    width: 120%;
    height: 120%;
    object-fit: contain;
    image-rendering: pixelated;
    pointer-events: none;
    opacity: .88;
  }
  .up2-loadout-preview {
    position: relative;
    width: 98px;
    height: 98px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 62%);
    background: radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--hero-accent), transparent 84%), rgba(8, 5, 17, .88));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
    box-shadow: 0 0 24px color-mix(in srgb, var(--hero-accent), transparent 88%);
  }
  .up2-loadout-preview img {
    image-rendering: pixelated;
  }
  .up2-loadout-avatar {
    width: 82px;
    height: 82px;
    border-radius: 50%;
    object-fit: cover;
    background: rgba(255,255,255,.04);
  }
  .up2-loadout-frame {
    position: absolute;
    inset: -16%;
    width: 132%;
    height: 132%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 10px 14px rgba(0,0,0,.3));
  }
  .up2-loadout-skin {
    width: 86px;
    height: 86px;
    object-fit: contain;
    filter: drop-shadow(0 10px 14px rgba(0,0,0,.36));
  }
  .up2-loadout-fallback {
    width: 78px;
    height: 78px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--hero-accent);
    font: 900 24px/1 "Manrope", sans-serif;
    background: rgba(255,255,255,.04);
  }
  .up2-slot-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }
  .up2-loadout-slot strong {
    color: #fff8ec;
    font: 800 13px/1.2 "Manrope", sans-serif;
  }
  .up2-loadout-slot span {
    color: #bbaed0;
    font: 500 12px/1.5 "Manrope", sans-serif;
  }
  .up2-loadout-meta {
    display: grid;
    gap: 6px;
  }
  .up2-loadout-more {
    margin-top: 2px;
    border-top: 1px solid rgba(255,255,255,.06);
    padding-top: 8px;
  }
  .up2-loadout-more summary {
    list-style: none;
    cursor: pointer;
    color: #f3ead9;
    font: 700 11px/1.2 "Manrope", sans-serif;
  }
  .up2-loadout-more summary::-webkit-details-marker {
    display: none;
  }
  .up2-loadout-line {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: #ccbfe0;
    font: 600 11px/1.4 "Manrope", sans-serif;
  }
  .up2-loadout-line span:last-child {
    text-align: right;
    color: #f4ebff;
    font-weight: 700;
  }
  .up2-utility {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .up2-utility-card {
    min-height: 76px;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid;
    gap: 6px;
  }
  .up2-utility-card strong {
    color: #fff8e8;
    font: 800 13px/1.2 "Manrope", sans-serif;
  }
  .up2-utility-value {
    color: var(--hero-accent);
    font: 900 22px/1.1 "Manrope", sans-serif;
    text-shadow: 0 0 14px color-mix(in srgb, var(--hero-accent), transparent 62%);
  }
  .up2-utility-card span {
    color: #bbaed0;
    font: 500 11px/1.5 "Manrope", sans-serif;
  }
  .up2-utility-note {
    color: #7a6e92;
    font: 700 9px/1.4 "JetBrains Mono", monospace;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .up2-skill-wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }
  .up2-skill-summary {
    display: grid;
    gap: 12px;
  }
  .up2-skill-hero {
    display: grid;
    gap: 14px;
  }
  .up2-skill-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .up2-skill-copy {
    display: grid;
    gap: 6px;
    max-width: 680px;
  }
  .up2-skill-copy p {
    margin: 0;
    color: #bbaed0;
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .up2-skill-chipline {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .up2-skill-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 68%);
    background: color-mix(in srgb, var(--hero-accent), transparent 92%);
    color: #f7f2ff;
    font: 700 11px/1 "Manrope", sans-serif;
    letter-spacing: .04em;
  }
  .up2-skill-pill strong {
    color: var(--hero-accent-soft);
    font-weight: 800;
  }
  .up2-skill-hud {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) repeat(2, minmax(0, .95fr));
    gap: 12px;
    align-items: start;
  }
  .up2-skill-box {
    min-height: 94px;
    padding: 14px 15px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--hero-accent), transparent 88%), transparent 58%);
    display: grid;
    align-content: start;
    gap: 7px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
  }
  .up2-skill-box strong {
    color: #fff8eb;
    font: 800 14px/1.2 "Manrope", sans-serif;
  }
  .up2-skill-box span {
    color: #bcaed0;
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .up2-skill-box.is-compact {
    min-height: 0;
    gap: 8px;
  }
  .up2-skill-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .up2-skill-inline span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
    color: #e7deff;
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .up2-skill-inline strong {
    color: var(--hero-accent-soft);
    font-weight: 800;
  }
  .up2-skill-mini {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02)),
      radial-gradient(circle at top right, color-mix(in srgb, var(--hero-accent), transparent 88%), transparent 58%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
    overflow: hidden;
  }
  .up2-skill-mini summary {
    list-style: none;
    cursor: pointer;
    display: grid;
    gap: 6px;
    padding: 14px 15px;
  }
  .up2-skill-mini summary::-webkit-details-marker {
    display: none;
  }
  .up2-skill-mini summary strong {
    color: #fff8eb;
    font: 800 14px/1.2 "Manrope", sans-serif;
  }
  .up2-skill-mini summary span {
    color: #bcaed0;
    font: 500 12px/1.5 "Manrope", sans-serif;
  }
  .up2-skill-mini-body {
    display: grid;
    gap: 8px;
    padding: 0 15px 14px;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .up2-skill-mini-body p {
    margin: 10px 0 0;
    color: #cdbfe0;
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .up2-skill-mini-body small {
    color: #9287aa;
    font: 700 10px/1.45 "JetBrains Mono", monospace;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .up2-skill-tree-panel .up2-panel-pad {
    padding: 14px;
  }
  .up2-empty-art {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 62%);
    background: radial-gradient(circle, color-mix(in srgb, var(--hero-accent), transparent 82%), transparent 66%);
    color: var(--hero-accent);
    font: 900 26px/1 "Manrope", sans-serif;
    box-shadow: 0 0 20px color-mix(in srgb, var(--hero-accent), transparent 86%);
  }
  .up2-loading {
    min-height: 62vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .up2-loading-card {
    min-width: 280px;
    padding: 28px 32px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--hero-accent), transparent 70%);
    background: rgba(9, 6, 16, .92);
    box-shadow: 0 24px 56px rgba(0,0,0,.34);
    display: grid;
    justify-items: center;
    gap: 14px;
  }
  .up2-spinner {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,.12);
    border-top-color: var(--hero-accent);
    animation: spin .9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 1360px) {
    .up2-main-grid {
      grid-template-columns: 1fr 1fr;
    }
    .up2-main-grid > .up2-stack:last-child {
      grid-column: 1 / -1;
    }
    .up2-journey {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .up2-journey-marks {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 1180px) {
    .up2-hero {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    .up2-stage-footer,
    .up2-skill-wrap {
      grid-template-columns: 1fr;
    }
    .up2-skill-hud {
      grid-template-columns: 1fr;
    }
    .up2-meta-grid,
    .up2-compact-grid,
    .up2-journey-marks,
    .up2-utility {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 840px) {
    .up2-main-grid,
    .up2-meta-grid,
    .up2-compact-grid,
    .up2-journey-marks,
    .up2-loadout,
    .up2-utility,
    .up2-skill-hud {
      grid-template-columns: 1fr;
    }
    .up2-journey {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .up2-journey::before {
      display: none;
    }
  }
  @media (max-width: 620px) {
    .up2-shell {
      padding: 12px;
      gap: 14px;
    }
    .up2-panel-pad,
    .up2-hero {
      padding: 14px;
    }
    .up2-title {
      font-size: clamp(34px, 11vw, 52px);
    }
    .up2-journey {
      grid-template-columns: 1fr;
    }
    .up2-stage-card {
      min-height: 360px;
      padding: 22px 16px 16px;
    }
    .up2-character {
      width: min(88%, 260px);
    }
    .up2-stage-mark,
    .up2-crest-pin {
      position: static;
    }
    .up2-stage-top {
      flex-direction: column;
      align-items: stretch;
    }
    .up2-bubble {
      max-width: calc(100% - 24px);
      top: 18px;
    }
  }
`;

export function getStage(level = 1) {
  return STAGES.find((stage) => level >= stage.min && level <= stage.max) || STAGES[0];
}

function getClassKey(heroClass) {
  const normalized = String(heroClass || "").toUpperCase();
  if (CLASS_THEME[normalized]) return normalized;
  return "DEFAULT";
}

function getHeroAnimState({ isTired, levelUpAnim }) {
  if (levelUpAnim) return "happy";
  if (isTired) return "bored";
  return "idle";
}

function getStageProgress(stage, level = 1, xpPct = 0) {
  if (!stage) return 0;
  if (level < stage.min) return 0;
  if (stage.max >= 999) return Math.max(12, Math.min(100, xpPct || 100));
  if (level > stage.max) return 100;
  const stageSpan = Math.max(stage.max - stage.min + 1, 1);
  const covered = Math.max(Math.min(level, stage.max) - stage.min + 1, 0);
  return Math.max(0, Math.min(100, Math.round((covered / stageSpan) * 100)));
}

function getStageMilestone(stage, currentStage, level) {
  if (!stage) return "";
  if (level < stage.min) return `Abre en nivel ${stage.min}.`;
  if (stage.id < currentStage.id) return `Tramo cerrado en nivel ${stage.max}.`;
  if (stage.max >= 999) return "Etapa final activa.";
  if (stage.id === currentStage.id) return `Siguiente forma en nivel ${stage.max + 1}.`;
  return `Disponible entre nivel ${stage.min} y ${stage.max}.`;
}

function getStageBannerSrc(heroClass, stageId) {
  return STAGE_CLASS_ASSET[heroClass] || STAGE_CLASS_ASSET.DEFAULT;
}

function formatEquippedStamp(value) {
  if (!value) return "Sin sello horario";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "En uso actual";
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function getTimeTone() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "La mesa sugiere activacion limpia para arrancar el dia.";
  if (hour >= 12 && hour < 18) return "Buen momento para meter volumen, sostener pulso y cerrar trabajo real.";
  if (hour >= 18 && hour < 22) return "Ideal para una sesion firme sin romper el control corporal.";
  return "Si ya cerraste el dia, enfoca movilidad, respiracion y recuperacion.";
}

function scorePercent(value, max) {
  return Math.max(0, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
}

function ProgressMeter({ value, max, tone, label, valueLabel }) {
  const pct = scorePercent(value, max);
  return (
    <div className="up2-progress">
      <div className="up2-progress-top">
        <span>{label}</span>
        <span>{valueLabel ?? `${pct}%`}</span>
      </div>
      <div className="up2-meter" style={{ "--tone": tone }}>
        <span style={{ "--w": `${pct}%` }} />
      </div>
    </div>
  );
}

function HeroSparkLayer() {
  return (
    <div className="up2-sparks">
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          className="up2-spark"
          style={{
            "--x": `${8 + ((index * 11) % 82)}%`,
            "--y": `${10 + ((index * 13) % 72)}%`,
            "--s": `${3 + (index % 3) * 2}px`,
            "--t": `${3 + (index % 5) * 1.1}s`,
            "--d": `${index * 0.18}s`,
            "--dx": `${(index % 2 === 0 ? 1 : -1) * (8 + (index % 4) * 10)}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function UserPersonaje({ profile = {} }) {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "personaje";
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    return stored === "habilidades" ? "habilidades" : "personaje";
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewedPhase, setViewedPhase] = useState(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [msg, setMsg] = useState(null);
  const [msgVisible, setMsgVisible] = useState(false);
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [clickRipple, setClickRipple] = useState(false);
  const [isTired, setIsTired] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [assetErrors, setAssetErrors] = useState({});

  const prevStageRef = useRef(null);
  const msgTimer = useRef(null);
  const frameTimer = useRef(null);
  const refreshTimer = useRef(null);

  const mergeDefined = useCallback((base, patch) => {
    const next = { ...(base || {}) };
    Object.entries(patch || {}).forEach(([key, value]) => {
      if (value !== undefined) next[key] = value;
    });
    return next;
  }, []);

  const applyStatsSnapshot = useCallback(
    (nextStats = {}) => {
      setStats((prev) => mergeDefined(prev, nextStats));
    },
    [mergeDefined],
  );

  const refreshStats = useCallback(
    async ({ silent = true } = {}) => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (!silent) setLoading(false);
          return;
        }

        if (!silent) setLoading(true);
        const token = await user.getIdToken();
        const res = await getUserStats(token);
        applyStatsSnapshot(res?.stats || {});
      } catch {
        if (!silent) setStats((prev) => prev || {});
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [applyStatsSnapshot],
  );

  const scheduleRefresh = useCallback(
    (delay = 240) => {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        refreshStats({ silent: true });
      }, delay);
    },
    [refreshStats],
  );

  useEffect(() => {
    refreshStats({ silent: false });
    return () => clearTimeout(refreshTimer.current);
  }, [refreshStats]);

  useEffect(() => {
    const onSkinChanged = (event) => {
      const nextSkin = event?.detail?.skin || event?.detail?.activeSkin;
      if (nextSkin !== undefined) {
        setStats((prev) => mergeDefined(prev, { activeSkin: nextSkin }));
      }
      scheduleRefresh();
    };

    const onAvatarEquipped = (event) => {
      setStats((prev) => mergeDefined(prev, event?.detail || {}));
      scheduleRefresh();
    };

    window.addEventListener("skinChanged", onSkinChanged);
    window.addEventListener("avatarEquipped", onAvatarEquipped);

    return () => {
      window.removeEventListener("skinChanged", onSkinChanged);
      window.removeEventListener("avatarEquipped", onAvatarEquipped);
    };
  }, [mergeDefined, scheduleRefresh]);

  useEffect(() => {
    if (!profile) return;
    setStats((prev) =>
      mergeDefined(prev, {
        nivel: profile.level,
        xp: profile.xp,
        xpNext: profile.xpNext,
        xpTotal: profile.xpTotal,
        streak: profile.streak,
        heroClass: profile.heroClass,
        username: profile.username,
        monedas: profile.coins,
        gemas: profile.gems,
        energia: profile.energy,
        activeSkin: profile.activeSkin,
        activeAvatar: profile.activeAvatar,
        activeFrame: profile.activeFrame,
      }),
    );
  }, [
    mergeDefined,
    profile,
    profile?.activeAvatar,
    profile?.activeFrame,
    profile?.activeSkin,
    profile?.coins,
    profile?.energy,
    profile?.gems,
    profile?.heroClass,
    profile?.level,
    profile?.streak,
    profile?.username,
    profile?.xp,
    profile?.xpNext,
    profile?.xpTotal,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const applyChatAction = (raw) => {
      const payload = raw?.detail || raw;
      if (!payload || payload.section !== "personaje") return false;
      const nextTab = payload.entityId === "habilidades" ? "habilidades" : "personaje";
      setActiveTab(nextTab);
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
  }, []);

  useEffect(() => {
    const refreshEvents = [
      "skillUnlocked",
      "exerciseCompleted",
      "misionCompleted",
      "logroUnlocked",
      "levelUp",
      "streakUpdated",
      "itemUsed",
      "skinChanged",
      "avatarEquipped",
      "avatarPurchased",
    ];

    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh(120);
    };
    const onFocus = () => scheduleRefresh(120);

    refreshEvents.forEach((eventName) => window.addEventListener(eventName, onFocus));
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      refreshEvents.forEach((eventName) => window.removeEventListener(eventName, onFocus));
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [scheduleRefresh]);

  const level = stats?.nivel ?? profile.level ?? 1;
  const xp = stats?.xp ?? profile.xp ?? 0;
  const xpNext = stats?.xpNext ?? profile.xpNext ?? 100;
  const xpTotal = stats?.xpTotal ?? profile.xpTotal ?? xp;
  const streak = stats?.streak ?? profile.streak ?? 0;
  const rachaMax = stats?.rachaMax ?? streak;
  const sesiones = stats?.sesionesTotales ?? 0;
  const logros = stats?.logrosObtenidos ?? 0;
  const weeklyXP = stats?.weeklyXP ?? 0;
  const heroClass = getClassKey(stats?.heroClass ?? profile.heroClass ?? "DEFAULT");
  const coins = profile?.coins ?? stats?.coins ?? 0;
  const gems = profile?.gems ?? stats?.gems ?? 0;
  const misiones = stats?.misionesCompletadas ?? 0;
  const calorias = stats?.calorias ?? 0;
  const recordPeso = stats?.recordPeso ?? 0;
  const tiempoRaw = stats?.tiempoTotal ?? 0;
  const tiempoTotal = typeof tiempoRaw === "number" && tiempoRaw > 0
    ? tiempoRaw >= 60 ? `${Math.floor(tiempoRaw / 60)}h ${tiempoRaw % 60}m` : `${tiempoRaw} min`
    : "0 min";
  const skillPoints = stats?.skillPoints ?? profile?.skillPoints ?? 0;
  const activeSkinId = stats?.activeSkin ?? profile?.activeSkin ?? "default";
  const activeAvatarId = stats?.activeAvatar ?? profile?.activeAvatar ?? "avatar_01";
  const activeFrameId = stats?.activeFrame !== undefined ? stats?.activeFrame : profile?.activeFrame ?? null;
  const currentStage = getStage(level);
  const viewedStage = STAGES[(viewedPhase ?? currentStage.id) - 1] || currentStage;
  const theme = CLASS_THEME[heroClass] || CLASS_THEME.DEFAULT;
  const classCopy = CLASS_COPY[heroClass] || CLASS_COPY.DEFAULT;
  const classBadge = CLASS_BADGES[heroClass] || CLASS_BADGES.DEFAULT;
  const xpPct = scorePercent(xp, xpNext);
  const nextStage = STAGES.find((stage) => stage.id === currentStage.id + 1) || null;
  const activeAvatarMeta = AVATARS_CATALOG.find((avatar) => avatar.id === activeAvatarId) || AVATARS_CATALOG[0];
  const activeFrameMeta = FRAMES_CATALOG.find((frame) => frame.id === activeFrameId) || null;
  const activeSkinPreview = getSkinPreview(activeSkinId);
  const heroAnimState = getHeroAnimState({ isTired, levelUpAnim });
  const heroFrameCount = getFrameCount(heroAnimState);
  const heroFrame = getFramePath(heroAnimState, frameIdx, activeSkinId);
  const stageBannerSrc = getStageBannerSrc(heroClass, currentStage.id);
  const classSkillHint = CLASS_SKILL_HINTS[heroClass] || CLASS_SKILL_HINTS.DEFAULT;
  const skinMeta = SKIN_META[activeSkinId] || {
    name: activeSkinId,
    rarity: activeSkinId === "default" ? "Comun" : "Raro",
    origin: "Skin equipada desde guardarropa",
    type: "Cosmetico",
  };
  const avatarEquippedAt = formatEquippedStamp(stats?.activeAvatarEquippedAt ?? profile?.activeAvatarEquippedAt);
  const skinEquippedAt = formatEquippedStamp(stats?.activeSkinEquippedAt ?? profile?.activeSkinEquippedAt);

  const toneVars = useMemo(
    () => ({
      "--hero-accent": theme.accent,
      "--hero-secondary": theme.secondary,
      "--hero-bg": theme.bg,
      "--hero-soft": theme.soft,
    }),
    [theme],
  );

  const stageTone = useMemo(() => {
    if (levelUpAnim) return "Subida reciente: el brillo del personaje sigue encendido.";
    if (streak === 0) return "Hoy la escena baja un poco. Un entrenamiento basta para volver a activarla.";
    if (streak >= 14) return "Racha alta. El tablero esta leyendo un heroe muy estable.";
    if (streak >= 7) return "Buen ritmo. Tu build ya tiene una presencia clara en el mapa.";
    return "La forma sigue viva. Mantener sesiones cortas pero limpias sostendra esta ruta.";
  }, [levelUpAnim, streak]);

  const etaDays = useMemo(() => {
    if (!nextStage || weeklyXP <= 0) return null;
    const avgDaily = weeklyXP / 7;
    const levelsLeft = Math.max(nextStage.min - level, 0);
    const xpNeeded = Math.max(levelsLeft * 120 - xp, 0);
    if (avgDaily <= 0 || xpNeeded <= 0) return null;
    return Math.ceil(xpNeeded / avgDaily);
  }, [level, nextStage, weeklyXP, xp]);

  const primaryStats = useMemo(() => {
    const profileStats = profile?.stats || {};
    const strengthRaw = Number(stats?.fuerza ?? profileStats?.fuerza);
    const staminaRaw = Number(stats?.resistencia ?? profileStats?.resistencia);
    const speedRaw = Number(stats?.agilidad ?? profileStats?.agilidad);
    const disciplineRaw = Number(stats?.disciplina ?? profileStats?.disciplina);
    const strength = Number.isFinite(strengthRaw) && strengthRaw > 0 ? Math.min(99, strengthRaw) : Math.min(99, Math.floor(level * 2 + sesiones * 0.12));
    const stamina = Number.isFinite(staminaRaw) && staminaRaw > 0 ? Math.min(99, staminaRaw) : Math.min(99, Math.floor(level * 1.8 + streak * 0.5));
    const speed = Number.isFinite(speedRaw) && speedRaw > 0 ? Math.min(99, speedRaw) : Math.min(99, Math.floor(level * 1.5 + xpPct * 0.3));
    const discipline = Number.isFinite(disciplineRaw) && disciplineRaw > 0 ? Math.min(99, disciplineRaw) : Math.min(99, Math.floor(streak * 2 + logros * 0.5));
    return [
      { key: "fuerza", label: "Fuerza", value: strength, tone: "#e85d75", asset: "/ui/stat-str.png", estimated: !(Number.isFinite(strengthRaw) && strengthRaw > 0) },
      { key: "resistencia", label: "Resistencia", value: stamina, tone: theme.secondary, asset: "/ui/stat-sta.png", estimated: !(Number.isFinite(staminaRaw) && staminaRaw > 0) },
      { key: "agilidad", label: "Agilidad", value: speed, tone: "#8ac926", asset: "/ui/stat-spd.png", estimated: !(Number.isFinite(speedRaw) && speedRaw > 0) },
      { key: "disciplina", label: "Disciplina", value: discipline, tone: "#c08aff", asset: "/ui/header/section-misiones.png", estimated: !(Number.isFinite(disciplineRaw) && disciplineRaw > 0) },
    ];
  }, [level, logros, profile?.stats, sesiones, stats?.agilidad, stats?.disciplina, stats?.fuerza, stats?.resistencia, streak, theme.secondary, xpPct]);

  const secondaryStats = useMemo(() => {
    const hipertrofiaRaw = Number(stats?.hipertrofia);
    const tecnicaRaw = Number(stats?.tecnica);
    const recuperacionRaw = Number(stats?.recuperacion);
    const movilidadRaw = Number(stats?.movilidad);
    const hipertrofia = Number.isFinite(hipertrofiaRaw) && hipertrofiaRaw > 0 ? Math.min(99, hipertrofiaRaw) : Math.min(99, Math.floor(sesiones * 0.2 + level * 1.5));
    const tecnica = Number.isFinite(tecnicaRaw) && tecnicaRaw > 0 ? Math.min(99, tecnicaRaw) : Math.min(99, Math.floor(weeklyXP / 50 + level * 1.2));
    const recuperacion = Number.isFinite(recuperacionRaw) && recuperacionRaw > 0 ? Math.min(99, recuperacionRaw) : Math.min(99, Math.floor(streak * 1.5 + level * 1.8));
    const movilidad = Number.isFinite(movilidadRaw) && movilidadRaw > 0 ? Math.min(99, movilidadRaw) : Math.min(99, Math.floor(level * 1.8 + logros * 0.5));
    return [
      { key: "hip", label: "Hipertrofia", value: hipertrofia, tone: "#ff7a5c", estimated: !(Number.isFinite(hipertrofiaRaw) && hipertrofiaRaw > 0) },
      { key: "tec", label: "Tecnica", value: tecnica, tone: "#4cc9f0", estimated: !(Number.isFinite(tecnicaRaw) && tecnicaRaw > 0) },
      { key: "rec", label: "Recuperacion", value: recuperacion, tone: "#8ac926", estimated: !(Number.isFinite(recuperacionRaw) && recuperacionRaw > 0) },
      { key: "mov", label: "Movilidad", value: movilidad, tone: "#c08aff", estimated: !(Number.isFinite(movilidadRaw) && movilidadRaw > 0) },
    ];
  }, [level, logros, sesiones, stats?.hipertrofia, stats?.movilidad, stats?.recuperacion, stats?.tecnica, streak, weeklyXP]);

  const medals = useMemo(
    () =>
      JOURNAL_MEDALS.map((entry) => ({
        ...entry,
        derived: true,
        ...entry.state({ sesiones, streak, logros, level }),
      })),
    [sesiones, streak, logros, level],
  );

  const buildSummary = useMemo(() => {
    const strongestPrimary = [...primaryStats].sort((a, b) => b.value - a.value)[0];
    const strongestSecondary = [...secondaryStats].sort((a, b) => b.value - a.value)[0];
    return {
      title: `${classBadge.label}: ${strongestPrimary?.label || "Base"} al frente`,
      lead: `${strongestPrimary?.label || "Base"} y ${strongestSecondary?.label || "Tecnica"} son las piezas que mas empujan tu personaje hoy.`,
      note: `Si mantienes este ritmo, ${currentStage.label.toLowerCase()} sigue consolidando una build mas estable y menos improvisada.`,
    };
  }, [classBadge.label, currentStage.label, primaryStats, secondaryStats]);

  const medalCards = useMemo(
    () =>
      medals.map((medal) => {
        const isSecret = !medal.done && medal.key === "social" && level < 6;
        const visualState = medal.done ? "completed" : isSecret ? "secret" : "progress";
        return {
          ...medal,
          visualState,
          frameAsset:
            visualState === "progress"
              ? "/ui/dailybonus/day-today-frame.png"
              : visualState === "secret"
                ? "/ui/dailybonus/day-locked.png"
                : null,
          displayName: isSecret ? "Sello sellado" : medal.name,
          displayDetail: isSecret ? "Aun no revelas esta marca. Sube presencia y volvera a mostrarse." : medal.detail,
          displayState: medal.done ? "Completada" : isSecret ? "Secreta" : medal.progress,
        };
      }),
    [level, medals],
  );

  const hasEstimatedPrimaryStats = primaryStats.some((stat) => stat.estimated);
  const hasEstimatedSecondaryStats = secondaryStats.some((stat) => stat.estimated);
  const hasDerivedMedals = medalCards.some((medal) => medal.derived);

  const tabs = useMemo(
    () => [
      { id: "personaje", label: t("pe.tab.personaje") || "Personaje" },
      { id: "habilidades", label: t("pe.tab.habilidades") || "Habilidades", badge: skillPoints > 0 ? skillPoints : null },
    ],
    [skillPoints, t],
  );

  const showMsg = useCallback((text, duration = 3600) => {
    clearTimeout(msgTimer.current);
    setMsg(text);
    setMsgVisible(true);
    msgTimer.current = setTimeout(() => {
      setMsgVisible(false);
    }, duration);
  }, []);

  const popContextMessage = useCallback(
    (mode = "idle") => {
      const byMode = {
        tired: [
          "Hoy la escena esta tenue. Una sola sesion basta para volver a encenderla.",
          "Tu build pide movimiento suave para retomar ritmo.",
          "No hace falta una maraton. Un buen bloque corto ya reabre el mapa.",
        ],
        excited: [
          "Buen avance. El tablero esta leyendo progreso real.",
          "La build responde bien. Sigue por esta fase y el cambio se nota mas.",
          "Tu personaje ya no se siente estatico. Se ve trabajado.",
        ],
        levelup: [
          "Nivel arriba. La ruta acaba de abrir una presencia mas seria.",
          "Subiste el perfil del personaje. Ahora el escenario te acompana mejor.",
          "Ascenso confirmado. Sostener esta energia vale oro.",
        ],
        idle: [
          getTimeTone(),
          "Tu progreso se lee mejor cuando la semana no se corta.",
          classCopy.flavor,
          stageTone,
        ],
      };
      const pool = byMode[mode] || byMode.idle;
      const text = pool[Math.floor(Math.random() * pool.length)];
      showMsg(text);
    },
    [classCopy.flavor, showMsg, stageTone],
  );

  useEffect(() => {
    if (!loading) {
      setIsTired(streak === 0);
      popContextMessage(streak === 0 ? "tired" : "idle");
    }
  }, [loading, streak, popContextMessage]);

  useEffect(() => {
    if (prevStageRef.current !== null && prevStageRef.current < currentStage.id) {
      setLevelUpAnim(true);
      popContextMessage("levelup");
      const timer = setTimeout(() => setLevelUpAnim(false), 4200);
      prevStageRef.current = currentStage.id;
      return () => clearTimeout(timer);
    }

    prevStageRef.current = currentStage.id;
    return undefined;
  }, [currentStage.id, popContextMessage]);

  useEffect(() => {
    const onExercise = () => popContextMessage("excited");
    const onMission = () => popContextMessage("excited");
    const onLogro = () => {
      setLevelUpAnim(true);
      popContextMessage("levelup");
      setTimeout(() => setLevelUpAnim(false), 3800);
    };
    const onStreak = (event) => {
      const nextStreak = event?.detail?.streak ?? 0;
      setIsTired(nextStreak === 0);
      popContextMessage(nextStreak === 0 ? "tired" : "excited");
    };

    window.addEventListener("exerciseCompleted", onExercise);
    window.addEventListener("misionCompleted", onMission);
    window.addEventListener("logroUnlocked", onLogro);
    window.addEventListener("levelUp", onLogro);
    window.addEventListener("streakUpdated", onStreak);
    window.addEventListener("itemUsed", onExercise);

    return () => {
      window.removeEventListener("exerciseCompleted", onExercise);
      window.removeEventListener("misionCompleted", onMission);
      window.removeEventListener("logroUnlocked", onLogro);
      window.removeEventListener("levelUp", onLogro);
      window.removeEventListener("streakUpdated", onStreak);
      window.removeEventListener("itemUsed", onExercise);
    };
  }, [popContextMessage]);

  useEffect(() => {
    if (loading) return undefined;
    let timer;

    const loop = () => {
      timer = setTimeout(() => {
        if (!msgVisible) {
          popContextMessage(streak === 0 ? "tired" : "idle");
        }
        loop();
      }, 20000 + Math.random() * 12000);
    };

    loop();
    return () => clearTimeout(timer);
  }, [loading, msgVisible, popContextMessage, streak]);

  useEffect(() => {
    clearInterval(frameTimer.current);
    setFrameIdx(0);
    setHeroImgError(false);

    frameTimer.current = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % Math.max(heroFrameCount, 1));
    }, Math.max(Math.round(1000 / Math.max(getFps(heroAnimState), 1)), 110));

    return () => clearInterval(frameTimer.current);
  }, [activeSkinId, heroAnimState, heroFrameCount]);

  const handleCharacterClick = useCallback(() => {
    setClickRipple(true);
    popContextMessage(isTired ? "tired" : "idle");
    setTimeout(() => setClickRipple(false), 650);
  }, [isTired, popContextMessage]);

  const handleCharacterKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCharacterClick();
      }
    },
    [handleCharacterClick],
  );

  if (loading) {
    return (
      <>
        <style>{PANEL_CSS}</style>
        <div className="up2-page" style={toneVars}>
          <div className="up2-loading">
            <div className="up2-loading-card">
              <div className="up2-spinner" />
              <strong style={{ color: "#fff8e8", font: '800 18px/1 "Manrope", sans-serif' }}>
                {t("pe.loading") || "Cargando personaje"}
              </strong>
              <span style={{ color: "#b9aecb", font: '500 13px/1.5 "Manrope", sans-serif', textAlign: "center" }}>
                Ordenando clase, progreso y presencia visual del heroe.
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PANEL_CSS}</style>

      <div className="up2-page" style={toneVars}>
        <div className="up2-shell">
          <section className="up2-panel up2-hero">
            <HeroSparkLayer />

            <div className="up2-copy">
              <div>
                <span className="up2-eyebrow">
                  <img className="up2-icon" src="/ui/header/section-personaje.png" alt="" />
                  Portada del personaje
                </span>

                <h1 className="up2-title">
                  {classCopy.title.split(" ").slice(0, -2).join(" ")}{" "}
                  <span>{classCopy.title.split(" ").slice(-2).join(" ")}</span>
                </h1>
                <p className="up2-lead">{classCopy.lead}</p>
              </div>

              <div className="up2-chip-row">
                <span className="up2-chip">
                  <img className="up2-icon up2-icon--sm" src={theme.crest} alt="" />
                  Clase <strong>{classBadge.label}</strong>
                </span>
                <span className="up2-chip">
                  <img className="up2-icon up2-icon--sm" src="/ui/medals/rank-crown.png" alt="" />
                  Etapa <strong>{currentStage.id}/5</strong>
                </span>
                <span className="up2-chip">
                  <img className="up2-icon up2-icon--sm" src="/ui/header/notifications/notif-shield.png" alt="" />
                  Racha <strong>{streak} dias</strong>
                </span>
                <span className="up2-chip">
                  <img className="up2-icon up2-icon--sm" src="/ui/header/notifications/notif-medal.png" alt="" />
                  Logros <strong>{logros}</strong>
                </span>
              </div>

              <div className="up2-action-row">
                <button type="button" className="up2-btn up2-btn--primary" onClick={() => setActiveTab("habilidades")}>
                  Abrir habilidades
                </button>
                <button
                  type="button"
                  className="up2-btn up2-btn--ghost"
                  onClick={() => window.dispatchEvent(new CustomEvent("flexNavigate", { detail: { section: "logros" } }))}
                >
                  Ver medallas del heroe
                </button>
                {viewedPhase !== null && viewedPhase !== currentStage.id && (
                  <button type="button" className="up2-btn up2-btn--ghost" onClick={() => setViewedPhase(null)}>
                    Volver a mi etapa activa
                  </button>
                )}
              </div>

              <div className="up2-meta-grid">
                {[
                  {
                    label: "Nivel",
                    value: level,
                    note: `${xp.toLocaleString()} / ${xpNext.toLocaleString()} XP en este nivel`,
                    icon: "/ui/medals/rank-crown.png",
                  },
                  {
                    label: "XP total",
                    value: xpTotal.toLocaleString(),
                    note: "Toda la memoria fisica ya ganada por el personaje.",
                    icon: "/ui/header/notifications/notif-quest.png",
                  },
                  {
                    label: "Sesiones",
                    value: sesiones.toLocaleString(),
                    note: "Entradas reales que sostienen presencia y build.",
                    icon: "/ui/header/section-ejercicios.png",
                  },
                  {
                    label: "Reserva",
                    value: `${coins.toLocaleString()} / ${gems.toLocaleString()}`,
                    note: "Oro y gemas vivas para mercado, boosts y piezas.",
                    icon: "/ui/header/section-tienda.png",
                  },
                ].map((item) => (
                  <div key={item.label} className="up2-stat-card">
                    <div className="up2-stat-top">
                      <div>
                        <div className="up2-kicker">{item.label}</div>
                        <div className="up2-stat-value">{item.value}</div>
                      </div>
                      <img className="up2-icon up2-icon--lg" src={item.icon} alt="" />
                    </div>
                    <div className="up2-stat-note">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="up2-stage-shell">
              <div className="up2-stage-top">
                <div className="up2-stage-badges">
                  <span className="up2-badge">
                    <img className="up2-icon up2-icon--sm" src="/ui/header/section-personaje.png" alt="" />
                    {classCopy.zone}
                  </span>
                  <span className="up2-badge">
                    <img className="up2-icon up2-icon--sm" src="/ui/rarity/rarity-legendary.png" alt="" />
                    {currentStage.label}
                  </span>
                </div>
                <span className="up2-badge">
                  <img className="up2-icon up2-icon--sm" src="/ui/header/notifications/notif-message.png" alt="" />
                  {stageTone}
                </span>
              </div>

              <div className="up2-stage-card">
                <div className="up2-stage-backdrop" style={stageBannerSrc ? { backgroundImage: `url("${stageBannerSrc}")` } : undefined} />
                <div className="up2-stage-forge" />
                <div className="up2-stage-pedestal" />
                <div className="up2-stage-mark">
                  <img className="up2-icon up2-icon--lg" src="/ui/header/section-personaje.png" alt="" />
                  <span>Camara de forja</span>
                </div>
                <img className="up2-crest-pin" src={theme.crest} alt="" />

                <AnimatePresence>
                  {msgVisible ? (
                    <motion.div
                      key={msg}
                      className="up2-bubble"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      {msg}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div
                  className="up2-stage-frame"
                  onClick={handleCharacterClick}
                  onKeyDown={handleCharacterKeyDown}
                  role="button"
                  tabIndex={0}
                  aria-label={`Interactuar con el personaje de ${classBadge.label}`}
                >
                  <div className="up2-stage-ring" />
                  {clickRipple ? <div className="up2-stage-ripple" /> : null}
                  <div className="up2-character">
                    {!heroImgError ? (
                      <img src={heroFrame} alt={`Avatar ${classBadge.label}`} onError={() => setHeroImgError(true)} />
                    ) : (
                      <div className="up2-empty-art">{classBadge.icon}</div>
                    )}
                  </div>
                  <div className="up2-stage-avatar-badge" aria-hidden="true">
                    {!assetErrors[`stage-avatar:${activeAvatarId}`] ? (
                      <>
                        <img
                          className="up2-stage-avatar"
                          src={getAvatarImage(activeAvatarId)}
                          alt=""
                          onError={() => setAssetErrors((prev) => ({ ...prev, [`stage-avatar:${activeAvatarId}`]: true }))}
                        />
                        {activeFrameId && !assetErrors[`stage-avatar-frame:${activeFrameId}`] ? (
                          <img
                            className="up2-stage-avatar-frame"
                            src={`/marcos/${activeFrameId}.png`}
                            alt=""
                            onError={() => setAssetErrors((prev) => ({ ...prev, [`stage-avatar-frame:${activeFrameId}`]: true }))}
                          />
                        ) : null}
                      </>
                    ) : (
                      <div className="up2-loadout-fallback">{classBadge.icon}</div>
                    )}
                  </div>
                </div>
              </div>

                <div className="up2-stage-footer">
                <div className="up2-strip-card">
                  <div className="up2-kicker">Pulso de progreso</div>
                  <h3>{currentStage.label}</h3>
                  <p>{currentStage.desc}</p>
                  <ProgressMeter
                    value={xp}
                    max={xpNext}
                    tone={theme.accent}
                    label="Paso al siguiente nivel"
                    valueLabel={`${xpPct}%`}
                  />
                </div>
                <div className="up2-strip-card">
                  <div className="up2-kicker">Siguiente salto</div>
                  <h3>{nextStage ? nextStage.label : "Forma maxima"}</h3>
                  <p>
                    {nextStage
                      ? etaDays
                        ? `Manteniendo este ritmo, puedes tocar la siguiente forma en ${etaDays} dias.`
                        : "Una semana con mejor XP ya acelera la siguiente forma."
                      : "Tu build ya esta en la cima actual del personaje."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="up2-panel">
            <div className="up2-tabs">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`up2-tab${active ? " is-active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.label}</span>
                    {tab.badge ? <span className="up2-tab-badge">{tab.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === "personaje" ? (
            <>
              <section className="up2-band">
                <div className="up2-panel">
                  <div className="up2-panel-pad">
                    <div className="up2-section-head">
                      <div>
                        <div className="up2-kicker">Ruta del cuerpo</div>
                        <h2 className="up2-panel-title">Mapa de formas</h2>
                        <p>Fases claras, hito exacto y lectura rápida de avance.</p>
                      </div>
                      <span className="up2-tag is-estimate">Ruta por nivel real</span>
                    </div>

                    <div className="up2-journey">
                      {(() => {
                        const STAGE_ICONS = [
                          "/ui/medals/medal-bronze.png",
                          "/ui/medals/medal-silver.png",
                          "/ui/icon-energy.png",
                          "/ui/medals/medal-gold.png",
                          "/ui/medals/rank-crown.png",
                        ];
                        return STAGES.map((stage) => {
                          const isCurrent = viewedStage.id === stage.id;
                          const unlocked = currentStage.id >= stage.id;
                          const progress = getStageProgress(stage, level, xpPct);
                          const milestone = getStageMilestone(stage, currentStage, level);
                          const tone = stage.id === 1 ? "#8f85a8" : stage.id === 2 ? theme.secondary : stage.id === 3 ? theme.accent : stage.id === 4 ? "#c08aff" : "#f6b44b";
                          const statusLabel = unlocked ? (stage.id === currentStage.id ? "Etapa activa" : "Desbloqueada") : "Bloqueada";
                          return (
                            <motion.button
                              key={stage.id}
                              type="button"
                              className={`up2-phase-card${isCurrent ? " is-current" : ""}${!unlocked ? " is-locked" : ""}`}
                              style={{ "--tone": tone }}
                              onClick={() => setViewedPhase(stage.id)}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="up2-flip-inner">
                                {/* ── FRENTE ── */}
                                <div className="up2-flip-front">
                                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                    <span className="up2-phase-index">{stage.id}</span>
                                    <img
                                      className="up2-phase-icon"
                                      src={STAGE_ICONS[stage.id - 1]}
                                      alt=""
                                      onError={e => { e.currentTarget.style.display = "none"; }}
                                    />
                                  </div>
                                  <div className="up2-phase-name">{stage.label}</div>
                                  <div className="up2-phase-chiprow">
                                    <span className="up2-phase-chip">Lv {stage.min}{stage.max >= 999 ? "+" : `-${stage.max}`}</span>
                                    <span className="up2-phase-chip">{unlocked ? (stage.id === currentStage.id ? "Activa" : "Abierta") : "Bloqueada"}</span>
                                  </div>
                                  <ProgressMeter value={progress} max={100} tone={tone} />
                                  <span className="up2-tag" style={{ marginTop:"auto" }}>{statusLabel}</span>
                                </div>
                                {/* ── REVERSO ── */}
                                <div className="up2-flip-back">
                                  <div className="up2-flip-back-title">{stage.label}</div>
                                  <div className="up2-flip-detail-row">
                                    <img src="/ui/icon-energy.png" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
                                    <span>{stage.bonus}</span>
                                  </div>
                                  <div className="up2-flip-detail-row">
                                    <img src="/ui/icons/quest-cardio.png" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
                                    <span>{stage.focus}</span>
                                  </div>
                                  <div className="up2-flip-detail-row">
                                    <img src="/ui/header/notifications/notif-quest.png" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
                                    <span>{stage.unlocks}</span>
                                  </div>
                                  <div className="up2-flip-milestone">{milestone}</div>
                                </div>
                              </div>
                            </motion.button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </section>

              <section className="up2-main-grid">
                <div className="up2-stack">
                <div className="up2-panel">
                  <div className="up2-panel-pad">
                    <div className="up2-section-head">
                        <div>
                          <div className="up2-kicker">Bitacora fisica</div>
                          <h2 className="up2-panel-title">Estadisticas centrales</h2>
                        <p>Lectura rápida de tus cuatro atributos base.</p>
                      </div>
                      {hasEstimatedPrimaryStats ? <span className="up2-tag is-estimate">Base estimada</span> : null}
                    </div>

                    <div className="up2-build-list">
                      {primaryStats.map((stat) => (
                        <div key={stat.key} className="up2-build-row">
                          <img className="up2-icon up2-icon--lg" src={stat.asset} alt="" />
                          <div>
                            <strong>{stat.label}</strong>
                            <span>{stat.estimated ? "Lectura estimada" : "Lectura real"}</span>
                          </div>
                          <div style={{ width: "min(180px, 34vw)" }}>
                            <ProgressMeter value={stat.value} max={100} tone={stat.tone} label={stat.estimated ? "Estimado" : "Real"} valueLabel={`${stat.value}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                <div className="up2-stack">
                  <div className="up2-panel">
                    <div className="up2-panel-pad">
                      <div className="up2-section-head">
                        <div>
                          <div className="up2-kicker">Subatributos</div>
                          <h2 className="up2-panel-title">Detalle de build</h2>
                          <p>Cuatro lecturas finas para calidad, control y recuperación.</p>
                        </div>
                        {hasEstimatedSecondaryStats ? <span className="up2-tag is-estimate">Calculado con progreso real</span> : null}
                      </div>

                      <div className="up2-build-summary">
                        <strong>{buildSummary.title}</strong>
                        <span>{buildSummary.lead}</span>
                        <small>{buildSummary.note}</small>
                      </div>

                      <div className="up2-compact-grid">
                        {secondaryStats.map((stat) => (
                          <div key={stat.key} className="up2-card-plain">
                            <strong>{stat.label}</strong>
                            <span>{stat.estimated ? "Derivado" : "Registrado"}</span>
                            <ProgressMeter value={stat.value} max={100} tone={stat.tone} label={stat.estimated ? "Derivado" : "Estado"} valueLabel={`${stat.value}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="up2-stack">
                  <div className="up2-panel">
                    <div className="up2-panel-pad">
                    <div className="up2-section-head">
                      <div>
                        <div className="up2-kicker">Resumen util</div>
                        <h2 className="up2-panel-title">Economia del personaje</h2>
                        <p>Recursos, energía y marcas sin pared de texto.</p>
                      </div>
                    </div>

                    <div className="up2-utility">
                      {[
                        { label:"Reserva",    value: coins.toLocaleString(),                      note:"Coins",    icon:"/ui/icon-gold.png" },
                        { label:"Gemas",      value: gems.toLocaleString(),                       note:"Raras",    icon:"/ui/icon-gem.png" },
                        { label:"Misiones",   value: misiones.toLocaleString(),                   note:"Completas",icon:"/ui/header/section-misiones.png" },
                        { label:"Tiempo",     value: tiempoTotal,                                 note:"Acumulado",icon:"/ui/header/section-ejercicios.png" },
                        { label:"Rec. peso",  value: recordPeso ? `${recordPeso} kg` : "--",     note:"Pico",     icon:"/ui/icons/quest-fuerza.png" },
                        { label:"Calorías",   value: calorias > 0 ? calorias.toLocaleString() : "--", note:"Registradas", icon:"/ui/icon-energy.png" },
                      ].map((item) => (
                        <div key={item.label} className="up2-utility-card">
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                            <div className="up2-utility-note" style={{ letterSpacing:".08em" }}>{item.label}</div>
                            <img src={item.icon} alt="" style={{ width:18, height:18, objectFit:"contain", opacity:.7 }} onError={e => { e.currentTarget.style.display="none"; }} />
                          </div>
                          <div className="up2-utility-value">{item.value}</div>
                          <div className="up2-utility-note" style={{ marginTop:4 }}>{item.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </section>

              <section className="up2-band">
                <div className="up2-panel">
                  <div className="up2-panel-pad">
                    <div className="up2-section-head">
                      <div>
                        <div className="up2-kicker">Carga util</div>
                        <h2 className="up2-panel-title">Loadout actual</h2>
                        <p>Tres piezas clave arriba; ficha completa al desplegar.</p>
                      </div>
                    </div>

                    <div className="up2-loadout">
                      {[
                        {
                          title: "Avatar equipado",
                          note: activeAvatarMeta?.nombre || activeAvatarId,
                          rarity: activeAvatarMeta?.rareza || "Comun",
                          kind: "cosmetic",
                          kindAsset: "/ui/shop/icons/shop-cosmetic.png",
                          rarityFrameAsset: activeAvatarMeta?.rareza === "Legendario" ? "/ui/rarity/rarity-legendary.png" : null,
                          tooltip: "Avatar de perfil para tablero, home y presencia social del heroe.",
                          meta: [
                            ["Rareza", activeAvatarMeta?.rareza || "Comun"],
                            ["Origen", activeAvatarMeta?.precio > 0 ? "Mercado del gremio" : "Base del perfil"],
                            ["Tipo", "Cosmetico de perfil"],
                            ["Equipado", avatarEquippedAt],
                          ],
                          preview: (
                            <div className="up2-loadout-preview">
                              {!assetErrors[`avatar:${activeAvatarId}`] ? (
                                <>
                                  <img
                                    className="up2-loadout-avatar"
                                    src={getAvatarImage(activeAvatarId)}
                                    alt={activeAvatarMeta?.nombre || activeAvatarId}
                                    onError={() => setAssetErrors((prev) => ({ ...prev, [`avatar:${activeAvatarId}`]: true }))}
                                  />
                                  {activeFrameId && !assetErrors[`frame:${activeFrameId}`] ? (
                                    <img
                                      className="up2-loadout-frame"
                                      src={`/marcos/${activeFrameId}.png`}
                                      alt={activeFrameMeta?.nombre || activeFrameId}
                                      onError={() => setAssetErrors((prev) => ({ ...prev, [`frame:${activeFrameId}`]: true }))}
                                    />
                                  ) : null}
                                </>
                              ) : (
                                <div className="up2-loadout-fallback">{classBadge.icon}</div>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "Skin activa",
                          note: skinMeta.name,
                          rarity: skinMeta.rarity,
                          kind: "cosmetic",
                          kindAsset: "/ui/shop/icons/shop-cosmetic.png",
                          rarityFrameAsset: skinMeta.rarity === "Legendaria" ? "/ui/rarity/rarity-legendary.png" : null,
                          tooltip: "Skin principal que cambia el heroe grande y el tono visual del personaje.",
                          meta: [
                            ["Rareza", skinMeta.rarity],
                            ["Origen", skinMeta.origin],
                            ["Tipo", skinMeta.type],
                            ["Equipado", skinEquippedAt],
                          ],
                          preview: (
                            <div className="up2-loadout-preview">
                              {!assetErrors[`skin:${activeSkinId}`] ? (
                                <img
                                  className="up2-loadout-skin"
                                  src={activeSkinPreview}
                                  alt={activeSkinId}
                                  onError={() => setAssetErrors((prev) => ({ ...prev, [`skin:${activeSkinId}`]: true }))}
                                />
                              ) : (
                                <div className="up2-loadout-fallback">S</div>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "Insignia de etapa",
                          note: currentStage.id >= 4 ? "Rareza alta y presencia visible" : "Tramo en crecimiento firme",
                          rarity: currentStage.id >= 5 ? "Legendaria" : currentStage.id >= 4 ? "Epica" : "Rara",
                          kind: "functional",
                          kindAsset: "/ui/shop/icons/shop-service.png",
                          rarityFrameAsset: currentStage.id >= 5 ? "/ui/rarity/rarity-legendary.png" : null,
                          tooltip: "Sello funcional del mapa de formas. Resume avance real y presencia actual dentro del juego.",
                          meta: [
                            ["Rareza", currentStage.id >= 5 ? "Legendaria" : currentStage.id >= 4 ? "Epica" : "Rara"],
                            ["Origen", "Mapa de formas"],
                            ["Tipo", "Sello funcional"],
                            ["Activo", `Desde nivel ${currentStage.min}`],
                          ],
                          preview: (
                            <div className="up2-loadout-preview">
                              <img
                                className="up2-loadout-skin"
                                src={currentStage.id >= 4 ? "/ui/rarity/rarity-legendary.png" : "/ui/rarity/rarity-rare.png"}
                                alt=""
                              />
                            </div>
                          ),
                        },
                      ].map((slot) => (
                        <div
                          key={slot.title}
                          className={`up2-loadout-slot is-${slot.kind}`}
                          data-tooltip={slot.tooltip}
                          title={slot.tooltip}
                        >
                          <div className="up2-loadout-kind">
                            <img src={slot.kindAsset} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                          </div>
                          <div className="up2-slot-top">
                            <strong>{slot.title}</strong>
                            {slot.preview}
                          </div>
                          {slot.rarityFrameAsset ? (
                            <img
                              className="up2-loadout-rarity-frame"
                              src={slot.rarityFrameAsset}
                              alt=""
                              onError={(event) => { event.currentTarget.style.display = "none"; }}
                            />
                          ) : null}
                          <span className="up2-loadout-rarity">{slot.rarity}</span>
                          <span>{slot.note}</span>
                          <details className="up2-loadout-more">
                            <summary>Ver ficha</summary>
                            <div className="up2-loadout-meta">
                              {slot.meta.map(([label, value]) => (
                                <div key={label} className="up2-loadout-line">
                                  <span>{label}</span>
                                  <span>{value}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="up2-band">
                <div className="up2-panel">
                  <div className="up2-panel-pad">
                    <div className="up2-section-head">
                      <div>
                        <div className="up2-kicker">Marcas del heroe</div>
                        <h2 className="up2-panel-title">Medallas recientes</h2>
                        <p>Sellos recientes con estado claro y menos ruido.</p>
                      </div>
                      {hasDerivedMedals ? <span className="up2-tag is-estimate">Sellos derivados</span> : null}
                    </div>

                    <div className="up2-journey-marks">
                      {medalCards.map((medal) => (
                        <div key={medal.key} className={`up2-medal is-${medal.visualState}`}>
                          {medal.frameAsset ? (
                            <img className="up2-medal-frame" src={medal.frameAsset} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                          ) : null}
                          <img src={medal.asset} alt="" />
                          <div>
                            <div className="up2-medal-name">{medal.displayName}</div>
                            <div className="up2-medal-note">{medal.displayDetail}</div>
                            <div className="up2-medal-state">{medal.displayState}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="up2-skill-wrap">
              <div className="up2-panel up2-skill-hero">
                <div className="up2-panel-pad">
                  <div className="up2-skill-head">
                    <div className="up2-skill-copy">
                      <div className="up2-section-head">
                        <div>
                          <div className="up2-kicker">Talentos vivos</div>
                          <h2 className="up2-panel-title">Mesa de habilidades</h2>
                        </div>
                      </div>
                      <p>
                        Abre talentos con una lectura mas limpia: estado rapido arriba y ayuda puntual solo cuando la necesites.
                      </p>
                      <div className="up2-skill-chipline">
                        <span className="up2-skill-pill">
                          Clase <strong>{classBadge.label}</strong>
                        </span>
                        <span className="up2-skill-pill">
                          Nivel <strong>{level}</strong>
                        </span>
                        <span className="up2-skill-pill">
                          Puntos <strong>{skillPoints}</strong>
                        </span>
                        <span className="up2-skill-pill">
                          Afinidad <strong>{classSkillHint.recommendation}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="up2-skill-hud">
                    <div className="up2-skill-box is-compact">
                      <strong>Estado del arbol</strong>
                      <span>{skillPoints > 0 ? `${skillPoints} puntos listos para invertir.` : "Sin puntos nuevos por ahora."}</span>
                      <div className="up2-skill-inline">
                        <span>Clase <strong>{classBadge.label}</strong></span>
                        <span>Nivel <strong>{level}</strong></span>
                        <span>Ruta <strong>{classSkillHint.nodes.split(",")[0]}</strong></span>
                      </div>
                    </div>
                    <details className="up2-skill-mini">
                      <summary>
                        <strong>Recomendacion por clase</strong>
                        <span>{classSkillHint.recommendation}</span>
                      </summary>
                      <div className="up2-skill-mini-body">
                        <p>Usa esta pista para priorizar nodos que de verdad empujen tu estilo antes de repartir puntos en todo el arbol.</p>
                        <small>La afinidad cambia el orden recomendado, no bloquea ramas.</small>
                      </div>
                    </details>
                    <details className="up2-skill-mini">
                      <summary>
                        <strong>Nodos sugeridos hoy</strong>
                        <span>{classSkillHint.nodes}</span>
                      </summary>
                      <div className="up2-skill-mini-body">
                        <p>{skillPoints > 0 ? "Si quieres gastar rapido, empieza por esta linea y luego abre soporte o recuperacion." : "Cierra sesiones, misiones o logros para volver con puntos y abrir esta linea sin perder ritmo."}</p>
                        <small>Ganas 1 punto por nivel y el resto del arbol queda siempre disponible.</small>
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              <div className="up2-panel up2-skill-tree-panel">
                <div className="up2-panel-pad">
                  <SkillTree profile={profile} />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
