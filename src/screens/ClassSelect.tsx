import { useState } from "react";
import type { PlayerClass } from "../types";
import { PLAYER_CLASSES } from "../data";
import { useSpriteUrls } from "../components/PixelSprite";
import TypeBadge from "../components/TypeBadge";

export default function ClassSelect({ onSelect }: { onSelect: (cls: PlayerClass) => void }) {
  const [selected, setSelected] = useState(0);
  const sprites = useSpriteUrls();
  const cls = PLAYER_CLASSES[selected];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "linear-gradient(180deg, #263238 0%, #37474F 100%)",
      padding: 20, gap: 14,
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 12, color: "#FFD54F",
        textAlign: "center", textShadow: "2px 2px 0 #E65100",
      }}>
        CHOOSE YOUR CLASS
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {PLAYER_CLASSES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelected(i)}
            style={{
              width: 100, padding: "12px 8px",
              background: selected === i ? "#FFF8E1" : "#455A64",
              border: `3px solid ${selected === i ? "#FFC107" : "#546E7A"}`,
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: selected === i ? "4px 4px 0 #263238, inset 0 0 12px rgba(255,193,7,0.15)" : "2px 2px 0 #263238",
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <div className="sprite-idle" style={{ width: 48, height: 48 }}>
              <img src={sprites[c.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
            </div>
            <span style={{
              fontFamily: "'Press Start 2P'", fontSize: 7,
              color: selected === i ? "#263238" : "#B0BEC5",
              textAlign: "center", lineHeight: 1.5,
            }}>
              {c.name}
            </span>
          </button>
        ))}
      </div>

      <div style={{
        background: "#FAFAFA", border: "4px solid #263238", borderRadius: 10,
        padding: 14, boxShadow: "inset 0 0 0 2px #90A4AE, 6px 6px 0 #263238",
        flex: 1, display: "flex", flexDirection: "column", gap: 8, overflow: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <div style={{ width: 40, height: 40 }}>
            <img src={sprites[cls.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
          </div>
          <div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: "#263238" }}>{cls.name}</div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#78909C", marginTop: 4 }}>{cls.desc}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {([
            ["HP", cls.maxHp, "#4CAF50"],
            ["ATK", cls.atk, "#F44336"],
            ["DEF", cls.def, "#2196F3"],
            ["SPD", cls.spd, "#FF9800"],
          ] as const).map(([label, val, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#263238", width: 26 }}>{label}</span>
              <div style={{ flex: 1, height: 7, background: "#E0E0E0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(val / 20) * 100}%`, height: "100%", background: color, borderRadius: 3, maxWidth: "100%" }} />
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#546E7A", width: 24, textAlign: "right" }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#263238", marginTop: 2 }}>MOVES:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {cls.moves.map((m) => (
            <div key={m.name} style={{
              padding: "5px 6px", background: "#F5F5F5", borderRadius: 4,
              border: "1px solid #E0E0E0", display: "flex", flexDirection: "column", gap: 2,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#263238" }}>{m.name}</span>
                <TypeBadge type={m.type} />
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: "#9E9E9E" }}>{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSelect(PLAYER_CLASSES[selected])}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 12, padding: "14px 30px",
          background: "#FFC107", border: "4px solid #263238", borderRadius: 10,
          cursor: "pointer", boxShadow: "6px 6px 0 #263238", color: "#263238",
          alignSelf: "center",
        }}
      >
        CONFIRM
      </button>
    </div>
  );
}
