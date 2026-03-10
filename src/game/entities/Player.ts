import Phaser from 'phaser'

type AnimState = 'idle' | 'run' | 'jump_up' | 'jump_fall' | 'dodge' | 'land'

const PLAYER_WIDTH = 60
const PLAYER_HEIGHT = 66
const MAX_SPEED = 300
const ACCELERATION = 1200
const GROUND_DECEL = 800
const AIR_DECEL = 200
const JUMP_VELOCITY = -500
const GRAVITY = 1200
const MAX_FALL_SPEED = 800
const COYOTE_TIME = 80
const JUMP_BUFFER = 100
const DODGE_DISTANCE = 200
const DODGE_DURATION = 150
const DODGE_COOLDOWN = 500

export class Player {
  scene: Phaser.Scene
  sprite: Phaser.GameObjects.Sprite
  body: Phaser.Physics.Arcade.Body

  // State
  animState: AnimState = 'idle'
  facingRight = true
  isOnGround = false
  isDodging = false
  isInvulnerable = false

  // Timers
  private coyoteTimer = 0
  private jumpBufferTimer = 0
  private dodgeCooldownTimer = 0
  private dodgeTimer = 0
  private dodgeDirection = 1
  private landSquashTimer = 0
  private jumpStretchTimer = 0
  private wasOnGround = false
  private lastSafePosition: { x: number; y: number }
  private runFrame = 0
  private runFrameTimer = 0

  // Variable jump
  private isJumping = false
  private jumpHeld = false

  constructor(scene: Phaser.Scene, x: number, y: number, _color: number = 0x4F46E5) {
    this.scene = scene
    this.lastSafePosition = { x, y }

    // Use generated pixel-art sprite
    const textureKey = scene.textures.exists('player_idle') ? 'player_idle' : undefined
    if (textureKey) {
      this.sprite = scene.add.sprite(x, y, 'player_idle')
    } else {
      // Fallback: create a colored rectangle texture
      const g = scene.add.graphics()
      g.fillStyle(_color, 1)
      g.fillRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT)
      g.generateTexture('player_fallback', PLAYER_WIDTH, PLAYER_HEIGHT)
      g.destroy()
      this.sprite = scene.add.sprite(x, y, 'player_fallback')
    }

