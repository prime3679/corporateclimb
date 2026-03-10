import Phaser from 'phaser'
import { Player, CursorKeys, WASDKeys } from '../entities/Player'
import { LevelConfig, PlatformConfig } from '../config/levels/types'
import { testLevel } from '../config/levels/testLevel'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'
import { DialogueTrigger, DialogueTriggerConfig } from '../entities/DialogueTrigger'
import { useDialogueState } from '../../ui/stores/dialogueState'
import { useCharacterStore } from '../../ui/stores/characterStore'
import { testDialogue } from '../config/dialogues/testDialogue'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private cursors!: CursorKeys
  private wasd!: WASDKeys
  private jumpKey!: Phaser.Input.Keyboard.Key
  private dodgeKey!: Phaser.Input.Keyboard.Key
  private interactKey!: Phaser.Input.Keyboard.Key

  private solidPlatforms!: Phaser.Physics.Arcade.StaticGroup
  private oneWayPlatforms!: Phaser.Physics.Arcade.StaticGroup
  private movingPlatforms: Phaser.GameObjects.Rectangle[] = []
  private movingPlatformConfigs: PlatformConfig[] = []
  private movingPlatformOrigins: { x: number; y: number }[] = []

  private dialogueTriggers: DialogueTrigger[] = []
  private activeTrigger: DialogueTrigger | null = null

  private levelConfig!: LevelConfig

  constructor() {
    super({ key: 'Game' })
  }

  init() {
    this.levelConfig = testLevel
  }

  create() {
    const cfg = this.levelConfig

    this.physics.world.setBounds(cfg.bounds.left, cfg.bounds.top, cfg.bounds.right - cfg.bounds.left, cfg.bounds.bottom - cfg.bounds.top)

    this.buildBackgrounds(cfg)

    // Platforms
    this.solidPlatforms = this.physics.add.staticGroup()
    this.oneWayPlatforms = this.physics.add.staticGroup()
    this.movingPlatforms = []
    this.movingPlatformConfigs = []
    this.movingPlatformOrigins = []

    for (const plat of cfg.platforms) {
      if (plat.type === 'moving') {
        this.createMovingPlatform(plat)
      } else if (plat.type === 'one-way') {
        this.createStaticPlatform(plat, this.oneWayPlatforms)
      } else {
        this.createStaticPlatform(plat, this.solidPlatforms)
      }
    }

    // Player — use accent color from character store
    const accentHex = useCharacterStore.getState().accentColor
    const playerColor = parseInt(accentHex.replace('#', ''), 16)
    this.player = new Player(this, cfg.spawn.x, cfg.spawn.y, playerColor)

    // Collisions
    this.physics.add.collider(this.player.sprite, this.solidPlatforms)
    this.physics.add.collider(this.player.sprite, this.oneWayPlatforms, undefined, (playerSprite, platform) => {
      const playerBody = (playerSprite as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.Body
      const platBody = (platform as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody
      return playerBody.velocity.y >= 0 && playerBody.bottom <= platBody.top + 10
    })
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(this.player.sprite, mp)
    }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys() as unknown as CursorKeys
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.dodgeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    // Camera
    this.cameras.main.startFollow(this.player.sprite, false, 0.08, 0.05)
    this.cameras.main.setDeadzone(100, 80)
    this.cameras.main.setBounds(cfg.bounds.left, cfg.bounds.top, cfg.bounds.right - cfg.bounds.left, cfg.bounds.bottom - cfg.bounds.top)

    // Dialogue triggers
    this.setupDialogueTriggers()

    // Listen for dialogue state changes to pause/unpause
    let wasOpen = false
    const unsubDialogue = useDialogueState.subscribe((state) => {
      if (state.isOpen && !wasOpen) {
        this.physics.pause()
      } else if (!state.isOpen && wasOpen) {
        this.physics.resume()
        if (this.activeTrigger) {
          this.activeTrigger.markTriggered()
          this.activeTrigger = null
        }
      }
      wasOpen = state.isOpen
    })

    this.events.on('shutdown', () => unsubDialogue())
  }

  update(time: number, delta: number) {
    // Don't process input during dialogue
    if (useDialogueState.getState().isOpen) return

    this.player.update(delta, this.cursors, this.wasd, this.jumpKey, this.dodgeKey)

    // Camera lookahead
    const lookDir = this.player.facingRight ? -80 : 80
    const currentOffset = this.cameras.main.followOffset.x
    this.cameras.main.setFollowOffset(Phaser.Math.Linear(currentOffset, lookDir, 0.03), 0)

    this.updateMovingPlatforms(time)

    // Check dialogue trigger proximity
    this.checkDialogueTriggers()

    // Fall respawn
    if (this.player.sprite.y > this.levelConfig.bounds.bottom + 50) {
      this.player.respawnAtSafe()
    }
  }

  private setupDialogueTriggers() {
    // Place a test NPC trigger in the test level
    const trigger = new DialogueTrigger(this, {
      x: 1000,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'test_student',
      startNodeId: 'start',
      dialogueTree: testDialogue,
      oneShot: false,
    })

    // Add a visual NPC rectangle
    const npc = this.add.rectangle(1000, 630, 40, 60, 0xF59E0B)
    npc.setDepth(1)

    this.dialogueTriggers.push(trigger)
  }

  private checkDialogueTriggers() {
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey)
    let anyOverlap = false

    for (const trigger of this.dialogueTriggers) {
      if (!trigger.canTrigger()) continue

      const zone = trigger.zone
      const player = this.player.sprite
      const dx = Math.abs(player.x - zone.x)
      const dy = Math.abs(player.y - zone.y)
      const inRange = dx < zone.width / 2 + 40 && dy < zone.height / 2 + 40

      if (inRange) {
        trigger.showPrompt()
        anyOverlap = true

        if (interactPressed) {
          this.activeTrigger = trigger
          useDialogueState.getState().openDialogue(
            trigger.config.dialogueId,
            trigger.config.startNodeId,
            trigger.config.dialogueTree
          )
        }
      } else {
        trigger.hidePrompt()
      }
    }
  }

  private buildBackgrounds(cfg: LevelConfig) {
    for (const layer of cfg.backgrounds) {
      for (const rect of layer.rects) {
        const color = rect.color ?? layer.color
        const bg = this.add.rectangle(rect.x, rect.y, rect.width, rect.height, color)
        bg.setScrollFactor(layer.scrollFactor)
        bg.setDepth(-10)
      }
    }
  }

  private createStaticPlatform(plat: PlatformConfig, group: Phaser.Physics.Arcade.StaticGroup) {
    const rect = this.add.rectangle(plat.x, plat.y, plat.width, plat.height, plat.color ?? 0x475569)
    this.physics.add.existing(rect, true)
    group.add(rect)
  }

  private createMovingPlatform(plat: PlatformConfig) {
    const rect = this.add.rectangle(plat.x, plat.y, plat.width, plat.height, plat.color ?? 0x10B981)
    this.physics.add.existing(rect, false)
    const body = rect.body as Phaser.Physics.Arcade.Body
    body.setImmovable(true)
    body.setAllowGravity(false)
    this.movingPlatforms.push(rect)
    this.movingPlatformConfigs.push(plat)
    this.movingPlatformOrigins.push({ x: plat.x, y: plat.y })
  }

  private updateMovingPlatforms(time: number) {
    for (let i = 0; i < this.movingPlatforms.length; i++) {
      const plat = this.movingPlatforms[i]
      const cfg = this.movingPlatformConfigs[i]
      const origin = this.movingPlatformOrigins[i]
      const body = plat.body as Phaser.Physics.Arcade.Body

      const speed = cfg.moveSpeed ?? 80
      const period = ((cfg.moveX ?? 200) * 2) / speed
      const t = (time / 1000) % period
      const halfPeriod = period / 2

      if (cfg.moveX) {
        const progress = t < halfPeriod ? t / halfPeriod : 1 - (t - halfPeriod) / halfPeriod
        const newX = origin.x + (cfg.moveX * progress) - cfg.moveX / 2
        body.setVelocityX((newX - plat.x) * 60)
        plat.x = newX
      }
    }
  }
}
