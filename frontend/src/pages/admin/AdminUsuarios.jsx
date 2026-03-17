// src/pages/admin/AdminUsuarios.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión completa de usuarios para el Admin de ForgeVenture.
//  UI lista para conectar al backend — datos mock por ahora.
//  Conectar: getUsers(), updateUserRole(), deleteUser() de api.js
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, Filter, RefreshCw,
  Eye, Edit2, Trash2, Shield, ShieldOff,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, User, Mail, Calendar,
  Zap, Flame, Trophy, Star, MoreVertical,
} from "lucide-react";

// ── Theme (mismo que AdminDashboard) ──────────────────────────
const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

const CSS = `
  @keyframes u-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes u-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes u-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes u-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes u-ping    { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
  @keyframes u-shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  @keyframes u-modalIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .u-row { transition:background .15s; }
  .u-row:hover { background:${C.navyL}18 !important; }
  .u-btn { transition:all .18s; cursor:pointer; }
  .u-btn:hover:not(:disabled) { transform:translateY(-2px); opacity:.9; }
  .u-icon-btn { transition:all .2s; cursor:pointer; }
  .u-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .u-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22,0 0 14px ${C.orange}18; }
  .u-input::placeholder { color:${C.navy}; }
  .u-tag { transition:all .2s; cursor:pointer; }
  .u-tag:hover { opacity:.8; transform:scale(.97); }
  .u-sort { cursor:pointer; transition:color .2s; user-select:none; }
  .u-sort:hover { color:${C.orange} !important; }
  .u-checkbox { cursor:pointer; }
  .u-select { outline:none; cursor:pointer; }
  .u-select:focus { border-color:${C.orange}; }
`;

// ── Helpers ────────────────────────────────────────────────────
const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

const CLS_META = {
  GUERRERO: { color:C.orange, icon:"⚔️", bg:"#E85D0414" },
  ARQUERO:  { color:C.blue,   icon:"🏃", bg:"#4CC9F014" },
  MAGO:     { color:C.purple, icon:"🧘", bg:"#9B59B614" },
};

