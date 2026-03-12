export default function XpBar({ xp, xpToNext, level }: { xp: number; xpToNext: number; level: number }) {
  const pct = (xp / xpToNext) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#FFD54F" }}>Lv.{level}</span>
      <div style={{ flex: 1, height: 6, background: "#263238", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "linear-gradient(90deg, #42A5F5, #66BB6A)",
          transition: "width 0.8s ease",
          borderRadius: 3,
        }} />
      </div>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#90A4AE" }}>{xp}/{xpToNext}</span>
    </div>
  );
}
