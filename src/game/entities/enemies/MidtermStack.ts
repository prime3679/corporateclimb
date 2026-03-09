import Phaser from "phaser";
import { usePlayerStats } from "../../../ui/stores/playerStats";

const PAPER_W = 24;
const PAPER_H = 32;
const PAPER_COLOR = 0xf1f5f9; // white-ish
const FALL_SPEED = 180;
const SPAWN_INTERVAL = 800; // ms between papers
const DAMAGE = -3;
const HIT_COOLDOWN = 400; // ms between damage from individual papers

/**
 * Midterm Stack — falling paper projectiles in the lecture hall.
 * Papers spawn from the top of the zone and fall down.
 * Contact: -3 Energy per hit.
 */
export class MidtermStack {
  private scene: Phaser.Scene;
  private spawnX: number;
  private spawnY: number;
  private range: number;
  private spawnTimer = 0;
  private papers: Phaser.GameObjects.Rectangle[] = [];
  private paperGroup: Phaser.Physics.Arcade.Group;
  private lastHitTime = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    range: number = 400,
  ) {
    this.scene = scene;
    this.spawnX = x;
    this.spawnY = y;
    this.range = range;

    this.paperGroup = scene.physics.add.group({
      allowGravity: false,
    });
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.paperGroup;
  }

  onHitPlayer() {
    const now = this.scene.time.now;
    if (now - this.lastHitTime < HIT_COOLDOWN) return;
    this.lastHitTime = now;
    usePlayerStats.getState().modifyStats({ energy: DAMAGE }, "midterm_stack");
  }

  update(delta: number) {
    this.spawnTimer += delta;

    // Spawn new papers periodically
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.spawnPaper();
    }

    // Clean up off-screen papers
    for (let i = this.papers.length - 1; i >= 0; i--) {
      const paper = this.papers[i];
      if (paper.y > 700) {
        paper.destroy();
        this.papers.splice(i, 1);
      }
    }
  }

  private spawnPaper() {
    const x = this.spawnX + Phaser.Math.Between(-this.range / 2, this.range / 2);
    const paper = this.scene.add.rectangle(x, this.spawnY, PAPER_W, PAPER_H, PAPER_COLOR);
    paper.setDepth(7);

    this.paperGroup.add(paper);
    const body = paper.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(FALL_SPEED);
    // Slight horizontal drift for visual interest
    body.setVelocityX(Phaser.Math.Between(-30, 30));

    // Slight rotation
    paper.setData("rotSpeed", Phaser.Math.FloatBetween(-0.02, 0.02));

    this.papers.push(paper);
  }

  destroy() {
    for (const paper of this.papers) {
      paper.destroy();
    }
    this.papers = [];
    this.paperGroup.destroy(true);
  }
}
