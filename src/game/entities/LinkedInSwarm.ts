import Phaser from 'phaser'

/**
 * LinkedIn Notification Swarm — buzzing blue circle icons that orbit
 * a point and damage the player on contact. Dodge through them.
 */
export class LinkedInSwarm {
  scene: Phaser.Scene
  x: number
  y: number
  private icons: Phaser.GameObjects.Container[] = []
  private angles: number[] = []
  private radius: number
  private count: number
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, count = 5, radius = 80) {
    this.scene = scene
    this.x = x
    this.y = y
    this.count = count
    this.radius = radius

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      this.angles.push(angle)

      const circle = scene.add.circle(0, 0, 10, 0x2563EB)
      const ring = scene.add.circle(0, 0, 12, 0x3B82F6, 0)
      ring.setStrokeStyle(2, 0x60A5FA)
      const icon = scene.add.container(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        [ring, circle]
      )
      icon.setSize(24, 24)
      scene.physics.add.existing(icon, false)
      const body = icon.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)
      body.setSize(24, 24)
      body.setOffset(-12, -12)

      // Buzzing vibration
      scene.tweens.add({
        targets: icon,
        scaleX: 1.15,
        scaleY: 0.85,
        duration: 80 + i * 10,
        yoyo: true,
        repeat: -1,
      })

      this.icons.push(icon)
    }
  }

  update(dt: number) {
    if (this.destroyed) return
    const speed = 0.002 // radians per ms
    for (let i = 0; i < this.icons.length; i++) {
      this.angles[i] += speed * dt
      this.icons[i].x = this.x + Math.cos(this.angles[i]) * this.radius
      this.icons[i].y = this.y + Math.sin(this.angles[i]) * this.radius
    }
  }

  /** Check collision against player position */
  checkCollision(px: number, py: number): boolean {
    for (const icon of this.icons) {
      if (Math.abs(px - icon.x) < 20 && Math.abs(py - icon.y) < 20) {
        return true
      }
    }
    return false
  }

  destroy() {
    this.destroyed = true
    for (const icon of this.icons) icon.destroy()
  }
}
