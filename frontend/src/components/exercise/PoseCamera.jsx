// ─────────────────────────────────────────────────────────────────────────────
//  PoseCamera.jsx  —  Cámara + detección de pose + validación de técnica
//
//  • Singleton de MediaPipe Pose (el WASM no puede reinicializarse — ver nota)
//  • World landmarks 3D para ángulos más precisos, 2D solo para dibujar
//  • Validación de forma por ejercicio: detecta errores de técnica en tiempo real
//  • Calidad por rep: buena 💚 / advertencia 🟡 / error 🔴
//  • Anti-doble-conteo: MIN_REP_MS entre reps
//  • Suavizado SMOOTH_N frames en el ángulo principal
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from "react";
import { SKELETON_CONNECTIONS, getExerciseDetector, LM } from "./exerciseLogic";

// ── CDN: carga los scripts fuera de Vite para que el WASM no se rompa ─────────
const POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
const CAM_CDN  = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    document.head.appendChild(s);
  });
}

// ── Singleton de Pose (WASM solo se inicializa UNA vez por sesión) ─────────────
let _poseInitPromise = null;
let _poseInstance    = null;

async function getPose() {
  if (_poseInitPromise) return _poseInitPromise;
  _poseInitPromise = (async () => {
    await Promise.all([
      loadScript(`${POSE_CDN}/pose.js`),
      loadScript(`${CAM_CDN}/camera_utils.js`),
    ]);
    const PoseClass = window.Pose;
    if (!PoseClass) throw new Error("window.Pose no disponible");
    const pose = new PoseClass({ locateFile: (f) => `${POSE_CDN}/${f}` });
    pose.setOptions({
      modelComplexity:        2,     // modelo máximo — mayor precisión en oclusiones parciales
      smoothLandmarks:        true,
      enableSegmentation:     false,
      smoothSegmentation:     false,
      minDetectionConfidence: 0.4,   // relajado — tolera oclusiones parciales
      minTrackingConfidence:  0.4,
    });
    await pose.initialize();
    _poseInstance = pose;
    return pose;
  })().catch((err) => { _poseInitPromise = null; throw err; });
  return _poseInitPromise;
}

// ── Constantes de detección ───────────────────────────────────────────────────
const SMOOTH_N   = 8;     // frames a promediar para suavizar el ángulo
const MIN_VIS    = 0.28;  // umbral relajado — encuadres imperfectos siguen contando
const MIN_REP_MS = 500;   // ms mínimos entre reps (anti-doble-conteo)

