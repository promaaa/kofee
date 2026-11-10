import { BoardGrid } from "@apps/nunchi/common";
import { MockVisionApi, RemoteVisionApi } from "@apps/nunchi/srvkit";
import type { Dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

import * as cnst from "../cnst";

export class VisionService extends serve("vision" as const, ({ plug }) => ({
  mockVisionApi: plug(MockVisionApi),
  remoteVisionApi: plug(RemoteVisionApi),
})) {
  async analyze(frame: Uint8Array<ArrayBuffer>, capturedAt: Dayjs) {
    const startedAt = Date.now();
    const remote = this.remoteVisionApi.isEnabled();
    const input = { frame, cols: BoardGrid.cols, rows: BoardGrid.rows };
    const result = remote ? await this.remoteVisionApi.analyze(input) : this.mockVisionApi.analyze(input);
    const regions = result?.regions ?? [];
    const unknownCells = BoardGrid.cellsCoveredBy(result?.unknown ?? []);
    const unknown = new Set(unknownCells);
    return new cnst.BoardScan().set({
      source: remote ? "remote" : "mock",
      corners: (result?.corners ?? []).map((corner) => new cnst.BoardPoint().set(corner)),
      regions: regions.map((region) => new cnst.BoardRect().set(region)),
      dirtyCells: BoardGrid.cellsCoveredBy(regions).filter((cell) => !unknown.has(cell)),
      unknownCells,
      latencyMs: Date.now() - startedAt,
      capturedAt,
    });
  }

  async algorithmView() {
    if (!this.remoteVisionApi.isEnabled()) return new Uint8Array();
    return (await this.remoteVisionApi.algorithmView()) ?? new Uint8Array();
  }

  noteErased(cell: number) {
    if (!this.remoteVisionApi.isEnabled()) this.mockVisionApi.noteErased(cell);
  }

  setMockDirt(cell: number, dirty: boolean) {
    return this.mockVisionApi.setDirt(cell, dirty);
  }

  setMockGlare(cell: number, glare: boolean) {
    return this.mockVisionApi.setGlare(cell, glare);
  }

  resetMock() {
    this.mockVisionApi.reset();
  }
}
