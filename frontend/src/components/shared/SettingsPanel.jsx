import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Settings, Volume2, Palette, Gamepad2, User,
  MousePointer2, Music, Bell, Zap, Type, RotateCcw,
  LogOut, ChevronDown, Cloud, List, Shield, Target, Sparkles,
  Check, X, Monitor, Globe,
} from "lucide-react";
import sm, { TRACKS } from "../../services/soundManager";
import { useLang, LANGS } from "../../hooks/useLang.js";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ── SC Admin palette ──────────────────────────────────────────────
const P = {
  bg:     "#0A0E1A",
  card:   "#141A2A",
  panel:  "#0E1520",
  navy:   "#1A3354",
  navyL:  "#1E3A5F",
  orange: "#D4A574",
  gold:   "#C9B037",
  blue:   "#5A9FD4",
  teal:   "#4A9D8F",
  green:  "#6B9F6A",
  red:    "#C66B6B",
  white:  "#F0F4FF",
  muted:  "#7A8A9E",
  mutedL: "#9AA3B2",
};

const raj = (s, w=600) => ({ fontFamily:"'Rajdhani',sans-serif",  fontSize:s, fontWeight:w });
const orb = (s, w=700) => ({ fontFamily:"'Orbitron',sans-serif",  fontSize:s, fontWeight:w });
const px8 = (s)        => ({ fontFamily:"'Press Start 2P'",       fontSize:s });

// ── Theme palettes (game theme system — unchanged) ────────────────
const THEMES = {
  "wine-aurora": {
    label: "Wine Aurora", icon: "🍷",
    bg0: "#0B0510", card: "#130820", border: "#2D1250",
    accent: "#C9184A", gold: "#FFC857", blue: "#4CC9F0",
    purple: "#7C3AED", green: "#22C55E", text: "#E2D9F3", muted: "#8B72BE",
  },
  "cyber-neon": {
    label: "Cyber Neon", icon: "⚡",
    bg0: "#050514", card: "#0A0A1E", border: "#1A1A4E",
    accent: "#00F5FF", gold: "#FFE600", blue: "#7B2FFF",
    purple: "#FF00FF", green: "#00FF88", text: "#E0F0FF", muted: "#6080A0",
  },
  "forest-druid": {
    label: "Forest Druid", icon: "🌿",
    bg0: "#040D08", card: "#081510", border: "#0E2B16",
    accent: "#22C55E", gold: "#A3E635", blue: "#34D399",
    purple: "#84CC16", green: "#4ADE80", text: "#D1FAE5", muted: "#4B7A5E",
  },
  "ocean-abyss": {
    label: "Ocean Abyss", icon: "🌊",
    bg0: "#020D1A", card: "#041525", border: "#082840",
    accent: "#4CC9F0", gold: "#F59E0B", blue: "#818CF8",
    purple: "#6366F1", green: "#22D3EE", text: "#E0F2FE", muted: "#4D7A9A",
  },
};

const ACCENT_PRESETS = [
  { label: "Carmesí",   value: "#C9184A", glow: "#C9184A66" },
  { label: "Zafiro",    value: "#4CC9F0", glow: "#4CC9F066" },
  { label: "Amatista",  value: "#7C3AED", glow: "#7C3AED66" },
  { label: "Esmeralda", value: "#22C55E", glow: "#22C55E66" },
];

const CURSOR_OPTS = [
  { id: "normal",    key: "sp.cursor.normal",    Ico: MousePointer2 },
  { id: "crosshair", key: "sp.cursor.crosshair", Ico: Monitor },
  { id: "pixel",     key: "sp.cursor.pixel",     Ico: Zap },
];

const SCALE_OPTS = [
  { id: "S", px: 14 },
  { id: "M", px: 16 },
  { id: "L", px: 18 },
];

const CLASS_ICONS = { GUERRERO: Shield, ARQUERO: Target, MAGO: Sparkles };
const CURRENT_VER = "v1.1";
const SEEN_KEY    = "fv_settings_seen";
const SETTINGS_EVENT = "fv-settings-changed";

const ALL_TABS = [
  { id: "audio",  key: "sp.tab.audio",   Ico: Volume2 },
  { id: "visual", key: "sp.tab.visual",  Ico: Palette },
  { id: "juego",  key: "sp.tab.game",    Ico: Gamepad2, auth: true },
  { id: "cuenta", key: "sp.tab.account", Ico: User,     auth: true },
];

const DEFAULTS = {
  themeId: "wine-aurora", accent: "#C9184A",
  reducedMotion: false, streakNotif: true, xpPopups: true,
  cursor: "normal", scale: "M", bgTrack: TRACKS[0].id,
  clickEnabled: true, bgEnabled: false, bgVolume: 0.35, lang: "es",
};

const FIRESTORE_KEY_MAP = {
  fv_reduced_motion: "reducedMotion",
  fv_streak_notif: "streakNotif",
  fv_xp_popups: "xpPopups",
};

const SV = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } } },
  item:       { hidden: { opacity: 0, y: 7 }, show: { opacity: 1, y: 0, transition: { duration: 0.18 } } },
};

const CHANGELOG = [
  {
    ver: "v1.1", date: "2026-04",
    items: [
      "Tabs de Audio / Visual / Juego / Cuenta",
      "4 temas completos (Wine Aurora, Cyber Neon, Forest Druid, Ocean Abyss)",
      "Sincronización de ajustes con la nube",
      "Cursor personalizable (Normal / Cruz / Pixel)",
      "Escala de UI (S / M / L)",
      "Selector de pista de música",
      "Atajo de teclado S / ,",
      "Swipe para cerrar en móvil",
    ],
  },
  {
    ver: "v1.0", date: "2026-03",
    items: [
      "Panel de ajustes inicial",
      "Música de fondo con volumen",
      "Color de acento personalizable",
      "Modo reducir animaciones",
      "Alertas de racha y popups de XP",
    ],
  },
];

