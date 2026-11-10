export interface VisionInput {
  frame: Uint8Array<ArrayBuffer>;
  cols: number;
  rows: number;
}

export interface VisionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VisionResult {
  corners: { x: number; y: number }[];
  regions: VisionRect[];
  unknown: VisionRect[];
}
