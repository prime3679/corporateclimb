import { useState, useEffect } from "react";

const ACT_DATA: Record<number, { title: string; subtitle: string; flavor: string }> = {
  2: {
    title: "ACT 2",
    subtitle: "MANAGEMENT",
    flavor: "You've proven yourself on the ground floor. But the real game starts now. Politics. Budgets. Power.",
  },
  3: {
    title: "ACT 3",
    subtitle: "EXECUTIVE",
    flavor: "The org chart bows to you. But above the clouds, the air is thin and the stakes are existential.",
  },
};

export default function ActTransitionScreen({ act, onContinue }: { act: number; onContinue: () => void }) {
  const [show, setShow] = useState(false);
  const data = ACT_DATA[act];

  useEffect(() => {
    setTimeout(() => setShow(true), 400);
  }, []);

  if (!data) return null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 24, padding: 30,
      background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
      cursor: "pointer",
    }} onClick={onContinue}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#78909C",
        letterSpacing: 6,
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}>
        {data.title}
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 16, color: "#FFC107",
        textAlign: "center", lineHeight: 1.8,
        textShadow: "2px 2px 0 #E65100",
        opacity: show ? 1 : 0,
        transition: "opacity 1s ease 0.4s",
      }}>
        {data.subtitle}
      </div>

      <div style={{
        width: 60, height: 2,
        background: "linear-gradient(90deg, transparent, #FFC107, transparent)",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.6s",
      }} />

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#90A4AE",
        textAlign: "center", lineHeight: 2.4, maxWidth: 300,
        fontStyle: "italic",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.8s",
      }}>
        {data.flavor}
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#616161",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 1.2s",
        animation: show ? "pulse 2s infinite" : "none",
      }}>
        TAP TO CONTINUE
      </div>
    </div>
  );
}