// ── CSS ───────────────────────────────────────────────────────────
function buildCSS(accent, displayAccent, cursor) {
  const cursorCSS =
    cursor === "crosshair" ? "body,button,a{cursor:crosshair!important}" :
    cursor === "pixel"     ? "body,button,a{cursor:none!important}" : "";

  return `
@keyframes sp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes eq1{0%,100%{height:4px}50%{height:14px}}
@keyframes eq2{0%,100%{height:10px}33%{height:3px}66%{height:16px}}
@keyframes eq3{0%,100%{height:7px}50%{height:3px}}
${cursorCSS}

.fv-reduced-motion *,
.fv-reduced-motion *::before,
.fv-reduced-motion *::after{
  animation:none!important;
  transition:none!important;
  scroll-behavior:auto!important;
}

.fv-reduced-motion .sp-toggle::after,
.fv-reduced-motion .sp-theme-card,
.fv-reduced-motion .sp-scale-btn,
.fv-reduced-motion .sp-cursor-btn{
  transition:none!important;
}

.sp-toggle{
  position:relative;width:44px;height:24px;
  background:${P.navy};border:1.5px solid ${P.navyL};border-radius:12px;
  cursor:pointer;transition:all .25s;flex-shrink:0;
}
.sp-toggle.on{background:${accent};border-color:${accent};box-shadow:0 0 10px ${accent}44;}
.sp-toggle::after{
  content:'';position:absolute;top:3px;left:3px;
  width:16px;height:16px;border-radius:50%;
  background:${P.muted};transition:all .25s;
}
.sp-toggle.on::after{transform:translateX(20px);background:${P.bg};}

.sp-row{
  display:flex;align-items:center;justify-content:space-between;
  gap:10px;padding:10px 0;border-bottom:1px solid ${P.navy};
}
.sp-row:last-child{border-bottom:none;}

.sp-section-label{
  font-family:'Orbitron',sans-serif;font-size:8px;font-weight:700;
  letter-spacing:.16em;color:${P.muted};text-transform:uppercase;
  padding:10px 0 6px;margin-top:2px;
}

.sp-vol{
  -webkit-appearance:none;appearance:none;
  width:100%;height:4px;border-radius:99px;
  background:linear-gradient(to right,${accent} var(--pct,35%),${P.navy} var(--pct,35%));
  outline:none;cursor:pointer;margin-top:4px;
}
.sp-vol::-webkit-slider-thumb{
  -webkit-appearance:none;width:14px;height:14px;border-radius:50%;
  background:${accent};box-shadow:0 0 6px ${accent}77;cursor:pointer;
}

.sp-tab-bar{
  display:flex;gap:3px;padding:4px;
  background:${P.panel};border-radius:10px;
  border:1px solid ${P.navy};
  position:relative;margin-bottom:14px;
}
.sp-tab-btn{
  flex:1;border:none;background:transparent;cursor:pointer;
  padding:6px 4px;border-radius:7px;position:relative;z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:3px;transition:color .2s;
}

.sp-theme-card{
  flex:1;padding:8px 6px;border-radius:9px;cursor:pointer;
  border:1.5px solid ${P.navy};transition:all .2s;text-align:center;
  background:${P.panel};
}
.sp-theme-card:hover{transform:translateY(-2px);border-color:${P.navyL};}
.sp-theme-card.active{border-color:${accent};box-shadow:0 0 10px ${accent}33;}

.eq-bar{width:3px;border-radius:2px;background:${accent};align-self:flex-end;}
.eq-bar:nth-child(1){animation:eq1 .7s ease-in-out infinite;}
.eq-bar:nth-child(2){animation:eq2 .9s ease-in-out infinite .1s;}
.eq-bar:nth-child(3){animation:eq3 .6s ease-in-out infinite .2s;}

.sp-kbd{
  display:inline-block;padding:1px 6px;border-radius:4px;
  background:${P.navy};border:1px solid ${P.navyL};
  font-family:'Orbitron',sans-serif;font-size:7px;color:${P.mutedL};
}

.sp-scale-btn,.sp-cursor-btn{
  flex:1;padding:8px 4px;border-radius:7px;cursor:pointer;
  border:1.5px solid ${P.navy};transition:all .2s;
  font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:.05em;
  display:flex;flex-direction:column;align-items:center;gap:4px;
  background:${P.panel};
}
.sp-scale-btn:hover,.sp-cursor-btn:hover{border-color:${P.navyL};}

.sp-accent-dot{
  width:24px;height:24px;border-radius:50%;cursor:pointer;
  border:2px solid transparent;transition:all .2s;
}
.sp-accent-dot:hover,.sp-accent-dot.active{border-color:${P.white};transform:scale(1.15);}

.sp-select{
  width:100%;padding:8px 10px;border-radius:8px;
  background:${P.panel};border:1.5px solid ${P.navy};
  color:${P.white};font-family:'Rajdhani',sans-serif;font-size:13px;
  outline:none;cursor:pointer;margin-top:4px;
}
.sp-select:focus{border-color:${accent};}

.sp-cl-item{
  padding:4px 0;border-bottom:1px solid ${P.navy};
  font-family:'Rajdhani',sans-serif;font-size:12px;color:${P.muted};
  display:flex;gap:6px;align-items:flex-start;
}
.sp-cl-item:last-child{border-bottom:none;}
.sp-cl-dot{flex-shrink:0;margin-top:5px;width:4px;height:4px;border-radius:50%;background:${displayAccent};}
`;
}

