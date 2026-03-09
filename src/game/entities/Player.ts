import Phaser from "phaser";
import { useGameState } from "../../ui/stores/gameState";

// ─── Movement constants ───
const WIDTH = 60;
const HEIGHT = 80;
const COLOR = 0x4f46e5;

const MAX_SPEED = 300;
const ACCEL = 1200;
const DECEL_GROUND = 800;
const DECEL_AIR = 200;

const JUMP_VELOCITY = -500;
const GRAVITY = 1200;
const MAX_FALL_SPEED = 800;
const COYOTE_TIME = 80;
const JUMP_BUFFER = 100;
const VARIABLE_JUMP_MULTIPLIER = 0.5;

const DODGE_DISTANCE = 200;
const DODGE_DURATION = 150;
const DODGE_COOLDOWN = 500;

export type AnimState = "idle" | "run" | "jump_up" | "jump_fall" | "dodge" | "land";

/**
 * Player uses a Zone for physics (invisible, no scaling issues)
 * and a Rectangle for visuals (can be scaled freely for squash/stretch).
 */
export class Player extends Phaser.GameObjects.Zone {
  declare body: Phaser.Physics.Arcade.Body;
  private visual: Phaser.GameObjects.Rectangle;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private pad: Phaser.Input.Gamepad.Gamepad | null = null;

  // State
  public animState: AnimState = "idle";
  private facingRight = true;
  private onGround = false;
  private wasOnGround = false;

  // Coyote & jump buffer
  private lastGroundedTime = 0;
  private jumpBufferTime = 0;

  // Dodge
  private isDodging = false;
  private dodgeTimer = 0;
  private dodgeCooldownTimer = 0;
  private dodgeVelocityX = 0;

  // Squash/stretch
  private targetScaleX = 1;
  private targetScaleY = 1;
  private effectTimer = 0;

  // Respawn
  private lastSafeX = 0;
  private lastSafeY = 0;
  private levelBoundsHeight = 720;

  // Input lock (disabled during dialogue)
  private inputEnabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Zone centered at (x, y - HEIGHT/2) so bottom of zone aligns with spawn y
    super(scene, x, y - HEIGHT / 2, WIDTH, HEIGHT);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(WIDTH, HEIGHT);
    this.body.setMaxVelocityY(MAX_FALL_SPEED);
    this.body.setGravityY(GRAVITY);
    this.body.setCollideWorldBounds(false);

    // Visual rectangle (follows the zone, can scale freely)
    this.visual = scene.add.rectangle(this.x, this.y, WIDTH, HEIGHT, COLOR);
    this.visual.setDepth(10);

    this.lastSafeX = this.x;
    this.lastSafeY = this.y;

