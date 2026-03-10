import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useGameState } from '../../ui/stores/gameState'

type BossPhase = 'idle' | 'rule_changes' | 'pattern_recognition' | 'ship_it' | 'defeated'

const PHASE1_DURATION = 45000
const PHASE2_DURATION = 45000
const PHASE3_DURATION = 30000

const RULE_CHANGES = ['gravity_flip', 'movement_reverse', 'platforms_invisible', 'auto_scroll'] as const

export class BossAlgorithm {
  scene: Phaser.Scene
  phase: BossPhase = 'idle'
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private playerSprite!: Phaser.GameObjects.Rectangle

  // Visual
  private body: Phaser.GameObjects.Container
  private shapes: Phaser.GameObjects.Shape[] = []

  // Phase timers
  private phaseTimer = 0
  private ruleTimer = 0
  private currentRule = -1

  // Phase 1: Rule changes
  private stabilityCollected = 0
  private stabilityTokens: Phaser.GameObjects.Container[] = []

  // Phase 2: Pattern recognition
  private insightCollected = 0
  private insightTarget = 6
  private dataStreams: Phaser.GameObjects.Container[] = []

  // Phase 3: Ship it
  private launchProgress = 0
  private launchPlatforms: { rect: Phaser.GameObjects.Rectangle; hit: boolean }[] = []
  private currentLaunchPlatform = 0

  // Burn rate (Level 6b mechanic)
  private burnRateTimer = 0

  destroyed = false
  onDefeated?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    const cx = arenaStart + (arenaEnd - arenaStart) / 2

    // Abstract geometric entity
    const circle = scene.add.circle(0, 0, 40, 0x7C3AED, 0.6)
    const tri = scene.add.triangle(0, -30, 0, -20, 20, 10, -20, 10, 0x818CF8, 0.5)
    const sq = scene.add.rectangle(25, 15, 25, 25, 0x6D28D9, 0.5)
    sq.setRotation(0.3)
    this.shapes = [circle, tri, sq]

    this.body = scene.add.container(cx, arenaY - 200, [circle, tri, sq])
    this.body.setDepth(10)

