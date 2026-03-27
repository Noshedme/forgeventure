// src/pages/admin/AdminUsuarios.jsx
// ─────────────────────────────────────────────────────────────
//  Gestión de usuarios — Modo RPG y Modo Simple
//  Conectar: getUsers(), updateUser(), deleteUser() de api.js
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  Search, Plus, RefreshCw, Eye, Edit2, Trash2,
  Shield, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, User, Zap, Flame, Star,
} from "lucide-react";

// ── Paletas ────────────────────────────────────────────────────
const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};
const S = {
  bg:"#0F1117", card:"#1A1D27", panel:"#14171F", border:"#2A2D3E",
  accent:"#6366F1", accentL:"#818CF8",
  green:"#10B981", red:"#EF4444", yellow:"#F59E0B", blue:"#3B82F6",
  text:"#E2E8F0", muted:"#94A3B8", faint:"#475569", white:"#F8FAFC",
};

// ── CSS ────────────────────────────────────────────────────────
const RPG_CSS = `
  @keyframes au-slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes au-cardIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes au-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes au-ping    { 0%{transform:scale(1);opacity:.9} 80%,100%{transform:scale(2.2);opacity:0} }
  @keyframes au-modalIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes au-glow    { 0%,100%{text-shadow:0 0 14px #E85D04} 50%{text-shadow:0 0 28px #E85D04,0 0 50px #E85D0444} }
  @keyframes au-shimmer { 0%{left:-100%} 100%{left:200%} }

  .au-row   { transition:background .14s; }
  .au-row:hover { background:#1E3A5F18 !important; }
  .au-btn   { transition:all .18s; cursor:pointer; }
  .au-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .au-iBtn  { transition:all .18s; cursor:pointer; }
  .au-iBtn:hover { transform:scale(1.12); }
  .au-input { transition:border-color .2s,box-shadow .2s; outline:none; }
  .au-input:focus { border-color:#E85D04 !important; box-shadow:0 0 0 2px #E85D0422; }
  .au-input::placeholder { color:#1A3354; }
  .au-sort  { cursor:pointer; transition:color .18s; user-select:none; }
  .au-sort:hover  { color:#E85D04 !important; }
  .au-kpi   { transition:transform .2s,box-shadow .2s; }
  .au-kpi:hover { transform:translateY(-4px); }
  .au-kpi .au-shimmer { position:absolute;top:0;left:-100%;width:50%;height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent);pointer-events:none; }
  .au-kpi:hover .au-shimmer { animation:au-shimmer .6s ease; }
`;
const SIMPLE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .s-row { transition:background .1s; }
  .s-row:hover { background:#1E2030 !important; }
  .s-btn { transition:all .14s; cursor:pointer; border-radius:6px; }
  .s-btn:hover:not(:disabled) { opacity:.88; }
  .s-iBtn { transition:background .14s; cursor:pointer; border-radius:6px; }
  .s-iBtn:hover { background:#2A2D3E !important; }
  .s-input { outline:none; transition:border-color .15s; }
  .s-input:focus { border-color:#6366F1 !important; box-shadow:0 0 0 3px rgba(99,102,241,.15) !important; }
  .s-input::placeholder { color:#475569; }
  .s-sort { cursor:pointer; transition:color .15s; user-select:none; }
  .s-sort:hover { color:#818CF8 !important; }
  .s-card { transition:box-shadow .18s,border-color .18s; }
  .s-card:hover { border-color:#3A3D4E !important; }
`;

// ── Tipografías ────────────────────────────────────────────────
const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });
const sr  = (s,w=400) => ({ fontFamily:"'Inter',system-ui,sans-serif", fontSize:s, fontWeight:w });

// ── Clase meta ─────────────────────────────────────────────────
const CLS_META = {
  GUERRERO:{ color:C.orange, icon:"⚔️" },
  ARQUERO: { color:C.blue,   icon:"🏃" },
  MAGO:    { color:C.purple, icon:"🧘" },
};

// ── Mock data ──────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════
// MODALES — compartidos entre los dos modos
// ══════════════════════════════════════════════════════════════

function MiniBar({val,color,height=4}) {
  return (
    <div style={{height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",width:"100%"}}>
      <div style={{height:"100%",width:`${Math.min(val,100)}%`,background:color,boxShadow:`0 0 5px ${color}66`,transition:"width .6s ease"}}/>
    </div>
  );
}

function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"au-spin .8s linear infinite"}}/>;
}

// ── Ver ────────────────────────────────────────────────────────
function ViewModal({user,onClose}) {
  const m = CLS_META[user.heroClass]||{color:C.muted,icon:"👤"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.78)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,background:C.card,border:`1px solid ${m.color}44`,
        boxShadow:`0 0 50px ${m.color}14,0 20px 60px rgba(0,0,0,.6)`,
        animation:"au-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${m.color},transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,background:`${m.color}18`,border:`2px solid ${m.color}44`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.icon}</div>
            <div>
              <div style={{...orb(14,900),color:C.white,marginBottom:2}}>{user.username}</div>
              <div style={{...raj(12,400),color:C.muted}}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="au-iBtn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:7,color:C.muted,display:"flex"}}>
            <X size={14}/>
          </button>
        </div>
        <div style={{padding:22,display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {l:"NIVEL",v:`Lv.${user.level}`,c:C.gold},
              {l:"XP",   v:user.xp.toLocaleString(),c:C.orange},
              {l:"RACHA",v:`${user.streak}d`,c:C.orangeL},
              {l:"HP",   v:`${user.hp}%`,c:C.green},
            ].map((s,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${s.c}22`,padding:"11px 8px",textAlign:"center"}}>
                <div style={{...orb(15,900),color:s.c,marginBottom:3}}>{s.v}</div>
                <div style={{...px(5),color:C.muted}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div>
            {[
              {l:"XP",   v:Math.min((user.xp/6000)*100,100),c:C.orange},
              {l:"HP",   v:user.hp,c:C.green},
              {l:"Racha",v:Math.min((user.streak/30)*100,100),c:C.orangeL},
            ].map((b,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{...raj(11,500),color:C.muted}}>{b.l}</span>
                  <span style={{...raj(11,700),color:b.c}}>{Math.round(b.v)}%</span>
                </div>
                <MiniBar val={b.v} color={b.c} height={6}/>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {icon:"🎭",l:"Clase",   v:user.heroClass},
              {icon:"🛡️",l:"Rol",    v:user.roleId.toUpperCase()},
              {icon:"📅",l:"Registro",v:user.createdAt},
              {icon:"🕐",l:"Último login",v:user.lastLoginAt},
            ].map((f,i)=>(
              <div key={i} style={{background:C.panel,border:`1px solid ${C.navy}`,padding:"10px 14px"}}>
                <div style={{...raj(10,500),color:C.muted,marginBottom:3}}>{f.icon} {f.l}</div>
                <div style={{...raj(13,700),color:C.white}}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
            background:C.panel,border:`1px solid ${user.status==="active"?C.green:C.red}33`}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:user.status==="active"?C.green:C.red,flexShrink:0}}/>
            <span style={{...raj(13,700),color:user.status==="active"?C.green:C.red}}>
              {user.status==="active"?"CUENTA ACTIVA":"CUENTA INACTIVA"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Editar ─────────────────────────────────────────────────────
function EditModal({user,onClose,onSave}) {
  const [form,    setForm]    = useState({...user});
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = async () => {
    if(!form.username.trim()||!form.email.trim()) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    setLoading(false);
    onSave(form); onClose();
  };
  const inp = {width:"100%",padding:"11px 12px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)};
  const lbl = {display:"block",...px(5),color:C.muted,marginBottom:6,letterSpacing:".06em"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.78)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:520,background:C.card,border:`1px solid ${C.navy}`,
        boxShadow:`0 0 50px ${C.orange}0A,0 20px 60px rgba(0,0,0,.6)`,
        animation:"au-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.orange},transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Edit2 size={15} color={C.orange}/>
            <span style={{...orb(11,700),color:C.white}}>EDITAR USUARIO</span>
            <span style={{...raj(12,400),color:C.muted}}>— {user.username}</span>
          </div>
          <button onClick={onClose} className="au-iBtn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:6,color:C.muted,display:"flex"}}><X size={14}/></button>
        </div>
        <div style={{padding:22}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div><label style={lbl}>👤 NOMBRE</label><input className="au-input" value={form.username} onChange={e=>set("username",e.target.value)} style={inp}/></div>
            <div><label style={lbl}>📧 EMAIL</label><input className="au-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)} style={inp}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={lbl}>🎭 CLASE</label>
              <select className="au-input" value={form.heroClass} onChange={e=>set("heroClass",e.target.value)} style={{...inp,appearance:"none",cursor:"pointer"}}>
                {["GUERRERO","ARQUERO","MAGO"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>🛡️ ROL</label>
              <select className="au-input" value={form.roleId} onChange={e=>set("roleId",e.target.value)} style={{...inp,appearance:"none",cursor:"pointer"}}>
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>
            <div>
              <label style={lbl}>● ESTADO</label>
              <select className="au-input" value={form.status} onChange={e=>set("status",e.target.value)} style={{...inp,appearance:"none",cursor:"pointer"}}>
                <option value="active">ACTIVO</option>
                <option value="inactive">INACTIVO</option>
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {[{k:"level",l:"⚔️ NIVEL"},{k:"xp",l:"⚡ XP"},{k:"streak",l:"🔥 RACHA"}].map(f=>(
              <div key={f.k}><label style={lbl}>{f.l}</label><input className="au-input" type="number" min={0} value={form[f.k]} onChange={e=>set(f.k,Number(e.target.value))} style={inp}/></div>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="au-btn" style={{flex:"0 0 auto",...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"10px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={save} disabled={loading} className="au-btn"
              style={{flex:1,...px(7),color:loading?C.muted:C.bg,background:loading?`${C.orange}44`:C.orange,border:"none",padding:"10px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 3px 16px ${C.orange}33`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading?<><Spinner/> GUARDANDO...</>:<><Check size={13}/> GUARDAR</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Eliminar ───────────────────────────────────────────────────
function DeleteModal({user,onClose,onConfirm}) {
  const [loading,setLoading]=useState(false);
  const [typed,  setTyped]  =useState("");
  const ok = typed===user.username;
  const confirm = async () => {
    if(!ok) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    setLoading(false);
    onConfirm(user.uid); onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.82)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:400,background:C.card,border:`1px solid ${C.red}44`,
        boxShadow:`0 0 50px ${C.red}14,0 20px 60px rgba(0,0,0,.6)`,
        animation:"au-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.red},transparent)`}}/>
        <div style={{padding:"24px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,padding:10,display:"flex"}}>
              <AlertTriangle size={20} color={C.red}/>
            </div>
            <div>
              <div style={{...orb(12,900),color:C.red,marginBottom:2}}>ELIMINAR USUARIO</div>
              <div style={{...raj(11,400),color:C.muted}}>Esta acción no se puede deshacer</div>
            </div>
          </div>
          <div style={{background:`${C.red}0A`,border:`1px solid ${C.red}22`,padding:"12px 14px",marginBottom:16}}>
            <div style={{...raj(13,700),color:C.red}}>{user.username}</div>
            <div style={{...raj(11,400),color:C.muted}}>{user.email} · Lv.{user.level}</div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",...px(5),color:C.muted,marginBottom:7,letterSpacing:".06em"}}>
              ESCRIBE <span style={{color:C.red}}>{user.username}</span> PARA CONFIRMAR
            </label>
            <input className="au-input" value={typed} onChange={e=>setTyped(e.target.value)} placeholder={user.username}
              style={{width:"100%",padding:"11px 12px",background:C.panel,border:`1px solid ${ok?C.red:C.navy}`,color:C.white,...raj(13,600)}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="au-btn" style={{flex:"0 0 auto",...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"10px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={confirm} disabled={!ok||loading} className="au-btn"
              style={{flex:1,...px(6),color:ok&&!loading?C.white:C.muted,background:ok&&!loading?C.red:`${C.red}22`,
                border:`1px solid ${C.red}44`,padding:"10px",cursor:ok?"pointer":"not-allowed",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading?<><Spinner color={C.red}/> ELIMINANDO...</>:<><Trash2 size={12}/> ELIMINAR</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Crear ──────────────────────────────────────────────────────
function CreateModal({onClose,onSave}) {
  const [form,setForm]=useState({username:"",email:"",heroClass:"GUERRERO",roleId:"user",level:1,xp:0,streak:0,hp:100,status:"active"});
  const [loading,setLoading]=useState(false);
  const [errors,setErrors]=useState({});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{
    const e={};
    if(!form.username.trim()) e.username="Requerido";
    if(!form.email.includes("@")) e.email="Email inválido";
    if(Object.keys(e).length){setErrors(e);return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,900));
    setLoading(false);
    onSave({...form,uid:`u${Date.now()}`,createdAt:new Date().toISOString().slice(0,10),lastLoginAt:"—"});
    onClose();
  };
  const inp={width:"100%",padding:"11px 12px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)};
  const lbl={display:"block",...px(5),color:C.muted,marginBottom:6,letterSpacing:".06em"};
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.78)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:520,background:C.card,border:`1px solid ${C.green}33`,
        boxShadow:`0 0 50px ${C.green}0A,0 20px 60px rgba(0,0,0,.6)`,
        animation:"au-modalIn .25s ease both",overflow:"hidden"}}>
        <div style={{height:3,background:`linear-gradient(90deg,transparent,${C.green},transparent)`}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:`1px solid ${C.navy}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Plus size={15} color={C.green}/>
            <span style={{...orb(11,700),color:C.white}}>NUEVO USUARIO</span>
          </div>
          <button onClick={onClose} className="au-iBtn" style={{background:"transparent",border:`1px solid ${C.navy}`,padding:6,color:C.muted,display:"flex"}}><X size={14}/></button>
        </div>
        <div style={{padding:22}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={lbl}>👤 NOMBRE</label>
              <input className="au-input" value={form.username} onChange={e=>set("username",e.target.value)}
                placeholder="WarriorX" style={{...inp,borderColor:errors.username?C.red:C.navy}}/>
              {errors.username&&<div style={{...raj(10,500),color:C.red,marginTop:3}}>⚠ {errors.username}</div>}
            </div>
            <div>
              <label style={lbl}>📧 EMAIL</label>
              <input className="au-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)}
                placeholder="heroe@mail.com" style={{...inp,borderColor:errors.email?C.red:C.navy}}/>
              {errors.email&&<div style={{...raj(10,500),color:C.red,marginTop:3}}>⚠ {errors.email}</div>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {k:"heroClass",l:"🎭 CLASE",opts:["GUERRERO","ARQUERO","MAGO"]},
              {k:"roleId",   l:"🛡️ ROL",  opts:[{v:"user",l:"USER"},{v:"admin",l:"ADMIN"}]},
              {k:"status",   l:"● ESTADO",opts:[{v:"active",l:"ACTIVO"},{v:"inactive",l:"INACTIVO"}]},
            ].map(f=>(
              <div key={f.k}>
                <label style={lbl}>{f.l}</label>
                <select className="au-input" value={form[f.k]} onChange={e=>set(f.k,e.target.value)}
                  style={{...inp,appearance:"none",cursor:"pointer"}}>
                  {f.opts.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} className="au-btn" style={{flex:"0 0 auto",...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"10px 18px",cursor:"pointer"}}>CANCELAR</button>
            <button onClick={save} disabled={loading} className="au-btn"
              style={{flex:1,...px(7),color:loading?C.muted:C.bg,background:loading?`${C.green}44`:C.green,border:"none",padding:"10px",cursor:loading?"not-allowed":"pointer",boxShadow:`0 3px 16px ${C.green}22`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading?<><Spinner color={C.green}/> CREANDO...</>:<><Plus size={13}/> CREAR USUARIO</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// LÓGICA COMPARTIDA — hook de tabla
// ══════════════════════════════════════════════════════════════
function useTable(users) {
  const [search,    setSearch]    = useState("");
  const [filterCls, setFilterCls] = useState("all");
  const [filterRole,setFilterRole]= useState("all");
  const [filterSt,  setFilterSt]  = useState("all");
  const [sortKey,   setSortKey]   = useState("createdAt");
  const [sortDir,   setSortDir]   = useState("desc");
  const [page,      setPage]      = useState(1);
  const [pageSize,  setPageSize]  = useState(10);

  const filtered = useMemo(()=>{
    let list=[...users];
    if(search)          list=list.filter(u=>u.username.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
    if(filterCls!=="all")  list=list.filter(u=>u.heroClass===filterCls);
    if(filterRole!=="all") list=list.filter(u=>u.roleId===filterRole);
    if(filterSt!=="all")   list=list.filter(u=>u.status===filterSt);
    list.sort((a,b)=>{
      const av=a[sortKey]??""; const bv=b[sortKey]??"";
      return sortDir==="asc"?(av>bv?1:-1):(av<bv?1:-1);
    });
    return list;
  },[users,search,filterCls,filterRole,filterSt,sortKey,sortDir]);

  const totalPages = Math.max(1,Math.ceil(filtered.length/pageSize));
  const paginated  = filtered.slice((page-1)*pageSize,page*pageSize);

  const sort=(key)=>{
    if(sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else {setSortKey(key);setSortDir("asc");}
    setPage(1);
  };

  const resetPage=()=>setPage(1);

  return {
    search,setSearch:v=>{setSearch(v);setPage(1);},
    filterCls,setFilterCls:v=>{setFilterCls(v);setPage(1);},
    filterRole,setFilterRole:v=>{setFilterRole(v);setPage(1);},
    filterSt,setFilterSt:v=>{setFilterSt(v);setPage(1);},
    sortKey,sortDir,sort,
    page,setPage,pageSize,setPageSize:v=>{setPageSize(v);setPage(1);},
    filtered,totalPages,paginated,
  };
}

// ══════════════════════════════════════════════════════════════
// MODO RPG
// ══════════════════════════════════════════════════════════════
function RpgView({users,setUsers,modal,setModal,refreshing,onRefresh}) {
  const t = useTable(users);
  const kpis = useMemo(()=>({
    total:  users.length,
    active: users.filter(u=>u.status==="active").length,
    admins: users.filter(u=>u.roleId==="admin").length,
    avgLvl: Math.round(users.reduce((s,u)=>s+u.level,0)/users.length),
  }),[users]);

  const SortIco=({k})=>t.sortKey===k
    ?(t.sortDir==="asc"?<ChevronUp size={11} color={C.orange}/>:<ChevronDown size={11} color={C.orange}/>)
    :<ChevronDown size={11} color={`${C.navy}`}/>;

  const fBtn=(on,color=C.orange)=>({
    ...raj(11,on?700:500),color:on?color:C.muted,
    background:on?`${color}14`:"transparent",
    border:`1px solid ${on?color:C.navy}`,
    padding:"5px 12px",cursor:"pointer",transition:"all .18s",
    boxShadow:on?`0 0 8px ${color}22`:"none",
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>

      {/* ── KPIs ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {l:"TOTAL",    v:kpis.total,             icon:<User size={17}/>,   c:C.blue  },
          {l:"ACTIVOS",  v:kpis.active,            icon:<Zap size={17}/>,    c:C.green },
          {l:"ADMINS",   v:kpis.admins,            icon:<Shield size={17}/>, c:C.orange},
          {l:"NIV. PROM",v:`Lv.${kpis.avgLvl}`,   icon:<Star size={17}/>,   c:C.gold  },
        ].map((k,i)=>(
          <div key={i} className="au-kpi" style={{background:`linear-gradient(135deg,${C.card},${C.panel})`,
            border:`1px solid ${k.c}33`,padding:"16px",position:"relative",overflow:"hidden",
            animation:`au-cardIn .4s ease ${i*.07}s both`,
            boxShadow:`0 2px 12px rgba(0,0,0,.3)`}}>
            <div className="au-shimmer"/>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,
              background:`linear-gradient(90deg,transparent,${k.c},transparent)`,opacity:.7}}/>
            <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,
              borderRadius:"50%",background:k.c,filter:"blur(30px)",opacity:.07,pointerEvents:"none"}}/>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10,position:"relative",zIndex:1}}>
              <div style={{background:`${k.c}18`,border:`1px solid ${k.c}33`,padding:8,display:"flex",color:k.c}}>{k.icon}</div>
            </div>
            <div style={{...orb(22,900),color:k.c,marginBottom:3,position:"relative",zIndex:1,
              textShadow:`0 0 16px ${k.c}44`}}>{k.v}</div>
            <div style={{...px(5),color:C.muted,letterSpacing:".06em",position:"relative",zIndex:1}}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{background:`linear-gradient(135deg,${C.card},${C.panel})`,border:`1px solid ${C.navy}`,padding:"14px 18px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
            <input className="au-input" value={t.search} onChange={e=>t.setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              style={{width:"100%",padding:"8px 12px 8px 32px",background:C.panel,border:`1px solid ${C.navy}`,color:C.white,...raj(13,500)}}/>
            {t.search&&<button onClick={()=>t.setSearch("")} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={12}/></button>}
          </div>
          <select value={t.pageSize} onChange={e=>t.setPageSize(Number(e.target.value))}
            style={{padding:"8px 12px",background:C.panel,border:`1px solid ${C.navy}`,color:C.muted,...raj(12,500),cursor:"pointer",outline:"none"}}>
            {[5,10,20].map(n=><option key={n} value={n}>{n} / página</option>)}
          </select>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button onClick={onRefresh} className="au-btn"
              style={{display:"flex",alignItems:"center",gap:6,...raj(11,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"8px 12px",cursor:"pointer"}}>
              <RefreshCw size={12} style={{animation:refreshing?"au-spin .8s linear infinite":"none"}}/> Actualizar
            </button>
            <button onClick={()=>setModal({type:"create"})} className="au-btn"
              style={{display:"flex",alignItems:"center",gap:6,...px(7),color:C.bg,background:C.green,border:"none",padding:"8px 14px",cursor:"pointer",boxShadow:`0 3px 12px ${C.green}33`}}>
              <Plus size={13}/> NUEVO
            </button>
          </div>
        </div>
        {/* Filters */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <span style={{...raj(10,600),color:C.muted,alignSelf:"center"}}>Clase:</span>
          {["all","GUERRERO","ARQUERO","MAGO"].map(v=>(
            <button key={v} onClick={()=>t.setFilterCls(v)} className="au-btn"
              style={fBtn(t.filterCls===v,v==="all"?C.orange:CLS_META[v]?.color||C.orange)}>
              {v==="all"?"Todas":`${CLS_META[v]?.icon||""} ${v}`}
            </button>
          ))}
          <div style={{width:1,background:C.navy,alignSelf:"stretch",margin:"0 4px"}}/>
          <span style={{...raj(10,600),color:C.muted,alignSelf:"center"}}>Estado:</span>
          {[{v:"all",l:"Todos"},{v:"active",l:"● Activos"},{v:"inactive",l:"● Inactivos"}].map(o=>(
            <button key={o.v} onClick={()=>t.setFilterSt(o.v)} className="au-btn"
              style={fBtn(t.filterSt===o.v,o.v==="active"?C.green:o.v==="inactive"?C.red:C.orange)}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{background:`linear-gradient(180deg,${C.card},${C.panel})`,border:`1px solid ${C.navy}`,overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent,${C.orange}44,transparent)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"9px 18px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}44`}}>
          <span style={{...raj(11,600),color:C.muted}}>
            {t.filtered.length} resultado{t.filtered.length!==1?"s":""} · pág. {t.page}/{t.totalPages}
          </span>
        </div>
        {/* Head */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr .7fr .8fr .7fr .7fr 100px",
          padding:"9px 18px",background:`${C.panel}66`,borderBottom:`1px solid ${C.navy}`,gap:8,alignItems:"center"}}>
          {[
            {l:"USUARIO",  k:"username"},
            {l:"CLASE",    k:"heroClass"},
            {l:"NIVEL",    k:"level"},
            {l:"XP",       k:"xp"},
            {l:"RACHA",    k:"streak"},
            {l:"ESTADO",   k:"status"},
          ].map(h=>(
            <div key={h.k} className="au-sort" onClick={()=>t.sort(h.k)}
              style={{display:"flex",alignItems:"center",gap:3,...px(5),
                color:t.sortKey===h.k?C.orange:C.muted,letterSpacing:".06em"}}>
              {h.l}<SortIco k={h.k}/>
            </div>
          ))}
          <span style={{...px(5),color:C.muted,letterSpacing:".06em"}}>ACCIONES</span>
        </div>
        {/* Rows */}
        {t.paginated.length===0?(
          <div style={{padding:"36px",textAlign:"center",...raj(13,500),color:C.muted}}>Sin resultados para estos filtros.</div>
        ):t.paginated.map((u,i)=>{
          const m=CLS_META[u.heroClass]||{color:C.muted,icon:"👤"};
          return (
            <div key={u.uid} className="au-row" style={{display:"grid",
              gridTemplateColumns:"2fr 1fr .7fr .8fr .7fr .7fr 100px",
              padding:"11px 18px",borderBottom:`1px solid ${C.navy}22`,
              alignItems:"center",gap:8,
              animation:`au-slideU .3s ease ${i*.05}s both`}}>
              {/* Usuario */}
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <div style={{width:30,height:30,background:`${m.color}18`,border:`1px solid ${m.color}44`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,
                  boxShadow:`0 0 8px ${m.color}22`}}>{m.icon}</div>
                <div style={{minWidth:0}}>
                  <div style={{...raj(13,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.username}</div>
                  <div style={{...raj(10,400),color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                </div>
              </div>
              {/* Clase */}
              <span style={{...raj(11,700),color:m.color,background:`${m.color}10`,border:`1px solid ${m.color}33`,
                padding:"2px 8px",display:"inline-flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                {m.icon} {u.heroClass}
              </span>
              {/* Nivel */}
              <span style={{...orb(12,900),color:C.gold,textShadow:`0 0 8px ${C.gold}44`}}>Lv.{u.level}</span>
              {/* XP */}
              <div>
                <div style={{...raj(11,700),color:C.orange,marginBottom:3}}>{u.xp.toLocaleString()}</div>
                <MiniBar val={Math.min((u.xp/6000)*100,100)} color={C.orange} height={3}/>
              </div>
              {/* Racha */}
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <Flame size={11} color={u.streak>0?C.orangeL:C.muted}/>
                <span style={{...raj(11,700),color:u.streak>0?C.orangeL:C.muted}}>{u.streak}d</span>
              </div>
              {/* Estado */}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{position:"relative",width:6,height:6,flexShrink:0}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:u.status==="active"?C.green:C.red}}/>
                  {u.status==="active"&&<div style={{position:"absolute",inset:0,borderRadius:"50%",background:C.green,animation:"au-ping 1.8s infinite"}}/>}
                </div>
                <span style={{...raj(10,600),color:u.status==="active"?C.green:C.red}}>
                  {u.status==="active"?"ACTIVO":"INACTIVO"}
                </span>
              </div>
              {/* Acciones */}
              <div style={{display:"flex",gap:4}}>
                {[{Icon:Eye,c:C.blue,t:"view"},{Icon:Edit2,c:C.orange,t:"edit"},{Icon:Trash2,c:C.red,t:"delete"}].map(({Icon,c,t:type})=>(
                  <button key={type} onClick={()=>setModal({type,user:u})} className="au-iBtn"
                    style={{background:"transparent",border:`1px solid ${c}22`,padding:5,color:c,display:"flex"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=`${c}14`;e.currentTarget.style.borderColor=c;e.currentTarget.style.boxShadow=`0 0 8px ${c}22`;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${c}22`;e.currentTarget.style.boxShadow="none";}}>
                    <Icon size={11}/>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Paginación ── */}
      <Pagination page={t.page} setPage={t.setPage} totalPages={t.totalPages} total={t.filtered.length} pageSize={t.pageSize} rpg/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MODO SIMPLE
// ══════════════════════════════════════════════════════════════
function SimpleView({users,setUsers,modal,setModal,refreshing,onRefresh}) {
  const t = useTable(users);

  const SortIco=({k})=>t.sortKey===k
    ?(t.sortDir==="asc"?<ChevronUp size={11} color={S.accent}/>:<ChevronDown size={11} color={S.accent}/>)
    :<ChevronDown size={11} color={S.faint}/>;

  const kpis = useMemo(()=>({
    total:  users.length,
    active: users.filter(u=>u.status==="active").length,
    admins: users.filter(u=>u.roleId==="admin").length,
    avgLvl: Math.round(users.reduce((s,u)=>s+u.level,0)/users.length),
  }),[users]);

  return (
    <div style={{position:"absolute",inset:0,background:S.bg,overflowY:"auto",
      padding:"24px 28px",fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:1400}}>

      {/* Header — igual que SimpleDashboardView */}
      <div>
        <div style={{...sr(22,700),color:S.white,marginBottom:4}}>Usuarios</div>
        <div style={{...sr(13,400),color:S.faint}}>
          {users.length} usuarios registrados · {new Date().toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"})}
        </div>
      </div>

      {/* KPIs — mismo look que SimpleKpiCard del dashboard */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        {[
          {l:"Total usuarios",  v:kpis.total,          c:S.accent, sub:"registrados en el sistema"},
          {l:"Activos",         v:kpis.active,         c:S.green,  sub:`${Math.round((kpis.active/kpis.total)*100)}% del total`},
          {l:"Administradores", v:kpis.admins,         c:S.yellow, sub:"con acceso total"},
          {l:"Nivel promedio",  v:`Lv.${kpis.avgLvl}`, c:S.blue,   sub:"de todos los héroes"},
        ].map((k,i)=>(
          <div key={i} className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,
            padding:"20px",borderRadius:8,boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>
            <div style={{...sr(26,700),color:k.c,marginBottom:3,letterSpacing:"-.5px"}}>{k.v}</div>
            <div style={{...sr(13,500),color:S.text,marginBottom:2}}>{k.l}</div>
            <div style={{...sr(11,400),color:S.faint}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,padding:"16px 18px",borderRadius:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <Search size={13} color={S.faint} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}/>
            <input className="s-input" value={t.search} onChange={e=>t.setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              style={{width:"100%",padding:"8px 12px 8px 28px",background:S.panel,border:`1px solid ${S.border}`,color:S.text,...sr(13,400),borderRadius:6}}/>
            {t.search&&<button onClick={()=>t.setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:S.faint,display:"flex"}}><X size={12}/></button>}
          </div>
          <select value={t.filterSt} onChange={e=>t.setFilterSt(e.target.value)}
            style={{padding:"8px 12px",background:S.panel,border:`1px solid ${S.border}`,color:S.muted,...sr(12,400),borderRadius:6,cursor:"pointer",outline:"none"}}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <select value={t.filterCls} onChange={e=>t.setFilterCls(e.target.value)}
            style={{padding:"8px 12px",background:S.panel,border:`1px solid ${S.border}`,color:S.muted,...sr(12,400),borderRadius:6,cursor:"pointer",outline:"none"}}>
            <option value="all">Todas las clases</option>
            <option value="GUERRERO">Guerrero</option>
            <option value="ARQUERO">Arquero</option>
            <option value="MAGO">Mago</option>
          </select>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button onClick={onRefresh} className="s-btn"
              style={{display:"flex",alignItems:"center",gap:6,...sr(12,500),color:S.muted,background:S.panel,border:`1px solid ${S.border}`,padding:"8px 12px",cursor:"pointer"}}>
              <RefreshCw size={12} style={{animation:refreshing?"au-spin .8s linear infinite":"none"}}/> Actualizar
            </button>
            <button onClick={()=>setModal({type:"create"})} className="s-btn"
              style={{display:"flex",alignItems:"center",gap:6,...sr(12,600),color:S.white,background:S.accent,border:"none",padding:"8px 14px",cursor:"pointer"}}>
              <Plus size={13}/> Nuevo usuario
            </button>
          </div>
        </div>
        <div style={{...sr(11,400),color:S.faint}}>{t.filtered.length} resultado{t.filtered.length!==1?"s":""}</div>
      </div>

      {/* Table */}
      <div className="s-card" style={{background:S.card,border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden"}}>
        {/* Head */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr .7fr 1fr .6fr .7fr 90px",
          padding:"9px 16px",background:S.panel,borderBottom:`1px solid ${S.border}`,gap:8}}>
          {[
            {l:"Usuario",   k:"username"},
            {l:"Clase",     k:"heroClass"},
            {l:"Nivel",     k:"level"},
            {l:"XP",        k:"xp"},
            {l:"Racha",     k:"streak"},
            {l:"Estado",    k:"status"},
          ].map(h=>(
            <div key={h.k} className="s-sort" onClick={()=>t.sort(h.k)}
              style={{display:"flex",alignItems:"center",gap:3,...sr(11,600),
                color:t.sortKey===h.k?S.accentL:S.faint,letterSpacing:".05em",textTransform:"uppercase"}}>
              {h.l}<SortIco k={h.k}/>
            </div>
          ))}
          <span style={{...sr(11,600),color:S.faint,letterSpacing:".05em",textTransform:"uppercase"}}>Acciones</span>
        </div>
        {t.paginated.length===0?(
          <div style={{padding:"36px",textAlign:"center",...sr(13,400),color:S.faint}}>Sin resultados.</div>
        ):t.paginated.map((u,i)=>{
          const m=CLS_META[u.heroClass]||{color:S.muted,icon:"👤"};
          return (
            <div key={u.uid} className="s-row" style={{display:"grid",
              gridTemplateColumns:"2fr 1fr .7fr 1fr .6fr .7fr 90px",
              padding:"10px 16px",borderBottom:`1px solid ${S.border}22`,
              alignItems:"center",gap:8}}>
              {/* Usuario */}
              <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                <div style={{width:28,height:28,background:`${m.color}18`,borderRadius:"50%",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{m.icon}</div>
                <div style={{minWidth:0}}>
                  <div style={{...sr(13,600),color:S.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.username}</div>
                  <div style={{...sr(11,400),color:S.faint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                </div>
              </div>
              {/* Clase */}
              <span style={{...sr(11,500),color:m.color,background:`${m.color}14`,
                padding:"2px 8px",borderRadius:4,display:"inline-block"}}>{u.heroClass}</span>
              {/* Nivel */}
              <span style={{...sr(13,600),color:S.text}}>Lv.{u.level}</span>
              {/* XP */}
              <span style={{...sr(12,500),color:S.muted}}>{u.xp.toLocaleString()}</span>
              {/* Racha */}
              <span style={{...sr(12,400),color:u.streak>0?S.text:S.faint}}>{u.streak}d 🔥</span>
              {/* Estado */}
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:6,height:6,borderRadius:"50%",
                  background:u.status==="active"?S.green:S.red}}/>
                <span style={{...sr(11,500),color:u.status==="active"?S.green:S.red}}>
                  {u.status==="active"?"Activo":"Inactivo"}
                </span>
              </div>
              {/* Acciones */}
              <div style={{display:"flex",gap:3}}>
                {[{Icon:Eye,c:S.blue,type:"view"},{Icon:Edit2,c:S.accent,type:"edit"},{Icon:Trash2,c:S.red,type:"delete"}].map(({Icon,c,type})=>(
                  <button key={type} onClick={()=>setModal({type,user:u})} className="s-iBtn"
                    style={{background:"transparent",border:"none",padding:5,color:S.faint,display:"flex",cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.color=c;}}
                    onMouseLeave={e=>{e.currentTarget.style.color=S.faint;}}>
                    <Icon size={13}/>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      <Pagination page={t.page} setPage={t.setPage} totalPages={t.totalPages} total={t.filtered.length} pageSize={t.pageSize} rpg={false}/>

    </div>
    </div>
  );
}

// ── Paginación ─────────────────────────────────────────────────
function Pagination({page,setPage,totalPages,total,pageSize,rpg}) {
  const panel = rpg?C.panel:S.panel;
  const border = rpg?C.navy:S.border;
  const muted  = rpg?C.muted:S.faint;
  const accent = rpg?C.orange:S.accent;
  const text   = rpg?C.white:S.text;
  const textStyle = rpg?raj(12,500):sr(12,500);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
      <span style={{...textStyle,color:muted}}>
        Mostrando {Math.min((page-1)*pageSize+1,total)}–{Math.min(page*pageSize,total)} de {total}
      </span>
      <div style={{display:"flex",gap:5}}>
        {[
          {label:"«",action:()=>setPage(1),disabled:page===1},
          {label:<ChevronLeft size={13}/>,action:()=>setPage(p=>p-1),disabled:page===1},
          ...Array.from({length:totalPages},(_,i)=>i+1).filter(n=>Math.abs(n-page)<=2).map(n=>({label:n,action:()=>setPage(n),num:n})),
          {label:<ChevronRight size={13}/>,action:()=>setPage(p=>p+1),disabled:page===totalPages},
          {label:"»",action:()=>setPage(totalPages),disabled:page===totalPages},
        ].map((b,i)=>(
          <button key={i} onClick={b.action} disabled={b.disabled}
            style={{background:b.num===page?accent:panel,
              border:`1px solid ${b.num===page?accent:border}`,
              color:b.num===page?(rpg?C.bg:S.white):b.disabled?`${muted}44`:muted,
              padding:"7px 12px",cursor:b.disabled?"not-allowed":"pointer",
              borderRadius:rpg?0:5,...textStyle,
              display:"flex",alignItems:"center",justifyContent:"center",
              minWidth:34,transition:"all .15s"}}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminUsuarios({fx=true}) {
  const [users,     setUsers]     = useState(MOCK_USERS);
  const [modal,     setModal]     = useState(null);
  const [refreshing,setRefreshing]= useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r=>setTimeout(r,900)); // ← getUsers(token)
    setRefreshing(false);
  };

  const handleSaveEdit = (u) => setUsers(prev=>prev.map(p=>p.uid===u.uid?u:p));
  const handleDelete   = (uid) => setUsers(prev=>prev.filter(p=>p.uid!==uid));
  const handleCreate   = (u) => setUsers(prev=>[u,...prev]);

  const sharedProps = {users,setUsers,modal,setModal,refreshing,onRefresh};

  return (
    <>
      <style>{RPG_CSS}</style>
      {!fx&&<style>{SIMPLE_CSS}</style>}

      {/* Modales — iguales en ambos modos */}
      {modal?.type==="view"   && <ViewModal   user={modal.user} onClose={()=>setModal(null)}/>}
      {modal?.type==="edit"   && <EditModal   user={modal.user} onClose={()=>setModal(null)} onSave={handleSaveEdit}/>}
      {modal?.type==="delete" && <DeleteModal user={modal.user} onClose={()=>setModal(null)} onConfirm={handleDelete}/>}
      {modal?.type==="create" && <CreateModal              onClose={()=>setModal(null)} onSave={handleCreate}/>}

      {fx
        ? <RpgView    {...sharedProps}/>
        : <SimpleView {...sharedProps}/>
      }
    </>
  );
}

// ── Hack para que User aparezca como ícono en botones ─────────
function Users({size,color,style}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}