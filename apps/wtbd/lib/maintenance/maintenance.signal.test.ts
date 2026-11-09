import { beforeAll, describe, expect, it } from "bun:test";
import { configureSignalTest } from "akanjs/test";

import * as boardSpec from "../_board/board.signal.spec";
import * as cnst from "../cnst";
import * as eraseTaskSpec from "../eraseTask/eraseTask.signal.spec";
import * as maintenanceSpec from "./maintenance.signal.spec";

configureSignalTest({ storage: "memory" });

describe("Maintenance Signal", () => {
  let fetch: boardSpec.AppFetch;
  let reported: cnst.Maintenance;

  beforeAll(async () => {
    fetch = await boardSpec.resetBoard();
  });

  it("opens one request per consumable however often a person reports it", async () => {
    reported = await fetch.requestMaintenance("marker");
    const again = await fetch.requestMaintenance("marker");
    expect(again.id).toBe(reported.id);
    expect(reported).toMatchObject({ consumable: "marker", cause: "reported", status: "open" });
  });

  it("closes a request once a human marks it replaced", async () => {
    const done = await fetch.completeMaintenance(reported.id);
    expect(done.status).toBe("done");
    await expect(fetch.completeMaintenance(reported.id)).rejects.toThrow();
  });

  it("reads a freshly replaced marker as full", async () => {
    expect(await fetch.consumableLevels()).toMatchObject({ markerUsed: 0, markerPercent: 100 });
  });

  it("wears the marker by one use per cell written and the pad by one per erase pass", async () => {
    const before = await fetch.consumableLevels();
    await eraseTaskSpec.dirtyBoard([0, 1, 2]);
    const after = await fetch.consumableLevels();
    expect(after).toMatchObject({
      markerUsed: 3,
      markerPercent: cnst.ConsumableLevels.percentLeft(3, cnst.ConsumableLevels.markerLife),
    });
    expect(after.eraserUsed - before.eraserUsed).toBe(1);
  });

  it("asks for a new marker once its level falls to requestAtPercent", async () => {
    const { markerUsed } = await fetch.consumableLevels();
    const { markerLife, requestAtPercent } = cnst.ConsumableLevels;
    const cellsLeft = Math.ceil((markerLife * (100 - requestAtPercent)) / 100) - markerUsed;
    await eraseTaskSpec.dirtyBoard(Array.from({ length: cellsLeft }, (_, cell) => cell));
    reported = (await maintenanceSpec.openRequestOf(fetch, "marker")) as cnst.Maintenance;
    expect(reported).toMatchObject({ cause: "usage", percent: requestAtPercent });
  });

  it("reads the marker as full again once a human replaces it", async () => {
    await fetch.completeMaintenance(reported.id);
    expect(await fetch.consumableLevels()).toMatchObject({ markerUsed: 0, markerPercent: 100 });
  });

  describe("when a cell stays dirty after every attempt", () => {
    let stain: cnst.LightEraseTask;

    beforeAll(async () => {
      fetch = await eraseTaskSpec.dirtyBoard([0]);
      stain = (await eraseTaskSpec.taskOfCell(fetch, 0)) as cnst.LightEraseTask;
    });

    it("retries the stain on the first two attempts, each retry wearing the pad", async () => {
      const before = await fetch.consumableLevels();
      for (let attempt = 1; attempt < stain.maxAttempts; attempt++) {
        await fetch.reportErased(stain.id);
        await eraseTaskSpec.waitForSettle();
        await boardSpec.submitFrames(fetch, 1);
      }
      expect((await eraseTaskSpec.taskOfCell(fetch, 0))?.attempt).toBe(stain.maxAttempts);
      expect((await fetch.consumableLevels()).eraserUsed - before.eraserUsed).toBe(stain.maxAttempts - 1);
      expect(await maintenanceSpec.openRequestOf(fetch, "eraser")).toBeUndefined();
    }, 10_000);

    it("asks for a new eraser pad when the last attempt fails", async () => {
      await fetch.reportErased(stain.id);
      await eraseTaskSpec.waitForSettle();
      await boardSpec.submitFrames(fetch, 1);
      expect(await maintenanceSpec.openRequestOf(fetch, "eraser")).toMatchObject({ cause: "stillDirty" });
    });
  });
});
