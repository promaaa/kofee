import { dayjs } from "akanjs/base";
import { by, from, into } from "akanjs/document";

import * as cnst from "../cnst";
import { Err } from "../dict";

export class MaintenanceFilter extends from(cnst.Maintenance, (filter) => ({
  query: {
    openOf: filter()
      .arg("consumable", cnst.Consumable)
      .query((consumable) => ({ consumable, status: "open" })),
    doneOf: filter()
      .arg("consumable", cnst.Consumable)
      .query((consumable) => ({ consumable, status: "done" })),
  },
  sort: {
    newest: { createdAt: -1 },
    latestDone: { doneAt: -1 },
  },
})) {}

export class Maintenance extends by(cnst.Maintenance) {
  // open -> done
  complete() {
    if (this.status !== "open") throw new Err("maintenance.error.notOpen");
    this.status = "done";
    this.doneAt = dayjs();
    return this;
  }
}

export class MaintenanceModel extends into(Maintenance, MaintenanceFilter, cnst.maintenance, () => ({})) {}
