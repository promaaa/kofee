"use client";
import { type cnst, EraseTask, st, usePage } from "@apps/wtbd/client";
import { BoardMap } from "@apps/wtbd/ui";
import { useEraseVerdict, useWakeLock } from "@apps/wtbd/webkit";
import { cn } from "akanjs/client";
import type { ClientInit, ClientView, SliceMeta } from "akanjs/fetch";
import { badgeRecipe, buttonRecipe, Load, Model } from "akanjs/ui";
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
  init: ClientInit<"eraseTask", cnst.LightEraseTask>;
  maintenanceInit: ClientInit<"maintenance", cnst.LightMaintenance>;
}
export const Eraser = ({ className, init, maintenanceInit }: EraserProps) => {
  const { l, lang } = usePage();
  const eraseTaskList = st.use.eraseTaskListInPublic();
  const maintenanceList = st.use.maintenanceListInPublic();
  const [isStarted, setIsStarted] = useState(false);
  const { verdict, unlockVoice } = useEraseVerdict(lang, {
    success: l("eraseFeedback.success.desc"),
    retry: l("eraseFeedback.retry.desc"),
    failed: l("eraseFeedback.failed.desc"),
  });
  useWakeLock();
  const active = eraseTaskList.find((eraseTask) => eraseTask.isActive());
  const isPadWorn = maintenanceList.some((maintenance) => maintenance.consumable === "eraser" && maintenance.isOpen());
  const queuedCells = eraseTaskList
    .filter((eraseTask) => eraseTask.status === "pending")
    .map((eraseTask) => eraseTask.cell);
  return (
    <div className={cn("mx-auto flex min-h-svh w-full max-w-md select-none flex-col gap-5 p-5", className)}>
      <Model.LoadInit init={init} />
      <Model.LoadInit init={maintenanceInit} />
      <header className="flex items-center justify-between">
        <span className="font-black text-xl tracking-tight">{l("eraseTask.eraserTitle")}</span>
        <span className={badgeRecipe({ variant: queuedCells.length ? "warning" : "default" })}>
          {l("eraseTask.eraserQueued")} {queuedCells.length}
        </span>
      </header>
      <BoardMap targetCell={active?.cell ?? null} queuedCells={queuedCells} />
      {isPadWorn ? (
        <div className="rounded-box bg-warning p-4 text-warning-foreground">
          <div className="font-bold">{l("maintenance.eraserBlocked")}</div>
          <div className="text-sm opacity-80">{l("maintenance.eraserBlockedHint")}</div>
        </div>
      ) : null}
      {!isStarted ? (
        <button
          type="button"
          className={buttonRecipe(
            { variant: "primary", size: "xl" },
            "mt-auto h-28 w-full touch-manipulation rounded-box font-black text-3xl",
          )}
          onClick={() => {
            unlockVoice(l("eraseTask.eraserReady"));
            setIsStarted(true);
          }}
        >
          {l("eraseTask.eraserStartShift")}
        </button>
      ) : active ? (
        <>
          <EraseTask.View.Instruction eraseTask={active} />
          <EraseTask.Util.EraserControls className="mt-auto" eraseTaskId={active.id} status={active.status} />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <div className="font-black text-3xl">{l("eraseTask.eraserWaiting")}</div>
          <div className="text-muted-foreground">{l("eraseTask.eraserWaitingHint")}</div>
        </div>
      )}
      {verdict?.feedback ? (
        <EraseTask.View.Verdict
          feedback={verdict.feedback}
          cellLabel={verdict.cellLabel()}
          attempt={verdict.attempt}
          maxAttempts={verdict.maxAttempts}
        />
      ) : null}
    </div>
  );
};
