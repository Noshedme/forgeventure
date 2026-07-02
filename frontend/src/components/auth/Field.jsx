// src/components/auth/Field.jsx
// ── Input RPG con efectos de foco animados, error shake y pixel corners ──
import { useState, useRef, useEffect } from "react";
import { px, raj, T } from "../shared/theme";

export default function Field({
  icon,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  hint,
  autoComplete,
  disabled = false,
}) {
  const [show,    setShow]    = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const prevError = useRef(error);

  // Agitar el wrapper cuando aparece un error nuevo
  useEffect(() => {
    if (error && error !== prevError.current && wrapRef.current) {
      wrapRef.current.classList.remove("error-shake");
      void wrapRef.current.offsetWidth; // reflow para reiniciar la animación
      wrapRef.current.classList.add("error-shake");
    }
    prevError.current = error;
  }, [error]);

  const isPassword = type === "password";
  const inputType  = isPassword && show ? "text" : type;

  const borderColor = error   ? T.error
                    : focused ? T.orange
                    :           T.navy;

  const glowColor   = error   ? `${T.error}33`
                    : focused ? `${T.orange}22`
                    :           "transparent";

  return (
    <div style={{ marginBottom: 22 }}>

      {/* Label con indicador de foco */}
      <label
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          cursor: "pointer",
        }}
      >
        {/* Icono animado al hacer focus */}
        <span style={{
          fontSize: 14,
          filter: focused ? `drop-shadow(0 0 6px ${T.orange})` : "none",
          transition: "filter 0.25s",
          animation: focused ? "floatYS 2s ease-in-out infinite" : "none",
        }}>
          {icon}
        </span>

        <span style={{
          ...px(7),
          color: focused ? T.orange : error ? T.error : T.muted,
          letterSpacing: "0.06em",
          transition: "color 0.2s",
        }}>
          {label}
        </span>

        {/* Línea de progreso animada al hacer foco */}
        <div style={{
          flex: 1, height: 1,
          background: focused
            ? `linear-gradient(90deg, ${T.orange}, transparent)`
            : `linear-gradient(90deg, ${T.navy}, transparent)`,
          transition: "background 0.3s",
        }} />

        {/* Badge requerido */}
        <span style={{
          ...px(5), color: T.muted,
          border: `1px solid ${T.navy}`,
          padding: "1px 5px",
          opacity: focused ? 0 : 1,
          transition: "opacity 0.2s",
        }}>
          REQ
        </span>
      </label>

      {/* Wrapper con pixel corners dinámicos */}
      <div
        ref={wrapRef}
        className="px-corners"
        style={{
          "--cc": error ? T.error : focused ? T.orange : T.navy,
          position: "relative",
        }}
      >
        {/* Scan line animada al hacer foco */}
        {focused && (
          <div style={{
            position: "absolute", left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${T.orange}66, transparent)`,
            animation: "scanLine 1.8s linear infinite",
            zIndex: 5,
            pointerEvents: "none",
          }} />
        )}

        {/* Input */}
        <input
          ref={inputRef}
          className="fv-input"
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          style={{
            width: "100%",
            padding: isPassword ? "14px 52px 14px 18px" : "14px 18px",
            background: focused ? "#0A1830" : T.bgPanel,
            border: `2px solid ${borderColor}`,
            color: T.white,
            ...raj(15, 500),
            outline: "none",
            boxSizing: "border-box",
            boxShadow: `2px 2px 0 rgba(0,0,0,0.4), inset 0 0 20px ${glowColor}`,
            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
            imageRendering: "pixelated",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />

        {/* Botón mostrar/ocultar contraseña */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            style={{
              position: "absolute",
              right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer",
              ...px(8),
              color: show ? T.orange : T.muted,
              transition: "color 0.2s",
              lineHeight: 1,
              padding: 4,
            }}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}

        {/* Indicador de fuerza (solo para passwords) */}
        {isPassword && value && (
          <PasswordStrength value={value} focused={focused} />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginTop: 6, padding: "6px 10px",
          background: `${T.error}0D`,
          border: `1px solid ${T.error}44`,
          animation: "questSlide 0.2s ease both",
        }}>
          <span style={{ ...px(6), color: T.error }}>⚠</span>
          <span style={{ ...raj(12, 500), color: T.error }}>{error}</span>
        </div>
      )}

      {/* Hint message */}
      {hint && !error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginTop: 6,
        }}>
          <span style={{ ...px(5), color: T.muted }}>▷</span>
          <span style={{ ...raj(12, 400), color: T.muted }}>{hint}</span>
        </div>
      )}
    </div>
  );
}

// ── Barra de fortaleza de contraseña (estilo XP bar) ─────────────
function PasswordStrength({ value, focused }) {
  const score = getStrength(value);
  const data  = [
    { label: "DÉBIL",   color: T.error,   min: 1 },
    { label: "MEDIA",   color: T.orangeL, min: 2 },
    { label: "FUERTE",  color: T.teal,    min: 3 },
    { label: "ÉPICA",   color: T.gold,    min: 4 },
  ];
  const current = data[Math.min(score - 1, 3)];
  const segments = 8;
  const filled   = Math.round((score / 4) * segments);

  if (!focused && !value) return null;

  return (
    <div style={{
      marginTop: 8,
      animation: "questSlide 0.2s ease both",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 4,
      }}>
        <span style={{ ...px(5), color: T.muted }}>FUERZA DE CONTRASEÑA</span>
        {current && (
          <span style={{ ...px(6), color: current.color }}>
            {current.label}
          </span>
        )}
      </div>
      <div style={{
        display: "flex", gap: 2, height: 6,
        background: "#0A1628",
        border: `1px solid ${current?.color ?? T.navy}33`,
        padding: 1,
      }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: "100%",
              background: i < filled
                ? `linear-gradient(to bottom, ${current.color}cc, ${current.color})`
                : "transparent",
              boxShadow: i < filled ? `0 0 4px ${current.color}66` : "none",
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function getStrength(v) {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8)               s++;
  if (/[A-Z]/.test(v))             s++;
  if (/[0-9]/.test(v))             s++;
  if (/[^A-Za-z0-9]/.test(v))     s++;
  return Math.max(s, v.length >= 6 ? 1 : 0);
}