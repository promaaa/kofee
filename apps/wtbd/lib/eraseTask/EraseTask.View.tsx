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
  board: cnst.LightBoard;
  eraseTask: cnst.LightEraseTask;
}
export const Instruction = ({ className, board, eraseTask }: InstructionProps) => {
  const { l } = usePage();
  const center = board.cellCenterCm(eraseTask.cell);
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      {eraseTask.feedback === "retry" ? (
        <span className="rounded-full bg-warning px-4 py-1 font-black text-warning-foreground uppercase">
          {l("eraseFeedback.retry")}
        </span>
      ) : null}
      <div className="font-black text-8xl tracking-tight">{board.cellLabel(eraseTask.cell)}</div>
      <div className="font-bold text-foreground/80 text-xl">
        {center.x} cm {l("eraseTask.eraserFromLeft")} · {center.y} cm {l("eraseTask.eraserFromTop")}
      </div>
      <div className="text-foreground/60">
        {l("eraseTask.attempt")} {eraseTask.attempt} / {eraseTask.maxAttempts}
      </div>
      <div className="mt-2 font-bold text-lg">
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
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-8 text-center",
        verdictClassName[feedback],
        className,
      )}
    >
      <div className="font-black text-7xl uppercase">{l(`eraseFeedback.${feedback}`)}</div>
      <div className="font-black text-5xl">{cellLabel}</div>
      <div className="font-bold text-xl">{l(`eraseFeedback.${feedback}.desc`)}</div>
      {feedback === "retry" ? (
        <div className="font-bold text-lg opacity-80">
          {l("eraseTask.attempt")} {attempt} / {maxAttempts}
        </div>
      ) : null}
    </div>
  );
};
