import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayerStats, type StatName } from "../stores/playerStats";
import { useGameState } from "../stores/gameState";

/* ─── Stat config ─── */

interface StatConfig {
  key: StatName;
  label: string;
  icon: string;
  color: string;
}

const STATS: StatConfig[] = [
  { key: "energy", label: "Energy", icon: "⚡", color: "#F59E0B" },
  { key: "reputation", label: "Reputation", icon: "⭐", color: "#3B82F6" },
  { key: "network", label: "Network", icon: "🔗", color: "#10B981" },
  { key: "cash", label: "Cash", icon: "💰", color: "#8B5CF6" },
];

/* ─── Delta floater ─── */

interface DeltaFloat {
  id: number;
  value: number;
  color: string;
}

let floatId = 0;

function StatBar({ config }: { config: StatConfig }) {
  const value = usePlayerStats((s) => s[config.key]);
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);
  const [floats, setFloats] = useState<DeltaFloat[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (prev === value) return;

    const delta = value - prev;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 400);

    const id = ++floatId;
    setFloats((f) => [...f, { id, value: delta, color: config.color }]);
    const removeTimer = setTimeout(() => {
      setFloats((f) => f.filter((item) => item.id !== id));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [value, config.color]);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, height: 22 }}>
      <span style={{ fontSize: 12, width: 16, textAlign: "center" }}>{config.icon}</span>
      <span style={{
        fontSize: 10,
        color: "#94a3b8",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        width: 68,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        fontWeight: 600,
      }}>
        {config.label}
      </span>
      <div style={{
        width: 100,
        height: 8,
        borderRadius: 4,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
        position: "relative",
        boxShadow: flash ? `0 0 8px ${config.color}80` : "none",
        transition: "box-shadow 0.2s",
      }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          borderRadius: 4,
          background: config.color,
          transition: "width 0.4s ease-out",
        }} />
      </div>
      <span style={{
        fontSize: 11,
        color: "#cbd5e1",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontWeight: 600,
        width: 24,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>

      {/* Delta floaters */}
      {floats.map((f) => (
        <span
          key={f.id}
          style={{
            position: "absolute",
            right: -32,
            top: 0,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            color: f.value > 0 ? "#4ade80" : "#f87171",
            animation: "floatUp 1s ease-out forwards",
            pointerEvents: "none",
          }}
        >
          {f.value > 0 ? "+" : ""}{f.value}
        </span>
      ))}
    </div>
  );
}

/* ─── Pause overlay ─── */

function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      pointerEvents: "auto",
      zIndex: 100,
    }}>
      <div style={{
        color: "#e2e8f0",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: 40,
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}>
        PAUSED
      </div>
      <button
        onClick={onResume}
        style={{
          background: "rgba(99, 102, 241, 0.4)",
          border: "1px solid rgba(99, 102, 241, 0.6)",
          borderRadius: 8,
          color: "#e2e8f0",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontSize: 16,
          padding: "10px 32px",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = "rgba(99, 102, 241, 0.6)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "rgba(99, 102, 241, 0.4)";
        }}
      >
        Resume
      </button>
    </div>
  );
}

/* ─── Main HUD ─── */

export function HUD() {
  const isRunning = useGameState((s) => s.isRunning);
  const [paused, setPaused] = useState(false);

  const togglePause = useCallback(() => {
    const game = (window as unknown as Record<string, unknown>).__PHASER_GAME__ as
      | { scene: { pause: (k: string) => void; resume: (k: string) => void } }
      | undefined;
    if (!game) return;

    if (paused) {
      game.scene.resume("Game");
      setPaused(false);
    } else {
      game.scene.pause("Game");
      setPaused(true);
    }
  }, [paused]);

  if (!isRunning) return null;

  return (
    <>
      {/* Stat bars - top left */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 14px",
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(12px)",
        borderRadius: 10,
        border: "1px solid rgba(99, 102, 241, 0.15)",
        pointerEvents: "auto",
      }}>
        {STATS.map((s) => (
          <StatBar key={s.key} config={s} />
        ))}
      </div>

      {/* Pause button - top right */}
      <button
        onClick={togglePause}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(99, 102, 241, 0.15)",
          color: "#94a3b8",
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          transition: "background 0.15s",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = "rgba(15, 23, 42, 0.85)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "rgba(15, 23, 42, 0.6)";
        }}
      >
        {paused ? "▶" : "⏸"}
      </button>

      {/* Pause overlay */}
      {paused && <PauseOverlay onResume={togglePause} />}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </>
  );
}
