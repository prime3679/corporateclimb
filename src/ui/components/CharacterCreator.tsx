import { memo, useState } from "react";
import {
  useCharacterStore,
  SKIN_TONES,
  ACCENT_COLORS,
  HAIRSTYLES,
  ACCESSORIES,
  type Presentation,
  type Hairstyle,
  type Accessory,
} from "../stores/characterStore";
import { useGameState } from "../stores/gameState";

const FONT = "'Segoe UI', system-ui, sans-serif";

const PRESENTATIONS: { value: Presentation; label: string; icon: string }[] = [
  { value: "masculine", label: "Masculine", icon: "🧍" },
  { value: "feminine", label: "Feminine", icon: "🧍‍♀️" },
  { value: "androgynous", label: "Androgynous", icon: "🧑" },
];

export function CharacterCreator() {
  const store = useCharacterStore();
  const isRunning = useGameState((s) => s.isRunning);

  if (store.isCreated || isRunning) return null;

  return (
    <div style={styles.fullscreen}>
      <div style={styles.panel}>
        <h1 style={styles.title}>Create Your Character</h1>

        {/* Presentation */}
        <Section label="Presentation">
          <div style={styles.row}>
            {PRESENTATIONS.map((p) => (
              <ToggleButton
                key={p.value}
                active={store.presentation === p.value}
                onClick={() => store.setPresentation(p.value)}
              >
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <span>{p.label}</span>
              </ToggleButton>
            ))}
          </div>
        </Section>

        {/* Skin tone */}
        <Section label="Skin Tone">
          <div style={styles.row}>
            {SKIN_TONES.map((color) => (
              <Swatch
                key={color}
                color={color}
                selected={store.skinTone === color}
                onClick={() => store.setSkinTone(color)}
                size={36}
                radius="50%"
              />
            ))}
          </div>
        </Section>

        {/* Hairstyle */}
        <Section label="Hairstyle">
          <div style={styles.grid}>
            {HAIRSTYLES.map((h) => (
              <ToggleButton
                key={h}
                active={store.hairstyle === h}
                onClick={() => store.setHairstyle(h as Hairstyle)}
                small
              >
                {h}
              </ToggleButton>
            ))}
          </div>
        </Section>

        {/* Accent color */}
        <Section label="Accent Color">
          <div style={styles.row}>
            {ACCENT_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                selected={store.accentColor === color}
                onClick={() => store.setAccentColor(color)}
                size={32}
                radius={6}
              />
            ))}
          </div>
        </Section>

        {/* Accessory */}
        <Section label="Accessory">
          <div style={styles.row}>
            {ACCESSORIES.map((a) => (
              <ToggleButton
                key={a}
                active={store.accessory === a}
                onClick={() => store.setAccessory(a as Accessory)}
              >
                {a}
              </ToggleButton>
            ))}
          </div>
        </Section>

        {/* Preview */}
        <Section label="Preview">
          <CharacterPreview />
        </Section>

        {/* Start button */}
        <StartButton />
      </div>
    </div>
  );
}

/* ─── Character preview ─── */

function CharacterPreview() {
  const { presentation, skinTone, hairstyle, accentColor, accessory } = useCharacterStore();

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      padding: "12px 0",
    }}>
      <div style={{
        width: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}>
        {/* Head */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: skinTone,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Hair indicator */}
          <div style={{
            position: "absolute",
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 8,
            color: "#e2e8f0",
            fontFamily: FONT,
            fontWeight: 600,
            background: "rgba(15, 23, 42, 0.7)",
            padding: "1px 5px",
            borderRadius: 4,
            whiteSpace: "nowrap",
          }}>
            {hairstyle}
          </div>
          {/* Accessory indicator */}
          {accessory !== "None" && (
            <div style={{
              position: "absolute",
              bottom: -6,
              fontSize: 8,
              color: accentColor,
              fontFamily: FONT,
              fontWeight: 600,
              background: "rgba(15, 23, 42, 0.7)",
              padding: "1px 5px",
              borderRadius: 4,
            }}>
              {accessory}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{
          width: presentation === "masculine" ? 50 : presentation === "feminine" ? 40 : 45,
          height: 60,
          borderRadius: 6,
          background: accentColor,
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            width: "70%",
            height: "80%",
            borderRadius: 4,
            background: "rgba(0,0,0,0.15)",
          }} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: 10,
          color: "#64748b",
          fontFamily: FONT,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          {presentation}
        </span>
      </div>
    </div>
  );
}

/* ─── Start button ─── */

function StartButton() {
  const finalize = useCharacterStore((s) => s.finalize);
  const [hover, setHover] = useState(false);

  const handleStart = () => {
    // finalize() sets isCreated=true, which BootScene subscribes to and transitions to Game
    finalize();
  };

  return (
    <button
      onClick={handleStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        marginTop: 16,
        padding: "14px 0",
        borderRadius: 10,
        border: "none",
        background: hover
          ? "linear-gradient(135deg, #6366f1, #4F46E5)"
          : "linear-gradient(135deg, #4F46E5, #3730a3)",
        color: "#fff",
        fontFamily: FONT,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hover
          ? "0 4px 20px rgba(79, 70, 229, 0.4)"
          : "0 2px 8px rgba(79, 70, 229, 0.2)",
      }}
    >
      Start Game
    </button>
  );
}

/* ─── Reusable pieces ─── */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        color: "#818cf8",
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const Swatch = memo(function Swatch({
  color,
  selected,
  onClick,
  size,
  radius,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
  size: number;
  radius: React.CSSProperties["borderRadius"];
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        border: selected ? "3px solid #e2e8f0" : "3px solid transparent",
        cursor: "pointer",
        transition: "border 0.15s, transform 0.1s",
        transform: selected ? "scale(1.15)" : "scale(1)",
        padding: 0,
      }}
    />
  );
});

function ToggleButton({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.05)",
        border: active ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 8,
        color: active ? "#e2e8f0" : "#94a3b8",
        fontFamily: FONT,
        fontSize: small ? 12 : 13,
        fontWeight: active ? 600 : 400,
        padding: small ? "6px 12px" : "8px 16px",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </button>
  );
}

/* ─── Styles ─── */

const styles: Record<string, React.CSSProperties> = {
  fullscreen: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(16px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
    zIndex: 50,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderRadius: 16,
    padding: "28px 32px",
  },
  title: {
    color: "#e2e8f0",
    fontFamily: FONT,
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 24,
    marginTop: 0,
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
};
