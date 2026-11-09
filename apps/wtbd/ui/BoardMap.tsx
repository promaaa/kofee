import { BoardGrid } from "@apps/wtbd/common";
import { cn } from "akanjs/client";

import { surfaceRecipe } from "./Recipe";

interface BoardMapProps {
  className?: string;
  targetCell?: number | null;
  queuedCells?: number[];
}
export const BoardMap = ({ className, targetCell = null, queuedCells = [] }: BoardMapProps) => {
  const queued = new Set(queuedCells);
  return (
    <div
      className={surfaceRecipe({ padding: "sm" }, ["relative w-full", className])}
      style={{ aspectRatio: `${BoardGrid.widthCm} / ${BoardGrid.heightCm}` }}
    >
      <span className="absolute top-1 left-1 size-3 border-foreground/50 border-t-2 border-l-2" />
      <span className="absolute top-1 right-1 size-3 border-foreground/50 border-t-2 border-r-2" />
      <span className="absolute bottom-1 left-1 size-3 border-foreground/50 border-b-2 border-l-2" />
      <span className="absolute right-1 bottom-1 size-3 border-foreground/50 border-r-2 border-b-2" />
      <div
        className="grid size-full gap-px overflow-hidden rounded-field bg-border"
        style={{
          gridTemplateColumns: `repeat(${BoardGrid.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${BoardGrid.rows}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: BoardGrid.cellCount() }, (_, cell) => (
          <div
            key={cell}
            className={cn(
              "flex items-center justify-center bg-card font-semibold text-muted-foreground text-xs",
              queued.has(cell) && "bg-warning/25 text-foreground",
              cell === targetCell && "animate-pulse bg-primary text-primary-foreground",
            )}
          >
            {BoardGrid.cellLabel(cell)}
          </div>
        ))}
      </div>
    </div>
  );
};
