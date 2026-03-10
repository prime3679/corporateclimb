import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { GameScene } from '../scenes/GameScene'

export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1B2A4A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene],
}
