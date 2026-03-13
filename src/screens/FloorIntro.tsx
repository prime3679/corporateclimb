import { useState, useEffect } from "react";
import type { Enemy } from "../types";
import { TYPE_COLORS, TYPE_LABELS } from "../data";
import { useSpriteUrls } from "../components/PixelSprite";

const TOTAL_FLOORS = 10;

const FLOOR_LABELS: Record<number, string> = {
  0: "Lobby",
  1: "Mailroom",
  2: "Cubicle Farm",
  3: "Open Office",
  4: "Team Lead",
  5: "Manager Suite",
  6: "Director Floor",
  7: "VP Wing",
  8: "C-Suite",
  9: "Boardroom",
};

export default function FloorIntro({ enemy, floor, onReady }: { enemy: Enemy; floor: number; onReady: () => void }) {
  const [show, setShow] = useState(false);
  const sprites = useSpriteUrls();

  useEffect(() => {
    setTimeout(() => setShow(true), 200);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 16, padding: 20,
      background: "#0D0D0D",
      cursor: "pointer",
    }} onClick={onReady}>
      {/* Progress ladder */}
      <div style={{
        display: "flex", alignItems: "center", gap: 3,
        width: "100%", maxWidth: 320, padding: "0 8px",
        opacity: show ? 1 : 0,
        transition: "opacity 0.6s ease 0.1s",
      }}>
        {Array.from({ length: TOTAL_FLOORS }, (_, i) => {
          const isCurrent = i === floor;
          const isComplete = i < floor;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: "100%", height: 6,
                borderRadius: 3,
                background: isComplete ? "#4CAF50" : isCurrent ? "#FFC107" : "#333",
                boxShadow: isCurrent ? "0 0 8px #FFC107" : "none",
                transition: "all 0.3s ease",
              }} />
              {isCurrent && (
                <div style={{
                  fontFamily: "'Press Start 2P'", fontSize: 4, color: "#FFC107",
                  whiteSpace: "nowrap",
                }}>
                  {i + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floor label */}
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#78909C",
        letterSpacing: 2,
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease 0.2s",
      }}>
        {FLOOR_LABELS[floor] || `Floor ${floor + 1}`}
      </div>

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
