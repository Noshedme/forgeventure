// src/pages/OnboardingFlow.jsx
// Cuestionario de bienvenida — aparece UNA SOLA VEZ tras el primer login.
// 8 preguntas → algoritmo 5-factor → perfil de fitness → rutina asignada en Firebase.
import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase.js";
import { saveOnboarding } from "../services/api.js";
import {
  Zap, Dumbbell, Activity, Leaf, Moon, Droplets, Target, Brain,
  BedDouble, Footprints, Users, Home, Wind, Scale, Star,
  BatteryLow, Battery, BatteryFull, Sun, Minus, AlertCircle, AlertTriangle,
  Shield, Flame, Check, ChevronLeft, Sparkles, Heart, TrendingUp, Swords,
  Trophy, Sword,
} from "lucide-react";

// ── SC Admin palette ─────────────────────────────────────────────
const C = {
  bg:     "#0A0E1A",
  card:   "#141A2A",
  panel:  "#0E1520",
  navy:   "#1A3354",
  navyL:  "#1E3A5F",
  orange: "#D4A574",
  gold:   "#C9B037",
  blue:   "#5A9FD4",
  teal:   "#4A9D8F",
  green:  "#6B9F6A",
  red:    "#C66B6B",
  purple: "#8B7BB8",
  white:  "#F0F4FF",
  muted:  "#7A8A9E",
  mutedL: "#9AA3B2",
};

const raj  = (s, w=600) => ({ fontFamily:"'Rajdhani',sans-serif",  fontSize:s, fontWeight:w });
const orb  = (s, w=700) => ({ fontFamily:"'Orbitron',sans-serif",  fontSize:s, fontWeight:w });
const px8  = (s)        => ({ fontFamily:"'Press Start 2P'",       fontSize:s });

// ── Animations ───────────────────────────────────────────────────
const CSS = `
  @keyframes ob-fadeIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ob-fadeOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-16px)} }
  @keyframes ob-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes ob-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ob-pop     { 0%{transform:scale(0.8) rotate(-4deg);opacity:0} 70%{transform:scale(1.07)} 100%{transform:scale(1);opacity:1} }
  @keyframes ob-optIn   { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ob-resultIn{ from{opacity:0;transform:scale(.86) translateY(28px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes ob-shimmer { 0%{left:-100%} 100%{left:220%} }
  @keyframes ob-starBlink { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
  @keyframes ob-pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ob-scan    { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }

  .ob-opt {
    transition: all .18s cubic-bezier(.34,1.4,.64,1);
    cursor: pointer;
    position: relative; overflow: hidden;
    border-radius: 10px;
  }
  .ob-opt:hover:not(.ob-opt--sel) {
    transform: translateX(6px);
    border-color: var(--ob-ac) !important;
    background: var(--ob-ac-faint) !important;
  }
  .ob-opt--sel { transform: translateX(6px); }
  .ob-opt::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.025),transparent);
    pointer-events:none;
  }
  .ob-cta {
    transition: all .18s;
    border-radius: 8px;
    cursor: pointer;
  }
  .ob-cta:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
  .ob-back {
    transition: all .18s; border-radius: 6px; cursor: pointer;
  }
  .ob-back:hover { color: ${C.white} !important; border-color: ${C.navyL} !important; }
`;

