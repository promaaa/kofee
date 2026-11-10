import { type cnst, Maintenance, usePage } from "@apps/nunchi/client";
import { surfaceRecipe } from "@apps/nunchi/ui";
import type { ModelProps } from "akanjs/client";
import { badgeRecipe } from "akanjs/ui";

export const Card = ({ maintenance }: ModelProps<"maintenance", cnst.LightMaintenance>) => {
  const { l } = usePage();
  return (
    <div className={surfaceRecipe({}, "flex items-center justify-between gap-4")}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="font-bold text-lg">{l(`consumable.${maintenance.consumable}`)}</div>
        <div className="text-muted-foreground text-sm">
          {l(`maintenanceCause.${maintenance.cause}`)} · {maintenance.percent}% {l("maintenance.percentLeft")}
        </div>
      </div>
      {maintenance.isOpen() ? (
        <Maintenance.Util.Complete maintenanceId={maintenance.id} />
      ) : (
        <span className={badgeRecipe({ variant: "success" })}>{l("maintenanceStatus.done")}</span>
      )}
    </div>
  );
};