// ── Paleta de colores ─────────────────────────────────────────────────────────
const CLR = {
  card: "#0C1826", navy: "#1A3354", orange: "#E85D04",
  blue: "#4CC9F0", green: "#2ecc71", red: "#E74C3C",
  gold: "#FFD700", white: "#F0F4FF", muted: "#5A7A9A",
  skeleton: "rgba(76,201,240,.75)", joint: "rgba(76,201,240,.95)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEVERITY_CLR = { ok: CLR.green, info: CLR.blue, warning: "#FF9F1C", error: CLR.red };
const SEVERITY_ICO = { ok: "💚", info: "ℹ️", warning: "⚠️", error: "🔴" };

// ─────────────────────────────────────────────────────────────────────────────
export default function PoseCamera({ ejercicio, targetReps, onRepsChange, onError }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const camRef    = useRef(null);

  // Estado mutable en ref (evita stale-closures en callback de Pose)
  const stateRef    = useRef({ reps: 0, phase: "up", lastAngle: 0 });
  const anglesBuf   = useRef([]);
  const lastRepRef  = useRef(0);
  const formIssueRef= useRef(null);  // último issue de forma durante DOWN phase
  // Hold mode refs
  const holdStartRef = useRef(null);  // timestamp del último frame donde positionCheck fue ok
  const holdAccumRef = useRef(0);     // segundos acumulados de hold correcto
  const holdDoneRef  = useRef(false); // true cuando el hold ya se completó

  // Stats de calidad por sesión
  const qualityRef  = useRef({ good: 0, warned: 0, error: 0 });

  // Callbacks en ref → no necesitan re-registrar el singleton
  const onRepsRef   = useRef(onRepsChange);
  useEffect(() => { onRepsRef.current = onRepsChange; }, [onRepsChange]);
  const onErrorRef  = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  const onResultsRef = useRef(null);  // apunta al handler actual (ver abajo)

  const [status,      setStatus]      = useState("loading");
  const [reps,        setReps]        = useState(0);
  const [phase,       setPhase]       = useState("up");
  const [angle,       setAngle]       = useState(0);
  const [feedback,    setFeedback]    = useState("");
  const [formMsg,     setFormMsg]     = useState(null);  // { msg, severity }
  const [noBody,      setNoBody]      = useState(false);
  const [quality,     setQuality]     = useState({ good: 0, warned: 0, error: 0 });
  // Hold mode (yoga / estiramientos)
  const [holdSec, setHoldSec] = useState(0);
  const [holdOk,  setHoldOk]  = useState(false);

  const detector    = getExerciseDetector(ejercicio?.nombre);
  const isHoldMode  = detector?.holdMode === true;
  const holdTarget  = isHoldMode ? (ejercicio?.holdTargetSec ?? detector?.holdTargetSec ?? 30) : 0;

  // ── Dibujo del esqueleto mejorado ────────────────────────────────────────────
  const drawFrame = useCallback((ctx, landmarks, w, h, det, currentFormIssue) => {
    ctx.clearRect(0, 0, w, h);
    const px  = (lm) => ({ x: (1 - lm.x) * w, y: lm.y * h });
    const vis = (lm) => (lm.visibility ?? 1) > 0.25;
    const glow   = (c, b=8)  => { ctx.shadowBlur=b; ctx.shadowColor=c; };
    const noGlow = ()        => { ctx.shadowBlur=0; };

    // Fase → colores dinámicos
    const phase      = stateRef.current.phase;
    const phaseColor = phase === "down" ? CLR.red : CLR.green;
    const hasError   = currentFormIssue?.severity === "error";
    const hasWarn    = currentFormIssue?.severity === "warning";

    // Conexiones por grupo con color propio
    const GROUPS = [
      // [índices, color, grosor]
      [[LM.LEFT_SHOULDER,  LM.LEFT_ELBOW],    "#4CC9F0", 3.5],
      [[LM.LEFT_ELBOW,     LM.LEFT_WRIST],    "#4CC9F0", 2.8],
      [[LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],   "#4CC9F0", 3.5],
      [[LM.RIGHT_ELBOW,    LM.RIGHT_WRIST],   "#4CC9F0", 2.8],
      [[LM.LEFT_SHOULDER,  LM.RIGHT_SHOULDER],"#F0F4FF", 3.0],
      [[LM.LEFT_SHOULDER,  LM.LEFT_HIP],      "#F0F4FF", 3.0],
      [[LM.RIGHT_SHOULDER, LM.RIGHT_HIP],     "#F0F4FF", 3.0],
      [[LM.LEFT_HIP,       LM.RIGHT_HIP],     "#F0F4FF", 3.0],
      [[LM.LEFT_HIP,       LM.LEFT_KNEE],     phase==="down"?"#E85D04":"#2ecc71", 3.8],
      [[LM.LEFT_KNEE,      LM.LEFT_ANKLE],    phase==="down"?"#E85D04":"#2ecc71", 3.0],
      [[LM.RIGHT_HIP,      LM.RIGHT_KNEE],    phase==="down"?"#E85D04":"#2ecc71", 3.8],
      [[LM.RIGHT_KNEE,     LM.RIGHT_ANKLE],   phase==="down"?"#E85D04":"#2ecc71", 3.0],
      [[LM.LEFT_ANKLE,     LM.LEFT_HEEL],     "#5A7A9A", 2.0],
      [[LM.LEFT_HEEL,      LM.LEFT_FOOT],     "#5A7A9A", 2.0],
      [[LM.RIGHT_ANKLE,    LM.RIGHT_HEEL],    "#5A7A9A", 2.0],
      [[LM.RIGHT_HEEL,     LM.RIGHT_FOOT],    "#5A7A9A", 2.0],
    ];

    // Si hay error/warning sobreescribir todos los colores al color de alerta
    const alertColor =
      hasError ? "rgba(231,76,60,.9)" :
      hasWarn  ? "rgba(255,159,28,.9)" : null;

    ctx.lineCap = "round";
    GROUPS.forEach(([[i, j], clr, lw]) => {
      const a = landmarks[i], b = landmarks[j];
      if (!a || !b || !vis(a) || !vis(b)) return;
      const pa = px(a), pb = px(b);
      const color = alertColor || clr;
      glow(color, 6);
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      noGlow();
    });

    // Joints — coloreados por zona
    const JOINT_COLORS = {
      [LM.LEFT_SHOULDER]:  "#4CC9F0", [LM.RIGHT_SHOULDER]: "#4CC9F0",
      [LM.LEFT_ELBOW]:     "#4CC9F0", [LM.RIGHT_ELBOW]:    "#4CC9F0",
      [LM.LEFT_WRIST]:     "#4CC9F0", [LM.RIGHT_WRIST]:    "#4CC9F0",
      [LM.LEFT_HIP]:       "#F0F4FF", [LM.RIGHT_HIP]:      "#F0F4FF",
      [LM.LEFT_KNEE]:      phase==="down"?"#E85D04":"#2ecc71",
      [LM.RIGHT_KNEE]:     phase==="down"?"#E85D04":"#2ecc71",
      [LM.LEFT_ANKLE]:     "#5A9AB8", [LM.RIGHT_ANKLE]:    "#5A9AB8",
    };
    landmarks.forEach((lm, idx) => {
      if (!vis(lm)) return;
      const p = px(lm);
      const jc = alertColor || JOINT_COLORS[idx] || "rgba(240,244,255,.7)";
      const r  = JOINT_COLORS[idx] ? 5 : 3;
      glow(jc, 5);
      ctx.fillStyle = jc;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      noGlow();
    });

    if (!det) return;

    // Joints activos del ejercicio — anillo + relleno pulsante
    det.getHighlightJoints().forEach((idx) => {
      const lm = landmarks[idx];
      if (!lm || !vis(lm)) return;
      const p = px(lm);
      glow(phaseColor, 18);
      ctx.strokeStyle = phaseColor; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = phaseColor + "30";
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = phaseColor;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5,  0, Math.PI * 2); ctx.fill();
      noGlow();
    });

    // Guías del ángulo + arco visual
    const [li, lc, lr] = det.leftJoints;
    const la = landmarks[li], lb = landmarks[lc], lr2 = landmarks[lr];
    if (la && lb && lr2 && vis(la) && vis(lb) && vis(lr2)) {
      const pa2 = px(la), pb2 = px(lb), pc2 = px(lr2);
      glow(phaseColor, 5);
      ctx.strokeStyle = phaseColor + "88"; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(pa2.x, pa2.y); ctx.lineTo(pb2.x, pb2.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pb2.x, pb2.y); ctx.lineTo(pc2.x, pc2.y); ctx.stroke();
      ctx.setLineDash([]); noGlow();

      // Arco que muestra el ángulo real
      const a1 = Math.atan2(pa2.y - pb2.y, pa2.x - pb2.x);
      const a2 = Math.atan2(pc2.y - pb2.y, pc2.x - pb2.x);
      let da = a2 - a1;
      while (da >  Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      glow(phaseColor, 8);
      ctx.strokeStyle = phaseColor + "BB"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(pb2.x, pb2.y, 26, a1, a1 + da, da < 0); ctx.stroke();
      noGlow();
    }

    // Etiqueta del ángulo
    const lmLabel = landmarks[det.getAngleLabelJoint()];
    if (lmLabel && vis(lmLabel)) {
      const p   = px(lmLabel);
      const txt = `${Math.round(stateRef.current.lastAngle ?? 0)}°`;
      ctx.font = "bold 14px 'Rajdhani', Arial"; ctx.lineWidth = 4;
      glow(phaseColor, 8);
      ctx.strokeStyle = "#000A18"; ctx.fillStyle = phaseColor;
      ctx.strokeText(txt, p.x + 20, p.y - 14);
      ctx.fillText(txt,   p.x + 20, p.y - 14);
      noGlow();
    }
  }, []);


  // ── Callback de resultados de MediaPipe ────────────────────────────────────
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    if (canvas.width !== (video.videoWidth || 640)) {
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
    }

    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;

    if (!results.poseLandmarks) {
      ctx.clearRect(0, 0, w, h);
      setNoBody(true); return;
    }
    setNoBody(false);

    const lm2D  = results.poseLandmarks;          // 2D pantalla → dibujar
    const lm3D  = results.poseWorldLandmarks;     // 3D metros → detectar
    const lmDet = lm3D || lm2D;
    const det   = detector;

    // Dibuja esqueleto sobre el video
    drawFrame(ctx, lm2D, w, h, det, formIssueRef.current);

    if (!det) return;

    // ── Visibilidad: todos los joints del ejercicio deben ser visibles ────────
    const allExJoints = [...new Set([...det.leftJoints, ...det.rightJoints])];
    const keyOk = allExJoints.every(
      idx => (lm2D[idx]?.visibility ?? 1) >= MIN_VIS
    );
    if (!keyOk) {
      setFeedback("⚠ Asegúrate de que tu cuerpo esté completamente visible en cámara");
      return;
    }

    // ── Hold mode (yoga / estiramientos) — acumula tiempo mientras postura es ok ──
    if (det.holdMode) {
      const posCheck = det.positionCheck?.(lm2D) ?? { ok: true, msg: "" };
      const isGood   = posCheck.ok;
      setHoldOk(isGood);
      const now = Date.now();
      if (isGood) {
        const delta = holdStartRef.current !== null ? (now - holdStartRef.current) / 1000 : 0;
        holdAccumRef.current = Math.min(holdAccumRef.current + delta, holdTarget);
        holdStartRef.current = now;
        setHoldSec(holdAccumRef.current);
        setFeedback(posCheck.msg || "🧘 Mantén la postura");
        const tips = det.evaluateForm?.(lmDet) ?? [];
        const tip  = tips.find(r => r && !r.ok);
        if (tip) setFormMsg({ msg: tip.msg, severity: tip.severity ?? "info" });
        else     setFormMsg(null);
        if (!holdDoneRef.current && holdAccumRef.current >= holdTarget) {
          holdDoneRef.current = true;
          setFeedback("¡Hold completado! 🎉");
          onRepsRef.current?.(1);
        }
      } else {
        holdStartRef.current = null;
        setFeedback("⏸ " + (posCheck.msg ?? "Ajusta la posición"));
        const issue = { msg: posCheck.msg ?? "Ajusta la posición", severity: "warning" };
        setFormMsg(issue);
        formIssueRef.current = issue;
      }
      return; // skip rep state machine
    }

    // ── Verificación de posición corporal (usa coordenadas 2D de pantalla) ───
    // Valida que el usuario esté en la posición correcta para el ejercicio.
    // Si está en posición incorrecta, muestra advertencia y bloquea el conteo.
    if (det.positionCheck) {
      const posOk = det.positionCheck(lm2D);
      if (!posOk.ok) {
        setFeedback("⚠ " + posOk.msg);
        const posIssue = { msg: posOk.msg, severity: "warning" };
        setFormMsg(posIssue);
        formIssueRef.current = posIssue;
        // Si el ángulo disparó DOWN por error, resetear a UP
        if (stateRef.current.phase === "down") {
          stateRef.current.phase = "up";
          setPhase("up");
        }
        return;
      }
    }

    // ── Ángulo suavizado (smoothN específico por ejercicio, default SMOOTH_N) ─
    const smoothN = det.smoothN ?? SMOOTH_N;
    const raw = det.getAngle(lmDet);
    const buf = anglesBuf.current;
    buf.push(raw);
    if (buf.length > smoothN) buf.shift();
    const ang = buf.reduce((s, v) => s + v, 0) / buf.length;

    stateRef.current.lastAngle = ang;
    setAngle(Math.round(ang));

    const st  = stateRef.current;
    const now = Date.now();

    // ── Validación de forma en tiempo real ───────────────────────────────────
    const formResults = det.evaluateForm(lmDet, st.phase);
    const formError   = formResults.find(r => r && !r.ok && r.severity === "error");
    const formWarn    = formResults.find(r => r && !r.ok && r.severity === "warning");
    const formInfo    = formResults.find(r => r && !r.ok && r.severity === "info");
    const formGood    = !formError && !formWarn && !formInfo
      ? formResults.find(r => r?.ok)
      : null;

    const latestIssue = formError || formWarn || formInfo || formGood || null;
    formIssueRef.current = latestIssue;
    if (latestIssue) setFormMsg({ msg: latestIssue.msg, severity: latestIssue.severity ?? "ok" });

    // ── Máquina de estados UP → DOWN → UP ───────────────────────────────────
    if (det.isDown(ang) && st.phase === "up") {
      st.phase = "down";
      setPhase("down");
      setFeedback(det.downCue);
    } else if (det.isUp(ang) && st.phase === "down") {
      st.phase = "up";

      // Anti-doble-conteo
      if (now - lastRepRef.current >= MIN_REP_MS) {
        // Calidad de esta rep
        const hasError = !!formError;
        const hasWarn  = !!formWarn;
        const q = qualityRef.current;

        if (hasError) {
          q.error++;
        } else if (hasWarn) {
          q.warned++;
        } else {
          q.good++;
        }
        st.reps += 1;

        setQuality({ ...q });

        lastRepRef.current = now;
        setReps(st.reps);
        const repFb = hasError
          ? `⚠ Técnica a mejorar — ${formError.msg}`
          : hasWarn
            ? `${det.repCue} · ⚠ ${formWarn.msg}`
            : det.repCue;
        setFeedback(repFb);
        onRepsRef.current?.(st.reps);
      } else {
        setFeedback("Más despacio, controla el movimiento 🐢");
      }
      setPhase("up");
    }
  }, [detector, drawFrame]);

  // Siempre actualizado para el singleton
  useEffect(() => { onResultsRef.current = onResults; }, [onResults]);

  // ── Inicialización del singleton + cámara ──────────────────────────────────
  useEffect(() => {
    stateRef.current    = { reps: 0, phase: "up", lastAngle: 0 };
    anglesBuf.current   = [];
    lastRepRef.current  = 0;
    formIssueRef.current= null;
    qualityRef.current  = { good: 0, warned: 0, error: 0 };
    holdStartRef.current = null;
    holdAccumRef.current = 0;
    holdDoneRef.current  = false;
    setReps(0); setPhase("up"); setFeedback(""); setAngle(0);
    setNoBody(false); setFormMsg(null); setQuality({ good: 0, warned: 0, error: 0 });
    setHoldSec(0); setHoldOk(false);

    if (!detector) { setStatus("no_detector"); return; }

    let cancelled = false;
    setStatus("loading");

    getPose()
      .then((pose) => {
        if (cancelled) return;
        // Wrapper estable: siempre llama al handler más reciente
        pose.onResults((r) => { if (!cancelled) onResultsRef.current?.(r); });
        setStatus("ready");
        if (!videoRef.current) return;
        const cam = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (!cancelled && pose && videoRef.current)
              await pose.send({ image: videoRef.current });
          },
          width: 640, height: 480,
        });
        cam.start();
        camRef.current = cam;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("MediaPipe init error:", err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
      camRef.current?.stop();
      camRef.current = null;
      // ⚠ NO se llama pose.close() — el WASM singleton debe mantenerse vivo
    };
  }, [ejercicio?.nombre, detector]);

  // ── Helpers de UI ──────────────────────────────────────────────────────────
  const phaseColor = phase === "down" ? CLR.red : CLR.green;
  const phaseLabel = phase === "down" ? "ABAJO ↓" : "ARRIBA ↑";
  const repPct     = Math.min((reps / (targetReps || 1)) * 100, 100);
  const totalReps  = quality.good + quality.warned + quality.error;
  const qualityPct = totalReps === 0 ? 100 : Math.round((quality.good / totalReps) * 100);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>

      {/* ── Área de cámara ── */}
      <div style={{
        position: "relative", width: "100%", aspectRatio: "4/3",
        background: "#000", overflow: "hidden", border: `2px solid ${CLR.navy}`,
      }}>
        <video ref={videoRef} autoPlay playsInline muted style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", transform: "scaleX(-1)",
        }}/>
        <canvas ref={canvasRef} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none",
        }}/>

        {/* Cargando */}
        {status === "loading" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(5,12,24,.92)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 14,
          }}>
            <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{
              width: 44, height: 44, border: `4px solid ${CLR.navy}`,
              borderTop: `4px solid ${CLR.blue}`, borderRadius: "50%",
              animation: "_spin .9s linear infinite",
            }}/>
            <div style={{ color: CLR.blue, fontSize: 12, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700 }}>
              Cargando modelo de IA…
            </div>
          </div>
        )}

        {/* Sin detector */}
        {status === "no_detector" && (
          <Overlay icon="🤖" title="Sin detector configurado"
            msg="Este ejercicio usa conteo manual."
            btnLabel="Ir a modo manual" onBtn={() => onErrorRef.current?.()}
            color={CLR.gold}/>
        )}

        {/* Error */}
        {status === "error" && (
          <Overlay icon="📵" title="Error de cámara"
            msg="Verifica los permisos de cámara en el navegador."
            btnLabel="Usar modo manual" onBtn={() => onErrorRef.current?.()}
            color={CLR.red}/>
        )}

        {/* Sin cuerpo */}
        {status === "ready" && noBody && (
          <div style={{
            position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,.78)", border: `1px solid ${CLR.red}66`,
            padding: "4px 14px", color: CLR.red,
            fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap",
          }}>⚠ Colócate frente a la cámara</div>
        )}

        {/* Badge fase / hold */}
        {status === "ready" && !noBody && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: (isHoldMode ? (holdOk ? CLR.green : "#FF9F1C") : phaseColor) + "22",
            border: `1px solid ${(isHoldMode ? (holdOk ? CLR.green : "#FF9F1C") : phaseColor)}88`,
            padding: "4px 12px",
            color: isHoldMode ? (holdOk ? CLR.green : "#FF9F1C") : phaseColor,
            fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 11,
          }}>
            {isHoldMode ? (holdOk ? "HOLD ✓" : "AJUSTANDO") : phaseLabel}
          </div>
        )}

        {/* Badge ángulo / hold-time */}
        {status === "ready" && !noBody && detector && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(0,0,0,.72)", border: `1px solid ${CLR.navy}`,
            padding: "4px 10px", fontFamily: "'Rajdhani',sans-serif",
            fontWeight: 600, fontSize: 11, color: CLR.blue,
          }}>
            {isHoldMode
              ? <>{Math.floor(holdSec)}<span style={{ color: CLR.white, fontWeight: 700 }}>s</span> hold</>
              : <>{detector.angleLabel}: <span style={{ color: CLR.white, fontWeight: 700 }}>{angle}°</span></>
            }
          </div>
        )}

        {/* Badge calidad (rep mode only) */}
        {status === "ready" && !isHoldMode && totalReps > 0 && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,.72)",
            padding: "4px 10px", fontFamily: "'Rajdhani',sans-serif",
            fontWeight: 700, fontSize: 11,
            color: qualityPct >= 80 ? CLR.green : qualityPct >= 50 ? "#FF9F1C" : CLR.red,
          }}>
            Calidad: {qualityPct}%
          </div>
        )}
      </div>

      {/* ── Feedback de forma (mensaje en tiempo real) ── */}
      {formMsg && status === "ready" && !noBody && (
        <div style={{
          padding: "8px 14px",
          background: (SEVERITY_CLR[formMsg.severity] ?? CLR.blue) + "18",
          border: `1px solid ${(SEVERITY_CLR[formMsg.severity] ?? CLR.blue)}44`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>{SEVERITY_ICO[formMsg.severity] ?? "ℹ️"}</span>
          <span style={{
            fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 12,
            color: SEVERITY_CLR[formMsg.severity] ?? CLR.blue,
          }}>
            {formMsg.msg}
          </span>
        </div>
      )}

      {/* ── Panel de conteo + fase (rep mode) ── */}
      {!isHoldMode && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
          {/* Rep counter */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Orbitron',sans-serif", fontWeight: 900, fontSize: 52,
              color: CLR.gold, lineHeight: 1, textShadow: `0 0 30px ${CLR.gold}88`,
            }}>{reps}</div>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
              fontSize: 13, color: CLR.muted, marginTop: 2,
            }}>de {targetReps} reps</div>
            <div style={{ marginTop: 6, height: 6, background: CLR.navy, border: `1px solid ${CLR.gold}22`, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${repPct}%`,
                background: `linear-gradient(90deg,#E85D04,${CLR.gold})`,
                transition: "width .4s ease", boxShadow: `0 0 8px ${CLR.gold}66`,
              }}/>
            </div>
            {feedback && (
              <div style={{
                marginTop: 6, fontFamily: "'Rajdhani',sans-serif",
                fontWeight: 600, fontSize: 11, color: CLR.muted,
                minHeight: 16, lineHeight: 1.3,
              }}>{feedback}</div>
            )}
          </div>

          {/* Panel fase */}
          <div style={{
            minWidth: 115, background: CLR.card, border: `1px solid ${phaseColor}33`,
            padding: "10px 12px", textAlign: "center",
          }}>
            <div style={{
              width: 13, height: 13, borderRadius: "50%",
              background: phaseColor, margin: "0 auto 5px",
              boxShadow: `0 0 10px ${phaseColor}`,
            }}/>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
              fontSize: 11, color: phaseColor, marginBottom: 4,
            }}>{phaseLabel}</div>
            {totalReps > 0 && (
              <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                {quality.good   > 0 && <span style={{ fontSize: 10, color: CLR.green   }}>💚{quality.good}</span>}
                {quality.warned > 0 && <span style={{ fontSize: 10, color: "#FF9F1C"   }}>⚠{quality.warned}</span>}
                {quality.error  > 0 && <span style={{ fontSize: 10, color: CLR.red     }}>🔴{quality.error}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Panel de hold (yoga / estiramientos) ── */}
      {isHoldMode && (
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center", padding: "4px 0" }}>
          {/* Anillo ascendente */}
          <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
            <svg viewBox="0 0 84 84" style={{ width: "100%", height: "100%", display: "block", transform: "rotate(-90deg)" }}>
              <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7"/>
              <circle
                cx="42" cy="42" r="34" fill="none"
                stroke={holdOk ? CLR.green : "#FF9F1C"}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(holdSec / (holdTarget || 1), 1))}
                style={{ transition: "stroke-dashoffset .3s ease-out, stroke .2s" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 15,
                fontWeight: 900, color: holdOk ? CLR.green : "#FF9F1C", lineHeight: 1,
              }}>
                {Math.floor(holdSec)}s
              </span>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: CLR.muted }}>
                / {holdTarget}s
              </span>
            </div>
          </div>

          {/* Info */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'Rajdhani',sans-serif", fontWeight: 800,
              fontSize: 13, color: holdOk ? CLR.green : "#FF9F1C", marginBottom: 6,
            }}>
              {holdOk ? "Mantén la postura" : "Ajusta la posición"}
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,.06)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min((holdSec / (holdTarget || 1)) * 100, 100)}%`,
                background: holdOk
                  ? `linear-gradient(90deg,${CLR.green}88,${CLR.green})`
                  : "linear-gradient(90deg,#FF9F1C88,#FF9F1C)",
                transition: "width .3s ease",
                boxShadow: `0 0 6px ${holdOk ? CLR.green : "#FF9F1C"}88`,
              }}/>
            </div>
            {feedback && (
              <div style={{
                marginTop: 5, fontFamily: "'Rajdhani',sans-serif",
                fontWeight: 600, fontSize: 11, color: CLR.muted, lineHeight: 1.3,
              }}>
                {feedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Instrucción ── */}
      {detector && status === "ready" && (
        <div style={{
          background: `${CLR.blue}0A`, border: `1px solid ${CLR.blue}22`,
          padding: "7px 14px", textAlign: "center",
          fontFamily: "'Rajdhani',sans-serif", fontWeight: 600,
          fontSize: 11, color: CLR.muted,
        }}>
          {isHoldMode
            ? <>IA valida postura en tiempo real •{" "}<span style={{ color: CLR.blue }}>mantén la posición hasta completar el tiempo</span></>
            : <>IA detecta reps · esqueleto en tiempo real •{" "}<span style={{ color: CLR.blue }}>Todas las reps cuentan · ⚠ feedback de técnica en vivo</span></>
          }
        </div>
      )}
    </div>
  );
}

// ── Overlay reutilizable para estados de error/sin-detector ────────────────────
function Overlay({ icon, title, msg, btnLabel, onBtn, color }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "rgba(5,12,24,.92)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 10, padding: 20,
    }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div style={{ color, fontSize: 13, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, textAlign: "center" }}>
        {title}
      </div>
      <div style={{ color: CLR.muted, fontSize: 12, fontFamily: "'Rajdhani',sans-serif", textAlign: "center" }}>
        {msg}
      </div>
      {btnLabel && (
        <button onClick={onBtn} style={{
          marginTop: 8, padding: "8px 20px", background: CLR.navy,
          border: `1px solid ${CLR.orange}55`, color: CLR.orange,
          fontFamily: "'Rajdhani',sans-serif", fontWeight: 700,
          fontSize: 13, cursor: "pointer",
        }}>{btnLabel}</button>
      )}
    </div>
  );
}
