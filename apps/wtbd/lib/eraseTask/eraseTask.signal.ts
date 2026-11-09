import { LocalOrSignedIn } from "@apps/wtbd/srvkit";
import { endpoint, internal, None, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class EraseTaskInternal extends internal(srv.eraseTask, ({ interval }) => ({
  failStaleEraseTasks: interval(10_000).exec(async function () {
    await this.eraseTaskService.failStaleEraseTasks();
  }),
})) {}

export class EraseTaskSlice extends slice(
  srv.eraseTask,
  { guards: { root: None, get: Public, cru: None } },
  (init) => ({
    inPublic: init({ guards: [Public] })
      .live()
      .exec(function () {
        return this.eraseTaskService.queryAny();
      }),
  }),
) {}

export class EraseTaskEndpoint extends endpoint(srv.eraseTask, ({ mutation, pubsub }) => ({
  reportErased: mutation(cnst.EraseTask, {
    guards: [LocalOrSignedIn],
    errors: { 409: ["eraseTask.error.notDispatched"] },
  })
    .param("eraseTaskId", String)
    .exec(async function (eraseTaskId) {
      return await this.eraseTaskService.reportErased(eraseTaskId);
    }),

  giveUpEraseTask: mutation(cnst.EraseTask, {
    guards: [LocalOrSignedIn],
    errors: { 409: ["eraseTask.error.notDispatched"] },
  })
    .param("eraseTaskId", String)
    .exec(async function (eraseTaskId) {
      return await this.eraseTaskService.giveUpEraseTask(eraseTaskId);
    }),

  eraseFeedback: pubsub(cnst.EraseTask, { guards: [Public] }).exec(() => {}),
})) {}
