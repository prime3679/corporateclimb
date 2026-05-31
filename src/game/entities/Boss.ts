import Phaser from "phaser";
import { Player } from "./Player";
import { usePlayerStats } from "../../ui/stores/playerStats";
import { useDialogueState } from "../../ui/stores/dialogueState";
import { useChoiceHistory } from "../../ui/stores/choiceHistory";
import type { BossConfig } from "../config/levelTypes";

const BOSS_W = 120;
const BOSS_H = 160;
const BOSS_COLOR = 0x991b1b; // dark red
const PODIUM_COLOR = 0x78350f;
const PROJECTILE_SIZE = 28;
const PROJECTILE_SPEED = 250;
const PHASE1_ROUNDS = 5;
const PHASE1_INTERVAL = 2500; // ms between rounds

type BossPhase = "idle" | "phase1" | "phase2" | "phase3" | "defeated";

/**
 * Professor No-Curve — final boss of Freshman Year.
 *
 * Phase 1: Multiple Choice — throws A/B/C projectiles, one correct (green).
 * Phase 2: Essay Defense — 3 dialogue prompts.
 * Phase 3: Grade Appeal — stat-gated dialogue.
 */
export class Boss {
  private scene: Phaser.Scene;
  private config: BossConfig;

  // Visuals
  private bossVisual: Phaser.GameObjects.Rectangle;
  private podium: Phaser.GameObjects.Rectangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private nameLabel: Phaser.GameObjects.Text;

  // State
  private phase: BossPhase = "idle";
  private health: number;
  private maxHealth: number;
  private activated = false;

  // Phase 1 state
  private phase1Round = 0;
  private phase1Timer = 0;
  private projectileGroup: Phaser.Physics.Arcade.Group;
  private activeProjectiles: Phaser.GameObjects.Container[] = [];

  // Callbacks
  private onDefeated?: () => void;

  constructor(
    scene: Phaser.Scene,
    config: BossConfig,
    _player: Player,
    onDefeated?: () => void,
  ) {
    this.scene = scene;
    this.config = config;
    this.onDefeated = onDefeated;
    this.health = config.health;
    this.maxHealth = config.health;

    const bossX = config.x;
    const bossY = config.y - BOSS_H / 2;

    // Boss rectangle
    this.bossVisual = scene.add.rectangle(bossX, bossY, BOSS_W, BOSS_H, BOSS_COLOR);
    this.bossVisual.setDepth(8);

    // Podium in front
    this.podium = scene.add.rectangle(bossX, config.y - 25, 80, 50, PODIUM_COLOR);
    this.podium.setDepth(7);

    // Name label
    this.nameLabel = scene.add.text(bossX, bossY - BOSS_H / 2 - 40, "Prof. No-Curve", {
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fontSize: "12px",
      color: "#fca5a5",
      fontStyle: "bold",
    });
    this.nameLabel.setOrigin(0.5);
    this.nameLabel.setDepth(20);

    // Health bar
    const barW = 100;
    const barH = 8;
    const barY = bossY - BOSS_H / 2 - 24;
    this.healthBarBg = scene.add.rectangle(bossX, barY, barW, barH, 0x1e293b);
    this.healthBarBg.setDepth(20);
    this.healthBarFill = scene.add.rectangle(
      bossX - barW / 2,
      barY,
      barW,
      barH,
      0xef4444,
    );
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(21);

    // Projectile group for phase 1
    this.projectileGroup = scene.physics.add.group({ allowGravity: false });
  }

  getProjectileGroup(): Phaser.Physics.Arcade.Group {
    return this.projectileGroup;
  }

  activate() {
    if (this.activated) return;
    this.activated = true;
    this.phase = "phase1";
    this.phase1Round = 0;
    this.phase1Timer = 0;
  }

  isActivated(): boolean {
    return this.activated;
  }

  isDefeated(): boolean {
    return this.phase === "defeated";
  }

  getPhase(): BossPhase {
    return this.phase;
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();

    // Flash red
    this.scene.tweens.add({
      targets: this.bossVisual,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
    });
  }

  private updateHealthBar() {
    const ratio = this.health / this.maxHealth;
    this.healthBarFill.setDisplaySize(100 * ratio, 8);
  }

  /** Handle player collecting a correct answer projectile */
  onCorrectAnswer() {
    this.takeDamage(20);
  }

  /** Handle player hitting a wrong answer projectile */
  onWrongAnswer() {
    usePlayerStats.getState().modifyStats({ energy: -3 }, "boss_wrong_answer");
  }

  update(delta: number) {
    if (!this.activated || this.phase === "defeated") return;

    switch (this.phase) {
      case "phase1":
        this.updatePhase1(delta);
        break;
      case "phase2":
        // Phase 2 is dialogue-driven, handled externally
        break;
      case "phase3":
        // Phase 3 is dialogue-driven, handled externally
        break;
    }
  }

  /* ─── Phase 1: Multiple Choice ─── */

