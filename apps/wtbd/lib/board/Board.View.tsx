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

interface GridProps {
  className?: string;
  board: cnst.LightBoard;
  targetCell?: number | null;
  queuedCells?: number[];
}
export const Grid = ({ className, board, targetCell = null, queuedCells = [] }: GridProps) => {
  const queued = new Set(queuedCells);
  return (
    <div
      className={cn("relative w-full rounded-box border-2 border-foreground/15 bg-card p-4", className)}
      style={{ aspectRatio: `${board.widthCm} / ${board.heightCm}` }}
    >
      <span className="absolute top-1.5 left-1.5 size-4 border-foreground/60 border-t-4 border-l-4" />
      <span className="absolute top-1.5 right-1.5 size-4 border-foreground/60 border-t-4 border-r-4" />
      <span className="absolute bottom-1.5 left-1.5 size-4 border-foreground/60 border-b-4 border-l-4" />
      <span className="absolute right-1.5 bottom-1.5 size-4 border-foreground/60 border-r-4 border-b-4" />
      <div
        className="grid size-full"
        style={{
          gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${board.rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: board.cols * board.rows }, (_, cell) => (
          <div
            key={cell}
            className={cn(
              "flex items-center justify-center border border-foreground/10 font-bold text-foreground/35 text-xs",
              queued.has(cell) && "bg-warning/40 text-foreground/70",
              cell === targetCell && "animate-pulse bg-primary text-primary-foreground",
            )}
          >
            {board.cellLabel(cell)}
          </div>
        ))}
      </div>
    </div>
  );
};
