// src/design/system.js — ForgeVenture central design system
// All sub-pages import from here instead of duplicating tokens locally.

import { memo, useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useSpring, useReducedMotion } from "framer-motion";

// ── Font injection (runs once) ──────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("fv-ds-fonts")) {
  const l = document.createElement("link");
  l.id = "fv-ds-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800;900&family=VT323&display=swap";
  document.head.appendChild(l);
}

// ── Palette — morado (purple dark, modern RPG) ──────────────────
export const P = {
  bg0:    "#08051A",
  bg1:    "#14092A",
  bg2:    "#2A1050",
  accent: "#A55EEA",
  accent2:"#D4B4FF",
  gold:   "#FFD166",
  glow:   "#4A1E7A",
  navy:   "#1C1040",
  line:   "#2A1550",
  text:   "#F0E6FF",
  muted:  "#9080B0",
  mutedL: "#B0A0C8",
};

// ── Typography helpers ──────────────────────────────────────────
export const mono = (s, w = 500) => ({
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize:   typeof s === "number" ? `${s}px` : s,
  fontWeight: w,
});
export const sans = (s, w = 400) => ({
  fontFamily: "'Manrope', sans-serif",
  fontSize:   typeof s === "number" ? `${s}px` : s,
  fontWeight: w,
});
export const disp = (s, w = 700) => ({
  fontFamily:    "'Manrope', sans-serif",
  fontSize:      typeof s === "number" ? `${s}px` : s,
  fontWeight:    w,
  letterSpacing: "-.02em",
});

// ── Glassmorphism helper ────────────────────────────────────────
// opacity controls bg1 alpha layer (0–1). Returns style object.
export function glass(opacity = 0.75) {
  const hex = Math.round(opacity * 255).toString(16).padStart(2, "0");
  return {
    background:           `linear-gradient(135deg, ${P.bg1}${hex}, ${P.bg2}aa)`,
    backdropFilter:       "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border:               `1px solid ${P.line}`,
  };
}

// ── Easing presets ──────────────────────────────────────────────
export const EASE = [0.22, 1, 0.36, 1];

// ══════════════════════════════════════════════════════════════
// VISUAL COMPONENTS
// ══════════════════════════════════════════════════════════════

// ── Aurora — 3 animated background blobs ───────────────────────
export const Aurora = memo(function Aurora() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0,
      background: `radial-gradient(ellipse at 0% 0%, ${P.bg2} 0%, transparent 55%),
                   radial-gradient(ellipse at 100% 100%, ${P.glow}55 0%, transparent 60%),
                   linear-gradient(180deg, ${P.bg0}, ${P.bg1})`,
      overflow: "hidden", pointerEvents: "none",
    }}>
      <motion.div
        animate={{ x: [0, 120, -80, 0], y: [0, -60, 90, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", width: 720, height: 720, left: "8%", top: "12%",
          borderRadius: "50%", filter: "blur(100px)", opacity: 0.45,
          background: `radial-gradient(circle, ${P.accent}44 0%, transparent 70%)` }}
      />
      <motion.div
        animate={{ x: [0, -90, 60, 0], y: [0, 80, -50, 0], scale: [1, 0.88, 1.12, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", width: 600, height: 600, right: "5%", top: "30%",
          borderRadius: "50%", filter: "blur(100px)", opacity: 0.38,
          background: `radial-gradient(circle, ${P.bg2}88 0%, transparent 70%)` }}
      />
      <motion.div
        animate={{ x: [0, 70, -95, 0], y: [0, -85, 40, 0], scale: [1, 1.09, 0.93, 1] }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", width: 520, height: 520, left: "38%", bottom: "8%",
          borderRadius: "50%", filter: "blur(100px)", opacity: 0.35,
          background: `radial-gradient(circle, ${P.gold}33 0%, transparent 70%)` }}
      />
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${P.line}22 1px, transparent 1px), linear-gradient(90deg, ${P.line}22 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
      }} />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${P.bg0}cc 100%)`,
      }} />
    </div>
  );
});

// ── PixelRain — VT323 canvas rain ──────────────────────────────
export const PixelRain = memo(function PixelRain() {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  useEffect(() => {
    if (reduced) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const GLYPHS = "01▲◆●⚔⚡◉";
    const COLS_W = 16;
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;
    const cols = Math.floor(w / COLS_W);
    const drops = Array.from({ length: cols }, () => Math.random() * -h);
    const COLORS = [P.accent, P.accent2, P.gold];
    const colColors = Array.from({ length: cols }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
    let raf;
    const draw = () => {
      ctx.fillStyle = "rgba(8,5,26,0.08)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `14px 'VT323', monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        ctx.globalAlpha = 0.35 + Math.random() * 0.4;
        ctx.fillStyle = colColors[i];
        ctx.fillText(ch, i * COLS_W, drops[i]);
        drops[i] += 14 + Math.random() * 6;
        if (drops[i] > h + 20) drops[i] = Math.random() * -200;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [reduced]);
  if (reduced) return null;
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.35, mixBlendMode: "screen" }} />;
});

