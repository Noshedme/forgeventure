// src/components/admin/config/XPConfig.jsx
import {
  Zap, TrendingUp, Award, Crown,
  Target, Flame, Users, Gift, Settings, RotateCcw,
} from "lucide-react";
import {
  C, raj, orb,
  CInput, CSelect, SettingRow, ToggleRow, SliderRow, InfoBox,
  SectionCard, SectionBody, SectionTitle, SaveBar,
} from "./shared.jsx";

function ProgressPreview({level, xpForThisLevel, totalXP}) {
  return (
    <div style={{background:`${C.navy}44`, borderRadius:6, padding:"10px 14px"}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
        <span style={{...raj(11,600), color:C.mutedL}}>Nivel {level}</span>
        <span style={{...raj(11,600), color:C.gold}}>{totalXP.toLocaleString()} XP total</span>
      </div>
      <div style={{...raj(11,400), color:C.muted}}>XP para este nivel: {xpForThisLevel.toLocaleString()}</div>
    </div>
  );
}

export default function XPConfig({cfg, set, onSave, saving, saved}) {
  const calculateXPForLevel = (level, baseXP) => {
    const curve = cfg.xpCurve || "linear";
    switch(curve) {
      case "exponential": return Math.floor(baseXP * Math.pow(1.2, level - 1));
      case "quadratic":   return Math.floor(baseXP * Math.pow(level, 1.5));
      case "linear":
      default:            return baseXP * level;
    }
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      <InfoBox text="El sistema de XP determina la progresión de los usuarios. Cambios afectan la experiencia de juego global." color={C.gold} icon={Settings}/>

      {/* ── SISTEMA BASE DE XP ── */}
      <SectionCard>
        <SectionTitle icon={Zap} title="SISTEMA BASE DE EXPERIENCIA" color={C.gold} desc="Configuración fundamental del sistema de puntos"/>
        <SectionBody>
          <SettingRow label="XP base por ejercicio" hint="XP mínimo otorgado por completar cualquier ejercicio">
            <CInput type="number" value={cfg.xpBase} onChange={v=>set("xpBase",v)} min={1} max={1000} unit="XP"/>
          </SettingRow>
          <SettingRow label="Bonus primera sesión diaria" hint="XP extra por ser la primera sesión del día">
            <CInput type="number" value={cfg.bonusPrimerSesion} onChange={v=>set("bonusPrimerSesion",v)} min={0} max={500} unit="XP"/>
          </SettingRow>
          <SliderRow label="Multiplicador global" hint="Factor que afecta todo el XP ganado (1.0 = normal)" value={cfg.multiplicadorDia} onChange={v=>set("multiplicadorDia",v)} min={0.1} max={5.0} step={0.1} unit="x" color={C.orange}/>
          <SettingRow label="Bonus por clase" hint="Porcentaje extra de XP en ejercicios de la clase elegida">
            <CInput type="number" value={cfg.claseBonus} onChange={v=>set("claseBonus",v)} min={0} max={200} unit="%"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── CURVAS DE PROGRESIÓN ── */}
      <SectionCard>
        <SectionTitle icon={TrendingUp} title="CURVAS DE PROGRESIÓN" color={C.blue} desc="Cómo escala la dificultad de subir niveles"/>
        <SectionBody>
          <SettingRow label="Tipo de curva de XP" hint="Cómo aumenta el XP requerido por nivel">
            <CSelect value={cfg.xpCurve || "linear"} onChange={v=>set("xpCurve",v)} options={[
              {v:"linear",      l:"Lineal (XP constante)"},
              {v:"quadratic",   l:"Cuadrática (crece rápido)"},
              {v:"exponential", l:"Exponencial (muy difícil)"},
            ]}/>
          </SettingRow>
          <SettingRow label="XP base por nivel" hint="XP necesario para el nivel 1 (se multiplica según curva)">
            <CInput type="number" value={cfg.xpPorNivel} onChange={v=>set("xpPorNivel",v)} min={100} max={10000} unit="XP"/>
          </SettingRow>
          <SettingRow label="Nivel máximo" hint="Nivel máximo alcanzable por los usuarios">
            <CInput type="number" value={cfg.maxNivel} onChange={v=>set("maxNivel",v)} min={10} max={1000} unit="nivel"/>
          </SettingRow>
          <div style={{marginTop:16, padding:"16px", background:`${C.navy}22`, borderRadius:8}}>
            <div style={{...raj(14,700), color:C.white, marginBottom:12}}>Vista Previa de Progresión</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10}}>
              {[1,5,10,25,50].map(level => {
                const xpForThisLevel = calculateXPForLevel(level, cfg.xpPorNivel || 1000);
                const totalXP = Array.from({length:level}, (_,i) => calculateXPForLevel(i+1, cfg.xpPorNivel||1000)).reduce((a,b)=>a+b,0);
                return <ProgressPreview key={level} level={level} xpForThisLevel={xpForThisLevel} totalXP={totalXP}/>;
              })}
            </div>
          </div>
        </SectionBody>
      </SectionCard>

      {/* ── SISTEMA DE RACHAS ── */}
      <SectionCard>
        <SectionTitle icon={Flame} title="SISTEMA DE RACHAS" color={C.red} desc="Motivación por consistencia y hábitos"/>
        <SectionBody>
          <SettingRow label="Días mínimos para racha" hint="Días consecutivos antes de activar bonus">
            <CInput type="number" value={cfg.rachaMinDias} onChange={v=>set("rachaMinDias",v)} min={1} max={30} unit="días"/>
          </SettingRow>
          <SettingRow label="Bonus XP por día de racha" hint="XP extra por cada día consecutivo">
            <CInput type="number" value={cfg.xpRachaBonus} onChange={v=>set("xpRachaBonus",v)} min={0} max={200} unit="XP"/>
          </SettingRow>
          <ToggleRow label="Rachas por tipo de ejercicio" hint="Contar rachas separadas por fuerza/cardio/flexibilidad" on={cfg.rachasPorTipo||false} onChange={v=>set("rachasPorTipo",v)} color={C.orange}/>
          <ToggleRow label="Rachas semanales" hint="Bonus especial por completar semanas enteras" on={cfg.rachasSemanales||false} onChange={v=>set("rachasSemanales",v)} color={C.blue}/>
          <SettingRow label="Recompensa racha semanal" hint="Monedas extra por completar 7 días seguidos">
            <CInput type="number" value={cfg.rachaSemanalRecompensa||100} onChange={v=>set("rachaSemanalRecompensa",v)} min={0} max={1000} unit="💰"/>
          </SettingRow>
          <ToggleRow label="Perdón de rachas" hint="Permitir un día de gracia antes de perder racha" on={cfg.perdonRacha||false} onChange={v=>set("perdonRacha",v)} color={C.green}/>
          <SettingRow label="Días de gracia" hint="Cuántos días sin actividad antes de perder racha">
            <CInput type="number" value={cfg.diasGracia||1} onChange={v=>set("diasGracia",v)} min={0} max={7} unit="días"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── SISTEMA DE PRESTIGIO ── */}
      <SectionCard>
        <SectionTitle icon={Crown} title="SISTEMA DE PRESTIGIO" color={C.purple} desc="Reencarnación y reinicio para jugadores avanzados"/>
        <SectionBody>
          <InfoBox text="El prestigio permite reiniciar el progreso manteniendo beneficios permanentes." color={C.purple} icon={Crown}/>
          <ToggleRow label="Sistema de prestigio activo" hint="Permitir que usuarios de nivel máximo reinicien" on={cfg.prestigioActivo||false} onChange={v=>set("prestigioActivo",v)} color={C.purple}/>
          <SettingRow label="Nivel requerido para prestigio" hint="Nivel mínimo para poder hacer prestigio">
            <CInput type="number" value={cfg.nivelPrestigio||cfg.maxNivel} onChange={v=>set("nivelPrestigio",v)} min={10} max={1000} unit="nivel"/>
          </SettingRow>
          <SettingRow label="Bonus por prestigio" hint="Porcentaje extra de XP por cada reinicio completado">
            <CInput type="number" value={cfg.bonusPrestigio||10} onChange={v=>set("bonusPrestigio",v)} min={0} max={50} unit="%"/>
          </SettingRow>
          <ToggleRow label="Mantener logros en prestigio" hint="Los logros conseguidos se mantienen al reiniciar" on={cfg.mantenerLogrosPrestigio||true} onChange={v=>set("mantenerLogrosPrestigio",v)} color={C.gold}/>
          <ToggleRow label="Bonus de clase mejorado" hint="Bonus de clase aumenta con cada prestigio" on={cfg.bonusClasePrestigio||false} onChange={v=>set("bonusClasePrestigio",v)} color={C.teal}/>
        </SectionBody>
      </SectionCard>

      {/* ── TÍTULOS Y RANGOS ── */}
      <SectionCard>
        <SectionTitle icon={Award} title="TÍTULOS Y RANGOS" color={C.orange} desc="Sistema de reconocimiento y estatus"/>
        <SectionBody>
          <ToggleRow label="Sistema de títulos activo" hint="Asignar títulos automáticamente por logros" on={cfg.titulosActivos||false} onChange={v=>set("titulosActivos",v)} color={C.orange}/>
          <SettingRow label="Títulos por nivel" hint="Asignar títulos basados en nivel alcanzado">
            <CSelect value={cfg.titulosPorNivel||"disabled"} onChange={v=>set("titulosPorNivel",v)} options={[
              {v:"disabled", l:"Desactivado"},
              {v:"basic",    l:"Básico (Novato, Aprendiz, Experto)"},
              {v:"advanced", l:"Avanzado (Maestro, Leyenda, Mítico)"},
              {v:"prestige", l:"Con prestigio (Estrella, Galaxia, Universo)"},
            ]}/>
          </SettingRow>
          <ToggleRow label="Títulos por rachas"  hint="Títulos especiales por consistencia"                     on={cfg.titulosPorRacha||false}  onChange={v=>set("titulosPorRacha",v)}  color={C.red}/>
          <ToggleRow label="Títulos por logros"  hint="Títulos únicos por completar desafíos específicos"       on={cfg.titulosPorLogros||false} onChange={v=>set("titulosPorLogros",v)} color={C.gold}/>
          <ToggleRow label="Mostrar en perfil"   hint="Los usuarios pueden mostrar sus títulos en perfil público" on={cfg.mostrarTitulosPerfil||true} onChange={v=>set("mostrarTitulosPerfil",v)} color={C.blue}/>
        </SectionBody>
      </SectionCard>

      {/* ── BONUS TEMPORALES ── */}
      <SectionCard>
        <SectionTitle icon={Gift} title="BONUS TEMPORALES" color={C.teal} desc="Multiplicadores temporales y eventos especiales"/>
        <SectionBody>
          <ToggleRow label="Bonus de fin de semana" hint="XP extra durante sábados y domingos" on={cfg.bonusFinSemana||false} onChange={v=>set("bonusFinSemana",v)} color={C.teal}/>
          <SettingRow label="Multiplicador fin de semana" hint="Factor de XP adicional en fines de semana">
            <CInput type="number" value={cfg.multiplicadorFinSemana||1.5} onChange={v=>set("multiplicadorFinSemana",v)} min={1.0} max={3.0} step={0.1} unit="x"/>
          </SettingRow>
          <ToggleRow label="Bonus por hora del día" hint="XP extra en horarios específicos" on={cfg.bonusPorHora||false} onChange={v=>set("bonusPorHora",v)} color={C.blue}/>
          <SettingRow label="Horas de bonus" hint="Rango horario para bonus adicional (ej: 6-9,18-21)">
            <CInput value={cfg.horasBonus||"6-9,18-21"} onChange={v=>set("horasBonus",v)} placeholder="6-9,18-21" mono/>
          </SettingRow>
          <SettingRow label="Multiplicador por hora" hint="Factor de XP en horas de bonus">
            <CInput type="number" value={cfg.multiplicadorHora||1.25} onChange={v=>set("multiplicadorHora",v)} min={1.0} max={2.0} step={0.05} unit="x"/>
          </SettingRow>
          <ToggleRow label="Eventos de doble XP" hint="Eventos aleatorios con doble experiencia" on={cfg.eventosDobleXP||false} onChange={v=>set("eventosDobleXP",v)} color={C.gold}/>
          <SettingRow label="Frecuencia de eventos" hint="Días promedio entre eventos de doble XP">
            <CInput type="number" value={cfg.frecuenciaEventos||7} onChange={v=>set("frecuenciaEventos",v)} min={1} max={30} unit="días"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── DECAIMIENTO DE XP ── */}
      <SectionCard>
        <SectionTitle icon={RotateCcw} title="DECAIMIENTO DE EXPERIENCIA" color={C.red} desc="Penalizaciones por inactividad"/>
        <SectionBody>
          <InfoBox text="El decaimiento ayuda a mantener la actividad pero puede ser frustrante si es muy agresivo." color={C.red} icon={RotateCcw}/>
          <ToggleRow label="Decaimiento activo" hint="Los usuarios inactivos pierden XP gradualmente" on={cfg.xpDecayActivo} onChange={v=>set("xpDecayActivo",v)} color={C.red}/>
          <SettingRow label="Días antes de decaimiento" hint="Días de inactividad antes de empezar a perder XP">
            <CInput type="number" value={cfg.xpDecayDias} onChange={v=>set("xpDecayDias",v)} min={1} max={90} disabled={!cfg.xpDecayActivo} unit="días"/>
          </SettingRow>
          <SettingRow label="Porcentaje diario perdido" hint="XP perdido cada día de inactividad">
            <CInput type="number" value={cfg.xpDecayPct} onChange={v=>set("xpDecayPct",v)} min={0.1} max={10} step={0.1} disabled={!cfg.xpDecayActivo} unit="%"/>
          </SettingRow>
          <ToggleRow label="Solo XP no gastado" hint="Solo perder XP que no haya sido invertido en mejoras" on={cfg.decaySoloNoGastado||false} onChange={v=>set("decaySoloNoGastado",v)} color={C.orange}/>
          <SettingRow label="Límite mínimo de XP" hint="XP mínimo que un usuario puede tener">
            <CInput type="number" value={cfg.xpMinimoDecay||0} onChange={v=>set("xpMinimoDecay",v)} min={0} max={1000} disabled={!cfg.xpDecayActivo} unit="XP"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── MILESTONES ── */}
      <SectionCard>
        <SectionTitle icon={Target} title="MILESTONES Y LOGROS" color={C.green} desc="Objetivos de largo plazo y reconocimientos"/>
        <SectionBody>
          <ToggleRow label="Milestones activos"    hint="Objetivos globales que todos los usuarios pueden completar" on={cfg.milestonesActivos||false}    onChange={v=>set("milestonesActivos",v)}    color={C.green}/>
          <SettingRow label="XP por milestone" hint="Recompensa por alcanzar objetivos globales">
            <CInput type="number" value={cfg.xpPorMilestone||500} onChange={v=>set("xpPorMilestone",v)} min={0} max={5000} unit="XP"/>
          </SettingRow>
          <ToggleRow label="Milestones por temporada" hint="Objetivos que cambian cada mes"                         on={cfg.milestonesTemporada||false} onChange={v=>set("milestonesTemporada",v)} color={C.blue}/>
          <ToggleRow label="Milestones sociales"      hint="Objetivos que requieren interacción con otros usuarios" on={cfg.milestonesSociales||false}   onChange={v=>set("milestonesSociales",v)}   color={C.purple}/>
          <SettingRow label="Recompensa milestone social" hint="XP extra por objetivos comunitarios">
            <CInput type="number" value={cfg.xpMilestoneSocial||200} onChange={v=>set("xpMilestoneSocial",v)} min={0} max={2000} unit="XP"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── EXPERIENCIA SOCIAL ── */}
      <SectionCard>
        <SectionTitle icon={Users} title="EXPERIENCIA SOCIAL" color={C.blue} desc="XP por interacciones sociales y comunidad"/>
        <SectionBody>
          <ToggleRow label="XP por referidos" hint="Ganar XP por invitar nuevos usuarios" on={cfg.xpPorReferidos||false} onChange={v=>set("xpPorReferidos",v)} color={C.blue}/>
          <SettingRow label="XP por referido registrado" hint="XP ganado cuando alguien se registra con tu código">
            <CInput type="number" value={cfg.xpPorReferido||100} onChange={v=>set("xpPorReferido",v)} min={0} max={1000} unit="XP"/>
          </SettingRow>
          <SettingRow label="XP por referido activo" hint="XP adicional cuando el referido completa su primera semana">
            <CInput type="number" value={cfg.xpPorReferidoActivo||250} onChange={v=>set("xpPorReferidoActivo",v)} min={0} max={2000} unit="XP"/>
          </SettingRow>
          <ToggleRow label="XP por compartir logros" hint="Bonus por compartir logros en redes sociales" on={cfg.xpPorCompartir||false} onChange={v=>set("xpPorCompartir",v)} color={C.teal}/>
          <SettingRow label="XP por compartir" hint="XP ganado al compartir un logro completado">
            <CInput type="number" value={cfg.xpCompartir||25} onChange={v=>set("xpCompartir",v)} min={0} max={200} unit="XP"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}
