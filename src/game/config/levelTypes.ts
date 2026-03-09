export type PlatformType = "solid" | "one-way" | "moving";

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  /** For moving platforms: movement range in px */
  moveRange?: number;
  /** For moving platforms: speed in px/s */
  moveSpeed?: number;
  /** For moving platforms: "horizontal" | "vertical" */
  moveAxis?: "horizontal" | "vertical";
}

export interface BackgroundLayerConfig {
  color: string;
  scrollFactor: number;
  y: number;
  height: number;
}

export interface LevelConfig {
  name: string;
  bounds: { width: number; height: number };
  spawn: { x: number; y: number };
  platforms: PlatformConfig[];
  backgroundLayers: BackgroundLayerConfig[];
}
