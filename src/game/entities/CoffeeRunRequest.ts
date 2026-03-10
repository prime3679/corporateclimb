import Phaser from 'phaser'

/**
 * Coffee Run Request — NPCs throw coffee cup projectiles toward the player.
 * Dodge to avoid energy drain.
 */
export class CoffeeRunRequest {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  private projectiles: Phaser.GameObjects.Container[] = []
  private spawnTimer = 0
  private spawnInterval = 1500
  private projectileSpeed: number
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, projectileSpeed = 200) {
    this.scene = scene
    this.projectileSpeed = projectileSpeed

    // Office worker NPC who throws cups
    const body = scene.add.rectangle(0, 0, 30, 50, 0x6B7280)
    const head = scene.add.circle(0, -30, 12, 0x9CA3AF)
    this.sprite = scene.add.container(x, y, [body, head])
    this.sprite.setDepth(0)

    // Arm wave animation
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.05,
      duration: 400,
      yoyo: true,
      repeat: -1,
    })
  }

  update(dt: number, playerX: number, playerY: number): boolean {
    if (this.destroyed) return false
    let hitPlayer = false

    this.spawnTimer += dt
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval
      this.throwCup(playerX, playerY)
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const cup = this.projectiles[i]
      if (!cup.active) {
        this.projectiles.splice(i, 1)
        continue
      }

      // Check if off-screen
      if (Math.abs(cup.x - this.sprite.x) > 600 || Math.abs(cup.y - this.sprite.y) > 400) {
        cup.destroy()
        this.projectiles.splice(i, 1)
        continue
      }

      // Hit player
      if (Math.abs(cup.x - playerX) < 25 && Math.abs(cup.y - playerY) < 35) {
        hitPlayer = true
        cup.destroy()
        this.projectiles.splice(i, 1)
      }
    }

    return hitPlayer
  }

  private throwCup(targetX: number, targetY: number) {
    const cupBody = this.scene.add.rectangle(0, 0, 12, 14, 0x92400E)
    const steam = this.scene.add.rectangle(0, -10, 6, 6, 0xD1D5DB, 0.5)
    const cup = this.scene.add.container(this.sprite.x, this.sprite.y, [cupBody, steam])
    cup.setSize(12, 14)
    this.scene.physics.add.existing(cup)
    const body = cup.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    const angle = Math.atan2(targetY - this.sprite.y, targetX - this.sprite.x)
    body.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed
    )
    body.setAngularVelocity(Phaser.Math.Between(-150, 150))

    this.projectiles.push(cup)
  }

  destroy() {
    this.destroyed = true
    for (const p of this.projectiles) p.destroy()
    this.sprite.destroy()
  }
}
