import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useDialogueState } from '../../ui/stores/dialogueState'
import { useGameState } from '../../ui/stores/gameState'

type BossPhase = 'idle' | 'closing' | 'defeated'

const CLOSE_DURATION = 90000 // 90 seconds total
const WALL_SPEED = 0.6 // pixels per second base

interface Wall {
  rect: Phaser.GameObjects.Rectangle
  side: 'north' | 'south' | 'east' | 'west'
  broken: boolean
  stat: 'network' | 'reputation' | 'energy' | 'cash'
  threshold: number
  originalX: number
  originalY: number
}

export class BossGoldenCage {
  scene: Phaser.Scene
  phase: BossPhase = 'idle'
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private playerSprite!: Phaser.GameObjects.Rectangle

  private walls: Wall[] = []
  private phaseTimer = 0
  private wallsBroken = 0
  private interactKey!: Phaser.Input.Keyboard.Key
  private mashCount = 0

  destroyed = false
  onDefeated?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    const cx = arenaStart + (arenaEnd - arenaStart) / 2
    const cy = arenaY - 200
    const halfW = (arenaEnd - arenaStart) / 2
    const halfH = 200

    // Create four walls
    this.walls = [
      this.createWall('north', cx, cy - halfH, halfW * 2, 30, 'network', 50),
      this.createWall('south', cx, cy + halfH, halfW * 2, 30, 'reputation', 50),
      this.createWall('east', cx + halfW, cy, 30, halfH * 2, 'energy', 50),
      this.createWall('west', cx - halfW, cy, 30, halfH * 2, 'cash', 50),
    ]

    this.interactKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    // Add stat labels to walls
    for (const wall of this.walls) {
      const label = scene.add.text(wall.rect.x, wall.rect.y, wall.stat.toUpperCase(), {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#CBD5E1',
      }).setOrigin(0.5).setDepth(15)
      if (wall.side === 'east' || wall.side === 'west') {
        label.setRotation(Math.PI / 2)
      }
    }
  }

  private createWall(
    side: Wall['side'], x: number, y: number, w: number, h: number,
    stat: Wall['stat'], threshold: number
  ): Wall {
    const color = this.getWallColor(stat)
    const rect = this.scene.add.rectangle(x, y, w, h, color)
    rect.setDepth(10)
    this.scene.physics.add.existing(rect, true)

    return { rect, side, broken: false, stat, threshold, originalX: x, originalY: y }
  }

  private getWallColor(stat: Wall['stat']): number {
    switch (stat) {
      case 'network': return 0x3B82F6
      case 'reputation': return 0xEF4444
      case 'energy': return 0x10B981
      case 'cash': return 0xFBBF24
    }
  }

  startFight(playerSprite: Phaser.GameObjects.Rectangle) {
    this.playerSprite = playerSprite
    this.phase = 'closing'
  }

  update(dt: number) {
    if (this.destroyed || this.phase !== 'closing') return

    this.phaseTimer += dt
    const progress = Math.min(1, this.phaseTimer / CLOSE_DURATION)

    // Move walls inward
    for (const wall of this.walls) {
      if (wall.broken) continue

      const stats = usePlayerStats.getState()
      const statVal = stats[wall.stat]
      const isCracked = statVal > wall.threshold

      // Walls close slower if cracked
      const speed = isCracked ? WALL_SPEED * 0.5 : WALL_SPEED

      switch (wall.side) {
        case 'north':
          wall.rect.y = wall.originalY + progress * 150 * speed
          break
        case 'south':
          wall.rect.y = wall.originalY - progress * 150 * speed
          break
        case 'east':
          wall.rect.x = wall.originalX - progress * 200 * speed
          break
        case 'west':
          wall.rect.x = wall.originalX + progress * 200 * speed
          break
      }
      ;(wall.rect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()

      // Show cracks if stat is high enough
      if (isCracked) {
        wall.rect.setAlpha(0.6)
        wall.rect.setStrokeStyle(2, 0xFCD34D)
      }

      // Check player interaction to break wall
      if (isCracked && this.isPlayerNearWall(wall)) {
        this.showBreakPrompt(wall)
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.mashCount++
          if (this.mashCount >= 5) {
            this.breakWall(wall)
            this.mashCount = 0
          }
        }
      }
    }

    // Player crushed — all walls closing and no escape
    const activeWalls = this.walls.filter((w) => !w.broken)
    if (activeWalls.length === 0 || this.phaseTimer >= CLOSE_DURATION) {
      this.endBoss()
    }
  }

  private isPlayerNearWall(wall: Wall): boolean {
    const px = this.playerSprite.x
    const py = this.playerSprite.y
    const wx = wall.rect.x
    const wy = wall.rect.y
    return Math.abs(px - wx) < 80 && Math.abs(py - wy) < 80
  }

  private showBreakPrompt(wall: Wall) {
    // Show "E" prompt if not already showing (simplified — just check interact)
    const existing = this.scene.children.getByName(`break_${wall.side}`)
    if (!existing) {
      const prompt = this.scene.add.text(wall.rect.x, wall.rect.y - 30, 'Mash E!', {
        fontSize: '12px',
        fontFamily: 'system-ui',
        color: '#FCD34D',
        backgroundColor: '#1E293B',
        padding: { left: 4, right: 4, top: 2, bottom: 2 },
      }).setOrigin(0.5).setDepth(20)
      prompt.setName(`break_${wall.side}`)
      this.scene.time.delayedCall(500, () => prompt.destroy())
    }
  }

  private breakWall(wall: Wall) {
    wall.broken = true
    this.wallsBroken++

    // Shatter effect
    for (let i = 0; i < 8; i++) {
      const shard = this.scene.add.rectangle(
        wall.rect.x + Phaser.Math.Between(-30, 30),
        wall.rect.y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(5, 15),
        Phaser.Math.Between(3, 10),
        this.getWallColor(wall.stat),
        0.8,
      )
      this.scene.tweens.add({
        targets: shard,
        x: shard.x + Phaser.Math.Between(-100, 100),
        y: shard.y + Phaser.Math.Between(-80, 80),
        alpha: 0,
        duration: 800,
        onComplete: () => shard.destroy(),
      })
    }

    wall.rect.destroy()

    // Stat reward for breaking
    const reward: Record<string, object> = {
      network: { network: 5, reputation: 3 },
      reputation: { reputation: 8 },
      energy: { energy: 8, reputation: 3 },
      cash: { cash: 10 },
    }
    usePlayerStats.getState().modifyStats(reward[wall.stat] as any, `boss:cage:break_${wall.stat}`)
  }

  private endBoss() {
    this.phase = 'defeated'

    // Determine ending based on walls broken
    const endingTag =
      this.wallsBroken >= 4 ? 'visionary' :
      this.wallsBroken >= 2 ? 'successful' :
      this.wallsBroken >= 1 ? 'trapped' : 'crushed'

    useGameState.getState().setCurrentScene('ending')
    // Store ending type for the ending screen
    ;(window as any).__corporateClimbEnding = {
      type: endingTag,
      path: 'corporate',
      wallsBroken: this.wallsBroken,
    }

    this.onDefeated?.()
  }

  destroy() {
    this.destroyed = true
    for (const wall of this.walls) {
      if (wall.rect.active) wall.rect.destroy()
    }
  }
}
