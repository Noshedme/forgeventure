// src/components/shared/theme.js
export const T = {
  bg: "#060D1A",
  bgCard: "#0D1B2E",
  bgPanel: "#0A1628",
  navy: "#1E3A5F",
  orange: "#E85D04",
  orangeL: "#FF9F1C",
  gold: "#FFD700",
  blue: "#4CC9F0",
  teal: "#0A9396",
  white: "#F0F4FF",
  muted: "#6B8CAE",
  error: "#E74C3C",
  success: "#2ecc71",
};

export const px = (s) => ({ fontFamily: "'Press Start 2P'", fontSize: s });
export const raj = (s, w = 600) => ({ fontFamily: "'Rajdhani', sans-serif", fontSize: s, fontWeight: w });
export const orb = (s, w = 700) => ({ fontFamily: "'Orbitron', sans-serif", fontSize: s, fontWeight: w });

export const CLASSES = [
  { icon: "⚔️", name: "GUERRERO", bonus: "+25% XP en fuerza",      color: T.orange,  bg: "#E85D0411" },
  { icon: "🏃", name: "ARQUERO",   bonus: "+25% XP en cardio",     color: T.blue,    bg: "#4CC9F011" },
  { icon: "🧘", name: "MAGO",     bonus: "+25% XP en flexibilidad",color: "#9B59B6", bg: "#9B59B611" },
];