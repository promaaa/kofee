import { store } from "akanjs/store";

import { fetch } from "../useClient";

export class VisionStore extends store("vision" as const, () => ({
  mockDirtyCells: [] as number[],
  mockGlareCells: [] as number[],
})) {
  async setMockDirt(cell: number, dirty: boolean) {
    await fetch.setMockDirt(cell, dirty);
    const cells = this.get().mockDirtyCells.filter((each) => each !== cell);
    this.set({ mockDirtyCells: dirty ? [...cells, cell] : cells });
  }

  async setMockGlare(cell: number, glare: boolean) {
    await fetch.setMockGlare(cell, glare);
    const cells = this.get().mockGlareCells.filter((each) => each !== cell);
    this.set({ mockGlareCells: glare ? [...cells, cell] : cells });
  }

  async resetBoard() {
    await fetch.resetBoard();
    this.set({ mockDirtyCells: [], mockGlareCells: [] });
  }
}
