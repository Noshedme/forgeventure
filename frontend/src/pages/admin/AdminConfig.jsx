// src/pages/admin/AdminConfig.jsx
// ─────────────────────────────────────────────────────────────
//  Panel de configuración global de ForgeVenture Admin.
//  Secciones: General | XP & Progresión | Juego | Seguridad
//             Notificaciones | Mantenimiento
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Save, RefreshCw, X, AlertTriangle,
  Globe, Zap, Sword, Shield, Wrench,
  RotateCcw, ChevronRight, Info,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.js";
import { getConfig, saveConfig } from "../../services/api.js";
import GeneralConfig      from "../../components/admin/config/GeneralConfig.jsx";
import XPConfig           from "../../components/admin/config/XPConfig.jsx";
import JuegoConfig        from "../../components/admin/config/JuegoConfig.jsx";
import SeguridadConfig    from "../../components/admin/config/SeguridadConfig.jsx";
import MaintenanceConfig  from "../../components/admin/config/MaintenanceConfig.jsx";
import { C, px, raj, orb, Spinner } from "../../components/admin/config/shared.jsx";

// ── CSS global del panel ───────────────────────────────────────
const CSS = `
  @keyframes c-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes c-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }
  @keyframes c-saved { 0%{opacity:0;transform:scale(.8)} 40%{opacity:1;transform:scale(1.1)} 100%{opacity:0;transform:scale(1)} }
  @keyframes c-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes c-glow  { 0%,100%{box-shadow:0 0 0 rgba(212,165,116,.4)} 50%{box-shadow:0 0 20px rgba(212,165,116,.6)} }
  @keyframes c-warnIn{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes c-skelPulse { 0%,100%{opacity:.5} 50%{opacity:.2} }

  .c-modal-backdrop { position:fixed;inset:0;background:rgba(5,12,24,.85);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px); }

  .c-nav-item { transition:all .2s ease; cursor:pointer; }
  .c-nav-item:hover  { background:${C.navyL}22 !important; transform:translateX(2px); }
  .c-btn     { transition:all .2s ease; cursor:pointer; }
  .c-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.3); }
  .c-input   { transition:border-color .2s,box-shadow .2s; outline:none; }
  .c-input:focus { border-color:${C.orange} !important; box-shadow:0 0 0 2px ${C.orange}22; }
  .c-input::placeholder { color:${C.navy}; }
  .c-input:disabled { opacity:.5; cursor:not-allowed; }
  .c-row     { transition:background .15s ease; }
  .c-row:hover { background:${C.navyL}10 !important; }
  .c-icon-btn { transition:all .2s ease; cursor:pointer; }
  .c-icon-btn:hover { opacity:.8; transform:scale(1.05); }
  .c-toggle  { transition:all .25s ease; cursor:pointer; border:none; outline:none; }
  .c-range   { accent-color:${C.orange}; cursor:pointer; }
  .c-select  { appearance:none; cursor:pointer; outline:none; }

  @media (max-width: 860px) {
    .c-layout  { grid-template-columns: 1fr !important; }
    .c-sidebar { position: relative !important; top: auto !important; }
  }
`;

// ── Secciones ──────────────────────────────────────────────────
const SECCIONES = [
  { id:"general",       icon:Globe,   label:"General",           color:C.blue   },
  { id:"xp",            icon:Zap,     label:"XP & Progresión",   color:C.gold   },
  { id:"juego",         icon:Sword,   label:"Juego & Mecánicas", color:C.orange },
  { id:"seguridad",     icon:Shield,  label:"Seguridad",         color:C.red    },
  { id:"mantenimiento", icon:Wrench,  label:"Mantenimiento",     color:C.muted  },
];

const SECTION_DESCS = {
  general:       "Nombre, idioma, URL y acceso de la aplicación",
  xp:            "Sistema de puntos de experiencia, niveles y rachas",
  juego:         "Clases, mecánicas de sesión, HP y módulos activos",
  seguridad:     "JWT, intentos de login, 2FA y protecciones",
  mantenimiento: "Caché, exportación de datos y zona de peligro",
};

