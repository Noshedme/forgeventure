// src/pages/RegisterPage.jsx
import { useState, useRef } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { registerProfile } from "../services/api";
import { T, px, raj, orb, CLASSES } from "../components/shared/theme";
import HeroCharacter from "../components/auth/HeroCharacter";
import SuccessOverlay from "../components/auth/SuccessOverlay";
import useParticles from "../components/auth/useParticles";

// ── Font injection ─────────────────────────────────────────────
if (!document.getElementById("fv-fonts")) {
  const l = document.createElement("link");
  l.id = "fv-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap";
  document.head.appendChild(l);
}

// ── Global CSS ─────────────────────────────────────────────────
const CSS = `
  @keyframes glow { 0%,100%{text-shadow:0 0 20px #E85D04,0 0 40px #E85D0455} 50%{text-shadow:0 0 30px #E85D04,0 0 70px #E85D0488,0 0 110px #E85D0433} }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pixelIn { 0%{opacity:0;transform:scale(1.04);filter:blur(6px)} 100%{opacity:1;transform:scale(1);filter:blur(0)} }
  @keyframes borderPulse { 0%,100%{border-color:#E85D04;box-shadow:0 0 10px #E85D0444} 50%{border-color:#FF9F1C;box-shadow:0 0 22px #E85D0488} }
  @keyframes scanLine { 0%{top:-2px} 100%{top:100%} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes neonFlicker { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:0.6} }
  @keyframes classReveal { from{opacity:0;transform:translateY(12px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }

  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#060D1A; overflow-x:hidden; }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:#0A1628; }
  ::-webkit-scrollbar-thumb { background:#E85D04; border-radius:3px; }

  .fv-input {
    outline: none;
    transition: border-color 0.25s, box-shadow 0.25s;
    font-family: 'Rajdhani', sans-serif;
    font-size: 15px;
    font-weight: 500;
    caret-color: #E85D04;
    border-radius: 4px;
  }
  .fv-input::placeholder { color: #3a5577; }
  .fv-input:focus {
    border-color: #E85D04 !important;
    box-shadow: 0 0 0 2px #E85D0422, 0 0 12px #E85D0433;
  }
  .fv-btn-primary { transition: transform 0.2s, box-shadow 0.2s; }
  .fv-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 30px #E85D0488 !important; }
  .fv-btn-primary:active { transform: translateY(0); }
  .fv-btn-ghost { transition: color 0.2s, background 0.2s; }
  .fv-btn-ghost:hover { color: #E85D04 !important; background: #E85D0411 !important; }
  .fv-link { transition: color 0.2s; }
  .fv-link:hover { color: #E85D04 !important; }
  .shake { animation: shake 0.4s ease; }

  .class-card { transition: all 0.25s ease; cursor: pointer; }
  .class-card:hover { transform: translateY(-3px); }
`;

const firebaseError = (code) => {
  const map = {
    "auth/email-already-in-use":   "Este correo ya tiene una cuenta registrada",
    "auth/invalid-email":          "El correo no es válido",
    "auth/weak-password":          "La contraseña es muy débil (mínimo 6 caracteres)",
    "auth/network-request-failed": "Sin conexión. Verifica tu internet",
  };
  return map[code] || "Error al crear la cuenta. Intenta de nuevo";
};

// ── Sub-components ─────────────────────────────────────────────
function Glow({ color = T.orange, size = 300, x = "50%", y = "50%", opacity = 0.12 }) {
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, width: size, height: size,
        borderRadius: "50%", background: color, filter: "blur(80px)",
        opacity, transform: "translate(-50%,-50%)", pointerEvents: "none",
      }}
    />
  );
}

