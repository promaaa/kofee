"use client";
import { Board, type cnst, EraseTask, st, usePage } from "@apps/wtbd/client";
import { jellyButtonRecipe } from "@apps/wtbd/ui";
import { useEraseVerdict, useWakeLock } from "@apps/wtbd/webkit";
import { cn } from "akanjs/client";
import type { ClientInit, ClientView, SliceMeta } from "akanjs/fetch";
import { Load, Model } from "akanjs/ui";
import { useState } from "react";

interface CardProps {
  className?: string;
  init: ClientInit<"eraseTask", cnst.LightEraseTask>;
  slice?: SliceMeta;
}
export const Card = ({ className, init, slice }: CardProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(eraseTask) => (
        <EraseTask.Unit.Card key={eraseTask.id} href={`/eraseTask/${eraseTask.id}`} eraseTask={eraseTask} />
      )}
    />
  );
};

interface ViewProps {
  className?: string;
  view: ClientView<"eraseTask", cnst.EraseTask>;
}
export const View = ({ view }: ViewProps) => {
  return <Load.View view={view} renderView={(eraseTask) => <EraseTask.View.General eraseTask={eraseTask} />} />;
};

interface EraserProps {
  className?: string;
  boardView: ClientView<"board", cnst.Board>;
  init: ClientInit<"eraseTask", cnst.LightEraseTask>;
}
export const Eraser = ({ className, boardView, init }: EraserProps) => {
  return (
    <>
      <Model.LoadInit init={init} />
      <Load.View view={boardView} renderView={(board) => <EraserScreen className={className} boardId={board.id} />} />
    </>
  );
};

interface EraserScreenProps {
  className?: string;
  boardId: string;
}
const EraserScreen = ({ className, boardId }: EraserScreenProps) => {
  const { l } = usePage();
  const board = st.use.board();
  const eraseTaskList = st.use.eraseTaskListInBoard();
  const [isStarted, setIsStarted] = useState(false);
  const { verdict, unlockVoice } = useEraseVerdict(boardId, {
    success: l("eraseFeedback.success.desc"),
    retry: l("eraseFeedback.retry.desc"),
    failed: l("eraseFeedback.failed.desc"),
  });
  useWakeLock();
  if (board?.id !== boardId) return null;
  const active = eraseTaskList.find((eraseTask) => eraseTask.isActive());
  const queuedCells = eraseTaskList
    .filter((eraseTask) => eraseTask.status === "pending")
    .map((eraseTask) => eraseTask.cell);
  return (
    <div className={cn("mx-auto flex min-h-svh w-full max-w-md flex-col gap-5 p-5", className)}>
      <header className="flex items-center justify-between">
        <span className="font-black text-xl">{board.name}</span>
        <span className="rounded-full bg-foreground/8 px-3 py-1 font-bold text-foreground/70 text-sm">
          {l("eraseTask.eraserQueued")} {queuedCells.length}
        </span>
      </header>
      <Board.View.Grid board={board} targetCell={active?.cell ?? null} queuedCells={queuedCells} />
      {!isStarted ? (
        <button
          type="button"
          className={jellyButtonRecipe({ variant: "primary", size: "xl" }, "mt-auto h-28 w-full text-3xl")}
          onClick={() => {
            unlockVoice(l("eraseTask.eraserReady"));
            setIsStarted(true);
          }}
        >
          {l("eraseTask.eraserStartShift")}
        </button>
      ) : active ? (
        <>
          <EraseTask.View.Instruction board={board} eraseTask={active} />
          <EraseTask.Util.EraserControls className="mt-auto" eraseTaskId={active.id} status={active.status} />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <div className="font-black text-3xl">{l("eraseTask.eraserWaiting")}</div>
          <div className="text-foreground/60">{l("eraseTask.eraserWaitingHint")}</div>
        </div>
      )}
      {verdict?.feedback ? (
        <EraseTask.View.Verdict
          feedback={verdict.feedback}
          cellLabel={board.cellLabel(verdict.cell)}
          attempt={verdict.attempt}
          maxAttempts={verdict.maxAttempts}
        />
      ) : null}
    </div>
  );
};
