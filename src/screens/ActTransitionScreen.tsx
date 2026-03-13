import { useState, useEffect } from "react";

const ACT_DATA: Record<number, { title: string; subtitle: string; flavor: string; bg: string; accent: string; subtitleShadow: string }> = {
  2: {
    title: "ACT 2",
    subtitle: "MANAGEMENT",
    flavor: "You've proven yourself on the ground floor. But the real game starts now. Politics. Budgets. Power.",
    bg: "linear-gradient(180deg, #0d1b2a 0%, #1b2838 30%, #2c3e50 60%, #0d1b2a 100%)",
    accent: "#4FC3F7",
    subtitleShadow: "2px 2px 0 #0277BD",
  },
  3: {
    title: "ACT 3",
    subtitle: "EXECUTIVE",
    flavor: "The org chart bows to you. But above the clouds, the air is thin and the stakes are existential.",
    bg: "linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 30%, #2d1b4e 60%, #0a0a0a 100%)",
    accent: "#FFC107",
    subtitleShadow: "2px 2px 0 #E65100",
  },
};

export default function ActTransitionScreen({ act, onContinue }: { act: number; onContinue: () => void }) {
  const [phase, setPhase] = useState(0);
  const data = ACT_DATA[act];

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    const t4 = setTimeout(() => setPhase(4), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  if (!data) return null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 28, padding: 30,
      background: data.bg,
      cursor: "pointer",
    }} onClick={onContinue}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#78909C",
        letterSpacing: 8,
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? "translateY(0)" : "translateY(-10px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        {data.title}
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 18, color: data.accent,
        textAlign: "center", lineHeight: 1.8,
        textShadow: data.subtitleShadow,
        letterSpacing: 4,
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? "scale(1)" : "scale(0.8)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        {data.subtitle}
      </div>

      <div style={{
        width: 80, height: 2,
        background: `linear-gradient(90deg, transparent, ${data.accent}, transparent)`,
        opacity: phase >= 2 ? 1 : 0,
        transition: "opacity 0.6s ease",
      }} />

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#90A4AE",
        textAlign: "center", lineHeight: 2.4, maxWidth: 300,
        fontStyle: "italic",
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}>
        {data.flavor}
      </div>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#616161",
        opacity: phase >= 4 ? 1 : 0,
        transition: "opacity 0.6s ease",
        animation: phase >= 4 ? "pulse 2s infinite" : "none",
      }}>
        TAP TO CONTINUE
      </div>
    </div>
  );
}
