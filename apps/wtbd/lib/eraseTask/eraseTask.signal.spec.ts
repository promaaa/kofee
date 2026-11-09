import * as boardSpec from "../board/board.signal.spec";
import * as cnst from "../cnst";

export const listTasks = async (agent: boardSpec.BoardAgent): Promise<cnst.LightEraseTask[]> => {
  return await agent.fetch.eraseTaskListInBoard(agent.board.id);
};

export const taskOfCell = async (
  agent: boardSpec.BoardAgent,
  cell: number,
): Promise<cnst.LightEraseTask | undefined> => {
  const tasks = await listTasks(agent);
  return tasks.find((task) => task.cell === cell && ["pending", "dispatched", "verifying"].includes(task.status));
};

export const dirtyBoard = async (cells: number[]): Promise<boardSpec.BoardAgent> => {
  const agent = await boardSpec.createBoard();
  for (const cell of cells) await agent.fetch.setMockDirt(agent.board.id, cell, true);
  await boardSpec.submitFrames(agent, cnst.Board.stableScans);
  return agent;
};

export const waitForSettle = async (): Promise<void> => {
  await Bun.sleep(cnst.EraseTask.settleMs + 100);
};
