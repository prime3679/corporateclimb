import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "Preload" });
  }

  preload() {
    // Future: load sprites, audio, fonts here
  }

  create() {
    // Future: transition to GameScene once assets are loaded
  }
}