function InputField({ icon, label, type = "text", value, onChange, placeholder, error, hint, disabled }) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" && show ? "text" : type;

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", ...px(7), color: T.muted, marginBottom: 8, letterSpacing: "0.06em" }}>
        {icon} {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          className="fv-input"
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: type === "password" ? "13px 48px 13px 16px" : "13px 16px",
            background: disabled ? "#0A1628" : "#0A1425",      // ← gris si está bloqueado
            border: `1px solid ${error ? T.error : T.navy}`,
            color: disabled ? T.muted : T.white,
            borderRadius: 4,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", color: T.muted, fontSize: 17,
            }}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <div style={{ ...raj(12), color: T.error, marginTop: 5 }}>⚠ {error}</div>}
      {hint && !error && <div style={{ ...raj(11, 400), color: T.muted, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

// ── Class selector inline ──────────────────────────────────────
function ClassSelector({ selected, onChange }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ ...px(7), color: T.muted, marginBottom: 12, letterSpacing: "0.06em" }}>
        🎭 ELIGE TU CLASE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {CLASSES.map((c, i) => (
          <div
            key={i}
            className="class-card"
            onClick={() => onChange(i)}
            style={{
              border: `2px solid ${selected === i ? c.color : T.navy}`,
              background: selected === i ? `${c.color}22` : "#0A1425",
              padding: "14px 10px",
              textAlign: "center",
              borderRadius: 6,
              boxShadow: selected === i ? `0 0 18px ${c.color}44` : "none",
              animation: `classReveal 0.3s ease ${i * 0.06}s both`,
            }}
          >
            <div style={{
              fontSize: 28, marginBottom: 7,
              filter: selected === i ? `drop-shadow(0 0 10px ${c.color})` : "none",
              transition: "filter 0.25s",
            }}>
              {c.icon}
            </div>
            <div style={{ ...px(6), color: selected === i ? c.color : T.muted, marginBottom: 4 }}>
              {c.name}
            </div>
            <div style={{ ...raj(10, 400), color: selected === i ? c.color : T.muted, lineHeight: 1.3, opacity: 0.8 }}>
              {c.bonus}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, padding: "10px 14px",
        background: `${CLASSES[selected].color}0D`,
        border: `1px solid ${CLASSES[selected].color}33`,
        borderRadius: 4,
      }}>
        <span style={{ ...raj(12, 600), color: CLASSES[selected].color }}>
          ⚡ {CLASSES[selected].bonus} — activo desde el día 1
        </span>
      </div>
    </div>
  );
}

// ── StrengthBar ────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const calc = () => {
    if (!password) return { score: 0, label: "", color: "transparent" };
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (s <= 1) return { score: 20,  label: "Débil",    color: T.error   };
    if (s <= 2) return { score: 40,  label: "Regular",  color: T.orangeL };
    if (s <= 3) return { score: 65,  label: "Buena",    color: T.orange  };
    if (s <= 4) return { score: 85,  label: "Fuerte",   color: "#2ecc71" };
    return               { score: 100, label: "Épica 🔥", color: T.gold  };
  };
  const { score, label, color } = calc();
  if (!password) return null;

  return (
    <div style={{ marginTop: -8, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ ...raj(11, 500), color: T.muted }}>Fortaleza de contraseña</span>
        <span style={{ ...raj(11, 700), color }}>{label}</span>
      </div>
      <div style={{ height: 5, background: "#0A1628", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`,
          background: `linear-gradient(90deg,${color}88,${color})`,
          transition: "width 0.4s ease, background 0.4s ease",
          boxShadow: `0 0 6px ${color}66`,
        }} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
// googleData: { uid, email, username, fromGoogle } — viene del LoginPage
export default function RegisterPage({ onGoLogin, onSuccess, googleData }) {  // ← AÑADIDO googleData
  const canvasRef = useRef(null);
  useParticles(canvasRef);

  const fromGoogle = !!googleData?.fromGoogle;  // ← AÑADIDO

  // Si viene de Google, pre-rellenamos datos y saltamos al paso 2
  const [username, setUsername]     = useState(googleData?.username || "");  // ← EDITADO
  const [email, setEmail]           = useState(googleData?.email    || "");  // ← EDITADO
  const [password, setPassword]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [classIdx, setClassIdx]     = useState(0);
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [shake, setShake]           = useState(false);
  const [step, setStep]             = useState(fromGoogle ? 2 : 1);  // ← EDITADO: Google → directo a clase
  const formRef = useRef(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // ── Validación paso 1 ──────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    if (!username.trim())                 e.username   = "El nombre de héroe es obligatorio";
    else if (username.length < 3)         e.username   = "Mínimo 3 caracteres";
    if (!email.trim())                    e.email      = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email      = "Correo inválido";
    if (!password)                        e.password   = "La contraseña es obligatoria";
    else if (password.length < 6)         e.password   = "Mínimo 6 caracteres";
    if (!confirmPwd)                      e.confirmPwd = "Confirma tu contraseña";
    else if (confirmPwd !== password)     e.confirmPwd = "Las contraseñas no coinciden";
    return e;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) { setErrors(errs); triggerShake(); return; }
    setErrors({});
    setStep(2);
  };

  // ── Submit con Firebase + backend ─────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (fromGoogle) {
        // ── Usuario de Google: ya autenticado, solo guardar perfil ──  ← AÑADIDO
        await registerProfile(googleData.uid, username, googleData.email, CLASSES[classIdx].name);
      } else {
        // ── Usuario normal: crear cuenta + guardar perfil ─────────
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        await registerProfile(cred.user.uid, username, email, CLASSES[classIdx].name);
      }
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err) {
      setErrors({ general: firebaseError(err.code) || err.message });
      if (!fromGoogle) setStep(1);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {success && <SuccessOverlay mode="register" />}

      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      <div style={{
        position: "fixed", left: 0, right: 0, height: 2, zIndex: 1, pointerEvents: "none",
        background: `linear-gradient(90deg,transparent,${T.orange}44,${T.orange},${T.orange}44,transparent)`,
        animation: "scanLine 7s linear infinite",
      }} />

      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${T.navy}18 1px,transparent 1px),linear-gradient(90deg,${T.navy}18 1px,transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div style={{
        minHeight: "100vh", background: T.bg, display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "24px 16px", position: "relative", zIndex: 2,
      }}>
        <div style={{
          width: "100%", maxWidth: 960,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 0, background: T.bgCard,
          border: `1px solid ${T.navy}`,
          boxShadow: `0 0 60px ${T.orange}11, 0 30px 80px rgba(0,0,0,0.5)`,
          overflow: "hidden",
          animation: "pixelIn 0.5s ease both",
        }}>

          {/* ── PANEL IZQUIERDO ── */}
          <div style={{
            background: `linear-gradient(160deg,${T.bgPanel},#060D1A)`,
            borderRight: `1px solid ${T.navy}`,
            padding: "48px 40px",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            <Glow color={T.orange} size={320} x="50%" y="40%" opacity={0.08} />
            <Glow color="#9B59B6"  size={180} x="10%" y="70%" opacity={0.06} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
              <span style={{ fontSize: 20, filter: `drop-shadow(0 0 8px ${T.orange})` }}>⚔️</span>
              <span style={{ ...px(10), color: T.orange, animation: "neonFlicker 6s ease-in-out infinite" }}>FORGE</span>
              <span style={{ ...px(10), color: T.white }}>VENTURE</span>
            </div>

            <div style={{ position: "relative" }}>
              <HeroCharacter scale={1.1} />
              <div key={classIdx} style={{
                position: "absolute", top: -10, right: -20,
                ...px(8), color: CLASSES[classIdx].color,
                border: `2px solid ${CLASSES[classIdx].color}`,
                background: CLASSES[classIdx].bg,
                padding: "4px 10px",
                boxShadow: `0 0 16px ${CLASSES[classIdx].color}55`,
                animation: "classReveal 0.3s ease both",
                whiteSpace: "nowrap",
              }}>
                {CLASSES[classIdx].icon} {CLASSES[classIdx].name}
              </div>
            </div>

            {/* Banner Google si viene de Google  ← AÑADIDO */}
            {fromGoogle && (
              <div style={{
                marginTop: 20, width: "100%",
                background: "#4285F411", border: "1px solid #4285F444",
                padding: "10px 14px", borderRadius: 4, textAlign: "center",
              }}>
                <div style={{ ...raj(11, 600), color: T.blue, marginBottom: 3 }}>✅ Cuenta Google vinculada</div>
                <div style={{ ...raj(11, 400), color: T.muted }}>{googleData.email}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 24, marginBottom: 20 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: `2px solid ${step >= s ? T.orange : T.navy}`,
                    background: step > s ? T.orange : step === s ? `${T.orange}22` : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    ...px(7), color: step >= s ? (step > s ? T.bg : T.orange) : T.muted,
                    transition: "all 0.3s ease",
                    boxShadow: step === s ? `0 0 12px ${T.orange}66` : "none",
                  }}>
                    {step > s ? "✓" : s}
                  </div>
                  {s < 2 && (
                    <div style={{
                      width: 32, height: 2,
                      background: step > s ? T.orange : T.navy,
                      transition: "background 0.3s ease",
                    }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 28 }}>
              {[["1", "DATOS"], ["2", "CLASE"]].map(([n, lbl]) => (
                <div key={n} style={{ textAlign: "center" }}>
                  <div style={{ ...raj(11, 600), color: step >= Number(n) ? T.orange : T.muted, letterSpacing: "0.08em" }}>
                    {lbl}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 30, width: "100%", background: T.bgCard, border: `1px solid ${T.navy}`, padding: "16px 18px" }}>
              <div style={{ ...px(6), color: T.muted, marginBottom: 12, letterSpacing: "0.05em" }}>¿QUÉ OBTIENES?</div>
              {[["🎮","Personaje RPG único"],["⚡","XP real por ejercicio"],["🏆","+30 logros desbloqueables"],["🤖","Forge AI — tu entrenador"]].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "6px 0", borderBottom: `1px solid ${T.navy}44` }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ ...raj(12, 500), color: T.white }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── PANEL DERECHO ── */}
          <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>

            <div style={{ marginBottom: 28, animation: "fadeUp 0.5s ease both" }}>
              <div style={{
                display: "inline-block", ...px(7),
                color: T.orange, border: `1px solid ${T.orange}44`,
                background: `${T.orange}11`, padding: "4px 10px",
                marginBottom: 16, letterSpacing: "0.05em",
              }}>
                {fromGoogle ? "🌐 CUENTA GOOGLE" : "🎉 NUEVA CUENTA · GRATIS"}  {/* ← EDITADO */}
              </div>
              <h1 style={{ ...orb("26px", 900), color: T.white, marginBottom: 8, lineHeight: 1.2 }}>
                {step === 1 ? (
                  <>Forja tu <span style={{ color: T.orange, animation: "glow 2.5s ease-in-out infinite" }}>Héroe</span></>
                ) : (
                  <>Elige tu <span style={{ color: CLASSES[classIdx].color }}>Clase</span></>
                )}
              </h1>
              <p style={{ ...raj(13, 400), color: T.muted, lineHeight: 1.6 }}>
                {fromGoogle /* ← EDITADO */
                  ? "Tu cuenta de Google está lista. Solo elige tu clase."
                  : step === 1
                    ? "Crea tu cuenta y empieza a ganar XP hoy mismo."
                    : "Tu clase define tu bono de XP. ¡Escoge sabiamente!"}
              </p>
            </div>

            {errors.general && (
              <div style={{ background: `${T.error}11`, border: `1px solid ${T.error}44`, padding: "12px 16px", marginBottom: 20, borderRadius: 4 }}>
                <span style={{ ...raj(13, 600), color: T.error }}>⚠ {errors.general}</span>
              </div>
            )}

            <div ref={formRef} className={shake ? "shake" : ""} style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>

              {/* ── STEP 1: Datos (solo si NO es Google) ── */}
              {step === 1 && !fromGoogle && (
                <>
                  <InputField icon="⚔️" label="NOMBRE DE HÉROE" type="text"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Aragorn_Dev" error={errors.username} hint="Este será tu nombre en el juego" />
                  <InputField icon="📧" label="CORREO ELECTRÓNICO" type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="heroe@forgeventure.com" error={errors.email} />
                  <InputField icon="🔒" label="CONTRASEÑA" type="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" error={errors.password} />
                  <PasswordStrength password={password} />
                  <InputField icon="🔑" label="CONFIRMAR CONTRASEÑA" type="password"
                    value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••" error={errors.confirmPwd} />

                  <button type="button" className="fv-btn-primary" onClick={handleNext}
                    style={{
                      width: "100%", ...px(9),
                      color: T.bg, background: T.orange, border: "none",
                      padding: "16px", cursor: "pointer",
                      boxShadow: `0 4px 24px ${T.orange}55`,
                      borderRadius: 4, marginTop: 8,
                    }}>
                    SIGUIENTE → ELEGIR CLASE
                  </button>
                </>
              )}

              {/* ── STEP 2: Clase ── */}
              {step === 2 && (
                <>
                  {/* Si viene de Google, nombre editable encima de la clase  ← AÑADIDO */}
                  {fromGoogle && (
                    <InputField icon="⚔️" label="NOMBRE DE HÉROE" type="text"
                      value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="Aragorn_Dev" error={errors.username}
                      hint="Puedes cambiar tu nombre de héroe" />
                  )}

                  <ClassSelector selected={classIdx} onChange={setClassIdx} />

                  <div style={{ display: "flex", gap: 12 }}>
                    {/* Botón Volver solo si NO es Google  ← AÑADIDO condicional */}
                    {!fromGoogle && (
                      <button type="button" className="fv-btn-ghost" onClick={() => setStep(1)}
                        style={{
                          flex: "0 0 auto", ...raj(14, 600),
                          color: T.muted, background: "#0A1425",
                          border: `1px solid ${T.navy}`, padding: "14px 20px",
                          cursor: "pointer", borderRadius: 4,
                        }}>
                        ← VOLVER
                      </button>
                    )}
                    <button type="button" className="fv-btn-primary" onClick={handleSubmit} disabled={loading}
                      style={{
                        flex: 1, ...px(8),
                        color: loading ? T.muted : T.bg,
                        background: loading ? `${T.orange}66` : T.orange,
                        border: "none", padding: "14px",
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: `0 4px 24px ${T.orange}55`,
                        borderRadius: 4,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      }}>
                      {loading ? (
                        <>
                          <div style={{
                            width: 13, height: 13,
                            border: `2px solid ${T.muted}`,
                            borderTop: `2px solid ${T.orange}`,
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }} />
                          CREANDO...
                        </>
                      ) : `⚔️ JUGAR COMO ${CLASSES[classIdx].name}`}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Divider + botón Google solo si NO viene de Google  ← AÑADIDO condicional */}
            {!fromGoogle && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${T.navy})` }} />
                  <span style={{ ...raj(12, 500), color: T.muted, letterSpacing: "0.1em" }}>O</span>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${T.navy},transparent)` }} />
                </div>

                <button type="button" className="fv-btn-ghost" style={{
                  width: "100%", ...raj(14, 600),
                  color: T.muted, background: "#0A1425",
                  border: `1px solid ${T.navy}`, padding: "13px 16px",
                  cursor: "pointer", borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  letterSpacing: "0.04em",
                }}>
                  <span style={{ fontSize: 18 }}>🌐</span> Registrarse con Google
                </button>
              </>
            )}

            <p style={{ ...raj(11, 400), color: T.muted, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
              Al crear tu cuenta aceptas los{" "}
              <button type="button" className="fv-link" style={{ ...raj(11, 600), color: T.orange, background: "none", border: "none", cursor: "pointer" }}>
                Términos de Servicio
              </button>
            </p>

            <p style={{ ...raj(13, 400), color: T.muted, textAlign: "center", marginTop: 20 }}>
              ¿Ya tienes cuenta?{" "}
              <button type="button" className="fv-link" onClick={onGoLogin} style={{
                ...raj(13, 700), color: T.orange,
                background: "none", border: "none",
                cursor: "pointer", textDecoration: "underline",
              }}>
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       