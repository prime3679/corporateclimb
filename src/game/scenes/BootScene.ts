import Phaser from "phaser";
import { BG_COLOR } from "../config/gameConfig";

const DEV_SKIP_BOOT = true;

export class BootScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super({ key: "Boot" });
  }

  create() {
    if (DEV_SKIP_BOOT) {
      // Use game-level scene manager and stop Boot to avoid both scenes running
      const game = this.game;
      setTimeout(() => {
        game.scene.stop("Boot");
        game.scene.start("Game");
      }, 50);
      return;
    }

    this.cameras.main.setBackgroundColor(BG_COLOR);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, "Corporate Climb", {
        fontFamily: "Arial, sans-serif",
        fontSize: "64px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(width / 2, height / 2 + 60, "Press any key to start", {
        fontFamily: "Arial, sans-serif",
        fontSize: "20px",
        color: "#94a3b8",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 800,
      delay: 500,
      yoyo: true,
      repeat: -1,
      hold: 1200,
    });

    this.input.keyboard!.on("keydown", () => this.startGame());
    this.input.on("pointerdown", () => this.startGame());
  }

  private startGame() {
    if (this.started) return;
    this.started = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Game");
    });
  }
}
