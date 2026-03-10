import Phaser from 'phaser'
import { Player, CursorKeys, WASDKeys } from '../entities/Player'
import { LevelConfig, PlatformConfig } from '../config/levels/types'
import { testLevel } from '../config/levels/testLevel'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private cursors!: CursorKeys
  private wasd!: WASDKeys
  private jumpKey!: Phaser.Input.Keyboard.Key
  private dodgeKey!: Phaser.Input.Keyboard.Key

  private solidPlatforms!: Phaser.Physics.Arcade.StaticGroup
  private oneWayPlatforms!: Phaser.Physics.Arcade.StaticGroup
  private movingPlatforms: Phaser.GameObjects.Rectangle[] = []
  private movingPlatformConfigs: PlatformConfig[] = []
  private movingPlatformOrigins: { x: number; y: number }[] = []

  private levelConfig!: LevelConfig

  constructor() {
    super({ key: 'Game' })
  }

  init(data?: { levelId?: string }) {
    this.levelConfig = testLevel // For now always load test level
  }

  create() {
    const cfg = this.levelConfig

    // Set world bounds
    this.physics.world.setBounds(cfg.bounds.left, cfg.bounds.top, cfg.bounds.right - cfg.bounds.left, cfg.bounds.bottom - cfg.bounds.top)

    // Build parallax backgrounds
    this.buildBackgrounds(cfg)

    // Build platforms
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

    // Create player
    this.player = new Player(this, cfg.spawn.x, cfg.spawn.y)

    // Collisions
    this.physics.add.collider(this.player.sprite, this.solidPlatforms)

    // One-way platforms: only collide from above
    this.physics.add.collider(this.player.sprite, this.oneWayPlatforms, undefined, (playerSprite, platform) => {
      const playerBody = (playerSprite as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.Body
      const platBody = (platform as Phaser.GameObjects.Rectangle).body as Phaser.Physics.Arcade.StaticBody
      // Only collide if player is falling and feet are above platform top
      return playerBody.velocity.y >= 0 && playerBody.bottom <= platBody.top + 10
    })

    // Moving platform collisions
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

    // Camera
    this.cameras.main.startFollow(this.player.sprite, false, 0.08, 0.05)
    this.cameras.main.setDeadzone(100, 80)
    this.cameras.main.setBounds(cfg.bounds.left, cfg.bounds.top, cfg.bounds.right - cfg.bounds.left, cfg.bounds.bottom - cfg.bounds.top)
    this.cameras.main.setFollowOffset(-80 * (this.player.facingRight ? 1 : -1), 0)

    // Fall detection: if player falls below level bounds, respawn
    this.physics.world.on('worldbounds', () => {})
  }

  update(time: number, delta: number) {
    this.player.update(delta, this.cursors, this.wasd, this.jumpKey, this.dodgeKey)

    // Camera lookahead
    const lookDir = this.player.facingRight ? -80 : 80
    const currentOffset = this.cameras.main.followOffset.x
    this.cameras.main.setFollowOffset(
      Phaser.Math.Linear(currentOffset, lookDir, 0.03),
      0
    )

    // Update moving platforms
    this.updateMovingPlatforms(time)

    // Fall respawn
    if (this.player.sprite.y > this.levelConfig.bounds.bottom + 50) {
      this.player.respawnAtSafe()
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
      const period = ((cfg.moveX ?? 200) * 2) / speed // full cycle time
      const t = (time / 1000) % period
      const halfPeriod = period / 2

      if (cfg.moveX) {
        const progress = t < halfPeriod ? t / halfPeriod : 1 - (t - halfPeriod) / halfPeriod
        const newX = origin.x + (cfg.moveX * progress) - cfg.moveX / 2
        body.setVelocityX((newX - plat.x) * 60)
        plat.x = newX
      }
      if (cfg.moveY) {
        const progress = t < halfPeriod ? t / halfPeriod : 1 - (t - halfPeriod) / halfPeriod
        const newY = origin.y + (cfg.moveY * progress) - cfg.moveY / 2
        body.setVelocityY((newY - plat.y) * 60)
        plat.y = newY
      }
    }
  }
}
