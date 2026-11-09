import { type Dayjs, dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

import * as cnst from "../cnst";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class BoardService extends serve("board" as const, ({ service, signal }) => ({
  visionService: service<srv.VisionService>(),
  eraseTaskService: service<srv.EraseTaskService>(),
  maintenanceService: service<srv.MaintenanceService>(),
  boardSignal: signal<sig.Board>(),
})) {
  private cellStreaks: number[] = [];
  private foldedAt: Dayjs | null = null;
  private isScanning: boolean = false;

  async submitFrame(frame: Uint8Array<ArrayBuffer>) {
    if (this.isScanning) return new cnst.BoardScan();
    const capturedAt = dayjs();
    this.isScanning = true;
    try {
      this.boardSignal.boardFrame(frame);
      const scan = await this.visionService.analyze(frame, capturedAt);
      if (scan.isUsable()) {
        const elapsedMs = this.foldedAt ? capturedAt.diff(this.foldedAt) : 0;
        this.cellStreaks = scan.foldStreaks(this.cellStreaks, elapsedMs).cellStreaks;
        this.foldedAt = capturedAt;
        await this.eraseTaskService.reconcileBoard(scan);
        await this.maintenanceService.checkConsumables();
      } else scan.set({ cellStreaks: this.cellStreaks });
      this.boardSignal.boardScanned(scan);
      return scan;
    } finally {
      this.isScanning = false;
    }
  }

  async resetBoard() {
    this.cellStreaks = [];
    this.foldedAt = null;
    this.visionService.resetMock();
    await this.eraseTaskService.cancelOpenEraseTasks();
    return true;
  }
}
