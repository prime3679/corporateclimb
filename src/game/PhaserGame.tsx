import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createPhaserConfig } from "./phaserConfig";

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (gameRef.current) return;

    const config = createPhaserConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    (window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
