// ─── CHARACTER SPRITES ──────────────────────────────────────
// WebP character sprites (512px) for all players and NPCs.

import productManager from "./assets/characters/npcs/product_manager.webp";
import overachiever from "./assets/characters/npcs/overachiever.webp";
import intern from "./assets/characters/npcs/intern.webp";
import recruiter from "./assets/characters/npcs/recruiter.webp";
import scrum from "./assets/characters/npcs/scrum.webp";
import manager from "./assets/characters/npcs/manager.webp";
import vp from "./assets/characters/npcs/vp.webp";
import boss from "./assets/characters/npcs/boss.webp";
import eng from "./assets/characters/player/eng.webp";
import design from "./assets/characters/player/design.webp";

const SPRITES: Record<string, string> = {
  product_manager: productManager,
  overachiever,
  intern,
  recruiter,
  scrum,
  manager,
  vp,
  boss,
  eng,
  design,
};

export function buildSpriteUrls(): Record<string, string> {
  return { ...SPRITES };
}
