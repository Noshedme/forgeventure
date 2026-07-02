import { useState, useEffect } from "react";

const THEME_PRESETS = {
  "wine-aurora":  { bg0:"#0B0510", card:"#130820", border:"#2D1250", gold:"#FFC857", blue:"#4CC9F0", purple:"#7C3AED", green:"#22C55E", text:"#E2D9F3", muted:"#8B72BE", accent:"#C9184A" },
  "cyber-neon":   { bg0:"#050514", card:"#0A0A1E", border:"#1A1A4E", gold:"#FFE600", blue:"#7B2FFF", purple:"#FF00FF", green:"#00FF88", text:"#E0F0FF", muted:"#6080A0", accent:"#00F5FF" },
  "forest-druid": { bg0:"#040D08", card:"#081510", border:"#0E2B16", gold:"#A3E635", blue:"#34D399", purple:"#84CC16", green:"#4ADE80", text:"#D1FAE5", muted:"#4B7A5E", accent:"#22C55E" },
  "ocean-abyss":  { bg0:"#020D1A", card:"#041525", border:"#082840", gold:"#F59E0B", blue:"#818CF8", purple:"#6366F1", green:"#22D3EE", text:"#E0F2FE", muted:"#4D7A9A", accent:"#4CC9F0" },
  "sc-admin":     { bg0:"#0A0E1A", card:"#141A2A", border:"#1A3354", gold:"#C9B037", blue:"#5A9FD4", purple:"#8B7BB8", green:"#6B9F6A", text:"#F0F4FF", muted:"#7A8A9E", accent:"#D4A574" },
};

function buildColors(themeId, accent) {
  const t = THEME_PRESETS[themeId] || THEME_PRESETS["sc-admin"];
  const ac = (accent && accent !== "null" && accent !== "") ? accent : (t.accent || "#D4A574");
  return {
    bg:    t.bg0,  side:  t.bg0,  card:  t.card, panel: t.bg0,
    navy:  t.border, navyL: t.border,
    orange: ac, orangeL: ac, gold: t.gold, blue: t.blue,
    teal: "#4A9D8F", green: t.green, red: "#C66B6B",
    purple: t.purple, pink: "#EC4899",
    white: t.text, muted: t.muted, mutedL: t.muted,
  };
}

export function useThemeColors() {
  const [colors, setColors] = useState(() => {
    try {
      const themeId = localStorage.getItem("fv_theme") || "sc-admin";
      const accent  = localStorage.getItem("fv_accent");
      return buildColors(themeId, accent);
    } catch { return buildColors("sc-admin", null); }
  });

  useEffect(() => {
    const handler = () => {
      try {
        const themeId = localStorage.getItem("fv_theme") || "sc-admin";
        const accent  = localStorage.getItem("fv_accent");
        setColors(buildColors(themeId, accent));
      } catch {}
    };
    window.addEventListener("fv-theme-changed", handler);
    return () => window.removeEventListener("fv-theme-changed", handler);
  }, []);

  return colors;
}
