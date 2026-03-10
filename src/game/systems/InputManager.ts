/**
 * InputManager — unified input abstraction for keyboard + touch.
 * GameScene reads from this instead of raw Phaser keys.
 */

export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  jump: boolean
  jumpJustPressed: boolean
  dodge: boolean
  dodgeJustPressed: boolean
  interact: boolean
  interactJustPressed: boolean
}

class InputManagerSingleton {
  private state: InputState = {
    left: false, right: false, up: false, down: false,
    jump: false, jumpJustPressed: false,
    dodge: false, dodgeJustPressed: false,
    interact: false, interactJustPressed: false,
  }

  // Touch input from React overlay
  private touchState = {
    joystickX: 0,
    joystickY: 0,
    jumpPressed: false,
    dodgePressed: false,
    interactPressed: false,
  }

  private prevJump = false
  private prevDodge = false
  private prevInteract = false

  /** Called by TouchControls to set joystick direction */
  setJoystick(x: number, y: number) {
    this.touchState.joystickX = x
    this.touchState.joystickY = y
  }

  /** Called by TouchControls for button presses */
  setTouchButton(button: 'jump' | 'dodge' | 'interact', pressed: boolean) {
    this.touchState[`${button}Pressed`] = pressed
  }

  /** Called each frame from GameScene to merge keyboard + touch input */
  update(
    cursors: { left: { isDown: boolean }; right: { isDown: boolean }; up: { isDown: boolean }; down: { isDown: boolean } },
    wasd: { left: { isDown: boolean }; right: { isDown: boolean }; up: { isDown: boolean }; down: { isDown: boolean } },
    jumpKey: { isDown: boolean },
    dodgeKey: { isDown: boolean },
    interactKey: { isDown: boolean },
  ) {
    // Merge keyboard and touch
    const left = cursors.left.isDown || wasd.left.isDown || this.touchState.joystickX < -0.3
    const right = cursors.right.isDown || wasd.right.isDown || this.touchState.joystickX > 0.3
    const up = cursors.up.isDown || wasd.up.isDown || this.touchState.joystickY < -0.3
    const down = cursors.down.isDown || wasd.down.isDown || this.touchState.joystickY > 0.3
    const jump = jumpKey.isDown || this.touchState.jumpPressed
    const dodge = dodgeKey.isDown || this.touchState.dodgePressed
    const interact = interactKey.isDown || this.touchState.interactPressed

    this.state = {
      left,
      right,
      up,
      down,
      jump,
      jumpJustPressed: jump && !this.prevJump,
      dodge,
      dodgeJustPressed: dodge && !this.prevDodge,
      interact,
      interactJustPressed: interact && !this.prevInteract,
    }

    this.prevJump = jump
    this.prevDodge = dodge
    this.prevInteract = interact
  }

  getState(): InputState {
    return this.state
  }

  /** Returns true if any touch input is active (for detecting touch devices) */
  isTouchActive(): boolean {
    return this.touchState.joystickX !== 0 ||
           this.touchState.joystickY !== 0 ||
           this.touchState.jumpPressed ||
           this.touchState.dodgePressed ||
           this.touchState.interactPressed
  }
}

export const inputManager = new InputManagerSingleton()
