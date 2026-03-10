import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useDialogueState, DialogueNode } from '../../ui/stores/dialogueState'

type BossPhase = 'idle' | 'multiple_choice' | 'essay_defense' | 'grade_appeal' | 'defeated'

const SCANTRON_SPEED = 250
const SCANTRON_INTERVAL = 600
const PHASE1_DURATION = 12000 // 12 seconds of dodging
const PHASE1_HIT_DAMAGE = 8

export class BossNoCurve {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  body: Phaser.Physics.Arcade.Body
  phase: BossPhase = 'idle'
  private hp = 3 // hits needed to win each dialogue phase
  private phaseTimer = 0
  private scantronTimer = 0
  private scantrons: Phaser.GameObjects.Rectangle[] = []
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private playerSprite!: Phaser.GameObjects.Rectangle
  destroyed = false

  // Callbacks
  onPhaseChange?: (phase: BossPhase) => void
  onHitPlayer?: () => void
  onDefeated?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    const bossX = arenaStart + (arenaEnd - arenaStart) / 2
    const bossY = arenaY - 80

    // Professor body
    const body = scene.add.rectangle(0, 0, 60, 80, 0x1E3A5F)
    // Mortarboard hat
    const hatBrim = scene.add.rectangle(0, -48, 50, 8, 0x111827)
    const hatTop = scene.add.rectangle(0, -56, 30, 16, 0x111827)
    // Angry eyes
    const eyeL = scene.add.rectangle(-12, -10, 8, 6, 0xEF4444)
    const eyeR = scene.add.rectangle(12, -10, 8, 6, 0xEF4444)
    // Pointer/wand
    const wand = scene.add.rectangle(38, 10, 40, 4, 0x92400E)

    this.sprite = scene.add.container(bossX, bossY, [body, hatBrim, hatTop, eyeL, eyeR, wand])
    this.sprite.setSize(60, 80)
    scene.physics.add.existing(this.sprite, true)
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body

