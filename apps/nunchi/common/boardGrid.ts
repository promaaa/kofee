export interface BoardArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class BoardGrid {
  static widthCm = 112;
  static heightCm = 49;
  static cols = 8;
  static rows = 4;
  static stableMs = 1_000;

  static cellCount() {
    return BoardGrid.cols * BoardGrid.rows;
  }

  static cellLabel(cell: number) {
    return `${String.fromCharCode(65 + (cell % BoardGrid.cols))}${Math.floor(cell / BoardGrid.cols) + 1}`;
  }

  static cellCenterCm(cell: number) {
    return {
      x: Math.round((((cell % BoardGrid.cols) + 0.5) / BoardGrid.cols) * BoardGrid.widthCm),
      y: Math.round(((Math.floor(cell / BoardGrid.cols) + 0.5) / BoardGrid.rows) * BoardGrid.heightCm),
    };
  }

  static cellRect(cell: number): BoardArea {
    return {
      x: (cell % BoardGrid.cols) / BoardGrid.cols,
      y: Math.floor(cell / BoardGrid.cols) / BoardGrid.rows,
      w: 1 / BoardGrid.cols,
      h: 1 / BoardGrid.rows,
    };
  }

  static cellsCoveredBy(areas: BoardArea[]) {
    const cells = new Set<number>();
    for (const area of areas) {
      const left = Math.max(0, Math.floor(area.x * BoardGrid.cols));
      const right = Math.min(BoardGrid.cols - 1, Math.ceil((area.x + area.w) * BoardGrid.cols) - 1);
      const top = Math.max(0, Math.floor(area.y * BoardGrid.rows));
      const bottom = Math.min(BoardGrid.rows - 1, Math.ceil((area.y + area.h) * BoardGrid.rows) - 1);
      for (let row = top; row <= bottom; row++)
        for (let col = left; col <= right; col++) cells.add(row * BoardGrid.cols + col);
    }
    return [...cells].sort((a, b) => a - b);
  }
}
