// src/components/admin/config/JuegoConfig.jsx
import {
  Sword, Flame, Target, Heart,
  Coins, Calendar, Trophy, Gift, Settings, Link,
} from "lucide-react";
import {
  C, CInput, SettingRow, ToggleRow, InfoBox,
  SectionCard, SectionBody, SectionTitle, SaveBar,
} from "./shared.jsx";

export default function JuegoConfig({cfg, set, onSave, saving, saved}) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      <InfoBox text="Las configuraciones de juego afectan directamente la experiencia del usuario. Cambios importantes requieren reinicio de sesiones activas." color={C.orange} icon={Settings}/>

      {/* ── CLASES DE HÉROE ── */}
      <SectionCard>
        <SectionTitle icon={Sword} title="CLASES DE HÉROE" color={C.orange} desc="Configuración de clases disponibles y bonos de especialización"/>
        <SectionBody>
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, color:"#F0F4FF", marginBottom:12}}>Clases Disponibles</div>
            <ToggleRow label="GUERRERO ⚔️"  hint="+25% XP en Fuerza, +10% HP máximo"                       on={cfg.clasesDisponibles.includes("GUERRERO")} onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"GUERRERO"]:cfg.clasesDisponibles.filter(c=>c!=="GUERRERO"))} color={C.red}/>
            <ToggleRow label="ARQUERO 🏃"   hint="+25% XP en Cardio, +15% velocidad de recuperación"       on={cfg.clasesDisponibles.includes("ARQUERO")}  onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"ARQUERO"]:cfg.clasesDisponibles.filter(c=>c!=="ARQUERO"))}  color={C.blue}/>
            <ToggleRow label="MAGO 🧘"      hint="+25% XP en Flexibilidad, +20% efectividad de meditación" on={cfg.clasesDisponibles.includes("MAGO")}     onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"MAGO"]:cfg.clasesDisponibles.filter(c=>c!=="MAGO"))}     color={C.purple}/>
            <ToggleRow label="PALADÍN 🛡️"  hint="+15% XP general, +25% resistencia a penalizaciones"      on={cfg.clasesDisponibles.includes("PALADÍN")}  onChange={v=>set("clasesDisponibles",v?[...cfg.clasesDisponibles,"PALADÍN"]:cfg.clasesDisponibles.filter(c=>c!=="PALADÍN"))} color={C.gold} badge={{l:"NUEVO",c:C.green}}/>
          </div>
          <ToggleRow label="Permitir cambio de clase" hint="Los usuarios pueden cambiar de clase (costo en monedas)" on={cfg.permitirCambioClase} onChange={v=>set("permitirCambioClase",v)} color={C.teal}/>
          <SettingRow label="Costo de cambio de clase" hint="Monedas requeridas para cambiar de clase">
            <CInput type="number" value={cfg.cambioClaseCosto||500} onChange={v=>set("cambioClaseCosto",v)} min={0} max={5000} unit="💰"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── SISTEMA DE RACHAS ── */}
      <SectionCard>
        <SectionTitle icon={Flame} title="SISTEMA DE RACHAS" color={C.red} desc="Mecánicas de motivación por consistencia"/>
        <SectionBody>
          <InfoBox
            text="Los valores de XP por racha y días mínimos se configuran en la sección XP & Progresión."
            color={C.gold}
            icon={Link}
          />
          <ToggleRow label="Rachas por ejercicio"  hint="Contar rachas por tipo de ejercicio individual" on={cfg.rachasPorEjercicio||false} onChange={v=>set("rachasPorEjercicio",v)} color={C.orange}/>
          <ToggleRow label="Rachas semanales"       hint="Sistema de rachas de 7 días con recompensas especiales" on={cfg.rachasSemanales||false} onChange={v=>set("rachasSemanales",v)} color={C.blue}/>
          <SettingRow label="Recompensa racha semanal" hint="Monedas otorgadas al completar 7 días seguidos">
            <CInput type="number" value={cfg.rachaSemanalRecompensa||100} onChange={v=>set("rachaSemanalRecompensa",v)} min={0} max={1000} unit="💰"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── MECÁNICAS DE SESIÓN ── */}
      <SectionCard>
        <SectionTitle icon={Target} title="MECÁNICAS DE SESIÓN" color={C.teal} desc="Configuración de ejercicios y verificación"/>
        <SectionBody>
          <SettingRow label="Cooldown entre sesiones" hint="Tiempo mínimo entre sesiones del mismo ejercicio">
            <CInput type="number" value={cfg.cooldownSesionMin} onChange={v=>set("cooldownSesionMin",v)} min={0} max={1440} unit="min"/>
          </SettingRow>
          <SettingRow label="Timer por defecto" hint="Minutos predeterminados para ejercicios con timer">
            <CInput type="number" value={cfg.timerMinutosDef} onChange={v=>set("timerMinutosDef",v)} min={1} max={180} unit="min"/>
          </SettingRow>
          <ToggleRow label="Verificación por cámara" hint="Usar IA para contar repeticiones automáticamente" on={cfg.verificacionCamara}    onChange={v=>set("verificacionCamara",v)}  color={C.teal}/>
          <ToggleRow label="Verificación por timer"  hint="Mantener timer activo como método alternativo"   on={cfg.verificacionTimer}     onChange={v=>set("verificacionTimer",v)}   color={C.blue}/>
          <ToggleRow label="Modo hardcore" hint="Sesiones sin verificación manual (solo IA)" on={cfg.modoHardcore||false} onChange={v=>set("modoHardcore",v)} color={C.red} badge={{l:"DIFÍCIL",c:C.red}}/>
        </SectionBody>
      </SectionCard>

      {/* ── SISTEMA DE VIDA ── */}
      <SectionCard>
        <SectionTitle icon={Heart} title="SISTEMA DE VIDA (HP)" color={C.red} desc="Mecánicas de salud y recuperación del héroe"/>
        <SectionBody>
          <SettingRow label="HP máximo"            hint="Puntos de vida máximos del personaje">
            <CInput type="number" value={cfg.hpMaximo}            onChange={v=>set("hpMaximo",v)}           min={10}  max={1000} unit="HP"/>
          </SettingRow>
          <SettingRow label="Días para recuperar HP" hint="Cada X días de inactividad se pierde 1 HP">
            <CInput type="number" value={cfg.hpRecuperacionDias}  onChange={v=>set("hpRecuperacionDias",v)} min={1}   max={30}   unit="días"/>
          </SettingRow>
          <SettingRow label="HP por nivel"          hint="HP adicional ganado por cada nivel">
            <CInput type="number" value={cfg.hpPorNivel||5}       onChange={v=>set("hpPorNivel",v)}         min={0}   max={50}   unit="HP"/>
          </SettingRow>
          <ToggleRow label="Sistema de daño" hint="Los ejercicios fallidos causan daño al HP" on={cfg.sistemaDanio||false} onChange={v=>set("sistemaDanio",v)} color={C.red}/>
          <SettingRow label="Daño por fallo" hint="HP perdido por ejercicio no completado">
            <CInput type="number" value={cfg.danioPorFallo||1} onChange={v=>set("danioPorFallo",v)} min={0} max={10} unit="HP"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── ECONOMÍA ── */}
      <SectionCard>
        <SectionTitle icon={Coins} title="ECONOMÍA DEL JUEGO" color={C.gold} desc="Monedas, tienda y sistema de recompensas"/>
        <SectionBody>
          <SettingRow label="Monedas por ejercicio" hint="Monedas otorgadas por completar ejercicios">
            <CInput type="number" value={cfg.monedasPorEjercicio||10} onChange={v=>set("monedasPorEjercicio",v)} min={0} max={100} unit="💰"/>
          </SettingRow>
          <SettingRow label="Monedas por nivel" hint="Bonus de monedas al subir de nivel">
            <CInput type="number" value={cfg.monedasPorNivel||50} onChange={v=>set("monedasPorNivel",v)} min={0} max={500} unit="💰"/>
          </SettingRow>
          <SettingRow label="Monedas por racha" hint="Monedas adicionales por días de racha">
            <CInput type="number" value={cfg.monedasPorRacha||5} onChange={v=>set("monedasPorRacha",v)} min={0} max={50} unit="💰"/>
          </SettingRow>
          <ToggleRow label="Tienda de objetos"    hint="Sistema de compra de items y mejoras"          on={cfg.tiendaActiva}          onChange={v=>set("tiendaActiva",v)}          color={C.gold}/>
          <ToggleRow label="Inflación controlada" hint="Ajustar valor de monedas basado en economía"   on={cfg.inflacionControlada||false} onChange={v=>set("inflacionControlada",v)} color={C.purple}/>
        </SectionBody>
      </SectionCard>

      {/* ── LOGROS ── */}
      <SectionCard>
        <SectionTitle icon={Trophy} title="LOGROS Y RECOMPENSAS" color={C.purple} desc="Sistema de objetivos y badges"/>
        <SectionBody>
          <ToggleRow label="Logros activos"      hint="Sistema de logros y badges por objetivos"            on={cfg.logrosActivos}         onChange={v=>set("logrosActivos",v)}        color={C.purple}/>
          <ToggleRow label="Logros secretos"     hint="Logros ocultos con condiciones especiales"           on={cfg.logrosSecretos||false} onChange={v=>set("logrosSecretos",v)}       color={C.muted}/>
          <SettingRow label="Recompensa por logro" hint="Monedas otorgadas al desbloquear un logro">
            <CInput type="number" value={cfg.recompensaLogro||25} onChange={v=>set("recompensaLogro",v)} min={0} max={200} unit="💰"/>
          </SettingRow>
          <ToggleRow label="Logros por temporada" hint="Logros especiales que cambian cada mes"              on={cfg.logrosTemporada||false} onChange={v=>set("logrosTemporada",v)}     color={C.orange}/>
          <ToggleRow label="Tablón de líderes"    hint="Ranking global de usuarios por XP y logros"          on={cfg.leaderboardActivo||false} onChange={v=>set("leaderboardActivo",v)} color={C.gold}/>
        </SectionBody>
      </SectionCard>

      {/* ── MISIONES ── */}
      <SectionCard>
        <SectionTitle icon={Calendar} title="MISIONES Y DESAFÍOS" color={C.blue} desc="Sistema de objetivos diarios y semanales"/>
        <SectionBody>
          <ToggleRow label="Misiones activas" hint="Sistema de misiones diarias, semanales y especiales" on={cfg.misionesActivas} onChange={v=>set("misionesActivas",v)} color={C.blue}/>
          <SettingRow label="Misiones diarias" hint="Número de misiones disponibles por día">
            <CInput type="number" value={cfg.misionesDiarias||3} onChange={v=>set("misionesDiarias",v)} min={1} max={10} unit="misiones"/>
          </SettingRow>
          <SettingRow label="Recompensa misión diaria" hint="Monedas por completar misión diaria">
            <CInput type="number" value={cfg.recompensaMisionDiaria||15} onChange={v=>set("recompensaMisionDiaria",v)} min={0} max={100} unit="💰"/>
          </SettingRow>
          <ToggleRow label="Misiones semanales" hint="Objetivos a largo plazo con mejores recompensas" on={cfg.misionesSemanales||false} onChange={v=>set("misionesSemanales",v)} color={C.teal}/>
          <SettingRow label="Recompensa misión semanal" hint="Monedas por completar misión semanal">
            <CInput type="number" value={cfg.recompensaMisionSemanal||100} onChange={v=>set("recompensaMisionSemanal",v)} min={0} max={500} unit="💰"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      {/* ── IA Y AUTOMATIZACIÓN ── */}
      <SectionCard>
        <SectionTitle icon={Settings} title="IA Y AUTOMATIZACIÓN" color={C.teal} desc="Funciones inteligentes y asistente virtual"/>
        <SectionBody>
          <ToggleRow label="Forge AI (chatbot)"           hint="Asistente de entrenamiento con IA Gemini"                  on={cfg.chatbotActivo}         onChange={v=>set("chatbotActivo",v)}        color={C.teal}   badge={{l:"BETA",c:C.teal}}/>
          <ToggleRow label="Recomendaciones inteligentes" hint="Sugerir ejercicios basados en progreso del usuario"        on={cfg.recomendacionesIA||false} onChange={v=>set("recomendacionesIA",v)} color={C.blue}/>
          <ToggleRow label="Análisis de forma"            hint="Feedback automático sobre técnica de ejercicios"           on={cfg.analisisForma||false}  onChange={v=>set("analisisForma",v)}        color={C.green}/>
          <ToggleRow label="Planes de entrenamiento IA"   hint="Generar rutinas personalizadas automáticamente"            on={cfg.planesIA||false}       onChange={v=>set("planesIA",v)}             color={C.purple} badge={{l:"PRÓXIMO",c:C.muted}}/>
        </SectionBody>
      </SectionCard>

      {/* ── EVENTOS ESPECIALES ── */}
      <SectionCard>
        <SectionTitle icon={Gift} title="EVENTOS ESPECIALES" color={C.orange} desc="Eventos temporales y contenido especial"/>
        <SectionBody>
          <ToggleRow label="Eventos de temporada"    hint="Eventos especiales en fechas importantes"             on={cfg.eventosTemporada||false}    onChange={v=>set("eventosTemporada",v)}    color={C.orange}/>
          <ToggleRow label="Desafíos comunitarios"   hint="Eventos donde todos los usuarios compiten"            on={cfg.desafiosComunitarios||false} onChange={v=>set("desafiosComunitarios",v)} color={C.red}/>
          <ToggleRow label="Torneos mensuales"       hint="Competiciones PvP con brackets"                       on={cfg.torneosMensuales||false}    onChange={v=>set("torneosMensuales",v)}    color={C.gold} badge={{l:"VIP",c:C.gold}}/>
          <SettingRow label="Multiplicador de eventos" hint="Bonus XP durante eventos especiales">
            <CInput type="number" value={cfg.multiplicadorEventos||1.5} onChange={v=>set("multiplicadorEventos",v)} min={1.0} max={5.0} step={0.1} unit="x"/>
          </SettingRow>
        </SectionBody>
      </SectionCard>

      <SaveBar onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}
