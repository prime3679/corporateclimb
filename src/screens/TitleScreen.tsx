import { useState, useEffect } from "react";
import { useSpriteUrls } from "../components/PixelSprite";

export default function TitleScreen({ onStart, onContinue }: { onStart: () => void; onContinue?: () => void }) {
  const [flicker, setFlicker] = useState(true);
  const sprites = useSpriteUrls();

  useEffect(() => {
    const i = setInterval(() => setFlicker((f) => !f), 700);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 30,
      background: "linear-gradient(180deg, #0D47A1 0%, #1565C0 40%, #1976D2 70%, #42A5F5 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 37) % 100}%`,
          top: `${(i * 23) % 60}%`,
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          background: "#fff",
          borderRadius: "50%",
          opacity: 0.3 + (i % 5) * 0.15,
          animation: `twinkle ${1.5 + (i % 3) * 0.5}s infinite alternate`,
          animationDelay: `${i * 0.1}s`,
        }} />
      ))}

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 12, color: "#FFD54F",
          letterSpacing: 4, marginBottom: 12,
          textShadow: "2px 2px 0 #E65100",
        }}>
          &#x2726; A SATIRICAL RPG &#x2726;
        </div>
        <h1 style={{
          fontFamily: "'Press Start 2P'", fontSize: 28, color: "#FFFFFF",
          textShadow: "3px 3px 0 #0D47A1, 6px 6px 0 rgba(0,0,0,0.3)",
          margin: 0, lineHeight: 1.4,
          background: "linear-gradient(180deg, #FFFFFF 0%, #E3F2FD 50%, #90CAF9 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(3px 3px 0 #0D47A1)",
        }}>
          CORPORATE<br />CLIMB
        </h1>
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 8, color: "#90CAF9",
          marginTop: 16, letterSpacing: 2,
        }}>
          FROM CUBICLE TO CORNER OFFICE
        </div>
      </div>

      <div style={{
        display: "flex", gap: 12, justifyContent: "center",
        position: "relative", zIndex: 1, margin: "8px 0",
      }}>
        {["pm", "eng", "design"].map((id) => (
          <div key={id} className="sprite-idle" style={{ width: 48, height: 48 }}>
            <img src={sprites[id]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
          </div>
        ))}
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
        background: "linear-gradient(0deg, #0D47A1 0%, transparent 100%)",
        display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, padding: "0 20px",
      }}>
        {[60, 90, 70, 110, 80, 95, 65, 85, 100, 75].map((h, i) => (
          <div key={i} style={{
            width: 20, height: h, background: "#0D47A1",
            borderRadius: "3px 3px 0 0",
            position: "relative",
          }}>
            {Array.from({ length: Math.floor(h / 15) }).map((_, j) => (
              <div key={j} style={{
                position: "absolute", left: 4, top: 8 + j * 15,
                width: 5, height: 5, borderRadius: 1,
                background: (i + j) % 3 === 0 ? "#FFD54F" : "#1565C0",
                opacity: 0.8,
              }} />
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 14,
          padding: "16px 40px",
          background: "#FFC107",
          border: "4px solid #263238",
          borderRadius: 10,
          cursor: "pointer",
          boxShadow: "6px 6px 0 #263238",
          color: "#263238",
          opacity: flicker ? 1 : 0.6,
          transition: "opacity 0.2s",
          position: "relative",
          zIndex: 2,
        }}
      >
        {onContinue ? "NEW GAME" : "PRESS START"}
      </button>

      {onContinue && (
        <button
          onClick={onContinue}
          style={{
            fontFamily: "'Press Start 2P'", fontSize: 12,
            padding: "12px 32px",
            background: "#4FC3F7",
            border: "4px solid #263238",
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "6px 6px 0 #263238",
            color: "#263238",
            position: "relative",
            zIndex: 2,
          }}
        >
          CONTINUE
        </button>
      )}

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#64B5F6",
        position: "absolute", bottom: 12, zIndex: 2,
      }}>
        &copy; 2026 ADRIAN LUMLEY
      </div>
    </div>
  );
}