// ── Pixel cursor ──────────────────────────────────────────────────
function PixelCursor({ accent }) {
  const ring = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(hover:none)").matches) return;
    let mx = 0, my = 0, rx = 0, ry = 0, raf;
    const mv = (e) => { mx = e.clientX; my = e.clientY; };
    const draw = () => {
      rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
      if (ring.current) { ring.current.style.left = rx + "px"; ring.current.style.top = ry + "px"; }
      raf = requestAnimationFrame(draw);
    };
    window.addEventListener("mousemove", mv, { passive: true });
    raf = requestAnimationFrame(draw);
    return () => { window.removeEventListener("mousemove", mv); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ring} style={{
      position:"fixed", width:28, height:28, border:`1px solid ${accent}66`,
      pointerEvents:"none", zIndex:9998, transform:"translate(-14px,-14px)",
      clipPath:"polygon(0 0,40% 0,40% 10%,10% 10%,10% 40%,0 40%,0 60%,10% 60%,10% 90%,40% 90%,40% 100%,60% 100%,60% 90%,90% 90%,90% 60%,100% 60%,100% 40%,90% 40%,90% 10%,60% 10%,60% 0,100% 0,100% 100%,0 100%)",
      background:`${accent}12`,
    }} />
  );
}

// ── Toggle ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return <button className={`sp-toggle${on ? " on" : ""}`} onClick={onToggle} aria-pressed={on} />;
}

// ── Row ───────────────────────────────────────────────────────────
function Row({ Ico, color = P.orange, label, sub, children, noBottom }) {
  return (
    <motion.div variants={SV.item} className="sp-row" style={noBottom ? { borderBottom:"none" } : {}}>
      <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, minWidth:0 }}>
        <div style={{
          width:32, height:32, borderRadius:8, flexShrink:0,
          background:`${color}12`, border:`1px solid ${color}22`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {(()=>{ const I=Ico; return <I size={14} color={color}/>; })()}
        </div>
        <div>
          <div style={{ ...raj(14,600), color:P.white }}>{label}</div>
          {sub && <div style={{ ...raj(11,400), color:P.muted, lineHeight:1.4 }}>{sub}</div>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ── Equalizer ─────────────────────────────────────────────────────
function Equalizer({ active }) {
  if (!active) return <div style={{ width:18 }} />;
  return (
    <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:18, width:18 }}>
      <div className="eq-bar" /><div className="eq-bar" /><div className="eq-bar" />
    </div>
  );
}

// ── Firestore theme vars ──────────────────────────────────────────
function applyThemeVars(id) {
  const t = THEMES[id] || THEMES["wine-aurora"];
  const r = document.documentElement.style;
  document.documentElement.dataset.fvTheme = id;
  r.setProperty("--fv-bg0",    t.bg0);
  r.setProperty("--fv-card",   t.card);
  r.setProperty("--fv-border", t.border);
  r.setProperty("--fv-gold",   t.gold);
  r.setProperty("--fv-blue",   t.blue);
  r.setProperty("--fv-purple", t.purple);
  r.setProperty("--fv-green",  t.green);
  r.setProperty("--fv-text",   t.text);
  r.setProperty("--fv-muted",  t.muted);
}

function emitSettingsChanged(detail) {
  window.__fvSettings = detail;
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail }));
}

