// src/components/admin/config/GeneralConfig.jsx
import { useState } from "react";
import { Globe } from "lucide-react";
import {
  C, VALIDATORS, CInput, CSelect, SettingRow, ToggleRow,
  SectionCard, SectionBody, SectionTitle, SaveBar,
} from "./shared.jsx";

function validate(cfg) {
  const e = {};
  const urlErr = VALIDATORS.urlProduction(cfg.appUrl);
  if (urlErr) e.appUrl = urlErr;
  const maxErr = VALIDATORS.positiveInt(cfg.maxUsuarios, 10_000_000);
  if (maxErr) e.maxUsuarios = maxErr;
  return e;
}

export default function GeneralConfig({cfg, set, onSave, saving, saved}) {
  const [errors, setErrors] = useState({});

  const handleSave = () => {
    const errs = validate(cfg);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave();
  };

  // Limpiar error del campo cuando el usuario lo edita
  const setField = (key, val) => {
    set(key, val);
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      <SectionCard>
        <SectionTitle icon={Globe} title="INFORMACIÓN DE LA APP" color={C.blue} desc="Datos básicos visibles al usuario"/>
        <SectionBody>
          <SettingRow label="Nombre de la app" hint="Nombre que aparece en la interfaz y emails">
            <CInput value={cfg.appNombre} onChange={v => set("appNombre",v)} placeholder="ForgeVenture"/>
          </SettingRow>
          <SettingRow label="Descripción" hint="Tagline visible en el splash y landing">
            <CInput value={cfg.appDesc} onChange={v => set("appDesc",v)} placeholder="Tu aventura gamificada"/>
          </SettingRow>
          <SettingRow label="URL de la app" hint="URL pública de producción (no localhost)">
            <CInput
              value={cfg.appUrl}
              onChange={v => setField("appUrl", v)}
              placeholder="https://tuapp.com"
              mono
              error={errors.appUrl}
            />
          </SettingRow>
          <SettingRow label="Idioma por defecto">
            <CSelect value={cfg.idioma} onChange={v => set("idioma",v)} options={[
              {v:"es",l:"Español"},{v:"en",l:"English"},{v:"pt",l:"Português"},
            ]}/>
          </SettingRow>
          <SettingRow label="Zona horaria">
            <CSelect value={cfg.zonaHoraria} onChange={v => set("zonaHoraria",v)} options={[
              {v:"America/Guayaquil",  l:"Ecuador (UTC-5)"},
              {v:"America/Bogota",     l:"Colombia (UTC-5)"},
              {v:"America/Lima",       l:"Perú (UTC-5)"},
              {v:"America/Mexico_City",l:"México (UTC-6)"},
              {v:"America/Santiago",   l:"Chile (UTC-4)"},
            ]}/>
          </SettingRow>
          <SettingRow label="Máximo de usuarios" hint="Límite de cuentas registradas (0 = ilimitado)">
            <CInput
              type="number"
              value={cfg.maxUsuarios}
              onChange={v => setField("maxUsuarios", v)}
              min={0}
              placeholder="5000"
              unit="users"
              error={errors.maxUsuarios}
            />
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SectionCard>
        <SectionTitle icon={Globe} title="ACCESO Y REGISTRO" color={C.blue}/>
        <SectionBody>
          <ToggleRow label="Registro de nuevos usuarios" hint="Si está desactivado, nadie puede crear cuenta"
            on={cfg.registroAbierto} onChange={v => set("registroAbierto",v)} color={C.green}/>
          <ToggleRow label="Modo mantenimiento" hint="Redirige a todos los usuarios a la pantalla de mantenimiento"
            on={cfg.mantenimiento} onChange={v => set("mantenimiento",v)} color={C.red}
            badge={cfg.mantenimiento ? {l:"⚠ ACTIVO", c:C.red} : null}/>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={handleSave} saving={saving} saved={saved}/>
    </div>
  );
}
