import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DEFAULT_LINES = [
  "> ABRIENDO EL PORTAL",
  "> SINCRONIZANDO SELLOS",
  "> PREPARANDO LA BITACORA",
  "> ALINEANDO EL CAMINO",
  "> LISTO",
];

export default function AuthPortalLoader({
  onDone,
  title = "ForgeVenture",
  subtitle = "Portal del gremio",
  lines = DEFAULT_LINES,
  progressLabel = "SINTONIZANDO PORTAL",
  storageKey = "fv_booted",
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("boot");
  const [visibleLines, setVisibleLines] = useState([]);
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  useEffect(() => {
    if (reduced || sessionStorage.getItem(storageKey) === "1") {
      onDone();
      return undefined;
    }

    let idx = 0;
    const timer = window.setInterval(() => {
      if (idx < lines.length) {
        setVisibleLines((prev) => [...prev, lines[idx]]);
        idx += 1;
        return;
      }

      window.clearInterval(timer);
      window.setTimeout(() => setPhase("loading"), 180);
    }, 180);

    return () => window.clearInterval(timer);
  }, [lines, onDone, reduced, storageKey]);

  useEffect(() => {
    if (phase !== "loading") return undefined;

    let value = 0;
    const timer = window.setInterval(() => {
      value += Math.random() * 14 + 8;
      if (value >= 100) {
        value = 100;
        window.clearInterval(timer);
        window.setTimeout(() => {
          setPhase("done");
          sessionStorage.setItem(storageKey, "1");
          window.setTimeout(onDone, 360);
        }, 180);
      }
      setProgress(Math.min(value, 100));
    }, 60);

    return () => window.clearInterval(timer);
  }, [onDone, phase, storageKey]);

  return (
    <motion.div
      animate={{ opacity: phase === "done" ? 0 : 1 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "grid",
        placeItems: "center",
        padding: "clamp(18px, 4vw, 36px)",
        background:
          "radial-gradient(circle at 18% 18%, rgba(255,77,94,0.14), transparent 24%)," +
          "radial-gradient(circle at 82% 16%, rgba(123,220,59,0.12), transparent 22%)," +
          "radial-gradient(circle at 55% 84%, rgba(76,201,240,0.16), transparent 24%)," +
          "linear-gradient(180deg, #090713, #06050f 54%, #05040d)",
        pointerEvents: phase === "done" ? "none" : "all",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          background: 'url("/ui/dashboard-particles.png") center / cover no-repeat',
        }}
      />

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          top: "14%",
          right: "-6%",
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: 0.18,
          background: "rgba(76,201,240,0.48)",
        }}
      />
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          left: "-4%",
          bottom: "8%",
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: 0.16,
          background: "rgba(255,77,94,0.52)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          width: "min(560px, 100%)",
          borderRadius: 30,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(135deg, rgba(255,77,94,0.06), rgba(255,255,255,0.04) 38%, rgba(76,201,240,0.07)), rgba(10,9,20,0.86)",
          backdropFilter: "blur(18px)",
          boxShadow:
            "inset 1px 0 0 rgba(255,77,94,0.14), inset 0 -1px 0 rgba(123,220,59,0.1), inset -1px 0 0 rgba(76,201,240,0.14), 0 28px 70px rgba(0,0,0,0.34)",
          padding: "26px clamp(20px, 4vw, 30px)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 12px rgba(255,77,94,0.18), 0 0 18px rgba(76,201,240,0.14)",
                  "0 0 22px rgba(255,77,94,0.24), 0 0 28px rgba(76,201,240,0.18)",
                  "0 0 12px rgba(255,77,94,0.18), 0 0 18px rgba(76,201,240,0.14)",
                ],
              }}
              transition={{ duration: 2.8, repeat: Infinity }}
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(255,77,94,0.08), rgba(255,255,255,0.05) 36%, rgba(76,201,240,0.08)), rgba(9,8,18,0.84)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img src="/logo.png" alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
            </motion.div>

            <div style={{ minWidth: 0 }}>
              <strong
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "clamp(24px, 4vw, 32px)",
                  lineHeight: 1,
                  color: "#f7f2ff",
                }}
              >
                {title}
              </strong>
              <span
                style={{
                  display: "block",
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 13,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "#91a6c8",
                }}
              >
                {subtitle}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              padding: "16px 18px",
              minHeight: 132,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.07)",
              background:
                "linear-gradient(180deg, rgba(7,6,17,0.74), rgba(7,6,17,0.88)), url('/ui/panel-texture.png') center / cover no-repeat",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            {visibleLines.map((line, index) => (
              <motion.div
                key={`${line}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 0.9, x: 0 }}
                transition={{ duration: 0.24, delay: index * 0.03 }}
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: ".04em",
                  color: "#8ed7b3",
                }}
              >
                {line}
              </motion.div>
            ))}
            {phase === "loading" && (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ color: "#f7f2ff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
              >
                _
              </motion.span>
            )}
          </div>

          {phase === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 12,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                    color: "#8f83a7",
                  }}
                >
                  {progressLabel}
                </span>
                <strong
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 14,
                    color: "#f4c15d",
                  }}
                >
                  {Math.round(progress)}%
                </strong>
              </div>

              <div
                style={{
                  height: 14,
                  borderRadius: 999,
                  padding: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(8,8,18,0.78)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.16 }}
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #ff4d5e, #7bdc3b 52%, #4cc9f0)",
                    boxShadow:
                      "0 0 12px rgba(255,77,94,0.22), 0 0 18px rgba(123,220,59,0.16), 0 0 22px rgba(76,201,240,0.2)",
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
