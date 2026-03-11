import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SFX } from "./sfx";
import { buildSpriteUrls } from "./sprites";

// ─── TYPES ───────────────────────────────────────────────────
type StatusId = "motivated" | "focused" | "caffeinated" | "micromanaged" | "demoralized" | "burned_out";

interface StatusDef {
  id: StatusId;
  name: string;
  icon: string;
  color: string;
  duration: number;
  desc: string;
}

const STATUS_DEFS: Record<StatusId, StatusDef> = {
  motivated:     { id: "motivated",     name: "Motivated",     icon: "\u{1F525}", color: "#FF6F00", duration: 3, desc: "+ATK" },
  focused:       { id: "focused",       name: "Focused",       icon: "\u{1F3AF}", color: "#7B1FA2", duration: 3, desc: "+Crit" },
  caffeinated:   { id: "caffeinated",   name: "Caffeinated",   icon: "\u2615",    color: "#4E342E", duration: 3, desc: "+SPD -DEF" },
  micromanaged:  { id: "micromanaged",  name: "Micromanaged",  icon: "\u{1F441}\uFE0F",  color: "#B71C1C", duration: 2, desc: "-ATK" },
  demoralized:   { id: "demoralized",   name: "Demoralized",   icon: "\u{1F4C9}", color: "#4A148C", duration: 2, desc: "-DEF" },
  burned_out:    { id: "burned_out",    name: "Burned Out",    icon: "\u{1F6AB}", color: "#616161", duration: 3, desc: "DoT" },
};

interface StatusInstance {
  id: StatusId;
  turnsLeft: number;
}

interface StatusEffectOnMove {
  id: StatusId;
  target: "self" | "enemy";
  chance?: number; // 0-1, default 1
}

interface Move {
  name: string;
  dmg: number;
  type: string;
  desc: string;
  pp: number;
  heal?: number;
  status?: StatusEffectOnMove;
}

interface PlayerClass {
  id: string;
  name: string;
  emoji: string;
  spriteId: string;
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
  status?: StatusEffectOnMove;
}

interface Enemy {
  floor: number;
  name: string;
  emoji: string;
  spriteId: string;
  maxHp: number;
  atk: number;
  def: number;
  moves: EnemyMove[];
  defeat: string;
  title: string;
}

// ─── SPRITE SYSTEM (SVG-based, imported from sprites.ts) ────

function useSpriteUrls(): Record<string, string> {
  return useMemo(() => buildSpriteUrls(), []);
}

// ─── GAME DATA ───────────────────────────────────────────────
const PLAYER_CLASSES: PlayerClass[] = [
  {
    id: "pm",
    name: "Product Manager",
    emoji: "📋",
    spriteId: "product_manager",
    maxHp: 100,
    atk: 14,
    def: 10,
    spd: 12,
    desc: "Balances roadmaps and stakeholders. High versatility.",
    moves: [
      { name: "Prioritize Backlog", dmg: 18, type: "strategy", desc: "Ruthlessly cuts scope. Hits hard.", pp: 15, status: { id: "focused", target: "self", chance: 0.4 } },
      { name: "Stakeholder Align", dmg: 12, type: "influence", desc: "Forces agreement through sheer will.", pp: 20, heal: 8, status: { id: "motivated", target: "self" } },
      { name: "Ship MVP", dmg: 28, type: "execution", desc: "80/20 strikes. Maximum impact.", pp: 8 },
      { name: "Data-Driven Roast", dmg: 35, type: "analytics", desc: "Destroys arguments with metrics.", pp: 5, status: { id: "demoralized", target: "enemy", chance: 0.5 } },
    ],
  },
  {
    id: "eng",
    name: "Senior Engineer",
    emoji: "\u2328\uFE0F",
    spriteId: "eng",
    maxHp: 90,
    atk: 18,
    def: 8,
    spd: 14,
    desc: "Writes code and rewrites everything else. Glass cannon.",
    moves: [
      { name: "Refactor Everything", dmg: 22, type: "technical", desc: "Rewrites the opponent from scratch.", pp: 12, status: { id: "motivated", target: "self", chance: 0.4 } },
      { name: "Deploy to Prod", dmg: 30, type: "execution", desc: "YOLO push on Friday. Risky but devastating.", pp: 8, status: { id: "caffeinated", target: "self" } },
      { name: "Code Review Reject", dmg: 15, type: "technical", desc: "Nit-picks until they give up.", pp: 20, status: { id: "micromanaged", target: "enemy" } },
      { name: "Stack Overflow", dmg: 40, type: "analytics", desc: "Channels the collective wisdom. Huge damage.", pp: 4 },
    ],
  },
  {
    id: "design",
    name: "UX Designer",
    emoji: "🎨",
    spriteId: "design",
    maxHp: 85,
    atk: 12,
    def: 12,
    spd: 16,
    desc: "Sees what others can't. Fast and balanced.",
    moves: [
      { name: "Pixel Perfect Punch", dmg: 20, type: "execution", desc: "That 1px misalignment? Fixed violently.", pp: 15, status: { id: "focused", target: "self", chance: 0.3 } },
      { name: "User Research Beam", dmg: 16, type: "analytics", desc: "\u201CActually, users said\u2026\u201D", pp: 18, heal: 6, status: { id: "demoralized", target: "enemy", chance: 0.4 } },
      { name: "Figma Tornado", dmg: 26, type: "technical", desc: "200 frames of animated fury.", pp: 10 },
      { name: "Design System Slam", dmg: 38, type: "strategy", desc: "Enforces consistency. Crushing blow.", pp: 4, status: { id: "motivated", target: "self", chance: 0.5 } },
    ],
  },
];

