import { PhaserGame } from "./game/PhaserGame";
import { Overlay } from "./ui/Overlay";

export function App() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <PhaserGame />
      <Overlay />
    </div>
  );
}
