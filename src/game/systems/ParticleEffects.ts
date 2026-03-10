import Phaser from 'phaser'
import { STAT_COLORS, POWER_UP_COLORS } from './SpriteLoader'

/**
 * ParticleEffects — reusable particle burst functions for game events.
 * Clean, stylized, performant.
 */

/** Burst of colored particles when collecting a power-up */
export function powerUpCollectBurst(scene: Phaser.Scene, x: number, y: number, type: string) {
  const color = POWER_UP_COLORS[type] ?? 0xFBBF24
  const count = 12

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const speed = 60 + Math.random() * 80
    const particle = scene.add.circle(x, y, 3 + Math.random() * 3, color, 0.8)
    particle.setDepth(50)

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0.3,
      duration: 400 + Math.random() * 200,
      onComplete: () => particle.destroy(),
    })
  }
}

/** Floating stat change number (+10, -5) with stat-colored particles */
export function statChangeFloat(
  scene: Phaser.Scene, x: number, y: number,
  stat: string, amount: number
) {
  const color = STAT_COLORS[stat] ?? 0xFFFFFF
  const sign = amount > 0 ? '+' : ''
  const hexColor = '#' + color.toString(16).padStart(6, '0')

  const text = scene.add.text(x, y - 20, `${sign}${amount}`, {
    fontSize: '14px',
    fontFamily: 'system-ui',
    color: hexColor,
    fontStyle: 'bold',
    stroke: '#0F172A',
    strokeThickness: 2,
  }).setOrigin(0.5).setDepth(60)

  scene.tweens.add({
    targets: text,
    y: y - 60,
    alpha: 0,
    duration: 1200,
    ease: 'Cubic.easeOut',
    onComplete: () => text.destroy(),
  })

  // Small side particles
  for (let i = 0; i < 4; i++) {
    const p = scene.add.circle(
      x + Phaser.Math.Between(-10, 10),
      y - 15,
      2,
      color, 0.6
    )
    p.setDepth(55)
    scene.tweens.add({
      targets: p,
      y: p.y - 30 - Math.random() * 20,
      x: p.x + Phaser.Math.Between(-20, 20),
      alpha: 0,
      duration: 600 + Math.random() * 300,
      onComplete: () => p.destroy(),
    })
  }
}

/** Dodge motion blur trail */
export function dodgeTrail(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number, facingRight: boolean) {
  const count = 4
  const dir = facingRight ? -1 : 1

  for (let i = 0; i < count; i++) {
    const ghost = scene.add.rectangle(
      x + dir * (i + 1) * 15,
      y,
      width, height,
      color,
      0.3 - i * 0.06
    )
    ghost.setDepth(2)

    scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 200 + i * 50,
      onComplete: () => ghost.destroy(),
    })
  }
}

/** Boss defeat explosion */
export function bossDefeatExplosion(scene: Phaser.Scene, x: number, y: number, color: number) {
  const count = 30

  // Screen flash
  const flash = scene.add.rectangle(
    scene.cameras.main.scrollX + 640,
    scene.cameras.main.scrollY + 360,
    1280, 720, 0xFFFFFF, 0.4
  )
  flash.setScrollFactor(0)
  flash.setDepth(90)
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 400,
    onComplete: () => flash.destroy(),
  })

  // Particle burst
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 80 + Math.random() * 150
    const size = 3 + Math.random() * 8
    const particle = scene.add.circle(x, y, size, color, 0.7)
    particle.setDepth(80)

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0.2,
      duration: 800 + Math.random() * 600,
      onComplete: () => particle.destroy(),
    })
  }
}

/** Level transition dissolve/particle wipe */
export function levelTransitionWipe(scene: Phaser.Scene, onComplete: () => void) {
  const cam = scene.cameras.main
  const cx = cam.scrollX + 640
  const cy = cam.scrollY + 360
  const count = 50

  // Dark overlay fade
  const overlay = scene.add.rectangle(cx, cy, 1280, 720, 0x0F172A, 0)
  overlay.setScrollFactor(0)
  overlay.setDepth(100)

  scene.tweens.add({
    targets: overlay,
    alpha: 1,
    duration: 800,
    onComplete: () => {
      onComplete()
      scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 600,
        delay: 200,
        onComplete: () => overlay.destroy(),
      })
    },
  })

  // Particle dissolve effect
  for (let i = 0; i < count; i++) {
    const px = cx + Phaser.Math.Between(-640, 640)
    const py = cy + Phaser.Math.Between(-360, 360)
    const particle = scene.add.circle(px, py, 2 + Math.random() * 3, 0x818CF8, 0)
    particle.setScrollFactor(0)
    particle.setDepth(101)

    scene.tweens.add({
      targets: particle,
      alpha: 0.6,
      y: py - 30 - Math.random() * 50,
      duration: 400 + Math.random() * 400,
      delay: Math.random() * 500,
      yoyo: true,
      onComplete: () => particle.destroy(),
    })
  }
}

/** Boss phase transition flash */
export function bossPhaseFlash(scene: Phaser.Scene, color: number = 0x818CF8) {
  const cam = scene.cameras.main
  const flash = scene.add.rectangle(
    cam.scrollX + 640,
    cam.scrollY + 360,
    1280, 720, color, 0.15
  )
  flash.setScrollFactor(0)
  flash.setDepth(85)

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 300,
    onComplete: () => flash.destroy(),
  })
}

/** Screen shake helper */
export function screenShake(scene: Phaser.Scene, intensity: number = 0.005, duration: number = 200) {
  scene.cameras.main.shake(duration, intensity)
}
