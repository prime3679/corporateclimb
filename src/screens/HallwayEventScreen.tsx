import { useState, useEffect } from "react";
import type { HallwayEvent } from "../types";
import { SFX } from "../sfx";

export default function HallwayEventScreen({
  event,
  onChoice,
  playerHp,
  playerMaxHp,
}: {
  event: HallwayEvent;
  onChoice: (choiceIdx: number) => void;
  playerHp: number;
  playerMaxHp: number;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    SFX.eventNeutral();
    setTimeout(() => setShow(true), 200);
  }, []);

  const handleChoice = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    const choice = event.choices[idx];
    if (choice.isGood) SFX.eventGood();
    else SFX.eventBad();
  };

  const choice = chosen !== null ? event.choices[chosen] : null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 16, padding: 24,
      background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    }}>
      <div style={{
        position: "absolute", top: 12, right: 16,
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#4CAF50",
        background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: 6,
      }}>
        HP {playerHp}/{playerMaxHp}
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 9, color: "#FFD54F",
        letterSpacing: 3,
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}>
        {event.title}
      </div>

      <div style={{
        fontSize: 56,
        opacity: show ? 1 : 0,
        transition: "opacity 0.6s ease 0.2s",
      }}>
        {event.emoji}
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#B0BEC5",
        textAlign: "center", lineHeight: 2.4, maxWidth: 320,
        opacity: show ? 1 : 0,
        transition: "opacity 0.6s ease 0.3s",
      }}>
        {event.desc}
      </div>

      {chosen === null ? (
        <div style={{
          display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 320,
          opacity: show ? 1 : 0,
          transition: "opacity 0.6s ease 0.5s",
        }}>
          {event.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => handleChoice(i)}
              style={{
                fontFamily: "'Press Start 2P'", fontSize: 8,
                padding: "12px 14px",
                background: "#FAFAFA",
                border: "3px solid #263238",
                borderRadius: 8,
                cursor: "pointer",
                boxShadow: "4px 4px 0 #263238",
                color: "#263238",
                textAlign: "left",
                lineHeight: 1.8,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : choice && (
        <div style={{
          background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: 10, padding: 16, maxWidth: 320, textAlign: "center",
          animation: "fade-in 0.4s ease",
        }}>
          <div style={{
            fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFFFFF",
            lineHeight: 2.2, marginBottom: 10,
          }}>
            {choice.result}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {choice.effect.hp && (
              <span style={{
                fontFamily: "'Press Start 2P'", fontSize: 8,
                color: choice.effect.hp > 0 ? "#4CAF50" : "#F44336",
              }}>
                HP {choice.effect.hp > 0 ? "+" : ""}{choice.effect.hp}
              </span>
            )}
            {choice.effect.atk && (
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FF9800" }}>
                ATK +{choice.effect.atk}
              </span>
            )}
            {choice.effect.def && (
              <span style={{
                fontFamily: "'Press Start 2P'", fontSize: 8,
                color: choice.effect.def > 0 ? "#2196F3" : "#F44336",
              }}>
                DEF {choice.effect.def > 0 ? "+" : ""}{choice.effect.def}
              </span>
            )}
            {choice.effect.ppRestore && (
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#9C27B0" }}>
                PP +{choice.effect.ppRestore}
              </span>
            )}
          </div>
          <button
            onClick={() => onChoice(chosen!)}
            style={{
              fontFamily: "'Press Start 2P'", fontSize: 9, padding: "10px 24px",
              background: "#FFC107", border: "3px solid #263238", borderRadius: 8,
              cursor: "pointer", boxShadow: "4px 4px 0 #263238", color: "#263238",
              marginTop: 14,
            }}
          >
            CONTINUE &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
