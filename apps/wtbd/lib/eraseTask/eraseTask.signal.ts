import { endpoint, internal, None, Public, slice } from "akanjs/signal";

import * as srv from "../srv";

export class EraseTaskInternal extends internal(srv.eraseTask, ({ interval }) => ({})) {}

export class EraseTaskSlice extends slice(
  srv.eraseTask,
  { guards: { root: None, get: Public, cru: None } },
  (init) => ({
    inPublic: init({ guards: [Public] }).exec(function () {
      return this.eraseTaskService.queryAny();
    }),
  }),
) {}

export class EraseTaskEndpoint extends endpoint(srv.eraseTask, ({ query, mutation }) => ({})) {}
