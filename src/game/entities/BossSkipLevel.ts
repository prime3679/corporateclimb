import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useDialogueState, DialogueNode } from '../../ui/stores/dialogueState'
import { useGameState } from '../../ui/stores/gameState'

type BossPhase = 'idle' | 'become_visible' | 'one_on_one' | 'defeated'

const STATIONS = [
  { label: 'Ship the Feature', type: 'mash' as const },
  { label: 'Nail the Presentation', type: 'dialogue' as const },
  { label: 'Get Referenced', type: 'collect' as const },
]

export class BossSkipLevel {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  phase: BossPhase = 'idle'
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private playerSprite!: Phaser.GameObjects.Rectangle

  // Phase 1 state
  private stationsCompleted = 0
  private stationPlatforms: Phaser.GameObjects.Container[] = []
  private activeStation = -1
  private mashCount = 0
  private mashTarget = 15
  private collectCount = 0
  private collectTarget = 3
  private mashKey!: Phaser.Input.Keyboard.Key

  destroyed = false
  onDefeated?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    const bossX = arenaStart + (arenaEnd - arenaStart) / 2
    const bossY = arenaY - 200

    // Large dark navy figure — very faint (not visible yet)
    const body = scene.add.rectangle(0, 0, 100, 140, 0x0F172A)
    const head = scene.add.circle(0, -85, 30, 0x1E293B)
    const eyes = scene.add.rectangle(0, -85, 40, 8, 0x475569)
    const nameTag = scene.add.text(0, 40, '???', {
      fontSize: '12px',
      fontFamily: 'system-ui',
      color: '#64748B',
    }).setOrigin(0.5)

    this.sprite = scene.add.container(bossX, bossY, [body, head, eyes, nameTag])
    this.sprite.setSize(100, 140)
    this.sprite.setAlpha(0.15) // Nearly invisible
    scene.physics.add.existing(this.sprite, true)

