import { EraseTask, fetch } from "@apps/nunchi/client";
import { page } from "akanjs/client";

export default page()
  .head(<title>Eraser · NUNCHI</title>)
  .render(() => {
    const { eraseTaskInitInPublic } = fetch.initEraseTaskInPublic();
    const { maintenanceInitInPublic } = fetch.initMaintenanceInPublic();
    return <EraseTask.Zone.Eraser init={eraseTaskInitInPublic} maintenanceInit={maintenanceInitInPublic} />;
  });
