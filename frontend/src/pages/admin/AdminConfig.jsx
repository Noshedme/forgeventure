// src/pages/admin/AdminConfig.jsx
// ─────────────────────────────────────────────────────────────
//  Panel de configuración global de ForgeVenture Admin.
//  Secciones: General | XP & Progresión | Juego | Seguridad
//             Notificaciones | Mantenimiento
//  Conectar: getConfig(token), saveConfig(token, section, data)
// ─────────────────────────────────────────────────────────────
import { useState, useRef } from "react";
import {
  Settings, Save, RefreshCw, Check, X, AlertTriangle,
  Globe, Zap, Sword, Shield, Bell, Wrench,
  Eye, EyeOff, Copy, RotateCcw, Upload, Trash2,
  ChevronRight, Info, ToggleLeft, ToggleRight,
  Lock, Unlock, Database, Server, Mail,
} from "lucide-react";

const C = {
  bg:"#050C18", side:"#080F1C", card:"#0C1826", panel:"#091220",
  navy:"#1A3354", navyL:"#1E3A5F",
  orange:"#E85D04", orangeL:"#FF9F1C", gold:"#FFD700",
  blue:"#4CC9F0", teal:"#0A9396", green:"#2ecc71",
  red:"#E74C3C", purple:"#9B59B6",
  white:"#F0F4FF", muted:"#5A7A9A", mutedL:"#7A9AB8",
};

