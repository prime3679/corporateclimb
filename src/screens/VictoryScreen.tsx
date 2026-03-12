import type { Enemy } from "../types";
import { useSpriteUrls } from "../components/PixelSprite";

export default function VictoryScreen({ enemy, xpGained, onContinue, leveledUp, newLevel }: {
  enemy: Enemy; xpGained: number; onContinue: () => void; leveledUp: boolean; newLevel: number;
}) {
  const sprites = useSpriteUrls();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 30,
      background: "linear-gradient(180deg, #1A237E 0%, #283593 50%, #3949AB 100%)",
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#FFD54F",
        textShadow: "2px 2px 0 #E65100",
        animation: "pulse 1.5s infinite",
      }}>
        &#x2726; VICTORY &#x2726;
      </div>
      <div style={{ width: 80, height: 80, opacity: 0.5 }}>
        <img src={sprites[enemy.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto", filter: "grayscale(1)" }} draggable={false} />
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 11, color: "#FFFFFF",
        textAlign: "center", lineHeight: 2,
      }}>
        {enemy.name} was defeated!
      </div>

      <div style={{
        background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 10, padding: 16, textAlign: "center", maxWidth: 280,
      }}>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: "#90CAF9", marginBottom: 8 }}>
          +{xpGained} XP GAINED
        </div>
        {leveledUp && (
          <div style={{
            fontFamily: "'Press Start 2P'", fontSize: 10, color: "#FFD54F",
            animation: "pulse 1s infinite",
          }}>
            LEVEL UP! &rarr; Lv.{newLevel}
          </div>
        )}
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 8, color: "#B0BEC5",
          marginTop: 10, lineHeight: 2.2, fontStyle: "italic",
        }}>
          &ldquo;{enemy.defeat}&rdquo;
        </div>
      </div>

      <button
        onClick={onContinue}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 11, padding: "14px 30px",
          background: "#FFC107", border: "4px solid #263238", borderRadius: 10,
          cursor: "pointer", boxShadow: "6px 6px 0 #263238", color: "#263238",
        }}
      >
        CONTINUE &rarr;
      </button>
    </div>
  );
}
