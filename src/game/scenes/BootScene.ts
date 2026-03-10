import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0F172A')

    // Just render a dark background — the React MainMenu handles the actual menu.
    // Boot scene exists so Phaser has something to render on init.
    // It does NOT auto-transition to Game; App.tsx controls that.
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '1px',
        color: '#0F172A',
      })
      .setOrigin(0.5)
  }
}
