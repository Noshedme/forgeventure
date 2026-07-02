// src/pages/LoginPage.jsx â€” v7 Â· ForgeVenture Design System v3
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PRESERVADO: toda la lÃ³gica auth (Firebase, loginSync, OTP, rate-limit, validaciÃ³n)
// REDISEÃ‘ADO: DS v3 Â· Glassmorphism Â· Ambient orbs Â· Rajdhani/Orbitron/Press Start 2P
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useSpring,
} from "framer-motion";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import * as RadixDialog from "@radix-ui/react-dialog";
import { C, px, raj, orb } from "../components/admin/config/shared.jsx";
import { auth }                                                    from "../firebase";
import { forgotPassword, resetPassword, loginSync } from "../services/api";
import SuccessOverlay                                              from "../components/auth/SuccessOverlay";
import AuthPortalLoader                                            from "../components/auth/AuthPortalLoader";

// â”€â”€ Font injection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (!document.getElementById("lp7-fonts")) {
  const l = document.createElement("link");
  l.id = "lp7-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&family=Sora:wght@400;600;700;800&display=swap";
  document.head.appendChild(l);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const LOGIN_LAST_EMAIL_KEY = "fv_login_last_email";
const LOGIN_REMEMBER_ME_KEY = "fv_login_remember_me";
const LOGIN_LAST_METHOD_KEY = "fv_login_last_method";
const LOGIN_FORGOT_COOLDOWN_KEY = "fv_login_forgot_cooldown_end";
const REGISTER_DRAFT_KEY = "fv_register_draft_v1";

function readLocalString(key, fallback = "") {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalString(key, value) {
  try {
    if (value === null || value === undefined || value === "") {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  } catch {}
}

function readSessionNumber(key) {
  try {
    const value = sessionStorage.getItem(key);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

function writeSessionNumber(key, value) {
  try {
    if (!value) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, String(value));
  } catch {}
}

function getLoginFlowErrorMessage(err) {
  if (err?.code === "sync/login-failed") {
    return "Entraste, pero no pudimos sincronizar tu perfil. Intenta de nuevo.";
  }
  return firebaseError(err?.code);
}

function isMissingProfileError(err) {
  return err?.code === "sync/login-failed" && err?.cause?.status === 404;
}

// â”€â”€ Design palette (ForgeVenture DS v3 â€” keeps P.xxx refs intact) â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

const LOGIN_SCENE = {
  crest: "/logo.png",
  hero: "/missions/missions-hero-default.png",
  route: "Portal del regreso",
  bullets: ["Acceso con Google o correo", "Recuperacion guiada", "Entrada directa al dashboard"],
};

const LOGIN_SUPPORT_STEPS = [
  { title: "Vuelves al home", copy: "La portada personal se reabre con progreso, recompensas y lectura clara del dia." },
  { title: "Retomas tu racha", copy: "Si vienes con avance reciente, vuelves a ver tu ritmo, tus zonas y tu continuidad." },
  { title: "Sigues tu ruta", copy: "Dashboard, ejercicios, rutinas y misiones quedan listos donde dejaste el mapa." },
];

const LOGIN_TRUST_BAND = [
  { title: "Acceso continuo", copy: "Tu cuenta vuelve a conectar con progreso, racha y objetos guardados." },
  { title: "Entrada protegida", copy: "Correo, clave y Google usan el mismo flujo seguro del sistema." },
  { title: "Ruta clara", copy: "Desde aqui saltas al dashboard sin pantallas intermedias innecesarias." },
];

const LOGIN_STATS = [
  { label: "ACCESO", value: "Google o correo", copy: "Dos entradas para volver al mismo perfil del gremio.", color: HOME_PUBLIC_COLORS.mage },
  { label: "RECUPERACION", value: "Codigo temporal", copy: "Si el correo existe, recibes una clave breve para restaurar acceso.", color: HOME_PUBLIC_COLORS.archer },
  { label: "DESTINO", value: "Home y dashboard", copy: "La entrada te devuelve a misiones, rutas y panel personal.", color: HOME_PUBLIC_COLORS.warrior },
  { label: "SNAPSHOT", value: "Vista del gremio", copy: "Resumen orientativo del portal, no progreso exacto del personaje.", color: HOME_PUBLIC_COLORS.neutral },
];

const LOGIN_SECURITY_NOTES = [
  {
    label: "Google no comparte tu contrasena.",
    icon: "/missions/journal/journal-seal-today.png",
    accent: HOME_PUBLIC_COLORS.mage,
  },
  {
    label: "Puedes cerrar sesion en cualquier momento.",
    icon: "/ui/header/notifications/notif-shield.png",
    accent: HOME_PUBLIC_COLORS.neutral,
  },
  {
    label: "La recuperacion usa un codigo temporal.",
    icon: "/missions/rewards/reward-xp-scroll.png",
    accent: HOME_PUBLIC_COLORS.archer,
  },
];

const LOGIN_RECOVERY_PORTAL_NOTES = [
  {
    label: "Codigo temporal",
    copy: "Expira en 15 min",
    icon: "/missions/rewards/reward-xp-scroll.png",
    accent: HOME_PUBLIC_COLORS.archer,
  },
  {
    label: "Correo del portal",
    copy: "Revisa spam si no llega",
    icon: "/ui/header/notifications/notif-message.png",
    accent: HOME_PUBLIC_COLORS.mage,
  },
];

const LOGIN_METHOD_BAND = [
  {
    title: "Correo del heroe",
    copy: "Ideal si ya vienes con tus credenciales.",
    accent: HOME_PUBLIC_COLORS.neutral,
    icon: "/ui/header/notifications/notif-message.png",
  },
  {
    title: "Acceso con Google",
    copy: "La entrada mas rapida al tablero.",
    accent: HOME_PUBLIC_COLORS.mage,
    icon: "/missions/journal/journal-seal-today.png",
  },
  {
    title: "Recuperacion en 2 pasos",
    copy: "Codigo temporal y nueva clave.",
    accent: HOME_PUBLIC_COLORS.archer,
    icon: "/missions/rewards/reward-xp-scroll.png",
  },
];

function getLoginHeroState({ hasCurrentUser, showForgot, emailSentTo, lastLoginMethod }) {
  if (showForgot || emailSentTo) {
    return {
      kicker: "RECUPERACION DISPONIBLE",
      title: "El portal ya tiene una ruta para devolverte el acceso",
      copy: "Puedes pedir codigo temporal, revisar tu correo y volver al tablero sin rehacer tu entrada completa.",
      chips: ["Codigo temporal", "Correo del gremio", "Retorno guiado"],
      accent: HOME_PUBLIC_COLORS.archer,
    };
  }
  if (hasCurrentUser || lastLoginMethod) {
    return {
      kicker: "VUELVES CON RASTRO GUARDADO",
      title: "Tu ultima entrada sigue reconocida por el portal",
      copy: "El sistema recuerda tu puerta de acceso y deja lista la vuelta a dashboard, rutas y misiones.",
      chips: ["Sesion previa", "Ruta en espera", "Retorno agil"],
      accent: HOME_PUBLIC_COLORS.mage,
    };
  }
  return {
    kicker: "PRIMERA ENTRADA DEL DIA",
    title: "Cruza el portal sin romper el tono del mapa",
    copy: "Acceso, recuperacion y continuidad entran por la misma lectura visual para que el regreso se sienta natural.",
    chips: ["Google o correo", "Paso claro", "Entrada segura"],
    accent: HOME_PUBLIC_COLORS.neutral,
  };
}

function getLoginErrorMeta(code) {
  if (code === "auth/network-request-failed") {
    return {
      title: "Enlace del portal inestable",
      copy: "La puerta no pudo cerrar bien la conexion. Revisa la red y vuelve a intentarlo.",
      accent: HOME_PUBLIC_COLORS.mage,
      icon: "/ui/header/notifications/notif-message.png",
    };
  }
  if (code === "auth/user-not-found") {
    return {
      title: "No encontramos ese heroe",
      copy: "Parece que este correo aun no tiene personaje ligado dentro del gremio.",
      accent: HOME_PUBLIC_COLORS.archer,
      icon: "/missions/rewards/reward-claimed-seal.png",
    };
  }
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return {
      title: "La clave no abrio el sello",
      copy: "El correo existe, pero la combinacion de acceso no coincide con el registro del portal.",
      accent: HOME_PUBLIC_COLORS.warrior,
      icon: "/ui/header/notifications/notif-shield.png",
    };
  }
  if (code === "auth/too-many-requests") {
    return {
      title: "El portal bajo el ritmo un momento",
      copy: "Hiciste demasiados intentos seguidos. Espera un poco antes de volver a abrir la puerta.",
      accent: HOME_PUBLIC_COLORS.warrior,
      icon: "/missions/rewards/reward-contract-chest.png",
    };
  }
  if (code === "sync/login-failed") {
    return {
      title: "Acceso valido, perfil pendiente",
      copy: "La autenticacion paso, pero el enlace final con ForgeVenture no pudo terminarse en este intento.",
      accent: HOME_PUBLIC_COLORS.mage,
      icon: "/ui/crest-default.png",
    };
  }
  return {
    title: "El portal encontro una traba",
    copy: "Hubo un problema al completar la entrada. Ajusta el dato indicado y vuelve a intentarlo.",
    accent: HOME_PUBLIC_COLORS.warrior,
    icon: "/missions/rewards/reward-xp-scroll.png",
  };
}

function getAuthPhaseMeta(phase) {
  if (phase === "authenticating") {
    return {
      label: "ACCESO VALIDADO",
      copy: "Estamos confirmando tu puerta de entrada dentro del portal.",
      accent: HOME_PUBLIC_COLORS.neutral,
      icon: "/missions/journal/journal-seal-today.png",
    };
  }
  if (phase === "syncing") {
    return {
      label: "PERFIL SINCRONIZADO",
      copy: "Firebase ya respondio. Ahora enlazamos tu perfil de ForgeVenture.",
      accent: HOME_PUBLIC_COLORS.mage,
      icon: "/ui/crest-default.png",
    };
  }
  if (phase === "success") {
    return {
      label: "ABRIENDO TABLERO",
      copy: "Tu ruta ya esta lista. Estamos soltando el acceso final al dashboard.",
      accent: HOME_PUBLIC_COLORS.archer,
      icon: "/missions/rewards/reward-claimed-seal.png",
    };
  }
  return null;
}

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
    boxShadow: filled ? `${HOME_PANEL_INSET}, 0 0 20px ${accent}14` : HOME_PANEL_INSET,
  };
}

function makePrimaryButtonBackground() {
  return `linear-gradient(135deg,
    ${HOME_PUBLIC_COLORS.archer} 0%,
    color-mix(in srgb, ${HOME_PUBLIC_COLORS.mage} 86%, white 8%) 52%,
    color-mix(in srgb, ${HOME_PUBLIC_COLORS.warrior} 84%, white 10%) 100%)`;
}

// â”€â”€ Typography helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mono = (s, w = 600) => raj(s, w);
const sans = (s, w = 500) => raj(s, w);
const px8  = (s)          => px(s);

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BOOT_SEQUENCE = [
  "> ABRIENDO ACCESO DEL GREMIO",
  "> AJUSTANDO SELLOS DE ENTRADA",
  "> VERIFICANDO CREDENCIALES DEL HEROE",
  "> PREPARANDO LA BITACORA PERSONAL",
  "> ACCESO LISTO",
];

const JOURNEY = [
  { level: 1,  label: "Personaje creado",  sub: "El viaje comienza",   done: true           },
  { level: 5,  label: "Primera misiÃ³n",    sub: "XP desbloqueado",     done: true           },
  { level: 12, label: "Clase S",           sub: "Guerrero legendario", done: true, current: true },
  { level: 20, label: "PrÃ³ximo rango",     sub: "1,160 XP restantes",  done: false          },
];

