import { useState, useEffect } from "react";
import type { Enemy } from "../types";
import { TYPE_COLORS, TYPE_LABELS } from "../data";
import { useSpriteUrls } from "../components/PixelSprite";

export default function FloorIntro({ enemy, onReady }: { enemy: Enemy; onReady: () => void }) {
  const [show, setShow] = useState(false);
  const sprites = useSpriteUrls();

  useEffect(() => {
    setTimeout(() => setShow(true), 200);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 30,
      background: "#0D0D0D",
      cursor: "pointer",
    }} onClick={onReady}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#F44336",
        letterSpacing: 4,
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}>
        FLOOR {enemy.floor}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 14, color: "#FFFFFF",
        textAlign: "center", lineHeight: 1.8,
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.3s",
        textShadow: "2px 2px 0 #F44336",
      }}>
        {enemy.title}
      </div>
      <div style={{
        display: "flex", gap: 6, justifyContent: "center",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.4s",
      }}>
        {enemy.types.map(t => (
          <span key={t} style={{
            fontFamily: "'Press Start 2P'", fontSize: 7, padding: "3px 8px",
            background: TYPE_COLORS[t], color: "#fff", borderRadius: 4,
          }}>{TYPE_LABELS[t]}</span>
        ))}
      </div>
      <div style={{
        width: 96, height: 96,
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
        transform: show ? "scale(1)" : "scale(0.5)",
      }}>
        <img src={sprites[enemy.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#616161",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 1s",
        animation: show ? "pulse 2s infinite" : "none",
      }}>
        TAP TO BATTLE
      </div>
    </div>
  );
}
