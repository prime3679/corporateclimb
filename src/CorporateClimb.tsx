import { useState, useEffect, useCallback, useRef } from "react";

// ─── TYPES ───────────────────────────────────────────────────
interface Move {
  name: string;
  dmg: number;
  type: string;
  desc: string;
  pp: number;
  heal?: number;
}

interface PlayerClass {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  desc: string;
  moves: Move[];
}

interface EnemyMove {
  name: string;
  dmg: number;
  heal?: number;
}

interface Enemy {
  floor: number;
  name: string;
  emoji: string;
  maxHp: number;
  atk: number;
  def: number;
  moves: EnemyMove[];
  defeat: string;
  title: string;
}

// ─── GAME DATA ───────────────────────────────────────────────
const PLAYER_CLASSES: PlayerClass[] = [
  {
    id: "pm",
    name: "Product Manager",
    emoji: "📋",
    maxHp: 100,
    atk: 14,
    def: 10,
    spd: 12,
    desc: "Balances roadmaps and stakeholders. High versatility.",
    moves: [
      { name: "Prioritize Backlog", dmg: 18, type: "strategy", desc: "Ruthlessly cuts scope. Hits hard.", pp: 15 },
      { name: "Stakeholder Align", dmg: 12, type: "influence", desc: "Forces agreement through sheer will.", pp: 20, heal: 8 },
      { name: "Ship MVP", dmg: 28, type: "execution", desc: "80/20 strikes. Maximum impact.", pp: 8 },
      { name: "Data-Driven Roast", dmg: 35, type: "analytics", desc: "Destroys arguments with metrics.", pp: 5 },
    ],
  },
  {
    id: "eng",
    name: "Senior Engineer",
    emoji: "⌨️",
    maxHp: 90,
    atk: 18,
    def: 8,
    spd: 14,
    desc: "Writes code and rewrites everything else. Glass cannon.",
    moves: [
      { name: "Refactor Everything", dmg: 22, type: "technical", desc: "Rewrites the opponent from scratch.", pp: 12 },
      { name: "Deploy to Prod", dmg: 30, type: "execution", desc: "YOLO push on Friday. Risky but devastating.", pp: 8 },
      { name: "Code Review Reject", dmg: 15, type: "technical", desc: "Nit-picks until they give up.", pp: 20 },
      { name: "Stack Overflow", dmg: 40, type: "analytics", desc: "Channels the collective wisdom. Huge damage.", pp: 4 },
    ],
  },
  {
    id: "design",
    name: "UX Designer",
    emoji: "🎨",
    maxHp: 85,
    atk: 12,
    def: 12,
    spd: 16,
    desc: "Sees what others can't. Fast and balanced.",
    moves: [
      { name: "Pixel Perfect Punch", dmg: 20, type: "execution", desc: "That 1px misalignment? Fixed violently.", pp: 15 },
      { name: "User Research Beam", dmg: 16, type: "analytics", desc: "\u201CActually, users said\u2026\u201D", pp: 18, heal: 6 },
      { name: "Figma Tornado", dmg: 26, type: "technical", desc: "200 frames of animated fury.", pp: 10 },
      { name: "Design System Slam", dmg: 38, type: "strategy", desc: "Enforces consistency. Crushing blow.", pp: 4 },
    ],
  },
];

