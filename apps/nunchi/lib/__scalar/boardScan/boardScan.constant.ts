import { BoardGrid } from "@apps/nunchi/common";
import { dayjs, enumOf, Int } from "akanjs/base";
import { via } from "akanjs/constant";

import { BoardPoint } from "../boardPoint/boardPoint.constant";
import { BoardRect } from "../boardRect/boardRect.constant";

export class VisionSource extends enumOf("visionSource", ["mock", "remote"] as const) {}

export class BoardScan extends via((field) => ({
  source: field(VisionSource, { default: "mock" }),
  corners: field([BoardPoint]),
  regions: field([BoardRect]),
  dirtyCells: field([Int]),
  unknownCells: field([Int]),
  cellStreaks: field([Int]), // +ms: how long the cell has read dirty with no clean scan between (a run starts at 1), -ms: clean; unknown holds it
  latencyMs: field(Int, { default: 0 }),
  capturedAt: field(Date, { default: () => dayjs() }),
})) {
  isUsable() {
    return this.corners.length === 4;
  }

  foldStreaks(previous: number[], elapsedMs: number) {
    const dirty = new Set(this.dirtyCells);
    const unknown = new Set(this.unknownCells);
    this.cellStreaks = Array.from({ length: BoardGrid.cellCount() }, (_, cell) => {
      const streak = previous[cell] ?? 0;
      if (unknown.has(cell)) return streak;
      if (dirty.has(cell)) return streak > 0 ? streak + elapsedMs : 1;
      return streak < 0 ? streak - elapsedMs : -1;
    });
    return this;
  }

  isStablyClean(cell: number) {
    return (this.cellStreaks[cell] ?? 0) <= -BoardGrid.stableMs;
  }

  stablyDirtyCells() {
    return this.cellStreaks.flatMap((streak, cell) => (streak >= BoardGrid.stableMs ? [cell] : []));
  }
}
