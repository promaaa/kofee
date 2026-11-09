import { type cnst, usePage } from "@apps/wtbd/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  eraseTask: cnst.EraseTask;
}
export const General = ({ className, eraseTask }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn("w-full", className)}>
      <div>
        {l("eraseTask.name")}: {eraseTask.name}
      </div>
    </div>
  );
};
