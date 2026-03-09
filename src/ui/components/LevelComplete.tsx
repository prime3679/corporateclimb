import { useState } from "react";
import { usePlayerStats } from "../stores/playerStats";
import { useChoiceHistory } from "../stores/choiceHistory";
import { useGameState } from "../stores/gameState";

const FONT = "'Segoe UI', system-ui, sans-serif";

interface LevelCompleteData {
  levelName: string;
  timeTaken: number; // ms
}

/** Zustand-compatible store for level complete state */
import { create } from "zustand";

interface LevelCompleteState {
  isShowing: boolean;
  data: LevelCompleteData | null;
  show: (data: LevelCompleteData) => void;
  hide: () => void;
}

export const useLevelComplete = create<LevelCompleteState>((set) => ({
  isShowing: false,
  data: null,
  show: (data) => set({ isShowing: true, data }),
  hide: () => set({ isShowing: false, data: null }),
}));

export function LevelComplete() {
  const { isShowing, data, hide } = useLevelComplete();
  const stats = usePlayerStats();
  const choices = useChoiceHistory((s) => s.choices);
  const [hover, setHover] = useState(false);

  if (!isShowing || !data) return null;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // Count archetype tags
  const tagCounts: Record<string, number> = {};
  for (const c of choices) {
    for (const tag of c.tags) {
      if (tag === "correct" || tag === "wrong" || tag === "best_ending") continue;
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topArchetype = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];

  const handleContinue = () => {
    hide();
    // For now just stop the game since there's no level 2 yet
    useGameState.getState().setRunning(false);
    useGameState.getState().setCurrentScene("Boot");
  };

  return (
    <div style={styles.fullscreen}>
      <div style={styles.panel}>
        <h1 style={styles.title}>Level Complete!</h1>
        <h2 style={styles.subtitle}>{data.levelName}</h2>

        {/* Stats summary */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>FINAL STATS</div>
          <div style={styles.statGrid}>
            <StatRow label="Energy" value={stats.energy} icon="⚡" color="#F59E0B" />
            <StatRow label="Reputation" value={stats.reputation} icon="⭐" color="#3B82F6" />
            <StatRow label="Network" value={stats.network} icon="🔗" color="#10B981" />
            <StatRow label="Cash" value={stats.cash} icon="💰" color="#8B5CF6" />
          </div>
        </div>

        {/* Time */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>TIME</div>
          <div style={styles.timeValue}>{formatTime(data.timeTaken)}</div>
        </div>

        {/* Choices */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>CHOICES MADE</div>
          <div style={styles.choiceCount}>{choices.length} decisions</div>
          {topArchetype && (
            <div style={styles.archetype}>
              Dominant style: <span style={{ color: "#818cf8", fontWeight: 700 }}>
                {topArchetype[0].charAt(0).toUpperCase() + topArchetype[0].slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            ...styles.button,
            background: hover
              ? "linear-gradient(135deg, #6366f1, #4F46E5)"
              : "linear-gradient(135deg, #4F46E5, #3730a3)",
            transform: hover ? "translateY(-1px)" : "translateY(0)",
            boxShadow: hover
              ? "0 4px 20px rgba(79, 70, 229, 0.4)"
              : "0 2px 8px rgba(79, 70, 229, 0.2)",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ color: "#94a3b8", fontSize: 12, width: 80, fontFamily: FONT }}>{label}</span>
      <div style={{
        width: 80,
        height: 6,
        borderRadius: 3,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          borderRadius: 3,
          background: color,
        }} />
      </div>
      <span style={{
        color: "#e2e8f0",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        width: 28,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullscreen: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.92)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
    zIndex: 60,
  },
  panel: {
    width: "100%",
    maxWidth: 400,
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderRadius: 16,
    padding: "28px 32px",
  },
  title: {
    color: "#4ade80",
    fontFamily: FONT,
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
    marginTop: 0,
  },
  subtitle: {
    color: "#94a3b8",
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 400,
    textAlign: "center",
    marginBottom: 24,
    marginTop: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: "#818cf8",
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  statGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  timeValue: {
    color: "#e2e8f0",
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  choiceCount: {
    color: "#e2e8f0",
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 600,
  },
  archetype: {
    color: "#94a3b8",
    fontFamily: FONT,
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    width: "100%",
    marginTop: 8,
    padding: "14px 0",
    borderRadius: 10,
    border: "none",
    color: "#fff",
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
