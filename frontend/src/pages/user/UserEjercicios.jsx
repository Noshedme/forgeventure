import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  Award,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Info,
  Lock,
  Play,
  Search,
  SlidersHorizontal,
  Star,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase.js";
import { getEjerciciosPublicos, getCategoriasPublicas, completarSesion } from "../../services/api.js";
import { USER_CLASS_THEME } from "./userClassTheme.js";
import { canShowXpPopups } from "../../utils/runtimeSettings.js";
import PoseCamera from "../../components/exercise/PoseCamera.jsx";
import { getExerciseDetector, needsCameraTip } from "../../components/exercise/exerciseLogic.js";

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

const ZONE_META = {
  Todos: {
    key: "todos",
    label: "Mapa completo",
    short: "General",
    icon: "/ui/icons/map-pin.png",
    banner: "/exercises/zones/zone-general-banner.png",
    daily: "/exercises/daily/daily-zone-general.png",
    color: "#c08aff",
    summary: "Todo el campo de entrenamiento a la vista.",
  },
  Fuerza: {
    key: "fuerza",
    label: "Bastion de fuerza",
    short: "Fuerza",
    icon: "/ui/icons/quest-fuerza.png",
    banner: "/exercises/zones/zone-fuerza-banner.png",
    daily: "/exercises/daily/daily-zone-fuerza.png",
    color: "#ff4d5e",
    summary: "Empuje, piernas y control para construir base real.",
  },
  Cardio: {
    key: "cardio",
    label: "Ruta de cardio",
    short: "Cardio",
    icon: "/ui/icons/quest-cardio.png",
    banner: "/exercises/zones/zone-cardio-banner.png",
    daily: "/exercises/daily/daily-zone-cardio.png",
    color: "#4cc9f0",
    summary: "Pulso, resistencia y ritmo para sostener el avance.",
  },
  Flexibilidad: {
    key: "flexibilidad",
    label: "Santuario movil",
    short: "Flexibilidad",
    icon: "/ui/icons/quest-flexibilidad.png",
    banner: "/exercises/zones/zone-flexibilidad-banner.png",
    daily: "/exercises/daily/daily-zone-flexibilidad.png",
    color: "#c08aff",
    summary: "Movilidad, control y recuperacion con tecnica limpia.",
  },
  HIIT: {
    key: "hiit",
    label: "Frente de impacto",
    short: "HIIT",
    icon: "/ui/icons/quest-cardio.png",
    banner: "/exercises/zones/zone-hiit-banner.png",
    daily: "/exercises/daily/daily-zone-hiit.png",
    color: "#ff8659",
    summary: "Explosividad y tramos cortos donde el ritmo manda.",
  },
  Calistenia: {
    key: "calistenia",
    label: "Torre de control",
    short: "Calistenia",
    icon: "/ui/icons/quest-fuerza.png",
    banner: "/exercises/zones/zone-calistenia-banner.png",
    daily: "/exercises/daily/daily-zone-calistenia.png",
    color: "#f3c969",
    summary: "Fuerza relativa, dominio corporal y precision tecnica.",
  },
  Funcional: {
    key: "funcional",
    label: "Patio funcional",
    short: "Funcional",
    icon: "/ui/icons/quest-hidratacion.png",
    banner: "/exercises/zones/zone-funcional-banner.png",
    daily: "/exercises/daily/daily-zone-funcional.png",
    color: "#5ad8c8",
    summary: "Core, estabilidad y patrones utiles para todo el mapa.",
  },
};

const HERO_SCENE = {
  GUERRERO: "/exercises/hero/training-scene-warrior.png",
  ARQUERO: "/exercises/hero/training-scene-archer.png",
  MAGO: "/exercises/hero/training-scene-mage.png",
  DEFAULT: "/exercises/hero/training-scene-default.png",
};

const HERO_GLOW = {
  GUERRERO: "/exercises/hero/hero-floor-glow-warrior.png",
  ARQUERO: "/exercises/hero/hero-floor-glow-archer.png",
  MAGO: "/exercises/hero/hero-floor-glow-mage.png",
  DEFAULT: "/exercises/hero/hero-floor-glow-default.png",
};

const CLASS_COPY = {
  GUERRERO: {
    title: "Forja fuerza real",
    lead: "Tu campo prioriza empuje, piernas y trabajo funcional. Menos ruido, mas progreso fisico con pinta de aventura.",
    focus: "Fuerza, calistenia y control del cuerpo.",
  },
  ARQUERO: {
    title: "Afina velocidad y resistencia",
    lead: "El mapa abre rutas mas ligeras y agresivas: cardio, HIIT y movilidad activa para mantener el ritmo arriba.",
    focus: "Pulso, desplazamiento y sesiones agiles.",
  },
  MAGO: {
    title: "Domina control corporal",
    lead: "Tu ruta mezcla movilidad, respiracion y precision. El objetivo es entrenar sin perder tecnica ni energia mental.",
    focus: "Flexibilidad, core y flujo limpio.",
  },
  DEFAULT: {
    title: "Abre tu campo de entrenamiento",
    lead: "Un mapa mas claro para entrar, entrenar y salir con progreso visible. Todo se mueve con la clase del heroe.",
    focus: "Base fisica y progreso medible.",
  },
};

const CLASS_AFFINITY = {
  GUERRERO: ["Fuerza", "Calistenia", "Funcional"],
  ARQUERO: ["Cardio", "HIIT", "Funcional"],
  MAGO: ["Flexibilidad", "Funcional"],
  DEFAULT: ["Funcional"],
};

const DIFICULTY_COLOR = {
  Principiante: "#7bdc3b",
  Intermedio: "#f3c969",
  Avanzado: "#ff8659",
  Elite: "#ff4d5e",
};

const DETAIL_ANATOMY_ASSET = {
  fuerza: "/exercises/detail/anatomy-fuerza.png",
  cardio: "/exercises/detail/anatomy-cardio.png",
  flexibilidad: "/exercises/detail/anatomy-flexibilidad.png",
  hiit: "/exercises/detail/anatomy-hiit.png",
  calistenia: "/exercises/detail/anatomy-calistenia.png",
  funcional: "/exercises/detail/anatomy-funcional.png",
  default: "/exercises/detail/anatomy-general.png",
};

const DETAIL_LEVEL_ASSET = {
  Principiante: "/exercises/detail/level-principiante.png",
  Intermedio: "/exercises/detail/level-intermedio.png",
  Avanzado: "/exercises/detail/level-avanzado.png",
  Elite: "/exercises/detail/level-elite.png",
};

const DETAIL_EQUIPMENT_ASSET = {
  bodyweight: "/exercises/detail/equipment-bodyweight.png",
  mat: "/exercises/detail/equipment-mat.png",
  bar: "/exercises/detail/equipment-bar.png",
  timer: "/exercises/detail/equipment-timer.png",
  camera: "/exercises/detail/equipment-camera.png",
};

const VERIFICATION_ASSET = {
  Camara: "/exercises/chips/chip-camera.png",
  Timer: "/exercises/chips/chip-timer.png",
  Manual: "/exercises/chips/chip-manual.png",
};

const BOSS_CREST_ASSET = {
  resistencia: "/bosses/crests/boss-resistencia.png",
  movilidad: "/bosses/crests/boss-movilidad.png",
  core: "/bosses/crests/boss-core.png",
  default: "/bosses/crests/boss-general.png",
};

const STATE_ASSET = {
  emptyLibrary: "/exercises/states/state-empty-library.png",
  emptyRoute: "/exercises/states/state-empty-route.png",
  emptyZone: "/exercises/states/state-empty-zone.png",
  blockedQuest: "/exercises/states/state-blocked-quest.png",
  blockedDetail: "/exercises/states/state-blocked-detail.png",
};

const CATALOG_PREVIEW_COUNT = 6;

const EXERCISES = [
  {
    id: "e1",
    nombre: "Flexiones",
    cat: "Fuerza",
    dificultad: "Principiante",
    xpBase: 30,
    series: 3,
    reps: 15,
    duracion: null,
    verif: "Camara",
    musculos: ["Pecho", "Triceps", "Hombros"],
    desc: "Patron base de empuje para construir fuerza del tren superior con tecnica limpia.",
    completadas: 8,
    bloqueado: false,
  },
  {
    id: "e2",
    nombre: "Sentadillas",
    cat: "Fuerza",
    dificultad: "Principiante",
    xpBase: 35,
    series: 4,
    reps: 12,
    duracion: null,
    verif: "Camara",
    musculos: ["Piernas", "Gluteos"],
    desc: "Quest clave para piernas y base de potencia. Baja con control y sube con estabilidad.",
    completadas: 5,
    bloqueado: false,
  },
  {
    id: "e3",
    nombre: "Cardio Libre",
    cat: "Cardio",
    dificultad: "Intermedio",
    xpBase: 60,
    series: 1,
    reps: null,
    duracion: 30,
    verif: "Timer",
    musculos: ["Cuerpo completo"],
    desc: "Tramo continuo para sostener el pulso y sumar resistencia sin cortar el ritmo.",
    completadas: 3,
    bloqueado: false,
  },
  {
    id: "e4",
    nombre: "Plancha",
    cat: "Funcional",
    dificultad: "Intermedio",
    xpBase: 40,
    series: 3,
    reps: null,
    duracion: 60,
    verif: "Timer",
    musculos: ["Abdomen", "Hombros", "Espalda"],
    desc: "Ancla del core para reforzar estabilidad y control postural.",
    completadas: 6,
    bloqueado: false,
  },
  {
    id: "e5",
    nombre: "Dominadas",
    cat: "Calistenia",
    dificultad: "Avanzado",
    xpBase: 55,
    series: 3,
    reps: 8,
    duracion: null,
    verif: "Camara",
    musculos: ["Espalda", "Biceps"],
    desc: "Reto de control corporal y traccion. Sube sin balancear el cuerpo.",
    completadas: 2,
    bloqueado: false,
  },
  {
    id: "e6",
    nombre: "Yoga Matutino",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 45,
    series: 1,
    reps: null,
    duracion: 20,
    verif: "Timer",
    musculos: ["Cuerpo completo"],
    desc: "Secuencia de movilidad para abrir articulaciones y bajar tension antes del dia.",
    completadas: 4,
    bloqueado: false,
  },
  {
    id: "e7",
    nombre: "HIIT Explosivo",
    cat: "HIIT",
    dificultad: "Avanzado",
    xpBase: 90,
    series: 6,
    reps: null,
    duracion: 20,
    verif: "Timer",
    musculos: ["Cuerpo completo", "Piernas"],
    desc: "Intervalos cortos de alta intensidad para sacar potencia y resistencia rapido.",
    completadas: 1,
    bloqueado: false,
  },
  {
    id: "e8",
    nombre: "Press Militar",
    cat: "Fuerza",
    dificultad: "Intermedio",
    xpBase: 45,
    series: 4,
    reps: 10,
    duracion: null,
    verif: "Camara",
    musculos: ["Hombros", "Triceps"],
    desc: "Empuje vertical para hombros solidos y torso estable.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e9",
    nombre: "Burpees",
    cat: "HIIT",
    dificultad: "Avanzado",
    xpBase: 70,
    series: 4,
    reps: 10,
    duracion: null,
    verif: "Camara",
    musculos: ["Cuerpo completo"],
    desc: "Quest intensa para coordinar salto, empuje y capacidad de recuperacion.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e10",
    nombre: "Estiramiento Total",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 20,
    series: 1,
    reps: null,
    duracion: 15,
    verif: "Timer",
    musculos: ["Cuerpo completo"],
    desc: "Cierre suave para soltar el cuerpo y ganar rango de movimiento.",
    completadas: 10,
    bloqueado: false,
  },
  {
    id: "e11",
    nombre: "Fondos en Paralelas",
    cat: "Calistenia",
    dificultad: "Avanzado",
    xpBase: 55,
    series: 3,
    reps: 12,
    duracion: null,
    verif: "Camara",
    musculos: ["Pecho", "Triceps", "Hombros"],
    desc: "Trabajo premium del tren superior con foco en control del recorrido.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e12",
    nombre: "Pilates Core",
    cat: "Flexibilidad",
    dificultad: "Intermedio",
    xpBase: 35,
    series: 1,
    reps: null,
    duracion: 25,
    verif: "Timer",
    musculos: ["Abdomen", "Espalda"],
    desc: "Sesion de core y movilidad para mejorar control, postura y respiracion.",
    completadas: 2,
    bloqueado: false,
  },
  {
    id: "e13",
    nombre: "Zancadas",
    cat: "Fuerza",
    dificultad: "Principiante",
    xpBase: 32,
    series: 3,
    reps: 12,
    duracion: null,
    verif: "Camara",
    musculos: ["Piernas", "Gluteos"],
    desc: "Trabajo unilateral para piernas firmes y mejor equilibrio.",
    completadas: 3,
    bloqueado: false,
  },
  {
    id: "e14",
    nombre: "Sprints Cortos",
    cat: "Cardio",
    dificultad: "Intermedio",
    xpBase: 50,
    series: 8,
    reps: null,
    duracion: 30,
    verif: "Timer",
    musculos: ["Piernas", "Cuerpo completo"],
    desc: "Aceleraciones cortas para ritmo, velocidad y recuperacion entre tramos.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e15",
    nombre: "Muscle Up",
    cat: "Calistenia",
    dificultad: "Elite",
    xpBase: 120,
    series: 3,
    reps: 5,
    duracion: null,
    verif: "Camara",
    musculos: ["Espalda", "Pecho", "Triceps"],
    desc: "Prueba elite de fuerza y tecnica. Solo cuando la base ya esta lista.",
    completadas: 0,
    bloqueado: true,
  },
  // ── YOGA & POSES (verif: YogaHold) ────────────────────────────────────────
  {
    id: "e16",
    nombre: "Perro Boca Abajo",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 28,
    series: 2,
    reps: 1,
    duracion: null,
    holdTargetSec: 45,
    verif: "YogaHold",
    musculos: ["Espalda", "Hombros", "Isquiotibiales"],
    desc: "Postura base de yoga que alarga la espalda, abre los hombros y estira los isquios. La IA valida la V invertida.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e17",
    nombre: "Guerrero II",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 25,
    series: 2,
    reps: 1,
    duracion: null,
    holdTargetSec: 30,
    verif: "YogaHold",
    musculos: ["Piernas", "Caderas", "Hombros"],
    desc: "Postura de apertura y potencia. Dobla la rodilla delantera y extiende los brazos al nivel de los hombros.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e18",
    nombre: "Postura del Nino",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 20,
    series: 1,
    reps: 1,
    duracion: null,
    holdTargetSec: 60,
    verif: "YogaHold",
    musculos: ["Espalda baja", "Caderas", "Hombros"],
    desc: "Postura restaurativa para liberar tension lumbar y centrar la respiracion entre series intensas.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e19",
    nombre: "Estiramiento de Isquios",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 22,
    series: 2,
    reps: 1,
    duracion: null,
    holdTargetSec: 40,
    verif: "YogaHold",
    musculos: ["Isquiotibiales", "Gluteos", "Espalda baja"],
    desc: "Dobla el torso hacia adelante y sostiene la posicion para liberar la cadena posterior completa.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e20",
    nombre: "Puente de Caderas",
    cat: "Flexibilidad",
    dificultad: "Principiante",
    xpBase: 30,
    series: 3,
    reps: 1,
    duracion: null,
    holdTargetSec: 30,
    verif: "YogaHold",
    musculos: ["Gluteos", "Core", "Espalda baja"],
    desc: "Tumbado boca arriba, eleva las caderas y sostiene la posicion apretando gluteos y core.",
    completadas: 0,
    bloqueado: false,
  },
  {
    id: "e21",
    nombre: "Plancha IA",
    cat: "Funcional",
    dificultad: "Intermedio",
    xpBase: 45,
    series: 3,
    reps: 1,
    duracion: null,
    holdTargetSec: 60,
    verif: "YogaHold",
    musculos: ["Abdomen", "Hombros", "Espalda"],
    desc: "Plancha con validacion de camara IA en tiempo real. El tiempo se acumula solo si la alineacion es correcta.",
    completadas: 0,
    bloqueado: false,
  },
];

