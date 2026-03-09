import Phaser from "phaser";
import { Player } from "../entities/Player";

const LOOKAHEAD_X = 80;
const LERP_X = 0.08;
const LERP_Y = 0.06;
const DEADZONE_WIDTH = 100;
const DEADZONE_HEIGHT = 80;

export class CameraSystem {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private target: Player;
  private offsetX = 0;

  constructor(
    scene: Phaser.Scene,
    target: Player,
    bounds: { width: number; height: number },
  ) {
    this.camera = scene.cameras.main;
    this.target = target;

    this.camera.setBounds(0, 0, bounds.width, bounds.height);
    this.camera.setDeadzone(DEADZONE_WIDTH, DEADZONE_HEIGHT);
    this.camera.startFollow(target, false, LERP_X, LERP_Y);
  }

  update() {
    // Lookahead: shift the follow offset based on facing direction
    const targetOffset = this.target.isFacingRight() ? LOOKAHEAD_X : -LOOKAHEAD_X;
    this.offsetX = Phaser.Math.Linear(this.offsetX, targetOffset, 0.05);
    this.camera.setFollowOffset(-this.offsetX, 0);
  }
}
