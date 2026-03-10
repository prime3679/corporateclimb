import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'

export type PowerUpType = 'espresso' | 'networking_card' | 'pto_day' | 'side_hustle'

const POWER_UP_DEFS: Record<PowerUpType, { color: number; label: string; size: number }> = {
  espresso: { color: 0x92400E, label: '☕', size: 24 },
  networking_card: { color: 0x065F46, label: '🤝', size: 22 },
  pto_day: { color: 0xF59E0B, label: '☀', size: 26 },
  side_hustle: { color: 0x7C3AED, label: '💻', size: 22 },
}

export class PowerUp {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  type: PowerUpType
  collected = false

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    this.scene = scene
    this.type = type
    const def = POWER_UP_DEFS[type]

    const bg = scene.add.circle(0, 0, def.size / 2 + 6, def.color, 0.8)
    const label = scene.add.text(0, 0, def.label, { fontSize: `${def.size}px` }).setOrigin(0.5)

    this.sprite = scene.add.container(x, y, [bg, label])
    this.sprite.setSize(def.size + 12, def.size + 12)
    scene.physics.add.existing(this.sprite, true)

    // Floating bob animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  collect(playerScene: Phaser.Scene): string {
    if (this.collected) return ''
    this.collected = true

    const stats = usePlayerStats.getState()
    let consequence = ''

    switch (this.type) {
      case 'espresso':
        // Speed boost is handled by caller; stat effect is energy drain after
        stats.modifyStats({ energy: -8 }, 'power-up:espresso')
        consequence = '☕ Espresso! +30% speed (10s), then -8 Energy'
        break
      case 'networking_card':
        stats.modifyStats({ network: 5 }, 'power-up:networking_card')
        consequence = '+5 Network'
        break
      case 'pto_day':
        const current = stats.energy
        stats.modifyStats({ energy: 100 - current }, 'power-up:pto_day')
        consequence = '☀ PTO Day! Energy restored to max'
        break
      case 'side_hustle':
        stats.modifyStats({ cash: 15, energy: -5 }, 'power-up:side_hustle')
        consequence = '+15 Cash, -5 Energy'
        break
    }

    // Collection animation
    playerScene.tweens.add({
      targets: this.sprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      y: this.sprite.y - 40,
      duration: 400,
      ease: 'Power2',
      onComplete: () => this.sprite.destroy(),
    })

    return consequence
  }
}