// ── Questions ────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "q1", Ico: Zap, accent: C.orange,
    title: "¿Con qué frecuencia te ejercitas actualmente?",
    subtitle: "Sé honesto — diseñaremos tu rutina a partir de aquí",
    options: [
      { label: "Nunca o casi nunca",      Ico: BedDouble,  score: 0, tag: "sedentary" },
      { label: "1 a 2 veces por semana",  Ico: Footprints, score: 1, tag: "light"     },
      { label: "3 a 4 veces por semana",  Ico: Dumbbell,   score: 2, tag: "moderate"  },
      { label: "Todos los días",           Ico: Flame,      score: 3, tag: "active"    },
    ],
  },
  {
    id: "q2", Ico: Dumbbell, accent: C.blue,
    title: "¿Qué tipo de ejercicio te llama más la atención?",
    subtitle: "Adaptaremos los ejercicios a lo que más disfrutas",
    options: [
      { label: "Gym / Pesas",            Ico: Dumbbell,  tag: "gym"    },
      { label: "Cardio / Running",       Ico: Activity,  tag: "cardio" },
      { label: "Deportes de equipo",     Ico: Users,     tag: "sports" },
      { label: "Ejercicio en casa",      Ico: Home,      tag: "home"   },
      { label: "Yoga / Movilidad",       Ico: Wind,      tag: "yoga"   },
    ],
  },
  {
    id: "q3", Ico: Activity, accent: C.teal,
    title: "¿Cómo describes tu condición física actual?",
    subtitle: "Sin juzgar — solo queremos saber tu punto de partida",
    options: [
      { label: "Me canso con facilidad",       Ico: BatteryLow,  score: 0, tag: "low"    },
      { label: "Puedo hacer actividad ligera",  Ico: Battery,     score: 1, tag: "medium" },
      { label: "Tengo buena base física",       Ico: BatteryFull, score: 2, tag: "good"   },
      { label: "Estoy en muy buena forma",      Ico: Zap,         score: 3, tag: "great"  },
    ],
  },
  {
    id: "q4", Ico: Leaf, accent: C.green,
    title: "¿Cómo describes tu alimentación actual?",
    subtitle: "La nutrición es la mitad de la batalla",
    options: [
      { label: "Muy irregular o procesada",    Ico: AlertCircle, tag: "poor"  },
      { label: "Podría mejorar bastante",       Ico: Minus,       tag: "fair"  },
      { label: "Bastante balanceada",           Ico: Check,       tag: "good"  },
      { label: "Muy saludable y planificada",   Ico: Star,        tag: "great" },
    ],
  },
  {
    id: "q5", Ico: Moon, accent: C.purple,
    title: "¿Cuántas horas duermes por noche en promedio?",
    subtitle: "El descanso determina tu recuperación y progreso",
    options: [
      { label: "Menos de 5 horas",  Ico: BatteryLow,  tag: "poor"  },
      { label: "5 a 6 horas",       Ico: Battery,     tag: "fair"  },
      { label: "7 a 8 horas",       Ico: BatteryFull, tag: "good"  },
      { label: "Más de 8 horas",    Ico: Sparkles,    tag: "great" },
    ],
  },
  {
    id: "q6", Ico: Droplets, accent: C.blue,
    title: "¿Cuánta agua tomas al día aproximadamente?",
    subtitle: "La hidratación afecta directamente tu rendimiento",
    options: [
      { label: "Menos de 1 litro",  Ico: AlertCircle,  tag: "poor"  },
      { label: "1 a 2 litros",      Ico: Droplets,     tag: "fair"  },
      { label: "2 a 3 litros",      Ico: BatteryFull,  tag: "good"  },
      { label: "3 litros o más",    Ico: Zap,          tag: "great" },
    ],
  },
  {
    id: "q7", Ico: Target, accent: C.gold,
    title: "¿Cuál es tu objetivo principal?",
    subtitle: "Definir tu meta es el primer paso para alcanzarla",
    options: [
      { label: "Bajar de peso",               Ico: Scale,      tag: "weight_loss" },
      { label: "Ganar músculo y fuerza",      Ico: Dumbbell,   tag: "muscle_gain" },
      { label: "Mejorar resistencia",         Ico: TrendingUp, tag: "endurance"   },
      { label: "Bienestar general y energía", Ico: Heart,      tag: "wellness"    },
    ],
  },
  {
    id: "q8", Ico: Brain, accent: C.red,
    title: "¿Cómo describes tu nivel de estrés habitual?",
    subtitle: "El estrés afecta tu capacidad de recuperación",
    options: [
      { label: "Bajo — vivo bastante tranquilo",     Ico: Sun,           tag: "low"     },
      { label: "Moderado — manejable",               Ico: Minus,         tag: "medium"  },
      { label: "Alto — me cuesta desconectar",       Ico: AlertCircle,   tag: "high"    },
      { label: "Muy alto — me afecta el día a día",  Ico: AlertTriangle, tag: "extreme" },
    ],
  },
];

