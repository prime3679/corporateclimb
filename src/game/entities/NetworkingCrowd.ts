import Phaser from 'phaser'

/**
 * Networking Event Crowd — dense zone where NPC columns slow the player.
 * Player must navigate through or dodge past. Slows movement while inside.
 * Staying too long drains energy (awkward small talk).
 */
export class NetworkingCrowd {
  scene: Phaser.Scene
  zone: Phaser.GameObjects.Rectangle
  x: number
  y: number
  zoneWidth: number
  zoneHeight: number
  slowFactor: number
  private npcs: Phaser.GameObjects.Rectangle[] = []
  private drainTimer = 0
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, zoneWidth = 300, zoneHeight = 200, slowFactor = 0.4) {
    this.scene = scene
    this.x = x
    this.y = y
    this.zoneWidth = zoneWidth
    this.zoneHeight = zoneHeight
    this.slowFactor = slowFactor

    // Semi-transparent zone overlay
    this.zone = scene.add.rectangle(x, y, zoneWidth, zoneHeight, 0x6366F1, 0.1)
    this.zone.setDepth(-1)

    // Spawn NPC rectangles scattered within the zone
    const npcCount = Math.floor(zoneWidth / 60)
    for (let i = 0; i < npcCount; i++) {
      const nx = x - zoneWidth / 2 + 40 + i * 60 + Phaser.Math.Between(-10, 10)
      const ny = y + Phaser.Math.Between(-20, 20)
      const npcColor = Phaser.Math.RND.pick([0x4B5563, 0x6B7280, 0x374151, 0x1F2937])
      const npc = scene.add.rectangle(nx, ny, 30, 50, npcColor)
      npc.setDepth(0)

      // Subtle idle sway
      scene.tweens.add({
        targets: npc,
        x: npc.x + Phaser.Math.Between(-8, 8),
        duration: 2000 + Phaser.Math.Between(0, 800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      this.npcs.push(npc)
    }
  }

  /** Returns true if player is inside the crowd zone */
  isPlayerInside(px: number, py: number): boolean {
    return (
      px > this.x - this.zoneWidth / 2 &&
      px < this.x + this.zoneWidth / 2 &&
      py > this.y - this.zoneHeight / 2 &&
      py < this.y + this.zoneHeight / 2
    )
  }

  /** Call each frame when player is inside. Returns energy drain amount. */
  updateDrain(dt: number): number {
    this.drainTimer += dt
    if (this.drainTimer >= 2000) {
      this.drainTimer -= 2000
      return 3 // drain 3 energy every 2 seconds
    }
    return 0
  }

  resetDrain() {
    this.drainTimer = 0
  }

  destroy() {
    this.destroyed = true
    this.zone.destroy()
    for (const npc of this.npcs) npc.destroy()
  }
}
