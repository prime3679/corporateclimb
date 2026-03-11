// ─── CHARACTER SPRITES ──────────────────────────────────────
// PNG character sprites for all players and NPCs.

import productManagerPng from "./assets/characters/npcs/product_manager.png";
import overachieverPng from "./assets/characters/npcs/overachiever.png";
import internPng from "./assets/characters/npcs/intern.png";
import recruiterPng from "./assets/characters/npcs/recruiter.png";
import scrumPng from "./assets/characters/npcs/scrum.png";
import managerPng from "./assets/characters/npcs/manager.png";
import vpPng from "./assets/characters/npcs/vp.png";
import bossPng from "./assets/characters/npcs/boss.png";
import engPng from "./assets/characters/player/eng.png";
import designPng from "./assets/characters/player/design.png";

const SPRITES: Record<string, string> = {
  product_manager: productManagerPng,
  overachiever: overachieverPng,
  intern: internPng,
  recruiter: recruiterPng,
  scrum: scrumPng,
  manager: managerPng,
  vp: vpPng,
  boss: bossPng,
  eng: engPng,
  design: designPng,
};

export function buildSpriteUrls(): Record<string, string> {
  return { ...SPRITES };
}
