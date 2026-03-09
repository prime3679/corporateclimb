import { createRoot } from "react-dom/client";
import { App } from "./App";

// No StrictMode — it double-mounts components, which breaks Phaser's single-instance model
createRoot(document.getElementById("root")!).render(<App />);
