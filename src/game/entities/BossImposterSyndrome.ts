import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useDialogueState, DialogueNode } from '../../ui/stores/dialogueState'
import { useCharacterStore } from '../../ui/stores/characterStore'
import { useGameState } from '../../ui/stores/gameState'

type BossPhase = 'idle' | 'mirror' | 'whisper' | 'face_yourself' | 'defeated'

const MIRROR_DURATION = 45000
const WHISPER_DURATION = 60000
const TOKEN_WAVES = [3, 3, 4]
const DOUBT_SPEED = 180

export class BossImposterSyndrome {
  scene: Phaser.Scene
  shadow: Phaser.GameObjects.Rectangle
  phase: BossPhase = 'idle'
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private playerSprite!: Phaser.GameObjects.Rectangle

  // Phase 1 state
  private phaseTimer = 0
  private shadowTokensCollected = 0
  private playerTokensCollected = 0
  private tokens: Phaser.GameObjects.Container[] = []
  private currentWave = 0
  private inputHistory: { x: number; y: number; t: number }[] = []

  // Phase 2 state
  private doubtProjectiles: Phaser.GameObjects.Container[] = []
  private confidenceTokens: Phaser.GameObjects.Container[] = []
  private confidenceCollected = 0
  private whisperActive = false

  // Glitch effect
  private glitchTimer = 0

  destroyed = false
  onPhaseChange?: (phase: BossPhase) => void
  onDefeated?: () => void
  onWhisperStart?: () => void
  onWhisperEnd?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    // Shadow — same size/color as player but slightly darker
    const accentHex = useCharacterStore.getState().accentColor
    const baseColor = parseInt(accentHex.replace('#', ''), 16)
    // Darken the color
    const r = Math.max(0, ((baseColor >> 16) & 0xFF) - 40)
    const g = Math.max(0, ((baseColor >> 8) & 0xFF) - 40)
    const b = Math.max(0, (baseColor & 0xFF) - 40)
    const shadowColor = (r << 16) | (g << 8) | b

    const cx = arenaStart + (arenaEnd - arenaStart) / 2
    this.shadow = scene.add.rectangle(cx, arenaY - 80, 60, 80, shadowColor)
    this.shadow.setAlpha(0.7)
    scene.physics.add.existing(this.shadow)
    const body = this.shadow.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(true)
    body.setCollideWorldBounds(false)
    body.setMaxVelocityY(800)
    body.setGravityY(1200)