// ── 5-factor scoring algorithm ────────────────────────────────────
function computeProfile(answers) {
  const freqScore = (answers.q1?.score ?? 0) * 2;           // 0-6
  const condScore = (answers.q3?.score ?? 0) * 2;           // 0-6
  const stressMap = { low: 1, medium: 0, high: -1, extreme: -2 };
  const stressMod = stressMap[answers.q8?.tag] ?? 0;        // -2 to +1
  const sleepMap  = { poor: -1, fair: 0, good: 1, great: 1 };
  const sleepMod  = sleepMap[answers.q5?.tag] ?? 0;         // -1 to +1
  const goalMap   = { muscle_gain: 1, endurance: 1, weight_loss: 0, wellness: -1 };
  const goalMod   = goalMap[answers.q7?.tag] ?? 0;          // -1 to +1

  const total = freqScore + condScore + stressMod + sleepMod + goalMod;

  if (total <= 4)  return {
    level: "beginner", label: "INICIANTE", Ico: Shield,
    color: C.teal, dificultad: "Principiante", coins: 150,
    msg: "Empezamos desde cero juntos. Tu rutina estará diseñada para llevarte paso a paso, construyendo hábitos sólidos sin riesgo de lesión.",
  };
  if (total <= 9)  return {
    level: "intermediate", label: "INTERMEDIO", Ico: Swords,
    color: C.blue, dificultad: "Intermedio", coins: 100,
    msg: "Tienes base. Vamos a potenciarte con rutinas progresivas bien estructuradas que eleven tu rendimiento al siguiente escalón.",
  };
  return {
    level: "advanced", label: "AVANZADO", Ico: Flame,
    color: C.orange, dificultad: "Avanzado", coins: 50,
    msg: "Estás en forma. Te asignaremos rutinas de alta intensidad para que sigas rompiendo límites y alcanzando nuevos máximos.",
  };
}