const ENEMIES: Enemy[] = [
  {
    floor: 1, name: "Intern", emoji: "🥤", spriteId: "intern", maxHp: 50, atk: 6, def: 4,
    moves: [{ name: "Eager Question", dmg: 8 }, { name: "Coffee Run", dmg: 5, heal: 10 }],
    defeat: "The intern learned a valuable lesson today.",
    title: "THE EAGER INTERN",
  },
  {
    floor: 2, name: "Recruiter", emoji: "📞", spriteId: "recruiter", maxHp: 65, atk: 9, def: 5,
    moves: [{ name: "LinkedIn Spam", dmg: 10 }, { name: "Lowball Offer", dmg: 14 }],
    defeat: "\u201CLet\u2019s circle back when you have more budget.\u201D",
    title: "THE PERSISTENT RECRUITER",
  },
  {
    floor: 3, name: "Scrum Master", emoji: "📝", spriteId: "scrum", maxHp: 80, atk: 10, def: 8,
    moves: [{ name: "Standup Ambush", dmg: 12, status: { id: "micromanaged", target: "enemy" } }, { name: "Sprint Overload", dmg: 16, status: { id: "burned_out", target: "enemy", chance: 0.4 } }, { name: "Retro Guilt Trip", dmg: 10, heal: 8 }],
    defeat: "The daily standup has been cancelled. Forever.",
    title: "THE RELENTLESS SCRUM MASTER",
  },
  {
    floor: 4, name: "Middle Manager", emoji: "👔", spriteId: "manager", maxHp: 100, atk: 12, def: 10,
    moves: [{ name: "Unnecessary Meeting", dmg: 14, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Passive-Aggressive Email", dmg: 18, status: { id: "demoralized", target: "enemy", chance: 0.5 } }, { name: "Take Credit", dmg: 8, heal: 15, status: { id: "motivated", target: "self" } }],
    defeat: "\u201CPer my last email\u2026 I resign.\u201D",
    title: "THE MIDDLE MANAGER",
  },
  {
    floor: 5, name: "VP of Synergy", emoji: "🎯", spriteId: "vp", maxHp: 130, atk: 15, def: 12,
    moves: [{ name: "Buzzword Barrage", dmg: 16, status: { id: "micromanaged", target: "enemy", chance: 0.6 } }, { name: "Pivot Strategy", dmg: 22, status: { id: "demoralized", target: "enemy", chance: 0.4 } }, { name: "Executive Presence", dmg: 12, heal: 12, status: { id: "motivated", target: "self" } }],
    defeat: "Synergy has been disrupted. The paradigm shifts.",
    title: "THE VP OF SYNERGY",
  },
  {
    floor: 6, name: "C-Suite Boss", emoji: "👑", spriteId: "boss", maxHp: 180, atk: 20, def: 15,
    moves: [{ name: "Golden Parachute", dmg: 10, heal: 25, status: { id: "motivated", target: "self" } }, { name: "Hostile Takeover", dmg: 28, status: { id: "demoralized", target: "enemy", chance: 0.6 } }, { name: "Board Meeting Beam", dmg: 35, status: { id: "burned_out", target: "enemy", chance: 0.5 } }, { name: "Layoff Wave", dmg: 22, status: { id: "micromanaged", target: "enemy" } }],
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

const FONT_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

// ─── HALLWAY EVENTS ──────────────────────────────────────────
interface HallwayEvent {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  choices: {
    label: string;
    effect: { hp?: number; atk?: number; def?: number; ppRestore?: number };
    result: string;
    isGood: boolean;
  }[];
}

const HALLWAY_EVENTS: HallwayEvent[] = [
  {
    id: "coffee_machine",
    title: "BREAK ROOM",
    desc: "You stumble upon an unattended coffee machine. The good stuff \u2014 not that instant garbage.",
    emoji: "\u2615",
    choices: [
      { label: "Grab a double shot", effect: { hp: 25 }, result: "The caffeine hits immediately. You feel alive again.", isGood: true },
      { label: "Take the whole pot", effect: { hp: 40, def: -1 }, result: "You chug the entire pot. Jittery but ENERGIZED. Your hands won't stop shaking though.", isGood: true },
      { label: "Pass \u2014 stay focused", effect: { atk: 1 }, result: "Discipline over comfort. Your resolve strengthens.", isGood: true },
    ],
  },
  {
    id: "office_gossip",
    title: "WATER COOLER",
    desc: "Two VPs are whispering by the water cooler. You could eavesdrop and learn about your next opponent...",
    emoji: "\uD83D\uDDE3\uFE0F",
    choices: [
      { label: "Eavesdrop carefully", effect: { atk: 2 }, result: "You overhear their weaknesses. Knowledge is power.", isGood: true },
      { label: "Join the conversation", effect: { def: 1, hp: -10 }, result: "They rope you into a 20-minute chat about golf. Draining, but they like you now.", isGood: true },
      { label: "Walk past quickly", effect: { hp: 10 }, result: "You avoid the drama. Peace of mind is its own reward.", isGood: true },
    ],
  },
  {
    id: "sensitivity_training",
    title: "MANDATORY TRAINING",
    desc: "HR ambushes you. \"We need you for a quick sensitivity training. It'll only take an hour.\"",
    emoji: "\uD83D\uDCCB",
    choices: [
      { label: "Attend willingly", effect: { def: 2, hp: -15 }, result: "It was NOT quick. But you learned about \"psychological safety\" which is... something.", isGood: true },
      { label: "Fake a meeting conflict", effect: { atk: 1 }, result: "\"Sorry, syncing with stakeholders!\" You dodge it smoothly. Confidence boost.", isGood: true },
      { label: "Actually engage", effect: { def: 3, hp: -20, ppRestore: 2 }, result: "You genuinely participate. HR is shocked. You feel weirdly refreshed.", isGood: true },
    ],
  },
  {
    id: "supply_closet",
    title: "SUPPLY CLOSET",
    desc: "The supply closet is unlocked. Inside: premium sticky notes, a Red Bull, and someone's hidden snack stash.",
    emoji: "\uD83D\uDCE6",
    choices: [
      { label: "Grab the Red Bull", effect: { hp: 30, atk: 1 }, result: "Wings acquired. You feel unstoppable (for about 45 minutes).", isGood: true },
      { label: "Raid the snack stash", effect: { hp: 20, ppRestore: 3 }, result: "Trail mix, protein bars, and... is that a full sleeve of Oreos? Jackpot.", isGood: true },
      { label: "Take the sticky notes", effect: { def: 2 }, result: "Premium 3M Super Sticky notes. Your organizational armor is now impenetrable.", isGood: true },
    ],
  },
  {
    id: "elevator_pitch",
    title: "ELEVATOR ENCOUNTER",
    desc: "You're stuck in the elevator with the CEO for 30 floors. They look at you expectantly.",
    emoji: "\uD83D\uDEBB",
    choices: [
      { label: "Pitch your idea", effect: { atk: 3, hp: -15 }, result: "\"Interesting. Send me a deck.\" Your heart is POUNDING but your confidence soars.", isGood: true },
      { label: "Make small talk", effect: { def: 1, hp: 10 }, result: "\"Nice weather, right?\" The CEO smiles. You survive. That's a win.", isGood: true },
      { label: "Stare at your phone", effect: { hp: -5 }, result: "The CEO notices. Noted. Literally \u2014 they wrote something down.", isGood: false },
    ],
  },
  {
    id: "printer_jam",
    title: "PRINTER CRISIS",
    desc: "The printer is jammed. A line of 6 people is forming. You're the only one who might know how to fix it.",
    emoji: "\uD83D\uDDA8\uFE0F",
    choices: [
      { label: "Fix it heroically", effect: { atk: 2, def: 1 }, result: "You clear the jam. The crowd applauds. You are now the Office Hero.", isGood: true },
      { label: "Pretend you didn't see", effect: { hp: 5 }, result: "Not your problem. You slip away with your sanity intact.", isGood: true },
      { label: "Kick it", effect: { atk: 3, hp: -10 }, result: "It... actually works? The printer whirs to life. Your foot hurts but respect is earned.", isGood: true },
    ],
  },
  {
    id: "birthday_cake",
    title: "BIRTHDAY PARTY",
    desc: "Someone you barely know is having a birthday in the break room. There's cake.",
    emoji: "\uD83C\uDF82",
    choices: [
      { label: "Eat cake, sing along", effect: { hp: 35, ppRestore: 2 }, result: "The cake is surprisingly good. Costco sheet cake never disappoints.", isGood: true },
      { label: "Take cake, skip singing", effect: { hp: 20 }, result: "You ninja a corner piece and disappear. Efficient.", isGood: true },
      { label: "Skip it entirely", effect: { atk: 1 }, result: "\"Too busy crushing it.\" You channel the grind energy.", isGood: true },
    ],
  },
  {
    id: "it_ticket",
    title: "IT HELP DESK",
    desc: "The IT desk has one spot open. You could get your laptop looked at \u2014 it's been running slow.",
    emoji: "\uD83D\uDCBB",
    choices: [
      { label: "Get a RAM upgrade", effect: { atk: 2, def: 1 }, result: "16GB \u2192 32GB. Your machine (and your mind) runs faster.", isGood: true },
      { label: "Clear the bloatware", effect: { ppRestore: 4 }, result: "They remove 14 startup programs. Everything feels fresh.", isGood: true },
      { label: "\"It's fine, actually\"", effect: { hp: 5 }, result: "You walk away. The slow laptop builds character. Allegedly.", isGood: true },
    ],
  },
];

// ─── ANIMATION TYPES ─────────────────────────────────────────
type AnimState = "idle" | "attacking" | "hit" | "faint";

interface DamagePopup {
  id: number;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  isHeal: boolean;
}

// ─── COMPONENTS ──────────────────────────────────────────────

function PixelSprite({
  spriteId,
  size = 80,
  animState = "idle",
  flip = false,
}: {
  spriteId: string;
  size?: number;
  animState?: AnimState;
  flip?: boolean;
}) {
  const sprites = useSpriteUrls();
  const url = sprites[spriteId];

  const animClass =
    animState === "attacking" ? "sprite-attack" :
    animState === "hit" ? "sprite-hit" :
    animState === "faint" ? "sprite-faint" :
    "sprite-idle";

  return (
    <div
      className={animClass}
      style={{
        height: size,
        width: size * 0.8, // 4:5 aspect ratio matching SVG viewBox 128x160
        position: "relative",
        transform: flip ? "scaleX(-1)" : "none",
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            imageRendering: "auto",
            display: "block",
          }}
          draggable={false}
        />
      )}
    </div>
  );
}

function HpBar({ current, max, label, isEnemy }: { current: number; max: number; label: string; isEnemy?: boolean }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "#48D868" : pct > 20 ? "#F8D030" : "#F85858";
  const lvl = isEnemy ? Math.ceil(max / 25) : "??";

  return (
    <div style={{
      background: "#F8F0D8",
      border: "3px solid #484848",
      borderRadius: 6,
      padding: "6px 10px 6px 10px",
      minWidth: 190,
      position: "relative",
      boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
    }}>
      {/* Name row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: "#383838", letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#585858" }}>
          <span style={{ fontSize: 6, verticalAlign: "top" }}>Lv</span>{lvl}
        </span>
      </div>
      {/* HP bar row */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#F8A800", fontWeight: "bold" }}>HP</span>
        <div style={{
          flex: 1, height: 8, background: "#484848", borderRadius: 4, overflow: "hidden",
          border: "1px solid #383838",
        }}>
          <div style={{
            width: `${pct}%`, height: "100%", background: color,
            transition: "width 0.5s ease, background 0.3s ease",
            borderRadius: 4,
            boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)`,
          }} />
        </div>
      </div>
      {/* HP numbers (player only) */}
      {!isEnemy && (
        <div style={{ textAlign: "right", marginTop: 2 }}>
          <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: "#383838" }}>
            {Math.max(0, current)}<span style={{ color: "#888", fontSize: 7 }}> / {max}</span>
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

  useEffect(() => {
    setDisplayedText("");
    setCharIndex(0);
  }, [fullText]);

  useEffect(() => {
    if (charIndex < fullText.length) {
      const t = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 22);
      return () => clearTimeout(t);
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
        fontFamily: "'Press Start 2P'", fontSize: 10, lineHeight: 2.2,
        color: "#263238", margin: 0, whiteSpace: "pre-wrap",
        minHeight: 44,
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

function StatusBadges({ statuses }: { statuses: StatusInstance[] }) {
  if (statuses.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
      {statuses.map((s) => {
        const def = STATUS_DEFS[s.id];
        return (
          <span
            key={s.id}
            title={`${def.name} (${def.desc}) - ${s.turnsLeft} turns`}
            style={{
              background: def.color,
              color: "#fff",
              borderRadius: 4,
              padding: "1px 4px",
              fontFamily: "'Press Start 2P'",
              fontSize: 6,
              display: "flex",
              alignItems: "center",
              gap: 2,
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: 9 }}>{def.icon}</span>
            <span>{s.turnsLeft}</span>
          </span>
        );
      })}
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
        fontFamily: "'Press Start 2P'", fontSize: 9,
        padding: "10px 8px",
        background: disabled ? "#BDBDBD" : hover ? "#FFF3E0" : "#FFFFFF",
        border: `3px solid ${disabled ? "#9E9E9E" : "#263238"}`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        boxShadow: disabled ? "none" : hover ? "3px 3px 0 #263238" : "4px 4px 0 #263238",
        transform: hover && !disabled ? "translate(-1px, -1px)" : "none",
        display: "flex", flexDirection: "column", gap: 4,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <span style={{ color: "#263238" }}>{move.name}</span>
        <TypeBadge type={move.type} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 7, color: "#78909C" }}>
        <span>PWR {move.dmg}{move.status ? ` ${STATUS_DEFS[move.status.id].icon}` : ""}</span>
        <span>PP {move.pp}</span>
      </div>
    </button>
  );
}

function DamageNumber({ popup }: { popup: DamagePopup }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: popup.x,
        top: popup.y,
        fontFamily: "'Press Start 2P'",
        fontSize: popup.isCrit ? 16 : 12,
        color: popup.isHeal ? "#4CAF50" : popup.isCrit ? "#FFD54F" : "#F44336",
        textShadow: "2px 2px 0 #263238, -1px -1px 0 #263238",
        pointerEvents: "none",
        zIndex: 20,
        animation: "dmg-float 1s ease-out forwards",
      }}
    >
      {popup.isHeal ? "+" : "-"}{popup.value}
      {popup.isCrit && <span style={{ fontSize: 8, display: "block", color: "#FF6F00" }}>CRIT!</span>}
    </div>
  );
}

function XpBar({ xp, xpToNext, level }: { xp: number; xpToNext: number; level: number }) {
  const pct = (xp / xpToNext) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#FFD54F" }}>Lv.{level}</span>
      <div style={{ flex: 1, height: 6, background: "#263238", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "linear-gradient(90deg, #42A5F5, #66BB6A)",
          transition: "width 0.8s ease",
          borderRadius: 3,
        }} />
      </div>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#90A4AE" }}>{xp}/{xpToNext}</span>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────

function TitleScreen({ onStart }: { onStart: () => void }) {
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

      {/* Character parade */}
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
  const sprites = useSpriteUrls();
  const cls = PLAYER_CLASSES[selected];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "linear-gradient(180deg, #263238 0%, #37474F 100%)",
      padding: 20, gap: 14,
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
              width: 100, padding: "12px 8px",
              background: selected === i ? "#FFF8E1" : "#455A64",
              border: `3px solid ${selected === i ? "#FFC107" : "#546E7A"}`,
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: selected === i ? "4px 4px 0 #263238, inset 0 0 12px rgba(255,193,7,0.15)" : "2px 2px 0 #263238",
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
          >
            <div className="sprite-idle" style={{ width: 48, height: 48 }}>
              <img src={sprites[c.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
            </div>
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
        padding: 14, boxShadow: "inset 0 0 0 2px #90A4AE, 6px 6px 0 #263238",
        flex: 1, display: "flex", flexDirection: "column", gap: 8, overflow: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <div style={{ width: 40, height: 40 }}>
            <img src={sprites[cls.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
          </div>
          <div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: "#263238" }}>{cls.name}</div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#78909C", marginTop: 4 }}>{cls.desc}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {([
            ["HP", cls.maxHp, "#4CAF50"],
            ["ATK", cls.atk, "#F44336"],
            ["DEF", cls.def, "#2196F3"],
            ["SPD", cls.spd, "#FF9800"],
          ] as const).map(([label, val, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#263238", width: 26 }}>{label}</span>
              <div style={{ flex: 1, height: 7, background: "#E0E0E0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${(val / 20) * 100}%`, height: "100%", background: color, borderRadius: 3, maxWidth: "100%" }} />
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#546E7A", width: 24, textAlign: "right" }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: "#263238", marginTop: 2 }}>MOVES:</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {cls.moves.map((m) => (
            <div key={m.name} style={{
              padding: "5px 6px", background: "#F5F5F5", borderRadius: 4,
              border: "1px solid #E0E0E0", display: "flex", flexDirection: "column", gap: 2,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#263238" }}>{m.name}</span>
                <TypeBadge type={m.type} />
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: "#9E9E9E" }}>{m.desc}</span>
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
  playerAnim, enemyAnim, damagePopups, screenShake, moveTypeColor,
  playerStatuses, enemyStatuses,
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
  playerAnim: AnimState;
  enemyAnim: AnimState;
  damagePopups: DamagePopup[];
  screenShake: boolean;
  moveTypeColor: string | null;
  playerStatuses: StatusInstance[];
  enemyStatuses: StatusInstance[];
}) {
  // Floor-based battle scenes
  const isDark = floor >= 6;
  const fi = Math.min(floor - 1, 5);

  // Backgrounds: wall color + floor color + accent
  const scenes = [
    { wall: "#E8E0D0", wallBot: "#D8D0B8", floor: "#C8B898", floorDk: "#B0A080", accent: "#90A4AE" }, // 1: Cubicle
    { wall: "#D6E8F0", wallBot: "#B8D4E8", floor: "#90A4AE", floorDk: "#78909C", accent: "#1565C0" }, // 2: Open office
    { wall: "#F5E8D0", wallBot: "#E8D8B8", floor: "#A08060", floorDk: "#886848", accent: "#F9A825" }, // 3: Conference
    { wall: "#D8D8D8", wallBot: "#C0C0C0", floor: "#909090", floorDk: "#787878", accent: "#607D8B" }, // 4: Manager
    { wall: "#D8C8F0", wallBot: "#C0A8E0", floor: "#8860C0", floorDk: "#6840A0", accent: "#FFD54F" }, // 5: Executive
    { wall: "#181828", wallBot: "#101020", floor: "#201018", floorDk: "#100810", accent: "#FFD700" }, // 6: C-Suite
  ];
  const sc = scenes[fi];

  return (
    <div
      className={screenShake ? "screen-shake" : ""}
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        background: `linear-gradient(180deg, ${sc.wall} 0%, ${sc.wallBot} 55%, ${sc.floor} 55%, ${sc.floorDk} 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Wall details */}
      {fi < 5 && (
        <>
          {/* Baseboard / wall-floor edge */}
          <div style={{ position: "absolute", top: "54%", left: 0, right: 0, height: 4, background: sc.accent, opacity: 0.4, zIndex: 1 }} />
          {/* Floor tile lines for depth */}
          {[60, 70, 82].map((pct, i) => (
            <div key={i} style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: 1, background: sc.floorDk, opacity: 0.2, zIndex: 1 }} />
          ))}
        </>
      )}
      {fi === 5 && (
        <>
          {/* C-suite: gold trim + red carpet */}
          <div style={{ position: "absolute", top: "53%", left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #B8860B, #FFD700, #B8860B)", opacity: 0.6, zIndex: 1 }} />
          <div style={{ position: "absolute", top: "55%", bottom: 0, left: "35%", right: "35%", background: "linear-gradient(180deg, #8B0000 0%, #B71C1C 100%)", opacity: 0.3, zIndex: 1 }} />
        </>
      )}

      {/* Move type flash */}
      {moveTypeColor && (
        <div style={{
          position: "absolute", inset: 0,
          background: moveTypeColor,
          opacity: 0.15,
          zIndex: 10,
          pointerEvents: "none",
          animation: "flash-fade 0.4s ease-out forwards",
        }} />
      )}

      {/* Battle field */}
      <div style={{ flex: 1, position: "relative", minHeight: 300 }}>

        {/* ═══ ENEMY SIDE (top) ═══ */}
        {/* Enemy platform — ellipse on the floor */}
        <div style={{
          position: "absolute", top: "44%", right: 10,
          width: 200, height: 36,
          background: `radial-gradient(ellipse, ${isDark ? "#38182866" : "#00000022"} 0%, transparent 70%)`,
          borderRadius: "50%",
          zIndex: 1,
        }} />
        {/* Enemy sprite — standing on platform */}
        <div style={{ position: "absolute", top: "2%", right: 20, zIndex: 2 }}>
          <PixelSprite spriteId={enemy.spriteId} size={220} animState={enemyAnim} flip />
        </div>
        {/* Enemy HP panel — top left */}
        <div style={{ position: "absolute", top: 12, left: 8, zIndex: 4 }}>
          <HpBar current={enemyHp} max={enemy.maxHp} label={enemy.name.toUpperCase()} isEnemy />
          <StatusBadges statuses={enemyStatuses} />
        </div>

        {/* ═══ PLAYER SIDE (bottom) ═══ */}
        {/* Player platform — ellipse on the floor */}
        <div style={{
          position: "absolute", bottom: "2%", left: 0,
          width: 220, height: 36,
          background: `radial-gradient(ellipse, ${isDark ? "#38182866" : "#00000022"} 0%, transparent 70%)`,
          borderRadius: "50%",
          zIndex: 1,
        }} />
        {/* Player sprite — standing on platform */}
        <div style={{ position: "absolute", bottom: "4%", left: 10, zIndex: 2 }}>
          <PixelSprite spriteId={player.spriteId} size={240} animState={playerAnim} />
        </div>
        {/* Player HP panel — bottom right */}
        <div style={{ position: "absolute", bottom: 6, right: 8, zIndex: 4 }}>
          <HpBar current={playerHp} max={player.maxHp} label={player.name.toUpperCase()} />
          <StatusBadges statuses={playerStatuses} />
          <div style={{ marginTop: 2 }}>
            <XpBar xp={xp} xpToNext={xpToNext} level={level} />
          </div>
        </div>

        {/* Floor indicator — subtle */}
        <div style={{
          position: "absolute", top: 6, right: 8,
          fontFamily: "'Press Start 2P'", fontSize: 7,
          color: isDark ? "#FFD54F88" : "#00000044",
          zIndex: 3,
        }}>
          F{floor}/6
        </div>

        {/* Damage popups */}
        {damagePopups.map((p) => (
          <DamageNumber key={p.id} popup={p} />
        ))}
      </div>

      {/* Bottom panel */}
      <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {log.length > 0 && (
          <TextBox
            lines={[log[log.length - 1]]}
            showArrow={turn !== "player"}
            onAdvance={() => {}}
          />
        )}

        {turn === "player" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
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
  const sprites = useSpriteUrls();
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
      <div style={{ width: 80, height: 80, opacity: 0.5 }}>
        <img src={sprites[enemy.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto", filter: "grayscale(1)" }} draggable={false} />
      </div>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 11, color: "#FFFFFF",
        textAlign: "center", lineHeight: 2,
      }}>
        {enemy.name} was defeated!
      </div>

      <div style={{
        background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: 10, padding: 16, textAlign: "center", maxWidth: 280,
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
        textAlign: "center", lineHeight: 2.4, maxWidth: 280,
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

function HallwayEventScreen({
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
    setTimeout(() => onChoice(idx), 2000);
  };

  const choice = chosen !== null ? event.choices[chosen] : null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", gap: 16, padding: 24,
      background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    }}>
      {/* HP display */}
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
        </div>
      )}
    </div>
  );
}

function FloorIntro({ enemy, onReady }: { enemy: Enemy; onReady: () => void }) {
  const [show, setShow] = useState(false);
  const sprites = useSpriteUrls();

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
        width: 96, height: 96,
        opacity: show ? 1 : 0,
        transition: "opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s",
        transform: show ? "scale(1)" : "scale(0.5)",
      }}>
        <img src={sprites[enemy.spriteId]} alt="" style={{ width: "100%", height: "100%", imageRendering: "auto" }} draggable={false} />
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

type Screen = "title" | "classSelect" | "floorIntro" | "battle" | "victory" | "gameOver" | "win" | "hallwayEvent";

let popupIdCounter = 0;

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

  // Stat buffs from events
  const [atkBuff, setAtkBuff] = useState(0);
  const [defBuff, setDefBuff] = useState(0);

  // Status effects
  const [playerStatuses, setPlayerStatuses] = useState<StatusInstance[]>([]);
  const [enemyStatuses, setEnemyStatuses] = useState<StatusInstance[]>([]);

  // Hallway event
  const [currentEvent, setCurrentEvent] = useState<HallwayEvent | null>(null);
  const usedEventsRef = useRef<Set<string>>(new Set());

  // Animation state
  const [playerAnim, setPlayerAnim] = useState<AnimState>("idle");
  const [enemyAnim, setEnemyAnim] = useState<AnimState>("idle");
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [moveTypeColor, setMoveTypeColor] = useState<string | null>(null);

  const enemy = ENEMIES[floor] || ENEMIES[0];

  const addDamagePopup = (value: number, isEnemy: boolean, isCrit: boolean, isHeal: boolean) => {
    const popup: DamagePopup = {
      id: popupIdCounter++,
      value,
      x: isEnemy ? 200 + Math.random() * 60 : 60 + Math.random() * 60,
      y: isEnemy ? 70 + Math.random() * 30 : 130 + Math.random() * 30,
      isCrit,
      isHeal,
    };
    setDamagePopups((prev) => [...prev, popup]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== popup.id));
    }, 1100);
  };

  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  };

  const flashMoveType = (type: string) => {
    setMoveTypeColor(TYPE_COLORS[type] || null);
    setTimeout(() => setMoveTypeColor(null), 400);
  };

  const applyStatus = (statusEffect: StatusEffectOnMove, isPlayerAttacking: boolean) => {
    const chance = statusEffect.chance ?? 1;
    if (Math.random() > chance) return null;

    const def = STATUS_DEFS[statusEffect.id];
    const newStatus: StatusInstance = { id: statusEffect.id, turnsLeft: def.duration };

    // "self" means the attacker, "enemy" means the target
    const applyToPlayer = (isPlayerAttacking && statusEffect.target === "self") ||
                          (!isPlayerAttacking && statusEffect.target === "enemy");

    if (applyToPlayer) {
      setPlayerStatuses((prev) => {
        const filtered = prev.filter((s) => s.id !== statusEffect.id);
        return [...filtered, newStatus];
      });
    } else {
      setEnemyStatuses((prev) => {
        const filtered = prev.filter((s) => s.id !== statusEffect.id);
        return [...filtered, newStatus];
      });
    }
    return def;
  };

  const tickStatuses = (setStatuses: typeof setPlayerStatuses) => {
    setStatuses((prev) =>
      prev.map((s) => ({ ...s, turnsLeft: s.turnsLeft - 1 })).filter((s) => s.turnsLeft > 0)
    );
  };

  const getStatusAtkMod = (statuses: StatusInstance[]): number => {
    let mod = 0;
    for (const s of statuses) {
      if (s.id === "motivated") mod += 4;
      if (s.id === "micromanaged") mod -= 4;
    }
    return mod;
  };

  const getStatusDefMod = (statuses: StatusInstance[]): number => {
    let mod = 0;
    for (const s of statuses) {
      if (s.id === "caffeinated") mod -= 3;
      if (s.id === "demoralized") mod -= 3;
    }
    return mod;
  };

  const getStatusCritBonus = (statuses: StatusInstance[]): number => {
    return statuses.some((s) => s.id === "focused") ? 0.2 : 0;
  };

  const getBurnDamage = (statuses: StatusInstance[]): number => {
    return statuses.some((s) => s.id === "burned_out") ? 8 : 0;
  };

  const startGame = () => {
    SFX.menuSelect();
    setScreen("classSelect");
  };

  const selectClass = (cls: PlayerClass) => {
    SFX.menuConfirm();
    setPlayer(cls);
    setPlayerHp(cls.maxHp);
    setPlayerPp(cls.moves.map((m) => m.pp));
    setFloor(0);
    setXp(0);
    setXpToNext(30);
    setLevel(1);
    setAtkBuff(0);
    setDefBuff(0);
    usedEventsRef.current.clear();
    setScreen("floorIntro");
  };

  const startBattle = () => {
    const e = ENEMIES[floor];
    setEnemyHp(e.maxHp);
    setLog([`A wild ${e.name} appeared!`]);
    setTurn("player");
    setPlayerAnim("idle");
    setEnemyAnim("idle");
    setDamagePopups([]);
    setPlayerStatuses([]);
    setEnemyStatuses([]);
    if (floor >= 5) SFX.bossIntro();
    else SFX.enemyAppear();
    setScreen("battle");
  };

  const pickRandomEvent = (): HallwayEvent | null => {
    const available = HALLWAY_EVENTS.filter((e) => !usedEventsRef.current.has(e.id));
    if (available.length === 0) {
      usedEventsRef.current.clear();
      return HALLWAY_EVENTS[Math.floor(Math.random() * HALLWAY_EVENTS.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleEventChoice = (choiceIdx: number) => {
    if (!currentEvent || !player) return;
    const choice = currentEvent.choices[choiceIdx];
    const eff = choice.effect;

    if (eff.hp) {
      setPlayerHp((hp) => Math.max(1, Math.min(player.maxHp + atkBuff * 5, hp + eff.hp!)));
    }
    if (eff.atk) setAtkBuff((b) => b + eff.atk!);
    if (eff.def) setDefBuff((b) => b + eff.def!);
    if (eff.ppRestore) {
      setPlayerPp((pp) => pp.map((v, i) => Math.min(player.moves[i].pp, v + eff.ppRestore!)));
    }

    usedEventsRef.current.add(currentEvent.id);

    setTimeout(() => {
      setScreen("floorIntro");
    }, 0);
  };

  const calcDamage = (atkStat: number, defStat: number, baseDmg: number, critBonus: number = 0): [number, boolean] => {
    const variance = 0.85 + Math.random() * 0.3;
    const isCrit = Math.random() < (0.1 + critBonus);
    const crit = isCrit ? 1.5 : 1;
    return [Math.max(1, Math.round(baseDmg * (Math.max(1, atkStat) / Math.max(1, defStat)) * variance * crit)), isCrit];
  };

  const doPlayerMove = useCallback((moveIdx: number) => {
    if (turn !== "player" || !player) return;
    const move = player.moves[moveIdx];
    const newPp = [...playerPp];
    newPp[moveIdx]--;
    setPlayerPp(newPp);

    // Player attack animation
    setPlayerAnim("attacking");
    flashMoveType(move.type);
    SFX.attackSwing();

    setTimeout(() => {
      setPlayerAnim("idle");
      const playerAtkMod = getStatusAtkMod(playerStatuses);
      const enemyDefMod = getStatusDefMod(enemyStatuses);
      const playerCritBonus = getStatusCritBonus(playerStatuses);
      const [dmg, isCrit] = calcDamage(player.atk + level * 2 + atkBuff + playerAtkMod, enemy.def + enemyDefMod, move.dmg, playerCritBonus);
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      setEnemyAnim("hit");
      triggerShake();
      addDamagePopup(dmg, true, isCrit, false);
      if (isCrit) SFX.critHit(); else SFX.hit();

      let logMsg = `${player.name} used ${move.name}! ${dmg} damage!`;
      if (isCrit) logMsg += " Critical hit!";

      // Apply status effect from move
      if (move.status) {
        const applied = applyStatus(move.status, true);
        if (applied) {
          logMsg += ` ${move.status.target === "self" ? player.name : enemy.name} is ${applied.name}!`;
        }
      }

      if (move.heal) {
        const healAmt = Math.min(move.heal + level, player.maxHp - playerHp);
        setPlayerHp((hp) => Math.min(player.maxHp, hp + healAmt));
        if (healAmt > 0) {
          logMsg += ` Recovered ${healAmt} HP!`;
          addDamagePopup(healAmt, false, false, true);
          SFX.heal();
        }
      }

      setLog((l) => [...l, logMsg]);
      setTurn("waiting");

      setTimeout(() => setEnemyAnim("idle"), 400);

      if (newEnemyHp <= 0) {
        setTimeout(() => { setEnemyAnim("faint"); SFX.faint(); }, 500);
        const gained = 15 + floor * 10;
        const newXp = xp + gained;
        const didLevel = newXp >= xpToNext;
        setXpGained(gained);
        setLeveledUp(didLevel);

        setTimeout(() => {
          SFX.victory();
          if (didLevel) {
            setLevel((l) => l + 1);
            setXp(newXp - xpToNext);
            setXpToNext((x) => x + 20);
            setPlayerHp((hp) => Math.min(player.maxHp + 10, hp + 20));
            setTimeout(() => SFX.levelUp(), 600);
          } else {
            setXp(newXp);
          }
          setScreen("victory");
        }, 1500);
        return;
      }

      // Tick enemy statuses (burn damage, duration)
      const enemyBurn = getBurnDamage(enemyStatuses);
      if (enemyBurn > 0) {
        setTimeout(() => {
          setEnemyHp((hp) => Math.max(0, hp - enemyBurn));
          addDamagePopup(enemyBurn, true, false, false);
          setLog((l) => [...l, `${enemy.name} is burned out! -${enemyBurn} HP!`]);
        }, 500);
      }
      tickStatuses(setEnemyStatuses);

      // Enemy turn
      setTimeout(() => {
        // Tick player burn at start of enemy turn
        const playerBurn = getBurnDamage(playerStatuses);
        if (playerBurn > 0) {
          setPlayerHp((hp) => {
            const newHp = Math.max(0, hp - playerBurn);
            if (newHp <= 0) {
              setTimeout(() => {
                setPlayerAnim("faint");
                SFX.faint();
                setTimeout(() => { SFX.gameOver(); setScreen("gameOver"); }, 1000);
              }, 400);
            }
            return newHp;
          });
          addDamagePopup(playerBurn, false, false, false);
          setLog((l) => [...l, `${player.name} is burned out! -${playerBurn} HP!`]);
        }

        const eMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
        setEnemyAnim("attacking");
        SFX.attackSwing();

        setTimeout(() => {
          setEnemyAnim("idle");
          const enemyAtkMod = getStatusAtkMod(enemyStatuses);
          const playerDefMod = getStatusDefMod(playerStatuses);
          const enemyCritBonus = getStatusCritBonus(enemyStatuses);
          const [eDmg, eCrit] = calcDamage(enemy.atk + enemyAtkMod, player.def + level + defBuff + playerDefMod, eMove.dmg, enemyCritBonus);

          let eLog = `${enemy.name} used ${eMove.name}! ${eDmg} damage!`;
          if (eCrit) eLog += " Critical hit!";

          // Apply status effect from enemy move
          if (eMove.status) {
            const applied = applyStatus(eMove.status, false);
            if (applied) {
              eLog += ` ${eMove.status.target === "self" ? enemy.name : player.name} is ${applied.name}!`;
            }
          }

          setPlayerAnim("hit");
          triggerShake();
          addDamagePopup(eDmg, false, eCrit, false);
          if (eCrit) SFX.critHit(); else SFX.hit();

          if (eMove.heal) {
            setEnemyHp((hp) => Math.min(enemy.maxHp, hp + eMove.heal!));
            eLog += ` Recovered ${eMove.heal} HP!`;
            addDamagePopup(eMove.heal!, true, false, true);
          }

          setPlayerHp((prev) => {
            const newHp = Math.max(0, prev - eDmg);
            if (newHp <= 0) {
              setTimeout(() => {
                setPlayerAnim("faint");
                SFX.faint();
                setTimeout(() => { SFX.gameOver(); setScreen("gameOver"); }, 1000);
              }, 400);
            }
            return newHp;
          });
          setLog((l) => [...l, eLog]);

          // Tick player statuses at end of round
          tickStatuses(setPlayerStatuses);

          setTimeout(() => {
            setPlayerAnim("idle");
            setTurn("player");
          }, 500);
        }, 300);
      }, 800);
    }, 350);
  }, [turn, player, playerPp, level, enemy, enemyHp, playerHp, xp, xpToNext, floor, playerStatuses, enemyStatuses]);

  const handleVictoryContinue = () => {
    SFX.menuConfirm();
    if (floor >= ENEMIES.length - 1) {
      SFX.fanfare();
      setScreen("win");
    } else {
      setFloor((f) => f + 1);
      // Show hallway event between floors (not before floor 1)
      const evt = pickRandomEvent();
      if (evt) {
        setCurrentEvent(evt);
        setScreen("hallwayEvent");
      } else {
        setScreen("floorIntro");
      }
    }
  };

  const restart = () => {
    SFX.menuSelect();
    setScreen("title");
    setPlayer(null);
    setFloor(0);
    setLevel(1);
    setXp(0);
    setXpToNext(30);
    setAtkBuff(0);
    setDefBuff(0);
    usedEventsRef.current.clear();
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
      boxShadow: "0 0 60px rgba(0,0,0,0.5)",
    }}>
      <link href={FONT_URL} rel="stylesheet" />
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }
        @keyframes confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 0.8; } 50% { opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }

        @keyframes sprite-breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes sprite-attack-right {
          0% { transform: translateX(0); }
          30% { transform: translateX(40px) scale(1.1); }
          60% { transform: translateX(40px) scale(1.1); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes sprite-attack-left {
          0% { transform: translateX(0); }
          30% { transform: translateX(-40px) scale(1.1); }
          60% { transform: translateX(-40px) scale(1.1); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes sprite-hit-flash {
          0% { filter: brightness(1); transform: translateX(0); }
          20% { filter: brightness(3) saturate(0); transform: translateX(8px); }
          40% { filter: brightness(1); transform: translateX(-6px); }
          60% { filter: brightness(2) saturate(0); transform: translateX(4px); }
          80% { filter: brightness(1); transform: translateX(-2px); }
          100% { filter: brightness(1); transform: translateX(0); }
        }
        @keyframes sprite-faint {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          50% { opacity: 0.5; transform: translateY(10px) rotate(10deg); }
          100% { opacity: 0; transform: translateY(30px) rotate(20deg); }
        }
        @keyframes dmg-float {
          0% { opacity: 1; transform: translateY(0) scale(1.3); }
          20% { transform: translateY(-12px) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
        @keyframes flash-fade {
          0% { opacity: 0.25; }
          100% { opacity: 0; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes screen-shake-anim {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -2px); }
          30% { transform: translate(-3px, 3px); }
          40% { transform: translate(3px, -1px); }
          50% { transform: translate(-2px, 2px); }
          60% { transform: translate(2px, -2px); }
          70% { transform: translate(-1px, 1px); }
          80% { transform: translate(1px, -1px); }
          90% { transform: translate(-1px, 0px); }
        }

        .sprite-idle { animation: sprite-breathe 2s ease-in-out infinite; }
        .sprite-attack { animation: sprite-attack-right 0.5s ease-out; }
        .sprite-hit { animation: sprite-hit-flash 0.4s ease-out; }
        .sprite-faint { animation: sprite-faint 0.8s ease-out forwards; }
        .screen-shake { animation: screen-shake-anim 0.3s ease-out; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div style={{ width: "100%", height: "100%" }}>
        {screen === "title" && <TitleScreen onStart={startGame} />}
        {screen === "classSelect" && <ClassSelect onSelect={selectClass} />}
        {screen === "hallwayEvent" && currentEvent && player && (
          <HallwayEventScreen
            event={currentEvent}
            onChoice={handleEventChoice}
            playerHp={playerHp}
            playerMaxHp={player.maxHp}
          />
        )}
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
            playerAnim={playerAnim}
            enemyAnim={enemyAnim}
            damagePopups={damagePopups}
            screenShake={screenShake}
            moveTypeColor={moveTypeColor}
            playerStatuses={playerStatuses}
            enemyStatuses={enemyStatuses}
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
