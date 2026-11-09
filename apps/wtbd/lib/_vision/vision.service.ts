import { MockVisionApi, RemoteVisionApi } from "@apps/wtbd/srvkit";
import type { Dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

import * as cnst from "../cnst";
import type * as db from "../db";

export class VisionService extends serve("vision" as const, ({ plug }) => ({
  mockVisionApi: plug(MockVisionApi),
  remoteVisionApi: plug(RemoteVisionApi),
})) {
  async analyze(board: db.Board, frame: Uint8Array<ArrayBuffer>, capturedAt: Dayjs) {
    const startedAt = Date.now();
    const remote = this.remoteVisionApi.isEnabled();
    const input = { boardId: board.id, frame, cols: board.cols, rows: board.rows };
    const result = remote ? await this.remoteVisionApi.analyze(input) : this.mockVisionApi.analyze(input);
    const regions = result?.regions ?? [];
    return new cnst.BoardScan().set({
      source: remote ? "remote" : "mock",
      corners: (result?.corners ?? []).map((corner) => new cnst.BoardPoint().set(corner)),
      regions: regions.map((region) => new cnst.BoardRect().set(region)),
      dirtyCells: board.cellsCoveredBy(regions),
      latencyMs: Date.now() - startedAt,
      capturedAt,
    });
  }

  noteErased(boardId: string, cell: number) {
    if (!this.remoteVisionApi.isEnabled()) this.mockVisionApi.noteErased(boardId, cell);
  }

  setMockDirt(boardId: string, cell: number, dirty: boolean) {
    return this.mockVisionApi.setDirt(boardId, cell, dirty);
  }
}