const CSS = `
  .uex-page {
    min-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    color: ${UI.text};
    background:
      radial-gradient(circle at 14% 18%, color-mix(in srgb, var(--class-accent), transparent 86%), transparent 26%),
      radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--class-secondary), transparent 88%), transparent 24%),
      linear-gradient(180deg, #090512 0%, var(--class-bg) 48%, #090611 100%);
    position: relative;
  }
  .uex-page::before {
    content: "";
    position: fixed;
    inset: 58px 0 0 0;
    pointer-events: none;
    opacity: .2;
    background: url("/ui/dashboard-particles.png") center/cover;
    mix-blend-mode: screen;
  }
  .uex-shell {
    width: min(100%, 1680px);
    margin: 0 auto;
    padding: clamp(14px, 2vw, 32px);
    box-sizing: border-box;
    display: grid;
    gap: 12px;
    position: relative;
    z-index: 1;
  }
  .uex-panel {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: linear-gradient(180deg, rgba(20,10,34,.78), rgba(8,5,17,.86));
    box-shadow:
      0 24px 68px rgba(0,0,0,.34),
      inset 0 1px 0 rgba(255,255,255,.05);
  }
  .uex-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(290px, .92fr);
    align-items: start;
    padding: clamp(14px, 1.8vw, 22px);
    gap: clamp(14px, 2vw, 22px);
  }
  .uex-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 68%);
    background: rgba(255,255,255,.04);
    color: var(--class-accent);
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-kicker img,
  .uex-kicker svg,
  .uex-chip img,
  .uex-chip svg,
  .uex-row-chip img,
  .uex-row-chip svg,
  .uex-action-chip img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .uex-hero-copy {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 10px;
    min-width: 0;
  }
  .uex-hero-next {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.09);
    background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  }
  .uex-hero-next-ico {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05);
    overflow: hidden;
    flex-shrink: 0;
  }
  .uex-hero-next-ico img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
  .uex-hero-next-copy strong {
    display: block;
    font: 800 13px/1.1 "Manrope", sans-serif;
    color: ${UI.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .uex-hero-next-copy span {
    display: block;
    margin-top: 3px;
    font: 700 10px/1 "JetBrains Mono", monospace;
    color: ${UI.deepMuted};
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .uex-hero-next-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .uex-hero-next-xp {
    font: 900 12px/1 "JetBrains Mono", monospace;
    color: #fff2d7;
    white-space: nowrap;
  }
  .uex-hero-copy h1 {
    margin: 0;
    font: 900 clamp(36px, 5.2vw, 80px)/.92 "Manrope", sans-serif;
    letter-spacing: 0;
    color: #fff9ef;
    max-width: 880px;
  }
  .uex-hero-copy h1 span {
    color: var(--class-accent);
    text-shadow: 0 0 34px color-mix(in srgb, var(--class-accent), transparent 45%);
  }
  .uex-hero-copy p {
    margin: 0;
    max-width: 720px;
    color: #cdbfe0;
    font: 500 clamp(14px, 1.2vw, 18px)/1.7 "Manrope", sans-serif;
  }
  .uex-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .uex-btn,
  .uex-btn-ghost {
    min-height: 36px;
    border-radius: 8px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, background .18s ease;
    font: 800 12px/1 "Manrope", sans-serif;
  }
  .uex-btn:hover,
  .uex-btn-ghost:hover {
    transform: translateY(-2px);
  }
  .uex-btn {
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 62%);
    background: color-mix(in srgb, var(--class-accent), transparent 84%);
    color: #fff7f2;
  }
  .uex-btn-ghost {
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.05);
    color: ${UI.text};
  }
  .uex-hero-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .uex-kpi {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
    backdrop-filter: blur(18px);
    min-width: 0;
  }
  .uex-kpi strong {
    display: block;
    font: 900 clamp(16px, 1.7vw, 22px)/1 "JetBrains Mono", monospace;
    color: #fff4de;
  }
  .uex-kpi span {
    display: block;
    margin-top: 4px;
    color: ${UI.deepMuted};
    font: 700 10px/1.2 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-stage {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 70%);
    background: linear-gradient(105deg,
      rgba(10, 8, 20, .82) 0%,
      rgba(10, 8, 20, .65) 60%,
      rgba(10, 8, 20, .45) 100%);
  }
  .uex-stage::before {
    content: '';
    position: absolute;
    inset: -10px;
    background: var(--stage-scene, none) center/cover no-repeat;
    filter: blur(14px);
    opacity: 0.28;
    z-index: 0;
    pointer-events: none;
  }
  .uex-stage > * {
    position: relative;
    z-index: 1;
  }
  .uex-stage-ico {
    width: clamp(44px, 4.8vw, 56px);
    height: clamp(44px, 4.8vw, 56px);
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 58%);
    background: color-mix(in srgb, var(--class-accent), transparent 84%);
    display: grid;
    place-items: center;
    flex-shrink: 0;
    overflow: hidden;
  }
  .uex-stage-ico img {
    width: 62%;
    height: 62%;
    object-fit: contain;
    image-rendering: auto;
  }
  .uex-stage-body {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  .uex-stage-eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    font: 800 10px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: ${UI.muted};
  }
  .uex-stage-eyebrow span {
    color: var(--class-accent);
  }
  .uex-stage-title {
    display: block;
    font: 900 clamp(15px, 1.6vw, 20px)/1.08 "Manrope", sans-serif;
    color: #fff6ef;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .uex-stage-sub {
    margin: 0;
    color: #c4b8dc;
    font: 500 12px/1.5 "Manrope", sans-serif;
    max-width: 480px;
  }
  .uex-stage-progress {
    display: grid;
    gap: 4px;
  }
  .uex-stage-progress small {
    color: ${UI.deepMuted};
    font: 600 10px/1.4 "Manrope", sans-serif;
  }
  .uex-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .uex-chip,
  .uex-row-chip,
  .uex-action-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.05);
    color: ${UI.text};
    font: 800 10px/1 "JetBrains Mono", monospace;
  }
  .uex-row-chip {
    min-height: 24px;
    padding: 0 8px;
    color: ${UI.muted};
  }
  .uex-chip.is-focus,
  .uex-row-chip.is-focus {
    border-color: color-mix(in srgb, var(--class-accent), transparent 60%);
    color: var(--class-accent);
    background: color-mix(in srgb, var(--class-accent), transparent 88%);
  }
  .uex-verif-chip {
    color: ${UI.text};
    box-shadow: inset 0 1px 0 rgba(255,255,255,.04);
  }
  .uex-verif-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }
  .uex-affinity-seal {
    position: absolute;
    top: 12px;
    right: 12px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 56%);
    background: color-mix(in srgb, var(--class-accent), transparent 88%);
    color: var(--class-accent);
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
    z-index: 2;
  }
  .uex-affinity-seal img {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }
  .uex-daily {
    padding: 12px 16px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
  }
  .uex-daily-visual {
    width: clamp(52px, 6vw, 68px);
    height: clamp(52px, 6vw, 68px);
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--daily-color), transparent 56%);
    background:
      radial-gradient(circle at center, color-mix(in srgb, var(--daily-color), transparent 84%), transparent 70%),
      rgba(255,255,255,.03);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .uex-daily-visual img {
    width: 74%;
    height: 74%;
    object-fit: contain;
    image-rendering: auto;
  }
  .uex-daily-copy h2 {
    margin: 0 0 4px;
    font: 900 clamp(17px, 2vw, 24px)/1.08 "Manrope", sans-serif;
  }
  .uex-daily-copy p {
    margin: 0;
    color: ${UI.muted};
    font: 500 13px/1.52 "Manrope", sans-serif;
    max-width: 780px;
  }
  .uex-daily-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .uex-grid-2 {
    display: grid;
    grid-template-columns: minmax(0, .98fr) minmax(300px, .94fr);
    gap: 12px;
  }
  .uex-summary {
    padding: 14px;
    display: grid;
    gap: 10px;
  }
  .uex-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .uex-panel-head h3 {
    margin: 3px 0 0;
    font: 900 17px/1.04 "Manrope", sans-serif;
  }
  .uex-panel-head p {
    display: none;
  }
  .uex-panel-tag {
    color: var(--class-accent);
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-summary-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }
  .uex-summary-kpi {
    min-width: 0;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 10px;
  }
  .uex-summary-kpi-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .uex-summary-kpi-top img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
  .uex-summary-kpi strong {
    display: block;
    font: 900 15px/1 "JetBrains Mono", monospace;
    color: #fff4de;
  }
  .uex-summary-kpi span,
  .uex-summary-kpi small {
    display: block;
    color: ${UI.deepMuted};
  }
  .uex-summary-kpi span {
    font: 700 10px/1.2 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uex-summary-kpi small {
    margin-top: 6px;
    font: 600 11px/1.4 "Manrope", sans-serif;
  }
  .uex-chart-wrap {
    min-height: 160px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    padding: 10px 10px 4px;
    background:
      linear-gradient(180deg, rgba(11,8,20,.18), rgba(11,8,20,.1) 22%, rgba(11,8,20,.24)),
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01)),
      url("/exercises/summary/bitacora-chart-bg.png") center/cover;
  }
  .uex-chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  .uex-chart-title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .uex-chart-title img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
  .uex-chart-title strong {
    display: block;
    color: ${UI.text};
    font: 900 16px/1 "Manrope", sans-serif;
  }
  .uex-chart-title span {
    display: block;
    margin-top: 5px;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uex-tooltip {
    min-width: 180px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(10, 7, 19, .94);
    box-shadow: 0 18px 40px rgba(0,0,0,.35);
    padding: 12px;
  }
  .uex-tooltip strong {
    display: block;
    margin-bottom: 5px;
    color: #fff4de;
    font: 900 14px/1 "Manrope", sans-serif;
  }
  .uex-tooltip span {
    display: block;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uex-tooltip p {
    margin: 8px 0 0;
    color: ${UI.muted};
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .uex-quick {
    padding: 14px;
    display: grid;
    gap: 10px;
  }
  .uex-route-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .uex-route-chip {
    min-width: 0;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 10px;
  }
  .uex-route-chip strong {
    display: block;
    font: 900 15px/1 "JetBrains Mono", monospace;
    color: #fff4de;
  }
  .uex-route-chip span {
    display: block;
    margin-top: 4px;
    color: ${UI.deepMuted};
    font: 700 10px/1.2 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .uex-route {
    display: grid;
    gap: 12px;
    position: relative;
  }
  .uex-route-step {
    position: relative;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      rgba(255,255,255,.02);
    overflow: hidden;
  }
  .uex-route-step::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/dashboard-frame.png") center/cover;
    opacity: .05;
    pointer-events: none;
  }
  .uex-route-step:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 25px;
    top: 56px;
    bottom: -16px;
    width: 2px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--class-accent), transparent 28%), transparent);
    pointer-events: none;
  }
  .uex-route-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--class-accent), transparent 54%);
    background: color-mix(in srgb, var(--class-accent), transparent 86%);
    color: #fff6ef;
    font: 900 13px/1 "JetBrains Mono", monospace;
    box-shadow: 0 0 14px color-mix(in srgb, var(--class-accent), transparent 82%);
    position: relative;
    z-index: 1;
  }
  .uex-route-reward {
    display: grid;
    justify-items: end;
    gap: 6px;
  }
  .uex-route-reward strong {
    font: 900 13px/1 "JetBrains Mono", monospace;
    color: #fff2d7;
  }
  .uex-route-footer {
    display: none;
  }
  .uex-route-footer-copy {
    min-width: 0;
  }
  .uex-route-footer-copy strong {
    display: block;
    font: 900 17px/1.1 "Manrope", sans-serif;
    color: #fff4de;
  }
  .uex-route-footer-copy p {
    margin: 6px 0 0;
    color: ${UI.muted};
    font: 500 13px/1.55 "Manrope", sans-serif;
  }
  .uex-route-footer-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }
  .uex-route-empty {
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,.12);
    padding: 14px;
    color: ${UI.muted};
    background: rgba(255,255,255,.025);
    text-align: center;
    font: 600 13px/1.55 "Manrope", sans-serif;
  }
  .uex-quick-list {
    display: none !important;
  }
  .uex-icon-tile {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    overflow: hidden;
  }
  .uex-icon-tile img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }
  .uex-row-copy strong,
  .uex-zone-spotlight-copy h3 {
    display: block;
    min-width: 0;
    font: 900 16px/1.1 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-row-copy p,
  .uex-zone-spotlight-copy p {
    margin: 4px 0 0;
    color: ${UI.muted};
    font: 500 13px/1.55 "Manrope", sans-serif;
  }
  .uex-zones {
    padding: 14px;
    display: grid;
    gap: 12px;
  }
  .uex-zones-track {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }
  .uex-zone-card {
    position: relative;
    min-height: 118px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: left;
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }
  .uex-zone-card:hover {
    transform: translateY(-3px);
  }
  .uex-zone-card.is-active {
    border-color: color-mix(in srgb, var(--class-accent), transparent 52%);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--class-accent), transparent 60%), 0 18px 36px rgba(0,0,0,.22);
  }
  .uex-zone-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--zone-banner);
    background-size: cover;
    background-position: center;
    opacity: .24;
  }
  .uex-zone-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(10, 7, 19, .28), rgba(10, 7, 19, .9));
  }
  .uex-zone-card > * {
    position: relative;
    z-index: 1;
  }
  .uex-zone-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }
  .uex-zone-top img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  .uex-zone-name {
    font: 900 13px/1.08 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-zone-sub {
    margin-top: 5px;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .uex-zone-bottom {
    display: grid;
    gap: 10px;
  }
  .uex-zone-mini {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: ${UI.muted};
    font: 700 11px/1 "JetBrains Mono", monospace;
  }
  .uex-rpg-bar {
    position: relative;
    height: 12px;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.08);
    background-color: rgba(255,255,255,.04);
    background-image: url("/ui/bars/bar-track-tile.png");
    background-size: auto 100%;
  }
  .uex-rpg-fill {
    position: relative;
    height: 100%;
    border-radius: inherit;
    background-image:
      linear-gradient(90deg, color-mix(in srgb, var(--bar-color), transparent 18%), var(--bar-color)),
      url("/ui/bars/bar-fill-tile.png");
    background-size: auto, auto 100%;
    box-shadow: 0 0 16px color-mix(in srgb, var(--bar-color), transparent 58%);
  }
  .uex-rpg-fill::after {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/bars/bar-shine-tile.png");
    background-size: auto 100%;
    mix-blend-mode: screen;
    opacity: .4;
  }
  .uex-spotlight {
    padding: 14px;
    display: grid;
    gap: 12px;
  }
  .uex-zone-spotlight {
    position: relative;
    min-height: 170px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.08);
  }
  .uex-zone-spotlight::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: var(--spotlight-banner);
    background-size: cover;
    background-position: center;
    opacity: .36;
  }
  .uex-zone-spotlight::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(8, 6, 16, .94) 0%, rgba(8, 6, 16, .74) 44%, rgba(8, 6, 16, .92) 100%);
  }
  .uex-zone-spotlight-layout {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, .94fr);
    gap: 14px;
    padding: 14px;
    min-height: 100%;
    align-items: end;
  }
  .uex-zone-spotlight-copy {
    max-width: 680px;
    display: grid;
    gap: 8px;
  }
  .uex-zone-spotlight-copy p {
    max-width: 620px;
  }
  .uex-zone-spotlight-copy h3 {
    margin: 0;
    font-size: clamp(20px, 2.4vw, 32px);
  }
  .uex-zone-side {
    align-self: stretch;
    display: grid;
    gap: 10px;
  }
  .uex-zone-side-card {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(10, 7, 19, .82);
    backdrop-filter: blur(12px);
    padding: 10px;
  }
  .uex-zone-side-card strong {
    display: block;
    font: 900 14px/1.1 "Manrope", sans-serif;
  }
  .uex-zone-side-card p {
    margin: 6px 0 0;
    color: ${UI.muted};
    font: 500 12px/1.55 "Manrope", sans-serif;
  }
  .uex-boss-arena {
    padding: 14px;
    display: grid;
    gap: 12px;
  }
  .uex-boss-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .uex-boss-card {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      rgba(255,255,255,.03);
    padding: 14px;
    display: grid;
    gap: 10px;
    min-height: 176px;
  }
  .uex-boss-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/dashboard-frame.png") center/cover;
    opacity: .05;
    pointer-events: none;
  }
  .uex-boss-card > * {
    position: relative;
    z-index: 1;
  }
  .uex-boss-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .uex-boss-crest {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(circle at center, color-mix(in srgb, var(--boss-tone), transparent 84%), transparent 68%),
      rgba(255,255,255,.03);
    display: grid;
    place-items: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .uex-boss-crest img {
    width: 76%;
    height: 76%;
    object-fit: contain;
  }
  .uex-boss-fallback {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    color: var(--boss-tone);
  }
  .uex-boss-copy strong {
    display: block;
    font: 900 18px/1.06 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-boss-copy span {
    display: block;
    margin-top: 5px;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .uex-boss-copy p {
    margin: 8px 0 0;
    color: ${UI.muted};
    font: 500 13px/1.58 "Manrope", sans-serif;
  }
  .uex-boss-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .uex-boss-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
  }
  .uex-zone-rows {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .uex-quest-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .uex-quest-card {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 10px;
    align-content: start;
    min-height: 178px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      rgba(255,255,255,.03);
  }
  .uex-quest-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--quest-tone, ${UI.cyan}) 16%, transparent), transparent 34%),
      url("/ui/dashboard-frame.png") center/cover;
    opacity: .08;
    pointer-events: none;
  }
  .uex-quest-card > * {
    position: relative;
    z-index: 1;
  }
  .uex-quest-card.is-locked {
    border-style: dashed;
    border-color: rgba(255,255,255,.14);
    background:
      linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,.01)),
      rgba(255,255,255,.02);
  }
  .uex-quest-card-head {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: start;
  }
  .uex-quest-card-title {
    min-width: 0;
  }
  .uex-quest-card-title h4 {
    margin: 0;
    font: 900 16px/1.08 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-quest-card-title p {
    margin: 6px 0 0;
    color: ${UI.muted};
    font: 500 13px/1.5 "Manrope", sans-serif;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .uex-quest-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .uex-quest-card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
  }
  .uex-quest-card-actions .uex-btn {
    min-width: 132px;
    justify-content: center;
  }
  .uex-quest-card-side {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  /* ── 1440px: reajuste fino de columnas ── */
  @media (max-width: 1440px) {
    .uex-hero {
      grid-template-columns: minmax(0, 1.2fr) minmax(270px, .8fr);
    }
    .uex-grid-2 {
      grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
    }
  }

  /* ── 1320px: quest grid 2 cols ── */
  @media (max-width: 1320px) {
    .uex-quest-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .uex-row {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      rgba(255,255,255,.03);
    padding: 12px;
    position: relative;
    overflow: hidden;
  }
  .uex-row::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/dashboard-frame.png") center/cover;
    opacity: .05;
    pointer-events: none;
  }
  .uex-row-copy {
    min-width: 0;
  }
  .uex-row-copy h4 {
    margin: 0;
    font: 900 16px/1.1 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-row-copy p {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .uex-row-copy .uex-chip-row {
    margin-top: 8px;
  }
  .uex-row-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .uex-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.05);
    color: ${UI.muted};
    cursor: pointer;
  }
  .uex-icon-btn.is-active {
    color: ${UI.gold};
    border-color: rgba(243, 201, 105, .48);
    background: rgba(243, 201, 105, .12);
  }
  .uex-library {
    padding: 14px;
    display: grid;
    gap: 12px;
  }
  .uex-toolbar {
    display: grid;
    gap: 10px;
  }
  .uex-toolbar-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: start;
  }
  .uex-toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }
  .uex-search {
    position: relative;
    min-width: 0;
  }
  .uex-search.is-open input {
    border-color: color-mix(in srgb, var(--class-accent), transparent 44%);
    background: color-mix(in srgb, var(--class-accent), transparent 94%);
  }
  .uex-search input,
  .uex-select {
    width: 100%;
    min-height: 46px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: ${UI.text};
    font: 600 13px/1 "Manrope", sans-serif;
    box-sizing: border-box;
    outline: none;
  }
  .uex-search input {
    padding: 0 14px 0 40px;
  }
  .uex-search svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: ${UI.deepMuted};
  }
  .uex-search-results {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 15;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      rgba(10, 7, 19, .96);
    box-shadow: 0 20px 50px rgba(0,0,0,.34);
    overflow: hidden;
  }
  .uex-search-results-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,.08);
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .uex-search-result {
    width: 100%;
    border: 0;
    border-top: 1px solid rgba(255,255,255,.05);
    background: transparent;
    color: inherit;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    text-align: left;
    cursor: pointer;
  }
  .uex-search-result:hover {
    background: rgba(255,255,255,.04);
  }
  .uex-search-result-ico {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .uex-search-result-ico img {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
  .uex-search-result-copy {
    min-width: 0;
  }
  .uex-search-result-copy strong {
    display: block;
    font: 800 13px/1.2 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-search-result-copy span {
    display: block;
    margin-top: 5px;
    color: ${UI.muted};
    font: 500 12px/1.45 "Manrope", sans-serif;
  }
  .uex-search-type {
    justify-self: end;
  }
  .uex-filterbar {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    align-items: center;
  }
  .uex-mobile-filter-toggle {
    display: none;
  }
  .uex-mobile-filter-drawer {
    display: none;
  }
  .uex-select {
    padding: 0 14px;
    min-width: 150px;
  }
  .uex-favorites {
    display: grid;
    gap: 10px;
  }
  .uex-favorites-track {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .uex-favorite-card {
    min-width: 220px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 12px;
    display: grid;
    gap: 10px;
  }
  .uex-list {
    display: grid;
    gap: 10px;
  }
  .uex-empty {
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,.12);
    padding: 26px 18px;
    color: ${UI.muted};
    background: rgba(255,255,255,.025);
    text-align: center;
    font: 600 14px/1.6 "Manrope", sans-serif;
  }
  .uex-state-panel {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    border-radius: 8px;
    border: 1px dashed rgba(255,255,255,.12);
    background:
      linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015)),
      rgba(255,255,255,.02);
    padding: 18px;
  }
  .uex-state-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("/ui/dashboard-frame.png") center/cover;
    opacity: .04;
    pointer-events: none;
  }
  .uex-state-illustration {
    width: 88px;
    height: 88px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(circle at center, color-mix(in srgb, var(--state-tone), transparent 86%), transparent 66%),
      rgba(255,255,255,.03);
    display: grid;
    place-items: center;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }
  .uex-state-illustration img {
    width: 78%;
    height: 78%;
    object-fit: contain;
  }
  .uex-state-copy {
    position: relative;
    z-index: 1;
    min-width: 0;
  }
  .uex-state-copy strong {
    display: block;
    font: 900 18px/1.08 "Manrope", sans-serif;
    color: ${UI.text};
  }
  .uex-state-copy p {
    margin: 8px 0 0;
    color: ${UI.muted};
    font: 500 13px/1.58 "Manrope", sans-serif;
  }
  .uex-state-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .uex-row.is-locked {
    border-style: dashed;
    border-color: rgba(255,255,255,.14);
    background:
      linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,.01)),
      rgba(255,255,255,.02);
  }
  .uex-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(5, 4, 10, .8);
    backdrop-filter: blur(10px);
    display: grid;
    place-items: center;
    padding: 18px;
  }
  .uex-modal {
    width: min(100%, 760px);
    max-height: min(92vh, 940px);
    overflow: auto;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--modal-color), transparent 54%);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), transparent 22%),
      linear-gradient(180deg, rgba(11,8,20,.98), rgba(11,8,20,.96));
    box-shadow: 0 30px 80px rgba(0,0,0,.45);
  }
  .uex-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px;
    border-bottom: 1px solid rgba(255,255,255,.08);
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      url("/ui/panel-texture.png") center/cover;
  }
  .uex-modal-head::after {
    content: "";
    position: absolute;
    inset: auto 18px 0 18px;
    height: 12px;
    background: url("/ui/dividers/divider-h-tile.png") center/contain repeat-x;
    opacity: .22;
    pointer-events: none;
  }
  .uex-modal-head h3 {
    margin: 0 0 4px;
    font: 900 24px/1.04 "Manrope", sans-serif;
  }
  .uex-modal-body {
    padding: 18px;
    display: grid;
    gap: 16px;
  }
  .uex-modal-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .uex-modal-stat {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 12px;
  }
  .uex-modal-stat strong {
    display: block;
    font: 900 20px/1 "JetBrains Mono", monospace;
  }
  .uex-modal-stat span {
    display: block;
    margin-top: 6px;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uex-note-box {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 14px;
  }
  .uex-note-box h4 {
    margin: 0 0 8px;
    font: 900 14px/1 "Manrope", sans-serif;
  }
  .uex-note-box p {
    margin: 0;
    color: ${UI.muted};
    font: 500 13px/1.6 "Manrope", sans-serif;
  }
  .uex-detail-layout {
    display: grid;
    grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
    gap: 14px;
    align-items: stretch;
  }
  .uex-anatomy-card {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
      rgba(255,255,255,.03);
    padding: 14px;
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .uex-anatomy-figure {
    min-height: 240px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background:
      radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--modal-color), transparent 82%), transparent 40%),
      rgba(255,255,255,.03);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .uex-anatomy-figure img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .uex-anatomy-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--modal-color);
    font: 900 42px/1 "JetBrains Mono", monospace;
  }
  .uex-anatomy-muscles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .uex-perg-label {
    color: var(--modal-color);
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-tech-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  .uex-tech-header strong {
    display: block;
    font: 900 16px/1 "Manrope", sans-serif;
  }
  .uex-gear-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .uex-gear-item {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 10px;
  }
  .uex-gear-item-ico {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.04);
    display: grid;
    place-items: center;
    overflow: hidden;
  }
  .uex-gear-item-ico img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
  .uex-gear-item strong {
    display: block;
    font: 800 12px/1.2 "Manrope", sans-serif;
  }
  .uex-gear-item span {
    display: block;
    margin-top: 4px;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .uex-note-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .uex-session-stage {
    display: grid;
    gap: 16px;
    place-items: center;
    text-align: center;
    padding: 10px 0 4px;
  }
  .uex-timer-ring {
    width: 162px;
    height: 162px;
    position: relative;
  }
  .uex-timer-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .uex-timer-label {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .uex-timer-label strong {
    display: block;
    font: 900 28px/1 "JetBrains Mono", monospace;
  }
  .uex-timer-label span {
    display: block;
    margin-top: 7px;
    color: ${UI.deepMuted};
    font: 700 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-session-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  .uex-xp-toast {
    position: fixed;
    inset: auto 50% 48px auto;
    transform: translateX(50%);
    z-index: 500;
    pointer-events: none;
    padding: 12px 16px;
    border-radius: 999px;
    border: 1px solid rgba(243, 201, 105, .42);
    background: rgba(10, 7, 19, .92);
    color: ${UI.gold};
    font: 900 14px/1 "JetBrains Mono", monospace;
    box-shadow: 0 16px 36px rgba(0,0,0,.35);
  }

  /* ── página de sesión (full-page, reemplaza los modales) ── */
  @keyframes uex-sp-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .uex-sp {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    background:
      radial-gradient(ellipse at 18% 0%, color-mix(in srgb, var(--sp-class, #7c3aed), transparent 76%) 0%, transparent 48%),
      radial-gradient(ellipse at 82% 100%, color-mix(in srgb, var(--sp-color, #e85d04), transparent 88%) 0%, transparent 44%),
      linear-gradient(180deg, rgba(7,5,16,.99) 0%, rgba(5,4,12,.98) 100%);
    animation: uex-sp-in .26s cubic-bezier(.22,1,.36,1) both;
    font-family: "Manrope", sans-serif;
  }
  .uex-sp::before {
    content: "";
    position: absolute;
    inset: -20px;
    background: var(--sp-banner, none) center / cover no-repeat;
    filter: blur(22px) saturate(0.7);
    opacity: 0.13;
    z-index: 0;
    pointer-events: none;
  }
  .uex-sp > * { position: relative; z-index: 1; }
  /* nav — top bar */
  .uex-sp-nav {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
    padding: 11px 18px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    background: rgba(7,5,16,.88);
    backdrop-filter: blur(14px);
    flex-shrink: 0;
  }
  .uex-sp-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,.11);
    background: rgba(255,255,255,.04);
    color: #bbb;
    font: 700 12px/1 "Manrope", sans-serif;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
    white-space: nowrap;
  }
  .uex-sp-back:hover {
    background: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 88%);
    border-color: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 60%);
    color: #fff;
  }
  .uex-sp-nav-mid { display: flex; align-items: center; gap: 10px; justify-self: center; }
  .uex-sp-zone-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 99px;
    border: 1px solid color-mix(in srgb, var(--sp-color, #e85d04), transparent 54%);
    background: color-mix(in srgb, var(--sp-color, #e85d04), transparent 88%);
    color: var(--sp-color, #e85d04);
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uex-sp-zone-chip img { width: 14px; height: 14px; object-fit: contain; }
  .uex-sp-nav-title { font: 800 16px/1 "Manrope", sans-serif; color: #fff; }

  /* body — flush, full-height grid */
  .uex-sp-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 12px;
    padding: 12px 14px;
    overflow: hidden;
    min-height: 0;
  }

  /* ── left: detail card ── */
  .uex-sp-detail {
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.025);
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 68%) transparent;
  }
  .uex-sp-detail-banner {
    height: 88px;
    background-size: cover;
    background-position: center top;
    mask-image: linear-gradient(180deg, rgba(0,0,0,.72) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,.72) 0%, transparent 100%);
  }
  .uex-sp-detail-inner {
    padding: 0 16px 20px;
    margin-top: -26px;
    display: grid;
    gap: 12px;
  }
  .uex-sp-kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .uex-sp-kpi {
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 10px 12px;
    text-align: center;
  }
  .uex-sp-kpi strong {
    display: block;
    font: 900 16px/1 "JetBrains Mono", monospace;
    color: #fff;
    margin-bottom: 4px;
  }
  .uex-sp-kpi span {
    font: 600 10px/1 "Manrope", sans-serif;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #666;
  }

  /* ── right: session card — class-colored identity ── */
  .uex-sp-session {
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--sp-class, #7c3aed), transparent 56%);
    background:
      linear-gradient(145deg,
        color-mix(in srgb, var(--sp-class, #7c3aed), transparent 88%) 0%,
        transparent 52%),
      rgba(8, 6, 18, .6);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    overflow-y: auto;
    min-height: 0;
  }
  /* dots — class color */
  .uex-sp-dots { display: flex; gap: 6px; align-self: flex-start; }
  .uex-sp-dot {
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,.11);
    transition: background .3s, width .3s;
    width: 22px;
  }
  .uex-sp-dot.done   { background: var(--sp-class, #7c3aed); }
  .uex-sp-dot.active {
    background: color-mix(in srgb, var(--sp-class, #7c3aed), white 22%);
    width: 34px;
  }
  /* timer stays zone color */
  .uex-sp-timer {
    width: 182px !important;
    height: 182px !important;
  }
  .uex-sp-timer .uex-timer-label strong { font-size: 33px !important; }
  /* camera area — always reserved with min-height */
  .uex-sp-camera-wrap {
    width: 100%;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--sp-class, #7c3aed), transparent 52%);
    background: rgba(0,0,0,.45);
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .uex-sp-camera-wrap video,
  .uex-sp-camera-wrap canvas { width: 100%; height: 100%; object-fit: cover; }
  /* note box inside session */
  .uex-sp-session .uex-note-box {
    width: 100%;
    border-color: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 72%);
    background: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 94%);
  }
  /* buttons — class color */
  .uex-sp .uex-btn {
    background: var(--sp-class, #7c3aed);
    border-color: var(--sp-class, #7c3aed);
    color: #fff;
  }
  .uex-sp .uex-btn:hover {
    background: color-mix(in srgb, var(--sp-class, #7c3aed), white 14%);
    border-color: color-mix(in srgb, var(--sp-class, #7c3aed), white 14%);
  }
  .uex-sp .uex-btn-ghost {
    border-color: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 55%);
    color: color-mix(in srgb, var(--sp-class, #7c3aed), white 15%);
  }
  .uex-sp .uex-btn-ghost:hover {
    background: color-mix(in srgb, var(--sp-class, #7c3aed), transparent 88%);
  }
  .uex-sp-actions {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }
  .uex-sp-actions .uex-btn,
  .uex-sp-actions .uex-btn-ghost { flex: 1; justify-content: center; min-width: 110px; }
  .uex-sp-series-label {
    color: ${UI.deepMuted};
    font: 700 11px/1 "JetBrains Mono", monospace;
    letter-spacing: .06em;
    align-self: flex-start;
  }
  /* ─ responsive ─ */
  @media (max-width: 860px) {
    .uex-sp-body { grid-template-columns: 1fr; overflow-y: auto; }
    .uex-sp-detail { max-height: 44vh; }
    .uex-sp-nav-mid { display: none; }
    .uex-sp-nav { grid-template-columns: auto 1fr; }
  }

  /* ── SesionPagina redesign: estructura base ── */
  .uex-sp-redesign {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }
  .uex-sp-redesign .uex-sp-training-layout {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }
  .uex-sp-side-panel,
  .uex-sp-main-panel {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,.09);
    background:
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.018)),
      rgba(8,6,18,.72);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 22px 60px rgba(0,0,0,.28);
  }
  .uex-sp-side-panel {
    display: grid;
    align-content: start;
    max-height: 100%;
    overflow: hidden;
    gap: 8px;
    padding: 9px;
  }
  .uex-sp-mini-banner {
    min-height: 82px;
    border-radius: 12px;
    overflow: hidden;
    background-size: cover;
    background-position: center;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 10px;
  }
  .uex-sp-mini-banner::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,.1), rgba(5,4,12,.92));
  }
  .uex-sp-mini-banner > div {
    position: relative;
    z-index: 1;
  }
  .uex-sp-mini-banner span {
    display: inline-block;
    margin-bottom: 6px;
    color: var(--sp-color);
    font: 900 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-sp-mini-banner h2 {
    margin: 0;
    font: 900 18px/.95 "Manrope", sans-serif;
    color: #fff;
  }
  .uex-sp-compact-kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .uex-sp-compact-kpis div {
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.035);
    padding: 7px;
    text-align: center;
  }
  .uex-sp-compact-kpis strong {
    display: block;
    color: #fff4de;
    font: 900 13px/1 "JetBrains Mono", monospace;
  }
  .uex-sp-compact-kpis span {
    display: block;
    margin-top: 5px;
    color: #847894;
    font: 800 9px/1 "JetBrains Mono", monospace;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .uex-sp-info-card,
  .uex-sp-muscles,
  .uex-sp-accordion {
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 8px;
  }
  .uex-sp-info-card h4 {
    margin: 0 0 7px;
    color: #fff;
    font: 900 14px/1 "Manrope", sans-serif;
  }
  .uex-sp-info-card p {
    margin: 0;
    color: #b5a8c7;
    font: 500 12.5px/1.55 "Manrope", sans-serif;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .uex-sp-accordion p {
    margin: 0;
    color: #b5a8c7;
    font: 500 12.5px/1.55 "Manrope", sans-serif;
  }
  .uex-sp-muscles > span {
    display: block;
    margin-bottom: 9px;
    color: var(--sp-color);
    font: 900 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-sp-muscles div {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .uex-sp-muscles small {
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--sp-color), transparent 62%);
    background: color-mix(in srgb, var(--sp-color), transparent 90%);
    color: #fff;
    padding: 6px 9px;
    font: 800 10px/1 "JetBrains Mono", monospace;
  }
  .uex-sp-notes {
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    padding: 8px;
    display: grid;
    gap: 0;
  }
  .uex-sp-note-row {
    padding: 7px 4px;
    border-bottom: 1px solid rgba(255,255,255,.05);
  }
  .uex-sp-note-row:last-child { border-bottom: none; }
  .uex-sp-note-row > span {
    display: block;
    margin-bottom: 3px;
    color: var(--sp-color);
    font: 800 9px/1 "JetBrains Mono", monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .uex-sp-note-row > p {
    margin: 0;
    color: #9387a3;
    font: 500 11px/1.45 "Manrope", sans-serif;
  }
  .uex-sp-main-panel {
    display: grid;
    grid-template-rows: auto 125px minmax(0, 1fr) auto auto;
    min-width: 0;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
    padding: 10px;
    gap: 8px;
  }
  .uex-sp-timer-card {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    align-items: center;
    gap: 16px;
    min-height: 120px;
    max-height: 125px;
    padding: 10px 16px;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--sp-color), transparent 58%);
    background:
      radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--sp-color), transparent 82%), transparent 44%),
      rgba(255,255,255,.03);
  }
  .uex-sp-timer-big {
    width: 96px !important;
    height: 96px !important;
  }
  .uex-sp-timer-big .uex-timer-label strong {
    font-size: 24px !important;
  }
  .uex-sp-status strong {
    display: block;
    color: #fff;
    font: 900 18px/1 "Manrope", sans-serif;
  }
  .uex-sp-status p {
    max-width: 520px;
    margin: 4px 0 0;
    color: #b5a8c7;
    font: 500 11px/1.35 "Manrope", sans-serif;
  }
  .uex-sp-camera-modern {
    min-height: 0;
    height: 100%;
    max-height: 100%;
    border-radius: 14px;
  }
  .uex-sp-camera-wrap { overflow: hidden; }
  .uex-sp-camera-placeholder {
    display: grid;
    place-items: center;
    text-align: center;
    gap: 8px;
    padding: 22px;
    color: #8d819d;
    height: 100%;
  }
  .uex-sp-camera-placeholder svg { color: var(--sp-color); }
  .uex-sp-camera-placeholder strong {
    color: #fff;
    font: 900 16px/1 "Manrope", sans-serif;
  }
  .uex-sp-camera-placeholder p {
    margin: 0;
    max-width: 420px;
    color: #9387a3;
    font: 500 12px/1.5 "Manrope", sans-serif;
  }
  .uex-sp-actions-modern { justify-content: stretch; }
  .uex-sp-actions-modern .uex-btn,
  .uex-sp-actions-modern .uex-btn-ghost {
    min-height: 34px;
    border-radius: 10px;
    font-size: 11px;
    padding: 0 11px;
  }
  .uex-sp-progress-modern { display: grid; gap: 4px; }

  /* ── Camera-tip popup ── */
  .uex-camtip-backdrop {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(4,3,10,.72); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .uex-camtip-card {
    background: linear-gradient(160deg,#110d1e,#0b0816);
    border: 1px solid rgba(255,255,255,.10);
    border-top: 2px solid var(--sp-color, #c08aff);
    border-radius: 18px;
    padding: 28px 26px 22px;
    max-width: 380px; width: 100%;
    box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04);
    display: flex; flex-direction: column; gap: 14px;
  }
  .uex-camtip-icon { font-size: 32px; text-align: center; }
  .uex-camtip-title {
    font: 800 16px/1.2 "Rajdhani", sans-serif;
    color: #f0ecff; letter-spacing: .04em; text-align: center;
  }
  .uex-camtip-body {
    font: 500 13px/1.55 "Manrope", sans-serif;
    color: #8e86aa; text-align: center;
  }
  .uex-camtip-body strong { color: #c8bfe8; }
  .uex-camtip-actions { display: flex; gap: 9px; flex-direction: column; margin-top: 4px; }
  .uex-camtip-btn-primary {
    width: 100%; padding: 11px 18px;
    background: var(--sp-color, #c08aff);
    border: none; border-radius: 10px;
    color: #fff; font: 700 13px/1 "Rajdhani", sans-serif;
    letter-spacing: .06em; cursor: pointer; transition: opacity .15s;
  }
  .uex-camtip-btn-primary:hover { opacity: .85; }
  .uex-camtip-btn-ghost {
    width: 100%; padding: 11px 18px;
    background: transparent;
    border: 1px solid rgba(255,255,255,.12); border-radius: 10px;
    color: #7d769b; font: 600 12px/1 "Manrope", sans-serif;
    cursor: pointer; transition: background .18s, color .18s;
  }
  .uex-camtip-btn-ghost:hover { background: rgba(255,255,255,.06); color: #c8bfe8; }
  .uex-sp-progress-modern span {
    color: #7f7394;
    font: 800 10px/1 "JetBrains Mono", monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  @media (max-width: 1400px), (max-height: 800px) {
    .uex-sp-redesign .uex-sp-training-layout {
      grid-template-columns: 250px minmax(0, 1fr);
      padding: 8px;
      gap: 8px;
    }
    .uex-sp-nav { min-height: 34px; padding: 5px 8px; }
    .uex-sp-main-panel {
      padding: 8px;
      gap: 7px;
      grid-template-rows: auto 105px minmax(0, 1fr) auto auto;
    }
    .uex-sp-timer-card {
      max-height: 105px;
      min-height: 105px;
      grid-template-columns: 90px minmax(0, 1fr);
      padding: 8px 12px;
    }
    .uex-sp-timer-big { width: 82px !important; height: 82px !important; }
    .uex-sp-timer-big .uex-timer-label strong { font-size: 20px !important; }
    .uex-sp-status strong { font-size: 15px; }
    .uex-sp-status p { font-size: 10px; }
    .uex-sp-mini-banner { min-height: 68px; }
    .uex-sp-mini-banner h2 { font-size: 15px; }
    .uex-sp-info-card p { -webkit-line-clamp: 1; }
    .uex-sp-notes { display: none; }
  }
  @media (max-height: 720px) {
    .uex-sp-redesign .uex-sp-training-layout {
      grid-template-columns: 220px minmax(0, 1fr);
    }
    .uex-sp-main-panel { grid-template-rows: 92px minmax(0, 1fr) auto; }
    .uex-sp-dots,
    .uex-sp-progress-modern,
    .uex-sp-info-card,
    .uex-sp-muscles,
    .uex-sp-notes { display: none; }
    .uex-sp-timer-card { min-height: 92px; max-height: 92px; }
    .uex-sp-side-panel { gap: 6px; }
  }

  /* ── (LEGACY) drawer de sesion — mantenido por compatibilidad ── */
  .uex-session-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(5, 4, 10, .28);
    backdrop-filter: blur(2px);
  }
  .uex-session-drawer {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: min(calc(100vw - 40px), 388px);
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--modal-color, #7c3aed), transparent 44%);
    background:
      linear-gradient(155deg, rgba(255,255,255,.055) 0%, transparent 38%),
      rgba(10, 7, 20, .97);
    box-shadow:
      0 36px 80px rgba(0,0,0,.58),
      0 0 0 1px rgba(255,255,255,.05) inset;
    overflow: hidden;
    animation: uex-drawer-in .24s cubic-bezier(.22,1,.36,1) both;
  }
  .uex-sdrw-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.01)),
      url("/ui/panel-texture.png") center/cover;
  }
  .uex-sdrw-hd::after {
    content: "";
    position: absolute;
    inset: auto 16px 0 16px;
    height: 10px;
    background: url("/ui/dividers/divider-h-tile.png") center/contain repeat-x;
    opacity: .2;
    pointer-events: none;
  }
  .uex-sdrw-hd h3 {
    margin: 0 0 3px;
    font: 900 17px/1.04 "Manrope", sans-serif;
    color: #fff;
  }
  .uex-sdrw-bd {
    padding: 20px 18px 16px;
    display: grid;
    gap: 16px;
  }
  .uex-sdrw-bd .uex-timer-ring {
    width: 140px;
    height: 140px;
  }
  .uex-sdrw-bd .uex-session-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .uex-sdrw-bd .uex-btn,
  .uex-sdrw-bd .uex-btn-ghost {
    width: 100%;
    justify-content: center;
  }

  /* ── 1280px: zonas 3 cols, columnas hero más anchas ── */
  @media (max-width: 1280px) {
    .uex-zones-track {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .uex-hero {
      grid-template-columns: minmax(0, 1.5fr) minmax(240px, .5fr);
    }
    .uex-grid-2 {
      grid-template-columns: minmax(0, 1.3fr) minmax(250px, .7fr);
    }
    .uex-hero-kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* ── 1200px: boss grid 2 cols ── */
  @media (max-width: 1200px) {
    .uex-boss-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .uex-zone-spotlight-layout {
      grid-template-columns: minmax(0, 1fr) minmax(220px, .6fr);
    }
  }

  /* ── 1080px: todo a una columna ── */
  @media (max-width: 1080px) {
    .uex-hero,
    .uex-grid-2,
    .uex-zone-spotlight-layout {
      grid-template-columns: 1fr;
    }
    .uex-hero-kpis,
    .uex-summary-kpis,
    .uex-modal-grid,
    .uex-boss-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .uex-detail-layout {
      grid-template-columns: 1fr;
    }
    .uex-filterbar {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .uex-hero-next {
      grid-template-columns: auto minmax(0, 1fr) auto;
    }
  }

  /* ── 840px ── */
  @media (max-width: 840px) {
    .uex-daily {
      grid-template-columns: 1fr;
      justify-items: flex-start;
    }
    .uex-daily-actions {
      justify-content: flex-start;
    }
    .uex-zones-track {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .uex-quest-grid {
      grid-template-columns: 1fr;
    }
    .uex-boss-grid {
      grid-template-columns: 1fr;
    }
    .uex-summary-kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* ── viewport corto (ej. 1280x720, 1366x768, 1128x634) ── */
  @media (max-height: 800px) and (min-width: 900px) {
    .uex-hero {
      padding: 12px 14px;
    }
    .uex-hero-copy h1 {
      font-size: clamp(20px, 2.4vw, 36px);
    }
    .uex-hero-copy {
      gap: 8px;
    }
    .uex-kpi {
      padding: 10px;
    }
    .uex-kpi strong {
      font-size: clamp(14px, 1.4vw, 18px);
    }
    .uex-daily {
      padding: 10px 14px;
    }
    .uex-daily-visual {
      width: 48px;
      height: 48px;
    }
    .uex-daily-copy h2 {
      font-size: clamp(15px, 1.6vw, 20px);
    }
    .uex-zone-card {
      min-height: 100px;
    }
    .uex-boss-card {
      min-height: 150px;
    }
    .uex-quest-card {
      min-height: 150px;
    }
    .uex-stage {
      grid-template-columns: auto minmax(0, 1fr);
    }
    .uex-stage .uex-btn {
      display: none;
    }
  }
  /* ── 640px: móvil ── */
  @media (max-width: 640px) {
    .uex-shell {
      padding: 10px;
      gap: 10px;
    }
    .uex-hero,
    .uex-summary,
    .uex-quick,
    .uex-zones,
    .uex-spotlight,
    .uex-library,
    .uex-boss-arena {
      padding: 12px;
    }
    .uex-hero-kpis,
    .uex-summary-kpis,
    .uex-modal-grid,
    .uex-note-grid,
    .uex-route-summary,
    .uex-zones-track,
    .uex-boss-grid,
    .uex-quest-grid,
    .uex-zone-rows {
      grid-template-columns: 1fr;
    }
    .uex-toolbar-top {
      grid-template-columns: 1fr;
    }
    .uex-toolbar-actions {
      justify-content: stretch;
    }
    .uex-toolbar-actions .uex-btn-ghost {
      width: 100%;
      justify-content: center;
    }
    .uex-filterbar {
      display: none;
    }
    .uex-mobile-filter-toggle {
      display: inline-flex;
    }
    .uex-mobile-filter-drawer {
      display: grid;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.03);
    }
    .uex-kicker {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .uex-stage {
      grid-template-columns: auto minmax(0, 1fr);
      gap: 10px;
      padding: 10px 12px;
    }
    .uex-stage .uex-btn { display: none; }
    .uex-stage-ico {
      width: 40px;
      height: 40px;
    }
    .uex-row,
    .uex-route-step,
    .uex-quest-card-head {
      grid-template-columns: 36px minmax(0, 1fr);
    }
    .uex-row-actions,
    .uex-route-reward,
    .uex-quest-card-actions {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }
    .uex-quest-card-actions .uex-btn {
      min-width: 0;
      width: 100%;
    }
    .uex-state-panel {
      grid-template-columns: 1fr;
      text-align: left;
    }
    .uex-state-illustration {
      width: 64px;
      height: 64px;
    }
    .uex-gear-grid {
      grid-template-columns: 1fr;
    }
    .uex-hero-next {
      grid-template-columns: auto minmax(0, 1fr);
    }
    .uex-hero-next-right {
      display: none;
    }
    .uex-hero-copy h1 {
      font-size: clamp(20px, 5.5vw, 30px);
    }
  }

  /* ── Neon text layer — pestaña de ejercicios ── */
  .uex-page h1,
  .uex-hero-copy h1 {
    text-shadow: 0 0 28px rgba(255,255,255,.18), 0 0 56px rgba(255,255,255,.08);
  }
  .uex-daily-copy h2 {
    text-shadow: 0 0 22px rgba(255,255,255,.14), 0 0 44px rgba(255,255,255,.06);
  }
  .uex-panel-head h3 {
    text-shadow: 0 0 18px rgba(255,255,255,.12), 0 0 36px rgba(255,255,255,.05);
  }
  .uex-kicker {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .uex-chip.is-focus,
  .uex-row-chip.is-focus {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  .uex-kpi strong {
    text-shadow: 0 0 12px currentColor, 0 0 28px currentColor;
  }
  .uex-kpi span {
    text-shadow: 0 0 8px rgba(255,255,255,.18);
  }
  .uex-summary-kpi strong {
    text-shadow: 0 0 10px currentColor, 0 0 24px currentColor;
  }
  .uex-hero-next-copy strong {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .uex-hero-next-xp {
    text-shadow: 0 0 10px currentColor, 0 0 24px currentColor;
  }
  .uex-row-copy strong {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .uex-zone-side-card strong {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .uex-tech-header strong {
    text-shadow: 0 0 10px currentColor, 0 0 22px currentColor;
  }
  .uex-stage-title {
    text-shadow: 0 0 12px currentColor, 0 0 26px currentColor;
  }
  .uex-icon-btn.is-active {
    text-shadow: 0 0 8px currentColor;
  }
`;

