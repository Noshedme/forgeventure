// src/pages/PrivacidadPage.jsx — v2 · ForgeVenture Design System v3
import { useEffect, useRef, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import { C, raj, orb } from "../components/admin/config/shared.jsx";

if (typeof document !== "undefined" && !document.getElementById("fv7p-fonts")) {
  const l = document.createElement("link");
  l.id = "fv7p-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;600;700;900&family=Press+Start+2P&display=swap";
  document.head.appendChild(l);
}

const P = {
  bg0: C.bg, bg1: C.side, bg2: C.card,
  accent: C.orange, gold: C.gold,
  navy: C.navy, line: C.navy,
  text: C.white, muted: C.muted, mutedL: C.mutedL,
  blue: C.blue, purple: C.purple, success: C.green, error: C.red,
};

const mono = (s, w = 600) => raj(s, w);

const LAST_UPDATED   = "30 de abril de 2026";
const EFFECTIVE_DATE = "30 de abril de 2026";
const RESPONSABLE = {
  nombre:     "ForgeVenture",
  tipo:       "Plataforma de entrenamiento gamificado",
  ruc:        "XXXXXXXXXXXXXXXXX",
  domicilio:  "Ecuador",
  email:      "legal@forgeventure.ec",
  emailDatos: "datos@forgeventure.ec",
};

const SECTIONS = [
  { id: "responsable",    label: "1. Responsable del Tratamiento" },
  { id: "bases",          label: "2. Fundamento Legal" },
  { id: "datos_rec",      label: "3. Datos que Recopilamos" },
  { id: "finalidades",    label: "4. Finalidades del Tratamiento" },
  { id: "base_legal",     label: "5. Base Legal" },
  { id: "conservacion",   label: "6. Plazos de Conservación" },
  { id: "destinatarios",  label: "7. Destinatarios y Terceros" },
  { id: "transferencias", label: "8. Transferencias Internacionales" },
  { id: "derechos",       label: "9. Derechos ARCO+P" },
  { id: "menores",        label: "10. Menores de Edad" },
  { id: "seguridad",      label: "11. Medidas de Seguridad" },
  { id: "cookies",        label: "12. Cookies" },
  { id: "decisiones",     label: "13. Decisiones Automatizadas" },
  { id: "brechas",        label: "14. Notificación de Brechas" },
  { id: "cambios",        label: "15. Modificaciones" },
  { id: "autoridad",      label: "16. Autoridad de Control" },
  { id: "contacto",       label: "17. Contacto ARCO" },
];

// ── Static ambient background ────────────────────────────────────
const AmbientOrbs = memo(function AmbientOrbs() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
      background: `linear-gradient(160deg,${C.bg} 0%,#080D18 55%,${C.bg} 100%)`,
    }}>
      <div style={{ position: "absolute", top: "5%", right: "8%", width: 680, height: 680,
        background: `radial-gradient(circle, ${C.blue}14 0%, transparent 65%)`, filter: "blur(90px)" }} />
      <div style={{ position: "absolute", bottom: "-5%", left: "4%", width: 600, height: 600,
        background: `radial-gradient(circle, ${C.orange}12 0%, transparent 65%)`, filter: "blur(90px)" }} />
      <div style={{ position: "absolute", top: "40%", left: "35%", width: 400, height: 400,
        background: `radial-gradient(circle, ${C.green}0C 0%, transparent 65%)`, filter: "blur(70px)" }} />
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${C.navy}22 1px, transparent 1px), linear-gradient(90deg, ${C.navy}22 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)" }} />
      <div style={{ position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${C.bg}cc 100%)` }} />
    </div>
  );
});

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 9995,
      transformOrigin: "left", scaleX,
      background: `linear-gradient(90deg, ${C.blue}, ${C.orange}, ${C.gold})`,
    }} />
  );
}

function Reveal({ children, delay = 0, y = 22 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

// ── UI Components ─────────────────────────────────────────────────
function Badge({ children, color = C.blue }) {
  return (
    <span style={{
      display: "inline-block", ...mono(9, 700), letterSpacing: ".08em",
      color, background: `${color}18`, border: `1px solid ${color}44`,
      padding: "2px 8px", marginLeft: 8, verticalAlign: "middle", borderRadius: 4,
    }}>{children}</span>
  );
}

function SectionTitle({ id, children, badge }) {
  return (
    <h2 id={id} style={{
      ...orb("clamp(13px,1.8vw,15px)", 700),
      color: P.text, margin: "40px 0 14px", paddingBottom: 12,
      borderBottom: `1px solid ${C.navy}`, scrollMarginTop: 80,
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <span style={{ color: C.blue, ...mono(10, 700) }}>▸</span>
      {children}
      {badge && <Badge color={badge.color ?? C.blue}>{badge.text}</Badge>}
    </h2>
  );
}

function InfoBox({ children, color = C.blue }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
      border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: "14px 18px", margin: "14px 0",
      ...raj(13, 400), color: P.mutedL, lineHeight: 1.8,
    }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, filter: "blur(10px)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function RightBox({ children }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
      border: `1px solid ${C.green}30`, borderLeft: `3px solid ${C.green}`,
      borderRadius: 10, padding: "14px 18px", margin: "14px 0",
      ...raj(13, 400), color: P.mutedL, lineHeight: 1.8,
    }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%",
        background: `radial-gradient(circle, ${C.green}22 0%, transparent 70%)`, filter: "blur(10px)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function BodyP({ children, style = {} }) {
  return (
    <p style={{ ...raj(14, 400), color: P.mutedL, lineHeight: 1.85, margin: "10px 0", ...style }}>
      {children}
    </p>
  );
}

function Li({ children }) {
  return (
    <li style={{ ...raj(14, 400), color: P.mutedL, lineHeight: 1.8, marginBottom: 7 }}>
      {children}
    </li>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "16px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", ...raj(13, 400) }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                background: "rgba(20,26,42,0.9)",
                color: C.gold, padding: "9px 14px", textAlign: "left",
                ...mono(10, 700), letterSpacing: ".06em",
                border: `1px solid ${C.navy}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? "rgba(6,13,26,0.6)" : "rgba(20,26,42,0.5)",
              transition: "background .15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${C.orange}08`}
              onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? "rgba(6,13,26,0.6)" : "rgba(20,26,42,0.5)"}
            >
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "9px 14px", color: P.mutedL, lineHeight: 1.6,
                  border: `1px solid ${C.navy}66`, verticalAlign: "top",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default function PrivacidadPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(SECTIONS[0].id);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting);
        if (vis.length) setActive(vis[0].target.id);
      },
      { rootMargin: "-15% 0px -75% 0px" }
    );
    document.querySelectorAll("h2[id]").forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; font-family: 'Rajdhani', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.blue}; border-radius: 2px; }
        a { color: ${C.gold}; text-decoration: underline; }
        a:hover { color: ${C.orange}; }
        ul, ol { padding-left: 22px; }
        @media (max-width: 900px) {
          .priv-layout  { grid-template-columns: 1fr !important; }
          .priv-sidebar { display: none !important; }
        }
      `}</style>

      <AmbientOrbs />
      <ScrollProgress />

      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "sticky", top: 0, zIndex: 200,
          background: scrolled ? `${C.bg}ee` : `${C.bg}99`,
          backdropFilter: "blur(18px)",
          borderBottom: `1px solid ${scrolled ? C.navy : "transparent"}`,
          display: "flex", alignItems: "center", gap: 16,
          padding: "0 clamp(16px,5vw,64px)", height: 60,
          transition: "background .3s, border-color .3s",
        }}
      >
        <motion.button onClick={() => navigate(-1)}
          whileHover={{ scale: 1.05, borderColor: `${C.blue}66`, color: C.blue }}
          whileTap={{ scale: 0.93 }}
          style={{
            ...mono(10, 700), color: P.muted, letterSpacing: ".08em",
            background: "rgba(20,26,42,0.7)", border: `1px solid ${C.navy}`,
            backdropFilter: "blur(10px)", borderRadius: 100,
            padding: "7px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            transition: "color .15s, border-color .15s",
          }}
        >← VOLVER</motion.button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          <img src="/logo.png" alt="" style={{ height: 26, width: 26, objectFit: "cover", imageRendering: "pixelated", filter: `drop-shadow(0 0 6px ${C.blue}88)` }} onError={e => e.target.style.display = "none"} />
          <span style={{ ...orb(12, 900), color: P.text }}>FORGE</span>
          <span style={{ ...orb(12, 400), color: C.orange }}>VENTURE</span>
          <span style={{ color: C.navy, fontSize: 16, margin: "0 2px" }}>·</span>
          <span style={{ ...mono(9, 700), color: C.blue, letterSpacing: ".12em" }}>PRIVACIDAD</span>
        </div>

        <motion.button onClick={() => navigate("/terminos")}
          whileHover={{ scale: 1.05, borderColor: `${C.blue}66`, color: C.blue }}
          whileTap={{ scale: 0.93 }}
          style={{
            ...mono(9, 700), color: P.muted, letterSpacing: ".08em",
            background: "rgba(20,26,42,0.7)", border: `1px solid ${C.navy}`,
            backdropFilter: "blur(10px)", borderRadius: 100,
            padding: "7px 14px", cursor: "pointer",
            transition: "color .15s, border-color .15s",
          }}
        >TÉRMINOS →</motion.button>
      </motion.header>

      {/* Hero */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "56px clamp(16px,5vw,64px) 40px", textAlign: "center",
        borderBottom: `1px solid ${C.navy}`,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18,
            background: `${C.blue}10`, border: `1px solid ${C.blue}33`,
            borderRadius: 100, padding: "5px 18px",
            ...mono(9, 700), letterSpacing: ".14em", color: C.blue,
          }}
        >🔒 LOPDP · R.O. 459/2021 · ART. 66.19 CONSTITUCIÓN</motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ ...orb("clamp(24px,5vw,40px)", 900), color: P.text, marginBottom: 12, lineHeight: 1.1 }}
        >
          Política de{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.teal ?? C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Privacidad
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ ...raj(15, 400), color: P.muted, maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.7 }}
        >
          Protección de datos personales conforme a la legislación ecuatoriana vigente.
          Tu privacidad es un derecho fundamental, no una opción comercial.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          {[
            { label: "SECCIONES",   value: "17",          color: C.blue   },
            { label: "VIGENTE",     value: "2026",        color: C.orange },
            { label: "LEY APLICABLE", value: "LOPDP 2021", color: C.green },
          ].map((stat, i) => (
            <div key={i} style={{
              position: "relative", overflow: "hidden",
              background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
              border: `1px solid ${stat.color}22`, borderTop: `2px solid ${stat.color}`,
              borderRadius: 10, padding: "10px 20px", textAlign: "center",
            }}>
              <div style={{ position: "absolute", top: -12, right: -12, width: 48, height: 48, borderRadius: "50%",
                background: `radial-gradient(circle, ${stat.color}22 0%, transparent 70%)`, filter: "blur(8px)", pointerEvents: "none" }} />
              <div style={{ ...orb(13, 800), color: stat.color, marginBottom: 2 }}>{stat.value}</div>
              <div style={{ ...mono(8, 600), color: P.muted, letterSpacing: ".06em" }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Layout */}
      <div className="priv-layout" style={{
        position: "relative", zIndex: 10,
        display: "grid", gridTemplateColumns: "260px 1fr",
        maxWidth: 1100, margin: "0 auto",
        padding: "0 clamp(16px,3vw,40px)",
      }}>
        {/* Sidebar */}
        <aside className="priv-sidebar" style={{
          position: "sticky", top: 60, height: "calc(100vh - 60px)",
          overflowY: "auto", padding: "24px 0",
          borderRight: `1px solid ${C.navy}`,
        }}>
          <div style={{ ...mono(9, 700), letterSpacing: ".14em", color: P.muted, marginBottom: 12, paddingLeft: 8 }}>CONTENIDO</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              background: active === s.id ? `${C.blue}10` : "none", border: "none",
              borderLeft: `2px solid ${active === s.id ? C.blue : "transparent"}`,
              padding: "7px 14px", cursor: "pointer",
              ...raj(11, active === s.id ? 700 : 500),
              color: active === s.id ? C.gold : P.muted,
              letterSpacing: ".03em", lineHeight: 1.4, transition: "all .15s",
            }}
              onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.color = P.mutedL; }}
              onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.color = P.muted; }}
            >{s.label}</button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ padding: "32px 0 100px 40px" }}>

          <Reveal>
            <SectionTitle id="responsable">1. Responsable del Tratamiento</SectionTitle>
            <InfoBox color={C.orange}>
              <strong style={{ color: C.gold }}>Responsable:</strong> {RESPONSABLE.nombre} — {RESPONSABLE.tipo}<br />
              <strong style={{ color: C.gold }}>Domicilio:</strong> {RESPONSABLE.domicilio}<br />
              <strong style={{ color: C.gold }}>Correo legal:</strong> {RESPONSABLE.email}<br />
              <strong style={{ color: C.gold }}>Correo datos / DPO:</strong> {RESPONSABLE.emailDatos}<br />
              <strong style={{ color: C.gold }}>RUC:</strong> {RESPONSABLE.ruc}
            </InfoBox>
            <BodyP>
              En calidad de <strong style={{ color: P.text }}>Responsable del Tratamiento</strong> según el Artículo 4 de la LOPDP, ForgeVenture
              determina los fines y medios del tratamiento de datos personales de sus usuarios y responde ante la
              Superintendencia de Protección de Datos Personales (SPDP).
            </BodyP>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="bases" badge={{ text: "OBLIGATORIO", color: C.blue }}>2. Fundamento Legal</SectionTitle>
            <BodyP>Esta Política se rige por:</BodyP>
            <ul>
              <Li><strong style={{ color: P.text }}>Constitución del Ecuador</strong> — Art. 66 No. 19 y Art. 92 (habeas data)</Li>
              <Li><strong style={{ color: P.text }}>LOPDP</strong> — R.O. Suplemento 459, 26 de mayo de 2021</Li>
              <Li><strong style={{ color: P.text }}>Reglamento General LOPDP</strong> — Decreto Ejecutivo 1081</Li>
              <Li><strong style={{ color: P.text }}>Norma General de Transferencias Internacionales</strong> — SPDP, enero 2026</Li>
              <Li><strong style={{ color: P.text }}>Ley de Comercio Electrónico</strong> (Ley No. 67) — R.O. Suplemento 557, 17 de abril de 2002</Li>
              <Li><strong style={{ color: P.text }}>Ley Orgánica de Defensa del Consumidor</strong> (Ley No. 21)</Li>
            </ul>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="datos_rec" badge={{ text: "ART. 12 LOPDP", color: C.blue }}>3. Datos Personales que Recopilamos</SectionTitle>
            <BodyP>Recopilamos únicamente los datos estrictamente necesarios (principio de minimización, Art. 11 LOPDP):</BodyP>
            <Table
              headers={["Categoría", "Dato específico", "Fuente", "Obligatorio"]}
              rows={[
                ["Identificación", "Nombre de usuario (héroe)", "Formulario de registro", "Sí"],
                ["Contacto", "Correo electrónico", "Formulario / Google OAuth", "Sí"],
                ["Autenticación", "Contraseña (hash bcrypt — nunca en texto plano)", "Firebase Authentication", "Sí (si no usa Google)"],
                ["Preferencias de juego", "Clase seleccionada (Guerrero, Arquero, Mago)", "Elección del usuario", "Sí"],
                ["Identidad Google", "UID de Google, nombre para mostrar", "Google OAuth (si aplica)", "Solo si usa Google"],
                ["Técnicos / Logs", "IP, agente de usuario, marcas de tiempo de acceso", "Firebase / Servidores propios", "Automático"],
              ]}
            />
            <InfoBox color={C.purple}>
              <strong style={{ color: C.gold }}>No recopilamos</strong> datos de salud, biométricos, genéticos, orientación sexual,
              opiniones políticas, creencias religiosas ni datos de categoría especial (Art. 25 LOPDP).
            </InfoBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="finalidades" badge={{ text: "ART. 12.3 LOPDP", color: C.blue }}>4. Finalidades del Tratamiento</SectionTitle>
            <Table
              headers={["Finalidad", "Descripción", "Base legal"]}
              rows={[
                ["Autenticación", "Verificar identidad en cada sesión", "Ejecución de contrato — Art. 10.b"],
                ["Prestación del servicio", "Habilitar gamificación, progreso, logros y clases", "Ejecución de contrato — Art. 10.b"],
                ["Verificación de correo", "Confirmar correo válido (sendEmailVerification)", "Ejecución de contrato / interés legítimo"],
                ["Seguridad", "Detectar accesos no autorizados y abusos", "Interés legítimo — Art. 10.f"],
                ["Comunicaciones", "Correos transaccionales (bienvenida, recuperación)", "Ejecución de contrato / consentimiento"],
                ["Mejora del servicio", "Análisis de uso agregado y anonimizado", "Interés legítimo — Art. 10.f"],
                ["Cumplimiento legal", "Conservar datos cuando la ley lo exige", "Obligación legal — Art. 10.c"],
              ]}
            />
            <InfoBox color={C.blue}>
              No usamos tus datos para <strong style={{ color: P.text }}>publicidad de terceros, venta de datos ni perfilado comercial externo</strong>.
            </InfoBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="base_legal" badge={{ text: "ARTS. 8–10 LOPDP", color: C.blue }}>5. Base Legal de Cada Tratamiento</SectionTitle>
            <ul>
              <Li><strong style={{ color: P.text }}>Consentimiento (Art. 8 LOPDP):</strong> Libre, específico, informado e inequívoco al aceptar esta Política durante el registro. Puedes retirarlo en cualquier momento.</Li>
              <Li><strong style={{ color: P.text }}>Ejecución del contrato (Art. 10.b):</strong> Necesario para cumplir la relación de servicio al crear tu cuenta.</Li>
              <Li><strong style={{ color: P.text }}>Obligación legal (Art. 10.c):</strong> Para registros contables, auditoría y normativa ecuatoriana aplicable.</Li>
              <Li><strong style={{ color: P.text }}>Interés legítimo (Art. 10.f):</strong> Para seguridad y mejora del servicio, sin prevalecer sobre tus derechos fundamentales.</Li>
            </ul>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="conservacion" badge={{ text: "ART. 11.d LOPDP", color: C.gold }}>6. Plazos de Conservación</SectionTitle>
            <Table
              headers={["Tipo de dato", "Plazo de conservación", "Criterio"]}
              rows={[
                ["Datos de cuenta (email, usuario, clase)", "Mientras activa + 30 días tras eliminación", "Principio limitación plazo — Art. 11.d"],
                ["Contraseña (hash Firebase)", "Mientras activa; se elimina con la cuenta", "Firebase Auth lifecycle"],
                ["Logs de acceso / seguridad", "90 días", "Interés legítimo — seguridad"],
                ["Correos transaccionales", "1 año", "Interés legítimo / auditoría"],
                ["Backups cifrados", "30 días tras rotación", "Recuperación ante desastres"],
                ["Datos en reclamación judicial", "Hasta resolución firme + 1 año", "Obligación legal — CPC"],
              ]}
            />
            <BodyP>
              Al vencer los plazos, los datos serán <strong style={{ color: P.text }}>eliminados de forma definitiva y segura</strong> o anonimizados
              conforme al Reglamento LOPDP. La eliminación en servidores de Firebase se ejecuta máximo en 3 días.
            </BodyP>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="destinatarios" badge={{ text: "ART. 12.6 LOPDP", color: C.blue }}>7. Destinatarios y Terceros</SectionTitle>
            <BodyP>Compartimos datos únicamente con <strong style={{ color: P.text }}>Encargados del Tratamiento</strong> vinculados mediante DPA:</BodyP>
            <Table
              headers={["Proveedor", "Función", "País", "Garantía"]}
              rows={[
                ["Google LLC (Firebase)", "Autenticación, base de datos, almacenamiento", "Estados Unidos", "SCC + DPA Google"],
                ["Servidores ForgeVenture", "API backend, lógica de negocio", "Ecuador", "Medidas técnicas Art. 37 LOPDP"],
              ]}
            />
            <InfoBox color={C.orange}>
              <strong style={{ color: C.gold }}>No vendemos, arrendamos ni cedemos</strong> datos a terceros con fines comerciales.
              La divulgación a autoridades solo ocurre ante requerimiento legal válido.
            </InfoBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="transferencias" badge={{ text: "NORMA SPDP 2026 · ART. 32 LOPDP", color: C.red }}>8. Transferencias Internacionales de Datos</SectionTitle>
            <InfoBox color={C.red}>
              <strong style={{ color: "#ff8080" }}>⚠ AVISO IMPORTANTE — TRANSFERENCIA INTERNACIONAL</strong><br /><br />
              Tus datos son transferidos a servidores de <strong>Google Firebase</strong> en <strong>Estados Unidos</strong>.
              Ecuador no ha reconocido a EE. UU. como país con nivel adecuado de protección (LOPDP). En consecuencia:<br /><br />
              • Transferencia basada en tu <strong>consentimiento explícito</strong> (Art. 8 LOPDP + Norma SPDP enero 2026).<br />
              • Respaldada por <strong>Cláusulas Contractuales Tipo (SCC)</strong> entre ForgeVenture y Google (Art. 32 LOPDP).<br />
              • Tus datos pueden estar sujetos a la <em>Foreign Intelligence Surveillance Act</em> (FISA § 702), aunque Google aplica cifrado.<br /><br />
              Si no consientes, <strong>no podrás usar el servicio</strong>, ya que Firebase es esencial para la autenticación.
            </InfoBox>
            <BodyP>
              Google LLC ha suscrito un <strong style={{ color: P.text }}>Data Processing Amendment</strong> con compromisos de seguridad, confidencialidad
              y restricción de finalidades. Consulta la{" "}
              <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">Política de Privacidad de Firebase</a>.
            </BodyP>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="derechos" badge={{ text: "ARTS. 17–23 LOPDP", color: C.green }}>9. Derechos ARCO+P del Titular</SectionTitle>
            <BodyP>Como titular, la LOPDP te reconoce los siguientes derechos, ejercibles <strong style={{ color: P.text }}>de forma gratuita</strong>:</BodyP>
            <Table
              headers={["Derecho", "Qué incluye", "Art. LOPDP", "Plazo respuesta"]}
              rows={[
                ["Acceso (A)", "Confirmar si tus datos son tratados y obtener copia", "Art. 17", "30 días hábiles"],
                ["Rectificación (R)", "Corregir datos inexactos o incompletos", "Art. 18", "15 días hábiles"],
                ["Cancelación / Eliminación (C)", "Eliminar datos cuando ya no sean necesarios", "Art. 19", "15 días hábiles"],
                ["Oposición (O)", "Oponerte al tratamiento por motivos legítimos", "Art. 22", "15 días hábiles"],
                ["Portabilidad (+P)", "Recibir datos en formato legible por máquina (JSON/CSV)", "Art. 21", "30 días hábiles"],
                ["Limitación", "Restringir tratamiento mientras se resuelve impugnación", "Art. 20", "15 días hábiles"],
                ["Revocación del consentimiento", "Retirar consentimiento sin efecto retroactivo", "Art. 8", "Inmediato"],
              ]}
            />
            <RightBox>
              <strong style={{ color: C.green }}>¿Cómo ejercer tus derechos?</strong><br />
              Envía solicitud a <strong>{RESPONSABLE.emailDatos}</strong> con: nombre completo, derecho que deseas ejercer,
              dato afectado y copia de identidad. Si no recibes respuesta, puedes acudir a la <strong>SPDP</strong>.
            </RightBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="menores" badge={{ text: "ART. 24 LOPDP", color: C.red }}>10. Menores de Edad</SectionTitle>
            <InfoBox color={C.red}>
              <strong style={{ color: "#ff8080" }}>ForgeVenture está dirigido a personas mayores de 18 años.</strong> No recopilamos datos
              de menores de 18 sin consentimiento verificado del representante legal (Art. 24 LOPDP).<br /><br />
              Si eres menor de 15 años, el registro requiere consentimiento expreso de tu representante legal.
              Si tienes entre 15 y 18 años, puedes ejercer tus derechos ARCO+P directamente ante la SPDP.<br /><br />
              Si detectamos datos de un menor sin el consentimiento requerido, los eliminaremos de inmediato.
            </InfoBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="seguridad" badge={{ text: "ART. 37 LOPDP · ART. 51 LEY 67", color: C.blue }}>11. Medidas de Seguridad</SectionTitle>
            <BodyP>
              Implementamos medidas técnicas y organizativas para garantizar <strong style={{ color: P.text }}>confidencialidad,
              integridad, disponibilidad y resiliencia</strong> de los datos:
            </BodyP>
            <ul>
              <Li><strong style={{ color: P.text }}>Cifrado en tránsito:</strong> HTTPS/TLS 1.2+ en todas las comunicaciones</Li>
              <Li><strong style={{ color: P.text }}>Cifrado en reposo:</strong> Firebase cifra por defecto (AES-256)</Li>
              <Li><strong style={{ color: P.text }}>Hashing de contraseñas:</strong> Firebase Authentication nunca almacena contraseñas en texto plano</Li>
              <Li><strong style={{ color: P.text }}>Control de acceso:</strong> JWT con acceso restringido por roles</Li>
              <Li><strong style={{ color: P.text }}>Logs de auditoría:</strong> 90 días para detección de anomalías</Li>
              <Li><strong style={{ color: P.text }}>Alta disponibilidad:</strong> Infraestructura Firebase con recuperación ante desastres</Li>
              <Li><strong style={{ color: P.text }}>Revisiones periódicas:</strong> Auditorías de configuración y dependencias</Li>
            </ul>
            <InfoBox color={P.muted}>
              Ningún sistema es 100% infalible. En caso de brecha, te notificaremos en 5 días hábiles y reportaremos
              a la SPDP en 3 días, conforme al Art. 32 LOPDP.
            </InfoBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="cookies">12. Cookies y Tecnologías Similares</SectionTitle>
            <Table
              headers={["Tecnología", "Nombre / Clave", "Finalidad", "Duración", "Eliminable"]}
              rows={[
                ["sessionStorage", "fv_booted", "Controlar si ya se mostró el loader", "Sesión del navegador", "Al cerrar pestaña"],
                ["sessionStorage", "fv_selectedClass", "Recordar clase preseleccionada desde Home", "Sesión (se limpia tras registro)", "Sí"],
                ["localStorage / sessionStorage", "Firebase Auth token", "Mantener sesión activa (según 'Mantener sesión')", "Indefinido / Sesión", "Al cerrar sesión"],
              ]}
            />
            <BodyP>
              No usamos cookies de seguimiento de terceros, pixels de publicidad ni tecnologías de perfilado externo.
              Los tokens de Firebase son necesarios para el funcionamiento del servicio.
            </BodyP>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="decisiones">13. Decisiones Automatizadas</SectionTitle>
            <BodyP>
              ForgeVenture <strong style={{ color: P.text }}>no realiza toma de decisiones automatizadas ni perfilado</strong> con efectos jurídicos
              significativos (Art. 23 LOPDP). Las mecánicas de gamificación (puntos, logros, niveles) operan sobre datos
              de juego —no datos personales sensibles— y no generan consecuencias fuera de la plataforma.
            </BodyP>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="brechas" badge={{ text: "ART. 32 LOPDP", color: C.red }}>14. Notificación de Brechas de Seguridad</SectionTitle>
            <ul>
              <Li><strong style={{ color: P.text }}>Dentro de 3 días hábiles:</strong> Notificación a la SPDP con descripción, datos afectados, consecuencias y medidas adoptadas.</Li>
              <Li><strong style={{ color: P.text }}>Dentro de 5 días hábiles:</strong> Notificación directa a usuarios afectados por email, indicando qué datos se vieron comprometidos.</Li>
              <Li><strong style={{ color: P.text }}>Internamente:</strong> Documentación en el Registro de Incidentes conforme al Reglamento LOPDP.</Li>
            </ul>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="cambios">15. Modificaciones a esta Política</SectionTitle>
            <BodyP>Cuando los cambios sean sustanciales:</BodyP>
            <ul>
              <Li>Te notificaremos por email con al menos <strong style={{ color: P.text }}>15 días de anticipación</strong>.</Li>
              <Li>Publicaremos la nueva versión con fecha de vigencia actualizada.</Li>
              <Li>Si los cambios requieren nuevo consentimiento, te lo solicitaremos de forma expresa.</Li>
              <Li>Puedes solicitar eliminación de tu cuenta antes de la fecha de entrada en vigor si no estás de acuerdo.</Li>
            </ul>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="autoridad" badge={{ text: "SPDP", color: C.green }}>16. Autoridad de Control</SectionTitle>
            <InfoBox color={C.green}>
              <strong style={{ color: C.green }}>Superintendencia de Protección de Datos Personales (SPDP)</strong><br />
              La SPDP supervisa el cumplimiento de la LOPDP en Ecuador.<br /><br />
              📍 Av. Amazonas y Unión Nacional de Periodistas, Quito, Ecuador<br />
              🌐 <a href="https://spdp.gob.ec" target="_blank" rel="noreferrer">https://spdp.gob.ec</a><br />
              📧 <strong>Consultas:</strong> consultas@spdp.gob.ec<br />
              📧 <strong>Ejercicio de derechos:</strong> solicitudes@spdp.gob.ec<br />
              📧 <strong>Denuncias:</strong> denuncias@spdp.gob.ec<br /><br />
              Tienes derecho a reclamar ante la SPDP si consideras que tu tratamiento no cumple la LOPDP.
              Te recomendamos contactar primero a ForgeVenture en <strong>{RESPONSABLE.emailDatos}</strong>.
            </InfoBox>
          </Reveal>

          <Reveal delay={0.05}>
            <SectionTitle id="contacto">17. Contacto y Canal ARCO</SectionTitle>
            <Table
              headers={["Canal", "Detalle"]}
              rows={[
                ["Email legal general", RESPONSABLE.email],
                ["Email datos / ARCO+P", RESPONSABLE.emailDatos],
                ["Asunto recomendado", "SOLICITUD ARCO — [Usuario] — [Tipo de derecho]"],
                ["Tiempo de respuesta", "Máx. 30 días hábiles (15 días para rectificación, cancelación, oposición)"],
                ["Costo", "Gratuito — Art. 17 LOPDP"],
              ]}
            />
          </Reveal>

          {/* Footer */}
          <Reveal delay={0.05}>
            <div style={{
              position: "relative", overflow: "hidden",
              marginTop: 48, padding: "20px",
              background: "rgba(20,26,42,0.82)", backdropFilter: "blur(14px)",
              border: `1px solid ${C.navy}`, borderTop: `2px solid ${C.blue}`,
              borderRadius: 12,
            }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%",
                background: `radial-gradient(circle, ${C.blue}18 0%, transparent 70%)`, filter: "blur(12px)", pointerEvents: "none" }} />
              <div style={{ ...mono(9, 700), color: P.muted, letterSpacing: ".12em", marginBottom: 12 }}>INFORMACIÓN DEL DOCUMENTO</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {[
                  { l: "Versión",              v: "1.0.0",             color: C.blue   },
                  { l: "Fecha de vigencia",    v: EFFECTIVE_DATE,      color: C.orange },
                  { l: "Última actualización", v: LAST_UPDATED,        color: C.gold   },
                  { l: "Marco legal",          v: "LOPDP Ecuador 2021", color: C.green },
                ].map(({ l, v, color }) => (
                  <div key={l}>
                    <div style={{ ...mono(9, 600), color: P.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                    <div style={{ ...orb(11, 700), color }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.navy}`, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.blue, ...mono(10, 700) }}>▸</span>
                <span style={{ ...orb(12, 900), color: P.text }}>FORGE</span>
                <span style={{ ...orb(12, 400), color: C.orange }}>VENTURE</span>
              </div>
              <p style={{ ...raj(12, 400), color: P.muted, lineHeight: 1.7, maxWidth: 640 }}>
                © {new Date().getFullYear()} ForgeVenture. Todos los derechos reservados conforme al
                Código Orgánico de la Economía Social de los Conocimientos, Creatividad e Innovación
                (COESCCI) — R.O. Suplemento 899, 9 de diciembre de 2016.
              </p>
              <motion.button onClick={() => navigate("/terminos")} whileHover={{ color: C.blue }}
                style={{ background: "none", border: "none", cursor: "pointer", ...mono(10, 600), color: P.muted, letterSpacing: ".08em", transition: "color .15s", alignSelf: "flex-start" }}
              >TÉRMINOS DE SERVICIO →</motion.button>
            </div>
          </Reveal>

        </main>
      </div>
    </>
  );
}
