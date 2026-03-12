export default function HpBar({ current, max, label, isEnemy }: { current: number; max: number; label: string; isEnemy?: boolean }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "#48D868" : pct > 20 ? "#F8D030" : "#F85858";
  const lvl = isEnemy ? Math.ceil(max / 25) : "??";

  return (
    <div style={{
      background: "#F8F0D8",
      border: "3px solid #484848",
      borderRadius: 6,
      padding: "6px 10px 6px 10px",
      minWidth: 190,
      position: "relative",
      boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: "#383838", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#585858" }}>
          <span style={{ fontSize: 6, verticalAlign: "top" }}>Lv</span>{lvl}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#F8A800", fontWeight: "bold" }}>HP</span>
        <div style={{
          flex: 1, height: 8, background: "#484848", borderRadius: 4, overflow: "hidden",
          border: "1px solid #383838",
        }}>
          <div style={{
            width: `${pct}%`, height: "100%", background: color,
            transition: "width 0.5s ease, background 0.3s ease",
            borderRadius: 4,
            boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)`,
          }} />
        </div>
      </div>
      <div style={{ textAlign: "right", marginTop: 2 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#383838" }}>
          {Math.max(0, current)}<span style={{ color: "#888", fontSize: 7 }}> / {max}</span>
        </span>
      </div>
    </div>
  );
}
