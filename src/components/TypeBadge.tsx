import { TYPE_COLORS, TYPE_LABELS } from "../data";

export default function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      fontFamily: "'Press Start 2P'", fontSize: 7, padding: "2px 6px",
      background: TYPE_COLORS[type] || TYPE_COLORS.normal,
      color: "#fff", borderRadius: 3, letterSpacing: 1,
    }}>
      {TYPE_LABELS[type] || "NORM"}
    </span>
  );
}
