import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#1B2A4A')

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Corporate Climb', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
  }
}
