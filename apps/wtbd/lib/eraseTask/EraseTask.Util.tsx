"use client";
import { fetch, usePage } from "@apps/wtbd/client";
import { Model } from "akanjs/ui";
import { BiTrash } from "react-icons/bi";

interface RemoveProps {
  eraseTaskId: string;
}
export const Remove = ({ eraseTaskId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={eraseTaskId} slice={fetch.slice.eraseTask}>
      <BiTrash /> {l("base.remove")}
    </Model.Remove>
  );
};
