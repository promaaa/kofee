"use client";
import { type cnst, EraseTask } from "@apps/wtbd/client";
import type { ClientInit, ClientView, SliceMeta } from "akanjs/fetch";
import { Load } from "akanjs/ui";

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