const ENEMIES: Enemy[] = [
  {
    floor: 1, name: "Intern", emoji: "🥤", maxHp: 50, atk: 6, def: 4,
    moves: [{ name: "Eager Question", dmg: 8 }, { name: "Coffee Run", dmg: 5, heal: 10 }],
    defeat: "The intern learned a valuable lesson today.",
    title: "THE EAGER INTERN",
  },
  {
    floor: 2, name: "Recruiter", emoji: "📞", maxHp: 65, atk: 9, def: 5,
    moves: [{ name: "LinkedIn Spam", dmg: 10 }, { name: "Lowball Offer", dmg: 14 }],
    defeat: "\u201CLet\u2019s circle back when you have more budget.\u201D",
    title: "THE PERSISTENT RECRUITER",
  },
  {
    floor: 3, name: "Scrum Master", emoji: "📝", maxHp: 80, atk: 10, def: 8,
    moves: [{ name: "Standup Ambush", dmg: 12 }, { name: "Sprint Overload", dmg: 16 }, { name: "Retro Guilt Trip", dmg: 10, heal: 8 }],
    defeat: "The daily standup has been cancelled. Forever.",
    title: "THE RELENTLESS SCRUM MASTER",
  },
  {
    floor: 4, name: "Middle Manager", emoji: "👔", maxHp: 100, atk: 12, def: 10,
    moves: [{ name: "Unnecessary Meeting", dmg: 14 }, { name: "Passive-Aggressive Email", dmg: 18 }, { name: "Take Credit", dmg: 8, heal: 15 }],
    defeat: "\u201CPer my last email\u2026 I resign.\u201D",
    title: "THE MIDDLE MANAGER",
  },
  {
    floor: 5, name: "VP of Synergy", emoji: "🎯", maxHp: 130, atk: 15, def: 12,
    moves: [{ name: "Buzzword Barrage", dmg: 16 }, { name: "Pivot Strategy", dmg: 22 }, { name: "Executive Presence", dmg: 12, heal: 12 }],
    defeat: "Synergy has been disrupted. The paradigm shifts.",
    title: "THE VP OF SYNERGY",
  },
  {
    floor: 6, name: "C-Suite Boss", emoji: "👑", maxHp: 180, atk: 20, def: 15,
    moves: [{ name: "Golden Parachute", dmg: 10, heal: 25 }, { name: "Hostile Takeover", dmg: 28 }, { name: "Board Meeting Beam", dmg: 35 }, { name: "Layoff Wave", dmg: 22 }],
    defeat: "The corner office is yours. Was it worth it?",
    title: "THE C-SUITE FINAL BOSS",
  },
];

const TYPE_COLORS: Record<string, string> = {
  strategy: "#E53935",
  influence: "#7B1FA2",
  execution: "#FF6F00",
  analytics: "#1565C0",
  technical: "#2E7D32",
  normal: "#616161",
};

const TYPE_LABELS: Record<string, string> = {
  strategy: "STRAT",
  influence: "INFL",
  execution: "EXEC",
  analytics: "DATA",
  technical: "TECH",
  normal: "NORM",
};

// ─── PIXEL FONT ──────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

// ─── COMPONENTS ──────────────────────────────────────────────

