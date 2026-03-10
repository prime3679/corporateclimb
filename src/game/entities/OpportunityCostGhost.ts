import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'

/**
 * Opportunity Cost Ghost — appears when the player explores one path
 * and turns around, showing what they're leaving behind.
 * Brief visual + small energy drain (the weight of indecision).
 */
export class OpportunityCostGhost {
  scene: Phaser.Scene
  private triggerX: number
  private triggered = false
  private ghost: Phaser.GameObjects.Container | null = null
  destroyed = false

  constructor(scene: Phaser.Scene, triggerX: number) {
    this.scene = scene
    this.triggerX = triggerX
  }

  /** Call each frame with player x and direction of movement */
  checkTrigger(px: number, movingLeft: boolean): boolean {
    if (this.triggered || this.destroyed) return false

    // Trigger when player passes the threshold going left (turning back)
    if (px < this.triggerX && movingLeft) {
      this.triggered = true
      this.spawnGhost(px)
      return true
    }
    return false
  }

  private spawnGhost(px: number) {
    const gy = this.scene.cameras.main.scrollY + 300

    // Ghostly silhouette
    const body = this.scene.add.rectangle(0, 0, 50, 70, 0x94A3B8, 0.4)
    const head = this.scene.add.circle(0, -45, 18, 0x94A3B8, 0.3)
    const text = this.scene.add.text(0, 50, 'What if...?', {
      fontSize: '13px',
      fontFamily: 'system-ui',
      color: '#94A3B8',
      fontStyle: 'italic',
    }).setOrigin(0.5)
    text.setAlpha(0.6)

    this.ghost = this.scene.add.container(px + 200, gy, [body, head, text])
    this.ghost.setAlpha(0)
    this.ghost.setDepth(40)

    // Fade in, linger, fade out
    this.scene.tweens.add({
      targets: this.ghost,
      alpha: 0.8,
      duration: 800,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        this.ghost?.destroy()
        this.ghost = null
      },
    })

    // Small energy cost for indecision
    usePlayerStats.getState().modifyStats({ energy: -3 }, 'opportunity_cost_ghost')
  }

  destroy() {
    this.destroyed = true
    this.ghost?.destroy()
  }
}
