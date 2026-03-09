import Phaser from "phaser";
import type { DialogueTree } from "../config/dialogueTypes";
import { useDialogueState } from "../../ui/stores/dialogueState";

const PROMPT_COLOR = 0xa5b4fc;
const PROMPT_ALPHA = 0.8;

export interface DialogueTriggerConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  dialogueId: string;
  startNodeId: string;
  tree: DialogueTree;
  levelId: string;
  oneShot?: boolean;
}

/**
 * Invisible zone that opens a dialogue when the player overlaps and presses E.
 * Shows a floating "E" prompt when overlapping.
 */
export class DialogueTrigger extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;

  private dialogueId: string;
  private startNodeId: string;
  private tree: DialogueTree;
  private levelId: string;
  private oneShot: boolean;
  private used = false;
  private isOverlapping = false;
  private prompt: Phaser.GameObjects.Text;
  private interactKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, config: DialogueTriggerConfig) {
    super(scene, config.x + config.width / 2, config.y + config.height / 2, config.width, config.height);

    this.dialogueId = config.dialogueId;
    this.startNodeId = config.startNodeId;
    this.tree = config.tree;
    this.levelId = config.levelId;
    this.oneShot = config.oneShot ?? false;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    // Floating prompt (hidden by default)
    this.prompt = scene.add.text(this.x, this.y - 50, "E", {
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fontSize: "20px",
      color: `#${PROMPT_COLOR.toString(16)}`,
      fontStyle: "bold",
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      padding: { x: 10, y: 4 },
    });
    this.prompt.setOrigin(0.5);
    this.prompt.setDepth(20);
    this.prompt.setAlpha(0);

    this.interactKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    );
  }

  setOverlapping(overlapping: boolean) {
    if (this.used) return;
    this.isOverlapping = overlapping;
    this.prompt.setAlpha(overlapping ? PROMPT_ALPHA : 0);
  }

  update() {
    if (this.used || !this.isOverlapping) return;

    // Check for E press
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.openDialogue();
    }
  }

  private openDialogue() {
    if (useDialogueState.getState().isOpen) return;

    useDialogueState
      .getState()
      .openDialogue(this.startNodeId, this.tree, this.dialogueId, this.levelId);

    if (this.oneShot) {
      this.used = true;
      this.prompt.destroy();
    }
  }

  isUsed(): boolean {
    return this.used;
  }
}