const CSS = `
  @keyframes c-in    { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes c-fadeIn{ from{opacity:0;transform:translateY(8px)}   to{opacity:1;transform:translateY(0)} }
  @keyframes c-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes c-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
  @keyframes c-saved { 0%{opacity:0;transform:scale(.8)} 40%{opacity:1;transform:scale(1.1)} 100%{opacity:0;transform:scale(1)} }
  @keyframes c-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  .c-nav-item { transition:all .18s; cursor:pointer; }
  .c-nav-item:hover  { background:${C.navyL}33 !important; }
  .c-btn     { transition:all .18s; cursor:pointer; }
  .c-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .c-input   { transition:border-color .2s,box-shadow .2s; outline:none; }
  .c-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .c-input::placeholder { color:${C.navy}; }
  .c-input:disabled { opacity:.45; cursor:not-allowed; }
  .c-row     { transition:background .15s; }
  .c-row:hover { background:${C.navyL}10 !important; }
  .c-icon-btn { transition:all .2s; cursor:pointer; }
  .c-icon-btn:hover { opacity:.8; }
  .c-toggle  { transition:all .25s; cursor:pointer; border:none; outline:none; }
  .c-range   { accent-color:${C.orange}; cursor:pointer; }
  .c-select  { appearance:none; cursor:pointer; outline:none; }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Secciones del sidebar ──────────────────────────────────────
const SECCIONES = [
  { id:"general",       icon:Globe,   label:"General",           color:C.blue   },
  { id:"xp",            icon:Zap,     label:"XP & Progresión",   color:C.gold   },
  { id:"juego",         icon:Sword,   label:"Juego & Mecánicas", color:C.orange },
  { id:"seguridad",     icon:Shield,  label:"Seguridad",         color:C.red    },
  { id:"notificaciones",icon:Bell,    label:"Notificaciones",    color:C.teal   },
  { id:"mantenimiento", icon:Wrench,  label:"Mantenimiento",     color:C.muted  },
];

// ── Config inicial (mock) ──────────────────────────────────────
const INITIAL_CONFIG = {
  general: {
    appNombre:      "ForgeVenture",
    appDesc:        "La aventura gamificada de tu cuerpo",
    appUrl:         "https://forgeventure.app",
    idioma:         "es",
    zonaHoraria:    "America/Guayaquil",
    mantenimiento:  false,
    registroAbierto:true,
    maxUsuarios:    5000,
    logoUrl:        "",
  },
  xp: {
    xpBase:            30,
    multiplicadorDia:  1.0,
    bonusPrimerSesion: 50,
    xpPorNivel:        1000,
    maxNivel:          99,
    xpRachaBonus:      10,
    rachaMinDias:      3,
    claseBonus:        25,
    xpDecayActivo:     false,
    xpDecayDias:       14,
    xpDecayPct:        5,
  },
  juego: {
    clasesDisponibles: ["GUERRERO","ARQUERO","MAGO"],
    permitirCambioClase: false,
    cooldownSesionMin:  60,
    verificacionCamara: true,
    verificacionTimer:  true,
    timerMinutosDef:    20,
    hpMaximo:           100,
    hpRecuperacionDias: 1,
    tiendaActiva:       true,
    misionesActivas:    true,
    logrosActivos:      true,
    chatbotActivo:      false,
  },
  seguridad: {
    jwtExpiracion:    "7d",
    maxIntentos:      5,
    bloqueoMinutos:   15,
    emailVerificacion:false,
    faActivo:        false,
    sessionTimeout:   60,
    apiRateLimit:     100,
    corsOrigins:      "http://localhost:5173",
  },
  notificaciones: {
    emailBienvenida:   true,
    emailReset:        true,
    emailLogro:        false,
    emailRacha:        false,
    emailSemanal:      false,
    pushActivo:        false,
    smtpHost:          "smtp.gmail.com",
    smtpPuerto:        587,
    smtpUser:          "ctrlaltquest.notify@gmail.com",
    smtpPass:          "",
    remitente:         "ForgeVenture ⚔️",
  },
};

// ── Helpers ────────────────────────────────────────────────────
function Spinner({color=C.orange}) {
  return <div style={{width:13,height:13,border:`2px solid ${C.muted}`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"c-spin .8s linear infinite"}}/>;
}

// Toggle switch visual
function Toggle({on,onChange,color=C.orange,disabled=false}) {
  return (
    <button type="button" onClick={()=>!disabled&&onChange(!on)} className="c-toggle"
      disabled={disabled}
      style={{width:46,height:24,background:on?color:`${C.navy}88`,border:`1px solid ${on?color:C.navy}`,
        borderRadius:12,position:"relative",flexShrink:0,padding:0,
        boxShadow:on?`0 0 10px ${color}44`:"none",
        opacity:disabled?.5:1,cursor:disabled?"not-allowed":"pointer"}}>
      <div style={{position:"absolute",top:3,left:on?22:3,width:16,height:16,background:on?C.bg:C.muted,
        borderRadius:"50%",transition:"left .22s ease, background .22s"}}/>
    </button>
  );
}

// Input text / number
function CInput({value,onChange,type="text",placeholder="",disabled=false,unit,min,max,step=1,mono=false}) {
  return (
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input type={type} value={value} onChange={e=>onChange(type==="number"?Number(e.target.value):e.target.value)}
        placeholder={placeholder} disabled={disabled} min={min} max={max} step={step}
        className="c-input"
        style={{width:"100%",padding:unit?"10px 40px 10px 12px":"10px 12px",
          background:C.panel,border:`1px solid ${C.navy}`,color:C.white,
          ...(mono?{fontFamily:"'Courier New',monospace",fontSize:13}:raj(13,500))}}/>
      {unit&&<span style={{position:"absolute",right:12,...raj(11,600),color:C.muted,pointerEvents:"none"}}>{unit}</span>}
    </div>
  );
}

// Select
function CSelect({value,onChange,options,disabled=false}) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
      className="c-input c-select"
      style={{width:"100%",padding:"10px 12px",background:C.panel,border:`1px solid ${C.navy}`,
        color:C.white,...raj(13,500)}}>
      {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select>
  );
}

// Fila de setting
function SettingRow({label,hint,children,danger=false}) {
  return (
    <div className="c-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,padding:"16px 0",
      borderBottom:`1px solid ${C.navy}22`,alignItems:"center"}}>
      <div>
        <div style={{...raj(13,700),color:danger?C.red:C.white,marginBottom:3}}>{label}</div>
        {hint&&<div style={{...raj(11,400),color:C.muted,lineHeight:1.5}}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Fila toggle especial (full width con descripción)
function ToggleRow({label,hint,on,onChange,color=C.orange,disabled=false,badge}) {
  return (
    <div className="c-row" style={{display:"flex",alignItems:"center",gap:16,padding:"14px 18px",
      background:on?`${color}06`:"transparent",border:`1px solid ${on?color+"22":C.navy+"44"}`,
      marginBottom:8,transition:"all .2s",cursor:disabled?"not-allowed":"default"}}>
      <Toggle on={on} onChange={onChange} color={color} disabled={disabled}/>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{...raj(13,700),color:on?C.white:C.mutedL}}>{label}</span>
          {badge&&<span style={{...raj(9,700),color:badge.c||C.orange,background:`${badge.c||C.orange}18`,
            border:`1px solid ${badge.c||C.orange}33`,padding:"1px 7px"}}>{badge.l}</span>}
        </div>
        {hint&&<div style={{...raj(11,400),color:C.muted,lineHeight:1.5,marginTop:2}}>{hint}</div>}
      </div>
      <div style={{...raj(11,700),color:on?color:C.muted}}>{on?"ACTIVO":"INACTIVO"}</div>
    </div>
  );
}

// Slider con labels
function SliderRow({label,hint,value,onChange,min,max,step=1,unit="",color=C.orange}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div>
          <div style={{...raj(13,700),color:C.white}}>{label}</div>
          {hint&&<div style={{...raj(11,400),color:C.muted}}>{hint}</div>}
        </div>
        <div style={{background:`${color}18`,border:`1px solid ${color}44`,padding:"6px 14px",
          display:"flex",alignItems:"center",gap:4,...orb(15,900),color,minWidth:80,textAlign:"center",justifyContent:"center"}}>
          {value}{unit}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="c-range"
        style={{width:"100%",height:4,accentColor:color}}/>
      <div style={{display:"flex",justifyContent:"space-between",...raj(10,500),color:C.navy,marginTop:3}}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// Info box
function InfoBox({text,color=C.blue}) {
  return (
    <div style={{display:"flex",gap:10,background:`${color}0A`,border:`1px solid ${color}22`,
      padding:"10px 14px",marginBottom:16}}>
      <Info size={14} color={color} style={{flexShrink:0,marginTop:1}}/>
      <span style={{...raj(12,400),color:C.mutedL,lineHeight:1.6}}>{text}</span>
    </div>
  );
}

// Sección card wrapper
function SectionCard({children,style}) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.navy}`,
      animation:"c-fadeIn .35s ease both",...style}}>
      {children}
    </div>
  );
}
function SectionBody({children}) {
  return <div style={{padding:"4px 22px 10px"}}>{children}</div>;
}
function SectionTitle({icon:Icon,title,color,desc,extra}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"18px 22px",borderBottom:`1px solid ${C.navy}`,flexWrap:"wrap"}}>
      <div style={{background:`${color}18`,border:`1px solid ${color}33`,padding:9,display:"flex"}}><Icon size={16} color={color}/></div>
      <div style={{flex:1}}>
        <div style={{...orb(12,700),color:C.white,marginBottom:2}}>{title}</div>
        {desc&&<div style={{...raj(12,400),color:C.muted}}>{desc}</div>}
      </div>
      {extra}
    </div>
  );
}

