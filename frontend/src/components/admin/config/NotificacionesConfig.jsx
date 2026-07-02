// src/components/admin/config/NotificacionesConfig.jsx
import { useState } from "react";
import {
  Mail, Eye, EyeOff, Check, X,
  TestTube, Bell, Trophy, Flame, Calendar,
  Settings, AlertCircle, Shield, Key, UserPlus,
} from "lucide-react";
import { auth } from "../../../firebase.js";
import {
  C, VALIDATORS, raj, Spinner, Toggle,
  CInput, CSelect, SettingRow, InfoBox,
  SectionCard, SectionBody, SectionTitle, SaveBar,
} from "./shared.jsx";

const BASE_URL = "http://localhost:4000/api";

function validate(cfg) {
  const e = {};
  const userErr = VALIDATORS.email(cfg.smtpUser);
  if (userErr) e.smtpUser = userErr;
  // smtpHost: requerido si alguna notificación está activa
  const anyEmailActive = cfg.emailBienvenida || cfg.emailReset || cfg.emailLogro || cfg.emailRacha || cfg.emailSemanal;
  if (anyEmailActive && !cfg.smtpHost?.trim())
    e.smtpHost = "El host SMTP es requerido cuando hay notificaciones activas";
  return e;
}

// ── Notification row con icono y preview ──────────────────────
function NotificationRow({label, desc, icon:Icon, on, onChange, color=C.orange, disabled=false, badge, preview}) {
  return (
    <div className="c-row" style={{
      display:"flex", alignItems:"center", gap:16,
      padding:"16px 18px",
      background: on ? `${color}06` : "transparent",
      border:`1px solid ${on ? color+"22" : C.navy+"44"}`,
      borderRadius:8, marginBottom:12,
      transition:"all .2s",
      cursor: disabled ? "not-allowed" : "default",
    }}>
      <Toggle on={on} onChange={onChange} color={color} disabled={disabled}/>
      <div style={{
        background:`${color}18`, border:`1px solid ${color}33`,
        borderRadius:6, padding:8, flexShrink:0,
      }}>
        <Icon size={16} color={on ? color : C.muted}/>
      </div>
      <div style={{flex:1}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
          <span style={{...raj(14,700), color: on ? C.white : C.mutedL}}>{label}</span>
          {badge && (
            <span style={{
              ...raj(9,700), color:badge.c||C.orange,
              background:`${badge.c||C.orange}18`,
              border:`1px solid ${badge.c||C.orange}33`,
              padding:"2px 8px", borderRadius:10,
            }}>{badge.l}</span>
          )}
        </div>
        <div style={{...raj(12,400), color:C.muted, lineHeight:1.5, marginBottom:6}}>{desc}</div>
        {preview && on && <div style={{...raj(11,500), color:C.mutedL, fontStyle:"italic"}}>📧 {preview}</div>}
      </div>
      <div style={{...raj(11,700), color: on ? color : C.muted, textAlign:"right"}}>
        {on ? "ACTIVO" : "INACTIVO"}
      </div>
    </div>
  );
}

// ── Botón de prueba de email ───────────────────────────────────
function TestEmailButton({type, label, icon:Icon, color, onTest, testStatus}) {
  const isRunning = testStatus?.type === type && testStatus?.status === "sending";
  const isDone    = testStatus?.type === type && testStatus?.status === "ok";
  const isError   = testStatus?.type === type && testStatus?.status === "error";
  return (
    <button onClick={() => onTest(type)} disabled={isRunning} className="c-btn"
      style={{
        ...raj(12,600),
        color: isDone ? C.bg : isError ? C.white : isRunning ? C.muted : C.bg,
        background: isDone ? C.green : isError ? C.red : isRunning ? `${color}33` : color,
        border:"none", borderRadius:6, padding:"8px 16px",
        cursor: isRunning ? "not-allowed" : "pointer",
        display:"flex", alignItems:"center", gap:6,
        boxShadow: isDone ? `0 2px 10px ${C.green}44` : isRunning ? "none" : `0 2px 10px ${color}33`,
        minWidth:120,
      }}
    >
      {isRunning  ? <><Spinner color={C.white}/> Enviando...</>
       : isDone   ? <><Check size={12}/> ¡Enviado!</>
       : isError  ? <><X size={12}/> Error</>
       : <><Icon size={12}/> {label}</>}
    </button>
  );
}

export default function NotificacionesConfig({cfg, set, onSave, saving, saved}) {
  const [showPass,   setShowPass]   = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [errors,     setErrors]     = useState({});

  const handleSave = () => {
    const errs = validate(cfg);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave();
  };

  const setField = (key, val) => {
    set(key, val);
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const testEmail = async (type) => {
    setTestStatus({type, status:"sending"});
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuario no autenticado");
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BASE_URL}/admin/test-email`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({type}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setTestStatus({type, status:"ok"});
    } catch (err) {
      console.error(`Error testing ${type} email:`, err);
      setTestStatus({type, status:"error"});
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  // smtpPass nunca llega del backend — el backend devuelve smtpPassSet (bool)
  const smtpConfigured = cfg.smtpHost && cfg.smtpUser && (cfg.smtpPassSet || cfg.smtpPass);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>

      {/* ── SMTP ── */}
      <SectionCard>
        <SectionTitle
          icon={Settings}
          title="CONFIGURACIÓN SMTP"
          color={C.teal}
          desc="Servidor de correo saliente para notificaciones"
          extra={
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              <div style={{width:8, height:8, background:smtpConfigured?C.green:C.red, borderRadius:"50%"}}/>
              <span style={{...raj(11,600), color:smtpConfigured?C.green:C.red}}>
                {smtpConfigured ? "CONFIGURADO" : "SIN CONFIGURAR"}
              </span>
            </div>
          }
        />
        <SectionBody>
          <InfoBox text="Usa una contraseña de aplicación de Gmail para mayor seguridad. Actívala en: Cuenta Google → Seguridad → Contraseñas de aplicación." color={C.teal} icon={Shield}/>
          <SettingRow label="Host SMTP">
            <CInput
              value={cfg.smtpHost}
              onChange={v => setField("smtpHost", v)}
              placeholder="smtp.gmail.com"
              mono
              error={errors.smtpHost}
            />
          </SettingRow>
          <SettingRow label="Puerto SMTP">
            <CSelect value={String(cfg.smtpPuerto)} onChange={v=>set("smtpPuerto",Number(v))} options={[
              {v:"587",l:"587 (TLS)"},{v:"465",l:"465 (SSL)"},{v:"25",l:"25 (sin cifrado)"},
            ]}/>
          </SettingRow>
          <SettingRow label="Usuario SMTP" hint="Tu dirección de Gmail">
            <CInput
              value={cfg.smtpUser}
              onChange={v => setField("smtpUser", v)}
              placeholder="tu@gmail.com"
              mono
              error={errors.smtpUser}
            />
          </SettingRow>
          <SettingRow
            label="Contraseña de aplicación"
            hint={cfg.smtpPassSet ? "✓ Contraseña guardada — escribe una nueva para reemplazarla" : "16 caracteres generados por Google"}
          >
            <div style={{position:"relative", display:"flex", alignItems:"center"}}>
              <input
                type={showPass ? "text" : "password"}
                value={cfg.smtpPass}
                onChange={e => set("smtpPass", e.target.value)}
                placeholder={cfg.smtpPassSet ? "••••  ••••  ••••  ••••" : "xxxx xxxx xxxx xxxx"}
                className="c-input"
                style={{
                  width:"100%", padding:"10px 42px 10px 12px",
                  background:C.panel, border:`1px solid ${cfg.smtpPassSet && !cfg.smtpPass ? C.green+"66" : C.navy}`,
                  borderRadius:6, color:C.white,
                  fontFamily:"'Courier New',monospace", fontSize:13,
                }}
              />
              <button onClick={() => setShowPass(v => !v)} className="c-icon-btn"
                style={{position:"absolute", right:10, background:"transparent", border:"none", color:C.muted, display:"flex"}}>
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>
          </SettingRow>
          <SettingRow label="Nombre del remitente">
            <CInput value={cfg.remitente} onChange={v=>set("remitente",v)} placeholder="ForgeVenture ⚔️"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── TIPOS DE NOTIFICACIONES ── */}
      <SectionCard>
        <SectionTitle icon={Mail} title="TIPOS DE NOTIFICACIONES" color={C.blue} desc="Emails automáticos enviados a los usuarios"/>
        <SectionBody>
          <NotificationRow label="Email de bienvenida"   desc="Enviado automáticamente al completar el registro con la clase elegida"  icon={UserPlus} on={cfg.emailBienvenida} onChange={v=>set("emailBienvenida",v)} color={C.green}  preview="¡Bienvenido Guerrero! Tu aventura comienza..."/>
          <NotificationRow label="Email de recuperación" desc="Código de 6 dígitos para restablecer contraseña"                        icon={Key}      on={cfg.emailReset}      onChange={v=>set("emailReset",v)}      color={C.blue}   preview="Tu código de recuperación: 1 2 3 4 5 6"/>
          <NotificationRow label="Logros desbloqueados"  desc="Notificación cuando el usuario consigue un nuevo logro"                 icon={Trophy}   on={cfg.emailLogro}      onChange={v=>set("emailLogro",v)}      color={C.gold}   preview="¡Nuevo logro! 'Primer Entrenamiento' (+50 XP)"/>
          <NotificationRow label="Racha en peligro"      desc="Alerta cuando la racha de días consecutivos está por romperse"          icon={Flame}    on={cfg.emailRacha}      onChange={v=>set("emailRacha",v)}      color={C.red}    preview="¡Tu racha de 7 días está en peligro!"/>
          <NotificationRow label="Resumen semanal"       desc="Estadísticas de progreso enviadas cada lunes"                           icon={Calendar} on={cfg.emailSemanal}    onChange={v=>set("emailSemanal",v)}    color={C.purple} preview="Tu semana: 5 sesiones, +250 XP, 2 logros nuevos"/>
          <NotificationRow label="Notificaciones push"   desc="Notificaciones en el navegador (requiere configuración adicional)"      icon={Bell}     on={cfg.pushActivo}      onChange={v=>set("pushActivo",v)}      color={C.teal}   badge={{l:"PRÓXIMAMENTE",c:C.muted}}/>
        </SectionBody>
      </SectionCard>

      {/* ── PRUEBA DE EMAILS ── */}
      <SectionCard>
        <SectionTitle icon={TestTube} title="PRUEBA DE EMAILS" color={C.orange} desc="Envía emails de prueba para verificar la configuración"/>
        <SectionBody>
          <InfoBox text="Los emails de prueba se envían a la dirección configurada en SMTP. Verifica que la configuración sea correcta antes de activar las notificaciones." color={C.orange} icon={AlertCircle}/>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12}}>
            <TestEmailButton type="welcome"     label="Bienvenida" icon={UserPlus} color={C.green}  onTest={testEmail} testStatus={testStatus}/>
            <TestEmailButton type="achievement" label="Logro"      icon={Trophy}   color={C.gold}   onTest={testEmail} testStatus={testStatus}/>
            <TestEmailButton type="streak"      label="Racha"      icon={Flame}    color={C.red}    onTest={testEmail} testStatus={testStatus}/>
            <TestEmailButton type="weekly"      label="Semanal"    icon={Calendar} color={C.purple} onTest={testEmail} testStatus={testStatus}/>
          </div>
          {!smtpConfigured && (
            <div style={{marginTop:16, padding:"12px 16px", background:`${C.red}0A`, border:`1px solid ${C.red}33`, borderRadius:8}}>
              <div style={{...raj(12,700), color:C.red, marginBottom:4}}>⚠️ Configuración SMTP incompleta</div>
              <div style={{...raj(11,400), color:C.mutedL}}>Completa la configuración SMTP arriba antes de probar los emails.</div>
            </div>
          )}
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving} saved={saved}/>
    </div>
  );
}
