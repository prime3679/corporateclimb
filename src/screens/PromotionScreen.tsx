import { useState, useEffect } from "react";
import type { PromotionTier, PlayerClass } from "../types";
import { useSpriteUrls } from "../components/PixelSprite";

export default function PromotionScreen({ player, oldTier, newTier, onContinue }: {
  player: PlayerClass;
  oldTier: PromotionTier;
  newTier: PromotionTier;
  onContinue: () => void;
}) {
  const [show, setShow] = useState(false);
  const sprites = useSpriteUrls();

  useEffect(() => {
    setTimeout(() => setShow(true), 300);
  }, []);

  const boost = newTier.statBoost;
  const upgrades = newTier.moveUpgrades;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 18, padding: 24,
      background: "linear-gradient(180deg, #1a1a2e 0%, #2a1a0e 50%, #3a2a0e 100%)",
      cursor: "pointer",
    }} onClick={onContinue}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFC107",
        letterSpacing: 4,
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease",
        textShadow: "1px 1px 0 #E65100",
      }}>
        &#x2726; PROMOTED &#x2726;
      </div>

      <div className="sprite-idle" style={{
        width: 96, height: 110,
        opacity: show ? 1 : 0,
        transition: "opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s",
        transform: show ? "scale(1)" : "scale(0.8)",
      }}>
        <img src={sprites[player.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto", padding: "8% 2% 0 2%", objectFit: "contain" }} draggable={false} />
      </div>

      {/* Old title fading out */}
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 9, color: "#78909C",
        textDecoration: "line-through",
        opacity: show ? 0.5 : 0,
        transition: "opacity 0.5s ease 0.3s",
      }}>
        {oldTier.title}
      </div>

      {/* Arrow */}
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 12, color: "#FFC107",
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease 0.4s",
      }}>
        &darr;
      </div>

      {/* New title */}
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 12, color: "#FFD54F",
        textAlign: "center", lineHeight: 1.8,
        textShadow: "2px 2px 0 #E65100",
        opacity: show ? 1 : 0,
        transition: "opacity 0.6s ease 0.5s",
      }}>
        {newTier.title}
      </div>

      {/* Stat boosts */}
      {boost && (
        <div style={{
          background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 16px",
          display: "flex", gap: 16, justifyContent: "center",
          opacity: show ? 1 : 0,
          transition: "opacity 0.5s ease 0.6s",
        }}>
          {boost.maxHp && (
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#4CAF50" }}>
              HP +{boost.maxHp}
            </div>
          )}
          {boost.atk && (
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#F44336" }}>
              ATK +{boost.atk}
            </div>
          )}
          {boost.def && (
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#2196F3" }}>
              DEF +{boost.def}
            </div>
          )}
        </div>
      )}

      {/* Move upgrades */}
      {upgrades && upgrades.length > 0 && (
        <div style={{
          background: "rgba(255,193,7,0.1)", border: "2px solid #FFC107", borderRadius: 8,
          padding: "10px 14px", maxWidth: 300, width: "100%",
          opacity: show ? 1 : 0,
          transition: "opacity 0.5s ease 0.7s",
        }}>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#FFC107", marginBottom: 6 }}>
            MOVE EVOLVED!
          </div>
          {upgrades.map(u => (
            <div key={u.fromName} style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#FFFFFF", lineHeight: 2 }}>
              {u.fromName} &rarr; {u.to.name}
            </div>
          ))}
        </div>
      )}

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#616161",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 1s",
        animation: show ? "pulse 2s infinite" : "none",
      }}>
        TAP TO CONTINUE
      </div>
    </div>
  );
}