    this.mashKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    this.createStationPlatforms()
  }

  private createStationPlatforms() {
    const spacing = (this.arenaEnd - this.arenaStart) / 4

    for (let i = 0; i < 3; i++) {
      const sx = this.arenaStart + spacing * (i + 1)
      const sy = this.arenaY - 40

      // Glowing platform
      const platform = this.scene.add.rectangle(0, 0, 120, 20, 0x4F46E5, 0.6)
      platform.setStrokeStyle(2, 0x818CF8)
      const label = this.scene.add.text(0, -20, STATIONS[i].label, {
        fontSize: '11px',
        fontFamily: 'system-ui',
        color: '#C7D2FE',
      }).setOrigin(0.5)

      const container = this.scene.add.container(sx, sy, [platform, label])
      container.setSize(120, 20)

      // Pulse glow
      this.scene.tweens.add({
        targets: platform,
        alpha: 0.9,
        duration: 800,
        yoyo: true,
        repeat: -1,
      })

      this.stationPlatforms.push(container)
    }
  }

  startFight(playerSprite: Phaser.GameObjects.Rectangle) {
    this.playerSprite = playerSprite
    this.enterPhase('become_visible')
  }

  update(dt: number) {
    if (this.destroyed || this.phase === 'idle' || this.phase === 'defeated') return

    if (this.phase === 'become_visible') {
      this.updateStations(dt)
    }
  }

  private enterPhase(phase: BossPhase) {
    this.phase = phase

    if (phase === 'one_on_one') {
      // Boss descends to player level
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.arenaY - 100,
        alpha: 1,
        duration: 1000,
        ease: 'Power2',
      })
      // Remove station platforms
      for (const sp of this.stationPlatforms) sp.destroy()
      this.stationPlatforms = []

      this.scene.time.delayedCall(1500, () => this.openOneOnOne())
    } else if (phase === 'defeated') {
      this.onDefeat()
    }
  }

  private updateStations(dt: number) {
    const px = this.playerSprite.x
    const py = this.playerSprite.y

    // Check if player is standing on a station
    for (let i = 0; i < this.stationPlatforms.length; i++) {
      const sp = this.stationPlatforms[i]
      if (!sp.active) continue

      const dx = Math.abs(px - sp.x)
      const dy = Math.abs(py - (sp.y - 20))

      if (dx < 70 && dy < 40 && this.activeStation !== i) {
        this.activeStation = i
        this.triggerStation(i)
      }
    }
  }

  private triggerStation(index: number) {
    const station = STATIONS[index]

    if (station.type === 'mash') {
      this.mashCount = 0
      // Show mash prompt
      const prompt = this.scene.add.text(
        this.stationPlatforms[index].x,
        this.stationPlatforms[index].y - 60,
        `Mash E! (0/${this.mashTarget})`,
        { fontSize: '14px', fontFamily: 'system-ui', color: '#FCD34D' }
      ).setOrigin(0.5)

      const checkMash = () => {
        if (Phaser.Input.Keyboard.JustDown(this.mashKey)) {
          this.mashCount++
          prompt.setText(`Mash E! (${this.mashCount}/${this.mashTarget})`)
          if (this.mashCount >= this.mashTarget) {
            this.completeStation(index)
            prompt.destroy()
            this.scene.input.keyboard!.off('keydown', checkMash)
            return
          }
        }
        if (this.stationPlatforms[index]?.active) {
          this.scene.time.delayedCall(16, checkMash)
        }
      }
      this.scene.time.delayedCall(16, checkMash)

    } else if (station.type === 'dialogue') {
      const presentationDialogue: DialogueNode[] = [
        {
          id: 'start',
          speaker: 'Presentation Panel',
          text: 'Present your quarterly findings. What\'s the key takeaway?',
          options: [
            {
              text: '"Revenue is up 20%. Here\'s why it matters for next quarter."',
              statChanges: { reputation: 5 },
              consequence: '+5 Reputation — Clear and concise',
              nextNodeId: 'q2',
              tags: ['polished'],
            },
            {
              text: '"The data speaks for itself." *clicks to next slide*',
              statChanges: { reputation: -3 },
              consequence: '-3 Reputation — Too vague',
              nextNodeId: 'q2',
              tags: ['lazy'],
            },
          ],
        },
        {
          id: 'q2',
          speaker: 'Presentation Panel',
          text: 'How do you handle the Q3 projections being off by 15%?',
          options: [
            {
              text: '"We identified the gap, adjusted the model, and here\'s the revised outlook."',
              statChanges: { reputation: 5 },
              consequence: '+5 Reputation — Ownership',
              nextNodeId: 'q3',
              tags: ['accountable'],
            },
            {
              text: '"External factors. Not our fault."',
              statChanges: { reputation: -5 },
              consequence: '-5 Reputation — Deflection noted',
              nextNodeId: 'q3',
              tags: ['deflector'],
            },
          ],
        },
        {
          id: 'q3',
          speaker: 'Presentation Panel',
          text: 'Final question: what\'s your recommendation?',
          options: [
            {
              text: '"Double down on what\'s working. Cut what isn\'t. Here\'s the plan."',
              statChanges: { reputation: 5, network: 3 },
              consequence: '+5 Reputation, +3 Network — Decisive',
            },
          ],
        },
      ]

      useDialogueState.getState().openDialogue('station_presentation', 'start', presentationDialogue)
      const unsub = useDialogueState.subscribe((state) => {
        if (!state.isOpen) {
          unsub()
          this.completeStation(index)
        }
      })

    } else if (station.type === 'collect') {
      this.collectCount = 0
      // Spawn 3 reference NPCs at arena edges
      const positions = [
        { x: this.arenaStart + 80, y: this.arenaY - 80 },
        { x: this.arenaEnd - 80, y: this.arenaY - 80 },
        { x: (this.arenaStart + this.arenaEnd) / 2, y: this.arenaY - 200 },
      ]

      for (const pos of positions) {
        const ally = this.scene.add.container(pos.x, pos.y)
        const allyBody = this.scene.add.rectangle(0, 0, 30, 50, 0x10B981)
        const allyLabel = this.scene.add.text(0, -35, 'E', {
          fontSize: '14px',
          fontFamily: 'system-ui',
          color: '#fff',
          backgroundColor: '#10B981',
          padding: { left: 6, right: 6, top: 2, bottom: 2 },
        }).setOrigin(0.5)
        ally.add([allyBody, allyLabel])
        ally.setSize(30, 50)

        // Float
        this.scene.tweens.add({
          targets: ally,
          y: pos.y - 8,
          duration: 1000,
          yoyo: true,
          repeat: -1,
        })

        // Check interact
        const checkInteract = () => {
          if (!ally.active) return
          const dx = Math.abs(this.playerSprite.x - ally.x)
          const dy = Math.abs(this.playerSprite.y - ally.y)
          if (dx < 50 && dy < 60 && Phaser.Input.Keyboard.JustDown(this.mashKey)) {
            this.collectCount++
            ally.destroy()
            usePlayerStats.getState().modifyStats({ network: 3 }, 'boss:reference')
            if (this.collectCount >= this.collectTarget) {
              this.completeStation(index)
            }
            return
          }
          this.scene.time.delayedCall(16, checkInteract)
        }
        this.scene.time.delayedCall(16, checkInteract)
      }
    }
  }

  private completeStation(index: number) {
    this.stationsCompleted++

    // Make boss more visible (33% per station)
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.15 + this.stationsCompleted * 0.28,
      duration: 500,
    })

    // Flash the completed station
    if (this.stationPlatforms[index]?.active) {
      this.scene.tweens.add({
        targets: this.stationPlatforms[index],
        alpha: 0,
        duration: 500,
        onComplete: () => this.stationPlatforms[index]?.destroy(),
      })
    }

    this.activeStation = -1

    if (this.stationsCompleted >= 3) {
      this.enterPhase('one_on_one')
    }
  }

  // Phase 2: 1:1 Meeting dialogue
  private oneOnOneDialogue: DialogueNode[] = [
    {
      id: 'start',
      speaker: 'The Skip-Level',
      text: "So... remind me what you do here?",
      options: [
        {
          text: '"I shipped the feature, nailed the presentation, and got the references."',
          statCheck: { stat: 'reputation', comparison: 'gte', threshold: 60 },
          statChanges: { reputation: 10 },
          consequence: '✓ Rep Check! +10 Reputation — They\'re listening now',
          nextNodeId: 'q2',
          tags: ['hustler', 'direct'],
        },
        {
          text: '"I\'m the one making your team look good."',
          statChanges: { reputation: 5, network: -3 },
          consequence: '+5 Reputation, -3 Network — Bold but risky',
          nextNodeId: 'q2',
          tags: ['rebel', 'confident'],
        },
        {
          text: '"Let me walk you through my contributions this quarter."',
          statChanges: { reputation: 5, network: 5 },
          consequence: '+5 Reputation, +5 Network — Professional',
          nextNodeId: 'q2',
          tags: ['diplomat'],
        },
      ],
    },
    {
      id: 'q2',
      speaker: 'The Skip-Level',
      text: "Hmm. And what do you think our biggest challenge is right now?",
      options: [
        {
          text: '"Execution speed. We\'re too slow to ship."',
          statCheck: { stat: 'energy', comparison: 'gte', threshold: 50 },
          statChanges: { reputation: 8 },
          consequence: '✓ Energy Check! +8 Reputation — You clearly have stamina',
          nextNodeId: 'q3',
          tags: ['hustler'],
        },
        {
          text: '"Alignment. Too many competing priorities."',
          statChanges: { reputation: 5, network: 5 },
          consequence: '+5 Reputation, +5 Network — Diplomatic read',
          nextNodeId: 'q3',
          tags: ['diplomat', 'strategic'],
        },
        {
          text: '"Honestly? You not knowing who I am."',
          statChanges: { reputation: -5, cash: 5 },
          consequence: '-5 Reputation, +5 Cash — Awkward silence',
          nextNodeId: 'q3',
          tags: ['rebel'],
        },
      ],
    },
    {
      id: 'q3',
      speaker: 'The Skip-Level',
      text: "Last question. Where do you see yourself in this organization long-term?",
      options: [
        {
          text: '"In your seat."',
          statCheck: { stat: 'reputation', comparison: 'gte', threshold: 65 },
          statChanges: { reputation: 15 },
          consequence: '✓ Rep Check! +15 Reputation — They respect the ambition',
          nextNodeId: 'result',
          tags: ['hustler', 'ambitious'],
        },
        {
          text: '"Building something that outlasts any reorg."',
          statChanges: { reputation: 10, network: 5 },
          consequence: '+10 Reputation, +5 Network — Thoughtful',
          nextNodeId: 'result',
          tags: ['diplomat', 'visionary'],
        },
        {
          text: '"Wherever the work is interesting and the team is real."',
          statChanges: { energy: 10, reputation: 5 },
          consequence: '+10 Energy, +5 Reputation — Authentic',
          nextNodeId: 'result',
          tags: ['rebel', 'authentic'],
        },
      ],
    },
    {
      id: 'result',
      speaker: 'The Skip-Level',
      text: "...I see you now. Consider yourself on my radar. That's either very good or very bad for you. We'll find out.",
    },
  ]

  private openOneOnOne() {
    useDialogueState.getState().openDialogue('boss_skip_level', 'start', this.oneOnOneDialogue)

    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === 'one_on_one') {
        unsub()
        this.enterPhase('defeated')
      }
    })
  }

  private onDefeat() {
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      y: this.sprite.y - 80,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.destroy()
        this.onDefeated?.()
      },
    })
  }

  destroy() {
    this.destroyed = true
    for (const sp of this.stationPlatforms) sp.destroy()
    this.sprite.destroy()
  }
}