// Badge de estado guardado
function SavedBadge({show}) {
  if(!show) return null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,...raj(12,700),color:C.green,
      background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"6px 14px",
      animation:"c-saved 2s ease forwards"}}>
      <Check size={13}/> Guardado
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SECCIONES DE CONTENIDO
// ══════════════════════════════════════════════════════════════

// ── General ───────────────────────────────────────────────────
function SecGeneral({cfg,set,onSave,saving,saved}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionCard>
        <SectionTitle icon={Globe} title="INFORMACIÓN DE LA APP" color={C.blue} desc="Datos básicos visibles al usuario"/>
        <SectionBody>
          <SettingRow label="Nombre de la app" hint="Nombre que aparece en la interfaz y emails">
            <CInput value={cfg.appNombre} onChange={v=>set("appNombre",v)} placeholder="ForgeVenture"/>
          </SettingRow>
          <SettingRow label="Descripción" hint="Tagline visible en el splash y landing">
            <CInput value={cfg.appDesc} onChange={v=>set("appDesc",v)} placeholder="Tu aventura gamificada"/>
          </SettingRow>
          <SettingRow label="URL de la app" hint="URL pública de producción">
            <CInput value={cfg.appUrl} onChange={v=>set("appUrl",v)} placeholder="https://app.com" mono/>
          </SettingRow>
          <SettingRow label="Idioma por defecto">
            <CSelect value={cfg.idioma} onChange={v=>set("idioma",v)} options={[{v:"es",l:"Español"},{v:"en",l:"English"},{v:"pt",l:"Português"}]}/>
          </SettingRow>
          <SettingRow label="Zona horaria">
            <CSelect value={cfg.zonaHoraria} onChange={v=>set("zonaHoraria",v)} options={[
              {v:"America/Guayaquil", l:"Ecuador (UTC-5)"},
              {v:"America/Bogota",   l:"Colombia (UTC-5)"},
              {v:"America/Lima",     l:"Perú (UTC-5)"},
              {v:"America/Mexico_City",l:"México (UTC-6)"},
              {v:"America/Santiago", l:"Chile (UTC-4)"},
            ]}/>
          </SettingRow>
          <SettingRow label="Máximo de usuarios" hint="Límite de cuentas registradas (0 = ilimitado)" >
            <CInput type="number" value={cfg.maxUsuarios} onChange={v=>set("maxUsuarios",v)} min={0} placeholder="5000" unit="users"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Globe} title="ACCESO Y REGISTRO" color={C.blue}/>
        <SectionBody>
          <ToggleRow label="Registro de nuevos usuarios" hint="Si está desactivado, nadie puede crear cuenta" on={cfg.registroAbierto} onChange={v=>set("registroAbierto",v)} color={C.green}/>
          <ToggleRow label="Modo mantenimiento" hint="Redirige a todos los usuarios a la pantalla de mantenimiento" on={cfg.mantenimiento} onChange={v=>set("mantenimiento",v)} color={C.red} badge={cfg.mantenimiento?{l:"⚠ ACTIVO",c:C.red}:null}/>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}