const FLOAT_CARDS = [
  { icon: "ðŸ”¥", label: "Racha activa",   value: "14 dÃ­as",  color: P.accent, delay: 0.9,  x: "-80%", y: "22%" },
  { icon: "âš”ï¸",  label: "XP semanal",    value: "+1,240",   color: P.gold,   delay: 1.1,  x: "62%",  y: "12%" },
  { icon: "ðŸ†", label: "Rango global",   value: "TOP 8%",   color: P.blue,   delay: 1.3,  x: "64%",  y: "70%" },
];

// â”€â”€ Motion variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ease = [0.22, 1, 0.36, 1];
const FV = {
  up:      { hidden: { opacity: 0, y: 18  }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } },
  left:    { hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.5, ease } } },
  scale:   { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } } },
  stagger: { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } },
};

// â”€â”€ Password strength â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const pwdStrength = (pwd) => {
  if (!pwd) return null;
  if (pwd.length < 6)                        return { label: "DÃ‰BIL",  color: P.error,   val: 25 };
  if (pwd.length < 8 || !/[A-Z]/.test(pwd)) return { label: "NORMAL", color: P.accent2, val: 50 };
  if (pwd.length < 12)                       return { label: "FUERTE", color: P.blue,    val: 75 };
  return { label: "Ã‰PICO", color: P.gold, val: 100 };
};

// â”€â”€ Firebase error map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const firebaseError = (code) => ({
  "auth/user-not-found":         "No existe una cuenta con ese correo",
  "auth/wrong-password":         "ContraseÃ±a incorrecta",
  "auth/invalid-credential":     "Correo o contraseÃ±a incorrectos",
  "auth/invalid-email":          "El correo no es vÃ¡lido",
  "auth/too-many-requests":      "Demasiados intentos. Espera un momento",
  "auth/user-disabled":          "Esta cuenta ha sido deshabilitada",
  "auth/network-request-failed": "Sin conexiÃ³n. Verifica tu internet",
  "auth/popup-closed-by-user":   "Cerraste la ventana de Google. Intenta de nuevo",
  "auth/popup-blocked":          "Popup bloqueado â€” usando redirecciÃ³n...",
}[code] || "Error al iniciar sesiÃ³n. Intenta de nuevo");

// â”€â”€ Idle sprite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IDLE_FRAMES = Array.from({ length: 8 }, (_, i) => `/muÃ±eco/idle_0${i + 1}.png`);

