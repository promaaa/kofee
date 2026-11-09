import type * as boardSpec from "../_board/board.signal.spec";
import type * as cnst from "../cnst";

export const openRequestOf = async (
  fetch: boardSpec.AppFetch,
  consumable: cnst.Consumable["value"],
): Promise<cnst.LightMaintenance | undefined> => {
  const requests = await fetch.maintenanceListInPublic();
  return requests.find((request) => request.consumable === consumable && request.status === "open");
};
