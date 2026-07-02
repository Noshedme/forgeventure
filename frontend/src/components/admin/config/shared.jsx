// src/components/admin/config/shared.jsx
// ─────────────────────────────────────────────────────────────
//  Fuente única de verdad para tokens de diseño y componentes
//  compartidos del panel de configuración de admin.
// ─────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Save, Check, Info, AlertTriangle } from "lucide-react";

// ── Tokens de color ────────────────────────────────────────────
export const C = {
  bg:"#0A0E1A", side:"#0F141F", card:"#141A2A", panel:"#0E1520",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#D4A574", orangeL:"#E6B98A", gold:"#C9B037",
  blue:"#5A9FD4", teal:"#4A9D8F", green:"#6B9F6A",
  red:"#C66B6B", purple:"#8B7BB8",
  white:"#F0F4FF", muted:"#7A8A9E", mutedL:"#9AA3B2",
};

// ── Helpers de tipografía ──────────────────────────────────────
export const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
export const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
export const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Validadores reutilizables ─────────────────────────────────
export const VALIDATORS = {
  // URL válida; null si vacío (campo opcional)
  url(v) {
    if (!v) return null;
    try { new URL(v); return null; }
    catch { return "Debe ser una URL válida (ej. https://tuapp.com)"; }
  },
  // URL válida y no localhost — para campos de producción
  urlProduction(v) {
    if (!v) return null;
    const err = VALIDATORS.url(v);
    if (err) return err;
    try {
      const { hostname } = new URL(v);
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")
        return "La URL de producción no puede apuntar a localhost";
    } catch { /* ignorar */ }
    return null;
  },
  // Lista de orígenes CORS separados por coma
  corsOrigins(v) {
    if (!v) return null;
    const parts = v.split(",").map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (p === "*") continue;
      try { new URL(p); }
      catch { return `"${p}" no es una URL válida`; }
    }
    return null;
  },
  // Puerto TCP 1-65535 entero
  port(v) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 65535)
      return "Puerto debe ser un entero entre 1 y 65535";
    return null;
  },
  // Duración JWT: número + unidad (s/m/h/d)
  jwtDuration(v) {
    if (!v) return "Campo requerido";
    if (!/^\d+[smhd]$/.test(String(v))) return "Formato inválido (ej: 7d, 24h, 30m, 60s)";
    return null;
  },
  // Entero no negativo con límite superior opcional
  positiveInt(v, max = 10_000_000) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) return "Debe ser un número entero ≥ 0";
    if (n > max) return `Máximo permitido: ${max.toLocaleString("es")}`;
    return null;
  },
  // Longitud de contraseña 6-128
  passwordLength(v) {
    const n = Number(v);
    if (!Number.isInteger(n)) return "Debe ser un número entero";
    if (n < 6)   return "Mínimo 6 caracteres";
    if (n > 128) return "Máximo 128 caracteres";
    return null;
  },
  // Email básico
  email(v) {
    if (!v) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de email inválido";
    return null;
  },
};

// ── Spinner ────────────────────────────────────────────────────
export function Spinner({color=C.orange}) {
  return (
    <div style={{
      width:13, height:13,
      border:`2px solid ${C.muted}`,
      borderTop:`2px solid ${color}`,
      borderRadius:"50%",
      animation:"c-spin .8s linear infinite",
    }}/>
  );
}

