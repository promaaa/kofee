import type { Dayjs } from "akanjs/base";
import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";

export class BoardFilter extends from(cnst.Board, (filter) => ({
  query: {},
  sort: {},
})) {}

export class Board extends by(cnst.Board) {
  // any -> any: each cell's streak extends while it keeps its dirty/clean reading and restarts at ±1 when it flips
  recordScan(dirtyCells: number[], capturedAt: Dayjs) {
    const dirty = new Set(dirtyCells);
    this.cellStreaks = Array.from({ length: this.cols * this.rows }, (_, cell) => {
      const streak = this.cellStreaks[cell] ?? 0;
      return dirty.has(cell) ? Math.max(streak, 0) + 1 : Math.min(streak, 0) - 1;
    });
    this.lastScanAt = capturedAt;
    return this;
  }

  cellRect(cell: number) {
    return {
      x: (cell % this.cols) / this.cols,
      y: Math.floor(cell / this.cols) / this.rows,
      w: 1 / this.cols,
      h: 1 / this.rows,
    };
  }

  cellsCoveredBy(regions: { x: number; y: number; w: number; h: number }[]) {
    const cells = new Set<number>();
    for (const region of regions) {
      const left = Math.max(0, Math.floor(region.x * this.cols));
      const right = Math.min(this.cols - 1, Math.ceil((region.x + region.w) * this.cols) - 1);
      const top = Math.max(0, Math.floor(region.y * this.rows));
      const bottom = Math.min(this.rows - 1, Math.ceil((region.y + region.h) * this.rows) - 1);
      for (let row = top; row <= bottom; row++)
        for (let col = left; col <= right; col++) cells.add(row * this.cols + col);
    }
    return [...cells].sort((a, b) => a - b);
  }

  isStablyClean(cell: number) {
    return (this.cellStreaks[cell] ?? 0) <= -cnst.Board.stableScans;
  }

  stablyDirtyCells() {
    return this.cellStreaks.flatMap((streak, cell) => (streak >= cnst.Board.stableScans ? [cell] : []));
  }
}

export class BoardModel extends into(Board, BoardFilter, cnst.board, () => ({})) {}