    // Idle bob
    scene.tweens.add({
      targets: this.sprite,
      y: bossY - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  startFight(playerSprite: Phaser.GameObjects.Rectangle) {
    this.playerSprite = playerSprite
    this.enterPhase('multiple_choice')
  }

  update(dt: number) {
    if (this.destroyed || this.phase === 'idle' || this.phase === 'defeated') return

    if (this.phase === 'multiple_choice') {
      this.updateMultipleChoice(dt)
    }
  }

  private enterPhase(phase: BossPhase) {
    this.phase = phase
    this.phaseTimer = 0
    this.scantronTimer = 0
    this.onPhaseChange?.(phase)

    if (phase === 'multiple_choice') {
      // Shake the boss angrily
      this.scene.tweens.add({
        targets: this.sprite,
        x: this.sprite.x - 5,
        duration: 50,
        yoyo: true,
        repeat: 5,
      })
    } else if (phase === 'essay_defense') {
      this.clearScantrons()
      this.openEssayDialogue()
    } else if (phase === 'grade_appeal') {
      this.openGradeAppealDialogue()
    } else if (phase === 'defeated') {
      this.onDefeat()
    }
  }

  private updateMultipleChoice(dt: number) {
    this.phaseTimer += dt
    this.scantronTimer += dt

    // Spawn scantrons
    if (this.scantronTimer >= SCANTRON_INTERVAL) {
      this.scantronTimer -= SCANTRON_INTERVAL
      this.spawnScantron()
    }

    // Check scantron collisions
    for (let i = this.scantrons.length - 1; i >= 0; i--) {
      const s = this.scantrons[i]
      if (!s.active) {
        this.scantrons.splice(i, 1)
        continue
      }

      // Off screen
      if (s.y > this.arenaY + 100 || s.x < this.arenaStart - 100 || s.x > this.arenaEnd + 100) {
        s.destroy()
        this.scantrons.splice(i, 1)
        continue
      }

      // Hit player
      if (this.playerSprite && Math.abs(s.x - this.playerSprite.x) < 30 && Math.abs(s.y - this.playerSprite.y) < 40) {
        usePlayerStats.getState().modifyStats({ energy: -PHASE1_HIT_DAMAGE }, 'boss:no-curve:scantron')
        this.onHitPlayer?.()
        s.destroy()
        this.scantrons.splice(i, 1)
      }
    }

    // Phase 1 ends after duration
    if (this.phaseTimer >= PHASE1_DURATION) {
      this.enterPhase('essay_defense')
    }
  }

  private spawnScantron() {
    const targetX = this.playerSprite?.x ?? (this.arenaStart + this.arenaEnd) / 2
    const bossX = this.sprite.x
    const bossY = this.sprite.y

    // Scantron paper (small white rectangle with answer bubbles)
    const paper = this.scene.add.rectangle(bossX, bossY, 18, 24, 0xF9FAFB)
    this.scene.physics.add.existing(paper)
    const paperBody = paper.body as Phaser.Physics.Arcade.Body
    paperBody.setAllowGravity(false)

    // Aim at player with some spread
    const angle = Math.atan2(this.playerSprite.y - bossY, targetX - bossX)
    const spread = (Math.random() - 0.5) * 0.4
    paperBody.setVelocity(
      Math.cos(angle + spread) * SCANTRON_SPEED,
      Math.sin(angle + spread) * SCANTRON_SPEED
    )
    paperBody.setAngularVelocity(Phaser.Math.Between(-200, 200))

    this.scantrons.push(paper)
  }

  private clearScantrons() {
    for (const s of this.scantrons) s.destroy()
    this.scantrons = []
  }

  // Phase 2: Essay Defense — dialogue battle
  private essayDialogue: DialogueNode[] = [
    {
      id: 'start',
      speaker: 'Professor No-Curve',
      text: "SILENCE! You think you can pass MY class? Defend your thesis: 'Why does effort matter more than talent?'",
      options: [
        {
          text: 'Effort compounds. Talent plateaus without discipline.',
          statChanges: { reputation: 5 },
          consequence: '+5 Reputation — Solid argument!',
          nextNodeId: 'rebuttal',
          tags: ['academic', 'eloquent'],
        },
        {
          text: "Honestly? Networking matters more than both.",
          statChanges: { network: 3, reputation: -3 },
          consequence: '+3 Network, -3 Reputation — Bold but off-topic',
          nextNodeId: 'rebuttal',
          tags: ['pragmatist', 'rebel'],
        },
        {
          text: "I don't care about your thesis. Just grade me.",
          statChanges: { reputation: -5, energy: -5 },
          consequence: '-5 Reputation, -5 Energy — He is furious',
          nextNodeId: 'angry_rebuttal',
          tags: ['rebel', 'defiant'],
        },
      ],
    },
    {
      id: 'rebuttal',
      speaker: 'Professor No-Curve',
      text: "Hmm. Adequate, but not compelling. Counter-point: if the system rewards connections over merit, why study at all?",
      options: [
        {
          text: 'Because knowledge is the one thing no one can take from you.',
          statChanges: { reputation: 5 },
          consequence: '+5 Reputation — He nods reluctantly',
          nextNodeId: 'phase3_transition',
          tags: ['idealist', 'academic'],
        },
        {
          text: "You study so you CAN build the connections. They're not separate.",
          statChanges: { network: 5 },
          consequence: '+5 Network — Clever synthesis',
          nextNodeId: 'phase3_transition',
          tags: ['diplomat', 'strategist'],
        },
      ],
    },
    {
      id: 'angry_rebuttal',
      speaker: 'Professor No-Curve',
      text: "The AUDACITY. Fine. Let's skip to the final exam. You'll need more than attitude to survive this.",
      options: [
        {
          text: 'Bring it on.',
          nextNodeId: 'phase3_transition',
          tags: ['defiant'],
        },
      ],
    },
    {
      id: 'phase3_transition',
      speaker: 'Professor No-Curve',
      text: "...Fine. You've earned the right to appeal your grade. But it won't be easy.",
    },
  ]

  private openEssayDialogue() {
    useDialogueState.getState().openDialogue('boss_essay', 'start', this.essayDialogue)

    // Watch for dialogue close → transition to phase 3
    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === 'essay_defense') {
        unsub()
        this.scene.time.delayedCall(500, () => this.enterPhase('grade_appeal'))
      }
    })
  }

  // Phase 3: Grade Appeal — stat-gated dialogue
  private getGradeAppealDialogue(): DialogueNode[] {
    const stats = usePlayerStats.getState()
    return [
      {
        id: 'start',
        speaker: 'Professor No-Curve',
        text: "Grade Appeal hearing. Present your case for why you deserve to pass. Choose wisely — I'll check your record.",
        options: [
          {
            text: 'My reputation speaks for itself. (Rep ≥ 55)',
            statCheck: { stat: 'reputation', comparison: 'gte', threshold: 55 },
            statChanges: { reputation: 10 },
            consequence: '✓ Reputation Check Passed! +10 Reputation',
            nextNodeId: 'pass',
            tags: ['academic_appeal'],
          },
          {
            text: 'I have the connections to back it up. (Network ≥ 55)',
            statCheck: { stat: 'network', comparison: 'gte', threshold: 55 },
            statChanges: { network: 10 },
            consequence: '✓ Network Check Passed! +10 Network',
            nextNodeId: 'pass',
            tags: ['social_appeal'],
          },
          {
            text: 'I can pay for a tutor session. (Cash ≥ 40)',
            statCheck: { stat: 'cash', comparison: 'gte', threshold: 40 },
            statChanges: { cash: -20 },
            consequence: '✓ Cash Check Passed! -20 Cash (tutor fee)',
            nextNodeId: 'pass',
            tags: ['cash_appeal'],
          },
          {
            text: 'I have nothing. But I showed up. That counts.',
            statChanges: { energy: -10 },
            consequence: '-10 Energy — Barely scraping by',
            nextNodeId: 'scrape_pass',
            tags: ['desperate', 'resilient'],
          },
        ],
      },
      {
        id: 'pass',
        speaker: 'Professor No-Curve',
        text: "...I'll admit, you've shown more than most freshmen. Fine. You pass. But don't think sophomore year will be any easier.",
      },
      {
        id: 'scrape_pass',
        speaker: 'Professor No-Curve',
        text: "Showing up isn't enough in the real world. But... it IS the prerequisite. D+. You pass. Barely.",
      },
    ]
  }

  private openGradeAppealDialogue() {
    const dialogue = this.getGradeAppealDialogue()
    useDialogueState.getState().openDialogue('boss_grade_appeal', 'start', dialogue)

    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === 'grade_appeal') {
        unsub()
        this.enterPhase('defeated')
      }
    })
  }

  private onDefeat() {
    // Victory animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      y: this.sprite.y - 60,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.destroy()
        this.onDefeated?.()
      },
    })
  }

  destroy() {
    this.destroyed = true
    this.clearScantrons()
    this.sprite.destroy()
  }
}
