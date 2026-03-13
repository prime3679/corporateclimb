const DEFEAT_FLAVOR: [number, number, string][] = [
  [1, 3, "HR sends a polite rejection email. Better luck next quarter."],
  [4, 6, "Your badge stops working on Monday. So close to management."],
  [7, 10, "Security escorts you out. You could see the corner office from here."],
];

function getDefeatText(floor: number): string {
  for (const [lo, hi, text] of DEFEAT_FLAVOR) {
    if (floor >= lo && floor <= hi) return text;
  }
  return "The corporate ladder claims another soul.";
}

export default function GameOverScreen({ floor, onRestart }: { floor: number; onRestart: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 24, padding: 30,
      background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 14, color: "#F44336",
        textShadow: "2px 2px 0 #B71C1C",
      }}>
        GAME OVER
      </div>
      <div style={{ fontSize: 64 }}>&#x1F4BC;</div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 9, color: "#90A4AE",
        textAlign: "center", lineHeight: 2.4, maxWidth: 280,
      }}>
        You were eliminated on<br />
        Floor {floor}.
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#78909C",
        textAlign: "center", lineHeight: 2.2, maxWidth: 280,
        fontStyle: "italic",
      }}>
        {getDefeatText(floor)}
      </div>
      <button
        onClick={onRestart}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 11, padding: "14px 30px",
          background: "#FFC107", border: "4px solid #263238", borderRadius: 10,
          cursor: "pointer", boxShadow: "6px 6px 0 #263238", color: "#263238",
        }}
      >
        TRY AGAIN
      </button>
    </div>
  );
}
