import { useState } from "react";
import type { PlayerClass } from "../types";
import { PLAYER_CLASSES } from "../data";
import { useSpriteUrls } from "../components/PixelSprite";
import { getDailySeed, getDailyModifier, hasPlayedToday, getDailyResult } from "../daily";

export default function DailyPreScreen({ onStart, onBack }: {
  onStart: (cls: PlayerClass) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const sprites = useSpriteUrls();
  const seed = getDailySeed();
  const modifier = getDailyModifier(seed);
  const alreadyPlayed = hasPlayedToday();
  const pastResult = getDailyResult(seed);

  const isReorg = modifier.id === "reorg";

  // Days since launch
  const launchDate = new Date("2026-03-17");
  const today = new Date();
  const dayNum = Math.max(1, Math.floor((today.getTime() - launchDate.getTime()) / 86400000) + 1);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 16, padding: 20,
      background: "linear-gradient(180deg, #1A237E 0%, #283593 50%, #3949AB 100%)",
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#FFD54F",
        letterSpacing: 3, textShadow: "2px 2px 0 #E65100",
      }}>
        DAILY CHALLENGE #{dayNum}
      </div>

      {/* Modifier card */}
      <div style={{
        background: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 16,
        border: "3px solid #FF6F00", maxWidth: 300, width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28 }}>{modifier.icon}</div>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 10, color: "#FF6F00",
          marginTop: 8,
        }}>
          {modifier.name.toUpperCase()}
        </div>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 7, color: "#B0BEC5",
          marginTop: 8, lineHeight: 2,
        }}>
          {modifier.desc}
        </div>
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#EF5350",
        background: "rgba(229,57,53,0.15)", padding: "6px 12px", borderRadius: 6,
      }}>
        NG+1 DIFFICULTY &bull; 15 FLOORS &bull; NO SAVES
      </div>

      {/* Class selection (unless reorg) */}
      {!isReorg && !alreadyPlayed && (
        <div style={{ display: "flex", gap: 8 }}>
          {PLAYER_CLASSES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              style={{
                width: 80, padding: "8px 6px",
                background: selected === i ? "#FFF8E1" : "#455A64",
                border: `3px solid ${selected === i ? "#FFC107" : "#546E7A"}`,
                borderRadius: 8, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <div className="sprite-idle" style={{ width: 40, height: 46 }}>
                <img src={sprites[c.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto", padding: "8% 2% 0 2%", objectFit: "contain" }} draggable={false} />
              </div>
              <span style={{
                fontFamily: "'Press Start 2P'", fontSize: 6,
                color: selected === i ? "#263238" : "#B0BEC5",
              }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {alreadyPlayed && pastResult ? (
        <div style={{
          background: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 16,
          border: "2px solid #FFD54F", maxWidth: 300, width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFD54F", marginBottom: 8 }}>
            TODAY'S RESULT
          </div>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#FFF", lineHeight: 2.2 }}>
            {pastResult.won ? "CLEARED" : "FELL"} &bull; Floor {pastResult.floorsCleared}/15
          </div>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 14, color: "#FFD54F", margin: "8px 0" }}>
            {pastResult.score.toLocaleString()}
          </div>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#90A4AE" }}>
            Come back tomorrow for a new challenge
          </div>
        </div>
      ) : (
        <button
          onClick={() => onStart(PLAYER_CLASSES[selected])}
          style={{
            fontFamily: "'Press Start 2P'", fontSize: 12, padding: "14px 30px",
            background: "#FF6F00", border: "4px solid #263238", borderRadius: 10,
            cursor: "pointer", boxShadow: "6px 6px 0 #263238", color: "#FFF",
          }}
        >
          BEGIN CHALLENGE
        </button>
      )}

      <button
        onClick={onBack}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 8, padding: "8px 20px",
          background: "transparent", border: "2px solid #546E7A", borderRadius: 6,
          cursor: "pointer", color: "#90A4AE",
        }}
      >
        BACK
      </button>
    </div>
  );
}
