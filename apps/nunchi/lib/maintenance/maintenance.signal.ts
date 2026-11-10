import { LocalOrSignedIn } from "@apps/nunchi/srvkit";
import { endpoint, internal, None, Public, slice } from "akanjs/signal";

import * as cnst from "../cnst";
import * as srv from "../srv";

export class MaintenanceInternal extends internal(srv.maintenance, () => ({})) {}

export class MaintenanceSlice extends slice(
  srv.maintenance,
  { guards: { root: None, get: Public, cru: None } },
  (init) => ({
    inPublic: init({ guards: [Public] })
      .live()
      .exec(function () {
        return this.maintenanceService.queryAny();
      }),
  }),
) {}

export class MaintenanceEndpoint extends endpoint(srv.maintenance, ({ query, mutation, pubsub }) => ({
  consumableLevels: query(cnst.ConsumableLevels, { guards: [Public] }).exec(async function () {
    return await this.maintenanceService.consumableLevels();
  }),

  requestMaintenance: mutation(cnst.Maintenance, { guards: [LocalOrSignedIn] })
    .body("consumable", cnst.Consumable)
    .exec(async function (consumable) {
      return await this.maintenanceService.requestMaintenance(consumable);
    }),

  completeMaintenance: mutation(cnst.Maintenance, {
    guards: [LocalOrSignedIn],
    errors: { 409: ["maintenance.error.notOpen"] },
  })
    .param("maintenanceId", String)
    .exec(async function (maintenanceId) {
      return await this.maintenanceService.completeMaintenance(maintenanceId);
    }),

  consumableLevelsChanged: pubsub(cnst.ConsumableLevels, { guards: [Public] }).exec(() => {}),
})) {}