function mapCategoryToZone(catNombre) {
  if (!catNombre) return "Funcional";
  const zones = Object.keys(ZONE_META);
  const lower = catNombre.toLowerCase();
  const direct = zones.find((z) => z.toLowerCase() === lower);
  if (direct) return direct;
  const partial = zones.find(
    (z) => lower.includes(z.toLowerCase()) || z.toLowerCase().includes(lower),
  );
  return partial || "Funcional";
}

function mapVerificacion(v) {
  if (!v) return "Timer";
  const lv = v.toLowerCase();
  if (lv.includes("cámara") || lv.includes("camara")) return "Camara";
  if (lv.includes("timer")) return "Timer";
  return "Manual";
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeClass(profile) {
  const raw =
    profile?.heroClass ||
    profile?.clase ||
    profile?.class ||
    profile?.classId ||
    profile?.roleClass ||
    "DEFAULT";
  return String(raw).toUpperCase();
}

function getTheme(classKey) {
  return USER_CLASS_THEME[classKey] || USER_CLASS_THEME.DEFAULT;
}

function getZoneMeta(cat) {
  return ZONE_META[cat] || ZONE_META.Todos;
}

function getExerciseGuide(exercise) {
  const isHold = exercise.verif === "YogaHold";
  const durationText = isHold
    ? `${exercise.series} serie${exercise.series > 1 ? "s" : ""} · ${exercise.holdTargetSec}s hold por serie`
    : exercise.duracion
      ? `${exercise.duracion} s por tramo`
      : `${exercise.series} series x ${exercise.reps} repeticiones`;
  return {
    tecnica:
      isHold
        ? "Mantene la postura activa y respira con control. La IA valida tu alineacion en tiempo real y acumula el tiempo solo si la posicion es correcta."
        : exercise.verif === "Camara"
          ? "Mantene el cuerpo visible, con linea clara y recorrido estable en cada repeticion."
          : "Marca ritmo respiratorio, postura limpia y control del tiempo hasta cerrar la serie.",
    errores:
      isHold
        ? "No fuerces el rango mas alla de tu limite — la postura incorrecta pausa el timer automaticamente."
        : exercise.cat === "Fuerza" || exercise.cat === "Calistenia"
          ? "Evita colapsar hombros o recortar recorrido solo por sumar repeticiones."
          : "No sacrifiques postura por velocidad. Si el ritmo se rompe, baja intensidad.",
    equipo:
      exercise.cat === "Calistenia"
        ? "Barra o paralelas si aplica."
        : exercise.cat === "Flexibilidad" || isHold
          ? "Colchoneta o espacio libre."
          : "Sin equipo obligatorio.",
    nivel: exercise.dificultad,
    duracion: durationText,
    warning:
      isHold
        ? "Camara IA activa — la postura se valida automaticamente en tiempo real."
        : exercise.verif === "Camara"
          ? "Camara recomendada para conteo automatico."
          : "Timer activo: deja la pantalla visible durante la serie.",
  };
}

function getVerificationMeta(value) {
  if (value === "Camara") {
    return {
      label: "Camara activa",
      asset: VERIFICATION_ASSET.Camara,
      tone: "rgba(90, 216, 255, .14)",
      border: "rgba(90, 216, 255, .34)",
    };
  }

  if (value === "Timer") {
    return {
      label: "Timer guiado",
      asset: VERIFICATION_ASSET.Timer,
      tone: "rgba(243, 201, 105, .14)",
      border: "rgba(243, 201, 105, .34)",
    };
  }

  if (value === "YogaHold") {
    return {
      label: "Camara · Hold",
      asset: VERIFICATION_ASSET.Camara,
      tone: "rgba(192, 138, 255, .14)",
      border: "rgba(192, 138, 255, .34)",
    };
  }

  return {
    label: "Conteo manual",
    asset: VERIFICATION_ASSET.Manual,
    tone: "rgba(255,255,255,.09)",
    border: "rgba(255,255,255,.18)",
  };
}

function estimateExerciseMinutes(exercise) {
  if (exercise.duracion) {
    return Math.max(1, Math.ceil((exercise.duracion * exercise.series) / 60));
  }

  return Math.max(2, Math.ceil(exercise.series * 2.5));
}

function getEquipmentItems(exercise) {
  const items = [{ key: "bodyweight", label: "Peso corporal", asset: DETAIL_EQUIPMENT_ASSET.bodyweight }];

  if (exercise.cat === "Flexibilidad") {
    items.push({ key: "mat", label: "Colchoneta", asset: DETAIL_EQUIPMENT_ASSET.mat });
  }

  if (exercise.cat === "Calistenia") {
    items.push({ key: "bar", label: "Barra o paralelas", asset: DETAIL_EQUIPMENT_ASSET.bar });
  }

  const needsCamera = exercise.verif === "Camara" || exercise.verif === "YogaHold";
  items.push({
    key: needsCamera ? "camera" : "timer",
    label: needsCamera ? "Camara frontal" : "Temporizador",
    asset: needsCamera ? DETAIL_EQUIPMENT_ASSET.camera : DETAIL_EQUIPMENT_ASSET.timer,
  });

  return items;
}

function getBossArenaConfig(exercises) {
  const byId = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise]));

  return [
    {
      key: "resistencia",
      title: "Bastion de resistencia",
      subtitle: "Arena de cardio largo",
      crest: BOSS_CREST_ASSET.resistencia,
      zoneIcon: "/ui/icons/quest-cardio.png",
      tone: "#4cc9f0",
      exercise: byId.e3 || exercises.find((exercise) => exercise.cat === "Cardio") || exercises[0],
      summary: "Un guardia que te exige ritmo constante y control del pulso hasta vaciar la barra.",
      bossConfig: {
        id: "boss_resistencia",
        nombre: "Centinela del Viento",
        subtitulo: "Jefe · Resistencia",
        lore: "Custodia la ruta larga. Solo cede ante una cadencia firme y sostenida.",
        crest: BOSS_CREST_ASSET.resistencia,
        hp: 40,
        xpReward: 180,
        killBonus: 70,
        coinBonus: 40,
        actionLabel: "TRAMOS",
      },
    },
    {
      key: "movilidad",
      title: "Camara de movilidad",
      subtitle: "Arena de control y rango",
      crest: BOSS_CREST_ASSET.movilidad,
      zoneIcon: "/ui/icons/quest-flexibilidad.png",
      tone: "#c08aff",
      exercise: byId.e6 || exercises.find((exercise) => exercise.cat === "Flexibilidad") || exercises[0],
      summary: "Un sello antiguo que castiga la rigidez. Aqui gana quien respira y sostiene la tecnica.",
      bossConfig: {
        id: "boss_movilidad",
        nombre: "Oraculo del Pliegue",
        subtitulo: "Jefe · Movilidad",
        lore: "No busca fuerza bruta. Prueba rango, control corporal y paciencia bajo tension.",
        crest: BOSS_CREST_ASSET.movilidad,
        hp: 36,
        xpReward: 170,
        killBonus: 60,
        coinBonus: 35,
        actionLabel: "POSTURAS",
      },
    },
    {
      key: "core",
      title: "Foso del nucleo",
      subtitle: "Arena de estabilidad",
      crest: BOSS_CREST_ASSET.core,
      zoneIcon: "/ui/icons/quest-hidratacion.png",
      tone: "#7bdc3b",
      exercise: byId.e4 || exercises.find((exercise) => exercise.cat === "Funcional") || exercises[0],
      summary: "Un jefe pesado y preciso. Si el core cede, la arena te lo cobra al instante.",
      bossConfig: {
        id: "boss_core",
        nombre: "Guardian del Nucleo",
        subtitulo: "Jefe · Core",
        lore: "Guarda el centro del mapa y obliga a sostener el cuerpo con precision total.",
        crest: BOSS_CREST_ASSET.core,
        hp: 45,
        xpReward: 190,
        killBonus: 80,
        coinBonus: 45,
        actionLabel: "PULSOS",
      },
    },
  ];
}

