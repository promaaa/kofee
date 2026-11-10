import { enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

export class Consumable extends enumOf("consumable", ["marker", "eraser"] as const) {}

export class MaintenanceCause extends enumOf("maintenanceCause", ["usage", "stillDirty", "reported"] as const) {}

export class MaintenanceStatus extends enumOf("maintenanceStatus", ["open", "done"] as const) {}

export class MaintenanceInput extends via((field) => ({
  consumable: field(Consumable),
  cause: field(MaintenanceCause),
  percent: field(Int, { default: 100 }), // share of the consumable's life left when the request opened
})) {}

export class MaintenanceObject extends via(MaintenanceInput, (field) => ({
  status: field(MaintenanceStatus, { default: "open" }),
  doneAt: field(Date).optional(),
})) {}

export class LightMaintenance extends via(
  MaintenanceObject,
  ["consumable", "cause", "percent", "status", "doneAt"] as const,
  (resolve) => ({}),
) {
  isOpen() {
    return this.status === "open";
  }
}

export class Maintenance extends via(MaintenanceObject, LightMaintenance, (resolve) => ({})) {}

export class MaintenanceInsight extends via(Maintenance, (field) => ({})) {}
