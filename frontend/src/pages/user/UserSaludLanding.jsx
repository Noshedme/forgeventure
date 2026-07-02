import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../../firebase.js";
import { getSaludSummary, saveSaludCheckin, saveSaludState } from "../../services/api.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";

const UI = {
  bg: "#070610",
  panel: "#100d1d",
  panelAlt: "#161126",
  line: "rgba(255,255,255,.08)",
  text: "#f7f1ff",
  muted: "#b5a8c7",
  deepMuted: "#7f7394",
  gold: "#f3c969",
  success: "#80d39b",
  danger: "#ff6f7d",
  cyan: "#5ad8ff",
};

const HEALTH_ASSETS = {
  section: { src: "/ui/header/section-salud.png", fallback: "/ui/header/section-mente.png" },
  hero: {
    general: { src: "/ui/health/hero/health-stage-library.png", fallback: "/missions/journal/journal-bg.png" },
    ejercicio: { src: "/ui/health/hero/health-stage-movement.png", fallback: "/exercises/summary/sum-zones.png" },
    respiracion: { src: "/ui/health/hero/health-stage-breath.png", fallback: "/exercises/summary/sum-logbook.png" },
    hidratacion: { src: "/ui/health/hero/health-stage-water.png", fallback: "/missions/journal/journal-bg.png" },
    nutricion: { src: "/ui/health/hero/health-stage-nutrition.png", fallback: "/missions/journal/journal-bg.png" },
  },
  seal: {
    sueno: { src: "/ui/health/seals/seal-sleep.png", fallback: "/ui/stat-men.png" },
    agua: { src: "/ui/health/seals/seal-water.png", fallback: "/ui/icons/quest-hidratacion.png" },
    nutricion: { src: "/ui/health/seals/seal-nutrition.png", fallback: "/ui/icons/quest-nutricion.png" },
    movimiento: { src: "/ui/health/seals/seal-movement.png", fallback: "/ui/stat-str.png" },
  },
};

const TABS = [
  {
    id: "general",
    label: "Base",
    color: "#c08aff",
    asset: "/ui/health/modules/module-general.png",
    fallbackAsset: "/ui/stat-men.png",
    kicker: "Vision global",
    title: "Base real de bienestar",
    lead: "Movimiento, recuperacion y habitos diarios ordenados para que el progreso fisico no quede cojo.",
  },
  {
    id: "ejercicio",
    label: "Movimiento",
    color: "#ff6f7d",
    asset: "/ui/health/modules/module-movement.png",
    fallbackAsset: "/ui/stat-str.png",
    kicker: "Campo fisico",
    title: "Entrenamiento con estructura",
    lead: "Aprende frecuencia, volumen y tipos de trabajo sin perder tiempo en consejos sueltos.",
  },
  {
    id: "respiracion",
    label: "Respiracion",
    color: "#5ad8ff",
    asset: "/ui/health/modules/module-breath.png",
    fallbackAsset: "/missions/seals/seal-mind.png",
    kicker: "Control del pulso",
    title: "Foco y calma aplicados",
    lead: "Tecnicas concretas para regular esfuerzo, bajar ruido y mejorar recuperacion.",
  },
  {
    id: "hidratacion",
    label: "Hidratacion",
    color: "#4cc9f0",
    asset: "/ui/health/modules/module-water.png",
    fallbackAsset: "/ui/icons/quest-hidratacion.png",
    kicker: "Reserva corporal",
    title: "Agua con criterio",
    lead: "Cuanto, cuando y como reponer para rendir mejor sin improvisar.",
  },
  {
    id: "nutricion",
    label: "Nutricion",
    color: "#80d39b",
    asset: "/ui/health/modules/module-nutrition.png",
    fallbackAsset: "/ui/icons/quest-nutricion.png",
    kicker: "Mesa del heroe",
    title: "Comer para avanzar",
    lead: "Macros, timing y mitos explicados como recursos utiles, no como ruido de internet.",
  },
];

const SALUD_TAB_META = Object.fromEntries(
  TABS.map((tab) => [
    tab.id,
    {
      ...tab,
      reward:
        tab.id === "ejercicio"
          ? "tecnica, carga y ritmo"
          : tab.id === "respiracion"
            ? "foco, pulso y cierre"
            : tab.id === "hidratacion"
              ? "agua, claridad y reposicion"
              : tab.id === "nutricion"
                ? "energia, macros y timing"
                : "base, descanso y consistencia",
    },
  ])
);

const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id));
const SALUD_STORAGE_KEY = "fv_user_salud_tab";
const getSaludStorageKey = (uid) => `${SALUD_STORAGE_KEY}-${uid || "guest"}`;
const saludClientCache = new Map();
const SALUD_CLIENT_TTL = 45_000;

const GENERAL_PILLARS = [
  {
    title: "Movimiento",
    stat: "150 min/sem",
    color: "#ff6f7d",
    asset: "/ui/stat-str.png",
    text: "La actividad regular baja riesgo cardiovascular, mejora estado de animo y protege masa muscular con el tiempo.",
  },
  {
    title: "Nutricion",
    stat: "80% del resultado",
    color: "#80d39b",
    asset: "/ui/icons/quest-nutricion.png",
    text: "La cocina define energia, recuperacion y composicion corporal mucho antes de que el entreno pueda corregirlo.",
  },
  {
    title: "Recuperacion",
    stat: "7-9 h sueno",
    color: "#5ad8ff",
    asset: "/ui/stat-men.png",
    text: "Dormir poco eleva cortisol, desordena apetito y frena adaptaciones. Sin descanso, el cuerpo no consolida progreso.",
  },
];

const SCIENCE_FACTS = [
  { value: "30%", color: "#ff6f7d", title: "menos riesgo cardiovascular", text: "Con actividad moderada semanal sostenida.", source: "OMS | guias globales de actividad fisica" },
  { value: "40%", color: "#80d39b", title: "mejora del estado de animo", text: "El ejercicio aerobico ayuda a reducir sintomas depresivos leves.", source: "revisiones sistematicas en salud mental y ejercicio" },
  { value: "1.5x", color: "#5ad8ff", title: "mas longevidad en activos", text: "Moverse bien durante anos protege salud metabolica y funcional.", source: "cohortes poblacionales sobre actividad y mortalidad" },
  { value: "26%", color: "#f3c969", title: "menos riesgo de diabetes tipo 2", text: "Cuando se combina actividad fisica y alimentacion adecuada.", source: "metaanalisis de intervencion en habitos cardiometabolicos" },
];

const DAILY_CHECKS = [
  { label: "30 min de movimiento", sub: "Caminar, entrenar o subir escaleras", color: "#ff6f7d" },
  { label: "Agua repartida durante el dia", sub: "Sube la dosis si hace calor o entrenas", color: "#4cc9f0" },
  { label: "Proteina en comidas principales", sub: "Base de recuperacion y saciedad", color: "#80d39b" },
  { label: "5 min de respiracion consciente", sub: "Antes de dormir, antes de entrenar o al cerrar trabajo", color: "#c08aff" },
  { label: "Corte de pantallas antes del sueno", sub: "La luz azul juega contra tu melatonina", color: "#f3c969" },
  { label: "Luz natural al despertar", sub: "Ayuda a ordenar ritmo circadiano", color: "#5ad8ff" },
];

const EXERCISE_TYPES = [
  {
    title: "Cardio aerobico",
    color: "#5ad8ff",
    asset: "/exercises/daily/daily-zone-cardio.png",
    anatomy: "/exercises/detail/anatomy-cardio.png",
    freq: "150-300 min/sem",
    benefits: ["Corazon y pulmones", "Resistencia", "Quema calorica", "Mejor animo"],
  },
  {
    title: "Fuerza",
    color: "#ff6f7d",
    asset: "/exercises/daily/daily-zone-fuerza.png",
    anatomy: "/exercises/detail/anatomy-fuerza.png",
    freq: "2-4 dias/sem",
    benefits: ["Masa muscular", "Densidad osea", "Postura", "Metabolismo"],
  },
  {
    title: "Movilidad",
    color: "#c08aff",
    asset: "/exercises/daily/daily-zone-flexibilidad.png",
    anatomy: "/exercises/detail/anatomy-flexibilidad.png",
    freq: "10-15 min diarios",
    benefits: ["Rango articular", "Menos rigidez", "Mejor tecnica", "Recuperacion"],
  },
  {
    title: "HIIT funcional",
    color: "#f3c969",
    asset: "/exercises/daily/daily-zone-hiit.png",
    anatomy: "/exercises/detail/anatomy-hiit.png",
    freq: "1-2 dias/sem",
    benefits: ["Potencia", "Pulso alto en poco tiempo", "Coordinacion", "Capacidad de trabajo"],
  },
];

const EXERCISE_PRINCIPLES = [
  { title: "Sobrecarga progresiva", text: "Si el cuerpo recibe siempre el mismo estimulo, deja de adaptarse. Sube peso, reps o dificultad de forma gradual." },
  { title: "Especificidad", text: "Entrenas lo que practicas. Si quieres correr mejor, corre; si quieres levantar mas, levanta mejor." },
  { title: "Recuperacion real", text: "Las mejoras llegan cuando descansas y asimilas la carga. Dormir bien y separar esfuerzos parecidos sigue siendo clave." },
  { title: "Consistencia", text: "Tres sesiones sostenidas durante meses ganan por goleada a las semanas heroicas que luego se abandonan." },
];

const BREATH_TECHNIQUES = [
  {
    title: "Box breathing",
    color: "#5ad8ff",
    pattern: "4 - 4 - 4 - 4",
    use: "Foco, estres agudo y antes de una sesion exigente.",
    text: "Inhala, reten, exhala y pausa con la misma duracion para bajar ruido sin perder energia.",
  },
  {
    title: "4-7-8",
    color: "#c08aff",
    pattern: "4 - 7 - 8",
    use: "Antes de dormir o cuando necesitas desacelerar rapido.",
    text: "La exhalacion larga empuja al sistema parasimpatico y reduce activacion interna con bastante eficacia.",
  },
  {
    title: "Diafragmatica",
    color: "#80d39b",
    pattern: "5 - 1 - 6",
    use: "Como respiracion base durante el dia o entre series.",
    text: "Pecho quieto, abdomen activo. Es la forma mas util para volver a respirar mejor fuera del papel.",
  },
];

const HYDRATION_FLOW = [
  { time: "06:30", qty: "400 ml", label: "Despertar", detail: "Reactivar hidratacion tras la noche", color: "#f3c969" },
  { time: "10:00", qty: "500 ml", label: "Media manana", detail: "Sostener foco y rendimiento mental", color: "#5ad8ff" },
  { time: "13:00", qty: "400 ml", label: "Almuerzo", detail: "Ayudar digestion y controlar fatiga", color: "#80d39b" },
  { time: "17:00", qty: "500 ml", label: "Antes o despues de entrenar", detail: "Reponer sudor y rendimiento", color: "#ff6f7d" },
  { time: "20:30", qty: "250 ml", label: "Cierre del dia", detail: "Completar sin exagerar antes de dormir", color: "#c08aff" },
];

const HYDRATION_WARNINGS = [
  "Sed fuerte ya suele significar que llegaste tarde.",
  "Color de orina muy oscuro suele apuntar a falta de agua.",
  "Entrenos largos o dias calurosos piden sodio y no solo agua.",
];

const NUTRITION_BLOCKS = [
  {
    title: "Proteinas",
    asset: "/items/consumables/pocion_fuerza.png",
    color: "#ff6f7d",
    dose: "1.6 - 2.2 g/kg",
    use: "Recuperacion, masa muscular y saciedad.",
  },
  {
    title: "Carbohidratos",
    asset: "/items/consumables/pocion_poder.png",
    color: "#f3c969",
    dose: "3 - 5 g/kg",
    use: "Energia para entrenar y sostener volumen.",
  },
  {
    title: "Grasas saludables",
    asset: "/items/consumables/pocion_mana.png",
    color: "#5ad8ff",
    dose: "0.8 - 1.2 g/kg",
    use: "Hormonas, salud cardiovascular y absorcion de vitaminas.",
  },
];

