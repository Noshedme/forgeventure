// src/components/auth/HeroCharacter.jsx
import { useState, useEffect } from "react";
import { T } from "../shared/theme";

export default function HeroCharacter({ scale = 1 }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setF(p => 1 - p), 600);
    return () => clearInterval(t);
  }, []);

  const fr = [{ armY: -2, legL: 2, legR: -2 }, { armY: 2, legL: -2, legR: 2 }][f];

  return (
    <div style={{
      transform: `scale(${scale})`,
      animation: "floatY 3.2s ease-in-out infinite",
      filter: "drop-shadow(0 0 20px #E85D04aa)",
    }}>
      <svg width="100" height="130" viewBox="0 0 100 130" style={{ imageRendering: "pixelated" }}>
        <rect x="35" y="5" width="30" height="5" fill={T.gold} />
        <rect x="30" y="10" width="40" height="5" fill={T.gold} />
        <rect x="30" y="15" width="40" height="25" fill="#FFDAB9" />
        <rect x="38" y="22" width="8" height="6" fill={T.navy} />
        <rect x="54" y="22" width="8" height="6" fill={T.navy} />
        <rect x="40" y="23" width="4" height="4" fill={T.blue} />
        <rect x="56" y="23" width="4" height="4" fill={T.blue} />
        <rect x="32" y="17" width="12" height="3" fill="rgba(255,255,255,0.3)" />
        <rect x="28" y="40" width="44" height="35" fill={T.navy} />
        <rect x="30" y="42" width="40" height="31" fill="#2A4A7F" />
        <rect x="42" y="47" width="16" height="3" fill={T.orange} />
        <rect x="44" y="52" width="12" height="2" fill={T.orangeL} />
        <rect x="46" y="56" width="8" height="8" fill={T.orange} />
        <rect x="15" y="40" width="15" height="12" fill={T.orange} />
        <rect x="70" y="40" width="15" height="12" fill={T.orange} />
        <rect x="14" y="52" width="13" height="22" fill="#2A4A7F" transform={`translate(0,${fr.armY})`} />
        <rect x="73" y="52" width="13" height="22" fill="#2A4A7F" transform={`translate(0,${-fr.armY})`} />
        <rect x="82" y="30" width="4" height="50" fill="#C0C0FF" transform={`translate(0,${-fr.armY})`} />
        <rect x="78" y="52" width="12" height="4" fill={T.gold} transform={`translate(0,${-fr.armY})`} />
        <rect x="83" y="26" width="6" height="8" fill={T.gold} transform={`translate(0,${-fr.armY})`} />
        <rect x="8" y="50" width="12" height="16" fill={T.orange} transform={`translate(0,${fr.armY})`} />
        <rect x="10" y="52" width="8" height="12" fill={T.navy} transform={`translate(0,${fr.armY})`} />
        <rect x="13" y="55" width="2" height="6" fill={T.gold} transform={`translate(0,${fr.armY})`} />
        <rect x="30" y="75" width="17" height="30" fill={T.navy} transform={`translate(0,${fr.legL})`} />
        <rect x="53" y="75" width="17" height="30" fill={T.navy} transform={`translate(0,${fr.legR})`} />
        <rect x="28" y="103" width="21" height="10" fill="#111" transform={`translate(0,${fr.legL})`} />
        <rect x="51" y="103" width="21" height="10" fill="#111" transform={`translate(0,${fr.legR})`} />
        <ellipse cx="50" cy="120" rx="30" ry="6" fill={T.orange} opacity="0.15" />
      </svg>
    </div>
  );
}