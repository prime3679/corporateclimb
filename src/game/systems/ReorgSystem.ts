import Phaser from 'phaser'
import { PlatformConfig, ReorgConfig } from '../config/levels/types'
import { useDialogueState, DialogueNode } from '../../ui/stores/dialogueState'

/**
 * ReorgSystem — reusable mechanic that rearranges platforms mid-level.
 * Triggers at a specific player X position. Screen shakes, flash,
 * then platforms tween to new positions over 2 seconds.
 * Reused in Level 3 (once) and Level 4 (twice).
 */
export class ReorgSystem {
  private scene: Phaser.Scene
  private triggered = false
  private triggerX: number
  private postReorgPlatforms: PlatformConfig[]
  private narratorDialogue?: string
  private targetRects: Phaser.GameObjects.Rectangle[] = []
  private solidGroup: Phaser.Physics.Arcade.StaticGroup

  constructor(
    scene: Phaser.Scene,
    config: ReorgConfig,
    solidGroup: Phaser.Physics.Arcade.StaticGroup
  ) {
    this.scene = scene
    this.triggerX = config.triggerX
    this.postReorgPlatforms = config.postReorgPlatforms
    this.narratorDialogue = config.narratorDialogue
    this.solidGroup = solidGroup
  }

  /** Register the platform rectangles that will be rearranged */
  setTargetRects(rects: Phaser.GameObjects.Rectangle[]) {
    this.targetRects = rects
  }

  /** Call each frame with player x. Returns true if reorg was just triggered. */
  checkTrigger(playerX: number): boolean {
    if (this.triggered) return false
    if (playerX < this.triggerX) return false

    this.triggered = true
    this.executeReorg()
    return true
  }

  private executeReorg() {
    // Screen shake
    this.scene.cameras.main.shake(500, 0.008)

    // White flash
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.scrollX + 640,
      this.scene.cameras.main.scrollY + 360,
      1280, 720, 0xFFFFFF, 0.6
    )
    flash.setScrollFactor(0)
    flash.setDepth(100)
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    })

    // Tween existing platforms to new positions over 2 seconds
    const count = Math.min(this.targetRects.length, this.postReorgPlatforms.length)
    for (let i = 0; i < count; i++) {
      const rect = this.targetRects[i]
      const newCfg = this.postReorgPlatforms[i]

      this.scene.tweens.add({
        targets: rect,
        x: newCfg.x,
        y: newCfg.y,
        displayWidth: newCfg.width,
        displayHeight: newCfg.height,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => {
          // Update physics body
          const body = rect.body as Phaser.Physics.Arcade.StaticBody
          body.updateFromGameObject()
        },
      })
    }

    // Spawn any extra post-reorg platforms
    for (let i = count; i < this.postReorgPlatforms.length; i++) {
      const cfg = this.postReorgPlatforms[i]
      const newRect = this.scene.add.rectangle(cfg.x, cfg.y - 200, cfg.width, cfg.height, cfg.color ?? 0x475569)
      newRect.setAlpha(0)
      this.scene.physics.add.existing(newRect, true)
      this.solidGroup.add(newRect)

      this.scene.tweens.add({
        targets: newRect,
        y: cfg.y,
        alpha: 1,
        duration: 2000,
        delay: 500,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          (newRect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
        },
      })
    }

    // Narrator dialogue after reorg completes
    if (this.narratorDialogue) {
      this.scene.time.delayedCall(2500, () => {
        const dialogue: DialogueNode[] = [
          {
            id: 'start',
            speaker: 'NARRATOR',
            text: this.narratorDialogue!,
          },
        ]
        useDialogueState.getState().openDialogue('reorg_narrator', 'start', dialogue)
      })
    }
  }

  get hasTriggered() {
    return this.triggered
  }
}
