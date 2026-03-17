import { useState, useEffect, useCallback, useRef } from "react";
import { SFX } from "./sfx";
import { Music } from "./music";
import { buildSpriteUrls } from "./sprites";
import type { Screen, AnimState, DamagePopup, StatusInstance, StatusEffectOnMove, PlayerClass, Move, ItemId, PromotionTier } from "./types";
import {
  STATUS_DEFS, TYPE_COLORS, PLAYER_CLASSES, ENEMIES, HALLWAY_EVENTS, FONT_URL, ITEMS,
  CLASS_STARTING_ITEMS, ALL_ITEM_IDS, ENEMY_POOLS, ACHIEVEMENTS,
  getTypeMultiplier, saveGame, loadGame, clearSave,
  rollFloorEnemies, getFloorEnemy,
  scaleEnemyForNgPlus, getBestNgPlus, saveBestNgPlus,
  checkAchievements, getUnlockedAchievements,
  getPromotion, getEffectivePlayer, getAct,
} from "./data";
import { TitleScreen, ClassSelect, BattleScreen, VictoryScreen, GameOverScreen, WinScreen, HallwayEventScreen, FloorIntro, RouteChoice } from "./screens";
import PromotionScreen from "./screens/PromotionScreen";
import ActTransitionScreen from "./screens/ActTransitionScreen";
import DailyPreScreen from "./screens/DailyPreScreen";
import DailyResultScreen from "./screens/DailyResultScreen";
import { createSeededRandom, getDailySeed, getDailyModifier, getDailyFloorMap, rollDailyEnemies, calculateDailyScore, saveDailyResult, DAILY_FLOOR_COUNT } from "./daily";
import type { DailyModifierContext } from "./types";

// ─── STRUGGLE MOVE (fallback when all PP depleted) ──────────
const STRUGGLE_MOVE: Move = {
  name: "Struggle",
  dmg: 5,
  type: "normal",
  desc: "Desperation. Hurts you too.",
  pp: 999,
};

const MAX_INVENTORY = 4;

// ─── SPRITE PRELOADER ────────────────────────────────────────
function useSpritePreloader(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const urls = Object.values(buildSpriteUrls());
    let cancelled = false;
    Promise.all(urls.map(u => {
      const img = new Image();
      img.src = u;
      return img.decode().catch(() => {});
    })).then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);
  return ready;
}

let popupIdCounter = 0;

