import { LevelConfig } from './types'

export const testLevel: LevelConfig = {
  id: 'test',
  name: 'Test Level',
  width: 6400,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 6400, top: 0, bottom: 720 },
  backgrounds: [
    {
      color: 0x0a1628,
      scrollFactor: 0.1,
      rects: [
        // distant buildings
        { x: 100, y: 300, width: 200, height: 420, color: 0x1a2a4a },
        { x: 400, y: 350, width: 150, height: 370, color: 0x1a2a4a },
        { x: 700, y: 280, width: 180, height: 440, color: 0x1a2a4a },
        { x: 1100, y: 320, width: 220, height: 400, color: 0x1a2a4a },
        { x: 1500, y: 340, width: 160, height: 380, color: 0x1a2a4a },
      ],
    },
    {
      color: 0x0f1f3a,
      scrollFactor: 0.3,
      rects: [
        // mid buildings
        { x: 50, y: 400, width: 250, height: 320, color: 0x253a5c },
        { x: 500, y: 380, width: 200, height: 340, color: 0x253a5c },
        { x: 900, y: 420, width: 180, height: 300, color: 0x253a5c },
        { x: 1300, y: 390, width: 240, height: 330, color: 0x253a5c },
      ],
    },
    {
      color: 0x1B2A4A,
      scrollFactor: 0.6,
      rects: [
        // near bushes/trees
        { x: 300, y: 560, width: 80, height: 60, color: 0x2d4a3a },
        { x: 800, y: 550, width: 100, height: 70, color: 0x2d4a3a },
        { x: 1400, y: 555, width: 90, height: 65, color: 0x2d4a3a },
        { x: 2200, y: 560, width: 80, height: 60, color: 0x2d4a3a },
        { x: 3000, y: 550, width: 100, height: 70, color: 0x2d4a3a },
        { x: 4000, y: 555, width: 90, height: 65, color: 0x2d4a3a },
        { x: 5000, y: 560, width: 80, height: 60, color: 0x2d4a3a },
      ],
    },
  ],
  platforms: [
    // Ground spanning full width
    { x: 3200, y: 680, width: 6400, height: 40, type: 'solid', color: 0x374151 },

    // Gap in the ground (split ground into two sections)
    // Actually, let's make the ground solid but add a pit
    // Remove ground section at x=3600-3800 by splitting:

    // Low platforms (1-jump height)
    { x: 800, y: 580, width: 200, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 1200, y: 560, width: 180, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 1600, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },

    // High platforms (need precise jump hold)
    { x: 2200, y: 440, width: 150, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 2600, y: 380, width: 140, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 3000, y: 350, width: 130, height: 20, type: 'one-way', color: 0x7C3AED },

    // Moving platform
    { x: 3400, y: 500, width: 160, height: 20, type: 'moving', moveX: 200, moveSpeed: 80, color: 0x10B981 },

    // Platforms after the gap
    { x: 4200, y: 560, width: 200, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 4600, y: 480, width: 180, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 5000, y: 520, width: 200, height: 20, type: 'one-way', color: 0x4F46E5 },

    // Walls to test collision
    { x: 2000, y: 600, width: 30, height: 120, type: 'solid', color: 0x6B7280 },
    { x: 5400, y: 580, width: 30, height: 140, type: 'solid', color: 0x6B7280 },

    // Staircase section
    { x: 5600, y: 620, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 5750, y: 570, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 5900, y: 520, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 6050, y: 470, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
  ],
}

// Create a pit by overriding the ground: split it into segments
// Ground left of pit
testLevel.platforms[0] = { x: 1900, y: 680, width: 3800, height: 40, type: 'solid', color: 0x374151 }
// Ground right of pit
testLevel.platforms.push({ x: 5200, y: 680, width: 2400, height: 40, type: 'solid', color: 0x374151 })
// The gap is at x=3800-4000 (200px gap)
