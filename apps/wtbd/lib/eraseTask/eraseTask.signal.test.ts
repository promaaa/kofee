import { beforeAll, describe, expect, it } from "bun:test";
import { configureSignalTest } from "akanjs/test";

import * as boardSpec from "../board/board.signal.spec";
import type * as cnst from "../cnst";
import * as eraseTaskSpec from "./eraseTask.signal.spec";

configureSignalTest({ storage: "memory" });

describe("EraseTask Signal", () => {
  let agent: boardSpec.BoardAgent;
  let task: cnst.LightEraseTask;

  beforeAll(async () => {
    agent = await boardSpec.createBoard();
  });

  it("creates no task while a cell has read dirty for fewer than stableScans frames", async () => {
    await agent.fetch.setMockDirt(agent.board.id, 5, true);
    const scan = await boardSpec.submitFrames(agent, 2);
    expect(scan.dirtyCells).toEqual([5]);
    expect(await eraseTaskSpec.listTasks(agent)).toHaveLength(0);
  });

  it("dispatches a task for the cell on the stableScans-th dirty frame", async () => {
    await boardSpec.submitFrames(agent, 1);
    const dispatched = await eraseTaskSpec.taskOfCell(agent, 5);
    expect(dispatched).toMatchObject({ status: "dispatched", attempt: 1 });
    expect(dispatched?.target).toMatchObject({ x: 0.25, y: 0.5, w: 0.25, h: 0.5 });
    task = dispatched as cnst.LightEraseTask;
  });

  it("keeps one open task per cell however many dirty frames follow", async () => {
    await boardSpec.submitFrames(agent, 2);
    const tasks = await eraseTaskSpec.listTasks(agent);
    expect(tasks.filter((each) => each.cell === 5)).toHaveLength(1);
  });

  it("does not judge a report with a frame from before the settle delay", async () => {
    const reported = await agent.fetch.reportErased(task.id);
    expect(reported.status).toBe("verifying");
    await agent.fetch.setMockDirt(agent.board.id, 5, true);
    await boardSpec.submitFrames(agent, 1);
    expect((await eraseTaskSpec.taskOfCell(agent, 5))?.status).toBe("verifying");
  });

  it("sends retry and re-dispatches when the cell still reads dirty", async () => {
    await eraseTaskSpec.waitForSettle();
    await boardSpec.submitFrames(agent, 1);
    expect(await eraseTaskSpec.taskOfCell(agent, 5)).toMatchObject({
      status: "dispatched",
      feedback: "retry",
      attempt: 2,
    });
  });

  it("sends success once the cell reads clean", async () => {
    await agent.fetch.reportErased(task.id);
    await agent.fetch.setMockDirt(agent.board.id, 5, false);
    await eraseTaskSpec.waitForSettle();
    await boardSpec.submitFrames(agent, 1);
    const tasks = await eraseTaskSpec.listTasks(agent);
    expect(tasks.find((each) => each.id === task.id)).toMatchObject({ status: "succeeded", feedback: "success" });
  });

  it("refuses a Done report for a task that is not dispatched", async () => {
    await expect(agent.fetch.reportErased(task.id)).rejects.toThrow();
  });

  describe("with several dirty cells", () => {
    let queued: boardSpec.BoardAgent;

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
      await queued.fetch.setMockDirt(queued.board.id, cleaned.cell, false);
      await boardSpec.submitFrames(queued, 3);
      const tasks = await eraseTaskSpec.listTasks(queued);
      expect(tasks.find((each) => each.id === cleaned.id)?.status).toBe("canceled");
    });

    it("fails a task the eraser cannot reach and dispatches the next one", async () => {
      const active = (await eraseTaskSpec.listTasks(queued)).find((each) => each.status === "dispatched");
      const failed = await queued.fetch.giveUpEraseTask((active as cnst.LightEraseTask).id);
      expect(failed).toMatchObject({ status: "failed", feedback: "failed", failReason: "unreachable" });
      const tasks = await eraseTaskSpec.listTasks(queued);
      expect(tasks.filter((each) => each.status === "dispatched")).toHaveLength(1);
    });

    it("does not re-task a failed cell during the cooldown", async () => {
      const failedTask = (await eraseTaskSpec.listTasks(queued)).find((each) => each.status === "failed");
      await boardSpec.submitFrames(queued, 3);
      expect(await eraseTaskSpec.taskOfCell(queued, (failedTask as cnst.LightEraseTask).cell)).toBeUndefined();
    });
  });
});
