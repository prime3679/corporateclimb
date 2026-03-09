import Phaser from "phaser";
import type { DecorationConfig } from "../config/levelTypes";

/**
 * Creates stylized vector-art decorations from config.
 * All visuals are simple Phaser shapes (rectangles, triangles, circles).
 */
export class EnvironmentDecorations {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, configs: DecorationConfig[]) {
    this.scene = scene;
    for (const cfg of configs) {
      this.create(cfg);
    }
  }

  private create(cfg: DecorationConfig) {
    switch (cfg.type) {
      case "tree":
        this.createTree(cfg);
        break;
      case "lamppost":
        this.createLamppost(cfg);
        break;
      case "bench":
        this.createBench(cfg);
        break;
      case "building":
        this.createBuilding(cfg);
        break;
      case "bush":
        this.createBush(cfg);
        break;
      case "cloud":
        this.createCloud(cfg);
        break;
      case "music_note":
        this.createMusicNote(cfg);
        break;
      case "door":
        this.createDoor(cfg);
        break;
      case "dorm_interior":
        this.createBuilding(cfg);
        break;
      case "steps":
        // Steps are handled as platforms
        break;
    }
  }

  private createTree(cfg: DecorationConfig) {
    const color = cfg.color ?? 0x166534;
    const x = cfg.x;
    const groundY = cfg.y;

    // Trunk
    const trunk = this.scene.add.rectangle(x, groundY - 40, 14, 80, 0x78350f);
    trunk.setOrigin(0.5, 1);
    trunk.setDepth(2);
    this.objects.push(trunk);

    // Canopy — triangle using polygon
    const canopy = this.scene.add.triangle(
      x,
      groundY - 80,
      0, 60, // bottom-left
      30, 0, // top
      60, 60, // bottom-right
      color,
    );
    canopy.setOrigin(0.5, 1);
    canopy.setDepth(3);
    this.objects.push(canopy);

    // Second smaller canopy layer
    const canopy2 = this.scene.add.triangle(
      x,
      groundY - 120,
      0, 50,
      25, 0,
      50, 50,
      Phaser.Display.Color.IntegerToColor(color).brighten(15).color,
    );
    canopy2.setOrigin(0.5, 1);
    canopy2.setDepth(3);
    this.objects.push(canopy2);
  }

  private createLamppost(cfg: DecorationConfig) {
    const x = cfg.x;
    const groundY = cfg.y;

    // Pole
    const pole = this.scene.add.rectangle(x, groundY - 60, 6, 120, 0x64748b);
    pole.setOrigin(0.5, 1);
    pole.setDepth(2);
    this.objects.push(pole);

    // Light fixture
    const fixture = this.scene.add.rectangle(x, groundY - 128, 20, 8, 0x94a3b8);
    fixture.setDepth(2);
    this.objects.push(fixture);

    // Light glow
    const glow = this.scene.add.circle(x, groundY - 120, 16, 0xfbbf24, 0.15);
    glow.setDepth(1);
    this.objects.push(glow);
  }

  private createBench(cfg: DecorationConfig) {
    const x = cfg.x;
    const groundY = cfg.y;

    // Seat
    const seat = this.scene.add.rectangle(x, groundY - 16, 60, 8, 0x92400e);
    seat.setDepth(2);
    this.objects.push(seat);

    // Left leg
    const legL = this.scene.add.rectangle(x - 24, groundY - 8, 6, 16, 0x78350f);
    legL.setDepth(2);
    this.objects.push(legL);

    // Right leg
    const legR = this.scene.add.rectangle(x + 24, groundY - 8, 6, 16, 0x78350f);
    legR.setDepth(2);
    this.objects.push(legR);
  }

  private createBuilding(cfg: DecorationConfig) {
    const x = cfg.x;
    const y = cfg.y;
    const w = cfg.width ?? 300;
    const h = cfg.height ?? 200;
    const color = cfg.color ?? 0x334155;

    // Main building body (behind platforms)
    const building = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, color);
    building.setDepth(-1);
    this.objects.push(building);

    // Windows — grid pattern
    const windowColor = 0xfbbf24;
    const windowOff = 0x1e293b;
    const cols = Math.floor(w / 80);
    const rows = Math.floor(h / 60);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 40 + c * 80;
        const wy = y + 40 + r * 60;
        // Randomly lit windows
        const lit = Math.random() > 0.3;
        const win = this.scene.add.rectangle(wx, wy, 24, 20, lit ? windowColor : windowOff, lit ? 0.4 : 0.2);
        win.setDepth(-1);
        this.objects.push(win);
      }
    }

    // Label if provided
    const label = cfg.data?.label as string | undefined;
    if (label) {
      const text = this.scene.add.text(x + w / 2, y + 16, label, {
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: "14px",
        color: "#94a3b8",
        fontStyle: "bold",
        letterSpacing: 4,
      });
      text.setOrigin(0.5, 0);
      text.setDepth(-1);
      this.objects.push(text);
    }
  }

  private createBush(cfg: DecorationConfig) {
    const x = cfg.x;
    const groundY = cfg.y;
    const color = cfg.color ?? 0x166534;

    // Two overlapping circles for bush shape
    const c1 = this.scene.add.circle(x - 8, groundY - 12, 16, color);
    c1.setDepth(2);
    this.objects.push(c1);

    const c2 = this.scene.add.circle(x + 8, groundY - 14, 14, color);
    c2.setDepth(2);
    this.objects.push(c2);

    const c3 = this.scene.add.circle(x, groundY - 18, 12,
      Phaser.Display.Color.IntegerToColor(color).brighten(10).color,
    );
    c3.setDepth(2);
    this.objects.push(c3);
  }

  private createCloud(cfg: DecorationConfig) {
    const x = cfg.x;
    const y = cfg.y;
    const w = cfg.width ?? 120;
    const h = cfg.height ?? 30;
    const color = cfg.color ?? 0xd4a574;
    const sf = cfg.scrollFactor ?? 0.02;

    // Cloud: overlapping ellipses
    const base = this.scene.add.ellipse(x, y, w, h, color, 0.4);
    base.setScrollFactor(sf);
    base.setDepth(-90);
    this.objects.push(base);

    const puff1 = this.scene.add.ellipse(x - w * 0.25, y - h * 0.2, w * 0.5, h * 0.7, color, 0.3);
    puff1.setScrollFactor(sf);
    puff1.setDepth(-90);
    this.objects.push(puff1);

    const puff2 = this.scene.add.ellipse(x + w * 0.2, y - h * 0.15, w * 0.4, h * 0.6, color, 0.35);
    puff2.setScrollFactor(sf);
    puff2.setDepth(-90);
    this.objects.push(puff2);
  }

  private createMusicNote(cfg: DecorationConfig) {
    const x = cfg.x;
    const y = cfg.y;

    const note = this.scene.add.text(x, y, "♪", {
      fontSize: "24px",
      color: "#c084fc",
    });
    note.setOrigin(0.5);
    note.setDepth(6);
    note.setAlpha(0.6);
    this.objects.push(note);

    // Float animation
    this.scene.tweens.add({
      targets: note,
      y: y - 30,
      alpha: 0.2,
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: Math.random() * 1000,
    });
  }

  private createDoor(cfg: DecorationConfig) {
    const x = cfg.x;
    const y = cfg.y;
    const w = cfg.width ?? 60;
    const h = cfg.height ?? 80;
    const color = cfg.color ?? 0x92400e;

    const door = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, color);
    door.setDepth(1);
    this.objects.push(door);

    // Doorknob
    const knob = this.scene.add.circle(x + w - 10, y + h / 2, 4, 0xfbbf24);
    knob.setDepth(1);
    this.objects.push(knob);
  }

  destroy() {
    for (const obj of this.objects) {
      obj.destroy();
    }
    this.objects = [];
  }
}
