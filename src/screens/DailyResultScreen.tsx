import { useState } from "react";
import type { PlayerClass } from "../types";
import { DAILY_MODIFIERS, getDailyModifier } from "../daily";

export default function DailyResultScreen({ player, score, floorsCleared, totalTurns, totalDamageDealt, hpRemaining, won, seed, modifierId, onBack }: {
  player: PlayerClass;
  score: number;
  floorsCleared: number;
  totalTurns: number;
  totalDamageDealt: number;
  hpRemaining: number;
  won: boolean;
  seed: number;
  modifierId: string;
  onBack: () => void;
}) {
  const [shared, setShared] = useState(false);
  const modifier = DAILY_MODIFIERS.find(m => m.id === modifierId) ?? getDailyModifier(seed);
  const launchDate = new Date("2026-03-17");
  const seedDate = seed > 0
    ? new Date(Math.floor(seed / 10000), Math.floor(seed / 100) % 100 - 1, seed % 100)
    : new Date();
  const dayNum = Math.max(1, Math.floor((seedDate.getTime() - launchDate.getTime()) / 86400000) + 1);

  const stars = won ? "\u2B50\u2B50\u2B50" : floorsCleared >= 10 ? "\u2B50\u2B50" : floorsCleared >= 5 ? "\u2B50" : "";

  const shareText = [
    `Corporate Climb Daily #${dayNum} ${stars}`,
    `${modifier.icon} ${modifier.name}`,
    `${player.emoji} ${player.name} | Floor ${floorsCleared}/15`,
    `\u26A1 ${totalTurns} turns | \uD83D\uDCA5 ${totalDamageDealt.toLocaleString()} dmg`,
    `\uD83C\uDFC6 Score: ${score.toLocaleString()}`,
    `corporateclimb.vercel.app`,
  ].join("\n");

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); setShared(true); } catch { /* share cancelled or unavailable */ }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 14, padding: 20,
      background: won
        ? "linear-gradient(180deg, #FF6F00 0%, #FFA000 30%, #FFC107 60%, #FFD54F 100%)"
        : "linear-gradient(180deg, #263238 0%, #37474F 50%, #455A64 100%)",
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: won ? "#263238" : "#FFD54F",
        letterSpacing: 3,
      }}>
        DAILY #{dayNum} {won ? "CLEARED" : "FAILED"}
      </div>

      <div style={{ fontSize: 28 }}>{modifier.icon}</div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: won ? "#E65100" : "#FF6F00",
      }}>
        {modifier.name.toUpperCase()}
      </div>

      {/* Score card */}
      <div style={{
        background: "rgba(0,0,0,0.85)", borderRadius: 12, padding: "14px 18px",
        maxWidth: 300, width: "100%", border: "3px solid #FF6F00",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 24, color: "#FFD54F",
          textAlign: "center",
        }}>
          {score.toLocaleString()}
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
          fontFamily: "'Press Start 2P'", fontSize: 7,
        }}>
          <div style={{ color: "#90A4AE" }}>CLASS</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{player.emoji} {player.name}</div>
          <div style={{ color: "#90A4AE" }}>FLOORS</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{floorsCleared}/15</div>
          <div style={{ color: "#90A4AE" }}>TURNS</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{totalTurns}</div>
          <div style={{ color: "#90A4AE" }}>DAMAGE</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{totalDamageDealt.toLocaleString()}</div>
          <div style={{ color: "#90A4AE" }}>HP LEFT</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{hpRemaining}</div>
        </div>
      </div>

      <button
        onClick={handleShare}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 9, padding: "12px 24px",
          background: shared ? "#43A047" : "#FF6F00", color: "#FFF",
          border: "3px solid #263238", borderRadius: 8,
          cursor: "pointer", boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        {shared ? "COPIED!" : "SHARE RESULT"}
      </button>

      <button
        onClick={onBack}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 9, padding: "10px 24px",
          background: "#263238", border: "3px solid #263238", borderRadius: 8,
          cursor: "pointer", color: "#FFC107", boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        BACK TO TITLE
      </button>
    </div>
  );
}
