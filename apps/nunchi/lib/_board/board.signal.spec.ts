import { BoardGrid } from "@apps/nunchi/common";
import { getOrSetupSignalTestFetch } from "akanjs/test";

import * as cnst from "../cnst";
import type { fetch as appFetch } from "../useServer";

export type AppFetch = typeof appFetch;

export const sampleFrame = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

export const resetBoard = async (): Promise<AppFetch> => {
  const fetch = await getOrSetupSignalTestFetch<AppFetch>();
  await fetch.resetBoard();
  return fetch;
};

export const submitFrames = async (fetch: AppFetch, count: number): Promise<cnst.BoardScan> => {
  let scan = new cnst.BoardScan();
  for (let idx = 0; idx < count; idx++) scan = await fetch.submitFrame(sampleFrame);
  return scan;
};

export const waitForStable = async (): Promise<void> => {
  await Bun.sleep(BoardGrid.stableMs + 50);
};

export const submitStableFrames = async (fetch: AppFetch): Promise<cnst.BoardScan> => {
  await fetch.submitFrame(sampleFrame);
  await waitForStable();
  return await fetch.submitFrame(sampleFrame);
};
