import Phaser from 'phaser'
import { Player, CursorKeys, WASDKeys } from '../entities/Player'
import { LevelConfig, PlatformConfig } from '../config/levels/types'
import { level1 } from '../config/levels/level1'
import { DialogueTrigger } from '../entities/DialogueTrigger'
import { AlarmClock } from '../entities/AlarmClock'
import { Freeloader } from '../entities/Freeloader'
import { MidtermStack } from '../entities/MidtermStack'
import { PowerUp } from '../entities/PowerUp'
import { BossNoCurve } from '../entities/BossNoCurve'
import { BossGhostingRecruiter } from '../entities/BossGhostingRecruiter'
import { ResumeGap } from '../entities/ResumeGap'
import { NetworkingCrowd } from '../entities/NetworkingCrowd'
import { LinkedInSwarm } from '../entities/LinkedInSwarm'
import { Overachiever } from '../entities/Overachiever'
import { CoffeeRunRequest } from '../entities/CoffeeRunRequest'
import { SlackBarrage } from '../entities/SlackBarrage'
import { CreditThiefManager } from '../entities/CreditThiefManager'
import { BossSkipLevel } from '../entities/BossSkipLevel'
import { BossImposterSyndrome } from '../entities/BossImposterSyndrome'
import { ScopeCreepBlob } from '../entities/ScopeCreepBlob'
import { GoldenHandcuffs } from '../entities/GoldenHandcuffs'
import { BossMirror } from '../entities/BossMirror'
import { OfficeMoodSystem } from '../systems/OfficeMoodSystem'
import { ReorgSystem } from '../systems/ReorgSystem'
import { useDialogueState } from '../../ui/stores/dialogueState'
import { useCharacterStore } from '../../ui/stores/characterStore'
import { usePlayerStats } from '../../ui/stores/playerStats'
import { useGameState } from '../../ui/stores/gameState'

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

  // Level 1 entities
  private alarmClocks: AlarmClock[] = []
  private freeloaders: Freeloader[] = []
  private midtermStacks: MidtermStack[] = []
  private powerUps: PowerUp[] = []

  // Level 2 entities
  private resumeGaps: ResumeGap[] = []
  private networkingCrowds: NetworkingCrowd[] = []
  private linkedInSwarms: LinkedInSwarm[] = []
  private overachievers: Overachiever[] = []
  private timedDoors: { rect: Phaser.GameObjects.Rectangle; body: Phaser.Physics.Arcade.StaticBody; open: boolean; timer: number; openDuration: number; closeDuration: number }[] = []

  // Level 3 entities
  private coffeeRunRequests: CoffeeRunRequest[] = []
  private slackBarrages: SlackBarrage[] = []
  private creditThieves: CreditThiefManager[] = []
  private reorgSystem: ReorgSystem | null = null

  // Level 4 entities
  private scopeCreepBlobs: ScopeCreepBlob[] = []
  private officeMood: OfficeMoodSystem | null = null

  // Level 5 entities
  private goldenHandcuffs: GoldenHandcuffs[] = []

  // Boss (polymorphic)
  private bossNoCurve: BossNoCurve | null = null
  private bossRecruiter: BossGhostingRecruiter | null = null
  private bossSkipLevel: BossSkipLevel | null = null
  private bossImposterSyndrome: BossImposterSyndrome | null = null
  private bossMirror: BossMirror | null = null
  private bossStarted = false

  private levelConfig!: LevelConfig
  private levelStartTime = 0

  constructor() {
    super({ key: 'Game' })
  }

  init(data?: { levelConfig?: LevelConfig }) {
    this.levelConfig = data?.levelConfig ?? level1
  }

  create() {
    const cfg = this.levelConfig
    this.levelStartTime = Date.now()

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

    // Player
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

    // Spawn entities from config
    this.spawnEnemies(cfg)
    this.spawnPowerUps(cfg)
    this.setupDialogueTriggers(cfg)
    this.setupTimedDoors(cfg)
    this.setupReorg(cfg)
    this.setupBoss(cfg)

    // Office mood system (Level 4+)
    if (cfg.id === 'level4') {
      this.officeMood = new OfficeMoodSystem(this)
    }

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
    if (useDialogueState.getState().isOpen) return

    this.player.update(delta, this.cursors, this.wasd, this.jumpKey, this.dodgeKey)

    // Camera lookahead
    const lookDir = this.player.facingRight ? -80 : 80
    const currentOffset = this.cameras.main.followOffset.x
    this.cameras.main.setFollowOffset(Phaser.Math.Linear(currentOffset, lookDir, 0.03), 0)

    this.updateMovingPlatforms(time)
    this.checkDialogueTriggers()
    this.updateEnemies(delta)
    this.updatePowerUps()
    this.updateTimedDoors(delta)
    this.updateBoss(delta)
    this.reorgSystem?.checkTrigger(this.player.sprite.x)

    // Fall respawn + pit energy cost
    if (this.player.sprite.y > this.levelConfig.bounds.bottom + 50) {
      this.handleFallRespawn()
    }
  }

  // ── Entity Spawning ──

  private spawnEnemies(cfg: LevelConfig) {
    if (!cfg.enemies) return

    for (const enemy of cfg.enemies) {
      switch (enemy.type) {
        case 'alarm_clock': {
          this.alarmClocks.push(new AlarmClock(
            this, enemy.x, enemy.y, enemy.speed, enemy.direction, enemy.patrolMin, enemy.patrolMax
          ))
          break
        }
        case 'freeloader': {
          const fl = new Freeloader(this, enemy.x, enemy.y)
          fl.onDrain = (amount) => usePlayerStats.getState().modifyStats({ energy: -amount }, 'enemy:freeloader')
          fl.onShakeOff = () => usePlayerStats.getState().modifyStats({ reputation: 3 }, 'enemy:freeloader:shakeoff')
          this.freeloaders.push(fl)
          break
        }
        case 'midterm_stack': {
          const ms = new MidtermStack(this, enemy.x, enemy.spawnWidth, enemy.spawnInterval)
          ms.onHitPlayer = () => usePlayerStats.getState().modifyStats({ energy: -5 }, 'enemy:midterm_stack')
          this.midtermStacks.push(ms)
          break
        }
        case 'resume_gap': {
          this.resumeGaps.push(new ResumeGap(this, enemy.x, enemy.y, enemy.gapWidth))
          break
        }
        case 'networking_crowd': {
          this.networkingCrowds.push(new NetworkingCrowd(
            this, enemy.x, enemy.y, enemy.zoneWidth, enemy.zoneHeight, enemy.slowFactor
          ))
          break
        }
        case 'linkedin_swarm': {
          this.linkedInSwarms.push(new LinkedInSwarm(this, enemy.x, enemy.y, enemy.count, enemy.radius))
          break
        }
        case 'overachiever': {
          this.overachievers.push(new Overachiever(this, enemy.x, enemy.y, enemy.targetX ?? enemy.x + 600))
          break
        }
        case 'coffee_run': {
          this.coffeeRunRequests.push(new CoffeeRunRequest(this, enemy.x, enemy.y, enemy.projectileSpeed))
          break
        }
        case 'slack_barrage': {
          this.slackBarrages.push(new SlackBarrage(this, enemy.x, enemy.y, enemy.bubbleCount))
          break
        }
        case 'credit_thief': {
          this.creditThieves.push(new CreditThiefManager(this, enemy.x, enemy.y))
          break
        }
        case 'scope_creep_blob': {
          this.scopeCreepBlobs.push(new ScopeCreepBlob(this, enemy.x, enemy.y, enemy.baseSize, enemy.growthRate, enemy.maxSize))
          break
        }
        case 'golden_handcuffs': {
          this.goldenHandcuffs.push(new GoldenHandcuffs(this, enemy.x, enemy.y))
          break
        }
      }
    }
  }

  private spawnPowerUps(cfg: LevelConfig) {
    if (!cfg.powerUps) return
    for (const pu of cfg.powerUps) {
      this.powerUps.push(new PowerUp(this, pu.x, pu.y, pu.type))
    }
  }

  private setupDialogueTriggers(cfg: LevelConfig) {
    if (!cfg.dialogueTriggers) return

    for (const trigCfg of cfg.dialogueTriggers) {
      const trigger = new DialogueTrigger(this, {
        x: trigCfg.x,
        y: trigCfg.y,
        width: trigCfg.width,
        height: trigCfg.height,
        dialogueId: trigCfg.dialogueId,
        startNodeId: trigCfg.startNodeId,
        dialogueTree: trigCfg.dialogueTree,
        oneShot: trigCfg.oneShot,
      })

      const npcW = trigCfg.npcWidth ?? 40
      const npcH = trigCfg.npcHeight ?? 60
      const npcColor = trigCfg.npcColor ?? 0xF59E0B
      const npc = this.add.rectangle(trigCfg.x, trigCfg.y + trigCfg.height / 2 - npcH / 2, npcW, npcH, npcColor)
      npc.setDepth(1)

      this.dialogueTriggers.push(trigger)
    }
  }

  private setupTimedDoors(cfg: LevelConfig) {
    if (!cfg.timedDoors) return

    for (const doorCfg of cfg.timedDoors) {
      const rect = this.add.rectangle(doorCfg.x, doorCfg.y, doorCfg.width, doorCfg.height, 0x991B1B)
      this.physics.add.existing(rect, true)
      const body = rect.body as Phaser.Physics.Arcade.StaticBody
      this.physics.add.collider(this.player.sprite, rect)

      const isOpen = doorCfg.startOpen ?? false
      if (isOpen) {
        rect.setAlpha(0.2)
        body.enable = false
      }

      this.timedDoors.push({
        rect,
        body,
        open: isOpen,
        timer: 0,
        openDuration: doorCfg.openDuration,
        closeDuration: doorCfg.closeDuration,
      })
    }
  }

  private setupReorg(cfg: LevelConfig) {
    if (!cfg.reorg) return
    this.reorgSystem = new ReorgSystem(this, cfg.reorg, this.solidPlatforms)
    // The reorg system will handle platform tweening when triggered
  }

  private setupBoss(cfg: LevelConfig) {
    if (!cfg.boss) return

    const flashPlayer = () => {
      this.player.sprite.setFillStyle(0xEF4444)
      this.time.delayedCall(200, () => {
        const accentHex = useCharacterStore.getState().accentColor
        this.player.sprite.setFillStyle(parseInt(accentHex.replace('#', ''), 16))
      })
    }

    const onDefeated = () => {
      useGameState.getState().setCurrentScene('level_complete')
    }

    if (cfg.boss.type === 'no_curve') {
      this.bossNoCurve = new BossNoCurve(this, cfg.boss.arenaStart, cfg.boss.arenaEnd, cfg.boss.arenaY)
      this.bossNoCurve.onHitPlayer = flashPlayer
      this.bossNoCurve.onDefeated = onDefeated
    } else if (cfg.boss.type === 'ghosting_recruiter') {
      this.bossRecruiter = new BossGhostingRecruiter(this, cfg.boss.arenaStart, cfg.boss.arenaEnd, cfg.boss.arenaY)
      this.bossRecruiter.onDefeated = onDefeated
    } else if (cfg.boss.type === 'skip_level') {
      this.bossSkipLevel = new BossSkipLevel(this, cfg.boss.arenaStart, cfg.boss.arenaEnd, cfg.boss.arenaY)
      this.bossSkipLevel.onDefeated = onDefeated
    } else if (cfg.boss.type === 'imposter_syndrome') {
      this.bossImposterSyndrome = new BossImposterSyndrome(this, cfg.boss.arenaStart, cfg.boss.arenaEnd, cfg.boss.arenaY)
      this.bossImposterSyndrome.onDefeated = onDefeated
      this.bossImposterSyndrome.onWhisperStart = () => useGameState.getState().setWhisperActive(true)
      this.bossImposterSyndrome.onWhisperEnd = () => useGameState.getState().setWhisperActive(false)
    } else if (cfg.boss.type === 'mirror') {
      this.bossMirror = new BossMirror(this, cfg.boss.arenaStart, cfg.boss.arenaEnd, cfg.boss.arenaY)
      this.bossMirror.onDefeated = onDefeated
      this.bossMirror.onMontageStart = () => useGameState.getState().setMontageActive(true)
      this.bossMirror.onMontageEnd = () => useGameState.getState().setMontageActive(false)
      useGameState.getState().setBossMirrorRef(this.bossMirror)
    }

    this.bossStarted = false
  }

  // ── Entity Updates ──

  private updateEnemies(delta: number) {
    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.jumpKey)

    for (const ac of this.alarmClocks) {
      ac.update()
      if (!ac.destroyed && !this.player.isInvulnerable) {
        if (Math.abs(px - ac.sprite.x) < 40 && Math.abs(py - ac.sprite.y) < 50) {
          usePlayerStats.getState().modifyStats({ energy: -10 }, 'enemy:alarm_clock')
          ac.destroy()
        }
      }
    }

    for (const fl of this.freeloaders) {
      fl.update(delta, px, py, jumpPressed)
    }

    for (const ms of this.midtermStacks) {
      ms.update(delta, this.player.sprite)
    }

    // Level 2 enemies
    for (const swarm of this.linkedInSwarms) {
      swarm.update(delta)
      if (!this.player.isInvulnerable && swarm.checkCollision(px, py)) {
        usePlayerStats.getState().modifyStats({ energy: -8 }, 'enemy:linkedin_swarm')
        // Brief invulnerability to prevent frame-stacking
        this.player.isInvulnerable = true
        this.time.delayedCall(500, () => { this.player.isInvulnerable = false })
      }
    }

    for (const crowd of this.networkingCrowds) {
      if (crowd.isPlayerInside(px, py)) {
        // Slow player movement
        this.player.body.setMaxVelocity(300 * crowd.slowFactor, 800)
        const drain = crowd.updateDrain(delta)
        if (drain > 0) {
          usePlayerStats.getState().modifyStats({ energy: -drain }, 'enemy:networking_crowd')
        }
      } else {
        crowd.resetDrain()
        this.player.body.setMaxVelocity(300, 800)
      }
    }

    for (const oa of this.overachievers) {
      if (!oa.destroyed && Math.abs(px - oa.baseX) < 200) {
        oa.startRace()
      }
      oa.update(delta)
    }

    // Level 3 enemies
    for (const cr of this.coffeeRunRequests) {
      if (cr.update(delta, px, py) && !this.player.isInvulnerable) {
        usePlayerStats.getState().modifyStats({ energy: -5 }, 'enemy:coffee_run')
        this.player.isInvulnerable = true
        this.time.delayedCall(500, () => { this.player.isInvulnerable = false })
      }
    }

    for (const sb of this.slackBarrages) {
      if (sb.update(delta, px, py) && !this.player.isInvulnerable) {
        usePlayerStats.getState().modifyStats({ energy: -3 }, 'enemy:slack_barrage')
      }
    }

    for (const ct of this.creditThieves) {
      ct.update(delta, px, py)
    }

    // Level 4 enemies
    for (const blob of this.scopeCreepBlobs) {
      blob.update(delta)
      if (!blob.destroyed && !this.player.isInvulnerable && blob.checkCollision(px, py)) {
        usePlayerStats.getState().modifyStats({ energy: -4 }, 'enemy:scope_creep_blob')
        this.player.isInvulnerable = true
        this.time.delayedCall(800, () => { this.player.isInvulnerable = false })
      }
    }

    this.officeMood?.update(delta)

    // Level 5 collectibles
    for (const gh of this.goldenHandcuffs) {
      gh.checkCollect(px, py)
    }
  }

  private updatePowerUps() {
    const px = this.player.sprite.x
    const py = this.player.sprite.y

    for (const pu of this.powerUps) {
      if (pu.collected) continue
      if (Math.abs(px - pu.sprite.x) < 40 && Math.abs(py - pu.sprite.y) < 50) {
        pu.collect(this)
      }
    }
  }

  private updateTimedDoors(delta: number) {
    for (const door of this.timedDoors) {
      door.timer += delta
      const threshold = door.open ? door.openDuration : door.closeDuration

      if (door.timer >= threshold) {
        door.timer -= threshold
        door.open = !door.open

        if (door.open) {
          door.rect.setAlpha(0.2)
          door.body.enable = false
        } else {
          door.rect.setAlpha(1)
          door.body.enable = true
          door.body.updateFromGameObject()
        }
      }
    }
  }

  private updateBoss(delta: number) {
    const boss = this.bossNoCurve ?? this.bossRecruiter ?? this.bossSkipLevel ?? this.bossImposterSyndrome ?? this.bossMirror
    if (!boss || boss.destroyed) return

    if (!this.bossStarted && this.player.sprite.x > (this.levelConfig.boss?.arenaStart ?? 9999)) {
      this.bossStarted = true
      boss.startFight(this.player.sprite)
    }

    boss.update(delta)
  }

  private handleFallRespawn() {
    const px = this.player.sprite.x
    const pitZone = this.levelConfig.pitZones?.find(
      (p) => px >= p.x && px <= p.x + p.width
    )
    if (pitZone) {
      usePlayerStats.getState().modifyStats({ energy: -pitZone.energyCost }, 'pit_fall')
    }
    this.player.respawnAtSafe()
  }

  private checkDialogueTriggers() {
    const interactPressed = Phaser.Input.Keyboard.JustDown(this.interactKey)

    for (const trigger of this.dialogueTriggers) {
      if (!trigger.canTrigger()) continue

      const zone = trigger.zone
      const player = this.player.sprite
      const dx = Math.abs(player.x - zone.x)
      const dy = Math.abs(player.y - zone.y)
      const inRange = dx < zone.width / 2 + 40 && dy < zone.height / 2 + 40

      if (inRange) {
        trigger.showPrompt()
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

  // ── Platforms & Backgrounds ──

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

      const speed = cfg.moveSpeed ?? 80
      const period = ((cfg.moveX ?? 200) * 2) / speed
      const t = (time / 1000) % period
      const halfPeriod = period / 2

      if (cfg.moveX) {
        const progress = t < halfPeriod ? t / halfPeriod : 1 - (t - halfPeriod) / halfPeriod
        const newX = origin.x + (cfg.moveX * progress) - cfg.moveX / 2
        const body = plat.body as Phaser.Physics.Arcade.Body
        body.setVelocityX((newX - plat.x) * 60)
        plat.x = newX
      }
    }
  }
}
