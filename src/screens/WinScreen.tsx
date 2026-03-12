import type { PlayerClass } from "../types";
import { useSpriteUrls } from "../components/PixelSprite";

export default function WinScreen({ player, onRestart }: { player: PlayerClass; onRestart: () => void }) {
  const sprites = useSpriteUrls();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 30,
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
      <div className="sprite-idle" style={{ width: 96, height: 96 }}>
        <img src={sprites[player.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 16, color: "#263238",
        textAlign: "center", lineHeight: 1.8,
        textShadow: "2px 2px 0 rgba(255,255,255,0.5)",
      }}>
        YOU REACHED<br />THE C-SUITE!
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#4E342E",
        textAlign: "center", lineHeight: 2.4, maxWidth: 300,
        background: "rgba(255,255,255,0.3)", padding: 16, borderRadius: 10,
      }}>
        As {player.name}, you conquered<br />
        every floor of the corporate<br />
        tower. The corner office is yours.<br /><br />
        ...but at what cost?
      </div>
      <button
        onClick={onRestart}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 11, padding: "14px 30px",
          background: "#263238", border: "4px solid #263238", borderRadius: 10,
          cursor: "pointer", boxShadow: "6px 6px 0 rgba(0,0,0,0.3)", color: "#FFC107",
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
}