// ── Mock data — reemplazar con getUsers(token) ─────────────────
const MOCK_USERS = [
  { uid:"u1",  username:"Aragorn_Dev",   email:"aragorn@mail.com",   heroClass:"GUERRERO", roleId:"user",  level:12, xp:2840, streak:14, hp:88, status:"active",   createdAt:"2024-11-10", lastLoginAt:"2025-03-16" },
  { uid:"u2",  username:"LegolasRunner", email:"legolas@mail.com",   heroClass:"ARQUERO",  roleId:"user",  level:8,  xp:1920, streak:7,  hp:72, status:"active",   createdAt:"2024-12-03", lastLoginAt:"2025-03-15" },
  { uid:"u3",  username:"GandalfZen",    email:"gandalf@mail.com",   heroClass:"MAGO",     roleId:"user",  level:21, xp:5600, streak:30, hp:95, status:"active",   createdAt:"2024-10-01", lastLoginAt:"2025-03-16" },
  { uid:"u4",  username:"SauronFit",     email:"sauron@mail.com",    heroClass:"GUERRERO", roleId:"user",  level:3,  xp:480,  streak:0,  hp:40, status:"inactive", createdAt:"2025-01-20", lastLoginAt:"2025-03-13" },
  { uid:"u5",  username:"FrodoBags",     email:"frodo@mail.com",     heroClass:"MAGO",     roleId:"user",  level:6,  xp:1100, streak:4,  hp:60, status:"active",   createdAt:"2024-12-15", lastLoginAt:"2025-03-14" },
  { uid:"u6",  username:"BoromirStrong", email:"boromir@mail.com",   heroClass:"GUERRERO", roleId:"user",  level:9,  xp:2100, streak:11, hp:85, status:"active",   createdAt:"2024-11-28", lastLoginAt:"2025-03-16" },
  { uid:"u7",  username:"ArwenSpeed",    email:"arwen@mail.com",     heroClass:"ARQUERO",  roleId:"user",  level:15, xp:3800, streak:22, hp:90, status:"active",   createdAt:"2024-10-20", lastLoginAt:"2025-03-15" },
  { uid:"u8",  username:"SamwiseHero",   email:"samwise@mail.com",   heroClass:"MAGO",     roleId:"user",  level:4,  xp:720,  streak:2,  hp:55, status:"active",   createdAt:"2025-02-01", lastLoginAt:"2025-03-12" },
  { uid:"u9",  username:"GimliAxe",      email:"gimli@mail.com",     heroClass:"GUERRERO", roleId:"user",  level:18, xp:4500, streak:19, hp:92, status:"active",   createdAt:"2024-09-14", lastLoginAt:"2025-03-16" },
  { uid:"u10", username:"PippinFlex",    email:"pippin@mail.com",    heroClass:"ARQUERO",  roleId:"user",  level:2,  xp:220,  streak:0,  hp:30, status:"inactive", createdAt:"2025-02-28", lastLoginAt:"2025-03-10" },
  { uid:"u11", username:"EowynBrave",    email:"eowyn@mail.com",     heroClass:"ARQUERO",  roleId:"user",  level:11, xp:2650, streak:8,  hp:78, status:"active",   createdAt:"2024-11-05", lastLoginAt:"2025-03-15" },
  { uid:"u12", username:"ThranduilKing", email:"thranduil@mail.com", heroClass:"MAGO",     roleId:"admin", level:99, xp:99999,streak:100,hp:100,status:"active",   createdAt:"2024-08-01", lastLoginAt:"2025-03-16" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

// ── Mini bar component ─────────────────────────────────────────
function MiniBar({ val, color, height = 5 }) {
  return (
    <div style={{ height, background:C.panel, border:`1px solid ${color}22`, overflow:"hidden", width:"100%" }}>
      <div style={{ height:"100%", width:`${val}%`, background:color, boxShadow:`0 0 5px ${color}66`, transition:"width .6s ease" }}/>
    </div>
  );
}

// ── Badge clase ────────────────────────────────────────────────
function ClsBadge({ cls }) {
  const m = CLS_META[cls] || { color:C.muted, icon:"?", bg:C.panel };
  return (
    <span style={{ ...raj(11,700), color:m.color, background:m.bg, border:`1px solid ${m.color}33`, padding:"3px 8px", display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
      {m.icon} {cls}
    </span>
  );
}

// ── Status dot ─────────────────────────────────────────────────
function StatusDot({ status }) {
  const on = status === "active";
  return (
    <div style={{ position:"relative", width:8, height:8, flexShrink:0 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:on?C.green:C.red }}/>
      {on && <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:C.green, animation:"u-ping 1.5s ease-in-out infinite" }}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Ver usuario
// ══════════════════════════════════════════════════════════════
function ViewModal({ user, onClose }) {
  const m = CLS_META[user.heroClass] || {};
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:500, background:C.card, border:`1px solid ${m.color || C.navy}55`, boxShadow:`0 0 60px ${m.color||C.orange}11,0 24px 60px rgba(0,0,0,.6)`, animation:"u-modalIn .25s ease both", position:"relative", overflow:"hidden" }}>
        {/* top accent */}
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${m.color||C.orange},transparent)` }}/>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.navy}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, background:`${m.color||C.orange}18`, border:`2px solid ${m.color||C.orange}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
              {m.icon || "👤"}
            </div>
            <div>
              <div style={{ ...orb(14,900), color:C.white }}>{user.username}</div>
              <div style={{ ...raj(12,500), color:C.muted }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="u-icon-btn" style={{ background:"transparent", border:`1px solid ${C.navy}`, padding:7, color:C.muted, display:"flex" }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
          {/* stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[
              { label:"NIVEL",   value:`Lv.${user.level}`, color:C.gold   },
              { label:"XP",      value:user.xp.toLocaleString(), color:C.orange },
              { label:"RACHA",   value:`${user.streak}d 🔥`, color:C.orangeL },
              { label:"HP",      value:`${user.hp}%`,       color:C.green  },
            ].map((s,i) => (
              <div key={i} style={{ background:C.panel, border:`1px solid ${s.color}22`, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ ...orb(16,900), color:s.color, marginBottom:3 }}>{s.value}</div>
                <div style={{ ...px(5), color:C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* bars */}
          <div>
            <div style={{ ...px(6), color:C.muted, marginBottom:10, letterSpacing:".05em" }}>ESTADÍSTICAS</div>
            {[
              { label:"XP Progress", val:Math.min((user.xp / 6000)*100, 100), color:C.orange },
              { label:"HP",          val:user.hp, color:C.green },
              { label:"Racha",       val:Math.min((user.streak/30)*100,100), color:C.orangeL },
            ].map((b,i) => (
              <div key={i} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ ...raj(12,500), color:C.muted }}>{b.label}</span>
                  <span style={{ ...raj(12,700), color:b.color }}>{Math.round(b.val)}%</span>
                </div>
                <MiniBar val={b.val} color={b.color} height={7}/>
              </div>
            ))}
          </div>

          {/* info grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"🎭", label:"Clase",      value:user.heroClass },
              { icon:"🛡️", label:"Rol",        value:user.roleId.toUpperCase() },
              { icon:"📅", label:"Registrado", value:user.createdAt },
              { icon:"🕐", label:"Último login",value:user.lastLoginAt },
            ].map((f,i) => (
              <div key={i} style={{ background:C.panel, border:`1px solid ${C.navy}`, padding:"10px 14px" }}>
                <div style={{ ...raj(11,500), color:C.muted, marginBottom:3 }}>{f.icon} {f.label}</div>
                <div style={{ ...raj(13,700), color:C.white }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* status */}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:C.panel, border:`1px solid ${user.status==="active"?C.green:C.red}33` }}>
            <StatusDot status={user.status}/>
            <span style={{ ...raj(13,700), color:user.status==="active"?C.green:C.red }}>
              {user.status === "active" ? "CUENTA ACTIVA" : "CUENTA INACTIVA"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Editar usuario
// ══════════════════════════════════════════════════════════════
function EditModal({ user, onClose, onSave }) {
  const [form,    setForm]    = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [shake,   setShake]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

  const save = async () => {
    if (!form.username.trim() || !form.email.trim()) {
      setShake(true); setTimeout(() => setShake(false), 500); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // ← reemplazar con updateUser(token, uid, form)
    setLoading(false);
    onSave(form);
    onClose();
  };

  const inputStyle = { width:"100%", padding:"12px 14px", background:C.panel, border:`1px solid ${C.navy}`, color:C.white, ...raj(14,500) };
  const labelStyle = { display:"block", ...px(6), color:C.muted, marginBottom:7, letterSpacing:".06em" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:520, background:C.card, border:`1px solid ${C.navy}`, boxShadow:`0 0 60px ${C.orange}11,0 24px 60px rgba(0,0,0,.6)`, animation:"u-modalIn .25s ease both", overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${C.orange},transparent)` }}/>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:`1px solid ${C.navy}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Edit2 size={16} color={C.orange}/>
            <span style={{ ...orb(12,700), color:C.white }}>EDITAR USUARIO</span>
            <span style={{ ...raj(12,500), color:C.muted }}>— {user.username}</span>
          </div>
          <button onClick={onClose} className="u-icon-btn" style={{ background:"transparent", border:`1px solid ${C.navy}`, padding:7, color:C.muted, display:"flex" }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:24 }} className={shake?"u-shake":""}>
          {/* row 1 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>👤 NOMBRE DE HÉROE</label>
              <input className="u-input" value={form.username} onChange={e => set("username",e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>📧 EMAIL</label>
              <input className="u-input" type="email" value={form.email} onChange={e => set("email",e.target.value)} style={inputStyle}/>
            </div>
          </div>

          {/* row 2 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>🎭 CLASE</label>
              <select className="u-input u-select" value={form.heroClass} onChange={e => set("heroClass",e.target.value)}
                style={{ ...inputStyle, appearance:"none" }}>
                {["GUERRERO","ARQUERO","MAGO"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>🛡️ ROL</label>
              <select className="u-input u-select" value={form.roleId} onChange={e => set("roleId",e.target.value)}
                style={{ ...inputStyle, appearance:"none" }}>
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>● ESTADO</label>
              <select className="u-input u-select" value={form.status} onChange={e => set("status",e.target.value)}
                style={{ ...inputStyle, appearance:"none" }}>
                <option value="active">ACTIVO</option>
                <option value="inactive">INACTIVO</option>
              </select>
            </div>
          </div>

          {/* row 3 */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:24 }}>
            {[
              { key:"level", label:"⚔️ NIVEL", type:"number", min:1 },
              { key:"xp",    label:"⚡ XP",    type:"number", min:0 },
              { key:"streak",label:"🔥 RACHA", type:"number", min:0 },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input className="u-input" type={f.type} min={f.min} value={form[f.key]}
                  onChange={e => set(f.key, Number(e.target.value))}
                  style={inputStyle}/>
              </div>
            ))}
          </div>

          {/* actions */}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} className="u-btn" style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, padding:"12px 20px", cursor:"pointer" }}>
              CANCELAR
            </button>
            <button onClick={save} disabled={loading} className="u-btn" style={{ flex:1, ...px(8), color:loading?C.muted:C.bg, background:loading?`${C.orange}55`:C.orange, border:"none", padding:"12px", cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 20px ${C.orange}44`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {loading ? <><div style={{ width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${C.orange}`,borderRadius:"50%",animation:"u-spin .8s linear infinite" }}/> GUARDANDO...</> : <><Check size={14}/> GUARDAR CAMBIOS</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Confirmar eliminación
