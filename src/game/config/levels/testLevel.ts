import { LevelConfig } from "../levelTypes";

const GROUND_Y = 648;
const GROUND_H = 72;

export const testLevel: LevelConfig = {
  name: "Test Level",
  bounds: { width: 6400, height: 720 },
  spawn: { x: 200, y: GROUND_Y },
  backgroundLayers: [
    // Furthest back - sky
    { color: "#0F1B33", scrollFactor: 0, y: 0, height: 720 },
    // Distant mountains
    { color: "#152240", scrollFactor: 0.1, y: 300, height: 420 },
    // Mid hills
    { color: "#1B2A4A", scrollFactor: 0.3, y: 420, height: 300 },
    // Near silhouette
    { color: "#213155", scrollFactor: 0.5, y: 520, height: 200 },
  ],
  platforms: [
    // ===== GROUND =====
    // Ground segment 1 (before gap)
    { x: 0, y: GROUND_Y, width: 2400, height: GROUND_H, type: "solid" },
    // Gap from x=2400 to x=2560 (160px gap)
    // Ground segment 2 (after gap)
    { x: 2560, y: GROUND_Y, width: 3840, height: GROUND_H, type: "solid" },

    // ===== LOW PLATFORMS (easy single jump) =====
    { x: 500, y: 548, width: 200, height: 24, type: "one-way" },
    { x: 800, y: 498, width: 160, height: 24, type: "one-way" },
    { x: 1050, y: 548, width: 200, height: 24, type: "one-way" },

    // ===== STAIRCASE PLATFORMS =====
    { x: 1400, y: 548, width: 140, height: 24, type: "one-way" },
    { x: 1560, y: 468, width: 140, height: 24, type: "one-way" },
    { x: 1720, y: 388, width: 140, height: 24, type: "one-way" },

    // ===== HIGH PLATFORMS (need full jump hold) =====
    { x: 1920, y: 308, width: 180, height: 24, type: "one-way" },
    { x: 2140, y: 268, width: 160, height: 24, type: "one-way" },

    // ===== PLATFORMS OVER THE GAP =====
    { x: 2360, y: 498, width: 120, height: 24, type: "one-way" },
    { x: 2520, y: 448, width: 120, height: 24, type: "one-way" },

    // ===== MOVING PLATFORM =====
    {
      x: 2900,
      y: 498,
      width: 160,
      height: 24,
      type: "moving",
      moveRange: 200,
      moveSpeed: 80,
      moveAxis: "horizontal",
    },

    // ===== POST-GAP PLATFORMS =====
    { x: 3200, y: 548, width: 180, height: 24, type: "one-way" },
    { x: 3450, y: 468, width: 160, height: 24, type: "one-way" },
    { x: 3700, y: 388, width: 200, height: 24, type: "one-way" },

    // ===== VERTICAL MOVING PLATFORM =====
    {
      x: 4000,
      y: 448,
      width: 140,
      height: 24,
      type: "moving",
      moveRange: 200,
      moveSpeed: 60,
      moveAxis: "vertical",
    },

    // ===== HIGH CHALLENGE SECTION =====
    { x: 4300, y: 348, width: 120, height: 24, type: "one-way" },
    { x: 4500, y: 288, width: 120, height: 24, type: "one-way" },
    { x: 4700, y: 228, width: 180, height: 24, type: "one-way" },

    // ===== WALL OBSTACLES =====
    { x: 5000, y: 548, width: 40, height: 100, type: "solid" },
    { x: 5400, y: 508, width: 40, height: 140, type: "solid" },

    // ===== FINAL PLATFORMS =====
    { x: 5600, y: 498, width: 200, height: 24, type: "one-way" },
    { x: 5900, y: 418, width: 300, height: 24, type: "one-way" },

    // ===== LEVEL BOUNDARY WALLS =====
    { x: -20, y: 0, width: 20, height: 720, type: "solid" },
    { x: 6400, y: 0, width: 20, height: 720, type: "solid" },
  ],
};
