import { beforeAll, describe, expect, it } from "bun:test";
import { configureSignalTest } from "akanjs/test";

import * as boardSpec from "../_board/board.signal.spec";
import type * as cnst from "../cnst";
import * as eraseTaskSpec from "./eraseTask.signal.spec";

configureSignalTest({ storage: "memory" });

describe("EraseTask Signal", () => {
  let fetch: boardSpec.AppFetch;
  let task: cnst.LightEraseTask;

  beforeAll(async () => {
    fetch = await boardSpec.resetBoard();
  });

  it("creates no task while a cell has read dirty for less than stableMs", async () => {
    await fetch.setMockDirt(5, true);
    const scan = await boardSpec.submitFrames(fetch, 2);
    expect(scan.dirtyCells).toEqual([5]);
    expect(await eraseTaskSpec.listTasks(fetch)).toHaveLength(0);
  });

  it("dispatches a task once the cell has read dirty for stableMs", async () => {
    await boardSpec.waitForStable();
    await boardSpec.submitFrames(fetch, 1);
    const dispatched = await eraseTaskSpec.taskOfCell(fetch, 5);
    expect(dispatched).toMatchObject({ status: "dispatched", attempt: 1 });
    expect(dispatched?.target).toMatchObject({ x: 0.625, y: 0, w: 0.125, h: 0.25 });
    task = dispatched as cnst.LightEraseTask;
  });

  it("keeps one open task per cell however many dirty frames follow", async () => {
    await boardSpec.submitFrames(fetch, 2);
    const tasks = await eraseTaskSpec.listTasks(fetch);
    expect(tasks.filter((each) => each.cell === 5)).toHaveLength(1);
  });

  it("does not judge a report with a frame from before the settle delay", async () => {
    const reported = await fetch.reportErased(task.id);
    expect(reported.status).toBe("verifying");
    await fetch.setMockDirt(5, true);
    await boardSpec.submitFrames(fetch, 1);
    expect((await eraseTaskSpec.taskOfCell(fetch, 5))?.status).toBe("verifying");
  });

  it("sends retry and re-dispatches when the cell still reads dirty", async () => {
    await eraseTaskSpec.waitForSettle();
    await boardSpec.submitFrames(fetch, 1);
    expect(await eraseTaskSpec.taskOfCell(fetch, 5)).toMatchObject({
      status: "dispatched",
      feedback: "retry",
      attempt: 2,
    });
  });

  it("sends success once the cell reads clean", async () => {
    await fetch.reportErased(task.id);
    await fetch.setMockDirt(5, false);
    await eraseTaskSpec.waitForSettle();
    await boardSpec.submitFrames(fetch, 1);
    const tasks = await eraseTaskSpec.listTasks(fetch);
    expect(tasks.find((each) => each.id === task.id)).toMatchObject({ status: "succeeded", feedback: "success" });
  });

  it("refuses a Done report for a task that is not dispatched", async () => {
    await expect(fetch.reportErased(task.id)).rejects.toThrow();
  });

  describe("with several dirty cells", () => {
    let queued: boardSpec.AppFetch;

    beforeAll(async () => {
      queued = await eraseTaskSpec.dirtyBoard([0, 1, 2]);
    });

    it("dispatches the oldest task and queues the rest", async () => {
      const tasks = await eraseTaskSpec.listTasks(queued);
      expect(tasks.filter((each) => each.status === "dispatched")).toHaveLength(1);
      expect(tasks.filter((each) => each.status === "pending")).toHaveLength(2);
    });

    it("cancels a pending task whose cell reads stably clean", async () => {
      const pending = (await eraseTaskSpec.listTasks(queued)).filter((each) => each.status === "pending");
      const cleaned = pending[pending.length - 1] as cnst.LightEraseTask;
      await queued.setMockDirt(cleaned.cell, false);
      await boardSpec.submitStableFrames(queued);
      const tasks = await eraseTaskSpec.listTasks(queued);
      expect(tasks.find((each) => each.id === cleaned.id)?.status).toBe("canceled");
    });

    it("fails a task the eraser cannot reach and dispatches the next one", async () => {
      const active = (await eraseTaskSpec.listTasks(queued)).find((each) => each.status === "dispatched");
      const failed = await queued.giveUpEraseTask((active as cnst.LightEraseTask).id);
      expect(failed).toMatchObject({ status: "failed", feedback: "failed", failReason: "unreachable" });
      const tasks = await eraseTaskSpec.listTasks(queued);
      expect(tasks.filter((each) => each.status === "dispatched")).toHaveLength(1);
    });

    it("does not re-task a failed cell during the cooldown", async () => {
      const failedTask = (await eraseTaskSpec.listTasks(queued)).find((each) => each.status === "failed");
      await boardSpec.submitStableFrames(queued);
      expect(await eraseTaskSpec.taskOfCell(queued, (failedTask as cnst.LightEraseTask).cell)).toBeUndefined();
    });
  });

  describe("with glare over the cell", () => {
    let glared: boardSpec.AppFetch;
    let glaredTask: cnst.LightEraseTask;

    beforeAll(async () => {
      glared = await eraseTaskSpec.dirtyBoard([3]);
      glaredTask = (await eraseTaskSpec.taskOfCell(glared, 3)) as cnst.LightEraseTask;
    });

    it("reads a glared cell as unknown rather than clean", async () => {
      await glared.reportErased(glaredTask.id);
      await glared.setMockDirt(3, false);
      await glared.setMockGlare(3, true);
      await eraseTaskSpec.waitForSettle();
      const scan = await boardSpec.submitFrames(glared, 1);
      expect(scan).toMatchObject({ dirtyCells: [], unknownCells: [3] });
    });

    it("leaves the task verifying while its cell reads unknown", async () => {
      expect((await eraseTaskSpec.taskOfCell(glared, 3))?.status).toBe("verifying");
    });

    it("judges the task once the glare clears", async () => {
      await glared.setMockGlare(3, false);
      await boardSpec.submitFrames(glared, 1);
      const tasks = await eraseTaskSpec.listTasks(glared);
      expect(tasks.find((each) => each.id === glaredTask.id)?.status).toBe("succeeded");
    });
  });
});
