import { BoardGrid } from "@apps/nunchi/common";
import { dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

import * as cnst from "../cnst";
import * as db from "../db";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class EraseTaskService extends serve(db.eraseTask, ({ service, signal }) => ({
  visionService: service<srv.VisionService>(),
  eraseTaskSignal: signal<sig.EraseTask>(),
})) {
  async reconcileBoard(scan: cnst.BoardScan) {
    const dirtyCells = new Set(scan.dirtyCells);
    const unknownCells = new Set(scan.unknownCells);
    const openTasks = await this.listOpen();
    for (const task of openTasks) {
      if (unknownCells.has(task.cell)) continue;
      if (task.canBeJudgedWith(scan.capturedAt)) await this._judge(task, dirtyCells.has(task.cell), scan);
      else if (task.status === "pending" && scan.isStablyClean(task.cell)) await task.cancel().save();
    }
    const cooldownSince = dayjs().subtract(cnst.EraseTask.retaskCooldownMs, "ms");
    const recentlyFailed = await this.listFailedSince(cooldownSince);
    const skipCells = new Set([...openTasks, ...recentlyFailed].map((task) => task.cell));
    const newCells = scan.stablyDirtyCells().filter((cell) => !skipCells.has(cell));
    if (newCells.length)
      await this.createEraseTaskMany(newCells.map((cell) => ({ cell, target: BoardGrid.cellRect(cell) })));
    await this.dispatchNext();
  }

  async dispatchNext() {
    const openTasks = await this.listOpen();
    if (openTasks.some((task) => task.isActive())) return;
    const next = openTasks
      .filter((task) => task.status === "pending")
      .sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())[0];
    if (next) await next.dispatch().save();
  }

  async reportErased(eraseTaskId: string) {
    const task = await this.getEraseTask(eraseTaskId);
    const reported = await task.reportErased().save();
    this.visionService.noteErased(reported.cell);
    return reported;
  }

  async giveUpEraseTask(eraseTaskId: string) {
    const task = await this.getEraseTask(eraseTaskId);
    const failed = await task.giveUp("unreachable").save();
    this.eraseTaskSignal.eraseFeedback(failed);
    await this.dispatchNext();
    return failed;
  }

  async failStaleEraseTasks() {
    const before = dayjs().subtract(cnst.EraseTask.dispatchTimeoutMs, "ms");
    const staleTasks = await this.listDispatchedBefore(before);
    for (const task of staleTasks) {
      const failed = await task.giveUp("timeout").save();
      this.eraseTaskSignal.eraseFeedback(failed);
    }
    if (staleTasks.length) await this.dispatchNext();
  }

  async cancelOpenEraseTasks() {
    const openTasks = await this.listOpen();
    for (const task of openTasks) await task.cancel().save();
  }

  private async _judge(task: db.EraseTask, stillDirty: boolean, scan: cnst.BoardScan) {
    const judged = await task.judge(stillDirty, scan.capturedAt).save();
    this.eraseTaskSignal.eraseFeedback(judged);
  }
}