function SpriteIdle({ size = 180, fps = 8, style = {} }) {
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CSS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  /* â”€â”€ Input â”€â”€ */
  .fv6-input {
    outline: none; box-sizing: border-box;
    font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 600;
    caret-color: ${C.orange};
    transition: border-color .2s, box-shadow .2s, background .2s;
    border-radius: 9px;
  }
  .fv6-input::placeholder { color: ${C.muted}55; font-weight: 400; }
  .fv6-input:focus {
    border-color: ${C.orange} !important;
    box-shadow: 0 0 0 2px ${C.orange}22, 0 0 14px ${C.orange}18 !important;
    background: rgba(10,14,26,0.8) !important;
  }

  /* â”€â”€ OTP â”€â”€ */
  .otp-box {
    width: 44px; height: 54px; background: ${C.bg}; border: 1px solid ${C.navy};
    font-family: 'Press Start 2P'; font-size: 15px; text-align: center;
    color: ${C.orange}; outline: none; cursor: pointer; border-radius: 9px;
    transition: border-color .18s, box-shadow .18s, background .18s; caret-color: transparent;
  }
  .otp-box:focus, .otp-active { border-color: ${C.orange} !important; box-shadow: 0 0 0 2px ${C.orange}22, 0 0 12px ${C.orange}22 !important; background: rgba(10,14,26,0.8) !important; }
  .otp-filled { border-color: ${C.orange}44; background: rgba(10,14,26,0.6); }
  .otp-error  { border-color: ${C.red} !important; box-shadow: 0 0 10px ${C.red}33 !important; }

  /* â”€â”€ Button shimmer â”€â”€ */
  .fv6-btn { position: relative; overflow: hidden; border-radius: 10px; }
  .fv6-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%); transform: translateX(-120%) skewX(-20deg); transition: transform 0.45s ease; }
  .fv6-btn:not(:disabled):hover::before { transform: translateX(260%) skewX(-20deg); }

  /* â”€â”€ Animations â”€â”€ */
  @keyframes fv6-spin { to { transform: rotate(360deg); } }
  @keyframes fv6-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes fv6-scan { 0%{top:-2px} 100%{top:100%} }
  @keyframes fv6-screenOn { 0%{opacity:0;filter:brightness(3)} 4%{opacity:.9;filter:brightness(1.4)} 7%{opacity:.4} 9%{opacity:1} 14%{filter:brightness(1)} }
  @keyframes fv6-nodePulse { 0%,100%{box-shadow:0 0 0 0 ${C.orange}55} 50%{box-shadow:0 0 0 7px transparent} }
  @keyframes fv6-gradFlow { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  @keyframes lp7-orbPulse { 0%,100%{opacity:.7} 50%{opacity:1} }

  .fv6-blink { animation: fv6-blink 0.9s infinite; }
  .fv6-scan-line { position: absolute; left: 0; right: 0; height: 1px; animation: fv6-scan 7s linear infinite; }
  .page-enter { animation: fv6-screenOn 0.55s ease both; }
  .node-pulse { animation: fv6-nodePulse 1.8s ease-out infinite; }

  .grad-text {
    background: linear-gradient(90deg, ${HOME_PUBLIC_COLORS.archer}, ${HOME_PUBLIC_COLORS.mage}, ${HOME_PUBLIC_COLORS.warrior});
    background-size: 300% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fv6-gradFlow 5s ease infinite;
  }

  /* â”€â”€ Cooldown badge â”€â”€ */
  .cooldown-badge {
    display: inline-block; font-family: 'Rajdhani'; font-weight:700; font-size: 11px;
    color: ${C.muted}; background: ${C.side}; border: 1px solid ${C.navy};
    padding: 1px 7px; margin-left: 6px; border-radius:5px;
  }

  /* â”€â”€ Google redirect overlay â”€â”€ */
  .google-redirect-overlay {
    position: fixed; inset: 0; z-index: 9500; background: rgba(10,14,26,0.96);
    backdrop-filter: blur(18px); display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
  }

  /* â”€â”€ Rate-limit bar â”€â”€ */
  .rate-limit-bar { height: 3px; }

  /* â”€â”€ Pixel corners â”€â”€ */
  .px6-corners { position: relative; }
  .px6-corners::before {
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

  /* â”€â”€ Responsive â”€â”€ */
  @media (max-width: 980px) { .lp6-grid { grid-template-columns: 0.7fr 1.3fr !important; } }
  @media (max-width: 640px) {
    .lp6-grid { grid-template-columns: 1fr !important; }
    .lp6-left { display: none !important; }
    .lp6-right { padding: 72px clamp(16px,5vw,36px) 32px !important; }
  }

  /* â”€â”€ Radix confirm dialog â”€â”€ */
  .fv6-dialog-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(10px);
    animation: fv6-fadeIn .18s ease;
  }
  .fv6-dialog-content {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
    z-index: 501; width: 90%; max-width: 340px;
    background: rgba(20,26,42,0.96); border: 1px solid ${C.orange}44; border-radius:12px;
    box-shadow: 0 24px 64px rgba(0,0,0,.75), 0 0 0 1px ${C.orange}18;
    padding: 24px; animation: fv6-scaleIn .2s ease;
  }
  @keyframes fv6-fadeIn  { from { opacity:0; }              to { opacity:1; } }
  @keyframes fv6-scaleIn { from { opacity:0; scale:0.92; } to { opacity:1; scale:1; } }

  /* â”€â”€ Mobile banner (replaces left panel content on small screens) â”€â”€ */
  .lp6-mobile-top { display: none; }
  @media (max-width: 640px) {
    .lp6-mobile-top {
      display: flex; align-items: center; justify-content: space-between;
      position: absolute; top: 24px; left: clamp(16px,5vw,36px); right: clamp(16px,5vw,36px);
      z-index: 10;
    }
  }

  /* â”€â”€ Back button responsive â”€â”€ */
  .lp6-back { position: absolute; top: 30px; left: 44px; z-index: 12; }
  @media (max-width: 640px) { .lp6-back { top: 52px; left: clamp(16px,5vw,36px); } }
`;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AURORA BACKGROUND â€” static ambient orbs (no animation, same DS v3 pattern as Home.jsx)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AuroraBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
      background: `linear-gradient(160deg,${C.bg} 0%,#080D18 55%,${C.bg} 100%)` }}>
      {/* Orb 1 â€” orange top-left */}
      <div style={{ position: "absolute", top: "3%", left: "6%", width: 700, height: 700,
        background: `radial-gradient(circle, ${C.orange}18 0%, transparent 65%)`, filter: "blur(90px)" }} />
      {/* Orb 2 â€” purple bottom-right */}
      <div style={{ position: "absolute", bottom: "-8%", right: "2%", width: 650, height: 650,
        background: `radial-gradient(circle, ${C.purple}14 0%, transparent 65%)`, filter: "blur(90px)" }} />
      {/* Orb 3 â€” blue center */}
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CURSOR (ring cuadrado, sin punto)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PARTICLES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Particles = memo(function Particles({ count = 16 }) {
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LOADER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Loader({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [phase,    setPhase]    = useState("boot");
  const [lines,    setLines]    = useState([]);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  useEffect(() => {
    if (reduced || sessionStorage.getItem("fv_booted") === "1") { onDone(); return; }
    let idx = 0;
    const t = setInterval(() => {
      if (idx < BOOT_SEQUENCE.length) { setLines(p => [...p, BOOT_SEQUENCE[idx]]); idx++; }
      else { clearInterval(t); setTimeout(() => setPhase("loading"), 160); }
    }, 220);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    let val = 0;
    const iv = setInterval(() => {
      val += Math.random() * 18 + 6;
      if (val >= 100) { val = 100; clearInterval(iv); setTimeout(() => { setPhase("done"); sessionStorage.setItem("fv_booted", "1"); setTimeout(onDone, 400); }, 160); }
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

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
          <motion.span
            animate={{ filter: [`drop-shadow(0 0 8px ${P.accent})`, `drop-shadow(0 0 20px ${P.accent})`, `drop-shadow(0 0 8px ${P.accent})`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ fontSize: 22 }}>âš”ï¸</motion.span>
          <span className="grad-text" style={{ ...orb(14) }}>FORGE</span>
          <span style={{ ...orb(14), color: P.text }}>VENTURE</span>
        </div>
        <div style={{ ...mono(10, 600), color: P.blue, letterSpacing: "0.26em", textTransform: "uppercase" }}>Authentication Portal v6</div>
      </motion.div>

      {/* Terminal */}
      <div style={{ width: "100%", maxWidth: 400, background: P.bg1, border: `1px solid ${P.line}`,
        padding: "14px 18px", marginBottom: 22, minHeight: 115,
        ...mono(7), color: "#10B981", lineHeight: 2.4 }}>
        {lines.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 0.85, x: 0 }} transition={{ delay: i * 0.04 }}>{l}</motion.div>
        ))}
        {phase === "loading" && <span className="fv6-blink">â–ˆ</span>}
      </div>

      {/* Progress */}
      {phase === "loading" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ ...mono(8, 600), color: P.muted, letterSpacing: ".12em" }}>CARGANDO AUTH DATA</span>
            <span style={{ ...mono(9, 700), color: P.accent }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 16, background: P.bg0, border: `1px solid ${P.accent}55`, display: "flex", gap: 2, padding: 2 }}>
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: "100%",
                background: i < filled ? `linear-gradient(to bottom, ${P.accent2}, ${P.accent})` : "transparent",
                transition: "background 0.08s",
                boxShadow: i < filled ? `0 0 4px ${P.accent}88` : "none" }} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SPINNER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Spinner({ size = 14, color = P.accent }) {
  return <div style={{ width: size, height: size, border: `2px solid ${P.line}`, borderTop: `2px solid ${color}`, animation: "fv6-spin 0.7s linear infinite", borderRadius: "50%", flexShrink: 0 }} />;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INPUT FIELD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Eye icon SVGs (inline to avoid adding lucide-react to LoginPage bundle)
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

function InputField({ id, label, type = "text", value, onChange, onBlur, placeholder, error, autoComplete, showStrength, inputMode, autoFocus }) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = type === "password" && show ? "text" : type;
  const inputId   = id || `fv6-input-${label?.replace(/\s/g, "-").toLowerCase()}`;
  const strength  = showStrength ? pwdStrength(value) : null;

  return (
    <motion.div variants={FV.up} style={{ marginBottom: 16 }}>
      {label && (
        <motion.label htmlFor={inputId}
          animate={{ color: focused ? P.accent : P.muted }}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, ...mono(9, 700), letterSpacing: ".14em", cursor: "pointer" }}>
          {focused && <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="fv6-blink" style={{ color: P.accent }}>â–¶</motion.span>}
          {label}
        </motion.label>
      )}
      <div style={{ position: "relative" }}>
        {/* Focus corner brackets */}
        <AnimatePresence>
          {focused && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: -3, pointerEvents: "none", zIndex: 0,
                background: `linear-gradient(${P.accent},${P.accent}) 0 0/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 0 0/2px 12px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 0/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 0/2px 12px no-repeat,linear-gradient(${P.accent},${P.accent}) 0 100%/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 0 100%/2px 12px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 100%/12px 2px no-repeat,linear-gradient(${P.accent},${P.accent}) 100% 100%/2px 12px no-repeat`,
              }} />
          )}
        </AnimatePresence>
        <input
          id={inputId} className="fv6-input"
          type={inputType} value={value}
          onChange={onChange}
          onBlur={e  => { setFocused(false); onBlur?.(e); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={{ position: "relative", zIndex: 1, width: "100%",
            padding: type === "password" ? "12px 44px 12px 14px" : "12px 14px",
            background: focused ? P.bg1 : P.bg0,
            border: `1px solid ${error ? P.error : focused ? P.accent : P.line}`,
            color: P.text,
          }} />
        {type === "password" && (
          <motion.button type="button" onClick={() => setShow(s => !s)}
            whileHover={{ scale: 1.15, color: P.accent }} whileTap={{ scale: 0.9 }}
            aria-label={show ? "Ocultar contrasena" : "Mostrar contrasena"}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: P.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 2, zIndex: 2, transition: "color .15s" }}>
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </motion.button>
        )}
      </div>

      {/* Strength */}
      <AnimatePresence>
        {strength && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 2, height: 4, marginBottom: 4 }}>
              {[25, 50, 75, 100].map(v => (
                <motion.div key={v} animate={{ background: strength.val >= v ? strength.color : P.navy }}
                  transition={{ duration: 0.3 }}
                  style={{ flex: 1, height: "100%", boxShadow: strength.val >= v ? `0 0 4px ${strength.color}` : "none" }} />
              ))}
            </div>
            <span style={{ ...mono(8, 700), color: strength.color }}>{strength.label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div id={`${inputId}-error`} role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ ...sans(12), color: P.error, marginTop: 5, display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
            <span style={{ ...mono(8, 700), color: P.error }}>âš </span> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// OTP INPUT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OTPInput({ value, onChange, hasError }) {
  const DIGITS  = 6;
  const boxRefs = useRef([]);

  const focusBox  = (i) => boxRefs.current[Math.max(0, Math.min(i, DIGITS - 1))]?.focus();
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGITS);
    onChange(pasted);
    focusBox(Math.min(pasted.length, DIGITS - 1));
  };
  const handleKeyDown = (e, i) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) onChange(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focusBox(i - 1); }
    } else if (e.key === "ArrowLeft"  && i > 0)         focusBox(i - 1);
    else  if (e.key === "ArrowRight" && i < DIGITS - 1) focusBox(i + 1);
  };
  const handleChange = (e, i) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const arr = (value.padEnd(DIGITS, " ")).split("");
    arr[i] = char;
    onChange(arr.join("").trimEnd().slice(0, DIGITS));
    if (i < DIGITS - 1) focusBox(i + 1);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...mono(9, 700), color: P.muted, marginBottom: 10, letterSpacing: ".14em" }}>ðŸ”¢ CÃ“DIGO SECRETO</div>
      <div style={{ display: "flex", gap: 7, justifyContent: "center" }} onPaste={handlePaste}>
        {Array.from({ length: DIGITS }, (_, i) => {
          const char  = value[i] ?? "";
          const isFill = !!char;
          const isAct  = i === value.length && value.length < DIGITS;
          return (
            <motion.input key={i}
              ref={el => { boxRefs.current[i] = el; }}
              id={i === 0 ? "otp-code" : undefined}
              type="tel" inputMode="numeric" maxLength={1} value={char}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`DÃ­gito ${i + 1} de 6`}
              className={`otp-box${isFill ? " otp-filled" : ""}${isAct ? " otp-active" : ""}${hasError ? " otp-error" : ""}`}
              onFocus={() => focusBox(i)}
              onChange={e => handleChange(e, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              animate={hasError ? { x: [-4, 4, -3, 3, -1, 1, 0] } : { x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 10 }}>
        {Array.from({ length: DIGITS }, (_, i) => (
          <motion.div key={i}
            animate={{ background: i < value.length ? P.accent : P.line, boxShadow: i < value.length ? `0 0 4px ${P.accent}` : "none", width: i < value.length ? 18 : 7 }}
            transition={{ duration: 0.18 }} style={{ height: 3 }} />
        ))}
      </div>
      <div style={{ ...sans(11, 400), color: P.muted, textAlign: "center", marginTop: 6 }}>
        {value.length}/{DIGITS} dÃ­gitos
        {value.length === DIGITS && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: P.success, marginLeft: 8 }}>âœ“ LISTO</motion.span>}
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GOOGLE REDIRECT OVERLAY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GoogleRedirectOverlay({ onCancel }) {
  const [showCancel, setShowCancel] = useState(false);
  const [timedOut,   setTimedOut]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCancel(true), 4000);
    const t2 = setTimeout(() => setTimedOut(true),   30_000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div className="google-redirect-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        style={{ width: 46, height: 46, border: `2px solid ${P.line}`, borderTop: "2px solid #4285F4", borderRadius: "50%" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ ...mono(9, 700), color: "#4285F4", marginBottom: 10, letterSpacing: ".14em" }}>REDIRIGIENDO A GOOGLE</div>
        <div style={{ ...sans(13, 400), color: P.muted, lineHeight: 1.8, maxWidth: 280 }}>
          {timedOut
            ? "La redirecciÃ³n tardÃ³ demasiado. Intenta de nuevo."
            : "SerÃ¡s llevado a Google para autenticarte. No cierres esta ventana."}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
            style={{ width: 8, height: 8, background: "#4285F4", imageRendering: "pixelated" }} />
        ))}
      </div>
      <AnimatePresence>
        {(showCancel || timedOut) && (
          <motion.button type="button" onClick={onCancel}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            whileHover={{ borderColor: P.accent, color: P.accent }}
            style={{ ...mono(8, 700), color: P.muted, background: "transparent",
              border: `1px solid ${P.line}`, padding: "9px 20px", cursor: "pointer",
              letterSpacing: ".1em", transition: "border-color .15s, color .15s" }}>
            {timedOut ? "âŸ³ REINTENTAR" : "âœ• CANCELAR"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FORGOT PASSWORD MODAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ForgotPasswordModal({ onClose, onEmailSent, initialEmail = "" }) {
  const [step,       setStep]       = useState("email");
  const [email,      setEmail]      = useState(initialEmail);
  const [code,       setCode]       = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [codeError,  setCodeError]  = useState(false);
  const [shaking,    setShaking]    = useState(false);
  const [cooldown,          setCooldown]          = useState(0);
  const [showConfirmClose,  setShowConfirmClose]  = useState(false);
  const cooldownRef = useRef(null);

  const syncCooldown = useCallback((endAt) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    const update = () => {
      const secs = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (secs <= 0) {
        setCooldown(0);
        writeSessionNumber(LOGIN_FORGOT_COOLDOWN_KEY, null);
        if (cooldownRef.current) {
          clearInterval(cooldownRef.current);
          cooldownRef.current = null;
        }
        return;
      }
      setCooldown(secs);
    };
    update();
    cooldownRef.current = setInterval(update, 1000);
  }, []);

  useEffect(() => {
    const savedEnd = readSessionNumber(LOGIN_FORGOT_COOLDOWN_KEY);
    if (savedEnd && savedEnd > Date.now()) {
      syncCooldown(savedEnd);
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [syncCooldown]);

  const triggerShake = () => { setShaking(true); setTimeout(() => setShaking(false), 500); };

  const startCooldown = () => {
    const endAt = Date.now() + 60_000;
    writeSessionNumber(LOGIN_FORGOT_COOLDOWN_KEY, endAt);
    syncCooldown(endAt);
  };

  const handleRequestCode = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Ingresa un correo válido"); triggerShake(); return; }
    if (cooldown > 0) { setError(`Espera ${cooldown}s antes de reenviar`); triggerShake(); return; }
    setError(""); setLoading(true);
    try { await forgotPassword(email); setStep("code"); startCooldown(); onEmailSent?.(email); }
    catch (err) { setError(err.message); triggerShake(); }
    finally { setLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6)             { setCodeError(true); setError("El código tiene 6 dígitos"); triggerShake(); return; }
    if (!newPwd || newPwd.length < 6)  { setError("Mínimo 6 caracteres"); triggerShake(); return; }
    if (newPwd !== confirmPwd)         { setError("Las contraseñas no coinciden"); triggerShake(); return; }
    setError(""); setCodeError(false); setLoading(true);
    try {
      await resetPassword(email, code, newPwd);
      setStep("done");
      setTimeout(onClose, 3500);
    } catch (err) {
      const isExpired = err.message?.toLowerCase().includes("expir") || err.code === "token_expired";
      if (isExpired) { setCodeError(true); setError("El código expiró. Solicita uno nuevo."); setStep("email"); }
      else { setCodeError(true); setError(err.message); }
      triggerShake();
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    if (step === "code" && (code || newPwd || confirmPwd)) {
      setShowConfirmClose(true);
      return;
    }
    onClose();
  };

  const stepIdx = ["email", "code", "done"].indexOf(step);

  return (
    <>
    {/* Confirm-close dialog (replaces window.confirm) */}
    <RadixDialog.Root open={showConfirmClose} onOpenChange={setShowConfirmClose}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fv6-dialog-overlay" />
        <RadixDialog.Content className="fv6-dialog-content" aria-describedby="confirm-close-desc">
          <div style={{ height: 2, background: `linear-gradient(90deg,${P.accent},${P.accent2},transparent)`, marginBottom: 18 }} />
          <RadixDialog.Title style={{ ...mono(9, 700), color: P.accent, letterSpacing: ".1em", marginBottom: 10 }}>
            ¿ABANDONAR LA RECUPERACION?
          </RadixDialog.Title>
          <RadixDialog.Description id="confirm-close-desc" style={{ ...sans(13, 400), color: P.muted, lineHeight: 1.6, marginBottom: 22 }}>
            Perderás el código y la contraseña ingresados. ¿Seguro que quieres salir?
          </RadixDialog.Description>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <RadixDialog.Close asChild>
              <motion.button type="button" whileHover={{ color: P.accent }}
                style={{ ...mono(8, 700), color: P.muted, background: P.bg0,
                  border: `1px solid ${P.line}`, padding: "9px 16px", cursor: "pointer", letterSpacing: ".08em" }}>
                CONTINUAR
              </motion.button>
            </RadixDialog.Close>
            <motion.button type="button"
              onClick={() => { setShowConfirmClose(false); onClose(); }}
              whileHover={{ background: P.error, color: "#fff" }}
              style={{ ...mono(8, 700), color: P.error, background: `${P.error}12`,
                border: `1px solid ${P.error}44`, padding: "9px 16px", cursor: "pointer",
                letterSpacing: ".08em", transition: "background .15s, color .15s" }}>
              SALIR
            </motion.button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" aria-modal="true" aria-label="Recuperar contraseña"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(14px)" }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="px6-corners"
        style={{ "--cc": P.accent, width: "100%", maxWidth: 500, background: P.bg1, border: `1px solid ${P.line}`, overflow: "hidden",
          borderRadius: 24, position: "relative",
          boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${P.accent}18` }}>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(circle at 16% 12%, ${HOME_PUBLIC_COLORS.warrior}16 0%, transparent 28%),
              radial-gradient(circle at 82% 16%, ${HOME_PUBLIC_COLORS.mage}14 0%, transparent 26%),
              linear-gradient(180deg, rgba(10,12,22,0.16), rgba(8,9,18,0.9))
            `,
            pointerEvents: "none",
          }}
        />

        {/* Top accent */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${P.accent}, ${P.accent2}, ${P.gold}, transparent)` }} />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, background: `linear-gradient(180deg, rgba(18,22,36,0.9), rgba(10,12,20,0.86))`, borderBottom: `1px solid ${P.line}`, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ ...makeHomePanel({ radius: 12, surface: "rgba(9,11,19,0.82)", outerGlow: "rgba(0,0,0,0.18)" }), width: 40, height: 40, display: "grid", placeItems: "center" }}>
              <img src="/missions/rewards/reward-xp-scroll.png" alt="" aria-hidden="true" style={{ width: 24, height: 24, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ ...mono(7, 700), color: P.muted, letterSpacing: ".12em", marginBottom: 4 }}>[ RITUAL DE RETORNO ]</div>
              <span style={{ ...mono(9, 700), color: P.accent, letterSpacing: ".1em" }}>RECUPERAR CUENTA</span>
            </div>
          </div>
          <motion.button type="button" onClick={handleClose} whileHover={{ rotate: 90, color: P.accent }} whileTap={{ scale: 0.9 }}
            style={{ ...sans(16, 700), background: "none", border: "none", color: P.muted, cursor: "pointer", lineHeight: 1 }}>x</motion.button>
        </div>

        {/* Steps bar */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8, padding: "10px 14px", background: "rgba(8,10,18,0.84)", borderBottom: `1px solid ${P.line}` }}>
          {["CORREO", "CODIGO", "LISTO"].map((label, i) => (
            <div key={i} style={{ flex: 1, display: "grid", gap: 5 }}>
              <div style={{ ...mono(7, 700), color: stepIdx >= i ? P.accent : P.muted, letterSpacing: ".1em" }}>
                {stepIdx > i ? "OK" : stepIdx === i ? ">" : "o"} {label}
              </div>
              <motion.div animate={{ background: stepIdx >= i ? P.accent : P.line, boxShadow: stepIdx === i ? `0 0 8px ${P.accent}` : "none" }}
                style={{ height: 4, width: "100%", borderRadius: 999 }} />
            </div>
          ))}
        </div>

        {/* Content */}
        <motion.div animate={shaking ? { x: [-6, 6, -4, 4, -2, 2, 0] } : { x: 0 }} transition={{ duration: 0.4 }} style={{ position: "relative", zIndex: 1, padding: 24 }}>
          <AnimatePresence mode="wait">

            {step === "email" && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                <div style={{ ...makeHomePanel({ radius: 18, surface: "rgba(10,12,22,0.74)", outerGlow: "rgba(0,0,0,0.18)" }), padding: "14px 15px", marginBottom: 14 }}>
                  <div style={{ ...mono(7, 700), color: P.muted, letterSpacing: ".12em", marginBottom: 6 }}>
                    RECUPERA EL ACCESO A TU CUENTA
                  </div>
                  <div style={{ ...homeHeading(22, 700), color: "#f5f2ff", lineHeight: 1.05, marginBottom: 10 }}>
                    Vuelve por una ruta clara y sin perder tu avance.
                  </div>
                  <p style={{ ...sans(13, 500), color: P.text, lineHeight: 1.5, marginBottom: 12 }}>
                    Te enviaremos un <strong style={{ color: P.accent2 }}>código de 6 dígitos</strong> al correo registrado. Úsalo para crear una nueva contraseña.
                  </p>
                  <p style={{ ...sans(12, 500), color: P.muted, lineHeight: 1.55, marginBottom: 0 }}>
                    Si el correo existe, recibirás el código para continuar.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10, marginBottom: 12 }}>
                  {LOGIN_RECOVERY_PORTAL_NOTES.map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: `linear-gradient(135deg, color-mix(in srgb, ${item.accent} 12%, rgba(11,14,26,0.92)) 0%, rgba(11,14,26,0.92) 100%)`,
                        border: `1px solid color-mix(in srgb, ${item.accent} 34%, rgba(255,255,255,0.08))`,
                        boxShadow: `0 12px 24px rgba(0,0,0,0.22), inset 0 0 0 1px color-mix(in srgb, ${item.accent} 12%, transparent)`,
                        borderRadius: 14,
                        padding: "10px 12px",
                        display: "grid",
                        gridTemplateColumns: "28px 1fr",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={item.icon}
                        alt=""
                        aria-hidden="true"
                        style={{ width: 28, height: 28, objectFit: "contain", filter: `drop-shadow(0 0 10px color-mix(in srgb, ${item.accent} 45%, transparent))` }}
                      />
                      <div>
                        <div style={{ ...mono(7, 700), color: item.accent, marginBottom: 4, letterSpacing: ".09em" }}>{item.label}</div>
                        <div style={{ ...sans(11, 500), color: P.muted, lineHeight: 1.45 }}>{item.copy}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: P.bg0, border: `1px solid ${P.line}`, borderLeft: `3px solid ${P.gold}`, borderRadius: 14, padding: "10px 14px", marginBottom: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <img
                      src="/missions/rewards/reward-claimed-seal.png"
                      alt=""
                      aria-hidden="true"
                      style={{ width: 24, height: 24, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(255,210,108,0.28))" }}
                    />
                    <div style={{ ...mono(7, 700), color: `${P.gold}99`, letterSpacing: ".1em" }}>[ GUIA DEL PORTAL ]</div>
                  </div>
                  <p style={{ ...sans(12, 400), color: P.muted, lineHeight: 1.6, margin: 0 }}>
                    El código expira en <strong style={{ color: P.accent2 }}>15 minutos</strong>. Revisa también tu carpeta de spam.
                  </p>
                </div>
                <InputField id="forgot-email" label="CORREO DEL HEROE" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="heroe@forgeventure.com" error={error} autoComplete="email"
                  inputMode="email" />
                <motion.button type="button" onClick={handleRequestCode} disabled={loading || cooldown > 0}
                  whileHover={!loading && !cooldown ? { scale: 1.02, y: -2 } : {}} whileTap={!loading && !cooldown ? { scale: 0.97 } : {}}
                  className="fv6-btn"
                  style={{ width: "100%", ...mono(9, 700), letterSpacing: ".1em",
                    color: loading || cooldown > 0 ? P.muted : "#fff",
                    background: loading || cooldown > 0 ? `${P.accent}55` : P.accent,
                    border: "none", padding: "13px", cursor: loading || cooldown > 0 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {loading ? <><Spinner size={12} /> Enviando...</> : cooldown > 0 ? `Espera ${cooldown}s` : "Enviar codigo"}
                </motion.button>
              </motion.div>
            )}

            {step === "code" && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                <div style={{ ...makeHomePanel({ radius: 16, surface: "rgba(9,12,22,0.78)", outerGlow: "rgba(0,0,0,0.14)" }), borderLeft: `3px solid ${P.success}`, padding: "12px 16px", marginBottom: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <img src="/missions/journal/journal-seal-claimed.png" alt="" aria-hidden="true" style={{ width: 24, height: 24, objectFit: "contain" }} />
                    <div style={{ ...mono(8, 700), color: P.success, letterSpacing: ".1em" }}>[ CODIGO ENVIADO ]</div>
                  </div>
                  <p style={{ ...sans(12, 500), color: P.muted, margin: 0 }}>Revisa: <strong style={{ color: P.text }}>{email}</strong><br />
                    <span style={{ ...mono(8, 500), color: P.muted }}>Expira en 15 minutos</span></p>
                </div>
                <OTPInput value={code} onChange={v => { setCode(v); if (codeError) setCodeError(false); }} hasError={codeError} />
                <AnimatePresence>
                  {codeError && error && (
                    <motion.div role="alert" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ ...sans(12), color: P.error, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                      <span style={{ ...mono(8), color: P.error }}>!</span> {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <InputField id="new-password"     label="NUEVA CONTRASENA" type="password" value={newPwd}     onChange={e => setNewPwd(e.target.value)}     placeholder="********" autoComplete="new-password"  showStrength />
                <InputField id="confirm-password" label="CONFIRMAR"        type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="********" error={!codeError ? error : undefined} autoComplete="new-password" />
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button type="button" onClick={() => { setStep("email"); setError(""); setCode(""); }}
                    whileHover={{ background: `${P.accent}11`, color: P.accent }}
                    style={{ flex: "0 0 auto", ...mono(8, 700), letterSpacing: ".1em", color: P.muted, background: P.bg0, border: `1px solid ${P.line}`, padding: "12px 14px", cursor: "pointer", transition: "background .15s,color .15s" }}>VOLVER</motion.button>
                  <motion.button type="button" onClick={handleVerifyCode} disabled={loading}
                    whileHover={!loading ? { scale: 1.02, y: -1 } : {}} whileTap={!loading ? { scale: 0.97 } : {}} className="fv6-btn"
                    style={{ flex: 1, ...mono(9, 700), letterSpacing: ".1em", color: loading ? P.muted : "#fff", background: loading ? `${P.accent}55` : P.accent, border: "none", padding: "12px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {loading ? <><Spinner size={12} /> Verificando...</> : "Confirmar"}
                  </motion.button>
                </div>
                <button type="button" onClick={handleRequestCode} disabled={loading || cooldown > 0}
                  style={{ ...sans(12, 500), color: P.muted, background: "none", border: "none", cursor: cooldown > 0 ? "not-allowed" : "pointer", marginTop: 14, display: "block", textAlign: "center", width: "100%", opacity: cooldown > 0 ? 0.5 : 1 }}>
                  {cooldown > 0 ? <span>¿No llegó? Reenviar en <span className="cooldown-badge">{cooldown}s</span></span> : "¿No llegó? Reenviar código"}
                </button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease }} style={{ textAlign: "center", padding: "16px 0" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  style={{ width: 70, height: 70, margin: "0 auto 18px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, border: `2px solid ${P.accent}`, boxShadow: `0 0 20px ${P.accent}44` }} />
                  <img src="/missions/rewards/reward-claimed-seal.png" alt="" aria-hidden="true" style={{ width: 36, height: 36, objectFit: "contain" }} />
                </motion.div>
                <div style={{ ...orb(13, 900), color: P.accent, marginBottom: 8, letterSpacing: ".08em" }}>ACCESO RESTAURADO</div>
                <p style={{ ...sans(13, 400), color: P.muted, lineHeight: 1.7, marginBottom: 22 }}>Tu contraseña quedó renovada. El portal ya puede devolverte al login para abrir tu tablero.</p>
                <motion.button type="button" onClick={onClose} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} className="fv6-btn"
                  style={{ ...sans(13, 700), color: "#fff", background: P.accent, border: "none", padding: "13px 28px", cursor: "pointer" }}>Iniciar sesion</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
    </>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LEFT PANEL â€” Aurora Â· Sprite Â· Journey Â· Float cards
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Journey stagger variants
const journeyContainerV = { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.75 } } };
const journeyItemV      = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.45, ease } } };

const LeftPanel = memo(function LeftPanel({ onGoToDashboard, onGoBack, onGoRegister, heroState, lastLoginEmail = "", lastLoginMethod = "" }) {
  const [online] = useState(() => Math.floor(Math.random() * 400) + 820);
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springX = useSpring(rotX, { stiffness: 60, damping: 18 });
  const springY = useSpring(rotY, { stiffness: 60, damping: 18 });

  useEffect(() => onAuthStateChanged(auth, setCurrentUser), []);
  const activeHeroState = heroState ?? getLoginHeroState({ hasCurrentUser: Boolean(currentUser), showForgot: false, emailSentTo: "", lastLoginMethod });

  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    rotX.set(-((e.clientY - r.top - r.height / 2) / r.height) * 5);
    rotY.set(((e.clientX - r.left - r.width / 2) / r.width) * 5);
  }, [rotX, rotY]);
  const onLeave = useCallback(() => { rotX.set(0); rotY.set(0); }, [rotX, rotY]);

  return (
    <motion.div
      className="lp6-left"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: springX,
        rotateY: springY,
        position: "relative",
        overflow: "hidden",
        borderRight: `1px solid rgba(255,255,255,0.08)`,
        padding: "24px",
        display: "grid",
        alignContent: "start",
        gap: 16,
        perspective: 1200,
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
            radial-gradient(circle at 54% 86%, ${HOME_PUBLIC_COLORS.archer}12 0%, transparent 30%)
          `,
          filter: "blur(42px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...makeHomePanel({ radius: 16, surface: "rgba(10,12,20,0.72)", outerGlow: "rgba(0,0,0,0.22)" }), width: 48, height: 48, display: "grid", placeItems: "center" }}>
              <img src={LOGIN_SCENE.crest} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ ...homeHeading(13, 700), color: "#f6f2ff" }}>ForgeVenture</div>
              <div style={{ ...mono(7, 600), color: HOME_PUBLIC_COLORS.neutral, letterSpacing: ".12em" }}>PORTAL DE ACCESO</div>
            </div>
          </div>
          <span style={{ ...sans(11, 600), color: P.muted }}>{currentUser ? "Retoma tu ruta" : "Entrada al gremio"}</span>
        </div>

        <div style={{ ...makeHomePanel({ radius: 26, surface: "rgba(7,8,18,0.66)", outerGlow: "rgba(0,0,0,0.32)" }), position: "relative", minHeight: 500, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(8,8,16,0.18), rgba(8,8,16,0.68)), url('${LOGIN_SCENE.hero}') center / cover no-repeat` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(9,8,18,0.02), rgba(9,8,18,0.44)), radial-gradient(circle at 18% 16%, ${HOME_PUBLIC_COLORS.warrior}12 0%, transparent 24%), radial-gradient(circle at 84% 12%, ${HOME_PUBLIC_COLORS.mage}12 0%, transparent 22%)` }} />

          <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "20px 20px 18px", display: "grid", alignContent: "space-between" }}>
            <div style={{ ...makeHomePanel({ radius: 18, surface: "rgba(8,9,18,0.72)", outerGlow: "rgba(0,0,0,0.18)" }), maxWidth: 340, padding: "14px 15px" }}>
              <div style={{ ...mono(7, 700), color: HOME_PUBLIC_COLORS.neutral, letterSpacing: ".12em", marginBottom: 8 }}>
                {activeHeroState.kicker}
              </div>
              <div style={{ ...homeHeading(22, 700), color: "#f5f2ff", marginBottom: 8, lineHeight: 1.08 }}>
                {activeHeroState.title}
              </div>
              <p style={{ ...sans(12, 500), color: "#c7d1e5", lineHeight: 1.6 }}>
                {activeHeroState.copy}
              </p>
            </div>

            <div style={{ position: "relative", minHeight: 184, display: "grid", justifyItems: "center", alignItems: "end" }}>
              <SpriteIdle size={220} fps={8} />
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ ...homeHeading("clamp(24px,2.4vw,34px)", 700), color: "#f7f3ff", marginBottom: 8, lineHeight: 1.02 }}>
                  {currentUser ? "Tu progreso sigue vivo" : "Cruza el portal con lectura clara"}
                </div>
                <p style={{ ...sans(13, 500), color: "#d0d8ea", lineHeight: 1.6, maxWidth: 520 }}>
                  {currentUser
                    ? "Dashboard, ejercicios, rutinas y misiones quedan listos apenas pases este portal."
                    : "La entrada usa el mismo tono visual del home y deja una lectura mas viva del regreso."}
                </p>
                {(lastLoginMethod || lastLoginEmail) && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {lastLoginMethod && (
                      <div style={{ ...makeHomePill(activeHeroState.accent, true), padding: "7px 10px", ...sans(11, 600), color: "#eef3ff" }}>
                        Ultimo acceso: {lastLoginMethod === "google" ? "Google" : "correo"}
                      </div>
                    )}
                    {lastLoginEmail && (
                      <div style={{ ...makeHomePill(HOME_PUBLIC_COLORS.neutral), padding: "7px 10px", ...sans(11, 600), color: "#eef3ff" }}>
                        {lastLoginEmail}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                {(currentUser
                  ? ["Dashboard listo", "Racha guardada", "Ruta esperandote"]
                  : activeHeroState.chips
                ).map((bullet) => (
                  <div key={bullet} style={{ ...makeHomePanel({ radius: 14, surface: "rgba(8,9,18,0.72)", outerGlow: "rgba(0,0,0,0.14)" }), padding: "10px 12px", ...sans(11, 600), color: "#f3f6ff" }}>
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(220px, 0.95fr)", gap: 12 }}>
          <div style={{ ...makeHomePanel({ radius: 18, surface: "rgba(11,13,22,0.72)", outerGlow: "rgba(0,0,0,0.16)" }), padding: "12px 14px" }}>
            <div style={{ ...mono(8, 700), color: HOME_PUBLIC_COLORS.neutral, letterSpacing: ".1em", marginBottom: 10 }}>
              DESPUES DE ENTRAR
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {LOGIN_SUPPORT_STEPS.map((item, index) => (
                <div key={item.title} style={{ ...makeHomePanel({ radius: 14, surface: "rgba(255,255,255,0.03)", outerGlow: "rgba(0,0,0,0.10)" }), padding: "10px 12px", display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, alignItems: "start" }}>
                  <div style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 999, background: `${HOME_PUBLIC_COLORS.mage}16`, border: `1px solid ${HOME_PUBLIC_COLORS.mage}2a`, ...mono(8, 700), color: HOME_PUBLIC_COLORS.mage }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ ...sans(12, 700), color: "#f4f1ff", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ ...sans(11, 500), color: "#cad4e7", lineHeight: 1.45 }}>{item.copy}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <motion.button
                type="button"
                onClick={onGoBack}
                whileHover={{ y: -2, borderColor: `${HOME_PUBLIC_COLORS.neutral}66`, color: HOME_PUBLIC_COLORS.neutral }}
                whileTap={{ scale: 0.98 }}
                style={{ ...sans(12, 700), ...makeHomePill(HOME_PUBLIC_COLORS.neutral), minHeight: 44, flex: 1, color: P.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: ".06em" }}
              >
                Volver al portal
              </motion.button>
              {!currentUser && (
                <motion.button
                  type="button"
                  onClick={onGoRegister}
                  whileHover={{ y: -2, borderColor: `${HOME_PUBLIC_COLORS.archer}66`, color: HOME_PUBLIC_COLORS.archer }}
                  whileTap={{ scale: 0.98 }}
                  style={{ ...sans(12, 700), ...makeHomePill(HOME_PUBLIC_COLORS.archer), minHeight: 44, flex: 1, color: P.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: ".06em" }}
                >
                  Crear cuenta
                </motion.button>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {LOGIN_TRUST_BAND.map((item) => (
              <div key={item.title} style={{ ...makeHomePanel({ radius: 16, surface: "rgba(14,16,28,0.72)", outerGlow: "rgba(0,0,0,0.10)" }), padding: "10px 12px" }}>
                <div style={{ ...mono(8, 700), color: HOME_PUBLIC_COLORS.neutral, letterSpacing: ".08em", marginBottom: 4 }}>{item.title}</div>
                <div style={{ ...sans(11, 500), color: "#cfd7e8", lineHeight: 1.45 }}>{item.copy}</div>
              </div>
            ))}

            <div style={{ ...makeHomePanel({ radius: 16, surface: "rgba(14,16,28,0.72)", outerGlow: "rgba(0,0,0,0.10)" }), padding: "10px 12px" }}>
              <div style={{ ...mono(8, 700), color: HOME_PUBLIC_COLORS.archer, letterSpacing: ".08em", marginBottom: 4 }}>GREMIO ACTIVO</div>
              <div style={{ ...sans(11, 500), color: "#cfd7e8", lineHeight: 1.45 }}>
                {online.toLocaleString()} heroes en linea recorriendo el mapa ahora mismo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN COMPONENT â€” toda la lÃ³gica auth intacta
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LoginPage({ onGoRegister, onGoBack, onSuccess }) {
  const [email,             setEmail]             = useState(() => readLocalString(LOGIN_LAST_EMAIL_KEY, ""));
  const [password,          setPassword]          = useState("");
  const [errors,            setErrors]            = useState({});
  const [touched,           setTouched]           = useState({});
  const [loading,           setLoading]           = useState(false);
  const [loadingGoogle,     setLoadingGoogle]     = useState(false);
  const [googleRedirecting, setGoogleRedirecting] = useState(false);
  const [success,           setSuccess]           = useState(false);
  const [shaking,           setShaking]           = useState(false);
  const [showForgot,        setShowForgot]        = useState(false);
  const skipBoot = sessionStorage.getItem("fv_booted") === "1";
  const [loaded,            setLoaded]            = useState(() => sessionStorage.getItem("fv_booted") === "1");
  const [showToast,         setShowToast]         = useState(false);
  const [rateLimitEnd,      setRateLimitEnd]      = useState(null);
  const [rateLimitSecs,     setRateLimitSecs]     = useState(0);
  const [emailSentTo,       setEmailSentTo]       = useState(null);
  const rateLimitDurRef  = useRef(60); // captured once when rate-limit is set
  const [rememberMe,     setRememberMe]     = useState(() => readLocalString(LOGIN_REMEMBER_ME_KEY, "true") !== "false");
  const [lastLoginMethod, setLastLoginMethod] = useState(() => readLocalString(LOGIN_LAST_METHOD_KEY, ""));
  const [authPhase, setAuthPhase] = useState("idle");

  useEffect(() => {
    if (!rateLimitEnd) return;
    const iv = setInterval(() => {
      const secs = Math.ceil((rateLimitEnd - Date.now()) / 1000);
      if (secs <= 0) { setRateLimitEnd(null); setRateLimitSecs(0); clearInterval(iv); }
      else setRateLimitSecs(secs);
    }, 500);
    return () => clearInterval(iv);
  }, [rateLimitEnd]);

  const emailRef      = useRef(email);
  const passwordRef   = useRef(password);
  useEffect(() => { emailRef.current      = email;      }, [email]);
  useEffect(() => { passwordRef.current   = password;   }, [password]);
  useEffect(() => { writeLocalString(LOGIN_LAST_EMAIL_KEY, email.trim()); }, [email]);
  useEffect(() => { writeLocalString(LOGIN_REMEMBER_ME_KEY, rememberMe ? "true" : "false"); }, [rememberMe]);

  const isSyncingProfile = authPhase === "syncing";
  const lastLoginEmail = readLocalString(LOGIN_LAST_EMAIL_KEY, "");
  const heroState = getLoginHeroState({
    hasCurrentUser: Boolean(auth.currentUser),
    showForgot,
    emailSentTo,
    lastLoginMethod,
  });
  const authPhaseMeta = getAuthPhaseMeta(authPhase);
  const googleRecommended = !lastLoginMethod || lastLoginMethod === "google";
  const googleEntryCopy = googleRecommended
    ? "Método recomendado para volver más rápido al tablero."
    : "Úsalo si quieres saltarte la entrada por correo en esta sesión.";
  const entryRecommendation = googleRecommended
    ? "Google suele ser la puerta más corta si ya vinculaste tu cuenta."
    : "Si tu último acceso fue por correo, esa ruta te devolverá al mapa con menos fricción.";
  const errorMeta = getLoginErrorMeta(errors.generalCode);

  const persistLoginMethod = useCallback((method, nextEmail = "") => {
    writeLocalString(LOGIN_LAST_METHOD_KEY, method);
    setLastLoginMethod(method);
    if (nextEmail) writeLocalString(LOGIN_LAST_EMAIL_KEY, nextEmail);
  }, []);

  const continueToRegisterWithGoogle = useCallback((user) => {
    const googlePayload = {
      uid: user.uid,
      email: user.email,
      username: user.displayName,
      fromGoogle: true,
    };

    persistLoginMethod("google", user.email || "");

    if (onGoRegister) {
      onGoRegister(googlePayload);
      return;
    }

    try {
      localStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify({
        username: user.displayName || "",
        email: user.email || "",
        step: 2,
        tosAccepted: false,
        classIdx: 0,
        classConfirmed: false,
        rememberMe: true,
        authSource: "google",
        googleProfile: googlePayload,
      }));
    } catch {}

    window.location.assign("/register");
  }, [onGoRegister, persistLoginMethod]);

  useEffect(() => {
    if (!auth.currentUser) return; // Only returning (already-authenticated) users
    const t = setTimeout(() => setShowToast(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const validateField = useCallback((field, val) => {
    if (field === "email") {
      if (!val.trim())               return "El correo es obligatorio";
      if (!/\S+@\S+\.\S+/.test(val)) return "Correo invalido";
    }
    if (field === "password") {
      if (!val)           return "La contrasena es obligatoria";
      if (val.length < 6) return "Minimo 6 caracteres";
    }
    return null;
  }, []);

  const handleBlur = useCallback((field) => {
    setTouched(t => ({ ...t, [field]: true }));
    const val = field === "email" ? emailRef.current : passwordRef.current;
    const err = validateField(field, val);
    setErrors(e => ({ ...e, [field]: err || undefined }));
  }, [validateField]);

  const handleEmailChange    = e => {
    setEmail(e.target.value);
    if (errors.general) setErrors(p => ({ ...p, general: undefined, generalCode: undefined }));
    if (touched.email)  setErrors(p => ({ ...p, email: validateField("email", e.target.value) || undefined }));
  };
  const handlePasswordChange = e => {
    setPassword(e.target.value);
    if (errors.general)   setErrors(p => ({ ...p, general: undefined, generalCode: undefined }));
    if (touched.password) setErrors(p => ({ ...p, password: validateField("password", e.target.value) || undefined }));
  };

  const triggerShake = () => { setShaking(true); setTimeout(() => setShaking(false), 500); };

  const syncLogin = useCallback(async () => {
    const MAX = 3;
    for (let attempt = 0; attempt < MAX; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
        const token = await auth.currentUser?.getIdToken(attempt > 0);
        if (!token) {
          const missingTokenError = new Error("Missing auth token");
          missingTokenError.code = "sync/login-failed";
          throw missingTokenError;
        }
        const { firstLogin, user } = await loginSync(token);
        return { firstLogin, user };
      } catch (err) {
        console.warn(`âš ï¸ loginSync intento ${attempt + 1}/${MAX} fallÃ³:`, err.message);
        if (attempt === MAX - 1) {
          const syncError = new Error("Login sync failed");
          syncError.code = "sync/login-failed";
          syncError.cause = err;
          throw syncError;
        }
      }
    }
    const syncError = new Error("Login sync failed");
    syncError.code = "sync/login-failed";
    throw syncError;
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    let completed = false;
    const currentEmail    = emailRef.current;
    const currentPassword = passwordRef.current;
    const errs = {};
    const emailErr    = validateField("email",    currentEmail);
    const passwordErr = validateField("password", currentPassword);
    if (emailErr)    errs.email    = emailErr;
    if (passwordErr) errs.password = passwordErr;
    if (Object.keys(errs).length) { setErrors(errs); setTouched({ email: true, password: true }); triggerShake(); return; }
    setErrors({}); setLoading(true); setAuthPhase("authenticating");
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, currentEmail, currentPassword);
      setAuthPhase("syncing");
      await syncLogin();
      persistLoginMethod("email", currentEmail);
      setAuthPhase("success");
      completed = true;
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1800);
    } catch (err) {
      if (err.code === "auth/too-many-requests") { const end = Date.now() + 60_000; rateLimitDurRef.current = 60; setRateLimitEnd(end); setRateLimitSecs(60); }
      setErrors({ general: getLoginFlowErrorMessage(err), generalCode: err.code });
      triggerShake();
      setAuthPhase("idle");
    } finally {
      setLoading(false);
      if (!completed) setAuthPhase("idle");
    }
  }, [onSuccess, persistLoginMethod, rememberMe, syncLogin, validateField]);

  const handleGoogle = async () => {
    let googleUser = null;
    let completed = false;
    let redirecting = false;
    setErrors({}); setLoadingGoogle(true); setAuthPhase("authenticating");
    try {
      const result     = await signInWithPopup(auth, googleProvider);
      googleUser       = result.user;
      setAuthPhase("syncing");
      await syncLogin();
      persistLoginMethod("google", googleUser.email || "");
      setAuthPhase("success");
      completed = true;
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1800);
    } catch (err) {
      if (err.code === "auth/popup-blocked") {
        redirecting = true;
        setGoogleRedirecting(true);
        try { await signInWithRedirect(auth, googleProvider); }
        catch (redirectErr) { setGoogleRedirecting(false); setErrors({ general: firebaseError(redirectErr.code) }); }
        return;
      }
      if (googleUser && isMissingProfileError(err)) {
        continueToRegisterWithGoogle(googleUser);
        return;
      }
      if (err.code === "auth/too-many-requests") { const end = Date.now() + 60_000; rateLimitDurRef.current = 60; setRateLimitEnd(end); setRateLimitSecs(60); }
      if (err.code !== "auth/popup-closed-by-user") {
        setErrors({ general: getLoginFlowErrorMessage(err), generalCode: err.code });
      }
      setAuthPhase("idle");
    } finally {
      setLoadingGoogle(false);
      if (!completed && !redirecting) setAuthPhase("idle");
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <AuroraBackground />
      {!skipBoot && (
        <AuthPortalLoader
          onDone={() => setLoaded(true)}
          title="ForgeVenture"
          subtitle="Portal de acceso"
          lines={BOOT_SEQUENCE}
          progressLabel="SINTONIZANDO ACCESO"
        />
      )}
      <CustomCursor />
      {loaded && <Particles count={14} />}
      {success && <SuccessOverlay mode="login" />}

      <AnimatePresence>{googleRedirecting && <GoogleRedirectOverlay onCancel={() => setGoogleRedirecting(false)} />}</AnimatePresence>
      <AnimatePresence>{showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} initialEmail={email} onEmailSent={e => setEmailSentTo(e)} />}</AnimatePresence>

      {/* Achievement toast */}
      <AnimatePresence>
        {loaded && showToast && (
          <motion.div
            initial={{ x: 140, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 140, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onAnimationComplete={() => setTimeout(() => setShowToast(false), 2200)}
            style={{ position: "fixed", top: 72, right: 18, zIndex: 8000, background: P.bg1, border: `1px solid ${P.gold}55`,
              padding: "12px 16px", maxWidth: 240, boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 20px ${P.gold}22` }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>ðŸ†</span>
              <div>
                <div style={{ ...mono(8, 700), color: P.gold, marginBottom: 2, letterSpacing: ".1em" }}>LOGRO DESBLOQUEADO</div>
                <div style={{ ...sans(12, 600), color: P.text }}>Ya puedes volver al mapa</div>
                <div style={{ ...sans(11, 400), color: P.muted, marginTop: 1 }}>+100 XP de fidelidad</div>
              </div>
            </div>
            <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 2.2, ease: "linear" }}
              style={{ marginTop: 8, height: 2, background: P.gold, boxShadow: `0 0 6px ${P.gold}`, transformOrigin: "left" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global scan line */}
      <motion.div animate={{ top: ["-2px", "100%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ position: "fixed", left: 0, right: 0, height: 2, zIndex: 5, pointerEvents: "none",
          background: `linear-gradient(90deg, transparent, ${HOME_PUBLIC_COLORS.archer}2f, ${HOME_PUBLIC_COLORS.mage}66, ${HOME_PUBLIC_COLORS.warrior}2f, transparent)` }} />

      {/* â”€â”€ MAIN LAYOUT â”€â”€ */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: skipBoot ? 0.3 : 0.01 }}
        className={skipBoot ? "" : "page-enter"}
        style={{ minHeight: "100vh", display: "flex", alignItems: "stretch", justifyContent: "center", position: "relative", zIndex: 2 }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease }}
          className="px6-corners lp6-grid"
          style={{
            "--cc": HOME_PUBLIC_COLORS.neutral,
            width: "100%", maxWidth: 1380,
            display: "grid", gridTemplateColumns: "minmax(420px, 0.92fr) minmax(560px, 1.08fr)",
            background: `linear-gradient(180deg, rgba(9,8,18,0.94), rgba(8,7,16,0.9))`, border: `1px solid rgba(255,255,255,0.08)`,
            boxShadow: `${HOME_PANEL_INSET}, 0 30px 80px rgba(0,0,0,0.6)`,
            overflow: "hidden", position: "relative", alignSelf: "stretch",
          }}>

          {/* Top accent bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 20,
            background: `linear-gradient(90deg, ${HOME_PUBLIC_COLORS.archer}, ${HOME_PUBLIC_COLORS.mage}, ${HOME_PUBLIC_COLORS.warrior}, transparent)`,
            boxShadow: `0 0 12px ${HOME_PUBLIC_COLORS.mage}44` }} />

          {/* Title bar */}
          <div style={{ position: "absolute", top: 2, left: 0, right: 0, zIndex: 15, height: 22,
            background: `linear-gradient(90deg, rgba(9,8,18,0.96), rgba(9,8,18,0.8) 42%, rgba(9,8,18,0.58))`, borderBottom: `1px solid rgba(255,255,255,0.08)`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ ...mono(7, 600), color: P.muted, letterSpacing: ".18em" }}>[ PORTAL DE ACCESO DEL GREMIO ]</span>
          </div>

          {/* Left panel */}
          <LeftPanel
            onGoToDashboard={onSuccess}
            onGoBack={() => onGoBack ? onGoBack() : window.location.assign("/home")}
            onGoRegister={() => onGoRegister ? onGoRegister() : window.location.replace("/register")}
            heroState={heroState}
            lastLoginEmail={lastLoginEmail}
            lastLoginMethod={lastLoginMethod}
          />

          {/* â”€â”€ RIGHT PANEL â”€â”€ */}
          <div className="lp6-right"
            style={{ padding: "40px 40px 28px", display: "flex", flexDirection: "column", justifyContent: "flex-start",
              position: "relative", background: `linear-gradient(180deg, rgba(9,8,18,0.9), rgba(8,7,16,0.96))`, backdropFilter: "blur(16px)", overflowY: "auto" }}>

            {/* Ambient orbs */}
            <div style={{ position: "absolute", right: "-10%", top: "5%", width: 280, height: 280, borderRadius: "50%",
              background: `radial-gradient(circle, ${P.accent}0D 0%, transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: "5%", bottom: "8%", width: 200, height: 200, borderRadius: "50%",
              background: `radial-gradient(circle, ${P.blue}0A 0%, transparent 70%)`, filter: "blur(50px)", pointerEvents: "none" }} />

            {/* Mobile banner */}
            <div style={{ width: "100%", maxWidth: 760, marginRight: "auto", position: "relative", zIndex: 1 }}>
              <div className="lp6-mobile-top" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ ...makeHomePanel({ radius: 12, surface: "rgba(10,12,20,0.74)", outerGlow: "rgba(0,0,0,0.16)" }), width: 34, height: 34, display: "grid", placeItems: "center" }}>
                    <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                  </div>
                  <div>
                    <div style={{ ...homeHeading(12, 700), color: "#f5f1ff" }}>ForgeVenture</div>
                    <div style={{ ...mono(7, 600), color: HOME_PUBLIC_COLORS.neutral, letterSpacing: ".12em" }}>ACCESO DEL GREMIO</div>
                  </div>
                </div>
                <div style={{ ...makeHomePill(HOME_PUBLIC_COLORS.archer), ...mono(7, 700), color: HOME_PUBLIC_COLORS.archer, paddingInline: 10 }}>
                  Entrada lista
                </div>
              </div>

              {/* Header */}
              <motion.div variants={FV.stagger} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
                <motion.div variants={FV.up} style={{ ...makeHomePanel({ radius: 26, surface: "rgba(9,10,19,0.7)", outerGlow: "rgba(0,0,0,0.20)" }), padding: "18px 20px 16px", display: "grid", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...makeHomePill(HOME_PUBLIC_COLORS.neutral), width: "fit-content", color: HOME_PUBLIC_COLORS.neutral }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: HOME_PUBLIC_COLORS.neutral, boxShadow: `0 0 10px ${HOME_PUBLIC_COLORS.neutral}66` }} />
                        <span style={{ ...mono(7, 700), letterSpacing: ".12em" }}>PORTAL DE INGRESO</span>
                      </div>
                      <div>
                        <h1 style={{ ...homeHeading("clamp(28px,3vw,44px)", 700), color: "#f7f3ff", marginBottom: 10, lineHeight: 1.02 }}>
                          Vuelve al mapa con una entrada clara y sin ruido.
                        </h1>
                        <p style={{ ...sans(14, 500), color: "#ccd5e7", lineHeight: 1.65, maxWidth: 560 }}>
                          Accede con correo o Google y vuelve al home con tu racha, tus rutas activas y tus misiones listas para retomarse.
                        </p>
                        {lastLoginMethod && (
                          <div style={{ marginTop: 10, ...sans(11, 600), color: "#c9d2e6" }}>
                            Ultimo acceso usado: {lastLoginMethod === "google" ? "Google" : "correo del gremio"}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                    {LOGIN_STATS.map((stat) => (
                      <div key={stat.label} style={{ ...makeHomePanel({ radius: 16, surface: "rgba(255,255,255,0.03)", outerGlow: "rgba(0,0,0,0.10)" }), padding: "12px 14px", minHeight: 84 }}>
                        <div style={{ ...mono(8, 700), color: stat.color, letterSpacing: ".1em", marginBottom: 8 }}>{stat.label}</div>
                        <div style={{ ...homeHeading(24, 700), color: "#f7f4ff", marginBottom: 4, lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ ...sans(11, 500), color: "#cad3e6", lineHeight: 1.45 }}>{stat.copy}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ ...sans(11, 500), color: "#aeb8cc", lineHeight: 1.5 }}>
                    Snapshot del gremio: este bloque resume el portal y sus rutas de acceso, no el estado exacto de tu personaje.
                  </div>
                </motion.div>
              </motion.div>
            {/* Email-sent confirmation banner â€” persists after modal closes */}
            <AnimatePresence>
              {emailSentTo && !showForgot && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ background: `${P.blue}0D`, border: `1px solid ${P.blue}33`, borderLeft: `3px solid ${P.blue}`,
                    padding: "10px 14px", marginBottom: 14, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ ...mono(7, 700), color: P.blue, letterSpacing: ".1em", marginBottom: 3 }}>
                        CORREO ENVIADO
                      </div>
                      <div style={{ ...sans(12, 500), color: P.muted }}>
                        Revisa{" "}
                        <strong style={{ color: P.text }}>{emailSentTo}</strong>
                        {" "}· también la carpeta de spam
                      </div>
                    </div>
                    <motion.button type="button" onClick={() => setShowForgot(true)}
                      whileHover={{ color: P.blue }}
                      style={{ ...mono(7, 700), color: P.muted, background: `${P.blue}14`,
                        border: `1px solid ${P.blue}33`, padding: "4px 10px",
                        cursor: "pointer", flexShrink: 0 }}>
                      Continuar
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth phase status */}
            <AnimatePresence>
              {authPhaseMeta && !errors.general && (
                <motion.div role="alert"
                  initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${authPhaseMeta.accent} 12%, rgba(8,10,18,0.96)) 0%, rgba(8,10,18,0.96) 100%)`,
                    border: `1px solid color-mix(in srgb, ${authPhaseMeta.accent} 34%, rgba(255,255,255,0.10))`,
                    borderLeft: `3px solid ${authPhaseMeta.accent}`,
                    padding: "10px 14px",
                    marginBottom: 16,
                    overflow: "hidden",
                    borderRadius: 16,
                  }}>
                  <div style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 10, alignItems: "center" }}>
                    <img src={authPhaseMeta.icon} alt="" aria-hidden="true" style={{ width: 30, height: 30, objectFit: "contain", filter: `drop-shadow(0 0 10px color-mix(in srgb, ${authPhaseMeta.accent} 40%, transparent))` }} />
                    <div>
                      <div style={{ ...mono(8, 700), color: authPhaseMeta.accent, letterSpacing: ".08em", marginBottom: 4 }}>{authPhaseMeta.label}</div>
                      <div style={{ ...sans(12, 500), color: "#d3dcf0", lineHeight: 1.45 }}>{authPhaseMeta.copy}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* General error + rate-limit */}
            <AnimatePresence>
              {errors.general && (
                <motion.div role="alert"
                  initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${errorMeta.accent} 11%, rgba(13,10,18,0.96)) 0%, rgba(13,10,18,0.96) 100%)`,
                    border: `1px solid color-mix(in srgb, ${errorMeta.accent} 34%, rgba(255,255,255,0.10))`,
                    borderLeft: `3px solid ${errorMeta.accent}`,
                    padding: "12px 14px",
                    marginBottom: 18,
                    overflow: "hidden",
                    borderRadius: 18,
                  }}>
                  <div style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 10, alignItems: "start" }}>
                    <img
                      src={errorMeta.icon}
                      alt=""
                      aria-hidden="true"
                      style={{ width: 34, height: 34, objectFit: "contain", filter: `drop-shadow(0 0 12px color-mix(in srgb, ${errorMeta.accent} 40%, transparent))` }}
                    />
                    <div>
                      <div style={{ ...mono(8, 700), color: errorMeta.accent, letterSpacing: ".08em", marginBottom: 4 }}>
                        {errorMeta.title}
                      </div>
                      <div style={{ ...sans(12, 600), color: "#eff3ff", lineHeight: 1.45, marginBottom: 5 }}>{errors.general}</div>
                      <div style={{ ...sans(11, 500), color: "#b9c4d9", lineHeight: 1.45 }}>{errorMeta.copy}</div>
                    </div>
                    {rateLimitSecs > 0 && (
                      <motion.span key={rateLimitSecs} initial={{ scale: 1.3, color: P.accent2 }} animate={{ scale: 1, color: errorMeta.accent }}
                        style={{ ...mono(11, 700), flexShrink: 0 }}>{rateLimitSecs}s</motion.span>
                    )}
                  </div>

                  {(errors.generalCode === "auth/wrong-password" || errors.generalCode === "auth/invalid-credential") && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...sans(11, 400), color: P.muted }}>¿No recuerdas tu clave?</span>
                      <motion.button type="button" onClick={() => setShowForgot(true)}
                        whileHover={{ color: P.accent2 }}
                        style={{ ...sans(11, 700), color: P.accent, background: "none", border: "none",
                          cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                        Recupérala aquí
                      </motion.button>
                    </motion.div>
                  )}
                  {errors.generalCode === "auth/user-not-found" && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...sans(11, 400), color: P.muted }}>¿Todavía no tienes cuenta?</span>
                      <motion.button type="button" onClick={() => onGoRegister ? onGoRegister() : undefined}
                        whileHover={{ color: P.accent2 }}
                        style={{ ...sans(11, 700), color: P.accent, background: "none", border: "none",
                          cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                        Crear personaje
                      </motion.button>
                    </motion.div>
                  )}
                  {errors.generalCode === "auth/network-request-failed" && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      style={{ marginTop: 10, ...sans(11, 400), color: P.muted }}>
                      Verifica tu conexión a internet e intenta de nuevo.
                    </motion.div>
                  )}
                  {rateLimitSecs > 0 && (
                    <div style={{ marginTop: 7 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ ...mono(7, 600), color: `${P.error}99`, letterSpacing: ".08em" }}>COOLDOWN ACTIVO</span>
                        <motion.span key={rateLimitSecs}
                          initial={{ scale: 1.2, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
                          style={{ ...mono(8, 700), color: P.error }}>
                          ESPERA {rateLimitSecs}s
                        </motion.span>
                      </div>
                      <div style={{ height: 2, background: `${P.error}22` }}>
                        <motion.div key={rateLimitEnd}
                          initial={{ width: "100%" }} animate={{ width: "0%" }}
                          transition={{ duration: rateLimitDurRef.current, ease: "linear" }}
                          className="rate-limit-bar" style={{ background: P.error, boxShadow: `0 0 6px ${P.error}` }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* â”€â”€ Form card â€” glassmorphism wrap â”€â”€ */}
            <div style={{ position: "relative", background: `linear-gradient(180deg, rgba(12,14,24,0.92), rgba(8,9,18,0.96))`,
              backdropFilter: "blur(16px)", border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 24, overflow: "hidden",
              boxShadow: `${HOME_PANEL_INSET}, 0 24px 54px rgba(0,0,0,0.42)`,
              padding: "20px 20px 18px" }}>
              {/* inner top accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${HOME_PUBLIC_COLORS.archer}, ${HOME_PUBLIC_COLORS.mage}, ${HOME_PUBLIC_COLORS.warrior}, transparent)` }} />

            <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...makeHomePill(HOME_PUBLIC_COLORS.mage), width: "fit-content", color: HOME_PUBLIC_COLORS.mage }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: HOME_PUBLIC_COLORS.mage, boxShadow: `0 0 10px ${HOME_PUBLIC_COLORS.mage}66` }} />
                <span style={{ ...mono(7, 700), letterSpacing: ".12em" }}>ACCESO RÁPIDO</span>
              </div>
              <div style={{ ...homeHeading(24, 700), color: "#f7f3ff", lineHeight: 1.05 }}>
                Inicia sesión y vuelve a tu ruta.
              </div>
              <p style={{ ...sans(12, 500), color: "#c8d1e4", lineHeight: 1.55, margin: 0 }}>
                Puedes entrar con Google o con tu correo del gremio. Si dejaste algo a medias, aquí retomas sin perder el hilo.
              </p>
              {(lastLoginMethod || lastLoginEmail) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {lastLoginMethod && (
                    <div style={{ ...makeHomePill(googleRecommended ? HOME_PUBLIC_COLORS.mage : HOME_PUBLIC_COLORS.neutral), padding: "7px 10px", ...sans(11, 600), color: "#eef3ff" }}>
                      Último acceso con {lastLoginMethod === "google" ? "Google" : "correo del héroe"}
                    </div>
                  )}
                  {lastLoginEmail && (
                    <div style={{ ...makeHomePill(HOME_PUBLIC_COLORS.archer), padding: "7px 10px", ...sans(11, 600), color: "#eef3ff" }}>
                      {lastLoginEmail}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 4 }}>
                {LOGIN_SECURITY_NOTES.map((note) => (
                  <div
                    key={note.label}
                    style={{
                      ...makeHomePanel({
                        radius: 14,
                        surface: `linear-gradient(135deg, color-mix(in srgb, ${note.accent} 10%, rgba(11,14,26,0.88)) 0%, rgba(11,14,26,0.88) 100%)`,
                        border: `color-mix(in srgb, ${note.accent} 30%, rgba(255,255,255,0.08))`,
                        outerGlow: "rgba(0,0,0,0.12)",
                      }),
                      padding: "8px 10px",
                      display: "grid",
                      gridTemplateColumns: "24px 1fr",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={note.icon}
                      alt=""
                      aria-hidden="true"
                      style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 10px color-mix(in srgb, ${note.accent} 44%, transparent))` }}
                    />
                    <div style={{ ...sans(10, 700), color: "#e8eefc", lineHeight: 1.4 }}>{note.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...makeHomePanel({ radius: 18, surface: "rgba(9,12,22,0.72)", outerGlow: "rgba(0,0,0,0.16)" }), padding: "12px 12px", marginBottom: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ ...mono(7, 700), color: googleRecommended ? HOME_PUBLIC_COLORS.mage : HOME_PUBLIC_COLORS.archer, letterSpacing: ".1em", marginBottom: 4 }}>
                    METODO RECOMENDADO
                  </div>
                  <div style={{ ...sans(12, 600), color: "#eef3ff", lineHeight: 1.4 }}>{entryRecommendation}</div>
                </div>
                <div style={{ ...makeHomePill(googleRecommended ? HOME_PUBLIC_COLORS.mage : HOME_PUBLIC_COLORS.neutral), padding: "7px 10px", ...sans(11, 700), color: "#eef3ff" }}>
                  {googleRecommended ? "Google sugerido" : "Correo sugerido"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                {LOGIN_METHOD_BAND.map((item) => (
                  <div
                    key={item.title}
                    title={item.copy}
                    style={{
                      background: `linear-gradient(135deg, color-mix(in srgb, ${item.accent} 10%, rgba(10,12,21,0.92)) 0%, rgba(10,12,21,0.92) 100%)`,
                      border: `1px solid color-mix(in srgb, ${item.accent} 26%, rgba(255,255,255,0.08))`,
                      borderRadius: 14,
                      padding: "9px 10px",
                      display: "grid",
                      gridTemplateColumns: "24px 1fr",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <img src={item.icon} alt="" aria-hidden="true" style={{ width: 24, height: 24, objectFit: "contain", filter: `drop-shadow(0 0 10px color-mix(in srgb, ${item.accent} 38%, transparent))` }} />
                    <div>
                      <div style={{ ...sans(11, 700), color: "#f4f7ff", lineHeight: 1.2, marginBottom: 2 }}>{item.title}</div>
                      <div style={{ ...sans(10, 500), color: "#aeb9d4", lineHeight: 1.4 }}>{item.copy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Google button */}
            <motion.button type="button" onClick={handleGoogle}
              disabled={loadingGoogle || loading || rateLimitSecs > 0}
              whileHover={!loadingGoogle && !loading && !rateLimitSecs ? { scale: 1.02, y: -2, boxShadow: `0 8px 28px rgba(0,0,0,0.4), 0 0 18px #4285F422` } : {}}
              whileTap={!loadingGoogle && !loading && !rateLimitSecs ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45, ease }}
              aria-label="Continuar con Google"
              title="Entrada rápida del portal"
              style={{ width: "100%", padding: "14px 16px", marginBottom: 18,
                background: `linear-gradient(135deg, rgba(10,14,26,0.9), rgba(12,18,34,0.86))`, border: `1px solid rgba(66,133,244,0.25)`,
                borderRadius: 16,
                boxShadow: "0 10px 24px rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
                cursor: loadingGoogle ? "not-allowed" : "pointer",
                display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12,
                opacity: loadingGoogle ? 0.7 : 1, transition: "box-shadow .2s, border-color .2s, background .2s" }}>
              {loadingGoogle ? (
                <><div style={{ width: 16, height: 16, border: `2px solid ${P.line}`, borderTop: "2px solid #4285F4", borderRadius: "50%", animation: "fv6-spin 0.7s linear infinite" }} /><span style={{ ...sans(13, 600), color: P.muted }}>{isSyncingProfile ? "Sincronizando perfil..." : "Conectando..."}</span><span /></>
              ) : (
                <>
                  <div style={{ ...makeHomePanel({ radius: 12, surface: "rgba(13,18,30,0.88)", outerGlow: "rgba(0,0,0,0.12)" }), width: 42, height: 42, display: "grid", placeItems: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.7 39.7 16.4 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                  </svg>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ ...mono(7, 700), color: HOME_PUBLIC_COLORS.mage, letterSpacing: ".12em", marginBottom: 4 }}>ENTRADA RAPIDA</div>
                    <div style={{ ...sans(14, 700), color: P.text, letterSpacing: ".02em", marginBottom: 2 }}>Continuar con Google</div>
                    <div style={{ ...sans(11, 500), color: "#aeb9d4", lineHeight: 1.35 }}>{googleEntryCopy}</div>
                  </div>
                  <div style={{ ...makeHomePill(HOME_PUBLIC_COLORS.mage, true), padding: "6px 10px", ...mono(7, 700), color: "#eef6ff" }}>
                    Portal ágil
                  </div>
                </>
              )}
            </motion.button>

            {/* Divider */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${P.line})` }} />
              <span style={{ ...sans(11, 500), color: P.muted, letterSpacing: ".06em" }}>o inicia con correo</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${P.line}, transparent)` }} />
            </motion.div>

            {/* Form */}
            <motion.form onSubmit={handleSubmit} noValidate
              animate={shaking ? { x: [-7, 7, -5, 5, -3, 3, 0] } : { x: 0 }} transition={{ duration: 0.45 }}
              variants={FV.stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>

              <InputField id="login-email" label="CORREO DEL HEROE" type="email"
                value={email} onChange={handleEmailChange} onBlur={() => handleBlur("email")}
                placeholder="heroe@forgeventure.com" error={errors.email} autoComplete="email"
                inputMode="email" autoFocus />

              <InputField id="login-password" label="CONTRASENA DE ACCESO" type="password"
                value={password} onChange={handlePasswordChange} onBlur={() => handleBlur("password")}
                placeholder="********" error={errors.password} autoComplete="current-password"
                showStrength />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: -2, marginBottom: 20, flexWrap: "wrap" }}>
                <label title="Mantiene lista esta ruta en este dispositivo" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                  <button
                    type="button"
                    aria-label={rememberMe ? "Desactivar mantener sesión" : "Activar mantener sesión"}
                    aria-pressed={rememberMe}
                    onClick={() => setRememberMe(v => !v)}
                    style={{
                      width: 44,
                      height: 24,
                      flexShrink: 0,
                      borderRadius: 999,
                      border: `1px solid ${rememberMe ? `${HOME_PUBLIC_COLORS.archer}66` : `${P.line}`}`,
                      background: rememberMe
                        ? `linear-gradient(135deg, ${HOME_PUBLIC_COLORS.archer}55, ${HOME_PUBLIC_COLORS.mage}2a)`
                        : "rgba(255,255,255,0.03)",
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: rememberMe ? "flex-end" : "flex-start",
                      cursor: "pointer",
                      boxShadow: rememberMe ? `0 0 14px ${HOME_PUBLIC_COLORS.archer}22` : "none",
                      transition: "all .18s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background: rememberMe ? "#f8fff3" : "#9aa5bc",
                        boxShadow: rememberMe ? `0 0 10px ${HOME_PUBLIC_COLORS.archer}55` : "none",
                        display: "block",
                      }}
                    />
                  </button>
                  <span style={{ display: "grid", gap: 2 }}>
                    <span style={{ ...sans(12, 700), color: rememberMe ? P.text : P.muted, transition: "color .15s" }}>
                      Mantener sesión lista
                    </span>
                    <span style={{ ...sans(10, 500), color: "#aeb9d3" }}>
                      Guarda esta puerta en tu dispositivo actual.
                    </span>
                  </span>
                </label>
                <motion.button type="button" onClick={() => setShowForgot(true)} whileHover={{ color: P.accent }}
                  title="Recuperación guiada del portal"
                  style={{ ...sans(12, 600), color: P.muted, background: "none", border: "none", cursor: "pointer" }}>
                  Abrir recuperación
                </motion.button>
              </div>

              <motion.button type="submit" variants={FV.up}
                disabled={loading || loadingGoogle || rateLimitSecs > 0}
                whileHover={!loading && !loadingGoogle && !rateLimitSecs ? { scale: 1.02, y: -3, boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 30px ${P.accent}44` } : {}}
                whileTap={!loading && !loadingGoogle && !rateLimitSecs ? { scale: 0.97, y: 1 } : {}}
                className="fv6-btn"
                style={{ width: "100%", ...sans(14, 700), letterSpacing: ".08em",
                  color: (loading || rateLimitSecs > 0) ? P.muted : "#fff",
                  background: (loading || rateLimitSecs > 0)
                    ? `${P.accent}44`
                    : makePrimaryButtonBackground(),
                  border: "none", padding: "15px", borderRadius: 16,
                  cursor: (loading || rateLimitSecs > 0) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: `0 12px 28px rgba(32,14,46,0.34), 0 0 0 1px rgba(255,255,255,0.04)` }}>
                {loading ? <><Spinner size={13} /> {isSyncingProfile ? "Sincronizando perfil..." : "Entrando..."}</> : rateLimitSecs > 0 ? `Espera ${rateLimitSecs}s` : "Entrar al mapa"}
              </motion.button>

              <motion.div variants={FV.up} style={{ textAlign: "center", marginTop: 8 }}>
                <span className="fv6-blink" style={{ ...mono(7, 600), color: P.muted, letterSpacing: ".12em" }}>[ ENTER ] PARA CONFIRMAR</span>
              </motion.div>
            </motion.form>

            {/* Register link */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${P.line})` }} />
                <div style={{ width: 4, height: 4, background: P.line, clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${P.line}, transparent)` }} />
              </div>
              <p style={{ ...sans(13, 400), color: P.muted, textAlign: "center" }}>
                ¿Sin cuenta aún?{" "}
                <motion.button type="button"
                  onClick={() => onGoRegister ? onGoRegister() : window.location.replace("/register")}
                  whileHover={{ color: P.accent2 }}
                  style={{ ...sans(13, 700), color: P.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Crear personaje gratis
                </motion.button>
              </p>
            </motion.div>

            </div>{/* /form card */}
            </div>

            {/* Corner pixel dots */}
            <div style={{ position: "absolute", bottom: 14, right: 16, display: "flex", gap: 5, opacity: 0.35 }}>
              {[P.accent, P.blue, P.gold].map((c, i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.2 + i * 0.4, delay: i * 0.2, repeat: Infinity }}
                  style={{ width: 4, height: 4, background: c, boxShadow: `0 0 4px ${c}`, imageRendering: "pixelated" }} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

