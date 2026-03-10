import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'

/**
 * Dynamic Office Mood — tints the camera based on player Energy stat.
 * Energy > 70: warm/bright (green tint, no effects)
 * Energy 40-70: neutral fluorescent
 * Energy < 40: dim/brown (wilting)
 * Energy < 20: "burnout mode" — desaturated, particle effects
 */
export class OfficeMoodSystem {
  private scene: Phaser.Scene
  private currentMood: 'bright' | 'neutral' | 'dim' | 'burnout' = 'neutral'
  private overlay: Phaser.GameObjects.Rectangle
  private particles: Phaser.GameObjects.Rectangle[] = []
  private particleTimer = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    // Full-screen tint overlay
    this.overlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0)
    this.overlay.setScrollFactor(0)
    this.overlay.setDepth(50)
  }

  update(dt: number) {
    const energy = usePlayerStats.getState().energy
    let newMood: typeof this.currentMood

    if (energy > 70) newMood = 'bright'
    else if (energy >= 40) newMood = 'neutral'
    else if (energy >= 20) newMood = 'dim'
    else newMood = 'burnout'

    if (newMood !== this.currentMood) {
      this.currentMood = newMood
      this.applyMood()
    }

    // Burnout particle effects
    if (this.currentMood === 'burnout') {
      this.particleTimer += dt
      if (this.particleTimer >= 300) {
        this.particleTimer -= 300
        this.spawnAshParticle()
      }
    }

    // Clean up dead particles
    this.particles = this.particles.filter((p) => p.active)
  }

  private applyMood() {
    switch (this.currentMood) {
      case 'bright':
        this.overlay.setFillStyle(0x10B981, 0.05) // subtle green warmth
        this.scene.cameras.main.setPostPipeline([])
        break
      case 'neutral':
        this.overlay.setFillStyle(0x000000, 0)
        break
      case 'dim':
        this.overlay.setFillStyle(0x78350F, 0.12) // brown tint
        break
      case 'burnout':
        this.overlay.setFillStyle(0x1F2937, 0.25) // heavy desaturation
        // Screen tint shift
        this.scene.cameras.main.setAlpha(0.85)
        break
    }

    // Reset alpha when leaving burnout
    if (this.currentMood !== 'burnout') {
      this.scene.cameras.main.setAlpha(1)
    }
  }

  private spawnAshParticle() {
    const cam = this.scene.cameras.main
    const x = cam.scrollX + Phaser.Math.Between(0, 1280)
    const y = cam.scrollY - 10

    const ash = this.scene.add.rectangle(x, y, 3, 3, 0x6B7280, 0.4)
    ash.setDepth(51)
    this.particles.push(ash)

    this.scene.tweens.add({
      targets: ash,
      y: y + 740,
      x: x + Phaser.Math.Between(-60, 60),
      alpha: 0,
      duration: 3000 + Phaser.Math.Between(0, 1000),
      onComplete: () => ash.destroy(),
    })
  }

  destroy() {
    this.overlay.destroy()
    for (const p of this.particles) p.destroy()
  }
}
