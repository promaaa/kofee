export interface VisionInput {
  boardId: string;
  frame: Uint8Array<ArrayBuffer>;
  cols: number;
  rows: number;
}

export interface VisionResult {
  corners: { x: number; y: number }[];
  regions: { x: number; y: number; w: number; h: number }[];
}
