import { EraseTask, fetch } from "@apps/wtbd/client";
import { page } from "akanjs/client";

export default page()
  .head(<title>Eraser · wtbd</title>)
  .render(() => {
    const { eraseTaskInitInPublic } = fetch.initEraseTaskInPublic();
    const { maintenanceInitInPublic } = fetch.initMaintenanceInPublic();
    return <EraseTask.Zone.Eraser init={eraseTaskInitInPublic} maintenanceInit={maintenanceInitInPublic} />;
  });
