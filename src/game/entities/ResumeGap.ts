import Phaser from 'phaser'

/**
 * Resume Gap — literal holes in the floor in the career center section.
 * 3-gap pattern. Player falls through if they don't jump across.
 * Visual: pulsing dark void with "?" symbols floating up.
 */
export class ResumeGap {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  x: number
  y: number
  gapWidth: number
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, gapWidth = 120) {
    this.scene = scene
    this.x = x
    this.y = y
    this.gapWidth = gapWidth

    // Dark void visual
    const void1 = scene.add.rectangle(0, 0, gapWidth, 40, 0x0a0a0a, 0.9)
    const void2 = scene.add.rectangle(0, 5, gapWidth - 10, 30, 0x1a0a2e, 0.7)

    this.sprite = scene.add.container(x, y, [void1, void2])
    this.sprite.setDepth(-1)

    // Floating "?" particles
    for (let i = 0; i < 3; i++) {
      const q = scene.add.text(
        Phaser.Math.Between(-gapWidth / 3, gapWidth / 3),
        0,
        '?',
        { fontSize: '14px', color: '#6B21A8' }
      ).setOrigin(0.5)
      this.sprite.add(q)

      scene.tweens.add({
        targets: q,
        y: -40 - i * 15,
        alpha: 0,
        duration: 1500 + i * 400,
        repeat: -1,
        delay: i * 500,
      })
    }
  }

  /** Check if player x is over this gap */
  isOverGap(px: number): boolean {
    return Math.abs(px - this.x) < this.gapWidth / 2
  }

  destroy() {
    this.destroyed = true
    this.sprite.destroy()
  }
}
