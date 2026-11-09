"use client";
import { Board, type cnst } from "@apps/wtbd/client";
import type { ClientInit, ClientView, SliceMeta } from "akanjs/fetch";
import { Load } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"board", cnst.LightBoard>;
  slice?: SliceMeta;
}
export const Card = ({ className, init, slice }: CardProps) => {
  return (
    <Load.Units
      className={className}
      init={init}
      renderItem={(board) => <Board.Unit.Card key={board.id} href={`/board/${board.id}`} board={board} />}
    />
  );
};

interface ViewProps {
  className?: string;
  view: ClientView<"board", cnst.Board>;
}
export const View = ({ view }: ViewProps) => {
  return <Load.View view={view} renderView={(board) => <Board.View.General board={board} />} />;
};