// ═════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function SettingsPanel({ user, profile }) {
  const { lang, setLang, t } = useLang();
  const [themeId, setThemeIdRaw] = useState(() => localStorage.getItem("fv_theme") || "wine-aurora");
  const T = THEMES[themeId] || THEMES["wine-aurora"];
  const [accent, setAccentRaw] = useState(() => localStorage.getItem("fv_accent") || T.accent);
  const [sounds, setSounds] = useState({
    clickEnabled: sm.clickEnabled, bgEnabled: sm.bgEnabled,
    bgVolume: sm.bgVolume, currentTrack: sm.currentTrack,
  });
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("fv_reduced_motion") === "1");
  const [streakNotif,   setStreakNotif]   = useState(() => localStorage.getItem("fv_streak_notif") !== "0");
  const [xpPopups,      setXpPopups]      = useState(() => localStorage.getItem("fv_xp_popups") !== "0");
  const [cursor,        setCursorRaw]     = useState(() => localStorage.getItem("fv_cursor") || "normal");
  const [scale,         setScaleRaw]      = useState(() => localStorage.getItem("fv_ui_scale") || "M");

  const [open,          setOpen]          = useState(false);
  const [tab,           setTab]           = useState("audio");
  const [gearSpin,      setGearSpin]      = useState(false);
  const [savedFlash,    setSavedFlash]    = useState(false);
  const [confirmReset,  setConfirmReset]  = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [hasNew,        setHasNew]        = useState(() => localStorage.getItem(SEEN_KEY) !== CURRENT_VER);
  const [hoverAccent,   setHoverAccent]   = useState(null);
  const displayAccent = hoverAccent || accent;

  const panelRef  = useRef(null);
  const syncTimer = useRef(null);
  const getRuntimeSettings = useCallback(() => ({
    themeId,
    accent,
    reducedMotion,
    streakNotif,
    xpPopups,
    cursor,
    scale,
    bgTrack: sounds.currentTrack,
    bgEnabled: sounds.bgEnabled,
    bgVolume: sounds.bgVolume,
    clickEnabled: sounds.clickEnabled,
    lang,
  }), [
    themeId, accent, reducedMotion, streakNotif, xpPopups,
    cursor, scale, sounds.currentTrack, sounds.bgEnabled,
    sounds.bgVolume, sounds.clickEnabled, lang,
  ]);

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => { const unsub = sm.subscribe(setSounds); return unsub; }, []);
  useEffect(() => { applyThemeVars(themeId); localStorage.setItem("fv_theme", themeId); window.dispatchEvent(new CustomEvent("fv-theme-changed")); }, [themeId]);
  useEffect(() => {
    document.documentElement.style.setProperty("--fv-accent", accent);
    document.documentElement.dataset.fvAccent = accent;
    localStorage.setItem("fv_accent", accent);
    window.dispatchEvent(new CustomEvent("fv-theme-changed"));
  }, [accent]);
  useEffect(() => {
    document.body.classList.toggle("fv-reduced-motion", reducedMotion);
    document.documentElement.dataset.fvReducedMotion = reducedMotion ? "1" : "0";
    localStorage.setItem("fv_reduced_motion", reducedMotion ? "1" : "0");
  }, [reducedMotion]);
  useEffect(() => {
    const px = SCALE_OPTS.find(s => s.id === scale)?.px ?? 16;
    document.documentElement.style.fontSize = px + "px";
    document.documentElement.dataset.fvUiScale = scale;
    localStorage.setItem("fv_ui_scale", scale);
  }, [scale]);
  useEffect(() => {
    document.documentElement.dataset.fvCursor = cursor;
    localStorage.setItem("fv_cursor", cursor);
  }, [cursor]);
  useEffect(() => {
    emitSettingsChanged(getRuntimeSettings());
  }, [getRuntimeSettings]);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const s = snap.data()?.settings;
        if (!s) return;
        if (s.themeId && THEMES[s.themeId]) { setThemeIdRaw(s.themeId); applyThemeVars(s.themeId); localStorage.setItem("fv_theme", s.themeId); }
        if (s.accent)  { setAccentRaw(s.accent); document.documentElement.style.setProperty("--fv-accent", s.accent); localStorage.setItem("fv_accent", s.accent); }
        if (s.reducedMotion !== undefined) setReducedMotion(s.reducedMotion);
        if (s.streakNotif   !== undefined) setStreakNotif(s.streakNotif);
        if (s.xpPopups      !== undefined) setXpPopups(s.xpPopups);
        if (s.cursor) setCursorRaw(s.cursor);
        if (s.scale)  { setScaleRaw(s.scale); const px = SCALE_OPTS.find(o => o.id === s.scale)?.px ?? 16; document.documentElement.style.fontSize = px + "px"; }
        if (s.clickEnabled !== undefined) sm.setClickEnabled(Boolean(s.clickEnabled));
        if (s.bgEnabled    !== undefined) sm.setBgEnabled(Boolean(s.bgEnabled));
        if (typeof s.bgVolume === "number") sm.setBgVolume(s.bgVolume);
        if (s.bgTrack) sm.setTrack(s.bgTrack);
        if (s.lang) setLang(s.lang);
      } catch (_) {}
    })();
  }, [user?.uid]);

  useEffect(() => {
    const onKey = (e) => {
      const inInput = ["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName) || e.target.isContentEditable;
      if (e.key === "Escape" && open) { sm.playClick(); setOpen(false); return; }
      if (!inInput && (e.key === "s" || e.key === ",")) { e.preventDefault(); setOpen(o => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const sel = 'button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])';
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const nodes = [...el.querySelectorAll(sel)];
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);

  // ── Helpers ───────────────────────────────────────────────────
  const flash = useCallback(() => {
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1100);
  }, []);

  const syncFirestore = useCallback((patch) => {
    if (!user?.uid) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try { await setDoc(doc(db, "users", user.uid), { settings: patch }, { merge: true }); }
      catch (_) {}
    }, 2000);
  }, [user?.uid]);

  const currentSettings = getRuntimeSettings;

  const saveAndSync = useCallback((patch) => {
    const next = { ...currentSettings(), ...patch };
    flash();
    emitSettingsChanged(next);
    syncFirestore(next);
  }, [flash, syncFirestore, currentSettings]);

  const setTheme = useCallback((id) => {
    sm.playClick(); setThemeIdRaw(id);
    const na = THEMES[id].accent;
    setAccentRaw(na);
    document.documentElement.style.setProperty("--fv-accent", na);
    localStorage.setItem("fv_accent", na);
    saveAndSync({ themeId: id, accent: na });
  }, [saveAndSync]);

  const setAccent  = useCallback((val) => { sm.playClick(); setAccentRaw(val); saveAndSync({ accent: val }); }, [saveAndSync]);
  const setCursor  = useCallback((val) => { sm.playAltClick(); setCursorRaw(val); saveAndSync({ cursor: val }); }, [saveAndSync]);
  const setScale   = useCallback((val) => { sm.playAltClick(); setScaleRaw(val); saveAndSync({ scale: val }); }, [saveAndSync]);
  const toggleClick = useCallback(() => {
    sm.playClick();
    sm.toggleClick();
    saveAndSync({ clickEnabled: !sounds.clickEnabled });
  }, [saveAndSync, sounds.clickEnabled]);
  const toggleBg = useCallback(() => {
    sm.playClick();
    sm.toggleBg();
    saveAndSync({ bgEnabled: !sounds.bgEnabled });
  }, [saveAndSync, sounds.bgEnabled]);

  const mkToggle = (setter, getter, key, alt = false) => () => {
    if (alt) sm.playAltClick(); else sm.playClick();
    const next = !getter;
    setter(next);
    localStorage.setItem(key, next ? "1" : "0");
    const remoteKey = FIRESTORE_KEY_MAP[key] || key.replace("fv_", "");
    saveAndSync({ [remoteKey]: next });
  };

  const doReset = useCallback(() => {
    sm.playClick();
    setThemeIdRaw(DEFAULTS.themeId); applyThemeVars(DEFAULTS.themeId);
    setAccentRaw(DEFAULTS.accent);
    document.documentElement.style.setProperty("--fv-accent", DEFAULTS.accent);
    document.documentElement.style.fontSize = "16px";
    setReducedMotion(false); setStreakNotif(true); setXpPopups(true);
    setCursorRaw(DEFAULTS.cursor); setScaleRaw(DEFAULTS.scale);
    sm.setClickEnabled(DEFAULTS.clickEnabled);
    sm.setBgEnabled(DEFAULTS.bgEnabled);
    sm.setBgVolume(DEFAULTS.bgVolume);
    sm.setTrack(DEFAULTS.bgTrack);
    setLang(DEFAULTS.lang);
    Object.entries({
      fv_theme: DEFAULTS.themeId, fv_accent: DEFAULTS.accent,
      fv_reduced_motion: "0", fv_streak_notif: "1", fv_xp_popups: "1",
      fv_cursor: DEFAULTS.cursor, fv_ui_scale: DEFAULTS.scale,
      fv_lang: DEFAULTS.lang,
    }).forEach(([k, v]) => localStorage.setItem(k, v));
    setConfirmReset(false);
    syncFirestore(DEFAULTS);
    emitSettingsChanged(DEFAULTS);
    flash();
  }, [flash, syncFirestore, setLang]);

  const openPanel = useCallback(() => {
    sm.playClick(); setOpen(o => !o);
    if (hasNew) { setHasNew(false); localStorage.setItem(SEEN_KEY, CURRENT_VER); }
  }, [hasNew]);

  // ── Derived ───────────────────────────────────────────────────
  const visibleTabs = ALL_TABS.filter(tb => !tb.auth || user);
  const volPct      = Math.round(sounds.bgVolume * 100);
  const xp          = profile?.xp ?? 0;
  const nivel       = profile?.nivel ?? 1;
  const xpNext      = profile?.xpSiguienteNivel ?? nivel * 100;
  const xpPct       = Math.min(100, Math.round((xp / xpNext) * 100));
  const ClassIco    = CLASS_ICONS[profile?.heroClass] || Shield;

  return (
    <>
      <style>{buildCSS(accent, displayAccent, cursor)}</style>

      {cursor === "pixel" && <PixelCursor accent={accent} />}

      {/* Saved flash */}
      <AnimatePresence>
        {savedFlash && (
          <motion.div
            key="sp-saved"
            initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
            transition={{ duration:.22 }}
            style={{
              position:"fixed", bottom:80, right:24, zIndex:9900,
              background:`${accent}18`, border:`1px solid ${accent}66`,
              color:accent, ...orb(8), padding:"6px 12px",
              borderRadius:8, pointerEvents:"none", letterSpacing:".1em",
              display:"flex", alignItems:"center", gap:6,
            }}
          >
            <Check size={11} color={accent}/> {t("sp.saved")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sp-backdrop"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:.2 }}
            onClick={() => { sm.playClick(); setOpen(false); }}
            style={{ position:"fixed", inset:0, zIndex:9798, background:"rgba(0,0,0,0.3)" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Gear button ── */}
      <motion.button
        onClick={openPanel}
        onMouseEnter={() => setGearSpin(true)}
        onMouseLeave={() => setGearSpin(false)}
        whileTap={{ scale: 0.88 }}
        title={t("sp.shortcut")}
        style={{
          position:"fixed", top:16, right:16, zIndex:9800,
          width:44, height:44, borderRadius:12,
          background: open ? `${P.orange}18` : P.card,
          border:`1.5px solid ${open ? P.orange : P.navy}`,
          cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: open ? `0 0 18px ${P.orange}33` : "0 2px 12px rgba(0,0,0,0.5)",
          transition:"background .25s, border-color .25s, box-shadow .25s",
        }}
      >
        <Settings
          size={17} color={open ? P.orange : P.muted}
          style={{ transition:"color .25s", animation: gearSpin ? "sp-spin .7s linear infinite" : "none" }}
        />
        {hasNew && (
          <span style={{
            position:"absolute", top:2, right:2, width:8, height:8, borderRadius:"50%",
            background:P.red, border:`1.5px solid ${P.bg}`,
            boxShadow:`0 0 6px ${P.red}88`,
          }} />
        )}
      </motion.button>

      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="sp-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("sp.aria")}
            initial={{ opacity:0, x:80 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:80 }}
            transition={{ type:"spring", stiffness:340, damping:32 }}
            drag="x"
            dragConstraints={{ left:0, right:0 }}
            dragElastic={{ left:0, right:0.35 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x > 70) { sm.playClick(); setOpen(false); }
            }}
            style={{
              position:"fixed", top:70, right:16, zIndex:9799,
              width:"min(320px, calc(100vw - 32px))",
              maxHeight:"calc(100vh - 90px)", overflowY:"auto",
              background:`rgba(10,14,26,0.96)`,
              backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
              border:`1px solid ${P.navy}`,
              borderTop:`2px solid ${displayAccent}`,
              borderRadius:16,
              boxShadow:`0 8px 40px rgba(0,0,0,0.7), 0 0 40px ${displayAccent}18`,
              padding:"18px 20px 20px",
              scrollbarWidth:"thin", scrollbarColor:`${P.navy} transparent`,
              touchAction:"pan-y",
              transition:"border-top-color .18s, box-shadow .18s",
            }}
          >
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{
                width:34, height:34, borderRadius:9,
                background:`${displayAccent}14`, border:`1px solid ${displayAccent}44`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                boxShadow:`0 0 12px ${displayAccent}28`,
                transition:"background .18s, box-shadow .18s",
              }}>
                <Settings size={16} color={displayAccent} style={{ transition:"color .18s" }}/>
              </div>
              <div>
                <div style={{ ...orb(11,700), color:P.white, letterSpacing:".08em" }}>
                  {t("sp.title")}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:1 }}>
                  <span style={{ ...raj(11,500), color:P.muted }}>{t("sp.ver_prefix")} {CURRENT_VER}</span>
                  <span className="sp-kbd">S</span>
                </div>
              </div>
              <button
                onClick={() => { sm.playClick(); setOpen(false); }}
                style={{
                  marginLeft:"auto", background:"none",
                  border:`1px solid ${P.navy}`, borderRadius:6,
                  color:P.muted, width:28, height:28, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"border-color .18s, color .18s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=P.navyL; e.currentTarget.style.color=P.white; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=P.navy;  e.currentTarget.style.color=P.muted; }}
              >
                <X size={13}/>
              </button>
            </div>

            {/* Tab bar */}
            <div className="sp-tab-bar">
              {visibleTabs.map(tb => (
                <button
                  key={tb.id}
                  className="sp-tab-btn"
                  onClick={() => { sm.playClick(); setTab(tb.id); setConfirmReset(false); }}
                  style={{ color: tab === tb.id ? P.white : P.muted }}
                >
                  {tab === tb.id && (
                    <motion.div
                      layoutId="sp-tab-pill"
                      style={{
                        position:"absolute", inset:0, borderRadius:7,
                        background:`${accent}1A`, border:`1px solid ${accent}55`,
                      }}
                      transition={{ type:"spring", stiffness:400, damping:30 }}
                    />
                  )}
                  <span style={{ position:"relative" }}>
                    {(()=>{ const I=tb.Ico; return <I size={13} color={tab===tb.id ? accent : P.muted}/>; })()}
                  </span>
                  <span style={{ ...orb(7), letterSpacing:".06em", position:"relative" }}>
                    {t(tb.key).toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-8 }}
                transition={{ duration:.18 }}
              >

                {/* ── AUDIO ── */}
                {tab === "audio" && (
                  <motion.div variants={SV.container} initial="hidden" animate="show">
                    <Row Ico={MousePointer2} color={P.blue} label={t("sp.audio.click")} sub={t("sp.audio.click_sub")}>
                      <Toggle on={sounds.clickEnabled} onToggle={toggleClick} />
                    </Row>
                    <Row Ico={Music} color={P.teal} label={t("sp.audio.music")} sub={t("sp.audio.music_sub")}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Equalizer active={sounds.bgEnabled} />
                        <Toggle on={sounds.bgEnabled} onToggle={toggleBg} />
                      </div>
                    </Row>
                    {sounds.bgEnabled && (
                      <motion.div variants={SV.item} style={{ paddingBottom:4 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, marginTop:8 }}>
                          <span style={{ ...raj(12,500), color:P.muted }}>{t("sp.audio.volume")}</span>
                          <span style={{ ...orb(10), color:accent }}>{volPct}%</span>
                        </div>
                        <input
                          type="range" min={0} max={1} step={0.05}
                          value={sounds.bgVolume} className="sp-vol"
                          style={{ "--pct":`${volPct}%` }}
                          onChange={e => {
                            const nextVol = parseFloat(e.target.value);
                            sm.setBgVolume(nextVol);
                            saveAndSync({ bgVolume: nextVol });
                          }}
                        />
                      </motion.div>
                    )}
                    <motion.div variants={SV.item} style={{ paddingTop:8 }}>
                      <div style={{ ...raj(12,500), color:P.muted, marginBottom:2 }}>{t("sp.audio.track")}</div>
                      <select
                        className="sp-select"
                        value={sounds.currentTrack}
                        onChange={e => { sm.setTrack(e.target.value); saveAndSync({ bgTrack: e.target.value }); }}
                      >
                        {TRACKS.map(tr => (
                          <option key={tr.id} value={tr.id}>{tr.label}</option>
                        ))}
                      </select>
                    </motion.div>
                  </motion.div>
                )}

                {/* ── VISUAL ── */}
                {tab === "visual" && (
                  <motion.div variants={SV.container} initial="hidden" animate="show">

                    {/* Language picker */}
                    <motion.div variants={SV.item} style={{ paddingBottom:12, marginBottom:4, borderBottom:`1px solid ${P.navy}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                        <Globe size={13} color={P.blue}/>
                        <span className="sp-section-label" style={{ marginBottom:0 }}>{t("sp.visual.lang")}</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                        {LANGS.map(lng => (
                          <button
                            key={lng.code}
                            onClick={() => { sm.playClick(); setLang(lng.code); saveAndSync({ lang: lng.code }); }}
                            style={{
                              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                              padding:"7px 8px", borderRadius:8, cursor:"pointer",
                              background: lang === lng.code ? `${accent}18` : P.panel,
                              border:`1.5px solid ${lang === lng.code ? accent : P.navy}`,
                              color: lang === lng.code ? accent : P.muted,
                              boxShadow: lang === lng.code ? `0 0 8px ${accent}33` : "none",
                              transition:"all .18s",
                            }}
                          >
                            <span style={{ fontSize:14 }}>{lng.flag}</span>
                            <span style={{ ...raj(12,600), letterSpacing:".03em" }}>{lng.label}</span>
                            {lang === lng.code && <Check size={10} color={accent}/>}
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={SV.item}>
                      <div className="sp-section-label">{t("sp.visual.theme")}</div>
                      <div style={{ display:"flex", gap:5, marginBottom:12 }}>
                        {Object.entries(THEMES).map(([id, theme]) => (
                          <button
                            key={id}
                            className={`sp-theme-card${themeId === id ? " active" : ""}`}
                            onClick={() => setTheme(id)}
                            style={{
                              background: themeId === id ? `${accent}12` : P.panel,
                              border:`1.5px solid ${themeId === id ? accent : P.navy}`,
                            }}
                          >
                            <div style={{ fontSize:15 }}>{theme.icon}</div>
                            <div style={{
                              ...orb(6), color: themeId === id ? accent : P.muted,
                              marginTop:3, letterSpacing:".04em",
                            }}>
                              {theme.label.split(" ")[0].toUpperCase()}
                            </div>
                            <div style={{ display:"flex", gap:2, justifyContent:"center", marginTop:5 }}>
                              {[theme.accent, theme.blue, theme.green].map(c => (
                                <div key={c} style={{ width:5, height:5, borderRadius:"50%", background:c }} />
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={SV.item}>
                      <div className="sp-section-label">{t("sp.visual.accent")}</div>
                      <div style={{ display:"flex", gap:10, alignItems:"center", paddingBottom:10, borderBottom:`1px solid ${P.navy}` }}>
                        {ACCENT_PRESETS.map(p => (
                          <button
                            key={p.value}
                            className={`sp-accent-dot${accent === p.value ? " active" : ""}`}
                            style={{ background:p.value, boxShadow: accent === p.value ? `0 0 10px ${p.glow}` : "none" }}
                            title={p.label}
                            onClick={() => setAccent(p.value)}
                            onMouseEnter={() => setHoverAccent(p.value)}
                            onMouseLeave={() => setHoverAccent(null)}
                          />
                        ))}
                        <label
                          title={t("sp.visual.accent_custom")}
                          style={{ position:"relative", cursor:"pointer" }}
                          onMouseEnter={() => setHoverAccent(accent)}
                          onMouseLeave={() => setHoverAccent(null)}
                        >
                          <div style={{
                            width:24, height:24, borderRadius:"50%",
                            background:"conic-gradient(#C9184A,#4CC9F0,#7C3AED,#22C55E,#C9184A)",
                            border:"2px solid transparent", transition:"all .2s",
                          }} />
                          <input
                            type="color" value={accent}
                            onChange={e => setAccent(e.target.value)}
                            style={{ position:"absolute", inset:0, opacity:0, width:"100%", height:"100%", cursor:"pointer" }}
                          />
                        </label>
                      </div>
                    </motion.div>

                    <motion.div variants={SV.item}>
                      <div className="sp-section-label">{t("sp.visual.cursor")}</div>
                      <div style={{ display:"flex", gap:5, marginBottom:8 }}>
                        {CURSOR_OPTS.map(opt => (
                          <button key={opt.id} className="sp-cursor-btn"
                            onClick={() => setCursor(opt.id)}
                            style={{
                              background: cursor === opt.id ? `${accent}18` : P.panel,
                              border:`1.5px solid ${cursor === opt.id ? accent : P.navy}`,
                              color: cursor === opt.id ? accent : P.muted,
                              boxShadow: cursor === opt.id ? `0 0 8px ${accent}33` : "none",
                            }}
                          >
                            {(()=>{ const I=opt.Ico; return <I size={15} color={cursor===opt.id ? accent : P.muted}/>; })()}
                            <span>{t(opt.key)}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={SV.item}>
                      <div className="sp-section-label">{t("sp.visual.scale")}</div>
                      <div style={{ display:"flex", gap:5, marginBottom:8 }}>
                        {SCALE_OPTS.map(opt => (
                          <button key={opt.id} className="sp-scale-btn"
                            onClick={() => setScale(opt.id)}
                            style={{
                              background: scale === opt.id ? `${accent}18` : P.panel,
                              border:`1.5px solid ${scale === opt.id ? accent : P.navy}`,
                              color: scale === opt.id ? accent : P.muted,
                              boxShadow: scale === opt.id ? `0 0 8px ${accent}33` : "none",
                            }}
                          >
                            <span style={{ ...raj(opt.id === "S" ? 14 : opt.id === "M" ? 17 : 21, 700), color: scale === opt.id ? accent : P.mutedL }}>Aa</span>
                            <span>{opt.id}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <Row Ico={Zap} color={P.purple} label={t("sp.visual.motion")} sub={t("sp.visual.motion_sub")}>
                      <Toggle on={reducedMotion} onToggle={mkToggle(setReducedMotion, reducedMotion, "fv_reduced_motion", true)} />
                    </Row>
                  </motion.div>
                )}

                {/* ── JUEGO ── */}
                {tab === "juego" && user && (
                  <motion.div variants={SV.container} initial="hidden" animate="show">
                    <Row Ico={Bell} color={P.orange} label={t("sp.game.streak")} sub={t("sp.game.streak_sub")}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <button
                          onClick={() => {
                            sm.playClick();
                            toast.warning(t("sp.game.streak_toast"), { duration: 4000 });
                          }}
                          style={{
                            padding:"3px 8px", borderRadius:5,
                            background:`${accent}18`, border:`1px solid ${accent}55`,
                            color:accent, ...orb(7), cursor:"pointer", letterSpacing:".05em",
                            whiteSpace:"nowrap",
                          }}
                        >
                          {t("sp.game.test")}
                        </button>
                        <Toggle on={streakNotif} onToggle={mkToggle(setStreakNotif, streakNotif, "fv_streak_notif")} />
                      </div>
                    </Row>
                    <Row Ico={Zap} color={P.gold} label={t("sp.game.xp")} sub={t("sp.game.xp_sub")}>
                      <Toggle on={xpPopups} onToggle={mkToggle(setXpPopups, xpPopups, "fv_xp_popups")} />
                    </Row>
                  </motion.div>
                )}

                {/* ── CUENTA ── */}
                {tab === "cuenta" && user && (
                  <motion.div variants={SV.container} initial="hidden" animate="show">
                    {/* Hero card */}
                    <motion.div variants={SV.item} style={{
                      padding:"14px", background:P.panel, borderRadius:12,
                      border:`1px solid ${P.navy}`, borderTop:`2px solid ${accent}44`,
                      display:"flex", gap:12, alignItems:"center", marginBottom:12,
                    }}>
                      <div style={{
                        width:46, height:46, borderRadius:12,
                        background:`${accent}14`, border:`1px solid ${accent}44`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0, boxShadow:`0 0 16px ${accent}28`,
                      }}>
                        <ClassIco size={22} color={accent}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ ...raj(14,700), color:P.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {profile?.nombre || t("common.adventurer")}
                        </div>
                        <div style={{ ...raj(11,500), color:P.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:7 }}>
                          {user?.email}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ flex:1, height:3, background:P.navy, borderRadius:99, overflow:"hidden" }}>
                            <motion.div
                              initial={{ width:0 }} animate={{ width:`${xpPct}%` }}
                              transition={{ duration:.8, ease:"easeOut" }}
                              style={{ height:"100%", background:`linear-gradient(to right,${accent},${P.gold})`, borderRadius:99 }}
                            />
                          </div>
                          <span style={{ ...orb(7), color:accent, whiteSpace:"nowrap", flexShrink:0 }}>
                            LV {nivel} · {xp}/{xpNext}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Cloud sync */}
                    <motion.div variants={SV.item} style={{
                      display:"flex", alignItems:"center", gap:7, marginBottom:12,
                      ...raj(11,500), color:P.muted,
                    }}>
                      <Cloud size={12} color={P.green}/>
                      <span>{t("sp.account.cloud")}</span>
                    </motion.div>

                    {/* Logout */}
                    <motion.div variants={SV.item}>
                      <button
                        onClick={() => { sm.playClick(); import("../../firebase").then(({ auth }) => auth.signOut()); }}
                        style={{
                          width:"100%", padding:"10px", borderRadius:8, marginBottom:8,
                          background:"transparent", border:`1px solid ${P.red}44`,
                          ...raj(13,700), color:P.red, cursor:"pointer",
                          letterSpacing:".05em", transition:"all .2s",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background=`${P.red}14`; e.currentTarget.style.borderColor=P.red; }}
                        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=`${P.red}44`; }}
                      >
                        <LogOut size={13}/> {t("sp.account.logout")}
                      </button>
                    </motion.div>

                    {/* Reset */}
                    <motion.div variants={SV.item}>
                      <AnimatePresence mode="wait">
                        {!confirmReset ? (
                          <motion.button
                            key="reset-btn"
                            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            onClick={() => { sm.playClick(); setConfirmReset(true); }}
                            style={{
                              width:"100%", padding:"9px", borderRadius:8, marginBottom:12,
                              background:"transparent", border:`1px solid ${P.navy}`,
                              ...raj(12,600), color:P.muted, cursor:"pointer", letterSpacing:".04em",
                              display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                            }}
                          >
                            <RotateCcw size={12}/> {t("sp.account.reset")}
                          </motion.button>
                        ) : (
                          <motion.div
                            key="reset-confirm"
                            initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                            style={{
                              background:`${P.red}0E`, border:`1px solid ${P.red}33`,
                              borderRadius:10, padding:"12px 14px", marginBottom:12,
                            }}
                          >
                            <div style={{ ...raj(12,500), color:P.white, marginBottom:10, textAlign:"center" }}>
                              {t("sp.account.reset_confirm")}
                            </div>
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={doReset} style={{
                                flex:1, padding:"8px", borderRadius:7,
                                background:P.red, border:"none",
                                ...raj(12,700), color:P.bg, cursor:"pointer",
                              }}>
                                {t("sp.account.confirm")}
                              </button>
                              <button onClick={() => { sm.playClick(); setConfirmReset(false); }} style={{
                                flex:1, padding:"8px", borderRadius:7,
                                background:"transparent", border:`1px solid ${P.navy}`,
                                ...raj(12,600), color:P.muted, cursor:"pointer",
                              }}>
                                {t("sp.account.cancel")}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Changelog */}
                    <motion.div variants={SV.item}>
                      <button
                        onClick={() => { sm.playClick(); setChangelogOpen(o => !o); }}
                        style={{
                          width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                          background:P.panel, border:`1px solid ${P.navy}`,
                          borderRadius:8, padding:"9px 12px", cursor:"pointer",
                        }}
                      >
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <List size={12} color={P.muted}/>
                          <span style={{ ...orb(7), color:P.muted, letterSpacing:".08em" }}>{t("sp.account.news")} {CURRENT_VER}</span>
                        </div>
                        <motion.div
                          animate={{ rotate: changelogOpen ? 180 : 0 }}
                          transition={{ duration:.2 }}
                        >
                          <ChevronDown size={13} color={P.muted}/>
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {changelogOpen && (
                          <motion.div
                            key="cl-open"
                            initial={{ height:0, opacity:0 }}
                            animate={{ height:"auto", opacity:1 }}
                            exit={{ height:0, opacity:0 }}
                            transition={{ duration:.22 }}
                            style={{ overflow:"hidden" }}
                          >
                            {CHANGELOG.map(entry => (
                              <div key={entry.ver} style={{ padding:"10px 4px 4px" }}>
                                <div style={{ ...orb(7), color:accent, letterSpacing:".1em", marginBottom:6 }}>
                                  {entry.ver} · {entry.date}
                                </div>
                                {entry.items.map(item => (
                                  <div key={item} className="sp-cl-item">
                                    <div className="sp-cl-dot" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div style={{
              marginTop:16, textAlign:"center", borderTop:`1px solid ${P.navy}`, paddingTop:12,
            }}>
              <div style={{ ...px8(6), color:P.muted, letterSpacing:".1em" }}>FORGEVENTURE {CURRENT_VER}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
