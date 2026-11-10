import * as boardSpec from "../_board/board.signal.spec";
import type * as cnst from "../cnst";

export const listTasks = async (fetch: boardSpec.AppFetch): Promise<cnst.LightEraseTask[]> => {
  return await fetch.eraseTaskListInPublic();
};

export const taskOfCell = async (fetch: boardSpec.AppFetch, cell: number): Promise<cnst.LightEraseTask | undefined> => {
  const tasks = await listTasks(fetch);
  return tasks.find((task) => task.cell === cell && ["pending", "dispatched", "verifying"].includes(task.status));
};

export const dirtyBoard = async (cells: number[]): Promise<boardSpec.AppFetch> => {
  const fetch = await boardSpec.resetBoard();
  for (const cell of cells) await fetch.setMockDirt(cell, true);
  await boardSpec.submitStableFrames(fetch);
  return fetch;
};

export const waitForSettle = async (): Promise<void> => {
  await Bun.sleep(1_600);
};
