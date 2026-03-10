import Phaser from 'phaser'

/**
 * Scope Creep Blob — a growing purple mass in the scope creep corridor.
 * Expands over time, narrowing the passable space.
 * Contact drains energy and slows movement.
 */
export class ScopeCreepBlob {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  private baseSize: number
  private growthRate: number
  private currentSize: number
  private maxSize: number
  x: number
  y: number
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, baseSize = 60, growthRate = 0.015, maxSize = 200) {
    this.scene = scene
    this.x = x
    this.y = y
    this.baseSize = baseSize
    this.currentSize = baseSize
    this.growthRate = growthRate
    this.maxSize = maxSize

    const blob = scene.add.circle(0, 0, baseSize / 2, 0x7C3AED, 0.7)
    const inner = scene.add.circle(0, 0, baseSize / 3, 0x6D28D9, 0.5)

    this.sprite = scene.add.container(x, y, [blob, inner])

    // Pulsing animation
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.05,
      scaleY: 0.95,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  update(dt: number) {
    if (this.destroyed) return

    // Grow over time
    this.currentSize = Math.min(this.maxSize, this.currentSize + this.growthRate * dt)
    const scale = this.currentSize / this.baseSize
    this.sprite.setScale(scale)
  }

  /** Check if player overlaps the blob */
  checkCollision(px: number, py: number): boolean {
    const radius = this.currentSize / 2
    const dx = px - this.x
    const dy = py - this.y
    return Math.sqrt(dx * dx + dy * dy) < radius + 25
  }

  destroy() {
    this.destroyed = true
    this.sprite.destroy()
  }
}
