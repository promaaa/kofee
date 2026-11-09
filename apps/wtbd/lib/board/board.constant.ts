import { Float, Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class BoardInput extends via((field) => ({
  name: field(String),
  widthCm: field(Float, { default: 120 }),
  heightCm: field(Float, { default: 60 }),
  cols: field(Int, { default: 8 }),
  rows: field(Int, { default: 4 }),
})) {}

export class BoardObject extends via(BoardInput, (field) => ({
  cellStreaks: field([Int]),
  lastScanAt: field(Date).optional(),
})) {}

export class LightBoard extends via(
  BoardObject,
  ["name", "widthCm", "heightCm", "cols", "rows", "cellStreaks", "lastScanAt"] as const,
  (resolve) => ({}),
) {
  cellLabel(cell: number) {
    return `${String.fromCharCode(65 + (cell % this.cols))}${Math.floor(cell / this.cols) + 1}`;
  }

  cellCenterCm(cell: number) {
    return {
      x: Math.round((((cell % this.cols) + 0.5) / this.cols) * this.widthCm),
      y: Math.round(((Math.floor(cell / this.cols) + 0.5) / this.rows) * this.heightCm),
    };
  }
}

export class Board extends via(BoardObject, LightBoard, (resolve) => ({})) {
  static stableScans = 3;
}

export class BoardInsight extends via(Board, (field) => ({})) {}
