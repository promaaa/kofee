"use client";
import { st, usePage } from "@apps/nunchi/client";
import { BoardGrid } from "@apps/nunchi/common";
import { surfaceRecipe } from "@apps/nunchi/ui";
import { cn } from "akanjs/client";
import { buttonRecipe } from "akanjs/ui";
import { useState } from "react";

interface MockPanelProps {
  className?: string;
}
export const MockPanel = ({ className }: MockPanelProps) => {
  const { l } = usePage();
  const mockDirtyCells = st.use.mockDirtyCells();
  const mockGlareCells = st.use.mockGlareCells();
  const [isGlareMode, setIsGlareMode] = useState(false);
  const dirty = new Set(mockDirtyCells);
  const glare = new Set(mockGlareCells);
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={buttonRecipe({ variant: isGlareMode ? "outline" : "destructive" }, "touch-manipulation")}
          onClick={() => setIsGlareMode(false)}
        >
          {l("vision.mockInk")}
        </button>
        <button
          type="button"
          className={buttonRecipe({ variant: isGlareMode ? "neutral" : "outline" }, "touch-manipulation")}
          onClick={() => setIsGlareMode(true)}
        >
          {l("vision.mockGlare")}
        </button>
      </div>
      <div
        className={surfaceRecipe({ padding: "sm" }, "grid gap-1")}
        style={{ gridTemplateColumns: `repeat(${BoardGrid.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: BoardGrid.cellCount() }, (_, cell) => (
          <button
            key={cell}
            type="button"
            className={cn(
              "aspect-square touch-manipulation rounded-field border border-border bg-card font-semibold text-muted-foreground text-xs",
              dirty.has(cell) && "border-destructive bg-destructive text-destructive-foreground",
              glare.has(cell) && "border-foreground/40 border-dashed bg-muted text-foreground",
            )}
            onClick={() =>
              isGlareMode ? st.do.setMockGlare(cell, !glare.has(cell)) : st.do.setMockDirt(cell, !dirty.has(cell))
            }
          >
            {BoardGrid.cellLabel(cell)}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">{l("vision.mockHint")}</p>
      <button
        type="button"
        className={buttonRecipe({ variant: "outline" }, "touch-manipulation")}
        onClick={() => st.do.resetBoard()}
      >
        {l("vision.mockReset")}
      </button>
    </div>
  );
};
