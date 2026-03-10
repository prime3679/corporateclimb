import Phaser from 'phaser'
import { useChoiceHistory } from '../../ui/stores/choiceHistory'

/**
 * The Overachiever — recurring NPC rival character.
 * Appears in Level 2+ with behavior that changes based on player choices.
 * In Level 2: races ahead to grab power-ups. Player can:
 * - Race them (competitive, costs energy)
 * - Take alternate elevated path
 * - Ignore them entirely
 */
export class Overachiever {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  body: Phaser.Physics.Arcade.Body
  private targetX: number
  baseX: number
  private isRacing = false
  private raceComplete = false
  private reachedTarget = false
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, targetX: number) {
    this.scene = scene
    this.baseX = x
    this.targetX = targetX

    // Sharp green rectangle with a #1 badge
    const body = scene.add.rectangle(0, 0, 44, 70, 0x059669)
    const badge = scene.add.text(0, -20, '#1', {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#FCD34D',
    }).setOrigin(0.5)
    const eyes = scene.add.rectangle(0, -5, 24, 8, 0x111827)

    this.sprite = scene.add.container(x, y, [body, badge, eyes])
    this.sprite.setSize(44, 70)
    scene.physics.add.existing(this.sprite)
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body
    this.body.setAllowGravity(true)
    this.body.setSize(44, 70)
    this.body.setOffset(-22, -35)

    // Confident idle bounce
    scene.tweens.add({
      targets: this.sprite,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  /** Start the race when player gets close */
  startRace() {
    if (this.isRacing || this.raceComplete) return
    this.isRacing = true
    this.body.setVelocityX(200)
  }

  update(dt: number) {
    if (this.destroyed || this.raceComplete) return

    if (this.isRacing && !this.reachedTarget) {
      if (this.sprite.x >= this.targetX) {
        this.reachedTarget = true
        this.body.setVelocityX(0)
        this.raceComplete = true

        // Taunt animation
        this.scene.tweens.add({
          targets: this.sprite,
          scaleY: 1.1,
          scaleX: 0.9,
          duration: 200,
          yoyo: true,
          repeat: 2,
        })
      }
    }
  }

  /** Record how the player handled the encounter */
  recordOutcome(outcome: 'competitive' | 'alternative' | 'ignored') {
    useChoiceHistory.getState().recordChoice({
      dialogueId: 'overachiever_l2',
      nodeId: outcome,
      optionIndex: 0,
      tags: [`overachiever_${outcome}`],
      levelId: 'level2',
    })
  }

  destroy() {
    this.destroyed = true
    this.sprite.destroy()
  }
}