// ══════════════════════════════════════════════════════════════
function DeleteModal({ user, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [typed,   setTyped]   = useState("");

  const confirm = async () => {
    if (typed !== user.username) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // ← reemplazar con deleteUser(token, uid)
    setLoading(false);
    onConfirm(user.uid);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.8)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:420, background:C.card, border:`1px solid ${C.red}44`, boxShadow:`0 0 60px ${C.red}14,0 24px 60px rgba(0,0,0,.6)`, animation:"u-modalIn .25s ease both", overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${C.red},transparent)` }}/>

        <div style={{ padding:"24px 24px 28px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ background:`${C.red}18`, border:`1px solid ${C.red}44`, padding:10, display:"flex" }}>
              <AlertTriangle size={22} color={C.red}/>
            </div>
            <div>
              <div style={{ ...orb(13,900), color:C.red, marginBottom:3 }}>ELIMINAR USUARIO</div>
              <div style={{ ...raj(12,500), color:C.muted }}>Esta acción no se puede deshacer</div>
            </div>
          </div>

          <div style={{ background:`${C.red}0A`, border:`1px solid ${C.red}22`, padding:"14px 16px", marginBottom:20 }}>
            <div style={{ ...raj(13,600), color:C.white, marginBottom:4 }}>Vas a eliminar permanentemente:</div>
            <div style={{ ...raj(14,700), color:C.red }}>{user.username}</div>
            <div style={{ ...raj(12,400), color:C.muted }}>{user.email} · Lv.{user.level}</div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", ...px(6), color:C.muted, marginBottom:8, letterSpacing:".06em" }}>
              ESCRIBE <span style={{ color:C.red }}>{user.username}</span> PARA CONFIRMAR
            </label>
            <input className="u-input" value={typed} onChange={e => setTyped(e.target.value)}
              placeholder={user.username}
              style={{ width:"100%", padding:"12px 14px", background:C.panel, border:`1px solid ${typed===user.username?C.red:C.navy}`, color:C.white, ...raj(14,600) }}/>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} className="u-btn" style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, padding:"12px 20px", cursor:"pointer" }}>
              CANCELAR
            </button>
            <button onClick={confirm} disabled={typed!==user.username||loading} className="u-btn"
              style={{ flex:1, ...px(7), color:(typed===user.username&&!loading)?C.white:C.muted,
                background:(typed===user.username&&!loading)?C.red:`${C.red}22`,
                border:`1px solid ${C.red}55`, padding:"12px", cursor:typed===user.username?"pointer":"not-allowed",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all .2s" }}>
              {loading ? <><div style={{ width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${C.red}`,borderRadius:"50%",animation:"u-spin .8s linear infinite" }}/> ELIMINANDO...</> : <><Trash2 size={13}/> ELIMINAR DEFINITIVAMENTE</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Crear usuario