function HpBar({ current, max, label, isEnemy }: { current: number; max: number; label: string; isEnemy?: boolean }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "#4CAF50" : pct > 20 ? "#FFC107" : "#F44336";

  return (
    <div style={{
      background: isEnemy ? "#FFF8E1" : "#E3F2FD",
      border: "3px solid #263238",
      borderRadius: 8,
      padding: "8px 12px",
      minWidth: 220,
      boxShadow: "4px 4px 0 #263238",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: "#263238" }}>{label}</span>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#546E7A" }}>
          Lv{isEnemy ? Math.ceil(max / 25) : "??"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#263238" }}>HP</span>
        <div style={{
          flex: 1, height: 10, background: "#263238", borderRadius: 5, overflow: "hidden",
          border: "1px solid #263238",
        }}>
          <div style={{
            width: `${pct}%`, height: "100%", background: color,
            transition: "width 0.6s ease, background 0.4s ease",
            borderRadius: 5,
            boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)`,
          }} />
        </div>
      </div>
      {!isEnemy && (
        <div style={{ textAlign: "right", marginTop: 2 }}>
          <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#263238" }}>
            {Math.max(0, current)}/{max}
          </span>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      fontFamily: "'Press Start 2P'", fontSize: 7, padding: "2px 6px",
      background: TYPE_COLORS[type] || TYPE_COLORS.normal,
      color: "#fff", borderRadius: 3, letterSpacing: 1,
    }}>
      {TYPE_LABELS[type] || "NORM"}
    </span>
  );
}

function TextBox({ lines, onAdvance, showArrow }: { lines: string[]; onAdvance?: () => void; showArrow?: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const fullText = lines.join("\n");
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayedText("");
    setCharIndex(0);
  }, [fullText]);

  useEffect(() => {
    if (charIndex < fullText.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 22);
      return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
    }
  }, [charIndex, fullText]);

  const isComplete = charIndex >= fullText.length;

  const handleClick = () => {
    if (!isComplete) {
      setDisplayedText(fullText);
      setCharIndex(fullText.length);
    } else if (onAdvance) {
      onAdvance();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "#FAFAFA",
        border: "4px solid #263238",
        borderRadius: 10,
        padding: "14px 18px",
        minHeight: 70,
        cursor: "pointer",
        position: "relative",
        boxShadow: "inset 0 0 0 2px #90A4AE, 6px 6px 0 #263238",
        userSelect: "none",
      }}
    >
      <p style={{
        fontFamily: "'Press Start 2P'", fontSize: 11, lineHeight: 2.2,
        color: "#263238", margin: 0, whiteSpace: "pre-wrap",
        minHeight: 50,
      }}>
        {displayedText}
      </p>
      {isComplete && showArrow && (
        <span style={{
          position: "absolute", bottom: 8, right: 14,
          fontFamily: "'Press Start 2P'", fontSize: 12, color: "#263238",
          animation: "bounce 1s infinite",
        }}>&#x25BC;</span>
      )}
    </div>
  );
}

function MoveButton({ move, onClick, disabled }: { move: Move; onClick: () => void; disabled: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "'Press Start 2P'", fontSize: 10,
        padding: "12px 10px",
        background: disabled ? "#BDBDBD" : hover ? "#FFF3E0" : "#FFFFFF",
        border: `3px solid ${disabled ? "#9E9E9E" : "#263238"}`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        boxShadow: disabled ? "none" : hover ? "3px 3px 0 #263238" : "4px 4px 0 #263238",
        transform: hover && !disabled ? "translate(-1px, -1px)" : "none",
        display: "flex", flexDirection: "column", gap: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ color: "#263238" }}>{move.name}</span>
        <TypeBadge type={move.type} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 7, color: "#78909C" }}>
        <span>PWR {move.dmg}</span>
        <span>PP {move.pp}</span>
      </div>
    </button>
  );
}

function BattleSprite({ emoji, isEnemy, isHit, isAttacking }: { emoji: string; isEnemy?: boolean; isHit?: boolean; isAttacking?: boolean }) {
  return (
    <div style={{
      fontSize: isEnemy ? 64 : 72,
      transition: "all 0.2s ease",
      transform: isHit
        ? "translateX(10px)"
        : isAttacking
          ? (isEnemy ? "translateX(-20px)" : "translateX(20px)")
          : "none",
      opacity: isHit ? 0.5 : 1,
      filter: isHit ? "brightness(2) saturate(0)" : "none",
      animation: isHit ? "shake 0.3s ease" : "none",
      textShadow: "4px 4px 0 rgba(0,0,0,0.15)",
    }}>
      {emoji}
    </div>
  );
}

function XpBar({ xp, xpToNext, level }: { xp: number; xpToNext: number; level: number }) {
  const pct = (xp / xpToNext) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFD54F" }}>Lv.{level}</span>
      <div style={{ flex: 1, height: 6, background: "#263238", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "linear-gradient(90deg, #42A5F5, #66BB6A)",
          transition: "width 0.8s ease",
          borderRadius: 3,
        }} />
      </div>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#90A4AE" }}>{xp}/{xpToNext}</span>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────

function TitleScreen({ onStart }: { onStart: () => void }) {
  const [flicker, setFlicker] = useState(true);
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
      {/* Stars */}
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

      {/* Logo */}
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

      {/* Building silhouette */}
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

      {/* Start button */}
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
        PRESS START
      </button>

      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 7, color: "#64B5F6",
        position: "absolute", bottom: 12, zIndex: 2,
      }}>
        &copy; 2026 ADRIAN LUMLEY
      </div>
    </div>
  );
}

function ClassSelect({ onSelect }: { onSelect: (cls: PlayerClass) => void }) {
  const [selected, setSelected] = useState(0);

  const cls = PLAYER_CLASSES[selected];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "linear-gradient(180deg, #263238 0%, #37474F 100%)",
      padding: 20, gap: 16,
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 12, color: "#FFD54F",
        textAlign: "center", textShadow: "2px 2px 0 #E65100",
      }}>
        CHOOSE YOUR CLASS
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {PLAYER_CLASSES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelected(i)}
            style={{
              width: 90, padding: "12px 8px",
              background: selected === i ? "#FFF8E1" : "#455A64",
              border: `3px solid ${selected === i ? "#FFC107" : "#546E7A"}`,
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: selected === i ? "4px 4px 0 #263238, inset 0 0 12px rgba(255,193,7,0.15)" : "2px 2px 0 #263238",
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 32 }}>{c.emoji}</span>
            <span style={{
              fontFamily: "'Press Start 2P'", fontSize: 7,
              color: selected === i ? "#263238" : "#B0BEC5",
              textAlign: "center", lineHeight: 1.5,
            }}>
              {c.name}
            </span>
          </button>
        ))}
      </div>

      {/* Stats panel */}
      <div style={{
        background: "#FAFAFA", border: "4px solid #263238", borderRadius: 10,
        padding: 16, boxShadow: "inset 0 0 0 2px #90A4AE, 6px 6px 0 #263238",
        flex: 1, display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>{cls.emoji}</span>
          <div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: "#263238" }}>{cls.name}</div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#78909C", marginTop: 4 }}>{cls.desc}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {([
            ["HP", cls.maxHp, "#4CAF50"],
            ["ATK", cls.atk, "#F44336"],
            ["DEF", cls.def, "#2196F3"],
            ["SPD", cls.spd, "#FF9800"],
          ] as const).map(([label, val, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#263238", width: 30 }}>{label}</span>
              <div style={{ flex: 1, height: 8, background: "#E0E0E0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(val / 20) * 100}%`, height: "100%", background: color, borderRadius: 4, maxWidth: "100%" }} />
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#546E7A", width: 24, textAlign: "right" }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#263238", marginTop: 4 }}>MOVES:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {cls.moves.map((m) => (
            <div key={m.name} style={{
              padding: "6px 8px", background: "#F5F5F5", borderRadius: 4,
              border: "1px solid #E0E0E0", display: "flex", flexDirection: "column", gap: 2,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#263238" }}>{m.name}</span>
                <TypeBadge type={m.type} />
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#9E9E9E" }}>{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSelect(PLAYER_CLASSES[selected])}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 12, padding: "14px 30px",
          background: "#FFC107", border: "4px solid #263238", borderRadius: 10,
          cursor: "pointer", boxShadow: "6px 6px 0 #263238", color: "#263238",
          alignSelf: "center",
        }}
      >
        CONFIRM
      </button>
    </div>
  );
}

