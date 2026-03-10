import Phaser from 'phaser'

export class AlarmClock {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  body: Phaser.Physics.Arcade.Body
  private speed: number
  private direction: number
  private patrolMin: number
  private patrolMax: number
  private rayLines: Phaser.GameObjects.Line[] = []
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, speed = 150, direction = 1, patrolMin = 0, patrolMax = 8000) {
    this.scene = scene
    this.speed = speed
    this.direction = direction
    this.patrolMin = patrolMin
    this.patrolMax = patrolMax

    // Red circle body with alarm rays
    const circle = scene.add.circle(0, 0, 16, 0xDC2626)
    const bell1 = scene.add.circle(-10, -14, 5, 0xEF4444)
    const bell2 = scene.add.circle(10, -14, 5, 0xEF4444)

    this.sprite = scene.add.container(x, y, [circle, bell1, bell2])
    this.sprite.setSize(32, 32)
    scene.physics.add.existing(this.sprite)

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body
    this.body.setAllowGravity(false)
    this.body.setVelocityX(this.speed * this.direction)
    this.body.setSize(32, 32)
    this.body.setOffset(-16, -16)

    // Oscillating alarm ray animation
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      repeat: -1,
    })
  }

  update() {
    if (this.destroyed) return
    // Reverse at patrol bounds
    if (this.sprite.x <= this.patrolMin) {
      this.direction = 1
      this.body.setVelocityX(this.speed)
    } else if (this.sprite.x >= this.patrolMax) {
      this.direction = -1
      this.body.setVelocityX(-this.speed)
    }
  }

  destroy() {
    this.destroyed = true
    this.sprite.destroy()
  }
}
