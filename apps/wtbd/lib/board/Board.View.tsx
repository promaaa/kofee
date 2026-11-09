import { type cnst, usePage } from "@apps/wtbd/client";
import { cn } from "akanjs/client";

interface GeneralProps {
  className?: string;
  board: cnst.Board;
}
export const General = ({ className, board }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn("w-full", className)}>
      <div>
        {l("board.name")}: {board.name}
      </div>
    </div>
  );
};
