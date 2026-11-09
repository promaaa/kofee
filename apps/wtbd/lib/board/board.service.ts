import { dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

import * as cnst from "../cnst";
import * as db from "../db";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class BoardService extends serve(db.board, ({ service, signal }) => ({
  visionService: service<srv.VisionService>(),
  eraseTaskService: service<srv.EraseTaskService>(),
  boardSignal: signal<sig.Board>(),
})) {
  private readonly scanningBoardIds = new Set<string>();

  async submitFrame(boardId: string, frame: Uint8Array<ArrayBuffer>) {
    if (this.scanningBoardIds.has(boardId)) return new cnst.BoardScan();
    this.scanningBoardIds.add(boardId);
    try {
      const capturedAt = dayjs();
      const board = await this.getBoard(boardId);
      this.boardSignal.boardFrame(boardId, frame);
      const scan = await this.visionService.analyze(board, frame, capturedAt);
      this.boardSignal.boardScanned(boardId, scan);
      if (!scan.isUsable()) return scan;
      const scannedBoard = await board.recordScan(scan.dirtyCells, capturedAt).save();
      await this.eraseTaskService.reconcileBoard(scannedBoard, scan);
      return scan;
    } finally {
      this.scanningBoardIds.delete(boardId);
    }
  }
}
