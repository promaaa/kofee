import { LocalOrSignedIn } from "@apps/wtbd/srvkit";
import { Binary } from "akanjs/base";
import { endpoint, internal, None, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class BoardInternal extends internal(srv.board, () => ({})) {}

export class BoardSlice extends slice(
  srv.board,
  { guards: { root: None, get: Public, cru: LocalOrSignedIn } },
  (init) => ({
    inPublic: init({ guards: [Public] }).exec(function () {
      return this.boardService.queryAny();
    }),
  }),
) {}

export class BoardEndpoint extends endpoint(srv.board, ({ mutation, pubsub }) => ({
  submitFrame: mutation(cnst.BoardScan, { guards: [LocalOrSignedIn], timeout: 10_000, mcp: false })
    .param("boardId", String)
    .body("frame", Binary)
    .exec(async function (boardId, frame) {
      // TODO: Akan types a Binary body arg as a structural copy of Uint8Array, so it is rebuilt to type-check
      return await this.boardService.submitFrame(boardId, new Uint8Array(frame));
    }),

  boardFrame: pubsub(Binary, { guards: [Public], mcp: false })
    .room("boardId", String)
    .exec(() => {}),

  boardScanned: pubsub(cnst.BoardScan, { guards: [Public] })
    .room("boardId", String)
    .exec(() => {}),
})) {}
