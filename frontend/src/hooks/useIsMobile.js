// src/hooks/useIsMobile.js
// ─────────────────────────────────────────────────────────────
//  Detecta si el viewport es mobile (≤768px) o tablet (≤1024px)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;
