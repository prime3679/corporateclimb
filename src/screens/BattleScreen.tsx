import { useState } from "react";
import type { PlayerClass, Enemy, AnimState, DamagePopup, StatusInstance, Move, ItemId } from "../types";
import { TYPE_COLORS, TYPE_LABELS, ITEMS, TOTAL_FLOORS, getAct } from "../data";
import PixelSprite from "../components/PixelSprite";
import HpBar from "../components/HpBar";
import StatusBadges from "../components/StatusBadges";
import XpBar from "../components/XpBar";
import TextBox from "../components/TextBox";
import MoveButton from "../components/MoveButton";
import DamageNumber from "../components/DamageNumber";

export default function BattleScreen({
  player, enemy, playerHp, enemyHp, onMove, onUseItem, log, turn, playerPp, xp, xpToNext, level, floor,
  playerAnim, enemyAnim, damagePopups, screenShake, moveTypeColor,
  playerStatuses, enemyStatuses, activeMoves,
  inventory, battleMode, onSetBattleMode,
  promotionTitle, playerMaxHp,
}: {
  player: PlayerClass;
  enemy: Enemy;
  playerHp: number;
  enemyHp: number;
  onMove: (idx: number) => void;
  onUseItem: (idx: number) => void;
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
  activeMoves: Move[];
  inventory: ItemId[];
  battleMode: "fight" | "items";
  onSetBattleMode: (mode: "fight" | "items") => void;
  promotionTitle?: string;
  playerMaxHp: number;
}) {
  const act = getAct(floor);
  const isDark = act >= 2;
  const totalFloors = TOTAL_FLOORS;

  // Act 1: warm office, Act 2: cool corporate, Act 3: dark executive
  type ScenePalette = { wall: string; wallBot: string; floor: string; floorDk: string; accent: string };
  const actScenes: Record<number, ScenePalette[]> = {
    1: [
      { wall: "#E8E0D0", wallBot: "#D8D0B8", floor: "#C8B898", floorDk: "#B0A080", accent: "#90A4AE" },
      { wall: "#D6E8F0", wallBot: "#B8D4E8", floor: "#90A4AE", floorDk: "#78909C", accent: "#1565C0" },
      { wall: "#F5E8D0", wallBot: "#E8D8B8", floor: "#A08060", floorDk: "#886848", accent: "#F9A825" },
      { wall: "#D8D8D8", wallBot: "#C0C0C0", floor: "#909090", floorDk: "#787878", accent: "#607D8B" },
      { wall: "#D8C8F0", wallBot: "#C0A8E0", floor: "#8860C0", floorDk: "#6840A0", accent: "#FFD54F" },
    ],
    2: [
      { wall: "#C8D8E8", wallBot: "#A8C0D8", floor: "#6080A0", floorDk: "#486888", accent: "#78909C" },
      { wall: "#B8C8D8", wallBot: "#98B0C8", floor: "#507090", floorDk: "#385870", accent: "#607D8B" },
      { wall: "#A8B8C8", wallBot: "#8898B0", floor: "#405870", floorDk: "#304058", accent: "#546E7A" },
      { wall: "#98A8B8", wallBot: "#7888A0", floor: "#384860", floorDk: "#283848", accent: "#455A64" },
      { wall: "#202838", wallBot: "#182030", floor: "#281828", floorDk: "#181020", accent: "#B8860B" },
    ],
    3: [
      { wall: "#282030", wallBot: "#201828", floor: "#181020", floorDk: "#100810", accent: "#B8860B" },
      { wall: "#201828", wallBot: "#181020", floor: "#140C18", floorDk: "#0C0810", accent: "#DAA520" },
      { wall: "#1C1424", wallBot: "#140C1C", floor: "#100814", floorDk: "#08040C", accent: "#FFD700" },
      { wall: "#181020", wallBot: "#100818", floor: "#0C0410", floorDk: "#080008", accent: "#FFD700" },
      { wall: "#100818", wallBot: "#080410", floor: "#06020C", floorDk: "#040006", accent: "#FFD700" },
    ],
  };
  const scenes = actScenes[act] || actScenes[1];
  const fi = Math.min((floor % 10), scenes.length - 1);
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
      {act === 1 && (
        <>
          <div style={{ position: "absolute", top: "54%", left: 0, right: 0, height: 4, background: sc.accent, opacity: 0.4, zIndex: 1 }} />
          {[60, 70, 82].map((pct, i) => (
            <div key={i} style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: 1, background: sc.floorDk, opacity: 0.2, zIndex: 1 }} />
          ))}
        </>
      )}
      {act === 2 && (
        <>
          <div style={{ position: "absolute", top: "53%", left: 0, right: 0, height: 4, background: sc.accent, opacity: 0.5, zIndex: 1 }} />
          {[62, 74].map((pct, i) => (
            <div key={i} style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: 1, background: sc.floorDk, opacity: 0.15, zIndex: 1 }} />
          ))}
        </>
      )}
      {act === 3 && (
        <>
          <div style={{ position: "absolute", top: "53%", left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #B8860B, #FFD700, #B8860B)", opacity: 0.6, zIndex: 1 }} />
          <div style={{ position: "absolute", top: "55%", bottom: 0, left: "35%", right: "35%", background: "linear-gradient(180deg, #8B0000 0%, #B71C1C 100%)", opacity: 0.3, zIndex: 1 }} />
        </>
      )}

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

      <div style={{ flex: 1, position: "relative", minHeight: 220 }}>
        <div style={{
          position: "absolute", top: "44%", right: 10,
          width: 150, height: 28,
          background: `radial-gradient(ellipse, ${isDark ? "#38182866" : "#00000022"} 0%, transparent 70%)`,
          borderRadius: "50%",
          zIndex: 1,
        }} />
        <div style={{ position: "absolute", top: "2%", right: 20, zIndex: 2 }}>
          <PixelSprite spriteId={enemy.spriteId} size={160} animState={enemyAnim} flip />
        </div>
        <div style={{ position: "absolute", top: 12, left: 8, zIndex: 4 }}>
          <HpBar current={enemyHp} max={enemy.maxHp} label={enemy.name.toUpperCase()} isEnemy />
          <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
            {enemy.types.map(t => (
              <span key={t} style={{
                fontFamily: "'Press Start 2P'", fontSize: 5, padding: "1px 4px",
                background: TYPE_COLORS[t], color: "#fff", borderRadius: 2, opacity: 0.85,
              }}>{TYPE_LABELS[t]}</span>
            ))}
          </div>
          <StatusBadges statuses={enemyStatuses} />
        </div>

        <div style={{
          position: "absolute", bottom: "2%", left: 0,
          width: 170, height: 28,
          background: `radial-gradient(ellipse, ${isDark ? "#38182866" : "#00000022"} 0%, transparent 70%)`,
          borderRadius: "50%",
          zIndex: 1,
        }} />
        <div style={{ position: "absolute", bottom: "4%", left: 10, zIndex: 2 }}>
          <PixelSprite spriteId={player.spriteId} size={180} animState={playerAnim} />
        </div>
        <div style={{ position: "absolute", bottom: 6, right: 8, zIndex: 4 }}>
          <HpBar current={playerHp} max={playerMaxHp} label={(promotionTitle || player.name).toUpperCase()} />
          <StatusBadges statuses={playerStatuses} />
          <div style={{ marginTop: 2 }}>
            <XpBar xp={xp} xpToNext={xpToNext} level={level} />
          </div>
        </div>

        <div style={{
          position: "absolute", top: 6, right: 8,
          fontFamily: "'Press Start 2P'", fontSize: 7,
          color: isDark ? "#FFD54F88" : "#00000044",
          zIndex: 3,
        }}>
          F{floor}/{totalFloors}
        </div>

        {damagePopups.map((p) => (
          <DamageNumber key={p.id} popup={p} />
        ))}
      </div>

      <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {log.length > 0 && (
          <TextBox
            lines={log.length >= 2 ? [log[log.length - 2], log[log.length - 1]] : [log[log.length - 1]]}
            showArrow={turn !== "player"}
            onAdvance={() => {}}
          />
        )}

        {turn === "player" && (
          <>
            {/* Mode tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
              <button
                onClick={() => onSetBattleMode("fight")}
                style={{
                  fontFamily: "'Press Start 2P'", fontSize: 9,
                  padding: "12px 18px",
                  background: battleMode === "fight" ? "#FFC107" : "#455A64",
                  color: battleMode === "fight" ? "#263238" : "#B0BEC5",
                  border: "2px solid #263238",
                  borderRadius: "6px 6px 0 0",
                  cursor: "pointer",
                  borderBottom: battleMode === "fight" ? "2px solid #FFC107" : "2px solid #263238",
                }}
              >
                FIGHT
              </button>
              <button
                onClick={() => onSetBattleMode("items")}
                style={{
                  fontFamily: "'Press Start 2P'", fontSize: 9,
                  padding: "12px 18px",
                  background: battleMode === "items" ? "#FFC107" : "#455A64",
                  color: battleMode === "items" ? "#263238" : "#B0BEC5",
                  border: "2px solid #263238",
                  borderRadius: "6px 6px 0 0",
                  cursor: "pointer",
                  borderBottom: battleMode === "items" ? "2px solid #FFC107" : "2px solid #263238",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                ITEMS
                {inventory.length > 0 && (
                  <span style={{
                    fontSize: 6, background: "#E53935", color: "#fff",
                    borderRadius: "50%", width: 14, height: 14,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {inventory.length}
                  </span>
                )}
              </button>
            </div>

            {battleMode === "fight" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {activeMoves.map((m, i) => (
                  <MoveButton
                    key={m.name}
                    move={m}
                    currentPp={i < playerPp.length ? playerPp[i] : m.pp}
                    disabled={i < playerPp.length && playerPp[i] <= 0}
                    onClick={() => onMove(i)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {inventory.length === 0 ? (
                  <div style={{
                    gridColumn: "1 / -1",
                    fontFamily: "'Press Start 2P'", fontSize: 8, color: "#78909C",
                    textAlign: "center", padding: 16,
                    background: "#FAFAFA", border: "3px solid #263238", borderRadius: 8,
                  }}>
                    No items
                  </div>
                ) : (
                  inventory.map((itemId, i) => {
                    const item = ITEMS[itemId];
                    return (
                      <ItemButton key={`${itemId}-${i}`} item={item} onClick={() => onUseItem(i)} />
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ItemButton({ item, onClick }: { item: import("../types").ItemDef; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "'Press Start 2P'", fontSize: 9,
        padding: "14px 10px",
        background: hover ? "#E8F5E9" : "#FFFFFF",
        border: "3px solid #263238",
        borderRadius: 8,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        boxShadow: hover ? "3px 3px 0 #263238" : "4px 4px 0 #263238",
        transform: hover ? "translate(-1px, -1px)" : "none",
        display: "flex", flexDirection: "column", gap: 4,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
        <span style={{ fontSize: 14 }}>{item.emoji}</span>
        <span style={{ color: "#263238", fontSize: 9 }}>{item.name}</span>
      </div>
      <div style={{ fontSize: 7, color: "#78909C", lineHeight: 1.6 }}>
        {item.desc}
      </div>
    </button>
  );
}