// ── Defaults del frontend ──────────────────────────────────────
const INITIAL_CONFIG = {
  general: {
    appNombre:"ForgeVenture", appDesc:"La aventura gamificada de tu cuerpo",
    appUrl:"https://forgeventure.app", idioma:"es", zonaHoraria:"America/Guayaquil",
    mantenimiento:false, registroAbierto:true, maxUsuarios:5000, logoUrl:"",
  },
  xp: {
    xpBase:30, multiplicadorDia:1.0, bonusPrimerSesion:50,
    xpPorNivel:1000, maxNivel:99, xpRachaBonus:10,
    rachaMinDias:3, claseBonus:25, xpDecayActivo:false, xpDecayDias:14, xpDecayPct:5,
  },
  juego: {
    // Nota: xpBase, xpPorNivel, maxNivel, multiplicadorDia, bonusPrimerSesion,
    // rachaMinDias, xpRachaBonus, claseBonus → sección `xp` es autoritativa.
    clasesDisponibles:["GUERRERO","ARQUERO","MAGO"],
    permitirCambioClase:false, cambioClaseCosto:500,
    rachasPorEjercicio:false, rachasSemanales:false,
    rachaSemanalRecompensa:100, cooldownSesionMin:60, timerMinutosDef:20,
    verificacionCamara:true, verificacionTimer:true, modoHardcore:false,
    hpMaximo:100, hpRecuperacionDias:1, hpPorNivel:5, sistemaDanio:false, danioPorFallo:1,
    monedasPorEjercicio:10, monedasPorNivel:50, monedasPorRacha:5,
    tiendaActiva:true, inflacionControlada:false,
    logrosActivos:true, logrosSecretos:false, recompensaLogro:25, logrosTemporada:false,
    leaderboardActivo:false, misionesActivas:true, misionesDiarias:3,
    recompensaMisionDiaria:15, misionesSemanales:false, recompensaMisionSemanal:100,
    chatbotActivo:false, recomendacionesIA:false, analisisForma:false, planesIA:false,
    eventosTemporada:false, desafiosComunitarios:false, torneosMensuales:false, multiplicadorEventos:1.5,
  },
  seguridad: {
    jwtExpiracion:"7d", maxIntentos:5, bloqueoMinutos:15, emailVerificacion:false,
    faActivo:false, sessionTimeout:60, apiRateLimit:100, corsOrigins:"http://localhost:5173",
    passwordMinLength:8, passwordRequireUpper:true, passwordRequireNumbers:true,
    passwordRequireSymbols:false, enableAuthLogs:true, enableConfigLogs:true,
    enableSecurityAlerts:false, logRetentionDays:"90", enableAutoBackup:false,
    backupFrequency:"weekly", backupRetention:10,
  },
};

