"use client";
import { type cnst, st, usePage } from "@apps/wtbd/client";
import { ScanOverlay, surfaceRecipe } from "@apps/wtbd/ui";
import { useAlgorithmView, useCamera } from "@apps/wtbd/webkit";
import { cn } from "akanjs/client";
import type { ClientInit } from "akanjs/fetch";
import { badgeRecipe, buttonRecipe, Model } from "akanjs/ui";
import type { ReactNode } from "react";

const cameraErrorKeyOf = {
  insecure: "board.cameraInsecure",
  denied: "board.cameraDenied",
  unavailable: "board.cameraUnavailable",
} as const;

interface MonitorProps {
  className?: string;
  init: ClientInit<"eraseTask", cnst.LightEraseTask>;
  children?: ReactNode;
}
export const Monitor = ({ className, init, children }: MonitorProps) => {
  const { l } = usePage();
  const boardScan = st.use.boardScan();
  const eraseTaskList = st.use.eraseTaskListInPublic();
  const camera = useCamera((frame) => st.do.submitFrame(frame));
  const active = eraseTaskList.find((eraseTask) => eraseTask.isActive());
  const queuedCells = eraseTaskList
    .filter((eraseTask) => eraseTask.status === "pending")
    .map((eraseTask) => eraseTask.cell);
  const isMock = boardScan?.source === "mock";
  const isRemote = boardScan?.source === "remote";
  return (
    <div className={cn("mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-4 p-4", className)}>
      <Model.LoadInit init={init} />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-black text-2xl tracking-tight">{l("board.monitorTitle")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {boardScan ? (
            <>
              <span className={badgeRecipe({ variant: isMock ? "warning" : "info" }, "font-bold")}>
                {isMock ? l("board.visionMock") : l("board.visionRemote")}
              </span>
              <span className={badgeRecipe({ variant: boardScan.isUsable() ? "success" : "error" })}>
                {boardScan.isUsable() ? l("board.boardFound") : l("board.boardNotFound")}
              </span>
              <span className={badgeRecipe({ variant: boardScan.dirtyCells.length ? "error" : "default" })}>
                {boardScan.dirtyCells.length} {l("board.dirtyCount")}
              </span>
              <span className={badgeRecipe({ variant: "outline" })}>{boardScan.latencyMs} ms</span>
            </>
          ) : null}
          {camera.isRunning ? (
            <span className={badgeRecipe({ variant: "outline" }, "tabular-nums")}>{camera.fps.toFixed(1)} fps</span>
          ) : null}
          {camera.isRunning ? (
            <button type="button" className={buttonRecipe({ variant: "outline", size: "sm" })} onClick={camera.stop}>
              {l("board.cameraStop")}
            </button>
          ) : null}
        </div>
      </header>
      <div className={cn("grid items-start gap-4", isRemote && "lg:grid-cols-2")}>
        <div
          className="relative w-full overflow-hidden rounded-box bg-neutral"
          style={{ aspectRatio: String(camera.aspect) }}
        >
          <video
            ref={camera.videoRef}
            autoPlay
            playsInline
            muted
            className={cn("size-full object-fill", !camera.isRunning && "invisible")}
          />
          {camera.isRunning && boardScan ? (
            <ScanOverlay
              corners={boardScan.corners}
              dirtyCells={boardScan.dirtyCells}
              unknownCells={boardScan.unknownCells}
              cellStreaks={boardScan.cellStreaks}
              targetCell={active?.cell ?? null}
              queuedCells={queuedCells}
              isMock={isMock}
            />
          ) : null}
          {camera.isRunning ? null : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-neutral-foreground">
              <div className="font-bold text-lg">
                {camera.error ? l(cameraErrorKeyOf[camera.error]) : l("board.cameraIdle")}
              </div>
              <button
                type="button"
                className={buttonRecipe({ variant: "primary", size: "lg" })}
                onClick={() => void camera.start()}
              >
                {l("board.cameraStart")}
              </button>
            </div>
          )}
          {camera.isRunning && !boardScan ? (
            <div className="absolute inset-x-0 bottom-0 bg-neutral/70 p-2 text-center text-neutral-foreground text-sm">
              {l("board.waitingFrame")}
            </div>
          ) : null}
        </div>
        {isRemote ? (
          <AlgorithmView
            scanKey={boardScan.isUsable() ? boardScan.capturedAt.valueOf() : null}
            isStale={!boardScan.isUsable()}
          />
        ) : null}
      </div>
      {isMock ? <p className="text-muted-foreground text-sm">{l("board.mockCornersHint")}</p> : null}
      {active ? (
        <div className={surfaceRecipe({}, "flex items-center justify-between gap-4")}>
          <span className="font-semibold text-muted-foreground">{l("board.eraseNow")}</span>
          <span className="font-black text-4xl text-primary">{active.cellLabel()}</span>
        </div>
      ) : null}
      {children}
    </div>
  );
};

interface AlgorithmViewProps {
  className?: string;
  scanKey: number | null;
  isStale: boolean;
}
const AlgorithmView = ({ className, scanKey, isStale }: AlgorithmViewProps) => {
  const { l } = usePage();
  const { url } = useAlgorithmView(scanKey);
  return (
    <section className={surfaceRecipe({ padding: "sm" }, ["flex flex-col gap-2", className])}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{l("board.algorithmViewTitle")}</h2>
        {isStale ? <span className={badgeRecipe({ variant: "warning" })}>{l("board.algorithmViewStale")}</span> : null}
      </div>
      {url ? (
        <img
          src={url}
          alt={l("board.algorithmViewTitle")}
          className={cn("w-full rounded-field", isStale && "opacity-50")}
        />
      ) : (
        <div className="flex aspect-[2/1] items-center justify-center rounded-field bg-muted text-muted-foreground text-sm">
          {l("board.waitingFrame")}
        </div>
      )}
      <p className="text-muted-foreground text-sm">{l("board.algorithmViewHint")}</p>
    </section>
  );
};
