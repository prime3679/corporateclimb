import Phaser from 'phaser'
import { useChoiceHistory } from '../../ui/stores/choiceHistory'

/**
 * Credit Thief Manager — a medium NPC (purple rectangle) that walks behind
 * the player and steals power-ups. Player can confront, document, or ignore.
 * Choice is recorded for Level 4 callback.
 */
export class CreditThiefManager {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  body: Phaser.Physics.Arcade.Body
  private followDistance = 150
  private isFollowing = false
  private confronted = false
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene

    // Purple rectangle manager
    const torso = scene.add.rectangle(0, 0, 48, 72, 0x7C3AED)
    const head = scene.add.circle(0, -44, 16, 0x8B5CF6)
    const tie = scene.add.rectangle(0, 5, 8, 30, 0x1F2937)
    // Smug expression
    const eyes = scene.add.rectangle(0, -44, 18, 6, 0x111827)

    this.sprite = scene.add.container(x, y, [torso, head, tie, eyes])
    this.sprite.setSize(48, 72)
    scene.physics.add.existing(this.sprite)
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body
    this.body.setAllowGravity(true)
    this.body.setSize(48, 72)
    this.body.setOffset(-24, -36)
  }

  /** Start following when player gets close */
  startFollowing() {
    if (this.isFollowing || this.confronted) return
    this.isFollowing = true
  }

  update(dt: number, playerX: number, playerY: number) {
    if (this.destroyed || this.confronted) return

    if (!this.isFollowing) {
      // Check if player is nearby to start following
      if (Math.abs(playerX - this.sprite.x) < 200) {
        this.startFollowing()
      }
      return
    }

    // Follow behind player
    const dx = playerX - this.followDistance - this.sprite.x
    if (Math.abs(dx) > 10) {
      this.body.setVelocityX(Math.sign(dx) * 150)
    } else {
      this.body.setVelocityX(0)
    }
  }

  /** Record the player's choice about the credit thief */
  recordOutcome(outcome: 'confronted' | 'documented' | 'ignored') {
    this.confronted = true
    this.body.setVelocityX(0)

    useChoiceHistory.getState().recordChoice({
      dialogueId: 'credit_thief',
      nodeId: outcome,
      optionIndex: 0,
      tags: [`credit_${outcome}`],
      levelId: 'level3',
    })

    if (outcome === 'confronted') {
      // Manager scurries away
      this.scene.tweens.add({
        targets: this.sprite,
        x: this.sprite.x - 300,
        alpha: 0,
        duration: 800,
        onComplete: () => this.destroy(),
      })
    } else if (outcome === 'documented') {
      // Manager freezes, then fades
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 1500,
        delay: 500,
        onComplete: () => this.destroy(),
      })
    }
    // 'ignored' — manager stays and follows
  }

  destroy() {
    this.destroyed = true
    this.sprite.destroy()
  }
}
