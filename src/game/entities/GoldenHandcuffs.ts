import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'

/**
 * Golden Handcuffs — floating chain-link collectibles on the corporate path.
 * Give a Cash boost but slow the player briefly (the weight of comfort).
 */
export class GoldenHandcuffs {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  collected = false
  x: number
  y: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.x = x
    this.y = y

    // Chain links
    const link1 = scene.add.circle(-8, 0, 8, 0xFCD34D, 0.9)
    link1.setStrokeStyle(2, 0xB45309)
    const link2 = scene.add.circle(8, 0, 8, 0xFCD34D, 0.9)
    link2.setStrokeStyle(2, 0xB45309)
    const shimmer = scene.add.circle(0, 0, 12, 0xFDE68A, 0.3)

    this.sprite = scene.add.container(x, y, [shimmer, link1, link2])
    this.sprite.setSize(30, 20)

    // Float and shimmer
    scene.tweens.add({
      targets: this.sprite,
      y: y - 6,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  checkCollect(px: number, py: number): boolean {
    if (this.collected) return false
    if (Math.abs(px - this.x) < 35 && Math.abs(py - this.y) < 35) {
      this.collect()
      return true
    }
    return false
  }

  private collect() {
    this.collected = true
    usePlayerStats.getState().modifyStats({ cash: 8 }, 'golden_handcuffs')

    // Collection animation — chain snaps
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 400,
      ease: 'Back.easeIn',
      onComplete: () => this.sprite.destroy(),
    })
  }
}
