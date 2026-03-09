import Phaser from "phaser";
import { usePlayerStats } from "../../ui/stores/playerStats";
import type { PowerUpType } from "../config/levelTypes";

interface PowerUpVisual {
  color: number;
  icon: string;
  label: string;
}

const VISUALS: Record<PowerUpType, PowerUpVisual> = {
  double_espresso: { color: 0xd97706, icon: "☕", label: "ESPRESSO" },
  networking_card: { color: 0x10b981, icon: "📇", label: "NETWORK+" },
  pto_day: { color: 0xf59e0b, icon: "🏖️", label: "PTO DAY" },
};

const SIZE = 28;
const SPEED_BOOST_DURATION = 10000; // 10s for espresso

/**
 * Collectible power-up that applies effects when collected.
 */
export class PowerUp extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private powerUpType: PowerUpType;
  private collected = false;
  private hitZone: Phaser.GameObjects.Zone;
  private baseY: number;
  private bobPhase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y);
    this.powerUpType = type;
    this.baseY = y;
    this.bobPhase = Math.random() * Math.PI * 2;

    const visual = VISUALS[type];

    // Glowing background circle
    const glow = scene.add.circle(0, 0, SIZE / 2 + 4, visual.color, 0.3);
    this.add(glow);

    // Main circle
    const main = scene.add.circle(0, 0, SIZE / 2, visual.color);
    this.add(main);

    // Icon text
    const icon = scene.add.text(0, -1, visual.icon, {
      fontSize: "14px",
    });
    icon.setOrigin(0.5);
    this.add(icon);

    // Label below
    const label = scene.add.text(0, SIZE / 2 + 8, visual.label, {
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fontSize: "8px",
      color: "#94a3b8",
      fontStyle: "bold",
    });
    label.setOrigin(0.5);
    this.add(label);

    scene.add.existing(this);
    this.setDepth(9);

    // Physics hitbox zone
    this.hitZone = scene.add.zone(x, y, SIZE + 8, SIZE + 8);
    scene.physics.add.existing(this.hitZone, true); // static
  }

  getHitZone(): Phaser.GameObjects.Zone {
    return this.hitZone;
  }

  isCollected(): boolean {
    return this.collected;
  }

  collect() {
    if (this.collected) return;
    this.collected = true;

    const stats = usePlayerStats.getState();

    switch (this.powerUpType) {
      case "double_espresso":
        // Speed boost handled by GameScene via player; here just mark and do energy penalty later
        // For now: the scene will handle the speed buff. We just show a feedback
        this.scene.time.delayedCall(SPEED_BOOST_DURATION, () => {
          usePlayerStats.getState().modifyStats({ energy: -15 }, "espresso_crash");
        });
        break;

      case "networking_card":
        stats.modifyStats({ network: 5 }, "networking_card");
        break;

      case "pto_day":
        // Restore energy to 100
        const currentEnergy = stats.energy;
        stats.modifyStats({ energy: 100 - currentEnergy }, "pto_day");
        break;
    }

    // Collection animation: float up and fade
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      alpha: 0,
      duration: 400,
      ease: "Power2",
      onComplete: () => {
        this.hitZone.destroy();
        this.destroy();
      },
    });
  }

  update() {
    if (this.collected) return;

    // Bob up and down
    const time = this.scene.time.now / 1000;
    this.y = this.baseY + Math.sin(time * 2 + this.bobPhase) * 6;
    this.hitZone.setPosition(this.x, this.y);
  }
}