    // Glitch distortion effect
    scene.tweens.add({
      targets: this.shadow,
      scaleX: 1.05,
      duration: 50,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2000 + Math.random() * 3000,
    })
  }

  startFight(playerSprite: Phaser.GameObjects.Rectangle) {
    this.playerSprite = playerSprite
    this.enterPhase('mirror')
  }

  update(dt: number) {
    if (this.destroyed || this.phase === 'idle' || this.phase === 'defeated') return

    this.phaseTimer += dt
    this.glitchTimer += dt

    // Periodic glitch effect
    if (this.glitchTimer > 3000 + Math.random() * 2000) {
      this.glitchTimer = 0
      this.doGlitch()
    }

    if (this.phase === 'mirror') {
      this.updateMirror(dt)
    } else if (this.phase === 'whisper') {
      this.updateWhisper(dt)
    }
  }

  private enterPhase(phase: BossPhase) {
    this.phase = phase
    this.phaseTimer = 0
    this.onPhaseChange?.(phase)

    if (phase === 'mirror') {
      this.spawnTokenWave()
    } else if (phase === 'whisper') {
      this.whisperActive = true
      this.onWhisperStart?.()
      // Shadow moves to center and hovers
      const cx = this.arenaStart + (this.arenaEnd - this.arenaStart) / 2
      this.scene.tweens.add({
        targets: this.shadow,
        x: cx,
        y: this.arenaY - 150,
        duration: 1000,
      })
      const body = this.shadow.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)
      body.setVelocity(0, 0)
      this.spawnConfidenceTokens()
      this.startDoubtProjectiles()
    } else if (phase === 'face_yourself') {
      this.whisperActive = false
      this.onWhisperEnd?.()
      this.clearProjectiles()
      this.openFaceYourself()
    } else if (phase === 'defeated') {
      this.onDefeat()
    }
  }

  // ── Phase 1: The Mirror ──

  private updateMirror(dt: number) {
    // Record player input for delayed playback
    this.inputHistory.push({
      x: this.playerSprite.x,
      y: this.playerSprite.y,
      t: this.phaseTimer,
    })

    // Shadow follows with 300ms delay at 105% speed
    const delayMs = 300
    const targetTime = this.phaseTimer - delayMs
    const pastEntry = this.inputHistory.find((e) => e.t >= targetTime) ?? this.inputHistory[0]

    if (pastEntry) {
      const dx = pastEntry.x - this.shadow.x
      const speedMultiplier = 1.05
      const body = this.shadow.body as Phaser.Physics.Arcade.Body
      body.setVelocityX(dx * 5 * speedMultiplier)
    }

    // Check token collection
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const token = this.tokens[i]
      if (!token.active) { this.tokens.splice(i, 1); continue }

      // Player collects
      if (Math.abs(this.playerSprite.x - token.x) < 30 && Math.abs(this.playerSprite.y - token.y) < 30) {
        this.playerTokensCollected++
        usePlayerStats.getState().modifyStats({ energy: 3 }, 'boss:imposter:confidence')
        token.destroy()
        this.tokens.splice(i, 1)
        continue
      }

      // Shadow collects
      if (Math.abs(this.shadow.x - token.x) < 30 && Math.abs(this.shadow.y - token.y) < 30) {
        this.shadowTokensCollected++
        usePlayerStats.getState().modifyStats({ energy: -3 }, 'boss:imposter:shadow_grab')
        token.destroy()
        this.tokens.splice(i, 1)
      }
    }

    // Spawn next wave when current is cleared
    if (this.tokens.length === 0 && this.currentWave < TOKEN_WAVES.length) {
      this.spawnTokenWave()
    }

    // Phase ends after duration or all waves done
    if (this.phaseTimer >= MIRROR_DURATION || (this.currentWave >= TOKEN_WAVES.length && this.tokens.length === 0)) {
      this.enterPhase('whisper')
    }
  }

  private spawnTokenWave() {
    if (this.currentWave >= TOKEN_WAVES.length) return
    const count = TOKEN_WAVES[this.currentWave]
    this.currentWave++

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(this.arenaStart + 100, this.arenaEnd - 100)
      const y = this.arenaY - Phaser.Math.Between(80, 250)

      const circle = this.scene.add.circle(0, 0, 14, 0xFCD34D)
      const glow = this.scene.add.circle(0, 0, 18, 0xFCD34D, 0.3)
      const token = this.scene.add.container(x, y, [glow, circle])
      token.setSize(28, 28)

      // Floating bob
      this.scene.tweens.add({
        targets: token,
        y: y - 10,
        duration: 800,
        yoyo: true,
        repeat: -1,
      })

      this.tokens.push(token)
    }
  }

  // ── Phase 2: The Whisper ──

  private updateWhisper(dt: number) {
    // Update doubt projectiles
    for (let i = this.doubtProjectiles.length - 1; i >= 0; i--) {
      const dp = this.doubtProjectiles[i]
      if (!dp.active) { this.doubtProjectiles.splice(i, 1); continue }

      // Hit player
      if (Math.abs(dp.x - this.playerSprite.x) < 25 && Math.abs(dp.y - this.playerSprite.y) < 35) {
        usePlayerStats.getState().modifyStats({ energy: -4 }, 'boss:imposter:doubt')
        dp.destroy()
        this.doubtProjectiles.splice(i, 1)
      }
    }

    // Check confidence token collection
    for (let i = this.confidenceTokens.length - 1; i >= 0; i--) {
      const ct = this.confidenceTokens[i]
      if (!ct.active) { this.confidenceTokens.splice(i, 1); continue }

      if (Math.abs(ct.x - this.playerSprite.x) < 30 && Math.abs(ct.y - this.playerSprite.y) < 30) {
        this.confidenceCollected++
        usePlayerStats.getState().modifyStats({ energy: 3 }, 'boss:imposter:confidence')
        ct.destroy()
        this.confidenceTokens.splice(i, 1)

        if (this.confidenceCollected >= 8) {
          this.enterPhase('face_yourself')
          return
        }
      }
    }

    // Phase timeout
    if (this.phaseTimer >= WHISPER_DURATION) {
      this.enterPhase('face_yourself')
    }
  }

  private startDoubtProjectiles() {
    // Fire doubt orbs periodically from the shadow
    const fireDoubt = () => {
      if (this.phase !== 'whisper' || this.destroyed) return

      const orb = this.scene.add.circle(0, 0, 10, 0x581C87)
      const aura = this.scene.add.circle(0, 0, 14, 0x7C3AED, 0.3)
      const projectile = this.scene.add.container(this.shadow.x, this.shadow.y, [aura, orb])
      projectile.setSize(20, 20)
      this.scene.physics.add.existing(projectile)
      const body = projectile.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)

      // Aim at player with spread
      const angle = Math.atan2(
        this.playerSprite.y - this.shadow.y,
        this.playerSprite.x - this.shadow.x
      ) + (Math.random() - 0.5) * 0.5
      body.setVelocity(Math.cos(angle) * DOUBT_SPEED, Math.sin(angle) * DOUBT_SPEED)

      this.doubtProjectiles.push(projectile)

      // Auto-destroy after 4 seconds
      this.scene.time.delayedCall(4000, () => {
        if (projectile.active) projectile.destroy()
      })

      // More doubt if shadow collected more tokens in phase 1
      const interval = this.shadowTokensCollected > 6 ? 600 : 900
      this.scene.time.delayedCall(interval, fireDoubt)
    }

    this.scene.time.delayedCall(1000, fireDoubt)
  }

  private spawnConfidenceTokens() {
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(this.arenaStart + 80, this.arenaEnd - 80)
      const y = this.arenaY - Phaser.Math.Between(60, 280)

      const circle = this.scene.add.circle(0, 0, 12, 0xFCD34D)
      const token = this.scene.add.container(x, y, [circle])
      token.setSize(24, 24)

      this.scene.tweens.add({
        targets: token,
        y: y - 8,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      })

      this.confidenceTokens.push(token)
    }
  }

  // ── Phase 3: Face Yourself ──

  private getFaceYourselfDialogue(): DialogueNode[] {
    const stats = usePlayerStats.getState()
    const nodes: DialogueNode[] = []

    // Dynamic first question based on highest stat
    let firstQuestion: string
    if (stats.reputation >= 60) {
      firstQuestion = "They respect you. But do you respect yourself?"
    } else if (stats.network >= 60) {
      firstQuestion = "All those connections. Do any of them really know you?"
    } else if (stats.cash >= 60) {
      firstQuestion = "You're making money. Is that why you started?"
    } else if (stats.energy < 30) {
      firstQuestion = "You're running on empty. Is this sustainable?"
    } else {
      firstQuestion = "You're... fine. Just fine. Is that enough?"
    }

    nodes.push({
      id: 'start',
      speaker: 'The Shadow',
      text: firstQuestion,
      options: [
        {
          text: "I don't have to justify myself to you.",
          statChanges: { reputation: 5 },
          consequence: '+5 Reputation',
          nextNodeId: 'final',
          tags: ['defiant'],
        },
        {
          text: "...Maybe not. But I'm still here.",
          statChanges: { energy: 5 },
          consequence: '+5 Energy',
          nextNodeId: 'final',
          tags: ['honest'],
        },
      ],
    })

    nodes.push({
      id: 'final',
      speaker: 'The Shadow',
      text: "Everyone here is smarter than you.",
      options: [
        {
          text: '"Maybe, but I outwork them all."',
          statChanges: { energy: 10, reputation: 5 },
          consequence: '+10 Energy, +5 Reputation — Shadow shrinks',
          nextNodeId: 'end',
          tags: ['hustler', 'imposter_hustler'],
        },
        {
          text: '"I\'m here because I earned it."',
          statChanges: { reputation: 15 },
          consequence: '+15 Reputation — Shadow destabilizes',
          nextNodeId: 'end',
          tags: ['diplomat', 'imposter_diplomat'],
        },
        {
          text: '"You know what? Sometimes that\'s true. And that\'s fine."',
          statChanges: { energy: 15, reputation: 5, network: 5 },
          consequence: '+15 Energy, +5 Rep, +5 Network — Shadow dissolves into particles',
          nextNodeId: 'end',
          tags: ['rebel', 'imposter_honesty'],
        },
      ],
    })

    nodes.push({
      id: 'end',
      speaker: '',
      text: "Everyone feels it. The difference is what you do next.",
    })

    return nodes
  }

  private openFaceYourself() {
    const dialogue = this.getFaceYourselfDialogue()
    useDialogueState.getState().openDialogue('boss_imposter', 'start', dialogue)

    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === 'face_yourself') {
        unsub()
        this.enterPhase('defeated')
      }
    })
  }

  // ── Visual Effects ──

  private doGlitch() {
    // Brief horizontal jitter
    const originalX = this.shadow.x
    this.scene.tweens.add({
      targets: this.shadow,
      x: originalX + Phaser.Math.Between(-8, 8),
      duration: 30,
      yoyo: true,
      repeat: 3,
    })

    // Brief screen tint flash
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.scrollX + 640,
      this.scene.cameras.main.scrollY + 360,
      1280, 720, 0x7C3AED, 0.08
    )
    flash.setScrollFactor(0)
    flash.setDepth(90)
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    })
  }

  private onDefeat() {
    // Shadow dissolves into particles
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.circle(
        this.shadow.x + Phaser.Math.Between(-30, 30),
        this.shadow.y + Phaser.Math.Between(-40, 40),
        Phaser.Math.Between(3, 8),
        0x7C3AED,
        0.6
      )
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        onComplete: () => particle.destroy(),
      })
    }

    this.scene.tweens.add({
      targets: this.shadow,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 800,
      onComplete: () => {
        this.shadow.destroy()
        this.onDefeated?.()
      },
    })
  }

  private clearProjectiles() {
    for (const dp of this.doubtProjectiles) dp.destroy()
    this.doubtProjectiles = []
    for (const ct of this.confidenceTokens) ct.destroy()
    this.confidenceTokens = []
    for (const t of this.tokens) t.destroy()
    this.tokens = []
  }

  destroy() {
    this.destroyed = true
    this.clearProjectiles()
    this.shadow.destroy()
  }
}
