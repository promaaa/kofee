import { fetch, Maintenance } from "@apps/wtbd/client";
import { page, usePage } from "akanjs/client";

export default page()
  .head(<title>Human · wtbd</title>)
  .render(() => {
    const { l } = usePage();
    const { maintenanceInitInPublic } = fetch.initMaintenanceInPublic();
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 py-8">
        <header>
          <h1 className="font-black text-3xl">{l("maintenance.humanTitle")}</h1>
          <p className="text-muted-foreground text-sm">{l("maintenance.humanSubtitle")}</p>
        </header>
        <Maintenance.Zone.Levels />
        <Maintenance.Zone.Inbox init={maintenanceInitInPublic} />
      </main>
    );
  });
