import { store } from "akanjs/store";

import type * as cnst from "../cnst";
import { fetch, sig } from "../useClient";

export class MaintenanceStore extends store(sig.maintenance, () => ({
  // state
})) {
  async requestMaintenance(consumable: cnst.Consumable["value"]) {
    await fetch.requestMaintenance(consumable);
  }

  async completeMaintenance(maintenanceId: string) {
    await fetch.completeMaintenance(maintenanceId);
  }
}
