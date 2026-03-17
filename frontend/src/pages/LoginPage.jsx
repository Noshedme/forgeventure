// src/pages/LoginPage.jsx
import { useState, useRef, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { checkProfile, forgotPassword, resetPassword, loginSync } from "../services/api";  // ← EDITADO: añadido loginSync
import { T, px, raj, orb } from "../components/shared/theme";
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
  @keyframes progressBar { from{width:0} to{width:var(--pw)} }
  @keyframes modalIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }

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
  .fv-btn-primary {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .fv-btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 30px #E85D0488 !important;
  }
  .fv-btn-primary:active { transform: translateY(0); }
  .fv-btn-ghost {
    transition: color 0.2s, background 0.2s;
  }
  .fv-btn-ghost:hover { color: #E85D04 !important; background: #E85D0411 !important; }
  .fv-link { transition: color 0.2s; }
  .fv-link:hover { color: #E85D04 !important; }
  .shake { animation: shake 0.4s ease; }

  .stat-row { transition: background 0.2s; }
  .stat-row:hover { background: #1E3A5F22; }

  .otp-input { text-align:center; font-size:28px; font-weight:900; letter-spacing:6px; }
`;

const firebaseError = (code) => {
  const map = {
    "auth/user-not-found":          "No existe una cuenta con ese correo",
    "auth/wrong-password":          "Contraseña incorrecta",
    "auth/invalid-credential":      "Correo o contraseña incorrectos",
    "auth/invalid-email":           "El correo no es válido",
    "auth/too-many-requests":       "Demasiados intentos. Espera un momento",
    "auth/user-disabled":           "Esta cuenta ha sido deshabilitada",
    "auth/network-request-failed":  "Sin conexión. Verifica tu internet",
    "auth/popup-closed-by-user":    "Cerraste la ventana de Google. Intenta de nuevo",
    "auth/popup-blocked":           "El navegador bloqueó el popup. Permite ventanas emergentes",
  };
  return map[code] || "Error al iniciar sesión. Intenta de nuevo";
};

const googleProvider = new GoogleAuthProvider();

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

function XPBar({ label, value, color = T.orange, delay = 0 }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ ...raj(11), color: T.muted }}>{label}</span>
        <span style={{ ...px(6), color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: "#0A1628", border: `1px solid ${color}33`, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            background: `linear-gradient(90deg,${color}88,${color})`,
            "--pw": `${value}%`,
            animation: `progressBar 1.4s ease ${delay}s both`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

function InputField({ icon, label, type = "text", value, onChange, placeholder, error, className }) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" && show ? "text" : type;

  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: "block", ...px(7), color: T.muted, marginBottom: 8, letterSpacing: "0.06em" }}>
          {icon} {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          className={`fv-input${className ? " " + className : ""}`}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: type === "password" ? "14px 48px 14px 16px" : "14px 16px",
            background: "#0A1425",
            border: `1px solid ${error ? T.error : T.navy}`,
            color: T.white,
            borderRadius: 4,
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
      {error && (
        <div style={{ ...raj(12), color: T.error, marginTop: 6 }}>⚠ {error}</div>
      )}
    </div>
  );
}

// ── Modal recuperación de contraseña ──────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep]             = useState("email");
  const [email, setEmail]           = useState("");
  const [code, setCode]             = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [shake, setShake]           = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const handleRequestCode = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Ingresa un correo válido"); triggerShake(); return;
    }
    setError(""); setLoading(true);
    try {
      await forgotPassword(email);
      setStep("code");
    } catch (err) {
      setError(err.message); triggerShake();
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6)            { setError("El código tiene 6 dígitos"); triggerShake(); return; }
    if (!newPwd || newPwd.length < 6) { setError("Mínimo 6 caracteres"); triggerShake(); return; }
    if (newPwd !== confirmPwd)         { setError("Las contraseñas no coinciden"); triggerShake(); return; }
    setError(""); setLoading(true);
    try {
      await resetPassword(email, code, newPwd);
      setStep("done");
    } catch (err) {
      setError(err.message); triggerShake();
    } finally { setLoading(false); }
  };

  const Spinner = () => (
    <div style={{ width: 13, height: 13, border: `2px solid ${T.muted}`, borderTop: `2px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 420, background: T.bgCard, border: `1px solid ${T.navy}`, borderRadius: 8, overflow: "hidden", animation: "modalIn 0.25s ease both", boxShadow: `0 0 60px ${T.orange}22, 0 20px 60px rgba(0,0,0,0.6)` }}>

        <div style={{ background: `linear-gradient(135deg,${T.bgPanel},#060D1A)`, borderBottom: `2px solid ${T.orange}`, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...px(7), color: T.orange, letterSpacing: "0.04em" }}>🔑 RECUPERAR CUENTA</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>✕</button>
        </div>

        <div style={{ padding: 28 }} className={shake ? "shake" : ""}>

          {step === "email" && (
            <>
              <p style={{ ...raj(13, 400), color: T.muted, lineHeight: 1.6, marginBottom: 24 }}>
                Ingresa tu correo y te enviaremos un{" "}
                <strong style={{ color: T.white }}>código de 6 dígitos</strong> para recuperar tu cuenta.
              </p>
              <InputField
                icon="📧" label="CORREO ELECTRÓNICO" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="heroe@forgeventure.com" error={error}
              />
              <button type="button" className="fv-btn-primary" onClick={handleRequestCode} disabled={loading}
                style={{ width: "100%", ...px(8), color: loading ? T.muted : T.bg, background: loading ? `${T.orange}66` : T.orange, border: "none", padding: "14px", cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 4px 20px ${T.orange}55`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {loading ? (<><Spinner /> ENVIANDO...</>) : "📨 ENVIAR CÓDIGO"}
              </button>
            </>
          )}

          {step === "code" && (
            <>
              <div style={{ background: `${T.orange}0D`, border: `1px solid ${T.orange}33`, borderRadius: 4, padding: "12px 16px", marginBottom: 24 }}>
                <p style={{ ...raj(12, 500), color: T.orange, margin: 0 }}>✅ Código enviado a <strong>{email}</strong></p>
                <p style={{ ...raj(11, 400), color: T.muted, margin: "4px 0 0" }}>Revisa tu bandeja de entrada (y spam).</p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", ...px(7), color: T.muted, marginBottom: 8, letterSpacing: "0.06em" }}>🔢 CÓDIGO DE 6 DÍGITOS</label>
                <input
                  className="fv-input otp-input"
                  type="text" maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  style={{ width: "100%", padding: "14px 16px", background: "#0A1425", border: `1px solid ${T.navy}`, color: T.orange, borderRadius: 4 }}
                />
              </div>

              <InputField icon="🔒" label="NUEVA CONTRASEÑA" type="password"
                value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••" />
              <InputField icon="🔑" label="CONFIRMAR CONTRASEÑA" type="password"
                value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="••••••••" error={error} />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="fv-btn-ghost"
                  onClick={() => { setStep("email"); setError(""); setCode(""); }}
                  style={{ flex: "0 0 auto", ...raj(13, 600), color: T.muted, background: "#0A1425", border: `1px solid ${T.navy}`, padding: "13px 18px", cursor: "pointer", borderRadius: 4 }}>
                  ← VOLVER
                </button>
                <button type="button" className="fv-btn-primary" onClick={handleVerifyCode} disabled={loading}
                  style={{ flex: 1, ...px(8), color: loading ? T.muted : T.bg, background: loading ? `${T.orange}66` : T.orange, border: "none", padding: "13px", cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 4px 20px ${T.orange}55`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {loading ? (<><Spinner /> VERIFICANDO...</>) : "✅ CAMBIAR CONTRASEÑA"}
                </button>
              </div>

              <button type="button" className="fv-link" onClick={handleRequestCode} disabled={loading}
                style={{ ...raj(12, 500), color: T.muted, background: "none", border: "none", cursor: "pointer", marginTop: 16, display: "block", textAlign: "center", width: "100%" }}>
                ¿No llegó? Reenviar código
              </button>
            </>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ ...orb("20px", 900), color: T.white, marginBottom: 8 }}>¡Contraseña actualizada!</h2>
              <p style={{ ...raj(13, 400), color: T.muted, lineHeight: 1.6, marginBottom: 28 }}>
                Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.
              </p>
              <button type="button" className="fv-btn-primary" onClick={onClose}
                style={{ ...px(8), color: T.bg, background: T.orange, border: "none", padding: "13px 32px", cursor: "pointer", boxShadow: `0 4px 20px ${T.orange}55`, borderRadius: 4 }}>
                ⚔️ INICIAR SESIÓN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function LoginPage({ onGoRegister, onSuccess }) {
  const canvasRef = useRef(null);
  useParticles(canvasRef);

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [success, setSuccess]           = useState(false);
  const [shake, setShake]               = useState(false);
  const [showForgot, setShowForgot]     = useState(false);
  const formRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!email.trim())                    e.email    = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Correo inválido";
    if (!password)                        e.password = "La contraseña es obligatoria";
    else if (password.length < 6)         e.password = "Mínimo 6 caracteres";
    return e;
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  // ── Helper: sincronizar login con el backend ───────────────  ← AÑADIDO
  const syncLogin = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const { firstLogin, user } = await loginSync(token);
      // firstLogin === true → primera vez, puedes usarlo para onboarding
      return { firstLogin, user };
    } catch (err) {
      // No bloqueamos el login si falla el sync
      console.warn("⚠️ loginSync falló:", err.message);
      return {};
    }
  };

  // ── Submit email/password ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); triggerShake(); return; }
    setErrors({});
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await syncLogin();  // ← AÑADIDO: actualiza lastLoginAt y firstLogin
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1800);
    } catch (err) {
      setErrors({ general: firebaseError(err.code) });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ── Login con Google ──────────────────────────────────────────
  const handleGoogle = async () => {
    setErrors({});
    setLoadingGoogle(true);
    try {
      const result     = await signInWithPopup(auth, googleProvider);
      const user       = result.user;
      const { exists } = await checkProfile(user.uid);

      if (exists) {
        await syncLogin();  // ← AÑADIDO: actualiza lastLoginAt y firstLogin
        setSuccess(true);
        setTimeout(() => onSuccess?.(), 1800);
      } else {
        onGoRegister?.({ uid: user.uid, email: user.email, username: user.displayName, fromGoogle: true });
      }
    } catch (err) {
      setErrors({ general: firebaseError(err.code) });
    } finally {
      setLoadingGoogle(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {success && <SuccessOverlay mode="login" />}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      {/* Canvas partículas */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* Scan line */}
      <div style={{ position: "fixed", left: 0, right: 0, height: 2, zIndex: 1, pointerEvents: "none", background: `linear-gradient(90deg,transparent,${T.orange}44,${T.orange},${T.orange}44,transparent)`, animation: "scanLine 7s linear infinite" }} />

      {/* Grid de fondo */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${T.navy}18 1px,transparent 1px),linear-gradient(90deg,${T.navy}18 1px,transparent 1px)`, backgroundSize: "50px 50px" }} />

      {/* Layout */}
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", zIndex: 2 }}>
        <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, background: T.bgCard, border: `1px solid ${T.navy}`, boxShadow: `0 0 60px ${T.orange}11, 0 30px 80px rgba(0,0,0,0.5)`, overflow: "hidden", animation: "pixelIn 0.5s ease both" }}>

          {/* ── PANEL IZQUIERDO ── */}
          <div style={{ background: `linear-gradient(160deg,${T.bgPanel},#060D1A)`, borderRight: `1px solid ${T.navy}`, padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <Glow color={T.orange} size={320} x="50%" y="40%" opacity={0.08} />
            <Glow color={T.blue}   size={200} x="80%" y="80%" opacity={0.05} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
              <span style={{ fontSize: 20, filter: `drop-shadow(0 0 8px ${T.orange})` }}>⚔️</span>
              <span style={{ ...px(10), color: T.orange, animation: "neonFlicker 6s ease-in-out infinite" }}>FORGE</span>
              <span style={{ ...px(10), color: T.white }}>VENTURE</span>
            </div>

            <HeroCharacter scale={1.1} />

            <div style={{ marginTop: 28, width: "100%", maxWidth: 230, background: T.bgCard, border: `1px solid ${T.orange}44`, padding: "18px 20px", boxShadow: `0 0 30px ${T.orange}22`, animation: "borderPulse 3s ease-in-out infinite" }}>
              <div style={{ ...px(6), color: T.muted, marginBottom: 12, letterSpacing: "0.06em" }}>GUERRERO · NIVEL 12</div>
              <XPBar label="XP"  value={72} color={T.orange} delay={0}   />
              <XPBar label="HP"  value={88} color="#2ecc71"  delay={0.2} />
              <XPBar label="STR" value={65} color={T.blue}   delay={0.4} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.navy}` }}>
                <span style={{ ...raj(11, 600), color: T.muted }}>🔥 RACHA</span>
                <span style={{ ...px(7), color: T.orange }}>14 DÍAS</span>
              </div>
            </div>

            <p style={{ ...raj(13, 500), color: T.muted, textAlign: "center", marginTop: 28, lineHeight: 1.6, maxWidth: 220 }}>
              Cada rep cuenta. Cada sesión es XP.{" "}
              <span style={{ color: T.white }}>Forja tu leyenda.</span>
            </p>
          </div>

          {/* ── PANEL DERECHO (formulario) ── */}
          <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

            <div style={{ marginBottom: 36, animation: "fadeUp 0.5s ease both" }}>
              <div style={{ display: "inline-block", ...px(7), color: T.orange, border: `1px solid ${T.orange}44`, background: `${T.orange}11`, padding: "4px 10px", marginBottom: 16, letterSpacing: "0.05em" }}>
                🎮 BIENVENIDO DE VUELTA
              </div>
              <h1 style={{ ...orb("28px", 900), color: T.white, marginBottom: 8, lineHeight: 1.2 }}>
                Iniciar{" "}
                <span style={{ color: T.orange, animation: "glow 2.5s ease-in-out infinite" }}>Sesión</span>
              </h1>
              <p style={{ ...raj(14, 400), color: T.muted, lineHeight: 1.6 }}>Tu aventura te espera, guerrero.</p>
            </div>

            {errors.general && (
              <div style={{ background: `${T.error}11`, border: `1px solid ${T.error}44`, padding: "12px 16px", marginBottom: 20, borderRadius: 4 }}>
                <span style={{ ...raj(13, 600), color: T.error }}>⚠ {errors.general}</span>
              </div>
            )}

            {/* Botón Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loadingGoogle || loading}
              style={{ width: "100%", padding: "13px 16px", marginBottom: 20, background: "white", border: "2px solid #e0e0e0", borderRadius: 4, cursor: loadingGoogle ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", transition: "box-shadow 0.2s, transform 0.2s", opacity: loadingGoogle ? 0.7 : 1 }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";  }}
            >
              {loadingGoogle ? (
                <><div style={{ width: 18, height: 18, border: "2px solid #ccc", borderTop: "2px solid #4285f4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ ...raj(14, 600), color: "#555" }}>Conectando...</span></>
              ) : (
                <><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.7 39.7 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg><span style={{ ...raj(14, 600), color: "#333" }}>Continuar con Google</span></>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${T.navy})` }} />
              <span style={{ ...raj(12, 500), color: T.muted, letterSpacing: "0.1em" }}>O INICIA CON CORREO</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${T.navy},transparent)` }} />
            </div>

            {/* Formulario email/password */}
            <div ref={formRef} className={shake ? "shake" : ""} style={{ animation: "fadeUp 0.5s ease 0.1s both" }}>
              <InputField
                icon="📧" label="CORREO ELECTRÓNICO" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="heroe@forgeventure.com" error={errors.email}
              />
              <InputField
                icon="🔒" label="CONTRASEÑA" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" error={errors.password}
              />

              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 28 }}>
                <button
                  type="button"
                  className="fv-link"
                  onClick={() => setShowForgot(true)}
                  style={{ ...raj(12, 500), color: T.muted, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="button"
                className="fv-btn-primary"
                onClick={handleSubmit}
                disabled={loading || loadingGoogle}
                style={{ width: "100%", ...px(9), color: loading ? T.muted : T.bg, background: loading ? `${T.orange}66` : T.orange, border: "none", padding: "16px", cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 4px 24px ${T.orange}55`, borderRadius: 4, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              >
                {loading ? (
                  <><div style={{ width: 14, height: 14, border: `2px solid ${T.muted}`, borderTop: `2px solid ${T.orange}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />CARGANDO...</>
                ) : "⚔️ ENTRAR AL JUEGO"}
              </button>
            </div>

            <p style={{ ...raj(13, 400), color: T.muted, textAlign: "center", marginTop: 32 }}>
              ¿Aún no tienes cuenta?{" "}
              <button
                type="button"
                className="fv-link"
                onClick={() => onGoRegister?.()}
                style={{ ...raj(13, 700), color: T.orange, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Crear cuenta gratis
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}