// ── XP & Progresión ───────────────────────────────────────────
function SecXP({cfg,set,onSave,saving,saved}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionCard>
        <SectionTitle icon={Zap} title="SISTEMA DE XP" color={C.gold} desc="Configuración base de puntos de experiencia"/>
        <SectionBody>
          <InfoBox text="Los cambios en XP base afectan a todas las sesiones futuras. Las sesiones ya completadas no se recalculan." color={C.gold}/>
          <SliderRow label="XP base por sesión" hint="XP mínimo que otorga cualquier ejercicio" value={cfg.xpBase} onChange={v=>set("xpBase",v)} min={5} max={200} step={5} unit=" XP" color={C.gold}/>
          <SliderRow label="Bonus primera sesión del día" hint="XP extra por la primera sesión diaria" value={cfg.bonusPrimerSesion} onChange={v=>set("bonusPrimerSesion",v)} min={0} max={200} step={10} unit=" XP" color={C.orange}/>
          <SliderRow label="Multiplicador global" hint="Factor que multiplica todo el XP ganado (1.0 = normal)" value={cfg.multiplicadorDia} onChange={v=>set("multiplicadorDia",v)} min={0.5} max={3.0} step={0.1} unit="x" color={C.orangeL}/>
          <SliderRow label="Bonus por clase (%" hint="% extra de XP al hacer ejercicio del tipo de tu clase" value={cfg.claseBonus} onChange={v=>set("claseBonus",v)} min={0} max={100} step={5} unit="%" color={C.purple}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Zap} title="PROGRESIÓN Y NIVELES" color={C.gold}/>
        <SectionBody>
          <SettingRow label="XP por nivel" hint="XP necesario para subir 1 nivel (se multiplica por el nivel actual)">
            <CInput type="number" value={cfg.xpPorNivel} onChange={v=>set("xpPorNivel",v)} min={100} step={100} unit="XP"/>
          </SettingRow>
          <SettingRow label="Nivel máximo" hint="Los jugadores no pueden superar este nivel">
            <CInput type="number" value={cfg.maxNivel} onChange={v=>set("maxNivel",v)} min={10} max={999} unit="niveles"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Zap} title="SISTEMA DE RACHA" color={C.red}/>
        <SectionBody>
          <SettingRow label="Días mínimos para bonus de racha" hint="A partir de este número de días consecutivos se activa el bonus">
            <CInput type="number" value={cfg.rachaMinDias} onChange={v=>set("rachaMinDias",v)} min={1} max={30} unit="días"/>
          </SettingRow>
          <SliderRow label="Bonus de racha por día" hint="XP extra adicional por cada día de racha activa" value={cfg.xpRachaBonus} onChange={v=>set("xpRachaBonus",v)} min={0} max={100} step={5} unit=" XP/día" color={C.red}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Zap} title="DECAIMIENTO DE XP" color={C.muted} desc="Penalización por inactividad prolongada"/>
        <SectionBody>
          <ToggleRow label="Activar decaimiento de XP" hint="Los usuarios inactivos perderán XP gradualmente" on={cfg.xpDecayActivo} onChange={v=>set("xpDecayActivo",v)} color={C.red} badge={cfg.xpDecayActivo?{l:"ACTIVADO",c:C.red}:null}/>
          <SettingRow label="Días de inactividad para iniciar decay" hint="Días sin sesiones antes de empezar a perder XP">
            <CInput type="number" value={cfg.xpDecayDias} onChange={v=>set("xpDecayDias",v)} min={1} disabled={!cfg.xpDecayActivo} unit="días"/>
          </SettingRow>
          <SliderRow label="% de XP perdido por día de inactividad" hint="Porcentaje del XP total que se pierde cada día" value={cfg.xpDecayPct} onChange={v=>set("xpDecayPct",v)} min={1} max={20} unit="%" color={C.red}/>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}

// ── Juego ─────────────────────────────────────────────────────
function SecJuego({cfg,set,onSave,saving,saved}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionCard>
        <SectionTitle icon={Sword} title="CLASES DE HÉROE" color={C.orange}/>
        <SectionBody>
          <ToggleRow label="GUERRERO ⚔️" hint="+25% XP en ejercicios de Fuerza" on={cfg.clasesDisponibles.includes("GUERRERO")} onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"GUERRERO"]:cfg.clasesDisponibles.filter(c=>c!=="GUERRERO"))} color={C.orange}/>
          <ToggleRow label="ARQUERO 🏃" hint="+25% XP en ejercicios de Cardio" on={cfg.clasesDisponibles.includes("ARQUERO")} onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"ARQUERO"]:cfg.clasesDisponibles.filter(c=>c!=="ARQUERO"))} color={C.blue}/>
          <ToggleRow label="MAGO 🧘" hint="+25% XP en ejercicios de Flexibilidad" on={cfg.clasesDisponibles.includes("MAGO")} onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"MAGO"]:cfg.clasesDisponibles.filter(c=>c!=="MAGO"))} color={C.purple}/>
          <ToggleRow label="Permitir cambio de clase" hint="Los usuarios pueden cambiar de clase después del registro" on={cfg.permitirCambioClase} onChange={v=>set("permitirCambioClase",v)} color={C.teal}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Sword} title="MECÁNICAS DE SESIÓN" color={C.orange}/>
        <SectionBody>
          <SettingRow label="Cooldown entre sesiones" hint="Tiempo mínimo que debe pasar entre sesiones del mismo ejercicio">
            <CInput type="number" value={cfg.cooldownSesionMin} onChange={v=>set("cooldownSesionMin",v)} min={0} max={1440} unit="min"/>
          </SettingRow>
          <SettingRow label="Duración de timer por defecto" hint="Minutos predeterminados para ejercicios con verificación por tiempo">
            <CInput type="number" value={cfg.timerMinutosDef} onChange={v=>set("timerMinutosDef",v)} min={1} max={180} unit="min"/>
          </SettingRow>
          <ToggleRow label="Verificación por cámara" hint="Permite usar MediaPipe para contar repeticiones automáticamente" on={cfg.verificacionCamara} onChange={v=>set("verificacionCamara",v)} color={C.teal}/>
          <ToggleRow label="Verificación por timer" hint="Permite mantener el timer activo como método de verificación" on={cfg.verificacionTimer} onChange={v=>set("verificacionTimer",v)} color={C.blue}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Sword} title="HP DEL HÉROE" color={C.red}/>
        <SectionBody>
          <SettingRow label="HP máximo" hint="Puntos de vida máximos del personaje">
            <CInput type="number" value={cfg.hpMaximo} onChange={v=>set("hpMaximo",v)} min={10} max={1000} unit="HP"/>
          </SettingRow>
          <SettingRow label="Días para recuperar 1 HP" hint="Cada X días de inactividad se pierde 1 HP">
            <CInput type="number" value={cfg.hpRecuperacionDias} onChange={v=>set("hpRecuperacionDias",v)} min={1} max={30} unit="días"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Sword} title="MÓDULOS ACTIVOS" color={C.orange}/>
        <SectionBody>
          <ToggleRow label="Tienda de objetos" hint="Los usuarios pueden comprar y usar items" on={cfg.tiendaActiva} onChange={v=>set("tiendaActiva",v)} color={C.gold}/>
          <ToggleRow label="Misiones" hint="Sistema de misiones diarias, semanales y desafíos" on={cfg.misionesActivas} onChange={v=>set("misionesActivas",v)} color={C.orange}/>
          <ToggleRow label="Logros y badges" hint="Sistema de logros y recompensas por objetivos" on={cfg.logrosActivos} onChange={v=>set("logrosActivos",v)} color={C.purple}/>
          <ToggleRow label="Forge AI (chatbot)" hint="Asistente de entrenamiento powered by Gemini" on={cfg.chatbotActivo} onChange={v=>set("chatbotActivo",v)} color={C.teal} badge={{l:"BETA",c:C.teal}}/>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}

