import { useState } from "react";
import type { PlayerClass } from "../types";
import { useSpriteUrls } from "../components/PixelSprite";

interface WinScreenProps {
  player: PlayerClass;
  onRestart: () => void;
  onNgPlus: () => void;
  ngLevel: number;
  bestNgLevel: number;
  totalTurns: number;
  totalDamageDealt: number;
  floorsCleared: number;
}

export default function WinScreen({ player, onRestart, onNgPlus, ngLevel, bestNgLevel, totalTurns, totalDamageDealt, floorsCleared }: WinScreenProps) {
  const sprites = useSpriteUrls();
  const [shared, setShared] = useState(false);

  const shareText = `I climbed Corporate Climb as ${player.name} in ${totalTurns} turns, dealing ${totalDamageDealt.toLocaleString()} total damage. Floor ${floorsCleared} cleared.${ngLevel > 0 ? ` NG+${ngLevel}!` : ""} Can you beat that? corporateclimb.vercel.app`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        setShared(true);
      } catch {
        // User cancelled share
      }
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
      background: "linear-gradient(180deg, #FF6F00 0%, #FFA000 30%, #FFC107 60%, #FFD54F 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 31) % 100}%`,
          top: `${(i * 17) % 100}%`,
          width: 8, height: 8,
          background: ["#E53935", "#1E88E5", "#43A047", "#8E24AA", "#FDD835"][i % 5],
          borderRadius: i % 2 === 0 ? "50%" : "2px",
          animation: `confetti ${2 + (i % 3)}s infinite`,
          animationDelay: `${i * 0.15}s`,
          opacity: 0.8,
        }} />
      ))}

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#263238",
        letterSpacing: 4,
      }}>
        &#x2726; CONGRATULATIONS &#x2726;
      </div>
      <div className="sprite-idle" style={{ width: 80, height: 80 }}>
        <img src={sprites[player.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 14, color: "#263238",
        textAlign: "center", lineHeight: 1.8,
        textShadow: "2px 2px 0 rgba(255,255,255,0.5)",
      }}>
        YOU CLIMBED THE<br />CORPORATE LADDER!
      </div>

      {/* Share Card */}
      <div style={{
        background: "rgba(0,0,0,0.85)", borderRadius: 12, padding: "14px 18px",
        maxWidth: 320, width: "100%",
        border: "3px solid #FFC107",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFC107",
          textAlign: "center", letterSpacing: 2,
        }}>
          Corporate Ladder Climbed
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
          fontFamily: "'Press Start 2P'", fontSize: 7,
        }}>
          <div style={{ color: "#90A4AE" }}>CLASS</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{player.emoji} {player.name}</div>
          <div style={{ color: "#90A4AE" }}>FLOORS</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{floorsCleared}/{floorsCleared}</div>
          <div style={{ color: "#90A4AE" }}>TURNS</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{totalTurns}</div>
          <div style={{ color: "#90A4AE" }}>DAMAGE</div>
          <div style={{ color: "#FFF", textAlign: "right" }}>{totalDamageDealt.toLocaleString()}</div>
          {ngLevel > 0 && (
            <>
              <div style={{ color: "#90A4AE" }}>NG+</div>
              <div style={{ color: "#E65100", textAlign: "right", fontWeight: "bold" }}>{ngLevel}</div>
            </>
          )}
        </div>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 6, color: "#78909C",
          textAlign: "center", marginTop: 4,
        }}>
          Think you can do better?
        </div>
        <button
          onClick={handleShare}
          style={{
            fontFamily: "'Press Start 2P'", fontSize: 8, padding: "10px 16px",
            background: shared ? "#43A047" : "#FFC107", color: shared ? "#FFF" : "#263238",
            border: "2px solid #263238", borderRadius: 6,
            cursor: "pointer", boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
            transition: "background 0.2s",
          }}
        >
          {shared ? "COPIED!" : "SHARE RESULT"}
        </button>
      </div>

      {ngLevel > 0 && (
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 8, color: "#E65100",
          background: "rgba(0,0,0,0.15)", padding: "6px 14px", borderRadius: 8,
        }}>
          NG+{ngLevel} CLEARED!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <button
          onClick={onNgPlus}
          style={{
            fontFamily: "'Press Start 2P'", fontSize: 11, padding: "14px 30px",
            background: "#E65100", border: "4px solid #263238", borderRadius: 10,
            cursor: "pointer", boxShadow: "6px 6px 0 rgba(0,0,0,0.3)", color: "#FFF",
          }}
        >
          NEW GAME+ {ngLevel + 1}
        </button>
        <button
          onClick={onRestart}
          style={{
            fontFamily: "'Press Start 2P'", fontSize: 9, padding: "10px 24px",
            background: "#263238", border: "3px solid #263238", borderRadius: 8,
            cursor: "pointer", boxShadow: "4px 4px 0 rgba(0,0,0,0.3)", color: "#FFC107",
          }}
        >
          RESTART
        </button>
        {bestNgLevel > 0 && (
          <div style={{
            fontFamily: "'Press Start 2P'", fontSize: 7, color: "#4E342E", opacity: 0.7,
          }}>
            BEST: NG+{bestNgLevel}
          </div>
        )}
      </div>
    </div>
  );
}