// ── Ambient particles ─────────────────────────────────────────────
function Particles() {
  const items = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      x:    `${(i * 4.7) % 100}%`,
      y:    `${(i * 7.3) % 100}%`,
      size: (i % 3 === 0) ? 2.5 : 1.5,
      delay:`${(i * 0.31) % 5}s`,
      dur:  `${3 + (i % 4)}s`,
    }))
  ).current;
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {items.map((s, i) => (
        <div key={i} style={{
          position:"absolute", left:s.x, top:s.y,
          width:s.size, height:s.size,
          background:C.white, borderRadius:"50%",
          opacity:0,
          animation:`ob-starBlink ${s.dur} ${s.delay} ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

// ── Step number dots ──────────────────────────────────────────────
function StepDots({ current, total, accent }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {Array.from({ length: total }, (_, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} style={{
            width:  active ? 20 : done ? 8 : 6,
            height: 6,
            borderRadius: 99,
            background: active ? accent : done ? `${accent}88` : C.navyL,
            transition: "all .35s cubic-bezier(.34,1.56,.64,1)",
          }}/>
        );
      })}
    </div>
  );
}

// ── Result screen ─────────────────────────────────────────────────
function ResultScreen({ profile, username, onEnter, saving, error }) {
  const [showReward, setShowReward] = useState(false);
  const [showStats,  setShowStats]  = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowReward(true), 550);
    const t2 = setTimeout(() => setShowStats(true),  950);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const { Ico: LevelIco, color, label, coins, msg } = profile;

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      gap:24, textAlign:"center",
      animation:"ob-resultIn .7s cubic-bezier(.34,1.56,.64,1) both",
    }}>
      {/* Level icon box */}
      <div style={{
        width:96, height:96, borderRadius:22,
        background:`${color}14`, border:`2px solid ${color}55`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 0 40px ${color}33, 0 0 80px ${color}18`,
        animation:"ob-float 3s ease-in-out infinite",
      }}>
        {(()=>{ const I=LevelIco; return <I size={44} color={color}/>; })()}
      </div>

      {/* Label */}
      <div>
        <div style={{ ...px8(6), color:C.muted, marginBottom:10, letterSpacing:".12em" }}>
          PERFIL ASIGNADO
        </div>
        <div style={{
          ...orb(30, 900), color,
          textShadow:`0 0 20px ${color}88, 0 0 50px ${color}33`,
          marginBottom:10, lineHeight:1.1,
        }}>
          {label}
        </div>
        <div style={{ ...raj(13,600), color:C.mutedL }}>
          {username?.toUpperCase() || "HÉROE"} · NIVEL 1
        </div>
      </div>

      {/* Message */}
      <div style={{
        background:`${color}0A`, border:`1px solid ${color}33`,
        borderRadius:14, padding:"16px 22px",
        maxWidth:480,
        ...raj(14,400), color:C.white, lineHeight:1.7,
        backdropFilter:"blur(6px)",
      }}>
        {msg}
      </div>

      {/* Reward tile */}
      {showReward && (
        <div style={{
          display:"flex", alignItems:"center", gap:14,
          background:`${C.gold}0C`, border:`1px solid ${C.gold}33`,
          borderRadius:12, padding:"14px 28px",
          animation:"ob-pop .5s cubic-bezier(.34,1.56,.64,1) both",
        }}>
          <div style={{
            width:44, height:44, borderRadius:10,
            background:`${C.gold}18`, border:`1px solid ${C.gold}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Trophy size={22} color={C.gold}/>
          </div>
          <div style={{ textAlign:"left" }}>
            <div style={{ ...orb(22,900), color:C.gold, textShadow:`0 0 14px ${C.gold}66` }}>
              +{coins}
            </div>
            <div style={{ ...raj(11,600), color:C.muted }}>monedas de bienvenida</div>
          </div>
        </div>
      )}

      {/* Stats tiles */}
      {showStats && (
        <div style={{
          display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center",
          animation:"ob-fadeIn .4s ease both",
        }}>
          {[
            { label:"NIVEL",   value:"1",        accent:C.orange },
            { label:"PERFIL",  value:label,       accent:color    },
            { label:"RACHA",   value:"0 días",    accent:C.teal   },
          ].map(s => (
            <div key={s.label} style={{
              background:C.panel, border:`1px solid ${s.accent}2A`,
              borderTop:`2px solid ${s.accent}66`,
              borderRadius:10, padding:"12px 18px",
              textAlign:"center", minWidth:96,
            }}>
              <div style={{ ...orb(13,900), color:s.accent, marginBottom:4 }}>{s.value}</div>
              <div style={{ ...px8(5), color:C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          ...raj(12,600), color:C.red,
          background:`${C.red}0E`, border:`1px solid ${C.red}33`,
          borderRadius:8, padding:"10px 18px",
          display:"flex", alignItems:"center", gap:8,
        }}>
          <AlertCircle size={14} color={C.red}/> {error}
        </div>
      )}

      {/* CTA */}
      <button
        className="ob-cta"
        onClick={onEnter}
        disabled={saving}
        style={{
          ...raj(15,700), color: saving ? C.muted : C.bg,
          background: saving ? `${color}33` : `linear-gradient(135deg,${color},${C.gold})`,
          border:"none", padding:"14px 44px",
          boxShadow: saving ? "none" : `0 6px 28px ${color}55`,
          display:"flex", alignItems:"center", gap:10,
          pointerEvents: saving ? "none" : "auto",
          letterSpacing:".04em",
        }}>
        {saving ? (
          <>
            <div style={{ width:14, height:14, border:`2px solid ${C.muted}`, borderTopColor:color, borderRadius:"50%", animation:"ob-spin .8s linear infinite" }}/>
            GUARDANDO...
          </>
        ) : (
          <><Zap size={15}/> COMENZAR AVENTURA</>
        )}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function OnboardingFlow({ profile: userProfile, onComplete }) {
  const TOTAL      = QUESTIONS.length;
  const [step,     setStep]    = useState(0);
  const [answers,  setAnswers] = useState({});
  const [animDir,  setAnimDir] = useState("in");
  const [saving,   setSaving]  = useState(false);
  const [error,    setError]   = useState(null);
  const stepRef    = useRef(step);
  stepRef.current  = step;

  const isResult = step === TOTAL;
  const question = !isResult ? QUESTIONS[step] : null;
  const selected = question ? answers[question.id] : null;
  const accent   = question?.accent || C.orange;

  const computedProfile = computeProfile(answers);

  const goNext = (option) => {
    const qId = QUESTIONS[stepRef.current].id;
    setAnswers(prev => ({ ...prev, [qId]: option }));
    setAnimDir("out");
    setTimeout(() => { setStep(s => s + 1); setAnimDir("in"); }, 200);
  };

  const goBack = () => {
    if (step === 0) return;
    setAnimDir("out");
    setTimeout(() => { setStep(s => s - 1); setAnimDir("in"); }, 200);
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const u     = auth.currentUser;
      const token = await u.getIdToken();
      await saveOnboarding(token, answers);
      onComplete();
    } catch {
      setError("No se pudo guardar. Verifica tu conexión e intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <div style={{
        position:"fixed", inset:0, zIndex:9999,
        background:`radial-gradient(ellipse at 28% 18%, #0D1A30 0%, ${C.bg} 65%)`,
        display:"flex", flexDirection:"column",
        overflowY:"auto",
      }}>
        <Particles />

        {/* Scan line */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg,transparent,${C.orange}55,transparent)`,
          animation:"ob-scan 9s linear infinite", pointerEvents:"none",
        }}/>

        {/* ── HEADER ── */}
        <div style={{ flexShrink:0 }}>
          <div style={{
            background:`${C.card}EE`, backdropFilter:"blur(12px)",
            borderBottom:`1px solid ${C.navy}`,
            padding:"13px 24px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            {/* Brand */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{
                width:32, height:32, borderRadius:8,
                background:`${C.orange}18`, border:`1px solid ${C.orange}44`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <Sword size={16} color={C.orange}/>
              </div>
              <span style={{ ...orb(10,900), color:C.orange, letterSpacing:".08em" }}>FORGEVENTURE</span>
            </div>

            {/* Step indicator */}
            {!isResult ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                <div style={{ ...raj(11,600), color:C.muted }}>
                  Pregunta <span style={{ color:accent }}>{step+1}</span> / {TOTAL}
                </div>
                <StepDots current={step} total={TOTAL} accent={accent}/>
              </div>
            ) : (
              <div style={{
                ...raj(11,700), color:C.gold,
                background:`${C.gold}10`, border:`1px solid ${C.gold}33`,
                borderRadius:6, padding:"4px 10px",
              }}>
                CONFIGURACIÓN COMPLETA
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height:3, background:C.navy }}>
            <div style={{
              height:"100%",
              width: isResult ? "100%" : `${(step / TOTAL) * 100}%`,
              background: isResult
                ? `linear-gradient(90deg,${C.teal},${C.blue},${C.orange})`
                : `linear-gradient(90deg,${accent}88,${accent})`,
              transition:"width .45s cubic-bezier(.4,0,.2,1)",
              boxShadow:`0 0 10px ${accent}66`,
            }}/>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{
          flex:1, display:"flex", alignItems:"center", justifyContent:"center",
          padding:"32px 20px",
        }}>
          <div style={{
            width:"100%", maxWidth:660,
            animation: animDir === "in"
              ? "ob-fadeIn .28s cubic-bezier(.22,1,.36,1) both"
              : "ob-fadeOut .2s ease both",
          }}>

            {/* ── QUESTION ── */}
            {!isResult && question && (
              <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

                {/* Icon + title */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center" }}>
                  <div style={{
                    width:68, height:68, borderRadius:18,
                    background:`${accent}14`, border:`1px solid ${accent}44`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:`0 0 24px ${accent}28`,
                    animation:"ob-float 3s ease-in-out infinite",
                  }}>
                    {(()=>{ const I=question.Ico; return <I size={30} color={accent}/>; })()}
                  </div>
                  <div>
                    <div style={{ ...orb(15,900), color:C.white, marginBottom:8, lineHeight:1.35, maxWidth:520 }}>
                      {question.title}
                    </div>
                    <div style={{ ...raj(13,400), color:C.muted, lineHeight:1.5 }}>
                      {question.subtitle}
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div
                  style={{ "--ob-ac": accent, "--ob-ac-faint": `${accent}10` }}
                >
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {question.options.map((opt, i) => {
                      const isSel = selected?.tag === opt.tag;
                      return (
                        <div
                          key={opt.tag}
                          className={`ob-opt${isSel ? " ob-opt--sel" : ""}`}
                          onClick={() => goNext(opt)}
                          style={{
                            background: isSel ? `${accent}12` : C.card,
                            border:`2px solid ${isSel ? accent : C.navy}`,
                            padding:"14px 18px",
                            display:"flex", alignItems:"center", gap:14,
                            animation:`ob-optIn .32s ease ${i*.065}s both`,
                            boxShadow: isSel ? `0 0 18px ${accent}1A` : "none",
                          }}>
                          {/* Option icon box */}
                          <div style={{
                            width:38, height:38, borderRadius:9, flexShrink:0,
                            background: isSel ? `${accent}20` : `${C.navyL}`,
                            border:`1px solid ${isSel ? accent+"55" : C.navyL}`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            transition:"all .18s",
                          }}>
                            {(()=>{ const I=opt.Ico; return <I size={17} color={isSel ? accent : C.mutedL}/>; })()}
                          </div>

                          {/* Label */}
                          <div style={{
                            flex:1,
                            ...raj(15, isSel ? 700 : 500),
                            color: isSel ? C.white : C.mutedL,
                            transition:"color .18s",
                          }}>
                            {opt.label}
                          </div>

                          {/* Check circle */}
                          <div style={{
                            width:24, height:24, borderRadius:"50%", flexShrink:0,
                            border:`2px solid ${isSel ? accent : C.navyL}`,
                            background: isSel ? accent : "transparent",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            transition:"all .18s",
                          }}>
                            {isSel && <Check size={12} color={C.bg} strokeWidth={3}/>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Back button */}
                {step > 0 && (
                  <button
                    className="ob-back"
                    onClick={goBack}
                    style={{
                      alignSelf:"flex-start",
                      ...raj(12,600), color:C.muted,
                      background:"transparent", border:`1px solid ${C.navy}`,
                      padding:"8px 16px",
                      display:"flex", alignItems:"center", gap:6,
                    }}>
                    <ChevronLeft size={14}/> Anterior
                  </button>
                )}
              </div>
            )}

            {/* ── RESULT ── */}
            {isResult && (
              <ResultScreen
                profile={computedProfile}
                username={userProfile?.username}
                onEnter={handleComplete}
                saving={saving}
                error={error}
              />
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          flexShrink:0,
          borderTop:`1px solid ${C.navy}`,
          padding:"10px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background:`${C.card}AA`, backdropFilter:"blur(8px)",
        }}>
          <div style={{ ...px8(5), color:`${C.muted}66` }}>FORGEVENTURE v2.0</div>
          <div style={{ ...raj(11,500), color:C.muted }}>
            {!isResult
              ? `${TOTAL - step} pregunta${TOTAL - step !== 1 ? "s" : ""} restante${TOTAL - step !== 1 ? "s" : ""}`
              : "¡Perfil listo!"}
          </div>
          <div style={{ ...px8(5), color:`${C.muted}66` }}>EST. 2024</div>
        </div>
      </div>
    </>
  );
}
