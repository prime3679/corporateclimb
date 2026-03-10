import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#1B2A4A')

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Corporate Climb', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    // Fade in title
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        // Hold, then transition to game
        this.time.delayedCall(1200, () => {
          this.cameras.main.fadeOut(500, 27, 42, 74)
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game')
          })
        })
      },
    })
  }
}
