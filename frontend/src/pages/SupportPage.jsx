// src/pages/SupportPage.jsx — v6.0 Profesionalismo
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { submitFeedback, getPublicFeedbackStats, getPublicTestimonials } from "../services/api.js";
import { validateClean } from "../utils/profanityFilter.js";

// ── Theme ─────────────────────────────────────────────────────
const T = {
  bg:      "#060D1A",
  bgCard:  "#0D1B2E",
  bgPanel: "#0A1628",
  navy:    "#1E3A5F",
  orange:  "#E85D04",
  orangeL: "#FF9F1C",
  gold:    "#FFD700",
  blue:    "#4CC9F0",
  teal:    "#0A9396",
  white:   "#F0F4FF",
  muted:   "#6B8CAE",
  green:   "#2ecc71",
};

const px  = (s) => ({ fontFamily: "'Press Start 2P'", fontSize: s });
const raj = (s, w = 500) => ({ fontFamily: "'Space Grotesk', sans-serif", fontSize: s, fontWeight: w });
const orb = (s, w = 700) => ({ fontFamily: "'Orbitron', sans-serif", fontSize: s, fontWeight: w });

const CLASS_COLOR = { GUERRERO: T.orange, MAGO: "#9B59B6", ARQUERO: T.green };
const CLASS_ICON  = { GUERRERO: "⚔️", MAGO: "🔮", ARQUERO: "🏹" };
const TYPE_EMOJI  = { bug:"🐛", suggestion:"💡", complaint:"😤", praise:"😊", other:"❓" };
const STATUS_CFG  = {
  pending:  { label:"Pendiente", dot:"🟠", color:T.orangeL, bg:"rgba(255,159,28,0.08)",  border:"rgba(255,159,28,0.3)" },
  read:     { label:"Leído",     dot:"🔵", color:T.blue,    bg:"rgba(76,201,240,0.08)",  border:"rgba(76,201,240,0.3)" },
  resolved: { label:"Resuelto",  dot:"🟢", color:T.green,   bg:"rgba(46,204,113,0.08)",  border:"rgba(46,204,113,0.3)" },
};

// I3: Dynamic placeholders per feedback type
const TYPE_PLACEHOLDERS = {
  bug:        "Describe el error con detalle:\n• ¿Qué ocurrió exactamente?\n• ¿En qué navegador y dispositivo?\n• Pasos para reproducirlo\n• ¿Con qué frecuencia ocurre?",
  suggestion: "¿Qué mejora te gustaría ver?\n• Describe la funcionalidad en detalle\n• ¿Cómo cambiaría tu experiencia?\n• ¿En qué situación la usarías más?",
  complaint:  "Describe tu queja:\n• ¿Qué esperabas que ocurriera?\n• ¿Qué ocurrió realmente?\n• ¿Cuándo comenzó el problema?\n• ¿Qué impacto tiene en tu experiencia?",
  praise:     "¡Comparte lo que más te gusta!\n• ¿Qué función valoras más?\n• ¿Cómo ha impactado en tu rutina?\n• ¿Lo recomendarías a otros warriors?",
  other:      "Cuéntanos en qué podemos ayudarte.\nSé lo más específico posible para que podamos darte la mejor respuesta.",
};

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d >= 30) return `hace ${Math.floor(d/30)}mes${Math.floor(d/30)>1?"es":""}`;
  if (d > 0)   return `hace ${d}d`;
  if (h > 0)   return `hace ${h}h`;
  return "hace un momento";
}

// ── Contact channels (I1: copyValue) ─────────────────────────
const CHANNELS = [
  { id:"discord",   icon:"💬", label:"Discord",   handle:"discord.gg/forgeventure",  copyValue:"discord.gg/forgeventure",         desc:"Comunidad activa y soporte en tiempo real de otros warriors.",      color:"#5865F2", href:"https://discord.gg/forgeventure",   badge:"RECOMENDADO" },
  { id:"email",     icon:"✉",  label:"Correo",    handle:"soporte@forgeventure.com", copyValue:"soporte@forgeventure.com",         desc:"Para bugs, colaboraciones y consultas formales. Respuesta en 24 h.", color:T.orange,  href:"mailto:soporte@forgeventure.com",    badge:"FORMAL"      },
  { id:"whatsapp",  icon:"📱", label:"WhatsApp",  handle:"+1 (000) 000-0000",        copyValue:"+10000000000",                     desc:"Soporte directo. Respuesta en horario hábil, Lun–Vie 9–18 h.",       color:"#25D366", href:"https://wa.me/10000000000",          badge:"DIRECTO"     },
  { id:"instagram", icon:"📸", label:"Instagram", handle:"@forgeventure",            copyValue:"@forgeventure",                    desc:"Progreso, rutinas y contenido de la comunidad.",                     color:"#E1306C", href:"https://instagram.com/forgeventure",  badge:"SOCIAL"      },
  { id:"youtube",   icon:"▶",  label:"YouTube",   handle:"ForgeVenture Official",    copyValue:"https://youtube.com/@forgeventure", desc:"Tutoriales, guías de ejercicios y streams en vivo.",                color:"#FF0000", href:"https://youtube.com/@forgeventure",  badge:"TUTORIALES"  },
];

const FAQ = [
  { q:"¿Cómo empiezo a usar ForgeVenture?",                        a:"Crea una cuenta gratuita, elige tu clase (Guerrero, Mago o Arquero) y accede a tu dashboard. Desde allí puedes iniciar rutinas, revisar ejercicios y ver tus logros.", icon:"🚀" },
  { q:"¿Es completamente gratis?",                                  a:"Sí. ForgeVenture es 100% gratuito. Todas las funciones — ejercicios, rutinas, misiones, tienda de skins y reconocimiento de movimiento — están disponibles sin costo.", icon:"💎" },
  { q:"¿Cómo funciona el reconocimiento de movimiento con cámara?", a:"Usamos MediaPipe Pose, una librería de IA de Google que analiza tu postura en tiempo real. Detecta 33 puntos del cuerpo y mide ángulos de articulaciones para contar repeticiones automáticamente.", icon:"📹" },
  { q:"La cámara no me reconoce bien los ejercicios. ¿Qué hago?",  a:"Asegúrate de: (1) tener buena iluminación frontal, (2) que tu cuerpo completo esté visible en la cámara, (3) usar ropa que contraste con el fondo.", icon:"💡" },
  { q:"¿Cómo gano XP y subo de nivel?",                            a:"Ganas XP completando rutinas, ejercicios individuales y misiones diarias. Cada repetición cuenta. Subir de nivel desbloquea nuevas skins y logros en tu perfil.", icon:"⬆️" },
  { q:"¿Puedo usar ForgeVenture sin cámara?",                      a:"Sí. Puedes explorar el dashboard, revisar rutinas, misiones, tienda y logros sin necesitar la cámara. Solo los ejercicios con detección de movimiento la requieren.", icon:"🎮" },
  { q:"¿Cómo reporto un error o problema técnico?",                a:"Escríbenos a soporte@forgeventure.com describiendo el error, tu dispositivo y navegador. También puedes abrir un ticket en nuestro Discord.", icon:"🐛" },
  { q:"¿En qué navegadores funciona mejor?",                       a:"Funciona en Chrome, Edge y Firefox actualizados. Para el reconocimiento de movimiento recomendamos Chrome en desktop, que ofrece el mejor rendimiento con MediaPipe.", icon:"🌐" },
];


const QUICK_TIPS = [
  { icon:"🔄", tip:"Actualiza la página si algo no carga." },
  { icon:"🌐", tip:"Usa Chrome actualizado para mejor rendimiento." },
  { icon:"💡", tip:"Buena iluminación frontal mejora el reconocimiento IA." },
  { icon:"📶", tip:"Conexión estable mejora la experiencia en tiempo real." },
];

