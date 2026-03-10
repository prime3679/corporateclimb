import Phaser from 'phaser'

/**
 * Slack Message Barrage — notification bubbles that float across the
 * conference room section. Contact drains energy (information overload).
 */
export class SlackBarrage {
  scene: Phaser.Scene
  x: number
  y: number
  private bubbles: Phaser.GameObjects.Container[] = []
  private spawnTimer = 0
  private spawnInterval = 800
  private bubbleCount: number
  private spawned = 0
  destroyed = false

  constructor(scene: Phaser.Scene, x: number, y: number, bubbleCount = 12) {
    this.scene = scene
    this.x = x
    this.y = y
    this.bubbleCount = bubbleCount
  }

  update(dt: number, playerX: number, playerY: number): boolean {
    if (this.destroyed) return false
    let hitPlayer = false

    // Spawn bubbles over time
    this.spawnTimer += dt
    if (this.spawnTimer >= this.spawnInterval && this.spawned < this.bubbleCount) {
      this.spawnTimer -= this.spawnInterval
      this.spawnBubble()
      this.spawned++
    }

    // Update existing bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i]
      if (!bubble.active) {
        this.bubbles.splice(i, 1)
        continue
      }

      // Drift rightward and slightly up
      bubble.x += 0.08 * dt
      bubble.y -= 0.02 * dt

      // Fade out after traveling
      if (bubble.x > this.x + 400) {
        bubble.destroy()
        this.bubbles.splice(i, 1)
        continue
      }

      // Hit player
      if (Math.abs(bubble.x - playerX) < 25 && Math.abs(bubble.y - playerY) < 30) {
        hitPlayer = true
        // Pop animation
        this.scene.tweens.add({
          targets: bubble,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0,
          duration: 150,
          onComplete: () => bubble.destroy(),
        })
        this.bubbles.splice(i, 1)
      }
    }

    return hitPlayer
  }

  private spawnBubble() {
    const messages = ['@here', 'urgent', 'sync?', 'ACK', 'ETA?', '👀', 'bump', 'ASAP', '🔥', 'FYI', 'EOD', 'TL;DR']
    const msg = Phaser.Math.RND.pick(messages)

    const bg = this.scene.add.rectangle(0, 0, 50, 24, 0x4A154B, 0.8)
    bg.setStrokeStyle(1, 0x611F69)
    const text = this.scene.add.text(0, 0, msg, {
      fontSize: '10px',
      fontFamily: 'system-ui',
      color: '#E8D5EA',
    }).setOrigin(0.5)

    const bubble = this.scene.add.container(
      this.x + Phaser.Math.Between(-30, 30),
      this.y + Phaser.Math.Between(-60, 60),
      [bg, text]
    )
    bubble.setSize(50, 24)

    // Wobble
    this.scene.tweens.add({
      targets: bubble,
      y: bubble.y + Phaser.Math.Between(-15, 15),
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.bubbles.push(bubble)
  }

  destroy() {
    this.destroyed = true
    for (const b of this.bubbles) b.destroy()
  }
}
