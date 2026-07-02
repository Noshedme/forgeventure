// src/components/admin/config/MaintenanceConfig.jsx
import { Database, Server, AlertTriangle, RefreshCw, Lock, Trash2, Settings, Download, Check } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase.js";
import {
  clearCache, closeAllSessions, clearLogs,
  exportUsersCSV, exportSessionsCSV, exportConfigJSON,
  resetAllXP, deleteInactiveUsers,
} from "../../../services/api.js";
import { useState } from "react";
import {
  C, raj, Spinner,
  InfoBox, SectionCard, SectionBody, SectionTitle,
} from "./shared.jsx";

const BASE_URL = "http://localhost:4000/api";

export default function MaintenanceConfig() {
  const [confirm, setConfirm] = useState(null);
  const [running, setRunning] = useState(null);
  const [done,    setDone]    = useState(null);

  const runAction = async (action, apiCall) => {
    setConfirm(null);
    setRunning(action);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");
      const token = await currentUser.getIdToken();
      await apiCall(token);
      setDone(action);
      setTimeout(() => setDone(null), 3000);
    } catch (err) {
      console.error(`Error en ${action}:`, err);
      alert(`Error: ${err.message}`);
    } finally {
      setRunning(null);
    }
  };

  const downloadFile = async (action, apiCall) => {
    setRunning(action);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BASE_URL}${apiCall}`, {
        headers:{ Authorization:`Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al descargar");
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = action.includes("users") ? "users.csv" : action.includes("sessions") ? "sessions.csv" : "config.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDone(action);
      setTimeout(() => setDone(null), 3000);
    } catch (err) {
      console.error(`Error descargando ${action}:`, err);
      alert(`Error: ${err.message}`);
    } finally {
      setRunning(null);
    }
  };

  const ActionBtn = ({id, label, hint, color, icon:Icon, danger=false, actionType="run"}) => {
    const isRunning = running === id;
    const isDone    = done    === id;
    const isConfirm = confirm === id;

    const handleClick = () => {
      if (danger && !isConfirm) { setConfirm(id); return; }
      if (actionType === "export") {
        const apiMap = {
          export_users:    "/admin/maintenance/export/users",
          export_sessions: "/admin/maintenance/export/sessions",
          export_config:   "/admin/maintenance/export/config",
        };
        downloadFile(id, apiMap[id]);
      } else {
        const apiMap = {
          cache:            clearCache,
          sessions:         closeAllSessions,
          logs:             clearLogs,
          "reset-xp":       resetAllXP,
          "delete-inactive":deleteInactiveUsers,
        };
        runAction(id, apiMap[id]);
      }
    };

    return (
      <div className="c-row" style={{
        display:"flex", alignItems:"center", gap:16,
        padding:"16px 18px",
        borderBottom:`1px solid ${C.navy}22`,
        background: isConfirm ? `${C.red}08` : "transparent",
      }}>
        <div style={{
          background:`${color}18`, border:`1px solid ${color}33`,
          borderRadius:8, padding:10, display:"flex", flexShrink:0,
        }}>
          <Icon size={16} color={color}/>
        </div>
        <div style={{flex:1}}>
          <div style={{...raj(13,700), color: danger && !isConfirm ? C.red : C.white}}>{label}</div>
          <div style={{...raj(11,400), color:C.muted, lineHeight:1.5}}>{hint}</div>
          {isConfirm && <div style={{...raj(11,700), color:C.red, marginTop:4}}>⚠ ¿Confirmas esta acción? No se puede deshacer.</div>}
        </div>
        <div style={{display:"flex", gap:8, flexShrink:0}}>
          {isConfirm && (
            <button onClick={() => setConfirm(null)} className="c-btn"
              style={{...raj(12,600), color:C.muted, background:C.panel, border:`1px solid ${C.navy}`, borderRadius:6, padding:"8px 14px", cursor:"pointer"}}>
              Cancelar
            </button>
          )}
          <button
            onClick={handleClick}
            disabled={!!running}
            className="c-btn"
            style={{
              ...raj(12,700),
              color: isDone ? C.bg : isRunning ? C.muted : danger ? C.white : C.bg,
              background: isDone ? C.green : isRunning ? `${color}33` : danger ? `${C.red}22` : color,
              border: danger ? `1px solid ${C.red}44` : "none",
              borderRadius:6, padding:"8px 16px",
              cursor: running ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", gap:7,
              boxShadow: isDone ? `0 2px 10px ${C.green}44` : isRunning ? "none" : `0 2px 10px ${color}33`,
            }}
          >
            {isRunning  ? <><Spinner color={color}/> Ejecutando...</>
             : isDone   ? <><Check size={13}/> Completado</>
             : isConfirm? <><AlertTriangle size={13}/> Confirmar</>
             : actionType==="export" ? <><Download size={13}/> Descargar</>
             : label}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      <InfoBox text="Las acciones de mantenimiento pueden afectar a usuarios activos. Se recomienda ejecutarlas en horario de baja actividad." color={C.red} icon={AlertTriangle}/>

      <SectionCard>
        <SectionTitle icon={Database} title="CACHÉ Y DATOS" color={C.blue}/>
        <SectionBody>
          <ActionBtn id="cache"    label="Limpiar caché"            hint="Borra el caché de la aplicación sin afectar datos de usuarios" color={C.blue}   icon={RefreshCw}/>
          <ActionBtn id="sessions" label="Cerrar todas las sesiones" hint="Fuerza el cierre de sesión de todos los usuarios activos"     color={C.orange} icon={Lock}      danger/>
          <ActionBtn id="logs"     label="Limpiar logs de sistema"   hint="Elimina los archivos de log de más de 30 días"                color={C.muted}  icon={Trash2}/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Server} title="EXPORTACIÓN DE DATOS" color={C.teal}/>
        <SectionBody>
          <ActionBtn id="export_users"    label="Exportar usuarios (CSV)"  hint="Descarga un CSV con todos los perfiles de usuario"      color={C.teal}  icon={Database} actionType="export"/>
          <ActionBtn id="export_sessions" label="Exportar sesiones (CSV)"  hint="Descarga todas las sesiones de ejercicio registradas"   color={C.blue}  icon={Database} actionType="export"/>
          <ActionBtn id="export_config"   label="Exportar configuración"   hint="Descarga el JSON de la configuración actual del sistema" color={C.muted} icon={Settings} actionType="export"/>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={AlertTriangle} title="ZONA DE PELIGRO" color={C.red} desc="Acciones irreversibles — úsalas con cuidado"/>
        <SectionBody>
          <InfoBox text="Estas acciones son permanentes e irreversibles. Siempre haz un backup antes de ejecutarlas." color={C.red} icon={AlertTriangle}/>
          <ActionBtn id="reset-xp"        label="Resetear XP de todos los usuarios"     hint="Pone a 0 el XP y nivel de todos los héroes. No elimina cuentas."        color={C.red} icon={RefreshCw} danger/>
          <ActionBtn id="delete-inactive" label="Eliminar usuarios inactivos (+90d)"     hint="Elimina cuentas sin actividad en los últimos 90 días permanentemente."   color={C.red} icon={Trash2}    danger/>
        </SectionBody>
      </SectionCard>

      {/* Info del sistema */}
      <SectionCard>
        <SectionTitle icon={Server} title="INFORMACIÓN DEL SISTEMA" color={C.muted}/>
        <div style={{padding:"4px 22px 18px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
          {[
            {l:"Versión de la app",    v:"ForgeVenture v1.0.0-beta"},
            {l:"Entorno",              v:"Development"},
            {l:"Backend",             v:"Node.js + Express (Puerto 4000)"},
            {l:"Base de datos",        v:"Firebase Firestore"},
            {l:"Autenticación",        v:"Firebase Auth"},
            {l:"Almacenamiento",       v:"Firebase Storage"},
            {l:"API de IA",            v:"Gemini API (pendiente)"},
            {l:"Detección biométrica", v:"MediaPipe Pose"},
          ].map((item, idx) => (
            <div key={idx} style={{
              background:C.panel, border:`1px solid ${C.navy}33`,
              borderRadius:8, padding:"12px 16px",
            }}>
              <div style={{...raj(11,600), color:C.muted, marginBottom:3}}>{item.l}</div>
              <div style={{...raj(13,700), color:C.white, wordBreak:"break-all"}}>{item.v}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
