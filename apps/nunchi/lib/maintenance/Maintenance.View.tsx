import { type cnst, usePage } from "@apps/nunchi/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  maintenance: cnst.Maintenance;
}
export const General = ({ className, maintenance }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn("w-full", className)}>
      <div>
        {l("maintenance.consumable")}: {l(`consumable.${maintenance.consumable}`)}
      </div>
      <div>
        {l("maintenance.cause")}: {l(`maintenanceCause.${maintenance.cause}`)}
      </div>
      <div>
        {l("maintenance.status")}: {l(`maintenanceStatus.${maintenance.status}`)}
      </div>
    </div>
  );
};
