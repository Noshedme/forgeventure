// src/components/admin/config/SeguridadConfig.jsx
import { useState } from "react";
import { Shield, Lock, AlertTriangle, Key, FileText, Database, Settings } from "lucide-react";
import {
  C, VALIDATORS, raj,
  CInput, CSelect, SettingRow, ToggleRow, InfoBox,
  SectionCard, SectionBody, SectionTitle, SaveBar,
} from "./shared.jsx";

function SecurityStatus({level, text, color}) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:8,
      padding:"8px 14px",
      background:`${color}0A`, border:`1px solid ${color}22`,
      borderRadius:8,
    }}>
      <div style={{width:8, height:8, background:color, borderRadius:"50%"}}/>
      <span style={{...raj(11,600), color}}>{level}</span>
      <span style={{...raj(11,400), color:C.mutedL}}>{text}</span>
    </div>
  );
}

function validate(cfg) {
  const e = {};
  const corsErr = VALIDATORS.corsOrigins(cfg.corsOrigins);
  if (corsErr) e.corsOrigins = corsErr;
  const pwdErr = VALIDATORS.passwordLength(cfg.passwordMinLength ?? 8);
  if (pwdErr) e.passwordMinLength = pwdErr;
  return e;
}

export default function SeguridadConfig({cfg, set, onSave, saving, saved}) {
  const [errors, setErrors] = useState({});

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

  const getSecurityLevel = () => {
    let score = 0;
    if (cfg.emailVerificacion) score += 20;
    if (cfg.faActivo) score += 30;
    if (cfg.maxIntentos <= 5) score += 15;
    if (cfg.jwtExpiracion === "1h" || cfg.jwtExpiracion === "6h") score += 15;
    if (cfg.apiRateLimit <= 100) score += 10;
    if (cfg.sessionTimeout <= 60) score += 10;
    if (score >= 80) return {level:"ALTO",  text:"Configuración muy segura", color:C.green};
    if (score >= 60) return {level:"MEDIO", text:"Configuración aceptable",  color:C.orange};
    return            {level:"BAJO",        text:"Requiere mejoras",          color:C.red};
  };

  const securityStatus = getSecurityLevel();

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      <InfoBox text="Los cambios en configuración de seguridad requieren que todos los usuarios inicien sesión nuevamente." color={C.red} icon={AlertTriangle}/>

      {/* ── ESTADO GLOBAL ── */}
      <SectionCard>
        <SectionTitle icon={Shield} title="ESTADO DE SEGURIDAD" color={C.red} desc="Resumen general de la configuración de seguridad"/>
        <SectionBody>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0"}}>
            <div>
              <div style={{...raj(14,700), color:C.white, marginBottom:4}}>Nivel de Seguridad Global</div>
              <div style={{...raj(12,400), color:C.muted}}>Basado en configuraciones activas y límites establecidos</div>
            </div>
            <SecurityStatus {...securityStatus}/>
          </div>
        </SectionBody>
      </SectionCard>

      {/* ── AUTENTICACIÓN ── */}
      <SectionCard>
        <SectionTitle icon={Lock} title="AUTENTICACIÓN Y SESIONES" color={C.red} desc="Control de acceso y gestión de sesiones"/>
        <SectionBody>
          <SettingRow label="Expiración del JWT" hint="Tiempo de validez del token de sesión">
            <CSelect value={cfg.jwtExpiracion} onChange={v=>set("jwtExpiracion",v)} options={[
              {v:"1h",  l:"1 hora"}, {v:"6h",  l:"6 horas"},
              {v:"1d",  l:"1 día"},  {v:"3d",  l:"3 días"},
              {v:"7d",  l:"7 días"}, {v:"30d", l:"30 días"},
            ]}/>
          </SettingRow>
          <SettingRow label="Timeout de sesión inactiva" hint="Minutos sin actividad antes de cerrar sesión">
            <CInput type="number" value={cfg.sessionTimeout} onChange={v=>set("sessionTimeout",v)} min={5} max={1440} unit="min"/>
          </SettingRow>
          <ToggleRow label="Verificación de email" hint="Los nuevos usuarios deben verificar su email antes de acceder" on={cfg.emailVerificacion} onChange={v=>set("emailVerificacion",v)} color={C.blue}/>
          <ToggleRow label="Autenticación 2FA"     hint="Requerir segundo factor de autenticación" on={cfg.faActivo} onChange={v=>set("faActivo",v)} color={C.gold} badge={{l:"PRÓXIMO",c:C.muted}}/>
        </SectionBody>
      </SectionCard>

      {/* ── PROTECCIÓN ── */}
      <SectionCard>
        <SectionTitle icon={AlertTriangle} title="PROTECCIÓN CONTRA ATAQUES" color={C.red} desc="Defensas contra intentos de acceso no autorizado"/>
        <SectionBody>
          <SettingRow label="Intentos antes de bloqueo" hint="Número de intentos de login fallidos antes de bloquear la cuenta">
            <CInput type="number" value={cfg.maxIntentos} onChange={v=>set("maxIntentos",v)} min={1} max={20} unit="intentos"/>
          </SettingRow>
          <SettingRow label="Duración del bloqueo" hint="Minutos que la cuenta permanece bloqueada">
            <CInput type="number" value={cfg.bloqueoMinutos} onChange={v=>set("bloqueoMinutos",v)} min={1} max={1440} unit="min"/>
          </SettingRow>
          <SettingRow label="Rate limit de la API" hint="Máximo de peticiones por minuto por usuario">
            <CInput type="number" value={cfg.apiRateLimit} onChange={v=>set("apiRateLimit",v)} min={10} max={1000} unit="req/min"/>
          </SettingRow>
          <SettingRow label="CORS Origins permitidos" hint='URLs separadas por coma (o "*" para todas)'>
            <CInput
              value={cfg.corsOrigins}
              onChange={v => setField("corsOrigins", v)}
              placeholder="https://app.com,https://admin.app.com"
              mono
              error={errors.corsOrigins}
            />
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── POLÍTICAS DE CONTRASEÑAS ── */}
      <SectionCard>
        <SectionTitle icon={Key} title="POLÍTICAS DE CONTRASEÑAS" color={C.orange} desc="Requisitos y validaciones para contraseñas de usuario"/>
        <SectionBody>
          <InfoBox text="Las políticas de contraseña se aplicarán a nuevos registros y cambios de contraseña." color={C.blue} icon={Settings}/>
          <SettingRow label="Longitud mínima" hint="Número mínimo de caracteres (6–128)">
            <CInput
              type="number"
              value={cfg.passwordMinLength ?? 8}
              onChange={v => setField("passwordMinLength", v)}
              min={6}
              max={128}
              unit="caracteres"
              error={errors.passwordMinLength}
            />
          </SettingRow>
          <ToggleRow label="Requerir mayúsculas" hint="La contraseña debe contener al menos una letra mayúscula"  on={cfg.passwordRequireUpper||true}    onChange={v=>set("passwordRequireUpper",v)}   color={C.teal}/>
          <ToggleRow label="Requerir números"    hint="La contraseña debe contener al menos un dígito"            on={cfg.passwordRequireNumbers||true}  onChange={v=>set("passwordRequireNumbers",v)} color={C.teal}/>
          <ToggleRow label="Requerir símbolos"   hint="La contraseña debe contener al menos un carácter especial" on={cfg.passwordRequireSymbols||false} onChange={v=>set("passwordRequireSymbols",v)} color={C.teal}/>
        </SectionBody>
      </SectionCard>

      {/* ── REGISTROS Y AUDITORÍA ── */}
      <SectionCard>
        <SectionTitle icon={FileText} title="REGISTROS Y AUDITORÍA" color={C.blue} desc="Configuración de logs de seguridad y monitoreo"/>
        <SectionBody>
          <ToggleRow label="Logs de autenticación"   hint="Registrar todos los intentos de login y logout"                on={cfg.enableAuthLogs||true}      onChange={v=>set("enableAuthLogs",v)}      color={C.blue}/>
          <ToggleRow label="Logs de cambios críticos" hint="Registrar modificaciones a configuraciones sensibles"          on={cfg.enableConfigLogs||true}    onChange={v=>set("enableConfigLogs",v)}    color={C.blue}/>
          <ToggleRow label="Alertas de seguridad"    hint="Enviar notificaciones por actividades sospechosas"             on={cfg.enableSecurityAlerts||false} onChange={v=>set("enableSecurityAlerts",v)} color={C.red}/>
          <SettingRow label="Retención de logs" hint="Días que se mantienen los registros de seguridad">
            <CSelect value={cfg.logRetentionDays||"90"} onChange={v=>set("logRetentionDays",v)} options={[
              {v:"30",  l:"30 días"}, {v:"60",  l:"60 días"},
              {v:"90",  l:"90 días"}, {v:"180", l:"180 días"},
              {v:"365", l:"1 año"},
            ]}/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── COPIAS DE SEGURIDAD ── */}
      <SectionCard>
        <SectionTitle icon={Database} title="COPIAS DE SEGURIDAD" color={C.purple} desc="Configuración de backups automáticos de datos críticos"/>
        <SectionBody>
          <InfoBox text="Los backups incluyen configuraciones críticas y datos de usuarios. Se recomienda almacenarlos en ubicaciones seguras." color={C.purple} icon={Database}/>
          <ToggleRow label="Backup automático" hint="Crear copias de seguridad programadas" on={cfg.enableAutoBackup||false} onChange={v=>set("enableAutoBackup",v)} color={C.purple}/>
          <SettingRow label="Frecuencia de backup" hint="Intervalo entre copias de seguridad automáticas">
            <CSelect value={cfg.backupFrequency||"weekly"} onChange={v=>set("backupFrequency",v)} options={[
              {v:"daily",   l:"Diario"},
              {v:"weekly",  l:"Semanal"},
              {v:"monthly", l:"Mensual"},
            ]}/>
          </SettingRow>
          <SettingRow label="Retención de backups" hint="Número de copias de seguridad a mantener">
            <CInput type="number" value={cfg.backupRetention||10} onChange={v=>set("backupRetention",v)} min={1} max={50} unit="copias"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving} saved={saved}/>
    </div>
  );
}
