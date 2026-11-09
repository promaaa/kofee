import { dayjs } from "akanjs/base";
import { serve } from "akanjs/service";

import * as cnst from "../cnst";
import * as db from "../db";
import type * as sig from "../sig";
import type * as srv from "../srv";

export class MaintenanceService extends serve(db.maintenance, ({ service, signal }) => ({
  eraseTaskService: service<srv.EraseTaskService>(),
  maintenanceSignal: signal<sig.Maintenance>(),
})) {
  private publishedLevels = "";

  async consumableLevels() {
    const [markerSwapAt, eraserSwapAt] = await Promise.all([this._lastSwapAt("marker"), this._lastSwapAt("eraser")]);
    const [ink, passes] = await Promise.all([
      this.eraseTaskService.insightCreatedSince(markerSwapAt),
      this.eraseTaskService.insightDispatchedSince(eraserSwapAt),
    ]);
    return cnst.ConsumableLevels.of(ink.count, passes.attempts);
  }

  async checkConsumables() {
    const levels = await this.consumableLevels();
    await this._checkConsumable("marker", levels.markerPercent);
    await this._checkConsumable("eraser", levels.eraserPercent);
    this._publishLevels(levels);
  }

  async requestMaintenance(consumable: cnst.Consumable["value"]) {
    const open = await this.findOpenOf(consumable);
    if (open) return open;
    const percent = this._percentOf(consumable, await this.consumableLevels());
    return await this.createMaintenance({ consumable, cause: "reported", percent });
  }

  async completeMaintenance(maintenanceId: string) {
    const maintenance = await this.getMaintenance(maintenanceId);
    const done = await maintenance.complete().save();
    this._publishLevels(await this.consumableLevels());
    return done;
  }

  private async _checkConsumable(consumable: cnst.Consumable["value"], percent: number) {
    if (await this.existsOpenOf(consumable)) return;
    const cause = await this._causeOf(consumable, percent);
    if (cause) await this.createMaintenance({ consumable, cause, percent });
  }

  private async _causeOf(
    consumable: cnst.Consumable["value"],
    percent: number,
  ): Promise<cnst.MaintenanceCause["value"] | null> {
    if (consumable === "eraser") {
      const stillDirty = await this.eraseTaskService.existsStillDirtySince(await this._lastSwapAt("eraser"));
      if (stillDirty) return "stillDirty";
    }
    return percent <= cnst.ConsumableLevels.requestAtPercent ? "usage" : null;
  }

  private _publishLevels(levels: cnst.ConsumableLevels) {
    const published = JSON.stringify([levels.markerUsed, levels.eraserUsed]);
    if (published === this.publishedLevels) return;
    this.publishedLevels = published;
    this.maintenanceSignal.consumableLevelsChanged(levels);
  }

  private _percentOf(consumable: cnst.Consumable["value"], levels: cnst.ConsumableLevels) {
    return consumable === "marker" ? levels.markerPercent : levels.eraserPercent;
  }

  private async _lastSwapAt(consumable: cnst.Consumable["value"]) {
    const lastDone = await this.findDoneOf(consumable, { sort: "latestDone" });
    return lastDone?.doneAt ?? dayjs(0);
  }
}
