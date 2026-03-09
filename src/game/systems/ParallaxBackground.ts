import Phaser from "phaser";
import { BackgroundLayerConfig } from "../config/levelTypes";

interface Layer {
  rect: Phaser.GameObjects.Rectangle;
  scrollFactor: number;
}

export class ParallaxBackground {
  private layers: Layer[] = [];

  constructor(
    scene: Phaser.Scene,
    configs: BackgroundLayerConfig[],
    levelWidth: number,
  ) {
    for (const cfg of configs) {
      // Make rectangles wide enough to cover the camera at any scroll position
      const extraWidth = levelWidth * (1 - cfg.scrollFactor) + 1280;
      const rect = scene.add.rectangle(
        levelWidth / 2,
        cfg.y + cfg.height / 2,
        levelWidth + extraWidth,
        cfg.height,
        Phaser.Display.Color.HexStringToColor(cfg.color).color,
      );
      rect.setScrollFactor(cfg.scrollFactor, 1);
      rect.setDepth(-100 + cfg.scrollFactor * 10);
      this.layers.push({ rect, scrollFactor: cfg.scrollFactor });
    }
  }
}
