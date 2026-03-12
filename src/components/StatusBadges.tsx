import type { StatusInstance } from "../types";
import { STATUS_DEFS } from "../data";

export default function StatusBadges({ statuses }: { statuses: StatusInstance[] }) {
  if (statuses.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
      {statuses.map((s) => {
        const def = STATUS_DEFS[s.id];
        return (
          <span
            key={s.id}
            title={`${def.name} (${def.desc}) - ${s.turnsLeft} turns`}
            style={{
              background: def.color,
              color: "#fff",
              borderRadius: 4,
              padding: "1px 4px",
              fontFamily: "'Press Start 2P'",
              fontSize: 6,
              display: "flex",
              alignItems: "center",
              gap: 2,
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: 9 }}>{def.icon}</span>
            <span>{s.turnsLeft}</span>
          </span>
        );
      })}
    </div>
  );
}
