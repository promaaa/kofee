"use client";
import { fetch, usePage } from "@apps/wtbd/client";
import { Model } from "akanjs/ui";
import { BiTrash } from "react-icons/bi";

interface RemoveProps {
  boardId: string;
}
export const Remove = ({ boardId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={boardId} slice={fetch.slice.board}>
      <BiTrash /> {l("base.remove")}
    </Model.Remove>
  );
};