function OptionalAsset({ src, alt, className, fallback }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) return fallback;

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function VerificationChip({ value }) {
  const meta = getVerificationMeta(value);

  return (
    <span className="uex-row-chip uex-verif-chip" style={{ background: meta.tone, borderColor: meta.border }}>
      <OptionalAsset src={meta.asset} alt="" className="uex-verif-icon" fallback={value === "Camara" ? <Camera size={14} /> : value === "Timer" ? <Timer size={14} /> : <Info size={14} />} />
      {meta.label}
    </span>
  );
}

function StatePanel({ asset, tone, title, text, fallback, tags = [] }) {
  return (
    <div className="uex-state-panel" style={{ "--state-tone": tone }}>
      <div className="uex-state-illustration">
        <OptionalAsset src={asset} alt="" fallback={fallback} />
      </div>
      <div className="uex-state-copy">
        <strong>{title}</strong>
        <p>{text}</p>
        {tags.length > 0 && (
          <div className="uex-state-tags">
            {tags.map((tag) => (
              <span key={tag} className="uex-row-chip">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="uex-tooltip">
      <span>Zona del campo</span>
      <strong>{label}</strong>
      <p>
        {item.value} registros de avance en esta zona. Usa el panel lateral para entrar al territorio y abrir quests
        fisicas.
      </p>
    </div>
  );
}

function RpgBar({ value, color }) {
  return (
    <div className="uex-rpg-bar">
      <div className="uex-rpg-fill" style={{ width: `${clamp(value)}%`, "--bar-color": color }} />
    </div>
  );
}

function ExerciseTile({ exercise, zoneColor }) {
  const zone = getZoneMeta(exercise.cat);
  return (
    <div className="uex-icon-tile" style={{ borderColor: `${zoneColor}33`, background: `${zoneColor}16` }}>
      {exercise.bloqueado ? (
        <OptionalAsset
          src={STATE_ASSET.blockedQuest}
          alt=""
          fallback={<Lock size={18} color={zoneColor} />}
        />
      ) : (
        <img src={zone.icon} alt="" />
      )}
    </div>
  );
}

function ExerciseCompactCard({ exercise, affinity, cls, isFavorite, onToggleFavorite, onOpen }) {
  const zone = getZoneMeta(exercise.cat);
  const levelAsset = DETAIL_LEVEL_ASSET[exercise.dificultad];
  const isFocus = affinity.includes(exercise.cat);

  return (
    <div
      className={`uex-quest-card ${exercise.bloqueado ? "is-locked" : ""}`}
      style={{ "--quest-tone": zone.color }}
    >
      {isFocus && (
        <div className="uex-affinity-seal">
          <img src={cls.crest} alt="" />
          Afinidad
        </div>
      )}

      <div className="uex-quest-card-head">
        <ExerciseTile exercise={exercise} zoneColor={zone.color} />
        <div className="uex-quest-card-title">
          <h4>{exercise.bloqueado ? "Quest bloqueada" : exercise.nombre}</h4>
          <p>
            {exercise.bloqueado
              ? "Falta rango para entrar. La prueba sigue sellada hasta subir tu lectura del mapa."
              : exercise.desc}
          </p>
        </div>
        <button
          className={`uex-icon-btn ${isFavorite ? "is-active" : ""}`}
          onClick={() => onToggleFavorite(exercise.id)}
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="uex-quest-card-meta">
        <span className="uex-row-chip">
          <img src={zone.icon} alt="" />
          {zone.short}
        </span>
        <span className="uex-row-chip">
          {exercise.duracion ? <Clock size={14} /> : <Award size={14} />}
          {exercise.duracion ? `${exercise.duracion}s` : `${exercise.series}x${exercise.reps}`}
        </span>
        <span className="uex-row-chip" style={{ color: DIFICULTY_COLOR[exercise.dificultad] || UI.text }}>
          <OptionalAsset src={levelAsset} alt="" className="uex-verif-icon" fallback={<Award size={14} />} />
          {exercise.dificultad}
        </span>
        <VerificationChip value={exercise.verif} />
        <span className={`uex-row-chip ${isFocus ? "is-focus" : ""}`}>
          {isFocus ? "Sello de clase" : "Zona secundaria"}
        </span>
      </div>

      <div className="uex-quest-card-actions">
        <div className="uex-quest-card-side">
          <span className="uex-action-chip">+{exercise.xpBase} XP</span>
          <span className="uex-action-chip">{exercise.completadas} registros</span>
        </div>
        <button
          className="uex-btn"
          onClick={() => (!exercise.bloqueado ? onOpen(exercise) : null)}
          disabled={exercise.bloqueado}
        >
          {exercise.bloqueado ? <Lock size={16} /> : <Play size={16} />}
          {exercise.bloqueado ? "Bloqueada" : "Abrir ficha"}
        </button>
      </div>
    </div>
  );
}

function CameraTipPopup({ exerciseName, zoneColor, onUseCamera, onUseManual }) {
  return (
    <div className="uex-camtip-backdrop" style={{ "--sp-color": zoneColor }}>
      <div className="uex-camtip-card">
        <div className="uex-camtip-icon">🎥</div>
        <div className="uex-camtip-title">Detección de cámara — aviso</div>
        <div className="uex-camtip-body">
          <strong>{exerciseName}</strong> es un ejercicio de movimiento compuesto y rápido.
          La IA puede tener dificultades para detectar cada rep con precisión.{" "}
          Puedes <strong>seguir con cámara</strong> (la IA hace su mejor esfuerzo)
          o cambiar a <strong>conteo manual</strong> para mayor control.
        </div>
        <div className="uex-camtip-actions">
          <button className="uex-camtip-btn-primary" onClick={onUseCamera}>
            📷 Continuar con cámara IA
          </button>
          <button className="uex-camtip-btn-ghost" onClick={onUseManual}>
            ✋ Prefiero contar manualmente
          </button>
        </div>
      </div>
    </div>
  );
}

function SesionPagina({ exercise, profile, onClose, onComplete }) {
  const zone       = getZoneMeta(exercise.cat);
  const classKey   = normalizeClass(profile);
  const cls        = getTheme(classKey);
  const guide      = getExerciseGuide(exercise);
  const affinity   = CLASS_AFFINITY[classKey] || [];
  const hasBonus   = affinity.includes(exercise.cat);
  const levelAsset = DETAIL_LEVEL_ASSET[exercise.dificultad];
  const equipmentItems = getEquipmentItems(exercise);

  // ── session logic (same as SesionModal) ──────────────────────────
  const isTimer   = exercise.verif === "Timer" || !exercise.reps;
  const isHold    = exercise.verif === "YogaHold";
  const isCamara  = !isTimer && (exercise.verif === "Camara" || isHold);
  const detector  = getExerciseDetector?.(exercise.nombre) ?? null;
  const [usarCamara,  setUsarCamara]  = useState(isCamara && !!detector);
  const [cameraError, setCameraError] = useState(false);
  const [showCamTip,  setShowCamTip]  = useState(() => isCamara && !!detector && needsCameraTip(exercise.nombre));
  const [phase,    setPhase]    = useState("ready");
  const [serieAct, setSerieAct] = useState(1);
  const [repsHechas,  setRepsHechas]  = useState(0);
  const [timerSec, setTimerSec] = useState(isTimer ? exercise.duracion || 30 : 0);
  const [restSec,  setRestSec]  = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef    = useRef(null);
  const repsHechasRef  = useRef(0);
  const finishSerieRef = useRef(null);
  const classBonus = hasBonus;
  const xpSerie = Math.round((exercise.xpBase / exercise.series) * (classBonus ? 1.25 : 1));

  const finishSerie = useCallback(() => {
    clearInterval(intervalRef.current);
    setXpEarned((c) => c + xpSerie);
    if (serieAct >= exercise.series) { setPhase("done"); }
    else { setPhase("rest"); setRestSec(45); }
  }, [exercise.series, serieAct, xpSerie]);

  useEffect(() => { finishSerieRef.current = finishSerie; }, [finishSerie]);
  useEffect(() => { repsHechasRef.current = repsHechas;  }, [repsHechas]);

  const handleCameraReps = useCallback((count) => {
    if (count <= repsHechasRef.current) return;
    const capped = Math.min(count, exercise.reps || count);
    setRepsHechas(capped); repsHechasRef.current = capped;
    if (capped >= (exercise.reps || 0)) finishSerieRef.current?.();
  }, [exercise.reps]);

  useEffect(() => {
    if (phase === "active" && isTimer) {
      intervalRef.current = setInterval(() => {
        setTimerSec((c) => { if (c <= 1) { clearInterval(intervalRef.current); finishSerie(); return 0; } return c - 1; });
      }, 1000);
    }
    if (phase === "rest") {
      intervalRef.current = setInterval(() => {
        setRestSec((c) => {
          if (c <= 1) {
            clearInterval(intervalRef.current);
            setSerieAct((v) => v + 1);
            setPhase("ready");
            setTimerSec(isTimer ? exercise.duracion || 30 : 0);
            setRepsHechas(0); repsHechasRef.current = 0;
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [exercise.duracion, finishSerie, isTimer, phase]);

  const startSerie = () => { setPhase("active"); if (!isTimer) { setRepsHechas(0); repsHechasRef.current = 0; } };
  const skipRest   = () => {
    clearInterval(intervalRef.current);
    setSerieAct((v) => v + 1); setPhase("ready");
    setTimerSec(isTimer ? exercise.duracion || 30 : 0);
    setRepsHechas(0); repsHechasRef.current = 0;
  };

  const currentTotal = phase === "rest" ? 45 : isTimer ? exercise.duracion || 30 : exercise.reps || 1;
  const currentValue = phase === "rest" ? restSec : isTimer ? timerSec : repsHechas;
  const progress     = phase === "done" ? 100 : (1 - currentValue / currentTotal) * 100;
  const radius       = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);
  const label = phase === "ready" ? "Listo" : phase === "rest" ? "Descanso" : phase === "done" ? "Completado" : isTimer ? "Tiempo" : isHold ? "Hold" : "Reps";
  const cameraActive = isCamara && usarCamara && !cameraError && phase === "active";
  const seriesProgress = ((serieAct - 1) / exercise.series) * 100 + (phase === "done" ? 100 / exercise.series : 0);

  return (
    <div className="uex-sp uex-sp-redesign" style={{ "--sp-color": zone.color, "--sp-class": cls.accent, "--sp-banner": `url(${zone.banner})` }}>
      {showCamTip && (
        <CameraTipPopup
          exerciseName={exercise.nombre}
          zoneColor={zone.color}
          onUseCamera={() => setShowCamTip(false)}
          onUseManual={() => { setUsarCamara(false); setShowCamTip(false); }}
        />
      )}
      <div className="uex-sp-nav">
        <button className="uex-sp-back" onClick={onClose}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div className="uex-sp-nav-mid">
          <span className="uex-sp-zone-chip">
            <img src={zone.icon} alt="" />
            {zone.short}
          </span>
          <span className="uex-sp-nav-title">{exercise.nombre}</span>
        </div>

        <div className="uex-chip-row">
          <span className="uex-row-chip">Serie {serieAct} de {exercise.series}</span>
          <span className="uex-row-chip">+{xpEarned} XP</span>
        </div>
      </div>

      <div className="uex-sp-training-layout">
        <aside className="uex-sp-side-panel">
          <div className="uex-sp-mini-banner" style={{ backgroundImage: `url(${zone.banner})` }}>
            <div>
              <span>{zone.short}</span>
              <h2>{exercise.nombre}</h2>
            </div>
          </div>

          <div className="uex-sp-compact-kpis">
            <div>
              <strong>+{hasBonus ? Math.round(exercise.xpBase * 1.25) : exercise.xpBase}</strong>
              <span>XP</span>
            </div>
            <div>
              <strong>{exercise.series}</strong>
              <span>Series</span>
            </div>
            <div>
              <strong>{isHold ? `${exercise.holdTargetSec}s` : exercise.duracion ? `${exercise.duracion}s` : exercise.reps}</strong>
              <span>{isHold ? "Hold" : exercise.duracion ? "Tiempo" : "Reps"}</span>
            </div>
          </div>

          <div className="uex-sp-info-card">
            <h4>Descripcion</h4>
            <p>{exercise.desc}</p>
          </div>

          <div className="uex-sp-muscles">
            <span>Musculos</span>
            <div>
              {(exercise.musculos || []).map((m) => (
                <small key={m}>{m}</small>
              ))}
            </div>
          </div>

          <div className="uex-sp-notes">
            <div className="uex-sp-note-row">
              <span>Tecnica</span>
              <p>{guide.tecnica}</p>
            </div>
            <div className="uex-sp-note-row">
              <span>Errores</span>
              <p>{guide.errores}</p>
            </div>
            <div className="uex-sp-note-row">
              <span>Equipo</span>
              <p>{guide.equipo}</p>
            </div>
          </div>
        </aside>

        <main className="uex-sp-main-panel">
          <div className="uex-sp-dots">
            {Array.from({ length: exercise.series }).map((_, i) => (
              <div
                key={i}
                className={`uex-sp-dot ${
                  i < serieAct - 1 ? "done" : i === serieAct - 1 ? "active" : ""
                }`}
              />
            ))}
          </div>

          <section className="uex-sp-timer-card">
            <div className="uex-timer-ring uex-sp-timer uex-sp-timer-big">
              <svg viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={phase === "rest" ? UI.cyan : zone.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset .4s linear" }}
                />
              </svg>

              <div className="uex-timer-label">
                <div>
                  <strong>
                    {phase === "done"
                      ? "OK"
                      : isTimer || phase === "rest"
                        ? `${String(Math.floor(currentValue / 60)).padStart(2, "0")}:${String(currentValue % 60).padStart(2, "0")}`
                        : isHold
                          ? (cameraActive ? "IA" : `${exercise.holdTargetSec}s`)
                          : `${repsHechas}/${exercise.reps}`}
                  </strong>
                  <span>{label}</span>
                </div>
              </div>
            </div>

            <div className="uex-sp-status">
              <strong>
                {phase === "ready" && "Preparate para iniciar"}
                {phase === "active" && "Sesion en progreso"}
                {phase === "rest" && "Descanso activo"}
                {phase === "done" && "Sesion completada"}
              </strong>
              <p>
                {phase === "ready" && "Acomoda tu postura, respira y abre la serie cuando estes listo."}
                {phase === "active" && "Mantene tecnica estable y completa el objetivo."}
                {phase === "rest" && "Recupera el aire antes de la siguiente serie."}
                {phase === "done" && "Reclama tu XP y registra tu avance."}
              </p>
            </div>
          </section>

          <section className="uex-sp-camera-wrap uex-sp-camera-modern">
            {cameraActive ? (
              <PoseCamera
                key={`sp-cam-${exercise.nombre}-${serieAct}`}
                ejercicio={exercise}
                targetReps={exercise.reps}
                onRepsChange={handleCameraReps}
                onError={() => {
                  setCameraError(true);
                  setUsarCamara(false);
                }}
              />
            ) : (
              <div className="uex-sp-camera-placeholder">
                <Camera size={26} />
                <strong>{isCamara ? "Camara lista" : "Modo guiado"}</strong>
                <p>{guide.warning}</p>
              </div>
            )}
          </section>

          <div className="uex-sp-actions uex-sp-actions-modern">
            {phase === "ready" && (
              <button className="uex-btn" onClick={startSerie}>
                <Play size={15} /> Iniciar serie
              </button>
            )}

            {cameraActive && (
              <button className="uex-btn-ghost" onClick={() => setUsarCamara(false)}>
                Contar manual
              </button>
            )}

            {phase === "active" && !isTimer && !cameraActive && (
              <>
                <button className="uex-btn-ghost" onClick={() => setRepsHechas((v) => Math.max(v - 1, 0))}>
                  −1
                </button>

                <button
                  className="uex-btn"
                  onClick={() => {
                    const next = repsHechas + 1;
                    if (next >= (exercise.reps || 0)) {
                      setRepsHechas(exercise.reps || 0);
                      finishSerie();
                    } else {
                      setRepsHechas(next);
                    }
                  }}
                >
                  +1 rep
                </button>

                {isCamara && detector && !cameraError && (
                  <button className="uex-btn-ghost" onClick={() => setUsarCamara(true)}>
                    <Camera size={13} /> IA
                  </button>
                )}
              </>
            )}

            {phase === "active" && isTimer && (
              <button className="uex-btn-ghost" onClick={finishSerie}>
                Cerrar antes
              </button>
            )}

            {phase === "rest" && (
              <button className="uex-btn-ghost" onClick={skipRest}>
                Saltar descanso
              </button>
            )}

            {phase === "done" && (
              <button className="uex-btn" onClick={() => onComplete(xpEarned)}>
                <Check size={15} /> Reclamar XP
              </button>
            )}
          </div>

          <div className="uex-sp-progress-modern">
            <RpgBar value={seriesProgress} color={zone.color} />
            <span>
              {serieAct - (phase === "done" ? 0 : 1)} de {exercise.series} series completadas
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

function DetalleModal({ exercise, profile, onClose, onStart }) {
  const classKey = normalizeClass(profile);
  const cls = getTheme(classKey);
  const zone = getZoneMeta(exercise.cat);
  const guide = getExerciseGuide(exercise);
  const affinity = CLASS_AFFINITY[classKey] || [];
  const hasBonus = affinity.includes(exercise.cat);
  const verification = getVerificationMeta(exercise.verif);
  const anatomyAsset = DETAIL_ANATOMY_ASSET[zone.key] || DETAIL_ANATOMY_ASSET.default;
  const levelAsset = DETAIL_LEVEL_ASSET[exercise.dificultad];
  const equipmentItems = getEquipmentItems(exercise);

  return (
    <div className="uex-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="uex-modal" style={{ "--modal-color": zone.color }}>
        <div className="uex-modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <ExerciseTile exercise={exercise} zoneColor={zone.color} />
            <div style={{ minWidth: 0 }}>
              <h3>{exercise.nombre}</h3>
              <div className="uex-chip-row">
                <span className="uex-row-chip">
                  <img src={zone.icon} alt="" />
                  {zone.short}
                </span>
                <span className="uex-row-chip" style={{ color: DIFICULTY_COLOR[exercise.dificultad] || UI.text }}>
                  <OptionalAsset src={levelAsset} alt="" className="uex-verif-icon" fallback={<Award size={14} />} />
                  {exercise.dificultad}
                </span>
                <VerificationChip value={exercise.verif} />
              </div>
            </div>
          </div>
          <button className="uex-icon-btn" onClick={onClose} aria-label="Cerrar detalle de ejercicio">
            <X size={16} />
          </button>
        </div>

        <div className="uex-modal-body">
          <div className="uex-modal-grid">
            <div className="uex-modal-stat">
              <strong>+{exercise.xpBase}</strong>
              <span>XP base</span>
            </div>
            <div className="uex-modal-stat">
              <strong>{exercise.duracion ? `${exercise.duracion}s` : `${exercise.series}x${exercise.reps}`}</strong>
              <span>Formato</span>
            </div>
            <div className="uex-modal-stat">
              <strong>{exercise.completadas}</strong>
              <span>Veces hecha</span>
            </div>
            <div className="uex-modal-stat">
              <strong>{hasBonus ? `+${Math.round(exercise.xpBase * 1.25)}` : cls.labelShort}</strong>
              <span>{hasBonus ? "XP con clase" : "Clase activa"}</span>
            </div>
          </div>

          <div className="uex-detail-layout">
            <div className="uex-anatomy-card">
              <div className="uex-tech-header">
                <div>
                  <div className="uex-perg-label">Mapa anatomico</div>
                  <strong>Territorio del esfuerzo</strong>
                </div>
                <OptionalAsset
                  src={levelAsset}
                  alt=""
                  className="uex-verif-icon"
                  fallback={<Award size={16} color={DIFICULTY_COLOR[exercise.dificultad] || UI.text} />}
                />
              </div>
              <div className="uex-anatomy-figure">
                <OptionalAsset
                  src={anatomyAsset}
                  alt={`Arte anatomico de ${zone.short}`}
                  fallback={<div className="uex-anatomy-fallback">{zone.short}</div>}
                />
              </div>
              <div>
                <div className="uex-perg-label">Musculos trabajados</div>
                <div className="uex-anatomy-muscles">
                  {exercise.musculos.map((muscle) => (
                    <span key={muscle} className="uex-row-chip" style={{ borderColor: `${zone.color}33`, color: zone.color }}>
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div className="uex-note-box">
                <div className="uex-tech-header">
                  <div>
                    <div className="uex-perg-label">Pergamino tecnico</div>
                    <strong>Resumen de la quest fisica</strong>
                  </div>
                  <span className="uex-row-chip is-focus">
                    <img src={cls.crest} alt="" />
                    {hasBonus ? "Afinidad de clase" : "Lectura neutral"}
                  </span>
                </div>
                <p>{exercise.desc}</p>
              </div>

              <div className="uex-note-grid">
                <div className="uex-note-box">
                  <h4>Tecnica segura</h4>
                  <p>{guide.tecnica}</p>
                </div>
                <div className="uex-note-box">
                  <h4>Errores comunes</h4>
                  <p>{guide.errores}</p>
                </div>
              </div>

              <div className="uex-note-box">
                <div className="uex-tech-header">
                  <div>
                    <div className="uex-perg-label">Equipo y acceso</div>
                    <strong>Preparacion recomendada</strong>
                  </div>
                  <VerificationChip value={exercise.verif} />
                </div>

                <div className="uex-gear-grid">
                  {equipmentItems.map((item) => (
                    <div key={item.key} className="uex-gear-item">
                      <div className="uex-gear-item-ico">
                        <OptionalAsset src={item.asset} alt="" fallback={<Info size={16} color={zone.color} />} />
                      </div>
                      <div>
                        <strong>{item.label}</strong>
                        <span>Equipo</span>
                      </div>
                    </div>
                  ))}
                  <div className="uex-gear-item">
                    <div className="uex-gear-item-ico">
                      <OptionalAsset src={levelAsset} alt="" fallback={<Award size={16} color={DIFICULTY_COLOR[exercise.dificultad] || UI.text} />} />
                    </div>
                    <div>
                      <strong>{guide.nivel}</strong>
                      <span>Nivel recomendado</span>
                    </div>
                  </div>
                  <div className="uex-gear-item">
                    <div className="uex-gear-item-ico">
                      <OptionalAsset src={verification.asset} alt="" fallback={exercise.verif === "Camara" ? <Camera size={16} color={zone.color} /> : <Timer size={16} color={zone.color} />} />
                    </div>
                    <div>
                      <strong>{guide.duracion}</strong>
                      <span>Duracion estimada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="uex-note-box">
            <h4>Preparacion antes de entrar</h4>
            <p>
              Duracion estimada: {guide.duracion}. Calienta antes de iniciar. Deten la sesion si aparece dolor agudo o
              inestabilidad.
            </p>
          </div>

          <div className="uex-note-box" style={{ borderColor: `${zone.color}33`, background: `${zone.color}10` }}>
            <h4>Verificacion</h4>
            <p>{guide.warning}</p>
          </div>

          <button className="uex-btn" onClick={() => onStart(exercise)} style={{ justifySelf: "stretch" }}>
            <Play size={16} />
            Iniciar sesion
          </button>
        </div>
      </div>
    </div>
  );
}

function SesionModal({ exercise, profile, onClose, onComplete }) {
  const zone = getZoneMeta(exercise.cat);
  const classKey = normalizeClass(profile);
  const isTimer  = exercise.verif === "Timer" || !exercise.reps;
  const isHold   = exercise.verif === "YogaHold";
  const isCamara = !isTimer && (exercise.verif === "Camara" || isHold);
  const detector = getExerciseDetector?.(exercise.nombre) ?? null;
  const [usarCamara, setUsarCamara] = useState(isCamara && !!detector);
  const [cameraError, setCameraError] = useState(false);
  const [showCamTip, setShowCamTip]   = useState(() => isCamara && !!detector && needsCameraTip(exercise.nombre));

  const [phase, setPhase] = useState("ready");
  const [serieAct, setSerieAct] = useState(1);
  const [repsHechas, setRepsHechas] = useState(0);
  const [timerSec, setTimerSec] = useState(isTimer ? exercise.duracion || 30 : 0);
  const [restSec, setRestSec] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef(null);
  // Refs used by handleCameraReps to always read the latest values without stale closures
  const repsHechasRef = useRef(0);
  const finishSerieRef = useRef(null);

  const classBonus = (CLASS_AFFINITY[classKey] || []).includes(exercise.cat);
  const xpSerie = Math.round((exercise.xpBase / exercise.series) * (classBonus ? 1.25 : 1));

  const finishSerie = useCallback(() => {
    clearInterval(intervalRef.current);
    setXpEarned((current) => current + xpSerie);
    if (serieAct >= exercise.series) {
      setPhase("done");
    } else {
      setPhase("rest");
      setRestSec(45);
    }
  }, [exercise.series, serieAct, xpSerie]);

  // Keep refs up-to-date so the camera callback never reads stale values
  useEffect(() => { finishSerieRef.current = finishSerie; }, [finishSerie]);
  useEffect(() => { repsHechasRef.current = repsHechas; }, [repsHechas]);

  // Called by PoseCamera each time it detects a new rep — stable reference via refs
  const handleCameraReps = useCallback((count) => {
    if (count <= repsHechasRef.current) return;
    const capped = Math.min(count, exercise.reps || count);
    setRepsHechas(capped);
    repsHechasRef.current = capped;
    if (capped >= (exercise.reps || 0)) finishSerieRef.current?.();
  }, [exercise.reps]);

  useEffect(() => {
    if (phase === "active" && isTimer) {
      intervalRef.current = setInterval(() => {
        setTimerSec((current) => {
          if (current <= 1) {
            clearInterval(intervalRef.current);
            finishSerie();
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
            setSerieAct((value) => value + 1);
            setPhase("ready");
            setTimerSec(isTimer ? exercise.duracion || 30 : 0);
            setRepsHechas(0);
            repsHechasRef.current = 0;
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [exercise.duracion, finishSerie, isTimer, phase]);

  const startSerie = () => {
    setPhase("active");
    if (!isTimer) {
      setRepsHechas(0);
      repsHechasRef.current = 0;
    }
  };

  const skipRest = () => {
    clearInterval(intervalRef.current);
    setSerieAct((value) => value + 1);
    setPhase("ready");
    setTimerSec(isTimer ? exercise.duracion || 30 : 0);
    setRepsHechas(0);
    repsHechasRef.current = 0;
  };

  const currentTotal = phase === "rest" ? 45 : isTimer ? exercise.duracion || 30 : exercise.reps || 1;
  const currentValue = phase === "rest" ? restSec : isTimer ? timerSec : Math.max((exercise.reps || 0) - repsHechas, 0);
  const progress = currentTotal > 0 ? clamp(((currentTotal - currentValue) / currentTotal) * 100) : 0;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);
  const label =
    phase === "ready"
      ? "Listo"
      : phase === "rest"
        ? "Recuperacion"
        : phase === "done"
          ? "Sesion cerrada"
          : isTimer
            ? "Tiempo"
            : isHold
              ? "Hold"
              : "Repeticiones";

  // Camera is only active during the exercise phase — saves resources during rest/intro/done
  const cameraActive = isCamara && usarCamara && !cameraError && phase === "active";

  return (
    <div className="uex-session-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      {showCamTip && (
        <CameraTipPopup
          exerciseName={exercise.nombre}
          zoneColor={zone.color}
          onUseCamera={() => setShowCamTip(false)}
          onUseManual={() => { setUsarCamara(false); setShowCamTip(false); }}
        />
      )}
      <div className="uex-session-drawer" style={{ "--modal-color": zone.color }}>
        <div className="uex-sdrw-hd">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ExerciseTile exercise={exercise} zoneColor={zone.color} />
            <div>
              <h3>{exercise.nombre}</h3>
              <div className="uex-chip-row">
                <span className="uex-row-chip">
                  Serie {serieAct} de {exercise.series}
                </span>
                <span className="uex-row-chip">+{xpEarned} XP ganado</span>
              </div>
            </div>
          </div>
          <button className="uex-icon-btn" onClick={onClose} aria-label="Cerrar sesion">
            <X size={16} />
          </button>
        </div>

        <div className="uex-sdrw-bd">
          <div className="uex-session-stage">
            <div className="uex-timer-ring">
              <svg viewBox="0 0 160 160" aria-hidden="true">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={phase === "rest" ? UI.cyan : zone.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="uex-timer-label">
                <div>
                  <strong>
                    {phase === "done"
                      ? "OK"
                      : isTimer || phase === "rest"
                        ? `${String(Math.floor(currentValue / 60)).padStart(2, "0")}:${String(currentValue % 60).padStart(2, "0")}`
                        : isHold
                          ? (cameraActive ? "IA" : `${exercise.holdTargetSec}s`)
                          : `${repsHechas}/${exercise.reps}`}
                  </strong>
                  <span>{label}</span>
                </div>
              </div>
            </div>

            {/* Camera feed replaces the status note while a serie is active */}
            {cameraActive ? (
              <div style={{ width: "100%", borderRadius: 10, overflow: "hidden",
                border: `1px solid ${zone.color}44`, background: "#000" }}>
                <PoseCamera
                  key={`session-cam-${exercise.nombre}-${serieAct}`}
                  ejercicio={exercise}
                  targetReps={exercise.reps}
                  onRepsChange={handleCameraReps}
                  onError={() => { setCameraError(true); setUsarCamara(false); }}
                />
              </div>
            ) : (
              <div className="uex-note-box" style={{ width: "100%" }}>
                <h4>Estado de la sesion</h4>
                <p>
                  {phase === "ready" &&
                    "Prepara postura, respiracion y espacio. Cuando estes listo, abre la serie."}
                  {phase === "active" &&
                    (isCamara && !cameraError && detector
                      ? "Camara desactivada — conteo manual activo."
                      : "Mantene tecnica estable. El objetivo es cerrar la serie sin romper el recorrido.")}
                  {phase === "rest" &&
                    "Toma aire y recupera el pulso antes de la siguiente serie."}
                  {phase === "done" &&
                    "Sesion completada. Reclama tu XP y deja el registro en el campo."}
                </p>
              </div>
            )}
          </div>

          <div className="uex-session-actions">
            {phase === "ready" && (
              <button className="uex-btn" onClick={startSerie}>
                <Play size={16} />
                Abrir serie
              </button>
            )}

            {/* Camera active: manual override button */}
            {cameraActive && (
              <button className="uex-btn-ghost" onClick={() => setUsarCamara(false)}>
                Contar manual
              </button>
            )}

            {/* Manual rep counting (shown when camera is off or not available) */}
            {phase === "active" && !isTimer && !cameraActive && (
              <>
                <button
                  className="uex-btn-ghost"
                  onClick={() => setRepsHechas((value) => Math.max(value - 1, 0))}
                >
                  -1
                </button>
                <button
                  className="uex-btn"
                  onClick={() => {
                    const next = repsHechas + 1;
                    if (next >= (exercise.reps || 0)) {
                      setRepsHechas(exercise.reps || 0);
                      finishSerie();
                    } else {
                      setRepsHechas(next);
                    }
                  }}
                >
                  +1 repeticion
                </button>
                {/* Re-activate camera if it errored or user turned it off */}
                {isCamara && detector && !cameraError && (
                  <button className="uex-btn-ghost" onClick={() => setUsarCamara(true)}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Camera size={14} /> IA
                  </button>
                )}
              </>
            )}

            {phase === "active" && isTimer && (
              <button className="uex-btn-ghost" onClick={finishSerie}>
                Cerrar antes
              </button>
            )}

            {phase === "rest" && (
              <button className="uex-btn-ghost" onClick={skipRest}>
                Saltar descanso
              </button>
            )}

            {phase === "done" && (
              <button className="uex-btn" onClick={() => onComplete(xpEarned)}>
                <Check size={16} />
                Reclamar XP
              </button>
            )}
          </div>

          <RpgBar value={((serieAct - 1) / exercise.series) * 100 + (phase === "done" ? 100 / exercise.series : 0)} color={zone.color} />
        </div>
      </div>
    </div>
  );
}

export default function UserEjercicios({ profile }) {
  const CHAT_DEEPLINK_KEY = "fv-chat-deeplink-v1";
  const navigate = useNavigate();
  const classKey = normalizeClass(profile);
  const cls = getTheme(classKey);
  const copy = CLASS_COPY[classKey] || CLASS_COPY.DEFAULT;
  const [exercises, setExercises] = useState(EXERCISES);
  const [selectedZone, setSelectedZone] = useState(() => {
    if (typeof window === "undefined") return "Fuerza";
    return window.localStorage.getItem("uex:selected-zone") || "Fuerza";
  });
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [difficulty, setDifficulty] = useState("all");
  const [verification, setVerification] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("uex:favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [detailExercise, setDetailExercise] = useState(null);
  const [sessionExercise, setSessionExercise] = useState(null);
  const [xpToast, setXpToast] = useState(null);
  const [quickForge, setQuickForge] = useState([]);
  const [showWorldCatalog, setShowWorldCatalog] = useState(false);
  const [catalogExpanded, setCatalogExpanded] = useState(false);

  const queueXpToast = useCallback((text, duration = 2200) => {
    if (!canShowXpPopups()) return;
    setXpToast(text);
    window.setTimeout(() => setXpToast(null), duration);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("uex:selected-zone", selectedZone);
      window.localStorage.setItem("uex:favorites", JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, selectedZone]);

  useEffect(() => {
    const consumeChatDeepLink = (payload) => {
      if (!payload) return false;
      const section = String(payload.section || "").toLowerCase();
      if (section && section !== "ejercicios") return false;
      const exerciseId = payload.exerciseId || payload.entityId || null;
      if (!exerciseId) return false;
      const exercise = exercises.find((entry) => entry.id === exerciseId);
      if (!exercise) return false;
      setDetailExercise(exercise);
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
  }, [exercises]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawReward = window.sessionStorage.getItem("uex:last-boss-reward");
    if (!rawReward) return;

    window.sessionStorage.removeItem("uex:last-boss-reward");

    try {
      const reward = JSON.parse(rawReward);
      const rewardXp = reward?.xpGanado || reward?.xpReward || 0;
      if (reward?.exerciseId) {
        setExercises((current) =>
          current.map((exercise) =>
            exercise.id === reward.exerciseId ? { ...exercise, completadas: exercise.completadas + 1 } : exercise,
          ),
        );
      }
      queueXpToast(`+${rewardXp} XP de jefe`, 2400);
      window.dispatchEvent(new CustomEvent("exerciseCompleted"));
    } catch {
      window.sessionStorage.removeItem("uex:last-boss-reward");
    }
  }, [queueXpToast]);

  // Captura recompensa de boss abierto en nueva pestaña (cross-tab via localStorage storage event)
  useEffect(() => {
    const applyBossReward = (raw) => {
      try {
        const reward = typeof raw === "string" ? JSON.parse(raw) : raw;
        const rewardXp = reward?.xpGanado || reward?.xpReward || 0;
        if (reward?.exerciseId) {
          setExercises((current) =>
            current.map((exercise) =>
              exercise.id === reward.exerciseId ? { ...exercise, completadas: exercise.completadas + 1 } : exercise,
            ),
          );
        }
        queueXpToast(`+${rewardXp} XP de jefe`, 2400);
        window.dispatchEvent(new CustomEvent("exerciseCompleted"));
      } catch {}
    };

    const onStorage = (e) => {
      if (e.key !== "fv_boss_reward" || !e.newValue) return;
      try { localStorage.removeItem("fv_boss_reward"); } catch {}
      applyBossReward(e.newValue);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queueXpToast]);

  const loadFirebaseExercises = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const [ejRes, catRes] = await Promise.all([
        getEjerciciosPublicos(token),
        getCategoriasPublicas(token),
      ]);

      const rawExercises = ejRes?.ejercicios || [];
      if (rawExercises.length === 0) return;

      const catList = catRes?.categorias || [];
      const catMap = Object.fromEntries(catList.map((c) => [c.id, c.nombre]));

      let completionMap = {};
      try {
        const progressSnap = await getDocs(collection(db, `users/${user.uid}/progress`));
        progressSnap.forEach((doc) => {
          completionMap[doc.id] = doc.data().completadas || 0;
        });
      } catch (_) {}

      const mapped = rawExercises.map((ej) => ({
        id: ej.id,
        nombre: ej.nombre || "Ejercicio",
        cat: mapCategoryToZone(catMap[ej.categoria] || ej.categoria),
        dificultad: ej.dificultad || "Principiante",
        xpBase: Number(ej.xpBase) || 25,
        series: Number(ej.series) || 3,
        reps: ej.reps != null ? Number(ej.reps) : null,
        duracion: ej.duracion != null ? Number(ej.duracion) : null,
        verif: mapVerificacion(ej.verificacion),
        musculos: Array.isArray(ej.musculos) ? ej.musculos : [],
        desc: ej.descripcion || "",
        completadas: completionMap[ej.id] || 0,
        bloqueado: ej.activo === false,
      }));

      setExercises(mapped);
    } catch (err) {
      console.warn("[UserEjercicios] Firebase load failed, using fallback:", err.message);
    }
  }, []);

  useEffect(() => {
    loadFirebaseExercises();
  }, [loadFirebaseExercises]);

  const streak = Number(profile?.streak ?? profile?.racha ?? profile?.currentStreak ?? 0);
  const totalCompleted = exercises.reduce((total, exercise) => total + exercise.completadas, 0);
  const totalXp = exercises.reduce((total, exercise) => total + exercise.completadas * exercise.xpBase, 0);
  const unlocked = exercises.filter((exercise) => !exercise.bloqueado).length;
  const favoriteExercises = exercises.filter((exercise) => favoriteIds.includes(exercise.id));
  const affinity = CLASS_AFFINITY[classKey] || [];
  const trainedToday = Boolean(profile?.trainedToday || profile?.todayWorkout || profile?.todayTraining);
  const trainingState = sessionExercise ? "training" : trainedToday ? "cleared" : "quiet";

  const zoneCards = useMemo(() => {
    return Object.keys(ZONE_META)
      .filter((zoneName) => zoneName !== "Todos")
      .map((zoneName) => {
        const meta = getZoneMeta(zoneName);
        const zoneExercises = exercises.filter((exercise) => exercise.cat === zoneName);
        const completions = zoneExercises.reduce((total, exercise) => total + exercise.completadas, 0);
        const progress = zoneExercises.length
          ? clamp((zoneExercises.filter((exercise) => exercise.completadas > 0).length / zoneExercises.length) * 100)
          : 0;

        return {
          name: zoneName,
          meta,
          zoneExercises,
          completions,
          progress,
          isFocus: affinity.includes(zoneName),
        };
      });
  }, [affinity, exercises]);

  useEffect(() => {
    const exists = zoneCards.some((zone) => zone.name === selectedZone);
    if (!exists && zoneCards[0]) setSelectedZone(zoneCards[0].name);
  }, [selectedZone, zoneCards]);

  const selectedZoneCard = zoneCards.find((zone) => zone.name === selectedZone) || zoneCards[0];
  const selectedExercises = selectedZoneCard?.zoneExercises || [];
  const bossArena = useMemo(() => getBossArenaConfig(exercises), [exercises]);
  const openBossArena = useCallback(
    (boss) => {
      if (!boss?.key) return;
      try { localStorage.setItem("fv_boss_transfer", JSON.stringify(boss)); } catch {}
      const tab = window.open(`/dashboard/ejercicios/jefe/${boss.key}`, "_blank");
      if (!tab) {
        // Popup bloqueado — fallback a navegación interna
        navigate(`/dashboard/ejercicios/jefe/${boss.key}`, {
          state: { bossBattle: boss, sourceTab: "ejercicios" },
        });
      }
    },
    [navigate],
  );
  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];

    const zoneResults = zoneCards
      .filter((zone) => zone.meta.label.toLowerCase().includes(term) || zone.name.toLowerCase().includes(term))
      .map((zone) => ({
        id: `zone-${zone.name}`,
        type: "Zona",
        title: zone.meta.label,
        subtitle: `${zone.zoneExercises.length} quests fisicas disponibles`,
        asset: zone.meta.icon,
        onPick: () => {
          setSelectedZone(zone.name);
          setShowWorldCatalog(false);
        },
      }));

    const exerciseResults = exercises
      .filter(
        (exercise) =>
          exercise.nombre.toLowerCase().includes(term) ||
          exercise.cat.toLowerCase().includes(term) ||
          exercise.desc.toLowerCase().includes(term),
      )
      .slice(0, 4)
      .map((exercise) => {
        const zone = getZoneMeta(exercise.cat);
        return {
          id: `exercise-${exercise.id}`,
          type: "Quest",
          title: exercise.nombre,
          subtitle: `${zone.short} · ${exercise.dificultad}`,
          asset: zone.icon,
          onPick: () => {
            setSelectedZone(exercise.cat);
            setSessionExercise(exercise);
          },
        };
      });

    const bossResults = bossArena
      .filter((boss) => boss.title.toLowerCase().includes(term) || boss.subtitle.toLowerCase().includes(term))
      .map((boss) => ({
        id: `boss-${boss.key}`,
        type: "Jefe",
        title: boss.title,
        subtitle: boss.subtitle,
        asset: boss.crest || boss.zoneIcon,
        onPick: () => openBossArena(boss),
      }));

    return [...zoneResults, ...exerciseResults, ...bossResults].slice(0, 7);
  }, [bossArena, exercises, openBossArena, search, zoneCards]);
  const quickForgeSummary = useMemo(() => {
    return {
      steps: quickForge.length,
      totalXp: quickForge.reduce((total, exercise) => total + exercise.xpBase, 0),
      totalMinutes: quickForge.reduce((total, exercise) => total + estimateExerciseMinutes(exercise), 0),
    };
  }, [quickForge]);

  const chartData = useMemo(() => {
    return zoneCards.map((zone) => ({
      label: zone.meta.short,
      value: zone.completions,
      progress: zone.progress,
    }));
  }, [zoneCards]);

  const summary = useMemo(() => {
    const minutes = exercises.reduce((total, exercise) => {
      const estimated = exercise.duracion ? Math.ceil((exercise.duracion * exercise.completadas) / 60) : exercise.completadas * exercise.series * 2;
      return total + estimated;
    }, 0);

    const mostRepeated = [...exercises].sort((a, b) => b.completadas - a.completadas)[0];
    const visitedZones = new Set(exercises.filter((exercise) => exercise.completadas > 0).map((exercise) => exercise.cat)).size;

    return {
      minutes,
      visitedZones,
      totalXp,
      mostRepeated: mostRepeated?.nombre || "Sin registros",
    };
  }, [exercises, totalXp]);

  const dailyZone = useMemo(() => {
    const preferredZone = zoneCards.find((zone) => zone.isFocus) || selectedZoneCard || zoneCards[0];
    const stateAsset =
      trainingState === "cleared"
        ? "/exercises/daily/daily-state-cleared.png"
        : trainingState === "training"
          ? "/exercises/daily/daily-state-training.png"
          : "/exercises/daily/daily-state-untrained.png";

    return {
      zone: preferredZone,
      color: preferredZone?.meta.color || cls.accent,
      marker: preferredZone?.meta.daily || "/exercises/daily/daily-zone-general.png",
      stateAsset,
      rewardAsset:
        trainingState === "cleared"
          ? "/exercises/daily/daily-reward-claimed.png"
          : "/exercises/daily/daily-reward-xp.png",
      title:
        trainingState === "cleared"
          ? `${preferredZone?.meta.label || "Ruta activa"} despejada`
          : trainingState === "training"
            ? `Sigue dentro de ${preferredZone?.meta.label || "la ruta del dia"}`
            : `Hoy el mapa empuja hacia ${preferredZone?.meta.label || "tu siguiente zona"}`,
      text:
        trainingState === "cleared"
          ? "Ya moviste el cuerpo hoy. Puedes rematar con una quest corta o guardar energia para la siguiente ruta."
          : trainingState === "training"
            ? "La sesion ya esta encendida. Mantene el ritmo, cierra la cadena y reclama la recompensa del tramo."
            : `Tu clase esta pidiendo trabajo en ${preferredZone?.meta.short || "esta zona"}. Entra por aqui y abre una sesion limpia sin perder tiempo.`,
      stateLabel:
        trainingState === "cleared"
          ? "Zona despejada"
          : trainingState === "training"
            ? "Aura activa"
            : "Sin entreno hoy",
      rewardLabel:
        trainingState === "cleared"
          ? "Botin diario guardado"
          : `+${Math.max(40, preferredZone?.zoneExercises?.[0]?.xpBase || 30)} XP de ruta`,
    };
  }, [cls.accent, selectedZoneCard, trainingState, zoneCards]);

  const filteredCatalog = useMemo(() => {
    const zoneFilter = showWorldCatalog ? "Todos" : selectedZone;

    return [...exercises]
      .filter((exercise) => {
        if (zoneFilter !== "Todos" && exercise.cat !== zoneFilter) return false;
        if (
          search &&
          !exercise.nombre.toLowerCase().includes(search.toLowerCase()) &&
          !exercise.cat.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (difficulty !== "all" && exercise.dificultad !== difficulty) return false;
        if (verification !== "all" && exercise.verif !== verification) return false;
        return true;
      })
      .sort((left, right) => {
        if (sortBy === "xp") return right.xpBase - left.xpBase;
        if (sortBy === "popular") return right.completadas - left.completadas;
        if (sortBy === "name") return left.nombre.localeCompare(right.nombre);

        const leftScore = (affinity.includes(left.cat) ? 20 : 0) + left.xpBase - left.completadas * 2 - (left.bloqueado ? 100 : 0);
        const rightScore = (affinity.includes(right.cat) ? 20 : 0) + right.xpBase - right.completadas * 2 - (right.bloqueado ? 100 : 0);
        return rightScore - leftScore;
      });
  }, [affinity, difficulty, exercises, search, selectedZone, showWorldCatalog, sortBy, verification]);

  const visibleCatalog = filteredCatalog.slice(0, catalogExpanded ? filteredCatalog.length : CATALOG_PREVIEW_COUNT);

  const forgeQuickRoutine = useCallback(() => {
    const pool = [...selectedExercises, ...exercises]
      .filter((exercise, index, list) => list.findIndex((item) => item.id === exercise.id) === index)
      .filter((exercise) => !exercise.bloqueado)
      .sort((left, right) => {
        const leftScore = (affinity.includes(left.cat) ? 16 : 0) + left.xpBase - left.completadas * 3;
        const rightScore = (affinity.includes(right.cat) ? 16 : 0) + right.xpBase - right.completadas * 3;
        return rightScore - leftScore;
      });

    setQuickForge(pool.slice(0, 4));
  }, [affinity, exercises, selectedExercises]);

  useEffect(() => {
    forgeQuickRoutine();
  }, [forgeQuickRoutine]);

  const toggleFavorite = (exerciseId) => {
    setFavoriteIds((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId],
    );
  };

  const handleComplete = useCallback(async (xpEarned) => {
    const exercise = sessionExercise;
    setSessionExercise(null);
    queueXpToast(`+${xpEarned} XP de entrenamiento`);
    // Incremento optimista — se corrige con el valor real del backend al llegar
    setExercises((current) =>
      current.map((ex) =>
        ex.id === exercise?.id ? { ...ex, completadas: (ex.completadas || 0) + 1 } : ex,
      ),
    );

    try {
      const user = auth.currentUser;
      if (!user || !exercise) return;
      const token = await user.getIdToken();
      const result = await completarSesion(token, {
        ejercicioId: exercise.id,
        xpGanado: xpEarned,
      });

      // Corregir completadas con el valor real del backend
      if (result?.completadas !== undefined) {
        setExercises((current) =>
          current.map((ex) =>
            ex.id === exercise.id ? { ...ex, completadas: result.completadas } : ex,
          ),
        );
      }

      // Toast de logros desbloqueados
      if (Array.isArray(result?.newAchievements) && result.newAchievements.length > 0) {
        for (const ach of result.newAchievements) {
          queueXpToast(`🏆 Logro desbloqueado: ${ach.nombre}`);
        }
      }

      window.dispatchEvent(
        new CustomEvent("exerciseCompleted", {
          detail: {
            exerciseId: exercise.id,
            xp: result?.xpGanado || xpEarned,
            leveledUp: result?.leveledUp,
            weeklyXP: result?.weeklyXP,
            streak: result?.streak,
            newAchievements: result?.newAchievements || [],
          },
        }),
      );

      if (result?.leveledUp) {
        window.dispatchEvent(new CustomEvent("levelUp", { detail: result }));
      }
    } catch (err) {
      console.warn("[UserEjercicios] Session save error:", err.message);
    }
  }, [queueXpToast, sessionExercise]);

  const panelMotion = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  };

  const handleSearchPick = (item) => {
    item.onPick?.();
    setSearch("");
    setSearchFocused(false);
    setMobileFiltersOpen(false);
  };

  const filterControls = (
    <>
      <select className="uex-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
        <option value="all">Toda dificultad</option>
        <option value="Principiante">Principiante</option>
        <option value="Intermedio">Intermedio</option>
        <option value="Avanzado">Avanzado</option>
        <option value="Elite">Elite</option>
      </select>

      <select className="uex-select" value={verification} onChange={(event) => setVerification(event.target.value)}>
        <option value="all">Toda verificacion</option>
        <option value="Camara">Camara</option>
        <option value="Timer">Timer</option>
      </select>

      <select className="uex-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
        <option value="recommended">Recomendadas</option>
        <option value="popular">Mas jugadas</option>
        <option value="xp">Mayor XP</option>
        <option value="name">Nombre A-Z</option>
      </select>
    </>
  );

  return (
    <>
      <style>{CSS}</style>

      {(sessionExercise || detailExercise) && createPortal(
        <SesionPagina
          exercise={sessionExercise || detailExercise}
          profile={profile}
          onClose={() => { setSessionExercise(null); setDetailExercise(null); }}
          onComplete={handleComplete}
        />,
        document.body
      )}

      {xpToast && <div className="uex-xp-toast">{xpToast}</div>}

      <div
        className={`uex-page state-${trainingState}`}
        style={{
          "--class-accent": cls.accent,
          "--class-secondary": cls.secondary,
          "--class-bg": cls.bg,
        }}
      >
        <div className="uex-shell">
          <motion.section className="uex-panel uex-hero" {...panelMotion}>
            <div className="uex-hero-copy">
              <div className="uex-kicker">
                <img src="/ui/icons/quest-mision.png" alt="" />
                Campo de entrenamiento
              </div>

              <div>
                <h1>
                  {copy.title} <span>sin perder identidad RPG.</span>
                </h1>
                <p>{copy.lead}</p>
              </div>

              <div className="uex-chip-row">
                <span className="uex-chip is-focus">
                  <img src={cls.crest} alt="" />
                  Clase {cls.label}
                </span>
                <span className="uex-chip">
                  <Flame size={16} />
                  Racha actual: {streak} dias
                </span>
                <span className="uex-chip">
                  <TrendingUp size={16} />
                  {copy.focus}
                </span>
              </div>

              <div className="uex-actions">
                <button className="uex-btn-ghost" onClick={forgeQuickRoutine}>
                  <Clock size={16} />
                  Forjar sesion de 15 min
                </button>
              </div>

              <div className="uex-hero-kpis">
                <div className="uex-kpi">
                  <strong>{unlocked}</strong>
                  <span>Quests abiertas</span>
                </div>
                <div className="uex-kpi">
                  <strong>{totalCompleted}</strong>
                  <span>Registros</span>
                </div>
                <div className="uex-kpi">
                  <strong>{summary.totalXp}</strong>
                  <span>XP fisico</span>
                </div>
                <div className="uex-kpi">
                  <strong>{favoriteExercises.length}</strong>
                  <span>Hechizos fijados</span>
                </div>
              </div>

              {quickForge[0] && (() => {
                const next = quickForge[0];
                const nextZone = getZoneMeta(next.cat);
                return (
                  <div className="uex-hero-next">
                    <div className="uex-hero-next-ico">
                      <img src={nextZone.icon} alt="" />
                    </div>
                    <div className="uex-hero-next-copy" style={{ minWidth: 0 }}>
                      <strong>{next.nombre}</strong>
                      <span>Proxima quest · {nextZone.short}</span>
                    </div>
                    <div className="uex-hero-next-right">
                      <span className="uex-hero-next-xp">+{next.xpBase} XP</span>
                      <button className="uex-btn" onClick={() => setSessionExercise(next)}>
                        <Play size={13} />
                        Iniciar
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="uex-stage" style={{ "--stage-scene": `url(${selectedZoneCard?.meta?.banner || ZONE_META.Fuerza.banner})` }}>
              <div className="uex-stage-ico">
                <img src={(selectedZoneCard?.meta || ZONE_META.Fuerza).icon} alt="" />
              </div>
              <div className="uex-stage-body">
                <div className="uex-stage-eyebrow">
                  Ritmo de avance · <span>{selectedZoneCard?.meta.short || "Zona"}</span>
                </div>
                <strong className="uex-stage-title">{selectedZoneCard?.meta.label || "Zona activa"}</strong>
                <p className="uex-stage-sub">{selectedZoneCard?.meta.summary || "Tu siguiente territorio ya está listo para abrir quests físicas."}</p>
                <div className="uex-stage-progress">
                  <RpgBar value={selectedZoneCard?.progress || 0} color={selectedZoneCard?.meta.color || cls.accent} />
                  <small>{selectedZoneCard?.progress || 0}% del territorio explorado.</small>
                </div>
              </div>
              <button className="uex-btn" onClick={() => setSelectedZone(selectedZoneCard?.name || "Fuerza")}>
                Abrir zona activa
              </button>
            </div>
          </motion.section>

          <motion.section
            className="uex-panel uex-daily"
            style={{ "--daily-color": dailyZone.color }}
            {...panelMotion}
          >
            <div className="uex-daily-visual">
              <img src={dailyZone.marker} alt="" />
            </div>

            <div className="uex-daily-copy">
              <div className="uex-kicker">
                <img src="/ui/icons/zone-flag.png" alt="" />
                Hoy el mapa recomienda
              </div>
              <h2>{dailyZone.title}</h2>
              <p>{dailyZone.text}</p>
            </div>

            <div className="uex-daily-actions">
              <span className="uex-chip">
                <img src={dailyZone.stateAsset} alt="" />
                {dailyZone.stateLabel}
              </span>
              <span className="uex-chip">
                <img src={dailyZone.rewardAsset} alt="" />
                {dailyZone.rewardLabel}
              </span>
              <button className="uex-btn" onClick={() => setSelectedZone(dailyZone.zone?.name || "Fuerza")}>
                Abrir ruta
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.section>

          <div className="uex-grid-2">
            <motion.section className="uex-panel uex-summary" {...panelMotion}>
              <div className="uex-panel-head">
                <div>
                  <div className="uex-panel-tag">Resumen semanal</div>
                  <h3>Pulso del campo</h3>
                  <p>El bloque mantiene la data, pero ahora la presenta como una bitacora de avance real del heroe.</p>
                </div>
                <img src="/exercises/summary/sum-chart.png" alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
              </div>

              <div className="uex-summary-kpis">
                <div className="uex-summary-kpi">
                  <div className="uex-summary-kpi-top">
                    <img src="/exercises/summary/sum-minutes.png" alt="" />
                    <div>
                      <span>Minutos</span>
                      <strong>{summary.minutes}</strong>
                    </div>
                  </div>
                  <small>Tiempo estimado de trabajo acumulado.</small>
                </div>
                <div className="uex-summary-kpi">
                  <div className="uex-summary-kpi-top">
                    <img src="/exercises/summary/sum-zones.png" alt="" />
                    <div>
                      <span>Zonas</span>
                      <strong>{summary.visitedZones}</strong>
                    </div>
                  </div>
                  <small>Territorios ya visitados por el heroe.</small>
                </div>
                <div className="uex-summary-kpi">
                  <div className="uex-summary-kpi-top">
                    <img src="/exercises/summary/sum-xp.png" alt="" />
                    <div>
                      <span>XP fisico</span>
                      <strong>{summary.totalXp}</strong>
                    </div>
                  </div>
                  <small>Experiencia ganada con entrenamiento real.</small>
                </div>
                <div className="uex-summary-kpi">
                  <div className="uex-summary-kpi-top">
                    <img src="/exercises/summary/sum-repeat.png" alt="" />
                    <div>
                      <span>Mas repetido</span>
                      <strong style={{ fontSize: "15px", lineHeight: 1.2 }}>{summary.mostRepeated}</strong>
                    </div>
                  </div>
                  <small>Quest fisica con mejor memoria reciente.</small>
                </div>
              </div>

              <div className="uex-chart-wrap">
                <div className="uex-chart-head">
                  <div className="uex-chart-title">
                    <img src="/exercises/summary/sum-logbook.png" alt="" />
                    <div>
                      <strong>Bitacora por zona</strong>
                      <span>Lectura del campo</span>
                    </div>
                  </div>
                  <span className="uex-row-chip is-focus">
                    <Info size={14} />
                    Tooltip tipo carta
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={116}>
                  <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uexAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={cls.accent} stopOpacity={0.5} />
                        <stop offset="90%" stopColor={cls.accent} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#a899b7", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#a899b7", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,.08)" }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={cls.accent}
                      strokeWidth={3}
                      fill="url(#uexAreaFill)"
                      activeDot={{ r: 5, fill: cls.secondary, stroke: cls.accent, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            <motion.aside className="uex-panel uex-quick" {...panelMotion}>
              <div className="uex-panel-head">
                <div>
                  <div className="uex-panel-tag">Rutina rapida</div>
                  <h3>Forjar sesion de 15 min</h3>
                  <p>Una ruta corta, ya acomodada segun tu clase y la zona que esta arriba en el mapa.</p>
                </div>
                <button className="uex-btn-ghost" onClick={forgeQuickRoutine}>
                  <Clock size={16} />
                  Reforjar
                </button>
              </div>

              <div className="uex-route-summary">
                <div className="uex-route-chip">
                  <strong>{quickForgeSummary.steps}</strong>
                  <span>Pasos forjados</span>
                </div>
                <div className="uex-route-chip">
                  <strong>{quickForgeSummary.totalXp}</strong>
                  <span>XP total</span>
                </div>
                <div className="uex-route-chip">
                  <strong>{quickForgeSummary.totalMinutes} min</strong>
                  <span>Tiempo estimado</span>
                </div>
              </div>

              <div className="uex-route">
                {quickForge.length === 0 ? (
                  <StatePanel
                    asset={STATE_ASSET.emptyRoute}
                    tone={cls.accent}
                    title="La ruta corta aun no esta forjada"
                    text="El herrero del gremio no encontro una cadena breve para esta zona. Cambia de territorio o vuelve a reforjar la sesion."
                    fallback={<Clock size={26} color={cls.accent} />}
                    tags={["Ruta vacia", "Prueba otra zona"]}
                  />
                ) : (
                  quickForge.map((exercise, index) => {
                    const zone = getZoneMeta(exercise.cat);
                    return (
                      <div key={`route-${exercise.id}`} className="uex-route-step">
                        <div className="uex-route-number">{index + 1}</div>
                        <div style={{ minWidth: 0 }}>
                          <strong>{exercise.nombre}</strong>
                          <div className="uex-chip-row" style={{ marginTop: 6 }}>
                            <span className="uex-row-chip">
                              <img src={zone.icon} alt="" />
                              {zone.short}
                            </span>
                            <VerificationChip value={exercise.verif} />
                            <span className={`uex-row-chip ${affinity.includes(exercise.cat) ? "is-focus" : ""}`}>
                              {affinity.includes(exercise.cat) ? "Afinidad clase" : "Ruta secundaria"}
                            </span>
                          </div>
                        </div>
                        <div className="uex-route-reward">
                          <strong>+{exercise.xpBase} XP</strong>
                          <span className="uex-row-chip">
                            <Clock size={14} />
                            {estimateExerciseMinutes(exercise)} min
                          </span>
                          <button className="uex-btn" onClick={() => setSessionExercise(exercise)}>
                            <Play size={16} />
                            Iniciar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="uex-route-footer">
                <div className="uex-route-footer-copy">
                  <strong>Botin de la ruta forjada</strong>
                  <p>
                    Una cadena corta, clara y util. Entras, completas pasos conectados y te llevas la recompensa total sin
                    perder tiempo buscando que hacer.
                  </p>
                </div>
                <div className="uex-route-footer-meta">
                  <span className="uex-chip is-focus">
                    <Award size={16} />
                    {quickForgeSummary.totalXp} XP totales
                  </span>
                  <span className="uex-chip">
                    <Clock size={16} />
                    {quickForgeSummary.totalMinutes} min de ruta
                  </span>
                  <span className="uex-chip">
                    <Play size={16} />
                    {quickForgeSummary.steps} pasos
                  </span>
                </div>
              </div>

              <div className="uex-quick-list">
                {quickForge.map((exercise) => {
                  const zone = getZoneMeta(exercise.cat);
                  return (
                    <div key={exercise.id} className="uex-quick-item">
                      <ExerciseTile exercise={exercise} zoneColor={zone.color} />
                      <div style={{ minWidth: 0 }}>
                        <strong>{exercise.nombre}</strong>
                        <p>
                          {exercise.duracion ? `${exercise.duracion}s` : `${exercise.series}x${exercise.reps}`} · +{exercise.xpBase} XP
                        </p>
                      </div>
                      <button className="uex-btn" onClick={() => setSessionExercise(exercise)}>
                        <Play size={16} />
                        Iniciar
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          </div>

          <motion.section className="uex-panel uex-zones" {...panelMotion}>
            <div className="uex-panel-head">
              <div>
                <div className="uex-panel-tag">Mapa de zonas</div>
                <h3>Territorios de entrenamiento</h3>
                <p>Menos texto dentro de cada isla, mas arte y un spotlight claro para la zona elegida.</p>
              </div>
            </div>

            <div className="uex-zones-track">
              {zoneCards.map((zone) => (
                <button
                  key={zone.name}
                  className={`uex-zone-card ${selectedZone === zone.name ? "is-active" : ""}`}
                  style={{ "--zone-banner": `url(${zone.meta.banner})` }}
                  onClick={() => setSelectedZone(zone.name)}
                >
                  <div className="uex-zone-top">
                    <div>
                      <img src={zone.meta.icon} alt="" />
                      <div className="uex-zone-name">{zone.meta.label}</div>
                      <div className="uex-zone-sub">{zone.zoneExercises.length} quests fisicas</div>
                    </div>
                    {zone.isFocus && <span className="uex-row-chip is-focus">Afinidad</span>}
                  </div>

                  <div className="uex-zone-bottom">
                    <div className="uex-zone-mini">
                      <span>{zone.completions} registros</span>
                      <span>{zone.progress}% explorado</span>
                    </div>
                    <RpgBar value={zone.progress} color={zone.meta.color} />
                  </div>
                </button>
              ))}
            </div>
          </motion.section>

          {selectedZoneCard && (
            <motion.section className="uex-panel uex-spotlight" {...panelMotion}>
              <div
                className="uex-zone-spotlight"
                style={{ "--spotlight-banner": `url(${selectedZoneCard.meta.banner})` }}
              >
                <div className="uex-zone-spotlight-layout">
                  <div className="uex-zone-spotlight-copy">
                    <div className="uex-kicker">
                      <img src={selectedZoneCard.meta.icon} alt="" />
                      Zona seleccionada
                    </div>
                    <h3>{selectedZoneCard.meta.label}</h3>
                    <p>{selectedZoneCard.meta.summary}</p>
                    <div className="uex-chip-row">
                      <span className="uex-chip">
                        <Award size={16} />
                        {selectedExercises.filter((exercise) => !exercise.bloqueado).length} activas
                      </span>
                      <span className="uex-chip">
                        <TrendingUp size={16} />
                        {selectedZoneCard.progress}% del territorio explorado
                      </span>
                      <span className={`uex-chip ${selectedZoneCard.isFocus ? "is-focus" : ""}`}>
                        <img src={cls.crest} alt="" />
                        {selectedZoneCard.isFocus ? "Afinidad de clase" : "Zona secundaria"}
                      </span>
                    </div>
                  </div>

                  <div className="uex-zone-side">
                    <div className="uex-zone-side-card">
                      <strong>Riesgo y recompensa</strong>
                      <p>
                        Dificultad media: {" "}
                        {selectedExercises.some((exercise) => exercise.dificultad === "Elite")
                          ? "Alta"
                          : selectedExercises.some((exercise) => exercise.dificultad === "Avanzado")
                            ? "Media alta"
                            : "Estable"}{" "}
                        · Botin principal: XP fisico y memoria de progreso.
                      </p>
                    </div>
                    <div className="uex-zone-side-card">
                      <strong>Resumen corto</strong>
                      <p>
                        {selectedExercises.slice(0, 3).map((exercise) => exercise.nombre).join(", ") || "Sin quests disponibles"}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="uex-zone-rows">
                {selectedExercises.map((exercise) => {
                  const isFavorite = favoriteIds.includes(exercise.id);
                  return (
                    <ExerciseCompactCard
                      key={exercise.id}
                      exercise={exercise}
                      affinity={affinity}
                      cls={cls}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                      onOpen={setSessionExercise}
                    />
                  );
                })}
              </div>
            </motion.section>
          )}

          <motion.section className="uex-panel uex-boss-arena" {...panelMotion}>
            <div className="uex-panel-head">
              <div>
                <div className="uex-panel-tag">Arena de jefes</div>
                <h3>Sellos de combate del campo</h3>
                <p>
                  La base ya no depende de emojis. Cada encuentro entra por categoria con crest propio, tono claro y
                  entrada de combate mas seria.
                </p>
              </div>
            </div>

            <div className="uex-boss-grid">
              {bossArena.map((boss) => (
                <div key={boss.key} className="uex-boss-card" style={{ "--boss-tone": boss.tone }}>
                  <div className="uex-boss-top">
                    <div className="uex-boss-copy">
                      <span>{boss.subtitle}</span>
                      <strong>{boss.title}</strong>
                      <p>{boss.summary}</p>
                    </div>
                    <div className="uex-boss-crest">
                      <OptionalAsset
                        src={boss.crest}
                        alt={`Cresta de ${boss.title}`}
                        fallback={
                          <div className="uex-boss-fallback">
                            <OptionalAsset src={boss.zoneIcon} alt="" fallback={<Award size={22} />} />
                          </div>
                        }
                      />
                    </div>
                  </div>

                  <div className="uex-boss-meta">
                    <span className="uex-row-chip">
                      <OptionalAsset src={boss.zoneIcon} alt="" className="uex-verif-icon" fallback={<Award size={14} />} />
                      {boss.exercise?.nombre || "Prueba base"}
                    </span>
                    <span className="uex-row-chip">
                      <Award size={14} />
                      +{boss.bossConfig.xpReward} XP
                    </span>
                    <span className={`uex-row-chip ${affinity.includes(boss.exercise?.cat) ? "is-focus" : ""}`}>
                      {affinity.includes(boss.exercise?.cat) ? "Afinidad de clase" : "Acceso abierto"}
                    </span>
                  </div>

                  <div className="uex-boss-footer">
                    <span className="uex-action-chip">{boss.bossConfig.actionLabel}</span>
                    <button className="uex-btn" onClick={() => openBossArena(boss)}>
                      <Play size={16} />
                      Entrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section className="uex-panel uex-library" {...panelMotion}>
            <div className="uex-panel-head">
              <div>
                <div className="uex-panel-tag">Biblioteca completa</div>
                <h3>Catalogo del heroe</h3>
                <p>Ahora queda despues de la recomendacion y de las zonas, no aplastado al entrar.</p>
              </div>
            </div>

            {favoriteExercises.length > 0 && (
              <div className="uex-favorites">
                <div className="uex-panel-tag">Accesos rapidos del heroe</div>
                <div className="uex-favorites-track">
                  {favoriteExercises.map((exercise) => {
                    const zone = getZoneMeta(exercise.cat);
                    return (
                      <div key={exercise.id} className="uex-favorite-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <ExerciseTile exercise={exercise} zoneColor={zone.color} />
                          <div style={{ minWidth: 0 }}>
                            <strong>{exercise.nombre}</strong>
                            <p style={{ margin: "4px 0 0", color: UI.muted, font: "500 12px/1.55 Manrope, sans-serif" }}>
                              {zone.short} · +{exercise.xpBase} XP
                            </p>
                          </div>
                        </div>
                        <button className="uex-btn" onClick={() => setSessionExercise(exercise)}>
                          Abrir ficha
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="uex-toolbar">
              <div className="uex-toolbar-top">
                <div className={`uex-search ${searchFocused && searchResults.length ? "is-open" : ""}`}>
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setSearchFocused(false), 140)}
                    placeholder="Buscar zona, mision, jefe o ejercicio..."
                  />
                  {searchFocused && searchResults.length > 0 && (
                    <div className="uex-search-results">
                      <div className="uex-search-results-head">
                        <span>Mapa rapido</span>
                        <span>{searchResults.length} hallazgos</span>
                      </div>
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="uex-search-result"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSearchPick(item)}
                        >
                          <div className="uex-search-result-ico">
                            <OptionalAsset src={item.asset} alt="" fallback={<Search size={16} color={cls.accent} />} />
                          </div>
                          <div className="uex-search-result-copy">
                            <strong>{item.title}</strong>
                            <span>{item.subtitle}</span>
                          </div>
                          <span className="uex-row-chip uex-search-type">{item.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="uex-toolbar-actions">
                  <button className="uex-btn-ghost" onClick={() => setShowWorldCatalog((current) => !current)}>
                    {showWorldCatalog ? "Filtrar por zona" : "Ver mapa completo"}
                  </button>
                  <button
                    className="uex-btn-ghost uex-mobile-filter-toggle"
                    onClick={() => setMobileFiltersOpen((current) => !current)}
                    aria-label="Abrir filtros de biblioteca"
                  >
                    <SlidersHorizontal size={16} />
                    Filtros
                  </button>
                </div>
              </div>

              <div className="uex-filterbar">{filterControls}</div>

              {mobileFiltersOpen && <div className="uex-mobile-filter-drawer">{filterControls}</div>}
            </div>

            <div className="uex-list">
              {visibleCatalog.length === 0 ? (
                <StatePanel
                  asset={STATE_ASSET.emptyLibrary}
                  tone={cls.accent}
                  title="El gremio no encontro quests en esta busqueda"
                  text="Prueba limpiar filtros, abrir otra zona o volver al mapa completo para encontrar una ruta util."
                  fallback={<Search size={24} color={cls.accent} />}
                  tags={["Sin resultados", "Revisa filtros"]}
                />
              ) : (
                <div className="uex-quest-grid">
                  {visibleCatalog.map((exercise) => {
                    const isFavorite = favoriteIds.includes(exercise.id);
                    return (
                      <ExerciseCompactCard
                        key={exercise.id}
                        exercise={exercise}
                        affinity={affinity}
                        cls={cls}
                        isFavorite={isFavorite}
                        onToggleFavorite={toggleFavorite}
                        onOpen={setSessionExercise}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {filteredCatalog.length > CATALOG_PREVIEW_COUNT && (
              <button className="uex-btn-ghost" onClick={() => setCatalogExpanded((current) => !current)}>
                {catalogExpanded ? "Mostrar menos" : `Mostrar ${filteredCatalog.length - CATALOG_PREVIEW_COUNT} quests mas`}
              </button>
            )}
          </motion.section>
        </div>
      </div>
    </>
  );
}