// ── Seguridad ─────────────────────────────────────────────────
function SecSeguridad({cfg,set,onSave,saving,saved}) {
  const [showPass, setShowPass] = useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <InfoBox text="Los cambios en configuración de seguridad requieren que todos los usuarios inicien sesión nuevamente." color={C.red}/>

      <SectionCard>
        <SectionTitle icon={Shield} title="AUTENTICACIÓN" color={C.red}/>
        <SectionBody>
          <SettingRow label="Expiración del JWT" hint="Tiempo de validez del token de sesión">
            <CSelect value={cfg.jwtExpiracion} onChange={v=>set("jwtExpiracion",v)} options={[
              {v:"1h",  l:"1 hora"},{v:"6h",l:"6 horas"},
              {v:"1d",  l:"1 día"},{v:"3d",l:"3 días"},
              {v:"7d",  l:"7 días"},{v:"30d",l:"30 días"},
            ]}/>
          </SettingRow>
          <SettingRow label="Timeout de sesión inactiva" hint="Minutos sin actividad antes de cerrar sesión">
            <CInput type="number" value={cfg.sessionTimeout} onChange={v=>set("sessionTimeout",v)} min={5} max={1440} unit="min"/>
          </SettingRow>
          <ToggleRow label="Verificación de email" hint="Los nuevos usuarios deben verificar su email antes de acceder" on={cfg.emailVerificacion} onChange={v=>set("emailVerificacion",v)} color={C.blue}/>
          <ToggleRow label="Autenticación 2FA" hint="Requerir segundo factor de autenticación" on={cfg["faActivo"]} onChange={v=>set("faActivo",v)} color={C.gold} badge={{l:"PRÓXIMO",c:C.muted}}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Shield} title="PROTECCIÓN CONTRA ATAQUES" color={C.red}/>
        <SectionBody>
          <SettingRow label="Intentos antes de bloqueo" hint="Número de intentos de login fallidos antes de bloquear la cuenta">
            <CInput type="number" value={cfg.maxIntentos} onChange={v=>set("maxIntentos",v)} min={1} max={20} unit="intentos"/>
          </SettingRow>
          <SettingRow label="Duración del bloqueo" hint="Minutos que la cuenta permanece bloqueada tras superar el límite">
            <CInput type="number" value={cfg.bloqueoMinutos} onChange={v=>set("bloqueoMinutos",v)} min={1} max={1440} unit="min"/>
          </SettingRow>
          <SettingRow label="Rate limit de la API" hint="Máximo de peticiones por minuto por usuario">
            <CInput type="number" value={cfg.apiRateLimit} onChange={v=>set("apiRateLimit",v)} min={10} max={1000} unit="req/min"/>
          </SettingRow>
          <SettingRow label="CORS Origins permitidos" hint="URLs separadas por coma que pueden hacer peticiones a la API">
            <CInput value={cfg.corsOrigins} onChange={v=>set("corsOrigins",v)} placeholder="https://app.com,https://admin.app.com" mono/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}