    this.sprite.setDepth(10)
    scene.physics.add.existing(this.sprite)

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body
    this.body.setCollideWorldBounds(false)
    this.body.setMaxVelocityY(MAX_FALL_SPEED)
    this.body.setGravityY(GRAVITY)
    this.body.setSize(PLAYER_WIDTH, PLAYER_HEIGHT)
  }

  update(dt: number, cursors: CursorKeys, wasd: WASDKeys, jumpKey: Phaser.Input.Keyboard.Key, dodgeKey: Phaser.Input.Keyboard.Key) {
    const dtMs = dt
    const dtSec = dt / 1000

    // Ground detection
    this.isOnGround = this.body.blocked.down || this.body.touching.down

    // Coyote time
    if (this.isOnGround) {
      this.coyoteTimer = COYOTE_TIME
      if (!this.wasOnGround) {
        this.landSquashTimer = 50
        this.isJumping = false
      }
      this.lastSafePosition.x = this.sprite.x
      this.lastSafePosition.y = this.sprite.y
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dtMs)
    }
    this.wasOnGround = this.isOnGround

    // Decrement timers
    this.dodgeCooldownTimer = Math.max(0, this.dodgeCooldownTimer - dtMs)
    this.landSquashTimer = Math.max(0, this.landSquashTimer - dtMs)
    this.jumpStretchTimer = Math.max(0, this.jumpStretchTimer - dtMs)

    // Dodge logic
    if (this.isDodging) {
      this.dodgeTimer -= dtMs
      if (this.dodgeTimer <= 0) {
        this.isDodging = false
        this.isInvulnerable = false
        this.body.setVelocityX(0)
      } else {
        const dodgeSpeed = DODGE_DISTANCE / (DODGE_DURATION / 1000)
        this.body.setVelocityX(this.dodgeDirection * dodgeSpeed)
      }
      this.updateVisuals()
      this.updateAnimState()
      return
    }

    // --- Horizontal Movement ---
    const leftPressed = cursors.left.isDown || wasd.left.isDown
    const rightPressed = cursors.right.isDown || wasd.right.isDown
    const moveDir = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0)

    if (moveDir !== 0) {
      this.facingRight = moveDir > 0
      const accel = ACCELERATION * dtSec
      const newVelX = this.body.velocity.x + moveDir * accel
      this.body.setVelocityX(Phaser.Math.Clamp(newVelX, -MAX_SPEED, MAX_SPEED))
    } else {
      const decel = (this.isOnGround ? GROUND_DECEL : AIR_DECEL) * dtSec
      if (Math.abs(this.body.velocity.x) < decel) {
        this.body.setVelocityX(0)
      } else {
        this.body.setVelocityX(
          this.body.velocity.x - Math.sign(this.body.velocity.x) * decel
        )
      }
    }

    // --- Jump ---
    const jumpPressed = Phaser.Input.Keyboard.JustDown(jumpKey)
    this.jumpHeld = jumpKey.isDown

    if (jumpPressed) {
      this.jumpBufferTimer = JUMP_BUFFER
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dtMs)
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isJumping) {
      this.body.setVelocityY(JUMP_VELOCITY)
      this.isJumping = true
      this.coyoteTimer = 0
      this.jumpBufferTimer = 0
      this.jumpStretchTimer = 50
    }

    if (this.isJumping && !this.jumpHeld && this.body.velocity.y < JUMP_VELOCITY * 0.4) {
      this.body.setVelocityY(this.body.velocity.y * 0.5)
    }

    // --- Dodge ---
    const dodgePressed = Phaser.Input.Keyboard.JustDown(dodgeKey)
    if (dodgePressed && this.dodgeCooldownTimer <= 0 && !this.isDodging) {
      this.isDodging = true
      this.isInvulnerable = true
      this.dodgeTimer = DODGE_DURATION
      this.dodgeCooldownTimer = DODGE_COOLDOWN
      this.dodgeDirection = this.facingRight ? 1 : -1
      this.body.setVelocityY(0)
      this.body.setGravityY(0)
    }

    if (!this.isDodging) {
      this.body.setGravityY(GRAVITY)
    }

    this.updateVisuals()
    this.updateAnimState()
  }

  private updateVisuals() {
    // Flip sprite based on facing direction
    this.sprite.setFlipX(!this.facingRight)

    // Squash/stretch effects
    if (this.landSquashTimer > 0) {
      this.sprite.setScale(1.15, 0.8)
    } else if (this.jumpStretchTimer > 0) {
      this.sprite.setScale(0.85, 1.2)
    } else if (this.isDodging) {
      this.sprite.setScale(1.3, 0.85)
      this.sprite.setAlpha(0.7)
    } else {
      this.sprite.setScale(1, 1)
      this.sprite.setAlpha(this.isInvulnerable ? 0.5 : 1)
    }

    // Animate run cycle
    if (this.animState === 'run') {
      this.runFrameTimer += 16
      if (this.runFrameTimer > 120) {
        this.runFrameTimer = 0
        this.runFrame = (this.runFrame + 1) % 2
      }
      const tex = this.runFrame === 0 ? 'player_run1' : 'player_run2'
      if (this.scene.textures.exists(tex)) this.sprite.setTexture(tex)
    } else if (this.animState === 'jump_up' || this.animState === 'jump_fall') {
      if (this.scene.textures.exists('player_jump')) this.sprite.setTexture('player_jump')
    } else {
      if (this.scene.textures.exists('player_idle')) this.sprite.setTexture('player_idle')
    }
  }

  private updateAnimState() {
    if (this.isDodging) {
      this.animState = 'dodge'
    } else if (this.landSquashTimer > 0) {
      this.animState = 'land'
    } else if (!this.isOnGround) {
      this.animState = this.body.velocity.y < 0 ? 'jump_up' : 'jump_fall'
    } else if (Math.abs(this.body.velocity.x) > 20) {
      this.animState = 'run'
    } else {
      this.animState = 'idle'
    }
  }

  respawnAtSafe() {
    this.sprite.setPosition(this.lastSafePosition.x, this.lastSafePosition.y)
    this.body.setVelocity(0, 0)
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y }
  }
}

export interface CursorKeys {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}

export interface WASDKeys {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}
