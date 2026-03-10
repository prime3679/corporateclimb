import Phaser from 'phaser'
import { useCharacterStore } from '../../ui/stores/characterStore'

/**
 * SpriteLoader — handles loading the correct player sprite based on
 * character customization, and provides texture keys for all entities.
 *
 * For now, entities use colored rectangles with Phaser shape overlays.
 * This system provides the foundation for swapping to sprite sheet textures.
 */

// Player texture key based on customization
export function getPlayerTextureKey(): string {
  const { skinTone } = useCharacterStore.getState()
  const safeTone = skinTone.replace('#', '')
  return `player_${safeTone}`
}

// NPC texture keys
export const NPC_TEXTURES: Record<string, { color: number; width: number; height: number }> = {
  professor_no_curve: { color: 0x7F1D1D, width: 55, height: 90 },
  ghosting_recruiter: { color: 0x6B7280, width: 50, height: 80 },
  skip_level: { color: 0x1E293B, width: 65, height: 95 },
  credit_thief: { color: 0x581C87, width: 50, height: 78 },
  overachiever: { color: 0x10B981, width: 48, height: 72 },
  imposter_shadow: { color: 0x2D1B4E, width: 60, height: 80 },
  mentor_corporate: { color: 0x92400E, width: 55, height: 85 },
  mentor_startup: { color: 0xD97706, width: 52, height: 78 },
}

// Power-up colors
export const POWER_UP_COLORS: Record<string, number> = {
  espresso: 0x92400E,
  networking_card: 0x3B82F6,
  pto_day: 0x10B981,
  side_hustle: 0xFBBF24,
  linkedin_endorsement: 0x2563EB,
  mentors_advice: 0x8B5CF6,
}

// Stat colors for particles
export const STAT_COLORS: Record<string, number> = {
  energy: 0x10B981,
  reputation: 0xEF4444,
  network: 0x3B82F6,
  cash: 0xFBBF24,
}

/**
 * Preload SVG assets into Phaser's texture manager.
 * Called during scene preload. Currently a no-op since we use
 * colored rectangles, but structured for future sprite sheet loading.
 */
export function preloadAssets(_scene: Phaser.Scene) {
  // Future: load sprite sheet PNGs generated from SVGs
  // scene.load.spritesheet('player', 'assets/characters/player/sheet.png', { frameWidth: 60, frameHeight: 80 })
}
