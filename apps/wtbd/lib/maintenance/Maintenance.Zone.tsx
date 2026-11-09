"use client";
import { cnst, Maintenance, st, usePage } from "@apps/wtbd/client";
import { surfaceRecipe } from "@apps/wtbd/ui";
import { useConsumableLevels } from "@apps/wtbd/webkit";
import { cn } from "akanjs/client";
import type { ClientInit, ClientView, SliceMeta } from "akanjs/fetch";
import { Load, Model } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"maintenance", cnst.LightMaintenance>;
  slice?: SliceMeta;
}
export const Card = ({ className, init, slice }: CardProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(maintenance) => <Maintenance.Unit.Card key={maintenance.id} maintenance={maintenance} />}
    />
  );
};

interface ViewProps {
  className?: string;
  view: ClientView<"maintenance", cnst.Maintenance>;
}
export const View = ({ view }: ViewProps) => {
  return <Load.View view={view} renderView={(maintenance) => <Maintenance.View.General maintenance={maintenance} />} />;
};

interface InboxProps {
  className?: string;
  init: ClientInit<"maintenance", cnst.LightMaintenance>;
}
export const Inbox = ({ className, init }: InboxProps) => {
  const { l } = usePage();
  const maintenanceList = st.use.maintenanceListInPublic();
  const openList = maintenanceList.filter((maintenance) => maintenance.isOpen());
  const doneList = maintenanceList
    .filter((maintenance) => !maintenance.isOpen())
    .sort((a, b) => (b.doneAt?.valueOf() ?? 0) - (a.doneAt?.valueOf() ?? 0))
    .slice(0, 10);
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Model.LoadInit init={init} />
      <section className="flex flex-col gap-3">
        <h2 className="font-bold text-xl">{l("maintenance.openRequests")}</h2>
        {openList.length ? (
          openList.map((maintenance) => <Maintenance.Unit.Card key={maintenance.id} maintenance={maintenance} />)
        ) : (
          <div className="rounded-box border border-border border-dashed p-5 text-center text-muted-foreground">
            {l("maintenance.noOpenRequests")}
          </div>
        )}
      </section>
      <Maintenance.Util.Report />
      {doneList.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-muted-foreground text-sm">{l("maintenance.history")}</h2>
          {doneList.map((maintenance) => (
            <Maintenance.Unit.Card key={maintenance.id} maintenance={maintenance} />
          ))}
        </section>
      ) : null}
    </div>
  );
};

const toneOf = (percent: number) =>
  percent <= cnst.ConsumableLevels.requestAtPercent ? "bg-destructive" : percent <= 30 ? "bg-warning" : "bg-success";

interface LevelsProps {
  className?: string;
}
export const Levels = ({ className }: LevelsProps) => {
  const { l } = usePage();
  const levels = useConsumableLevels();
  const gauges = [
    {
      consumable: "marker",
      percent: levels?.markerPercent,
      used: levels?.markerUsed ?? 0,
      life: cnst.ConsumableLevels.markerLife,
      usedKey: "maintenance.usedMarker",
    },
    {
      consumable: "eraser",
      percent: levels?.eraserPercent,
      used: levels?.eraserUsed ?? 0,
      life: cnst.ConsumableLevels.eraserLife,
      usedKey: "maintenance.usedEraser",
    },
  ] as const;
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h2 className="font-bold text-xl">{l("maintenance.levels")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {gauges.map((gauge) => (
          <div key={gauge.consumable} className={surfaceRecipe({ padding: "sm" }, "flex flex-col gap-2")}>
            <div className="font-semibold text-muted-foreground text-sm">{l(`consumable.${gauge.consumable}`)}</div>
            <div className="font-black text-3xl tabular-nums">{gauge.percent ?? "–"}%</div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", toneOf(gauge.percent ?? 100))}
                style={{ width: `${gauge.percent ?? 0}%` }}
              />
            </div>
            <div className="text-muted-foreground text-xs tabular-nums">
              {gauge.used} / {gauge.life} {l(gauge.usedKey)}
            </div>
          </div>
        ))}
      </div>
      <div className="text-muted-foreground text-xs">
        {l("maintenance.requestAt")} {cnst.ConsumableLevels.requestAtPercent}%
      </div>
    </section>
  );
};
