import { useState, useCallback, useEffect, useRef } from 'react';
import AvatarSprite from './AvatarSprite';
import ChatBubble from './ChatBubble';
import { useAvatarState } from './UseAvatarState';
import { getInitialMessage, getResponse } from './responses';
import './avatar-widget.css';

// ── Tips estáticos base ───────────────────────────────────────────────────────
const BASE_TIPS = [
  '💪 ¡Recuerda hidratarte! 8 vasos de agua al día.',
  '🔥 Calienta 5 min antes — reduce lesiones un 40%.',
  '😴 El músculo crece mientras duermes, no te saltes el descanso.',
  '🥗 Come proteína dentro de 30 min post-entreno.',
  '⚡ ¿Ya viste tus misiones de hoy? ¡Te esperan recompensas!',
  '🏆 ¡Cada rep cuenta, no pares!',
  '🎯 Revisa tu progreso en el dashboard.',
  '🦵 Descansa al menos 48h entre el mismo grupo muscular.',
  '🌟 La constancia supera a la intensidad. ¡Sigue así!',
  '🧘 Estira después de entrenar — 5 min salvan tu espalda.',
  '🍌 Plátano antes de entrenar = energía rápida y natural.',
  '⚖️ Para perder grasa sin perder músculo: déficit de 300-400 kcal.',
  '🔁 ¿Bloqueado en un peso? Reduce 10% y reconstruye. Funciona.',
  '💨 Exhala en el esfuerzo, inhala en la vuelta. Siempre.',
  '🎭 ¿Sabías que puedes cambiar mi aspecto en la tienda? 👀',
  '🏃 30 min de cardio ligero en días de descanso acelera la recuperación.',
  '🥩 Proteína: apunta a 1.6-2g por kg de peso corporal al día.',
  '🔥 Las agujetas son señal de crecimiento, ¡no de daño!',
  '💤 Sin 7-8h de sueño, hasta el mejor programa pierde la mitad del efecto.',
  '💊 Creatina monohidrato: el suplemento más respaldado por la ciencia.',
];

// ── Genera tips inteligentes mezclando datos reales + base ───────────────────
function buildSmartTips(profile) {
  if (!profile) return BASE_TIPS;

  const { level = 1, xp = 0, xpNext = 100, streak = 0, coins = 0 } = profile;
  const xpLeft = Math.max(0, xpNext - xp);
  const smart  = [];

  if (xpLeft > 0 && xpLeft <= 150) {
    smart.push(`⚡ ¡Estás a solo ${xpLeft} XP del nivel ${level + 1}! Completa una misión y lo alcanzas.`);
    smart.push(`⚡ ¡Faltan ${xpLeft} XP para el nivel ${level + 1}! Tienes misiones esperándote.`);
  }
  if (streak >= 14) {
    smart.push(`🔥 ¡${streak} días de racha! Eres una leyenda — no lo rompas hoy.`);
    smart.push(`🏆 ${streak} días seguidos de racha. ¡Eso es disciplina de élite!`);
  } else if (streak >= 7) {
    smart.push(`🔥 ¡${streak} días de racha! Brutal — una misión hoy y la mantienes.`);
    smart.push(`⚔️ ${streak} días de racha. Estás construyendo algo poderoso.`);
  } else if (streak >= 3) {
    smart.push(`🔥 ${streak} días seguidos — ¡sigue así, héroe!`);
  } else if (streak === 0) {
    smart.push('🎯 Sin racha activa. Hoy es el día perfecto para empezar — completa una misión.');
    smart.push('⚡ ¿Sin racha? Basta con una acción hoy para activarla. ¡Tú puedes!');
  }
  if (coins >= 1500) {
    smart.push(`💰 Tienes ${coins} monedas acumuladas. ¿Ya revisaste la Tienda?`);
  }
  if (level >= 10) {
    smart.push(`🏆 Nivel ${level} — eres veterano. El contenido avanzado está esperándote.`);
  } else if (level >= 5) {
    smart.push(`⚔️ Nivel ${level}. Los niveles 10+ desbloquean contenido especial. ¡Vas bien!`);
  }

  // smart tips aparecen con más frecuencia al duplicarlos
  return [...smart, ...smart, ...BASE_TIPS];
}

// ── Expresiones idle aleatorias ──────────────────────────────────────────────
const IDLE_EVENTS = [
  { action: 'wave',      weight: 3 },
  { action: 'happy',     weight: 2 },
  { action: 'thinking',  weight: 2 },
  { action: 'surprised', weight: 1 },
  { action: 'dance',     weight: 1 },
  { action: 'bored',     weight: 1 },
];

