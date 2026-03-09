import { HUD } from "./components/HUD";
import { DialogueBox } from "./components/DialogueBox";
import { Menu } from "./components/Menu";
import { CharacterCreator } from "./components/CharacterCreator";

export function Overlay() {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {/* Character creator shown before game starts */}
      <CharacterCreator />

      {/* In-game overlays */}
      <HUD />
      <DialogueBox />
      <Menu />
    </div>
  );
}
