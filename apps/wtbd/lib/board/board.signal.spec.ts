import type { DocumentModel } from "akanjs/constant";
import { getOrSetupSignalTestFetch, sampleOf } from "akanjs/test";

import * as cnst from "../cnst";
import type { fetch as appFetch } from "../useServer";

type AppFetch = typeof appFetch;

const getFetch = async () => await getOrSetupSignalTestFetch<AppFetch>();

export const sampleFrame = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

export interface BoardAgent {
  board: cnst.Board;
  fetch: AppFetch;
}

export const createBoard = async (overrides: Partial<DocumentModel<cnst.BoardInput>> = {}): Promise<BoardAgent> => {
  const fetch = await getFetch();
  const board = await fetch.createBoard({ ...sampleOf(cnst.BoardInput), cols: 4, rows: 2, ...overrides });
  return { board, fetch };
};

export const submitFrames = async (agent: BoardAgent, count: number): Promise<cnst.BoardScan> => {
  let scan = new cnst.BoardScan();
  for (let idx = 0; idx < count; idx++) scan = await agent.fetch.submitFrame(agent.board.id, sampleFrame);
  return scan;
};
