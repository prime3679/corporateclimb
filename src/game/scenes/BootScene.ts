import Phaser from "phaser";
import { BG_COLOR } from "../config/gameConfig";
import { useCharacterStore } from "../../ui/stores/characterStore";

/**
 * Boot scene now waits for character creation before starting the game.
 * It shows a title screen while the React CharacterCreator overlay is visible.
 * Once the player finalizes their character, we transition to GameScene.
 */
export class BootScene extends Phaser.Scene {
  private unsubscribe?: () => void;

  constructor() {
    super({ key: "Boot" });
  }

  create() {
    this.cameras.main.setBackgroundColor(BG_COLOR);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 40, "Corporate Climb", {
        fontFamily: "Arial, sans-serif",
        fontSize: "64px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 30, "Create your character to begin", {
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        color: "#94a3b8",
      })
      .setOrigin(0.5);

    // If character already created (shouldn't happen, but handle it)
    if (useCharacterStore.getState().isCreated) {
      this.startGame();
      return;
    }

    // Listen for character finalization from the React CharacterCreator
    this.unsubscribe = useCharacterStore.subscribe((state) => {
      if (state.isCreated) {
        this.startGame();
      }
    });
  }

  private startGame() {
    this.unsubscribe?.();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Game");
    });
  }

  shutdown() {
    this.unsubscribe?.();
  }
}
