import Phaser from "phaser";
import { Player } from "../entities/Player";
import { DialogueTrigger, type DialogueTriggerConfig } from "../entities/DialogueTrigger";
import { CameraSystem } from "../systems/CameraSystem";
import { ParallaxBackground } from "../systems/ParallaxBackground";
import { EnvironmentDecorations } from "../systems/EnvironmentDecorations";
import { TutorialSystem } from "../systems/TutorialSystem";
import { AlarmClock } from "../entities/enemies/AlarmClock";
import { Freeloader } from "../entities/enemies/Freeloader";
import { MidtermStack } from "../entities/enemies/MidtermStack";
import { PowerUp } from "../entities/PowerUp";
import { Boss } from "../entities/Boss";
import type { LevelConfig, PlatformConfig, NPCConfig } from "../config/levelTypes";
import { freshmanLevel } from "../config/levels/freshmanLevel";
import { useDialogueState } from "../../ui/stores/dialogueState";
import { useGameState } from "../../ui/stores/gameState";
import { usePlayerStats } from "../../ui/stores/playerStats";
import { useLevelComplete } from "../../ui/components/LevelComplete";

const PLATFORM_COLOR = 0x334155;
const ONEWAY_COLOR = 0x475569;
const MOVING_COLOR = 0x6366f1;
const GROUND_COLOR = 0x1e293b;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cameraSystem!: CameraSystem;
  private solidPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private oneWayPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.Physics.Arcade.Group;
  private dialogueTriggers: DialogueTrigger[] = [];
  private dialoguePaused = false;

  // New systems
  private tutorialSystem?: TutorialSystem;

  // Enemies
  private alarmClocks: AlarmClock[] = [];
  private freeloaders: Freeloader[] = [];
  private midtermStacks: MidtermStack[] = [];

  // Power-ups
  private powerUps: PowerUp[] = [];

  // Boss
  private boss?: Boss;

  // Speed boost state (from espresso)
  private speedBoostActive = false;
  private speedBoostTimer = 0;

  // Level timing
  private levelStartTime = 0;

  // Track player actions for tutorial + freeloader
  private lastPlayerOnGround = false;

  // Level config reference
  private level!: LevelConfig;

  // Gap fall penalty tracking
  private gapPenaltyZones: { x1: number; x2: number }[] = [];

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.level = freshmanLevel;
    this.levelStartTime = this.time.now;

    // Background
    new ParallaxBackground(this, this.level.backgroundLayers, this.level.bounds.width);

    // Decorations
    if (this.level.decorations?.length) {
      new EnvironmentDecorations(this, this.level.decorations);
    }

    // Platform groups
    this.solidPlatforms = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false });

    this.buildPlatforms(this.level.platforms);

    // Detect gaps in ground for fall penalty
    this.detectGaps();

    // Player
    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
    this.player.setLevelBoundsHeight(this.level.bounds.height);

    // Collisions
    this.physics.add.collider(this.player, this.solidPlatforms);
    this.physics.add.collider(
      this.player,
      this.oneWayPlatforms,
      undefined,
      (player, platform) => {
        const playerBody = (player as Player).body as Phaser.Physics.Arcade.Body;
        const platBody = (platform as Phaser.GameObjects.Rectangle)
          .body as Phaser.Physics.Arcade.StaticBody;
        return (
          playerBody.velocity.y >= 0 &&
          playerBody.bottom <= platBody.top + 12
        );
      },
      this,
    );
    this.physics.add.collider(this.player, this.movingPlatforms);

    // Camera
    this.cameraSystem = new CameraSystem(this, this.player, this.level.bounds);

    // Dialogue triggers (NPCs)
    this.createNPCs();

    // Enemies
    this.createEnemies();

    // Power-ups
    this.createPowerUps();

    // Boss
    this.createBoss();

    // Tutorial
    if (this.level.tutorialPrompts?.length) {
      this.tutorialSystem = new TutorialSystem(this, this.player, this.level.tutorialPrompts);
    }

    // Signal React
    useGameState.getState().setRunning(true);
    useGameState.getState().setCurrentScene("Game");

    // Dialogue pause/resume
    useDialogueState.subscribe((state) => {
      if (state.isOpen && !this.dialoguePaused) {
        this.pauseForDialogue();
      } else if (!state.isOpen && this.dialoguePaused) {
        this.resumeFromDialogue();
      }
    });
  }

  /* ─── NPC creation ─── */

  private createNPCs() {
    const npcs = this.level.npcs ?? [];
    for (const npc of npcs) {
      this.createNPC(npc);
    }

    // Set up overlap detection
    for (const t of this.dialogueTriggers) {
      this.physics.add.overlap(
        this.player,
        t,
        () => t.setOverlapping(true),
        undefined,
        this,
      );
    }
  }

  private createNPC(npc: NPCConfig) {
    const triggerConfig: DialogueTriggerConfig = {
      x: npc.x - 40,
      y: npc.y - 80,
      width: 80,
      height: 80,
      dialogueId: npc.dialogueId,
      startNodeId: npc.startNodeId,
      tree: npc.tree,
      levelId: this.level.name,
      oneShot: npc.oneShot,
    };

    const trigger = new DialogueTrigger(this, triggerConfig);
    this.dialogueTriggers.push(trigger);

    // NPC visual
    const visual = this.add.rectangle(npc.x, npc.y - 40, 40, 60, npc.color ?? 0x22d3ee);
    visual.setDepth(9);

    // Label
    if (npc.label) {
      const label = this.add.text(npc.x, npc.y - 78, npc.label, {
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: "9px",
        color: "#94a3b8",
        fontStyle: "bold",
      });
      label.setOrigin(0.5);
      label.setDepth(9);
    }
  }

  /* ─── Enemy creation ─── */

  private createEnemies() {
    const enemies = this.level.enemies ?? [];
    for (const e of enemies) {
      switch (e.type) {
        case "alarm_clock": {
          const clock = new AlarmClock(this, e.x, e.y, e.range, e.speed);
          this.alarmClocks.push(clock);

          // Overlap with player
          this.physics.add.overlap(
            this.player,
            clock.getHitZone(),
            () => clock.onHitPlayer(this.player),
            undefined,
            this,
          );
          break;
        }
        case "freeloader": {
          const fl = new Freeloader(this, e.x, e.y);
          fl.setTargetPlayer(this.player);
          this.freeloaders.push(fl);

          // Collide with ground
          this.physics.add.collider(fl, this.solidPlatforms);
          break;
        }
        case "midterm_stack": {
          const ms = new MidtermStack(this, e.x, e.y, e.range);
          this.midtermStacks.push(ms);

          // Overlap papers with player
          this.physics.add.overlap(
            this.player,
            ms.getGroup(),
            () => ms.onHitPlayer(),
            undefined,
            this,
          );
          break;
        }
      }
    }
  }

  /* ─── Power-up creation ─── */

  private createPowerUps() {
    const pus = this.level.powerUps ?? [];
    for (const pu of pus) {
      const powerUp = new PowerUp(this, pu.x, pu.y, pu.type);
      this.powerUps.push(powerUp);

      this.physics.add.overlap(
        this.player,
        powerUp.getHitZone(),
        () => {
          if (!powerUp.isCollected()) {
            powerUp.collect();
            if (pu.type === "double_espresso") {
              this.activateSpeedBoost();
            }
          }
        },
        undefined,
        this,
      );
    }
  }

  private activateSpeedBoost() {
    this.speedBoostActive = true;
    this.speedBoostTimer = 10000;
    this.player.setSpeedMultiplier(1.3);
  }

  /* ─── Boss creation ─── */

  private createBoss() {
    if (!this.level.boss) return;

    this.boss = new Boss(this, this.level.boss, this.player, () => {
      this.onLevelComplete();
    });

    // Boss activation zone — when player enters the arena
    const activationZone = this.add.zone(
      this.level.boss.arenaLeft + 100,
      this.level.boss.arenaFloorY - 40,
      100,
      80,
    );
    this.physics.add.existing(activationZone, true);
    this.physics.add.overlap(
      this.player,
      activationZone,
      () => {
        if (!this.boss!.isActivated()) {
          this.boss!.activate();
          activationZone.destroy();
        }
      },
      undefined,
      this,
    );

    // Boss projectile overlap (phase 1)
    this.physics.add.overlap(
      this.player,
      this.boss.getProjectileGroup(),
      (_player, projectile) => {
        const hitZone = projectile as Phaser.GameObjects.Zone;
        const isCorrect = hitZone.getData("correct") as boolean;
        if (isCorrect) {
          this.boss!.onCorrectAnswer();
        } else {
          this.boss!.onWrongAnswer();
        }
        this.boss!.destroyProjectile(hitZone);
      },
      undefined,
      this,
    );
  }

  /* ─── Gap detection ─── */

  private detectGaps() {
    // Find gaps between ground-level solid platforms around party area
    // The gap is at x=5400 to x=5600
    this.gapPenaltyZones.push({ x1: 5400, x2: 5600 });
  }

  /* ─── Pause/Resume ─── */

  private pauseForDialogue() {
    this.dialoguePaused = true;
    this.physics.pause();
    this.player.setInputEnabled(false);
  }

  private resumeFromDialogue() {
    this.dialoguePaused = false;
    this.physics.resume();
    this.player.setInputEnabled(true);
  }

  /* ─── Level Complete ─── */

  private onLevelComplete() {
    const timeTaken = this.time.now - this.levelStartTime;

    // Pause game
    this.time.delayedCall(500, () => {
      this.physics.pause();
      this.player.setInputEnabled(false);

      useLevelComplete.getState().show({
        levelName: this.level.name,
        timeTaken,
      });
    });
  }

  /* ─── Platform building ─── */

  private buildPlatforms(platforms: PlatformConfig[]) {
    for (const p of platforms) {
      if (p.type === "moving") {
        this.createMovingPlatform(p);
      } else if (p.type === "one-way") {
        this.createStaticPlatform(p, this.oneWayPlatforms, p.color ?? ONEWAY_COLOR);
      } else {
        const color = p.color ?? (p.height > 40 ? GROUND_COLOR : PLATFORM_COLOR);
        this.createStaticPlatform(p, this.solidPlatforms, color);
      }
    }
  }

  private createStaticPlatform(
    p: PlatformConfig,
    group: Phaser.Physics.Arcade.StaticGroup,
    color: number,
  ) {
    const rect = this.add.rectangle(
      p.x + p.width / 2,
      p.y + p.height / 2,
      p.width,
      p.height,
      color,
    );
    group.add(rect);
    rect.setDepth(0);
  }

  private createMovingPlatform(p: PlatformConfig) {
    const rect = this.add.rectangle(
      p.x + p.width / 2,
      p.y + p.height / 2,
      p.width,
      p.height,
      p.color ?? MOVING_COLOR,
    );
    this.movingPlatforms.add(rect);

    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setSize(p.width, p.height);
    body.setImmovable(true);
    body.setAllowGravity(false);

    rect.setData("originX", p.x + p.width / 2);
    rect.setData("originY", p.y + p.height / 2);
    rect.setData("moveRange", p.moveRange ?? 200);
    rect.setData("moveSpeed", p.moveSpeed ?? 80);
    rect.setData("moveAxis", p.moveAxis ?? "horizontal");
    rect.setData("phase", Math.random() * Math.PI * 2);
  }

  /* ─── Update loop ─── */

  update(_time: number, delta: number) {
    if (this.dialoguePaused) return;

    this.player.update(delta);
    this.cameraSystem.update();
    this.updateMovingPlatforms();

    // Track jump events for tutorial + freeloader
    const playerOnGround = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;
    const playerJustJumped = this.lastPlayerOnGround && !playerOnGround &&
      (this.player.body as Phaser.Physics.Arcade.Body).velocity.y < 0;
    this.lastPlayerOnGround = playerOnGround;

    // Tutorial notifications
    if (this.tutorialSystem) {
      const input = this.player.readInput();
      if (input.moveX !== 0) this.tutorialSystem.notifyAction("move");
      if (input.jumpPressed) this.tutorialSystem.notifyAction("jump");
      if (input.dodgePressed) this.tutorialSystem.notifyAction("dodge");
      // Interact notification happens when dialogue opens
      if (useDialogueState.getState().isOpen) {
        this.tutorialSystem.notifyAction("interact");
      }
      this.tutorialSystem.update();
    }

    // Freeloader jump tracking
    if (playerJustJumped) {
      for (const fl of this.freeloaders) {
        fl.registerPlayerJump();
      }
    }

    // Enemies
    for (const clock of this.alarmClocks) clock.update();
    for (const fl of this.freeloaders) {
      if (!fl.isShakenOff()) fl.update();
    }
    for (const ms of this.midtermStacks) ms.update(delta);

    // Power-ups
    for (const pu of this.powerUps) pu.update();

    // Speed boost timer
    if (this.speedBoostActive) {
      this.speedBoostTimer -= delta;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
        this.player.setSpeedMultiplier(1.0);
      }
    }

    // Boss
    if (this.boss && !this.boss.isDefeated()) {
      this.boss.update(delta);
    }

    // Gap fall penalty check
    if (this.player.y > this.level.bounds.height + 50) {
      for (const gap of this.gapPenaltyZones) {
        if (this.player.x >= gap.x1 && this.player.x <= gap.x2) {
          usePlayerStats.getState().modifyStats({ energy: -5 }, "gap_fall");
          break;
        }
      }
    }

    // Dialogue triggers
    for (const t of this.dialogueTriggers) {
      t.update();
    }
    for (const t of this.dialogueTriggers) {
      t.setOverlapping(false);
    }
  }

  private updateMovingPlatforms() {
    const time = this.time.now / 1000;

    this.movingPlatforms.getChildren().forEach((child) => {
      const rect = child as Phaser.GameObjects.Rectangle;
      const body = rect.body as Phaser.Physics.Arcade.Body;
      const originX = rect.getData("originX") as number;
      const originY = rect.getData("originY") as number;
      const range = rect.getData("moveRange") as number;
      const speed = rect.getData("moveSpeed") as number;
      const axis = rect.getData("moveAxis") as string;
      const phase = rect.getData("phase") as number;

      const t = Math.sin(time * (speed / range) * Math.PI + phase);

      if (axis === "horizontal") {
        const newX = originX + t * range;
        body.setVelocityX((newX - rect.x) * 60);
        body.setVelocityY(0);
      } else {
        const newY = originY + t * range;
        body.setVelocityX(0);
        body.setVelocityY((newY - rect.y) * 60);
      }
    });
  }
}
