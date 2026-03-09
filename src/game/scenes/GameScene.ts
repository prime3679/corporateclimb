import Phaser from "phaser";
import { Player } from "../entities/Player";
import { DialogueTrigger, type DialogueTriggerConfig } from "../entities/DialogueTrigger";
import { CameraSystem } from "../systems/CameraSystem";
import { ParallaxBackground } from "../systems/ParallaxBackground";
import { LevelConfig, PlatformConfig } from "../config/levelTypes";
import { testLevel } from "../config/levels/testLevel";
import { testDialogue } from "../config/dialogues/testDialogue";
import { useDialogueState } from "../../ui/stores/dialogueState";

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

  constructor() {
    super({ key: "Game" });
  }

  create() {
    const level: LevelConfig = testLevel;

    // Background
    new ParallaxBackground(this, level.backgroundLayers, level.bounds.width);

    // Platform groups
    this.solidPlatforms = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false });

    this.buildPlatforms(level.platforms);

    // Player
    this.player = new Player(this, level.spawn.x, level.spawn.y);
    this.player.setLevelBoundsHeight(level.bounds.height);

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
    this.cameraSystem = new CameraSystem(this, this.player, level.bounds);

    // Dialogue triggers
    this.createDialogueTriggers(level);

    // Listen for dialogue state changes to pause/resume
    useDialogueState.subscribe((state) => {
      if (state.isOpen && !this.dialoguePaused) {
        this.pauseForDialogue();
      } else if (!state.isOpen && this.dialoguePaused) {
        this.resumeFromDialogue();
      }
    });
  }

  private createDialogueTriggers(level: LevelConfig) {
    const triggerConfig: DialogueTriggerConfig = {
      x: 400,
      y: level.spawn.y - 80,
      width: 80,
      height: 80,
      dialogueId: "test_intern",
      startNodeId: "start",
      tree: testDialogue,
      levelId: level.name,
      oneShot: false,
    };

    const trigger = new DialogueTrigger(this, triggerConfig);
    this.dialogueTriggers.push(trigger);

    // NPC visual indicator (simple colored rectangle)
    const npcVisual = this.add.rectangle(
      triggerConfig.x + triggerConfig.width / 2,
      level.spawn.y - 40,
      40,
      60,
      0x22d3ee,
    );
    npcVisual.setDepth(9);

    // Overlap detection between player and all triggers
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

  private buildPlatforms(platforms: PlatformConfig[]) {
    for (const p of platforms) {
      if (p.type === "moving") {
        this.createMovingPlatform(p);
      } else if (p.type === "one-way") {
        this.createStaticPlatform(p, this.oneWayPlatforms, ONEWAY_COLOR);
      } else {
        const color = p.height > 40 ? GROUND_COLOR : PLATFORM_COLOR;
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
      MOVING_COLOR,
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

  update(_time: number, delta: number) {
    if (this.dialoguePaused) return;

    this.player.update(delta);
    this.cameraSystem.update();
    this.updateMovingPlatforms();

    // Check triggers for E key (overlap callbacks already fired during physics step)
    for (const t of this.dialogueTriggers) {
      t.update();
    }

    // Reset overlaps AFTER processing — they'll be re-set by physics next frame
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
