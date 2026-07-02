// src/pages/TerminosPage.jsx — v2 · ForgeVenture Design System v3
import { useEffect, useRef, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import { C, raj, orb } from "../components/admin/config/shared.jsx";

if (typeof document !== "undefined" && !document.getElementById("fv7t-fonts")) {
  const l = document.createElement("link");
  l.id = "fv7t-fonts"; l.rel = "stylesheet";
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

const LAST_UPDATED   = "13 de abril de 2026";
const EFFECTIVE_DATE = "13 de abril de 2026";
const RESPONSABLE = {
  nombre:     "ForgeVenture",
  tipo:       "Plataforma de entrenamiento gamificado",
  ruc:        "XXXXXXXXXXXXXXXXX",
  domicilio:  "Ecuador",
  email:      "legal@forgeventure.ec",
  emailDatos: "datos@forgeventure.ec",
};

const SECTIONS = [
  { id: "objeto",     label: "1. Objeto y Naturaleza" },
  { id: "partes",     label: "2. Identificación de las Partes" },
  { id: "edad",       label: "3. Edad Mínima y Capacidad Legal" },
  { id: "cuenta",     label: "4. Creación y Gestión de Cuenta" },
  { id: "uso",        label: "5. Condiciones de Uso Aceptable" },
  { id: "privacidad", label: "6. Privacidad y Protección de Datos" },
  { id: "datos_rec",  label: "7. Datos Personales Recopilados" },
  { id: "finalidad",  label: "8. Finalidades del Tratamiento" },
  { id: "derechos",   label: "9. Derechos ARCO+P" },
  { id: "terceros",   label: "10. Transferencias a Terceros" },
  { id: "cookies",    label: "11. Cookies y Tecnologías" },
  { id: "propiedad",  label: "12. Propiedad Intelectual" },
  { id: "responsab",  label: "13. Limitación de Responsabilidad" },
  { id: "suspension", label: "14. Suspensión y Eliminación" },
  { id: "menores",    label: "15. Protección de Menores" },
  { id: "modif",      label: "16. Modificaciones" },
  { id: "jurisd",     label: "17. Ley Aplicable y Jurisdicción" },
  { id: "contacto",   label: "18. Contacto y Canal ARCO" },
];

// ── Static ambient background ────────────────────────────────────
const AmbientOrbs = memo(function AmbientOrbs() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
      background: `linear-gradient(160deg,${C.bg} 0%,#080D18 55%,${C.bg} 100%)`,
    }}>
      <div style={{ position: "absolute", top: "3%", left: "6%", width: 700, height: 700,
        background: `radial-gradient(circle, ${C.orange}18 0%, transparent 65%)`, filter: "blur(90px)" }} />
      <div style={{ position: "absolute", bottom: "-8%", right: "2%", width: 650, height: 650,
        background: `radial-gradient(circle, ${C.purple}14 0%, transparent 65%)`, filter: "blur(90px)" }} />
      <div style={{ position: "absolute", top: "38%", right: "28%", width: 380, height: 380,
        background: `radial-gradient(circle, ${C.blue}0D 0%, transparent 65%)`, filter: "blur(70px)" }} />
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
      background: `linear-gradient(90deg, ${C.orange}, ${C.gold}, ${C.blue})`,
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
function LegalBadge({ children, color = C.blue }) {
  return (
    <span style={{
      display: "inline-block", ...mono(9, 700), letterSpacing: ".08em",
      color, background: `${color}18`, border: `1px solid ${color}44`,
      padding: "2px 8px", marginLeft: 8, verticalAlign: "middle", borderRadius: 4,
    }}>{children}</span>
  );
}

function LawRef({ children }) {
  return (
    <span style={{
      ...mono(11, 600), color: C.blue,
      background: `${C.blue}10`, border: `1px solid ${C.blue}22`,
      padding: "1px 6px", borderRadius: 3, whiteSpace: "nowrap",
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
      <span style={{ color: C.orange, ...mono(10, 700) }}>▸</span>
      {children}
      {badge && <LegalBadge color={badge.c ?? C.blue}>{badge.t}</LegalBadge>}
    </h2>
  );
}

function SubTitle({ children }) {
  return (
    <h3 style={{
      ...raj(12, 700), color: C.gold,
      margin: "20px 0 8px", letterSpacing: ".06em", textTransform: "uppercase",
    }}>{children}</h3>
  );
}

function BodyP({ children, style }) {
  return (
    <p style={{ ...raj(14, 400), color: P.mutedL, lineHeight: 1.85, margin: "0 0 10px", ...style }}>
      {children}
    </p>
  );
}

function UL({ items }) {
  return (
    <ul style={{ margin: "6px 0 14px 0", padding: 0, listStyle: "none" }}>
      {items.map((it, i) => (
        <li key={i} style={{
          ...raj(14, 400), color: P.mutedL, lineHeight: 1.75,
          marginBottom: 5, paddingLeft: 18, position: "relative",
        }}>
          <span style={{ position: "absolute", left: 0, color: C.orange, ...mono(12, 700) }}>›</span>
          {it}
        </li>
      ))}
    </ul>
  );
}

function InfoBox({ color = C.blue, icon, children }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
      border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`,
      borderRadius: 10, padding: "14px 18px", margin: "14px 0",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, filter: "blur(10px)", pointerEvents: "none" }} />
      {icon && <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{icon}</span>}
      <div style={{ ...raj(13, 400), color: P.mutedL, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LEGAL CONTENT
// ─────────────────────────────────────────────────────────────────
function LegalContent() {
  return (
    <article>

      <Reveal>
        <SectionTitle id="objeto">1. Objeto y Naturaleza del Servicio</SectionTitle>
        <BodyP>
          Los presentes Términos de Servicio (en adelante, <strong style={{ color: P.text }}>"los Términos"</strong>) regulan
          el acceso y uso de la plataforma digital <strong style={{ color: C.gold }}>ForgeVenture</strong>, un servicio
          de entrenamiento físico gamificado disponible en formato web, que permite a sus usuarios registrar rutinas de
          ejercicio, ganar puntos de experiencia (XP), desbloquear logros y participar en misiones de bienestar físico.
        </BodyP>
        <BodyP>
          El acceso y uso de la plataforma implica la aceptación plena, sin reservas, de todos y cada uno de los
          presentes Términos. Si el Usuario no está de acuerdo con alguna de las condiciones aquí establecidas,
          deberá abstenerse de utilizar el Servicio.
        </BodyP>
        <InfoBox color={C.blue} icon="⚖️">
          Estos Términos constituyen un <strong>contrato vinculante</strong> entre el Usuario y ForgeVenture, celebrado
          conforme a los artículos 1454 y siguientes del <LawRef>Código Civil del Ecuador</LawRef> relativos a las
          obligaciones y contratos. Al hacer clic en "Crear cuenta" o al utilizar el Servicio, el Usuario manifiesta
          su consentimiento libre, específico, informado e inequívoco.
        </InfoBox>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="partes">2. Identificación de las Partes</SectionTitle>
        <SubTitle>2.1 El Responsable del Servicio</SubTitle>
        <UL items={[
          `Nombre del servicio: ${RESPONSABLE.nombre}`,
          `Naturaleza: ${RESPONSABLE.tipo}`,
          `Domicilio: ${RESPONSABLE.domicilio}`,
          `Correo de contacto general: ${RESPONSABLE.email}`,
          `Correo para asuntos de datos personales: ${RESPONSABLE.emailDatos}`,
        ]} />
        <SubTitle>2.2 El Usuario</SubTitle>
        <BodyP>
          Es toda persona natural que acceda, se registre o utilice la plataforma ForgeVenture, ya sea mediante
          correo electrónico y contraseña, o mediante autenticación con cuenta de Google (OAuth 2.0).
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="edad" badge={{ t: "LOPDP Art. 13", c: C.blue }}>
          3. Edad Mínima y Capacidad Legal
        </SectionTitle>
        <BodyP>
          El uso de ForgeVenture está restringido a personas que hayan cumplido <strong style={{ color: P.text }}>dieciséis (16) años de edad</strong>.
          Los mayores de trece (13) y menores de dieciséis (16) años podrán utilizar la plataforma únicamente con el
          consentimiento expreso, verificable y documentado de su representante legal, conforme a lo dispuesto
          en el <LawRef>Art. 13 de la LOPDP</LawRef>.
        </BodyP>
        <BodyP>
          Los menores de trece (13) años tienen <strong style={{ color: C.red }}>acceso absolutamente prohibido</strong>.
          Si ForgeVenture detecta o tiene conocimiento razonado de que un menor de dicha edad ha creado una cuenta,
          procederá a su eliminación inmediata junto con todos los datos asociados, sin perjuicio de las acciones
          que correspondan conforme a la ley.
        </BodyP>
        <InfoBox color={C.gold} icon="⚠️">
          Al registrarse, el Usuario declara bajo su responsabilidad cumplir con el requisito de edad. ForgeVenture
          no asume responsabilidad por información falsa proporcionada al momento del registro.
        </InfoBox>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="cuenta">4. Creación y Gestión de la Cuenta</SectionTitle>
        <SubTitle>4.1 Registro y veracidad de datos</SubTitle>
        <BodyP>
          El Usuario se compromete a proporcionar información veraz, exacta, actualizada y completa durante el
          proceso de registro. El nombre de usuario elegido no podrá contener lenguaje ofensivo, discriminatorio,
          violento o que infrinja derechos de terceros.
        </BodyP>
        <SubTitle>4.2 Seguridad de credenciales</SubTitle>
        <BodyP>
          El Usuario es el único responsable de mantener la confidencialidad de su contraseña y de todas las
          actividades que se realicen desde su cuenta. ForgeVenture recomienda utilizar contraseñas robustas y no
          compartirlas con terceros. Ante cualquier uso no autorizado, el Usuario deberá notificar de inmediato
          a <strong style={{ color: C.gold }}>{RESPONSABLE.email}</strong>.
        </BodyP>
        <SubTitle>4.3 Unicidad de cuenta</SubTitle>
        <BodyP>
          Cada persona natural podrá mantener una (1) cuenta activa. La creación de cuentas múltiples con el fin
          de eludir sanciones o restricciones constituye una infracción a los presentes Términos y faculta a
          ForgeVenture para suspender todas las cuentas involucradas.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="uso">5. Condiciones de Uso Aceptable</SectionTitle>
        <BodyP>El Usuario se compromete expresamente a <strong style={{ color: C.red }}>no</strong>:</BodyP>
        <UL items={[
          "Utilizar el Servicio para fines ilícitos, fraudulentos o contrarios a la moral y a las buenas costumbres.",
          "Publicar, transmitir o difundir contenido ofensivo, discriminatorio, acosador, pornográfico o que incite a la violencia.",
          "Intentar acceder sin autorización a sistemas, servidores o datos de otros usuarios.",
          "Realizar ingeniería inversa, descompilar, desensamblar o intentar obtener el código fuente de la plataforma.",
          "Automatizar el uso del Servicio mediante bots, scripts o cualquier mecanismo no autorizado.",
          "Revender, ceder o transferir su cuenta o los beneficios de la misma a terceros.",
          "Realizar actividades que puedan comprometer la seguridad, integridad o disponibilidad de la plataforma.",
        ]} />
        <BodyP>
          El incumplimiento faculta a ForgeVenture para suspender o eliminar la cuenta de manera inmediata, sin
          previo aviso, sin perjuicio de las acciones legales civiles y penales que correspondan conforme
          al <LawRef>COIP</LawRef> y demás normativa ecuatoriana aplicable.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="privacidad" badge={{ t: "LOPDP 2021", c: C.green }}>
          6. Privacidad y Protección de Datos Personales
        </SectionTitle>
        <BodyP>
          ForgeVenture reconoce y garantiza el derecho fundamental a la protección de datos personales consagrado
          en el <LawRef>Art. 66 No. 19 de la Constitución del Ecuador</LawRef> y desarrollado por
          la <LawRef>Ley Orgánica de Protección de Datos Personales (LOPDP)</LawRef> publicada en el
          Registro Oficial No. 459 de 26 de mayo de 2021, y su Reglamento aprobado mediante Decreto Ejecutivo 1081.
        </BodyP>
        <SubTitle>6.1 Responsable del Tratamiento</SubTitle>
        <BodyP>
          De conformidad con el <LawRef>Art. 19 de la LOPDP</LawRef>, el responsable del tratamiento es{" "}
          <strong style={{ color: P.text }}>ForgeVenture</strong>, con domicilio en Ecuador.
          Las solicitudes y ejercicio de derechos pueden dirigirse a: <strong style={{ color: C.gold }}>{RESPONSABLE.emailDatos}</strong>.
        </BodyP>
        <SubTitle>6.2 Base legal del tratamiento</SubTitle>
        <BodyP>El tratamiento se sustenta en el <LawRef>Art. 9 de la LOPDP</LawRef>:</BodyP>
        <UL items={[
          "Consentimiento libre, específico, informado e inequívoco del titular, otorgado al aceptar los presentes Términos.",
          "Ejecución del contrato de prestación del Servicio.",
          "Interés legítimo de ForgeVenture, siempre que no prevalezcan los derechos del titular.",
          "Cumplimiento de obligaciones legales aplicables.",
        ]} />
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="datos_rec" badge={{ t: "Art. 12 LOPDP", c: C.blue }}>
          7. Datos Personales Recopilados
        </SectionTitle>
        <SubTitle>7.1 Datos proporcionados directamente por el Usuario</SubTitle>
        <UL items={[
          "Nombre de usuario (pseudónimo elegido por el Usuario).",
          "Dirección de correo electrónico.",
          "Contraseña (almacenada de forma cifrada; ForgeVenture no accede a la contraseña en texto plano).",
          "Clase de héroe seleccionada (GUERRERO, ARQUERO, MAGO — dato de perfil gamificado).",
          "Foto de perfil, si el Usuario decide proporcionarla.",
          "Datos biográficos opcionales (nombre de héroe, título, biografía corta).",
        ]} />
        <SubTitle>7.2 Datos generados por el uso del Servicio</SubTitle>
        <UL items={[
          "Historial de rutinas y ejercicios completados.",
          "Progresión en el juego: nivel, XP, racha, monedas virtuales, logros desbloqueados.",
          "Fecha y hora de registro y último inicio de sesión.",
          "Misiones iniciadas y completadas.",
          "Objetos adquiridos en la tienda virtual.",
          "Retroalimentación y reportes enviados a través del Servicio.",
        ]} />
        <SubTitle>7.3 Datos técnicos recabados automáticamente</SubTitle>
        <UL items={[
          "Identificador único de usuario (UID) generado por Firebase Authentication.",
          "Datos de sesión (tokens de autenticación JWT, tiempo de expiración).",
        ]} />
        <InfoBox color={C.green} icon="🔒">
          <strong>Minimización de datos:</strong> ForgeVenture aplica el principio de minimización del{" "}
          <LawRef>Art. 10 No. 5 de la LOPDP</LawRef>. Solo se recaban datos estrictamente necesarios para
          la prestación del Servicio. No se recopilan datos sensibles (categorías especiales) del{" "}
          <LawRef>Art. 23 de la LOPDP</LawRef>.
        </InfoBox>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="finalidad">8. Finalidades del Tratamiento</SectionTitle>
        <BodyP>Los datos personales recabados son tratados para:</BodyP>
        <UL items={[
          "Prestación y mantenimiento del Servicio: gestión de cuentas, autenticación, personalización del perfil.",
          "Progresión del juego: cálculo de XP, niveles, rachas, logros, misiones y economía virtual.",
          "Comunicaciones: envío de correos electrónicos transaccionales (bienvenida, recuperación, notificaciones).",
          "Seguridad y prevención del fraude: detección de usos no autorizados.",
          "Mejora del Servicio: análisis agregado y anonimizado de patrones de uso.",
          "Cumplimiento de obligaciones legales: atención a requerimientos de autoridades conforme a ley ecuatoriana.",
        ]} />
        <BodyP>
          <strong style={{ color: P.text }}>ForgeVenture no utiliza datos personales con fines de mercadotecnia
          directa de terceros ni los cede, vende ni arrienda a entidades externas con fines comerciales.</strong>
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="derechos" badge={{ t: "Arts. 25-32 LOPDP", c: C.gold }}>
          9. Derechos del Titular de Datos (ARCO+P)
        </SectionTitle>
        <BodyP>Conforme a los artículos 25 al 32 de la LOPDP, el titular tiene los siguientes derechos:</BodyP>

        {[
          { letra: "A", nombre: "Derecho de Acceso",              art: "Art. 25 LOPDP", color: C.orange,
            desc: "El Usuario puede solicitar en cualquier momento información sobre los datos personales que ForgeVenture trata, el origen, las finalidades, los destinatarios y el período de conservación." },
          { letra: "R", nombre: "Derecho de Rectificación",        art: "Art. 26 LOPDP", color: C.blue,
            desc: "El Usuario puede solicitar la corrección de datos personales inexactos, incompletos o desactualizados. Muchos datos pueden actualizarse directamente desde la configuración de perfil." },
          { letra: "C", nombre: "Derecho de Cancelación (Supresión)", art: "Art. 27 LOPDP", color: C.red,
            desc: "El Usuario tiene derecho a solicitar la supresión de sus datos cuando: ya no sean necesarios para la finalidad que motivó su tratamiento; se retire el consentimiento; los datos sean tratados de forma ilícita; o sea procedente por mandato legal." },
          { letra: "O", nombre: "Derecho de Oposición",            art: "Art. 28 LOPDP", color: C.purple,
            desc: "El Usuario puede oponerse al tratamiento cuando se base en interés legítimo o misión de interés público, invocando razones relacionadas con su situación particular." },
          { letra: "P", nombre: "Derecho de Portabilidad",         art: "Art. 29 LOPDP", color: C.green,
            desc: "El Usuario puede solicitar sus datos en formato estructurado, de uso común y lectura mecánica, y tiene derecho a transmitirlos a otro responsable cuando sea técnicamente posible." },
        ].map(({ letra, nombre, art, desc, color }) => (
          <div key={letra} style={{
            position: "relative", overflow: "hidden",
            background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
            border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`,
            borderRadius: 10, padding: "14px 18px", marginBottom: 10,
            display: "flex", gap: 14, alignItems: "flex-start",
            transition: "background .15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(20,26,42,0.9)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(20,26,42,0.65)"}
          >
            <div style={{ position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: "50%",
              background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, filter: "blur(8px)", pointerEvents: "none" }} />
            <div style={{
              width: 34, height: 34, flexShrink: 0, borderRadius: 8,
              background: `${color}18`, border: `1px solid ${color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              ...mono(13, 800), color,
            }}>{letra}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                <span style={{ ...raj(13, 700), color: P.text }}>{nombre}</span>
                <LegalBadge color={C.blue}>{art}</LegalBadge>
              </div>
              <p style={{ ...raj(13, 400), color: P.mutedL, lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}

        <InfoBox color={C.gold} icon="📬">
          Para ejercer cualquiera de los derechos anteriores, envía solicitud a{" "}
          <strong>{RESPONSABLE.emailDatos}</strong>, adjuntando copia de documento de identidad vigente e
          indicando el derecho que deseas ejercer. ForgeVenture responderá en un máximo de{" "}
          <strong>quince (15) días hábiles</strong> conforme al <LawRef>Art. 36 de la LOPDP</LawRef>. Ante
          negativa, puedes reclamar ante la{" "}
          <strong>Autoridad de Protección de Datos Personales del Ecuador (ADPE)</strong>.
        </InfoBox>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="terceros" badge={{ t: "Art. 46 LOPDP", c: C.blue }}>
          10. Transferencias e Infraestructura de Terceros
        </SectionTitle>
        <BodyP>
          Para la operación del Servicio, ForgeVenture utiliza los siguientes servicios de terceros, lo que puede
          implicar transferencias internacionales de datos conforme al <LawRef>Art. 46 de la LOPDP</LawRef>:
        </BodyP>
        {[
          { nombre: "Google Firebase (Alphabet Inc.)", uso: "Autenticación de usuarios (Firebase Authentication) y base de datos (Cloud Firestore). Los datos se almacenan en servidores de Google, cuya política puede consultarse en policies.google.com/privacy.", pais: "Estados Unidos", marco: "Cláusulas Contractuales Tipo (SCCs)" },
          { nombre: "Google Cloud Platform", uso: "Infraestructura de cómputo y red. Google Inc. actúa como encargado del tratamiento bajo contrato de procesamiento de datos (DPA) que cumple las garantías exigidas por el Art. 46 de la LOPDP.", pais: "Global", marco: "DPA + SCCs" },
        ].map((prov, i) => (
          <div key={i} style={{
            position: "relative", overflow: "hidden",
            background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
            border: `1px solid ${C.navy}`, borderRadius: 10,
            padding: "14px 18px", marginBottom: 10, transition: "background .15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(20,26,42,0.9)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(20,26,42,0.65)"}
          >
            <div style={{ ...raj(13, 700), color: P.text, marginBottom: 6 }}>{prov.nombre}</div>
            <div style={{ ...raj(13, 400), color: P.mutedL, lineHeight: 1.6, marginBottom: 8 }}>{prov.uso}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <LegalBadge color={P.muted}>País: {prov.pais}</LegalBadge>
              <LegalBadge color={C.blue}>Garantía: {prov.marco}</LegalBadge>
            </div>
          </div>
        ))}
        <BodyP>
          ForgeVenture no realiza transferencias de datos a ningún otro tercero con fines comerciales o
          publicitarios. El acceso de administradores al panel de gestión se limita exclusivamente a personal
          autorizado con obligaciones de confidencialidad.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="cookies">11. Cookies y Tecnologías Similares</SectionTitle>
        <BodyP>
          ForgeVenture utiliza almacenamiento local del navegador (<em>localStorage</em> / <em>sessionStorage</em>)
          para mantener la sesión del usuario y persistir preferencias de interfaz. Estas tecnologías son
          estrictamente necesarias para el funcionamiento del Servicio y no requieren consentimiento adicional.
        </BodyP>
        <BodyP>
          No se utilizan cookies de rastreo de terceros, publicidad comportamental ni herramientas de
          analítica externa que transmitan datos personales a terceros sin el consentimiento del Usuario.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="propiedad" badge={{ t: "COESC", c: C.orange }}>
          12. Propiedad Intelectual
        </SectionTitle>
        <BodyP>
          Todos los contenidos de ForgeVenture — diseño, código fuente, logotipos, gráficos, textos, iconos,
          mecánicas de juego, estructura de base de datos y sistemas de progresión — están protegidos por las
          leyes de propiedad intelectual ecuatorianas, específicamente el{" "}
          <LawRef>Código Orgánico de la Economía Social de los Conocimientos, Creatividad e Innovación (COESC)</LawRef>{" "}
          y los Convenios Internacionales suscritos por Ecuador.
        </BodyP>
        <BodyP>
          Se concede al Usuario una licencia de uso personal, no exclusiva, no transferible y revocable para
          acceder y utilizar el Servicio exclusivamente conforme a estos Términos. Queda expresamente prohibida
          cualquier reproducción, distribución, modificación o uso comercial sin autorización escrita de ForgeVenture.
        </BodyP>
        <BodyP>
          El Usuario conserva la titularidad de cualquier contenido propio que publique (por ejemplo, su
          biografía de perfil), y otorga a ForgeVenture una licencia limitada, no exclusiva y libre de
          regalías para mostrar dicho contenido en el contexto de la prestación del Servicio.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="responsab">13. Limitación de Responsabilidad</SectionTitle>
        <SubTitle>13.1 Disponibilidad del Servicio</SubTitle>
        <BodyP>
          ForgeVenture no garantiza la disponibilidad continua e ininterrumpida del Servicio. Este puede ser
          suspendido temporalmente por mantenimiento, actualizaciones o causas de fuerza mayor. ForgeVenture
          realizará esfuerzos razonables para notificar interrupciones programadas.
        </BodyP>
        <SubTitle>13.2 Uso correcto de la plataforma</SubTitle>
        <BodyP>
          La plataforma ofrece rutinas de ejercicio físico con fines de bienestar general. Dicho contenido tiene
          carácter <strong style={{ color: P.text }}>orientativo y no reemplaza el criterio de profesionales
          de la salud</strong>. ForgeVenture no se responsabiliza por lesiones derivadas de la ejecución de
          actividades físicas. El Usuario asume la responsabilidad de consultar con profesionales antes de
          iniciar cualquier programa de ejercicio.
        </BodyP>
        <SubTitle>13.3 Economía virtual</SubTitle>
        <BodyP>
          Los elementos de la economía virtual (monedas, XP, objetos, logros) no tienen valor monetario real,
          no son transferibles fuera de la plataforma y no constituyen dinero electrónico. ForgeVenture puede
          modificar, ajustar o eliminar dichos elementos en cualquier momento.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="suspension">14. Suspensión y Eliminación de Cuenta</SectionTitle>
        <SubTitle>14.1 Eliminación por el Usuario (soft delete)</SubTitle>
        <BodyP>
          El Usuario puede solicitar la eliminación de su cuenta desde el panel de configuración de perfil.
          La cuenta será <strong style={{ color: P.text }}>desactivada inmediatamente</strong> y permanecerá
          en estado de eliminación recuperable durante un período de <strong style={{ color: C.gold }}>tres (3) días calendario</strong>.
          Durante este período no podrá acceder al Servicio, pero un administrador podrá restaurarla si el Usuario
          así lo solicita.
        </BodyP>
        <BodyP>
          Transcurrido el período de recuperación, los datos podrán ser eliminados de forma permanente. La
          retención durante esos tres días se justifica en el interés legítimo de permitir la recuperación
          ante eliminaciones accidentales.
        </BodyP>
        <SubTitle>14.2 Suspensión por ForgeVenture</SubTitle>
        <BodyP>
          ForgeVenture se reserva el derecho de suspender o eliminar cuentas que violen los presentes Términos,
          sin perjuicio de las acciones legales correspondientes. En caso de eliminación por infracción, los datos
          podrán conservarse por el período legalmente necesario conforme al <LawRef>Art. 22 de la LOPDP</LawRef>.
        </BodyP>
        <SubTitle>14.3 Conservación de datos tras eliminación</SubTitle>
        <BodyP>
          Con posterioridad a la eliminación definitiva, ForgeVenture conservará únicamente los datos necesarios
          para obligaciones legales (registros contables, requerimientos de autoridades), con un período máximo
          de retención de <strong style={{ color: P.text }}>siete (7) años</strong> conforme a las obligaciones
          fiscales y mercantiles ecuatorianas.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="menores" badge={{ t: "Art. 13 LOPDP", c: C.green }}>
          15. Protección de Menores de Edad
        </SectionTitle>
        <BodyP>
          ForgeVenture adopta medidas especiales para la protección de datos personales de niñas, niños y
          adolescentes, conforme al <LawRef>Art. 13 de la LOPDP</LawRef> y el principio del interés superior
          del niño reconocido por la <LawRef>Constitución del Ecuador</LawRef> y el Código de la Niñez y
          Adolescencia.
        </BodyP>
        <BodyP>
          Si ForgeVenture toma conocimiento de que ha recabado datos de un menor de trece (13) años sin el
          consentimiento verificable de su representante legal, adoptará medidas inmediatas para eliminar dicha
          información y notificará a la Autoridad de Protección de Datos Personales si fuere procedente.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="modif">16. Modificaciones a los Términos</SectionTitle>
        <BodyP>ForgeVenture se reserva el derecho de modificar los presentes Términos en cualquier momento. Las modificaciones serán notificadas mediante:</BodyP>
        <UL items={[
          "Correo electrónico dirigido a la dirección registrada en la cuenta.",
          "Aviso destacado en la plataforma durante al menos treinta (30) días calendario previos a la entrada en vigencia.",
          "Actualización de la fecha de «Última actualización» en la parte superior de este documento.",
        ]} />
        <BodyP>
          El uso continuado del Servicio tras la entrada en vigencia de las modificaciones implicará la aceptación
          de los nuevos Términos. Si el Usuario no acepta las modificaciones, deberá cancelar su cuenta antes
          de la fecha de vigencia.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="jurisd">17. Ley Aplicable y Jurisdicción</SectionTitle>
        <BodyP>
          Los presentes Términos se rigen e interpretan de conformidad con las leyes de la{" "}
          <strong style={{ color: P.text }}>República del Ecuador</strong>. Para la resolución de cualquier
          controversia, las partes se someten a la jurisdicción de los{" "}
          <strong style={{ color: P.text }}>jueces y tribunales competentes de la República del Ecuador</strong>,
          con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
        </BodyP>
        <BodyP>
          Sin perjuicio de lo anterior, el Usuario tiene derecho a presentar reclamaciones ante la{" "}
          <strong style={{ color: P.text }}>Autoridad de Protección de Datos Personales del Ecuador (ADPE)</strong>,
          organismo de control independiente creado por la <LawRef>LOPDP</LawRef>, sin necesidad de agotar
          instancias previas.
        </BodyP>
        <InfoBox color={C.blue} icon="🏛️">
          Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos (Ley No. 2002-67): Los presentes
          Términos constituyen un mensaje de datos con plena validez jurídica conforme a los artículos 2 y 45 de
          dicha Ley, y la aceptación electrónica del Usuario equivale a su firma digital.
        </InfoBox>
      </Reveal>

      <Reveal delay={0.04}>
        <SectionTitle id="contacto">18. Contacto y Canal ARCO</SectionTitle>
        <BodyP>Para consultas, solicitudes o ejercicio de derechos, el Usuario puede comunicarse a través de:</BodyP>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "14px 0" }}>
          {[
            { icon: "📧", titulo: "Consultas generales",      valor: RESPONSABLE.email,      color: C.orange },
            { icon: "🔒", titulo: "Datos personales / ARCO",  valor: RESPONSABLE.emailDatos, color: C.blue   },
          ].map((ch, i) => (
            <div key={i} style={{
              position: "relative", overflow: "hidden",
              background: "rgba(20,26,42,0.65)", backdropFilter: "blur(8px)",
              border: `1px solid ${ch.color}22`, borderTop: `2px solid ${ch.color}`,
              borderRadius: 10, padding: "16px 18px", transition: "background .15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(20,26,42,0.9)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(20,26,42,0.65)"}
            >
              <div style={{ position: "absolute", top: -12, right: -12, width: 52, height: 52, borderRadius: "50%",
                background: `radial-gradient(circle, ${ch.color}22 0%, transparent 70%)`, filter: "blur(8px)", pointerEvents: "none" }} />
              <div style={{ fontSize: 20, marginBottom: 8 }}>{ch.icon}</div>
              <div style={{ ...mono(9, 700), color: P.muted, letterSpacing: ".08em", marginBottom: 4, textTransform: "uppercase" }}>{ch.titulo}</div>
              <div style={{ ...raj(13, 600), color: C.gold }}>{ch.valor}</div>
            </div>
          ))}
        </div>
        <BodyP>
          Las solicitudes de ejercicio de derechos deberán incluir: nombre completo del titular, copia del
          documento de identidad vigente, descripción clara del derecho que se desea ejercer y, de ser
          aplicable, la documentación de respaldo correspondiente.
        </BodyP>
      </Reveal>

      <Reveal delay={0.04}>
        <div style={{
          position: "relative", overflow: "hidden",
          marginTop: 48, padding: "20px",
          background: "rgba(20,26,42,0.82)", backdropFilter: "blur(14px)",
          border: `1px solid ${C.navy}`, borderTop: `2px solid ${C.orange}`,
          borderRadius: 12,
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%",
            background: `radial-gradient(circle, ${C.orange}18 0%, transparent 70%)`, filter: "blur(12px)", pointerEvents: "none" }} />
          <div style={{ ...mono(9, 700), color: P.muted, letterSpacing: ".12em", marginBottom: 12 }}>INFORMACIÓN DEL DOCUMENTO</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { l: "Versión",             v: "1.0.0",            color: C.orange },
              { l: "Fecha de vigencia",   v: EFFECTIVE_DATE,     color: C.blue   },
              { l: "Última actualización",v: LAST_UPDATED,       color: C.gold   },
              { l: "Marco legal",         v: "LOPDP Ecuador 2021", color: C.green },
            ].map(({ l, v, color }) => (
              <div key={l}>
                <div style={{ ...mono(9, 600), color: P.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                <div style={{ ...orb(11, 700), color }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

    </article>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default function TerminosPage() {
  const navigate = useNavigate();
  const [active, setActive]   = useState(SECTIONS[0].id);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) { if (e.isIntersecting) { setActive(e.target.id); break; } }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el); });
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
        ::-webkit-scrollbar-thumb { background: ${C.orange}; border-radius: 2px; }
        a { color: ${C.gold}; text-decoration: underline; }
        a:hover { color: ${C.orange}; }
        @media (max-width: 900px) {
          .tos-layout  { grid-template-columns: 1fr !important; }
          .tos-sidebar { display: none !important; }
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
          whileHover={{ scale: 1.05, borderColor: `${C.orange}66`, color: C.orange }}
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
          <img src="/logo.png" alt="" style={{ height: 26, width: 26, objectFit: "cover", imageRendering: "pixelated", filter: `drop-shadow(0 0 6px ${C.orange}88)` }} onError={e => e.target.style.display = "none"} />
          <span style={{ ...orb(12, 900), color: P.text }}>FORGE</span>
          <span style={{ ...orb(12, 400), color: C.orange }}>VENTURE</span>
          <span style={{ color: C.navy, fontSize: 16, margin: "0 2px" }}>·</span>
          <span style={{ ...mono(9, 700), color: C.gold, letterSpacing: ".12em" }}>TÉRMINOS DE SERVICIO</span>
        </div>

        <motion.button onClick={() => navigate("/privacidad")}
          whileHover={{ scale: 1.05, borderColor: `${C.orange}66`, color: C.orange }}
          whileTap={{ scale: 0.93 }}
          style={{
            ...mono(9, 700), color: P.muted, letterSpacing: ".08em",
            background: "rgba(20,26,42,0.7)", border: `1px solid ${C.navy}`,
            backdropFilter: "blur(10px)", borderRadius: 100,
            padding: "7px 14px", cursor: "pointer",
            transition: "color .15s, border-color .15s",
          }}
        >PRIVACIDAD →</motion.button>
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
            background: `${C.orange}10`, border: `1px solid ${C.orange}33`,
            borderRadius: 100, padding: "5px 18px",
            ...mono(9, 700), letterSpacing: ".14em", color: C.orange,
          }}
        >⚖️ DOCUMENTO LEGAL OFICIAL · ECUADOR</motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ ...orb("clamp(24px,5vw,40px)", 900), color: P.text, marginBottom: 12, lineHeight: 1.1 }}
        >
          Términos de{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Servicio
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ ...raj(15, 400), color: P.muted, maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.7 }}
        >
          Este documento regula el uso de ForgeVenture y el tratamiento de tus datos personales,
          conforme a la Constitución del Ecuador y la Ley Orgánica de Protección de Datos Personales (LOPDP).
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          {[
            { label: "SECCIONES",    value: "18",           color: C.orange },
            { label: "VIGENTE",      value: "2026",         color: C.blue   },
            { label: "MARCO LEGAL",  value: "LOPDP 2021",   color: C.green  },
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
      <div className="tos-layout" style={{
        position: "relative", zIndex: 10,
        display: "grid", gridTemplateColumns: "260px 1fr",
        maxWidth: 1100, margin: "0 auto",
        padding: "0 clamp(16px,3vw,40px)",
      }}>
        {/* Sidebar */}
        <aside className="tos-sidebar" style={{
          position: "sticky", top: 60, height: "calc(100vh - 60px)",
          overflowY: "auto", padding: "24px 0",
          borderRight: `1px solid ${C.navy}`,
        }}>
          <div style={{ ...mono(9, 700), letterSpacing: ".14em", color: P.muted, marginBottom: 12, paddingLeft: 8 }}>CONTENIDO</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)} style={{
              display: "block", width: "100%", textAlign: "left",
              background: active === s.id ? `${C.orange}10` : "none", border: "none",
              borderLeft: `2px solid ${active === s.id ? C.orange : "transparent"}`,
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
          <LegalContent />
          <Reveal delay={0.04}>
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.navy}`, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.orange, ...mono(10, 700) }}>▸</span>
                <span style={{ ...orb(12, 900), color: P.text }}>FORGE</span>
                <span style={{ ...orb(12, 400), color: C.orange }}>VENTURE</span>
              </div>
              <p style={{ ...raj(12, 400), color: P.muted, lineHeight: 1.7, maxWidth: 640 }}>
                © {new Date().getFullYear()} ForgeVenture · República del Ecuador · Todos los derechos reservados.<br />
                Documento redactado conforme a la LOPDP (R.O. 459, 26-may-2021) y normativa ecuatoriana vigente.
              </p>
              <motion.button onClick={() => navigate("/privacidad")} whileHover={{ color: C.orange }}
                style={{ background: "none", border: "none", cursor: "pointer", ...mono(10, 600), color: P.muted, letterSpacing: ".08em", transition: "color .15s", alignSelf: "flex-start" }}
              >POLÍTICA DE PRIVACIDAD →</motion.button>
            </div>
          </Reveal>
        </main>
      </div>
    </>
  );
}
