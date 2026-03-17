// src/components/auth/Field.jsx
import { px, raj } from "../shared/theme";

export default function Field({ icon, label, type = "text", value, onChange, placeholder, error, hint }) {
  const [show, setShow] = useState(false);
  const t = type === "password" && show ? "text" : type;

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", ...px(8), color: T.muted, marginBottom: 8, letterSpacing: "0.06em" }}>
        {icon} {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          className="fv-input"
          type={t}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: type === "password" ? "14px 48px 14px 16px" : "14px 16px",
            background: "#0A1425",
            border: `1px solid ${error ? T.error : T.navy}`,
            color: T.white,
            ...raj(15, 500),
            borderRadius: 4,
          }}
        />
        {type === "password" && (
          <button
            onClick={() => setShow(s => !s)}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.muted,
              fontSize: 18,
            }}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <div style={{ ...raj(12), color: T.error, marginTop: 6 }}>⚠ {error}</div>}
      {hint && !error && <div style={{ ...raj(12), color: T.muted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}