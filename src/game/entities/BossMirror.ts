import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useDialogueState, DialogueNode } from '../../ui/stores/dialogueState'
import { useChoiceHistory } from '../../ui/stores/choiceHistory'
import { useGameProgress } from '../../ui/stores/gameProgress'
import { useGameState } from '../../ui/stores/gameState'

type BossPhase = 'idle' | 'montage' | 'question' | 'transition' | 'defeated'

export class BossMirror {
  scene: Phaser.Scene
  phase: BossPhase = 'idle'
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private mirror: Phaser.GameObjects.Container

  destroyed = false
  onDefeated?: () => void
  onMontageStart?: () => void
  onMontageEnd?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    const cx = arenaStart + (arenaEnd - arenaStart) / 2

    // Reflective platform / mirror surface
    const surface = scene.add.rectangle(0, 0, 300, 10, 0xE2E8F0)
    surface.setStrokeStyle(2, 0x94A3B8)
    const glow = scene.add.rectangle(0, -40, 200, 80, 0x818CF8, 0.08)
    const label = scene.add.text(0, -80, 'THE MIRROR', {
      fontSize: '16px',
      fontFamily: 'system-ui',
      color: '#CBD5E1',
      fontStyle: 'italic',
    }).setOrigin(0.5)

    this.mirror = scene.add.container(cx, arenaY - 60, [glow, surface, label])
    this.mirror.setDepth(5)

    // Subtle pulse
    scene.tweens.add({
      targets: glow,
      alpha: 0.15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    })
  }

  startFight(_playerSprite: Phaser.GameObjects.Rectangle) {
    this.enterPhase('montage')
  }

  update(_dt: number) {
    // Boss is dialogue-driven, no frame updates needed
  }

  private enterPhase(phase: BossPhase) {
    this.phase = phase

    if (phase === 'montage') {
      this.onMontageStart?.()
      // Montage is handled by React overlay — we wait for it to signal completion
    } else if (phase === 'question') {
      this.openTheQuestion()
    } else if (phase === 'defeated') {
      this.onDefeat()
    }
  }

  /** Called by MontageOverlay when montage finishes */
  onMontageComplete() {
    this.onMontageEnd?.()
    this.enterPhase('question')
  }

  private openTheQuestion() {
    const stats = usePlayerStats.getState()
    const history = useChoiceHistory.getState()

    const allStatsAbove50 = stats.energy > 50 && stats.reputation > 50 && stats.network > 50 && stats.cash > 50
    const hasRebelTag = history.hasTag('rebel')
    const hasImposterHonesty = history.hasTag('imposter_honesty')
    const secretUnlocked = allStatsAbove50 && hasRebelTag && hasImposterHonesty

    const options: DialogueNode['options'] = [
      {
        text: '"Impact at scale."',
        statChanges: { reputation: 10 },
        consequence: '+10 Reputation — The corporate path',
        tags: ['chose_corporate'],
      },
      {
        text: '"Freedom to build."',
        statChanges: { cash: 10 },
        consequence: '+10 Cash — The entrepreneur path',
        tags: ['chose_pivot'],
      },
    ]

    if (secretUnlocked) {
      options.push({
        text: '"Both, on my own terms."',
        statChanges: { reputation: 5, cash: 5, energy: 5, network: 5 },
        consequence: '+5 All Stats — The hybrid path unlocked',
        tags: ['chose_hybrid'],
      })
    }

    const dialogue: DialogueNode[] = [
      {
        id: 'start',
        speaker: 'The Mirror',
        text: "You've come this far. Four levels of meetings, politics, bosses, and doubt. Before you move forward: what matters most?",
        options,
      },
    ]

    useDialogueState.getState().openDialogue('boss_mirror', 'start', dialogue)

    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === 'question') {
        unsub()

        // Determine path choice from tags
        const recentChoices = useChoiceHistory.getState().getChoicesForDialogue('boss_mirror')
        const lastChoice = recentChoices[recentChoices.length - 1]

        if (lastChoice?.tags.includes('chose_corporate')) {
          useGameProgress.getState().setPathChoice('corporate')
        } else if (lastChoice?.tags.includes('chose_pivot')) {
          useGameProgress.getState().setPathChoice('pivot')
        } else if (lastChoice?.tags.includes('chose_hybrid')) {
          useGameProgress.getState().setPathChoice('hybrid')
        }

        this.enterPhase('defeated')
      }
    })
  }

  private onDefeat() {
    // Mirror shatters effect
    for (let i = 0; i < 15; i++) {
      const shard = this.scene.add.rectangle(
        this.mirror.x + Phaser.Math.Between(-100, 100),
        this.mirror.y + Phaser.Math.Between(-40, 40),
        Phaser.Math.Between(8, 20),
        Phaser.Math.Between(4, 12),
        0xE2E8F0,
        0.7,
      )
      shard.setRotation(Math.random() * Math.PI)
      this.scene.tweens.add({
        targets: shard,
        x: shard.x + Phaser.Math.Between(-200, 200),
        y: shard.y + Phaser.Math.Between(-150, 100),
        alpha: 0,
        rotation: shard.rotation + Math.random() * 3,
        duration: 1200 + Math.random() * 600,
        onComplete: () => shard.destroy(),
      })
    }

    this.scene.tweens.add({
      targets: this.mirror,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        this.mirror.destroy()
        this.onDefeated?.()
      },
    })
  }

  destroy() {
    this.destroyed = true
    this.mirror.destroy()
  }
}