    this.setupInput();
  }

  private setupInput() {
    const kb = this.scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.shiftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.scene.input.gamepad?.once("connected", (gamepad: Phaser.Input.Gamepad.Gamepad) => {
      this.pad = gamepad;
    });
    if (this.scene.input.gamepad?.total) {
      this.pad = this.scene.input.gamepad.getPad(0);
    }
  }

  setLevelBoundsHeight(h: number) {
    this.levelBoundsHeight = h;
  }

  setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
  }

  update(dt: number) {
    const dtSec = dt / 1000;
    const now = this.scene.time.now;

    // Zone doesn't auto-sync from physics body — do it manually
    this.setPosition(
      this.body.position.x + WIDTH / 2,
      this.body.position.y + HEIGHT / 2,
    );

    this.wasOnGround = this.onGround;
    this.onGround = this.body.blocked.down;

    if (this.onGround) {
      this.lastGroundedTime = now;
    }

    if (this.onGround && !this.isDodging) {
      this.lastSafeX = this.x;
      this.lastSafeY = this.y;
    }

    // Fall respawn
    if (this.y > this.levelBoundsHeight + 100) {
      this.respawn();
      return;
    }

    // Timers
    if (this.dodgeCooldownTimer > 0) this.dodgeCooldownTimer -= dt;
    if (this.effectTimer > 0) {
      this.effectTimer -= dt;
      if (this.effectTimer <= 0) {
        this.targetScaleX = 1;
        this.targetScaleY = 1;
      }
    }

    const input = this.readInput();

    if (this.isDodging) {
      this.updateDodge(dt);
    } else {
      this.handleMovement(input, dtSec);
      this.handleJump(input, now);
      this.handleDodge(input);
    }

    // Landing
    if (this.onGround && !this.wasOnGround && !this.isDodging) {
      this.doSquash();
      if (now - this.jumpBufferTime < JUMP_BUFFER) {
        this.performJump();
      }
    }

    // Sync visual to physics zone position
    this.visual.setPosition(this.x, this.y);

    // Lerp visual scale (only affects the visual rectangle, not physics)
    this.visual.setScale(
      Phaser.Math.Linear(this.visual.scaleX, this.targetScaleX, 0.3),
      Phaser.Math.Linear(this.visual.scaleY, this.targetScaleY, 0.3),
    );

    this.updateAnimState();
    this.syncToStore();
  }

  readInput() {
    let moveX = 0;
    let jumpPressed = false;
    let jumpHeld = false;
    let dodgePressed = false;

    if (!this.inputEnabled) {
      return { moveX, jumpPressed, jumpHeld, dodgePressed };
    }

    const leftDown = this.cursors.left.isDown || this.wasd.A.isDown;
    const rightDown = this.cursors.right.isDown || this.wasd.D.isDown;
    if (leftDown && !rightDown) moveX = -1;
    if (rightDown && !leftDown) moveX = 1;

    jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.space!) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.W);
    jumpHeld = this.cursors.space!.isDown || this.wasd.W.isDown;
    dodgePressed = Phaser.Input.Keyboard.JustDown(this.shiftKey);

    // Gamepad
    if (this.pad) {
      const stick = this.pad.leftStick;
      if (Math.abs(stick.x) > 0.2) moveX = stick.x > 0 ? 1 : -1;
      if (this.pad.A) jumpHeld = true;
      if (this.pad.buttons[0]?.value && !this.pad.buttons[0].pressed) jumpPressed = true;
      if (this.pad.buttons[1]?.value) dodgePressed = true;
    }

    return { moveX, jumpPressed, jumpHeld, dodgePressed };
  }

  private handleMovement(input: ReturnType<typeof this.readInput>, dtSec: number) {
    const vx = this.body.velocity.x;
    const decel = this.onGround ? DECEL_GROUND : DECEL_AIR;

    if (input.moveX !== 0) {
      this.facingRight = input.moveX > 0;
      const newVx = Phaser.Math.Clamp(vx + input.moveX * ACCEL * dtSec, -MAX_SPEED, MAX_SPEED);
      this.body.setVelocityX(newVx);
    } else {
      if (Math.abs(vx) < decel * dtSec) {
        this.body.setVelocityX(0);
      } else {
        this.body.setVelocityX(vx + (vx > 0 ? -1 : 1) * decel * dtSec);
      }
    }
  }

  private handleJump(input: ReturnType<typeof this.readInput>, now: number) {
    const canCoyote = now - this.lastGroundedTime < COYOTE_TIME;

    if (input.jumpPressed) {
      this.jumpBufferTime = now;
    }

    if (input.jumpPressed && (this.onGround || canCoyote)) {
      this.performJump();
    }

    // Variable jump height
    if (!input.jumpHeld && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * VARIABLE_JUMP_MULTIPLIER);
    }
  }

  private performJump() {
    this.body.setVelocityY(JUMP_VELOCITY);
    this.lastGroundedTime = 0;
    this.jumpBufferTime = 0;
    this.doStretch();
  }

  private handleDodge(input: ReturnType<typeof this.readInput>) {
    if (input.dodgePressed && this.dodgeCooldownTimer <= 0) {
      this.isDodging = true;
      this.dodgeTimer = DODGE_DURATION;
      this.dodgeCooldownTimer = DODGE_COOLDOWN;

      const dir = this.facingRight ? 1 : -1;
      this.dodgeVelocityX = (DODGE_DISTANCE / DODGE_DURATION) * 1000 * dir;

      this.targetScaleX = 1.4;
      this.targetScaleY = 0.7;
      this.effectTimer = DODGE_DURATION;

      this.body.setVelocityY(0);
      this.body.setGravityY(0);
    }
  }

  private updateDodge(dt: number) {
    this.dodgeTimer -= dt;
    this.body.setVelocityX(this.dodgeVelocityX);
    this.body.setVelocityY(0);

    if (this.dodgeTimer <= 0) {
      this.isDodging = false;
      this.body.setGravityY(GRAVITY);
      this.body.setVelocityX(this.facingRight ? MAX_SPEED * 0.5 : -MAX_SPEED * 0.5);
      this.targetScaleX = 1;
      this.targetScaleY = 1;
    }
  }

  private doSquash() {
    this.targetScaleX = 1.2;
    this.targetScaleY = 0.8;
    this.effectTimer = 80;
  }

  private doStretch() {
    this.targetScaleX = 0.85;
    this.targetScaleY = 1.2;
    this.effectTimer = 80;
  }

  private respawn() {
    this.setPosition(this.lastSafeX, this.lastSafeY);
    this.body.reset(this.lastSafeX, this.lastSafeY);
    this.isDodging = false;
    this.body.setGravityY(GRAVITY);
  }

  private updateAnimState() {
    if (this.isDodging) {
      this.animState = "dodge";
    } else if (!this.onGround && this.body.velocity.y < 0) {
      this.animState = "jump_up";
    } else if (!this.onGround && this.body.velocity.y > 0) {
      this.animState = "jump_fall";
    } else if (this.onGround && !this.wasOnGround) {
      this.animState = "land";
    } else if (this.onGround && Math.abs(this.body.velocity.x) > 20) {
      this.animState = "run";
    } else {
      this.animState = "idle";
    }
  }

  private syncToStore() {
    const store = useGameState.getState();
    if (store.currentScene !== "Game") {
      useGameState.setState({ currentScene: "Game", isRunning: true });
    }
  }

  getAnimState(): AnimState {
    return this.animState;
  }

  isFacingRight(): boolean {
    return this.facingRight;
  }
}
