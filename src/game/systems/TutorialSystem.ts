import Phaser from "phaser";
import type { TutorialPromptConfig } from "../config/levelTypes";
import { Player } from "../entities/Player";

const PROMPT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  fontSize: "18px",
  color: "#e2e8f0",
  fontStyle: "bold",
  backgroundColor: "rgba(15, 23, 42, 0.75)",
  padding: { x: 16, y: 10 },
};

interface ActivePrompt {
  config: TutorialPromptConfig;
  text: Phaser.GameObjects.Text;
  triggered: boolean;
  dismissed: boolean;
}

/**
 * Manages on-screen tutorial prompts that appear based on player position
 * and dismiss when the player performs the indicated action.
 */
export class TutorialSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private prompts: ActivePrompt[] = [];

  // Track player actions
  private hasMoved = false;
  private hasJumped = false;
  private hasDodged = false;
  private hasInteracted = false;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    configs: TutorialPromptConfig[],
  ) {
    this.scene = scene;
    this.player = player;

    for (const config of configs) {
      const text = scene.add.text(0, 0, config.text, PROMPT_STYLE);
      text.setOrigin(0.5);
      text.setScrollFactor(0);
      text.setDepth(50);
      text.setAlpha(0);
      text.setPosition(scene.cameras.main.width / 2, 120);

      this.prompts.push({
        config,
        text,
        triggered: false,
        dismissed: false,
      });
    }
  }

  /** Called by GameScene to signal actions */
  notifyAction(action: "move" | "jump" | "dodge" | "interact") {
    switch (action) {
      case "move":
        this.hasMoved = true;
        break;
      case "jump":
        this.hasJumped = true;
        break;
      case "dodge":
        this.hasDodged = true;
        break;
      case "interact":
        this.hasInteracted = true;
        break;
    }
  }

  private isActionDone(action: string): boolean {
    switch (action) {
      case "move":
        return this.hasMoved;
      case "jump":
        return this.hasJumped;
      case "dodge":
        return this.hasDodged;
      case "interact":
        return this.hasInteracted;
      default:
        return false;
    }
  }

  update() {
    const playerX = this.player.x;

    for (const prompt of this.prompts) {
      if (prompt.dismissed) continue;

      // Trigger when player reaches the x position
      if (!prompt.triggered && playerX >= prompt.config.triggerX) {
        prompt.triggered = true;
        // Fade in
        this.scene.tweens.add({
          targets: prompt.text,
          alpha: 1,
          duration: 300,
          ease: "Power2",
        });
      }

      // Dismiss when action is performed
      if (prompt.triggered && this.isActionDone(prompt.config.dismissOn)) {
        prompt.dismissed = true;
        this.scene.tweens.add({
          targets: prompt.text,
          alpha: 0,
          duration: 500,
          ease: "Power2",
          onComplete: () => {
            prompt.text.destroy();
          },
        });
      }
    }
  }

  destroy() {
    for (const prompt of this.prompts) {
      if (prompt.text.scene) prompt.text.destroy();
    }
  }
}
