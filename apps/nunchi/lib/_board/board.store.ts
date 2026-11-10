import { store } from "akanjs/store";

import type * as cnst from "../cnst";
import { fetch } from "../useClient";

export class BoardStore extends store("board" as const, () => ({
  boardScan: null as cnst.BoardScan | null,
})) {
  static silent = ["submitFrame"];

  async submitFrame(frame: Uint8Array<ArrayBuffer>) {
    const boardScan = await fetch.submitFrame(frame);
    this.set({ boardScan });
  }
}
