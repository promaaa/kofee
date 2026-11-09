import { adapt } from "akanjs/service";

import type { VisionInput, VisionResult } from "./visionResult";

export class MockVisionApi extends adapt("mockVisionApi" as const) {
  static eraseSuccessRate = 0;
  #dirtyCells = new Set<number>();
  #glareCells = new Set<number>();

  analyze({ cols, rows }: VisionInput): VisionResult {
    const toRect = (cell: number) => ({
      x: ((cell % cols) + 0.1) / cols,
      y: (Math.floor(cell / cols) + 0.1) / rows,
      w: 0.8 / cols,
      h: 0.8 / rows,
    });
    const inGrid = (cell: number) => cell < cols * rows;
    return {
      corners: [
        { x: 0.05, y: 0.08 },
        { x: 0.95, y: 0.08 },
        { x: 0.95, y: 0.92 },
        { x: 0.05, y: 0.92 },
      ],
      regions: [...this.#dirtyCells].filter(inGrid).map(toRect),
      unknown: [...this.#glareCells].filter(inGrid).map(toRect),
    };
  }

  setDirt(cell: number, dirty: boolean) {
    MockVisionApi.#toggle(this.#dirtyCells, cell, dirty);
    return dirty;
  }

  setGlare(cell: number, glare: boolean) {
    MockVisionApi.#toggle(this.#glareCells, cell, glare);
    return glare;
  }

  noteErased(cell: number) {
    if (Math.random() < MockVisionApi.eraseSuccessRate) this.#dirtyCells.delete(cell);
  }

  reset() {
    this.#dirtyCells.clear();
    this.#glareCells.clear();
  }

  static #toggle(cells: Set<number>, cell: number, on: boolean) {
    if (on) cells.add(cell);
    else cells.delete(cell);
  }
}
