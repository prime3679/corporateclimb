import { useState, useEffect } from "react";
import type { DamagePopup } from "../types";

export default function DamageNumber({ popup }: { popup: DamagePopup }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: popup.x,
        top: popup.y,
        fontFamily: "'Press Start 2P'",
        fontSize: popup.isCrit ? 16 : 12,
        color: popup.isHeal ? "#4CAF50" : popup.isCrit ? "#FFD54F" : "#F44336",
        textShadow: "2px 2px 0 #263238, -1px -1px 0 #263238",
        pointerEvents: "none",
        zIndex: 20,
        animation: "dmg-float 1s ease-out forwards",
      }}
    >
      {popup.isHeal ? "+" : "-"}{popup.value}
      {popup.isCrit && <span style={{ fontSize: 8, display: "block", color: "#FF6F00" }}>CRIT!</span>}
    </div>
  );
}
