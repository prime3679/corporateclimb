import Phaser from 'phaser'

export class MidtermStack {
  scene: Phaser.Scene
  private spawnX: number
  private spawnWidth: number
  private spawnInterval: number
  private spawnTimer = 0
  private papers: Phaser.GameObjects.Rectangle[] = []
  active = true

  onHitPlayer?: () => void

  constructor(scene: Phaser.Scene, x: number, spawnWidth = 400, spawnInterval = 800) {
    this.scene = scene
    this.spawnX = x
    this.spawnWidth = spawnWidth
    this.spawnInterval = spawnInterval
  }

  update(dt: number, playerSprite: Phaser.GameObjects.Rectangle) {
    if (!this.active) return

    this.spawnTimer += dt
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval
      this.spawnPaper()
    }

    // Check collisions and clean up
    for (let i = this.papers.length - 1; i >= 0; i--) {
      const paper = this.papers[i]
      if (!paper.active) {
        this.papers.splice(i, 1)
        continue
      }

      // Remove if off screen
      if (paper.y > 750) {
        paper.destroy()
        this.papers.splice(i, 1)
        continue
      }

      // Simple overlap check with player
      const pb = paper.body as Phaser.Physics.Arcade.Body
      const plBody = playerSprite.body as Phaser.Physics.Arcade.Body
      if (pb && plBody) {
        const overlap =
          Math.abs(paper.x - playerSprite.x) < 30 &&
          Math.abs(paper.y - playerSprite.y) < 50
        if (overlap) {
          this.onHitPlayer?.()
          paper.destroy()
          this.papers.splice(i, 1)
        }
      }
    }
  }

  private spawnPaper() {
    const x = this.spawnX + Phaser.Math.Between(-this.spawnWidth / 2, this.spawnWidth / 2)
    const paper = this.scene.add.rectangle(x, -20, 24, 30, 0xF3F4F6)
    this.scene.physics.add.existing(paper)
    const body = paper.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocityY(Phaser.Math.Between(120, 220))
    body.setVelocityX(Phaser.Math.Between(-30, 30))
    body.setAngularVelocity(Phaser.Math.Between(-100, 100))
    this.papers.push(paper)
  }

  destroy() {
    this.active = false
    for (const p of this.papers) p.destroy()
    this.papers = []
  }
}