// ── Toggle switch ──────────────────────────────────────────────
export function Toggle({on, onChange, color=C.orange, disabled=false}) {
  return (
    <button
      type="button"
      onClick={()=>!disabled&&onChange(!on)}
      className="c-toggle"
      disabled={disabled}
      style={{
        width:46, height:24,
        background: on ? color : `${C.navy}88`,
        border:`1px solid ${on ? color : C.navy}`,
        borderRadius:12,
        position:"relative", flexShrink:0, padding:0,
        boxShadow: on ? `0 0 10px ${color}44` : "none",
        opacity: disabled ? .5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div style={{
        position:"absolute", top:3,
        left: on ? 22 : 3,
        width:16, height:16,
        background: on ? C.bg : C.muted,
        borderRadius:"50%",
        transition:"left .22s ease, background .22s",
      }}/>
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────
export function CInput({value, onChange, type="text", placeholder="", disabled=false, unit, min, max, step=1, mono=false, error=null}) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:4}}>
      <div style={{position:"relative", display:"flex", alignItems:"center"}}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(type==="number" ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min} max={max} step={step}
          className="c-input"
          style={{
            width:"100%",
            padding: unit ? "10px 40px 10px 12px" : "10px 12px",
            background: C.panel,
            border:`1px solid ${error ? C.red+"88" : C.navy}`,
            borderRadius: 6,
            color: C.white,
            boxShadow: error ? `0 0 0 2px ${C.red}18` : undefined,
            ...(mono ? {fontFamily:"'Courier New',monospace", fontSize:13} : raj(13,500)),
          }}
        />
        {unit && (
          <span style={{position:"absolute", right:12, ...raj(11,600), color:C.muted, pointerEvents:"none"}}>
            {unit}
          </span>
        )}
      </div>
      {error && (
        <div style={{display:"flex", alignItems:"center", gap:5, ...raj(11,700), color:C.red}}>
          <AlertTriangle size={11} style={{flexShrink:0}}/>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────
export function CSelect({value, onChange, options, disabled=false}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="c-input c-select"
      style={{
        width:"100%", padding:"10px 12px",
        background: C.panel,
        border:`1px solid ${C.navy}`,
        borderRadius: 6,
        color: C.white,
        ...raj(13,500),
      }}
    >
      {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select>
  );
}

// ── Setting row (label izq + control der) ─────────────────────
export function SettingRow({label, hint, children, danger=false}) {
  return (
    <div className="c-row" style={{
      display:"grid", gridTemplateColumns:"1fr 1fr", gap:20,
      padding:"16px 0", borderBottom:`1px solid ${C.navy}22`,
      alignItems:"center",
    }}>
      <div>
        <div style={{...raj(13,700), color: danger ? C.red : C.white, marginBottom:3}}>{label}</div>
        {hint && <div style={{...raj(11,400), color:C.muted, lineHeight:1.5}}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Toggle row (toggle full-width con descripción) ─────────────
export function ToggleRow({label, hint, on, onChange, color=C.orange, disabled=false, badge}) {
  return (
    <div className="c-row" style={{
      display:"flex", alignItems:"center", gap:16,
      padding:"14px 18px",
      background: on ? `${color}06` : "transparent",
      border:`1px solid ${on ? color+"22" : C.navy+"44"}`,
      borderRadius: 8,
      marginBottom:8,
      transition:"all .2s",
      cursor: disabled ? "not-allowed" : "default",
    }}>
      <Toggle on={on} onChange={onChange} color={color} disabled={disabled}/>
      <div style={{flex:1}}>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <span style={{...raj(13,700), color: on ? C.white : C.mutedL}}>{label}</span>
          {badge && (
            <span style={{
              ...raj(9,700), color: badge.c||C.orange,
              background:`${badge.c||C.orange}18`,
              border:`1px solid ${badge.c||C.orange}33`,
              padding:"1px 7px", borderRadius:4,
            }}>{badge.l}</span>
          )}
        </div>
        {hint && <div style={{...raj(11,400), color:C.muted, lineHeight:1.5, marginTop:2}}>{hint}</div>}
      </div>
      <div style={{...raj(11,700), color: on ? color : C.muted}}>{on ? "ACTIVO" : "INACTIVO"}</div>
    </div>
  );
}

// ── Slider row ─────────────────────────────────────────────────
export function SliderRow({label, hint, value, onChange, min, max, step=1, unit="", color=C.orange}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
        <div>
          <div style={{...raj(13,700), color:C.white}}>{label}</div>
          {hint && <div style={{...raj(11,400), color:C.muted}}>{hint}</div>}
        </div>
        <div style={{
          background:`${color}18`, border:`1px solid ${color}44`,
          borderRadius: 6, padding:"6px 14px",
          display:"flex", alignItems:"center", gap:4,
          ...orb(15,900), color, minWidth:80, textAlign:"center", justifyContent:"center",
        }}>
          {value}{unit}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="c-range"
        style={{width:"100%", height:4, accentColor:color}}
      />
      <div style={{display:"flex", justifyContent:"space-between", ...raj(10,500), color:C.navy, marginTop:3}}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Info box ───────────────────────────────────────────────────
export function InfoBox({text, color=C.blue, icon:Icon}) {
  return (
    <div style={{
      display:"flex", gap:10,
      background:`${color}0A`,
      border:`1px solid ${color}22`,
      borderRadius: 8,
      padding:"10px 14px", marginBottom:16,
    }}>
      {Icon
        ? <Icon size={14} color={color} style={{flexShrink:0, marginTop:1}}/>
        : <Info size={14} color={color} style={{flexShrink:0, marginTop:1}}/>
      }
      <span style={{...raj(12,400), color:C.mutedL, lineHeight:1.6}}>{text}</span>
    </div>
  );
}

// ── Badge pill ─────────────────────────────────────────────────
export function Badge({text, color=C.orange}) {
  return (
    <span style={{
      ...raj(9,700), color,
      background:`${color}18`,
      border:`1px solid ${color}33`,
      padding:"2px 8px", borderRadius:4,
    }}>
      {text}
    </span>
  );
}

// ── Section card con glassmorphism + hover elevation ───────────
export function SectionCard({children, style}) {
  return (
    <motion.div
      whileHover={{
        y: -1,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
      transition={{duration:0.18, ease:"easeOut"}}
      style={{
        background: "rgba(20, 26, 42, 0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border:`1px solid ${C.navy}`,
        borderRadius: 14,
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow:"hidden",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Section body padding ───────────────────────────────────────
export function SectionBody({children}) {
  return <div style={{padding:"4px 22px 10px"}}>{children}</div>;
}

// ── Section title con icon box redondeado ──────────────────────
export function SectionTitle({icon:Icon, title, color, desc, extra}) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"18px 22px", borderBottom:`1px solid ${C.navy}22`,
      flexWrap:"wrap",
    }}>
      <div style={{
        background:`${color}18`,
        border:`1px solid ${color}33`,
        borderRadius: 8,
        padding:9, display:"flex",
      }}>
        <Icon size={16} color={color}/>
      </div>
      <div style={{flex:1}}>
        <div style={{...orb(12,700), color:C.white, marginBottom:2}}>{title}</div>
        {desc && <div style={{...raj(12,400), color:C.muted}}>{desc}</div>}
      </div>
      {extra}
    </div>
  );
}

// ── Saved badge animado ────────────────────────────────────────
export function SavedBadge({show}) {
  if(!show) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      ...raj(12,700), color:C.green,
      background:`${C.green}14`,
      border:`1px solid ${C.green}33`,
      borderRadius: 6,
      padding:"6px 14px",
      animation:"c-saved 2s ease forwards",
    }}>
      <Check size={13}/> Guardado
    </div>
  );
}

// ── Save bar global ────────────────────────────────────────────
export function SaveBar({onSave, saving, saved}) {
  return (
    <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:12, padding:"16px 0 4px"}}>
      <SavedBadge show={saved}/>
      <button
        onClick={onSave}
        disabled={saving}
        className="c-btn"
        style={{
          ...px(8),
          color: saving ? C.muted : C.bg,
          background: saving ? `${C.orange}55` : C.orange,
          border:"none", borderRadius:8,
          padding:"12px 24px",
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: saving ? "none" : `0 4px 20px ${C.orange}44`,
          animation: saving ? "none" : "c-glow 2s infinite",
          display:"flex", alignItems:"center", gap:10,
        }}
      >
        {saving ? <><Spinner/> GUARDANDO...</> : <><Save size={14}/> GUARDAR CAMBIOS</>}
      </button>
    </div>
  );
}
