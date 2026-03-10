import Phaser from 'phaser'

const FOLLOW_SPEED = 60
const ATTACH_DISTANCE = 50
const DRAIN_RATE = 1 // energy per second
const SHAKE_JUMPS_NEEDED = 3
const SHAKE_WINDOW = 2000 // ms

export class Freeloader {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Rectangle
  body: Phaser.Physics.Arcade.Body
  private attached = false
  private attachTimer = 0
  private jumpTimestamps: number[] = []
  destroyed = false

  // Callbacks
  onDrain?: (amount: number) => void
  onShakeOff?: () => void

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene

    this.sprite = scene.add.rectangle(x, y, 50, 70, 0x6B7280)
    scene.physics.add.existing(this.sprite)

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body
    this.body.setGravityY(1200)
    this.body.setMaxVelocityY(800)
    this.body.setSize(50, 70)
  }

  update(dt: number, playerX: number, playerY: number, playerIsJumping: boolean) {
    if (this.destroyed) return

    const dx = playerX - this.sprite.x
    const dy = playerY - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (this.attached) {
      // Follow player closely
      this.sprite.setPosition(
        Phaser.Math.Linear(this.sprite.x, playerX - 30, 0.15),
        Phaser.Math.Linear(this.sprite.y, playerY, 0.1)
      )

      // Drain energy
      this.attachTimer += dt
      if (this.attachTimer >= 1000) {
        this.attachTimer -= 1000
        this.onDrain?.(DRAIN_RATE)
      }

      // Track jumps to shake off
      if (playerIsJumping) {
        const now = Date.now()
        this.jumpTimestamps.push(now)
        this.jumpTimestamps = this.jumpTimestamps.filter((t) => now - t < SHAKE_WINDOW)

        if (this.jumpTimestamps.length >= SHAKE_JUMPS_NEEDED) {
          this.shakeOff()
        }
      }

      // Visual: wobble when attached
      this.sprite.setAlpha(0.8)
    } else if (dist < 300) {
      // Follow player slowly when in range
      const angle = Math.atan2(dy, dx)
      this.body.setVelocityX(Math.cos(angle) * FOLLOW_SPEED)

      if (dist < ATTACH_DISTANCE) {
        this.attached = true
        this.body.setVelocity(0, 0)
        this.body.setAllowGravity(false)
      }
    } else {
      this.body.setVelocityX(0)
    }
  }

  private shakeOff() {
    this.attached = false
    this.body.setAllowGravity(true)
    this.body.setVelocity(Phaser.Math.Between(-200, 200), -300)
    this.sprite.setAlpha(1)
    this.jumpTimestamps = []
    this.onShakeOff?.()

    // Flee after being shaken off
    this.scene.time.delayedCall(1500, () => {
      if (!this.destroyed) {
        this.destroy()
      }
    })
  }

  destroy() {
    this.destroyed = true
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => this.sprite.destroy(),
    })
  }
}
