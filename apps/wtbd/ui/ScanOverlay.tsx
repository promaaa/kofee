import { BoardGrid } from "@apps/wtbd/common";
import { cn } from "akanjs/client";

interface Point {
  x: number;
  y: number;
}

const lerp = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

interface ScanOverlayProps {
  className?: string;
  corners: Point[];
  dirtyCells: number[];
  unknownCells: number[];
  cellStreaks: number[];
  targetCell: number | null;
  queuedCells: number[];
  isMock: boolean;
}
export const ScanOverlay = ({
  className,
  corners,
  dirtyCells,
  unknownCells,
  cellStreaks,
  targetCell,
  queuedCells,
  isMock,
}: ScanOverlayProps) => {
  const [tl, tr, br, bl] = corners;
  if (!tl || !tr || !br || !bl) return null;
  const at = (u: number, v: number) => lerp(lerp(tl, tr, u), lerp(bl, br, u), v);
  const dirty = new Set(dirtyCells);
  const unknown = new Set(unknownCells);
  const queued = new Set(queuedCells);
  const cells = Array.from({ length: BoardGrid.cellCount() }, (_, cell) => {
    const col = cell % BoardGrid.cols;
    const row = Math.floor(cell / BoardGrid.cols);
    const [u0, u1, v0, v1] = [
      col / BoardGrid.cols,
      (col + 1) / BoardGrid.cols,
      row / BoardGrid.rows,
      (row + 1) / BoardGrid.rows,
    ];
    const points = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)].map((p) => `${p.x},${p.y}`).join(" ");
    const streak = cellStreaks[cell] ?? 0;
    return { cell, points, center: at((u0 + u1) / 2, (v0 + v1) / 2), streak };
  });
  const cellClassName = (cell: number, streak: number) => {
    if (cell === targetCell) return "animate-pulse fill-primary/45 stroke-primary";
    if (queued.has(cell)) return "fill-warning/30 stroke-warning";
    if (dirty.has(cell)) return "fill-destructive/35 stroke-destructive";
    if (unknown.has(cell)) return "fill-muted/50 stroke-muted-foreground";
    if (streak > 0 && streak < BoardGrid.stableMs) return "fill-transparent stroke-warning";
    return "fill-transparent stroke-primary/50";
  };
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <svg className="size-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        {cells.map(({ cell, points, streak }) => (
          <polygon
            key={cell}
            points={points}
            className={cellClassName(cell, streak)}
            strokeWidth={cell === targetCell ? 3 : 1}
            strokeDasharray={unknown.has(cell) ? "4 3" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polygon
          points={[tl, tr, br, bl].map((p) => `${p.x},${p.y}`).join(" ")}
          className="fill-transparent stroke-primary"
          strokeWidth={3}
          strokeDasharray={isMock ? "8 6" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {cells
        .filter(({ cell }) => cell === targetCell || dirty.has(cell))
        .map(({ cell, center }) => (
          <span
            key={cell}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-field px-1.5 font-black",
              cell === targetCell
                ? "bg-primary text-lg text-primary-foreground"
                : "bg-destructive text-destructive-foreground text-xs",
            )}
            style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
          >
            {BoardGrid.cellLabel(cell)}
          </span>
        ))}
    </div>
  );
};
