import { LocalOrSignedIn } from "@apps/nunchi/srvkit";
import { Binary } from "akanjs/base";
import { endpoint, internal, Public } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class BoardInternal extends internal(srv.board, () => ({})) {}

export class BoardEndpoint extends endpoint(srv.board, ({ mutation, pubsub }) => ({
  submitFrame: mutation(cnst.BoardScan, { guards: [LocalOrSignedIn], timeout: 10_000, mcp: false })
    .body("frame", Binary)
    .exec(async function (frame) {
      // TODO: https://github.com/akan-team/akanjs/issues/342
      return await this.boardService.submitFrame(new Uint8Array(frame));
    }),
  resetBoard: mutation(Boolean, { guards: [LocalOrSignedIn] }).exec(async function () {
    return await this.boardService.resetBoard();
  }),
  boardFrame: pubsub(Binary, { guards: [Public], mcp: false }).exec(() => {}),
  boardScanned: pubsub(cnst.BoardScan, { guards: [Public] }).exec(() => {}),
})) {}