// ─── MAIN GAME ───────────────────────────────────────────────
export default function CorporateClimb() {
  const spritesReady = useSpritePreloader();
  const [screen, setScreenRaw] = useState<Screen>("title");
  const [fadeClass, setFadeClass] = useState<"in" | "out">("in");

  // Wrap screen changes in a fade transition
  const setScreen = useCallback((next: Screen) => {
    setFadeClass("out");
    setTimeout(() => {
      setScreenRaw(next);
      setFadeClass("in");
    }, 200);
  }, []);
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
  const [currentEvent, setCurrentEvent] = useState<import("./types").HallwayEvent | null>(null);
  const usedEventsRef = useRef<Set<string>>(new Set());

  // Route choice (2 events to pick from)
  const [routeOptions, setRouteOptions] = useState<[import("./types").HallwayEvent, import("./types").HallwayEvent] | null>(null);

  // Inventory
  const [inventory, setInventory] = useState<ItemId[]>([]);

  // Enemy variants — rolled once per run
  const [floorEnemyIds, setFloorEnemyIds] = useState<string[]>([]);

  // New Game+ level (0 = first playthrough)
  const [ngPlus, setNgPlus] = useState(0);

  // Stats tracking for share card + achievements
  const [totalTurns, setTotalTurns] = useState(0);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [itemsUsed, setItemsUsed] = useState(0);
  const [newAchievements, setNewAchievements] = useState<import("./types").AchievementId[]>([]);

  // Phase 2 boss tracking
  const [enemyPhase, setEnemyPhase] = useState<1 | 2>(1);

  // Daily challenge state
  const [dailyMode, setDailyMode] = useState(false);
  const [dailyFloorMap, setDailyFloorMap] = useState<number[]>([]);
  const [dailyModifierCtx, setDailyModifierCtx] = useState<DailyModifierContext | null>(null);
  const dailyRngRef = useRef<(() => number) | null>(null);

  // Music mute (persisted in localStorage)
  const [muted, setMuted] = useState(() => localStorage.getItem("cc_muted") === "1");

  // Animation state
  const [playerAnim, setPlayerAnim] = useState<AnimState>("idle");
  const [enemyAnim, setEnemyAnim] = useState<AnimState>("idle");
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [moveTypeColor, setMoveTypeColor] = useState<string | null>(null);

  // Battle sub-mode: "fight" or "items"
  const [battleMode, setBattleMode] = useState<"fight" | "items">("fight");

  // Promotion / act transition state
  const [pendingPromotion, setPendingPromotion] = useState<{ old: PromotionTier; new: PromotionTier } | null>(null);
  const [pendingActTransition, setPendingActTransition] = useState<number | null>(null);
  const [nextFloorAfterScreens, setNextFloorAfterScreens] = useState<number | null>(null);

  // Music: sync mute state on mount and when toggled
  useEffect(() => {
    Music.setMuted(muted);
    localStorage.setItem("cc_muted", muted ? "1" : "0");
  }, [muted]);

  // Music: play track based on current screen
  useEffect(() => {
    switch (screen) {
      case "title":
      case "classSelect":
        Music.playTitle();
        break;
      case "battle":
        if (floor % 10 >= 8) Music.playBoss();
        else Music.playBattle();
        break;
      case "hallwayEvent":
      case "floorIntro":
      case "routeChoice":
        Music.playEvent();
        break;
      case "victory":
      case "win":
      case "gameOver":
        Music.stop();
        break;
    }
  }, [screen, floor]);

  // In daily mode, map logical floor (0-14) to actual enemy pool index
  const actualFloorIndex = dailyMode ? (dailyFloorMap[floor] ?? floor) : floor;

  // Current enemy resolved from variant pool, scaled for NG+
  const rawEnemy = floorEnemyIds.length > 0
    ? getFloorEnemy(actualFloorIndex, floorEnemyIds[floor])
    : ENEMIES[actualFloorIndex] || ENEMIES[0];
  const scaledEnemy = scaleEnemyForNgPlus(rawEnemy, ngPlus);

  // Apply daily modifier multipliers to enemy stats
  const dailyEnemy = (dailyMode && dailyModifierCtx) ? {
    ...scaledEnemy,
    maxHp: Math.round(scaledEnemy.maxHp * dailyModifierCtx.enemyHpMult),
    atk: Math.round(scaledEnemy.atk * dailyModifierCtx.enemyAtkMult),
    def: Math.round(scaledEnemy.def * dailyModifierCtx.enemyDefMult),
  } : scaledEnemy;

  // Apply phase 2 overrides if active
  const enemy: import("./types").Enemy = (enemyPhase === 2 && dailyEnemy.phase2) ? {
    ...dailyEnemy,
    name: dailyEnemy.phase2.name ?? dailyEnemy.name,
    emoji: dailyEnemy.phase2.emoji ?? dailyEnemy.emoji,
    maxHp: dailyEnemy.phase2.maxHp,
    atk: dailyEnemy.phase2.atk ?? dailyEnemy.atk,
    def: dailyEnemy.phase2.def ?? dailyEnemy.def,
    types: dailyEnemy.phase2.types ?? dailyEnemy.types,
    moves: dailyEnemy.phase2.moves,
  } : dailyEnemy;

  // Derive effective player with promotion boosts
  const effectivePlayer = player ? getEffectivePlayer(player, player.id, floor) : null;
  const promotionTier = player ? getPromotion(player.id, floor) : null;

  // Ref to avoid stale closures
  const gsRef = useRef({ player, effectivePlayer, playerHp, enemyHp, playerPp, level, atkBuff, defBuff, xp, xpToNext, floor, enemy, turn, playerStatuses, enemyStatuses, inventory, enemyPhase });
  gsRef.current = { player, effectivePlayer, playerHp, enemyHp, playerPp, level, atkBuff, defBuff, xp, xpToNext, floor, enemy, turn, playerStatuses, enemyStatuses, inventory, enemyPhase };

  // ─── Determine active moves (regular or Struggle) ─────────
  const allPpDepleted = player ? playerPp.every((pp) => pp <= 0) : false;
  const activeMoves: Move[] = effectivePlayer
    ? allPpDepleted
      ? [STRUGGLE_MOVE]
      : effectivePlayer.moves
    : [];

  /** Seeded random in daily mode, Math.random() otherwise */
  const rng = useCallback(() => (dailyMode && dailyRngRef.current) ? dailyRngRef.current() : Math.random(), [dailyMode]);

  const handleGameOver = useCallback(() => {
    if (dailyMode) {
      const score = calculateDailyScore({ floorsCleared: floor, totalTurns, totalDamageDealt, hpRemaining: 0, won: false });
      saveDailyResult({ seed: getDailySeed(), classId: player?.id || "", score, floorsCleared: floor, totalTurns, totalDamageDealt, hpRemaining: 0, won: false, modifierId: getDailyModifier(getDailySeed()).id });
      SFX.gameOver();
      setScreen("dailyResult");
    } else {
      clearSave();
      SFX.gameOver();
      setScreen("gameOver");
    }
  }, [dailyMode, floor, totalTurns, totalDamageDealt, player, setScreen]);

  const addDamagePopup = (value: number, isEnemy: boolean, isCrit: boolean, isHeal: boolean, label?: string, labelColor?: string) => {
    const popup: DamagePopup = {
      id: popupIdCounter++,
      value,
      x: isEnemy ? 200 + Math.random() * 60 : 60 + Math.random() * 60,
      y: isEnemy ? 70 + Math.random() * 30 : 130 + Math.random() * 30,
      isCrit,
      isHeal,
      label,
      labelColor,
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
    if (rng() > chance) return null;

    const def = STATUS_DEFS[statusEffect.id];
    const newStatus: StatusInstance = { id: statusEffect.id, turnsLeft: def.duration };

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

  // ─── Item use (consumes a turn) ───────────────────────────
  const useItem = useCallback((itemIdx: number) => {
    const gs = gsRef.current;
    if (gs.turn !== "player" || !gs.player) return;

    const itemId = gs.inventory[itemIdx];
    if (!itemId) return;
    const item = ITEMS[itemId];

    // Remove from inventory
    setInventory((inv) => inv.filter((_, i) => i !== itemIdx));
    setItemsUsed((n) => n + 1);
    setBattleMode("fight");
    setTurn("waiting");

    let logMsg = `Used ${item.name}!`;
    SFX.heal();

    if (item.effect.hp) {
      const healAmt = Math.min(item.effect.hp, gs.player.maxHp - gs.playerHp);
      if (healAmt > 0) {
        setPlayerHp((hp) => Math.min((gs.effectivePlayer || gs.player!).maxHp, hp + healAmt));
        addDamagePopup(healAmt, false, false, true);
        logMsg += ` Restored ${healAmt} HP!`;
      }
    }
    if (item.effect.atk) {
      setAtkBuff((b) => b + item.effect.atk!);
      logMsg += ` ATK +${item.effect.atk}!`;
    }
    if (item.effect.def) {
      setDefBuff((b) => b + item.effect.def!);
      logMsg += ` DEF +${item.effect.def}!`;
    }
    if (item.effect.ppRestore) {
      setPlayerPp((pp) => pp.map((v, i) => Math.min(gs.player!.moves[i].pp, v + item.effect.ppRestore!)));
      logMsg += " PP restored!";
    }
    if (item.effect.status) {
      applyStatus({ id: item.effect.status.id, target: "self", chance: 1 }, true);
      logMsg += ` ${STATUS_DEFS[item.effect.status.id].name}!`;
    }

    setLog((l) => [...l, logMsg]);

    // Enemy turn after item use
    setTimeout(() => {
      doEnemyTurn();
    }, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Enemy turn (extracted for reuse after item use) ───────
  const doEnemyTurn = useCallback(() => {
    const gs = gsRef.current;
    if (!gs.player) return;

    const playerBurn = getBurnDamage(gs.playerStatuses);
    if (playerBurn > 0) {
      setPlayerHp((hp) => {
        const newHp = Math.max(0, hp - playerBurn);
        if (newHp <= 0) {
          setTimeout(() => {
            setPlayerAnim("faint");
            SFX.faint();
            setTimeout(() => handleGameOver(), 1000);
          }, 400);
        }
        return newHp;
      });
      addDamagePopup(playerBurn, false, false, false);
      setLog((l) => [...l, `${gs.player!.name} is burned out! -${playerBurn} HP!`]);
    }

    const eMove = (() => {
      const moves = gs.enemy.moves;
      if (moves.length <= 1) return moves[0];

      const eHpPct = gs.enemyHp / gs.enemy.maxHp;
      const pHpPct = gs.playerHp / (gs.effectivePlayer || gs.player!).maxHp;

      if (eHpPct < 0.35) {
        const healMove = moves.find(m => m.heal && m.heal > 0);
        if (healMove && rng() < 0.7) return healMove;
      }

      if (pHpPct > 0.6 && gs.playerStatuses.length === 0) {
        const debuffMove = moves.find(m => m.status?.target === "enemy");
        if (debuffMove && rng() < 0.5) return debuffMove;
      }

      if (pHpPct < 0.25) {
        return moves.reduce((a, b) => (b.dmg > a.dmg ? b : a));
      }

      return moves[Math.floor(rng() * moves.length)];
    })();
    setEnemyAnim("attacking");
    SFX.attackSwing();

    setTimeout(() => {
      setEnemyAnim("idle");

      // Enemy accuracy check
      const eMoveAcc = eMove.acc ?? 100;
      if (rng() * 100 >= eMoveAcc) {
        SFX.miss();
        setLog((l) => [...l, `${gs.enemy.name} used ${eMove.name}! But it missed!`]);
        addDamagePopup(0, false, false, false, "MISS!", "#78909C");
        tickStatuses(setPlayerStatuses);
        setTimeout(() => { setTurn("player"); }, 500);
        return;
      }

      const enemyAtkMod = getStatusAtkMod(gs.enemyStatuses);
      const playerDefMod = getStatusDefMod(gs.playerStatuses);
      const enemyCritBonus = getStatusCritBonus(gs.enemyStatuses);
      const eTypeResult = getTypeMultiplier(eMove.type || "normal", gs.player!.types);
      const dailyDefMult = dailyModifierCtx?.playerDefMult ?? 1;
      const [eDmg, eCrit] = calcDamage(gs.enemy.atk + enemyAtkMod, Math.round(((gs.effectivePlayer || gs.player!).def + gs.level + gs.defBuff + playerDefMod) * dailyDefMult), eMove.dmg, enemyCritBonus, eTypeResult.mult);

      let eLog = `${gs.enemy.name} used ${eMove.name}! ${eDmg} damage!`;
      if (eCrit) eLog += " Critical hit!";
      if (eTypeResult.label) eLog += ` ${eTypeResult.label}`;

      if (eMove.status) {
        const applied = applyStatus(eMove.status, false);
        if (applied) {
          eLog += ` ${eMove.status.target === "self" ? gs.enemy.name : gs.player!.name} is ${applied.name}!`;
        }
      }

      setPlayerAnim("hit");
      triggerShake();
      const eEffLabel = eTypeResult.mult > 1 ? "Super effective!" : eTypeResult.mult < 1 ? "Not effective..." : undefined;
      const eEffColor = eTypeResult.mult > 1 ? "#4CAF50" : eTypeResult.mult < 1 ? "#FF9800" : undefined;
      addDamagePopup(eDmg, false, eCrit, false, eEffLabel, eEffColor);
      if (eTypeResult.mult > 1) SFX.superEffective();
      else if (eTypeResult.mult < 1) SFX.notEffective();
      else if (eCrit) SFX.critHit();
      else SFX.hit();

      if (eMove.heal) {
        setEnemyHp((hp) => Math.min(gs.enemy.maxHp, hp + eMove.heal!));
        eLog += ` Recovered ${eMove.heal} HP!`;
        addDamagePopup(eMove.heal!, true, false, true);
      }

      setPlayerHp((prev) => {
        const newHp = Math.max(0, prev - eDmg);
        if (newHp <= 0) {
          setTimeout(() => {
            setPlayerAnim("faint");
            SFX.faint();
            setTimeout(() => handleGameOver(), 1000);
          }, 400);
        }
        return newHp;
      });
      setLog((l) => [...l, eLog]);

      tickStatuses(setPlayerStatuses);

      setTimeout(() => {
        setPlayerAnim("idle");
        setTurn("player");
      }, 500);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = () => {
    clearSave();
    SFX.menuSelect();
    setScreen("classSelect");
  };

  const continueGame = () => {
    const save = loadGame();
    if (!save) return;
    const cls = PLAYER_CLASSES.find(c => c.id === save.classId)!;
    SFX.menuConfirm();
    setPlayer(cls);
    setPlayerHp(save.playerHp);
    setPlayerPp(save.playerPp);
    setFloor(save.floor);
    setXp(save.xp);
    setXpToNext(save.xpToNext);
    setLevel(save.level);
    setAtkBuff(save.atkBuff);
    setDefBuff(save.defBuff);
    usedEventsRef.current = new Set(save.usedEvents);
    setInventory(save.inventory || []);
    setFloorEnemyIds(save.floorEnemyIds || rollFloorEnemies());
    setNgPlus(save.ngPlus || 0);
    setTotalTurns(save.totalTurns || 0);
    setTotalDamageDealt(save.totalDamageDealt || 0);
    setEnemyPhase(save.enemyPhase || 1);
    setScreen("floorIntro");
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
    // Starting inventory
    const startItem = CLASS_STARTING_ITEMS[cls.id];
    setInventory(startItem ? [startItem] : []);
    // Roll enemy variants for this run
    setFloorEnemyIds(rollFloorEnemies());
    setNgPlus(0);
    setTotalTurns(0);
    setTotalDamageDealt(0);
    setItemsUsed(0);
    setEnemyPhase(1);
    setScreen("floorIntro");
  };

  const startDaily = (cls: PlayerClass) => {
    const seed = getDailySeed();
    const modifier = getDailyModifier(seed);
    const floorMap = getDailyFloorMap(seed);
    const enemyNames = rollDailyEnemies(seed, floorMap);

    const ctx: DailyModifierContext = {
      enemyAtkMult: 1, enemyHpMult: 1, enemyDefMult: 1,
      playerDefMult: 1, itemsEnabled: true, eventsEnabled: true,
      ppMult: 1, assignedClassId: undefined,
    };
    modifier.apply(ctx);

    // Reorg: seed picks the class
    const actualClass = modifier.id === "reorg"
      ? PLAYER_CLASSES[Math.floor(createSeededRandom(seed + 99)() * PLAYER_CLASSES.length)]
      : cls;

    dailyRngRef.current = createSeededRandom(seed + 10);

    setDailyMode(true);
    setDailyFloorMap(floorMap);
    setDailyModifierCtx(ctx);
    setPlayer(actualClass);
    setPlayerHp(actualClass.maxHp);
    setPlayerPp(actualClass.moves.map(m => Math.floor(m.pp * ctx.ppMult)));
    setFloor(0);
    setXp(0);
    setXpToNext(30);
    setLevel(1);
    setAtkBuff(0);
    setDefBuff(0);
    usedEventsRef.current.clear();
    setInventory(ctx.itemsEnabled ? (CLASS_STARTING_ITEMS[actualClass.id] ? [CLASS_STARTING_ITEMS[actualClass.id]] : []) : []);
    setFloorEnemyIds(enemyNames);
    setNgPlus(1); // Base NG+1 difficulty
    setTotalTurns(0);
    setTotalDamageDealt(0);
    setItemsUsed(0);
    setEnemyPhase(1);
    SFX.menuConfirm();
    setScreen("floorIntro");
  };

  const startBattle = () => {
    setEnemyPhase(1);
    setEnemyHp(enemy.maxHp);
    const intro = enemy.taunt
      ? `"${enemy.taunt}"`
      : enemy.name.startsWith("The ") ? `${enemy.name} appeared!` : `A wild ${enemy.name} appeared!`;
    setLog([intro]);
    setTurn("player");
    setBattleMode("fight");
    setPlayerAnim("idle");
    setEnemyAnim("idle");
    setDamagePopups([]);
    setPlayerStatuses([]);
    setEnemyStatuses([]);
    if (floor % 10 >= 8) SFX.bossIntro();
    else SFX.enemyAppear();
    setScreen("battle");
  };

  const pickRandomEvent = () => {
    const available = HALLWAY_EVENTS.filter((e) => !usedEventsRef.current.has(e.id));
    if (available.length === 0) {
      usedEventsRef.current.clear();
      return HALLWAY_EVENTS[Math.floor(rng() * HALLWAY_EVENTS.length)];
    }
    return available[Math.floor(rng() * available.length)];
  };

  const pickTwoEvents = (): [import("./types").HallwayEvent, import("./types").HallwayEvent] => {
    let available = HALLWAY_EVENTS.filter((e) => !usedEventsRef.current.has(e.id));
    if (available.length < 2) {
      usedEventsRef.current.clear();
      available = [...HALLWAY_EVENTS];
    }
    const shuffled = available.sort(() => rng() - 0.5);
    return [shuffled[0], shuffled[1]];
  };

  const handleRoutePick = (event: import("./types").HallwayEvent) => {
    SFX.menuConfirm();
    setCurrentEvent(event);
    setScreen("hallwayEvent");
  };

  const handleEventChoice = (choiceIdx: number) => {
    if (!currentEvent || !player) return;
    const choice = currentEvent.choices[choiceIdx];
    const eff = choice.effect;

    if (eff.hp) {
      setPlayerHp((hp) => Math.max(1, Math.min((effectivePlayer || player).maxHp + atkBuff * 5, hp + eff.hp!)));
    }
    if (eff.atk) setAtkBuff((b) => b + eff.atk!);
    if (eff.def) setDefBuff((b) => b + eff.def!);
    if (eff.ppRestore) {
      const moves = effectivePlayer?.moves || player.moves;
      setPlayerPp((pp) => pp.map((v, i) => Math.min(moves[i].pp, v + eff.ppRestore!)));
    }

    // Item reward from events (30% chance, if inventory not full)
    if (inventory.length < MAX_INVENTORY && rng() < 0.3) {
      const randomItem = ALL_ITEM_IDS[Math.floor(rng() * ALL_ITEM_IDS.length)];
      setInventory((inv) => [...inv, randomItem]);
      // The event screen will show this via the onChoice callback
    }

    usedEventsRef.current.add(currentEvent.id);

    setTimeout(() => {
      setScreen("floorIntro");
    }, 0);
  };

  const calcDamage = (atkStat: number, defStat: number, baseDmg: number, critBonus: number = 0, typeMult: number = 1): [number, boolean] => {
    const variance = 0.85 + rng() * 0.3;
    const isCrit = rng() < (0.1 + critBonus);
    const crit = isCrit ? 1.5 : 1;
    return [Math.max(1, Math.round(baseDmg * (Math.max(1, atkStat) / Math.max(1, defStat)) * variance * crit * typeMult)), isCrit];
  };

  const doPlayerMove = useCallback((moveIdx: number) => {
    const gs = gsRef.current;
    if (gs.turn !== "player" || !gs.player) return;

    // Track turns
    setTotalTurns((t) => t + 1);

    const isStruggling = gs.playerPp.every((pp) => pp <= 0);
    const move = isStruggling ? STRUGGLE_MOVE : (gs.effectivePlayer || gs.player).moves[moveIdx];

    if (!isStruggling) {
      const newPp = [...gs.playerPp];
      newPp[moveIdx]--;
      setPlayerPp(newPp);
    }

    setBattleMode("fight");
    setPlayerAnim("attacking");
    flashMoveType(move.type);
    SFX.attackSwing();

    setTimeout(() => {
      setPlayerAnim("idle");

      // Accuracy check
      const moveAcc = move.acc ?? 100;
      if (rng() * 100 >= moveAcc) {
        SFX.miss();
        setLog((l) => [...l, `${gs.player!.name} used ${move.name}! But it missed!`]);
        addDamagePopup(0, true, false, false, "MISS!", "#78909C");
        setTurn("waiting");
        setTimeout(() => doEnemyTurn(), 800);
        return;
      }

      const playerAtkMod = getStatusAtkMod(gs.playerStatuses);
      const enemyDefMod = getStatusDefMod(gs.enemyStatuses);
      const playerCritBonus = getStatusCritBonus(gs.playerStatuses);
      // Class perks: Engineer +15% damage, Designer +15% crit
      const perkDmgMult = gs.player!.id === "eng" ? 1.15 : 1;
      const perkCritBonus = gs.player!.id === "design" ? 0.15 : 0;
      const typeResult = getTypeMultiplier(move.type, gs.enemy.types);
      const [rawDmg, isCrit] = calcDamage((gs.effectivePlayer || gs.player!).atk + gs.level * 2 + gs.atkBuff + playerAtkMod, gs.enemy.def + enemyDefMod, move.dmg, playerCritBonus + perkCritBonus, typeResult.mult);
      const dmg = Math.round(rawDmg * perkDmgMult);
      const newEnemyHp = Math.max(0, gs.enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      setTotalDamageDealt((t) => t + dmg);
      setEnemyAnim("hit");
      triggerShake();
      const effLabel = typeResult.mult > 1 ? "Super effective!" : typeResult.mult < 1 ? "Not effective..." : undefined;
      const effColor = typeResult.mult > 1 ? "#4CAF50" : typeResult.mult < 1 ? "#FF9800" : undefined;
      addDamagePopup(dmg, true, isCrit, false, effLabel, effColor);
      if (typeResult.mult > 1) SFX.superEffective();
      else if (typeResult.mult < 1) SFX.notEffective();
      else if (isCrit) SFX.critHit();
      else SFX.hit();

      let logMsg = `${gs.player!.name} used ${move.name}! ${dmg} damage!`;
      if (isCrit) logMsg += " Critical hit!";
      if (typeResult.label) logMsg += ` ${typeResult.label}`;

      if (isStruggling) {
        const recoil = 5;
        setPlayerHp((hp) => Math.max(0, hp - recoil));
        addDamagePopup(recoil, false, false, false);
        logMsg += ` Recoil: -${recoil} HP!`;
      }

      if (move.status) {
        const applied = applyStatus(move.status, true);
        if (applied) {
          logMsg += ` ${move.status.target === "self" ? gs.player!.name : gs.enemy.name} is ${applied.name}!`;
        }
      }

      if (move.heal) {
        const healAmt = Math.min(move.heal + gs.level, (gs.effectivePlayer || gs.player!).maxHp - gs.playerHp);
        setPlayerHp((hp) => Math.min((gs.effectivePlayer || gs.player!).maxHp, hp + healAmt));
        if (healAmt > 0) {
          logMsg += ` Recovered ${healAmt} HP!`;
          addDamagePopup(healAmt, false, false, true);
          SFX.heal();
        }
      }

      setLog((l) => [...l, logMsg]);
      setTurn("waiting");

      setTimeout(() => setEnemyAnim("idle"), 400);

      // Phase 2 transition: check if enemy has phase2 and we just crossed 50% threshold
      const phase2FloorIdx = dailyMode ? (dailyFloorMap[gs.floor] ?? gs.floor) : gs.floor;
      const baseEnemy = scaleEnemyForNgPlus(
        floorEnemyIds.length > 0 ? getFloorEnemy(phase2FloorIdx, floorEnemyIds[gs.floor]) : ENEMIES[phase2FloorIdx] || ENEMIES[0],
        ngPlus
      );
      if (gs.enemyPhase === 1 && baseEnemy.phase2 && newEnemyHp > 0 && newEnemyHp <= baseEnemy.maxHp * 0.5) {
        // Phase 2 transition!

        setTimeout(() => {
          setLog((l) => [...l, `💥 ${baseEnemy.phase2!.taunt}`]);
          setTimeout(() => {
            setLog((l) => [...l, "⚠️ PHASE 2"]);
            setEnemyPhase(2);
            setEnemyHp(baseEnemy.phase2!.maxHp);
            setEnemyStatuses([]);

            triggerShake();
            SFX.bossIntro();
            setTimeout(() => setTurn("player"), 800);
          }, 500);
        }, 600);
        return;
      }

      if (newEnemyHp <= 0) {
        setTimeout(() => { setEnemyAnim("faint"); SFX.faint(); }, 500);
        const gained = 15 + gs.floor * 7;
        const newXp = gs.xp + gained;
        const didLevel = newXp >= gs.xpToNext;
        setXpGained(gained);
        setLeveledUp(didLevel);

        setTimeout(() => {
          SFX.victory();
          if (didLevel) {
            setLevel((l) => l + 1);
            setXp(newXp - gs.xpToNext);
            setXpToNext((x) => x + 25);
            setPlayerHp((hp) => Math.min((gs.effectivePlayer || gs.player!).maxHp, hp + 20));
            setTimeout(() => SFX.levelUp(), 600);
          } else {
            setXp(newXp);
          }
          setScreen("victory");
        }, 1500);
        return;
      }

      // Tick enemy statuses
      const enemyBurn = getBurnDamage(gs.enemyStatuses);
      if (enemyBurn > 0) {
        setTimeout(() => {
          setEnemyHp((hp) => Math.max(0, hp - enemyBurn));
          addDamagePopup(enemyBurn, true, false, false);
          setLog((l) => [...l, `${gs.enemy.name} is burned out! -${enemyBurn} HP!`]);
        }, 500);
      }
      tickStatuses(setEnemyStatuses);

      // Enemy turn
      setTimeout(() => {
        doEnemyTurn();
      }, 800);
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doEnemyTurn, ngPlus, floorEnemyIds]);

  const proceedToRouteChoice = () => {
    // Skip hallway events if daily modifier disables them
    if (dailyMode && dailyModifierCtx && !dailyModifierCtx.eventsEnabled) {
      setScreen("floorIntro");
      return;
    }
    const options = pickTwoEvents();
    setRouteOptions(options);
    setScreen("routeChoice");
  };

  const handleVictoryContinue = () => {
    SFX.menuConfirm();
    // PM perk: heal 5 HP after each battle (use effective maxHp)
    if (player?.id === "pm" && effectivePlayer) {
      setPlayerHp((hp) => Math.min(effectivePlayer.maxHp, hp + 5));
    }
    const totalFloors = dailyMode ? DAILY_FLOOR_COUNT : ENEMY_POOLS.length;
    if (floor >= totalFloors - 1) {
      if (dailyMode) {
        const score = calculateDailyScore({ floorsCleared: floor + 1, totalTurns, totalDamageDealt, hpRemaining: playerHp, won: true });
        saveDailyResult({ seed: getDailySeed(), classId: player?.id || "", score, floorsCleared: floor + 1, totalTurns, totalDamageDealt, hpRemaining: playerHp, won: true, modifierId: getDailyModifier(getDailySeed()).id });
        SFX.fanfare();
        setScreen("dailyResult");
      } else {
        clearSave();
        saveBestNgPlus(ngPlus);
        const unlocked = checkAchievements({
          classId: player?.id || "",
          totalTurns,
          totalDamageDealt,
          ngLevel: ngPlus,
          itemsUsed,
          finalHp: playerHp,
        });
        setNewAchievements(unlocked);
        SFX.fanfare();
        setScreen("win");
      }
    } else {
      const nextFloor = floor + 1;
      setFloor(nextFloor);
      if (player && !dailyMode) {
        saveGame({
          classId: player.id, floor: nextFloor, level, xp, xpToNext,
          playerHp, playerPp, atkBuff, defBuff,
          usedEvents: Array.from(usedEventsRef.current),
          inventory,
          floorEnemyIds,
          ngPlus,
          totalTurns,
          totalDamageDealt,
        });
      }

      // Check for promotion (skip in daily mode)
      const prevPromo = player && !dailyMode ? getPromotion(player.id, floor) : null;
      const nextPromo = player && !dailyMode ? getPromotion(player.id, nextFloor) : null;
      const hasPromotion = prevPromo && nextPromo && prevPromo.title !== nextPromo.title;

      // Check for act transition (skip in daily mode)
      const prevAct = dailyMode ? 1 : getAct(floor);
      const nextAct = dailyMode ? 1 : getAct(nextFloor);
      const hasActTransition = prevAct !== nextAct;

      if (hasPromotion || hasActTransition) {
        setNextFloorAfterScreens(nextFloor);
        if (hasPromotion && prevPromo && nextPromo) {
          setPendingPromotion({ old: prevPromo, new: nextPromo });
          if (hasActTransition) {
            setPendingActTransition(nextAct);
          }
          SFX.fanfare();
          setScreen("promotion");
        } else if (hasActTransition) {
          setPendingActTransition(nextAct);
          setScreen("actTransition");
        }
      } else {
        proceedToRouteChoice();
      }
    }
  };

  const handlePromotionContinue = () => {
    SFX.menuConfirm();
    const fullHp = effectivePlayer?.maxHp ?? player!.maxHp;
    setPlayerHp(fullHp);
    setPendingPromotion(null);
    if (pendingActTransition) {
      setScreen("actTransition");
    } else {
      setNextFloorAfterScreens(null);
      proceedToRouteChoice();
    }
  };

  const handleActTransitionContinue = () => {
    SFX.menuConfirm();
    setPendingActTransition(null);
    setNextFloorAfterScreens(null);
    proceedToRouteChoice();
  };

  const startNgPlus = () => {
    if (!player) return;
    const nextNg = ngPlus + 1;
    SFX.menuConfirm();
    setNgPlus(nextNg);
    setPlayerHp(player.maxHp);
    setPlayerPp(player.moves.map(m => m.pp));
    setFloor(0);
    setAtkBuff(0);
    setDefBuff(0);
    setTotalTurns(0);
    setTotalDamageDealt(0);
    setItemsUsed(0);
    setEnemyPhase(1);
    usedEventsRef.current.clear();
    const startItem = CLASS_STARTING_ITEMS[player.id];
    setInventory(startItem ? [startItem] : []);
    setFloorEnemyIds(rollFloorEnemies());
    setScreen("floorIntro");
  };

  const restart = () => {
    clearSave();
    SFX.menuSelect();
    setScreen("title");
    setPlayer(null);
    setFloor(0);
    setLevel(1);
    setXp(0);
    setXpToNext(30);
    setAtkBuff(0);
    setDefBuff(0);
    setNgPlus(0);
    setTotalTurns(0);
    setTotalDamageDealt(0);
    setItemsUsed(0);
    setEnemyPhase(1);
    setInventory([]);
    setFloorEnemyIds([]);
    setDailyMode(false);
    setDailyFloorMap([]);
    setDailyModifierCtx(null);
    dailyRngRef.current = null;
    usedEventsRef.current.clear();
  };

  if (!spritesReady) {
    return (
      <div style={{
        width: "100%", maxWidth: 420, height: "100vh", maxHeight: 750,
        margin: "0 auto", background: "#000", display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column",
        fontFamily: "monospace", color: "#4FC3F7",
      }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>LOADING...</div>
        <div style={{ fontSize: 14, color: "#666" }}>Preparing sprites</div>
      </div>
    );
  }

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

        .sprite-idle { animation: sprite-breathe 2.5s ease-in-out infinite; }
        .sprite-attack { animation: sprite-attack-right 0.5s ease-out; }
        .sprite-attack-left { animation: sprite-attack-left 0.5s ease-out; }
        .sprite-hit { animation: sprite-hit-flash 0.4s ease-out; }
        .sprite-faint { animation: sprite-faint 0.8s ease-out forwards; }
        .screen-shake { animation: screen-shake-anim 0.3s ease-out; }
        .screen-fade-in { opacity: 1; transition: opacity 0.2s ease-in; }
        .screen-fade-out { opacity: 0; transition: opacity 0.2s ease-out; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Mute toggle — always visible */}
      <button
        onClick={() => setMuted(m => !m)}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 100,
          background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.2)",
          borderRadius: 6, padding: "4px 8px", cursor: "pointer",
          fontFamily: "'Press Start 2P'", fontSize: 8, color: "#FFD54F",
          lineHeight: 1,
        }}
        title={muted ? "Unmute music" : "Mute music"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <div className={fadeClass === "in" ? "screen-fade-in" : "screen-fade-out"} style={{ width: "100%", height: "100%" }}>
        {screen === "title" && <TitleScreen onStart={startGame} onContinue={loadGame() ? continueGame : undefined} onDaily={() => setScreen("dailyPre")} />}
        {screen === "dailyPre" && <DailyPreScreen onStart={startDaily} onBack={() => setScreen("title")} />}
        {screen === "classSelect" && <ClassSelect onSelect={selectClass} />}
        {screen === "hallwayEvent" && currentEvent && player && (
          <HallwayEventScreen
            event={currentEvent}
            onChoice={handleEventChoice}
            playerHp={playerHp}
            playerMaxHp={effectivePlayer?.maxHp || player.maxHp}
          />
        )}
        {screen === "routeChoice" && routeOptions && (
          <RouteChoice options={routeOptions} onPick={handleRoutePick} />
        )}
        {screen === "floorIntro" && <FloorIntro enemy={enemy} floor={floor} player={player ?? undefined} onReady={startBattle} totalFloors={dailyMode ? DAILY_FLOOR_COUNT : undefined} />}
        {screen === "battle" && player && effectivePlayer && (
          <BattleScreen
            player={effectivePlayer}
            enemy={enemy}
            playerHp={playerHp}
            enemyHp={enemyHp}
            onMove={doPlayerMove}
            onUseItem={useItem}
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
            activeMoves={activeMoves}
            inventory={inventory}
            battleMode={battleMode}
            onSetBattleMode={setBattleMode}
            promotionTitle={promotionTier?.title}
            playerMaxHp={effectivePlayer.maxHp}
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
        {screen === "promotion" && player && pendingPromotion && (
          <PromotionScreen
            player={player}
            oldTier={pendingPromotion.old}
            newTier={pendingPromotion.new}
            onContinue={handlePromotionContinue}
          />
        )}
        {screen === "actTransition" && pendingActTransition && (
          <ActTransitionScreen act={pendingActTransition} onContinue={handleActTransitionContinue} />
        )}
        {screen === "dailyResult" && player && <DailyResultScreen
          player={player}
          score={calculateDailyScore({ floorsCleared: floor + (playerHp > 0 ? 1 : 0), totalTurns, totalDamageDealt, hpRemaining: Math.max(0, playerHp), won: playerHp > 0 })}
          floorsCleared={floor + (playerHp > 0 ? 1 : 0)}
          totalTurns={totalTurns}
          totalDamageDealt={totalDamageDealt}
          hpRemaining={Math.max(0, playerHp)}
          won={playerHp > 0}
          onBack={() => { setDailyMode(false); setScreen("title"); }}
        />}
        {screen === "gameOver" && <GameOverScreen floor={floor + 1} onRestart={restart} />}
        {screen === "win" && player && <WinScreen player={effectivePlayer || player} onRestart={restart} onNgPlus={startNgPlus} ngLevel={ngPlus} bestNgLevel={getBestNgPlus()} totalTurns={totalTurns} totalDamageDealt={totalDamageDealt} floorsCleared={ENEMY_POOLS.length} newAchievements={newAchievements} allAchievements={ACHIEVEMENTS} unlockedAchievements={getUnlockedAchievements()} />}
      </div>
    </div>
  );
}
