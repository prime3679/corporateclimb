import { useState } from "react";
import type { Move } from "../types";
import { STATUS_DEFS } from "../data";
import TypeBadge from "./TypeBadge";

export default function MoveButton({ move, currentPp, onClick, disabled }: { move: Move; currentPp?: number; onClick: () => void; disabled: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "'Press Start 2P'", fontSize: 9,
        padding: "14px 10px",
        background: disabled ? "#BDBDBD" : hover ? "#FFF3E0" : "#FFFFFF",
        border: `3px solid ${disabled ? "#9E9E9E" : "#263238"}`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        boxShadow: disabled ? "none" : hover ? "3px 3px 0 #263238" : "4px 4px 0 #263238",
        transform: hover && !disabled ? "translate(-1px, -1px)" : "none",
        display: "flex", flexDirection: "column", gap: 4,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ color: "#263238" }}>{move.name}</span>
        <TypeBadge type={move.type} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 7, color: "#78909C" }}>
        <span>PWR {move.dmg}{move.status ? ` ${STATUS_DEFS[move.status.id].icon}` : ""}{move.acc != null && move.acc < 100 ? ` ${move.acc}%` : ""}</span>
        <span>PP {currentPp ?? move.pp}/{move.pp}</span>
      </div>
    </button>
  );
}