const NUTRITION_MYTHS = [
  {
    myth: "Hay que comer cada 2 horas para activar metabolismo.",
    truth: "Lo importante sigue siendo el total diario. La frecuencia ayuda por comodidad, no por magia metabolica.",
  },
  {
    myth: "Las grasas siempre engordan.",
    truth: "Engorda el exceso calorico sostenido. Las grasas de calidad siguen siendo parte de un cuerpo funcional.",
  },
  {
    myth: "Sin suplementos no progresas.",
    truth: "Primero manda la comida base, el descanso y el entrenamiento. El suplemento solo rellena huecos.",
  },
];

const NUTRITION_GOALS = [
  {
    title: "Mantenimiento",
    color: "#5ad8ff",
    detail: "Sostener peso, energia y hambre bajo control con una base estable y flexible.",
    focus: ["Proteina estable", "Carbos acordes al gasto", "Comidas repetibles"],
  },
  {
    title: "Perdida de grasa",
    color: "#ff6f7d",
    detail: "Bajar calorias sin romper rendimiento ni adherencia. Menos castigo, mas precision.",
    focus: ["Deficit moderado", "Fibra y saciedad", "Pasos y fuerza constantes"],
  },
  {
    title: "Rendimiento",
    color: "#80d39b",
    detail: "Empujar entreno y recuperacion con mas energia util alrededor de sesiones exigentes.",
    focus: ["Carbos alrededor del entreno", "Hidratacion + sodio", "Recuperacion post sesion"],
  },
];

const MODULE_COMMON_MISTAKES = {
  general: [
    "Querer corregir todo a la vez en lugar de ordenar una base simple.",
    "Dormir mal varios dias y esperar que el entreno compense.",
    "Saltarse agua y comida base hasta que el cuerpo ya llegue cansado.",
  ],
  ejercicio: [
    "Subir volumen antes de consolidar tecnica y frecuencia.",
    "Copiar rutinas duras sin leer recuperacion ni contexto actual.",
    "Pensar que mas sudor siempre significa mejor progreso.",
  ],
  respiracion: [
    "Usarla solo cuando todo ya esta fuera de control.",
    "Respirar rapido por pecho y confundir activacion con energia.",
    "Hacer tecnicas complejas sin constancia en una base simple.",
  ],
  hidratacion: [
    "Tomar casi toda el agua de golpe al final del dia.",
    "Esperar a tener sed fuerte para empezar a reponer.",
    "Olvidar sodio y contexto cuando hace calor o el entreno se alarga.",
  ],
  nutricion: [
    "Cambiar de estrategia cada semana por ruido de redes.",
    "Bajar demasiado los carbohidratos cuando el rendimiento los necesita.",
    "Perseguir suplementos antes de ordenar comida base y horarios utiles.",
  ],
};

const MODULE_TODAY_GUIDE = {
  general: {
    title: "Archivo del cuerpo",
    text: "Base de sueño, agua y movimiento antes de pedirle heroicidades al cuerpo.",
    asset: HEALTH_ASSETS.section,
  },
  ejercicio: {
    title: "Carga y frecuencia",
    text: "Hoy conviene leer volumen, tecnica y margen de recuperacion antes de sumar mas trabajo.",
    asset: HEALTH_ASSETS.seal.movimiento,
  },
  respiracion: {
    title: "Pulso y enfoque",
    text: "Usa respiracion util para bajar ruido, ordenar esfuerzo y cerrar mejor el dia.",
    asset: HEALTH_ASSETS.seal.sueno,
  },
  hidratacion: {
    title: "Reserva del dia",
    text: "Distribuye agua y reposicion antes de que la claridad y el rendimiento se caigan.",
    asset: HEALTH_ASSETS.seal.agua,
  },
  nutricion: {
    title: "Mesa util",
    text: "Diferencia objetivo, cantidad y timing para no comer bien pero apuntar al sitio equivocado.",
    asset: HEALTH_ASSETS.seal.nutricion,
  },
};

const CSS = `
  .ush-page {
    min-height: 100%;
    padding: 18px 18px 40px;
    color: ${UI.text};
    background:
      radial-gradient(circle at 12% 14%, color-mix(in srgb, var(--salud-accent), transparent 86%), transparent 26%),
      radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--salud-secondary), transparent 90%), transparent 26%),
      linear-gradient(180deg, #08050f 0%, var(--salud-bg) 52%, #07050e 100%);
    position: relative;
  }
  .ush-page::before {
    content: "";
    position: fixed;
    inset: 60px 0 0 0;
    pointer-events: none;
    opacity: .13;
    background: url("/ui/dashboard-particles.png") center/cover;
    mix-blend-mode: screen;
  }
  .ush-shell {
    position: relative;
    z-index: 1;
    width: min(100%, 1460px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .ush-card {
    position: relative;
    overflow: hidden;
    border-radius: 22px;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 80%);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 94%), transparent 18%),
      linear-gradient(180deg, rgba(12,9,24,.96), rgba(9,7,18,.96));
    box-shadow: 0 22px 60px rgba(0,0,0,.32), 0 0 28px color-mix(in srgb, var(--salud-accent), transparent 92%), inset 0 1px 0 rgba(255,255,255,.04);
  }
  .ush-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr);
    gap: 18px;
    padding: 22px;
  }
  .ush-hero-copy {
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: center;
    min-width: 0;
  }
  .ush-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .ush-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    color: ${UI.muted};
    font: 700 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .ush-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .ush-kpi {
    padding: 14px 14px 12px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 82%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 94%), rgba(255,255,255,.015));
  }
  .ush-stage {
    position: relative;
    min-height: 370px;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 78%);
    background:
      radial-gradient(circle at 20% 18%, color-mix(in srgb, var(--salud-accent), transparent 78%), transparent 24%),
      linear-gradient(180deg, rgba(13,9,26,.96), rgba(9,7,18,.96));
  }
  .ush-stage img.ush-stage-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: .34;
    filter: saturate(1.04) brightness(.78);
  }
  .ush-stage::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(8,6,16,.18), rgba(8,6,16,.9)),
      radial-gradient(circle at 72% 18%, color-mix(in srgb, var(--salud-secondary), transparent 72%), transparent 22%);
  }
  .ush-stage-overlay {
    position: relative;
    z-index: 1;
    height: 100%;
    padding: 18px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 14px;
  }
  .ush-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 18px 22px;
  }
  .ush-node {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 84%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 94%), rgba(255,255,255,.02));
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .ush-node:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--salud-accent), transparent 60%);
    box-shadow: 0 16px 28px color-mix(in srgb, var(--salud-accent), transparent 92%);
  }
  .ush-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 16px;
    align-items: start;
  }
  .ush-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .ush-side {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: sticky;
    top: 18px;
  }
  .ush-tab-wrap {
    padding: 14px;
  }
  .ush-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .ush-tab {
    appearance: none;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.025);
    color: ${UI.muted};
    border-radius: 999px;
    padding: 10px 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font: 600 13px/1.2 "Manrope", sans-serif;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, text-shadow .18s ease;
  }
  .ush-tab:hover {
    transform: translateY(-1px);
  }
  .ush-tab.active {
    color: #fff;
    border-color: color-mix(in srgb, var(--tab-color), transparent 24%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--tab-color), transparent 86%), rgba(255,255,255,.02));
    box-shadow: 0 0 26px color-mix(in srgb, var(--tab-color), transparent 88%);
    text-shadow: 0 0 18px color-mix(in srgb, var(--tab-color), transparent 20%), 0 0 36px color-mix(in srgb, var(--tab-color), transparent 55%);
  }
  .ush-tab-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .ush-panel {
    padding: 18px;
    border-top: 1px solid rgba(255,255,255,.06);
  }
  .ush-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ush-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .ush-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .ush-info-card {
    padding: 16px;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 84%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 94%), rgba(255,255,255,.02));
  }
  .ush-soft-card {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 86%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 95%), rgba(255,255,255,.018));
  }
  .ush-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ush-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .ush-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--salud-accent), transparent 84%);
    background: linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 94%), rgba(255,255,255,.018));
    color: ${UI.muted};
    font: 700 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .06em;
  }
  .ush-bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.06);
    overflow: hidden;
  }
  .ush-bar > span {
    display: block;
    height: 100%;
    border-radius: inherit;
  }
  @media (max-width: 1100px) {
    .ush-layout { grid-template-columns: 1fr; }
    .ush-side { position: static; }
  }
  @media (max-width: 980px) {
    .ush-hero { grid-template-columns: 1fr; }
  }
  @media (max-width: 900px) {
    .ush-strip, .ush-grid-3, .ush-grid-4 { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 680px) {
    .ush-page { padding: 14px 12px 28px; }
    .ush-hero, .ush-strip, .ush-panel { padding-left: 16px; padding-right: 16px; }
    .ush-kpis, .ush-grid-2, .ush-grid-3, .ush-grid-4 { grid-template-columns: 1fr; }
    .ush-tab { width: 100%; justify-content: space-between; }
  }
  .ush-info-card {
    position: relative;
    overflow: hidden;
    transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
  }
  .ush-info-card::before {
    content: "";
    position: absolute;
    top: 0; left: 14px; right: 14px;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--salud-accent), transparent 38%), transparent);
    opacity: 0;
    transition: opacity .22s ease;
  }
  .ush-info-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--salud-accent), transparent 52%);
    box-shadow: 0 14px 36px color-mix(in srgb, var(--salud-accent), transparent 88%), inset 0 0 24px color-mix(in srgb, var(--salud-accent), transparent 97%);
  }
  .ush-info-card:hover::before { opacity: 1; }
  .ush-soft-card {
    transition: border-color .18s ease, box-shadow .18s ease;
  }
  .ush-kpi {
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .ush-kpi:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--salud-accent), transparent 56%);
    box-shadow: 0 8px 22px color-mix(in srgb, var(--salud-accent), transparent 90%);
  }
  .ush-node {
    position: relative;
    overflow: hidden;
  }
  .ush-node::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--salud-accent), transparent 40%), transparent);
    opacity: 0;
    transition: opacity .22s ease;
  }
  .ush-node:hover::before { opacity: 1; }
  .ush-node:hover {
    border-color: color-mix(in srgb, var(--salud-accent), transparent 44%) !important;
    box-shadow: 0 12px 28px color-mix(in srgb, var(--salud-accent), transparent 88%) !important;
    background: linear-gradient(180deg, color-mix(in srgb, var(--salud-accent), transparent 88%), rgba(255,255,255,.025)) !important;
  }
  .ush-tab:hover {
    border-color: color-mix(in srgb, var(--tab-color,#c08aff), transparent 60%);
    box-shadow: 0 0 16px color-mix(in srgb, var(--tab-color,#c08aff), transparent 84%);
    color: #fff;
  }
  @keyframes ush-bar-grow {
    from { width: 0%; opacity: .6; }
  }
  .ush-bar > span { animation: ush-bar-grow .85s cubic-bezier(.4,0,.2,1) both; }
  @keyframes ush-shimmer-sweep {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(220%); }
  }
  .ush-btn-shimmer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: inherit;
  }
  .ush-btn-shimmer::after {
    content: "";
    position: absolute;
    top: 0; bottom: 0; left: 0;
    width: 42%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.13), transparent);
    animation: ush-shimmer-sweep 2.8s ease-in-out infinite;
  }
  .ush-xp-bar-wrap {
    margin-top: 12px;
  }
  .ush-xp-bar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 7px;
  }
  .ush-daily-check-card {
    position: relative;
    overflow: hidden;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid transparent;
    background: rgba(255,255,255,.025);
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .ush-daily-check-card:hover {
    transform: translateX(3px);
    border-color: color-mix(in srgb, var(--check-c, #c08aff), transparent 48%);
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--check-c, #c08aff), transparent 30%);
    background: color-mix(in srgb, var(--check-c, #c08aff), transparent 94%);
  }
  /* ── Flip cards ── */
  .ush-flip-card { perspective: 900px; cursor: pointer; }
  .ush-flip-inner {
    position: relative;
    transform-style: preserve-3d;
    transition: transform .46s cubic-bezier(.4,0,.2,1);
  }
  .ush-flip-card.is-flipped .ush-flip-inner { transform: rotateY(180deg); }
  .ush-flip-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .ush-flip-back {
    position: absolute;
    inset: 0;
    transform: rotateY(180deg);
  }
  /* ── Macro flip cards ── */
  .ush-macro-face {
    padding: 16px;
    border-radius: 18px;
    border: 1px solid;
    display: flex;
    flex-direction: column;
    gap: 0;
    transition: box-shadow .2s ease, border-color .2s ease;
  }
  .ush-flip-card:hover .ush-macro-face { box-shadow: 0 10px 28px rgba(0,0,0,.22); }
  /* ── Accordion chevron ── */
  .ush-chev {
    display: inline-block;
    font-size: 20px;
    line-height: 1;
    color: #7f7394;
    transition: transform .25s ease, color .18s ease;
    font-weight: 800;
    font-family: "Manrope", sans-serif;
  }
  .ush-chev.open { transform: rotate(90deg); color: #f7f1ff; }
  /* ── Myth flip mini cards ── */
  .ush-myth-face {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid;
  }
  /* ── Meal dots ── */
  @keyframes ush-dot-pop {
    0% { transform: scale(.7); opacity: .4; }
    60% { transform: scale(1.18); }
    100% { transform: scale(1); opacity: 1; }
  }
  .ush-meal-dot.filled { animation: ush-dot-pop .28s ease both; }
  /* ── Class hint strip ── */
  .ush-class-hint {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid;
    margin-bottom: 14px;
    background: rgba(255,255,255,.02);
    transition: border-color .18s ease, box-shadow .18s ease;
  }
  .ush-class-hint:hover {
    box-shadow: 0 0 20px color-mix(in srgb, var(--hint-c, #c08aff), transparent 80%);
    border-color: color-mix(in srgb, var(--hint-c, #c08aff), transparent 50%) !important;
  }
`;

