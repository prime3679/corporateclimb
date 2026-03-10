import Phaser from 'phaser'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useDialogueState, DialogueNode } from '../../ui/stores/dialogueState'
import { useGameState } from '../../ui/stores/gameState'

type BossPhase = 'idle' | 'followup_emails' | 'callback_chase' | 'final_interview' | 'defeated'

const FOLLOWUP_VISIBLE_TIME = 3000
const FOLLOWUP_CONTACTS_NEEDED = 5
const PHONE_BASE_SPEED = 200
const PHONE_CATCHES_NEEDED = 3

export class BossGhostingRecruiter {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Container
  phase: BossPhase = 'idle'
  private arenaStart: number
  private arenaEnd: number
  private arenaY: number
  private playerSprite!: Phaser.GameObjects.Rectangle

  // Phase 1 state
  private contactsMade = 0
  private isVisible = false
  private visibleTimer = 0
  private teleportTimer = 0
  private currentVisibleDuration = FOLLOWUP_VISIBLE_TIME
  private interactKey!: Phaser.Input.Keyboard.Key

  // Phase 2 state
  private phone: Phaser.GameObjects.Container | null = null
  private phoneBody: Phaser.Physics.Arcade.Body | null = null
  private phonesCaught = 0
  private phoneSpeed = PHONE_BASE_SPEED

  destroyed = false
  onPhaseChange?: (phase: BossPhase) => void
  onDefeated?: () => void