// ── Loading skeleton ───────────────────────────────────────────
function ConfigSkeleton() {
  const SkCard = ({rows=3,titleW="40%"}) => (
    <div style={{
      background:"rgba(20,26,42,0.78)", borderRadius:14,
      border:`1px solid ${C.navy}`,
      boxShadow:"0 4px 24px rgba(0,0,0,0.35)",
      overflow:"hidden", marginBottom:12,
    }}>
      <div style={{padding:"18px 22px", borderBottom:`1px solid ${C.navy}22`, display:"flex", gap:12, alignItems:"center"}}>
        <div style={{width:34,height:34,background:`${C.navy}88`,borderRadius:8,animation:"c-skelPulse 1.4s ease infinite"}}/>
        <div style={{flex:1}}>
          <div style={{height:11,background:`${C.navy}88`,borderRadius:4,width:titleW,marginBottom:7,animation:"c-skelPulse 1.4s ease infinite"}}/>
          <div style={{height:9,background:`${C.navy}55`,borderRadius:4,width:"60%",animation:"c-skelPulse 1.4s ease infinite .1s"}}/>
        </div>
      </div>
      <div style={{padding:"12px 22px 16px"}}>
        {Array.from({length:rows}).map((_,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,padding:"14px 0",borderBottom:`1px solid ${C.navy}18`}}>
            <div>
              <div style={{height:10,background:`${C.navy}66`,borderRadius:4,width:`${60+i*10}%`,marginBottom:6,animation:`c-skelPulse 1.4s ease infinite ${i*0.1}s`}}/>
              <div style={{height:8,background:`${C.navy}44`,borderRadius:4,width:"70%",animation:`c-skelPulse 1.4s ease infinite ${i*0.1+0.05}s`}}/>
            </div>
            <div style={{height:36,background:`${C.navy}44`,borderRadius:6,animation:`c-skelPulse 1.4s ease infinite ${i*0.1}s`}}/>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      <SkCard rows={4} titleW="35%"/>
      <SkCard rows={3} titleW="45%"/>
      <SkCard rows={2} titleW="30%"/>
    </div>
  );
}

// ── Modales ────────────────────────────────────────────────────
function UnsavedModal({sectionLabel, onSave, onDiscard, onCancel, saving}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{opacity:0, scale:.94, y:8}}
        animate={{opacity:1, scale:1, y:0}}
        exit={{opacity:0, scale:.96, y:4}}
        transition={{duration:.22, ease:"easeOut"}}
        style={{
          background:"rgba(20,26,42,0.95)",
          backdropFilter:"blur(16px)",
          WebkitBackdropFilter:"blur(16px)",
          border:`1px solid ${C.orange}44`,
          borderRadius:14, width:420,
          boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{padding:"20px 24px", borderBottom:`1px solid ${C.navy}44`}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:4}}>
            <AlertTriangle size={16} color={C.orange}/>
            <span style={{...orb(12,700), color:C.white}}>CAMBIOS SIN GUARDAR</span>
          </div>
          <p style={{...raj(13,400), color:C.mutedL, lineHeight:1.6}}>
            Tienes cambios pendientes en <strong style={{color:C.orange}}>{sectionLabel}</strong>.<br/>
            ¿Qué deseas hacer antes de cambiar de sección?
          </p>
        </div>
        <div style={{display:"flex", gap:8, padding:"16px 24px", justifyContent:"flex-end"}}>
          <button onClick={onCancel} className="c-btn"
            style={{...raj(12,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`,
              borderRadius:7, padding:"9px 16px", cursor:"pointer"}}>
            Cancelar
          </button>
          <button onClick={onDiscard} className="c-btn"
            style={{...raj(12,600), color:C.red, background:`${C.red}12`, border:`1px solid ${C.red}44`,
              borderRadius:7, padding:"9px 16px", cursor:"pointer"}}>
            Descartar cambios
          </button>
          <button onClick={onSave} disabled={saving} className="c-btn"
            style={{...raj(12,700), color:C.bg, background:saving?`${C.orange}55`:C.orange,
              border:"none", borderRadius:7, padding:"9px 16px",
              cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:6}}>
            {saving ? <><Spinner/> Guardando...</> : <><Save size={13}/> Guardar y continuar</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ResetModal({sectionLabel, onConfirm, onCancel}) {
  return (
    <div className="c-modal-backdrop" onClick={onCancel}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{opacity:0, scale:.94, y:8}}
        animate={{opacity:1, scale:1, y:0}}
        exit={{opacity:0, scale:.96, y:4}}
        transition={{duration:.22, ease:"easeOut"}}
        style={{
          background:"rgba(20,26,42,0.95)",
          backdropFilter:"blur(16px)",
          WebkitBackdropFilter:"blur(16px)",
          border:`1px solid ${C.red}44`,
          borderRadius:14, width:400,
          boxShadow:"0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{padding:"20px 24px", borderBottom:`1px solid ${C.navy}44`}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:4}}>
            <RotateCcw size={16} color={C.red}/>
            <span style={{...orb(12,700), color:C.white}}>RESTABLECER PREDETERMINADOS</span>
          </div>
          <p style={{...raj(13,400), color:C.mutedL, lineHeight:1.6}}>
            Se restaurarán los valores por defecto de <strong style={{color:C.red}}>{sectionLabel}</strong>.
            Los cambios actuales se perderán. Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={{display:"flex", gap:8, padding:"16px 24px", justifyContent:"flex-end"}}>
          <button onClick={onCancel} className="c-btn"
            style={{...raj(12,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`,
              borderRadius:7, padding:"9px 16px", cursor:"pointer"}}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="c-btn"
            style={{...raj(12,700), color:C.white, background:C.red, border:"none",
              borderRadius:7, padding:"9px 16px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:6}}>
            <RotateCcw size={13}/> Restablecer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminConfig() {
  const [activeTab,    setActiveTab]    = useState("general");
  const [config,       setConfig]       = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [saveError,    setSaveError]    = useState(null);
  const [apiWarn,      setApiWarn]      = useState(null);
  const [dirty,        setDirty]        = useState({});
  const [pendingTab,   setPendingTab]   = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const savedConfigRef = useRef(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const res = await getConfig(token);
        const merged = res?.config
          ? Object.fromEntries(
              Object.keys(INITIAL_CONFIG).map(k => [k, { ...INITIAL_CONFIG[k], ...(res.config[k] || {}) }])
            )
          : INITIAL_CONFIG;
        setConfig(merged);
        savedConfigRef.current = JSON.parse(JSON.stringify(merged));
      } catch (err) {
        console.error("Error cargando config:", err);
        setConfig(JSON.parse(JSON.stringify(INITIAL_CONFIG)));
        savedConfigRef.current = JSON.parse(JSON.stringify(INITIAL_CONFIG));
        setApiWarn("No se pudo cargar la configuración del servidor. Mostrando valores predeterminados. Los cambios se guardarán en la base de datos al presionar Guardar.");
      } finally {
        setLoading(false);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, user => { if (user) loadConfig(); });
    return unsubscribe;
  }, []);

  const set = section => (key, val) => {
    setConfig(c => ({ ...c, [section]: { ...c[section], [key]: val } }));
    setDirty(d => ({ ...d, [section]: true }));
    setSaved(false);
  };

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setSaveError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");
      const token = await currentUser.getIdToken();
      await saveConfig(token, activeTab, config[activeTab]);
      savedConfigRef.current = { ...savedConfigRef.current, [activeTab]: JSON.parse(JSON.stringify(config[activeTab])) };
      setSaved(true);
      setDirty(d => ({ ...d, [activeTab]: false }));
      setTimeout(() => setSaved(false), 2800);
    } catch (err) {
      console.error("Error guardando config:", err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }, [activeTab, config]);

  const switchTab = tabId => {
    if (tabId === activeTab) return;
    if (dirty[activeTab]) { setPendingTab(tabId); return; }
    setActiveTab(tabId);
  };

  const handleSaveAndSwitch = async () => {
    await save();
    setActiveTab(pendingTab);
    setPendingTab(null);
  };
  const handleDiscardAndSwitch = () => {
    if (savedConfigRef.current)
      setConfig(c => ({ ...c, [activeTab]: JSON.parse(JSON.stringify(savedConfigRef.current[activeTab])) }));
    setDirty(d => ({ ...d, [activeTab]: false }));
    setActiveTab(pendingTab);
    setPendingTab(null);
  };
  const resetSection = () => {
    setConfig(c => ({ ...c, [activeTab]: JSON.parse(JSON.stringify(INITIAL_CONFIG[activeTab])) }));
    setDirty(d => ({ ...d, [activeTab]: true }));
    setSaved(false);
    setResetConfirm(false);
  };

  const active       = SECCIONES.find(s => s.id === activeTab) || SECCIONES[0];
  const isDirtyTab   = dirty[activeTab];

  return (
    <>
      <style>{CSS}</style>

      {/* Modals */}
      <AnimatePresence>
        {pendingTab && (
          <UnsavedModal
            sectionLabel={active.label}
            onSave={handleSaveAndSwitch}
            onDiscard={handleDiscardAndSwitch}
            onCancel={() => setPendingTab(null)}
            saving={saving}
          />
        )}
        {resetConfirm && (
          <ResetModal
            sectionLabel={active.label}
            onConfirm={resetSection}
            onCancel={() => setResetConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* API fallback warning */}
      <AnimatePresence>
        {apiWarn && (
          <motion.div
            initial={{opacity:0, y:-8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}}
            transition={{duration:.25}}
            style={{
              display:"flex", alignItems:"flex-start", gap:10,
              background:`${C.orange}0C`, border:`1px solid ${C.orange}33`,
              borderRadius:8, padding:"12px 18px", marginBottom:16,
            }}
          >
            <AlertTriangle size={14} color={C.orange} style={{flexShrink:0, marginTop:2}}/>
            <span style={{...raj(12,600), color:C.orange, flex:1}}>{apiWarn}</span>
            <button onClick={() => setApiWarn(null)}
              style={{background:"none", border:"none", color:C.muted, cursor:"pointer", padding:0}}>
              <X size={13}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="c-layout" style={{display:"grid", gridTemplateColumns:"220px 1fr", gap:18, alignItems:"start"}}>

        {/* ── Sidebar ── */}
        <div className="c-sidebar" style={{
          background:"rgba(20,26,42,0.78)",
          backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          border:`1px solid ${C.navy}`,
          borderRadius:14,
          boxShadow:"0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
          position:"sticky", top:0, overflow:"hidden",
        }}>
          <div style={{padding:"16px 18px", borderBottom:`1px solid ${C.navy}44`}}>
            <div style={{...px(8), color:C.muted, letterSpacing:".06em"}}>CONFIGURACIÓN</div>
          </div>
          {SECCIONES.map(s => {
            const on = activeTab === s.id;
            const hasDirty = dirty[s.id];
            return (
              <button key={s.id} onClick={() => switchTab(s.id)} className="c-nav-item"
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:12,
                  padding:"13px 18px",
                  background: on ? `${s.color}14` : "transparent",
                  border:"none", borderLeft:`3px solid ${on ? s.color : "transparent"}`,
                  cursor:"pointer", textAlign:"left", position:"relative", transition:"all .18s",
                }}
              >
                <s.icon size={15} color={on ? s.color : C.muted}/>
                <span style={{...raj(13, on ? 700 : 500), color: on ? s.color : C.mutedL}}>{s.label}</span>
                {hasDirty && !on && (
                  <div style={{position:"absolute", right:14, width:7, height:7, background:C.orange, borderRadius:"50%", animation:"c-pulse 1.2s infinite"}}/>
                )}
                {on && !hasDirty && <ChevronRight size={12} color={s.color} style={{position:"absolute", right:14}}/>}
                {on && hasDirty && (
                  <div style={{position:"absolute", right:14, width:7, height:7, background:C.orangeL, borderRadius:"50%", animation:"c-pulse .8s infinite"}}/>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div style={{minWidth:0}}>

          {/* Section hero */}
          <motion.div
            layout
            style={{
              display:"flex", alignItems:"center", gap:12,
              marginBottom: isDirtyTab ? 0 : 20,
              background:"rgba(20,26,42,0.78)",
              backdropFilter:"blur(12px)",
              WebkitBackdropFilter:"blur(12px)",
              border:`1px solid ${isDirtyTab ? C.orange+"44" : active.color+"33"}`,
              borderRadius:12,
              borderLeft:`4px solid ${isDirtyTab ? C.orange : active.color}`,
              padding:"16px 20px",
              boxShadow:"0 4px 16px rgba(0,0,0,0.3)",
              transition:"border-color .2s, border-left-color .2s",
            }}
          >
            <active.icon size={20} color={isDirtyTab ? C.orange : active.color}/>
            <div style={{flex:1}}>
              <div style={{...orb(13,700), color:C.white}}>{active.label.toUpperCase()}</div>
              <div style={{...raj(12,400), color:C.muted}}>{SECTION_DESCS[activeTab]}</div>
            </div>
            {isDirtyTab && (
              <div style={{
                display:"flex", alignItems:"center", gap:6,
                background:`${C.orange}14`, border:`1px solid ${C.orange}33`,
                borderRadius:6, padding:"5px 12px",
              }}>
                <div style={{width:6, height:6, background:C.orange, borderRadius:"50%", animation:"c-pulse .8s infinite"}}/>
                <span style={{...raj(11,700), color:C.orange}}>SIN GUARDAR</span>
              </div>
            )}
            {activeTab !== "mantenimiento" && (
              <button onClick={() => setResetConfirm(true)} className="c-btn"
                title="Restablecer valores predeterminados"
                style={{
                  ...raj(11,600), color:C.muted, background:"transparent",
                  border:`1px solid ${C.navy}`, borderRadius:6,
                  padding:"6px 12px", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:5,
                }}
              >
                <RotateCcw size={12}/> Defaults
              </button>
            )}
          </motion.div>

          {/* Save error banner */}
          <AnimatePresence>
            {saveError && (
              <motion.div
                initial={{opacity:0, y:-6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}}
                transition={{duration:.22}}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  background:`${C.red}0C`, border:`1px solid ${C.red}33`,
                  borderRadius:8, padding:"10px 18px", marginTop:8,
                }}
              >
                <AlertTriangle size={13} color={C.red}/>
                <span style={{...raj(12,600), color:C.red, flex:1}}>{saveError}</span>
                <button onClick={() => setSaveError(null)}
                  style={{background:"none", border:"none", color:C.muted, cursor:"pointer", padding:0}}>
                  <X size={13}/>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dirty banner */}
          <AnimatePresence>
            {isDirtyTab && (
              <motion.div
                initial={{opacity:0, y:-6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-6}}
                transition={{duration:.22}}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  background:`${C.orange}09`, border:`1px solid ${C.orange}22`,
                  borderTop:"none", borderRadius:"0 0 8px 8px",
                  padding:"10px 20px", marginBottom:16,
                }}
              >
                <Info size={13} color={C.orange}/>
                <span style={{...raj(12,500), color:C.mutedL, flex:1}}>
                  Tienes cambios sin guardar en esta sección. No olvides presionar{" "}
                  <strong style={{color:C.orange}}>Guardar Cambios</strong> antes de salir.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sección activa con AnimatePresence */}
          {loading ? (
            <ConfigSkeleton/>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{opacity:0, y:10}}
                animate={{opacity:1, y:0}}
                exit={{opacity:0, y:-6}}
                transition={{duration:.24, ease:"easeOut"}}
              >
                {config && activeTab==="general"        && <GeneralConfig      cfg={config.general}    set={set("general")}    onSave={save} saving={saving} saved={saved}/>}
                {config && activeTab==="xp"             && <XPConfig           cfg={config.xp}         set={set("xp")}         onSave={save} saving={saving} saved={saved}/>}
                {config && activeTab==="juego"          && <JuegoConfig        cfg={config.juego}      set={set("juego")}      onSave={save} saving={saving} saved={saved}/>}
                {config && activeTab==="seguridad"      && <SeguridadConfig    cfg={config.seguridad}  set={set("seguridad")}  onSave={save} saving={saving} saved={saved}/>}
                {activeTab==="mantenimiento"             && <MaintenanceConfig/>}
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </div>
    </>
  );
}