// I5: Mini nav sections
const NAV_ITEMS = [
  { id:"faq",      label:"FAQ",     icon:"❓" },
  { id:"canales",  label:"Canales", icon:"💬" },
  { id:"estado",   label:"Estado",  icon:"⚡" },
  { id:"feedback", label:"Enviar",  icon:"✈"  },
];

// ── V1: Count-up hook ─────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [val, setVal]  = useState(0);
  const rafRef         = useRef(null);
  const startRef       = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const n = Number(target);
    if (isNaN(n)) return;
    if (n === 0) { setVal(0); return; }
    startRef.current = null;
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Number.isInteger(n) ? Math.round(n * e) : +(n * e).toFixed(1));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return val;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');

  @keyframes sp-scan       { 0%{top:-2px} 100%{top:100%} }
  @keyframes sp-blink      { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes sp-success    { 0%{transform:scale(0.7);opacity:0} 80%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @keyframes sp-spin       { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes sp-mapPulse   { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes sp-gradientFlow {
    0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
  }
  @keyframes sp-fadeSlideUp {
    0%{opacity:0;transform:translateY(20px) scale(0.98);filter:blur(1px)}
    100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
  }
  @keyframes sp-revealMask {
    from{clip-path:inset(0 100% 0 0);opacity:0} to{clip-path:inset(0 0% 0 0);opacity:1}
  }
  @keyframes sp-orbDrift {
    0%,100%{transform:translate(-50%,-50%) scale(1)}
    33%{transform:translate(-50%,-58%) scale(1.06)}
    66%{transform:translate(-43%,-50%) scale(0.96)}
  }
  @keyframes sp-cardIn {
    0%{opacity:0;transform:translateY(20px) scale(0.95);filter:blur(1px)}
    100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
  }
  @keyframes sp-shimmer {
    0%{background-position:-300px 0} 100%{background-position:calc(300px + 100%) 0}
  }
  @keyframes sp-star-pop {
    0%{transform:scale(1)} 35%{transform:scale(1.9);filter:drop-shadow(0 0 18px ${T.gold})}
    65%{transform:scale(0.82)} 100%{transform:scale(1.3);filter:drop-shadow(0 0 8px ${T.gold}88)}
  }
  @keyframes sp-ring-out {
    0%{opacity:0.7;transform:translate(-50%,-50%) scale(0.3)}
    100%{opacity:0;transform:translate(-50%,-50%) scale(2.4)}
  }
  @keyframes sp-copy-flash {
    0%{opacity:1;transform:translateY(0)} 80%{opacity:1;transform:translateY(-6px)} 100%{opacity:0;transform:translateY(-10px)}
  }

  .sp-star-pop  { animation:sp-star-pop 0.38s cubic-bezier(0.16,1,0.3,1) forwards; }
  .sp-star-ring { position:absolute;top:50%;left:50%;width:100%;height:100%;border-radius:50%;border:2px solid ${T.gold};pointer-events:none;animation:sp-ring-out 0.45s ease-out forwards; }
  .sp-copy-tip  { animation:sp-copy-flash 0.9s ease-out forwards; }

  .sp-page { animation:sp-fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .sp-scan { position:fixed;left:0;right:0;height:1px;pointer-events:none;z-index:1;background:linear-gradient(90deg,transparent,rgba(66,146,200,0.07),transparent);animation:sp-scan 14s linear infinite; }

  .sp-gradient-text {
    background:linear-gradient(135deg,${T.orange} 0%,${T.orangeL} 40%,${T.gold} 70%,${T.orange} 100%);
    background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;animation:sp-gradientFlow 4s ease-in-out infinite;display:inline;
  }
  .sp-glass {
    background:rgba(13,27,46,0.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
    border:1px solid rgba(66,146,200,0.10);box-shadow:0 4px 24px rgba(0,0,0,0.32),inset 0 1px 0 rgba(192,120,56,0.05);
  }
  .sp-pill { display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:100px;border:1px solid rgba(192,86,24,0.30);background:rgba(192,86,24,0.07);font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${T.orange}; }
  .sp-pill-blue  { border-color:rgba(66,146,200,0.30);  background:rgba(66,146,200,0.07);  color:${T.blue};  }
  .sp-pill-teal  { border-color:rgba(12,130,128,0.30);  background:rgba(12,130,128,0.07);  color:${T.teal};  }
  .sp-pill-gold  { border-color:rgba(184,146,40,0.30);  background:rgba(184,146,40,0.07);  color:${T.gold};  }
  .sp-pill-green { border-color:rgba(46,204,113,0.35);  background:rgba(46,204,113,0.08);  color:${T.green}; }

  .sp-orb { position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;animation:sp-orbDrift 10s ease-in-out infinite; }

  /* Channel cards */
  .sp-card { position:relative;overflow:hidden;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),border-color 0.25s,box-shadow 0.25s;text-decoration:none;display:block; }
  .sp-card:hover { transform:translateY(-6px) scale(1.01); }
  .sp-card-bar  { position:absolute;top:0;left:0;right:0;height:3px;transition:opacity 0.25s,box-shadow 0.25s; }
  .sp-card-shine { position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);transition:left 0.5s;pointer-events:none; }
  .sp-card:hover .sp-card-shine { left:120%; }

  /* I1: Copy button */
  .sp-copy-btn {
    display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border:none;border-radius:4px;
    cursor:pointer;font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;
    letter-spacing:0.05em;transition:all 0.2s;background:transparent;
  }
  .sp-copy-btn:hover { transform:scale(1.08); }

  /* FAQ */
  .sp-faq-item { border-bottom:1px solid ${T.navy}44;position:relative; }
  .sp-faq-item:last-child { border-bottom:none; }
  .sp-faq-btn { width:100%;background:none;border:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:20px 0;gap:12px;text-align:left;transition:color 0.2s; }
  .sp-faq-btn:hover .sp-faq-q { color:${T.white} !important; }
  .sp-faq-chevron { flex-shrink:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:${T.bgPanel};border:1px solid ${T.navy};font-family:'Press Start 2P';font-size:7px;color:${T.muted};transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),background 0.25s,border-color 0.25s,color 0.25s; }
  .sp-faq-chevron.open { transform:rotate(90deg);background:${T.orange}18;border-color:${T.orange}66;color:${T.orange}; }
  .sp-faq-answer { overflow:hidden;transition:max-height 0.35s cubic-bezier(0.16,1,0.3,1),opacity 0.25s;max-height:0;opacity:0; }
  .sp-faq-answer.open { max-height:320px;opacity:1; }
  .sp-faq-item::before { content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:transparent;transition:background 0.25s; }
  .sp-faq-item:has(.sp-faq-answer.open)::before { background:${T.orange}; }

  /* I2: FAQ search */
  .sp-faq-search { transition:border-color 0.2s,box-shadow 0.2s; }
  .sp-faq-search:focus { outline:none;border-color:${T.orange}66 !important;box-shadow:0 0 0 3px ${T.orange}14; }

  /* I5: Mini nav */
  .sp-mini-nav {
    position:sticky;top:58px;z-index:99;
    background:rgba(6,13,26,0.93);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border-bottom:1px solid ${T.navy}55;
    display:flex;justify-content:center;gap:4px;padding:7px 16px;
    transition:transform 0.35s cubic-bezier(0.16,1,0.3,1),opacity 0.3s;
  }
  .sp-mini-nav.hidden { transform:translateY(-110%);opacity:0;pointer-events:none; }
  .sp-nav-btn {
    display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;
    border:1px solid transparent;background:none;cursor:pointer;
    font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;
    color:${T.muted};transition:all 0.2s;white-space:nowrap;
  }
  .sp-nav-btn.active { background:${T.orange}15;border-color:${T.orange}44;color:${T.orange}; }
  .sp-nav-btn:not(.active):hover { color:${T.white};background:rgba(255,255,255,0.04); }

  /* Status dot */
  .sp-dot { animation:sp-blink 3s ease-in-out infinite; }
  .sp-back { transition:transform 0.2s,color 0.15s; }
  .sp-back:hover { transform:translateX(-4px);color:${T.white} !important; }

  /* Grids */
  .sp-channels { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
  @media(max-width:900px){ .sp-channels { grid-template-columns:repeat(2,1fr) !important; } }
  @media(max-width:540px){ .sp-channels { grid-template-columns:1fr !important; } }
  .sp-status-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:12px; }
  @media(max-width:800px){ .sp-status-grid { grid-template-columns:repeat(2,1fr) !important; } }
  @media(max-width:480px){ .sp-status-grid { grid-template-columns:1fr !important; } }
  .sp-tips-grid  { display:grid;grid-template-columns:repeat(2,1fr);gap:12px; }
  @media(max-width:640px){ .sp-tips-grid  { grid-template-columns:1fr !important; } }
  .sp-tgrid      { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
  @media(max-width:900px){ .sp-tgrid { grid-template-columns:repeat(2,1fr) !important; } }
  @media(max-width:540px){ .sp-tgrid { grid-template-columns:1fr !important; } }

  /* V2: Feedback tabs */
  .sp-fb-tabs { display:flex;position:relative;border-bottom:1px solid ${T.navy}66;background:rgba(6,13,26,0.5); }
  .sp-fb-tab { display:flex;align-items:center;gap:7px;padding:14px 22px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;color:${T.muted};transition:color 0.2s;white-space:nowrap; }
  .sp-fb-tab.active { color:${T.orange};border-bottom-color:transparent; }
  .sp-fb-tab:not(.active):hover { color:${T.white}; }

  .sp-status-badge { display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase; }
  .sp-hist-item { border-bottom:1px solid ${T.navy}44;padding:16px 20px;transition:background 0.15s; }
  .sp-hist-item:last-child { border-bottom:none; }
  .sp-hist-item:hover { background:rgba(255,255,255,0.015); }

  /* V3: Testimonial */
  .sp-tcard { position:relative;overflow:hidden;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),border-color 0.25s,box-shadow 0.25s; }
  .sp-tcard:hover { transform:translateY(-5px); }

  .sp-rl-banner { display:flex;align-items:center;gap:12px;padding:14px 18px;margin-bottom:20px;background:${T.orange}08;border:1px solid ${T.orange}33;border-left:3px solid ${T.orange}; }
  .sp-skeleton  { background:linear-gradient(90deg,rgba(30,58,95,0.25) 0%,rgba(76,201,240,0.06) 50%,rgba(30,58,95,0.25) 100%);background-size:300px 100%;animation:sp-shimmer 1.5s infinite;border-radius:6px; }

  /* V4/V5: Form */
  .sp-star { cursor:pointer;position:relative;display:inline-block;transition:transform .15s; }
  .sp-star:hover { transform:scale(1.25); }
  .sp-fb-input { transition:border-color .2s,box-shadow .2s; }
  .sp-fb-input:focus { outline:none;border-color:${T.orange}66 !important;box-shadow:0 0 0 3px ${T.orange}18; }
  .sp-fb-btn { transition:all .2s cubic-bezier(0.16,1,0.3,1); }
  .sp-fb-btn:not(:disabled):hover { transform:translateY(-2px);box-shadow:0 6px 20px ${T.orange}44; }
  .sp-fb-btn:disabled { opacity:.5;cursor:not-allowed; }
  .sp-type-btn { transition:all .2s cubic-bezier(0.16,1,0.3,1);cursor:pointer; }
  .sp-type-btn:hover { transform:translateY(-2px); }

  /* V7: FAQ progress */
  .sp-faq-progress-bar  { height:3px;background:${T.navy};border-radius:2px;overflow:hidden;flex:1; }
  .sp-faq-progress-fill { height:100%;border-radius:2px;background:linear-gradient(90deg,${T.orange},${T.gold});transition:width 0.4s cubic-bezier(0.16,1,0.3,1); }

  .sp-divider { width:100%;height:1px;background:linear-gradient(90deg,transparent 0%,${T.navy} 20%,${T.orange}44 50%,${T.navy} 80%,transparent 100%);border:none;margin:0; }

  /* V6: Floating btn */
  .sp-float-btn { position:fixed;bottom:24px;right:24px;z-index:200;display:flex;align-items:center;gap:0;overflow:hidden;text-decoration:none;background:rgba(88,101,242,0.9);border:1px solid #5865F2;border-radius:100px;padding:13px;cursor:pointer;backdrop-filter:blur(12px);box-shadow:0 4px 20px rgba(88,101,242,0.3);transition:all 0.3s cubic-bezier(0.16,1,0.3,1); }
  .sp-float-btn:hover { background:#5865F2;padding-right:20px;gap:10px;box-shadow:0 8px 32px rgba(88,101,242,0.5); }
  .sp-float-label { font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;color:#fff;white-space:nowrap;max-width:0;opacity:0;overflow:hidden;transition:max-width 0.3s cubic-bezier(0.16,1,0.3,1),opacity 0.2s; }
  .sp-float-btn:hover .sp-float-label { max-width:180px;opacity:1; }

  /* I4: Share btn */
  .sp-share-btn { display:inline-flex;align-items:center;gap:7px;padding:10px 20px;text-decoration:none;border-radius:100px;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;transition:all 0.2s cubic-bezier(0.16,1,0.3,1); }
  .sp-share-btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px currentColor; }

  @media(prefers-reduced-motion:reduce){
    .sp-gradient-text,.sp-orb,.sp-page,.sp-skeleton { animation:none !important; }
    .sp-mini-nav { transition:none !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// I2: Highlight component
// ─────────────────────────────────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const lo  = text.toLowerCase();
  const idx = lo.indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background:`${T.orange}28`, color:T.orange, padding:"0 2px", borderRadius:2, fontWeight:700 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// V1: Partial star display
// ─────────────────────────────────────────────────────────────────────────────
function StarDisplay({ rating, size = 14 }) {
  if (!rating) return null;
  return (
    <div style={{ display:"flex", gap:2, justifyContent:"center", marginTop:6 }}>
      {[1,2,3,4,5].map(n => {
        const fill = Math.min(1, Math.max(0, rating - (n - 1)));
        return (
          <span key={n} style={{ position:"relative", display:"inline-block", width:size, fontSize:size, lineHeight:1, flexShrink:0 }}>
            <span style={{ color:T.navy }}>★</span>
            {fill > 0 && (
              <span style={{ position:"absolute", left:0, top:0, width:`${fill*100}%`, overflow:"hidden", color:T.gold, filter:`drop-shadow(0 0 4px ${T.gold}66)` }}>★</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ ITEM — controlled + I2 highlight
// ─────────────────────────────────────────────────────────────────────────────
function FaqItem({ item, index, isOpen, onToggle, searchTerm }) {
  return (
    <div className="sp-faq-item" style={{ paddingLeft:16, animation:`sp-cardIn 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.05}s both` }}>
      <button className="sp-faq-btn" onClick={onToggle}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
          <span style={{ fontSize:18, flexShrink:0, filter:isOpen?`drop-shadow(0 0 6px ${T.orange})`:"none", transition:"filter 0.25s" }}>{item.icon}</span>
          <span className="sp-faq-q" style={{ ...raj(15,600), color:isOpen?T.orange:T.white, flex:1, lineHeight:1.5, transition:"color 0.2s" }}>
            <Highlight text={item.q} query={searchTerm || ""} />
          </span>
        </div>
        <span className={`sp-faq-chevron${isOpen?" open":""}`}>▶</span>
      </button>
      <div className={`sp-faq-answer${isOpen?" open":""}`}>
        <p style={{ ...raj(14,400), color:T.muted, lineHeight:1.8, paddingBottom:20, paddingLeft:30 }}>{item.a}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// I1: CHANNEL CARD — copy handle on click
// ─────────────────────────────────────────────────────────────────────────────
function ChannelCard({ c, index }) {
  const [hov,     setHov]     = useState(false);
  const [copied,  setCopied]  = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(c.copyValue).then(() => {
      toast.success(`✓ Copiado: ${c.copyValue}`, { duration:2000 });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("No se pudo copiar"));
  };

  return (
    <a href={c.href} target="_blank" rel="noopener noreferrer"
      className="sp-card sp-glass"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderColor: hov ? `${c.color}55` : "rgba(76,201,240,0.1)",
        boxShadow:   hov ? `0 12px 40px ${c.color}22,0 0 0 1px ${c.color}22,inset 0 1px 0 rgba(255,255,255,0.06)` : `0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)`,
        padding: "22px 20px",
        animation: `sp-cardIn 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s both`,
      }}>
      <div className="sp-card-shine" />
      <div className="sp-card-bar" style={{ background:`linear-gradient(90deg,${c.color}cc,${c.color})`, opacity:hov?1:0.5, boxShadow:hov?`0 0 14px ${c.color}88`:"none" }} />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:c.color, border:`1px solid ${c.color}44`, background:`${c.color}0e`, padding:"3px 10px", borderRadius:100 }}>
          {c.badge}
        </span>
        <span style={{ fontSize:26, filter:hov?`drop-shadow(0 0 10px ${c.color})`:`drop-shadow(0 0 4px ${c.color}44)`, transition:"filter 0.25s" }}>{c.icon}</span>
      </div>

      <div style={{ ...raj(18,700), color:hov?c.color:T.white, marginBottom:6, transition:"color 0.2s" }}>{c.label}</div>

      {/* Handle + copy button */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ ...raj(12,500), color:c.color, opacity:0.85, letterSpacing:"0.04em" }}>{c.handle}</span>
        <button className="sp-copy-btn"
          onClick={handleCopy}
          title="Copiar al portapapeles"
          style={{ color:copied?T.green:c.color, background:copied?`${T.green}12`:`${c.color}12`, border:`1px solid ${copied?T.green:c.color}30` }}>
          {copied ? "✓ Copiado" : "⧉ Copiar"}
        </button>
      </div>

      <div style={{ ...raj(13,400), color:T.muted, lineHeight:1.65 }}>{c.desc}</div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ accent, title, sub, pillClass = "sp-pill", icon }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ marginBottom:12 }}>
        <span className={pillClass} style={{ animation:"sp-revealMask 0.7s cubic-bezier(0.16,1,0.3,1) both" }}>
          {icon && <span>{icon}</span>}<span style={{ fontSize:8 }}>◆</span>{title}<span style={{ fontSize:8 }}>◆</span>
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:1, background:`linear-gradient(90deg,transparent,${accent}66)` }} />
        <div style={{ width:6, height:6, background:accent, clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)", boxShadow:`0 0 8px ${accent}`, animation:"sp-mapPulse 1.8s ease-in-out infinite" }} />
        <div style={{ width:32, height:1, background:`linear-gradient(90deg,${accent}66,transparent)` }} />
        {sub && <span style={{ ...raj(13,400), color:T.muted, marginLeft:4 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// V3: TESTIMONIAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialCard({ item, index }) {
  const [hov, setHov] = useState(false);
  const color = CLASS_COLOR[item.heroClass] || T.orange;
  const icon  = CLASS_ICON[item.heroClass]  || "⚔️";
  const msg   = item.message.length > 180 ? item.message.slice(0,177)+"…" : item.message;

  return (
    <div className="sp-glass sp-tcard"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding:"22px 20px", borderColor:hov?`${color}55`:"rgba(255,215,0,0.12)",
        boxShadow:hov?`0 12px 40px ${color}22,0 0 0 1px ${color}22,inset 0 1px 0 rgba(255,255,255,0.06)`:"0 4px 24px rgba(0,0,0,0.32)",
        animation:`sp-cardIn 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.07}s both` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${color}cc,${color})`, opacity:hov?1:0.35, boxShadow:hov?`0 0 12px ${color}88`:"none", transition:"opacity 0.25s,box-shadow 0.25s" }} />
      <div style={{ marginBottom:12, marginTop:4 }}>
        {[1,2,3,4,5].map(n => (<span key={n} style={{ fontSize:14, color:n<=item.rating?T.gold:T.navy, filter:n<=item.rating?`drop-shadow(0 0 4px ${T.gold}66)`:"none" }}>★</span>))}
      </div>
      <p style={{ ...raj(14,400), color:T.muted, lineHeight:1.7, marginBottom:16, minHeight:60 }}>"{msg}"</p>
      <div style={{ display:"flex", alignItems:"center", gap:10, borderTop:`1px solid ${T.navy}44`, paddingTop:14 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, background:hov?`${color}20`:`${color}10`, border:`1px solid ${hov?color+"55":color+"22"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, transition:"background 0.25s,border-color 0.25s,box-shadow 0.25s", boxShadow:hov?`0 0 10px ${color}44`:"none" }}>
          {icon}
        </div>
        <div>
          <div style={{ ...raj(12,700), color:hov?color:T.white, transition:"color 0.2s" }}>{item.heroClass} · Nv. {item.level}</div>
          <div style={{ ...raj(11,400), color:T.muted }}>{timeAgo(item.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY ITEM
// ─────────────────────────────────────────────────────────────────────────────
function HistoryItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const cfg     = STATUS_CFG[item.status] || STATUS_CFG.pending;
  const emoji   = TYPE_EMOJI[item.type]   || "❓";
  const preview = item.subject || item.message.slice(0,60)+(item.message.length>60?"…":"");

  return (
    <div className="sp-hist-item">
      <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={() => setExpanded(o => !o)}>
        <span style={{ fontSize:20, flexShrink:0 }}>{emoji}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ ...raj(14,600), color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{preview}</div>
          <div style={{ ...raj(11,400), color:T.muted, marginTop:3 }}>{"★".repeat(item.rating)}{" · "}{timeAgo(item.createdAt)}</div>
        </div>
        <span className="sp-status-badge" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, flexShrink:0 }}>
          {cfg.dot} {cfg.label}
        </span>
      </div>
      {expanded && (
        <div style={{ marginTop:12, paddingLeft:32 }}>
          <p style={{ ...raj(13,400), color:T.muted, lineHeight:1.7, marginBottom:item.adminNote?12:0 }}>{item.message}</p>
          {item.adminNote && (
            <div style={{ background:`${T.teal}0A`, border:`1px solid ${T.teal}33`, borderLeft:`3px solid ${T.teal}`, padding:"10px 14px" }}>
              <div style={{ ...raj(10,700), color:T.teal, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Nota del equipo</div>
              <p style={{ ...raj(13,400), color:T.muted, lineHeight:1.65 }}>{item.adminNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK FORM — I3 placeholder · I4 share · V4 burst · V5 counter · B4 limit
// ─────────────────────────────────────────────────────────────────────────────
const FB_TYPES = [
  { id:"bug",        emoji:"🐛", label:"Error técnico" },
  { id:"suggestion", emoji:"💡", label:"Sugerencia"    },
  { id:"complaint",  emoji:"😤", label:"Queja"         },
  { id:"praise",     emoji:"😊", label:"Elogio"        },
  { id:"other",      emoji:"❓", label:"Otro"          },
];

function FeedbackForm({ user, myFeedback, onSwitchToHistory }) {
  const [type,        setType]    = useState("suggestion");
  const [rating,      setRating]  = useState(0);
  const [hoverRating, setHover]   = useState(0);
  const [burstStar,   setBurst]   = useState(0);
  const [subject,     setSubject] = useState("");
  const [message,     setMessage] = useState("");
  const [sending,     setSending] = useState(false);
  const [sent,        setSent]    = useState(false);
  const [sentRating,  setSentRating] = useState(0); // I4: remember rating for share
  const [error,       setError]   = useState("");

  const recentSub = myFeedback?.find(f => Date.now() - f.createdAt < 24 * 3600 * 1000);
  const hoursAgo  = recentSub ? Math.max(1, Math.floor((Date.now() - recentSub.createdAt) / 3600000)) : 0;
  const hoursLeft = recentSub ? 24 - hoursAgo : 0;

  // V4: star burst
  const handleStarClick = (n) => {
    setRating(n); setBurst(n);
    setTimeout(() => setBurst(0), 450);
  };

  // V5: counter colors
  const ctrColor = (pct) => pct >= 0.95 ? "#FF4444" : pct >= 0.80 ? T.gold : T.muted;
  const ctrGlow  = (pct) => pct >= 0.95 ? "0 0 8px rgba(255,68,68,0.4)" : pct >= 0.80 ? `0 0 6px ${T.gold}44` : "none";
  const msgPct   = message.length / 1000;
  const subPct   = subject.length / 100;

  const handleSubmit = async () => {
    if (recentSub) { setError(`Ya enviaste un reporte hace ${hoursAgo}h. Espera ${hoursLeft}h más.`); return; }
    if (!message.trim() || message.trim().length < 10) { setError("El mensaje debe tener al menos 10 caracteres."); return; }
    if (!rating) { setError("Por favor selecciona una calificación."); return; }
    const se = subject ? validateClean(subject,"asunto") : null; if (se) { setError(se); return; }
    const me = validateClean(message,"mensaje");                  if (me) { setError(me); return; }
    setError(""); setSending(true);
    try {
      const token = await user.getIdToken();
      await submitFeedback(token, { type, rating, subject, message });
      setSentRating(rating);
      setSent(true);
    } catch (err) {
      setError(err.message || "Error al enviar. Inténtalo de nuevo.");
    } finally { setSending(false); }
  };

  if (sent) {
    // I4: share text & links
    const shareText  = encodeURIComponent(`¡Acabo de dar ${sentRating}⭐ a ForgeVenture! ⚔️🏆\n\nLa mejor app de fitness gamificada, completamente gratis.\n\n#ForgeVenture #Fitness #Gaming`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

    return (
      <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}44`, padding:"40px 32px", textAlign:"center", animation:"sp-success .45s ease" }}>
        <div style={{ fontSize:52, marginBottom:14 }}>✅</div>
        <div style={{ ...orb(16,900), color:T.green, marginBottom:8 }}>¡GRACIAS POR TU FEEDBACK!</div>
        <div style={{ ...raj(15,400), color:T.muted, lineHeight:1.8, maxWidth:400, margin:"0 auto 24px" }}>
          Tu reporte ha sido enviado al equipo. Lo revisaremos lo antes posible.
        </div>

        {/* I4: Share button when 5 stars */}
        {sentRating === 5 && (
          <div style={{ marginBottom:20, padding:"16px 20px", background:`${T.gold}08`, border:`1px solid ${T.gold}33`, borderRadius:0 }}>
            <div style={{ ...raj(12,700), color:T.gold, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>
              ★ ¡5 estrellas! Comparte con la comunidad
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="sp-share-btn"
                style={{ background:"#000", color:"#fff", border:"1px solid rgba(255,255,255,0.15)" }}>
                𝕏 Compartir en X
              </a>
              <button onClick={() => { navigator.clipboard.writeText(decodeURIComponent(shareText)); toast.success("✓ Texto copiado para compartir"); }}
                className="sp-share-btn"
                style={{ background:T.bgPanel, color:T.muted, border:`1px solid ${T.navy}`, cursor:"pointer" }}>
                ⧉ Copiar texto
              </button>
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => { setSent(false); setMessage(""); setSubject(""); setRating(0); setSentRating(0); }}
            className="sp-fb-btn" style={{ ...raj(14,700), background:T.green, border:"none", color:"#060D1A", padding:"12px 24px", cursor:"pointer", letterSpacing:"0.08em" }}>
            Enviar otro
          </button>
          <button onClick={onSwitchToHistory} className="sp-fb-btn"
            style={{ ...raj(14,700), background:"none", border:`1px solid ${T.teal}66`, color:T.teal, padding:"12px 24px", cursor:"pointer", letterSpacing:"0.08em" }}>
            📋 Ver historial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.navy}`, padding:"28px 28px 24px" }}>

      {/* B4: Rate-limit banner */}
      {recentSub && (
        <div className="sp-rl-banner">
          <span style={{ fontSize:22, flexShrink:0 }}>⏱</span>
          <div style={{ flex:1 }}>
            <div style={{ ...raj(13,700), color:T.orange, marginBottom:2 }}>Enviaste un reporte hace {hoursAgo}h</div>
            <div style={{ ...raj(12,400), color:T.muted }}>Próximo envío disponible en {hoursLeft}h</div>
          </div>
          <button onClick={onSwitchToHistory}
            style={{ ...raj(12,700), color:T.orange, background:"none", border:`1px solid ${T.orange}44`, padding:"7px 14px", cursor:"pointer", flexShrink:0 }}>
            Ver historial
          </button>
        </div>
      )}

      {/* Tipo — I3: changes placeholder */}
      <div style={{ marginBottom:22 }}>
        <div style={{ ...raj(11,700), color:T.muted, letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>Tipo de reporte</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {FB_TYPES.map(t => {
            const on = type === t.id;
            return (
              <button key={t.id} onClick={() => setType(t.id)} className="sp-type-btn"
                style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px",
                  background:on?`${T.orange}18`:T.bgPanel, border:`1px solid ${on?T.orange+"66":T.navy}`,
                  color:on?T.orange:T.muted, ...raj(13,on?700:500), borderRadius:100,
                  boxShadow:on?`0 0 12px ${T.orange}22`:"none" }}>
                <span style={{ fontSize:16 }}>{t.emoji}</span>{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* V4: Star rating with burst */}
      <div style={{ marginBottom:22 }}>
        <div style={{ ...raj(11,700), color:T.muted, letterSpacing:".1em", textTransform:"uppercase", marginBottom:12 }}>Calificación de la plataforma</div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {[1,2,3,4,5].map(n => {
            const filled = n <= (hoverRating || rating);
            return (
              <span key={n} className={`sp-star${burstStar===n?" sp-star-pop":""}`}
                onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                onClick={() => handleStarClick(n)}
                style={{ fontSize:30, color:filled?T.gold:T.navy, filter:filled?`drop-shadow(0 0 8px ${T.gold}88)`:"none", transition:"color .15s,filter .15s" }}>
                ★{burstStar===n && <span className="sp-star-ring" />}
              </span>
            );
          })}
          {rating > 0 && (
            <span style={{ ...raj(14,600), color:T.gold, marginLeft:8 }}>
              {["","Muy malo","Malo","Regular","Bueno","Excelente"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Asunto */}
      <div style={{ marginBottom:16 }}>
        <div style={{ ...raj(11,700), color:T.muted, letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>
          Asunto <span style={{ fontWeight:400, textTransform:"none" }}>(opcional)</span>
        </div>
        <input value={subject} onChange={e => setSubject(e.target.value.slice(0,100))}
          placeholder="Resumen breve del asunto..." className="sp-fb-input"
          style={{ width:"100%", background:T.bgPanel, border:`1px solid ${T.navy}`, color:T.white, ...raj(14,400), padding:"11px 16px", boxSizing:"border-box" }}/>
        <div style={{ ...raj(10,600), color:ctrColor(subPct), textShadow:ctrGlow(subPct), textAlign:"right", marginTop:4, transition:"color 0.3s,text-shadow 0.3s" }}>
          {subject.length}/100
        </div>
      </div>

      {/* I3: Dynamic placeholder based on type */}
      <div style={{ marginBottom:18 }}>
        <div style={{ ...raj(11,700), color:T.muted, letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>
          Mensaje <span style={{ color:T.orange }}>*</span>
        </div>
        <textarea value={message} onChange={e => setMessage(e.target.value.slice(0,1000))}
          placeholder={TYPE_PLACEHOLDERS[type]}
          rows={6} className="sp-fb-input"
          style={{ width:"100%", background:T.bgPanel, border:`1px solid ${T.navy}`, color:T.white, ...raj(14,400), padding:"11px 16px", resize:"vertical", lineHeight:1.7, boxSizing:"border-box" }}/>
        <div style={{ ...raj(10,600), color:ctrColor(msgPct), textShadow:ctrGlow(msgPct), textAlign:"right", marginTop:4, transition:"color 0.3s,text-shadow 0.3s" }}>
          {message.length}/1000{msgPct >= 0.95 && <span style={{ marginLeft:6 }}>⚠</span>}
        </div>
      </div>

      {error && (
        <div style={{ ...raj(13,600), color:T.orange, marginBottom:16, background:`${T.orange}0D`, border:`1px solid ${T.orange}33`, padding:"10px 14px", borderLeft:`3px solid ${T.orange}` }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ ...raj(12,400), color:T.muted }}>
          Enviado como: <span style={{ color:T.white, fontWeight:600 }}>{user?.displayName || user?.email || "Anónimo"}</span>
        </div>
        <button onClick={handleSubmit} disabled={sending || !!recentSub} className="sp-fb-btn"
          style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 28px",
            background:(sending||recentSub)?T.navy:T.orange, border:"none", color:"#060D1A",
            ...raj(14,700), cursor:(sending||recentSub)?"not-allowed":"pointer", letterSpacing:"0.08em" }}>
          {sending
            ? <><span style={{ width:14, height:14, border:"2px solid #060D1A33", borderTopColor:"#060D1A", borderRadius:"50%", display:"inline-block", animation:"sp-spin .7s linear infinite" }}/> Enviando...</>
            : <>✈ Enviar reporte</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// V6: Floating help button
// ─────────────────────────────────────────────────────────────────────────────
function FloatingHelpButton() {
  return (
    <a href="https://discord.gg/forgeventure" target="_blank" rel="noopener noreferrer" className="sp-float-btn">
      <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>💬</span>
      <span className="sp-float-label">¿Necesitas ayuda?</span>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const navigate = useNavigate();

  // Auth
  const [firebaseUser, setFirebaseUser] = useState(null);
  useEffect(() => { const u = onAuthStateChanged(auth, u => setFirebaseUser(u)); return u; }, []);

  // B2: Public stats
  const [publicStats,  setPublicStats]  = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  useEffect(() => {
    setLoadingStats(true);
    getPublicFeedbackStats()
      .then(d => setPublicStats(d)).catch(() => setPublicStats(null)).finally(() => setLoadingStats(false));
  }, []);

  // B3: Testimonials
  const [testimonials, setTestimonials] = useState([]);
  useEffect(() => {
    getPublicTestimonials().then(d => setTestimonials(d.items||[])).catch(() => setTestimonials([]));
  }, []);

  // B1 + B5: My feedback onSnapshot
  const [myFeedback,     setMyFeedback]     = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const prevStatuses = useRef({});
  const isFirstSnap  = useRef(true);

  useEffect(() => {
    if (!firebaseUser) { setMyFeedback([]); prevStatuses.current = {}; isFirstSnap.current = true; return; }
    setLoadingHistory(true); isFirstSnap.current = true;
    const q    = query(collection(db,"feedback"), where("uid","==",firebaseUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach(doc => {
        const d = doc.data();
        items.push({ id:doc.id, type:d.type, rating:d.rating, subject:d.subject||"", message:d.message||"",
          status:d.status, adminNote:d.adminNote||"",
          createdAt:d.createdAt?.toMillis?.() || Date.now(), updatedAt:d.updatedAt?.toMillis?.() || Date.now() });
      });
      items.sort((a,b) => b.createdAt - a.createdAt);
      if (!isFirstSnap.current) {
        snap.docChanges().forEach(ch => {
          if (ch.type === "modified") {
            const prev = prevStatuses.current[ch.doc.id];
            const next = ch.doc.data().status;
            if (prev && prev !== next) {
              const cfg = STATUS_CFG[next];
              if (cfg) toast.info(`Tu reporte fue actualizado: ${cfg.label}`, { icon:"📋" });
            }
          }
        });
      }
      snap.forEach(doc => { prevStatuses.current[doc.id] = doc.data().status; });
      isFirstSnap.current = false;
      setMyFeedback(items); setLoadingHistory(false);
    }, () => setLoadingHistory(false));
    return () => { unsub(); isFirstSnap.current = true; };
  }, [firebaseUser]);

  // V1: Count-up
  const rawRating   = loadingStats ? null : (publicStats?.avgRating   || 0);
  const rawResolved = loadingStats ? null : (publicStats?.totalResolved || 0);
  const rawHours    = loadingStats ? null : (publicStats?.avgResponseHours || 24);
  const animRating   = useCountUp(rawRating,   1500);
  const animResolved = useCountUp(rawResolved, 1200);
  const animHours    = useCountUp(rawHours,    1000);

  // V7: FAQ open state
  const [openFaqSet, setOpenFaqSet] = useState(new Set());
  const toggleFaq = (i) => setOpenFaqSet(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  // I2: FAQ search
  const [faqSearch, setFaqSearch] = useState("");
  const filteredFaq = FAQ.map((item,i) => ({ ...item, originalIndex:i }))
    .filter(item => !faqSearch.trim() ||
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase()));

  // V2: Tabs with sliding pill
  const [feedbackTab, setFeedbackTab] = useState("send");
  const tabsRef = useRef(null);
  const [pill, setPill] = useState({ left:0, width:0 });
  const TABS = [
    { id:"send",      label:"✈ Enviar",       show:true },
    { id:"history",   label:"📋 Mi historial", show:!!firebaseUser },
    { id:"comunidad", label:"💬 Comunidad",    show:true },
  ];
  const visibleTabs = TABS.filter(t => t.show);
  useLayoutEffect(() => {
    if (!tabsRef.current) return;
    const btn = tabsRef.current.querySelector(`[data-tabid="${feedbackTab}"]`);
    if (!btn) return;
    setPill({ left:btn.offsetLeft, width:btn.offsetWidth });
  }, [feedbackTab, firebaseUser]);

  // I5: IntersectionObserver for mini nav
  const heroRef     = useRef(null);
  const faqRef      = useRef(null);
  const canalesRef  = useRef(null);
  const estadoRef   = useRef(null);
  const feedbackRef = useRef(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showMiniNav,   setShowMiniNav]   = useState(false);

  useEffect(() => {
    const sectionMap = { faq:faqRef, canales:canalesRef, estado:estadoRef, feedback:feedbackRef };

    const heroObs = new IntersectionObserver(
      ([entry]) => setShowMiniNav(!entry.isIntersecting),
      { threshold:0 }
    );
    if (heroRef.current) heroObs.observe(heroRef.current);

    const sectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.dataset.sectionId);
        });
      },
      { rootMargin:"-35% 0px -55% 0px", threshold:0 }
    );
    Object.entries(sectionMap).forEach(([id, ref]) => {
      if (ref.current) { ref.current.dataset.sectionId = id; sectionObs.observe(ref.current); }
    });

    return () => { heroObs.disconnect(); sectionObs.disconnect(); };
  }, []);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-scan" />
      <FloatingHelpButton />

      <div className="sp-page" style={{ minHeight:"100vh", background:T.bg, color:T.white, overflowX:"hidden", position:"relative" }}>

        {/* Ambient orbs */}
        <div className="sp-orb" style={{ width:400, height:400, background:T.orange, opacity:0.04, left:"80%", top:"10%",  animationDuration:"12s" }} />
        <div className="sp-orb" style={{ width:300, height:300, background:T.blue,   opacity:0.04, left:"5%",  top:"35%",  animationDuration:"9s",  animationDelay:"3s" }} />
        <div className="sp-orb" style={{ width:250, height:250, background:T.teal,   opacity:0.03, left:"50%", top:"70%",  animationDuration:"14s", animationDelay:"6s" }} />
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, opacity:0.3, backgroundImage:`linear-gradient(${T.navy}18 1px,transparent 1px),linear-gradient(90deg,${T.navy}18 1px,transparent 1px)`, backgroundSize:"48px 48px" }} />

        {/* Topbar */}
        <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(6,13,26,0.96)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:`1px solid ${T.navy}`, boxShadow:`0 2px 0 ${T.orange}22,0 4px 24px rgba(0,0,0,0.5)`, padding:"0 5%" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
            <button className="sp-back" onClick={() => navigate(-1)} style={{ ...raj(14,600), color:T.muted, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>←</span> Volver
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16, filter:`drop-shadow(0 0 8px ${T.orange})` }}>⚔️</span>
              <span style={{ ...px(8), fontSize:9 }}><span style={{ color:T.orange }}>FORGE</span><span style={{ color:T.white }}>VENTURE</span></span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div className="sp-dot" style={{ width:8, height:8, borderRadius:"50%", background:T.green, boxShadow:`0 0 8px ${T.green}` }} />
              <span style={{ ...raj(12,600), color:T.green, letterSpacing:"0.06em" }}>Online</span>
            </div>
          </div>
        </div>

        {/* I5: Mini section nav */}
        <div className={`sp-mini-nav${showMiniNav?"":" hidden"}`}>
          {NAV_ITEMS.map(item => {
            const refMap = { faq:faqRef, canales:canalesRef, estado:estadoRef, feedback:feedbackRef };
            return (
              <button key={item.id} className={`sp-nav-btn${activeSection===item.id?" active":""}`}
                onClick={() => scrollToSection(refMap[item.id])}>
                <span style={{ fontSize:12 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"64px 5% 80px", position:"relative", zIndex:1 }}>

          {/* ── HERO ─────────────────────────────────────────────── */}
          <div ref={heroRef} style={{ textAlign:"center", marginBottom:80 }}>
            <div style={{ marginBottom:20, animation:"sp-revealMask 0.8s cubic-bezier(0.16,1,0.3,1) both" }}>
              <span className="sp-pill">◆ CENTRO DE SOPORTE ◆</span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:80, height:80, marginBottom:24, background:`${T.orange}10`, border:`2px solid ${T.orange}44`, boxShadow:`0 0 32px ${T.orange}22,inset 0 1px 0 rgba(255,255,255,0.06)`, animation:"sp-cardIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
              <span style={{ ...px(26), color:T.orange }}>?</span>
            </div>
            <h1 style={{ ...orb("clamp(22px,4.5vw,40px)"), fontWeight:900, letterSpacing:"0.04em", marginBottom:16, lineHeight:1.2, animation:"sp-fadeSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
              <span style={{ color:T.white }}>¿Necesitas </span><span className="sp-gradient-text">ayuda</span><span style={{ color:T.white }}>?</span>
            </h1>
            <p style={{ ...raj(16,400), color:T.muted, maxWidth:500, margin:"0 auto 32px", lineHeight:1.85, animation:"sp-fadeSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both" }}>
              Encuentra respuestas rápidas en las preguntas frecuentes o contáctanos por el canal que prefieras.
            </p>

            {/* V1: Animated hero stats */}
            <div style={{ display:"flex", justifyContent:"center", gap:40, flexWrap:"wrap", animation:"sp-fadeSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}>
              {loadingStats ? (
                [0,1,2].map(i => (
                  <div key={i} style={{ textAlign:"center", minWidth:100 }}>
                    <div className="sp-skeleton" style={{ width:80, height:28, margin:"0 auto 8px" }} />
                    <div className="sp-skeleton" style={{ width:110, height:13, margin:"0 auto" }} />
                  </div>
                ))
              ) : (
                <>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ ...orb(22,900), background:`linear-gradient(135deg,${T.gold},${T.orangeL})`, backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"sp-gradientFlow 3s ease-in-out infinite" }}>
                      ★ {animRating.toFixed(1)}
                    </div>
                    <StarDisplay rating={rawRating||0} size={13} />
                    <div style={{ ...raj(11,500), color:T.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:6 }}>Calificación media</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ ...orb(22,900), background:`linear-gradient(135deg,${T.green},${T.teal})`, backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"sp-gradientFlow 3s ease-in-out infinite" }}>
                      {animResolved}
                    </div>
                    <div style={{ ...raj(11,500), color:T.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4 }}>Reportes resueltos</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ ...orb(22,900), background:`linear-gradient(135deg,${T.blue},${T.teal})`, backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"sp-gradientFlow 3s ease-in-out infinite" }}>
                      ~{animHours}h
                    </div>
                    <div style={{ ...raj(11,500), color:T.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4 }}>Tiempo de respuesta</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <hr className="sp-divider" style={{ marginBottom:64 }} />

          {/* ── V7 + I2: FAQ with progress + search ──────────────── */}
          <div ref={faqRef} style={{ marginBottom:72 }}>
            <SectionHeader accent={T.orange} title="PREGUNTAS FRECUENTES" pillClass="sp-pill" icon="❓" />

            {/* I2: Search input */}
            <div style={{ position:"relative", marginBottom:18 }}>
              <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:15, opacity:0.45, pointerEvents:"none" }}>🔍</span>
              <input
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                placeholder="Buscar en preguntas frecuentes..."
                className="sp-faq-search"
                style={{ width:"100%", background:T.bgPanel, border:`1px solid ${T.navy}`, color:T.white, ...raj(14,400), padding:"11px 40px 11px 40px", boxSizing:"border-box" }}
              />
              {faqSearch && (
                <button onClick={() => setFaqSearch("")}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:20, lineHeight:1, padding:"2px 6px" }}>
                  ×
                </button>
              )}
            </div>

            {/* V7: Progress bar */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div className="sp-faq-progress-bar">
                <div className="sp-faq-progress-fill" style={{ width:`${(openFaqSet.size/FAQ.length)*100}%`, boxShadow:openFaqSet.size>0?`0 0 8px ${T.orange}66`:"none" }} />
              </div>
              <span style={{ ...raj(12,600), color:openFaqSet.size>0?T.orangeL:T.muted, whiteSpace:"nowrap", transition:"color 0.3s" }}>
                {openFaqSet.size}/{FAQ.length} respondidas
              </span>
            </div>

            {filteredFaq.length === 0 ? (
              <div style={{ padding:"32px", textAlign:"center", background:T.bgCard, border:`1px solid ${T.navy}` }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
                <div style={{ ...raj(14,600), color:T.muted }}>Sin resultados para "<span style={{ color:T.white }}>{faqSearch}</span>"</div>
              </div>
            ) : (
              <div style={{ background:"rgba(13,27,46,0.55)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", border:"1px solid rgba(76,201,240,0.1)", padding:"4px 28px", boxShadow:"0 4px 24px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                {filteredFaq.map((item, i) => (
                  <FaqItem key={item.originalIndex} item={item} index={i}
                    isOpen={openFaqSet.has(item.originalIndex)} onToggle={() => toggleFaq(item.originalIndex)}
                    searchTerm={faqSearch} />
                ))}
              </div>
            )}
          </div>

          {/* ── Contact channels ─────────────────────────────────────── */}
          <div ref={canalesRef} style={{ marginBottom:72 }}>
            <SectionHeader accent={T.blue} title="CANALES DE CONTACTO" pillClass="sp-pill sp-pill-blue" icon="💬" sub="Elige el que prefieras" />
            <div className="sp-channels">
              {CHANNELS.map((c, i) => <ChannelCard key={c.id} c={c} index={i} />)}
            </div>
          </div>

          {/* ── System status ─────────────────────────────────────────── */}
          <div ref={estadoRef} style={{ marginBottom:72 }}>
            <SectionHeader accent={T.teal} title="ESTADO DEL SISTEMA" pillClass="sp-pill sp-pill-teal" icon="⚡" />
            <div className="sp-status-grid">
              {STATUS_ITEMS.map((s, i) => (
                <div key={s.label} className="sp-glass" style={{ padding:"16px 18px", animation:`sp-cardIn 0.55s cubic-bezier(0.16,1,0.3,1) ${i*0.07}s both`, transition:"transform 0.25s cubic-bezier(0.16,1,0.3,1),box-shadow 0.25s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 8px 28px ${s.color}18`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=""; }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:18 }}>{s.icon}</span>
                    <span style={{ ...raj(12,600), color:T.muted, letterSpacing:"0.05em" }}>{s.label}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div className="sp-dot" style={{ width:8, height:8, borderRadius:"50%", background:s.color, boxShadow:`0 0 8px ${s.color}`, flexShrink:0 }} />
                    <span style={{ ...raj(14,700), color:s.color }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick tips ─────────────────────────────────────────── */}
          <div style={{ marginBottom:72 }}>
            <SectionHeader accent={T.gold} title="CONSEJOS RÁPIDOS" pillClass="sp-pill sp-pill-gold" icon="💡" />
            <div className="sp-tips-grid">
              {QUICK_TIPS.map((tip, i) => (
                <div key={i} className="sp-glass" style={{ padding:"18px 20px", display:"flex", alignItems:"flex-start", gap:14, animation:`sp-cardIn 0.55s cubic-bezier(0.16,1,0.3,1) ${i*0.08}s both`, borderLeft:`3px solid ${T.gold}44`, transition:"border-color 0.25s,transform 0.25s cubic-bezier(0.16,1,0.3,1)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderLeftColor=T.gold; e.currentTarget.style.transform="translateX(4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderLeftColor=`${T.gold}44`; e.currentTarget.style.transform="translateX(0)"; }}>
                  <span style={{ fontSize:22, flexShrink:0, filter:`drop-shadow(0 0 6px ${T.gold}44)` }}>{tip.icon}</span>
                  <span style={{ ...raj(14,500), color:T.muted, lineHeight:1.65 }}>{tip.tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── V2 + B1: Tabbed feedback ──────────────────────────── */}
          <div ref={feedbackRef} style={{ marginBottom:64 }}>
            <SectionHeader accent={T.orange} title="REPORTES Y SUGERENCIAS" pillClass="sp-pill" icon="✈"
              sub={firebaseUser ? "Cuéntanos qué mejorar" : "Inicia sesión para enviar feedback"} />

            {/* Tab bar */}
            <div ref={tabsRef} className="sp-fb-tabs">
              <div style={{ position:"absolute", bottom:-1, left:pill.left, width:pill.width, height:2, background:T.orange, zIndex:1, transition:"left 0.28s cubic-bezier(0.16,1,0.3,1),width 0.28s cubic-bezier(0.16,1,0.3,1)", boxShadow:`0 0 8px ${T.orange}88` }} />
              {visibleTabs.map(tab => (
                <button key={tab.id} data-tabid={tab.id}
                  className={`sp-fb-tab${feedbackTab===tab.id?" active":""}`}
                  onClick={() => setFeedbackTab(tab.id)}>
                  {tab.label}
                  {tab.id === "history"   && myFeedback.length  > 0 && <span style={{ background:T.orange, color:"#060D1A", borderRadius:"100px", padding:"1px 7px", fontSize:10, fontWeight:700 }}>{myFeedback.length}</span>}
                  {tab.id === "comunidad" && testimonials.length > 0 && <span style={{ background:T.teal,   color:"#060D1A", borderRadius:"100px", padding:"1px 7px", fontSize:10, fontWeight:700 }}>{testimonials.length}</span>}
                </button>
              ))}
            </div>

            {/* Send tab */}
            {feedbackTab === "send" && (
              firebaseUser
                ? <FeedbackForm user={firebaseUser} myFeedback={myFeedback} onSwitchToHistory={() => setFeedbackTab("history")} />
                : <div className="sp-glass" style={{ padding:"48px 32px", textAlign:"center" }}>
                    <div style={{ fontSize:44, marginBottom:16 }}>🔒</div>
                    <div style={{ ...orb(14,700), color:T.muted, marginBottom:10 }}>ACCESO RESTRINGIDO</div>
                    <div style={{ ...raj(15,400), color:T.muted, lineHeight:1.8, maxWidth:360, margin:"0 auto" }}>
                      Para enviar reportes y sugerencias debes tener una cuenta de ForgeVenture.
                    </div>
                  </div>
            )}

            {/* History tab */}
            {feedbackTab === "history" && (
              <div style={{ background:T.bgCard, border:`1px solid ${T.navy}`, borderTop:"none" }}>
                {loadingHistory
                  ? <div style={{ padding:"40px", textAlign:"center" }}><span style={{ width:28, height:28, border:`2px solid ${T.navy}`, borderTopColor:T.orange, borderRadius:"50%", display:"inline-block", animation:"sp-spin .7s linear infinite" }} /></div>
                  : myFeedback.length === 0
                    ? <div style={{ padding:"48px 32px", textAlign:"center" }}>
                        <div style={{ fontSize:40, marginBottom:14 }}>📭</div>
                        <div style={{ ...orb(13,700), color:T.muted, marginBottom:8 }}>SIN REPORTES AÚN</div>
                        <div style={{ ...raj(14,400), color:T.muted, lineHeight:1.8 }}>Cuando envíes un reporte aparecerá aquí con su estado.</div>
                      </div>
                    : myFeedback.map(item => <HistoryItem key={item.id} item={item} />)
                }
              </div>
            )}

            {/* Comunidad tab */}
            {feedbackTab === "comunidad" && (
              <div style={{ background:T.bgCard, border:`1px solid ${T.navy}`, borderTop:"none", padding:"24px" }}>
                {testimonials.length === 0
                  ? <div style={{ padding:"32px", textAlign:"center" }}>
                      <div style={{ fontSize:36, marginBottom:14 }}>💬</div>
                      <div style={{ ...orb(13,700), color:T.muted, marginBottom:8 }}>SIN TESTIMONIOS AÚN</div>
                      <div style={{ ...raj(14,400), color:T.muted, lineHeight:1.8 }}>Sé el primero en dejar un elogio de 5⭐.</div>
                    </div>
                  : <>
                      <div style={{ ...raj(12,600), color:T.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:20 }}>
                        Lo que dicen los héroes de ForgeVenture
                      </div>
                      <div className="sp-tgrid">
                        {testimonials.map((item, i) => <TestimonialCard key={i} item={item} index={i} />)}
                      </div>
                    </>
                }
              </div>
            )}
          </div>

          {/* Footer */}
          <hr className="sp-divider" style={{ marginBottom:24 }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <span style={{ ...raj(12,400), color:`${T.muted}66` }}>© 2025 ForgeVenture Studios · Soporte Técnico</span>
            <span style={{ ...raj(12,400), color:`${T.muted}44` }}>v5.0.0 · Respuesta media &lt; 24 h hábiles</span>
          </div>

        </div>
      </div>
    </>
  );
}