  private updatePhase1(delta: number) {
    this.phase1Timer += delta;

    if (this.phase1Timer >= PHASE1_INTERVAL && this.phase1Round < PHASE1_ROUNDS) {
      this.phase1Timer = 0;
      this.phase1Round++;
      this.fireMultipleChoice();
    }

    // Sync container positions to their hit zones, then clean up off-screen projectiles
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      const hitZone = proj.getData("hitZone") as Phaser.GameObjects.Zone | undefined;
      if (hitZone && hitZone.active) {
        proj.setPosition(hitZone.x, hitZone.y);
      }
      if (proj.x < this.config.arenaLeft - 100 || proj.y > 750) {
        proj.destroy();
        this.activeProjectiles.splice(i, 1);
      }
    }

    // Check if phase 1 is complete (all rounds fired and no active projectiles)
    if (this.phase1Round >= PHASE1_ROUNDS && this.activeProjectiles.length === 0) {
      this.startPhase2();
    }
  }

  private fireMultipleChoice() {
    const labels = ["A", "B", "C"];
    const correctIdx = Phaser.Math.Between(0, 2);
    const bossX = this.config.x;
    const bossY = this.config.y - BOSS_H;

    for (let i = 0; i < 3; i++) {
      const isCorrect = i === correctIdx;
      const color = isCorrect ? 0x22c55e : 0xef4444;
      const yOffset = (i - 1) * 60;

      const proj = this.scene.add.container(bossX - 60, bossY + yOffset);

      // Circle background
      const circle = this.scene.add.circle(0, 0, PROJECTILE_SIZE / 2, color);
      proj.add(circle);

      // Label
      const text = this.scene.add.text(0, 0, labels[i], {
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      });
      text.setOrigin(0.5);
      proj.add(text);

      proj.setDepth(9);
      proj.setData("correct", isCorrect);

      // Physics zone
      const hitZone = this.scene.add.zone(proj.x, proj.y, PROJECTILE_SIZE + 8, PROJECTILE_SIZE + 8);
      this.scene.physics.add.existing(hitZone, false);
      const body = hitZone.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setVelocityX(-PROJECTILE_SPEED);
      body.setVelocityY(Phaser.Math.Between(-20, 20));

      this.projectileGroup.add(hitZone);
      hitZone.setData("correct", isCorrect);
      hitZone.setData("container", proj);

      // Keep in sync
      proj.setData("hitZone", hitZone);

      this.activeProjectiles.push(proj);
    }
  }

  /* ─── Phase 2: Essay Defense ─── */

  private startPhase2() {
    this.phase = "phase2";

    const essayTree = this.config.dialogueTrees?.essay;
    if (!essayTree) {
      this.startPhase3();
      return;
    }

    // Snapshot the pre-encounter correct count so essay damage reflects
    // only choices made during this encounter, not the all-time history.
    const correctCountBefore = useChoiceHistory
      .getState()
      .choices.filter(
        (c) => c.dialogueId === "boss_essay" && c.tags.includes("correct"),
      ).length;

    // Open dialogue
    useDialogueState
      .getState()
      .openDialogue("start", essayTree, "boss_essay", this.config.type);

    // Watch for dialogue close to count correct answers and proceed
    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === "phase2") {
        unsub();
        // Count correct answers made during this encounter only
        const correctCountAfter = useChoiceHistory
          .getState()
          .choices.filter(
            (c) => c.dialogueId === "boss_essay" && c.tags.includes("correct"),
          ).length;
        const correctCount = correctCountAfter - correctCountBefore;

        this.takeDamage(correctCount * 15);
        this.startPhase3();
      }
    });
  }

  /* ─── Phase 3: Grade Appeal ─── */

  private startPhase3() {
    this.phase = "phase3";

    const appealTree = this.config.dialogueTrees?.appeal;
    if (!appealTree) {
      this.defeat();
      return;
    }

    // Brief delay before final phase
    this.scene.time.delayedCall(500, () => {
      useDialogueState
        .getState()
        .openDialogue("start", appealTree, "boss_appeal", this.config.type);

      const unsub = useDialogueState.subscribe((state) => {
        if (!state.isOpen && this.phase === "phase3") {
          unsub();
          this.defeat();
        }
      });
    });
  }

  /* ─── Defeat ─── */

  private defeat() {
    this.phase = "defeated";
    this.health = 0;
    this.updateHealthBar();

    // Defeat animation
    this.scene.tweens.add({
      targets: [this.bossVisual, this.podium],
      alpha: 0,
      y: this.config.y + 50,
      duration: 800,
      ease: "Power2",
    });

    this.nameLabel.setText("DEFEATED");
    this.nameLabel.setColor("#4ade80");

    this.scene.time.delayedCall(1200, () => {
      this.onDefeated?.();
    });
  }

  /** Clean up projectiles when one is hit */
  destroyProjectile(hitZone: Phaser.GameObjects.Zone) {
    const container = hitZone.getData("container") as Phaser.GameObjects.Container | undefined;
    if (container) {
      const idx = this.activeProjectiles.indexOf(container);
      if (idx >= 0) this.activeProjectiles.splice(idx, 1);
      container.destroy();
    }
    hitZone.destroy();
  }

  destroy() {
    this.bossVisual.destroy();
    this.podium.destroy();
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.nameLabel.destroy();
    for (const p of this.activeProjectiles) p.destroy();
    this.projectileGroup.destroy(true);
  }
}