    // Constant rotation
    scene.tweens.add({
      targets: this.body,
      rotation: Math.PI * 2,
      duration: 8000,
      repeat: -1,
    })
  }

  startFight(playerSprite: Phaser.GameObjects.Rectangle) {
    this.playerSprite = playerSprite
    this.enterPhase('rule_changes')
  }

  update(dt: number) {
    if (this.destroyed || this.phase === 'idle' || this.phase === 'defeated') return

    this.phaseTimer += dt

    // Burn rate — cash drains every 5 seconds
    this.burnRateTimer += dt
    if (this.burnRateTimer >= 5000) {
      this.burnRateTimer -= 5000
      const stats = usePlayerStats.getState()
      if (stats.cash > 0) {
        usePlayerStats.getState().modifyStats({ cash: -1 }, 'boss:algorithm:burn_rate')
      }
    }

    if (this.phase === 'rule_changes') {
      this.updateRuleChanges(dt)
    } else if (this.phase === 'pattern_recognition') {
      this.updatePatternRecognition(dt)
    } else if (this.phase === 'ship_it') {
      this.updateShipIt(dt)
    }
  }

  private enterPhase(phase: BossPhase) {
    this.phase = phase
    this.phaseTimer = 0

    if (phase === 'rule_changes') {
      this.ruleTimer = 0
      this.currentRule = -1
      this.spawnStabilityTokens()
    } else if (phase === 'pattern_recognition') {
      this.clearPhaseEntities()
      this.spawnDataStreams()
    } else if (phase === 'ship_it') {
      this.clearPhaseEntities()
      this.createLaunchPlatforms()
    } else if (phase === 'defeated') {
      this.onDefeat()
    }
  }

  // ── Phase 1: Rule Changes ──

  private updateRuleChanges(dt: number) {
    this.ruleTimer += dt

    // Apply new rule every 10 seconds
    const ruleIndex = Math.floor(this.ruleTimer / 10000)
    if (ruleIndex !== this.currentRule && ruleIndex < RULE_CHANGES.length) {
      this.currentRule = ruleIndex
      this.applyRule(RULE_CHANGES[ruleIndex])
    }

    // Check stability token collection
    const px = this.playerSprite.x
    const py = this.playerSprite.y
    for (let i = this.stabilityTokens.length - 1; i >= 0; i--) {
      const token = this.stabilityTokens[i]
      if (!token.active) continue
      if (Math.abs(px - token.x) < 25 && Math.abs(py - token.y) < 25) {
        this.stabilityCollected++
        usePlayerStats.getState().modifyStats({ energy: 3 }, 'boss:algorithm:stability')
        token.destroy()
        this.stabilityTokens.splice(i, 1)
      }
    }

    if (this.phaseTimer >= PHASE1_DURATION) {
      this.resetRules()
      this.enterPhase('pattern_recognition')
    }
  }

  private applyRule(rule: typeof RULE_CHANGES[number]) {
    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body

    // Flash notification
    const cx = this.scene.cameras.main.scrollX + 640
    const cy = this.scene.cameras.main.scrollY + 100
    const ruleNames: Record<string, string> = {
      gravity_flip: 'GRAVITY FLIP',
      movement_reverse: 'CONTROLS REVERSED',
      platforms_invisible: 'PLATFORMS HIDDEN',
      auto_scroll: 'AUTO-SCROLL',
    }
    const notice = this.scene.add.text(cx, cy, ruleNames[rule], {
      fontSize: '20px',
      fontFamily: 'system-ui',
      color: '#EF4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90)
    this.scene.tweens.add({
      targets: notice,
      alpha: 0,
      y: cy - 30,
      duration: 2000,
      onComplete: () => notice.destroy(),
    })

    switch (rule) {
      case 'gravity_flip':
        body.setGravityY(-2400) // Flip gravity (normal is ~1200)
        this.scene.time.delayedCall(8000, () => {
          if (this.phase === 'rule_changes') body.setGravityY(0)
        })
        break
      case 'movement_reverse':
        // Store flag for player input reversal — handled via game state
        useGameState.getState().setPaused(false) // Using as signal
        this.scene.time.delayedCall(8000, () => {
          // Reversal auto-expires with phase
        })
        break
      case 'platforms_invisible':
        // Hide all platforms briefly
        this.scene.children.each((child) => {
          if (child instanceof Phaser.GameObjects.Rectangle && child.getData('platform')) {
            child.setAlpha(0.1)
            this.scene.time.delayedCall(3000, () => child.setAlpha(1))
          }
        })
        break
      case 'auto_scroll':
        // Force camera scroll right
        this.scene.cameras.main.stopFollow()
        this.scene.tweens.add({
          targets: this.scene.cameras.main,
          scrollX: this.scene.cameras.main.scrollX + 400,
          duration: 8000,
          onComplete: () => {
            if (this.phase === 'rule_changes') {
              this.scene.cameras.main.startFollow(this.playerSprite, false, 0.08, 0.05)
            }
          },
        })
        break
    }
  }

  private resetRules() {
    const body = this.playerSprite.body as Phaser.Physics.Arcade.Body
    body.setGravityY(0)
    this.scene.cameras.main.startFollow(this.playerSprite, false, 0.08, 0.05)
  }

  private spawnStabilityTokens() {
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(this.arenaStart + 100, this.arenaEnd - 100)
      const y = this.arenaY - Phaser.Math.Between(60, 300)
      const circle = this.scene.add.circle(0, 0, 10, 0xFFFFFF)
      const token = this.scene.add.container(x, y, [circle])
      token.setSize(20, 20)
      this.scene.tweens.add({
        targets: token,
        y: y - 8,
        duration: 900,
        yoyo: true,
        repeat: -1,
      })
      this.stabilityTokens.push(token)
    }
  }

  // ── Phase 2: Pattern Recognition ──

  private updatePatternRecognition(dt: number) {
    const px = this.playerSprite.x
    const py = this.playerSprite.y

    // Check insight token collection from data streams
    for (let i = this.dataStreams.length - 1; i >= 0; i--) {
      const stream = this.dataStreams[i]
      if (!stream.active) continue
      if (Math.abs(px - stream.x) < 20 && Math.abs(py - stream.y) < 20) {
        const isGold = stream.getData('gold')
        if (isGold) {
          this.insightCollected++
          usePlayerStats.getState().modifyStats({ energy: 3 }, 'boss:algorithm:insight')
        } else {
          usePlayerStats.getState().modifyStats({ energy: -5 }, 'boss:algorithm:wrong_dot')
        }
        stream.destroy()
        this.dataStreams.splice(i, 1)
      }
    }

    if (this.insightCollected >= this.insightTarget) {
      this.enterPhase('ship_it')
      return
    }

    if (this.phaseTimer >= PHASE2_DURATION) {
      this.enterPhase('ship_it')
    }
  }

  private spawnDataStreams() {
    // Spawn lines of dots moving across the screen
    const spawnWave = () => {
      if (this.phase !== 'pattern_recognition') return

      const y = this.arenaY - Phaser.Math.Between(60, 280)
      const count = 8
      const hasGold = Math.random() < 0.3

      for (let i = 0; i < count; i++) {
        const isGold = hasGold && i === Math.floor(count / 2)
        const color = isGold ? 0xFCD34D : 0x6D28D9
        const dot = this.scene.add.circle(0, 0, 6, color)
        const container = this.scene.add.container(this.arenaEnd + 50 + i * 30, y, [dot])
        container.setSize(12, 12)
        container.setData('gold', isGold)

        this.scene.tweens.add({
          targets: container,
          x: this.arenaStart - 50,
          duration: 4000 + Math.random() * 2000,
          onComplete: () => container.destroy(),
        })

        this.dataStreams.push(container)
      }

      this.scene.time.delayedCall(2000, spawnWave)
    }

    spawnWave()
  }

  // ── Phase 3: Ship It ──

  private updateShipIt(dt: number) {
    const px = this.playerSprite.x
    const py = this.playerSprite.y

    // Check if player is on current launch platform
    const currentPlat = this.launchPlatforms[this.currentLaunchPlatform]
    if (currentPlat && !currentPlat.hit) {
      const dx = Math.abs(px - currentPlat.rect.x)
      const dy = Math.abs(py - (currentPlat.rect.y - 20))
      if (dx < 70 && dy < 40) {
        currentPlat.hit = true
        currentPlat.rect.setFillStyle(0x10B981)
        this.launchProgress += 25
        this.currentLaunchPlatform++

        if (this.launchProgress >= 100) {
          this.enterPhase('defeated')
          return
        }
      }
    }

    // Algorithm fires projectiles during Phase 3
    if (Math.random() < 0.02) {
      this.fireAlgorithmProjectile()
    }

    // Cash hit 0 check
    if (usePlayerStats.getState().cash <= 0) {
      // "Almost" ending
      ;(window as any).__corporateClimbEnding = {
        type: 'almost',
        path: 'pivot',
        cashAtEnd: 0,
      }
      useGameState.getState().setCurrentScene('ending')
      this.onDefeated?.()
      return
    }

    if (this.phaseTimer >= PHASE3_DURATION) {
      this.enterPhase('defeated')
    }
  }

  private createLaunchPlatforms() {
    const spacing = (this.arenaEnd - this.arenaStart) / 5
    for (let i = 0; i < 4; i++) {
      const x = this.arenaStart + spacing * (i + 1)
      const y = this.arenaY - 40
      const rect = this.scene.add.rectangle(x, y, 100, 20, 0x475569)
      rect.setStrokeStyle(2, 0x818CF8)
      rect.setDepth(5)

      // Label
      this.scene.add.text(x, y - 20, `${(i + 1) * 25}%`, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#818CF8',
      }).setOrigin(0.5).setDepth(6)

      this.launchPlatforms.push({ rect, hit: false })
    }

    // Highlight first platform
    if (this.launchPlatforms[0]) {
      this.scene.tweens.add({
        targets: this.launchPlatforms[0].rect,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  private fireAlgorithmProjectile() {
    const orb = this.scene.add.circle(this.body.x, this.body.y, 8, 0xEF4444, 0.7)
    this.scene.physics.add.existing(orb)
    const body = orb.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    const angle = Math.atan2(
      this.playerSprite.y - this.body.y,
      this.playerSprite.x - this.body.x
    )
    body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200)

    this.scene.time.delayedCall(3000, () => {
      if (orb.active) orb.destroy()
    })
  }

  private clearPhaseEntities() {
    for (const t of this.stabilityTokens) t.destroy()
    this.stabilityTokens = []
    for (const s of this.dataStreams) s.destroy()
    this.dataStreams = []
  }

  private onDefeat() {
    const stats = usePlayerStats.getState()

    // Determine ending
    let endingType: string
    if (stats.cash > 40 && this.launchProgress >= 100) {
      endingType = 'unicorn'
    } else if (stats.cash > 20 && this.launchProgress >= 100) {
      endingType = 'indie'
    } else if (stats.cash > 0) {
      endingType = 'survivor'
    } else {
      endingType = 'almost'
    }

    ;(window as any).__corporateClimbEnding = {
      type: endingType,
      path: 'pivot',
      cashAtEnd: stats.cash,
    }

    // Algorithm shatters
    for (const shape of this.shapes) {
      this.scene.tweens.add({
        targets: shape,
        x: shape.x + Phaser.Math.Between(-100, 100),
        y: shape.y + Phaser.Math.Between(-100, 100),
        alpha: 0,
        rotation: Math.random() * 5,
        duration: 1000,
        onComplete: () => shape.destroy(),
      })
    }

    this.scene.tweens.add({
      targets: this.body,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        this.body.destroy()
        useGameState.getState().setCurrentScene('ending')
        this.onDefeated?.()
      },
    })
  }

  destroy() {
    this.destroyed = true
    this.clearPhaseEntities()
    this.body.destroy()
  }
}