function pickWeighted(arr) {
  const total = arr.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= x.weight; if (r <= 0) return x; }
  return arr[arr.length - 1];
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function AvatarWidget({ role = 'user', onLogout, skin = 'default', profile = null }) {
  const initial = getInitialMessage(role, profile);

  const [open,    setOpen]    = useState(false);
  const [message, setMessage] = useState(initial);
  const [posX,    setPosX]    = useState(24);
  const [facing,  setFacing]  = useState(1);
  const [tip,     setTip]     = useState(null);

  const { state, frame, setState, playOnce } = useAvatarState('idle');

  const openRef    = useRef(false);
  const walkingRef = useRef(false);
  const posXRef    = useRef(24);
  const profileRef = useRef(profile);
  const roleRef    = useRef(role);

  useEffect(() => { openRef.current    = open;    }, [open]);
  useEffect(() => { posXRef.current    = posX;    }, [posX]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { roleRef.current    = role;    }, [role]);

  // Sincronizar greeting cuando cambia el perfil o se abre el chat
  useEffect(() => {
    if (!open) setMessage(getInitialMessage(role, profile));
  }, [profile, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Caminata ──────────────────────────────────────────────────────
  const walkTo = useCallback((targetX, stayMs = 4000) => {
    if (walkingRef.current) return;
    walkingRef.current = true;

    const goingLeft = targetX > posXRef.current;
    setFacing(goingLeft ? 1 : -1);
    setState('walk');
    setPosX(targetX);

    setTimeout(() => {
      setState('idle');
      setTimeout(() => {
        setFacing(-1);
        setState('walk');
        setPosX(24);
        setTimeout(() => {
          setState('idle');
          setFacing(1);
          walkingRef.current = false;
        }, 2200);
      }, stayMs);
    }, 2200);
  }, [setState]);

  // ── Scheduler: caminata ───────────────────────────────────────────
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!openRef.current && !walkingRef.current) {
          const maxTravel = Math.min(window.innerWidth * 0.38, 260);
          const target    = 40 + Math.random() * maxTravel;
          const stayMs    = 3000 + Math.random() * 5000;
          walkTo(target, stayMs);
        }
        schedule();
      }, 35000 + Math.random() * 40000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [walkTo]);

  // ── Scheduler: expresiones + tips inteligentes ────────────────────
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!openRef.current && !walkingRef.current) {
          if (Math.random() < 0.4) {
            const allTips = buildSmartTips(profileRef.current);
            setTip(allTips[Math.floor(Math.random() * allTips.length)]);
            setTimeout(() => setTip(null), 5500);
          }
          playOnce(pickWeighted(IDLE_EVENTS).action, 'idle');
        }
        schedule();
      }, 18000 + Math.random() * 22000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [playOnce]);

  // ── Reaccionar a exerciseCompleted ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { xp = 0, leveledUp, newLevel } = e.detail || {};
      if (leveledUp && newLevel) {
        // level up: celebración
        setTip(null);
        playOnce('dance', 'idle');
        setTimeout(() => {
          setTip(`🎉 ¡NIVEL ${newLevel} ALCANZADO! ¡Eres imparable, héroe!`);
          setTimeout(() => setTip(null), 6000);
        }, 600);
      } else if (xp > 0) {
        playOnce('happy', 'idle');
        setTip(`⚡ +${xp} XP ganados. ¡Buen trabajo!`);
        setTimeout(() => setTip(null), 4000);
      }
    };
    window.addEventListener('exerciseCompleted', handler);
    return () => window.removeEventListener('exerciseCompleted', handler);
  }, [playOnce]);

  // ── Reaccionar a levelUp (fallback) ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { level, newLevel } = e.detail || {};
      const lv = newLevel ?? level;
      if (!lv) return;
      playOnce('dance', 'idle');
      setTip(`🎉 ¡NIVEL ${lv}! ¡Sigue así, campeón!`);
      setTimeout(() => setTip(null), 6000);
    };
    window.addEventListener('levelUp', handler);
    return () => window.removeEventListener('levelUp', handler);
  }, [playOnce]);

  // ── Navegación y acciones especiales ─────────────────────────────
  const handleOption = useCallback((id) => {
    if (id === '__logout') {
      setOpen(false);
      playOnce('wave', 'idle');
      onLogout?.();
      return;
    }
    if (id.startsWith('__nav_')) {
      const section = id.replace('__nav_', '');
      window.dispatchEvent(new CustomEvent('flexNavigate', { detail: { section } }));
      playOnce('happy', 'idle');
      setOpen(false);
      return;
    }
    setState('thinking');
    setTimeout(() => {
      const response = getResponse(id, roleRef.current, profileRef.current);
      setMessage(response);
      playOnce(response.state ?? 'talking', 'idle');
    }, 400);
  }, [setState, playOnce, onLogout]);

  // ── Click en el avatar ────────────────────────────────────────────
  const handleAvatarClick = useCallback(() => {
    setTip(null);
    if (!open) {
      setOpen(true);
      playOnce('wave', 'idle');
      setMessage(getInitialMessage(roleRef.current, profileRef.current));
    } else {
      setOpen(false);
      setState('idle');
    }
  }, [open, playOnce, setState]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setState('idle');
  }, [setState]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="avatar-widget-root" style={{ right: posX }}>

      {tip && !open && (
        <div className="avatar-tip-bubble">
          <button className="avatar-tip-close" onClick={() => setTip(null)}>×</button>
          {tip}
        </div>
      )}

      {open && (
        <ChatBubble
          message={message}
          onOption={handleOption}
          onClose={handleClose}
        />
      )}

      <div className={`avatar-container ${open ? 'open' : ''}`}>
        <div style={{ transform: `scaleX(${facing})`, transformOrigin: 'center bottom' }}>
          <AvatarSprite
            state={state}
            frame={frame}
            onClick={handleAvatarClick}
            skin={skin}
          />
        </div>

        {!open && !tip && (
          <div className="avatar-hint">¿Necesitas ayuda?</div>
        )}
      </div>
    </div>
  );
}
