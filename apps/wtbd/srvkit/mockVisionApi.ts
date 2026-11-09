import { adapt } from "akanjs/service";

import type { VisionInput, VisionResult } from "./visionResult";

export class MockVisionApi extends adapt("mockVisionApi" as const) {
  static eraseSuccessRate = 0.7;
  #dirtyCellsByBoard = new Map<string, Set<number>>();

  analyze({ boardId, cols, rows }: VisionInput): VisionResult {
    const cells = [...this.#dirtyCellsOf(boardId)].filter((cell) => cell < cols * rows);
    return {
      corners: [
        { x: 0.05, y: 0.08 },
        { x: 0.95, y: 0.08 },
        { x: 0.95, y: 0.92 },
        { x: 0.05, y: 0.92 },
      ],
      regions: cells.map((cell) => ({
        x: ((cell % cols) + 0.1) / cols,
        y: (Math.floor(cell / cols) + 0.1) / rows,
        w: 0.8 / cols,
        h: 0.8 / rows,
      })),
    };
  }

  setDirt(boardId: string, cell: number, dirty: boolean) {
    if (dirty) this.#dirtyCellsOf(boardId).add(cell);
    else this.#dirtyCellsOf(boardId).delete(cell);
    return dirty;
  }

  noteErased(boardId: string, cell: number) {
    if (Math.random() < MockVisionApi.eraseSuccessRate) this.#dirtyCellsOf(boardId).delete(cell);
  }

  #dirtyCellsOf(boardId: string) {
    const cells = this.#dirtyCellsByBoard.get(boardId) ?? new Set<number>();
    this.#dirtyCellsByBoard.set(boardId, cells);
    return cells;
  }
}
