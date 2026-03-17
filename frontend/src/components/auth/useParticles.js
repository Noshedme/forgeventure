// src/components/auth/useParticles.js
import { useEffect } from "react";
import { T } from "../shared/theme";

export default function useParticles(ref) {
  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const ctx = c.getContext("2d");
    let id;

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      s: Math.random() * 2.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 0.7 - 0.2,
      o: Math.random() * 0.5 + 0.12,
      p: Math.random() * Math.PI * 2,
      col: Math.random() > 0.6 ? "#E85D04" : Math.random() > 0.5 ? "#4CC9F0" : "#FFD700",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.p += 0.028;
        const o = p.o * (0.6 + 0.4 * Math.sin(p.p));
        if (p.y < -10) {
          p.y = c.height + 10;
          p.x = Math.random() * c.width;
        }
        ctx.globalAlpha = o;
        ctx.fillStyle = p.col;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.s), Math.ceil(p.s));
      });
      id = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", resize);
    };
  }, [ref]);
}