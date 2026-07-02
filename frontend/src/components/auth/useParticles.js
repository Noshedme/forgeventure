// src/components/auth/useParticles.js
// ── Canvas hook de partículas pixel — formas variadas + física mejorada ──
import { useEffect } from "react";
import { T } from "../shared/theme";

/**
 * useParticles
 * @param {React.RefObject<HTMLCanvasElement>} ref   — ref del <canvas>
 * @param {Object}  opts
 * @param {number}  opts.count     — cantidad de partículas (default 70)
 * @param {boolean} opts.active    — pausar/reanudar sin desmontar (default true)
 * @param {string}  opts.accentColor — color dominante (default T.orange)
 */
export default function useParticles(ref, {
  count       = 70,
  active      = true,
  accentColor = T.orange,
} = {}) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext("2d");
    let rafId;

    // ── Resize ─────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // ── Paleta de colores con accent personalizable ────────────
    const COLORS = [accentColor, T.blue, T.gold, T.teal, T.white];

    // ── Tipos de forma ─────────────────────────────────────────
    const SHAPES = ["square", "diamond", "cross"];

    // ── Generar partículas ─────────────────────────────────────
    const pts = Array.from({ length: count }, () => {
      const size = Math.random() > 0.7
        ? Math.random() * 4 + 2   // grande
        : Math.random() * 2 + 0.8; // pequeña
      return {
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,         // distribución inicial por todo el canvas
        s:     size,
        vx:    (Math.random() - 0.5) * 0.55,
        vy:    -(Math.random() * 0.7 + 0.15),
        alpha: Math.random() * 0.55 + 0.12,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.022 + 0.008,
        col:   COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        twinkle: Math.random() > 0.6,                // algunas parpadean
        drift:  (Math.random() - 0.5) * 0.6,         // oscilación lateral
      };
    });

    // ── Dibujar una partícula según su forma ──────────────────
    const drawParticle = (p, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.col;

      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      const s = Math.ceil(p.s);

      switch (p.shape) {
        case "diamond":
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
          break;

        case "cross":
          // Cruz pixel de 3x3
          ctx.fillRect(x - s, y,     s * 2 + 1, Math.max(1, s * 0.5));
          ctx.fillRect(x,     y - s, Math.max(1, s * 0.5), s * 2 + 1);
          break;

        default: // "square"
          ctx.fillRect(x, y, s, s);
          break;
      }
    };

    // ── Loop principal ─────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pts.forEach(p => {
        // Física
        p.phase += p.phaseSpeed;
        p.x += p.vx + Math.sin(p.phase * 0.5) * p.drift;
        p.y += p.vy;

        // Reset al salir por arriba
        if (p.y < -20) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        // Wrap horizontal
        if (p.x < -10) p.x = canvas.width  + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Alpha: parpadeo suave en las que "twinkle"
        const alpha = p.twinkle
          ? p.alpha * (0.5 + 0.5 * Math.sin(p.phase))
          : p.alpha;

        // Fade out al acercarse al top
        const fadeTop = p.y < 80 ? Math.max(0, p.y / 80) : 1;

        // Glow: halo borroso justo en partículas grandes
        if (p.s > 2.5) {
          ctx.save();
          ctx.shadowBlur  = p.s * 3;
          ctx.shadowColor = p.col;
          drawParticle(p, alpha * fadeTop * 0.6);
          ctx.restore();
        }

        drawParticle(p, alpha * fadeTop);
      });

      rafId = requestAnimationFrame(draw);
    };

    draw();

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [ref, active, accentColor, count]);
}