import { endpoint, internal, None, Public, slice } from "akanjs/signal";

import * as srv from "../srv";

export class BoardInternal extends internal(srv.board, ({ interval }) => ({})) {}

export class BoardSlice extends slice(srv.board, { guards: { root: None, get: Public, cru: None } }, (init) => ({
  inPublic: init({ guards: [Public] }).exec(function () {
    return this.boardService.queryAny();
  }),
})) {}

export class BoardEndpoint extends endpoint(srv.board, ({ query, mutation }) => ({})) {}
