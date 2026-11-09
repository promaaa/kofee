import { type cnst, usePage } from "@apps/wtbd/client";
import { BoardGrid } from "@apps/wtbd/common";
import { cn } from "akanjs/client";
import { badgeRecipe } from "akanjs/ui";

interface GeneralProps {
  className?: string;
  eraseTask: cnst.EraseTask;
}
export const General = ({ className, eraseTask }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn("w-full", className)}>
      <div>
        {l("eraseTask.cell")}: {eraseTask.cell}
      </div>
      <div>
        {l("eraseTask.status")}: {l(`eraseTaskStatus.${eraseTask.status}`)}
      </div>
      <div>
        {l("eraseTask.attempt")}: {eraseTask.attempt} / {eraseTask.maxAttempts}
      </div>
    </div>
  );
};

interface InstructionProps {
  className?: string;
  eraseTask: cnst.LightEraseTask;
}
export const Instruction = ({ className, eraseTask }: InstructionProps) => {
  const { l } = usePage();
  const center = BoardGrid.cellCenterCm(eraseTask.cell);
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      {eraseTask.feedback === "retry" ? (
        <span className={badgeRecipe({ variant: "warning", size: "lg" }, "font-bold uppercase")}>
          {l("eraseFeedback.retry")}
        </span>
      ) : null}
      <div className="font-black text-8xl tracking-tight">{eraseTask.cellLabel()}</div>
      <div className="font-semibold text-lg">
        {center.x} cm {l("eraseTask.eraserFromLeft")} · {center.y} cm {l("eraseTask.eraserFromTop")}
      </div>
      <div className="text-muted-foreground text-sm">
        {l("eraseTask.attempt")} {eraseTask.attempt} / {eraseTask.maxAttempts}
      </div>
      <div className="mt-2 font-semibold text-muted-foreground">
        {eraseTask.status === "verifying" ? l("eraseTask.eraserChecking") : l("eraseTask.eraserEraseThenDone")}
      </div>
    </div>
  );
};

const verdictClassName: { [key in cnst.EraseFeedback["value"]]: string } = {
  success: "bg-success text-success-foreground",
  retry: "bg-warning text-warning-foreground",
  failed: "bg-destructive text-destructive-foreground",
};

interface VerdictProps {
  className?: string;
  feedback: cnst.EraseFeedback["value"];
  cellLabel: string;
  attempt: number;
  maxAttempts: number;
}
export const Verdict = ({ className, feedback, cellLabel, attempt, maxAttempts }: VerdictProps) => {
  const { l } = usePage();
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 px-8 text-center",
        verdictClassName[feedback],
        className,
      )}
    >
      <div className="font-black text-7xl uppercase tracking-tight">{l(`eraseFeedback.${feedback}`)}</div>
      <div className="font-black text-5xl">{cellLabel}</div>
      <div className="font-semibold text-xl">{l(`eraseFeedback.${feedback}.desc`)}</div>
      {feedback === "retry" ? (
        <div className="font-semibold text-lg opacity-80">
          {l("eraseTask.attempt")} {attempt} / {maxAttempts}
        </div>
      ) : null}
    </div>
  );
};
