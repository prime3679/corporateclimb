import { useState } from "react";
import type { HallwayEvent } from "../types";

export default function RouteChoice({ options, onPick }: {
  options: [HallwayEvent, HallwayEvent];
  onPick: (event: HallwayEvent) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 16, padding: 20,
      background: "linear-gradient(180deg, #1A237E 0%, #263238 100%)",
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#FFD54F",
        textShadow: "2px 2px 0 #E65100", textAlign: "center",
        letterSpacing: 2,
      }}>
        CHOOSE YOUR PATH
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#78909C",
        textAlign: "center",
      }}>
        Two opportunities ahead...
      </div>

      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 380 }}>
        {options.map((evt, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <button
              key={evt.id}
              onClick={() => onPick(evt)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                padding: "18px 12px",
                background: isHovered ? "#37474F" : "#263238",
                border: `3px solid ${isHovered ? "#FFC107" : "#455A64"}`,
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isHovered ? "0 0 16px rgba(255,193,7,0.3)" : "4px 4px 0 #000",
                transform: isHovered ? "translateY(-2px)" : "none",
              }}
            >
              <span style={{ fontSize: 32 }}>{evt.emoji}</span>
              <span style={{
                fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFD54F",
                textAlign: "center", lineHeight: 1.6,
              }}>
                {evt.title}
              </span>
              <span style={{
                fontFamily: "'Press Start 2P'", fontSize: 6, color: "#90A4AE",
                textAlign: "center", lineHeight: 1.8,
              }}>
                {evt.desc.length > 60 ? evt.desc.slice(0, 57) + "..." : evt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