// ══════════════════════════════════════════════════════════════
function CreateModal({ onClose, onSave }) {
  const [form, setForm] = useState({ username:"", email:"", heroClass:"GUERRERO", roleId:"user", level:1, xp:0, streak:0, hp:100, status:"active" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [shake, setShake]     = useState(false);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Requerido";
    if (!form.email.includes("@")) e.email = "Email inválido";
    return e;
  };

  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(()=>setShake(false),500); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900)); // ← reemplazar con registerProfile(...)
    setLoading(false);
    onSave({ ...form, uid:`u${Date.now()}`, createdAt:new Date().toISOString().slice(0,10), lastLoginAt:"—" });
    onClose();
  };

  const inputStyle = { width:"100%", padding:"12px 14px", background:C.panel, border:`1px solid ${C.navy}`, color:C.white, ...raj(14,500) };
  const labelStyle = { display:"block", ...px(6), color:C.muted, marginBottom:7, letterSpacing:".06em" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:540, background:C.card, border:`1px solid ${C.green}33`, boxShadow:`0 0 60px ${C.green}0A,0 24px 60px rgba(0,0,0,.6)`, animation:"u-modalIn .25s ease both", overflow:"hidden" }}>
        <div style={{ height:3, background:`linear-gradient(90deg,transparent,${C.green},transparent)` }}/>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:`1px solid ${C.navy}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Plus size={16} color={C.green}/>
            <span style={{ ...orb(12,700), color:C.white }}>CREAR USUARIO</span>
          </div>
          <button onClick={onClose} className="u-icon-btn" style={{ background:"transparent", border:`1px solid ${C.navy}`, padding:7, color:C.muted, display:"flex" }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:24 }} className={shake?"u-shake":""}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>👤 NOMBRE DE HÉROE</label>
              <input className="u-input" value={form.username} onChange={e=>set("username",e.target.value)} style={{ ...inputStyle, borderColor:errors.username?C.red:C.navy }} placeholder="Ej: WarriorX"/>
              {errors.username && <div style={{ ...raj(11), color:C.red, marginTop:4 }}>⚠ {errors.username}</div>}
            </div>
            <div>
              <label style={labelStyle}>📧 EMAIL</label>
              <input className="u-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)} style={{ ...inputStyle, borderColor:errors.email?C.red:C.navy }} placeholder="heroe@mail.com"/>
              {errors.email && <div style={{ ...raj(11), color:C.red, marginTop:4 }}>⚠ {errors.email}</div>}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:24 }}>
            <div>
              <label style={labelStyle}>🎭 CLASE</label>
              <select className="u-input u-select" value={form.heroClass} onChange={e=>set("heroClass",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                {["GUERRERO","ARQUERO","MAGO"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>🛡️ ROL</label>
              <select className="u-input u-select" value={form.roleId} onChange={e=>set("roleId",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>● ESTADO</label>
              <select className="u-input u-select" value={form.status} onChange={e=>set("status",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                <option value="active">ACTIVO</option>
                <option value="inactive">INACTIVO</option>
              </select>
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} className="u-btn" style={{ flex:"0 0 auto", ...raj(13,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, padding:"12px 20px", cursor:"pointer" }}>
              CANCELAR
            </button>
            <button onClick={save} disabled={loading} className="u-btn" style={{ flex:1, ...px(8), color:loading?C.muted:C.bg, background:loading?`${C.green}44`:C.green, border:"none", padding:"12px", cursor:loading?"not-allowed":"pointer", boxShadow:`0 4px 20px ${C.green}33`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              {loading ? <><div style={{ width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${C.green}`,borderRadius:"50%",animation:"u-spin .8s linear infinite" }}/> CREANDO...</> : <><Plus size={14}/> CREAR USUARIO</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function AdminUsuarios() {
  const [users,      setUsers]      = useState(MOCK_USERS);
  const [search,     setSearch]     = useState("");
  const [filterCls,  setFilterCls]  = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterSt,   setFilterSt]   = useState("all");
  const [sortKey,    setSortKey]     = useState("createdAt");
  const [sortDir,    setSortDir]     = useState("desc");
  const [page,       setPage]        = useState(1);
  const [pageSize,   setPageSize]    = useState(10);
  const [selected,   setSelected]    = useState(new Set());
  const [modal,      setModal]       = useState(null); // { type:"view"|"edit"|"delete"|"create", user? }
  const [refreshing, setRefreshing]  = useState(false);

  // ── Refresh simulado ────────────────────────────────────────
  const refresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 900)); // ← reemplazar con getUsers(token)
    setRefreshing(false);
  };

  // ── Filtro + orden ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...users];
    if (search)           list = list.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    if (filterCls  !== "all") list = list.filter(u => u.heroClass === filterCls);
    if (filterRole !== "all") list = list.filter(u => u.roleId    === filterRole);
    if (filterSt   !== "all") list = list.filter(u => u.status    === filterSt);
    list.sort((a,b) => {
      const av = a[sortKey] ?? ""; const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? (av > bv ? 1:-1) : (av < bv ? 1:-1);
    });
    return list;
  }, [users, search, filterCls, filterRole, filterSt, sortKey, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated   = filtered.slice((page-1)*pageSize, page*pageSize);

  const sort = (key) => {
    if (sortKey === key) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }) => sortKey===k
    ? (sortDir==="asc" ? <ChevronUp size={12} color={C.orange}/> : <ChevronDown size={12} color={C.orange}/>)
    : <ChevronDown size={12} color={C.navy}/>;

  // ── Selección ───────────────────────────────────────────────
  const toggleSelect = uid => setSelected(s => { const n = new Set(s); n.has(uid)?n.delete(uid):n.add(uid); return n; });
  const toggleAll    = () => setSelected(s => s.size===paginated.length ? new Set() : new Set(paginated.map(u=>u.uid)));

  // ── CRUD callbacks ──────────────────────────────────────────
  const handleSaveEdit = (updated) => setUsers(us => us.map(u => u.uid===updated.uid ? updated : u));
  const handleDelete   = (uid)     => { setUsers(us => us.filter(u => u.uid!==uid)); setSelected(s => { const n=new Set(s); n.delete(uid); return n; }); };
  const handleCreate   = (newUser) => setUsers(us => [newUser, ...us]);
  const bulkDelete     = () => { setUsers(us => us.filter(u => !selected.has(u.uid))); setSelected(new Set()); };

  // ── KPIs ────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u => u.status==="active").length,
    admins:   users.filter(u => u.roleId==="admin").length,
    avgLevel: Math.round(users.reduce((s,u)=>s+u.level,0)/users.length),
  }), [users]);

  // ── Filter bar style helpers ─────────────────────────────────
  const filterBtn = (active, color=C.orange) => ({
    ...raj(12,active?700:600), background:active?`${color}18`:"transparent",
    border:`1px solid ${active?color:C.navy}`, color:active?color:C.muted,
    padding:"6px 14px", cursor:"pointer", transition:"all .2s",
    boxShadow:active?`0 0 10px ${color}22`:"none",
  });

  return (
    <>
      <style>{CSS}</style>

      {/* modals */}
      {modal?.type==="view"   && <ViewModal   user={modal.user} onClose={()=>setModal(null)}/>}
      {modal?.type==="edit"   && <EditModal   user={modal.user} onClose={()=>setModal(null)} onSave={handleSaveEdit}/>}
      {modal?.type==="delete" && <DeleteModal user={modal.user} onClose={()=>setModal(null)} onConfirm={handleDelete}/>}
      {modal?.type==="create" && <CreateModal              onClose={()=>setModal(null)} onSave={handleCreate}/>}

      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

        {/* ── KPI row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { label:"USUARIOS TOTALES", value:kpis.total,    icon:<User size={18}/>,   color:C.blue   },
            { label:"ACTIVOS",          value:kpis.active,   icon:<Zap size={18}/>,    color:C.green  },
            { label:"ADMINS",           value:kpis.admins,   icon:<Shield size={18}/>, color:C.orange },
            { label:"NIVEL PROMEDIO",   value:`Lv.${kpis.avgLevel}`, icon:<Star size={18}/>, color:C.gold },
          ].map((k,i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${k.color}33`, padding:"18px 16px", position:"relative", overflow:"hidden", animation:`u-cardIn .4s ease ${i*.07}s both`, transition:"transform .2s,box-shadow .2s" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 32px rgba(0,0,0,.4)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${k.color},transparent)` }}/>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10 }}>
                <div style={{ background:`${k.color}18`,border:`1px solid ${k.color}33`,padding:9,display:"flex",color:k.color }}>{k.icon}</div>
              </div>
              <div style={{ ...orb(26,900),color:k.color,marginBottom:3 }}>{k.value}</div>
              <div style={{ ...px(6),color:C.muted,letterSpacing:".05em" }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, padding:"16px 18px" }}>
          {/* top row */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
            {/* search */}
            <div style={{ position:"relative", flex:"1 1 220px" }}>
              <Search size={14} color={C.muted} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }}/>
              <input className="u-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                placeholder="Buscar por nombre o email..."
                style={{ width:"100%", padding:"9px 14px 9px 34px", background:C.panel, border:`1px solid ${C.navy}`, color:C.white, ...raj(13,500) }}/>
              {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex" }}><X size={13}/></button>}
            </div>

            {/* page size */}
            <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}
              className="u-select"
              style={{ padding:"9px 12px", background:C.panel, border:`1px solid ${C.navy}`, color:C.muted, ...raj(13,500), cursor:"pointer" }}>
              {PAGE_SIZE_OPTIONS.map(n=><option key={n} value={n}>{n} por página</option>)}
            </select>

            <div style={{ display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap" }}>
              {selected.size > 0 && (
                <button onClick={bulkDelete} className="u-btn" style={{ display:"flex",alignItems:"center",gap:6,...raj(12,700),color:C.red,background:`${C.red}14`,border:`1px solid ${C.red}44`,padding:"8px 14px",cursor:"pointer" }}>
                  <Trash2 size={13}/> Eliminar ({selected.size})
                </button>
              )}
              <button onClick={refresh} className="u-btn" style={{ display:"flex",alignItems:"center",gap:6,...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"8px 12px",cursor:"pointer" }}>
                <RefreshCw size={13} style={{ animation:refreshing?"u-spin .8s linear infinite":"none" }}/> Actualizar
              </button>
              <button onClick={()=>setModal({type:"create"})} className="u-btn" style={{ display:"flex",alignItems:"center",gap:6,...px(8),color:C.bg,background:C.green,border:"none",padding:"8px 14px",cursor:"pointer",boxShadow:`0 3px 16px ${C.green}33` }}>
                <Plus size={14}/> NUEVO USUARIO
              </button>
            </div>
          </div>

          {/* filter chips */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ ...raj(11,600), color:C.muted, alignSelf:"center", marginRight:4 }}>Clase:</span>
            {["all","GUERRERO","ARQUERO","MAGO"].map(v => (
              <button key={v} onClick={()=>{setFilterCls(v);setPage(1);}} className="u-btn"
                style={filterBtn(filterCls===v, v==="all"?C.orange:CLS_META[v]?.color||C.orange)}>
                {v==="all"?"Todas":`${CLS_META[v]?.icon||""} ${v}`}
              </button>
            ))}
            <div style={{ width:1, background:C.navy, alignSelf:"stretch", margin:"0 4px" }}/>
            <span style={{ ...raj(11,600), color:C.muted, alignSelf:"center", marginRight:4 }}>Rol:</span>
            {["all","user","admin"].map(v => (
              <button key={v} onClick={()=>{setFilterRole(v);setPage(1);}} className="u-btn"
                style={filterBtn(filterRole===v, v==="admin"?C.orange:C.blue)}>
                {v==="all"?"Todos":v==="admin"?"🛡️ ADMIN":"👤 USER"}
              </button>
            ))}
            <div style={{ width:1, background:C.navy, alignSelf:"stretch", margin:"0 4px" }}/>
            <span style={{ ...raj(11,600), color:C.muted, alignSelf:"center", marginRight:4 }}>Estado:</span>
            {["all","active","inactive"].map(v => (
              <button key={v} onClick={()=>{setFilterSt(v);setPage(1);}} className="u-btn"
                style={filterBtn(filterSt===v, v==="active"?C.green:C.red)}>
                {v==="all"?"Todos":v==="active"?"● Activos":"● Inactivos"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ background:C.card, border:`1px solid ${C.navy}`, overflow:"hidden" }}>
          {/* result count */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", background:C.panel, borderBottom:`1px solid ${C.navy}` }}>
            <span style={{ ...raj(12,600), color:C.muted }}>
              {filtered.length} usuario{filtered.length!==1?"s":""} encontrado{filtered.length!==1?"s":""} · página {page}/{totalPages}
            </span>
            {selected.size>0 && <span style={{ ...raj(12,700), color:C.orange }}>{selected.size} seleccionado{selected.size!==1?"s":""}</span>}
          </div>

          {/* thead */}
          <div style={{ display:"grid", gridTemplateColumns:"40px 2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.9fr 0.7fr 110px", padding:"10px 16px", background:`${C.panel}88`, borderBottom:`1px solid ${C.navy}`, alignItems:"center", gap:8 }}>
            {/* checkbox all */}
            <input type="checkbox" className="u-checkbox" checked={selected.size===paginated.length&&paginated.length>0} onChange={toggleAll}
              style={{ accentColor:C.orange, width:15, height:15 }}/>
            {[
              {label:"USUARIO",  key:"username"},
              {label:"CLASE",    key:"heroClass"},
              {label:"ROL",      key:"roleId"},
              {label:"NIVEL",    key:"level"},
              {label:"XP",       key:"xp"},
              {label:"RACHA",    key:"streak"},
              {label:"ESTADO",   key:"status"},
            ].map(h => (
              <div key={h.key} className="u-sort" onClick={()=>sort(h.key)}
                style={{ display:"flex", alignItems:"center", gap:4, ...px(5), color:sortKey===h.key?C.orange:C.muted, letterSpacing:".05em" }}>
                {h.label} <SortIcon k={h.key}/>
              </div>
            ))}
            <span style={{ ...px(5), color:C.muted, letterSpacing:".05em" }}>ACCIONES</span>
          </div>

          {/* rows */}
          {paginated.length === 0 ? (
            <div style={{ padding:"40px", textAlign:"center", ...raj(14,500), color:C.muted }}>
              No se encontraron usuarios con esos filtros.
            </div>
          ) : paginated.map((u,i) => (
            <div key={u.uid} className="u-row" style={{ display:"grid", gridTemplateColumns:"40px 2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.9fr 0.7fr 110px", padding:"12px 16px", borderBottom:`1px solid ${C.navy}22`, alignItems:"center", gap:8, animation:`u-slideU .3s ease ${i*.04}s both`, background:selected.has(u.uid)?`${C.orange}08`:"transparent" }}>

              {/* checkbox */}
              <input type="checkbox" className="u-checkbox" checked={selected.has(u.uid)} onChange={()=>toggleSelect(u.uid)}
                style={{ accentColor:C.orange, width:15, height:15 }}/>

              {/* usuario */}
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <div style={{ width:32, height:32, background:`${CLS_META[u.heroClass]?.color||C.muted}18`, border:`1px solid ${CLS_META[u.heroClass]?.color||C.muted}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                  {CLS_META[u.heroClass]?.icon || "👤"}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ ...raj(13,700), color:C.white, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.username}</div>
                  <div style={{ ...raj(11,400), color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</div>
                </div>
              </div>

              {/* clase */}
              <ClsBadge cls={u.heroClass}/>

              {/* rol */}
              <span style={{ ...raj(11,700), color:u.roleId==="admin"?C.orange:C.blue, background:u.roleId==="admin"?`${C.orange}14`:`${C.blue}14`, border:`1px solid ${u.roleId==="admin"?C.orange:C.blue}33`, padding:"2px 8px", display:"inline-block" }}>
                {u.roleId==="admin"?"🛡️ ADMIN":"👤 USER"}
              </span>

              {/* nivel */}
              <span style={{ ...orb(13,900), color:C.gold }}>Lv.{u.level}</span>

              {/* xp */}
              <div>
                <div style={{ ...raj(12,700), color:C.orange, marginBottom:3 }}>{u.xp.toLocaleString()}</div>
                <MiniBar val={Math.min((u.xp/6000)*100,100)} color={C.orange} height={4}/>
              </div>

              {/* racha */}
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <Flame size={12} color={u.streak>0?C.orangeL:C.muted}/>
                <span style={{ ...raj(12,700), color:u.streak>0?C.orangeL:C.muted }}>{u.streak}d</span>
              </div>

              {/* estado */}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <StatusDot status={u.status}/>
                <span style={{ ...raj(11,600), color:u.status==="active"?C.green:C.red }}>
                  {u.status==="active"?"ACTIVO":"INACTIVO"}
                </span>
              </div>

              {/* acciones */}
              <div style={{ display:"flex", gap:5 }}>
                {[
                  { Icon:Eye,    c:C.blue,   action:()=>setModal({type:"view",   user:u}), title:"Ver" },
                  { Icon:Edit2,  c:C.orange, action:()=>setModal({type:"edit",   user:u}), title:"Editar" },
                  { Icon:Trash2, c:C.red,    action:()=>setModal({type:"delete", user:u}), title:"Eliminar" },
                ].map(({Icon,c,action,title},j)=>(
                  <button key={j} title={title} onClick={action} className="u-icon-btn"
                    style={{ background:"transparent", border:`1px solid ${c}33`, padding:6, color:c, display:"flex", alignItems:"center" }}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${c}18`;e.currentTarget.style.borderColor=c;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${c}33`;}}>
                    <Icon size={12}/>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Pagination ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <span style={{ ...raj(13,500), color:C.muted }}>
            Mostrando {Math.min((page-1)*pageSize+1,filtered.length)}–{Math.min(page*pageSize,filtered.length)} de {filtered.length}
          </span>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setPage(1)}       disabled={page===1}          className="u-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"7px 12px",cursor:page===1?"not-allowed":"pointer" }}>«</button>
            <button onClick={()=>setPage(p=>p-1)}  disabled={page===1}          className="u-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===1?C.navy:C.muted,padding:"7px 12px",cursor:page===1?"not-allowed":"pointer",display:"flex",alignItems:"center" }}><ChevronLeft size={14}/></button>
            {Array.from({length:totalPages},(_, i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>(
              <button key={n} onClick={()=>setPage(n)} className="u-btn"
                style={{ background:n===page?C.orange:C.panel,border:`1px solid ${n===page?C.orange:C.navy}`,color:n===page?C.bg:C.muted,padding:"7px 14px",cursor:"pointer",...raj(13,n===page?700:500) }}>
                {n}
              </button>
            ))}
            <button onClick={()=>setPage(p=>p+1)}  disabled={page===totalPages} className="u-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"7px 12px",cursor:page===totalPages?"not-allowed":"pointer",display:"flex",alignItems:"center" }}><ChevronRight size={14}/></button>
            <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} className="u-btn" style={{ background:C.panel,border:`1px solid ${C.navy}`,color:page===totalPages?C.navy:C.muted,padding:"7px 12px",cursor:page===totalPages?"not-allowed":"pointer" }}>»</button>
          </div>
        </div>

      </div>
    </>
  );
}