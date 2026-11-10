"use client";
import { fetch, st, usePage } from "@apps/nunchi/client";
import { buttonRecipe, Model } from "akanjs/ui";
import { BiTrash } from "react-icons/bi";

interface RemoveProps {
  maintenanceId: string;
}
export const Remove = ({ maintenanceId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={maintenanceId} slice={fetch.slice.maintenance}>
      <BiTrash /> {l("base.remove")}
    </Model.Remove>
  );
};

interface CompleteProps {
  maintenanceId: string;
}
export const Complete = ({ maintenanceId }: CompleteProps) => {
  const { l } = usePage();
  return (
    <button
      type="button"
      className={buttonRecipe({ variant: "primary", size: "lg" }, "shrink-0 touch-manipulation font-bold")}
      onClick={() => st.do.completeMaintenance(maintenanceId)}
    >
      {l("maintenance.markReplaced")}
    </button>
  );
};

interface ReportProps {
  className?: string;
}
export const Report = ({ className }: ReportProps) => {
  const { l } = usePage();
  return (
    <div className={className}>
      <div className="mb-2 font-semibold text-muted-foreground text-sm">{l("maintenance.report")}</div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={buttonRecipe({ variant: "outline", size: "lg" }, "touch-manipulation")}
          onClick={() => st.do.requestMaintenance("marker")}
        >
          {l("maintenance.reportMarker")}
        </button>
        <button
          type="button"
          className={buttonRecipe({ variant: "outline", size: "lg" }, "touch-manipulation")}
          onClick={() => st.do.requestMaintenance("eraser")}
        >
          {l("maintenance.reportEraser")}
        </button>
      </div>
    </div>
  );
};
