import Phaser from "phaser";
import { Player } from "../Player";
import { usePlayerStats } from "../../../ui/stores/playerStats";

const WIDTH = 40;
const HEIGHT = 60;
const COLOR = 0x6b7280; // gray
const FOLLOW_RANGE = 200;
const FOLLOW_SPEED = 100;
const DRAIN_PER_SECOND = -1;
const DRAIN_INTERVAL = 1000; // ms
const SHAKE_OFF_JUMPS = 3;
const SHAKE_OFF_WINDOW = 2000; // ms

/**
 * Group Project Freeloader — slow NPC that follows player when in range.
 * Drains -1 Energy per second while attached.
 * Jump 3 times in 2 seconds to shake them off.
 */
export class Freeloader extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body;

  private attached = false;
  private shakenOff = false;
  private lastDrainTime = 0;
  private jumpTimestamps: number[] = [];
  private targetPlayer: Player | null = null;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y - HEIGHT / 2, WIDTH, HEIGHT, COLOR);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setGravityY(1200);
    this.body.setCollideWorldBounds(false);
    this.body.setMaxVelocityY(800);

    this.setDepth(8);

    // Label
    this.label = scene.add.text(x, y - HEIGHT - 10, "FREELOADER", {
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fontSize: "9px",
      color: "#94a3b8",
      fontStyle: "bold",
    });
    this.label.setOrigin(0.5);
    this.label.setDepth(8);
  }

  setTargetPlayer(player: Player) {
    this.targetPlayer = player;
  }

  isAttached(): boolean {
    return this.attached;
  }

  isShakenOff(): boolean {
    return this.shakenOff;
  }

  /** Called from GameScene when player jumps (to track shake-off) */
  registerPlayerJump() {
    if (!this.attached || this.shakenOff) return;

    const now = this.scene.time.now;
    this.jumpTimestamps.push(now);
    // Keep only recent jumps
    this.jumpTimestamps = this.jumpTimestamps.filter(
      (t) => now - t < SHAKE_OFF_WINDOW,
    );

    if (this.jumpTimestamps.length >= SHAKE_OFF_JUMPS) {
      this.shakeOff();
    }
  }

  private shakeOff() {
    this.attached = false;
    this.shakenOff = true;
    // Fling away
    this.body.setVelocityX(this.x < (this.targetPlayer?.x ?? 0) ? -200 : 200);
    this.body.setVelocityY(-300);
    this.setAlpha(0.5);
    this.label.setText("SHAKEN OFF!");

    // Fade out after a moment
    this.scene.time.delayedCall(2000, () => {
      this.label.destroy();
      this.destroy();
    });
  }

  update() {
    if (this.shakenOff || !this.targetPlayer) return;

    const player = this.targetPlayer;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (!this.attached) {
      // Follow if in range
      if (dist < FOLLOW_RANGE) {
        const dx = player.x - this.x;
        this.body.setVelocityX(Math.sign(dx) * FOLLOW_SPEED);
      } else {
        this.body.setVelocityX(0);
      }

      // Attach when very close
      if (dist < 50) {
        this.attached = true;
        this.label.setText("ATTACHED! Jump 3x to shake off!");
        this.label.setColor("#f87171");
      }
    }

    if (this.attached) {
      // Follow player closely
      const dx = player.x - this.x;
      this.body.setVelocityX(Math.sign(dx) * FOLLOW_SPEED * 2);

      // Drain energy
      const now = this.scene.time.now;
      if (now - this.lastDrainTime >= DRAIN_INTERVAL) {
        this.lastDrainTime = now;
        usePlayerStats.getState().modifyStats({ energy: DRAIN_PER_SECOND }, "freeloader");
      }
    }

    // Sync label position
    this.label.setPosition(this.x, this.y - HEIGHT / 2 - 14);
  }

  destroy(fromScene?: boolean) {
    if (this.label && this.label.scene) this.label.destroy();
    super.destroy(fromScene);
  }
}