// ── Embers — 60 floating particles ─────────────────────────────
export const Embers = memo(function Embers() {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  useEffect(() => {
    if (reduced) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let w = c.width = window.innerWidth;
    let h = c.height = window.innerHeight;
    const COLORS = [P.accent, P.accent2, P.gold, "#c77dff", "#e0aa44"];
    const parts = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(0.15 + Math.random() * 0.35),
      r: 0.6 + Math.random() * 1.6,
      a: 0.15 + Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.a * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [reduced]);
  if (reduced) return null;
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />;
});

// ── ScrollProgress — spring-animated top bar ───────────────────
export function ScrollProgress({ containerRef }) {
  const { scrollYProgress } = useScroll({ container: containerRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2, zIndex: 60,
      transformOrigin: "left", scaleX,
      background: `linear-gradient(90deg, ${P.accent}, ${P.accent2}, ${P.gold})`,
      boxShadow: `0 0 10px ${P.accent}88`,
    }} />
  );
}

// ── Reveal — fade+slide-up on viewport entry ────────────────────
export function Reveal({ children, delay = 0, y = 28, className = "", style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >{children}</motion.div>
  );
}

// ── Counter — animated number on viewport entry ─────────────────
export function Counter({ to, suffix = "", duration = 1.4 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const end = parseInt(to, 10) || 0;
    if (end === 0) { setVal(to); return; }
    let start = 0;
    const step = Math.max(1, Math.floor(end / (duration * 40)));
    const iv = setInterval(() => {
      start = Math.min(start + step, end); setVal(start);
      if (start >= end) clearInterval(iv);
    }, (duration * 1000) / 40);
    return () => clearInterval(iv);
  }, [inView, to, duration]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{inView ? (typeof to === "string" && isNaN(parseInt(to, 10)) ? to : val + suffix) : "0"}</span>;
}

// ── Brackets — corner bracket decoration ───────────────────────
export function Brackets({ color = P.accent, size = 16, thickness = 2 }) {
  const base = { position: "absolute", width: size, height: size, pointerEvents: "none" };
  return (
    <>
      <div style={{ ...base, top: -6, left: -6, borderTop: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }} />
      <div style={{ ...base, top: -6, right: -6, borderTop: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }} />
      <div style={{ ...base, bottom: -6, left: -6, borderBottom: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }} />
      <div style={{ ...base, bottom: -6, right: -6, borderBottom: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }} />
    </>
  );
}

// ── SectionLabel — numbered section divider ─────────────────────
export function SectionLabel({ num, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <span style={{ ...mono(10, 700), color: P.accent, letterSpacing: ".12em" }}>{num}</span>
      <span style={{ width: 40, height: 1, background: P.line, flexShrink: 0 }} />
      <span style={{ ...mono(10, 600), color: P.mutedL, letterSpacing: ".16em" }}>{children}</span>
    </div>
  );
}

// ── CustomCursor — lagging crosshair ring ───────────────────────
export function CustomCursor({ enabled = true }) {
  const ring = useRef(null);
  useEffect(() => {
    if (!enabled || (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches)) return;
    let mx = 0, my = 0, rx = 0, ry = 0, raf;
    const mv = (e) => { mx = e.clientX; my = e.clientY; };
    const loop = () => {
      rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
      if (ring.current) { ring.current.style.left = rx + "px"; ring.current.style.top = ry + "px"; }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", mv, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener("mousemove", mv); cancelAnimationFrame(raf); };
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div ref={ring} style={{
      position: "fixed", width: 28, height: 28,
      border: `1px solid ${P.accent}66`, pointerEvents: "none", zIndex: 9998,
      transform: "translate(-14px,-14px)",
      clipPath: "polygon(0 0,40% 0,40% 10%,10% 10%,10% 40%,0 40%,0 60%,10% 60%,10% 90%,40% 90%,40% 100%,60% 100%,60% 90%,90% 90%,90% 60%,100% 60%,100% 40%,90% 40%,90% 10%,60% 10%,60% 0,100% 0,100% 100%,0 100%)",
      background: `${P.accent}12`,
    }} />
  );
}

// ── MiniBar — inline progress bar ──────────────────────────────
export function MiniBar({ val, max, color = P.accent, h = 4 }) {
  const pct = Math.min(Math.round((val / max) * 100), 100);
  return (
    <div style={{ height: h, background: P.bg0, border: `1px solid ${color}22`, overflow: "hidden", borderRadius: 2 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 6px ${color}55` }}
      />
    </div>
  );
}