  constructor(scene: Phaser.Scene, arenaStart: number, arenaEnd: number, arenaY: number) {
    this.scene = scene
    this.arenaStart = arenaStart
    this.arenaEnd = arenaEnd
    this.arenaY = arenaY

    const bossX = arenaStart + (arenaEnd - arenaStart) / 2
    const bossY = arenaY - 100

    // Corporate gray figure with blue tie accent
    const body = scene.add.rectangle(0, 0, 60, 100, 0x6B7280)
    const tie = scene.add.rectangle(0, 10, 10, 40, 0x2563EB)
    const head = scene.add.circle(0, -60, 22, 0x9CA3AF)
    // Smug smile
    const smile = scene.add.arc(0, -52, 10, 0, 180, false, 0x374151)
    // Phone in hand
    const phoneIcon = scene.add.rectangle(35, -10, 12, 20, 0x111827)

    this.sprite = scene.add.container(bossX, bossY, [body, tie, head, smile, phoneIcon])
    this.sprite.setSize(60, 140)
    scene.physics.add.existing(this.sprite, true)

    this.interactKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    // Idle phone-checking animation
    scene.tweens.add({
      targets: phoneIcon,
      angle: 10,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  startFight(playerSprite: Phaser.GameObjects.Rectangle) {
    this.playerSprite = playerSprite
    this.enterPhase('followup_emails')
  }

  update(dt: number) {
    if (this.destroyed || this.phase === 'idle' || this.phase === 'defeated') return

    if (this.phase === 'followup_emails') {
      this.updateFollowupEmails(dt)
    } else if (this.phase === 'callback_chase') {
      this.updateCallbackChase(dt)
    }
  }

  private enterPhase(phase: BossPhase) {
    this.phase = phase
    this.onPhaseChange?.(phase)

    if (phase === 'followup_emails') {
      this.teleportToRandom()
      this.isVisible = true
      this.visibleTimer = 0
      this.currentVisibleDuration = FOLLOWUP_VISIBLE_TIME
    } else if (phase === 'callback_chase') {
      // Recruiter teleports away, drops a phone
      this.sprite.setAlpha(0.3)
      this.spawnPhone()
    } else if (phase === 'final_interview') {
      this.sprite.setAlpha(1)
      this.teleportToCenter()
      this.openFinalInterview()
    } else if (phase === 'defeated') {
      this.onDefeat()
    }
  }

  // ── Phase 1: Follow-up Emails ──

  private updateFollowupEmails(dt: number) {
    this.visibleTimer += dt

    if (this.isVisible) {
      // Check if player reaches and presses E
      const dx = Math.abs(this.playerSprite.x - this.sprite.x)
      const dy = Math.abs(this.playerSprite.y - this.sprite.y)
      const inRange = dx < 60 && dy < 80

      if (inRange && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.contactsMade++
        // Flash green on contact
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          repeat: 2,
        })

        if (this.contactsMade >= FOLLOWUP_CONTACTS_NEEDED) {
          this.enterPhase('callback_chase')
          return
        }

        // Speed up after each contact
        this.currentVisibleDuration = Math.max(1500, this.currentVisibleDuration - 300)
        this.teleportToRandom()
        this.visibleTimer = 0
      }

      // Teleport if visible time expired (player missed)
      if (this.visibleTimer >= this.currentVisibleDuration) {
        usePlayerStats.getState().modifyStats({ energy: -3 }, 'boss:recruiter:miss')
        this.teleportToRandom()
        this.visibleTimer = 0
      }
    }
  }

  private teleportToRandom() {
    const margin = 100
    const newX = Phaser.Math.Between(this.arenaStart + margin, this.arenaEnd - margin)
    const newY = this.arenaY - Phaser.Math.Between(80, 160)

    // Teleport flash
    this.sprite.setAlpha(0)
    this.scene.time.delayedCall(200, () => {
      this.sprite.setPosition(newX, newY)
      ;(this.sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
      this.sprite.setAlpha(1)
      this.isVisible = true
    })
  }

  private teleportToCenter() {
    const cx = this.arenaStart + (this.arenaEnd - this.arenaStart) / 2
    this.sprite.setPosition(cx, this.arenaY - 100)
    ;(this.sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
  }

  // ── Phase 2: Callback Chase ──

  private spawnPhone() {
    const cx = this.arenaStart + (this.arenaEnd - this.arenaStart) / 2
    const cy = this.arenaY - 100

    const phoneRect = this.scene.add.rectangle(0, 0, 20, 30, 0x10B981)
    const screen = this.scene.add.rectangle(0, -2, 14, 18, 0x34D399)
    this.phone = this.scene.add.container(cx, cy, [phoneRect, screen])
    this.phone.setSize(20, 30)
    this.scene.physics.add.existing(this.phone)
    this.phoneBody = this.phone.body as Phaser.Physics.Arcade.Body
    this.phoneBody.setAllowGravity(false)
    this.phoneBody.setBounce(1, 1)
    this.phoneBody.setCollideWorldBounds(false)
    this.phoneBody.setSize(20, 30)
    this.phoneBody.setOffset(-10, -15)

    // Launch in random direction
    const angle = Math.random() * Math.PI * 2
    this.phoneBody.setVelocity(
      Math.cos(angle) * this.phoneSpeed,
      Math.sin(angle) * this.phoneSpeed
    )

    this.phonesCaught = 0
  }

  private updateCallbackChase(dt: number) {
    if (!this.phone || !this.phoneBody) return

    // Bounce off arena walls manually
    if (this.phone.x <= this.arenaStart + 20 || this.phone.x >= this.arenaEnd - 20) {
      this.phoneBody.setVelocityX(-this.phoneBody.velocity.x)
    }
    if (this.phone.y <= this.arenaY - 300 || this.phone.y >= this.arenaY - 20) {
      this.phoneBody.setVelocityY(-this.phoneBody.velocity.y)
    }

    // Check player catch
    const dx = Math.abs(this.playerSprite.x - this.phone.x)
    const dy = Math.abs(this.playerSprite.y - this.phone.y)
    if (dx < 35 && dy < 45) {
      this.phonesCaught++

      // Flash + speed up
      this.scene.tweens.add({
        targets: this.phone,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 100,
        yoyo: true,
      })

      if (this.phonesCaught >= PHONE_CATCHES_NEEDED) {
        this.phone.destroy()
        this.phone = null
        this.phoneBody = null
        this.enterPhase('final_interview')
        return
      }

      // Randomize direction and increase speed
      this.phoneSpeed += 50
      const newAngle = Math.random() * Math.PI * 2
      this.phoneBody.setVelocity(
        Math.cos(newAngle) * this.phoneSpeed,
        Math.sin(newAngle) * this.phoneSpeed
      )
    }
  }

  // ── Phase 3: Final Interview ──

  private interviewDialogue: DialogueNode[] = [
    {
      id: 'start',
      speaker: 'The Ghosting Recruiter',
      text: "Alright, you got my attention. Final round. Tell me — where do you see yourself in 5 years?",
      options: [
        {
          text: '"Running this division."',
          statCheck: { stat: 'network', comparison: 'gte', threshold: 30 },
          statChanges: { reputation: 10 },
          consequence: '✓ Network Check! +10 Reputation — Bold answer, they respect it',
          nextNodeId: 'q2',
          tags: ['hustler'],
        },
        {
          text: '"Growing with a team I believe in."',
          statChanges: { reputation: 5, network: 5 },
          consequence: '+5 Reputation, +5 Network — Safe but genuine',
          nextNodeId: 'q2',
          tags: ['diplomat'],
        },
        {
          text: '"Honestly? I just need health insurance."',
          statChanges: { cash: 15, reputation: -5 },
          consequence: '+15 Cash, -5 Reputation — They laugh nervously',
          nextNodeId: 'q2',
          tags: ['rebel'],
        },
      ],
    },
    {
      id: 'q2',
      speaker: 'The Ghosting Recruiter',
      text: "What's your biggest weakness?",
      options: [
        {
          text: '"I work too hard." (classic dodge)',
          statChanges: { reputation: -3 },
          consequence: '-3 Reputation — They\'ve heard that one before',
          nextNodeId: 'q3',
          tags: ['cliché'],
        },
        {
          text: '"I care too much about doing great work."',
          statCheck: { stat: 'reputation', comparison: 'gte', threshold: 50 },
          statChanges: { reputation: 5 },
          consequence: '✓ Rep Check! +5 Reputation — Recruiter nods approvingly',
          nextNodeId: 'q3',
          tags: ['diplomat', 'polished'],
        },
        {
          text: '"I\'m doing this interview, aren\'t I?"',
          statChanges: { cash: 5, energy: -5 },
          consequence: '+5 Cash (negotiation leverage), -5 Energy',
          nextNodeId: 'q3',
          tags: ['rebel', 'funny'],
        },
      ],
    },
    {
      id: 'q3',
      speaker: 'The Ghosting Recruiter',
      text: "Last question. Why should we hire YOU over every other candidate?",
      options: [
        {
          text: '"Because I followed up 5 times and caught your phone."',
          statChanges: { reputation: 8, network: 5 },
          consequence: '+8 Reputation, +5 Network — Can\'t argue with persistence',
          nextNodeId: 'offer',
          tags: ['hustler', 'self_aware'],
        },
        {
          text: '"My network vouches for me. Ask anyone in this room."',
          statCheck: { stat: 'network', comparison: 'gte', threshold: 50 },
          statChanges: { network: 10 },
          consequence: '✓ Network Check! +10 Network — References check out',
          nextNodeId: 'offer',
          tags: ['diplomat', 'networker'],
        },
        {
          text: '"You shouldn\'t. But I\'m going to prove you wrong anyway."',
          statChanges: { reputation: 5, energy: -3 },
          consequence: '+5 Reputation, -3 Energy — Intriguing',
          nextNodeId: 'offer',
          tags: ['rebel', 'underdog'],
        },
      ],
    },
    {
      id: 'offer',
      speaker: 'The Ghosting Recruiter',
      text: "...You know what? You've got something. I'm extending an offer. Welcome aboard — don't make me regret it.",
    },
  ]

  private openFinalInterview() {
    useDialogueState.getState().openDialogue('boss_interview', 'start', this.interviewDialogue)

    const unsub = useDialogueState.subscribe((state) => {
      if (!state.isOpen && this.phase === 'final_interview') {
        unsub()
        this.enterPhase('defeated')
      }
    })
  }

  private onDefeat() {
    // Victory: recruiter fades out with a thumbs up
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
    if (this.phone) this.phone.destroy()
    this.sprite.destroy()
  }
}
