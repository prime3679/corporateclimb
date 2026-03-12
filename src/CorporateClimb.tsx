import { useState, useEffect, useCallback, useRef } from "react";
import { SFX } from "./sfx";
import { Music } from "./music";
import { buildSpriteUrls } from "./sprites";
import type { Screen, AnimState, DamagePopup, StatusInstance, StatusEffectOnMove, PlayerClass, Move, ItemId } from "./types";
import {
  STATUS_DEFS, TYPE_COLORS, PLAYER_CLASSES, ENEMIES, HALLWAY_EVENTS, FONT_URL, ITEMS,
  CLASS_STARTING_ITEMS, ALL_ITEM_IDS,
  getTypeMultiplier, saveGame, loadGame, clearSave,
  rollFloorEnemies, getFloorEnemy,
  scaleEnemyForNgPlus, getBestNgPlus, saveBestNgPlus,
} from "./data";
import { TitleScreen, ClassSelect, BattleScreen, VictoryScreen, GameOverScreen, WinScreen, HallwayEventScreen, FloorIntro } from "./screens";

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

  // Inventory
  const [inventory, setInventory] = useState<ItemId[]>([]);

  // Enemy variants — rolled once per run
  const [floorEnemyIds, setFloorEnemyIds] = useState<string[]>([]);

  // New Game+ level (0 = first playthrough)
  const [ngPlus, setNgPlus] = useState(0);

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
        if (floor >= 5) Music.playBoss();
        else Music.playBattle();
        break;
      case "hallwayEvent":
      case "floorIntro":
        Music.playEvent();
        break;
      case "victory":
      case "win":
      case "gameOver":
        Music.stop();
        break;
    }
  }, [screen, floor]);

  // Current enemy resolved from variant pool, scaled for NG+
  const rawEnemy = floorEnemyIds.length > 0
    ? getFloorEnemy(floor, floorEnemyIds[floor])
    : ENEMIES[floor] || ENEMIES[0];
  const enemy = scaleEnemyForNgPlus(rawEnemy, ngPlus);

  // Ref to avoid stale closures
  const gsRef = useRef({ player, playerHp, enemyHp, playerPp, level, atkBuff, defBuff, xp, xpToNext, floor, enemy, turn, playerStatuses, enemyStatuses, inventory });
  gsRef.current = { player, playerHp, enemyHp, playerPp, level, atkBuff, defBuff, xp, xpToNext, floor, enemy, turn, playerStatuses, enemyStatuses, inventory };

  // ─── Determine active moves (regular or Struggle) ─────────
  const allPpDepleted = player ? playerPp.every((pp) => pp <= 0) : false;
  const activeMoves: Move[] = player
    ? allPpDepleted
      ? [STRUGGLE_MOVE]
      : player.moves
    : [];

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
    setBattleMode("fight");
    setTurn("waiting");

    let logMsg = `Used ${item.name}!`;
    SFX.heal();

    if (item.effect.hp) {
      const healAmt = Math.min(item.effect.hp, gs.player.maxHp - gs.playerHp);
      if (healAmt > 0) {
        setPlayerHp((hp) => Math.min(gs.player!.maxHp, hp + healAmt));
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
            setTimeout(() => { clearSave(); SFX.gameOver(); setScreen("gameOver"); }, 1000);
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
      const pHpPct = gs.playerHp / gs.player!.maxHp;

      if (eHpPct < 0.35) {
        const healMove = moves.find(m => m.heal && m.heal > 0);
        if (healMove && Math.random() < 0.7) return healMove;
      }

      if (pHpPct > 0.6 && gs.playerStatuses.length === 0) {
        const debuffMove = moves.find(m => m.status?.target === "enemy");
        if (debuffMove && Math.random() < 0.5) return debuffMove;
      }

      if (pHpPct < 0.25) {
        return moves.reduce((a, b) => (b.dmg > a.dmg ? b : a));
      }

      return moves[Math.floor(Math.random() * moves.length)];
    })();
    setEnemyAnim("attacking");
    SFX.attackSwing();

    setTimeout(() => {
      setEnemyAnim("idle");
      const enemyAtkMod = getStatusAtkMod(gs.enemyStatuses);
      const playerDefMod = getStatusDefMod(gs.playerStatuses);
      const enemyCritBonus = getStatusCritBonus(gs.enemyStatuses);
      const eTypeResult = getTypeMultiplier(eMove.type || "normal", gs.player!.types);
      const [eDmg, eCrit] = calcDamage(gs.enemy.atk + enemyAtkMod, gs.player!.def + gs.level + gs.defBuff + playerDefMod, eMove.dmg, enemyCritBonus, eTypeResult.mult);

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
      addDamagePopup(eDmg, false, eCrit, false);
      if (eCrit) SFX.critHit(); else SFX.hit();

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
            setTimeout(() => { clearSave(); SFX.gameOver(); setScreen("gameOver"); }, 1000);
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
    setScreen("floorIntro");
  };

  const startBattle = () => {
    setEnemyHp(enemy.maxHp);
    setLog([`A wild ${enemy.name} appeared!`]);
    setTurn("player");
    setBattleMode("fight");
    setPlayerAnim("idle");
    setEnemyAnim("idle");
    setDamagePopups([]);
    setPlayerStatuses([]);
    setEnemyStatuses([]);
    if (floor >= 5) SFX.bossIntro();
    else SFX.enemyAppear();
    setScreen("battle");
  };

  const pickRandomEvent = () => {
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

    // Item reward from events (30% chance, if inventory not full)
    if (inventory.length < MAX_INVENTORY && Math.random() < 0.3) {
      const randomItem = ALL_ITEM_IDS[Math.floor(Math.random() * ALL_ITEM_IDS.length)];
      setInventory((inv) => [...inv, randomItem]);
      // The event screen will show this via the onChoice callback
    }

    usedEventsRef.current.add(currentEvent.id);

    setTimeout(() => {
      setScreen("floorIntro");
    }, 0);
  };

  const calcDamage = (atkStat: number, defStat: number, baseDmg: number, critBonus: number = 0, typeMult: number = 1): [number, boolean] => {
    const variance = 0.85 + Math.random() * 0.3;
    const isCrit = Math.random() < (0.1 + critBonus);
    const crit = isCrit ? 1.5 : 1;
    return [Math.max(1, Math.round(baseDmg * (Math.max(1, atkStat) / Math.max(1, defStat)) * variance * crit * typeMult)), isCrit];
  };

  const doPlayerMove = useCallback((moveIdx: number) => {
    const gs = gsRef.current;
    if (gs.turn !== "player" || !gs.player) return;

    const isStruggling = gs.playerPp.every((pp) => pp <= 0);
    const move = isStruggling ? STRUGGLE_MOVE : gs.player.moves[moveIdx];

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
      const playerAtkMod = getStatusAtkMod(gs.playerStatuses);
      const enemyDefMod = getStatusDefMod(gs.enemyStatuses);
      const playerCritBonus = getStatusCritBonus(gs.playerStatuses);
      const typeResult = getTypeMultiplier(move.type, gs.enemy.types);
      const [dmg, isCrit] = calcDamage(gs.player!.atk + gs.level * 2 + gs.atkBuff + playerAtkMod, gs.enemy.def + enemyDefMod, move.dmg, playerCritBonus, typeResult.mult);
      const newEnemyHp = Math.max(0, gs.enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      setEnemyAnim("hit");
      triggerShake();
      addDamagePopup(dmg, true, isCrit, false);
      if (isCrit) SFX.critHit(); else SFX.hit();

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
        const healAmt = Math.min(move.heal + gs.level, gs.player!.maxHp - gs.playerHp);
        setPlayerHp((hp) => Math.min(gs.player!.maxHp, hp + healAmt));
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
        const gained = 15 + gs.floor * 10;
        const newXp = gs.xp + gained;
        const didLevel = newXp >= gs.xpToNext;
        setXpGained(gained);
        setLeveledUp(didLevel);

        setTimeout(() => {
          SFX.victory();
          if (didLevel) {
            setLevel((l) => l + 1);
            setXp(newXp - gs.xpToNext);
            setXpToNext((x) => x + 20);
            setPlayerHp((hp) => Math.min(gs.player!.maxHp + 10, hp + 20));
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
  }, [doEnemyTurn]);

  const handleVictoryContinue = () => {
    SFX.menuConfirm();
    if (floor >= ENEMIES.length - 1) {
      clearSave();
      saveBestNgPlus(ngPlus);
      SFX.fanfare();
      setScreen("win");
    } else {
      const nextFloor = floor + 1;
      setFloor(nextFloor);
      if (player) {
        saveGame({
          classId: player.id, floor: nextFloor, level, xp, xpToNext,
          playerHp, playerPp, atkBuff, defBuff,
          usedEvents: Array.from(usedEventsRef.current),
          inventory,
          floorEnemyIds,
          ngPlus,
        });
      }
      const evt = pickRandomEvent();
      if (evt) {
        setCurrentEvent(evt);
        setScreen("hallwayEvent");
      } else {
        setScreen("floorIntro");
      }
    }
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
    setInventory([]);
    setFloorEnemyIds([]);
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
      height: "100svh",
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

        .sprite-idle { }
        .sprite-attack { animation: sprite-attack-right 0.5s ease-out; }
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
        {screen === "title" && <TitleScreen onStart={startGame} onContinue={loadGame() ? continueGame : undefined} />}
        {screen === "classSelect" && <ClassSelect onSelect={selectClass} />}
        {screen === "hallwayEvent" && currentEvent && player && (
          <HallwayEventScreen
            event={currentEvent}
            onChoice={handleEventChoice}
            playerHp={playerHp}
            playerMaxHp={player.maxHp}
          />
        )}
        {screen === "floorIntro" && <FloorIntro enemy={enemy} onReady={startBattle} />}
        {screen === "battle" && player && (
          <BattleScreen
            player={player}
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
        {screen === "win" && player && <WinScreen player={player} onRestart={restart} onNgPlus={startNgPlus} ngLevel={ngPlus} bestNgLevel={getBestNgPlus()} />}
      </div>
    </div>
  );
}