function BattleScreen({
  player, enemy, playerHp, enemyHp, onMove, log, turn, playerPp, xp, xpToNext, level, floor,
}: {
  player: PlayerClass;
  enemy: Enemy;
  playerHp: number;
  enemyHp: number;
  onMove: (idx: number) => void;
  log: string[];
  turn: string;
  playerPp: number[];
  xp: number;
  xpToNext: number;
  level: number;
  floor: number;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 40%, #A5D6A7 100%)",
      position: "relative",
    }}>
      {/* Floor indicator */}
      <div style={{
        position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#2E7D32",
        background: "rgba(255,255,255,0.7)", padding: "4px 12px", borderRadius: 10,
        border: "2px solid #4CAF50", zIndex: 5,
      }}>
        FLOOR {floor}/6
      </div>

      {/* Battle field */}
      <div style={{ flex: 1, position: "relative", padding: "12px 16px", minHeight: 220 }}>
        {/* Ground pattern */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(0deg, #8D6E63 0%, #A1887F 30%, transparent 100%)",
          opacity: 0.3,
        }} />

        {/* Enemy area */}
        <div style={{ position: "absolute", top: 40, right: 16 }}>
          <HpBar current={enemyHp} max={enemy.maxHp} label={enemy.name.toUpperCase()} isEnemy />
        </div>
        <div style={{ position: "absolute", top: 80, right: 50 }}>
          <BattleSprite emoji={enemy.emoji} isEnemy />
          <div style={{
            width: 60, height: 12, background: "rgba(0,0,0,0.15)",
            borderRadius: "50%", margin: "4px auto 0",
          }} />
        </div>

        {/* Player area */}
        <div style={{ position: "absolute", bottom: 60, left: 16 }}>
          <HpBar current={playerHp} max={player.maxHp} label={player.name.toUpperCase()} />
          <div style={{ marginTop: 4 }}>
            <XpBar xp={xp} xpToNext={xpToNext} level={level} />
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 50, left: 60 }}>
          <BattleSprite emoji={player.emoji} />
          <div style={{
            width: 70, height: 14, background: "rgba(0,0,0,0.15)",
            borderRadius: "50%", margin: "4px auto 0",
          }} />
        </div>
      </div>

      {/* Bottom panel */}
      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {log.length > 0 && (
          <TextBox
            lines={[log[log.length - 1]]}
            showArrow={turn !== "player"}
            onAdvance={() => {}}
          />
        )}

        {turn === "player" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {player.moves.map((m, i) => (
              <MoveButton
                key={m.name}
                move={m}
                disabled={playerPp[i] <= 0}
                onClick={() => onMove(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VictoryScreen({ enemy, xpGained, onContinue, leveledUp, newLevel }: {
  enemy: Enemy; xpGained: number; onContinue: () => void; leveledUp: boolean; newLevel: number;
}) {
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
      <div style={{ fontSize: 64 }}>{enemy.emoji}</div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 11, color: "#FFFFFF",
        textAlign: "center", lineHeight: 2,
      }}>
        {enemy.name} was defeated!
      </div>

      <div style={{
        background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 10, padding: 16, textAlign: "center",
        maxWidth: 280,
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

function GameOverScreen({ floor, onRestart }: { floor: number; onRestart: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 24, padding: 30,
      background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 14, color: "#F44336",
        textShadow: "2px 2px 0 #B71C1C",
      }}>
        GAME OVER
      </div>
      <div style={{ fontSize: 64 }}>&#x1F4BC;</div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 9, color: "#90A4AE",
        textAlign: "center", lineHeight: 2.4,
        maxWidth: 280,
      }}>
        You were eliminated on<br />
        Floor {floor}.<br /><br />
        The corporate ladder<br />claims another soul.
      </div>
      <button
        onClick={onRestart}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: 11, padding: "14px 30px",
          background: "#FFC107", border: "4px solid #263238", borderRadius: 10,
          cursor: "pointer", boxShadow: "6px 6px 0 #263238", color: "#263238",
        }}
      >
        TRY AGAIN
      </button>
    </div>
  );
}

function WinScreen({ player, onRestart }: { player: PlayerClass; onRestart: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 30,
      background: "linear-gradient(180deg, #FF6F00 0%, #FFA000 30%, #FFC107 60%, #FFD54F 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Confetti */}
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
      <div style={{ fontSize: 72 }}>&#x1F451;</div>
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

function FloorIntro({ enemy, onReady }: { enemy: Enemy; onReady: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => setShow(true), 200);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 20, padding: 30,
      background: "#0D0D0D",
      cursor: "pointer",
    }} onClick={onReady}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, color: "#F44336",
        letterSpacing: 4,
        opacity: show ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}>
        FLOOR {enemy.floor}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 14, color: "#FFFFFF",
        textAlign: "center", lineHeight: 1.8,
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.3s",
        textShadow: "2px 2px 0 #F44336",
      }}>
        {enemy.title}
      </div>
      <div style={{
        fontSize: 72,
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.5s",
        transform: show ? "scale(1)" : "scale(0.5)",
      }}>
        {enemy.emoji}
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 8, color: "#616161",
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 1s",
        animation: show ? "pulse 2s infinite" : "none",
      }}>
        TAP TO BATTLE
      </div>
    </div>
  );
}

