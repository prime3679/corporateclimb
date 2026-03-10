import Phaser from 'phaser'
import { DialogueNode } from '../../ui/stores/dialogueState'

export interface DialogueTriggerConfig {
  x: number
  y: number
  width: number
  height: number
  dialogueId: string
  startNodeId: string
  dialogueTree: DialogueNode[]
  oneShot: boolean
  meetingBattle?: boolean
}

export class DialogueTrigger {
  scene: Phaser.Scene
  zone: Phaser.GameObjects.Zone
  config: DialogueTriggerConfig
  triggered = false
  private indicator: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, config: DialogueTriggerConfig) {
    this.scene = scene
    this.config = config

    // Create trigger zone
    this.zone = scene.add.zone(config.x, config.y, config.width, config.height)
    scene.physics.add.existing(this.zone, true)

    // Visual indicator (E prompt)
    this.indicator = scene.add
      .text(config.x, config.y - config.height / 2 - 20, 'E', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#4F46E5',
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      })
      .setOrigin(0.5)
      .setAlpha(0)

    // Floating animation on indicator
    scene.tweens.add({
      targets: this.indicator,
      y: this.indicator.y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  showPrompt() {
    if (this.triggered && this.config.oneShot) return
    this.indicator.setAlpha(1)
  }

  hidePrompt() {
    this.indicator.setAlpha(0)
  }

  canTrigger(): boolean {
    return !(this.triggered && this.config.oneShot)
  }

  markTriggered() {
    this.triggered = true
    if (this.config.oneShot) {
      this.indicator.destroy()
      this.zone.destroy()
    }
  }
}
