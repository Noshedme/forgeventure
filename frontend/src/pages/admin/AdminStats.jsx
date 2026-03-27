// src/pages/admin/AdminStats.jsx
// ─────────────────────────────────────────────────────────────
//  Panel de estadísticas globales de ForgeVenture.
//  Gráficas: recharts (ya instalado)
//  Conectar: getStats(token, periodo) desde api.js cuando
//            esté el backend — actualmente datos mock.
// ─────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Zap, Flame,
  Trophy, Clock, Target, BarChart2, Activity,
  Calendar, Award, RefreshCw, ChevronDown,
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
  @keyframes s-cardIn  { from{opacity:0;transform:translateY(12px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes s-countUp { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
  @keyframes s-barFill { from{width:0} to{width:var(--bw)} }
  @keyframes s-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes s-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes s-glow    { 0%,100%{text-shadow:0 0 12px #FFD700} 50%{text-shadow:0 0 28px #FFD700,0 0 48px #FFD70066} }

  * { box-sizing:border-box; margin:0; padding:0; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:${C.panel}; }
  ::-webkit-scrollbar-thumb { background:${C.orange}; }

  .s-kpi { transition:transform .2s,box-shadow .2s; cursor:default; }
  .s-kpi:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(0,0,0,.5) !important; }
  .s-period-btn { transition:all .2s; cursor:pointer; }
  .s-period-btn:hover { opacity:.85; }
  .s-bar-row { transition:background .15s; }
  .s-bar-row:hover { background:${C.navyL}18 !important; }
  .s-user-row { transition:background .15s; }
  .s-user-row:hover { background:${C.navyL}18 !important; }
  .recharts-tooltip-wrapper { font-family:'Rajdhani',sans-serif !important; }
`;

const px  = s => ({ fontFamily:"'Press Start 2P'", fontSize:s });
const raj = (s,w=600) => ({ fontFamily:"'Rajdhani',sans-serif", fontSize:s, fontWeight:w });
const orb = (s,w=700) => ({ fontFamily:"'Orbitron',sans-serif", fontSize:s, fontWeight:w });

// ── Periodos ──────────────────────────────────────────────────
const PERIODOS = [
  { id:"7d",  label:"7 días"  },
  { id:"30d", label:"30 días" },
  { id:"90d", label:"3 meses" },
  { id:"1y",  label:"1 año"   },
];

// ── Mock data generada por período ────────────────────────────
function genWeekData(n=7) {
  const dias=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  return Array.from({length:n},(_,i)=>({
    dia: n<=7?dias[i%7]:`S${i+1}`,
    usuarios:  Math.floor(8+Math.random()*35),
    sesiones:  Math.floor(20+Math.random()*80),
    xp:        Math.floor(3000+Math.random()*12000),
    nuevos:    Math.floor(1+Math.random()*12),
  }));
}
function genMonthData(n=30) {
  return Array.from({length:n},(_,i)=>({
    dia: `${i+1}`,
    usuarios:  Math.floor(10+Math.random()*40),
    sesiones:  Math.floor(25+Math.random()*100),
    xp:        Math.floor(4000+Math.random()*15000),
    nuevos:    Math.floor(1+Math.random()*15),
  }));
}

const DATA_BY_PERIOD = {
  "7d":  genWeekData(7),
  "30d": genMonthData(30),
  "90d": genWeekData(13),
  "1y":  genWeekData(12),
};

const DATA_EJERCICIOS = [
  { name:"Flexiones",    sesiones:1480, xp:44400, completadas:1248 },
  { name:"Sentadillas",  sesiones:1320, xp:46200, completadas:1100 },
  { name:"Cardio Libre", sesiones:1180, xp:70800, completadas:980  },
  { name:"Plancha",      sesiones:890,  xp:35600, completadas:740  },
  { name:"HIIT",         sesiones:670,  xp:60300, completadas:560  },
  { name:"Yoga",         sesiones:540,  xp:24300, completadas:450  },
  { name:"Dominadas",    sesiones:380,  xp:20900, completadas:310  },
  { name:"Pilates",      sesiones:290,  xp:10150, completadas:240  },
];

const DATA_CLASES = [
  { name:"GUERRERO", value:48, color:C.orange, usuarios:79 },
  { name:"ARQUERO",  value:31, color:C.blue,   usuarios:50 },
  { name:"MAGO",     value:21, color:C.purple,  usuarios:34 },
];

const DATA_NIVEL_DIST = [
  { rango:"1–5",   usuarios:38 },
  { rango:"6–10",  usuarios:52 },
  { rango:"11–20", usuarios:34 },
  { rango:"21–30", usuarios:18 },
  { rango:"31–40", usuarios:11 },
  { rango:"41–50", usuarios:7  },
  { rango:"50+",   usuarios:3  },
];

const DATA_RADAR = [
  { attr:"Fuerza",       valor:78 },
  { attr:"Cardio",       valor:62 },
  { attr:"Flexibilidad", valor:45 },
  { attr:"Racha prom.",  valor:55 },
  { attr:"Misiones",     valor:70 },
  { attr:"Logros",       valor:38 },
];

const DATA_RETENCCION = [
  { semana:"S1",  retencion:100 },
  { semana:"S2",  retencion:72  },
  { semana:"S3",  retencion:58  },
  { semana:"S4",  retencion:49  },
  { semana:"S6",  retencion:38  },
  { semana:"S8",  retencion:31  },
  { semana:"S12", retencion:24  },
];

const TOP_USERS = [
  { pos:1, nombre:"GandalfZen",    clase:"MAGO",     nivel:21, xp:5600, streak:30, sesiones:142 },
  { pos:2, nombre:"ArwenSpeed",    clase:"ARQUERO",  nivel:15, xp:3800, streak:22, sesiones:98  },
  { pos:3, nombre:"GimliAxe",      clase:"GUERRERO", nivel:18, xp:4500, streak:19, sesiones:134 },
  { pos:4, nombre:"BoromirStrong", clase:"GUERRERO", nivel:9,  xp:2100, streak:11, sesiones:67  },
  { pos:5, nombre:"Aragorn_Dev",   clase:"GUERRERO", nivel:12, xp:2840, streak:14, sesiones:89  },
  { pos:6, nombre:"EowynBrave",    clase:"ARQUERO",  nivel:11, xp:2650, streak:8,  sesiones:72  },
  { pos:7, nombre:"FrodoBags",     clase:"MAGO",     nivel:6,  xp:1100, streak:4,  sesiones:31  },
  { pos:8, nombre:"LegolasRunner", clase:"ARQUERO",  nivel:8,  xp:1920, streak:7,  sesiones:58  },
];

// Heatmap de actividad (últimas 10 semanas × 7 días)
const HEATMAP = Array.from({length:10},()=>Array.from({length:7},()=>Math.random()<0.25?0:Math.floor(Math.random()*50)));

// ── Custom tooltip ─────────────────────────────────────────────
function FvTooltip({active,payload,label}) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.panel,border:`1px solid ${C.navyL}`,padding:"10px 14px",boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
      <div style={{...raj(12,700),color:C.white,marginBottom:6}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,...raj(12,600),color:p.color,marginBottom:2}}>
          <div style={{width:8,height:8,background:p.color,flexShrink:0}}/>
          {p.name}: {typeof p.value==="number"?p.value.toLocaleString():p.value}
        </div>
      ))}
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────
function KpiCard({icon:Icon,label,value,sub,color,trend,delay=0}) {
  const up=trend>=0;
  return (
    <div className="s-kpi" style={{background:C.card,border:`1px solid ${color}33`,padding:"22px 20px",
      position:"relative",overflow:"hidden",
      boxShadow:`0 4px 24px rgba(0,0,0,.4),0 0 0 1px ${color}11`,
      animation:`s-cardIn .5s ease ${delay}s both`}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:color,filter:"blur(50px)",opacity:.06,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div style={{background:`${color}18`,border:`1px solid ${color}33`,padding:"10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon size={20} color={color}/>
        </div>
        {trend!==undefined&&(
          <div style={{display:"flex",alignItems:"center",gap:4,...raj(12,700),color:up?C.green:C.red}}>
            {up?<TrendingUp size={13}/>:<TrendingDown size={13}/>} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{...orb("clamp(22px,2.5vw,30px)",900),color,marginBottom:4,animation:`s-countUp .6s ease ${delay+.1}s both`}}>{value}</div>
      <div style={{...raj(13,700),color:C.white,marginBottom:3,letterSpacing:".03em"}}>{label}</div>
      <div style={{...raj(11,500),color:C.muted}}>{sub}</div>
    </div>
  );
}

// ── Sección header ─────────────────────────────────────────────
function SectionHeader({icon:Icon,title,color=C.orange,extra}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
      <Icon size={16} color={color}/>
      <span style={{...orb(12,700),color:C.white,letterSpacing:".04em"}}>{title}</span>
      {extra&&<div style={{marginLeft:"auto"}}>{extra}</div>}
    </div>
  );
}

// ── Mini bar inline ────────────────────────────────────────────
function InlineBar({val,max,color,height=6}) {
  const pct=Math.min((val/max)*100,100);
  return (
    <div style={{flex:1,height,background:C.panel,border:`1px solid ${color}22`,overflow:"hidden",minWidth:40}}>
      <div style={{height:"100%","--bw":`${pct}%`,animation:"s-barFill .8s ease .2s both",background:color,boxShadow:`0 0 4px ${color}66`}}
        ref={el=>{if(el)el.style.width=`${pct}%`}}/>
    </div>
  );
}

// ── Clase color helper ─────────────────────────────────────────
const CLS_COLOR = {GUERRERO:C.orange,ARQUERO:C.blue,MAGO:C.purple};
const CLS_ICON  = {GUERRERO:"⚔️",ARQUERO:"🏃",MAGO:"🧘"};

// ── Medalla de posición ────────────────────────────────────────
function PosMedal({pos}) {
  const map={1:{c:C.gold,s:"🥇"},2:{c:C.mutedL,s:"🥈"},3:{c:"#CD7F32",s:"🥉"}};
  const m=map[pos];
  if(m) return <span style={{fontSize:18,filter:`drop-shadow(0 0 6px ${m.c})`}}>{m.s}</span>;
  return <span style={{...raj(13,700),color:C.muted,minWidth:22,textAlign:"center"}}>#{pos}</span>;
}

// ── Heatmap de actividad ───────────────────────────────────────
function ActivityHeatmap() {
  const DIAS=["L","M","X","J","V","S","D"];
  const maxVal=50;
  return (
    <div>
      <div style={{display:"flex",gap:3,marginBottom:6}}>
        {DIAS.map(d=><div key={d} style={{width:16,...raj(9,600),color:C.muted,textAlign:"center"}}>{d}</div>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:3}}>
        {HEATMAP.map((week,wi)=>(
          <div key={wi} style={{display:"flex",gap:3}}>
            {week.map((val,di)=>{
              const pct=val/maxVal;
              const alpha=val===0?0.04:0.12+pct*0.88;
              return (
                <div key={di} title={`${val} sesiones`}
                  style={{width:16,height:16,background:val===0?`${C.navy}44`:`${C.orange}`,opacity:alpha,
                    border:val>30?`1px solid ${C.orange}88`:"none",
                    transition:"opacity .2s",cursor:"default"}}/>
              );
            })}
          </div>
        ))}
      </div>
      {/* legend */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
        <span style={{...raj(10,500),color:C.muted}}>Menos</span>
        {[0.05,0.25,0.5,0.75,1].map((o,i)=>(
          <div key={i} style={{width:12,height:12,background:C.orange,opacity:o}}/>
        ))}
        <span style={{...raj(10,500),color:C.muted}}>Más</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function AdminStats() {
  const [periodo,    setPeriodo]    = useState("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [metricaGraf,setMetricaGraf]= useState("sesiones"); // sesiones|xp|usuarios|nuevos

  const data = DATA_BY_PERIOD[periodo] || DATA_BY_PERIOD["30d"];

  const refresh=async()=>{setRefreshing(true);await new Promise(r=>setTimeout(r,900));setRefreshing(false);};

  // KPIs calculados del período seleccionado
  const kpiData = useMemo(()=>({
    usuarios:   data.reduce((s,d)=>s+d.usuarios,0),
    sesiones:   data.reduce((s,d)=>s+d.sesiones,0),
    xpTotal:    data.reduce((s,d)=>s+d.xp,0),
    nuevos:     data.reduce((s,d)=>s+d.nuevos,0),
  }),[data]);

  const METRICA_CONFIG = {
    sesiones:{ label:"Sesiones", color:C.orange, key:"sesiones" },
    xp:       { label:"XP Ganado", color:C.gold,   key:"xp"       },
    usuarios: { label:"Usuarios Activos", color:C.blue, key:"usuarios" },
    nuevos:   { label:"Nuevos Registros", color:C.green,key:"nuevos"  },
  };
  const mc=METRICA_CONFIG[metricaGraf];

  return (
    <>
      <style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",gap:22}}>

        {/* ── Header: período + refresh ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <BarChart2 size={16} color={C.orange}/>
            <span style={{...orb(13,700),color:C.white,letterSpacing:".04em"}}>ESTADÍSTICAS GLOBALES</span>
            <div style={{display:"flex",alignItems:"center",gap:5,background:`${C.green}14`,border:`1px solid ${C.green}33`,padding:"4px 10px"}}>
              <div style={{width:6,height:6,background:C.green,borderRadius:"50%",animation:"s-pulse 1.2s infinite"}}/>
              <span style={{...raj(11,700),color:C.green,letterSpacing:".08em"}}>EN VIVO</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* período */}
            <div style={{display:"flex",gap:4}}>
              {PERIODOS.map(p=>(
                <button key={p.id} onClick={()=>setPeriodo(p.id)} className="s-period-btn"
                  style={{...raj(12,periodo===p.id?700:500),color:periodo===p.id?C.orange:C.muted,
                    background:periodo===p.id?`${C.orange}18`:C.panel,
                    border:`1px solid ${periodo===p.id?C.orange:C.navy}`,
                    padding:"7px 14px",cursor:"pointer",transition:"all .2s"}}>
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={refresh} style={{...raj(12,600),color:C.muted,background:C.panel,border:`1px solid ${C.navy}`,padding:"7px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .2s"}}>
              <RefreshCw size={13} style={{animation:refreshing?"s-spin .8s linear infinite":"none"}}/> Actualizar
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          <KpiCard icon={Users}    label="Usuarios Activos"   value={kpiData.usuarios.toLocaleString()}      sub={`Período: ${PERIODOS.find(p=>p.id===periodo)?.label}`} color={C.blue}   trend={12}  delay={0}/>
          <KpiCard icon={Activity} label="Sesiones Totales"   value={kpiData.sesiones.toLocaleString()}      sub="Promedio diario"        color={C.orange} trend={8}   delay={.08}/>
          <KpiCard icon={Zap}      label="XP Total Generado"  value={`${(kpiData.xpTotal/1000).toFixed(1)}K`} sub="Suma de todos los héroes" color={C.gold}   trend={18}  delay={.16}/>
          <KpiCard icon={Users}    label="Nuevos Registros"   value={kpiData.nuevos.toLocaleString()}        sub="Usuarios nuevos"        color={C.green}  trend={-4}  delay={.24}/>
        </div>

        {/* ── Fila: métricas rápidas ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {icon:"🏆",label:"Logros desbloqueados",value:"3,421",color:C.gold  },
            {icon:"🎯",label:"Misiones completadas", value:"8,934",color:C.teal  },
            {icon:"🔥",label:"Racha promedio",        value:"6.4 días",color:C.red},
            {icon:"⏱️",label:"Tiempo activo prom.",   value:"28 min",color:C.blue },
          ].map((s,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${s.color}22`,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,animation:`s-cardIn .4s ease ${.3+i*.07}s both`}}>
              <span style={{fontSize:28,filter:`drop-shadow(0 0 8px ${s.color}66)`}}>{s.icon}</span>
              <div>
                <div style={{...orb(18,900),color:s.color,marginBottom:3}}>{s.value}</div>
                <div style={{...raj(12,500),color:C.muted}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Gráfica principal — evolución temporal ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .2s both"}}>
          <SectionHeader icon={TrendingUp} title="EVOLUCIÓN TEMPORAL" color={mc.color}
            extra={
              <div style={{display:"flex",gap:4}}>
                {Object.entries(METRICA_CONFIG).map(([k,v])=>(
                  <button key={k} onClick={()=>setMetricaGraf(k)} className="s-period-btn"
                    style={{...raj(11,metricaGraf===k?700:500),color:metricaGraf===k?v.color:C.muted,
                      background:metricaGraf===k?`${v.color}18`:C.panel,
                      border:`1px solid ${metricaGraf===k?v.color:C.navy}`,
                      padding:"5px 12px",cursor:"pointer"}}>
                    {v.label}
                  </button>
                ))}
              </div>
            }/>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{top:4,right:4,left:-10,bottom:0}}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={mc.color} stopOpacity={.35}/>
                  <stop offset="95%" stopColor={mc.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
              <XAxis dataKey="dia" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <Tooltip content={<FvTooltip/>}/>
              <Area type="monotone" dataKey={mc.key} name={mc.label} stroke={mc.color} strokeWidth={2.5}
                fill="url(#areaGrad)" dot={{fill:mc.color,r:3,strokeWidth:0}}
                activeDot={{r:5,fill:mc.color,stroke:C.card,strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Fila: Clases + Distribución de niveles ── */}
        <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:16}}>
          {/* Donut de clases */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .25s both"}}>
            <SectionHeader icon={Award} title="DISTRIBUCIÓN DE CLASES"/>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <PieChart width={160} height={160}>
                <Pie data={DATA_CLASES} cx={75} cy={75} innerRadius={45} outerRadius={72}
                  dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                  {DATA_CLASES.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip content={<FvTooltip/>}/>
              </PieChart>
              <div style={{flex:1}}>
                {DATA_CLASES.map((d,i)=>(
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{width:10,height:10,background:d.color}}/>
                        <span style={{...raj(12,700),color:d.color}}>{d.name}</span>
                      </div>
                      <span style={{...raj(12,700),color:d.color}}>{d.value}%</span>
                    </div>
                    <InlineBar val={d.value} max={100} color={d.color}/>
                    <div style={{...raj(10,500),color:C.muted,marginTop:3}}>{d.usuarios} usuarios</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar de distribución de niveles */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .3s both"}}>
            <SectionHeader icon={TrendingUp} title="DISTRIBUCIÓN DE NIVELES" color={C.gold}/>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={DATA_NIVEL_DIST} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
                <XAxis dataKey="rango" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<FvTooltip/>}/>
                <Bar dataKey="usuarios" name="Usuarios" radius={0}>
                  {DATA_NIVEL_DIST.map((_,i)=>(
                    <Cell key={i} fill={i<2?C.blue:i<4?C.orange:i<6?C.gold:C.red}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Fila: Retención + Radar ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:16}}>
          {/* Retención */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .32s both"}}>
            <SectionHeader icon={Users} title="CURVA DE RETENCIÓN" color={C.teal}/>
            <p style={{...raj(12,400),color:C.muted,marginBottom:18,lineHeight:1.5}}>
              % de usuarios que siguen activos semanas después de su registro
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={DATA_RETENCCION}>
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.teal} stopOpacity={.35}/>
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`}/>
                <XAxis dataKey="semana" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<FvTooltip/>}/>
                <Area type="monotone" dataKey="retencion" name="Retención %" stroke={C.teal} strokeWidth={2.5}
                  fill="url(#retGrad)" dot={{fill:C.teal,r:4,strokeWidth:0}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .36s both"}}>
            <SectionHeader icon={Activity} title="PERFIL PROMEDIO" color={C.purple}/>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={DATA_RADAR}>
                <PolarGrid stroke={`${C.navyL}66`}/>
                <PolarAngleAxis dataKey="attr" tick={{fill:C.muted,fontSize:9,fontFamily:"Rajdhani"}}/>
                <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
                <Radar name="Promedio" dataKey="valor" stroke={C.purple} fill={C.purple} fillOpacity={0.3} strokeWidth={2}/>
                <Tooltip content={<FvTooltip/>}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Top ejercicios ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"s-cardIn .5s ease .38s both"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <BarChart2 size={16} color={C.orange}/>
              <span style={{...orb(12,700),color:C.white}}>TOP EJERCICIOS POR POPULARIDAD</span>
            </div>
            <span style={{...raj(11,600),color:C.muted}}>{DATA_EJERCICIOS.length} ejercicios con datos</span>
          </div>
          {/* thead */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 3fr",padding:"10px 22px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:12}}>
            {["EJERCICIO","SESIONES","XP GENERADO","COMPLETADAS","POPULARIDAD"].map(h=>(
              <span key={h} style={{...px(5),color:C.muted,letterSpacing:".05em"}}>{h}</span>
            ))}
          </div>
          {DATA_EJERCICIOS.map((ej,i)=>{
            const maxSes=DATA_EJERCICIOS[0].sesiones;
            const colors=[C.orange,C.blue,C.teal,C.gold,C.purple,C.green,C.orangeL,C.red];
            const c=colors[i%colors.length];
            return (
              <div key={ej.name} className="s-bar-row" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 3fr",padding:"12px 22px",borderBottom:`1px solid ${C.navy}22`,gap:12,alignItems:"center",animation:`s-cardIn .35s ease ${i*.05}s both`}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{...orb(11,900),color:C.muted,minWidth:20,textAlign:"center"}}>#{i+1}</div>
                  <span style={{...raj(13,700),color:C.white}}>{ej.name}</span>
                </div>
                <span style={{...raj(13,700),color:c}}>{ej.sesiones.toLocaleString()}</span>
                <span style={{...raj(13,600),color:C.gold}}>{(ej.xp/1000).toFixed(1)}K</span>
                <span style={{...raj(13,600),color:C.teal}}>{ej.completadas.toLocaleString()}</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <InlineBar val={ej.sesiones} max={maxSes} color={c} height={8}/>
                  <span style={{...raj(11,700),color:c,minWidth:36,textAlign:"right"}}>{Math.round((ej.sesiones/maxSes)*100)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Fila: Heatmap + Top usuarios ── */}
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:16}}>
          {/* heatmap */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .42s both"}}>
            <SectionHeader icon={Calendar} title="ACTIVIDAD · ÚLTIMAS 10 SEMANAS" color={C.orange}/>
            <ActivityHeatmap/>
          </div>

          {/* top usuarios */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,animation:"s-cardIn .5s ease .44s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"18px 22px",borderBottom:`1px solid ${C.navy}`}}>
              <Trophy size={16} color={C.gold}/>
              <span style={{...orb(12,700),color:C.white}}>LEADERBOARD GLOBAL</span>
            </div>
            {/* cabecera */}
            <div style={{display:"grid",gridTemplateColumns:"60px 1fr 0.7fr 0.7fr 0.7fr 0.8fr",padding:"9px 20px",background:`${C.panel}88`,borderBottom:`1px solid ${C.navy}`,gap:10}}>
              {["POS","USUARIO","CLASE","NIVEL","XP","SESIONES"].map(h=>(
                <span key={h} style={{...px(5),color:C.muted,letterSpacing:".05em"}}>{h}</span>
              ))}
            </div>
            {TOP_USERS.map((u,i)=>(
              <div key={u.pos} className="s-user-row" style={{display:"grid",gridTemplateColumns:"60px 1fr 0.7fr 0.7fr 0.7fr 0.8fr",padding:"11px 20px",borderBottom:`1px solid ${C.navy}22`,gap:10,alignItems:"center",animation:`s-cardIn .3s ease ${i*.05}s both`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}><PosMedal pos={u.pos}/></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,background:`${CLS_COLOR[u.clase]}22`,border:`1px solid ${CLS_COLOR[u.clase]}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                    {CLS_ICON[u.clase]}
                  </div>
                  <span style={{...raj(13,700),color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nombre}</span>
                </div>
                <span style={{...raj(11,700),color:CLS_COLOR[u.clase],background:`${CLS_COLOR[u.clase]}14`,border:`1px solid ${CLS_COLOR[u.clase]}33`,padding:"2px 7px",whiteSpace:"nowrap"}}>{u.clase}</span>
                <span style={{...orb(13,900),color:C.gold}}>Lv.{u.nivel}</span>
                <span style={{...raj(12,700),color:C.orange}}>{u.xp.toLocaleString()}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{...raj(12,600),color:C.blue}}>{u.sesiones}</span>
                  <InlineBar val={u.sesiones} max={150} color={C.blue} height={4}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gráfica doble: sesiones vs XP ── */}
        <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .46s both"}}>
          <SectionHeader icon={Activity} title="SESIONES VS XP GENERADO" color={C.blue}/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.slice(0,14)} barCategoryGap="25%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={`${C.navyL}44`} vertical={false}/>
              <XAxis dataKey="dia" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="left"  tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="right" orientation="right" tick={{fill:C.muted,fontSize:10,fontFamily:"Rajdhani"}} axisLine={false} tickLine={false}
                tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
              <Tooltip content={<FvTooltip/>}/>
              <Legend wrapperStyle={{...raj(11,600),color:C.muted,paddingTop:8}}/>
              <Bar yAxisId="left"  dataKey="sesiones" name="Sesiones" fill={C.orange} radius={0} maxBarSize={24}/>
              <Bar yAxisId="right" dataKey="xp"       name="XP"       fill={C.gold}   radius={0} maxBarSize={24}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Fila final: métricas de misiones y logros ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* misiones */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .48s both"}}>
            <SectionHeader icon={Target} title="ESTADO DE MISIONES" color={C.teal}/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {l:"Diarias completadas hoy",    v:312, max:500, c:C.orange},
                {l:"Semanales completadas",       v:89,  max:150, c:C.blue  },
                {l:"Desafíos activos en progreso",v:23,  max:50,  c:C.gold  },
                {l:"Eventos participantes",       v:0,   max:500, c:C.purple},
              ].map((s,i)=>(
                <div key={i}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{...raj(12,600),color:C.mutedL}}>{s.l}</span>
                    <span style={{...raj(12,700),color:s.c}}>{s.v.toLocaleString()}</span>
                  </div>
                  <InlineBar val={s.v} max={s.max} color={s.c} height={6}/>
                </div>
              ))}
            </div>
          </div>

          {/* logros */}
          <div style={{background:C.card,border:`1px solid ${C.navy}`,padding:"22px",animation:"s-cardIn .5s ease .5s both"}}>
            <SectionHeader icon={Trophy} title="LOGROS MÁS OBTENIDOS" color={C.gold}/>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {name:"Primer Paso",      obtenidos:892, color:C.muted  },
                {name:"Perfil Completo",  obtenidos:567, color:C.blue   },
                {name:"Cardio Diario",    obtenidos:348, color:C.orange  },
                {name:"Semana de Hierro", obtenidos:312, color:C.red    },
                {name:"Nivel 10",         obtenidos:234, color:C.gold   },
              ].map((l,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{...orb(11,900),color:C.muted,minWidth:20,textAlign:"center"}}>#{i+1}</span>
                  <span style={{...raj(12,700),color:C.white,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
                  <InlineBar val={l.obtenidos} max={1000} color={l.color} height={6}/>
                  <span style={{...raj(11,700),color:l.color,minWidth:36,textAlign:"right"}}>{l.obtenidos}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}