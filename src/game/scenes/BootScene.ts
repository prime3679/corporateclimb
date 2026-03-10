import Phaser from 'phaser'
import { generateAllTextures } from '../systems/SpriteFactory'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#78C8E8')

    // Generate all pixel-art textures at boot time
    generateAllTextures(this)
  }
}
