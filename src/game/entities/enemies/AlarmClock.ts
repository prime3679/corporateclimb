import Phaser from "phaser";
import { Player } from "../Player";
import { usePlayerStats } from "../../../ui/stores/playerStats";

const SIZE = 32;
const COLOR = 0xef4444; // red
const RAY_COLOR = 0xfbbf24; // amber rays
const DAMAGE = -5;
const HIT_COOLDOWN = 1000; // ms between damage ticks

/**
 * 8 AM Alarm Clock — flies horizontally across the screen at player height.
 * Contact deals -5 Energy. Visual: red circle with alarm ray lines.
 */
export class AlarmClock extends Phaser.GameObjects.Container {
  private spawnOriginX: number;
  private range: number;
  private speed: number;
  private direction = 1;
  private lastHitTime = 0;
  declare body: Phaser.Physics.Arcade.Body;

  // Hitbox zone for physics
  private hitZone: Phaser.GameObjects.Zone;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    range: number = 500,
    speed: number = 200,
  ) {
    super(scene, x, y);
    this.spawnOriginX = x;
    this.range = range;
    this.speed = speed;

    // Visual: red circle
    const body = scene.add.circle(0, 0, SIZE / 2, COLOR);
    this.add(body);

    // Alarm ray lines
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = Phaser.Math.DegToRad(angle);
      const ray = scene.add.rectangle(
        Math.cos(rad) * (SIZE / 2 + 6),
        Math.sin(rad) * (SIZE / 2 + 6),
        8,
        3,
        RAY_COLOR,
      );
      ray.setRotation(rad);
      this.add(ray);
    }

    scene.add.existing(this);

    // Create a physics-enabled zone as the hitbox
    this.hitZone = scene.add.zone(x, y, SIZE, SIZE);
    scene.physics.add.existing(this.hitZone, false);
    const zoneBody = this.hitZone.body as Phaser.Physics.Arcade.Body;
    zoneBody.setAllowGravity(false);
    zoneBody.setImmovable(true);

    this.setDepth(8);
  }

  getHitZone(): Phaser.GameObjects.Zone {
    return this.hitZone;
  }

  onHitPlayer(_player: Player) {
    const now = this.scene.time.now;
    if (now - this.lastHitTime < HIT_COOLDOWN) return;
    this.lastHitTime = now;
    usePlayerStats.getState().modifyStats({ energy: DAMAGE }, "alarm_clock");
  }

  update() {
    // Patrol back and forth
    this.x += this.speed * this.direction * (this.scene.game.loop.delta / 1000);

    if (this.x > this.spawnOriginX + this.range) {
      this.direction = -1;
    } else if (this.x < this.spawnOriginX - this.range) {
      this.direction = 1;
    }

    // Rotate the visual slightly for effect
    this.rotation += 0.03 * this.direction;

    // Sync hitbox
    this.hitZone.setPosition(this.x, this.y);
  }

  destroy(fromScene?: boolean) {
    this.hitZone.destroy();
    super.destroy(fromScene);
  }
}