function Img({ src, fallbackSrc, alt = "", style = {}, className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ objectFit: "contain", imageRendering: "pixelated", ...style }}
      onError={(e) => {
        if (fallbackSrc && !e.currentTarget.dataset.fallbackLoaded) {
          e.currentTarget.dataset.fallbackLoaded = "1";
          e.currentTarget.src = fallbackSrc;
          return;
        }
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

function ModuleActionBar({ title, hint, actions = [], accent = UI.cyan }) {
  return (
    <div className="ush-soft-card" style={{ marginBottom: 14, borderColor: `${accent}33`, background: `color-mix(in srgb, ${accent}, transparent 92%)` }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Progreso real
        </div>
        <div style={{ color: UI.text, font: '800 18px/1.15 "Manrope", sans-serif', marginBottom: 6 }}>{title}</div>
        <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{hint}</div>
      </div>
      <div className="ush-chip-row">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.ariaLabel || action.label}
            style={{
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${action.disabled ? "rgba(255,255,255,.08)" : `${accent}55`}`,
              background: action.disabled
                ? "rgba(255,255,255,.03)"
                : `linear-gradient(135deg, color-mix(in srgb, ${accent}, transparent 82%), rgba(255,255,255,.03))`,
              color: action.disabled ? UI.deepMuted : UI.text,
              borderRadius: 16,
              padding: "10px 14px",
              cursor: action.disabled ? "default" : "pointer",
              font: '700 13px/1 "Manrope", sans-serif',
              transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
            }}
            onMouseEnter={(e) => { if (!action.disabled) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}33`; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            {!action.disabled && <span className="ush-btn-shimmer" />}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function renderGeneralTab({ daily, onAction, loading }) {
  return (
    <div className="ush-panel">
      <ModuleActionBar
        accent={UI.gold}
        title={daily.sleep.done ? "Sueño base marcado" : "Abre el día con una señal real"}
        hint={daily.sleep.done
          ? `Sueño registrado${daily.general.done ? " y checklist base completado" : ""}.`
          : "Marca sueño o checklist base para que esta zona deje memoria real dentro del mapa."}
        actions={[
          {
            key: "sleep",
            label: daily.sleep.done ? `Dormiste ${daily.sleep.hours || 7}h+` : "Dormí 7h+",
            disabled: loading === "general:sleep" || daily.sleep.done,
            onClick: () => onAction("general", { mode: "sleep", hours: 7 }),
          },
          {
            key: "general",
            label: daily.general.done ? "Base lista" : "Marcar base",
            disabled: loading === "general:base" || daily.general.done,
            onClick: () => onAction("general", { mode: "base" }),
          },
        ]}
      />
      <div className="ush-grid-3" style={{ marginBottom: 14 }}>
        {GENERAL_PILLARS.map((pillar) => (
          <div key={pillar.title} className="ush-info-card">
            <Img src={pillar.asset} alt="" style={{ width: 48, height: 48, filter: `drop-shadow(0 0 10px ${pillar.color}88)` }} />
            <div style={{ marginTop: 10, color: pillar.color, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".08em", textTransform: "uppercase" }}>{pillar.stat}</div>
            <div style={{ marginTop: 8, font: '800 20px/1.1 "Manrope", sans-serif' }}>{pillar.title}</div>
            <p style={{ margin: "10px 0 0", color: UI.muted, font: '500 14px/1.62 "Manrope", sans-serif' }}>{pillar.text}</p>
          </div>
        ))}
      </div>

      <div className="ush-info-card" style={{ marginBottom: 14 }}>
        <div style={{ color: UI.gold, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14, textShadow: "0 0 14px rgba(243,201,105,.72), 0 0 28px rgba(243,201,105,.35)" }}>
          Lo que si cambia la partida
        </div>
        <div className="ush-grid-4">
          {SCIENCE_FACTS.map((fact) => (
            <div key={fact.title} className="ush-soft-card">
              <div style={{ color: fact.color, font: '900 40px/1 "Manrope", sans-serif', marginBottom: 10, textShadow: `0 0 22px ${fact.color}cc, 0 0 44px ${fact.color}55, 0 0 72px ${fact.color}22` }}>{fact.value}</div>
              <div style={{ font: '800 15px/1.25 "Manrope", sans-serif', marginBottom: 8 }}>{fact.title}</div>
              <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{fact.text}</div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div
                  title={fact.source}
                  aria-label={`Fuente orientativa: ${fact.source}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 9px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.02)",
                    color: UI.deepMuted,
                    font: '700 10px/1 "JetBrains Mono", monospace',
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  Fuente | {fact.source}
                </div>
                <span
                  title={fact.source}
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    border: `1px solid ${fact.color}44`,
                    color: fact.color,
                    font: '800 11px/1 "JetBrains Mono", monospace',
                    textShadow: `0 0 8px ${fact.color}`,
                  }}
                >
                  ?
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ush-info-card" style={{ marginBottom: 14 }}>
        <div style={{ color: UI.gold, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14, textShadow: "0 0 14px rgba(243,201,105,.72), 0 0 28px rgba(243,201,105,.35)" }}>
          Checklist diario base
        </div>
        <div className="ush-grid-2">
          {DAILY_CHECKS.map((check) => (
            <div
              key={check.label}
              className="ush-daily-check-card"
              style={{ "--check-c": check.color }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: check.color, boxShadow: `0 0 8px ${check.color}99`, flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ font: '700 13px/1.3 "Manrope", sans-serif', color: UI.text }}>{check.label}</div>
                  <div style={{ font: '500 12px/1.5 "Manrope", sans-serif', color: UI.muted, marginTop: 4 }}>{check.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ush-soft-card" style={{ borderColor: "rgba(243, 201, 105, .2)", background: "color-mix(in srgb, #f3c969, transparent 93%)" }}>
        <div style={{ color: UI.gold, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Regla simple
        </div>
        <div style={{ color: UI.text, font: '700 18px/1.25 "Manrope", sans-serif', marginBottom: 8 }}>
          Si no puedes hacer todo, prioriza sueno, luego comida base y despues volumen de entreno.
        </div>
        <div style={{ color: UI.muted, font: '500 14px/1.6 "Manrope", sans-serif' }}>
          Dormir mal desordena hambre, comer mal arruina energia y entrenar sin recuperar te deja con cansancio caro. El orden importa.
        </div>
      </div>
    </div>
  );
}

function renderExerciseTab({ daily, onAction, loading }) {
  return (
    <div className="ush-panel">
      <ModuleActionBar
        accent={UI.danger}
        title={daily.ejercicio.done ? "Chequeo de movimiento guardado" : "Registra una lectura corta del movimiento"}
        hint={daily.ejercicio.done
          ? "El bloque de movimiento ya cuenta hoy. Puedes abrir ejercicios para convertirlo en sesión real."
          : "Esto deja progreso en salud aunque no arranques todavía una rutina completa."}
        actions={[
          {
            key: "exercise",
            label: daily.ejercicio.done ? "Chequeo listo" : "Marcar movimiento",
            disabled: loading === "ejercicio:check" || daily.ejercicio.done,
            onClick: () => onAction("ejercicio", { mode: "check" }),
          },
          {
            key: "open-exercises",
            label: "Ir a ejercicios",
            disabled: false,
            onClick: () => window.dispatchEvent(new CustomEvent("flexNavigate", { detail: { section: "ejercicios" } })),
          },
        ]}
      />
      <div className="ush-grid-4" style={{ marginBottom: 14 }}>
        {EXERCISE_TYPES.map((item) => (
          <div key={item.title} className="ush-info-card">
            <div style={{ position: "relative", height: 92, borderRadius: 14, overflow: "hidden", marginBottom: 12, border: `1px solid ${item.color}33` }}>
              <Img src={item.asset} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "auto", opacity: .86 }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,5,18,.86), transparent 55%)" }} />
            </div>
            <div style={{ color: item.color, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>{item.freq}</div>
            <div style={{ font: '800 18px/1.15 "Manrope", sans-serif', marginBottom: 10 }}>{item.title}</div>
            <div className="ush-list">
              {item.benefits.map((benefit) => (
                <div key={benefit} className="ush-row">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ color: UI.muted, font: '500 13px/1.5 "Manrope", sans-serif' }}>{benefit}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ush-grid-2">
        <div className="ush-info-card">
          <div style={{ color: UI.gold, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
            Principios que si sostienen progreso
          </div>
          <div className="ush-list">
            {EXERCISE_PRINCIPLES.map((item, index) => (
              <div key={item.title} className="ush-row">
                <div style={{ color: index % 2 === 0 ? UI.danger : UI.cyan, font: '900 22px/1 "JetBrains Mono", monospace', minWidth: 28 }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <div style={{ font: '800 14px/1.25 "Manrope", sans-serif', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ color: UI.muted, font: '500 13px/1.6 "Manrope", sans-serif' }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ush-info-card">
          <div style={{ color: UI.success, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
            Volumen base semanal
          </div>
          {[
            { label: "Fuerza", value: 82, color: UI.danger },
            { label: "Cardio", value: 68, color: UI.cyan },
            { label: "Movilidad", value: 46, color: "#c08aff" },
            { label: "HIIT", value: 26, color: UI.gold },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, font: '600 13px/1 "Manrope", sans-serif', color: UI.muted }}>
                <span>{row.label}</span>
                <span style={{ color: row.color }}>{row.value}%</span>
              </div>
              <div className="ush-bar">
                <span style={{ width: `${row.value}%`, background: row.color }} />
              </div>
            </div>
          ))}
          <div className="ush-soft-card" style={{ marginTop: 4 }}>
            <div style={{ color: UI.text, font: '700 14px/1.35 "Manrope", sans-serif', marginBottom: 6 }}>
              Mejor poco y estable que heroico y roto.
            </div>
            <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
              Si estas empezando, tres sesiones bien hechas por semana ya cambian mucho el tablero.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBreathingTab({ daily, onAction, loading }) {
  return (
    <div className="ush-panel">
      <ModuleActionBar
        accent={UI.cyan}
        title={daily.respiracion.done ? `Recuperación registrada | ${daily.respiracion.minutes || 4} min` : "Cierra el pulso con una acción real"}
        hint={daily.respiracion.done
          ? "Ya quedó guardada como progreso de salud y empuja la parte mental ligada a respiración."
          : "Aquí sí puedes cerrar recuperación con persistencia real, no solo leer la técnica."}
        actions={[
          {
            key: "breathing",
            label: daily.respiracion.done ? "Recuperación lista" : "Cerrar recuperación",
            disabled: loading === "respiracion:recovery" || daily.respiracion.done,
            onClick: () => onAction("respiracion", { mode: "recovery", minutes: 4 }),
          },
        ]}
      />
      <div className="ush-grid-3" style={{ marginBottom: 14 }}>
        {BREATH_TECHNIQUES.map((item) => (
          <div key={item.title} className="ush-info-card">
            <div style={{ color: item.color, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
              {item.pattern}
            </div>
            <div style={{ font: '800 20px/1.15 "Manrope", sans-serif', marginBottom: 8 }}>{item.title}</div>
            <div style={{ color: UI.text, font: '700 13px/1.4 "Manrope", sans-serif', marginBottom: 8 }}>{item.use}</div>
            <div style={{ color: UI.muted, font: '500 13px/1.6 "Manrope", sans-serif' }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div className="ush-grid-2">
        <div className="ush-info-card">
          <div style={{ color: UI.cyan, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
            Cuando usar cada una
          </div>
          <div className="ush-list">
            {[
              "Antes de entrenar: box breathing o diafragmatica corta.",
              "Despues de una sesion dura: diafragmatica para bajar pulso.",
              "Antes de dormir: 4-7-8 o exhalaciones mas largas.",
              "Durante una jornada tensa: 2-4 minutos ya cambian claridad.",
            ].map((line) => (
              <div key={line} className="ush-row">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: UI.cyan, flexShrink: 0, marginTop: 6 }} />
                <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{line}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ush-info-card">
          <div style={{ color: "#c08aff", font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
            Lectura util
          </div>
          <div className="ush-soft-card" style={{ marginBottom: 10 }}>
            <div style={{ color: UI.text, font: '700 14px/1.35 "Manrope", sans-serif', marginBottom: 6 }}>
              Respirar mejor no es un extra zen, es una herramienta de rendimiento.
            </div>
            <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
              Una exhalacion larga bien usada mejora control, baja ruido y te ayuda a no confundir activacion con caos.
            </div>
          </div>
          <Img src="/ui/stat-men.png" alt="" style={{ width: 68, height: 68, filter: "drop-shadow(0 0 14px rgba(90,216,255,.38))" }} />
        </div>
      </div>
    </div>
  );
}

function renderHydrationTab({ daily, onAction, loading }) {
  return (
    <div className="ush-panel">
      <ModuleActionBar
        accent={UI.cyan}
        title={`Vasos registrados ${daily.hidratacion.cups}/${daily.hidratacion.target}`}
        hint={daily.hidratacion.done
          ? "La meta base de agua ya quedó cerrada hoy."
          : "Cada toque suma agua al día. El XP cae cuando completas la meta y no por spamear vasos."}
        actions={[
          {
            key: "cup",
            label: daily.hidratacion.done ? "Meta de agua lista" : "+1 vaso",
            disabled: loading === "hidratacion:cup",
            onClick: () => onAction("hidratacion", { mode: "cup", amount: 1 }),
          },
        ]}
      />
      <div className="ush-grid-2" style={{ marginBottom: 14 }}>
        <div className="ush-info-card">
          <div style={{ color: UI.cyan, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
            Mapa del dia
          </div>
          <div className="ush-list">
            {HYDRATION_FLOW.map((step) => (
              <div key={step.time} className="ush-row">
                <div style={{ minWidth: 70, color: step.color, font: '800 13px/1 "JetBrains Mono", monospace', paddingTop: 2 }}>{step.time}</div>
                <div>
                  <div style={{ font: '800 14px/1.25 "Manrope", sans-serif' }}>{step.qty} | {step.label}</div>
                  <div style={{ marginTop: 4, color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ush-info-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ color: UI.gold, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                Alertas simples
              </div>
              <div style={{ font: '800 22px/1.1 "Manrope", sans-serif' }}>No esperes a tener sed fuerte.</div>
            </div>
            <Img src="/ui/icons/quest-hidratacion.png" alt="" style={{ width: 54, height: 54 }} />
          </div>
          <div className="ush-list">
            {HYDRATION_WARNINGS.map((line) => (
              <div key={line} className="ush-soft-card">
                <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{line}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ush-soft-card">
        <div style={{ color: UI.text, font: '700 15px/1.35 "Manrope", sans-serif', marginBottom: 8 }}>
          Regla rapida para entrenos mas largos o dias de mucho calor
        </div>
        <div style={{ color: UI.muted, font: '500 13px/1.6 "Manrope", sans-serif' }}>
          Si sudas bastante, no siempre basta con agua sola. Reponer sodio y beber repartido suele darte mejor retorno que vaciar una botella de golpe.
        </div>
      </div>
    </div>
  );
}

const CLASS_NUTRITION_HINT = {
  GUERRERO: { label: "Prioridad fuerza", text: "Proteína alta y carbohidratos alrededor del entreno sostienen la carga sin perder masa.", color: "#ff4d5e", icon: "/ui/stat-str.png" },
  ARQUERO: { label: "Balance energético", text: "Macros equilibrados y comidas regulares sostienen ritmo y agudeza táctica sin vaciarte.", color: "#7bdc3b", icon: "/ui/icons/stat-xp.png" },
  MAGO: { label: "Cerebro activo", text: "Grasas de calidad, omega-3 y carbohidratos estables sostienen foco, memoria y claridad mental.", color: "#4cc9f0", icon: "/ui/stat-men.png" },
  DEFAULT: { label: "Base sólida", text: "Proteína, carbohidratos acordes al gasto y grasas de calidad. Sin base sólida el resto es ruido.", color: "#c08aff", icon: "/ui/stat-men.png" },
};

const TIMING_ITEMS = [
  { text: "Antes de entrenar: energía fácil de digerir si vienes vacío.", color: UI.success },
  { text: "Después de entrenar: proteína y comida normal dentro de una ventana razonable.", color: "#4cc9f0" },
  { text: "Días de mucho volumen: no dejes carbohidratos demasiado bajos.", color: UI.gold },
  { text: "Control de hambre: proteína, fibra y horarios estables ayudan mucho.", color: "#c08aff" },
];

function NutritionTab({ daily, onAction, loading, classKey }) {
  const [mythFlipped, setMythFlipped] = useState({});
  const [macroFlipped, setMacroFlipped] = useState({});
  const [goalOpen, setGoalOpen] = useState(null);
  const [timingOpen, setTimingOpen] = useState(false);

  const meals = daily.nutricion.meals || 0;
  const hint = CLASS_NUTRITION_HINT[classKey] || CLASS_NUTRITION_HINT.DEFAULT;

  return (
    <div className="ush-panel">
      <ModuleActionBar
        accent={UI.success}
        title={meals > 0 ? `${meals} comida${meals !== 1 ? "s" : ""} registrada${meals !== 1 ? "s" : ""} hoy` : "Deja una comida útil marcada"}
        hint={meals > 0
          ? "El bloque de nutrición ya cuenta hoy. Sigue sumando si tienes más comidas sólidas."
          : "Un registro simple convierte esta lectura en sistema y no en catálogo bonito."}
        actions={[
          {
            key: "meal",
            label: meals >= 4 ? "Máximo alcanzado" : meals > 0 ? `+1 comida (${meals}/4)` : "Marcar comida base",
            disabled: loading === "nutricion:meal" || meals >= 4,
            onClick: () => onAction("nutricion", { mode: "meal", amount: 1 }),
          },
        ]}
      />

      {/* ── Clase hint ── */}
      <div
        className="ush-class-hint"
        style={{ "--hint-c": hint.color, borderColor: `${hint.color}33` }}
      >
        <Img src={hint.icon} fallbackSrc="/ui/stat-men.png" alt="" style={{ width: 36, height: 36, filter: `drop-shadow(0 0 10px ${hint.color}99)`, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: hint.color, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6 }}>{hint.label}</div>
          <div style={{ color: UI.muted, font: '500 13px/1.5 "Manrope", sans-serif' }}>{hint.text}</div>
        </div>
      </div>

      {/* ── Meal dots tracker ── */}
      <div className="ush-soft-card" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Img src="/ui/icons/quest-nutricion.png" fallbackSrc="/items/consumables/pocion_fuerza.png" alt="" style={{ width: 34, height: 34, filter: `drop-shadow(0 0 10px ${UI.success}88)`, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>Comidas hoy</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`ush-meal-dot${n <= meals ? " filled" : ""}`}
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: `2px solid ${n <= meals ? UI.success : "rgba(255,255,255,.12)"}`,
                  background: n <= meals ? `color-mix(in srgb, ${UI.success}, transparent 76%)` : "rgba(255,255,255,.03)",
                  display: "grid", placeItems: "center",
                  boxShadow: n <= meals ? `0 0 14px ${UI.success}66, 0 0 0 3px ${UI.success}22` : "none",
                  font: '800 13px/1 "Manrope", sans-serif',
                  color: n <= meals ? UI.success : UI.deepMuted,
                  transition: "all .25s ease",
                }}
              >
                {n <= meals ? "✓" : n}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ color: UI.success, font: '900 34px/1 "Manrope", sans-serif', textShadow: `0 0 18px ${UI.success}cc, 0 0 36px ${UI.success}44` }}>{meals}<span style={{ color: UI.deepMuted, font: '500 16px/1 "Manrope", sans-serif' }}>/4</span></div>
          <div style={{ color: UI.muted, font: '500 11px/1.4 "JetBrains Mono", monospace', marginTop: 4, letterSpacing: ".06em" }}>meta diaria</div>
        </div>
      </div>

      {/* ── Macro flip cards ── */}
      <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
        Macronutrientes — toca para leer el uso
      </div>
      <div className="ush-grid-3" style={{ marginBottom: 14 }}>
        {NUTRITION_BLOCKS.map((item, i) => (
          <div
            key={item.title}
            className={`ush-flip-card${macroFlipped[i] ? " is-flipped" : ""}`}
            onClick={() => setMacroFlipped((prev) => ({ ...prev, [i]: !prev[i] }))}
          >
            <div className="ush-flip-inner">
              {/* Front */}
              <div className="ush-flip-face ush-macro-face" style={{
                borderColor: `${item.color}33`,
                background: `linear-gradient(180deg, color-mix(in srgb, ${item.color}, transparent 91%), rgba(12,9,22,.97))`,
                minHeight: 190,
              }}>
                <Img src={item.asset} alt="" style={{ width: 52, height: 52, filter: `drop-shadow(0 0 16px ${item.color}aa)` }} />
                <div style={{ marginTop: 10, color: item.color, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase" }}>{item.dose}</div>
                <div style={{ marginTop: 8, font: '800 18px/1.1 "Manrope", sans-serif' }}>{item.title}</div>
                <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", alignItems: "center", gap: 6, color: UI.deepMuted }}>
                  <span style={{ font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".08em" }}>toca para uso</span>
                  <span style={{ font: "800 14px/1", transform: "rotate(-90deg)", display: "inline-block" }}>›</span>
                </div>
              </div>
              {/* Back */}
              <div className="ush-flip-face ush-flip-back ush-macro-face" style={{
                borderColor: `${item.color}66`,
                background: `linear-gradient(180deg, color-mix(in srgb, ${item.color}, transparent 78%), rgba(12,9,22,.98))`,
                minHeight: 190,
              }}>
                <div style={{ color: item.color, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>Para qué sirve</div>
                <div style={{ font: '800 17px/1.15 "Manrope", sans-serif', marginBottom: 10 }}>{item.title}</div>
                <div style={{ color: UI.text, font: '500 13px/1.6 "Manrope", sans-serif', flex: 1 }}>{item.use}</div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: UI.deepMuted }}>
                  <span style={{ font: "800 14px/1", transform: "rotate(90deg)", display: "inline-block" }}>›</span>
                  <span style={{ font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".08em" }}>volver</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Goals accordion ── */}
      <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
        Objetivos — toca para ver el enfoque
      </div>
      <div className="ush-list" style={{ marginBottom: 14 }}>
        {NUTRITION_GOALS.map((goal, i) => (
          <div
            key={goal.title}
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: `1px solid ${goalOpen === i ? `${goal.color}55` : `${goal.color}22`}`,
              background: goalOpen === i ? `color-mix(in srgb, ${goal.color}, transparent 92%)` : "rgba(255,255,255,.02)",
              cursor: "pointer",
              transition: "border-color .2s ease, background .2s ease",
            }}
            onClick={() => setGoalOpen((prev) => (prev === i ? null : i))}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: goal.color, flexShrink: 0,
                  boxShadow: goalOpen === i ? `0 0 10px ${goal.color}` : "none",
                  transition: "box-shadow .2s ease",
                }} />
                <div>
                  <div style={{ color: goal.color, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Objetivo</div>
                  <div style={{ font: '800 15px/1.15 "Manrope", sans-serif' }}>{goal.title}</div>
                </div>
              </div>
              <span className={`ush-chev${goalOpen === i ? " open" : ""}`}>›</span>
            </div>
            {goalOpen === i && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${goal.color}22`, paddingTop: 12 }}>
                <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif', marginBottom: 10 }}>{goal.detail}</div>
                <div className="ush-list">
                  {goal.focus.map((line) => (
                    <div key={line} className="ush-row">
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: goal.color, flexShrink: 0, marginTop: 6, boxShadow: `0 0 6px ${goal.color}` }} />
                      <div style={{ color: UI.muted, font: '500 13px/1.5 "Manrope", sans-serif' }}>{line}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Bottom grid: timing accordion + myths flip ── */}
      <div className="ush-grid-2">
        {/* Timing accordion */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 18,
            border: `1px solid ${timingOpen ? `${UI.success}44` : `${UI.success}1a`}`,
            background: "rgba(255,255,255,.018)",
            cursor: "pointer",
            transition: "border-color .2s ease",
          }}
          onClick={() => setTimingOpen((p) => !p)}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: timingOpen ? 12 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Img src="/ui/icons/quest-nutricion.png" fallbackSrc="/ui/stat-men.png" alt="" style={{ width: 22, height: 22, filter: `drop-shadow(0 0 7px ${UI.success}88)` }} />
              <div style={{ color: UI.success, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase" }}>
                Timing útil
              </div>
            </div>
            <span className={`ush-chev${timingOpen ? " open" : ""}`}>›</span>
          </div>
          {!timingOpen && (
            <div style={{ color: UI.muted, font: '500 13px/1.5 "Manrope", sans-serif', marginTop: 6 }}>Cuándo comer según el entreno y el día.</div>
          )}
          {timingOpen && (
            <div className="ush-list">
              {TIMING_ITEMS.map((item) => (
                <div key={item.text} className="ush-row">
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, flexShrink: 0, marginTop: 6, boxShadow: `0 0 6px ${item.color}` }} />
                  <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{item.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Myths flip cards */}
        <div style={{ padding: "14px 16px", borderRadius: 18, border: `1px solid ${UI.gold}22`, background: "rgba(255,255,255,.018)" }}>
          <div style={{ color: UI.gold, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>
            Mitos — toca para la realidad
          </div>
          <div className="ush-list">
            {NUTRITION_MYTHS.map((item, i) => (
              <div
                key={item.myth}
                className={`ush-flip-card${mythFlipped[i] ? " is-flipped" : ""}`}
                onClick={(e) => { e.stopPropagation(); setMythFlipped((prev) => ({ ...prev, [i]: !prev[i] })); }}
              >
                <div className="ush-flip-inner">
                  <div className="ush-flip-face ush-myth-face" style={{
                    borderColor: `${UI.danger}33`,
                    background: `color-mix(in srgb, ${UI.danger}, transparent 93%)`,
                  }}>
                    <div style={{ color: UI.danger, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Mito</div>
                    <div style={{ color: UI.text, font: '500 13px/1.5 "Manrope", sans-serif' }}>{item.myth}</div>
                    <div style={{ marginTop: 8, color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".06em" }}>↩ toca para realidad</div>
                  </div>
                  <div className="ush-flip-face ush-flip-back ush-myth-face" style={{
                    borderColor: `${UI.success}44`,
                    background: `color-mix(in srgb, ${UI.success}, transparent 89%)`,
                  }}>
                    <div style={{ color: UI.success, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Realidad</div>
                    <div style={{ color: UI.text, font: '500 13px/1.5 "Manrope", sans-serif' }}>{item.truth}</div>
                    <div style={{ marginTop: 8, color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".06em" }}>↩ volver</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabContent({ activeTab, daily, onAction, loading, classKey }) {
  if (activeTab === "ejercicio") return renderExerciseTab({ daily, onAction, loading });
  if (activeTab === "respiracion") return renderBreathingTab({ daily, onAction, loading });
  if (activeTab === "hidratacion") return renderHydrationTab({ daily, onAction, loading });
  if (activeTab === "nutricion") return <NutritionTab daily={daily} onAction={onAction} loading={loading} classKey={classKey} />;
  return renderGeneralTab({ daily, onAction, loading });
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const isTodayLike = (value) => {
  if (!value) return null;
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
};

export default function UserSaludLanding({ profile }) {
  const [saludSummary, setSaludSummary] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("idle");
  const [actionSaving, setActionSaving] = useState("");
  const [actionPulse, setActionPulse] = useState(null);
  const syncBootRef = useRef(false);
  const viewerUid = String(profile?.uid || auth.currentUser?.uid || "guest");
  const saludStorageKey = getSaludStorageKey(viewerUid);
  const syncedTabRef = useRef(VALID_TAB_IDS.has(profile?.saludModule?.lastTab) ? profile.saludModule.lastTab : "");
  const classKey = String(saludSummary?.stats?.heroClass || profile?.heroClass || profile?.clase || "DEFAULT").toUpperCase();
  const classTheme = USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(saludStorageKey);
      if (VALID_TAB_IDS.has(saved)) return saved;
    } catch {
      // noop
    }
    return VALID_TAB_IDS.has(profile?.saludModule?.lastTab) ? profile.saludModule.lastTab : "general";
  });
  const level = num(saludSummary?.stats?.level ?? profile?.level, 1);
  const streak = num(saludSummary?.stats?.streak ?? profile?.streak, 0);
  const xp = num(saludSummary?.stats?.xp ?? profile?.xp, 0);
  const xpMax = Math.max(1, num(saludSummary?.stats?.xpNext ?? profile?.xpMax, 4800));
  const xpPct = clamp(num(saludSummary?.stats?.xpPct, Math.round((xp / xpMax) * 100)), 0, 100);
  const weeklySnapshot = saludSummary?.weekly || { sessions: 0, xp: 0, activeDays: 0, source: "local" };
  const supportFlags = saludSummary?.boosts?.supportFlags || {};
  const currentHour = new Date().getHours();
  const timeBand = currentHour < 11 ? "manana" : currentHour < 18 ? "tarde" : "noche";
  const trainedToday = useMemo(() => {
    if (typeof saludSummary?.trainedToday === "boolean") return saludSummary.trainedToday;
    if (saludSummary?.trainedToday === null) return null;
    const explicit = profile?.trainedToday ?? profile?.todayWorkout ?? profile?.todayTraining;
    if (typeof explicit === "boolean") return explicit;
    const candidates = [
      profile?.lastWorkoutAt,
      profile?.lastExerciseAt,
      profile?.lastActivityAt,
    ];
    for (const candidate of candidates) {
      const result = isTodayLike(candidate);
      if (result !== null) return result;
    }
    return null;
  }, [profile, saludSummary?.trainedToday]);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      const user = auth.currentUser;
      if (!user) {
        if (!cancelled) {
          setSummaryStatus("idle");
          setSaludSummary(null);
        }
        return;
      }

      const cached = saludClientCache.get(viewerUid);
      if (cached && Date.now() - cached.ts < SALUD_CLIENT_TTL) {
        if (!cancelled) {
          setSaludSummary(cached.data);
          setSummaryStatus("ready");
        }
        return;
      }

      setSummaryStatus((prev) => (prev === "ready" ? "refreshing" : "loading"));
      try {
        const token = await user.getIdToken();
        const response = await getSaludSummary(token);
        if (cancelled) return;
        const nextSummary = response?.summary || null;
        setSaludSummary(nextSummary);
        saludClientCache.set(viewerUid, { ts: Date.now(), data: nextSummary });
        setSummaryStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Error cargando resumen de salud:", err);
        setSummaryStatus("error");
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [profile?.uid, profile?.email, viewerUid]);

  useEffect(() => {
    const remoteTab = VALID_TAB_IDS.has(saludSummary?.moduleState?.lastTab)
      ? saludSummary.moduleState.lastTab
      : VALID_TAB_IDS.has(profile?.saludModule?.lastTab)
        ? profile.saludModule.lastTab
        : "general";
    let nextTab = remoteTab;
    try {
      const saved = localStorage.getItem(saludStorageKey);
      if (VALID_TAB_IDS.has(saved)) nextTab = saved;
    } catch {
      // noop
    }
    syncedTabRef.current = remoteTab;
    syncBootRef.current = false;
    setActiveTab(nextTab);
  }, [saludStorageKey, viewerUid, profile?.saludModule?.lastTab, saludSummary?.moduleState?.lastTab]);

  useEffect(() => {
    const remoteTab = saludSummary?.moduleState?.lastTab;
    if (!VALID_TAB_IDS.has(remoteTab)) return;
    syncedTabRef.current = remoteTab;

    try {
      const localTab = localStorage.getItem(saludStorageKey);
      if (VALID_TAB_IDS.has(localTab)) return;
    } catch {
      // noop
    }

    setActiveTab((prev) => (prev === "general" ? remoteTab : prev));
  }, [saludStorageKey, saludSummary?.moduleState?.lastTab]);

  useEffect(() => {
    try {
      localStorage.setItem(saludStorageKey, activeTab);
    } catch {}
  }, [activeTab, saludStorageKey]);

  useEffect(() => {
    if (!syncBootRef.current) {
      syncBootRef.current = true;
      return;
    }
    if (!VALID_TAB_IDS.has(activeTab)) return;
    if (activeTab === syncedTabRef.current) return;

    const user = auth.currentUser;
    if (!user) return;

    const timeoutId = window.setTimeout(async () => {
      try {
        const token = await user.getIdToken();
        await saveSaludState(token, { activeTab });
        syncedTabRef.current = activeTab;
        setSaludSummary((prev) => prev
          ? {
              ...prev,
              moduleState: {
                ...(prev.moduleState || {}),
                lastTab: activeTab,
                lastViewedAt: new Date().toISOString(),
              },
            }
          : prev);
      } catch (err) {
        console.error("Error guardando estado de salud:", err);
      }
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  const dailyState = useMemo(() => {
    const raw = saludSummary?.daily || {};
    return {
      sleep: {
        done: Boolean(raw.sleep?.done),
        hours: num(raw.sleep?.hours, 0),
      },
      general: {
        done: Boolean(raw.general?.done),
      },
      ejercicio: {
        done: Boolean(raw.ejercicio?.done) || trainedToday === true,
      },
      respiracion: {
        done: Boolean(raw.respiracion?.done),
        minutes: num(raw.respiracion?.minutes, 0),
      },
      hidratacion: {
        cups: num(raw.hidratacion?.cups, 0),
        target: Math.max(4, num(raw.hidratacion?.target, 6)),
        done: Boolean(raw.hidratacion?.done),
      },
      nutricion: {
        meals: num(raw.nutricion?.meals, 0),
        done: Boolean(raw.nutricion?.done),
      },
      completedCount: num(raw.completedCount, 0),
    };
  }, [saludSummary?.daily, trainedToday]);

  const handleSaludAction = async (moduleId, payload = {}) => {
    const user = auth.currentUser;
    if (!user) return;
    const actionKey = `${moduleId}:${payload.mode || "default"}`;
    setActionSaving(actionKey);
    try {
      const token = await user.getIdToken();
      const response = await saveSaludCheckin(token, { module: moduleId, ...payload });
      let nextSummary = null;
      setSaludSummary((prev) => {
        nextSummary = {
          ...(prev || {}),
          ...(prev?.stats ? { stats: prev.stats } : {}),
          ...(prev?.mind ? { mind: prev.mind } : {}),
          ...(prev?.boosts ? { boosts: prev.boosts } : {}),
          ...(prev?.weekly ? { weekly: prev.weekly } : {}),
          ...(prev?.todayDone ? { todayDone: prev.todayDone } : {}),
          ...(prev?.moduleState ? { moduleState: prev.moduleState } : {}),
          daily: response?.daily || prev?.daily || null,
          trainedToday: moduleId === "ejercicio" ? true : prev?.trainedToday ?? null,
        };
        return nextSummary;
      });
      if (nextSummary) {
        saludClientCache.set(viewerUid, { ts: Date.now(), data: nextSummary });
      }
      setActionPulse({
        label: response?.xpEarned > 0 ? `+${response.xpEarned} XP | ${SALUD_TAB_META[moduleId]?.title || "Salud"}` : `${SALUD_TAB_META[moduleId]?.title || "Salud"} guardado`,
        tone: classTheme.accent,
      });
      if (response?.leveledUp) {
        window.dispatchEvent(new CustomEvent("levelUp", { detail: response }));
      }
      if (response?.xpEarned > 0 || response?.createdProgress) {
        window.dispatchEvent(new CustomEvent("profileUpdated", {
          detail: {
            source: "salud",
            xpEarned: response?.xpEarned || 0,
            leveledUp: response?.leveledUp || false,
            module: moduleId,
          },
        }));
      }
      window.setTimeout(() => setActionPulse(null), 2600);
    } catch (err) {
      console.error("Error guardando progreso de salud:", err);
      setActionPulse({ label: "No se pudo guardar este avance", tone: UI.danger });
      window.setTimeout(() => setActionPulse(null), 2400);
    } finally {
      setActionSaving("");
    }
  };

  const activeMeta = useMemo(
    () => TABS.find((tab) => tab.id === activeTab) || TABS[0],
    [activeTab]
  );

  const goToTab = (tabId, { scroll = true } = {}) => {
    setActiveTab(tabId);
    if (!scroll || typeof document === "undefined") return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(`ush-panel-${tabId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const classPriority = {
    GUERRERO: "ejercicio",
    ARQUERO: "hidratacion",
    MAGO: "respiracion",
    DEFAULT: "general",
  };

  const recoveryPressure = clamp(
    30
    + level * 1.4
    + streak * 1.1
    + weeklySnapshot.activeDays * 4
    + (dailyState.sleep.done ? 16 : 0)
    + (dailyState.respiracion.done ? 12 : 0)
    + (timeBand === "noche" ? 12 : timeBand === "tarde" ? 7 : 3)
    + (classKey === "MAGO" ? 8 : 0),
    20,
    96
  );
  const movementScore = clamp(
    34
    + level * 1.8
    + streak * 1.1
    + weeklySnapshot.sessions * 7
    + (dailyState.ejercicio.done ? 14 : 0)
    + (classKey === "GUERRERO" ? 12 : classKey === "ARQUERO" ? 9 : 5),
    24,
    98
  );
  const hydrationScore = clamp(
    28
    + level * 1.1
    + streak * 0.7
    + dailyState.hidratacion.cups * 9
    + (dailyState.hidratacion.done ? 10 : 0)
    + (timeBand === "tarde" ? 10 : timeBand === "manana" ? 8 : 5)
    + (classKey === "ARQUERO" ? 9 : classKey === "MAGO" ? 4 : 6),
    26,
    96
  );
  const nutritionScore = clamp(
    30
    + level * 1.3
    + streak * 0.9
    + dailyState.nutricion.meals * 15
    + (dailyState.nutricion.done ? 8 : 0)
    + (classKey === "GUERRERO" ? 10 : classKey === "ARQUERO" ? 6 : 5),
    24,
    97
  );

  let recommendedId = classPriority[classKey] || "general";
  if (supportFlags.xpBonus && trainedToday !== true && !dailyState.ejercicio.done) {
    recommendedId = "ejercicio";
  } else if (supportFlags.streakShieldActive && timeBand === "noche" && !dailyState.respiracion.done) {
    recommendedId = "respiracion";
  } else if (!dailyState.sleep.done && timeBand === "manana") {
    recommendedId = "general";
  } else if (trainedToday === true && !dailyState.hidratacion.done) {
    recommendedId = "hidratacion";
  } else if (timeBand === "noche" && !dailyState.respiracion.done) {
    recommendedId = "respiracion";
  } else if (!dailyState.nutricion.done && timeBand !== "manana") {
    recommendedId = "nutricion";
  } else if (trainedToday !== true && !dailyState.ejercicio.done && classKey !== "MAGO") {
    recommendedId = "ejercicio";
  } else if (trainedToday === true) {
    recommendedId = timeBand === "noche"
      ? "respiracion"
      : hydrationScore <= recoveryPressure
        ? "hidratacion"
        : "respiracion";
  } else if (trainedToday === false) {
    recommendedId = timeBand === "manana"
      ? "general"
      : classKey === "MAGO"
        ? "general"
        : "ejercicio";
  } else if (timeBand === "manana") {
    recommendedId = streak <= 1 ? "general" : classKey === "ARQUERO" ? "hidratacion" : classPriority[classKey] || "general";
  } else if (timeBand === "tarde") {
    recommendedId = hydrationScore < movementScore ? "hidratacion" : classPriority[classKey] || "general";
  } else if (timeBand === "noche") {
    recommendedId = recoveryPressure >= 74 ? "respiracion" : nutritionScore < movementScore ? "nutricion" : "general";
  }

  const recommendedMeta = SALUD_TAB_META[recommendedId];
  const recommendedTabVisual = TABS.find((tab) => tab.id === recommendedId) || TABS[0];
  const stageAsset = HEALTH_ASSETS.hero[activeTab] || HEALTH_ASSETS.hero.general;
  const stagePreviewAsset = activeMeta.id === "hidratacion"
    ? HEALTH_ASSETS.seal.agua
    : activeMeta.id === "nutricion"
      ? HEALTH_ASSETS.seal.nutricion
      : activeMeta.id === "respiracion"
        ? HEALTH_ASSETS.seal.sueno
        : activeMeta.id === "ejercicio"
          ? HEALTH_ASSETS.seal.movimiento
          : HEALTH_ASSETS.section;
  const healthHeaderAsset = HEALTH_ASSETS.section;

  const phaseLabel = {
    manana: "Arranque del dia",
    tarde: "Ventana de rendimiento",
    noche: "Cierre y recuperacion",
  }[timeBand];

  const contextualChip = {
    manana: "Hora de ordenar base y energia",
    tarde: "Momento fino para agua, rendimiento y foco",
    noche: "Tramo ideal para recuperar y bajar pulso",
  }[timeBand];

  const heroHeadline = {
    manana: { title: "Abre el dia con", span: "una base que sostenga." },
    tarde:  { title: "Ajusta energia, agua y ritmo", span: "antes de gastar de mas." },
    noche:  { title: "Cierra sin romper", span: "recuperacion ni claridad." },
  }[timeBand];

  const heroLead = {
    manana: "La pestaña ya no solo te muestra teoría: te marca qué revisar primero según clase, nivel, racha y hora del día para que no entres a ciegas.",
    tarde: "La lectura cambia según el momento del día. Aquí te conviene revisar lo que más retorno te da ahora mismo y no una guía genérica repetida.",
    noche: "Al final del día conviene bajar ruido y leer recuperación, hidratación y nutrición con una lógica más cercana a tu estado actual.",
  }[timeBand];

  const heroKpis = [
    { label: "nivel actual", value: `Lv ${level}` },
    { label: "racha activa", value: `${streak} d` },
    { label: "semana viva", value: `${weeklySnapshot.sessions} ses` },
    { label: "foco hoy", value: trainedToday === true ? "recuperar" : recommendedMeta.title.split(" ")[0] },
  ];

  const routeSummary = {
    general: "Sueno, agua y movimiento antes de complicar la partida.",
    ejercicio: "Hoy te rinde más revisar carga, frecuencia y tipo de esfuerzo antes de sumar volumen sin lectura.",
    respiracion: "Te conviene bajar ruido interno y ordenar el pulso para que el cuerpo responda mejor.",
    hidratacion: "El retorno rápido está en repartir agua y reposición, sobre todo si vienes en tramo activo.",
    nutricion: "La mejor mejora ahora mismo viene de ajustar comida base y energía útil alrededor del día.",
  };

  const rewardSummary = {
    general: "Checklist base para no regalar progreso por detalles simples.",
    ejercicio: "Guía para entrenar con intención y menos desgaste torpe.",
    respiracion: "Control más limpio de estrés, enfoque y recuperación.",
    hidratacion: "Mejor claridad, digestión y rendimiento sostenido.",
    nutricion: "Lectura más precisa de macros, timing y errores comunes.",
  };

  const quickMarkers = [
    { label: "Movimiento", value: movementScore, color: UI.danger },
    { label: "Recuperacion", value: recoveryPressure, color: UI.cyan },
    { label: "Nutricion", value: nutritionScore, color: UI.success },
    { label: "Hidratacion", value: hydrationScore, color: "#4cc9f0" },
  ];

  const lowestMarker = [...quickMarkers].sort((a, b) => a.value - b.value)[0];
  const strongestMarker = [...quickMarkers].sort((a, b) => b.value - a.value)[0];
  const markerTargetMap = {
    Movimiento: "ejercicio",
    Recuperacion: "respiracion",
    Nutricion: "nutricion",
    Hidratacion: "hidratacion",
  };
  const weakestTargetId = markerTargetMap[lowestMarker.label] || recommendedId;
  const weakestTabVisual = TABS.find((tab) => tab.id === weakestTargetId) || TABS[0];
  const suggestedActionMeta = recommendedId === "general"
    ? (!dailyState.sleep.done
        ? { label: "Dormí 7h+", run: () => handleSaludAction("general", { mode: "sleep", hours: 7 }), savingKey: "general:sleep", done: false }
        : dailyState.general.done
          ? { label: "Base lista", run: () => goToTab("general"), savingKey: "", done: true }
          : { label: "Marcar base", run: () => handleSaludAction("general", { mode: "base" }), savingKey: "general:base", done: false })
    : recommendedId === "hidratacion"
      ? { label: dailyState.hidratacion.done ? "Meta de agua lista" : "+1 vaso", run: () => handleSaludAction("hidratacion", { mode: "cup", amount: 1 }), savingKey: "hidratacion:cup", done: dailyState.hidratacion.done }
      : recommendedId === "respiracion"
        ? { label: dailyState.respiracion.done ? "Recuperación lista" : "Cerrar recuperación", run: () => handleSaludAction("respiracion", { mode: "recovery", minutes: 4 }), savingKey: "respiracion:recovery", done: dailyState.respiracion.done }
        : recommendedId === "nutricion"
          ? { label: dailyState.nutricion.done ? "Comida base lista" : "Marcar comida base", run: () => handleSaludAction("nutricion", { mode: "meal", amount: 1 }), savingKey: "nutricion:meal", done: dailyState.nutricion.done }
          : { label: dailyState.ejercicio.done ? "Chequeo listo" : "Marcar movimiento", run: () => handleSaludAction("ejercicio", { mode: "check" }), savingKey: "ejercicio:check", done: dailyState.ejercicio.done };

  const routeNodes = [
    {
      title: "Ruta sugerida",
      text: `${recommendedMeta.title} | ${phaseLabel}`,
      asset: { src: recommendedTabVisual.asset, fallback: recommendedTabVisual.fallbackAsset },
      targetId: recommendedId,
      actionLabel: suggestedActionMeta.done ? `Abrir ${recommendedMeta.title.toLowerCase()}` : suggestedActionMeta.label,
      action: () => (suggestedActionMeta.done ? goToTab(recommendedId) : suggestedActionMeta.run()),
    },
    {
      title: "Chequeo rapido",
      text: routeSummary[recommendedId] || routeSummary.general,
      asset: { src: HEALTH_ASSETS.section.src, fallback: "/ui/stat-men.png" },
      targetId: "general",
      actionLabel: "Abrir base general",
      action: () => goToTab("general"),
    },
    {
      title: "Botin del dia",
      text: rewardSummary[weakestTargetId] || rewardSummary.general,
      asset: { src: weakestTabVisual.asset, fallback: weakestTabVisual.fallbackAsset },
      targetId: weakestTargetId,
      actionLabel: `Abrir ${SALUD_TAB_META[weakestTargetId].title.toLowerCase()}`,
      action: () => goToTab(weakestTargetId),
    },
  ];

  const todaySignals = [
    {
      label: "Sueno",
      value: clamp(Math.round(recoveryPressure - (trainedToday === true ? 8 : 0) + (timeBand === "noche" ? 6 : 0)), 22, 96),
      asset: HEALTH_ASSETS.seal.sueno,
      color: UI.cyan,
      hint: timeBand === "noche" ? "Protege cierre, luz y descanso antes de exigir mas." : "Si vienes corto de descanso, el cuerpo lo cobra en claridad y hambre.",
    },
    {
      label: "Agua",
      value: hydrationScore,
      asset: HEALTH_ASSETS.seal.agua,
      color: "#4cc9f0",
      hint: trainedToday === true ? "Tras entrenar, reponer temprano te devuelve claridad y rendimiento." : "Repartir agua durante el dia rinde mas que beber tarde y de golpe.",
    },
    {
      label: "Recuperacion",
      value: recoveryPressure,
      asset: HEALTH_ASSETS.seal.movimiento,
      color: UI.danger,
      hint: trainedToday === true ? "Hoy conviene bajar ruido, movilidad ligera o respiracion util." : "Si aun no entrenas, prepara base antes de subir volumen.",
    },
  ];
  const activeGuide = MODULE_TODAY_GUIDE[activeTab] || MODULE_TODAY_GUIDE.general;
  const currentMistakes = MODULE_COMMON_MISTAKES[activeTab] || MODULE_COMMON_MISTAKES.general;

  const classHint = classKey === "GUERRERO"
    ? "Te conviene sostener fuerza con comida útil y no descuidar recuperación cuando la carga sube."
    : classKey === "ARQUERO"
      ? "Tu mejor retorno suele venir de hidratación, ritmo y control de pulso para no vaciarte antes de tiempo."
      : classKey === "MAGO"
        ? "Respiración, sueño y lectura general suelen darte el mejor piso para que el resto del mapa no se rompa."
        : "Empieza por la base general y luego empuja el marcador más bajo del día.";

  const weeklyRoute = [
    movementScore < 65 ? "Abre al menos 3 sesiones de movimiento bien cerradas." : "Mantén el bloque de movimiento y cuida no sobrecargarlo.",
    hydrationScore < 65 ? "Reparte agua durante el día, no solo al entrenar." : "Sostén la hidratación repartida para no perder claridad.",
    nutritionScore < 65 ? "Sube proteína base y energía útil alrededor de tu jornada." : "Consolida una comida base limpia antes de complicar suplementos.",
    recoveryPressure < 70 ? "Haz hueco a respiración o sueño más ordenado antes de pedir más rendimiento." : "Protege la recuperación para no pagar caro la racha.",
  ];
  const summaryBanner = summaryStatus === "ready"
    ? trainedToday === true
      ? `Lectura viva | entrenamiento detectado por ${saludSummary?.trainedSource || "registro real"}`
      : trainedToday === false
        ? "Lectura viva | hoy aún no hay registro físico canónico"
        : "Lectura viva | señal parcial del día, sin cierre completo aún"
    : summaryStatus === "loading" || summaryStatus === "refreshing"
      ? "Sincronizando tablero de salud"
      : "Resumen agregado de salud, mente y actividad semanal";

  return (
    <div
      className="ush-page"
        style={{
          "--salud-accent": classTheme.accent,
          "--salud-secondary": classTheme.secondary,
          "--salud-bg": classTheme.bg,
          "--salud-soft": classTheme.soft,
        }}
      >
      <style>{CSS}</style>

      <div className="ush-shell">
        <section className="ush-card ush-hero">
          <div className="ush-hero-copy">
            <div className="ush-chip-row">
              <span className="ush-chip" style={{ color: classTheme.accent, borderColor: `${classTheme.accent}44` }}>
                <Img src={healthHeaderAsset.src} fallbackSrc={healthHeaderAsset.fallback} alt="" style={{ width: 18, height: 18 }} />
                Salud y bienestar
              </span>
              <span className="ush-chip" style={{ color: UI.gold, borderColor: "rgba(243, 201, 105, .28)" }}>
                {contextualChip}
              </span>
              <span className="ush-chip" title="Fuentes orientativas de esta portada">
                OMS | ACSM | revisiones sistematicas
              </span>
            </div>

            <div>
              <div style={{ font: '800 11px/1 "JetBrains Mono", monospace', letterSpacing: ".14em", textTransform: "uppercase", color: classTheme.accent, marginBottom: 12, textShadow: `0 0 12px ${classTheme.accent}99` }}>
                {phaseLabel}
              </div>
              <h1 style={{ margin: 0, font: '900 clamp(36px,5.2vw,80px)/.92 "Manrope", sans-serif', color: "#fff9ef", maxWidth: "14ch" }}>
                {heroHeadline.title} <span style={{ color: classTheme.accent, textShadow: `0 0 34px ${classTheme.accent}77` }}>{heroHeadline.span}</span>
              </h1>
              <p style={{ margin: "16px 0 0", font: '500 clamp(14px,1.2vw,18px)/1.7 "Manrope", sans-serif', color: "#cdbfe0", maxWidth: 720 }}>
                {heroLead}
              </p>
              <div style={{ marginTop: 12, color: UI.deepMuted, font: '600 12px/1.5 "Manrope", sans-serif', maxWidth: 640 }}>
                Esta lectura resume recomendaciones de salud general y evidencia ampliamente repetida. No reemplaza evaluacion clinica ni indicaciones medicas personales.
              </div>
            </div>

            <div className="ush-chip-row">
              <span className="ush-chip" style={{ color: classTheme.accent, borderColor: `${classTheme.accent}33` }}>
                <Img src={classTheme.crest} alt="" style={{ width: 18, height: 18 }} />
                Clase {classTheme.label}
              </span>
              <span className="ush-chip">Prioridad sugerida: {recommendedMeta.title}</span>
              <span className="ush-chip" style={{ color: UI.deepMuted }}>
                Progreso real: {dailyState.completedCount}/6
              </span>
              {(supportFlags.xpBonus || supportFlags.xpMult || supportFlags.streakShieldActive) && (
                <span className="ush-chip" style={{ color: UI.gold, borderColor: "rgba(243,201,105,.28)" }}>
                  Apoyo activo: {supportFlags.streakShieldActive ? "escudo de racha" : supportFlags.xpMult ? "boost de XP" : "bono de progreso"}
                </span>
              )}
            </div>

            <div className="ush-kpis">
              {heroKpis.map((item) => (
                <div key={item.label} className="ush-kpi">
                  <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
                    {item.label}
                  </div>
                  <div style={{ color: UI.text, font: '900 30px/1 "Manrope", sans-serif' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="ush-xp-bar-wrap">
              <div className="ush-xp-bar-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Img src="/ui/icons/stat-xp.png" fallbackSrc="/ui/stat-men.png" alt="" style={{ width: 18, height: 18, filter: `drop-shadow(0 0 6px ${classTheme.accent}88)` }} />
                  <span style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase" }}>XP</span>
                </div>
                <span style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace' }}>
                  {xp.toLocaleString()} / {xpMax.toLocaleString()}
                </span>
              </div>
              <div className="ush-bar">
                <span style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${classTheme.accent}, ${classTheme.secondary || classTheme.accent})`, boxShadow: `0 0 10px ${classTheme.accent}77` }} />
              </div>
            </div>
          </div>

          <div className="ush-stage">
            <Img src={stageAsset.src} fallbackSrc={stageAsset.fallback} alt="" className="ush-stage-bg" style={{ imageRendering: "auto" }} />
            <div className="ush-stage-overlay">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div className="ush-soft-card" style={{ maxWidth: 280, backdropFilter: "blur(10px)", background: "rgba(9,7,18,.56)", borderColor: `${classTheme.accent}33` }}>
                  <div style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                    Modulo activo
                  </div>
                  <div style={{ color: UI.text, font: '800 28px/1.04 "Manrope", sans-serif', marginBottom: 8 }}>
                    {activeMeta.label}
                  </div>
                  <div style={{ color: UI.muted, font: '500 14px/1.55 "Manrope", sans-serif' }}>
                    {SALUD_TAB_META[activeTab].lead}
                  </div>
                </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 58, height: 58, borderRadius: 18, background: "rgba(9,7,18,.6)", border: `1px solid ${classTheme.accent}44`, display: "grid", placeItems: "center" }}>
                      <Img src={stagePreviewAsset.src} fallbackSrc={stagePreviewAsset.fallback} alt="" style={{ width: 30, height: 30, imageRendering: activeMeta.id === "ejercicio" ? "auto" : "pixelated" }} />
                    </div>
                    <div style={{ width: 58, height: 58, borderRadius: 18, background: "rgba(9,7,18,.6)", border: `1px solid ${classTheme.accent}44`, display: "grid", placeItems: "center" }}>
                      <Img src={classTheme.crest} alt="" style={{ width: 34, height: 34 }} />
                    </div>
                  </div>
              </div>

              <div />

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "end" }}>
                <div className="ush-soft-card" style={{ backdropFilter: "blur(10px)", background: "rgba(9,7,18,.58)" }}>
                  <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                    Hoy conviene revisar
                  </div>
                  <div style={{ color: UI.text, font: '800 24px/1.08 "Manrope", sans-serif', marginBottom: 6 }}>
                    {recommendedMeta.title}
                  </div>
                  <div style={{ color: UI.muted, font: '500 14px/1.55 "Manrope", sans-serif' }}>
                    {routeSummary[recommendedId] || recommendedMeta.lead}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => (suggestedActionMeta.done ? goToTab(recommendedId) : suggestedActionMeta.run())}
                  aria-label={`${suggestedActionMeta.done ? "Abrir" : "Registrar"} ruta sugerida: ${recommendedMeta.title}`}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    border: `1px solid ${classTheme.accent}55`,
                    background: `linear-gradient(135deg, ${classTheme.soft}, rgba(255,255,255,.03))`,
                    color: UI.text,
                    borderRadius: 18,
                    padding: "12px 16px",
                    cursor: "pointer",
                    font: '700 13px/1 "Manrope", sans-serif',
                    transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = `0 8px 24px ${classTheme.accent}44`; e.currentTarget.style.borderColor = `${classTheme.accent}88`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = ""; }}
                >
                  <span className="ush-btn-shimmer" />
                  {actionSaving === suggestedActionMeta.savingKey ? "Guardando..." : suggestedActionMeta.done ? "Abrir ruta" : suggestedActionMeta.label}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="ush-card ush-strip">
          {routeNodes.map((node) => (
            <button
              key={node.title}
              type="button"
              className="ush-node"
              onClick={node.action}
              aria-label={`${node.title}. ${node.text}. ${node.actionLabel}.`}
              aria-current={node.targetId === activeTab ? "true" : undefined}
              title={node.actionLabel}
              style={{ cursor: "pointer", textAlign: "left" }}
            >
              <Img src={node.asset.src} fallbackSrc={node.asset.fallback} alt="" style={{ width: 38, height: 38, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 5 }}>
                  {node.title}
                </div>
                <div style={{ color: UI.text, font: '600 14px/1.45 "Manrope", sans-serif' }}>{node.text}</div>
              </div>
            </button>
          ))}
        </section>

        <section className="ush-card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                Que revisar hoy
              </div>
              <div style={{ color: UI.text, font: '800 24px/1.08 "Manrope", sans-serif', marginBottom: 6 }}>
                Tres señales para no entrar al dia a ciegas
              </div>
              <div style={{ color: UI.muted, font: '500 14px/1.55 "Manrope", sans-serif', maxWidth: 760 }}>
                Sueño, agua y recuperación se leen primero porque cambian claridad, energía y adherencia antes de que el resto del mapa reaccione.
              </div>
            </div>
            <span className="ush-chip" style={{ color: UI.deepMuted }}>{summaryBanner}</span>
          </div>
          <div className="ush-grid-3">
            {todaySignals.map((signal) => (
              <div key={signal.label} className="ush-soft-card" style={{ borderColor: `${signal.color}22`, transition: "transform .18s ease, border-color .18s ease, box-shadow .18s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = `${signal.color}55`; e.currentTarget.style.boxShadow = `0 10px 26px ${signal.color}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", border: `1px solid ${signal.color}33`, background: `color-mix(in srgb, ${signal.color}, transparent 92%)` }}>
                      <Img src={signal.asset.src} fallbackSrc={signal.asset.fallback} alt="" style={{ width: 22, height: 22, filter: `drop-shadow(0 0 6px ${signal.color}88)` }} />
                    </div>
                    <div>
                      <div style={{ color: UI.text, font: '800 14px/1.2 "Manrope", sans-serif' }}>{signal.label}</div>
                      <div style={{ color: UI.deepMuted, font: '700 10px/1 "JetBrains Mono", monospace', letterSpacing: ".08em", textTransform: "uppercase", marginTop: 4 }}>senal de hoy</div>
                    </div>
                  </div>
                  <div style={{ color: signal.color, font: '900 22px/1 "Manrope", sans-serif', textShadow: `0 0 14px ${signal.color}cc, 0 0 28px ${signal.color}55` }}>{signal.value}%</div>
                </div>
                <div className="ush-bar" style={{ marginBottom: 10 }}>
                  <span style={{ width: `${signal.value}%`, background: signal.color, boxShadow: `0 0 8px ${signal.color}88` }} />
                </div>
                <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{signal.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ush-layout">
          <div className="ush-main">
            <div className="ush-card ush-tab-wrap">
              <div className="ush-tab-head">
                <div style={{ maxWidth: 760 }}>
                  <div style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
                    {SALUD_TAB_META[activeTab].kicker}
                  </div>
                  <h2 style={{ margin: 0, font: '900 clamp(1.4rem, 2vw, 2.2rem)/1.06 "Manrope", sans-serif', textShadow: "0 0 24px var(--salud-accent), 0 0 48px color-mix(in srgb, var(--salud-accent), transparent 65%)" }}>
                    {SALUD_TAB_META[activeTab].title}
                  </h2>
                  <p style={{ margin: "10px 0 0", color: UI.muted, font: '500 15px/1.65 "Manrope", sans-serif' }}>
                    {SALUD_TAB_META[activeTab].lead}
                  </p>
                </div>

                <div className="ush-chip-row">
                  <span className="ush-chip" style={{ color: classTheme.accent, borderColor: `${classTheme.accent}33` }}>
                    <Img src={classTheme.crest} alt="" style={{ width: 18, height: 18 }} />
                    {classTheme.label}
                  </span>
                  <span className="ush-chip" style={{ color: UI.gold, borderColor: "rgba(243,201,105,.24)" }}>
                    {SALUD_TAB_META[activeTab].reward}
                  </span>
                </div>
              </div>

              <div className="ush-tabs" role="tablist" aria-label="Modulos de salud y bienestar">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`ush-tab${tab.id === activeTab ? " active" : ""}`}
                    style={{ "--tab-color": tab.color }}
                    id={`ush-tab-${tab.id}`}
                    role="tab"
                    aria-selected={tab.id === activeTab}
                    aria-current={tab.id === activeTab ? "page" : undefined}
                    aria-controls={`ush-panel-${tab.id}`}
                    aria-label={`Abrir modulo ${tab.label}`}
                    onClick={() => goToTab(tab.id, { scroll: false })}
                  >
                    <Img src={tab.asset} fallbackSrc={tab.fallbackAsset} alt="" style={{ width: 18, height: 18 }} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              {actionPulse && (
                <div className="ush-soft-card" style={{ marginTop: 14, borderColor: `${actionPulse.tone}44`, background: `color-mix(in srgb, ${actionPulse.tone}, transparent 92%)` }}>
                  <div style={{ color: actionPulse.tone, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
                    Registro del dia
                  </div>
                  <div style={{ color: UI.text, font: '700 14px/1.4 "Manrope", sans-serif' }}>{actionPulse.label}</div>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="ush-card"
                id={`ush-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`ush-tab-${activeTab}`}
                tabIndex={-1}
              >
                <TabContent activeTab={activeTab} daily={dailyState} onAction={handleSaludAction} loading={actionSaving} classKey={classKey} />
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="ush-side">
            <div className="ush-card" style={{ padding: 18 }}>
              <div style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
                Archivo del modulo
              </div>
              <div className="ush-list">
                <div className="ush-soft-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Img src={activeGuide.asset.src} fallbackSrc={activeGuide.asset.fallback} alt="" style={{ width: 22, height: 22 }} />
                    <div style={{ color: UI.text, font: '800 14px/1.3 "Manrope", sans-serif' }}>{activeGuide.title}</div>
                  </div>
                  <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
                    {activeGuide.text}
                  </div>
                </div>
                <div className="ush-soft-card">
                  <div style={{ color: UI.text, font: '800 14px/1.3 "Manrope", sans-serif', marginBottom: 6 }}>Lectura por clase</div>
                  <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
                    {classHint}
                  </div>
                </div>
                <div className="ush-soft-card">
                  <div style={{ color: UI.text, font: '800 14px/1.3 "Manrope", sans-serif', marginBottom: 6 }}>Punto mas flojo hoy</div>
                  <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
                    Tu lectura mas baja ahora cae en <strong style={{ color: lowestMarker.color }}>{lowestMarker.label.toLowerCase()}</strong>. Si ajustas eso primero, el resto del tablero responde mejor.
                  </div>
                </div>
                {(supportFlags.xpBonus || supportFlags.xpMult || supportFlags.streakShieldActive) && (
                  <div className="ush-soft-card">
                    <div style={{ color: UI.gold, font: '800 14px/1.3 "Manrope", sans-serif', marginBottom: 6 }}>Apoyo del inventario</div>
                    <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
                      {supportFlags.streakShieldActive
                        ? "Tu escudo de racha sigue activo. Hoy conviene priorizar cierre limpio y recuperación antes de regalar continuidad."
                        : supportFlags.xpMult
                          ? "Hay un impulso de XP activo. Si abres movimiento o cierras un módulo completo, el retorno del día mejora."
                          : "Tienes un apoyo activo en economía. Aprovecha un cierre real del módulo recomendado para no desperdiciarlo."}
                    </div>
                  </div>
                )}
                <div className="ush-soft-card">
                  <div style={{ color: UI.text, font: '800 14px/1.3 "Manrope", sans-serif', marginBottom: 8 }}>Errores comunes</div>
                  <div className="ush-list">
                    {currentMistakes.map((line) => (
                      <div key={line} className="ush-row">
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: classTheme.accent, flexShrink: 0, marginTop: 6 }} />
                        <div style={{ color: UI.muted, font: '500 12px/1.55 "Manrope", sans-serif' }}>{line}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ush-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase" }}>
                  Marcadores rapidos
                </div>
                <span className="ush-chip" style={{ padding: "6px 9px", color: UI.deepMuted }}>
                  {saludSummary?.daily ? "Lectura mixta" : "Lectura estimada"}
                </span>
              </div>
              <div style={{ color: UI.muted, font: '500 12px/1.5 "Manrope", sans-serif', marginBottom: 10 }}>
                Ahora combinan progreso diario real con clase, hora, racha y actividad reciente para que la sugerencia no viva solo de fórmulas locales.
              </div>
              {quickMarkers.map((row) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, font: '600 13px/1 "Manrope", sans-serif', color: UI.muted }}>
                    <span>{row.label}</span>
                    <span style={{ color: row.color }}>{row.value}%</span>
                  </div>
                  <div className="ush-bar">
                    <span style={{ width: `${row.value}%`, background: row.color }} />
                  </div>
                </div>
              ))}
              <div className="ush-soft-card" style={{ marginTop: 4 }}>
                <div style={{ color: strongestMarker.color, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                  Fortaleza actual
                </div>
                <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>
                  El mejor marcador del momento es <strong style={{ color: strongestMarker.color }}>{strongestMarker.label.toLowerCase()}</strong>. La idea ahora es sostenerlo sin descuidar el punto más bajo.
                </div>
              </div>
            </div>

            <div className="ush-card" style={{ padding: 18 }}>
              <div style={{ color: classTheme.accent, font: '700 11px/1 "JetBrains Mono", monospace', letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 10 }}>
                Ruta minima semanal
              </div>
              <div className="ush-list">
                {weeklyRoute.map((line) => (
                  <div key={line} className="ush-row">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: UI.success, flexShrink: 0, marginTop: 6 }} />
                    <div style={{ color: UI.muted, font: '500 13px/1.55 "Manrope", sans-serif' }}>{line}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
