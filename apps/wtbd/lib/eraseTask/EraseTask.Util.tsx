"use client";
import { type cnst, fetch, st, usePage } from "@apps/wtbd/client";
import { jellyButtonRecipe } from "@apps/wtbd/ui";
import { cn } from "akanjs/client";
import { Model } from "akanjs/ui";
import { BiTrash } from "react-icons/bi";

interface RemoveProps {
  eraseTaskId: string;
}
export const Remove = ({ eraseTaskId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={eraseTaskId} slice={fetch.slice.eraseTask}>
      <BiTrash /> {l("base.remove")}
    </Model.Remove>
  );
};

interface EraserControlsProps {
  className?: string;
  eraseTaskId: string;
  status: cnst.EraseTaskStatus["value"];
}
export const EraserControls = ({ className, eraseTaskId, status }: EraserControlsProps) => {
  const { l } = usePage();
  const waiting = status !== "dispatched";
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        disabled={waiting}
        className={jellyButtonRecipe({ variant: "primary", size: "xl" }, "h-28 w-full text-4xl")}
        onClick={() => st.do.reportErased(eraseTaskId)}
      >
        {l("eraseTask.eraserDone")}
      </button>
      <button
        type="button"
        disabled={waiting}
        className={jellyButtonRecipe({ variant: "ghost", size: "md" }, "w-full")}
        onClick={() => st.do.giveUpEraseTask(eraseTaskId)}
      >
        {l("eraseTask.eraserCantReach")}
      </button>
    </div>
  );
};