// ── Notificaciones ────────────────────────────────────────────
function SecNotificaciones({cfg,set,onSave,saving,saved}) {
  const [showPass, setShowPass] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | "sending" | "ok" | "error"

  const testEmail = async () => {
    setTestStatus("sending");
    await new Promise(r=>setTimeout(r,1500));
    setTestStatus(Math.random()>.2?"ok":"error");
    setTimeout(()=>setTestStatus(null),3000);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SectionCard>
        <SectionTitle icon={Mail} title="CONFIGURACIÓN SMTP" color={C.teal} desc="Servidor de correo saliente"/>
        <SectionBody>
          <InfoBox text="Usa una contraseña de aplicación de Gmail (no tu contraseña normal). Actívala en Cuenta Google → Seguridad → Contraseñas de aplicación." color={C.teal}/>
          <SettingRow label="Host SMTP">
            <CInput value={cfg.smtpHost} onChange={v=>set("smtpHost",v)} placeholder="smtp.gmail.com" mono/>
          </SettingRow>
          <SettingRow label="Puerto SMTP">
            <CSelect value={String(cfg.smtpPuerto)} onChange={v=>set("smtpPuerto",Number(v))} options={[{v:"587",l:"587 (TLS)"},{v:"465",l:"465 (SSL)"},{v:"25",l:"25 (sin cifrado)"}]}/>
          </SettingRow>
          <SettingRow label="Usuario SMTP" hint="Tu dirección de Gmail">
            <CInput value={cfg.smtpUser} onChange={v=>set("smtpUser",v)} placeholder="tu@gmail.com" mono/>
          </SettingRow>
          <SettingRow label="Contraseña de aplicación" hint="16 caracteres generados por Google">
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <input type={showPass?"text":"password"} value={cfg.smtpPass}
                onChange={e=>set("smtpPass",e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx" className="c-input"
                style={{width:"100%",padding:"10px 42px 10px 12px",background:C.panel,
                  border:`1px solid ${C.navy}`,color:C.white,fontFamily:"'Courier New',monospace",fontSize:13}}/>
              <button onClick={()=>setShowPass(v=>!v)} className="c-icon-btn"
                style={{position:"absolute",right:10,background:"transparent",border:"none",color:C.muted,display:"flex"}}>
                {showPass?<EyeOff size={14}/>:<Eye size={14}/>}
              </button>
            </div>
          </SettingRow>
          <SettingRow label="Nombre del remitente">
            <CInput value={cfg.remitente} onChange={v=>set("remitente",v)} placeholder="ForgeVenture ⚔️"/>
          </SettingRow>
          {/* test email */}
          <div style={{padding:"14px 0"}}>
            <button onClick={testEmail} disabled={testStatus==="sending"} className="c-btn"
              style={{...raj(13,700),color:testStatus==="ok"?C.bg:testStatus==="error"?C.white:C.bg,
                background:testStatus==="ok"?C.green:testStatus==="error"?C.red:C.teal,
                border:"none",padding:"10px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,
                boxShadow:`0 3px 14px ${C.teal}33`}}>
              {testStatus==="sending"?<><Spinner color={C.white}/> Enviando prueba...</>
               :testStatus==="ok"?<><Check size={14}/> Email enviado correctamente</>
               :testStatus==="error"?<><X size={14}/> Error al enviar</>
               :<><Mail size={14}/> Enviar email de prueba</>}
            </button>
          </div>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Bell} title="EMAILS AUTOMÁTICOS" color={C.teal}/>
        <SectionBody>
          <ToggleRow label="Email de bienvenida" hint="Enviado al completar el registro" on={cfg.emailBienvenida} onChange={v=>set("emailBienvenida",v)} color={C.green}/>
          <ToggleRow label="Email de restablecimiento de contraseña" hint="Email con código de 6 dígitos" on={cfg.emailReset} onChange={v=>set("emailReset",v)} color={C.blue}/>
          <ToggleRow label="Notificación de logro desbloqueado" hint="Email cuando el usuario obtiene un logro nuevo" on={cfg.emailLogro} onChange={v=>set("emailLogro",v)} color={C.gold}/>
          <ToggleRow label="Alerta de racha en peligro" hint="Email cuando la racha del usuario está a punto de romperse" on={cfg.emailRacha} onChange={v=>set("emailRacha",v)} color={C.red}/>
          <ToggleRow label="Resumen semanal de progreso" hint="Email de estadísticas enviado cada lunes" on={cfg.emailSemanal} onChange={v=>set("emailSemanal",v)} color={C.purple}/>
          <ToggleRow label="Notificaciones push" hint="Push browser — requiere configuración adicional" on={cfg.pushActivo} onChange={v=>set("pushActivo",v)} color={C.teal} badge={{l:"PRÓXIMO",c:C.muted}}/>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}

// ── Mantenimiento ─────────────────────────────────────────────
function SecMantenimiento() {
  const [confirm, setConfirm] = useState(null);  // "cache"|"logs"|"sessions"
  const [running, setRunning] = useState(null);
  const [done,    setDone]    = useState(null);

  const run = async (action) => {
    setConfirm(null);
    setRunning(action);
    await new Promise(r=>setTimeout(r,1800));
    setRunning(null);
    setDone(action);
    setTimeout(()=>setDone(null),3000);
  };

  const ActionBtn = ({id,label,hint,color,icon:Icon,danger=false}) => {
    const isRunning = running===id;
    const isDone    = done===id;
    const isConfirm = confirm===id;
    return (
      <div className="c-row" style={{display:"flex",alignItems:"center",gap:16,padding:"16px 18px",
        borderBottom:`1px solid ${C.navy}22`,background:isConfirm?`${C.red}08`:"transparent"}}>
        <div style={{background:`${color}18`,border:`1px solid ${color}33`,padding:10,display:"flex",flexShrink:0}}><Icon size={16} color={color}/></div>
        <div style={{flex:1}}>
          <div style={{...raj(13,700),color:danger&&!isConfirm?C.red:C.white}}>{label}</div>
          <div style={{...raj(11,400),color:C.muted,lineHeight:1.5}}>{hint}</div>
          {isConfirm&&<div style={{...raj(11,700),color:C.red,marginTop:4}}>⚠ ¿Confirmas esta acción? No se puede deshacer.</div>}
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          {isConfirm&&<button onClick={()=>setConfirm(null)} className="c-btn" style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"8px 14px",cursor:"pointer"}}>Cancelar</button>}
          <button onClick={()=>danger&&!isConfirm?setConfirm(id):run(id)} disabled={!!running}
            className="c-btn"
            style={{...raj(12,700),color:isDone?C.bg:isRunning?C.muted:color==="danger"?C.white:C.bg,
              background:isDone?C.green:isRunning?`${color}33`:danger?`${C.red}22`:color,
              border:danger?`1px solid ${C.red}44`:"none",
              padding:"8px 16px",cursor:running?"not-allowed":"pointer",
              display:"flex",alignItems:"center",gap:7,
              boxShadow:isDone?`0 2px 10px ${C.green}44`:isRunning?"none":`0 2px 10px ${color}33`}}>
            {isRunning?<><Spinner color={color}/> Ejecutando...</>
             :isDone?<><Check size={13}/> Completado</>
             :isConfirm?<><AlertTriangle size={13}/> Confirmar</>
             :<>{label}</>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <InfoBox text="Las acciones de mantenimiento pueden afectar a usuarios activos. Se recomienda ejecutarlas en horario de baja actividad." color={C.red}/>

      <SectionCard>
        <SectionTitle icon={Database} title="CACHÉ Y DATOS" color={C.blue}/>
        <SectionBody>
          <ActionBtn id="cache"    label="Limpiar caché"          hint="Borra el caché de la aplicación sin afectar datos de usuarios"  color={C.blue}   icon={RefreshCw}/>
          <ActionBtn id="sessions" label="Cerrar todas las sesiones" hint="Fuerza el cierre de sesión de todos los usuarios activos" color={C.orange} icon={Lock} danger/>
          <ActionBtn id="logs"     label="Limpiar logs de sistema"  hint="Elimina los archivos de log de más de 30 días"              color={C.muted}  icon={Trash2}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Server} title="EXPORTACIÓN DE DATOS" color={C.teal}/>
        <SectionBody>
          <ActionBtn id="export_users"    label="Exportar usuarios (CSV)"   hint="Descarga un CSV con todos los perfiles de usuario"         color={C.teal}   icon={Database}/>
          <ActionBtn id="export_sessions" label="Exportar sesiones (CSV)"   hint="Descarga todas las sesiones de ejercicio registradas"       color={C.blue}   icon={Database}/>
          <ActionBtn id="export_config"   label="Exportar configuración"    hint="Descarga el JSON de la configuración actual del sistema"    color={C.muted}  icon={Settings}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={AlertTriangle} title="ZONA DE PELIGRO" color={C.red} desc="Acciones irreversibles — úsalas con cuidado"/>
        <SectionBody>
          <InfoBox text="Estas acciones son permanentes e irreversibles. Siempre haz un backup antes de ejecutarlas." color={C.red}/>
          <ActionBtn id="reset_xp"    label="Resetear XP de todos los usuarios"   hint="Pone a 0 el XP y nivel de todos los héroes. No elimina cuentas."       color={C.red} icon={RotateCcw} danger/>
          <ActionBtn id="del_inactive" label="Eliminar usuarios inactivos (+90d)" hint="Elimina cuentas sin actividad en los últimos 90 días permanentemente." color={C.red} icon={Trash2}    danger/>
        </SectionBody>
      </SectionCard>

      {/* Info de sistema */}
      <SectionCard>
        <SectionTitle icon={Server} title="INFORMACIÓN DEL SISTEMA" color={C.muted}/>
        <div style={{padding:"4px 22px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {l:"Versión de la app",     v:"ForgeVenture v1.0.0-beta"},
            {l:"Entorno",               v:"Development"},
            {l:"Backend",               v:"Node.js + Express (Puerto 4000)"},
            {l:"Base de datos",         v:"Firebase Firestore"},
            {l:"Autenticación",         v:"Firebase Auth"},
            {l:"Almacenamiento",        v:"Firebase Storage"},
            {l:"API de IA",             v:"Gemini API (pendiente)"},
            {l:"Detección biométrica",  v:"MediaPipe Pose"},
          ].map((i,idx)=>(
            <div key={idx} style={{background:C.panel,border:`1px solid ${C.navy}33`,padding:"12px 16px"}}>
              <div style={{...raj(11,600),color:C.muted,marginBottom:3}}>{i.l}</div>
              <div style={{...raj(13,700),color:C.white,wordBreak:"break-all"}}>{i.v}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Save bar ───────────────────────────────────────────────────
function SaveBar({onSave,saving,saved}) {
  return (
    <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12,padding:"16px 0 4px"}}>
      <SavedBadge show={saved}/>
      <button onClick={onSave} disabled={saving} className="c-btn"
        style={{...px(8),color:saving?C.muted:C.bg,background:saving?`${C.orange}55`:C.orange,
          border:"none",padding:"12px 24px",cursor:saving?"not-allowed":"pointer",
          boxShadow:saving?"none":`0 4px 20px ${C.orange}44`,
          display:"flex",alignItems:"center",gap:10}}>
        {saving?<><Spinner/> GUARDANDO...</>:<><Save size={14}/> GUARDAR CAMBIOS</>}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminConfig() {
  const [activeTab, setActiveTab]   = useState("general");
  const [config,    setConfig]      = useState(INITIAL_CONFIG);
  const [saving,    setSaving]      = useState(false);
  const [saved,     setSaved]       = useState(false);
  const [dirty,     setDirty]       = useState({});

  // Setter por sección + campo
  const set = (section) => (key, val) => {
    setConfig(c=>({...c,[section]:{...c[section],[key]:val}}));
    setDirty(d=>({...d,[section]:true}));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,1000)); // ← reemplazar con saveConfig(token, activeTab, config[activeTab])
    setSaving(false);
    setSaved(true);
    setDirty(d=>({...d,[activeTab]:false}));
    setTimeout(()=>setSaved(false),2500);
  };

  const active = SECCIONES.find(s=>s.id===activeTab)||SECCIONES[0];

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:18,alignItems:"start"}}>

        {/* ── Sidebar nav ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,position:"sticky",top:0}}>
          <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.navy}`}}>
            <div style={{...px(8),color:C.muted,letterSpacing:".06em"}}>CONFIGURACIÓN</div>
          </div>
          {SECCIONES.map(s=>{
            const on=activeTab===s.id;
            const hasDirty=dirty[s.id];
            return (
              <button key={s.id} onClick={()=>setActiveTab(s.id)} className="c-nav-item"
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 18px",
                  background:on?`${s.color}14`:"transparent",
                  border:"none",borderLeft:`3px solid ${on?s.color:"transparent"}`,
                  cursor:"pointer",textAlign:"left",position:"relative",transition:"all .18s"}}>
                <s.icon size={15} color={on?s.color:C.muted}/>
                <span style={{...raj(13,on?700:500),color:on?s.color:C.mutedL}}>{s.label}</span>
                {hasDirty&&<div style={{position:"absolute",right:14,width:7,height:7,background:C.orange,borderRadius:"50%",animation:"c-pulse 1.2s infinite"}}/>}
                {on&&<ChevronRight size={12} color={s.color} style={{position:"absolute",right:14}}/>}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div style={{minWidth:0}}>
          {/* section hero */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,
            background:C.card,border:`1px solid ${active.color}33`,padding:"16px 20px",
            borderLeft:`4px solid ${active.color}`}}>
            <active.icon size={20} color={active.color}/>
            <div>
              <div style={{...orb(13,700),color:C.white}}>{active.label.toUpperCase()}</div>
              <div style={{...raj(12,400),color:C.muted}}>
                {{
                  general:       "Nombre, idioma, URL y acceso de la aplicación",
                  xp:            "Sistema de puntos de experiencia, niveles y rachas",
                  juego:         "Clases, mecánicas de sesión, HP y módulos activos",
                  seguridad:     "JWT, intentos de login, 2FA y protecciones",
                  notificaciones:"SMTP, emails automáticos y notificaciones push",
                  mantenimiento: "Caché, exportación de datos y zona de peligro",
                }[activeTab]}
              </div>
            </div>
          </div>

          {/* sección activa */}
          {activeTab==="general"       && <SecGeneral       cfg={config.general}       set={set("general")}       onSave={save} saving={saving} saved={saved}/>}
          {activeTab==="xp"            && <SecXP            cfg={config.xp}            set={set("xp")}            onSave={save} saving={saving} saved={saved}/>}
          {activeTab==="juego"         && <SecJuego         cfg={config.juego}         set={set("juego")}         onSave={save} saving={saving} saved={saved}/>}
          {activeTab==="seguridad"     && <SecSeguridad     cfg={config.seguridad}     set={set("seguridad")}     onSave={save} saving={saving} saved={saved}/>}
          {activeTab==="notificaciones"&& <SecNotificaciones cfg={config.notificaciones}set={set("notificaciones")}onSave={save} saving={saving} saved={saved}/>}
          {activeTab==="mantenimiento" && <SecMantenimiento/>}
        </div>

      </div>
    </>
  );
}