// ─── MAIN GAME ───────────────────────────────────────────────

type Screen = "title" | "classSelect" | "floorIntro" | "battle" | "victory" | "gameOver" | "win";

export default function CorporateClimb() {
  const [screen, setScreen] = useState<Screen>("title");
  const [player, setPlayer] = useState<PlayerClass | null>(null);
  const [floor, setFloor] = useState(0);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [turn, setTurn] = useState("player");
  const [playerPp, setPlayerPp] = useState<number[]>([]);
  const [xp, setXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(30);
  const [level, setLevel] = useState(1);
  const [xpGained, setXpGained] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);

  const enemy = ENEMIES[floor] || ENEMIES[0];

  const startGame = () => setScreen("classSelect");

  const selectClass = (cls: PlayerClass) => {
    setPlayer(cls);
    setPlayerHp(cls.maxHp);
    setPlayerPp(cls.moves.map((m) => m.pp));
    setFloor(0);
    setXp(0);
    setXpToNext(30);
    setLevel(1);
    setScreen("floorIntro");
  };

  const startBattle = () => {
    const e = ENEMIES[floor];
    setEnemyHp(e.maxHp);
    setLog([`A wild ${e.name} appeared!`]);
    setTurn("player");
    setScreen("battle");
  };

  const calcDamage = (atkStat: number, defStat: number, baseDmg: number) => {
    const variance = 0.85 + Math.random() * 0.3;
    const crit = Math.random() < 0.1 ? 1.5 : 1;
    return Math.max(1, Math.round(((baseDmg * (atkStat / defStat)) * variance * crit)));
  };

  const doPlayerMove = useCallback((moveIdx: number) => {
    if (turn !== "player" || !player) return;
    const move = player.moves[moveIdx];
    const newPp = [...playerPp];
    newPp[moveIdx]--;
    setPlayerPp(newPp);
    const dmg = calcDamage(player.atk + level * 2, enemy.def, move.dmg);
    const newEnemyHp = Math.max(0, enemyHp - dmg);
    setEnemyHp(newEnemyHp);

    let logMsg = `${player.name} used ${move.name}! ${dmg} damage!`;

    if (move.heal) {
      const healAmt = Math.min(move.heal + level, player.maxHp - playerHp);
      setPlayerHp((hp) => Math.min(player.maxHp, hp + healAmt));
      if (healAmt > 0) logMsg += ` Recovered ${healAmt} HP!`;
    }

    setLog((l) => [...l, logMsg]);
    setTurn("waiting");

    if (newEnemyHp <= 0) {
      const gained = 15 + floor * 10;
      const newXp = xp + gained;
      const didLevel = newXp >= xpToNext;
      setXpGained(gained);
      setLeveledUp(didLevel);

      setTimeout(() => {
        if (didLevel) {
          setLevel((l) => l + 1);
          setXp(newXp - xpToNext);
          setXpToNext((x) => x + 20);
          setPlayerHp((hp) => Math.min(player.maxHp + 10, hp + 20));
        } else {
          setXp(newXp);
        }
        setScreen("victory");
      }, 1200);
      return;
    }

    // Enemy turn
    setTimeout(() => {
      const eMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
      const eDmg = calcDamage(enemy.atk, player.def + level, eMove.dmg);

      let eLog = `${enemy.name} used ${eMove.name}! ${eDmg} damage!`;
      if (eMove.heal) {
        setEnemyHp((hp) => Math.min(enemy.maxHp, hp + eMove.heal!));
        eLog += ` Recovered ${eMove.heal} HP!`;
      }

      setPlayerHp((prev) => {
        const newHp = Math.max(0, prev - eDmg);
        if (newHp <= 0) {
          setTimeout(() => setScreen("gameOver"), 1000);
        }
        return newHp;
      });
      setLog((l) => [...l, eLog]);
      setTurn("player");
    }, 1200);
  }, [turn, player, playerPp, level, enemy, enemyHp, playerHp, xp, xpToNext, floor]);

  const handleVictoryContinue = () => {
    if (floor >= ENEMIES.length - 1) {
      setScreen("win");
    } else {
      setFloor((f) => f + 1);
      setScreen("floorIntro");
    }
  };

  const restart = () => {
    setScreen("title");
    setPlayer(null);
    setFloor(0);
    setLevel(1);
    setXp(0);
    setXpToNext(30);
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 420,
      height: "100vh",
      maxHeight: 750,
      margin: "0 auto",
      background: "#000",
      position: "relative",
      overflow: "hidden",
      borderRadius: 0,
      boxShadow: "0 0 60px rgba(0,0,0,0.5)",
    }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }
        @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 0.8; } 50% { opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ width: "100%", height: "100%" }}>
        {screen === "title" && <TitleScreen onStart={startGame} />}
        {screen === "classSelect" && <ClassSelect onSelect={selectClass} />}
        {screen === "floorIntro" && <FloorIntro enemy={ENEMIES[floor]} onReady={startBattle} />}
        {screen === "battle" && player && (
          <BattleScreen
            player={player}
            enemy={enemy}
            playerHp={playerHp}
            enemyHp={enemyHp}
            onMove={doPlayerMove}
            log={log}
            turn={turn}
            playerPp={playerPp}
            xp={xp}
            xpToNext={xpToNext}
            level={level}
            floor={floor + 1}
          />
        )}
        {screen === "victory" && (
          <VictoryScreen
            enemy={enemy}
            xpGained={xpGained}
            leveledUp={leveledUp}
            newLevel={level}
            onContinue={handleVictoryContinue}
          />
        )}
        {screen === "gameOver" && <GameOverScreen floor={floor + 1} onRestart={restart} />}
        {screen === "win" && player && <WinScreen player={player} onRestart={restart} />}
      </div>
    </div>
  );
}
